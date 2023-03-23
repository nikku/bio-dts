
class CommandInterceptor {
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
 * @return {(this: CommandInterceptor, ...args: any[]) => any} interceptor method
 */
function createHook(lifeCycle) {
  return () => {
    return null;
  };
}