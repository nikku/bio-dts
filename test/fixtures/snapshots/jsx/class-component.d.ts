/**
 * A wonderful class that powers my app.
 *
 *
 */
export class ComponentCls extends Component<{
    on: boolean;
}, any> {
    /**
     * @param props
     */
    constructor(props: {
        on: boolean;
    });
    /**
     * I render the component
     */
    render(): any;
}
declare class Component<P = {}, S = {}> {
}
export {};
