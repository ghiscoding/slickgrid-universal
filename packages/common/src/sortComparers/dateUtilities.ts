import { FieldType } from '../enums/fieldType.enum';
import type { SortComparer } from '../interfaces/index';
import { mapTempoDateFormatWithFieldType, tryParseDate } from '../services/dateUtils';

export function compareDates(value1: any, value2: any, sortDirection: number, format?: string, strict?: boolean): number {
  let diff = 0;

  if (value1 === value2) {
    diff = 0;
  } else {
    // try to parse the Date and validate it
    let date1: Date | boolean = tryParseDate(value1, format, strict);
    let date2: Date | boolean = tryParseDate(value2, format, strict);

    // when date is invalid (false), we'll create a temporary old Date
    if (!date1) {
      date1 = new Date(1001, 1, 1);
    }
    if (!date2) {
      date2 = new Date(1001, 1, 1);
    }

    // we can use Date valueOf to sort
    diff = date1.valueOf() - date2.valueOf();
  }

  return sortDirection * diff;
}

/** From a FieldType, return the associated Date SortComparer */
export function getAssociatedDateSortComparer(fieldType: typeof FieldType[keyof typeof FieldType]): SortComparer {
  const FORMAT = (fieldType === FieldType.date) ? undefined : mapTempoDateFormatWithFieldType(fieldType);

  return ((value1: any, value2: any, sortDirection: number) => {
    if (FORMAT === undefined) {
      return compareDates(value1, value2, sortDirection, FORMAT, false) as number;
    }
    return compareDates(value1, value2, sortDirection, FORMAT, true) as number;
  }) as SortComparer;
}
