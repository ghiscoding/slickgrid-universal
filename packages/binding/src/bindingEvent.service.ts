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
    listener: EventListenerOrEventListenerObject,
    listenerOptions?: boolean | EventListenerOptions
  ): void {
    const elements = elementOrElements instanceof NodeList ? Array.from(elementOrElements) : [elementOrElements];
    const capture = typeof listenerOptions === 'boolean' ? listenerOptions : !!listenerOptions?.capture;
    const eventNames = Array.isArray(eventNameOrNames) ? eventNameOrNames : [eventNameOrNames];

    for (const eventName of eventNames) {
      for (const element of elements) {
        if (typeof element?.removeEventListener === 'function') {
          element.removeEventListener(eventName, listener, listenerOptions);
        }
      }
    }
    this.removeRecords(
      (event) =>
        elements.includes(event.element) &&
        eventNames.includes(event.eventName) &&
        event.listener === listener &&
        !!event.options?.capture === capture
    );
  }

  unbindByEventName(element: Element | Window, eventName: string): void {
    const boundedEvent = this._boundedEvents.find((e) => e.element === element && e.eventName === eventName);
    if (boundedEvent) {
      this.unbind(boundedEvent.element, boundedEvent.eventName, boundedEvent.listener, boundedEvent.options);
    }
  }

  /**
   * Unbind all event listeners that were bounded, optionally provide a group name to unbind all listeners assigned to that specific group only.
   */
  unbindAll(groupName?: string | string[]): void {
    const groups = groupName ? new Set(Array.isArray(groupName) ? groupName : [groupName]) : null;
    this.removeRecords((event) => {
      if (groups && !groups.has(event.groupName as string)) {
        return false;
      }
      const { element, eventName, listener, options } = event;
      if (typeof element?.removeEventListener === 'function') {
        element.removeEventListener(eventName, listener, options);
      }
      return true;
    });
  }

  /** Compact in place to preserve the public array and retained registration order. */
  protected removeRecords(matches: (event: ElementEventListener) => boolean): void {
    let kept = 0;
    for (const event of this._boundedEvents) {
      if (!matches(event)) {
        this._boundedEvents[kept++] = event;
      }
    }
    this._boundedEvents.length = kept;
  }

  /** bind all event(s) to the element */
  protected bindElementEvents(
    element: HTMLElement,
    eventNames: string[],
    listener: EventListenerOrEventListenerObject,
    listenerOptions?: boolean | AddEventListenerOptions,
    groupName = ''
  ): void {
    const eventOptions = typeof listenerOptions === 'boolean' ? { capture: listenerOptions } : listenerOptions && { ...listenerOptions };
    for (const eventName of eventNames) {
      element.addEventListener(eventName, listener, eventOptions);
      this._boundedEvents.push({ element, eventName, listener, options: eventOptions, groupName });
    }
  }
}
