import { SearchTerm } from '../enums/searchTerm.type';
import { Column } from './column.interface';
import { ColumnFilters } from './columnFilters.interface';
import { OperatorType } from '../enums/operatorType.enum';
import { OperatorString } from '../enums/operatorString.type';

export interface FilterChangedArgs {
  clearFilterTriggered?: boolean;
  columnDef: Column;
  columnFilters: ColumnFilters;
  grid: any;
  operator: OperatorType | OperatorString;
  searchTerms: SearchTerm[];
  shouldTriggerQuery?: boolean;
}
