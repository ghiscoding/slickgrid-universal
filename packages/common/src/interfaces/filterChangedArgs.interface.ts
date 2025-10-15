import type { SlickGrid } from '../core/index.js';
import type { OperatorString, OperatorType, SearchTerm } from '../enums/index.js';
import type { Column, ColumnFilters } from './index.js';

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
