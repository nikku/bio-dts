/**
 * Foo description
 *
 * @param {string} a
 * @param {string} b
 */
function Foo(a, b) {

  /**
   * YEA
   *
   * @param {string} yea
   */
  this.wooop = function(yea) {

  };

  /**
   * @param { { foo: number, bar: string } } options
   */
  this.waap = function({ foo, bar }) {

  };
}

/**
 * Not sour
 *
 * @param {number} n
 * @return {number}
 */
Foo.prototype.sweeeet = function(n) {
  return n + 1;
}

/**
 * Static variable!
 *
 * @type {boolean}
 */
Foo.bar = false;