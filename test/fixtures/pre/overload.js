/**
 * @overload
 * @param {string} value
 * @return {string}
 */
/**
 * @template T
 * @overload
 * @param {T} value
 * @param {string} info
 *
 * @return {T}
 */
/**
 * @template T
 * @param {string | T} value
 * @param {string} [info]
 * @return {string | T}
 */
export function foo(value, info) {
  return value;
}

/**
 * @template T
 * @overload
 * @param {T} name
 * @return {T}
 */
/**
 * @overload
 * @param {string} name
 * @return {number}
 */
/**
 * @param {any} name
 * @return {any}
 */
export function oof(name) {
  return name;
}

/**
 * @overload
 * @param {string} value
 * @return {string}
 */
/**
 * @overload
 * @param {string} value
 * @param {string} [info]
 *
 * @return {string}
 */
export function bar(value, info) {
  return value;
}

/**
 * @overload
 * @param {string} [value]
 * @return {string}
 */
/**
 * @overload
 * @param {string} [value]
 * @param {string} info
 *
 * @return {string}
 */
export function baba(value, info) {
  return value;
}

/**
 * @overload
 * @param {string} value
 * @return {string}
 */
export function noActualOverload(value) {
  return value;
}

export class Foo {

  /**
   * @overload
   * @param {number} value
   * @return {number}
   */
  /**
   * @overload
   * @param {number} [value]
   * @param {string} info
   *
   * @return {number}
   */
  bar(value, info) {
    return value;
  }
}