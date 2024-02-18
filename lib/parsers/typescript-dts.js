import { parser } from 'recast/parsers/babel.js';
import getBabelOptions from 'recast/parsers/_babel_options.js';

/**
 * @typedef { import('recast/parsers/_babel_options.js').Overrides } Overrides
 */

/**
 * @param {string} source
 * @param {Overrides} [options]
 *
 * @return {import('@babel/types').File}
 */
export function parse(source, options) {

  const babelOptions = getBabelOptions.default(options);
  babelOptions.plugins.push([ 'typescript', { dts: true } ]);
  return parser.parse(source, babelOptions);
}