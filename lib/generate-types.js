import path from 'node:path';

import ts from 'typescript';

import preTransform from './pre-transform.js';

import postTransform from './post-transform.js';


/**
 * @param {string[]} fileNames
 * @param {ts.CompilerOptions} options
 */
export default function generateTypes(fileNames, options) {

  const names = new Set(fileNames.map((p) => path.resolve(p)));

  const host = ts.createCompilerHost(options);

  host._readFile = host.readFile;

  /**
   * @param {string} fileName
   *
   * @return {string}
   */
  host.readFile = (fileName) => {

    let src = host._readFile(fileName);

    isVerbose(options, fileName) && console.debug('[generate-types] [pre]', fileName, src);

    if (names.has(path.resolve(fileName))) {
      try {
        src = preTransform(src);
      } catch (err) {
        console.error(`failed to parse ${fileName} [pre] with contents ${src}`, err);
        throw err;
      }
    }

    isVerbose(options, fileName) && console.debug('[generate-types] [pre] [generated]', fileName, src);

    return src;
  };

  host._writeFile = host.writeFile;

  host.writeFile = (fileName, text, ...args) => {
    isVerbose(options, fileName) && console.debug('[generate-types] [post]', fileName, text);

    try {
      text = postTransform(text);
    } catch (err) {
      console.error(`failed to parse ${fileName} [post] with contents ${text}`, err);
      throw err;
    }

    isVerbose(options, fileName) && console.debug('[generate-types] [post] [generated]', fileName, text);

    host._writeFile(fileName, text, ...args);
  };

  const program = ts.createProgram(fileNames, options, host);

  program.emit();
}

function isVerbose(options, fileName) {

  if (typeof options.verbose === 'boolean') {
    return options.verbose;
  }

  return fileName.includes(options.verbose);
}