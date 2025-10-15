import type { SlickGrid } from '../core/index.js';
import type { OperatorString, OperatorType, SearchTerm } from '../enums/index.js';
import type { Column, FilterCallback } from './index.js';

export interface FilterArguments {
  grid: SlickGrid;
  columnDef: Column;
  callback: FilterCallback;
  operator?: OperatorType | OperatorString;
  searchTerms?: SearchTerm[];
  i18n?: any;
  params?: any | any[];
  filterContainerElm: HTMLElement;
}
