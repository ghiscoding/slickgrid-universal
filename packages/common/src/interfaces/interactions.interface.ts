// --
// Slick Interactions

import type { DragPosition } from './drag.interface.js';

export interface InteractionBase {
  destroy: () => void;
  stop?: () => void;
}

export interface ClassDetectElement {
  /** element id to match */
  id?: string;

  /** element cssSelector to match */
  cssSelector?: string;

  /** tag to be returned on match */
  tag: string;
}

export interface DraggableOption {
  /** container DOM element, defaults to "document" */
  containerElement?: HTMLElement | Document;

  /** when defined, only allow dragging from an element that matches a specific query selector */
  allowDragFrom?: string;

  /** when defined, will allow dragging from a specific element or its closest parent by using the .closest() query selector. */
  allowDragFromClosest?: string;

  /** array of elements to match for drag start */
  dragFromClassDetectArr?: Array<ClassDetectElement>;

  /** Defaults to `['ctrlKey', 'metaKey']`, list of keys that when pressed will prevent Draggable events from triggering (e.g. prevent onDrag when Ctrl key is pressed while dragging) */
  preventDragFromKeys?: Array<'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>;

  /** drag initialized callback */
  onDragInit?: (e: DragEvent, dd: DragPosition) => boolean | void;

  /** drag started callback */
  onDragStart?: (e: DragEvent, dd: DragPosition) => boolean | void;

  /** drag callback */
  onDrag?: (e: DragEvent, dd: DragPosition) => boolean | void;

  /** drag ended callback */
  onDragEnd?: (e: DragEvent, dd: DragPosition) => boolean | void;
}

export interface MouseWheelOption {
  /** optional DOM element to attach mousewheel values, if undefined we'll attach it to the "window" object */
  element: HTMLElement | Document;

  /** mousewheel callback */
  onMouseWheel?: (e: MouseEvent, delta: number, deltaX: number, deltaY: number) => boolean | void;
}

export interface ResizableOption {
  /** resizable DOM element */
  resizeableElement: HTMLElement;

  /** resizable DOM element */
  resizeableHandleElement: HTMLElement;

  /** resize start callback */
  onResizeStart?: (e: MouseEvent | Touch | TouchEvent, resizeElms: { resizeableElement: HTMLElement }) => boolean | void;

  /** resizing callback */
  onResize?: (
    e: MouseEvent | Touch | TouchEvent,
    resizeElms: { resizeableElement: HTMLElement; resizeableHandleElement: HTMLElement }
  ) => boolean | void;

  /** resize ended callback */
  onResizeEnd?: (e: MouseEvent | Touch | TouchEvent, resizeElms: { resizeableElement: HTMLElement }) => boolean | void;
}
