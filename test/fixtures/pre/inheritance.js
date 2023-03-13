import Bar from './Bar';

import inherits from 'inherits-browser';

function Foo(a) {
  Bar.call(this, a);
}

inherits(Foo, Bar);


export function Woop(a) {
  Bar.call(this, a);
}

inherits(Woop, Bar);


export default function Default(a) {
  Bar.call(this, a);
}

inherits(Default, Bar);