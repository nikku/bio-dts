/**
 * @overload
 * @param {string} value
 * @return {string}
 */
export function foo(value: string): string;
/**
 * @template T
 * @overload
 * @param {T} value
 * @param {string} info
 *
 * @return {T}
 */
export function foo<T>(value: T, info: string): T;

/**
 * @overload
 * @param {string} value
 * @return {string}
 */
export function bar(value: string): string;
/**
 * @overload
 * @param {string} value
 * @param {string} [info]
 *
 * @return {string}
 */
export function bar(value: string, info?: string): string;
