import { type FieldType, type SortDirectionNumber } from '../enums/index.js';
import type { Column, GridOption } from '../interfaces/index.js';
import { isColumnDateType } from '../services/utilities.js';
import { booleanSortComparer } from './booleanSortComparer.js';
import { getAssociatedDateSortComparer } from './dateUtilities.js';
import { numericSortComparer } from './numericSortComparer.js';
import { objectStringSortComparer } from './objectStringSortComparer.js';
import { stringSortComparer } from './stringSortComparer.js';

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
        sortResult = booleanSortComparer(value1, value2, sortDirection, sortColumn, gridOptions);
        break;
      case 'float':
      case 'integer':
      case 'number':
        sortResult = numericSortComparer(value1, value2, sortDirection, sortColumn, gridOptions);
        break;
      case 'object':
        sortResult = objectStringSortComparer(value1, value2, sortDirection, sortColumn, gridOptions);
        break;
      case 'string':
      case 'text':
      case 'password':
      case 'readonly':
      default:
        sortResult = stringSortComparer(value1, value2, sortDirection, sortColumn, gridOptions);
        break;
    }
  }

  return sortResult;
}
