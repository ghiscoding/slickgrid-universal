import { Column } from './column.interface';
import { DataView } from './dataView.interface';

export interface OnEventArgs {
  row: number;
  cell: number;
  columnDef: Column;
  dataContext: any;
  dataView: DataView;
  grid: any;    // TODO replace by a SlickGrid interface
}
