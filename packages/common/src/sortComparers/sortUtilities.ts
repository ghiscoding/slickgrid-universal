import { FieldType, SortDirectionNumber } from '../enums/index';
import { Column } from '../interfaces/index';
import { SortComparers } from './index';
import { getAssociatedDateSortComparer } from './dateUtilities';

export function sortByFieldType(fieldType: FieldType, value1: any, value2: any, sortDirection: number | SortDirectionNumber, sortColumn?: Column) {
  let sortResult = 0;

  switch (fieldType) {
    case FieldType.float:
    case FieldType.integer:
    case FieldType.number:
      sortResult = SortComparers.numeric(value1, value2, sortDirection, sortColumn);
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
      sortResult = getAssociatedDateSortComparer(fieldType).call(this, value1, value2, sortDirection, sortColumn);
      break;
    case FieldType.object:
      sortResult = SortComparers.objectString(value1, value2, sortDirection, sortColumn);
      break;
    case FieldType.string:
    default:
      sortResult = SortComparers.string(value1, value2, sortDirection, sortColumn);
      break;
  }

  return sortResult;
}
