export class Foo {

  /**
   * @param a
   * @return
   */
  bar(a: A): boolean

  /**
   * @param arg
   */
  woop(arg?: string): void

  /**
   * @param foo
   */
  missingParam(): void

  /**
   * @param foo
   * @param bar
   * @param notRest
   */
  wrongParamName(foo, bar, ...rest): void
}