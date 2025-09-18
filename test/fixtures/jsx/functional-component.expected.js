import { React } from 'react';

/**
 * @param { { on: boolean } } props
 */
export function FunctionalComponent(props) {
  return <div data-test-id="functional-component">{ props.on ? 'ON' : 'OFF' }</div>;
}