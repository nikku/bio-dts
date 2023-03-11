import Bar from './Bar';

import inherits from 'inherits-browser';

function Foo(a) {
  Bar.call(this, a);
}

inherits(Foo, Bar);