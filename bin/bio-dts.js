#!/usr/bin/env node

import ts from 'typescript';

import generateTypes from '../lib/generate-types.js';

const {
  options,
  fileNames
} = ts.parseCommandLine(process.argv.slice(2));

generateTypes(fileNames, {
  allowJs: true,
  declaration: true,
  emitDeclarationOnly: true,
  ...options
});