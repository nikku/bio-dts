// initial comment

/** some comment */

/* */
//

/**
 * @function
 */
declare function blub(): boolean

/**
 * @template { string } T
 */
declare class Bar<T> {}

/**
 * @class Foo
 * @extends { Bar<'foo'> }
 */
declare class Foo extends Bar<'foo'> {}

/** @type { number } */
declare const foo = 1;

/** some other comment */

/* */
//

// trailing