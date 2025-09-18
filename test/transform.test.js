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

    testPreTransform('pre/class-detection');

    testPreTransform('pre/exports');

    testPreTransform('pre/generated-fns');

    testPreTransform('pre/inheritance');

    testPreTransform('pre/inline-method');

    testPreTransform('pre/jsdoc');

    testPreTransform('pre/jsdoc-multi-comments');

    testPreTransform('pre/jsdoc-exports');

    testPreTransform('pre/no-proto');

    testPreTransform('pre/overload');

    testPreTransform('pre/private');

    testPreTransform('pre/static');

    testPreTransform('jsx/functional-component', {
      parseOptions: { jsx: true }
    });

    testPreTransform('jsx/class-component', {
      parseOptions: { jsx: true }
    });

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

    testPostTransform('post/overlord');
    testPostTransform('post/overlord-method');
    testPostTransform('post/overlord-class-property');
    testPostTransform('post/overlord-optional-args');

    testPostTransform('post/private');

    testPostTransform('post/type-exports');

    testPostTransform('post/undocumented-param');

    testPostTransform('post/comments');
    testPostTransform('post/comments-source-map');


    describe('error handling', function() {

      it('should indicate parameter missing', function() {

        expect(() => {
          test('post/jsdoc-class-missing-param', 'd.ts', postTransform);
        }).to.throw(
          /documented parameter <foo> not found \[line 7, column 3\]/
        );
      });


      it('should indicate parameter miss-match', function() {

        expect(() => {
          test('post/optional-args-typo', 'd.ts', postTransform);
        }).to.throw(
          /documented parameter <existingClosure> differs from actual parameter <closure> \[line 12, column 1\]/
        );

        expect(() => {
          test('post/jsdoc-class-wrong-param', 'd.ts', postTransform);
        }).to.throw(
          /documented parameter <notRest> differs from actual parameter <rest> \[line 9, column 3\]/
        );
      });


      it('should fail to parse JSX without explicit configuration', function() {

        expect(() => {
          test('jsx/functional-component', 'js', preTransform);
        }).to.throw(
          /Unexpected token, /
        );
      });

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
 * @param { {
 *   it?: TestFunction,
 *   parseOptions?: { jsx: boolean }
 * } } [options]
 */
function testPreTransform(name, options) {
  testTransform(name, 'js', preTransform, options);
}

/**
 * @param {string} name
 * @param { {
 *   it?: TestFunction
 * } } [options]
 */
function testPostTransform(name, options) {
  testTransform(name, 'd.ts', postTransform, options);
}

function test(name, ext, transform, parseOptions) {
  const actual = transform(readFile(`fixtures/${name}.${ext}`), parseOptions);
  const expected = readFile(`fixtures/${name}.expected.${ext}`);

  expect(actual).to.eql(expected);
}

function testTransform(name, ext, transform, options) {

  const iit = options?.it || it;
  const parseOptions = options?.parseOptions || undefined;

  iit(`should transform <${ name }>`, function() {
    test(name, ext, transform, parseOptions);
  });

}

