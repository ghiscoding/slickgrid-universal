import type { SortComparer } from '../interfaces/index';
import { SortDirectionNumber } from '../enums/sortDirectionNumber.enum';

export const booleanSortComparer: SortComparer = (value1: any, value2: any, sortDirection: number | SortDirectionNumber) => {
  if (sortDirection === undefined || sortDirection === null) {
    sortDirection = SortDirectionNumber.neutral;
  }
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
