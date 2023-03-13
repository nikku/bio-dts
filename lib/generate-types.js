import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

import preTransform from './pre-transform.js';

import postTransform from './post-transform.js';


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

    const src = fs.readFileSync(fileName, 'utf8');

    if (names.has(path.resolve(fileName))) {
      console.log('PRE :: ', fileName);
      return preTransform(src);
    }

    return src;
  };

  host._writeFile = host.writeFile;

  host.writeFile = (fileName, text, ...args) => {
    console.log('POST :: ', fileName);
    text = postTransform(text);

    host._writeFile(fileName, text, ...args);
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