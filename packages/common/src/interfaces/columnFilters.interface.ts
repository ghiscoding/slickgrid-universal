import type { SearchColumnFilter } from './searchColumnFilter.interface.js';

export interface ColumnFilters {
  [key: string]: SearchColumnFilter;
}
