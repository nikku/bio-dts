import { matcher, parse, path, print } from './util.js';

import {
  builders as b
} from 'ast-types';

function superCall() {
  return b.expressionStatement.from({
    'type': 'ExpressionStatement',
    'expression': {
      'type': 'CallExpression',
      'callee': {
        'type': 'Super'
      },
      'arguments': []
    }
  });
}

function clazzConstructor(cls, comments) {
  const constructor = cls.ctor.value;

  return b.classMethod.from({
    'type': 'ClassMethod',
    'static': false,
    'key': {
      'type': 'Identifier',
      'name': 'constructor'
    },
    'kind': 'constructor',
    'params': constructor.params,
    'body': constructor.body,
    'comments': comments
  });
}

function clazzDefinition(cls, ctor) {

  const members = [
    ctor,
    ...cls.members.filter(m => m.source === 'prototype').map(m => {

      // class method
      if (m.member.type === 'FunctionExpression') {
        return {
          'type': 'ClassMethod',
          'static': false,
          'key': {
            'type': 'Identifier',
            'name': m.name
          },
          'kind': 'method',
          'params': m.member.params,
          'body': m.member.body,
          'comments': m.comments
        };
      }

      // save to transform into class property
      return {
        'type': 'ClassProperty',
        'static': false,
        'key': {
          'type': 'Identifier',
          'name': m.name
        },
        'value': m.member,
        'comments': m.comments
      };
    })
  ];

  const staticMembers = cls.staticMembers.map(m => {

    if (m.member.type === 'FunctionExpression') {
      return {
        'type': 'ClassMethod',
        'static': true,
        'key': {
          'type': 'Identifier',
          'name': m.name
        },
        'kind': 'method',
        'params': m.member.params,
        'body': m.member.body,
        'comments': m.comments
      };
    }

    return {
      'type': 'ClassProperty',
      'static': true,
      'key': {
        'type': 'Identifier',
        'name': m.name
      },
      'value': m.member,
      'comments': m.comments
    };
  });

  return b.classDeclaration.from({
    'type': 'ClassDeclaration',
    'id': {
      'type': 'Identifier',
      'name': cls.name
    },
    'superClass': cls.superDeclaration ? {
      'type': 'Identifier',
      'name': cls.superDeclaration.clazz
    } : null,
    'body': {
      'type': 'ClassBody',
      'body': [
        ...members,
        ...staticMembers
      ]
    }
  });
}

function splitComment(cls) {

  const node = cls.node.value;

  const [ comment ] = node.comments?.slice(-1) || [];

  const additionalComments = node.comments?.slice(0, -1) || [];

  const [ intro, ...rest ] = comment?.value?.split(/\* @param/) || [];

  return {
    ctorComments: rest.length ? [ {
      leading: true,
      trailing: false,
      type: 'CommentBlock',
      value: '*\n * @param' + rest.join('* @param'),
    } ] : [],
    additionalComments: [
      ...additionalComments,
      ...(
        intro ? [
          {
            leading: true,
            type: 'CommentBlock',
            value: intro
          }
        ] : []
      )
    ]
  };
}

/**
 * @param {string} src
 * @return {string}
 */
export default function transform(src) {

  const ast = parse(src);
  const body = path(ast).get('program', 'body');

  const inheritsImports = findInheritsImports(body);

  const classes = findConstructors(body);

  // query
  for (const cls of classes) {
    cls.members = [
      ...findEmbeddedMembers(cls),
      ...findProtoMembers(cls, body)
    ];

    cls.staticMembers = [
      ...findStaticMembers(cls, body)
    ];

    cls.superDeclaration = findSuperDeclarations(cls, body, inheritsImports);
  }

  // transform
  for (const cls of classes) {
    const {
      members,
      staticMembers,
      superDeclaration
    } = cls;

    if (superDeclaration) {
      cls.ctor.get('body', 'body').unshift(superCall());

      superDeclaration.superCalls.forEach(m => m.node.replace());
    }

    const {
      ctorComments,
      additionalComments
    } = splitComment(cls);

    const ctor = clazzConstructor(cls, ctorComments);

    cls.ctor.replace(clazzDefinition(cls, ctor));
    cls.node.get('comments').replace(additionalComments);

    members.forEach(m => {
      if (m.source === 'prototype') {
        m.node.replace();
      }
    });

    staticMembers.forEach(m => {
      m.node.replace();
    });

    if (superDeclaration) {
      superDeclaration.inheritsExpression.node.replace();
    }
  }

  inheritsImports.forEach(m => m.node.replace());

  return print(ast).code;
}

function findInheritsImports(nodes) {
  const importsMatches = matcher`
    import $1 from 'inherits-browser';
  `;

  return importsMatches(nodes).map(m => {
    return {
      node: m[0],
      name: m[1].value.name
    };
  });
}

function findSuperDeclarations(cls, nodes, importDeclarations) {

  for (const { name: inheritsName } of importDeclarations) {

    const inheritsMatches = matcher`
      ${inheritsName}(${cls.name}, $1);
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
        ${clazz}.call($$$);
      `;

      const superCalls = superCallMatches(cls.ctor.get('body', 'body'));

      return {
        superCalls: superCalls.map(m => ({ node: m[0] })),
        clazz,
        inheritsExpression
      };
    }
  }

}

function findConstructors(nodes) {

  const fns = matcher`
    function $1($$$) {
      $$$
    }
  `;

  const namedExportFns = matcher`
    export function $1($$$) {
      $$$
    }
  `;

  const defaultExportFns = matcher`
    export default function $1($$$) {
      $$$
    }
  `;

  return [
    ...fns(nodes),
    ...namedExportFns(nodes).map(
      m => [ m[0].get('declaration'), m[1], m[0] ]
    ),
    ...defaultExportFns(nodes).map(
      m => [ m[0].get('declaration'), m[1], m[0] ]
    )
  ].map(match => {

    const [ ctor, identifier, node = ctor ] = match;

    const name = identifier.value.name;

    if (/^[A-Z]/.test(name)) {
      return {
        name,
        ctor,
        node
      };
    }
  }).filter(n => n);
}

function findStaticMembers(cls, nodes) {

  const names = matcher`
    ${cls.name}.$1 = $2;
  `;

  return names(nodes).map(match => {
    const [ node, identifier, member ] = match;

    return {
      name: identifier.value.name,
      member: member.value,
      comments: node.get('comments').value,
      node
    };
  });
}

function findProtoMembers(cls, nodes) {

  const names = matcher`
    ${cls.name}.prototype.$1 = $2;
  `;

  return names(nodes).map(match => {
    const [ node, identifier, member ] = match;

    return {
      name: identifier.value.name,
      member: member.value,
      comments: node.get('comments').value,
      node,
      source: 'prototype'
    };
  });
}

function findEmbeddedMembers(cls) {

  const memberDeclarations = matcher`
    this.$1 = $2;
  `;

  return memberDeclarations(cls.ctor.get('body', 'body')).map(match => {
    const [ node, identifier, member ] = match;

    return {
      name: identifier.value.name,
      member: member.value,
      comments: node.get('comments').value,
      node,
      source: 'constructor'
    };
  });
}