import inherits from 'inherits-browser';

import BaseGreeter from './base-greeter.js';

/**
 * @typedef { import('./Types.js').Name } Name
 */

/**
 * @constructor
 * @param {Name} name
 */
export function Greeter(name) {
  /** @type {string} */
  this.name = name;
}

inherits(Greeter, BaseGreeter);

/**
 * @param {Name} [greeting]
 * @return {Name}
 */
Greeter.prototype.greet = function(greeting) {
  return (greeting || 'Hello') + ', ' + this.name + '!';
};
