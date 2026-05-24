import { describe, expect, it, vi } from 'vitest';
import { SortDirectionNumber } from '../../enums/index.js';
import type { Column } from '../../interfaces/index.js';
import * as booleanModule from '../booleanSortComparer.js';
import * as numericModule from '../numericSortComparer.js';
import * as objectStringModule from '../objectStringSortComparer.js';
import { sortByFieldType } from '../sortUtilities.js';
import * as stringModule from '../stringSortComparer.js';

describe('sortUtilities', () => {
  it('should call the booleanSortComparer when FieldType is boolean', () => {
    const spy = vi.spyOn(booleanModule, 'booleanSortComparer');
    sortByFieldType('boolean', 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the numericSortComparer when FieldType is number', () => {
    const spy = vi.spyOn(numericModule, 'numericSortComparer');
    sortByFieldType('number', 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the numericSortComparer when FieldType is integer', () => {
    const spy = vi.spyOn(numericModule, 'numericSortComparer');
    sortByFieldType('integer', 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the numericSortComparer when FieldType is float', () => {
    const spy = vi.spyOn(numericModule, 'numericSortComparer');
    sortByFieldType('float', 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the stringSortComparer when FieldType is a string (which is also the default)', () => {
    const string1 = 'John';
    const string2 = 'Jane';
    const spy = vi.spyOn(stringModule, 'stringSortComparer');
    sortByFieldType('string', string1, string2, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(string1, string2, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the date comparer when FieldType is any date types', () => {
    const result1 = sortByFieldType('dateIso', '2020-01-01', '2020-02-01', SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(result1).toBeLessThan(0);

    const result2 = sortByFieldType('dateIso', '2020-02-01', '2020-01-01', SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(result2).toBeGreaterThan(0);
  });

  it('should call the objectStringSortComparer when FieldType is objectString', () => {
    const object1 = { firstName: 'John', lastName: 'Z' };
    const object2 = { firstName: 'Jane', lastName: 'Doe' };
    const mockColumn = { id: 'field1', field: 'field1', dataKey: 'firstName' } as Column;
    const spy = vi.spyOn(objectStringModule, 'objectStringSortComparer');
    sortByFieldType('object', object1, object2, SortDirectionNumber.asc, mockColumn);
    expect(spy).toHaveBeenCalledWith(object1, object2, SortDirectionNumber.asc, mockColumn, undefined);
  });
});
