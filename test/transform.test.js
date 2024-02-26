import { readFile } from './helper.js';

import {
  preTransform,
  postTransform
} from 'bio-dts';

import { expect } from 'chai';


describe('transform', function() {

  describe('pre', function() {

    testPreTransform('pre/args-constructor');

    testPreTransform('pre/basic');

    testPreTransform('pre/const');

    testPreTransform('pre/exports');

    testPreTransform('pre/generated-fns');

    testPreTransform('pre/inheritance');

    testPreTransform('pre/inline-method');

    testPreTransform('pre/jsdoc');

    testPreTransform('pre/jsdoc-multi-comments');

    testPreTransform('pre/jsdoc-exports');

    testPreTransform('pre/no-proto');

    testPreTransform('pre/private');

    testPreTransform('pre/static');
  });


  describe('post', function() {

    testPostTransform('post/const');

    testPostTransform('post/optional-args-class');

    testPostTransform('post/optional-args-function');

    testPostTransform('post/optional-args-generic');

    testPostTransform('post/optional-args-class-property');

    testPostTransform('post/jsdoc');

    testPostTransform('post/jsdoc-class');

    testPostTransform('post/jsdoc-function');

    testPostTransform('post/overload');
    testPostTransform('post/overload-method');
    testPostTransform('post/overload-class-property');
    testPostTransform('post/overload-optional-args');

    testPostTransform('post/private');

    testPostTransform('post/type-exports');

    testPostTransform('post/undocumented-param');

    testPostTransform('post/comments');
    testPostTransform('post/comments-source-map');


    describe('error handling', function() {

      it('should indicate parameter missing', function() {

        expect(() => {
          test('post/jsdoc-class-missing-param', postTransform, 'd.ts');
        }).to.throw(
          /documented parameter <foo> not found \[line 7, column 3\]/
        );
      });


      it('should indicate parameter miss-match', function() {

        expect(() => {
          test('post/optional-args-typo', postTransform, 'd.ts');
        }).to.throw(
          /documented parameter <existingClosure> differs from actual parameter <closure> \[line 12, column 1\]/
        );

        expect(() => {
          test('post/jsdoc-class-wrong-param', postTransform, 'd.ts');
        }).to.throw(
          /documented parameter <notRest> differs from actual parameter <rest> \[line 9, column 3\]/
        );
      });

    });

  });


  describe('sourcemap', function() {

    it('pre', function() {

      // given
      const fileName = 'fixtures/pre/basic.js';
      const src = readFile(fileName);

      // when
      const transformed = preTransform(src, {
        inputSourceMap: null,
        sourceFileName: fileName,
        sourceMapName: fileName.slice(0, -2) + '.pre.js',
        sourceRoot: process.cwd()
      });

      // then
      expect(transformed.code).to.exist;
      expect(transformed.map).to.exist;
    });


    it('post', function() {

      // given
      const fileName = 'fixtures/post/jsdoc.d.ts';
      const src = readFile(fileName);

      // when
      const transformed = postTransform(src, {
        sourceFileName: fileName,
        sourceMapName: fileName.slice(0, -4) + '.post.d.ts',
        sourceRoot: process.cwd()
      });

      // then
      expect(transformed.code).to.exist;
      expect(transformed.map).to.exist;
    });

  });

});


// helpers //////////////////

/**
 * @typedef { (
 *   import('mocha').TestFunction |
 *   import('mocha').ExclusiveTestFunction |
 *   import('mocha').PendingTestFunction
 * ) } TestFunction
 */

/**
 * @param {string} name
 * @param {TestFunction} iit
 */
function testPreTransform(name, iit = it) {
  testTransform(name, preTransform, 'js', iit);
}

/**
 * @param {string} name
 * @param {TestFunction} iit
 */
function testPostTransform(name, iit = it) {
  testTransform(name, postTransform, 'd.ts', iit);
}

function test(name, transform, ext) {
  const transformed = transform(readFile(`fixtures/${name}.${ext}`));
  const expected = readFile(`fixtures/${name}.expected.${ext}`);

  expect(transformed.code).to.eql(expected);
}

function testTransform(name, transform, ext, iit) {

  iit(`should transform <${ name }>`, function() {
    test(name, transform, ext);
  });

}

