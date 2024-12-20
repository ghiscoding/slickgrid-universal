import type { SlickGrid } from '../core/index.js';
import type { Column, FormatterResultWithHtml, FormatterResultWithText } from './index.js';

export declare type Formatter<T = any> = (
  row: number,
  cell: number,
  value: any,
  columnDef: Column<T>,
  dataContext: T,
  grid: SlickGrid
) => string | HTMLElement | DocumentFragment | FormatterResultWithHtml | FormatterResultWithText;
