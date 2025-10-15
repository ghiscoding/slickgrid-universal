import type { SlickGrid } from '../core/index.js';
import type { ColumnSort } from './index.js';

export interface MultiColumnSort {
  /** SlickGrid grid object */
  grid: SlickGrid;

  /** is it a multi-column sort? */
  multiColumnSort: true;

  /** Array of Columns to be sorted */
  sortCols: ColumnSort[];

  /** previous sort columns before calling onSort */
  previousSortColumns?: ColumnSort[];
}
