import inherits from 'inherits-browser';

/**
 * @template [P={}]
 * @template [S={}]
 */
class Component { }

/**
 * A wonderful class that powers my app.
 *
 * @extends { Component<{ on: boolean }> }
 *
 * @param { { on: boolean } } props
 */
export function ComponentCls(props) {
  Component.call(this, props);
}

inherits(ComponentCls, Component);

/**
 * I render the component
 */
ComponentCls.prototype.render = function() {
  return <div data-test-id="component-cls">{ this.props.on ? 'ON' : 'OFF' }</div>;
};