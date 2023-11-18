import type { Column, FilterCallback } from './index';
import type { OperatorString, OperatorType, SearchTerm } from '../enums/index';
import type { SlickGrid } from '../core/index';

export interface FilterArguments {
  grid: SlickGrid;
  columnDef: Column;
  callback: FilterCallback;
  operator?: OperatorType | OperatorString;
  searchTerms?: SearchTerm[];
  i18n?: any;
  params?: any | any[];
  filterContainerElm: HTMLDivElement;
}
