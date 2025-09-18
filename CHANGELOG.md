# Changelog

All notable changes to [bio-dts](https://github.com/nikku/bio-dts) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

_**Note:** Yet to be released changes appear here._

## 0.14.0

* `FEAT`: be able to relax type checks when working with generated sources ([#16](https://github.com/nikku/bio-dts/pull/16))

## 0.13.0

* `FEAT`: support [declaration maps](https://www.typescriptlang.org/tsconfig/declarationMap.html) ([#15](https://github.com/nikku/bio-dts/pull/15))
* `FEAT`: support annonymous (destructured) arguments ([#14](https://github.com/nikku/bio-dts/pull/14))

## 0.12.0

* `FEAT`: generate declarations for `@overlord` annoted functions in definition order ([#6](https://github.com/nikku/bio-dts/pull/6))
* `FEAT`: consistently use locally provided TypeScript ([#9](https://github.com/nikku/bio-dts/pull/9))
* `FEAT`: indicate TypeScript generation errors ([`be45fe8`](https://github.com/nikku/bio-dts/commit/be45fe884f018674f985c90735eef1838bb65330))
* `FIX`: improve `verbose` behavior ([#10](https://github.com/nikku/bio-dts/pull/10))
* `CHORE`: verify compatibility with TypeScript `@overload` annotations ([#13](https://github.com/nikku/bio-dts/pull/13))
* `DEPS`: update to `@babel/parser@7.26.3`
* `DEPS`: update to `recast@0.23.9`

### Breaking Changes

* `generateTypes` helper now requires you to explicitly pass the TypeScript instance used ([#9](https://github.com/nikku/bio-dts/pull/9))
* Declarations for overloaded functions are now generated in definition order ([#6](https://github.com/nikku/bio-dts/pull/6))

## 0.11.0

* `FEAT`: preserve comment style and position ([#4](https://github.com/nikku/bio-dts/pull/4))

## 0.10.0

* `FEAT`: apply transforms additive

## 0.9.0

* `CHORE`: add `exports` field, drop `main` field
* `CHORE`: internal typing improvements

## 0.8.1

* `FIX`: make `JSDoc` parsing more lenient
* `CHORE`: add `repository` field ([#1](https://github.com/nikku/bio-dts/pull/1))
* `CHORE`: log generate arguments in verbose mode

## 0.8.0

* `FEAT`: clean undocumented arguments
* `FEAT`: support `@overlord` - a working way to overload JS methods
* `CHORE`: throw errors with location information

## 0.7.0

* `FEAT`: preserve generics when generating overloads
* `FEAT`: do not export type imports

## 0.6.1

* `FIX`: correct handling of constructors (`null` return type)

## 0.6.0

* `FEAT`: handle optional before non-optional in class properties

## 0.5.0

* `FEAT`: support generated class properties

## 0.4.1

* `FIX`: filter `property` from JSDoc comments

## 0.4.0

* `FEAT`: support optional before non-optional parameters
* `FEAT`: load local `typescript`
* `FIX`: correct CLI directory check

## 0.3.0

* `FEAT`: strip unneeded JSDoc tags

## 0.2.1

* `FIX`: support multiple inherits statements per class

## 0.2.0

* `FEAT`: pretty print output

## 0.1.2

* `FIX`: make binary executable

## 0.1.1

* `FIX`: correct executable path

## 0.1.0

_Initial public release._