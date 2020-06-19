import { EventNamingStyle, PubSubService, Subscription, titleCase, toKebabCase } from '@slickgrid-universal/common';

export class EventPubSubService implements PubSubService {
  private _elementSource: Element;
  private _subscribedEventNames: string[] = [];

  eventNamingStyle = EventNamingStyle.camelCase;

  constructor(elementSource?: Element) {
    // use the provided element
    // or create a "phantom DOM node" (a div element that is never rendered) to set up a custom event dispatching
    this._elementSource = elementSource || document.createElement('div');
  }

  publish<T = any>(eventName: string, data?: T) {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');
    this.dispatchCustomEvent<T>(eventNameByConvention, data, true, false);
  }

  subscribe<T = any>(eventName: string, callback: (data: T) => void): any {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');

    // the event listener will return the data in the "event.detail", so we need to return its content to the final callback
    // basically we substitute the "data" with "event.detail" so that the user ends up with only the "data" result
    this._elementSource.addEventListener(eventNameByConvention, (event: CustomEventInit<T>) => callback.call(null, event.detail));
    this._subscribedEventNames.push(eventNameByConvention);
  }

  subscribeEvent<T = any>(eventName: string, callback: (event: CustomEventInit<T>) => void): any | void {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');
    this._elementSource.addEventListener(eventNameByConvention, callback);
    this._subscribedEventNames.push(eventNameByConvention);
  }

  unsubscribe(eventName: string, callback: (event: CustomEventInit) => void) {
    const eventNameByConvention = this.getEventNameByNamingConvention(eventName, '');
    this._elementSource.removeEventListener(eventNameByConvention, callback);
  }

  unsubscribeAll(subscriptions?: Subscription[]) {
    if (Array.isArray(subscriptions)) {
      for (const subscription of subscriptions) {
        if (subscription?.dispose) {
          subscription.dispose();
        } else if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
      }
    } else {
      for (const eventName of this._subscribedEventNames) {
        this.unsubscribe(eventName, () => { });
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
}
