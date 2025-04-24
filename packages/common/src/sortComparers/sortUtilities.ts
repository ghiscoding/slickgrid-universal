import { FieldType, type SortDirectionNumber } from '../enums/index.js';
import type { Column, GridOption, SortComparer } from '../interfaces/index.js';
import { SortComparers } from './index.js';
import { getAssociatedDateSortComparer, getSortComparerByDateFormat } from './dateUtilities.js';
import { isColumnDateType } from '../services/utilities.js';

export function sortByFieldType(
  fieldType: (typeof FieldType)[keyof typeof FieldType],
  value1: any,
  value2: any,
  sortDirection: number | SortDirectionNumber,
  sortColumn?: Column,
  gridOptions?: GridOption
): number {
  let sortResult = 0;

  if (isColumnDateType(fieldType)) {
    // if the column is a date type, the user can optionally pass date format inside column params
    // when that happen, we can call the date sort function directly without having to first find associated date format by column type
    let paramDateFormat = '';
    if (sortColumn && isColumnDateType(fieldType)) {
      const params = sortColumn?.params || {};
      paramDateFormat = params.inputFormat ?? params.format;
    }
    const dateSortComparer: SortComparer = !!(sortColumn && paramDateFormat)
      ? getSortComparerByDateFormat(paramDateFormat)
      : getAssociatedDateSortComparer(fieldType);
    sortResult = dateSortComparer(value1, value2, sortDirection, sortColumn, gridOptions);
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
