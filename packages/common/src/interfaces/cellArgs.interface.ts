import type { SlickGrid } from '../core/index.js';

export interface CellArgs {
  row: number;
  cell: number;
  grid: SlickGrid;
  item?: any;
}
