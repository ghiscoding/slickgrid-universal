import type { SlickDataView } from 'slickgrid';
import type { Column, SlickGridUniversal } from './index';

export interface OnEventArgs {
  row: number;
  cell: number;
  columnDef: Column;
  dataContext: any;
  dataView: SlickDataView;
  grid: SlickGridUniversal;
}
