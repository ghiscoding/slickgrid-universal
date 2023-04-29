/* eslint-disable @typescript-eslint/no-unused-vars */
import type { EventSubscription } from './types';

export abstract class BasePubSubService {
  /**
   * Method to publish a message
   * @param event The event or channel to publish to.
   * @param data The data to publish on the channel.
   */
  publish<T = any>(_eventName: string | any, _data?: T, _delay?: number): void | boolean | Promise<boolean> {
    throw new Error('BasePubSubService "publish" method must be implemented');
  }

  /**
    * Subscribes to a message channel or message type.
    * @param event The event channel or event data type.
    * @param callback The callback to be invoked when the specified message is published.
    * @return possibly a Subscription
    */
  // eslint-disable-next-line @typescript-eslint/ban-types
  subscribe<T = any>(_eventName: string | Function, _callback: (data: T) => void): EventSubscription | any {
    throw new Error('BasePubSubService "subscribe" method must be implemented');
  }

  /**
    * Subscribes to a custom event message channel or message type.
    * This is similar to the "subscribe" except that the callback receives an event typed as CustomEventInit and the data will be inside its "event.detail"
    * @param event The event channel or event data type.
    * @param callback The callback to be invoked when the specified message is published.
    * @return possibly a Subscription
    */
  // eslint-disable-next-line @typescript-eslint/ban-types
  subscribeEvent?<T = any>(_eventName: string | Function, _callback: (event: CustomEventInit<T>) => void): EventSubscription | any {
    throw new Error('BasePubSubService "subscribeEvent" method must be implemented');
  }

  /**
    * Unsubscribes a message name
    * @param event The event name
    * @return possibly a Subscription
    */
  unsubscribe(_eventName: string, _callback: (event: CustomEventInit) => void): void {
    throw new Error('BasePubSubService "unsubscribe" method must be implemented');
  }

  /** Unsubscribes all subscriptions that currently exists */
  unsubscribeAll(_subscriptions?: EventSubscription[]): void {
    throw new Error('BasePubSubService "unsubscribeAll" method must be implemented');
  }
}
