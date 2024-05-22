import { removeAccentFromText } from '@slickgrid-universal/utils';

import type { Column, GridOption, SortComparer } from '../interfaces/index';
import { SortDirectionNumber } from '../enums/sortDirectionNumber.enum';

export const stringSortComparer: SortComparer = (value1: any, value2: any, sortDirection: SortDirectionNumber = SortDirectionNumber.neutral, sortColumn?: Column, gridOptions?: GridOption) => {
  let position = 0;
  const checkForUndefinedValues = sortColumn?.valueCouldBeUndefined ?? gridOptions?.cellValueCouldBeUndefined ?? false;

  if (value1 === value2) {
    position = 0;
  } else if (value1 === null || (checkForUndefinedValues && value1 === undefined)) {
    position = -1;
  } else if (value2 === null || (checkForUndefinedValues && value2 === undefined)) {
    position = 1;
  } else {
    if (gridOptions?.ignoreAccentOnStringFilterAndSort) {
      value1 = removeAccentFromText(value1, false);
      value2 = removeAccentFromText(value2, false);
    }
    if (sortDirection) {
      position = value1 < value2 ? -1 : 1;
    } else {
      position = value1 < value2 ? 1 : -1;
    }
  }
  return sortDirection * position;
};
