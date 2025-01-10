/**
 *
 * Some method description, o yea!
 *
 * @param event
 */
declare function on(event?: number): void

/**
 *
 * Some method description, o yea!
 *
 * @param event
 * @param obj
 */
declare function on(event: string, obj?: any): void

/**
 * Some other method description, o yea!
 *
 * @param obj
 */
declare function on(obj: any): void

/**
 *
 * @param a
 * @return
 */
declare function ret(a: string): string

/**
 *
 * @return
 */
declare function ret<Y extends boolean>(): Y

/**
 * @param c
 * @return
 */
declare function ret<X>(c: boolean): [ string, { foo: 'bar' }, X ]

/**
 *
 * Some method description, o yea!
 *
 * @param event
 * @param obj
 */
export function exportOn(event: string, obj?: any): void;

/**
 * Some other method description, o yea!
 *
 * @param obj
 */
export function exportOn(obj: any): void;