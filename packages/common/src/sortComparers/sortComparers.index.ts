import { booleanSortComparer } from './booleanSortComparer.js';
import { numericSortComparer } from './numericSortComparer.js';
import { objectStringSortComparer } from './objectStringSortComparer.js';
import { stringSortComparer } from './stringSortComparer.js';
import { getAssociatedDateSortComparer } from './dateUtilities.js';
import { FieldType } from '../enums/fieldType.enum.js';
import type { SortComparer } from '../interfaces/sorter.interface.js';

// export the Sort Utilities so they could be used by others
export * from './sortUtilities.js';

export const SortComparers: Record<string, SortComparer> = {
  /** SortComparer method to sort values as regular strings */
  boolean: booleanSortComparer satisfies SortComparer as SortComparer,

  /** SortComparer method to sort values by Date object type (uses Tempo ISO_8601 standard format, optionally include time) */
  date: getAssociatedDateSortComparer(FieldType.date),

  /**
   * SortComparer method to sort values by Date formatted as ISO date (excluding time),
   * If you wish to optionally include time simply use the "SortComparers.date" which work with/without time
   */
  dateIso: getAssociatedDateSortComparer(FieldType.dateIso),

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DDTHH:mm:ss.SSSZ) */
  dateUtc: getAssociatedDateSortComparer(FieldType.dateUtc),

  /** SortComparer method to sort values by Date and Time (native Date object) */
  dateTime: getAssociatedDateSortComparer(FieldType.dateTime),

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DD HH:mm:ss) */
  dateTimeIso: getAssociatedDateSortComparer(FieldType.dateTimeIso),

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DD h:mm:ss a) */
  dateTimeIsoAmPm: getAssociatedDateSortComparer(FieldType.dateTimeIsoAmPm),

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DD h:mm:ss A) */
  dateTimeIsoAM_PM: getAssociatedDateSortComparer(FieldType.dateTimeIsoAM_PM),

  /** SortComparer method to sort values by Date formatted as (YYYY-MM-DD HH:mm) */
  dateTimeShortIso: getAssociatedDateSortComparer(FieldType.dateTimeShortIso),

  /** SortComparer method to sort values by Date formatted as Euro date (DD/MM/YYYY) */
  dateEuro: getAssociatedDateSortComparer(FieldType.dateEuro),

  /** SortComparer method to sort values by Date formatted as Euro short date (D/M/YY) */
  dateEuroShort: getAssociatedDateSortComparer(FieldType.dateEuroShort),

  /** SortComparer method to sort values by Date formatted as (DD/MM/YYYY HH:mm) */
  dateTimeShortEuro: getAssociatedDateSortComparer(FieldType.dateTimeShortEuro),

  /** SortComparer method to sort values by Date formatted as (DD/MM/YYYY HH:mm:ss) */
  dateTimeEuro: getAssociatedDateSortComparer(FieldType.dateTimeEuro),

  /** SortComparer method to sort values by Date formatted as (DD/MM/YYYY hh:mm:ss a) */
  dateTimeEuroAmPm: getAssociatedDateSortComparer(FieldType.dateTimeEuroAmPm),

  /** SortComparer method to sort values by Date formatted as (DD/MM/YYYY hh:mm:ss A) */
  dateTimeEuroAM_PM: getAssociatedDateSortComparer(FieldType.dateTimeEuroAM_PM),

  /** SortComparer method to sort values by Date formatted as (D/M/YY H:m:s) */
  dateTimeEuroShort: getAssociatedDateSortComparer(FieldType.dateTimeEuroShort),

  /** SortComparer method to sort values by Date formatted as (D/M/YY h:m:s a) */
  dateTimeEuroShortAmPm: getAssociatedDateSortComparer(FieldType.dateTimeEuroShortAmPm),

  /** SortComparer method to sort values by Date formatted as (D/M/YY h:m:s A) */
  dateTimeEuroShortAM_PM: getAssociatedDateSortComparer(FieldType.dateTimeEuroShortAM_PM),

  /** SortComparer method to sort values by Date formatted as US date (MM/DD/YYYY) */
  dateUs: getAssociatedDateSortComparer(FieldType.dateUs),

  /** SortComparer method to sort values by Date formatted as US short date (M/D/YY) */
  dateUsShort: getAssociatedDateSortComparer(FieldType.dateUsShort),

  /** SortComparer method to sort values by Date formatted as (MM/DD/YYYY HH:mm) */
  dateTimeShortUs: getAssociatedDateSortComparer(FieldType.dateTimeShortUs),

  /** SortComparer method to sort values by Date formatted as (MM/DD/YYYY HH:mm:s) */
  dateTimeUs: getAssociatedDateSortComparer(FieldType.dateTimeUs),

  /** SortComparer method to sort values by Date formatted as (MM/DD/YYYY hh:mm:ss a) */
  dateTimeUsAmPm: getAssociatedDateSortComparer(FieldType.dateTimeUsAmPm),

  /** SortComparer method to sort values by Date formatted as (MM/DD/YYYY hh:mm:ss A) */
  dateTimeUsAM_PM: getAssociatedDateSortComparer(FieldType.dateTimeUsAM_PM),

  /** SortComparer method to sort values by Date formatted as (M/D/YY H:m:s) */
  dateTimeUsShort: getAssociatedDateSortComparer(FieldType.dateTimeUsShort),

  /** SortComparer method to sort values by Date formatted as (M/D/YY h:m:s a) */
  dateTimeUsShortAmPm: getAssociatedDateSortComparer(FieldType.dateTimeUsShortAmPm),

  /** SortComparer method to sort values by Date formatted as (M/D/YY h:m:s A) */
  dateTimeUsShortAM_PM: getAssociatedDateSortComparer(FieldType.dateTimeUsShortAM_PM),

  /** SortComparer method to sort values as numeric fields */
  numeric: numericSortComparer satisfies SortComparer as SortComparer,

  /**
   * SortComparer method to sort object values with a "dataKey" provided in your column definition, it's data content must be of type string
   * Example:
   * columnDef = { id='user', field: 'user', ..., dataKey: 'firstName', SortComparer: SortComparers.objectString }
   * collection = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Bob', lastName: 'Cash' }]
   */
  objectString: objectStringSortComparer satisfies SortComparer as SortComparer,

  /** SortComparer method to sort values as regular strings */
  string: stringSortComparer satisfies SortComparer as SortComparer,
};
