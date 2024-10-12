import { describe, expect, it } from 'vitest';

import { SortDirectionNumber } from '../../enums/index.js';
import { SortComparers } from '../index.js';

describe('the Boolean SortComparer', () => {
  it('should return original unsorted array when no direction is provided', () => {
    const direction = null as any;
    const inputArray = [false, true, true, false];
    inputArray.sort((value1, value2) => SortComparers.boolean(value1, value2, direction));
    expect(inputArray).toEqual([false, true, true, false]);
  });

  it('should return original unsorted array when neutral (0) direction is provided', () => {
    const direction = SortDirectionNumber.neutral;
    const inputArray = [false, true, null, true, false];
    inputArray.sort((value1, value2) => SortComparers.boolean(value1, value2, direction));
    expect(inputArray).toEqual([false, true, null, true, false]);
  });

  it('should return all False values before True values when sorting in ascending order', () => {
    const direction = SortDirectionNumber.asc;
    const inputArray = [false, null, true, true, false];
    inputArray.sort((value1, value2) => SortComparers.boolean(value1, value2, direction));
    expect(inputArray).toEqual([null, false, false, true, true]);
  });

  it('should return all True values before False values when sorting in descending order', () => {
    const direction = SortDirectionNumber.desc;
    const inputArray = [false, true, true, false];
    inputArray.sort((value1, value2) => SortComparers.boolean(value1, value2, direction));
    expect(inputArray).toEqual([true, true, false, false]);
  });
});
