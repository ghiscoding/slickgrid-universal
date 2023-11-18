import type { SlickGrid } from '../core/index';

export interface CellArgs {
  row: number;
  cell: number;
  grid: SlickGrid;
  item?: any;
}
