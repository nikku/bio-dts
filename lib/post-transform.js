import { isArray, isNode, keys, parseDts, path, print } from './util.js';

import {
  builders as b
} from 'ast-types';

import {
  parse as parseJSDoc,
  replace as replaceJSDoc
} from './parsers/jsdoc.js';


/**
 * @param { { name: string, comments?: any[] } }
 *
 * @return {boolean}
 */
function isPublic(m) {

  const name = m?.key?.name;

  if (!name) {
    return true;
  }

  const comments = m?.comments || [];

  return !name.startsWith('_') && !comments.some(c => c.value.includes('@private'));
}

/**
 * @param {string} src
 * @return {string}
 */
export default function transform(src) {

  const ast = parseDts(src);
  const body = path(ast).get('program', 'body');

  const replacements = [];

  function replace(path, ...args) {
    replacements.push([ path, args ]);

    return false;
  }

  function keepCommentParams(commentPath, params) {

    const replacements = [];

    const comment = commentPath.value;

    const doc = comment.value.replace(/\n\s+/g, '\n ');
    const tags = parseJSDoc(doc);

    for (const tag of tags) {

      // remove param not mentioned anymore
      if (tag.name === 'param' && params.every(p => p.name !== tag.param.name)) {
        replacements.push([ { start: tag.start - 4, end: tag.end } ]);

        continue;
      }
    }

    const newDoc = replacements.slice().reverse().reduce((newDoc, r) => {

      const [ { start, end }, replacement = '' ] = r;

      return replaceJSDoc(newDoc, { start, end }, replacement);
    }, doc);

    const builder = {
      'CommentBlock': b.commentBlock,
      'CommentLine': b.commentLine
    }[comment.type];

    return cleanComment(builder.from({
      ...comment,
      value: newDoc
    }));
  }

  function getDocumentedParams(node, params = [], comment = null) {

    if (!comment) {
      return params;
    }

    const doc = comment.value.replace(/\n\s+/g, '\n ');

    // parse known parameters
    // ignore hierarchical (sub-type) params
    const knownParams =
      parseJSDoc(doc)
        .filter(tag => tag.name === 'param' && !tag.param.name.includes('.'))
        .map(tag => tag.param.name);

    if (!knownParams.length) {
      return params;
    }

    let i = 0;
    let j = 0;

    const filteredParams = [];

    while (j < knownParams.length) {

      let expectedName = knownParams[j];
      let param = params[i++];

      if (!param) {
        throw error(node, `documented parameter <${ expectedName }> not found`);
      }

      if (param.name === 'this') {
        filteredParams.push(param);
        continue;
      }

      const actualName = param.argument?.name || param.name;

      if (actualName !== expectedName) {
        throw error(node, `documented parameter <${ expectedName }> differs from actual parameter <${ actualName }>`);
      }

      filteredParams.push(param);
      j++;
    }

    return filteredParams;
  }

  /**
   * Ensure optional args methods are properly escaped
   *
   * @param {import('./util.js').Path} nodePath
   *
   * @return {any[]} replacements
   */
  function fixOptionalArgsMethods(nodePath) {

    const {
      value: node
    } = nodePath;

    const functionKind = getFunctionKind(node);

    if (!functionKind) {
      return;
    }

    const params = functionKind === 'TSFunctionType'
      ? node.typeAnnotation?.typeAnnotation?.parameters
      : node.params;

    const typeParameters = functionKind === 'TSFunctionType'
      ? node.typeAnnotation?.typeAnnotation?.typeParameters
      : node.typeParameters;

    const returnType = functionKind === 'TSFunctionType'
      ? node.typeAnnotation?.typeAnnotation?.typeAnnotation
      : node.returnType;

    const hostPath = getHostPath(nodePath);

    const commentPaths = hostPath.get('comments');

    // last comment is significant
    const commentPath = commentPaths?.value && commentPaths.get(commentPaths.value.length - 1) || { value: null };

    const {
      variations
    } = getDocumentedParams(hostPath.value, params, commentPath.value).slice().reverse().reduce((res, param) => {

      let {
        required,
        variations
      } = res;

      // required before optional
      if (param.optional && required) {
        variations = [
          ...variations.map(v => v.slice()),
          ...variations.map(v => v.slice())
        ];

        variations.forEach((variation, idx) => {

          if (idx < variations.length / 2) {
            variation.push(b.identifier.from({
              ...param,
              optional: false
            }));
          }
        });
      } else {

        if (!param.optional) {
          required = true;
        }

        variations.forEach((variation) => {
          const builder = {
            'RestElement': b.restElement,
            'Identifier': b.identifier
          }[param.type];

          variation.push(builder.from(param));
        });
      }

      return {
        required,
        variations
      };
    }, {
      variations: [
        []
      ],
      required: false
    });

    if (variations.length === 1) {
      return;
    }

    const replacements = variations.slice().reverse().map(variation => {

      const builder = {
        'ClassProperty': b.tsDeclareMethod,
        'TSDeclareFunction': b.tsDeclareFunction,
        'TSDeclareMethod': b.tsDeclareMethod
      }[node.type];

      const hostBuilder = {
        'ExportNamedDeclaration': b.exportNamedDeclaration,
        'ExportDefaultDeclaration': b.exportDefaultDeclaration
      }[hostPath.value.type];

      const variationComments = commentPath.value ? [ keepCommentParams(commentPath, variation) ] : [ ];

      const newNode = builder.from({
        key: node.key,
        params: variation.slice().reverse(),
        id: node.id,
        declare: node.declare || false,
        returnType: returnType ? b.tsTypeAnnotation.from({
          ...returnType
        }) : null,
        comments: hostPath === nodePath ? variationComments : [],
        typeParameters: typeParameters ? b.tsTypeParameterDeclaration.from({
          ...typeParameters
        }) : null
      });

      return (
        hostBuilder
          ? hostBuilder.from({
            ...hostPath.value,
            declaration: newNode,
            comments: variationComments
          })
          : newNode
      );
    });

    replace(hostPath, ...replacements);

    return replacements;
  }


  /**
   * Ensures we don't re-export external declarations
   *
   * @example
   *
   * ```javascript
   * export type Woop = import('./Woop').default;
   *
   * // ===>
   *
   * type Woop = import('./Woop').default;
   * ```
   *
   * @param {import('./util.js').Path} nodePath
   *
   * @return {any[]} replacements
   */
  function fixTypeExport(nodePath) {

    const {
      value: node
    } = nodePath;

    if (
      node.type !== 'ExportNamedDeclaration' ||
      node.declaration?.typeAnnotation?.type !== 'TSImportType'
    ) {
      return;
    }

    replace(nodePath, nodePath.get('declaration').value);
  }

  /**
   * Ensure that only documented method parameters are used.
   *
   * @param {Path} nodePath
   *
   * @return {boolean} true if modified
   */
  function removeUnknownParams(nodePath) {

    const {
      value: node
    } = nodePath;

    const functionKind = getFunctionKind(node);

    if (!functionKind) {
      return;
    }

    const params = functionKind === 'TSFunctionType'
      ? nodePath.get('typeAnnotation', 'typeAnnotation', 'parameters')
      : nodePath.get('params');

    const hostPath = getHostPath(nodePath);

    const commentPaths = hostPath.get('comments');

    // last comment is significant
    const commentPath = commentPaths?.value && commentPaths.get(commentPaths.value.length - 1) || { value: null };

    const knownParams = getDocumentedParams(hostPath.value, params.value, commentPath.value);

    let replaced = false;

    for (const idx in params.value || []) {
      if (!knownParams[idx]) {
        replace(params.get(idx));
        replaced = true;
      }
    }

    return replaced;
  }
  }

  function cleanComment(comment) {

    const replacements = [];

    const doc = comment.value.replace(/\n\s+/g, '\n ');
    const tags = parseJSDoc(doc);

    for (const tag of tags) {

      // remove full line including the non-TS tag
      if (
        /class|constructor|template|method|typedef|property|this/.test(tag.name) ||
        tag.param?.name?.includes('.')
      ) {
        replacements.push([ { start: tag.start - 4, end: tag.end } ]);

        continue;
      }

      if (tag.type) {
        replacements.push([ { start: tag.type.start - 1, end: tag.type.end }, '' ]);
      }

      if (tag.param) {

        // [foo=10] => foo
        replacements.push([ tag.param, tag.param.name ]);
      }
    }

    const newDoc = replacements.slice().reverse().reduce((newDoc, r) => {

      const [ { start, end }, replacement = '' ] = r;

      return replaceJSDoc(newDoc, { start, end }, replacement);
    }, doc);

    // remove entirely, if empty
    if (!newDoc.replace(/[/*\s]/g, '')) {
      return null;
    } else {
      return b.commentBlock.from({
        type: 'CommentBlock',
        leading: true,
        value: newDoc
      });
    }
  }

  /**
   * @param {import('./util.js').Path} nodePath
   */
  function cleanComments(nodePath) {

    // clean JSDoc comments: remove annotation, fixup type parameters
    const comments = nodePath.get('comments') || { value: [] };

    for (const key of keys(comments.value || []).reverse()) {
      const comment = comments.get(key);

      const newComment = cleanComment(comment.value);
      if (newComment) {
        replace(comment, newComment);
      } else {
        replace(comment);
      }
    }
  }

  traverse(body, function(path) {

    const {
      value
    } = path;

    // filter private members
    if (!isPublic(value)) {
      return replace(path);
    }

    if (fixOptionalArgsMethods(path)) {
      return false;
    }

    if (removeUnknownParams(path)) {
      return false;
    }

    if (fixTypeExport(path)) {
      return false;
    }

    cleanComments(path);
  });

  for (const [ path, args ] of replacements) {
    try {
      path.replace(...args);
    } catch (err) {
      console.error('Failed to replace path', path, ...args, err);

      throw error(path.value, 'failed to replace path: ' + err.message);
    }
  }

  return print(ast).code;
}

function traverse(path, cb) {
  const val = path.value;

  if (!isNode(val) && !isArray(val)) {
    return;
  }

  if (cb(path) === false) {
    return;
  }

  for (const key of keys(val).reverse()) {
    if ([ 'loc', 'start', 'end' ].includes(key)) {
      continue;
    }

    traverse(path.get(key), cb);
  }
}


/**
 * @param {any} node
 * @return {'TSDeclareMethod' | 'TSDeclareFunction' | 'TSFunctionType' | null}
 */
function getFunctionKind(node) {

  if (
    node.type === 'TSDeclareMethod'
  ) {
    return 'TSDeclareMethod';
  }

  if (node.type === 'TSDeclareFunction') {
    return 'TSDeclareFunction';
  }

  if (
    node.typeAnnotation?.typeAnnotation?.type === 'TSFunctionType'
  ) {
    return 'TSFunctionType';
  }

  return null;
}

/**
 * Return host path for node (with attached comments).
 *
 * @param {Path} nodePath
 *
 * @return {Path}
 */
function getHostPath(nodePath) {
  return [ 'ExportDefaultDeclaration', 'ExportNamedDeclaration' ].includes(nodePath.parentPath.value.type)
    ? nodePath.parentPath
    : nodePath;
}

/**
 * @param {Node} node
 *
 * @return {string}
 */
function error(node, message) {

  const {
    loc: {
      start
    }
  } = node;

  const loc = `[line ${start.line + 1}, column ${start.column + 1}]`;

  return new Error(`${message} ${loc}`);
}