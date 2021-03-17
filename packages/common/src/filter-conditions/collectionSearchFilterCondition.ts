import { FilterCondition, FilterConditionOption } from '../interfaces/index';
import { testFilterCondition } from './filterUtilities';

/**
 * Execute filter condition check on each cell.
 * This is used only by the Select Single/Multiple Filter which uses the "multiple-select.js" 3rd party lib which always provide values as strings
 */
export const executeCollectionSearchFilterCondition: FilterCondition = (options: FilterConditionOption) => {
  // multiple-select will always return text, so we should make our cell values text as well
  const cellValue = (options.cellValue === undefined || options.cellValue === null) ? '' : ((options.operator === 'IN_COLLECTION' || options.operator === 'NOT_IN_COLLECTION') && Array.isArray(options.cellValue)) ? options.cellValue.map(value => `${value}`) : `${options.cellValue}`;

  return testFilterCondition(options.operator || 'IN', cellValue, options.searchTerms || []);
};