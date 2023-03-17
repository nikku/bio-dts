# bio-dts

[![CI](https://github.com/nikku/bio-dts/actions/workflows/CI.yml/badge.svg)](https://github.com/nikku/bio-dts/actions/workflows/CI.yml)

Utilities to generate sane and clean type definitions from JavaScript files.

## About

This module provides `pre` and `post` processing helpers to a type definition pipeline, as well as a simple [generator cli](#usage).


## Features

Supported constructs:

* ES5 prototypical classes + inheritance
* Optional parameters before required ones

Additional features:

* Preserves documentation
* Converts JSDoc to [TSDoc](https://github.com/microsoft/tsdoc)

Checkout the [test fixtures](./test/fixtures) for full coverage.


## Usage

```sh
npx bio-dts --outDir dist/types -r lib
```

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
