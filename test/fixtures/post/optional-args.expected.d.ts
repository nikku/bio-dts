declare class EventBus {
  constructor();

  /**
   * @param {string}   event
   * @param {Function} callback
   * @param {any}      [context]
   */
  on(event: string, callback: Function, context?: any);

  /**
   * @param {string}   event
   * @param {number}   priority
   * @param {Function} callback
   * @param {any}      [context]
   */
  on(event: string, priority: number, callback: Function, context?: any);
}