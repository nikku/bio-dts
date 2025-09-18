#!/usr/bin/env node

import Module from 'node:module';

import glob from 'tiny-glob';

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

import generateTypes from '../lib/generate-types.js';

async function run() {

  const ts = getTypescript();

  const args = process.argv.slice(2);

  const {
    options,
    fileNames
  } = ts.parseCommandLine(args);

  const help = args.includes('--help') || args.includes('-h');
  const [ _verbose, _verboseGrep ] = args.flatMap(arg => /^--verbose(?:=(.*))?$/.exec(arg) || []);

  const verbose = _verbose ? _verboseGrep || true : false;
  const recursive = args.includes('--recursive') || args.includes('-r');
  const lax = args.includes('--lax');

  if (help) {
    console.log(`Usage: bio-dts [options] [...filesOrGlobs]

  Options:
    --recursive, -r    recurse into directories
    --lax              relax certain checks (when running on generated code)
    --verbose          enable verbose logging

    Additional options will be passed to the typescript generator.

  Examples:
    $ bio-dts --outDir dist -r lib
    $ bio-dts 'lib/**/*.js'
`);

    return;
  }

  const globPattern = recursive ? '**/*.js' : '*.js';

  const files = [];

  for (const fileName of fileNames) {

    if (isDir(fileName)) {
      const globbedFiles = await glob(globPattern, { cwd: fileName, filesOnly: true });

      files.push(...globbedFiles.map(f => path.join(fileName, f)));
    } else {
      files.push(fileName);
    }
  }

  console.log(`Generating types for ${files.length} files...`);

  const generateOptions = {
    allowJs: true,
    declaration: true,
    emitDeclarationOnly: true,
    ...options,
    verbose
  };

  verbose && console.log('Using options ', generateOptions);

  const {
    diagnostics
  } = generateTypes(files, generateOptions, ts, { lax });

  const errors = diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);

  if (errors.length) {

    const formatHost = {
      getNewLine() {
        return os.EOL;
      },

      getCurrentDirectory() {
        return process.cwd();
      },

      getCanonicalFileName(fileName) {
        return fileName;
      }
    };

    console.log('Done with errors:');
    console.log();
    console.log(
      ts.formatDiagnosticsWithColorAndContext(errors, formatHost)
    );

    return 5;
  }

  console.log('Done.');

  return 0;
}

function isDir(fileName) {

  try {
    return fs.statSync(fileName).isDirectory();
  } catch (err) {

    // ignore
    return false;
  }
}

function getTypescript() {

  const cwd = process.cwd();

  const createRequire = Module.createRequire || Module.createRequireFromPath;

  const requireLocal = createRequire(
    path.join(cwd, '__placeholder__.js')
  );

  try {
    return requireLocal('typescript');
  } catch (err) {
    throw new Error(`failed to load <typescript> from <${ cwd }>`);
  }
}

run().then(errorCode => {
  process.exit(errorCode);
}, err => {
  console.error(err);

  process.exit(1);
});