import { type FieldType, type SortDirectionNumber } from '../enums/index.js';
import type { Column, GridOption } from '../interfaces/index.js';
import { isColumnDateType } from '../services/utilities.js';
import { getAssociatedDateSortComparer } from './dateUtilities.js';
import { SortComparers } from './index.js';

export function sortByFieldType(
  fieldType: FieldType,
  value1: any,
  value2: any,
  sortDirection: number | SortDirectionNumber,
  sortColumn?: Column,
  gridOptions?: GridOption
): number {
  let sortResult = 0;

  if (isColumnDateType(fieldType)) {
    const dateSortComparer = getAssociatedDateSortComparer(fieldType);
    sortResult = dateSortComparer(value1, value2, sortDirection, sortColumn, gridOptions);
  } else {
    switch (fieldType) {
      case 'boolean':
        sortResult = SortComparers.boolean(value1, value2, sortDirection, sortColumn, gridOptions);
        break;
      case 'float':
      case 'integer':
      case 'number':
        sortResult = SortComparers.numeric(value1, value2, sortDirection, sortColumn, gridOptions);
        break;
      case 'object':
        sortResult = SortComparers.objectString(value1, value2, sortDirection, sortColumn, gridOptions);
        break;
      case 'string':
      case 'text':
      case 'password':
      case 'readonly':
      default:
        sortResult = SortComparers.string(value1, value2, sortDirection, sortColumn, gridOptions);
        break;
    }
  }

  return sortResult;
}
