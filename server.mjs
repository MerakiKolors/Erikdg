import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { loadLocalEnv } from './lib/env.js';
import { handleChatRequest } from './lib/assistant.js';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 4173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
};

const major = Number(process.versions.node.split('.')[0]);
if (major < 22) {
  console.error(`El asistente necesita Node.js 22 o posterior. Esta máquina usa Node ${process.versions.node}.`);
  process.exit(1);
}

loadLocalEnv();

function safeFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = decoded === '/' ? 'index.html' : normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const file = resolve(root, `.${relative.startsWith('/') || relative.startsWith('\\') ? '' : '/'}${relative}`);
  if (!file.startsWith(root)) return null;
  const skipped = ['node_modules', '.git', 'lib', 'api', 'backups', '.tools'];
  const fromRoot = file.slice(root.length).replaceAll('\\', '/');
  if (skipped.some(folder => fromRoot === `/${folder}` || fromRoot.startsWith(`/${folder}/`))) return null;
  if (fromRoot.split('/').some(part => part.startsWith('.') && part !== '.')) return null;
  return file;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname === '/api/chat') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const request = new Request('http://localhost/api/chat', {
        method: req.method,
        headers: { 'content-type': req.headers['content-type'] || 'application/json' },
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
      });
      const response = await handleChatRequest(request);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (response.body) Readable.fromWeb(response.body).pipe(res);
      else res.end();
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.end('Method not allowed.');
      return;
    }
    const file = safeFile(url.pathname);
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404;
      res.end('Not found.');
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', types[extname(file).toLowerCase()] || 'application/octet-stream');
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(file).pipe(res);
  } catch (error) {
    console.error('local server error:', error instanceof Error ? error.message : 'request failed');
    if (!res.headersSent) res.statusCode = 500;
    res.end('The page could not be served.');
  }
});

server.listen(port, () => {
  console.log(`Sitio local: http://localhost:${port}`);
});
