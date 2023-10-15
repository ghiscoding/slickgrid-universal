import type { Column, FormatterResultObject, SlickGridModel } from './index';

export declare type Formatter <T = any> = (row: number, cell: number, value: any, columnDef: Column<T>, dataContext: T, grid: SlickGridModel) => string | FormatterResultObject;
