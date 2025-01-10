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
 * @param { CompilerOptions } options
 * @param { TypeScript } ts
 */
export default function generateTypes(fileNames, options, ts) {

  if (!ts) {
    throw new Error('must provide <ts=TypeScript>');
  }

  const names = new Set(fileNames.map((p) => path.resolve(p)));

  const host = ts.createCompilerHost(options);

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
      isVerbose(options, fileName) && console.debug('[generate-types] [pre]', fileName, src);

      try {
        src = preTransform(src);
      } catch (err) {
        console.error(`[generate-types] [pre] failed to parse ${fileName} with contents ${src}`, err);
        throw err;
      }

      isVerbose(options, fileName) && console.debug('[generate-types] [pre] [generated]', fileName, src);
    }

    return src;
  };

  // @ts-expect-error
  host._writeFile = host.writeFile;

  host.writeFile = (fileName, text, ...args) => {
    isVerbose(options, fileName) && console.debug('[generate-types] [post]', fileName, text);

    try {
      text = postTransform(text);
    } catch (err) {
      console.error(`[generate-types] [post] failed to parse ${fileName} with contents ${text}`, err);
      throw err;
    }

    isVerbose(options, fileName) && console.debug('[generate-types] [post] [generated]', fileName, text);

    // @ts-expect-error
    host._writeFile(fileName, text, ...args);
  };

  const program = ts.createProgram(fileNames, options, host);

  program.emit();
}

function isVerbose(options, fileName) {

  if (typeof options.verbose === 'boolean') {
    return options.verbose;
  }

  if (typeof options.verbose === 'undefined') {
    return false;
  }

  return fileName.includes(options.verbose);
}