import type { EventSubscription } from './eventSubscription.interface.js';

export interface BasePubSubService {
  /**
   * Method to publish a message
   * @param event The event or channel to publish to.
   * @param data The data to publish on the channel.
   * @param {Number} delay - optional argument to delay the publish event
   * @param {Function} externalizeEventCallback - user can optionally retrieve the CustomEvent used in the PubSub for its own usage via a callback (called just before the event dispatch)
   */
  publish<T = any>(
    _eventName: string | any,
    _data?: T,
    _delay?: number,
    externalizeEventCallback?: (e: Event) => void
  ): void | boolean | Promise<boolean>;

  /**
   * Subscribes to a message channel or message type.
   * @param event The event channel or event data type.
   * @param callback The callback to be invoked when the specified message is published.
   * @return possibly a Subscription
   */
  subscribe<T = any>(_eventName: string | string[] | Function, _callback: (data: T) => void): EventSubscription | any;

  /**
   * Subscribes to a custom event message channel or message type.
   * This is similar to the "subscribe" except that the callback receives an event typed as CustomEventInit and the data will be inside its "event.detail"
   * @param event The event channel or event data type.
   * @param callback The callback to be invoked when the specified message is published.
   * @return possibly a Subscription
   */
  subscribeEvent?<T = any>(
    _eventName: string | Function,
    _callback: (event: CustomEventInit<T>) => void
  ): EventSubscription | any;

  /**
   * Unsubscribes a message name
   * @param event The event name
   * @return possibly a Subscription
   */
  unsubscribe(_eventName: string, _callback: (event: CustomEventInit) => void): void;

  /** Unsubscribes all subscriptions that currently exists */
  unsubscribeAll(_subscriptions?: EventSubscription[]): void;
}
