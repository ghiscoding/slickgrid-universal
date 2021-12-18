import { ElementEventListener } from '../interfaces/elementEventListener.interface';

export class BindingEventService {
  protected _boundedEvents: ElementEventListener[] = [];

  get boundedEvents(): ElementEventListener[] {
    return this._boundedEvents;
  }

  /** Bind an event listener to any element */
  bind(elementOrElements: Element | NodeListOf<Element>, eventNameOrNames: string | string[], listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    const eventNames = (Array.isArray(eventNameOrNames)) ? eventNameOrNames : [eventNameOrNames];

    if ((elementOrElements as NodeListOf<HTMLElement>)?.forEach) {
      (elementOrElements as NodeListOf<HTMLElement>)?.forEach(element => {
        for (const eventName of eventNames) {
          element.addEventListener(eventName, listener, options);
          this._boundedEvents.push({ element, eventName, listener });
        }
      });
    } else {
      for (const eventName of eventNames) {
        (elementOrElements as Element).addEventListener(eventName, listener, options);
        this._boundedEvents.push({ element: (elementOrElements as Element), eventName, listener });
      }
    }
  }

  /** Unbind all will remove every every event handlers that were bounded earlier */
  unbind(elementOrElements: Element | NodeListOf<Element>, eventNameOrNames: string | string[], listener: EventListenerOrEventListenerObject) {
    const elements = (Array.isArray(elementOrElements)) ? elementOrElements : [elementOrElements];
    const eventNames = Array.isArray(eventNameOrNames) ? eventNameOrNames : [eventNameOrNames];
    for (const eventName of eventNames) {
      for (const element of elements) {
        if (element?.removeEventListener) {
          element.removeEventListener(eventName, listener);
        }
      }
    }
  }

  /** Unbind all will remove every every event handlers that were bounded earlier */
  unbindAll() {
    while (this._boundedEvents.length > 0) {
      const boundedEvent = this._boundedEvents.pop() as ElementEventListener;
      const { element, eventName, listener } = boundedEvent;
      this.unbind(element, eventName, listener);
    }
  }
}
