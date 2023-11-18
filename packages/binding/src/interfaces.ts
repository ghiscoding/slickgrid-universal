export interface Binding {
  variable: any;
  property: string;
}

export interface ElementBinding<T extends Element = Element> {
  element: T | null;
  attribute: string;
}

export interface ElementBindingWithListener<T extends Element = Element> extends ElementBinding<T> {
  event: string;
  listener: (val: any) => any;
}

export interface BoundedEventWithListener<T extends Element = Element> {
  element: T;
  eventName: string;
  listener: EventListenerOrEventListenerObject;
  uid: string;
}

export interface ElementEventListener {
  element: Element;
  eventName: string;
  listener: EventListenerOrEventListenerObject;
  groupName?: string;
}
