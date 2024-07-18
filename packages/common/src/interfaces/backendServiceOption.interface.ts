import type { SlickGrid } from '../core';
import type { OperatorType } from '../enums';
import type { Column } from './column.interface';

export interface InfiniteScrollOption {
  fetchSize: number;
}

export interface BackendServiceOption {
  /** Infinite Scroll will fetch next page but without showing any pagination in the UI. */
  infiniteScroll?: boolean | InfiniteScrollOption;

  /** What are the pagination options? ex.: (first, last, offset) */
  paginationOptions?: any;

  /** array of Filtering Options, ex.: [{ field: 'firstName', operator: 'EQ', value: 'John' }] */
  filteringOptions?: any[];

  /** array of Filtering Options, ex.: [{ field: 'firstName', direction: 'DESC' }] */
  sortingOptions?: any[];

  /** Execute the process callback command on component init (page load) */
  executeProcessCommandOnInit?: boolean;
}

export interface BackendServiceFilterQueryOverrideArgs {
  /** The column to define the filter for */
  columnDef: Column<any> | undefined;
  /** The OData fieldName as target of the filter */
  fieldName: string;
  /** The operator selected by the user via the compound operator dropdown */
  columnFilterOperator: OperatorType;
  /** The inferred operator. See columnDef.autoParseInputFilterOperator */
  operator: OperatorType;
  /** The entered search value */
  searchValues: any[];
  /** A reference to the SlickGrid instance */
  grid: SlickGrid | undefined;
}