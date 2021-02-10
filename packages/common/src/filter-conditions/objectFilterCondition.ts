import { SearchTerm } from '../enums/searchTerm.type';
import { FilterCondition, FilterConditionOption } from '../interfaces/index';
import { compareObjects } from './filterUtilities';

/** Execute filter condition check on each cell */
export const executeObjectFilterCondition: FilterCondition = (options: FilterConditionOption, parsedSearchValue: SearchTerm) => {
  if (!parsedSearchValue && !options.operator) {
    return true;
  }

  switch (options.operator) {
    case '!=':
    case '<>':
    case 'NE':
      return !compareObjects(options.cellValue, parsedSearchValue, options.dataKey);
    case '=':
    case '==':
    case 'EQ':
    default:
      return compareObjects(options.cellValue, parsedSearchValue, options.dataKey);
  }
};

/**
 * From our search filter value(s), get the parsed value(s).
 * This is called only once per filter before running the actual filter condition check on each cell
 */
export function getFilterParsedObjectResult(inputSearchTerms: SearchTerm[] | undefined): SearchTerm {
  const searchTerm = (Array.isArray(inputSearchTerms) && inputSearchTerms[0] || '');
  return searchTerm;
}
