import { EventNamingStyle, EventSubscription, PubSubService, Subscription, titleCase, toKebabCase } from '@slickgrid-universal/common';

interface PubSubEvent<T = any> {
  name: string;
  listener: (event: T | CustomEventInit<T>) => void;
}

export class EventPubSubService implements PubSubService {
  protected _elementSource: Element;
  protected _subscribedEvents: PubSubEvent[] = [];

  eventNamingStyle = EventNamingStyle.camelCase;

  get elementSource() {
    return this._elementSource;
  }
  set elementSource(element: Element) {
    this._elementSource = element;
  }

  get subscribedEvents(): PubSubEvent[] {
    return this._subscribedEvents;
  }

  get subscribedEventNames(): string[] {
    return this._subscribedEvents.map((pubSubEvent) => pubSubEvent.name);
  }

  constructor(elementSource?: Element) {
    // use the provided element
    // or create a "phantom DOM node" (a div element that is never rendered) to set up a custom event dispatching
    this._elementSource = elementSource || document.createElement('div');
  }

  /**
   * Method to publish a message via a dispatchEvent.
   * Return is a Boolean (from the event dispatch) unless a delay is provided if so we'll return the dispatched event in a Promise with a delayed cycle
   * The delay is rarely use and is only used when we want to make sure that certain events have the time to execute
   * and we do this because most framework require a cycle before the binding is processed and binding a spinner end up showing too late
   * for example this is used for the following events: onBeforeFilterClear, onBeforeFilterChange, onBeforeToggleTreeCollapse, onBeforeSortChange
   * @param {String} event - The event or channel to publish to.
   * @param {*} data - The data to publish on the channel.
   * @param {Number} delay - optional argument to delay the publish event
   * @returns {Boolean | Promise} - return type will be a Boolean unless a `delay` is provided then a `Promise<Boolean>` will be returned
   */
  publish<T = any>(eventName: string, data?: T, delay?: number): boolean | Promise<boolean> {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');

    if (delay) {
      return new Promise(resolve => {
        setTimeout(() => resolve(this.dispatchCustomEvent<T>(eventNameByConvention, data, true, true)), delay);
      });
    } else {
      return this.dispatchCustomEvent<T>(eventNameByConvention, data, true, true);
    }
  }

  /**
   * Subscribes to a message channel or message type.
   * @param event The event channel or event data type.
   * @param callback The callback to be invoked when the specified message is published.
   * @return possibly a Subscription
   */
  subscribe<T = any>(eventName: string, callback: (data: T) => void): Subscription {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');

    // the event listener will return the data in the "event.detail", so we need to return its content to the final callback
    // basically we substitute the "data" with "event.detail" so that the user ends up with only the "data" result
    this._elementSource.addEventListener(eventNameByConvention, (event: CustomEventInit<T>) => callback.call(null, event.detail as T));
    this._subscribedEvents.push({ name: eventNameByConvention, listener: callback });

    // return a subscription that we can unsubscribe
    return {
      unsubscribe: () => this.unsubscribe(eventNameByConvention, callback as never)
    };
  }

  /**
   * Subscribes to a custom event message channel or message type.
   * This is similar to the "subscribe" except that the callback receives an event typed as CustomEventInit and the data will be inside its "event.detail"
   * @param event The event channel or event data type.
   * @param callback The callback to be invoked when the specified message is published.
   * @return possibly a Subscription
   */
  subscribeEvent<T = any>(eventName: string, listener: (event: CustomEventInit<T>) => void): Subscription {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');
    this._elementSource.addEventListener(eventNameByConvention, listener);
    this._subscribedEvents.push({ name: eventNameByConvention, listener });

    // return a subscription that we can unsubscribe
    return {
      unsubscribe: () => this.unsubscribe(eventNameByConvention, listener as never)
    };
  }

  /**
   * Unsubscribes a message name
   * @param event The event name
   * @return possibly a Subscription
   */
  unsubscribe<T = any>(eventName: string, listener: (event: T | CustomEventInit<T>) => void) {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');
    this._elementSource.removeEventListener(eventNameByConvention, listener);
    this.removeSubscribedEventWhenFound(eventName, listener);
  }

  /** Unsubscribes all subscriptions that currently exists */
  unsubscribeAll(subscriptions?: EventSubscription[]) {
    if (Array.isArray(subscriptions)) {
      let subscription = subscriptions.pop();
      while (subscription) {
        if (subscription?.dispose) {
          subscription.dispose();
        } else if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
        subscription = subscriptions.pop();
      }
    } else {
      let pubSubEvent = this._subscribedEvents.pop();
      while (pubSubEvent) {
        this.unsubscribe(pubSubEvent.name, pubSubEvent.listener);
        pubSubEvent = this._subscribedEvents.pop();
      }
    }
  }

  /** Dispatch of Custom Event, which by default will bubble up & is cancelable */
  dispatchCustomEvent<T = any>(eventName: string, data?: T, isBubbling = true, isCancelable = true) {
    const eventInit: CustomEventInit<T> = { bubbles: isBubbling, cancelable: isCancelable };
    if (data) {
      eventInit.detail = data;
    }
    return this._elementSource.dispatchEvent(new CustomEvent<T>(eventName, eventInit));
  }

  /** Get the event name by the convention defined, it could be: all lower case, camelCase, PascalCase or kebab-case */
  getEventNameByNamingConvention(inputEventName: string, eventNamePrefix: string) {
    let outputEventName = '';

    switch (this.eventNamingStyle) {
      case EventNamingStyle.camelCase:
        outputEventName = (eventNamePrefix !== '') ? `${eventNamePrefix}${titleCase(inputEventName)}` : inputEventName;
        break;
      case EventNamingStyle.kebabCase:
        outputEventName = (eventNamePrefix !== '') ? `${eventNamePrefix}-${toKebabCase(inputEventName)}` : toKebabCase(inputEventName);
        break;
      case EventNamingStyle.lowerCase:
        outputEventName = `${eventNamePrefix}${inputEventName}`.toLowerCase();
        break;
      case EventNamingStyle.lowerCaseWithoutOnPrefix:
        outputEventName = `${eventNamePrefix}${inputEventName.replace(/^on/, '')}`.toLowerCase();
        break;
    }
    return outputEventName;
  }

  protected removeSubscribedEventWhenFound<T>(eventName: string, listener: (event: T | CustomEventInit<T>) => void) {
    const eventIdx = this._subscribedEvents.findIndex(evt => evt.name === eventName && evt.listener === listener);
    if (eventIdx >= 0) {
      this._subscribedEvents.splice(eventIdx, 1);
    }
  }
}
