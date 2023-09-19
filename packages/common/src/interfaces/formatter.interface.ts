import type { Column, FormatterResultObject, SlickGridUniversal } from './index';

export declare type Formatter <T = any> = (row: number, cell: number, value: any, columnDef: Column<T>, dataContext: T, grid: SlickGridUniversal) => string | FormatterResultObject;
