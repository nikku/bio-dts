import path from 'node:path';

import ts from 'typescript';

import remapping from '@ampproject/remapping';

/**
 * @typedef { ts.CompilerHost } CompilerHost
 * @typedef { ts.WriteFileCallback } WriteFileCallback
 *
 * @typedef { {
 *   _readFile: (fileName: string) => string,
 *   _writeFile: WriteFileCallback,
 *   ___cache: Record<string, string>
 * } } CompilerHostExtension
 */

import preTransform from './pre-transform.js';

import postTransform from './post-transform.js';


/**
 * @param {string[]} fileNames
 * @param {ts.CompilerOptions} options
 */
export default function generateTypes(fileNames, options) {

  const {
    declarationMap,
    sourceRoot
  } = options;

  const names = new Set(fileNames.map((p) => path.resolve(p)));

  const host = /** @type { CompilerHost & CompilerHostExtension } */ (
    ts.createCompilerHost(options)
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
      return host.___cache[fileName];
    }

    const code = host._readFile(fileName);

    let transformed;

    if (names.has(path.resolve(fileName))) {
      isVerbose(options, fileName) && console.debug('[generate-types] [pre]', fileName, code);

      const map = declarationMap && host._readFile(fileName + '.map');

      host._writeFile('dist/dbg/' + path.basename(fileName), code, true);

      try {
        transformed = preTransform(code, declarationMap && {
          inputSourceMap: map,
          sourceFileName: fileName,
          sourceMapName: fileName + '___pre',
          sourceRoot
        });

        host._writeFile('dist/dbg/' + path.basename(fileName, '.js') + '__pre.js', transformed.code, true);

        if (transformed.map) {
          host.___cache[fileName + '___pre'] = JSON.stringify(transformed.map);

          host._writeFile('dist/dbg/' + path.basename(fileName, '.js') + '__pre.js.map', JSON.stringify(transformed.map), true);
        }

        host.___cache[fileName] = transformed.code;
      } catch (err) {
        console.error(`failed to parse ${fileName} [pre] with contents ${code}`, err);
        throw err;
      }

      isVerbose(options, fileName) && console.debug('[generate-types] [pre] [generated]', fileName, transformed.code);
    }

    return transformed?.code || code;
  };

  host._writeFile = host.writeFile;

  host.writeFile = (fileName, text, writeByteOrderMark, onError, sourceFiles, ...args) => {

    const [ sourceFile ] = sourceFiles;

    const originalFileName = /** @type {string|null} */ (
      'originalFileName' in sourceFile && sourceFile.originalFileName || null
    );

    let transformed;

    if (fileName.endsWith('.d.ts.map')) {

      if ('originalFileName' in sourceFile) {
        const originalFileName = sourceFile.originalFileName;

        const map = JSON.parse(text);
        map.sourcesContent = sourceFile.text.replace(/\\n/, '\n🅭').split(/🅭/);

        host._writeFile('dist/dbg/' + path.basename(fileName, '.d.ts.map') + '__ts.d.ts.map', JSON.stringify(map), true);

        host.___cache[originalFileName + '___ts'] = text;
      }

      return;
    }

    if (fileName.endsWith('.d.ts')) {

      host._writeFile('dist/dbg/' + path.basename(fileName, '.d.ts') + '__ts.d.ts', text, true);

      isVerbose(options, fileName) && console.debug('[generate-types] [post]', fileName, text);

      try {
        const sourceMap_pre_json = host.___cache[originalFileName + '___pre'];
        const sourceMap_ts_json = host.___cache[originalFileName + '___ts'];

        transformed = postTransform(text, sourceMap_pre_json && sourceMap_ts_json && {
          sourceFileName: fileName + '___ts',
          sourceMapName: fileName,
          sourceRoot
        });

        host._writeFile('dist/dbg/' + path.basename(fileName, '.d.ts') + '__post.d.ts', transformed.code, true);

        if (transformed.map) {
          host._writeFile('dist/dbg/' + path.basename(fileName, '.d.ts') + '__post.d.ts.map', JSON.stringify(transformed.map), true);

          const sourceMap_pre = JSON.parse(sourceMap_pre_json);
          const sourceMap_ts = JSON.parse(sourceMap_ts_json);
          const sourceMap_post = transformed.map;

          const { sources, file } = sourceMap_ts;

          // fix file references
          sourceMap_ts.file = sourceMap_post.sources[0];

          sourceMap_ts.sources = [ path.resolve(sourceMap_pre.file) ];
          sourceMap_post.sources = [ path.resolve(sourceMap_ts.file) ];
          sourceMap_pre.sources = [ path.resolve(sourceMap_pre.sources[0]) ];

          sourceMap_ts.file = path.resolve(sourceMap_ts.file);
          sourceMap_post.file = path.resolve(sourceMap_post.file);
          sourceMap_pre.file = path.resolve(sourceMap_pre.file);

          // @ts-expect-error
          const mappedSourceMap = remapping([
            sourceMap_post,
            sourceMap_ts,
            sourceMap_pre
          ], () => null);

          // back to relative sources
          mappedSourceMap.file = file;
          mappedSourceMap.sources = sources;

          false && console.log('CONCAT', originalFileName + '.pre + ts', {
            sourceMap_pre,
            sourceMap_ts,

            // sourceMap_post,
            sourceMap_combined: mappedSourceMap
          });

          host._writeFile('dist/dbg/' + path.basename(fileName) + '.map', JSON.stringify(mappedSourceMap), writeByteOrderMark);

          host._writeFile(fileName + '.map', JSON.stringify(mappedSourceMap), writeByteOrderMark, onError, sourceFiles, ...args);
        }

      } catch (err) {
        console.error(`failed to parse ${fileName} [post] with contents ${text}`, err);
        throw err;
      }

      isVerbose(options, fileName) && console.debug('[generate-types] [post] [generated]', fileName, transformed.code);
    }

    host._writeFile('dist/dbg/' + path.basename(fileName), transformed?.code || text, writeByteOrderMark);

    host._writeFile(fileName, transformed?.code || text, writeByteOrderMark, onError, sourceFiles, ...args);
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