import type { SlickEvent } from '../core/slick.core';
import type { Column, SlickGridModel } from '../interfaces/index';

export type ColumnReorderFunction = (grid: SlickGridModel, headers: any, headerColumnWidthDiff: any, setColumns: (cols: Column[]) => void, setupColumnResize: () => void, columns: Column[], getColumnIndex: (columnId: string) => number, uid: string, trigger: (slickEvent: SlickEvent, data?: any) => void) => void;
