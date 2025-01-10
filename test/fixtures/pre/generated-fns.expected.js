
export class CommandInterceptor {
  constructor() { }

  /**
   * Add prototype method for a specific phase of command execution.
   *
   * @return {null}
   */
  canExecute = createHook('canExecute');
}

/**
 * Return interceptor bound hook for the given life-cycle phase.
 *
 * @param {string} lifeCycle
 *
 * @return {(name: string) => any} interceptor method
 */
function createHook(lifeCycle) {

  /**
   * @this {CommandInterceptor}
   *
   * @param {string} name
   *
   * @returns {any}
   */
  const hookFn = () => {
    return null;
  };

  return hookFn;
}