import { Sorter } from '../interfaces/index';
import { SortDirectionNumber } from '../enums/sortDirectionNumber.enum';

export const stringSorter: Sorter = (value1: any, value2: any, sortDirection: number | SortDirectionNumber) => {
  if (sortDirection === undefined || sortDirection === null) {
    sortDirection = SortDirectionNumber.neutral;
  }
  let position = 0;

  if (value1 === value2) {
    position = 0;
  } else if (value1 === null || value1 === undefined) {
    position = -1;
  } else if (value2 === null || value2 === undefined) {
    position = 1;
  } else if (value1 === value2) {
    position = 0;
  } else if (sortDirection) {
    position = value1 < value2 ? -1 : 1;
  } else {
    position = value1 < value2 ? 1 : -1;
  }
  return sortDirection * position;
};
