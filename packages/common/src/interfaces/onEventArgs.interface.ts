import type { Column } from './index.js';
import type { SlickDataView, SlickGrid } from '../core/index.js';

export interface OnEventArgs {
  row: number;
  cell: number;
  columnDef: Column;
  dataContext: any;
  dataView: SlickDataView;
  grid: SlickGrid;
}
