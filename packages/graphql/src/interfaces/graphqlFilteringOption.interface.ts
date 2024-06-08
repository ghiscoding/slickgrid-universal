import type { OperatorString, OperatorType } from '@slickgrid-universal/common';

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
  operator: any;

  /** Value to use when filtering */
  value: any | any[];
}
