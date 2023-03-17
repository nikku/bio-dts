declare class EventBus {
  constructor();

  /**
   * Good things with events.
   *
   * @param event
   * @param callback
   * @param context
   */
  on(event: string, callback: Function, context?: any): void;

  /**
   * Good things with events.
   *
   * @param event
   * @param priority
   * @param callback
   * @param context
   */
  on(event: string, priority: number, callback: Function, context?: any): void;
}
