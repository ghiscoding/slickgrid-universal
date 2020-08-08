import { OperatorString, OperatorType } from '../enums/index';
import { SearchTerm } from '../enums/searchTerm.type';

export interface CurrentFilter {
  /**
   * Column Id that must be defined as a Column in the Columns Definition (using the "field" property).
   * However, please note that it will still check if there's a "queryField" defined and use if exists
   */
  columnId: string;

  /** Filter operator or use default operator when not provided */
  operator?: OperatorType | OperatorString;

  /** Filter search terms  */
  searchTerms?: SearchTerm[];
}
