import {
  parse,
  replace
} from '../lib/parsers/jsdoc.js';

import {
  expect
} from 'chai';


describe('parsers/jsdoc', function() {

  it('should parse @typedef', function() {

    const str = `
/**
 * @typedef { { a: foo } } Boo
 */`;

    // when
    const tags = parse(str);

    // then
    expect(tags).to.eql([
      {
        start: 8,
        name: 'typedef',
        type: { start: 17, end: 31, value: '{ { a: foo } }' },
        param: { start: 32, end: 35, name: 'Boo', value: 'Boo' },
        description: null,
        end: 35
      }
    ]);
  });


  it('should parse @typedef (multi-line)', function() {

    const str = `
/**
 * @typedef { {
 *   a: foo
 * } } Boo
 */`;

    // when
    const tags = parse(str);

    // then
    expect(tags).to.eql([
      {
        start: 8,
        name: 'typedef',
        type: { start: 17, end: 39, value: '{ {\n *   a: foo\n * } }' },
        param: { start: 40, end: 43, name: 'Boo', value: 'Boo' },
        description: null,
        end: 43
      }
    ]);
  });


  it('should parse misc', function() {

    const str = `
/**
 * @class Foo
 * @constructor
 */`;

    // when
    const tags = parse(str);

    // then
    expect(tags).to.eql([
      {
        start: 8,
        name: 'class',
        description: { start: 15, end: 18, value: 'Foo' },
        end: 18
      },
      { start: 22, name: 'constructor', description: null, end: 34 }
    ]);
  });


  it('should parse @param', function() {

    const str = `
/**
 * @param { Foo } [woo=10] SOME TEXT
 */`;

    // when
    const tags = parse(str);

    // then
    expect(tags).to.eql([
      {
        start: 8,
        name: 'param',
        type: { start: 15, end: 22, value: '{ Foo }' },
        param: {
          start: 23,
          end: 31,
          value: '[woo=10]',
          contents: 'woo=10',
          name: 'woo'
        },
        description: {
          start: 32,
          end: 41,
          value: 'SOME TEXT'
        },
        end: 41
      }
    ]);
  });


  it('should parse complex', function() {

    const str = `
/**
 * @typedef { { a: foo } } Boo
 * @typedef { {
 *   a: bar
 * } } Bar
 *
 * @param { Foo } [woo=10] SOME TEXT
 * @param         woo      SOME TEXT
 * @param { {
 *   Bar
 * } } bar
 *
 * @return { string } bar
 * @returns { string } bar
 * @return bar
 * @return { {
 *   a: Bar
 * } }
 */`;

    // when
    const tags = parse(str);

    let r = str;

    for (const tag of tags.slice().reverse()) {

      if (tag.description) {
        r = replace(r, tag.description, 'D');
      }

      if (tag.param) {
        r = replace(r, tag.param, 'P');
      }

      if (tag.type) {
        r = replace(r, tag.type, 'T');
      }
    }

    // then
    expect(r).to.eql(`
/**
 * @typedef T P
 * @typedef T P
 *
 * @param T P D
 * @param         P      D
 * @param T P
 *
 * @return T D
 * @returns T D
 * @return D
 * @return T
 */`);
  });

});