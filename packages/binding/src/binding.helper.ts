import { BindingService } from './binding.service.js';
import { BindingEventService } from './bindingEvent.service.js';

export class BindingHelper {
  private _events = new BindingEventService();
  private _observers: BindingService[] = [];
  private _observerBindings: Array<{ variable: any; property: string }> = [];
  private _querySelectorPrefix = '';

  get querySelectorPrefix(): string {
    return this._querySelectorPrefix || '';
  }
  set querySelectorPrefix(prefix: string) {
    this._querySelectorPrefix = prefix;
  }

  get observers(): BindingService[] {
    return this._observers;
  }

  dispose(): void {
    this._events.dispose();
    this._observerBindings = [];
    for (let observer = this._observers.pop(); observer; observer = this._observers.pop()) {
      observer.dispose();
    }
  }

  addElementBinding<T extends Element = Element>(
    variable: any,
    property: string,
    selector: string,
    attribute: string,
    events?: string | string[],
    callback?: (val: any) => void
  ): void {
    const elements = document.querySelectorAll<T>(`${this.querySelectorPrefix}${selector}`);

    // Reuse the observer for this object and property.
    const observerIndex = this._observerBindings.findIndex((binding) => binding.variable === variable && binding.property === property);
    let observer = observerIndex >= 0 ? this._observers[observerIndex] : undefined;
    if (!observer) {
      observer = new BindingService({ variable, property });
      this._observers.push(observer);
      this._observerBindings.push({ variable, property });
    }

    for (const eventName of Array.isArray(events) ? events : [events]) {
      observer.bind<T>(elements, attribute, eventName, callback);
    }
  }

  /** From a DOM element selector, which could be zero or multiple elements, add an event listener   */
  bindEventHandler<T extends Element = Element>(
    selector: string,
    eventName: string,
    callback: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    this._events.bind(document.querySelectorAll<T>(`${this.querySelectorPrefix}${selector}`), eventName, callback, options);
  }

  /**
   * From a DOM element selector, which could be zero or multiple elements, set the value on a given attribute name
   * For example ('div.hello', 'textContent', 'world') => would set the textContent equal to 'world' on a div element having the class 'hello'
   */
  setElementAttributeValue<T extends Element = Element>(selector: string, attribute: string, value: any): void {
    const elements = document.querySelectorAll<T>(`${this.querySelectorPrefix}${selector}`);

    elements.forEach((elm) => {
      elm.textContent = '';
      if (elm && attribute in elm) {
        elm[attribute as keyof T] = value;
      }
    });
  }
}
