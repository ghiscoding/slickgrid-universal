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
          this._boundedEvents.push({ element, eventName, listener });
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

  /**
   * Unbind all event listeners that were bounded, optionally provide a group name to unbind all listeners assigned to that specific group only.
   */
  unbindAll(groupName?: string) {
    if (groupName) {
      // unbind only the bounded event with a specific group
      this._boundedEvents.forEach((boundedEvent, idx) => {
        if (boundedEvent.groupName === groupName) {
          const { element, eventName, listener } = boundedEvent;
          this.unbind(element, eventName, listener);
          this._boundedEvents.splice(idx, 1);
        }
      });
    } else {
      // unbind everything
      while (this._boundedEvents.length > 0) {
        const boundedEvent = this._boundedEvents.pop() as ElementEventListener;
        const { element, eventName, listener } = boundedEvent;
        this.unbind(element, eventName, listener);
      }
    }
  }
}
