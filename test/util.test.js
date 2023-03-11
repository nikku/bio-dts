import { parse, matcher, path } from '../util.js';

import { expect } from 'chai';


describe('util', function() {

  describe('matcher', function() {

    it('should find proto chain', function() {

      // given
      const protoMatcher = matcher`
        Foo.prototype.$1 = $2;
      `;

      const ast = parse(`
        Foo.prototype.bar = 100;

        Foo.prototype.woop = function() {};
      `);

      const body = path(ast.program).get('body');

      // when
      const matches = protoMatcher(body);

      // then
      expect(matches).to.have.length(2);

      expect(matches[0][0]).to.equal(body.get(0));

      expect(matches[0][1].value.name).to.equal('bar');
      expect(matches[0][2].value.type).to.equal('NumericLiteral');
    });


    it('should find local method', function() {

      // given
      const protoMatcher = matcher`
        this.$1 = $2;
      `;

      const ast = parse(`
        function Foo() {
          this.bar = function() { }
        }
      `);

      const constructorBody = path(ast.program).get('body', 0, 'body', 'body');

      // when
      const matches = protoMatcher(constructorBody);

      // then
      expect(matches).to.have.length(1);

      expect(matches[0][0]).to.equal(constructorBody.get(0));
    });


    it('should find function definition', function() {

      // given
      const fnMatcher = matcher`
        function $1($$$) {
          $$$
        }
      `;

      const ast = parse(`
        function Foo() {
          this.bar = function() { }
        }

        function bar(a, b, c) {
          this.bar = function() { }
        }
      `);

      const body = path(ast.program).get('body');

      // when
      const matches = fnMatcher(body);

      // then
      expect(matches).to.have.length(2);

      expect(matches[0][0]).to.equal(body.get(0));
      expect(matches[0][1].value.name).to.equal('Foo');

      expect(matches[1][1].value.name).to.equal('bar');
    });


    it('should find exported function definition', function() {

      // given
      const fnMatcher = matcher`
        export function $1($$$) {
          $$$
        }
      `;

      const ast = parse(`
        export function foo() { a = 1; }
      `);

      const body = path(ast.program).get('body');

      // when
      const matches = fnMatcher(body);

      // then
      expect(matches).to.have.length(1);

      expect(matches[0][0]).to.equal(body.get(0));
      expect(matches[0][1].value.name).to.equal('foo');
    });


    it('should find import declaration', function() {

      // given
      const importMatcher = matcher`
        import $1 from 'inherits-browser';
      `;

      const ast = parse(`
        import foo from 'inherits-browser';
      `);

      const body = path(ast.program).get('body');

      // when
      const matches = importMatcher(body);

      // then
      expect(matches).to.have.length(1);

      expect(matches[0][0]).to.equal(body.get(0));
      expect(matches[0][1].value.name).to.equal('foo');
    });


    it('should find call expression', function() {

      // given
      const callMatcher = matcher`
        Bar.call($$$);
      `;

      const ast = parse(`
        Bar.call(1, 2, 3);
        Bar.call(null);
        Bar.call(this);
      `);

      const body = path(ast.program).get('body');

      // when
      const matches = callMatcher(body);

      // then
      expect(matches).to.have.length(3);

      expect(matches[0][0]).to.equal(body.get(0));
    });


    it('should capture any identifier', function() {

      // given
      const fnMatcher = matcher`
        function Foo($$1) {
          $$2
        }
      `;

      const ast = parse(`
        function Foo() {
        }

        function Foo(a, b, c) {
          return a + b;
        }
      `);

      const body = path(ast.program).get('body');

      // when
      const matches = fnMatcher(body);

      // then
      expect(matches).to.have.length(2);
      expect(matches[0]).to.have.length(3);
      expect(matches[1]).to.have.length(3);

      expect(matches[0][0]).to.equal(body.get(0));
      expect(matches[0][1].value).to.eql([]);
      expect(matches[0][2].value).to.eql([]);

      expect(matches[1][0]).to.equal(body.get(1));
      expect(matches[1][1].value).to.have.length(3);
      expect(matches[1][2].value).to.have.length(1);
    });

  });

});