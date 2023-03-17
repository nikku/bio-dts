/**
 * @typedef { string } A
 */

/**
 * @class
 * @constructor
 */
export class Foo {

  /**
   * @method Foo#bar
   * @param { A } a
   * @return {boolean}
   */
  bar(a: A): boolean

  /**
   * @param {string} [arg]
   */
  woop(arg?: string): void

  /**
   * @param { string } foo
   */
  missingParam(): void

  /**
   * @param { string } foo
   * @param { number } [bar]
   * @param { any[] } notRest
   */
  wrongParamName(foo, bar, ...rest): void
}