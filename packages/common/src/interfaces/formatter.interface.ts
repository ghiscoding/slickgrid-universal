import type { Column, FormatterResultWithHtml, FormatterResultWithText, SlickGridModel } from './index';

export declare type Formatter<T = any> = (row: number, cell: number, value: any, columnDef: Column<T>, dataContext: T, grid: SlickGridModel) => string | HTMLElement | FormatterResultWithHtml | FormatterResultWithText;
