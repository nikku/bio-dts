import { matcher, parse, path, print } from './util.js';

import { SourceMapConsumer, SourceMapGenerator } from '@jridgewell/source-map';

/**
 * @template T
 * @typedef { import('./util.js').Path<T> } Path
 */

/**
 * @typedef { import('ast-types/lib/gen/kinds').PrintableKind } WithLocation
 */

/**
 * @typedef { import('./util.js').ParseOptions } ParseOptions
 *
 * @typedef { { jsx?: boolean } & ParseOptions } TransformOptions
 */


/**
 * @typedef { import('recast').types.namedTypes.ClassMethod } ClassMethod
 * @typedef { import('recast').types.namedTypes.ClassDeclaration } ClassDeclaration
 */

/**
 * @typedef { import('ast-types').ASTNode } ASTNode
 */

import {
  parse as parseJSDoc
} from './parsers/jsdoc.js';

import {
  builders as b
} from 'ast-types';

function superCall() {
  return b.expressionStatement.from({
    expression: b.callExpression.from({
      callee: b.super(),
      arguments: []
    })
  });
}

/**
 * @return { ClassMethod }
 */
function clazzConstructor(cls, comments) {
  const constructor = cls.ctor.value;

  return b.classMethod.from({
    static: false,
    key: b.identifier.from({
      name: 'constructor',
      loc: cls.identifier.loc
    }),
    kind: 'constructor',
    params: constructor.params,
    body: constructor.body,
    comments,
    loc: constructor.loc
  });
}

/**
 * @param { any } cls
 * @param { ClassMethod } ctor
 *
 * @return { ClassDeclaration }
 */
function clazzDefinition(cls, ctor) {

  const members = [
    ctor,
    ...cls.members.filter(m => m.source === 'prototype').map(m => {

      // class method
      if (m.member.type === 'FunctionExpression') {
        return b.classMethod.from({
          static: false,
          key: m.identifier,
          kind: 'method',
          params: m.member.params,
          body: m.member.body,
          comments: m.comments || null,
          loc: m.member.loc
        });
      }

      // save to transform into class property
      return b.classProperty.from({
        static: false,
        key: m.identifier,
        value: m.member,
        comments: m.comments || null,
        loc: m.member.loc
      });
    })
  ];

  const staticMembers = cls.staticMembers.map(m => {

    if (m.member.type === 'FunctionExpression') {
      return b.classMethod.from({
        static: true,
        key: m.identifier,
        kind: 'method',
        params: m.member.params,
        body: m.member.body,
        comments: m.comments || null,
        loc: m.member.loc
      });
    }

    return b.classProperty.from({
      static: true,
      key: m.identifier,
      value: m.member,
      comments: m.comments || null,
      loc: m.member.loc
    });
  });

  return b.classDeclaration.from({
    id: cls.identifier,
    superClass: cls.superDeclaration ? cls.superDeclaration.clazz : null,
    body: b.classBody.from({
      body: [
        ...members,
        ...staticMembers
      ]
    }),
    loc: cls.node.value.loc
  });
}

function splitComment(cls) {

  const node = cls.node.value;

  const [ comment ] = node.comments?.slice(-1) || [];

  const additionalComments = node.comments?.slice(0, -1) || [];

  const [ intro, ...rest ] = comment?.value?.split(/\* @param/) || [];

  return {
    ctorComments: rest.length ? [
      b.commentBlock.from({
        leading: true,
        trailing: false,
        value: '*\n * @param' + rest.join('* @param'),
        loc: comment.loc
      })
    ] : [],
    additionalComments: [
      ...additionalComments,
      ...(
        intro ? [
          b.commentBlock.from({
            leading: true,
            value: intro,
            loc: comment.loc
          })
        ] : []
      )
    ]
  };
}

/**
 * @param { string } src
 * @param { TransformOptions } [transformOptions]
 *
 * @return { import('./util.js').PrintResult }
 */
