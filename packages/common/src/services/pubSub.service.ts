/* eslint-disable @typescript-eslint/no-unused-vars */
import { Subscription } from '../interfaces/index';

export abstract class PubSubService {
  /**
   * Method to publish a message
   * @param event The event or channel to publish to.
   * @param data The data to publish on the channel.
   */
  publish<T = any>(_eventName: string | any, _data?: T): void {
    throw new Error('PubSubService "publish" method must be implemented');
  }

  /**
    * Subscribes to a message channel or message type.
    * @param event The event channel or event data type.
    * @param callback The callback to be invoked when the specified message is published.
    * @return possibly a Subscription
    */
  // eslint-disable-next-line @typescript-eslint/ban-types
  subscribe<T = any>(_eventName: string | Function, _callback: (data: T) => void): Subscription | any {
    throw new Error('PubSubService "subscribe" method must be implemented');
  }

  /**
    * Subscribes to a custom event message channel or message type.
    * This is similar to the "subscribe" except that the callback receives an event typed as CustomEventInit and the data will be inside its "event.detail"
    * @param event The event channel or event data type.
    * @param callback The callback to be invoked when the specified message is published.
    * @return possibly a Subscription
    */
  // eslint-disable-next-line @typescript-eslint/ban-types
  subscribeEvent?<T = any>(_eventName: string | Function, _callback: (event: CustomEventInit<T>) => void): Subscription | any {
    throw new Error('PubSubService "subscribeEvent" method must be implemented');
  }

  /**
    * Unsubscribes a message name
    * @param event The event name
    * @return possibly a Subscription
    */
  unsubscribe(_eventName: string, _callback: (event: CustomEventInit) => void): void {
    throw new Error('PubSubService "unsubscribe" method must be implemented');
  }

  /** Unsubscribes all subscriptions that currently exists */
  unsubscribeAll(_subscriptions?: Subscription[]): void {
    throw new Error('PubSubService "unsubscribeAll" method must be implemented');
  }
}
