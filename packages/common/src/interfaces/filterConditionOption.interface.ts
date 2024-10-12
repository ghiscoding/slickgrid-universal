import type { FieldType, OperatorString, OperatorType, SearchTerm } from '../enums/index.js';

export interface FilterConditionOption {
  /** optional object data key */
  dataKey?: string;

  /** pull the grid option default filter in case the "operator" provided is not a range operator or is simply undefined */
  defaultFilterRangeOperator: OperatorType | OperatorString;

  /** filter operator */
  operator: OperatorString;

  /** cell value */
  cellValue: any;

  /** last character of the cell value, which is helpful to know if we are dealing with "*" that would be mean startsWith */
  searchInputLastChar?: string;

  /** column field type */
  fieldType: typeof FieldType[keyof typeof FieldType];

  /** filter search field type */
  filterSearchType?: typeof FieldType[keyof typeof FieldType];

  /** should we ignore any accent while filtering text? */
  ignoreAccentOnStringFilterAndSort?: any;

  /**
   * Parsed Search Terms is similar to SearchTerms but is already parsed in the correct format,
   * for example on a date field the searchTerms might be in string format but their respective parsedSearchTerms will be of type Date
   */
  parsedSearchTerms?: SearchTerm[] | undefined;

  /** Search Terms provided by the user */
  searchTerms?: SearchTerm[] | undefined;
}
