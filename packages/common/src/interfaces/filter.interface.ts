import type { Column, FilterArguments, FilterCallback } from './index';
import type { OperatorType, OperatorString, SearchTerm, } from '../enums/index';
import type { SlickGrid } from '../core/index';

// export type Filter = (searchTerms: string | number | string[] | number[], columnDef: Column, params?: any) => string;
export interface Filter {
  // Properties which must be Public

  /** Column definition */
  columnDef: Column;

  /** Callback that will be run after the filter triggers */
  callback: FilterCallback;

  /** SlickGrid grid object */
  grid: SlickGrid;

  /** The default search operator for the filter when not provided */
  defaultOperator?: OperatorString | OperatorType;

  /** The search operator for the filter */
  operator: OperatorType | OperatorString;

  /** You can use "params" to pass any generic arguments to your Filter */
  params?: any | any[];

  /** Array of defined search terms to pre-load */
  searchTerms?: SearchTerm[];

  // --
  // public functions

  /** Filter class initialization, executed by the FilterService right after creating the Filter */
  init: (args: FilterArguments, isFilterFirstRender?: boolean) => void;

  /** Clear filter function */
  clear: (shouldTriggerQuery?: boolean) => void;

  /** Destroy filter function */
  destroy: () => void;

  /** Get value(s) of the DOM element */
  getValues?: () => SearchTerm | SearchTerm[] | undefined;

  /** Set value(s) on the DOM element */
  setValues: (values: SearchTerm | SearchTerm[], operator?: OperatorType | OperatorString) => void;
}
