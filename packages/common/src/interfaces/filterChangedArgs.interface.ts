import type { SlickGrid } from '../core/index.js';
import type { OperatorType, SearchTerm } from '../enums/index.js';
import type { Column, ColumnFilters } from './index.js';

export interface FilterChangedArgs {
  clearFilterTriggered?: boolean;
  columnDef: Column;
  columnFilters: ColumnFilters;
  grid: SlickGrid;
  operator: OperatorType;
  searchTerms: SearchTerm[];
  shouldTriggerQuery?: boolean;
  targetSelector?: string;
}
