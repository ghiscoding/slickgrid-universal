import type { Column } from './column.interface';
import type { ColumnFilters } from './columnFilters.interface';
import type { OperatorType } from '../enums/operatorType.enum';
import type { OperatorString } from '../enums/operatorString.type';
import type { SearchTerm } from '../enums/searchTerm.type';
import type { SlickGrid } from './slickGrid.interface';

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
