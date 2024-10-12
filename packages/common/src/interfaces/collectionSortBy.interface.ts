import type { FieldType } from '../enums/index.js';

export interface CollectionSortBy {
  /** Object Property name when the collection is an array of objects */
  property?: string;

  /** defaults to false, is it in a descending order? */
  sortDesc?: boolean;

  /** Field type of the value or object value content */
  fieldType?: typeof FieldType[keyof typeof FieldType];
}
