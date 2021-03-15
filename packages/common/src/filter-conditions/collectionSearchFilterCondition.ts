import { FilterCondition, FilterConditionOption } from '../interfaces/index';
import { toKebabCase } from '../services';
import { testFilterCondition } from './filterUtilities';

/**
 * Execute filter condition check on each cell.
 * This is used only by the Select Single/Multiple Filter which uses the "multiple-select.js" 3rd party lib which always provide values as strings
 */
export const executeCollectionSearchFilterCondition: FilterCondition = (options: FilterConditionOption) => {
  // multiple-select will always return text, so we should make our cell values text as well
  const cellValue = (options.cellValue === undefined || options.cellValue === null) ? '' : `${options.cellValue}`;

  return testFilterCondition(options.operator || 'IN', (!!cellValue ? toKebabCase(cellValue) : ''), (!!options.searchTerms && !!options.searchTerms.length ? options.searchTerms.map(searchTerm => toKebabCase(searchTerm.toString())) : []));
};