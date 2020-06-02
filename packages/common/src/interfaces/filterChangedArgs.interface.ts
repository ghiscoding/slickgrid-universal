import { Column } from './column.interface';
import { ColumnFilters } from './columnFilters.interface';
import { OperatorType } from '../enums/operatorType.enum';
import { OperatorString } from '../enums/operatorString.type';
import { SearchTerm } from '../enums/searchTerm.type';
import { SlickGrid } from './slickGrid.interface';

export interface FilterChangedArgs {
  clearFilterTriggered?: boolean;
  columnDef: Column;
  columnFilters: ColumnFilters;
  grid: SlickGrid;
  operator: OperatorType | OperatorString;
  searchTerms: SearchTerm[];
  shouldTriggerQuery?: boolean;
}
