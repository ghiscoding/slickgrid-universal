import { BindingService } from './binding.service.js';
import { BindingEventService } from './bindingEvent.service.js';

export class BindingHelper {
  private _events = new BindingEventService();
  private _observers: BindingService[] = [];
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
    let observer = this._observers.pop();
    while (observer) {
      observer.dispose();
      observer = this._observers.pop();
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

    // before creating a new observer, first check if the variable already has an associated observer
    // if we can't find an observer then we'll create a new one for it
    let observer = this._observers.find((bind) => bind.variable === variable && bind.property === property);
    if (!observer) {
      observer = new BindingService({ variable, property });
      this._observers.push(observer);
    }

    // add event(s) binding
    // when having multiple events, we'll loop through through them and add a binding for each
    if (Array.isArray(events)) {
      events.forEach((eventName) => observer.bind<T>(elements, attribute, eventName, callback));
    } else {
      observer.bind<T>(elements, attribute, events, callback);
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
