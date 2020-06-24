import * as DOMPurify from 'dompurify';

interface Binding {
  variable: any;
  property: string;
}

interface ElementBinding {
  element: Element | null;
  attribute: string;
  event: string;
  callback?: (val: any) => any;
}


/**
 * Create 2 way Bindings for any variable that are primitive or object types, when it's an object type it will watch for property changes
 * The following 2 articles helped in building this service:
 *   1- https://blog.jeremylikness.com/blog/client-side-javascript-databinding-without-a-framework/
 *   2- https://www.wintellect.com/data-binding-pure-javascript/
 */
export class BindingService {
  _value: any = null;
  _binding: Binding;
  _property: string;
  elementBindings: any[] = [];

  constructor(binding: Binding) {
    this._binding = binding;
    this._property = binding.property || '';
    this.elementBindings = [];
    if (binding.property && binding.variable && (binding.variable.hasOwnProperty(binding.property) || binding.property in binding.variable)) {
      this._value = typeof binding.variable[binding.property] === 'string' ? DOMPurify.sanitize(binding.variable[binding.property], {}) : binding.variable[binding.property];
    } else {
      this._value = typeof binding.variable === 'string' ? DOMPurify.sanitize(binding.variable, {}) : binding.variable;
    }

    Object.defineProperty(binding.variable, binding.property, {
      get: this.valueGetter.bind(this),
      set: this.valueSetter.bind(this)
    });
  }

  get property() {
    return this._property;
  }

  valueGetter() {
    return this._value;
  }

  valueSetter(val: any) {
    this._value = typeof val === 'string' ? DOMPurify.sanitize(val, {}) : val;
    if (Array.isArray(this.elementBindings)) {
      for (const binding of this.elementBindings) {
        binding.element[binding.attribute] = typeof val === 'string' ? DOMPurify.sanitize(val, {}) : val;
      }
    }
  }

  /**
   * Add binding to an element by an object attribute and optionally on an event, we can do it in couple ways
   * 1- if there's no event provided, it will simply replace the DOM elemnt (by an attribute), for example an innerHTML
   * 2- when an event is provided, we will replace the DOM elemnt (by an attribute) every time an event is triggered
   *    2.1- we could also provide an extra callback method to execute when the event is triggered
   */
  bind(element: Element | null, attribute: string, eventName?: string, callback?: (val: any) => any) {
    const binding: ElementBinding = {
      element,
      attribute,
      event: '',
    };

    if (element) {
      if (eventName) {
        element.addEventListener(eventName, () => {
          const elmValue = element[attribute];
          this.valueSetter(elmValue);
          if (this._binding.variable.hasOwnProperty(this._binding.property)) {
            this._binding.variable[this._binding.property] = this.valueGetter();
          } else {
            this._binding.variable = this.valueGetter();
          }
          if (typeof callback === 'function') {
            return callback(this.valueGetter());
          }
        });
        binding.event = eventName;
      }
      this.elementBindings.push(binding);
      element[attribute] = typeof this._value === 'string' ? DOMPurify.sanitize(this._value, {}) : this._value;
    }
    return this;
  }

  /** Unbind (remove) an event from an element */
  unbind(element: Element | null, eventName: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
    if (element) {
      element.removeEventListener(eventName, listener, options);
    }
  }
}
