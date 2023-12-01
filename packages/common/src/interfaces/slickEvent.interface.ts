import type { SlickEventData } from './slickEventData.interface';

export interface SlickEvent<T = any> {
  /**
   * Fires an event notifying all subscribers.
   * @param args Additional data object to be passed to all handlers.
   * @param eventData Optional.
   *      An EventData object to be passed to all handlers.
   *      For DOM events, an existing W3C event object can be passed in.
   * @param scope Optional.
   *      The scope ("this") within which the handler will be executed.
   *      If not specified, the scope will be set to the `Event` instance.
   */
  notify: (args: T, eventData?: SlickEventData | Event | null, scope?: any) => SlickEventData;

  /**
   * Adds an event handler to be called when the event is fired.
   * Event handler will receive two arguments - an `EventData` and the Data
   * object the event was fired with.
   * @param fn {Function} Event handler.
   */
  subscribe: (fn: (e: SlickEventData | Event, data: T) => void) => void;

  /**
   * Removes an event handler added with `subscribe(fn)`.
   * @param fn {Function} Event handler to be removed.
   */
  unsubscribe: (fn?: (e: SlickEventData | Event, data?: any) => void) => void;
}