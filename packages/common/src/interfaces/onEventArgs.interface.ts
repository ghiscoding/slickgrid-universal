import type { Column } from './index';
import type { SlickDataView, SlickGrid } from '../core/index';

export interface OnEventArgs {
  row: number;
  cell: number;
  columnDef: Column;
  dataContext: any;
  dataView: SlickDataView;
  grid: SlickGrid;
}
