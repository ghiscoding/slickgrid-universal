import { Column } from '../../interfaces/index';
import { FieldType, SortDirectionNumber } from '../../enums/index';
import { sortByFieldType } from '../sortUtilities';
import { SortComparers } from '..';

describe('sortUtilities', () => {
  it('should call the SortComparers.numeric when FieldType is number', () => {
    const spy = jest.spyOn(SortComparers, 'numeric');
    sortByFieldType(FieldType.number, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the SortComparers.numeric when FieldType is integer', () => {
    const spy = jest.spyOn(SortComparers, 'numeric');
    sortByFieldType(FieldType.integer, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the SortComparers.numeric when FieldType is float', () => {
    const spy = jest.spyOn(SortComparers, 'numeric');
    sortByFieldType(FieldType.float, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the SortComparers.string when FieldType is a string (which is also the default)', () => {
    const string1 = 'John';
    const string2 = 'Jane';
    const spy = jest.spyOn(SortComparers, 'string');
    sortByFieldType(FieldType.string, string1, string2, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(string1, string2, SortDirectionNumber.asc, { id: 'field1', field: 'field1' }, undefined);
  });

  it('should call the SortComparers.objectString when FieldType is objectString', () => {
    const object1 = { firstName: 'John', lastName: 'Z' };
    const object2 = { firstName: 'Jane', lastName: 'Doe' };
    const mockColumn = { id: 'field1', field: 'field1', dataKey: 'firstName' } as Column;
    const spy = jest.spyOn(SortComparers, 'objectString');
    sortByFieldType(FieldType.object, object1, object2, SortDirectionNumber.asc, mockColumn);
    expect(spy).toHaveBeenCalledWith(object1, object2, SortDirectionNumber.asc, mockColumn, undefined);
  });
});
