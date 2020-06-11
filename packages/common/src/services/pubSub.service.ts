import { Subscription } from '../interfaces/index';

export abstract class PubSubService {
  /**
   * Method to publish a message
   * @param event The event or channel to publish to.
   * @param data The data to publish on the channel.
   */
  publish<T = any>(eventName: string | any, data?: T): void {
    throw new Error('PubSubService "publish" method must be implemented');
  }

  /**
    * Subscribes to a message channel or message type.
    * @param event The event channel or event data type.
    * @param callback The callback to be invoked when the specified message is published.
    * @return possibly a Subscription
    */
  subscribe<T = any>(eventName: string | Function, callback: (data: T) => void): Subscription | any {
    throw new Error('PubSubService "subscribe" method must be implemented');
  }

  /**
    * Subscribes to a custom event message channel or message type.
    * This is similar to the "subscribe" except that the callback receives an event typed as CustomEventInit and the data will be inside its "event.detail"
    * @param event The event channel or event data type.
    * @param callback The callback to be invoked when the specified message is published.
    * @return possibly a Subscription
    */
  subscribeEvent?<T = any>(eventName: string | Function, callback: (event: CustomEventInit<T>) => void): Subscription | any {
    throw new Error('PubSubService "subscribe" method must be implemented');
  }

  /**
    * Unsubscribes a message name
    * @param event The event name
    * @return possibly a Subscription
    */
  unsubscribe(eventName: string, callback: (event: CustomEventInit) => void): void {
    throw new Error('PubSubService "unsubscribe" method must be implemented');
  }

  /** Unsubscribes all subscriptions that currently exists */
  unsubscribeAll(subscriptions?: Subscription[]): void {
    throw new Error('PubSubService "unsubscribeAll" method must be implemented');
  }
}
