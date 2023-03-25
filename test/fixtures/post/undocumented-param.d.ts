declare class Foo {

  /**
   * @param {string} abc
   */
  woop(abc: string, undoc: any) : void;
}

/**
 * @param {string} abc
 */
declare function woop(abc: string, undoc: any) : void;

/**
 * @param {string} abc
 */
export function exportWoop(abc: string, undoc: any) : void;

/**
 * @param {string} abc
 */
export default function exportDefaultWoop(abc: string, undoc: any) : void;

/**
 * @this {Number}
 * @param {string} abc
 */
declare function withThis(this: Number, abc: string, undoc: any) : void;

/**
 * @param {string} abc
 */
declare function withoutThis(this: Number, abc: string, undoc: any) : void;

/**
 * @param {Object} foo
 * @param {string} foo.bar
 */
declare function nestedParamTag(foo: { bar: string }, undoc: any) : void;
