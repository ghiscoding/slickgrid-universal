import { dayStart } from '@formkit/tempo';
import { FieldType, OperatorType, type SearchTerm } from '../enums/index.js';
import type { FilterConditionOption } from '../interfaces/index.js';
import { mapTempoDateFormatWithFieldType, tryParseDate } from '../services/index.js';
import { testFilterCondition } from './filterUtilities.js';

/**
 * Execute Date filter condition check on each cell and use correct date format depending on it's field type (or filterSearchType when that is provided)
 */
export function executeDateFilterCondition(options: FilterConditionOption, parsedSearchDates: Array<string | Date>): boolean {
  const filterSearchType = (options && (options.filterSearchType || options.fieldType)) || FieldType.dateIso;
  const FORMAT = mapTempoDateFormatWithFieldType(filterSearchType);
  const [searchDate1, searchDate2] = parsedSearchDates;

  // cell value in Date format
  const dateCell = tryParseDate(options.cellValue, FORMAT, true);

  // return when cell value is not a valid date
  if ((!searchDate1 && !searchDate2) || !dateCell) {
    return false;
  }

  // when comparing with Dates only (without time), we need to disregard the time portion, we can do so by setting our time to start at midnight
  // ref, see https://stackoverflow.com/a/19699447/1212166
  const dateCellTimestamp =
    FORMAT === 'ISO8601' || FORMAT.toLowerCase().includes('h') ? dateCell.valueOf() : dayStart(new Date(dateCell)).valueOf();

  // having 2 search dates, we assume that it's a date range filtering and we'll compare against both dates
  if (searchDate1 && searchDate2) {
    let operator = options?.operator ?? options.defaultFilterRangeOperator;
    if (operator !== OperatorType.rangeInclusive && operator !== OperatorType.rangeExclusive) {
      operator = options.defaultFilterRangeOperator;
    }
    const isInclusive = operator === OperatorType.rangeInclusive;
    const resultCondition1 = testFilterCondition(isInclusive ? '>=' : '>', dateCellTimestamp, searchDate1.valueOf());
    const resultCondition2 = testFilterCondition(isInclusive ? '<=' : '<', dateCellTimestamp, searchDate2.valueOf());
    return resultCondition1 && resultCondition2;
  }

  // comparing against a single search date
  const dateSearchTimestamp1 =
    FORMAT === 'ISO8601' || FORMAT.toLowerCase().includes('h') ? searchDate1.valueOf() : dayStart(new Date(searchDate1)).valueOf();
  return testFilterCondition(options.operator || '==', dateCellTimestamp, dateSearchTimestamp1);
}

/**
 * From our search filter value(s), get the parsed value(s), they are parsed as Date objects.
 * This is called only once per filter before running the actual filter condition check on each cell
 */
export function getFilterParsedDates(
  inputSearchTerms: SearchTerm[] | undefined,
  inputFilterSearchType: (typeof FieldType)[keyof typeof FieldType]
): Array<Date | string> {
  const searchTerms = (Array.isArray(inputSearchTerms) && inputSearchTerms) || [];
  const filterSearchType = inputFilterSearchType || FieldType.dateIso;
  const FORMAT = mapTempoDateFormatWithFieldType(filterSearchType);
  const parsedSearchValues: Array<Date | string> = [];

  if (searchTerms.length === 2 || (typeof searchTerms[0] === 'string' && (searchTerms[0] as string).indexOf('..') > 0)) {
    const searchValues = searchTerms.length === 2 ? searchTerms : (searchTerms[0] as string).split('..');
    const searchValue1 = ((Array.isArray(searchValues) && searchValues[0]) || '') as Date | string;
    const searchValue2 = ((Array.isArray(searchValues) && searchValues[1]) || '') as Date | string;
    const searchDate1 = tryParseDate(searchValue1, FORMAT, true);
    const searchDate2 = tryParseDate(searchValue2, FORMAT, true);

    // return if any of the 2 values are invalid dates
    if (!searchDate1 || !searchDate2) {
      return [];
    }
    parsedSearchValues.push(searchDate1, searchDate2);
  } else {
    // return if the search term is an invalid date
    const searchDate1 = tryParseDate(searchTerms[0] as Date | string, FORMAT, true);
    if (!searchDate1) {
      return [];
    }
    parsedSearchValues.push(searchDate1);
  }
  return parsedSearchValues;
}
