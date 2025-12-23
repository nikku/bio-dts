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
          run('post/jsdoc-class-missing-param', 'd.ts', postTransform);
        }).to.throw(
          /documented parameter <foo> not found \[line 7, column 3\]/
        );
      });


      it('should indicate parameter miss-match', function() {

        expect(() => {
          run('post/optional-args-typo', 'd.ts', postTransform);
        }).to.throw(
          /documented parameter <existingClosure> differs from actual parameter <closure> \[line 12, column 1\]/
        );

        expect(() => {
          run('post/jsdoc-class-wrong-param', 'd.ts', postTransform);
        }).to.throw(
          /documented parameter <notRest> differs from actual parameter <rest> \[line 9, column 3\]/
        );
      });


      it('should fail to parse JSX without explicit configuration', function() {

        expect(() => {
          run('jsx/functional-component', 'js', preTransform);
        }).to.throw(
          /Unexpected token, /
        );
      });

    });

  });


  describe('sourcemap', function() {

    describe('pre', function() {

      it('basic', function() {

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

        expect(transformed.code).to.exist;
        expect(transformed.map).to.exist;
      });

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

function run(name, ext, transform, parseOptions) {
  const transformed = transform(readFile(`fixtures/${name}.${ext}`), parseOptions);
  const expected = readFile(`fixtures/${name}.expected.${ext}`);

  expect(transformed.code).to.eql(expected);
}

function testTransform(name, ext, transform, options) {

  const iit = options?.it || it;
  const parseOptions = options?.parseOptions || undefined;

  iit(`should transform <${ name }>`, function() {
    run(name, ext, transform, parseOptions);
  });

}

