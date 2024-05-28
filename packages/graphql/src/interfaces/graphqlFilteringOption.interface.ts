import type { Column, OperatorString, OperatorType, SlickGrid } from '@slickgrid-universal/common';

export interface GraphqlFilteringOption {
  /** Field name to use when filtering */
  field: string;

  /** Operator to use when filtering */
  operator: OperatorType | OperatorString;

  /** Value to use when filtering */
  value: any | any[];
}

export interface GraphqlCustomFilteringOption {
  /** Field name to use when filtering */
  field: string;

  /** Custom Operator to use when filtering. Please note that any new Custom Operator must be implemented in your GraphQL Schema. */
  operator: OperatorType | OperatorString;

  /** Value to use when filtering */
  value: any | any[];
}

export interface GraphqlFilterQueryOverrideArgs {
  /** The column to define the filter for */
  columnDef: Column<any> | undefined;

  /** The GraphQL fieldName as target of the filter */
  fieldName: string;

  /** The operator selected by the user via the compound operator dropdown */
  columnFilterOperator: OperatorType;

  /** The inferred operator. See columnDef.autoParseInputFilterOperator */
  operator: OperatorType;

  /** The entered search value */
  searchValue: any;

  /** A reference to the SlickGrid instance */
  grid: SlickGrid | undefined;
}