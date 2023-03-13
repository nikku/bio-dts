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

  traverse(body, function(path) {

    const {
      value
    } = path;

    // filter private members
    if (!isPublic(value)) {
      return replace(path);
    }

    // TODO(nikku): transform illegal typescript methods into override calls

    // TODO(nikku): remove annotations
    //
    // * @typedef
    // * @class
    // * @constructor
    // * @template
    // * @method

    const comments = path.get('comments') || { value: [] };

    for (const key of keys(comments.value || []).reverse()) {

      const comment = comments.get(key);

      const replacements = [];

      const doc = comment.value.value.replace(/\n\s+/g, '\n ');
      const tags = parseJSDoc(doc);

      for (const tag of tags) {
        if (/class|constructor|template|method|typedef/.test(tag.name)) {
          replacements.push([ { start: tag.start - 4, end: tag.end } ]);

          continue;
        }

        if (tag.type) {
          replacements.push([ { start: tag.type.start - 1, end: tag.type.end }, '' ]);
        }

        if (tag.param) {
          replacements.push([ tag.param, tag.param.name ]);
        }
      }

      const newDoc = replacements.slice().reverse().reduce((newDoc, r) => {

        const [ { start, end }, replacement = '' ] = r;

        return replaceJSDoc(newDoc, { start, end }, replacement);
      }, doc);

      // remove entirely, if empty
      if (!newDoc.replace(/[/*\s]/g, '')) {
        replace(comment);
      } else {
        replace(comment, b.commentBlock.from({
          type: 'CommentBlock',
          leading: true,
          value: newDoc
        }));
      }
    }

  });

  for (const [ path, args ] of replacements) {
    path.replace(...args);
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