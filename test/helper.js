import fs from 'node:fs';

export function readFile(file) {
  return fs.readFileSync(new URL(file, import.meta.url), 'utf8');
}