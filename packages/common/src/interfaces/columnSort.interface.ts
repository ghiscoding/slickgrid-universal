import type { Column } from './column.interface';

export interface ColumnSort {
  /** Column Id to be sorted */
  columnId: string | number;

  /** Are we sorting in Ascending order? It will default to ascending when this property is undefined */
  sortAsc?: boolean;

  /** Column to be sorted */
  sortCol?: Column;
}
