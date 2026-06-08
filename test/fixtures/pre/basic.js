function Foo() {
  this.bar = 10
}

Foo.prototype.woop = function() {
  return 10;
};

Foo.prototype.asyncWoop = async function() {
  return 10;
};

Foo.asyncStaticWoop = async function() {
  return 10;
};