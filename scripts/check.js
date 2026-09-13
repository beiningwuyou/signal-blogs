import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { projectRoot } from '../src/server/config.js';

async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await checkDirectory(file);
    else if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  }
}
for (const directory of ['src', 'electron', 'scripts']) {
  await checkDirectory(path.join(projectRoot, directory));
}
execFileSync(process.execPath, ['--check', path.join(projectRoot, 'vite.config.js')], { stdio: 'inherit' });
console.log('JavaScript 语法检查通过');
