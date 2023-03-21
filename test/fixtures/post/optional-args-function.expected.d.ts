/**
 * YO!
 *
 * @param event
 * @param callback
 * @param context
 */
declare function on(event: string, callback: Function, context?: any): void

/**
 * YO!
 *
 * @param event
 * @param priority
 * @param callback
 * @param context
 */
declare function on(event: string, priority: number, callback: Function, context?: any): void

/**
 * YO!
 *
 * @param event
 * @param callback
 * @param context
 */
export function onExported(event: string, callback: Function, context?: any): void;

/**
 * YO!
 *
 * @param event
 * @param priority
 * @param callback
 * @param context
 */
export function onExported(event: string, priority: number, callback: Function, context?: any): void;

/**
 * YO!
 *
 * @param event
 * @param callback
 * @param context
 */
export default function onDefaultExported(event: string, callback: Function, context?: any): void;

/**
 * YO!
 *
 * @param event
 * @param priority
 * @param callback
 * @param context
 */
export default function onDefaultExported(event: string, priority: number, callback: Function, context?: any): void;

declare function woop(boop: string, ...yea: any[]): string
declare function woop(event: string, boop: string, ...yea: any[]): string
export function waap(boop: string, ...yea: any[]): string;
export function waap(event: string, boop: string, ...yea: any[]): string;