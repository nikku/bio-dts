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

declare function woop(boop: string): string
declare function woop(event: string, boop: string): string
declare function woop(boop: string, ...yea: any[]): string
declare function woop(event: string, boop: string, ...yea: any[]): string

/**
 * YO!
 *
 * @param event
 * @param callback
 * @param context
 */
export declare function on(event: string, callback: Function, context?: any): void

/**
 * YO!
 *
 * @param event
 * @param priority
 * @param callback
 * @param context
 */
export declare function on(event: string, priority: number, callback: Function, context?: any): void

export declare function woop(boop: string): string
export declare function woop(event: string, boop: string): string
export declare function woop(boop: string, ...yea: any[]): string
export declare function woop(event: string, boop: string, ...yea: any[]): string

/**
 * YO!
 *
 * @param event
 * @param callback
 * @param context
 */
export default function on(event: string, callback: Function, context?: any): void

/**
 * YO!
 *
 * @param event
 * @param priority
 * @param callback
 * @param context
 */
export default function on(event: string, priority: number, callback: Function, context?: any): void

export default function woop(boop: string): string
export default function woop(event: string, boop: string): string
export default function woop(boop: string, ...yea: any[]): string
export default function woop(event: string, boop: string, ...yea: any[]): string