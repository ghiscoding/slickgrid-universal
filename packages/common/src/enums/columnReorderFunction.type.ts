import type { Column } from '../interfaces/index';
import type { SlickEvent, SlickGrid } from '../core/index';

export type ColumnReorderFunction = (grid: SlickGrid, headers: any, headerColumnWidthDiff: any, setColumns: (cols: Column[]) => void, setupColumnResize: () => void, columns: Column[], getColumnIndex: (columnId: string) => number, uid: string, trigger: (slickEvent: SlickEvent, data?: any) => void) => void;
