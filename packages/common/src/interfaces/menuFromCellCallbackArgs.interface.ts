import type { SlickGrid } from '../core/index.js';
import type { Column } from './index.js';

export interface MenuFromCellCallbackArgs {
  /** Grid cell/column index */
  cell: number;

  /** Grid row index */
  row: number;

  /** Reference to the grid. */
  grid: SlickGrid;

  /** item data context object */
  dataContext: any;

  /** Cell Column definition */
  column?: Column;
}
