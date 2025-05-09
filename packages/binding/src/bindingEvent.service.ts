import type { ElementEventListener } from './interfaces.js';

/**
 * Create a Service to bind event listeners to DOM elements events,
 * you can bind 1 or more elements on 1 or more events.
 * The advantage of using this service is too easily unbind all listeners without having to pass the actual listener reference
 */
export class BindingEventService {
  protected _boundedEvents: ElementEventListener[] = [];

  get boundedEvents(): ElementEventListener[] {
    return this._boundedEvents;
  }

  dispose(): void {
    this.unbindAll();
    this._boundedEvents = [];
  }

  /** Bind an event listener to any element */
  bind<H extends HTMLElement = HTMLElement>(
    elementOrElements: Document | Element | NodeListOf<Element> | Array<Element> | Window,
    eventNameOrNames: string | string[],
    listener: EventListenerOrEventListenerObject,
    listenerOptions?: boolean | AddEventListenerOptions,
    groupName = ''
  ): void {
    // convert to array for looping in next task
    const eventNames = Array.isArray(eventNameOrNames) ? eventNameOrNames : [eventNameOrNames];

    if (
      !(elementOrElements instanceof HTMLElement || elementOrElements instanceof DocumentFragment) &&
      (elementOrElements as NodeListOf<HTMLElement>)?.forEach
    ) {
      // multiple elements to bind to
      (elementOrElements as NodeListOf<HTMLElement>).forEach((element) =>
        this.bindElementEvents(element, eventNames, listener, listenerOptions, groupName)
      );
    } else if (elementOrElements) {
      // single elements to bind to
      this.bindElementEvents(elementOrElements as H, eventNames, listener, listenerOptions, groupName);
    }
  }

  /** Unbind a specific listener that was bounded earlier */
  unbind(
    elementOrElements: Element | NodeListOf<Element>,
    eventNameOrNames: string | string[],
    listener: EventListenerOrEventListenerObject
  ): void {
    // convert to array for looping in next task
    const elements = Array.isArray(elementOrElements) ? elementOrElements : [elementOrElements];
    const eventNames = Array.isArray(eventNameOrNames) ? eventNameOrNames : [eventNameOrNames];

    for (const eventName of eventNames) {
      for (const element of elements) {
        if (typeof element?.removeEventListener === 'function') {
          element.removeEventListener(eventName, listener);
        }
      }
    }
  }

  unbindByEventName(element: Element | Window, eventName: string): void {
    const boundedEvent = this._boundedEvents.find((e) => e.element === element && e.eventName === eventName);
    if (boundedEvent) {
      this.unbind(boundedEvent.element, boundedEvent.eventName, boundedEvent.listener);
    }
  }

  /**
   * Unbind all event listeners that were bounded, optionally provide a group name to unbind all listeners assigned to that specific group only.
   */
  unbindAll(groupName?: string | string[]): void {
    if (groupName) {
      const groupNames = Array.isArray(groupName) ? groupName : [groupName];

      // unbind only the bounded event with a specific group
      // Note: we need to loop in reverse order to avoid array reindexing (causing index offset) after a splice is called
      for (let i = this._boundedEvents.length - 1; i >= 0; --i) {
        const boundedEvent = this._boundedEvents[i];
        if (groupNames.some((g) => g === boundedEvent.groupName)) {
          const { element, eventName, listener } = boundedEvent;
          this.unbind(element, eventName, listener);
          this._boundedEvents.splice(i, 1);
        }
      }
    } else {
      // unbind everything
      while (this._boundedEvents.length > 0) {
        const boundedEvent = this._boundedEvents.pop() as ElementEventListener;
        const { element, eventName, listener } = boundedEvent;
        this.unbind(element, eventName, listener);
      }
    }
  }

  // --
  // private functions

  /** bind all event(s) to the element */
  private bindElementEvents(
    element: HTMLElement,
    eventNames: string | string[],
    listener: EventListenerOrEventListenerObject,
    listenerOptions?: boolean | AddEventListenerOptions,
    groupName = ''
  ) {
    for (const eventName of eventNames) {
      element.addEventListener(eventName, listener as EventListener, listenerOptions);
      this._boundedEvents.push({ element, eventName, listener: listener as EventListener, groupName });
    }
  }
}
