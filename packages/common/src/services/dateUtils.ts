import { format, parse, tzDate } from '@formkit/tempo';

import { FieldType } from '../enums/index';

/**
 * From a Date FieldType, return it's equivalent TempoJS format
 * refer to TempoJS for the format standard used: https://tempo.formkit.com/#format
 * @param fieldType
 * @param withZeroPadding - should we include zero padding in format (e.g.: 03:04:54)
 */
export function mapTempoDateFormatWithFieldType(fieldType: typeof FieldType[keyof typeof FieldType], withZeroPadding = false): string {
  let map: string;
  switch (fieldType) {
    case FieldType.dateTime:
    case FieldType.dateTimeIso:
      map = 'YYYY-MM-DD HH:mm:ss';
      break;
    case FieldType.dateTimeIsoAmPm:
      map = 'YYYY-MM-DD hh:mm:ss a';
      break;
    case FieldType.dateTimeIsoAM_PM:
      map = 'YYYY-MM-DD hh:mm:ss A';
      break;
    case FieldType.dateTimeShortIso:
      map = 'YYYY-MM-DD HH:mm';
      break;
    // all Euro Formats (date/month/year)
    case FieldType.dateEuro:
      map = 'DD/MM/YYYY';
      break;
    case FieldType.dateEuroShort:
      map = withZeroPadding
        ? 'DD/MM/YY'
        : 'D/M/YY';
      break;
    case FieldType.dateTimeEuro:
      map = 'DD/MM/YYYY HH:mm:ss';
      break;
    case FieldType.dateTimeShortEuro:
      map = withZeroPadding
        ? 'DD/MM/YYYY HH:mm'
        : 'D/M/YYYY H:m';
      break;
    case FieldType.dateTimeEuroAmPm:
      map = 'DD/MM/YYYY hh:mm:ss a';
      break;
    case FieldType.dateTimeEuroAM_PM:
      map = 'DD/MM/YYYY hh:mm:ss A';
      break;
    case FieldType.dateTimeEuroShort:
      map = withZeroPadding
        ? 'DD/MM/YY HH:mm:ss'
        : 'D/M/YY H:m:s';
      break;
    case FieldType.dateTimeEuroShortAmPm:
      map = withZeroPadding
        ? 'DD/MM/YY hh:mm:ss a'
        : 'D/M/YY h:m:s a';
      break;
    case FieldType.dateTimeEuroShortAM_PM:
      map = withZeroPadding
        ? 'DD/MM/YY hh:mm:ss A'
        : 'D/M/YY h:m:s A';
      break;
    // all US Formats (month/date/year)
    case FieldType.dateUs:
      map = 'MM/DD/YYYY';
      break;
    case FieldType.dateUsShort:
      map = withZeroPadding
        ? 'MM/DD/YY'
        : 'M/D/YY';
      break;
    case FieldType.dateTimeUs:
      map = 'MM/DD/YYYY HH:mm:ss';
      break;
    case FieldType.dateTimeUsAmPm:
      map = 'MM/DD/YYYY hh:mm:ss a';
      break;
    case FieldType.dateTimeUsAM_PM:
      map = 'MM/DD/YYYY hh:mm:ss A';
      break;
    case FieldType.dateTimeUsShort:
      map = withZeroPadding
        ? 'MM/DD/YY HH:mm:ss'
        : 'M/D/YY H:m:s';
      break;
    case FieldType.dateTimeUsShortAmPm:
      map = withZeroPadding
        ? 'MM/DD/YY hh:mm:ss a'
        : 'M/D/YY h:m:s a';
      break;
    case FieldType.dateTimeUsShortAM_PM:
      map = withZeroPadding
        ? 'MM/DD/YY hh:mm:ss A'
        : 'M/D/YY h:m:s A';
      break;
    case FieldType.dateTimeShortUs:
      map = withZeroPadding
        ? 'MM/DD/YYYY HH:mm'
        : 'M/D/YYYY H:m';
      break;
    case FieldType.dateUtc:
      map = 'ISO8601';
      break;
    case FieldType.date:
    case FieldType.dateIso:
    default:
      map = 'YYYY-MM-DD';
      break;
  }
  return map;
}

export function formatTempoDateByFieldType(inputDate: Date | string, inputFieldType: typeof FieldType[keyof typeof FieldType] | undefined, outputFieldType: typeof FieldType[keyof typeof FieldType]): string {
  const inputFormat = inputFieldType ? mapTempoDateFormatWithFieldType(inputFieldType) : undefined;
  const outputFormat = mapTempoDateFormatWithFieldType(outputFieldType);
  const date = inputDate instanceof Date ? inputDate : tryParseDate(inputDate, inputFormat as string);

  if (date && inputDate !== undefined) {
    if (outputFieldType === FieldType.dateUtc) {
      return date.toISOString();
    }
    return format(date, outputFormat, 'en-US');
  }
  return '';
}

export function tryParseDate(inputDate?: string | Date, inputFormat?: string, strict = false): Date | false {
  try {
    if (!inputDate) {
      return false;
    }
    return inputDate instanceof Date ? inputDate : parse({
      date: inputDate,
      format: inputFormat as string,
      dateOverflow: strict ? 'throw' : 'backward',
      locale: 'en-US'
    });
  } catch (_e) {
    return false;
  }
}

export function toUtcDate(inputDate: Date) {
  const localOffset = new Date().getTimezoneOffset() * 60 * 1000;
  return new Date(inputDate.getTime() + localOffset);
};

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