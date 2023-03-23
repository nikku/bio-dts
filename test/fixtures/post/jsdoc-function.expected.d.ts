
/**
 * @param a
 * @return
 */
declare function bar(a: A): boolean

/**
 * @param arg
 */
declare function woop(arg?: string): void

/**
 * @param foo
 */
declare function missingParam(): void

/**
 * @param foo
 * @param bar
 * @param notRest
 */
declare function wrongParamName(foo: string, bar: number, ...rest: any[]): void

/**
 * @param foo
 */
export declare function exportedFn(foo): void