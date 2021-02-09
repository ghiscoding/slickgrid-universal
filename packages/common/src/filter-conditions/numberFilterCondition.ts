import { OperatorType } from '../enums/index';
import { FilterCondition, FilterConditionOption } from '../interfaces/index';
import { testFilterCondition } from './filterUtilities';

export const numberFilterCondition: FilterCondition = (options: FilterConditionOption, ...parsedSearchValues: number[]) => {
  const cellValue = parseFloat(options.cellValue);
  const [searchValue1, searchValue2] = parsedSearchValues;

  if (!searchValue1 && !options.operator) {
    return true;
  }

  if (searchValue1 !== undefined && searchValue2 !== undefined) {
    const isInclusive = options?.operator === OperatorType.rangeInclusive;
    const resultCondition1 = testFilterCondition((isInclusive ? '>=' : '>'), cellValue, searchValue1);
    const resultCondition2 = testFilterCondition((isInclusive ? '<=' : '<'), cellValue, searchValue2);
    return (resultCondition1 && resultCondition2);
  }
  return testFilterCondition(options.operator || '==', cellValue, searchValue1);
};
