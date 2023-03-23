
/**
 * @method Foo#bar
 * @param { A } a
 * @return {boolean}
 */
declare function bar(a: A): boolean

/**
 * @param {string} [arg]
 */
declare function woop(arg?: string): void

/**
 * @param { string } foo
 */
declare function missingParam(): void

/**
 * @param { string } foo
 * @param { number } [bar]
 * @param { any[] } notRest
 */
declare function wrongParamName(foo: string, bar: number, ...rest: any[]): void

/**
 * @param {string} foo
 */
export declare function exportedFn(foo): void