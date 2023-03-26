declare class Foo {
  /**
   * Some method description, o yea!
   *
   * @param event
   * @param obj
   */
  on(event: string, obj?: any): void;

  /**
   *
   * Some other method description, o yea!
   *
   * @param obj
   */
  on(obj: any): void;
}