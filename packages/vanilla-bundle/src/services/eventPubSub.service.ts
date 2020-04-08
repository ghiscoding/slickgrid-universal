import { EventNamingStyle, PubSubService, titleCase, toKebabCase } from '@slickgrid-universal/common';

export class EventPubSubService implements PubSubService {
  private _elementSource: Element;
  private _eventNames: string[] = [];

  eventNamingStyle = EventNamingStyle.camelCase;

  constructor(elementSource?: Element) {
    // use the provided element
    // or create a "phantom DOM node" (a div element that is never rendered) to set up a custom event dispatching
    this._elementSource = elementSource || document.createElement('div');
  }

  publish(eventName: string, data?: any) {
    const dispatchedEventName = this.getEventNameByNamingConvention(eventName, '');
    this.dispatchCustomEvent(dispatchedEventName, data, true, false);
    this._eventNames.push(dispatchedEventName);
  }

  subscribe(eventName: string, callback: (event: CustomEventInit) => void): any {
    this._elementSource.addEventListener(eventName, callback);
  }

  unsubscribe(eventName: string, callback: (event: CustomEventInit) => void) {
    this._elementSource.removeEventListener(eventName, callback);
  }

  unsubscribeAll() {
    for (const eventName of this._eventNames) {
      this.unsubscribe(eventName, () => { });
    }
  }

  /** Dispatch of Custom Event, which by default will bubble up & is cancelable */
  dispatchCustomEvent(eventName: string, data?: any, isBubbling: boolean = true, isCancelable: boolean = true) {
    const eventInit: CustomEventInit = { bubbles: isBubbling, cancelable: isCancelable };
    if (data) {
      eventInit.detail = data;
    }
    return this._elementSource.dispatchEvent(new CustomEvent(eventName, eventInit));
  }

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
