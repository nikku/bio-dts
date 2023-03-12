import { print } from 'recast';

import { matcher, parse, path } from './util.js';

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

/**
 * @param { { name: string, comments?: any[] } }
 *
 * @return {boolean}
 */
function isPublic(m) {
  const comments = m.comments || [];

  return !m.name.startsWith('_') && !comments.some(c => c.value.includes('@private'));
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
    ...cls.members.filter(
      m => m.member.type === 'FunctionExpression' && isPublic(m)
    ).map(m => {
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
    })
  ];

  const staticMembers = cls.staticMembers.filter(
    m => isPublic(m)
  ).map(m => {

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

  const classes = findConstructors(body);

  for (const cls of classes) {
    const members = cls.members = [
      ...findEmbeddedMethods(cls),
      ...findProtoMethods(cls, body)
    ];

    const staticMembers = cls.staticMembers = [
      ...findStaticMembers(cls, body)
    ];

    const superDeclaration = cls.superDeclaration = findSuperDeclarations(cls, body);

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
      if (m.member.type === 'FunctionExpression' || !isPublic(m)) {
        m.node.replace();
      }
    });

    staticMembers.forEach(m => {
      m.node.replace();
    });

    if (superDeclaration) {
      superDeclaration.importDeclarations.forEach(m => m.node.replace());
      superDeclaration.inheritsExpression.node.replace();
    }
  }

  return print(ast).code;
}

function findSuperDeclarations(cls, nodes) {

  const importsMatches = matcher`
    import $1 from 'inherits-browser';
  `;

  const importDeclarations = importsMatches(nodes);

  for (const [ _, identifier ] of importDeclarations) {

    const inheritsMatches = matcher`
      ${identifier.value.name}(${cls.name}, $1);
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

function findProtoMethods(cls, nodes) {

  const names = matcher`
    ${cls.name}.prototype.$1 = $2;
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

function findEmbeddedMethods(cls) {

  const memberDeclarations = matcher`
    this.$1 = $2;
  `;

  return memberDeclarations(cls.ctor.get('body', 'body')).map(match => {
    const [ node, identifier, member ] = match;

    return {
      name: identifier.value.name,
      member: member.value,
      comments: node.get('comments').value,
      node
    };
  });
}