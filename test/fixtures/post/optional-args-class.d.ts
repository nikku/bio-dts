declare class EventBus {
  constructor();

  /**
   * Good things with events.
   *
   * @param {string} event
   * @param {number} [priority]
   * @param {Function} callback
   * @param {any} [context]
   */
  on(event: string, priority?: number, callback: Function, context?: any) : void;
}
