import { booleanFilterCondition } from './booleanFilterCondition';
import { collectionSearchFilterCondition } from './collectionSearchFilterCondition';
import { numberFilterCondition } from './numberFilterCondition';
import { objectFilterCondition } from './objectFilterCondition';
import { stringFilterCondition } from './stringFilterCondition';

import { FieldType, OperatorType, SearchTerm } from '../enums/index';
import { FilterCondition, FilterConditionOption } from '../interfaces/index';
import { mapMomentDateFormatWithFieldType } from './../services/utilities';
import { testFilterCondition } from './filterUtilities';
import * as moment_ from 'moment-mini';

const moment = moment_['default'] || moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

export type GeneralFieldType = 'boolean' | 'date' | 'number' | 'object' | 'text';

export const executeMappedCondition: FilterCondition = (options: FilterConditionOption, parsedSearchTerms: SearchTerm[]) => {
  // when using a multi-select ('IN' operator) we will not use the field type but instead go directly with a collection search
  const operator = options && options.operator && options.operator.toUpperCase();
  if (operator === 'IN' || operator === 'NIN' || operator === 'IN_CONTAINS' || operator === 'NIN_CONTAINS') {
    return collectionSearchFilterCondition(options, parsedSearchTerms);
  }

  const generalType = getGeneralTypeByFieldType(options.fieldType);


  // execute the mapped type, or default to String condition check
  switch (generalType) {
    case 'boolean':
      return booleanFilterCondition(options, parsedSearchTerms);
    case 'date':
      return executeAssociatedDateCondition(options, ...parsedSearchTerms);
    case 'number':
      return numberFilterCondition(options, ...parsedSearchTerms as number[]);
    case 'object':
      return objectFilterCondition(options, parsedSearchTerms);
    case 'text':
    default:
      return stringFilterCondition(options, parsedSearchTerms);
  }
};

/**
 * Execute Date filter condition and use correct date format depending on it's field type (or filterSearchType when that is provided)
 * @param options
 */
function executeAssociatedDateCondition(options: FilterConditionOption, ...parsedSearchDates: any[]): boolean {
  const filterSearchType = options && (options.filterSearchType || options.fieldType) || FieldType.dateIso;
  const FORMAT = mapMomentDateFormatWithFieldType(filterSearchType);
  const [searchDate1, searchDate2] = parsedSearchDates;

  // cell value in moment format
  const dateCell = moment(options.cellValue, FORMAT, true);

  // return when cell value is not a valid date
  if ((!searchDate1 && !searchDate2) || !dateCell.isValid()) {
    return false;
  }

  // when comparing with Dates only (without time), we need to disregard the time portion, we can do so by setting our time to start at midnight
  // ref, see https://stackoverflow.com/a/19699447/1212166
  const dateCellTimestamp = FORMAT.toLowerCase().includes('h') ? dateCell.valueOf() : dateCell.clone().startOf('day').valueOf();

  // having 2 search dates, we assume that it's a date range filtering and we'll compare against both dates
  if (searchDate1 && searchDate2) {
    const isInclusive = options.operator && options.operator === OperatorType.rangeInclusive;
    const resultCondition1 = testFilterCondition((isInclusive ? '>=' : '>'), dateCellTimestamp, searchDate1.valueOf());
    const resultCondition2 = testFilterCondition((isInclusive ? '<=' : '<'), dateCellTimestamp, searchDate2.valueOf());
    return (resultCondition1 && resultCondition2);
  }

  // comparing against a single search date
  const dateSearchTimestamp1 = FORMAT.toLowerCase().includes('h') ? searchDate1.valueOf() : searchDate1.clone().startOf('day').valueOf();
  return testFilterCondition(options.operator || '==', dateCellTimestamp, dateSearchTimestamp1);
}

export function getParsedSearchTermsByFieldType(inputSearchTerms: SearchTerm[] | undefined, inputFilterSearchType: typeof FieldType[keyof typeof FieldType]): SearchTerm[] | undefined {
  const generalType = getGeneralTypeByFieldType(inputFilterSearchType);

  switch (generalType) {
    case 'date':
      return getParsedSearchDates(inputSearchTerms, inputFilterSearchType);
    case 'number':
      return getParsedSearchNumbers(inputSearchTerms);
  }
  return undefined;
}

