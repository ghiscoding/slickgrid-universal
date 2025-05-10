import { SortDirectionNumber } from '../enums/sortDirectionNumber.enum.js';
import type { Column, GridOption, SortComparer } from '../interfaces/index.js';

export const numericSortComparer: SortComparer = (
  value1: any,
  value2: any,
  sortDirection: SortDirectionNumber = SortDirectionNumber.neutral,
  sortColumn?: Column,
  gridOptions?: GridOption
) => {
  const checkForUndefinedValues = sortColumn?.valueCouldBeUndefined ?? gridOptions?.cellValueCouldBeUndefined ?? false;
  const x = getSortVal(value1, checkForUndefinedValues);
  const y = getSortVal(value2, checkForUndefinedValues);
  return sortDirection * (x === y ? 0 : x > y ? 1 : -1);
};

function getSortVal(val: any, checkForUndefinedValues: boolean) {
  return isNaN(val) || val === '' || val === null || (checkForUndefinedValues && val === undefined) ? -Infinity : parseFloat(val);
}
