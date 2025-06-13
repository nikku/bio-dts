
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
export declare function exportedFn(foo): void

/**
 * @param options
 */
export function foo({ a, b }: {
    a: number;
    b: string;
}) : void