export class BindingService {
  _value: any = null;
  _binding: any;
  _property: string;
  elementBindings: any[];

  constructor(binding: { variable: any; property?: string; }) {
    this._binding = binding;
    this._property = binding.property;
    this.elementBindings = [];
    if (binding.variable.hasOwnProperty(binding.property)) {
      this._value = binding.variable[binding.property];
    } else {
      this._value = binding.variable;
    }
  }

  get property() {
    return this._property;
  }

  valueGetter() {
    return this._value;
  }

  valueSetter(val: any) {
    this._value = val;
    for (let i = 0; i < this.elementBindings.length; i++) {
      const binding = this.elementBindings[i];
      binding.element[binding.attribute] = val;
    }
  }

  /**
   * Add binding to an element by an object attribute and optionally on an event, we can do it in couple ways
   * 1- if there's no event provided, it will simply replace the DOM elemnt (by an attribute), for example an innerHTML
   * 2- when an event is provided, we will replace the DOM elemnt (by an attribute) every time an event is triggered
   *    2.1- we could also provide an extra callback method to execute when the event is triggered
   */
  bind(element: Element | null, attribute: string, eventName?: string, callback?: (val: any) => any) {
    const binding = {
      element,
      attribute,
      event: null,
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
      element[attribute] = this._value ?? null;
    }
    return this;
  }

  /** Unbind (remove) an event from an element */
  unbind(element: Element | null, eventName: string, callback: () => void) {
    if (element) {
      element.removeEventListener(eventName, callback);
    }
  }
}
