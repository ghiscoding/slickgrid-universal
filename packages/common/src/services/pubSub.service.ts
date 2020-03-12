export abstract class PubSubService {
  /**
 * Method to publish a message
  * @param event The event or channel to publish to.
  * @param data The data to publish on the channel.
 */
  publish(eventName: string | any, data?: any): void {
    console.log('PubSubService "publish" method must be implemented');
  };

  /**
    * Subscribes to a message channel or message type.
    * @param event The event channel or event data type.
    * @param callback The callback to be invoked when the specified message is published.
    * @return possibly a Subscription
    */
  subscribe(eventName: string | Function, callback: Function): any {
    console.log('PubSubService "subscribe" method must be implemented');
    return null;
  };

  /**
    * Unsubscribes a message name
    * @param event The event name
    * @return possibly a Subscription
    */
  unsubscribe(eventName: string, callback: (event: CustomEventInit) => void): void {
    console.log('PubSubService "unsubscribe" method must be implemented');
  }
}
