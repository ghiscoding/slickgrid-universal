import { describe, expect, it } from 'vitest';

import { sortByFieldType } from '../sortUtilities.js';
import { FieldType, SortDirectionNumber } from '../../enums/index.js';

describe('the Date US Short Sorter', () => {
  it('should return an array of US dates sorted ascending when only valid dates are provided', () => {
    const direction = SortDirectionNumber.asc;
    const inputArray = ['8/8/98', '10/8/98', '8/8/98', '1/1/18', '12/14/98'];
    inputArray.sort((value1, value2) => sortByFieldType(FieldType.dateUsShort, value1, value2, direction));
    expect(inputArray).toEqual(['8/8/98', '8/8/98', '10/8/98', '12/14/98', '1/1/18']);
  });

  it('should return an array of US dates sorted descending when only valid dates are provided', () => {
    const direction = SortDirectionNumber.desc;
    const inputArray = ['8/8/98', '10/8/98', null, '8/8/98', '1/1/18', '12/14/98'];
    inputArray.sort((value1, value2) => sortByFieldType(FieldType.dateUsShort, value1, value2, direction));
    expect(inputArray).toEqual(['1/1/18', '12/14/98', '10/8/98', '8/8/98', '8/8/98', null]);
  });

  it(`should return an array with unsorted characters showing at the beginning
    then comes numbers sorted ascending when digits and chars are provided`, () => {
    const direction = SortDirectionNumber.asc;
    const inputArray = ['10/8/98', 'y', '8/8/98', '1/1/18', '12/14/98'];
    inputArray.sort((value1, value2) => sortByFieldType(FieldType.dateUsShort, value1, value2, direction));
    expect(inputArray).toEqual(['y', '8/8/98', '10/8/98', '12/14/98', '1/1/18']);
  });

  it(`should return an array with dates sorted descending showing at the beginning then characters`, () => {
    const direction = SortDirectionNumber.desc;
    const inputArray = ['10/8/98', null, '8/8/98', '1/1/18', '12/14/98'];
    inputArray.sort((value1, value2) => sortByFieldType(FieldType.dateUsShort, value1, value2, direction));
    expect(inputArray).toEqual(['1/1/18', '12/14/98', '10/8/98', '8/8/98', null]);
  });
});
