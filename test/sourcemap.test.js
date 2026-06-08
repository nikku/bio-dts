import { readFile } from './helper.js';

import {
  preTransform,
  postTransform,
  generateTypes
} from 'bio-dts';

import { SourceMapConsumer } from '@jridgewell/source-map';

import Module from 'node:module';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

import { expect } from 'chai';


describe('sourcemap', function() {

  // parsing source maps can be slow
  this.timeout(5000);


  describe('preTransform', function() {

    it('should map class declaration to original constructor function', function() {

      // given
      const src = readFile('fixtures/pre/basic.js');

      // when
      const { map } = preTransform(src, {
        sourceFileName: 'fixtures/pre/basic.js',
        sourceMapName: 'fixtures/pre/basic.pre.js'
      });

      // then
      // 'class Foo {' (line 1) maps to 'function Foo() {' (line 1)
      const consumer = new SourceMapConsumer(map);
      const classPos = consumer.originalPositionFor({ line: 1, column: 0 });
      expect(classPos.line).to.equal(1);
      expect(classPos.column).to.equal(0);
      expect(classPos.name).to.equal('Foo class');
    });


    it('should map constructor to original constructor function', function() {

      // given
      const src = readFile('fixtures/pre/basic.js');

      // when
      const { map } = preTransform(src, {
        sourceFileName: 'fixtures/pre/basic.js',
        sourceMapName: 'fixtures/pre/basic.pre.js'
      });

      // then
      // 'constructor() {' (line 2) maps to 'function Foo() {' (line 1)
      const consumer = new SourceMapConsumer(map);
      const ctorPos = consumer.originalPositionFor({ line: 2, column: 2 });
      expect(ctorPos.line).to.equal(1);
      expect(ctorPos.name).to.equal('Foo constructor');
    });


    it('should map instance member to original this-assignment', function() {

      // given
      const src = readFile('fixtures/pre/basic.js');

      // when
      const { map } = preTransform(src, {
        sourceFileName: 'fixtures/pre/basic.js',
        sourceMapName: 'fixtures/pre/basic.pre.js'
      });

      // then
      // 'this.bar = 10' in constructor body (line 3) maps to
      // 'this.bar = 10' in the original function body (line 2)
      const consumer = new SourceMapConsumer(map);
      const memberPos = consumer.originalPositionFor({ line: 3, column: 4 });
      expect(memberPos.line).to.equal(2);
    });


    it('should map prototype method to original prototype assignment', function() {

      // given
      const src = readFile('fixtures/pre/basic.js');

      // when
      const { map } = preTransform(src, {
        sourceFileName: 'fixtures/pre/basic.js',
        sourceMapName: 'fixtures/pre/basic.pre.js'
      });

      // then
      // 'woop() {' (line 6) maps to 'Foo.prototype.woop = function() {' (line 5)
      const consumer = new SourceMapConsumer(map);
      const methodPos = consumer.originalPositionFor({ line: 6, column: 2 });
      expect(methodPos.line).to.equal(5);
    });

  });


  describe('postTransform', function() {

    it('should map declarations to original positions after private member removal', function() {

      // given
      // input has @private-tagged and _prefixed members, both stripped by post-transform
      const src = readFile('fixtures/post/private.d.ts');

      // when
      const { map } = postTransform(src, {
        sourceFileName: 'fixtures/post/private.d.ts',
        sourceMapName: 'fixtures/post/private.post.d.ts'
      });

      // then
      // constructor in output (line 2) maps back to constructor in input (line 2),
      // confirming the remaining declaration is correctly anchored despite member removal
      const consumer = new SourceMapConsumer(map);
      const ctorPos = consumer.originalPositionFor({ line: 2, column: 2 });
      expect(ctorPos.line).to.equal(2);
    });


    it('should map all @overlord overloads to original function declaration', function() {

      // given
      // @overlord annotations expand one declaration into multiple overloads
      const src = readFile('fixtures/post/overlord.d.ts');

      // when
      const { map } = postTransform(src, {
        sourceFileName: 'fixtures/post/overlord.d.ts',
        sourceMapName: 'fixtures/post/overlord.post.d.ts'
      });

      // then
      // all three generated 'on' overloads (lines 7, 16, 23) map back to the
      // single original 'declare function on(...)' declaration (line 21)
      const consumer = new SourceMapConsumer(map);

      expect(consumer.originalPositionFor({ line: 7, column: 17 }).line).to.equal(21);
      expect(consumer.originalPositionFor({ line: 16, column: 17 }).line).to.equal(21);
      expect(consumer.originalPositionFor({ line: 23, column: 17 }).line).to.equal(21);
    });

  });


  describe('generateTypes', function() {

    let ts;
    let outDir;

    before(function() {
      const requireLocal = Module.createRequire(
        path.join(process.cwd(), '__placeholder__.js')
      );
      ts = requireLocal('typescript');
    });

    beforeEach(function() {
      outDir = path.join(os.tmpdir(), 'bio-dts-test-' + Date.now());
      fs.mkdirSync(outDir, { recursive: true });
    });

    afterEach(function() {
      fs.rmSync(outDir, { recursive: true });
    });


    it('should map generated type symbols to original source positions', function() {

      // given
      const inputFile = path.resolve('test/fixtures/pre/basic.js');

      // when
      generateTypes(
        [ inputFile ],
        {
          allowJs: true,
          declaration: true,
          emitDeclarationOnly: true,
          declarationMap: true,
          outDir
        },
        ts
      );

      // then
      const mapContent = JSON.parse(
        fs.readFileSync(path.join(outDir, 'basic.d.ts.map'), 'utf8')
      );
      const consumer = new SourceMapConsumer(mapContent);

      // 'declare class Foo {' (line 1) -> 'function Foo() {' in basic.js (line 1)
      const classPos = consumer.originalPositionFor({ line: 1, column: 0 });
      expect(classPos.source).to.include('basic.js');
      expect(classPos.line).to.equal(1);
      expect(classPos.name).to.equal('Foo class');

      // TypeScript emits static members before instance members in .d.ts:
      //   line 2: static asyncStaticWoop(): Promise<number>;
      //   line 3: bar: number;
      //   line 4: woop(): number;
      //   line 5: asyncWoop(): Promise<number>;

      // '    static asyncStaticWoop()' (line 2) -> 'Foo.asyncStaticWoop = ...' in basic.js (line 13)
      const staticMethodPos = consumer.originalPositionFor({ line: 2, column: 4 });
      expect(staticMethodPos.source).to.include('basic.js');
      expect(staticMethodPos.line).to.equal(13);

      // '    bar: number;' (line 3) -> '  this.bar = 10' in basic.js (line 2)
      const propPos = consumer.originalPositionFor({ line: 3, column: 4 });
      expect(propPos.source).to.include('basic.js');
      expect(propPos.line).to.equal(2);

      // '    woop(): number;' (line 4) -> 'Foo.prototype.woop = function()' in basic.js (line 5)
      const methodPos = consumer.originalPositionFor({ line: 4, column: 4 });
      expect(methodPos.source).to.include('basic.js');
      expect(methodPos.line).to.equal(5);
    });


    it('should map static member to original static assignment', function() {

      // given - jsdoc.js has a static member 'Foo.bar = false' at line 41
      const inputFile = path.resolve('test/fixtures/pre/jsdoc.js');

      // when
      generateTypes(
        [ inputFile ],
        {
          allowJs: true,
          declaration: true,
          emitDeclarationOnly: true,
          declarationMap: true,
          outDir
        },
        ts
      );

      // then
      const mapContent = JSON.parse(
        fs.readFileSync(path.join(outDir, 'jsdoc.d.ts.map'), 'utf8')
      );
      const consumer = new SourceMapConsumer(mapContent);

      // 'declare class Foo {' (line 5) -> 'function Foo(a, b) {' in jsdoc.js (line 7)
      const classPos = consumer.originalPositionFor({ line: 5, column: 0 });
      expect(classPos.source).to.include('jsdoc.js');
      expect(classPos.line).to.equal(7);
      expect(classPos.name).to.equal('Foo class');

      // '    static bar: boolean;' (line 10) -> 'Foo.bar = false' in jsdoc.js (line 41)
      const staticPos = consumer.originalPositionFor({ line: 10, column: 4 });
      expect(staticPos.source).to.include('jsdoc.js');
      expect(staticPos.line).to.equal(41);
      expect(staticPos.name).to.equal('Foo#bar');
    });


    it('should map function-to-class transformation for exported constructors', function() {

      // given
      // inheritance.js has two exported ES5 constructor functions; both use inherits()
      // to set up a prototype chain that pre-transform rewrites to ES6 class extends
      const inputFile = path.resolve('test/fixtures/pre/inheritance.js');

      // when
      generateTypes(
        [ inputFile ],
        {
          allowJs: true,
          declaration: true,
          emitDeclarationOnly: true,
          declarationMap: true,
          outDir
        },
        ts
      );

      // then
      const mapContent = JSON.parse(
        fs.readFileSync(path.join(outDir, 'inheritance.d.ts.map'), 'utf8')
      );
      const consumer = new SourceMapConsumer(mapContent);

      // 'export class Woop extends Bar {' (line 1) -> 'export function Woop(a)' in inheritance.js (line 12)
      const woopClassPos = consumer.originalPositionFor({ line: 1, column: 0 });
      expect(woopClassPos.source).to.include('inheritance.js');
      expect(woopClassPos.line).to.equal(12);
      expect(woopClassPos.name).to.equal('Woop class');

      // 'export default class Default extends Bar {' (line 4) -> 'export default function Default(a)' (line 19)
      const defaultClassPos = consumer.originalPositionFor({ line: 4, column: 0 });
      expect(defaultClassPos.source).to.include('inheritance.js');
      expect(defaultClassPos.line).to.equal(19);
      expect(defaultClassPos.name).to.equal('Default class');
    });


    it('should map constructor method to original class function', function() {

      // given
      // jsdoc.js defines 'function Foo(a, b)' at line 7 with JSDoc-typed params;
      // pre-transform rewrites it to a class constructor
      const inputFile = path.resolve('test/fixtures/pre/jsdoc.js');

      // when
      generateTypes(
        [ inputFile ],
        {
          allowJs: true,
          declaration: true,
          emitDeclarationOnly: true,
          declarationMap: true,
          outDir
        },
        ts
      );

      // then
      const mapContent = JSON.parse(
        fs.readFileSync(path.join(outDir, 'jsdoc.d.ts.map'), 'utf8')
      );
      const consumer = new SourceMapConsumer(mapContent);

      // '    constructor(a: string, b: string);' (line 15) -> 'function Foo(a, b) {' (line 7)
      const ctorPos = consumer.originalPositionFor({ line: 15, column: 4 });
      expect(ctorPos.source).to.include('jsdoc.js');
      expect(ctorPos.line).to.equal(7);
      expect(ctorPos.name).to.equal('Foo constructor');
    });


    it('should map class method to original prototype function', function() {

      // given
      // jsdoc.js defines 'Foo.prototype.sweeeet = function(n)' at line 32;
      // pre-transform promotes it to a class method
      const inputFile = path.resolve('test/fixtures/pre/jsdoc.js');

      // when
      generateTypes(
        [ inputFile ],
        {
          allowJs: true,
          declaration: true,
          emitDeclarationOnly: true,
          declarationMap: true,
          outDir
        },
        ts
      );

      // then
      const mapContent = JSON.parse(
        fs.readFileSync(path.join(outDir, 'jsdoc.d.ts.map'), 'utf8')
      );
      const consumer = new SourceMapConsumer(mapContent);

      // '    sweeeet(n: number): number;' (line 35) -> 'Foo.prototype.sweeeet = function(n)' (line 32)
      const methodPos = consumer.originalPositionFor({ line: 35, column: 4 });
      expect(methodPos.source).to.include('jsdoc.js');
      expect(methodPos.line).to.equal(32);
    });


    it('should produce map with file pointer relative to source map', function() {

      // given
      const inputFile = 'test/fixtures/pre/basic.js';

      // when
      generateTypes(
        [ inputFile ],
        {
          allowJs: true,
          declaration: true,
          emitDeclarationOnly: true,
          declarationMap: true,
          outDir
        },
        ts
      );

      // then
      const mapFile = path.join(outDir, 'basic.d.ts.map');
      const mapContent = JSON.parse(fs.readFileSync(mapFile, 'utf8'));

      // file must be relative from the map to the generated .d.ts,
      // not an absolute path or a CWD-relative path
      const expectedDts = path.join(outDir, 'basic.d.ts');
      expect(path.resolve(path.dirname(mapFile), mapContent.file)).to.equal(expectedDts);
    });


    it('should produce maps with relative source paths and no inline source text', function() {

      // given
      // use a relative path input (as the CLI does) so the CWD-relative
      // path normalization is exercised, not just the absolute-path branch
      const inputFile = 'test/fixtures/pre/basic.js';

      // when
      generateTypes(
        [ inputFile ],
        {
          allowJs: true,
          declaration: true,
          emitDeclarationOnly: true,
          declarationMap: true,
          outDir
        },
        ts
      );

      // then
      const mapFile = path.join(outDir, 'basic.d.ts.map');
      const mapContent = JSON.parse(fs.readFileSync(mapFile, 'utf8'));

      // source text must not be inlined - keeping the map small
      // consumers should read the original file
      expect(mapContent.sourcesContent).not.to.exist;

      // sources must be relative paths, resolving to the actual source file
      const expectedSrc = path.resolve(inputFile);
      for (const src of mapContent.sources) {
        expect(path.resolve(path.dirname(mapFile), src)).to.equal(expectedSrc);
      }
    });

  });

});
