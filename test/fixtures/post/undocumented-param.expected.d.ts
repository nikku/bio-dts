declare class Foo {

  /**
   * @param abc
   */
  woop(abc: string): void;
}

/**
 * @param abc
 */
declare function woop(abc: string): void

/**
 * @param abc
 */
export function exportWoop(abc: string): void;

/**
 * @param abc
 */
export default function exportDefaultWoop(abc: string): void;

/**
 * @param abc
 */
declare function withThis(this: Number, abc: string): void

/**
 * @param abc
 */
declare function withoutThis(this: Number, abc: string): void

/**
 * @param foo
 */
declare function nestedParamTag(foo: { bar: string }): void

declare function foo(yo: string): void