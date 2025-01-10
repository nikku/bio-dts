export class CommandInterceptor {
    /**
     * Add prototype method for a specific phase of command execution.
     *
     * @return
     */
    canExecute: (name: string) => any;
}
