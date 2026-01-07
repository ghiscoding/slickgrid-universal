import { format, offset, parse, removeOffset, tzDate } from '@formkit/tempo';
import { type FieldType } from '../enums/index.js';

/**
 * From a Date FieldType, return it's equivalent TempoJS format,
 * refer to TempoJS docs for the format tokens being used: https://tempo.formkit.com/#format
 * @param {FieldType} fieldType
 * @param { withZeroPadding: [boolean]; withDefaultIso8601: [boolean]; } [options] -
 *   - withZeroPadding: should we include zero padding in format (e.g.: 03:04:54 instead of 3:4:54)
 *   - withDefaultIso8601: should we use ISO8601 for `date` or `dateIso`
 */
export function mapTempoDateFormatWithFieldType(
  fieldType: FieldType,
  options?: { withZeroPadding?: boolean; withDefaultIso8601?: boolean }
): string {
  let map: string;
  const withZeroPadding = options?.withZeroPadding ?? false;

  switch (fieldType) {
    case 'dateTime':
    case 'dateTimeIso':
      map = 'YYYY-MM-DD HH:mm:ss';
      break;
    case 'dateTimeIsoAmPm':
      map = 'YYYY-MM-DD hh:mm:ss a';
      break;
    case 'dateTimeIsoAM_PM':
      map = 'YYYY-MM-DD hh:mm:ss A';
      break;
    case 'dateTimeShortIso':
      map = 'YYYY-MM-DD HH:mm';
      break;
    // all Euro Formats (date/month/year)
    case 'dateEuro':
      map = 'DD/MM/YYYY';
      break;
    case 'dateEuroShort':
      map = withZeroPadding ? 'DD/MM/YY' : 'D/M/YY';
      break;
    case 'dateTimeEuro':
      map = 'DD/MM/YYYY HH:mm:ss';
      break;
    case 'dateTimeShortEuro':
      map = withZeroPadding ? 'DD/MM/YYYY HH:mm' : 'D/M/YYYY H:m';
      break;
    case 'dateTimeEuroAmPm':
      map = 'DD/MM/YYYY hh:mm:ss a';
      break;
    case 'dateTimeEuroAM_PM':
      map = 'DD/MM/YYYY hh:mm:ss A';
      break;
    case 'dateTimeEuroShort':
      map = withZeroPadding ? 'DD/MM/YY HH:mm:ss' : 'D/M/YY H:m:s';
      break;
    case 'dateTimeEuroShortAmPm':
      map = withZeroPadding ? 'DD/MM/YY hh:mm:ss a' : 'D/M/YY h:m:s a';
      break;
    case 'dateTimeEuroShortAM_PM':
      map = withZeroPadding ? 'DD/MM/YY hh:mm:ss A' : 'D/M/YY h:m:s A';
      break;
    // all US Formats (month/date/year)
    case 'dateUs':
      map = 'MM/DD/YYYY';
      break;
    case 'dateUsShort':
      map = withZeroPadding ? 'MM/DD/YY' : 'M/D/YY';
      break;
    case 'dateTimeUs':
      map = 'MM/DD/YYYY HH:mm:ss';
      break;
    case 'dateTimeUsAmPm':
      map = 'MM/DD/YYYY hh:mm:ss a';
      break;
    case 'dateTimeUsAM_PM':
      map = 'MM/DD/YYYY hh:mm:ss A';
      break;
    case 'dateTimeUsShort':
      map = withZeroPadding ? 'MM/DD/YY HH:mm:ss' : 'M/D/YY H:m:s';
      break;
    case 'dateTimeUsShortAmPm':
      map = withZeroPadding ? 'MM/DD/YY hh:mm:ss a' : 'M/D/YY h:m:s a';
      break;
    case 'dateTimeUsShortAM_PM':
      map = withZeroPadding ? 'MM/DD/YY hh:mm:ss A' : 'M/D/YY h:m:s A';
      break;
    case 'dateTimeShortUs':
      map = withZeroPadding ? 'MM/DD/YYYY HH:mm' : 'M/D/YYYY H:m';
      break;
    case 'dateUtc':
      map = 'ISO8601';
      break;
    case 'date':
    case 'dateIso':
    default:
      map = options?.withDefaultIso8601 ? 'ISO8601' : 'YYYY-MM-DD';
      break;
  }
  return map;
}

/**
 * Format a date using Tempo and a defined input/output field types
 * @param {string|Date} inputDate
 * @param {FieldType} inputFieldType
 * @param {FieldType} outputFieldType
 * @returns
 */
export function formatDateByFieldType(inputDate: Date | string, inputFieldType: FieldType | undefined, outputFieldType: FieldType): string {
  const inputFormat = inputFieldType ? mapTempoDateFormatWithFieldType(inputFieldType) : undefined;
  const outputFormat = mapTempoDateFormatWithFieldType(outputFieldType);
  const date = inputDate instanceof Date ? inputDate : tryParseDate(inputDate, inputFormat as string);

  if (date && inputDate !== undefined) {
    if (outputFieldType === 'dateUtc') {
      return date.toISOString();
    }
    return format(date, outputFormat, 'en-US');
  }
  return '';
}

/**
 * Try to parse date with Tempo or return `false` (instead of throwing) if Date is invalid.
 * When using strict mode, it will detect if the date is invalid when outside of the calendar (e.g. "2011-11-31").
 * However in non-strict mode, it will roll the date backward if out of calendar (e.g. "2011-11-31" would return "2011-11-30").
 * @param {string|Date} [inputDate] - input date (or null)
 * @param {string} [inputFormat] - optional input format to use when parsing
 * @param {Boolean} [strict] - are we using strict mode?
 * @returns
 */
export function tryParseDate(inputDate?: string | Date, inputFormat?: string, strict = false): Date | false {
  try {
    if (!inputDate) {
      return false;
    }
    const d =
      inputDate instanceof Date
        ? inputDate
        : parse({
            date: inputDate,
            format: inputFormat as string,
            dateOverflow: strict ? 'throw' : 'backward',
            locale: 'en-US',
          });

    // make sure we have a valid year before returning, otherwise return false
    // e.g blank date "0001-01-01" will throw with Tempo `format()`, so better return false
    return d.getFullYear() > 1000 ? d : false;
  } catch (_e) {
    return false;
  }
}

/**
 * Parse a Date as a UTC date (without local TZ offset)
 * @param inputDate
 * @returns
 */
export function toUtcDate(inputDate: string | Date): Date {
  // to parse as UTC in Tempo, we need to remove the offset (which is a simple inversed offset to cancel itself)
  return removeOffset(inputDate, offset(inputDate, 'utc'));
}

/**
 * Parse a date passed as a string (Date only, without time) and return a TZ Date (without milliseconds)
 * @param inputDateString
 * @returns TZ UTC date formatted
 */
export function parseUtcDate(inputDateString: string): string {
  let outputFormattedDate = '';

  if (typeof inputDateString === 'string' && /^[0-9\-/]*$/.test(inputDateString)) {
    // get the UTC datetime but make sure to decode the value so that it's valid text
    const dateString = decodeURIComponent(inputDateString);
    const date = tzDate(dateString, 'utc');
    if (date) {
      outputFormattedDate = date.toISOString().replace(/(.*)([.\d]{4})(Z)/gi, '$1$3');
    }
  }

  return outputFormattedDate;
}