function getParsedSearchDates(inputSearchTerms: SearchTerm[] | undefined, inputFilterSearchType: typeof FieldType[keyof typeof FieldType]): SearchTerm[] | undefined {
  const searchTerms = Array.isArray(inputSearchTerms) && inputSearchTerms || [];
  const filterSearchType = inputFilterSearchType || FieldType.dateIso;
  const FORMAT = mapMomentDateFormatWithFieldType(filterSearchType);

  const parsedSearchValues: any[] = [];

  if (searchTerms.length === 2 || (typeof searchTerms[0] === 'string' && (searchTerms[0] as string).indexOf('..') > 0)) {
    const searchValues = (searchTerms.length === 2) ? searchTerms : (searchTerms[0] as string).split('..');
    const searchValue1 = (Array.isArray(searchValues) && searchValues[0] || '') as Date | string;
    const searchValue2 = (Array.isArray(searchValues) && searchValues[1] || '') as Date | string;
    const searchDate1 = moment(searchValue1, FORMAT, true);
    const searchDate2 = moment(searchValue2, FORMAT, true);

    // return if any of the 2 values are invalid dates
    if (!searchDate1.isValid() || !searchDate2.isValid()) {
      return undefined;
    }
    parsedSearchValues.push(searchDate1, searchDate2);
  } else {
    // return if the search term is an invalid date
    const searchDate1 = moment(searchTerms[0] as Date | string, FORMAT, true);
    if (!searchDate1.isValid()) {
      return undefined;
    }
    parsedSearchValues.push(searchDate1);
  }
  return parsedSearchValues;
}

function getParsedSearchNumbers(inputSearchTerms: SearchTerm[] | undefined): number[] | undefined {
  const searchTerms = Array.isArray(inputSearchTerms) && inputSearchTerms || [];
  const parsedSearchValues: number[] = [];
  let searchValue1;
  let searchValue2;

  if (searchTerms.length === 2 || (typeof searchTerms[0] === 'string' && (searchTerms[0] as string).indexOf('..') > 0)) {
    const searchValues = (searchTerms.length === 2) ? searchTerms : (searchTerms[0] as string).split('..');
    searchValue1 = parseFloat(Array.isArray(searchValues) ? (searchValues[0] + '') : '');
    searchValue2 = parseFloat(Array.isArray(searchValues) ? (searchValues[1] + '') : '');
  } else {
    searchValue1 = parseFloat(searchTerms[0] + '');
  }

  if (searchValue1 !== undefined && searchValue2 !== undefined) {
    parsedSearchValues.push(searchValue1, searchValue2);
  } else if (searchValue1 !== undefined) {
    parsedSearchValues.push(searchValue1);
  } else {
    return undefined;
  }
  return parsedSearchValues;
}

/**
 * From a more specific field type, let's return a simple and more general type (boolean, date, number, object, text)
 * @param fieldType - specific field type
 * @returns generalType - general field type
 */
function getGeneralTypeByFieldType(fieldType: typeof FieldType[keyof typeof FieldType]): GeneralFieldType {
  // return general field type
  switch (fieldType) {
    case FieldType.boolean:
      return 'boolean';
    case FieldType.date:
    case FieldType.dateIso:
    case FieldType.dateUtc:
    case FieldType.dateTime:
    case FieldType.dateTimeIso:
    case FieldType.dateTimeIsoAmPm:
    case FieldType.dateTimeIsoAM_PM:
    case FieldType.dateTimeShortIso:
    case FieldType.dateEuro:
    case FieldType.dateEuroShort:
    case FieldType.dateTimeShortEuro:
    case FieldType.dateTimeEuro:
    case FieldType.dateTimeEuroAmPm:
    case FieldType.dateTimeEuroAM_PM:
    case FieldType.dateTimeEuroShort:
    case FieldType.dateTimeEuroShortAmPm:
    case FieldType.dateTimeEuroShortAM_PM:
    case FieldType.dateUs:
    case FieldType.dateUsShort:
    case FieldType.dateTimeShortUs:
    case FieldType.dateTimeUs:
    case FieldType.dateTimeUsAmPm:
    case FieldType.dateTimeUsAM_PM:
    case FieldType.dateTimeUsShort:
    case FieldType.dateTimeUsShortAmPm:
    case FieldType.dateTimeUsShortAM_PM:
      return 'date';
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
      return 'text';
  }
}