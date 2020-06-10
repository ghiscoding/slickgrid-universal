import { ColumnSort } from './columnSort.interface';
import { SlickGrid } from './slickGrid.interface';

export interface MultiColumnSort {
  /** SlickGrid grid object */
  grid: SlickGrid;

  /** is it a multi-column sort? */
  multiColumnSort: true;

  /** Array of Columns to be sorted */
  sortCols: ColumnSort[];
}
