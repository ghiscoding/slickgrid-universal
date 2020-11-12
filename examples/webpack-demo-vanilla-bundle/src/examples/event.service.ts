interface ElementEventListener {
  element: Element;
  eventName: string;
  listener: EventListenerOrEventListenerObject;
}

export class EventService {
  private _boundedEventWithListeners: ElementEventListener[] = [];

  addElementEventListener(element: Element, eventName: string, listener: EventListenerOrEventListenerObject) {
    element.addEventListener(eventName, listener);
    this._boundedEventWithListeners.push({ element, eventName, listener });
  }

  /** Unbind All (remove) bounded elements with listeners */
  unbindAllEvents() {
    for (const boundedEvent of this._boundedEventWithListeners) {
      const { element, eventName, listener } = boundedEvent;
      if (element?.removeEventListener) {
        element.removeEventListener(eventName, listener);
      }
    }
  }
}
