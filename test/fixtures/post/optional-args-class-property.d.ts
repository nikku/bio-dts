export default class CommandInterceptor {

  /**
   * Add a <canExecute> phase of command interceptor.
   *
   * @param priority
   * @param handlerFn
   */
  canExecute: (this: CommandInterceptor, priority?: number, handlerFn: Function) => void;
}