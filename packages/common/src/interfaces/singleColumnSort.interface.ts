import type { ColumnSort, SlickGridUniversal } from './index';

export interface SingleColumnSort extends ColumnSort {
  /** SlickGrid grid object */
  grid?: SlickGridUniversal;

  /** is it a multi-column sort? */
  multiColumnSort?: false;

  /** previous sort columns before calling onSort */
  previousSortColumns?: ColumnSort[];
}
