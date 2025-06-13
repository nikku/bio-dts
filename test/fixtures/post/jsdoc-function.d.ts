
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
 * @param {string} foo
 */
export declare function exportedFn(foo): void

/**
 * @param { { a: number, b: string } } options
 */
export function foo({ a, b }: {
    a: number;
    b: string;
}) : void