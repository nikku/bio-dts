import { readFile } from './helper.js';

import {
  preTransform,
  postTransform
} from '../index.js';

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

    testPostTransform('post/optional-args-typo');

    testPostTransform('post/optional-args-class-property');

    testPostTransform('post/jsdoc');

    testPostTransform('post/jsdoc-class');

    testPostTransform('post/jsdoc-function');

    testPostTransform('post/private');

    testPostTransform('post/type-exports');

  });

});


// helpers //////////////////

function testPreTransform(name, iit = it) {
  testTransform(name, preTransform, 'js', iit);
}

function testPostTransform(name, iit = it) {
  testTransform(name, postTransform, 'd.ts', iit);
}

function testTransform(name, transform, ext, iit) {

  iit(`should transform <${ name }>`, function() {

    const expected = readFile(`fixtures/${name}.expected.${ext}`);
    const actual = readFile(`fixtures/${name}.${ext}`);

    expect(transform(actual)).to.eql(expected);
  });

}

