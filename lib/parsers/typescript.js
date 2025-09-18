import { parser } from 'recast/parsers/babel.js';
import getBabelOptions from 'recast/parsers/_babel_options.js';

/**
 * @typedef { import('recast/parsers/_babel_options.js').Overrides } Overrides
 *
 * @typedef { import('@babel/parser').ParserPlugin } ParserPlugin
 *
 * @typedef { { jsx: boolean } } ParseOptions
 */

/**
 * @param { string } source
 * @param { ParserPlugin[] } plugins
 * @param { Overrides } [options]
 *
 * @return { import('@babel/types').File }
 */
function _parse(source, plugins, options) {
  const babelOptions = getBabelOptions.default(options);

  for (const plugin of plugins) {
    babelOptions.plugins.push(plugin);
  }

  return parser.parse(source, babelOptions);
}

/**
 * @param { string } source
 * @param { Overrides } [options]
 *
 * @return { import('@babel/types').File }
 */
export function js(source, options) {
  return _parse(source, [ 'typescript' ], options);
}

/**
 * @param { string } source
 * @param { Overrides } [options]
 *
 * @return { import('@babel/types').File }
 */
export function jsx(source, options) {
  return _parse(source, [ 'typescript', 'jsx' ], options);
}

/**
 * @param { string } source
 * @param { Overrides } [options]
 *
 * @return { import('@babel/types').File }
 */
export function dts(source, options) {
  return _parse(source, [ [ 'typescript', { dts: true } ] ], options);
}