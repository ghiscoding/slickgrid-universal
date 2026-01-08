import type { OperatorType } from '../enums/operator.type.js';

export interface CollectionFilterBy {
  /** Object Property name when the collection is an array of objects */
  property?: string;

  /** Value to filter from the collection */
  value: any;

  /** Operator to use when filtering the value from the collection, limited subset of the available operators. */
  operator?: Extract<OperatorType, '=' | '!=' | 'EQ' | 'NE' | 'Contains' | 'CONTAINS' | 'NOT_CONTAINS' | 'Not_Contains'>;
}
