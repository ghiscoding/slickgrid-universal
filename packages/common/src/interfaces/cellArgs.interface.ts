import type { SlickGridModel } from './index';

export interface CellArgs {
  row: number;
  cell: number;
  grid: SlickGridModel;
  item?: any;
}
