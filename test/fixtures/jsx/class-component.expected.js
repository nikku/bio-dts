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
 */
export class ComponentCls extends Component {
  /**
   * @param { { on: boolean } } props
   */
  constructor(props) {
    super();
  }

  /**
   * I render the component
   */
  render() {
    return <div data-test-id="component-cls">{ this.props.on ? 'ON' : 'OFF' }</div>;
  }
}