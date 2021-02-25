import { SearchTerm } from '../enums/index';
import { FilterCondition, FilterConditionOption } from './../interfaces/index';
import { parseBoolean } from '../services/utilities';

/** Execute filter condition check on each cell */
export const executeBooleanFilterCondition: FilterCondition = ((options: FilterConditionOption, parsedSearchValue: boolean | undefined) => {
  return parseBoolean(options.cellValue) === parseBoolean(parsedSearchValue);
}) as FilterCondition;

/**
 * From our search filter value(s), get the parsed value(s).
 * This is called only once per filter before running the actual filter condition check on each cell
 */
export function getFilterParsedBoolean(inputSearchTerms: SearchTerm[] | undefined): boolean {
  const searchTerm = Array.isArray(inputSearchTerms) && inputSearchTerms[0] || false;
  return parseBoolean(searchTerm);
}
