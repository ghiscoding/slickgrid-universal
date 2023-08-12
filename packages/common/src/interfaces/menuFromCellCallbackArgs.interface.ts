import type { Column, SlickGridUniversal } from './index';

export interface MenuFromCellCallbackArgs {
  /** Grid cell/column index */
  cell: number;

  /** Grid row index */
  row: number;

  /** Reference to the grid. */
  grid: SlickGridUniversal;
}

export interface MenuFromCellWithColumnCallbackArgs<T = any> extends MenuFromCellCallbackArgs {
  /** Cell Column definition */
  column?: Column<T>;
}