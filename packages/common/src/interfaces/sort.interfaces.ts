import type { SlickGrid } from '../core/index.js';
import type { Column } from './column.interface.js';

export interface ColumnSort {
  /** Column Id to be sorted */
  columnId: string | number;

  /** Are we sorting in Ascending order? It will default to ascending when this property is undefined */
  sortAsc?: boolean;

  /** Column to be sorted */
  sortCol?: Column;
}

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

export interface SingleColumnSort extends ColumnSort {
  /** SlickGrid grid object */
  grid?: SlickGrid;

  /** is it a multi-column sort? */
  multiColumnSort?: false;

  /** previous sort columns before calling onSort */
  previousSortColumns?: ColumnSort[];
}

export type OnBackendSortChangedArgs = (SingleColumnSort | MultiColumnSort) & { clearSortTriggered?: boolean };
export type OnLocalSortChangedArgs = Array<ColumnSort & { clearSortTriggered?: boolean }>;
