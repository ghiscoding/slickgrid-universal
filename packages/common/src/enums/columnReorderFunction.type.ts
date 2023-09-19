import type { SlickEvent } from 'slickgrid';
import type { Column, SlickGridUniversal } from '../interfaces/index';

export type ColumnReorderFunction = (grid: SlickGridUniversal, headers: any, headerColumnWidthDiff: any, setColumns: (cols: Column[]) => void, setupColumnResize: () => void, columns: Column[], getColumnIndex: (columnId: string) => number, uid: string, trigger: (slickEvent: SlickEvent, data?: any) => void) => void;
