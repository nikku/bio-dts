import { visit, print } from 'recast';

import { matcher, parse, path } from './util.js';

import {
  namedTypes as n,
  builders as b
} from 'ast-types';

function superCall() {
  return b.expressionStatement.from({
    "type": "ExpressionStatement",
    "expression": {
      "type": "CallExpression",
      "callee": {
        "type": "Super"
      },
      "arguments": []
    }
  });
}

function clazz(cls) {

  const constructor = cls.node.value;

  const comment = constructor.comments?.length === 1 ? constructor.comments[0] : null;

  const [ intro, ...rest ] = comment?.value?.split(/\* @param/) || [];

  const methods = [
    {
      "type": "ClassMethod",
      "static": false,
      "key": {
        "type": "Identifier",
        "name": "constructor"
      },
      "computed": false,
      "kind": "constructor",
      "id": null,
      "generator": false,
      "async": false,
      "params": constructor.params,
      "body": constructor.body,
      "comments": rest.length ? [ {
        leading: true,
        trailing: false,
        type: "CommentBlock",
        value: '*\n * @param' + rest.join('* @param'),
      } ] : constructor.comments
    },
    ...cls.members.filter(m => m.member.type === 'FunctionExpression').map(m => {
      return {
        "type": "ClassMethod",
        "static": false,
        "key": {
          "type": "Identifier",
          "name": m.name
        },
        "computed": false,
        "kind": "method",
        "id": null,
        "generator": false,
        "async": false,
        "params": m.member.params,
        "body": m.member.body
      }
    })
  ];

  return b.classDeclaration.from({
    "type": "ClassDeclaration",
    "id": {
      "type": "Identifier",
      "name": cls.name
    },
    "superClass": cls.superDeclaration ? {
      "type": "Identifier",
      "name": cls.superDeclaration.clazz
    } : null,
    "body": {
      "type": "ClassBody",
      "body": [
        ...methods
      ]
    },
    "comments": intro ? [ {
      leading: true,
      trailing: false,
      type: "CommentBlock",
      value: intro
    } ] : constructor.comments || []
  });
}


/**
 * @param {string} src
 * @return {string}
 */
export function transformSource(src) {

  const ast = parse(src);
  const body = path(ast).get('program', 'body');

  const constructors = findConstructors(body);

  for (const constructor of constructors) {
    const members = constructor.members = [
      ...findProtoMethods(constructor, body),
      ...findEmbeddedMethods(constructor)
    ];

    const superDeclaration = constructor.superDeclaration = findSuperDeclarations(constructor, body);

    if (superDeclaration) {
      constructor.node.get('body', 'body').unshift(superCall());

      superDeclaration.superCalls.forEach(m => m.node.replace());
    }

    constructor.node.replace(clazz(constructor));

    members.forEach(m => {
      if (m.member.type === 'FunctionExpression') {
        m.node.replace();
      };
    });

    if (superDeclaration) {
      superDeclaration.importDeclarations.forEach(m => m.node.replace());
      superDeclaration.inheritsExpression.node.replace();
    }
  }

  return print(ast).code;
}

function findSuperDeclarations(constructor, nodes) {

  const importsMatches = matcher`
    import $1 from 'inherits-browser';
  `;

  const importDeclarations = importsMatches(nodes);

  for (const [ _, identifier ] of importDeclarations) {

    const inheritsMatches = matcher`
      ${identifier.value.name}(${constructor.name}, $1);
    `;

    const inheritsExpressions = inheritsMatches(nodes);

    if (inheritsExpressions.length > 1) {
      throw new Error('more than one <inherits> declaration');
    }

    if (inheritsExpressions.length === 1) {

      const clazz = inheritsExpressions[0][1].value.name;

      const inheritsExpression = {
        node: inheritsExpressions[0][0]
      };

      const superCallMatches = matcher`
        ${clazz}.call(...$$$);
      `;

      const superCalls = superCallMatches(constructor.node.get('body', 'body'));

      return {
        importDeclarations: importDeclarations.map(m => ({ node: m[0] })),
        superCalls: superCalls.map(m => ({ node: m[0] })),
        clazz,
        inheritsExpression
      };
    }
  }

}

function findConstructors(nodes) {

  const fns = matcher`
    function $1(...$$$) {
      $$$
    }
  `;

  const namedExportFns = matcher`
    export function $1(...$$$) {
      $$$
    }
  `;

  const defaultExportFns = matcher`
    export default function $1(...$$$) {
      $$$
    }
  `;

  return [
    ...fns(nodes),
    ...namedExportFns(nodes).map(
      m => [ m[0].get('declaration'), m[1] ]
    ),
    ...defaultExportFns(nodes).map(
      m => [ m[0].get('declaration'), m[1] ]
    )
  ].map(match => {

    const [ node, identifier ] = match;

    const name = identifier.value.name;

    if (/^[A-Z]/.test(name)) {
      return {
        name,
        node
      };
    }
  }).filter(n => n);
}

function findProtoMethods(constructor, nodes) {

  const names = matcher`
    ${constructor.name}.prototype.$1 = $2;
  `;

  return names(nodes).map(match => {
    const [ node, identifier, member ] = match;

    return {
      name: identifier.value.name,
      member: member.value,
      node
    };
  });
}

function findEmbeddedMethods(constructor) {

  const memberDeclarations = matcher`
    this.$1 = $2;
  `;

  return memberDeclarations(constructor.node.get('body', 'body')).map(match => {
    const [ node, identifier, member ] = match;

    return {
      name: identifier.value.name,
      member: member.value,
      node
    };
  });

  return [];
}