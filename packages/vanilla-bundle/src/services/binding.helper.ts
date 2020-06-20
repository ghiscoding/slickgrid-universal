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

  constructor() { }

  dispose() {
    // for(const observer of this._observers) {
    //   observer.unbind()
    // }
  }

  addElementBinding(variable: any, property: string, selector: string, attribute: string, events?: string | string[], callback?: (val: any) => void) {
    const elm = document.querySelector<HTMLSpanElement>(`${this.querySelectorPrefix}${selector}`);
    if (elm) {
      // before creating a new observer, first check if the variable already has an associated observer
      // if we can't find an observer then we'll create a new one for it
      let observer = this._observers.find((bind) => bind.property === variable);
      if (!observer) {
        observer = new BindingService({ variable, property });
        if (Array.isArray(events)) {
          for (const eventName of events) {
            observer.bind(elm, attribute, eventName, callback);
          }
        } else {
          observer.bind(elm, attribute, events, callback);
        }
        this._observers.push(observer);
      }
    }
  }

  bindEventHandler(selector: string, eventName: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    const elm = document.querySelector<HTMLElement>(`${this.querySelectorPrefix}${selector}`);
    if (elm?.addEventListener) {
      elm.addEventListener(eventName, callback, options);
    }
  }
}
