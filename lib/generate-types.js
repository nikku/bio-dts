import path from 'node:path';

import preTransform from './pre-transform.js';

import postTransform from './post-transform.js';

import remapping from '@ampproject/remapping';


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
 * @param { { lax: boolean } } generateOptions
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

    if (host.___cache[fileName]) {
      console.log('CACHE HIT');

      return host.___cache[fileName];
    }

    let src = host._readFile(fileName);

    if (names.has(path.resolve(fileName))) {
      isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [pre]', fileName, src);

      host._writeFile('dist/dbg/' + path.basename(fileName), src, true);

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

        host._writeFile('dist/dbg/' + path.basename(fileName, '.js') + '__pre.js', transformed.code, true);

        if (transformed.map) {
          host.___cache[fileName + '___pre'] = JSON.stringify(transformed.map);

          host._writeFile('dist/dbg/' + path.basename(fileName, '.js') + '__pre.js.map', JSON.stringify(transformed.map), true);
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
        host._writeFile('dist/dbg/' + path.basename(fileName, '.d.ts.map') + '__ts.d.ts.map', text, true);

        host.___cache[originalFileName + '___ts'] = text;
      }

      return;
    }

    if (fileName.toLowerCase().endsWith('.d.ts')) {

      isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [post]', fileName, text);

      host._writeFile('dist/dbg/' + path.basename(fileName, '.d.ts') + '__ts.d.ts', text, true);

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

        host._writeFile('dist/dbg/' + path.basename(fileName, '.d.ts') + '__post.d.ts', transformed.code, true);

        if (transformed.map) {
          host._writeFile('dist/dbg/' + path.basename(fileName, '.d.ts') + '__post.d.ts.map', JSON.stringify(transformed.map), true);

          const sourceMap_pre = JSON.parse(sourceMap_pre_json);
          const sourceMap_ts = JSON.parse(sourceMap_ts_json);
          const sourceMap_post = transformed.map;

          // @ts-expect-error
          const combined = remapping(
            [
              sourceMap_post,
              sourceMap_ts,
              sourceMap_pre
            ],
            () => null
          );

          host._writeFile('dist/dbg/' + path.basename(fileName) + '.map', JSON.stringify(combined), writeByteOrderMark);

          host._writeFile(fileName + '.map', JSON.stringify(combined), writeByteOrderMark, onError, sourceFiles, ...args);
        }

        text = transformed.code;

        isVerbose(compilerOptions, fileName) && console.debug('[generate-types] [post] [generated]', fileName, text);
      } catch (err) {
        console.error(`[generate-types] [post] failed to parse ${fileName} with contents ${text}`, err);
        throw err;
      }

    }

    host._writeFile('dist/dbg/' + path.basename(fileName), text, writeByteOrderMark);

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