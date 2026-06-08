import path from 'node:path';

import preTransform from './pre-transform.js';

import postTransform from './post-transform.js';

import remapping from '@jridgewell/remapping';


/**
 * @typedef { import('typescript').CompilerHost } CompilerHost
 * @typedef { import('typescript').WriteFileCallback } WriteFileCallback
 *
 * @typedef { {
 *   _readFile: (fileName: string) => string,
 *   _writeFile: WriteFileCallback,
 *   ___cache: Record<string, string>
 * } } CompilerHostExtension
 *
 * @typedef { import('typescript').CompilerOptions } CompilerOptions
 * @typedef { import('typescript').createCompilerHost } createCompilerHost
 * @typedef { import('typescript').createProgram } createProgram
 *
 * @typedef { {
 *   createCompilerHost: createCompilerHost,
 *   createProgram: createProgram
 * } } TypeScript
 */

/**
 * @param { string[] } fileNames
 * @param { CompilerOptions } compilerOptions
 * @param { TypeScript } ts
 * @param { { lax?: boolean } } [generateOptions]
 */
export default function generateTypes(fileNames, compilerOptions, ts, generateOptions) {

  if (!ts) {
    throw new Error('must provide <ts=TypeScript>');
  }

  // CompilerOptions.JsxEmit.None = 0
  const jsx = compilerOptions.jsx !== 0;

  const declarationMap = compilerOptions.declarationMap;
  const sourceRoot = compilerOptions.sourceRoot;

  const names = new Set(fileNames.map((p) => path.resolve(p)));

  const host = /** @type { CompilerHost & CompilerHostExtension } */ (
    ts.createCompilerHost(compilerOptions)
  );

  host._readFile = host.readFile;

  host.___cache = {};

  /**
   * @param {string} fileName
   *
   * @return {string}
   */
  host.readFile = (fileName) => {

    let src = host._readFile(fileName);

    if (names.has(path.resolve(fileName))) {
      isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [pre]', fileName, src);

      try {

        const sourceMapOptions = declarationMap ? {
          sourceFileName: fileName,
          sourceMapName: fileName + '___pre',
          sourceRoot
        } : {};

        const transformed = preTransform(src, {
          ...sourceMapOptions,
          jsx
        });

        if (transformed.map) {
          host.___cache[fileName + '___pre'] = JSON.stringify(transformed.map);
        }

        src = transformed.code;

        isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [pre] [generated]', fileName, src);
      } catch (err) {
        console.error(`[generate-types] [pre] failed to parse ${fileName} with contents ${src}`, err);
        throw err;
      }

    }

    return src;
  };

  host._writeFile = host.writeFile;

  host.writeFile = (fileName, text, writeByteOrderMark, onError, sourceFiles, ...args) => {

    const [ sourceFile ] = sourceFiles;

    const originalFileName = /** @type {string|null} */ (
      'originalFileName' in sourceFile && sourceFile.originalFileName || null
    );

    if (fileName.toLowerCase().endsWith('.d.ts.map')) {

      if (originalFileName) {
        host.___cache[originalFileName + '___ts'] = text;
      }

      return;
    }

    if (fileName.toLowerCase().endsWith('.d.ts')) {

      isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [post]', fileName, text);

      try {
        const sourceMap_pre_json = host.___cache[originalFileName + '___pre'];
        const sourceMap_ts_json = host.___cache[originalFileName + '___ts'];

        const sourceMapOptions = sourceMap_pre_json && sourceMap_ts_json && {
          sourceFileName: fileName + '___ts',
          sourceMapName: fileName,
          sourceRoot
        } || {};

        const transformed = postTransform(text, {
          ...sourceMapOptions,
          ...generateOptions
        });

        if (transformed.map) {
          const sourceMap_pre = JSON.parse(sourceMap_pre_json);
          const sourceMap_ts = JSON.parse(sourceMap_ts_json);
          const sourceMap_post = transformed.map;

          const combined = remapping(
            [
              sourceMap_post,
              sourceMap_ts,
              sourceMap_pre
            ],
            () => null
          );

          const combinedJSON = JSON.parse(JSON.stringify(combined));

          // produce source maps with relative paths, following typescript conventions
          const mapDir = path.dirname(path.resolve(fileName));

          if (combinedJSON.sources) {
            combinedJSON.sources = combinedJSON.sources.map(src =>
              path.relative(mapDir, path.resolve(src))
            );
          }

          if (combinedJSON.file) {
            combinedJSON.file = path.relative(mapDir, path.resolve(fileName));
          }

          // keep maps small, do not inline source text in declaration maps
          delete combinedJSON.sourcesContent;

          host._writeFile(fileName + '.map', JSON.stringify(combinedJSON), writeByteOrderMark, onError, sourceFiles, ...args);
        }

        text = transformed.code;

        isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [post] [generated]', fileName, text);
      } catch (err) {
        console.error(`[generate-types] [post] failed to parse ${fileName} with contents ${text}`, err);
        throw err;
      }

    }

    host._writeFile(fileName, text, writeByteOrderMark, onError, sourceFiles, ...args);
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