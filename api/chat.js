import { Readable } from 'node:stream';
import { loadLocalEnv } from '../lib/env.js';
import { handleChatRequest } from '../lib/assistant.js';

loadLocalEnv();

async function writeNodeResponse(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = new Request('https://local/api/chat', {
    method: req.method || 'POST',
    headers: { 'content-type': req.headers['content-type'] || 'application/json' },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
  });
  const response = await handleChatRequest(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (response.body) Readable.fromWeb(response.body).pipe(res);
  else res.end();
}

export function POST(request) {
  return handleChatRequest(request);
}

export default function handler(req, res) {
  if (typeof Request !== 'undefined' && req instanceof Request) return handleChatRequest(req);
  return writeNodeResponse(req, res);
}