export default function transform(src, transformOptions = {}) {

  const {
    jsx,
    ...parseOptions
  } = transformOptions;

  /**
   * @type { ASTNode }
   */
  const ast = parse(src, transformOptions);

  /**
   * @type {Path<ASTNode[]>}
   */
  const body = path(ast).get('program', 'body');

  const inheritsImports = findInheritsImports(body);

  // query
  const classes = findConstructors(body).map(cls => {
    return {
      ...cls,

      members: [
        ...findEmbeddedMembers(cls),
        ...findProtoMembers(cls, body)
      ],

      staticMembers: [
        ...findStaticMembers(cls, body)
      ],

      superDeclaration: findSuperDeclarations(cls, body, inheritsImports)
    };
  });

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

  const {
    code,
    map
  } = print(ast, parseOptions);

  if (!map) {
    return {
      code
    };
  } else {

    // source maps are broken through function -> class transformation
    // we have to manually fix them
    const generatedAst = parse(code, transformOptions);

    return {
      code,
      map: fixSourceMap(generatedAst, map, classes)
    };
  }
}


/**
 * @param {ASTNode} generatedAst
 * @param {any} map
 * @param {any} originalClasses
 *
 * @return {any} fixed map
 */
function fixSourceMap(generatedAst, map, originalClasses) {

  /**
   * @type {Path<ASTNode[]>}
   */
  const body = path(generatedAst).get('program', 'body');

  const consumer = new SourceMapConsumer(map);

  const source = consumer.sources[0];

  const generator = SourceMapGenerator.fromSourceMap(consumer);

  for (const originalCls of originalClasses) {

    const clsName = originalCls.identifier.name;

    // add mappings for classes and their constructors
    // back to the original function
    const generatedCls = findClass(body, clsName);

    const generatedCtor = findClassCtor(generatedCls.clsDeclaration);

    // add mapping from class constructor to original fn
    generator.addMapping({
      generated: {
        line: generatedCtor.value.loc.start.line,
        column: generatedCtor.value.loc.start.column,
      },
      name: `${clsName} constructor`,
      source,
      original: {
        line: originalCls.loc.start.line,
        column: originalCls.loc.start.column
      }
    });

    // add mapping from class to original fn
    generator.addMapping({
      generated: {
        line: generatedCls.node.value.loc.start.line,
        column: generatedCls.node.value.loc.start.column,
      },
      name: `${clsName} class`,
      source,
      original: {
        line: originalCls.loc.start.line,
        column: originalCls.loc.start.column
      }
    });

    // add mapping for static members
    for (const originalMember of originalCls.staticMembers) {

      const name = originalMember.identifier.name;

      const generatedMember = findStaticMember(generatedCls.clsDeclaration, name);

      // add mapping from member to original
      generator.addMapping({
        generated: {
          line: generatedMember.value.loc.start.line,
          column: generatedMember.value.loc.start.column,
        },
        name: `${clsName}#${name}`,
        source,
        original: {
          line: originalMember.loc.start.line,
          column: originalMember.loc.start.column
        }
      });
    }
  }


  return generator.toJSON();
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

      const clazz = inheritsExpressions[0][1].value;

      const inheritsExpression = {
        node: inheritsExpressions[0][0]
      };

      const superCallMatches = matcher`
        ${clazz.name}.call($$$);
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

/**
 * @param {Path<ASTNode[]>} nodes
 *
 * @return { {
 *   identifier: any,
 *   ctor: any,
 *   node: any,
 *   name: string,
 *   loc: any
 * }[] }
 */
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

    // a class component
    //
    // * must start with upper letter
    // * must not be tagged as @function
    // * must not return something
    //
    if (isClassName(name) && !isFunctionTagged(node) && !isReturning(ctor)) {

      return {
        identifier: identifier.value,
        name,
        ctor,
        node,
        loc: node.value.loc
      };
    }
  }).filter(n => n);
}

/**
 * @param { Path<ASTNode> } clsNode
 *
 * @return { Path<ASTNode & WithLocation> }
 */
function findClassCtor(clsNode) {

  const ctors = clsNode.get('body', 'body').filter(node => {
    const value = node.value;

    return value.type === 'ClassMethod' && value.key?.name === 'constructor';
  });

  if (!ctors.length) {
    throw new Error('no constructor');
  }

  return ctors[0];
}

/**
 * @param { Path<ASTNode> } clsNode
 * @param { string } name
 *
 * @return { Path<ASTNode & WithLocation> }> }
 */
function findStaticMember(clsNode, name) {

  const members = clsNode.get('body', 'body').filter(node => {
    const value = node.value;

    return [ 'ClassProperty', 'ClassMethod' ].includes(value.type) && value.static && value.key?.name === name;
  });

  if (!members.length) {
    throw new Error(`no member ${name}`);
  }

  return members[0];
}

/**
 * @param { Path<ASTNode[]> } nodes
 * @param { string } name
 *
 * @return { {
 *   clsDeclaration: any,
 *   node: any
 * } }
 */
function findClass(nodes, name) {

  const cls = matcher`
    class ${name} extends $$$ {
      $$$
    }
  `;

  const namedExportCls = matcher`
    export class ${name} extends $$$ {
      $$$
    }
  `;

  const defaultExportCls = matcher`
    export default class ${name} extends $$$ {
      $$$
    }
  `;

  const matches = [
    ...cls(nodes),
    ...namedExportCls(nodes).map(
      m => [ m[0].get('declaration'), m[0] ]
    ),
    ...defaultExportCls(nodes).map(
      m => [ m[0].get('declaration'), m[0] ]
    )
  ].map(match => {

    const [ clsDeclaration, node = clsDeclaration ] = match;

    return {
      clsDeclaration,
      node
    };
  });

  if (!matches.length) {
    throw new Error(`not found: class ${name}`);
  }

  return matches[0];
}

/**
 * @param { string } name
 *
 * @return {boolean}
 */
function isClassName(name) {

  return /^[A-Z]/.test(name);
}

/**
 * @param { Path<any> } nodePath
 *
 * @return { boolean }
 */
function isFunctionTagged(nodePath) {
  const commentPaths = nodePath.get('comments');

  // last comment is significant
  const commentPath = commentPaths?.value && commentPaths.get(commentPaths.value.length - 1) || { value: null };

  const doc = commentPath?.value?.value?.replace(/\n\s+/g, '\n ') || '';

  if (!doc) {
    return false;
  }

  const functionTagged = parseJSDoc(doc).some(tag => tag.name === 'function');

  return functionTagged;
}

/**
 * @param { Path<any> } ctorPath
 *
 * @return { boolean }
 */
function isReturning(ctorPath) {

  const returnStatements = matcher`
    return $1;
  `;

  return returnStatements(ctorPath.get('body', 'body')).length > 0;
}

/**
 * @param {any} cls
 * @param {Path<ASTNode[]>} nodes
 */
function findStaticMembers(cls, nodes) {

  const names = matcher`
    ${cls.name}.$1 = $2;
  `;

  return names(nodes).map(match => {
    const [ node, identifier, member ] = match;

    return {
      identifier: identifier.value,
      member: member.value,
      comments: node.get('comments').value,
      node,
      loc: node.value.loc
    };
  });
}

/**
 * @param {any} cls
 * @param {Path<ASTNode[]>} nodes
 */
function findProtoMembers(cls, nodes) {

  const names = matcher`
    ${cls.name}.prototype.$1 = $2;
  `;

  return names(nodes).map(match => {
    const [ node, identifier, member ] = match;

    return {
      identifier: identifier.value,
      member: member.value,
      comments: node.get('comments').value,
      node,
      source: 'prototype'
    };
  });
}

/**
 * @param {any} cls
 */
function findEmbeddedMembers(cls) {

  const memberDeclarations = matcher`
    this.$1 = $2;
  `;

  return memberDeclarations(cls.ctor.get('body', 'body')).map(match => {
    const [ node, identifier, member ] = match;

    return {
      identifier: identifier.value,
      member: member.value,
      comments: node.get('comments').value,
      node,
      source: 'constructor'
    };
  });
}