import { FieldType, type SortDirectionNumber } from '../enums/index';
import type { Column, GridOption } from '../interfaces/index';
import { SortComparers } from './index';
import { getAssociatedDateSortComparer } from './dateUtilities';

export function sortByFieldType(fieldType: typeof FieldType[keyof typeof FieldType], value1: any, value2: any, sortDirection: number | SortDirectionNumber, sortColumn?: Column, gridOptions?: GridOption): number {
  let sortResult = 0;

  switch (fieldType) {
    case FieldType.boolean:
      sortResult = SortComparers.boolean(value1, value2, sortDirection, sortColumn, gridOptions);
      break;
    case FieldType.float:
    case FieldType.integer:
    case FieldType.number:
      sortResult = SortComparers.numeric(value1, value2, sortDirection, sortColumn, gridOptions);
      break;
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
      // @ts-ignore
      sortResult = getAssociatedDateSortComparer(fieldType).call(this, value1, value2, sortDirection, sortColumn, gridOptions);
      break;
    case FieldType.object:
      sortResult = SortComparers.objectString(value1, value2, sortDirection, sortColumn, gridOptions);
      break;
    case FieldType.string:
    case FieldType.text:
    case FieldType.password:
    case FieldType.readonly:
    default:
      sortResult = SortComparers.string(value1, value2, sortDirection, sortColumn, gridOptions);
      break;
  }

  return sortResult;
}
