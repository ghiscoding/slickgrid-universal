export enum OperatorType {
  /** value is empty */
  empty = '',

  /**
   * Custom filter operator, this operator will not do anything unless the developer (you) has an implementation associated with the usage of this custom operator.
   * In other words, without any implementation (typically a backend service) this operator does nothing by itself and only exists to provide a way for developers to customize their backend service filtering.
   */
  custom = 'Custom',

  /** value contains in X (search for substring in the string) */
  contains = 'Contains',

  /** value is NOT contained in X (inversed of "Contains") */
  notContains = 'Not_Contains',

  /** value less than X */
  lessThan = 'LT',

  /** value less than or equal to X */
  lessThanOrEqual = 'LE',

  /** value greater than X */
  greaterThan = 'GT',

  /** value great than or equal to X */
  greaterThanOrEqual = 'GE',

  /** value is NOT equal to X */
  notEqual = 'NE',

  /** value equal to X */
  equal = 'EQ',

  /** String ends with value */
  endsWith = 'EndsWith',

  /**
   * Search in an inclusive range of values that is greater or equal to search value X and is smaller or equal to value Y
   * For example the search term of "5..10" will return any values that are greater or equal to 5 and smaller or equal to 10 (the values 5 and 10 are included)
   */
  rangeInclusive = 'RangeInclusive',

  /**
   * Search in an exclusive range of values that is greater then search value X and is smaller then value Y
   * For example the search term of "5..10" will return any values that is greater then 5 and smaller then 10 (the values 5 and 10 are NOT to be included)
   */
  rangeExclusive = 'RangeExclusive',

  /** String starts with value */
  startsWith = 'StartsWith',

  /** Combo Starts With A + Ends With Z */
  startsWithEndsWith = 'StartsWithEndsWith',

  /** Find an equal match inside a collection */
  in = 'IN',

  /** Find a value that is NOT an equal match inside a collection (inversed operator of "IN") */
  notIn = 'NOT_IN',

  /**
   * Find a substring contained inside a collection, note that the input must be a formatted CSV string input.
   * For example, this condition would return `true` with `"IN_CONTAINS"`:: value='Task2' (or 'Task2,Task3'), collection=['Task2','Task3','Task4]
   * However, this would have returned `false` with "IN" because 'Task2' does not equal to the entire collection 'Task2,Task3,Task4'.
   */
  inContains = 'IN_CONTAINS',

  /** Find a substring that is NOT contained inside a collection (inversed operator of "IN_CONTAINS") */
  notInContains = 'NOT_IN_CONTAINS',

  /** Find a value from within a collection inside another collection */
  inCollection = 'IN_COLLECTION',

  /** Find a value that is NOT within a collection inside another collection (inversed operator of "IN_COLLECTION") */
  notInCollection = 'NOT_IN_COLLECTION'
}
