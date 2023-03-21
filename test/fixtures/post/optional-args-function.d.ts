/**
 * YO!
 *
 * @param {string} event
 * @param {number} [priority]
 * @param {Function} callback
 * @param {any} [context]
 */
declare function on(event: string, priority?: number, callback: Function, context?: any): void;

/**
 * YO!
 *
 * @param {string} event
 * @param {number} [priority]
 * @param {Function} callback
 * @param {any} [context]
 */
export function onExported(event: string, priority?: number, callback: Function, context?: any): void;

/**
 * YO!
 *
 * @param {string} event
 * @param {number} [priority]
 * @param {Function} callback
 * @param {any} [context]
 */
export default function onDefaultExported(event: string, priority?: number, callback: Function, context?: any): void;

declare function woop(event?: string, boop: string, ...yea: any[]): string;

export function waap(event?: string, boop: string, ...yea: any[]): string;