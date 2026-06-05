# bio-dts — Agent Guide

## What This Project Does

**bio-dts** is a TypeScript declaration generator (`.d.ts`) for JavaScript source files. It converts legacy ES5 prototypical code into modern, clean type definitions by running a two-stage transformation pipeline.

Core value: JS library authors get accurate TypeScript types without rewriting their code in TypeScript.

## Architecture

```
Input JS files
    ↓
[Pre-transform]    — ES5 constructor functions → ES6 class syntax
    ↓
[TypeScript compiler]  — generates raw .d.ts declarations
    ↓
[Post-transform]   — cleans JSDoc, filters privates, generates overloads
    ↓
Output .d.ts files (+ optional .d.ts.map files)
```

The TypeScript compiler is hooked via a custom `CompilerHost`: `readFile` runs pre-transform, `writeFile` runs post-transform.

Source maps are chained across all three stages using `@jridgewell/remapping`.

## Key Files

| File | Role |
|------|------|
| [bin/cmd.js](bin/cmd.js) | CLI entry point, argument parsing, file globbing |
| [lib/generate-types.js](lib/generate-types.js) | Pipeline orchestrator, hooks TypeScript compiler |
| [lib/pre-transform.js](lib/pre-transform.js) | ES5 → ES6 class conversion |
| [lib/post-transform.js](lib/post-transform.js) | Declaration cleanup, overload generation |
| [lib/util.js](lib/util.js) | AST utilities, template-based pattern matching |
| [lib/parsers/jsdoc.js](lib/parsers/jsdoc.js) | JSDoc tag parser |
| [lib/parsers/typescript.js](lib/parsers/typescript.js) | Babel parser config |
| [index.js](index.js) | Public API: `preTransform`, `postTransform`, `generateTypes` |

## Pre-Transform (ES5 → ES6)

Detects constructor functions by heuristics (CapitalCase name, no return, no `@function` tag), then:

1. Collects `this.prop = val` (embedded members), `Cls.prototype.method = fn` (prototype members), `Cls.static = val` (static members)
2. Detects `inherits(Child, Parent)` and `Parent.call(this, ...)` patterns
3. Emits ES6 `class Child extends Parent { constructor() { super(); } ... }`
4. Splits JSDoc between the class and constructor nodes

Pattern matching uses a template-literal DSL in [lib/util.js](lib/util.js):

```js
matcher`${className}.prototype.$1 = $2;`
matcher`${inheritsName}(${className}, $1);`
```

## Post-Transform (Declaration Cleanup)

1. **Private member filtering** — removes `_prefixed` names and `@private` tagged members
2. **Parameter validation** — matches actual parameters against `@param` JSDoc; errors on mismatches
3. **Optional parameter overloads** — for invalid `(req, opt?, req2)` patterns, generates distinct overload signatures
4. **`@overlord` overloads** — multiple JSDoc blocks on a single function produce multiple TS overload signatures
5. **JSDoc cleanup** — strips non-TypeScript tags (`@class`, `@extends`, `@typedef`, `@function`); simplifies `{Type}` → `Type`
6. **Type export fixing** — converts re-exported type imports to plain type aliases

## CLI Usage

```bash
bio-dts --outDir dist/types -r lib
bio-dts --outDir dist/types --declarationMap --lax -r lib
bio-dts --jsx preserve --outDir dist/types -r lib
```

Options: `--recursive/-r`, `--lax` (relax checks for generated code), `--verbose`, plus standard TS options (`--outDir`, `--jsx`, `--declarationMap`).

## Development

```bash
npm test                    # run all tests
npm run lint                # ESLint
npm run check-types         # TypeScript type check
npm run all                 # lint + types + tests + snapshots

# Re-generate snapshots
npm run test:dts:default
npm run test:dts:jsx
npm run test:dts:declaration-map
npm run test:dts:lax
```

## Testing Strategy

Snapshot-based integration tests. Each fixture under [test/fixtures/](test/fixtures/) has input JS and a corresponding `.expected` snapshot file. Tests in [test/transform.test.js](test/transform.test.js) run the full pipeline and diff against snapshots.

Fixture groups:
- `pre/` — pre-transform (ES5 → ES6 class) cases
- `post/` — post-transform (declaration cleanup) cases
- `jsx/` — JSX component support
- `lax/` — lax mode (looser validation for generated code)

Test structure follows `given → when → then`.

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@babel/parser` | Parse JS/JSX/TS |
| `recast` | AST manipulation preserving formatting |
| `@jridgewell/source-map` | Source map read/write |
| `@jridgewell/remapping` | Chain multiple source maps |
| `tiny-glob` | CLI file globbing |
| `typescript` | Declaration generation |

## Custom Annotations

`@overlord` — marks a JSDoc block as one overload variant of a function. Multiple `@overlord` blocks on the same function produce separate TS overload signatures:

```js
/**
 * @overlord
 * @param {string} x
 * @return {void}
 */
/**
 * @overlord
 * @param {number} x
 * @return {number}
 */
function foo(x) { ... }
```

Output:
```typescript
export function foo(x: string): void;
export function foo(x: number): number;
```
