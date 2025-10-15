import type { SortDirectionNumber } from '../enums/sortDirectionNumber.enum.js';
import type { Column } from './column.interface.js';
import type { GridOption } from './gridOption.interface.js';

export type SortComparer = (
  value1: any,
  value2: any,
  sortDirection?: SortDirectionNumber,
  sortColumn?: Column,
  gridOptions?: GridOption
) => number;

/**
 * All built-in SortComparers.
 */
export interface ISortComparers {
  /** SortComparer method to sort boolean values as regular strings */
  boolean: SortComparer;

  /** SortComparer method to sort values by Date object type (uses Tempo ISO_8601 standard format, optionally include time) */
  date: SortComparer;

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DD HH:mm:ss) */
  dateIso: SortComparer;

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DDTHH:mm:ss.SSSZ) */
  dateUtc: SortComparer;

  /** SortComparer method to sort values by Date and Time (native Date object) */
  dateTime: SortComparer;

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DD HH:mm:ss) */
  dateTimeIso: SortComparer;

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DD h:mm:ss a) */
  dateTimeIsoAmPm: SortComparer;

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DD h:mm:ss A) */
  dateTimeIsoAM_PM: SortComparer;

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DD HH:mm) */
  dateTimeShortIso: SortComparer;

  /** SortComparer method to sort values by Date formatted as Euro date (DD/MM/YYYY) */
  dateEuro: SortComparer;

  /** SortComparer method to sort values by Date formatted as Euro short date (D/M/YY) */
  dateEuroShort: SortComparer;

  /** SortComparer method to sort values by Date formatted as (DD/MM/YYYY HH:mm) */
  dateTimeShortEuro: SortComparer;

  /** SortComparer method to sort values by Date formatted as (DD/MM/YYYY HH:mm:ss) */
  dateTimeEuro: SortComparer;

  /** SortComparer method to sort values by Date formatted as (DD/MM/YYYY hh:mm:ss a) */
  dateTimeEuroAmPm: SortComparer;

  /** SortComparer method to sort values by Date formatted as (DD/MM/YYYY hh:mm:ss A) */
  dateTimeEuroAM_PM: SortComparer;

  /** SortComparer method to sort values by Date formatted as (D/M/YY H:m:s) */
  dateTimeEuroShort: SortComparer;

  /** SortComparer method to sort values by Date formatted as (D/M/YY h:m:s a) */
  dateTimeEuroShortAmPm: SortComparer;

  /** SortComparer method to sort values by Date formatted as (D/M/YY h:m:s A) */
  dateTimeEuroShortAM_PM: SortComparer;

  /** SortComparer method to sort values by Date formatted as US date (MM/DD/YYYY) */
  dateUs: SortComparer;

  /** SortComparer method to sort values by Date formatted as US short date (M/D/YY) */
  dateUsShort: SortComparer;

  /** SortComparer method to sort values by Date formatted as (MM/DD/YYYY HH:mm) */
  dateTimeShortUs: SortComparer;

  /** SortComparer method to sort values by Date formatted as (MM/DD/YYYY HH:mm:s) */
  dateTimeUs: SortComparer;

  /** SortComparer method to sort values by Date formatted as (MM/DD/YYYY hh:mm:ss a) */
  dateTimeUsAmPm: SortComparer;

  /** SortComparer method to sort values by Date formatted as (MM/DD/YYYY hh:mm:ss A) */
  dateTimeUsAM_PM: SortComparer;

  /** SortComparer method to sort values by Date formatted as (M/D/YY H:m:s) */
  dateTimeUsShort: SortComparer;

  /** SortComparer method to sort values by Date formatted as (M/D/YY h:m:s a) */
  dateTimeUsShortAmPm: SortComparer;

  /** SortComparer method to sort values by Date formatted as (M/D/YY h:m:s A) */
  dateTimeUsShortAM_PM: SortComparer;

  /** SortComparer method to sort values as numeric fields */
  numeric: SortComparer;

  /**
   * SortComparer method to sort object values with a "dataKey" provided in your column definition, it's data content must be of type string
   * Example:
   * columnDef = { id='user', field: 'user', ..., dataKey: 'firstName', SortComparer: SortComparers.objectString }
   * collection = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Bob', lastName: 'Cash' }]
   */
  objectString: SortComparer;

  /** SortComparer method to sort values as regular strings */
  string: SortComparer;
}
