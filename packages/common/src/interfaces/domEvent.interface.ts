export interface DOMEvent<T extends EventTarget> extends Event {
  currentTarget: T;
  target: T;
  relatedTarget: T;
}
export interface DOMMouseEvent<T extends EventTarget> extends MouseEvent {
  currentTarget: T;
  target: T;
  relatedTarget: T;
}
