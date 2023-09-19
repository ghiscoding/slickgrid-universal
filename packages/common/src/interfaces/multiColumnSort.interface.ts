import type { ColumnSort, SlickGridUniversal } from './index';

export interface MultiColumnSort {
  /** SlickGrid grid object */
  grid: SlickGridUniversal;

  /** is it a multi-column sort? */
  multiColumnSort: true;

  /** Array of Columns to be sorted */
  sortCols: ColumnSort[];

  /** previous sort columns before calling onSort */
  previousSortColumns?: ColumnSort[];
}
