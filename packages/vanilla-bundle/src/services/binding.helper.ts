import { BindingService } from './binding.service';

export class BindingHelper {
  private _observers: BindingService[] = [];
  private _querySelectorPrefix = '';

  get querySelectorPrefix(): string {
    return this._querySelectorPrefix || '';
  }
  set querySelectorPrefix(prefix: string) {
    this._querySelectorPrefix = prefix;
  }

  get observers() {
    return this._observers;
  }

  constructor() { }

  dispose() {
    for (const observer of this._observers) {
      observer.dispose();
    }
    this._observers = [];
  }

  addElementBinding(variable: any, property: string, selector: string, attribute: string, events?: string | string[], callback?: (val: any) => void) {
    const elements = document.querySelectorAll<HTMLElement>(`${this.querySelectorPrefix}${selector}`);

    // before creating a new observer, first check if the variable already has an associated observer
    // if we can't find an observer then we'll create a new one for it
    let observer = this._observers.find((bind) => bind.property === variable);
    if (!observer) {
      observer = new BindingService({ variable, property });
    }

    // add event(s) binding
    // when having multiple events, we'll loop through through them and add a binding for each
    if (Array.isArray(events)) {
      events.forEach(eventName => observer?.bind(elements, attribute, eventName, callback));
    } else {
      observer?.bind(elements, attribute, events, callback);
    }

    this._observers.push(observer);
  }

  /** From a DOM element selector, which could be zero or multiple elements, add an event listener   */
  bindEventHandler(selector: string, eventName: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    const elements = document.querySelectorAll<HTMLElement>(`${this.querySelectorPrefix}${selector}`);

    elements.forEach(elm => {
      if (elm?.addEventListener) {
        elm.addEventListener(eventName, callback, options);
      }
    });
  }

  /**
   * From a DOM element selector, which could be zero or multiple elements, set the value on a given attribute name
   * For example ('div.hello', 'textContent', 'world') => would set the textContent equal to 'world' on a div element having the class 'hello'
   */
  setElementAttributeValue(selector: string, attribute: string, value: any) {
    const elements = document.querySelectorAll<HTMLElement>(`${this.querySelectorPrefix}${selector}`);

    elements.forEach(elm => {
      elm.textContent = '';
      if (elm && attribute in elm) {
        elm[attribute] = value;
      }
    });
  }
}
