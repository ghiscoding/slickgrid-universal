import { FieldType, type SearchTerm } from '../enums/index.js';
import type { FilterCondition, FilterConditionOption } from '../interfaces/index.js';
import { executeBooleanFilterCondition, getFilterParsedBoolean } from './booleanFilterCondition.js';
import { executeCollectionSearchFilterCondition } from './collectionSearchFilterCondition.js';
import { getFilterParsedNumbers, executeNumberFilterCondition } from './numberFilterCondition.js';
import { executeDateFilterCondition, getFilterParsedDates } from './dateFilterCondition.js';
import { executeObjectFilterCondition, getFilterParsedObjectResult } from './objectFilterCondition.js';
import { executeStringFilterCondition, getFilterParsedText } from './stringFilterCondition.js';
import { isCollectionOperator } from './filterUtilities.js';
import { isColumnDateType } from '../services/utilities.js';

/**
 * General variable types, just 5x types instead of the multiple FieldType.
 * For example all DateIso, DateUs are all "date", this makes it easier to know which filter condition to call
 */
export type GeneralVariableDataType = 'boolean' | 'date' | 'number' | 'object' | 'string';

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
      return executeDateFilterCondition(options, (parsedSearchTerms || []) as any[]);
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

/**
 * From our search filter value(s), get their parsed value(s), for example a "dateIso" filter will be parsed as Date object.
 * Then later when we execute the filtering checks, we won't need to re-parse all search value(s) again and again.
 * So this is called only once, for each search filter that is, prior to running the actual filter condition checks on each cell afterward.
 */
export function getParsedSearchTermsByFieldType(
  inputSearchTerms: SearchTerm[] | undefined,
  inputFilterSearchType: (typeof FieldType)[keyof typeof FieldType]
): SearchTerm | SearchTerm[] | undefined {
  const generalizedType = getVarTypeOfByColumnFieldType(inputFilterSearchType);
  let parsedSearchValues: SearchTerm | SearchTerm[] | undefined;

  // parse the search value(s), the Date & Numbers could be in a range and so we will return an array for them
  // any other type will return a single search value
  switch (generalizedType) {
    case 'boolean':
      parsedSearchValues = getFilterParsedBoolean(inputSearchTerms) as boolean;
      break;
    case 'date':
      parsedSearchValues = getFilterParsedDates(inputSearchTerms, inputFilterSearchType) as SearchTerm[];
      break;
    case 'number':
      parsedSearchValues = getFilterParsedNumbers(inputSearchTerms) as SearchTerm[];
      break;
    case 'object':
      parsedSearchValues = getFilterParsedObjectResult(inputSearchTerms);
      break;
    case 'string':
      parsedSearchValues = getFilterParsedText(inputSearchTerms) as SearchTerm[];
      break;
  }
  return parsedSearchValues;
}

/**
 * From a more specific field type, let's return a simple and more general type (boolean, date, number, object, text)
 * @param fieldType - specific field type
 * @returns generalType - general field type
 */
export function getVarTypeOfByColumnFieldType(fieldType: (typeof FieldType)[keyof typeof FieldType]): GeneralVariableDataType {
  if (isColumnDateType(fieldType)) {
    return 'date';
  }

  // return general field type
  switch (fieldType) {
    case FieldType.boolean:
      return 'boolean';
    case FieldType.integer:
    case FieldType.float:
    case FieldType.number:
      return 'number';
    case FieldType.object:
      return 'object';
    case FieldType.string:
    case FieldType.text:
    case FieldType.password:
    case FieldType.readonly:
    default:
      return 'string';
  }
}
