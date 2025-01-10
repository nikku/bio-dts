/**
 * @param value
 * @return
 */
export function foo(value: string): string;
/**
 * @param value
 * @param info
 *
 * @return
 */
export function foo<T>(value: T, info: string): T;

/**
 * @param value
 * @return
 */
export function bar(value: string): string;
/**
 * @param value
 * @param info
 *
 * @return
 */
export function bar(value: string, info?: string): string;
