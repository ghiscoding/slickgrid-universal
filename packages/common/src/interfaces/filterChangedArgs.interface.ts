import type { OperatorString, OperatorType, SearchTerm } from '../enums/index';
import type { Column, ColumnFilters } from './index';
import type { SlickGrid } from '../core/index';

export interface FilterChangedArgs {
  clearFilterTriggered?: boolean;
  columnDef: Column;
  columnFilters: ColumnFilters;
  grid: SlickGrid;
  operator: OperatorType | OperatorString;
  searchTerms: SearchTerm[];
  shouldTriggerQuery?: boolean;
  targetSelector?: string;
}
