import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const major = Number(process.versions.node.split('.')[0]);

function portableNode() {
  const tools = join(root, '.tools');
  if (!existsSync(tools)) return '';
  for (const entry of readdirSync(tools)) {
    const executable = join(tools, entry, process.platform === 'win32' ? 'node.exe' : 'bin/node');
    if (existsSync(executable)) return executable;
  }
  return '';
}

const node = major >= 22 ? process.execPath : portableNode();
if (!node) {
  console.error(`El asistente necesita Node.js 22 o posterior. Esta máquina usa Node ${process.versions.node}.`);
  process.exit(1);
}

const child = spawn(node, [join(root, 'server.mjs')], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 0));
