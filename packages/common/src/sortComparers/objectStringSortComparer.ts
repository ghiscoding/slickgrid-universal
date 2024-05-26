import type { Column, GridOption, SortComparer } from '../interfaces/index';
import { SortDirectionNumber } from '../enums/sortDirectionNumber.enum';

export const objectStringSortComparer: SortComparer = (value1: any, value2: any, sortDirection: SortDirectionNumber = SortDirectionNumber.neutral, sortColumn?: Column, gridOptions?: GridOption) => {
  if (!sortColumn || !sortColumn.dataKey) {
    throw new Error('Sorting a "FieldType.object" requires you to provide the "dataKey" (object property name) of the object so that we can use it to sort correctly');
  }

  const stringValue1 = value1?.hasOwnProperty(sortColumn.dataKey) ? value1[sortColumn.dataKey] : value1;
  const stringValue2 = value2?.hasOwnProperty(sortColumn.dataKey) ? value2[sortColumn.dataKey] : value2;
  const checkForUndefinedValues = sortColumn?.valueCouldBeUndefined ?? gridOptions?.cellValueCouldBeUndefined ?? false;

  let position = 0;
  if (typeof value1 !== 'object') {
    position = -Infinity;
  } else if (typeof value2 !== 'object') {
    position = Infinity;
  } else if (stringValue1 === null || (checkForUndefinedValues && stringValue1 === undefined)) {
    position = -1;
  } else if (stringValue2 === null || (checkForUndefinedValues && stringValue2 === undefined)) {
    position = 1;
  } else if (stringValue1 === stringValue2) {
    position = 0;
  } else if (sortDirection) {
    position = stringValue1 < stringValue2 ? -1 : 1;
  } else {
    position = stringValue1 < stringValue2 ? 1 : -1;
  }

  return sortDirection * position;
};
