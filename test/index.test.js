import { readFile } from './helper.js';

import { transformSource } from '../index.js';

import { expect } from 'chai';


describe('bio-dts', function() {

  testTransform('basic');

  testTransform('args-constructor');

  testTransform('jsdoc');

  testTransform('no-proto');

  testTransform('modifiers');

  testTransform('static');

  testTransform('inheritance');

});


// helpers //////////////////

function testTransform(name, iit=it) {

  iit(`should transform <${ name }>`, function() {

    const expected = readFile(`fixtures/${name}.expected.js`);
    const actual = readFile(`fixtures/${name}.js`);

    expect(transformSource(actual)).to.eql(expected);
  });

}

