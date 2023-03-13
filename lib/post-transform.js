import { print } from 'recast';

import { isArray, isNode, keys, parse, path } from './util.js';


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

  const ast = parse(src);
  const body = path(ast).get('program', 'body');

  traverse(body, function(path) {

    // filter private members
    if (!isPublic(path.value)) {
      path.replace();
    }

    // TODO(nikku): transform illegal typescript methods into override calls
  });

  return print(ast).code;
}

function traverse(path, cb) {
  cb(path);

  if (path.parentPath) {
    const val = path.value;

    if (!isNode(val) && !isArray(val)) {
      return;
    }

    for (const key of keys(val).reverse()) {
      if ([ 'loc', 'start', 'end' ].includes(key)) {
        continue;
      }

      traverse(path.get(key), cb);
    }
  }
}