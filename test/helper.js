import URL from 'node:url';
import fs from 'node:fs';
import path from 'node:path';


export function readFile(file) {
  const dirname = path.dirname(URL.fileURLToPath(import.meta.url));

  return fs.readFileSync(path.join(dirname, file), 'utf8');
}