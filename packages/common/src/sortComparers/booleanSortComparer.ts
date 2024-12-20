import type { SortComparer } from '../interfaces/index.js';
import { SortDirectionNumber } from '../enums/sortDirectionNumber.enum.js';

export const booleanSortComparer: SortComparer = (
  value1: any,
  value2: any,
  sortDirection: SortDirectionNumber = SortDirectionNumber.neutral
) => {
  let position = 0;

  if (value1 === value2) {
    position = 0;
  } else if (value1 === null) {
    position = -1;
  } else if (value2 === null) {
    position = 1;
  } else {
    if (sortDirection) {
      position = value1 < value2 ? -1 : 1;
    } else {
      position = value1 < value2 ? 1 : -1;
    }
  }
  return sortDirection * position;
};
