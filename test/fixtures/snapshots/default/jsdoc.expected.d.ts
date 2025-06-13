/**
 * Foo description
 *
 */
declare class Foo {
    /**
     * Static variable!
     *
     * @type {boolean}
     */
    static bar: boolean;
    /**
     * @param a
     * @param b
     */
    constructor(a: string, b: string);
    /**
     * YEA
     *
     * @param yea
     */
    wooop: (yea: string) => void;
    /**
     * @param options
     */
    waap: ({ foo, bar }: {
        foo: number;
        bar: string;
    }) => void;
    /**
     * Not sour
     *
     * @param n
     * @return
     */
    sweeeet(n: number): number;
}
