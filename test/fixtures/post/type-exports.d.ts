export type Foo = {
  woop: Woop;
  other: Other;
};

declare type Bar = {
  foo: Foo
};

export default Bar;

export type Woop = import('./Woop').default;
export type Other = import('./Woop').Other;