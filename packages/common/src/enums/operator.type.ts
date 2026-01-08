export type OperatorType =
  /** value is empty */
  | ''
  /** value is NOT equal to X */
  | '<>'
  /** value is NOT equal to X */
  | '!='
  /** value equal to X */
  | '='
  /** value equal to X */
  | '=='
  /** value greater than X */
  | '>'
  /** value great than or equal to X */
  | '>='
  /** value less than X */
  | '<'
  /** value less than or equal to X */
  | '<='
  /** value contained anywhere in the substring */
  | '*'
  /** String starts with value */
  | 'a*'
  /** String ends with value */
  | '*z'
  /** Combo Starts With A + Ends With Z */
  | 'a*z'
  /**
   * Custom filter operator, this operator will not do anything unless the developer (you) has an implementation associated with the usage of this custom operator.
   * In other words, without any implementation (typically a backend service) this operator does nothing by itself and only exists to provide a way for developers to customize their backend service filtering.
   */
  | 'Custom'
  /** value equal to X */
  | 'EQ'
  /** value great than or equal to X */
  | 'GE'
  /** value greater than X */
  | 'GT'
  /** value is NOT equal to X */
  | 'NE'
  /** value less than or equal to X */
  | 'LE'
  /** value less than X */
  | 'LT'
  /** Find an equal match inside a collection */
  | 'IN'
  /** Find a value that is NOT an equal match inside a collection (inversed operator of "IN") */
  | 'NIN'
  /** Find a value that is NOT an equal match inside a collection (inversed operator of "IN") */
  | 'NOT_IN'
  /**
   * Find a substring contained inside a collection, note that the input must be a formatted CSV string input.
   * For example, this condition would return `true` with `"IN_CONTAINS"`:: value='Task2' (or 'Task2,Task3'), collection=['Task2','Task3','Task4]
   * However, this would have returned `false` with "IN" because 'Task2' does not equal to the entire collection 'Task2,Task3,Task4'.
   */
  | 'IN_CONTAINS'
  /** Find a substring that is NOT contained inside a collection (inversed operator of "IN_CONTAINS") */
  | 'NIN_CONTAINS'
  /** Find a substring that is NOT contained inside a collection (inversed operator of "IN_CONTAINS") */
  | 'NOT_IN_CONTAINS'
  /** value is NOT contained in X (inversed of "Contains") */
  | 'NOT_CONTAINS'
  /** value is NOT contained in X (inversed of "Contains") */
  | 'Not_Contains'
  /** value contains in X (search for substring in the string) */
  | 'CONTAINS'
  /** value contains in X (search for substring in the string) */
  | 'Contains'
  /** String ends with value */
  | 'EndsWith'
  /** String starts with value */
  | 'StartsWith'
  /** Combo Starts With A + Ends With Z */
  | 'StartsWithEndsWith'
  /**
   * Search in an inclusive range of values that is greater or equal to search value X and is smaller or equal to value Y
   * For example the search term of "5..10" will return any values that are greater or equal to 5 and smaller or equal to 10 (the values 5 and 10 are included)
   */
  | 'RangeInclusive'
  /**
   * Search in an exclusive range of values that is greater then search value X and is smaller then value Y
   * For example the search term of "5..10" will return any values that is greater then 5 and smaller then 10 (the values 5 and 10 are NOT to be included)
   */
  | 'RangeExclusive'
  /** Find a value from within a collection inside another collection */
  | 'IN_COLLECTION'
  /** Find a value that is NOT within a collection inside another collection (inversed operator of "IN_COLLECTION") */
  | 'NOT_IN_COLLECTION';
