import type { SlickGridUniversal } from './index';

export interface CellArgs {
  row: number;
  cell: number;
  grid: SlickGridUniversal;
  item?: any;
}
