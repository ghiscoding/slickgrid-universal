import type { ElementEventListener } from '../interfaces/elementEventListener.interface';

export class BindingEventService {
  protected _boundedEvents: ElementEventListener[] = [];

  get boundedEvents(): ElementEventListener[] {
    return this._boundedEvents;
  }

  dispose() {
    this.unbindAll();
    this._boundedEvents = [];
  }

  /** Bind an event listener to any element */
  bind(elementOrElements: Element | NodeListOf<Element> | Window, eventNameOrNames: string | string[], listener: EventListenerOrEventListenerObject, listenerOptions?: boolean | AddEventListenerOptions, groupName = '') {
    // convert to array for looping in next task
    const eventNames = (Array.isArray(eventNameOrNames)) ? eventNameOrNames : [eventNameOrNames];

    if ((elementOrElements as NodeListOf<HTMLElement>)?.forEach) {
      // multiple elements to bind to
      (elementOrElements as NodeListOf<HTMLElement>).forEach(element => {
        for (const eventName of eventNames) {
          element.addEventListener(eventName, listener, listenerOptions);
          this._boundedEvents.push({ element, eventName, listener, groupName });
        }
      });
    } else {
      // single elements to bind to
      for (const eventName of eventNames) {
        (elementOrElements as Element).addEventListener(eventName, listener, listenerOptions);
        this._boundedEvents.push({ element: (elementOrElements as Element), eventName, listener, groupName });
      }
    }
  }

  /** Unbind a specific listener that was bounded earlier */
  unbind(elementOrElements: Element | NodeListOf<Element>, eventNameOrNames: string | string[], listener: EventListenerOrEventListenerObject) {
    // convert to array for looping in next task
    const elements = (Array.isArray(elementOrElements)) ? elementOrElements : [elementOrElements];
    const eventNames = Array.isArray(eventNameOrNames) ? eventNameOrNames : [eventNameOrNames];

    for (const eventName of eventNames) {
      for (const element of elements) {
        if (typeof element?.removeEventListener === 'function') {
          element.removeEventListener(eventName, listener);
        }
      }
    }
  }

  unbindByEventName(element: Element | Window, eventName: string) {
    const boundedEvent = this._boundedEvents.find(e => e.element === element && e.eventName === eventName);
    if (boundedEvent) {
      this.unbind(boundedEvent.element, boundedEvent.eventName, boundedEvent.listener);
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
