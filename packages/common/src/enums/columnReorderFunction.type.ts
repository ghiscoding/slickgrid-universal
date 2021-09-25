import { Column, SlickEvent, SlickGrid } from '../interfaces/index';

export type ColumnReorderFunction = (grid: SlickGrid, headers: any, headerColumnWidthDiff: any, setColumns: (cols: Column[]) => void, setupColumnResize: () => void, columns: Column[], getColumnIndex: (column: Column) => number, uid: string, trigger: (slickEvent: SlickEvent, data?: any) => void) => void;
