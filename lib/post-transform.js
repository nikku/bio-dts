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

    const fnDeclaration = (
      node.type === 'TSDeclareMethod' ||
      node.type === 'TSDeclareFunction'
    );

    const fnDefinition = (
      node?.typeAnnotation?.typeAnnotation?.type === 'TSFunctionType'
    );

    if (!fnDeclaration && !fnDefinition) {
      return;
    }

    const params = fnDeclaration
      ? node.params
      : node?.typeAnnotation?.typeAnnotation?.parameters;

    const returnType = fnDeclaration
      ? node.returnType
      : node?.typeAnnotation?.typeAnnotation?.typeAnnotation;

    const hostPath = (
      [ 'ExportDefaultDeclaration', 'ExportNamedDeclaration' ].includes(nodePath.parentPath.value.type)
        ? nodePath.parentPath
        : nodePath
    );

    const {
      variations
    } = params.slice().reverse().reduce((res, param) => {

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

    const commentPaths = hostPath.get('comments');

    // last comment is significant
    const commentPath = commentPaths?.value && commentPaths.get(commentPaths.value.length - 1) || { value: null };

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
        comments: hostPath === nodePath ? variationComments : []
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


  function cleanComment(comment) {

    const replacements = [];

    const doc = comment.value.replace(/\n\s+/g, '\n ');
    const tags = parseJSDoc(doc);

    for (const tag of tags) {

      // remove full line including the non-TS tag
      if (/class|constructor|template|method|typedef|property/.test(tag.name)) {
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

    cleanComments(path);
  });

  for (const [ path, args ] of replacements) {
    try {
      path.replace(...args);
    } catch (err) {
      console.error('Failed to replace path', path, ...args);

      throw err;
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