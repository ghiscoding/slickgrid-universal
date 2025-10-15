import { FieldType, type SearchTerm } from '../enums/index.js';
import { isColumnDateType } from '../services/utilities.js';
import { getFilterParsedBoolean } from './booleanFilterCondition.js';
import { getFilterParsedDates } from './dateFilterCondition.js';
import { getFilterParsedNumbers } from './numberFilterCondition.js';
import { getFilterParsedObjectResult } from './objectFilterCondition.js';
import { getFilterParsedText } from './stringFilterCondition.js';

/**
 * General variable types, just 5x types instead of the multiple FieldType.
 * For example all DateIso, DateUs are all "date", this makes it easier to know which filter condition to call
 */
export type GeneralVariableDataType = 'boolean' | 'date' | 'number' | 'object' | 'string';

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
