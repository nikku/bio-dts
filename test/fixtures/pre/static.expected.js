class Foo {
  constructor(a) {

  }

  static bar(a) {
    return a + 1;
  }

  static $inject = [ 'a' ];
}