import type { Column } from './index.js';
import type { SlickGrid } from '../core/index.js';

export interface MenuFromCellCallbackArgs {
  /** Grid cell/column index */
  cell: number;

  /** Grid row index */
  row: number;

  /** Reference to the grid. */
  grid: SlickGrid;
}

export interface MenuFromCellWithColumnCallbackArgs<T = any> extends MenuFromCellCallbackArgs {
  /** Cell Column definition */
  column?: Column<T>;
}