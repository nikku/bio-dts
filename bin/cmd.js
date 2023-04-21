#!/usr/bin/env node

import Module from 'node:module';

import glob from 'tiny-glob';

import path from 'node:path';
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
  const verboseMatch = /--verbose(?:=([^\s$]+))?(\s|$)/.exec(args);

  const verbose = verboseMatch ? verboseMatch[1] || true : false;
  const recursive = args.includes('--recursive') || args.includes('-r');

  if (help) {
    console.log(`Usage: bio-dts [options] [...filesOrGlobs]

  Options:
    --recursive, -r    recurse into directories
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

  generateTypes(files, generateOptions);

  console.log('Done.');
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

run().catch(err => {
  console.error(err);

  process.exit(1);
});