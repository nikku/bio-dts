function Foo(a) {

}

Foo.bar = function(a) {
  return a + 1;
};

Foo.$inject = [ 'a' ];