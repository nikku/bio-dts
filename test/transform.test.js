import { readFile } from './helper.js';

import {
  preTransform,
  postTransform
} from '../index.js';

import { expect } from 'chai';


describe('bio-dts', function() {

  describe('pre', function() {

    testPreTransform('pre/args-constructor');

    testPreTransform('pre/basic');

    testPreTransform('pre/exports');

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

    testPostTransform('post/private');

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

