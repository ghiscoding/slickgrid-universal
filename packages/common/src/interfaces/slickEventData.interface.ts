export interface SlickEventData extends Event, KeyboardEvent, MouseEvent, TouchEvent {
  /** Stops event from propagating up the DOM tree. */
  stopPropagation: () => void;

  /** Returns whether stopPropagation was called on this event object. */
  isPropagationStopped: () => boolean;

  /** Prevents the rest of the handlers from being executed. */
  stopImmediatePropagation: () => void;

  /** Returns whether stopImmediatePropagation was called on this event object. */
  isImmediatePropagationStopped: () => boolean;
}
