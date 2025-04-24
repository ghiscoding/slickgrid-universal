import { describe, expect, it, vi } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { FieldType, SortDirectionNumber } from '../../enums/index.js';
import { sortByFieldType } from '../sortUtilities.js';
import { SortComparers } from '../sortComparers.index.js';

describe('sortUtilities', () => {
  it('should call the SortComparers.boolean when FieldType is boolean', () => {
    const spy = vi.spyOn(SortComparers, 'boolean');
    sortByFieldType(FieldType.boolean, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the SortComparers.numeric when FieldType is number', () => {
    const spy = vi.spyOn(SortComparers, 'numeric');
    sortByFieldType(FieldType.number, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the SortComparers.numeric when FieldType is integer', () => {
    const spy = vi.spyOn(SortComparers, 'numeric');
    sortByFieldType(FieldType.integer, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the SortComparers.numeric when FieldType is float', () => {
    const spy = vi.spyOn(SortComparers, 'numeric');
    sortByFieldType(FieldType.float, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the SortComparers.string when FieldType is a string (which is also the default)', () => {
    const string1 = 'John';
    const string2 = 'Jane';
    const spy = vi.spyOn(SortComparers, 'string');
    sortByFieldType(FieldType.string, string1, string2, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(string1, string2, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the SortComparers.date when FieldType is any date types', () => {
    const result1 = sortByFieldType(FieldType.dateIso, '2020-01-01', '2020-02-01', SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(result1).toBeLessThan(0);

    const result2 = sortByFieldType(FieldType.dateIso, '2020-02-01', '2020-01-01', SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(result2).toBeGreaterThan(0);
  });

  it('should call the SortComparers.date by column when date type and "params.inputFormat" are provided', () => {
    const result1 = sortByFieldType(FieldType.dateIso, 'Jan 01, 2020', 'Feb 01, 2020', SortDirectionNumber.asc, {
      id: 'field1',
      field: 'field1',
      params: { inputFormat: 'MMM DD, YYYY' },
    });
    expect(result1).toBeLessThan(0);

    const result2 = sortByFieldType(FieldType.dateIso, 'Feb 01, 2020', 'Jan 01, 2020', SortDirectionNumber.asc, {
      id: 'field1',
      field: 'field1',
      params: { inputFormat: 'MMM DD, YYYY' },
    });
    expect(result2).toBeGreaterThan(0);
  });

  it('should call the SortComparers.objectString when FieldType is objectString', () => {
    const object1 = { firstName: 'John', lastName: 'Z' };
    const object2 = { firstName: 'Jane', lastName: 'Doe' };
    const mockColumn = { id: 'field1', field: 'field1', dataKey: 'firstName' } as Column;
    const spy = vi.spyOn(SortComparers, 'objectString');
    sortByFieldType(FieldType.object, object1, object2, SortDirectionNumber.asc, mockColumn);
    expect(spy).toHaveBeenCalledWith(object1, object2, SortDirectionNumber.asc, mockColumn, undefined);
  });
});
