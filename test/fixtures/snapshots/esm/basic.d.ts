export class Greeter extends BaseGreeter {
    /**
     * @param name
     */
    constructor(name: Name);
    name: string;
    /**
     * @param greeting
     * @return
     */
    greet(greeting?: Name): Name;
}

type Name = import("./Types.js").Name;
import BaseGreeter from './base-greeter.js';
