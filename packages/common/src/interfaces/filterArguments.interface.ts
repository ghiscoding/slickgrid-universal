import type { Column, FilterCallback, SlickGridModel } from './index';
import type { OperatorString, OperatorType, SearchTerm } from '../enums/index';

export interface FilterArguments {
  grid: SlickGridModel;
  columnDef: Column;
  callback: FilterCallback;
  operator?: OperatorType | OperatorString;
  searchTerms?: SearchTerm[];
  i18n?: any;
  params?: any | any[];
  filterContainerElm: HTMLDivElement;
}
