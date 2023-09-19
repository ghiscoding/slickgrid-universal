import type { SlickGridUniversal } from './index';

export interface DragPosition {
  startX: number;
  startY: number;
  range: DragRange;
}

export interface DragRange {
  start: {
    row?: number;
    cell?: number;
  };
  end: {
    row?: number;
    cell?: number;
  };
}

export interface DragRowMove {
  available: any[];
  canMove: boolean;
  clonedSlickRow: HTMLElement;
  deltaX: number;
  deltaY: number;
  drag: HTMLElement;
  drop: any[];
  grid: SlickGridUniversal;
  guide: HTMLElement;
  insertBefore: number;
  offsetX: number;
  offsetY: number;
  originalX: number;
  originalY: number;
  proxy: HTMLElement;
  selectionProxy: HTMLElement;
  target: HTMLElement;
  selectedRows: number[];
  startX: number;
  startY: number;
}