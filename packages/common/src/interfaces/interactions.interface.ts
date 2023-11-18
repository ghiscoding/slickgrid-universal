/* eslint-disable @typescript-eslint/ban-types */
// --
// slick.interactions.ts

import { DOMMouseOrTouchEvent } from './domEvent.interface';
import { DragPosition } from './drag.interface';

export interface InteractionBase {
  destroy: () => void;
}

export interface DraggableOption {
  /** container DOM element, defaults to "document" */
  containerElement?: HTMLElement | Document;

  /** when defined, only allow dragging from an element that matches a specific query selector */
  allowDragFrom?: string;

  /** when defined, will allow dragging from a specific element or its closest parent by using the .closest() query selector. */
  allowDragFromClosest?: string;

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
  onResizeStart?: (e: DOMMouseOrTouchEvent<HTMLDivElement>, resizeElms: { resizeableElement: HTMLElement; }) => boolean | void;

  /** resizing callback */
  onResize?: (e: DOMMouseOrTouchEvent<HTMLDivElement>, resizeElms: { resizeableElement: HTMLElement; resizeableHandleElement: HTMLElement; }) => boolean | void;

  /** resize ended callback */
  onResizeEnd?: (e: DOMMouseOrTouchEvent<HTMLDivElement>, resizeElms: { resizeableElement: HTMLElement; }) => boolean | void;
}