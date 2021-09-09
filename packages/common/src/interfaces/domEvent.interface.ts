export interface DOMEvent<T extends EventTarget> extends Event {
  target: T;
  relatedTarget: T;
}
export interface DOMMouseEvent<T extends EventTarget> extends MouseEvent {
  target: T;
  relatedTarget: T;
}
