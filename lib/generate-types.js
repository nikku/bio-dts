import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

import transform from './transform.js';

/**
 * @param {string[]} fileNames
 * @param {ts.CompilerOptions} options
 */
function compile(fileNames, options) {

  const names = new Set(fileNames.map((p) => path.resolve(p)));

  const host = ts.createCompilerHost(options);

  /**
   * @param {string} fileName
   *
   * @return {string}
   */
  host.readFile = (fileName) => {
    console.log('host.readFile :: ', fileName);

    const src = fs.readFileSync(fileName, 'utf8');

    if (names.has(path.resolve(fileName))) {
      return transform(src);
    }

    return src;
  };

  const program = ts.createProgram(fileNames, options, host);

  program.emit();
}

compile(process.argv.slice(2), {
  allowJs: true,
  declaration: true,
  emitDeclarationOnly: true,
  outDir: 'dist'
});