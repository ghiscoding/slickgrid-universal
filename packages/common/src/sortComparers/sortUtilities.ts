import { FieldType, type SortDirectionNumber } from '../enums/index';
import type { Column, GridOption } from '../interfaces/index';
import { SortComparers } from './index';
import { getAssociatedDateSortComparer } from './dateUtilities';
import { isColumnDateType } from '../services/utilities';

export function sortByFieldType(fieldType: typeof FieldType[keyof typeof FieldType], value1: any, value2: any, sortDirection: number | SortDirectionNumber, sortColumn?: Column, gridOptions?: GridOption): number {
  let sortResult = 0;

  if (isColumnDateType(fieldType)) {
    // @ts-ignore
    sortResult = getAssociatedDateSortComparer(fieldType).call(this, value1, value2, sortDirection, sortColumn, gridOptions);
  } else {
    switch (fieldType) {
      case FieldType.boolean:
        sortResult = SortComparers.boolean(value1, value2, sortDirection, sortColumn, gridOptions);
        break;
      case FieldType.float:
      case FieldType.integer:
      case FieldType.number:
        sortResult = SortComparers.numeric(value1, value2, sortDirection, sortColumn, gridOptions);
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
  }

  return sortResult;
}
