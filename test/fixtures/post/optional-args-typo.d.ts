/**
 * Gets the the closure for all selected elements,
 * their enclosed children and connections.
 *
 * @param {Base[]} elements
 * @param {boolean} [isTopLevel=true]
 * @param {Object} [existingClosure]
 *
 * @return {Object} newClosure
 */
export function getClosure(elements: Base[], isTopLevel?: boolean, closure: any): any;