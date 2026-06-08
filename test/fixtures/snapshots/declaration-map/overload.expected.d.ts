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
 * @param name
 * @return
 */
export function oof<T>(name: T): T;

/**
 * @param name
 * @return
 */
export function oof(name: string): number;

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

/**
 * @param value
 * @return
 */
export function baba(value?: string): string;

/**
 * @param info
 *
 * @return
 */
export function baba(info: string): string;

/**
 * @param value
 * @param info
 *
 * @return
 */
export function baba(value: string, info: string): string;

/**
 * @param value
 * @return
 */
export function noActualOverload(value: string): string;

/**
 * @param value
 * @return
 */
export function asybcBaba(value: string): Promise<string>;

/**
 * @param info
 *
 * @return
 */
export function asybcBaba(info: string): Promise<string>;

/**
 * @param value
 * @param info
 *
 * @return
 */
export function asybcBaba(value: string, info: string): Promise<string>;

export class Foo {
  /**
   * @param value
   * @return
   */
  bar(value: number): number;

  /**
   * @param info
   *
   * @return
   */
  bar(info: string): number;

  /**
   * @param value
   * @param info
   *
   * @return
   */
  bar(value: number, info: string): number;
}
//# sourceMappingURL=overload.expected.d.ts.map