#!/usr/bin/env node

import ts from 'typescript';

import glob from 'tiny-glob';

import path from 'node:path';
import fs from 'node:fs';

import generateTypes from '../lib/generate-types.js';

async function run() {
  const args = process.argv.slice(2);

  const {
    options,
    fileNames
  } = ts.parseCommandLine(args);

  const verbose = args.includes('--verbose');
  const recursive = args.includes('--recursive') || args.includes('-r');

  const globPattern = recursive ? '**/*.js' : '*.js';

  const files = [];

  for (const fileName of fileNames) {

    try {
      if (fs.statSync(fileName).isDirectory) {

        const globbedFiles = await glob(globPattern, { cwd: fileName, filesOnly: true });

        files.push(...globbedFiles.map(f => path.join(fileName, f)));
      } else {
        files.push(fileName);
      }
    } catch (err) {

      // ignore
    }
  }

  console.log(`Generating types for ${files.length} files...`);

  generateTypes(files, {
    allowJs: true,
    declaration: true,
    emitDeclarationOnly: true,
    ...options,
    verbose
  });

  console.log('Done.');
}

run().catch(err => {
  console.error(err);

  process.exit(1);
});