# bio-dts

[![CI](https://github.com/nikku/bio-dts/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/bio-dts/actions/workflows/CI.yml)

Utilities to generate sane and clean type definitions from JavaScript files.

## About

This module provides `pre` and `post` processing helpers to a type definition pipeline.

You can use it [via API](#api) or through a simple [generator cli](#usage).


## Usage

```sh
npx bio-dts --outDir dist/types -r lib
```


## Features

Generates clean type definitions from ES5 code bases:

* ES5 prototypical classes + inheritance
* Optional parameters before required ones
* Function overloading (via `@overlord` annotations, actually works!)
* Converts JSDoc to [TSDoc](https://github.com/microsoft/tsdoc)
* Only exposed documented parameters
* Validates, where needed declared parameters

Checkout the [test fixtures](./test/fixtures) for full coverage.


## API

```javascript
import {
  preTransform,
  postTransform,
  generateTypes
} from 'bio-dts';

// transform JS so it keeps the shape,
// but is properly digestable by the typescript
// compiler
const transformedCode = preTransform(jsCode);

// post process typescript compiler type code
// removing internals, and fixing up the definitions
const transformedCode = postTransform(tsCode);

// execute the full pipeline, including invoking the
// typescript compiler
generateTypes(files, {
  outDir: 'dist'
});
```
