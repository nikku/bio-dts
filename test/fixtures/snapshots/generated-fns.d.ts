/**
 * Return interceptor bound hook for the given life-cycle phase.
 *
 * @param lifeCycle
 *
 * @return interceptor method
 */
declare function createHook(lifeCycle: string): (name: string) => any;
/**
 * Return interceptor bound hook for the given life-cycle phase.
 *
 * @param lifeCycle
 *
 * @return interceptor method
 */
declare function createHook(lifeCycle: string): (name: string) => any;
declare class CommandInterceptor {
    /**
     * Add prototype method for a specific phase of command execution.
     *
     * @return
     */
    canExecute: (name: string) => any;
}
