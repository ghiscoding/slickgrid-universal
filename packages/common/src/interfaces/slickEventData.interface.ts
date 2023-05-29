export interface SlickEventData extends Event, KeyboardEvent, MouseEvent, TouchEvent {
  /** Stops event from propagating up the DOM tree. */
  stopPropagation: () => void;

  /** Returns whether stopPropagation was called on this event object. */
  isPropagationStopped: () => boolean;

  /** Returns the event defaultPrevented option */
  isDefaultPrevented: () => boolean;

  /** Prevents the rest of the handlers from being executed. */
  stopImmediatePropagation: () => void;

  /** Returns whether stopImmediatePropagation was called on this event object. */
  isImmediatePropagationStopped: () => boolean;

  /** Add a returned value for when it is called by the event */
  addReturnValue: (val: any) => void;

  /** Get the returned value after event was called */
  getReturnValue: () => any;

  /** Get EventData arguments if any */
  getArguments: () => any[] | undefined;

  /** Returns the native DOM event attached */
  getNativeEvent: () => any;
}
