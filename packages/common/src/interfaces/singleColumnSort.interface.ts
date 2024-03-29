import type { ColumnSort } from './index';
import type { SlickGrid } from '../core/index';

export interface SingleColumnSort extends ColumnSort {
  /** SlickGrid grid object */
  grid?: SlickGrid;

  /** is it a multi-column sort? */
  multiColumnSort?: false;

  /** previous sort columns before calling onSort */
  previousSortColumns?: ColumnSort[];
}
