import { titleCase, toKebabCase } from '@slickgrid-universal/utils';
import { type BasePubSubService } from './types/basePubSubService.interface.js';
import { type EventNamingStyle } from './types/eventNamingStyle.type.js';
import { type EventSubscription, type Subscription } from './types/eventSubscription.interface.js';

export type PubSubEventListener<T = any> = ((event: T | CustomEventInit<T>) => void) | ((event: CustomEvent<T>) => void);

export interface PubSubEvent<T = any> {
  name: string;
  listener: PubSubEventListener<T>;
  originalCallback?: (data: T) => void;
}

/**
 * Simple publish/subscribe service using `CustomEvent`s on a single DOM element, such as the grid container.
 *
 * Framework adapters use different event naming conventions. `getEventNameByNamingConvention()`
 * normalizes event names so Angular, Aurelia, React, Vue, and vanilla integrations can communicate consistently.
 */
export class EventPubSubService implements BasePubSubService {
  protected _elementSource: Element;
  protected _subscribedEvents: PubSubEvent[] = [];
  protected _timer?: any;

  eventNamingStyle: EventNamingStyle = 'camelCase';

  get elementSource(): Element {
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

  dispose(): void {
    clearTimeout(this._timer);
    this.unsubscribeAll();
    this._subscribedEvents = [];
    this._elementSource?.remove();
    this._elementSource = null as any;
  }

  /**
   * Dispatch of Custom Event, which by default will bubble up & is cancelable
   * @param {String} eventName - event name to dispatch
   * @param {*} data - optional data to include in the dispatching
   * @param {Boolean} isBubbling - is the event bubbling up?
   * @param {Boolean} isCancelable - is the event cancellable?
   * @param {Function} externalizeEventCallback - user can optionally retrieve the CustomEvent used in the PubSub for its own usage via a callback (called just before the event dispatch)
   * @returns {Boolean} returns true if either event's cancelable attribute value is false or its preventDefault() method was not invoked, and false otherwise.
   */
  dispatchCustomEvent<T = any>(
    eventName: string,
    data?: T,
    isBubbling = true,
    isCancelable = true,
    externalizeEventCallback?: (e: Event) => void
  ): boolean {
    const eventInit: CustomEventInit<T> = { bubbles: isBubbling, cancelable: isCancelable };
    if (data) {
      eventInit.detail = data;
    }
    const custEvent = new CustomEvent<T>(eventName, eventInit);
    if (typeof externalizeEventCallback === 'function') {
      externalizeEventCallback(custEvent);
    }
    return this._elementSource?.dispatchEvent(custEvent);
  }

  /**
   * Get the event name by the convention defined, it could be: all lower case, camelCase, PascalCase or kebab-case
   * @param {String} inputEventName - name of the event
   * @param {String} eventNamePrefix - prefix to use in the event name
   * @returns {String} - output event name
   */
  getEventNameByNamingConvention(inputEventName: string, eventNamePrefix: string): string {
    let outputEventName = inputEventName;

    switch (this.eventNamingStyle) {
      case 'camelCase':
      case 'camelCaseWithExtraOnPrefix':
        if (this.eventNamingStyle === 'camelCaseWithExtraOnPrefix') {
          outputEventName = `${eventNamePrefix}${inputEventName.replace(/^on/, 'onOn')}`;
        } else {
          outputEventName = eventNamePrefix !== '' ? `${eventNamePrefix}${titleCase(outputEventName)}` : outputEventName;
        }
        break;
      case 'kebabCase':
        outputEventName = eventNamePrefix !== '' ? `${eventNamePrefix}-${toKebabCase(outputEventName)}` : toKebabCase(outputEventName);
        break;
      case 'lowerCase':
      case 'lowerCaseWithoutOnPrefix':
        if (this.eventNamingStyle === 'lowerCaseWithoutOnPrefix') {
          outputEventName = `${eventNamePrefix}${inputEventName.replace(/^on/, '')}`.toLowerCase();
        } else {
          outputEventName = `${eventNamePrefix}${outputEventName}`.toLowerCase();
        }
        break;
    }
    return outputEventName;
  }

  /**
   * Method to publish a message via a dispatchEvent.
   * Return is a Boolean (from the event dispatch) unless a delay is provided if so we'll return the dispatched event in a Promise with a delayed cycle
   * The delay is rarely use and is only used when we want to make sure that certain events have the time to execute
   * and we do this because most framework require a cycle before the binding is processed and binding a spinner end up showing too late
   * for example this is used for the following events: onBeforeFilterClear, onBeforeFilterChange, onBeforeSortChange
   * @param {String} event - The event or channel to publish to.
   * @param {*} data - The data to publish on the channel.
   * @param {Number} delay - optional argument to delay the publish event
   * @param {Function} externalizeEventCallback - user can optionally retrieve the CustomEvent used in the PubSub for its own usage via a callback (called just before the event dispatch)
   * @returns {Boolean | Promise} - return type will be a Boolean unless a `delay` is provided then a `Promise<Boolean>` will be returned
   */
  publish<T = any>(eventName: string, data?: T, delay?: number, externalizeEventCallback?: (e: Event) => void): boolean | Promise<boolean> {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');

    if (delay) {
      return new Promise((resolve) => {
        clearTimeout(this._timer);
        this._timer = setTimeout(
          () => resolve(this.dispatchCustomEvent<T>(eventNameByConvention, data, false, true, externalizeEventCallback)),
          delay
        );
      });
    } else {
      return this.dispatchCustomEvent<T>(eventNameByConvention, data, false, true, externalizeEventCallback);
    }
  }

  /**
   * Subscribes to a message channel or message type.
   * @param {String|String[]} event The event channel or event data type.
   * @param {Function} callback The callback to be invoked when the specified message is published.
   * @return possibly a Subscription
   */
  subscribe<T = any>(eventNames: string | string[], callback: (data: T) => void): Subscription {
    eventNames = Array.isArray(eventNames) ? eventNames : [eventNames];
    const subscriptions: Array<() => void> = [];

    eventNames.forEach((eventName) => {
      const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');

      // the event listener will return the data in the "event.detail", so we need to return its content to the final callback
      // basically we substitute the "data" with "event.detail" so that the user ends up with only the "data" result
      const wrappedListener = (event: CustomEvent<T>) => callback.call(null, event.detail);

      this._elementSource.addEventListener(eventNameByConvention, wrappedListener as EventListener);
      this._subscribedEvents.push({ name: eventNameByConvention, listener: wrappedListener, originalCallback: callback });
      subscriptions.push(() => this.unsubscribeResolved(eventNameByConvention, wrappedListener as EventListener));
    });

    // return a subscription(s) that we can later unsubscribe
    return {
      unsubscribe: () => subscriptions.forEach((unsub) => unsub()),
    };
  }

  /**
   * Subscribes to a message channel or message type.
   * This is similar to the "subscribe" except that the callback receives the original CustomEvent and the data will be inside its "event.detail"
   * @param {String} event - the event name/message
   * @param {Function} callback - The callback to be invoked when the specified message is published.
   * @return {Subscription} possibly a Subscription
   */
  subscribeEvent<T = any>(eventName: string, listener: (event: CustomEvent<T>) => void): Subscription {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');
    this._elementSource.addEventListener(eventNameByConvention, listener as EventListener);
    this._subscribedEvents.push({ name: eventNameByConvention, listener });

    // return a subscription that we can later unsubscribe
    return {
      unsubscribe: () => this.unsubscribeResolved(eventNameByConvention, listener as EventListener),
    };
  }

  /**
   * Unsubscribes a message or event name
   * @param {String} event - the event name/message
   * @param {Function} listener - event listener callback
   * @param {Boolean} [shouldRemoveFromEventList] - should we also remove the event from the subscriptions array?
   * @return possibly a Subscription
   */
  unsubscribe<T = any>(eventName: string, listener: (event: CustomEvent<T>) => void, shouldRemoveFromEventList?: boolean): void;
  unsubscribe<T = any>(eventName: string, listener: (event: T | CustomEventInit<T>) => void, shouldRemoveFromEventList?: boolean): void;
  unsubscribe<T = any>(eventName: string, listener: PubSubEventListener<T>, shouldRemoveFromEventList = true): void {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');
    const subscribedEvents = this._subscribedEvents.filter(
      (pubSubEvent) => pubSubEvent.name === eventNameByConvention && pubSubEvent.originalCallback === listener
    );

    if (subscribedEvents.length > 0) {
      subscribedEvents.forEach((pubSubEvent) =>
        this.unsubscribeResolved(eventNameByConvention, pubSubEvent.listener as EventListener, shouldRemoveFromEventList)
      );
    } else {
      this.unsubscribeResolved(eventNameByConvention, listener as EventListener, shouldRemoveFromEventList);
    }
  }

  /** Unsubscribes all subscriptions/events that currently exists */
  unsubscribeAll(subscriptions?: EventSubscription[]): void {
    if (Array.isArray(subscriptions)) {
      let subscription;
      do {
        subscription = subscriptions.pop();
        if (subscription?.dispose) {
          subscription.dispose();
        } else if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
      } while (subscription);
    } else {
      let pubSubEvent = this._subscribedEvents.pop();
      while (pubSubEvent) {
        this.unsubscribeResolved(pubSubEvent.name, pubSubEvent.listener as EventListener, false);
        pubSubEvent = this._subscribedEvents.pop();
      }
    }
  }

  // --
  // protected functions
  // --------------------

  protected removeSubscribedEventWhenFound<T>(eventName: string, listener: PubSubEvent<T>['listener']): void {
    const eventIdx = this._subscribedEvents.findIndex((evt) => evt.name === eventName && evt.listener === listener);
    if (eventIdx >= 0) {
      this._subscribedEvents.splice(eventIdx, 1);
    }
  }

  private unsubscribeResolved(eventName: string, listener: EventListener, shouldRemoveFromEventList = true): void {
    this._elementSource.removeEventListener(eventName, listener);
    if (shouldRemoveFromEventList) {
      this.removeSubscribedEventWhenFound(eventName, listener as any);
    }
  }
}
