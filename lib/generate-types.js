import path from 'node:path';

import preTransform from './pre-transform.js';

import postTransform from './post-transform.js';

/**
 * @typedef { import('typescript').CompilerOptions } CompilerOptions
 * @typedef { import('typescript').createCompilerHost } createCompilerHost
 * @typedef { import('typescript').createProgram } createProgram
 * @typedef { {
 *   createCompilerHost: createCompilerHost,
 *   createProgram: createProgram
 * } } TypeScript
 */

/**
 * @param { string[] } fileNames
 * @param { CompilerOptions } compilerOptions
 * @param { TypeScript } ts
 * @param { { lax: boolean } } generateOptions
 */
export default function generateTypes(fileNames, compilerOptions, ts, generateOptions) {

  if (!ts) {
    throw new Error('must provide <ts=TypeScript>');
  }

  // CompilerOptions.JsxEmit.None = 0
  const jsx = compilerOptions.jsx !== 0;

  const names = new Set(fileNames.map((p) => path.resolve(p)));

  const host = ts.createCompilerHost(compilerOptions);

  // @ts-expect-error
  host._readFile = host.readFile;

  /**
   * @param {string} fileName
   *
   * @return {string}
   */
  host.readFile = (fileName) => {

    // @ts-expect-error
    let src = host._readFile(fileName);

    if (names.has(path.resolve(fileName))) {
      isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [pre]', fileName, src);

      try {
        const { code } = preTransform(src, { jsx });

        src = code;
      } catch (err) {
        console.error(`[generate-types] [pre] failed to parse ${fileName} with contents ${src}`, err);
        throw err;
      }

      isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [pre] [generated]', fileName, src);
    }

    return src;
  };

  // @ts-expect-error
  host._writeFile = host.writeFile;

  host.writeFile = (fileName, text, ...args) => {
    isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [post]', fileName, text);

    if (fileName.toLowerCase().endsWith('.d.ts')) {
      try {
        const { code } = postTransform(text, generateOptions);

        text = code;
      } catch (err) {
        console.error(`[generate-types] [post] failed to parse ${fileName} with contents ${text}`, err);
        throw err;
      }

      isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [post] [generated]', fileName, text);
    }

    // @ts-expect-error
    host._writeFile(fileName, text, ...args);
  };

  const program = ts.createProgram(fileNames, compilerOptions, host);

  return program.emit();
}

/**
 * @param { CompilerOptions } compilerOptions
 * @param { any } fileName
 */
function isVerbose(compilerOptions, fileName) {

  if (typeof compilerOptions.verbose === 'boolean') {
    return compilerOptions.verbose;
  }

  if (typeof compilerOptions.verbose === 'undefined') {
    return false;
  }

  return fileName.includes(compilerOptions.verbose);
}