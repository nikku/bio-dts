import { readFile } from './helper.js';

import { transformSource } from '../index.js';

import { expect } from 'chai';


describe('bio-dts', function() {

  testTransform('args-constructor');

  testTransform('basic');

  testTransform('inheritance');

  testTransform('inline-method');

  testTransform('jsdoc');

  testTransform('modifiers');

  testTransform('no-proto');

  testTransform('static');

});


// helpers //////////////////

function testTransform(name, iit = it) {

  iit(`should transform <${ name }>`, function() {

    const expected = readFile(`fixtures/${name}.expected.js`);
    const actual = readFile(`fixtures/${name}.js`);

    expect(transformSource(actual)).to.eql(expected);
  });

}

