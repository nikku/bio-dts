function Foo() {
  this.woop = function(a, b) {
    return a + b;
  };

  this.asyncWoop = async function(a, b) {
    return a + b;
  };

  this.wap = function() {
    return false;
  };

  this.asyncWap = async function() {
    return false;
  };

}