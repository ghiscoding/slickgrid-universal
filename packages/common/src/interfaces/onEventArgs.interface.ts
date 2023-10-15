import type { SlickDataView } from '../core/index';
import type { Column, SlickGridModel } from './index';

export interface OnEventArgs {
  row: number;
  cell: number;
  columnDef: Column;
  dataContext: any;
  dataView: SlickDataView;
  grid: SlickGridModel;
}
