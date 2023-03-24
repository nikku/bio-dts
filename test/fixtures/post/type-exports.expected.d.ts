export type Foo = {
  woop: Woop;
  other: Other;
};

declare type Bar = {
  foo: Foo
};

export default Bar;
type Woop = import('./Woop').default;
type Other = import('./Woop').Other;