import type { Column } from './column.interface';
import type { SlickDataView } from './slickDataView.interface';
import type { SlickGrid } from './slickGrid.interface';

export interface OnEventArgs {
  row: number;
  cell: number;
  columnDef: Column;
  dataContext: any;
  dataView: SlickDataView;
  grid: SlickGrid;
}
