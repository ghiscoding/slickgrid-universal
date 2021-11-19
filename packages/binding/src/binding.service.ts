/* eslint-disable no-bitwise */
import * as DOMPurify_ from 'dompurify';
const DOMPurify = (DOMPurify_ as any)['default'] || DOMPurify_; // patch to fix rollup to work

interface Binding {
  variable: any;
  property: string;
}

export interface ElementBinding {
  element: Element | null;
  attribute: string;
}
export interface ElementBindingWithListener extends ElementBinding {
  event: string;
  listener: (val: any) => any;
}

export interface BoundedEventWithListener {
  element: Element;
  eventName: string;
  listener: EventListenerOrEventListenerObject;
  uid: string;
}

/**
 * Create 2 way Bindings for any variable that are primitive or object types, when it's an object type it will watch for property changes
 * The following 2 articles helped in building this service:
 *   1- https://blog.jeremylikness.com/blog/client-side-javascript-databinding-without-a-framework/
 *   2- https://www.wintellect.com/data-binding-pure-javascript/
 */
export class BindingService {
  protected _value: any = null;
  protected _binding: Binding;
  protected _property: string;
  protected _boundedEventWithListeners: BoundedEventWithListener[] = [];
  protected _elementBindings: Array<ElementBinding | ElementBindingWithListener> = [];

  constructor(binding: Binding) {
    this._binding = binding;
    this._property = binding.property || '';
    this._elementBindings = [];
    if (binding.property && binding.variable && (binding.variable.hasOwnProperty(binding.property) || binding.property in binding.variable)) {
      this._value = typeof binding.variable[binding.property] === 'string' ? this.sanitizeText(binding.variable[binding.property]) : binding.variable[binding.property];
    } else {
      this._value = typeof binding.variable === 'string' ? this.sanitizeText(binding.variable) : binding.variable;
    }

    if (typeof binding.variable === 'object') {
      Object.defineProperty(binding.variable, binding.property, {
        get: this.valueGetter.bind(this),
        set: this.valueSetter.bind(this)
      });
    }
  }

  get boundedEventWithListeners(): BoundedEventWithListener[] {
    return this._boundedEventWithListeners;
  }

  get elementBindings(): Array<ElementBinding | ElementBindingWithListener> {
    return this._elementBindings;
  }

  get property() {
    return this._property;
  }

  dispose() {
    this.unbindAll();
    this._boundedEventWithListeners = [];
    this._elementBindings = [];
  }

  valueGetter() {
    return this._value;
  }

  valueSetter(val: any) {
    this._value = typeof val === 'string' ? this.sanitizeText(val) : val;
    if (Array.isArray(this._elementBindings)) {
      for (const binding of this._elementBindings) {
        if (binding?.element && binding?.attribute) {
          (binding.element as any)[binding.attribute] = typeof val === 'string' ? this.sanitizeText(val) : val;
        }
      }
    }
  }

  /**
   * Add binding to 1 or more DOM Element by an object attribute and optionally on an event, we can do it in couple ways
   * 1- if there's no event provided, it will simply replace the DOM elemnt (by an attribute), for example an innerHTML
   * 2- when an event is provided, we will replace the DOM element (by an attribute) every time an event is triggered
   *    2.1- we could also provide an extra callback method to execute when the event gets triggered
   */
  bind(elements: Element | NodeListOf<HTMLElement> | null, attribute: string, eventName?: string, callback?: (val: any) => any) {
    if (elements && (elements as NodeListOf<HTMLElement>).forEach) {
      // multiple DOM elements coming from a querySelectorAll() call
      (elements as NodeListOf<HTMLElement>).forEach(elm => this.bindSingleElement(elm, attribute, eventName, callback));
    } else if (elements) {
      // single DOM element coming from a querySelector() call
      this.bindSingleElement(elements as Element, attribute, eventName, callback);
    }

    return this;
  }

  /** Unbind (remove) an element event listener */
  unbind(element: Element | null, eventName: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions, eventUid?: string) {
    if (element) {
      element.removeEventListener(eventName, listener, options);
      const eventIdx = this._boundedEventWithListeners.findIndex(be => be.uid === eventUid);
      if (eventIdx >= 0) {
        this._boundedEventWithListeners.splice(eventIdx, 1);
      }
    }
  }

  /** Unbind All (remove) bounded elements with listeners */
  unbindAll() {
    let boundedEvent = this._boundedEventWithListeners.pop();
    while (boundedEvent) {
      const { element, eventName, listener, uid } = boundedEvent;
      this.unbind(element, eventName, listener, undefined, uid);
      boundedEvent = this._boundedEventWithListeners.pop();
    }
    this._boundedEventWithListeners = [];
  }

  /**
   * Add binding to a single element by an object attribute and optionally on an event, we can do it in couple ways
   * 1- if there's no event provided, it will simply replace the DOM elemnt (by an attribute), for example an innerHTML
   * 2- when an event is provided, we will replace the DOM element (by an attribute) every time an event is triggered
   *    2.1- we could also provide an extra callback method to execute when the event gets triggered
   */
  protected bindSingleElement(element: Element | null, attribute: string, eventName?: string, callback?: (val: any) => any) {
    const binding: ElementBinding | ElementBindingWithListener = { element, attribute };
    if (element) {
      if (eventName) {
        const listener = () => {
          const elmValue = element[attribute as keyof Element];
          this.valueSetter(elmValue);
          if (this._binding.variable.hasOwnProperty(this._binding.property) || this._binding.property in this._binding.variable) {
            this._binding.variable[this._binding.property] = this.valueGetter();
          }

          if (typeof callback === 'function') {
            return callback(this.valueGetter());
          }
        };

        (binding as ElementBindingWithListener).event = eventName;
        (binding as ElementBindingWithListener).listener = listener;
        element.addEventListener(eventName, listener);
        this._boundedEventWithListeners.push({ element, eventName, listener, uid: this.generateUuidV4() });
      }
      this._elementBindings.push(binding);
      (element as any)[attribute] = typeof this._value === 'string' ? this.sanitizeText(this._value) : this._value;
    }
  }

  /** Generate a UUID version 4 RFC compliant */
  protected generateUuidV4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  protected sanitizeText(dirtyText: string): string {
    return (DOMPurify?.sanitize) ? DOMPurify.sanitize(dirtyText, {}) : dirtyText;
  }
}
