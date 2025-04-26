import { executeBooleanFilterCondition } from './booleanFilterCondition.js';
import { executeCollectionSearchFilterCondition } from './collectionSearchFilterCondition.js';
import { executeNumberFilterCondition } from './numberFilterCondition.js';
import { executeStringFilterCondition } from './stringFilterCondition.js';
import type { FilterCondition, FilterConditionOption } from '../interfaces/index.js';
import type { SearchTerm } from '../enums/searchTerm.type.js';
import { isCollectionOperator } from './filterUtilities.js';
import { getVarTypeOfByColumnFieldType } from './filterConditionProcesses.js';
import { executeDateFilterCondition } from './dateFilterCondition.js';
import { executeObjectFilterCondition } from './objectFilterCondition.js';

/** Execute mapped condition (per field type) for each cell in the grid */
export const executeFilterConditionTest: FilterCondition = ((
  options: FilterConditionOption,
  parsedSearchTerms: SearchTerm | SearchTerm[]
) => {
  // when using a multi-select ('IN' operator) we will not use the field type but instead go directly with a collection search
  if (isCollectionOperator(options.operator)) {
    return executeCollectionSearchFilterCondition(options);
  }

  // From a more specific field type (dateIso, dateEuro, text, readonly, ...), get the more generalized type (boolean, date, number, object, text)
  const generalizedType = getVarTypeOfByColumnFieldType(options.filterSearchType || options.fieldType);

  // execute the mapped type, or default to String condition check
  switch (generalizedType) {
    case 'boolean':
      // the parsedSearchTerms should be single value (result came from getFilterParsedBoolean() method)
      return executeBooleanFilterCondition(options, parsedSearchTerms as SearchTerm);
    case 'date':
      return executeDateFilterCondition(options, (parsedSearchTerms || []) as Array<Date | string>);
    case 'number':
      return executeNumberFilterCondition(options, (parsedSearchTerms || []) as number[]);
    case 'object':
      // the parsedSearchTerms should be single value (result came from getFilterParsedObjectResult() method)
      return executeObjectFilterCondition(options, parsedSearchTerms as SearchTerm);
    case 'string':
    default:
      // the parsedSearchTerms should be single value (result came from getFilterParsedText() method)
      return executeStringFilterCondition(options, (parsedSearchTerms || []) as string[]);
  }
}) as FilterCondition;

export const FilterConditions: Record<string, FilterCondition> = {
  executeFilterConditionTest: executeFilterConditionTest as FilterCondition,
  booleanFilter: executeBooleanFilterCondition,
  collectionSearchFilter: executeCollectionSearchFilterCondition,
  numberFilter: executeNumberFilterCondition,
  stringFilter: executeStringFilterCondition,
};
