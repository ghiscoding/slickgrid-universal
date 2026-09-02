import type { SlickGrid } from '../core/slickGrid.js';

export interface CellArgs {
  row: number;
  cell: number;
  grid: SlickGrid;
  item?: any;
}
