import { Column, FilterCallback } from './index';
import { OperatorString, OperatorType, SearchTerm } from '../enums/index';

export interface FilterArguments {
  grid: any;
  columnDef: Column;
  callback: FilterCallback;
  operator?: OperatorType | OperatorString;
  searchTerms?: SearchTerm[];
  i18n?: any;
  params?: any | any[];
}
