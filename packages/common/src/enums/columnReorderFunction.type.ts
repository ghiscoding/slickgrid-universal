import type { SlickEvent } from '../core/slickCore.js';
import type { SlickGrid } from '../core/slickGrid.js';
import type { Column } from '../interfaces/index.js';

export type ColumnReorderFunction = (
  grid: SlickGrid,
  headers: any,
  headerColumnWidthDiff: any,
  setColumns: (cols: Column[]) => void,
  setupColumnResize: () => void,
  columns: Column[],
  getColumnIndex: (columnId: string) => number,
  uid: string,
  trigger: (slickEvent: SlickEvent, data?: any) => void
) => void;
