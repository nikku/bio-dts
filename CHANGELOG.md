# Changelog

All notable changes to [bio-dts](https://github.com/nikku/bio-dts) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

_**Note:** Yet to be released changes appear here._

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