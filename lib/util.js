import { parse as recastParse, print as recastPrint } from 'recast';
import { Path as PathConstructor } from 'ast-types';

/**
 * @typedef { {
 *   get(...any) => any,
 *   value: any
 * } } Path
 */

import * as typescriptParser from './parsers/typescript.js';
import * as typescriptDtsParser from './parsers/typescript-dts.js';

const DBG = /match/.test(process?.env?.LOG_DEBUG);

const formatOptions = {
  useTabs: false,
  reuseWhitespace: false,
  tabWidth: 2,
  quote: 'single'
};

/**
 * Return numeric or string keys of the given object.
 *
 * @param {any} obj
 * @return {(string|number)[]}
 */
export function keys(obj) {
  return Object.keys(obj).map(k => {
    const n = parseInt(k, 10);

    return isNaN(n) ? k : n;
  });
}

/**
 * @param {any} arr
 *
 * @return {boolean}
 */
export function isArray(arr) {
  return Array.isArray(arr);
}

export function isNode(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

export function hasProperty(obj, property) {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

/**
 * @param {string} code
 *
 * @return {any}
 */
export function parse(code) {
  return recastParse(code, {
    parser: typescriptParser,
    ...formatOptions
  });
}

export function parseDts(code) {
  return recastParse(code, {
    parser: typescriptDtsParser,
    ...formatOptions
  });
}

export function print(node) {
  return recastPrint(node, formatOptions);
}

/**
 * @param {any} node
 *
 * @return {Path}
 */
export function path(node) {
  return new PathConstructor(node);
}

/**
 * @param {string[]} strings
 * @param {...any} args
 *
 * @return { (node) => [][] }
 */
export function matcher(strings, ...args) {

  const code = strings.reduce((code, str, i) => {

    code += str;

    if (args[i]) {
      code += args[i];
    }

    return code;
  }, '');

  const ast = parse(code, {
    parser: typescriptParser
  });

  const body = path(ast).get('program', 'body');

  if (body.value.length !== 1) {
    throw new Error(`${ code } is more than one statement!`);
  }

  const expr = body.get(0);

  /**
   * Match for wildcards:
   *
   *   - block statement with a single $$$
   *   - expression statement with $$$
   *   - identifier $$$
   *   - wrapped as list
   *
   * @param {any} node
   *
   * @return {boolean}
   */
  function wildcard(node) {

    if (isArray(node) && node.length === 1) {
      node = node[0];
    }

    if (node && node.type === 'ExpressionStatement') {
      node = node.expression;
    }

    if (node && node.type === 'Identifier' && node.name === '$$$') {
      return true;
    }

  }

  /**
   * Matches ${IDENTIFIER} single node.
   *
   * @param {any} node
   *
   * @return {any|null}
   */
  function ident(node) {
    if (node.type === 'Identifier' && /^\$.+/.test(node.name)) {
      return node.name.substring(1);
    }

    return null;
  }

  /**
   * Matches $${IDENTIFIER} many nodes:
   *
   *   - block statement with a single $${IDENT}
   *   - expression statement with $${IDENT}
   *   - identifier $${IDENT}
   *   - wrapped as list
   *
   * @param {any} node
   *
   * @return {any|null}
   */
  function anyIdent(node) {

    if (isArray(node) && node.length === 1) {
      node = node[0];
    }

    if (node && node.type === 'ExpressionStatement') {
      node = node.expression;
    }

    if (node && node.type === 'Identifier' && /^\$\$.+/.test(node.name)) {
      return node.name.substring(2);
    }

    return null;
  }

  /**
   * @param {Path} node
   * @param {Path} expectedNode
   * @param {Path[]} results
   *
   * @return {Path[] || null}
   */
  function matchNode(node, expectedNode, results = []) {

    if (!node.value) {
      DBG && console.log('BAIL no value');
      return;
    }

    const id = ident(expectedNode.value);

    if (id) {
      results[id] = node;

      return results;
    }

    for (const key of keys(expectedNode.value)) {
      if ([ 'loc', 'start', 'end' ].includes(key)) {
        continue;
      }

      if (!hasProperty(node.value, key)) {
        DBG && console.log('BAIL no property', key);
        return;
      }

      const expectedVal = expectedNode.get(key);
      const nodeVal = node.get(key);

      if (wildcard(expectedVal.value)) {
        continue;
      }

      const id = anyIdent(expectedVal.value);

      if (id) {
        results[id] = nodeVal;
        continue;
      }

      if (isArray(expectedVal.value)) {
        if (
          expectedVal.value.some((el, idx) => {
            return !matchNode(nodeVal.get(idx), expectedVal.get(idx), results);
          })
        ) {
          DBG && console.log('BAIL no array match', key);
          return;
        }
      } else
      if (isNode(expectedVal.value)) {
        if (!matchNode(nodeVal, expectedVal, results)) {
          DBG && console.log('BAIL no match', key);
          return;
        }
      } else {
        if (nodeVal.value !== expectedVal.value) {
          DBG && console.log('BAIL no primitive match', key);
          return;
        }
      }
    }

    return results;
  }

  return function match(nodes) {
    const matches = [];

    for (const key of keys(nodes.value)) {
      const node = nodes.get(key);
      const matched = matchNode(node, expr);

      if (matched) {
        matches.push([ node, ...matched.slice(1) ]);
      }
    }

    return matches;
  };
}