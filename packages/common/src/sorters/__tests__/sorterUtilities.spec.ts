import { Column } from '../../interfaces/index';
import { FieldType, SortDirectionNumber } from '../../enums/index';
import { sortByFieldType } from '../sorterUtilities';
import { Sorters } from '..';

describe('sorterUtilities', () => {
  it('should call the Sorters.numeric when FieldType is number', () => {
    const spy = jest.spyOn(Sorters, 'numeric');
    sortByFieldType(FieldType.number, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc);
  });

  it('should call the Sorters.numeric when FieldType is integer', () => {
    const spy = jest.spyOn(Sorters, 'numeric');
    sortByFieldType(FieldType.integer, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc);
  });

  it('should call the Sorters.numeric when FieldType is float', () => {
    const spy = jest.spyOn(Sorters, 'numeric');
    sortByFieldType(FieldType.float, 0, 4, SortDirectionNumber.asc, { id: 'field1', field: 'field1' });
    expect(spy).toHaveBeenCalledWith(0, 4, SortDirectionNumber.asc);
  });

  it('should call the Sorters.string when FieldType is a string (which is also the default)', () => {
    const string1 = 'John';
    const string2 = 'Jane';
    const spy = jest.spyOn(Sorters, 'string');
    sortByFieldType(FieldType.string, string1, string2, SortDirectionNumber.asc);
    expect(spy).toHaveBeenCalledWith(string1, string2, SortDirectionNumber.asc);
  });

  it('should call the Sorters.objectString when FieldType is objectString', () => {
    const object1 = { firstName: 'John', lastName: 'Z' };
    const object2 = { firstName: 'Jane', lastName: 'Doe' };
    const mockColumn = { id: 'field1', field: 'field1', dataKey: 'firstName' } as Column;
    const spy = jest.spyOn(Sorters, 'objectString');
    sortByFieldType(FieldType.object, object1, object2, SortDirectionNumber.asc, mockColumn);
    expect(spy).toHaveBeenCalledWith(object1, object2, SortDirectionNumber.asc, mockColumn);
  });
});
