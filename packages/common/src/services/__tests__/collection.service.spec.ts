import { parse } from '@formkit/tempo';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CollectionService } from '../collection.service';
import { FieldType, FilterMultiplePassType, OperatorType, } from '../../enums/index';
import type { CollectionFilterBy, CollectionSortBy, Column, GridOption, } from '../../interfaces/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { type SlickGrid } from '../../core';

const gridOptionMock: GridOption = {
  preParseDateColumns: true
};

const gridStub: SlickGrid = {
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  setSortColumns: vi.fn(),
  setOptions: vi.fn(),
} as unknown as SlickGrid;

describe('CollectionService', () => {
  let collection = [];
  let stringCollection: any[] = [];
  let service: CollectionService;
  let translateService: TranslateServiceStub;

  describe('with I18N Service', () => {
    beforeEach(() => {
      translateService = new TranslateServiceStub();
      service = new CollectionService(translateService);

      collection = [
        { firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 },
        { firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 },
        { firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 13 },
        { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },
        { firstName: 'Bob', lastName: 'Cash', position: 'SALES_REP', order: 0 },
        { firstName: 'John', lastName: 'Doe', position: null, order: 5 },
        { firstName: 'John', lastName: 'Zachary', position: 'SALES_REP', order: 2 },
        { firstName: 'John', lastName: 'Doe', position: 'DEVELOPER', order: 4 },
        { firstName: 'John Foo', lastName: 'Bar', position: 'SALES_REP', order: 8 },
      ] as any;

      stringCollection = ['John', 'Jane', 'Ava Luna', '', 'Bob', 'John', null, 'John Foo'] as any[];
    });

    afterEach(() => {
      collection = undefined as any;
    });

    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    describe('Collection of Objects', () => {
      describe('filterCollection method', () => {
        it('should return on the columns that have firstName filled when the filtered value is actually undefined but will be checked as an empty string', () => {
          const filterBy = { property: 'firstName', operator: 'EQ', value: undefined } as CollectionFilterBy;

          const result = service.filterCollection(collection, filterBy);

          expect(result).toEqual([
            { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 }
          ]);
        });

        it('should return an array without certain filtered values', () => {
          const filterBy = { property: 'firstName', operator: 'NE', value: 'John' } as CollectionFilterBy;

          const result = service.filterCollection(collection, filterBy);

          expect(result).toEqual([
            { firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 },
            { firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 13 },
            { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },
            { firstName: 'Bob', lastName: 'Cash', position: 'SALES_REP', order: 0 },
            { firstName: 'John Foo', lastName: 'Bar', position: 'SALES_REP', order: 8 },
          ]);
        });

        it('should return an array without certain values filtered in a "chain" way', () => {
          const filterBy = [
            { property: 'firstName', operator: 'NE', value: 'John' },
            { property: 'lastName', operator: 'NE', value: 'Doe' }
          ] as CollectionFilterBy[];

          const result1 = service.filterCollection(collection, filterBy);
          const result2 = service.filterCollection(collection, filterBy, 'chain'); // chain is default

          expect(result1).toEqual([
            { firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 13 },
            { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },
            { firstName: 'Bob', lastName: 'Cash', position: 'SALES_REP', order: 0 },
            { firstName: 'John Foo', lastName: 'Bar', position: 'SALES_REP', order: 8 },
          ]);
          expect(result1).toEqual(result2);
        });

        it('should return an array with merged output of filtered values', () => {
          const filterBy = [
            { property: 'firstName', operator: OperatorType.equal, value: 'John' },
            { property: 'lastName', value: 'Doe' } // ommitted Operator are Equal by default
          ] as CollectionFilterBy[];

          const result = service.filterCollection(collection, filterBy, FilterMultiplePassType.merge);

          expect(result).toEqual([
            // the array will have all "John" 1st, then all "Doe"
            { firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 },
            { firstName: 'John', lastName: 'Doe', position: null, order: 5 },
            { firstName: 'John', lastName: 'Zachary', position: 'SALES_REP', order: 2 },
            { firstName: 'John', lastName: 'Doe', position: 'DEVELOPER', order: 4 },
            { firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 },
          ]);
        });
      });

      describe('singleFilterCollection method', () => {
        it('should return an array by using the "contains" filter type', () => {
          const filterBy = { property: 'firstName', operator: OperatorType.contains, value: 'Foo' } as CollectionFilterBy;

          const result = service.singleFilterCollection(collection, filterBy);

          expect(result).toEqual([{ firstName: 'John Foo', lastName: 'Bar', position: 'SALES_REP', order: 8 }]);
        });

        it('should return an array by using the "notContains" filter type', () => {
          const filterBy = { property: 'firstName', operator: OperatorType.notContains, value: 'John' } as CollectionFilterBy;

          const result = service.singleFilterCollection(collection, filterBy);

          expect(result).toEqual([
            { firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 },
            { firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 13 },
            { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },
            { firstName: 'Bob', lastName: 'Cash', position: 'SALES_REP', order: 0 },
          ]);
        });
      });

      describe('sortCollection method', () => {
        it('should return a collection sorted by a "dataKey"', () => {
          const columnDef = { id: 'users', field: 'users', dataKey: 'lastName' } as Column;

          const result = service.sortCollection(columnDef, collection, { property: 'lastName', sortDesc: true, fieldType: FieldType.string });

          expect(result).toEqual([
            { firstName: 'John', lastName: 'Zachary', position: 'SALES_REP', order: 2 },
            { firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 },
            { firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 },
            { firstName: 'John', lastName: 'Doe', position: null, order: 5 },
            { firstName: 'John', lastName: 'Doe', position: 'DEVELOPER', order: 4 },
            { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },
            { firstName: 'Bob', lastName: 'Cash', position: 'SALES_REP', order: 0 },
            { firstName: 'John Foo', lastName: 'Bar', position: 'SALES_REP', order: 8 },
            { firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 13 },
          ]);
        });

        it('should return a collection sorted by multiple sortBy entities', () => {
          const columnDef = { id: 'users', field: 'users', dataKey: 'lastName' } as Column;
          const sortBy = [
            { property: 'firstName', sortDesc: false, fieldType: FieldType.string },
            { property: 'lastName', sortDesc: true, fieldType: FieldType.string },
          ] as CollectionSortBy[];

          const result = service.sortCollection(columnDef, collection, sortBy);

          expect(result).toEqual([
            { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },
            { firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 13 },
            { firstName: 'Bob', lastName: 'Cash', position: 'SALES_REP', order: 0 },
            { firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 },
            { firstName: 'John', lastName: 'Zachary', position: 'SALES_REP', order: 2 },
            { firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 },
            { firstName: 'John', lastName: 'Doe', position: null, order: 5 },
            { firstName: 'John', lastName: 'Doe', position: 'DEVELOPER', order: 4 },
            { firstName: 'John Foo', lastName: 'Bar', position: 'SALES_REP', order: 8 },
          ]);
        });

        it('should return a collection sorted by a sortyBy entity being a number', () => {
          const columnDef = { id: 'users', field: 'users', dataKey: 'lastName' } as Column;
          const sortBy = [
            { property: 'order', sortDesc: true, fieldType: FieldType.number },
          ] as CollectionSortBy[];

          const result = service.sortCollection(columnDef, collection, sortBy);

          expect(result).toEqual([
            { firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 13 },
            { firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 },
            { firstName: 'John Foo', lastName: 'Bar', position: 'SALES_REP', order: 8 },
            { firstName: 'John', lastName: 'Doe', position: null, order: 5 },
            { firstName: 'John', lastName: 'Doe', position: 'DEVELOPER', order: 4 },
            { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },
            { firstName: 'John', lastName: 'Zachary', position: 'SALES_REP', order: 2 },
            { firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 },
            { firstName: 'Bob', lastName: 'Cash', position: 'SALES_REP', order: 0 },
          ]);
        });

        it('should return a collection sorted by multiple sortBy entities and their translated value', () => {
          translateService.use('fr');
          const columnDef = { id: 'users', field: 'users', dataKey: 'lastName' } as Column;
          const sortBy = [
            { property: 'firstName', sortDesc: false, fieldType: FieldType.string },
            { property: 'position', sortDesc: true }, // fieldType is string by default
          ] as CollectionSortBy[];

          const result = service.sortCollection(columnDef, collection, sortBy, true);

          expect(result).toEqual([
            { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },
            { firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 13 },
            { firstName: 'Bob', lastName: 'Cash', position: 'SALES_REP', order: 0 },
            { firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 },
            { firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 },
            { firstName: 'John', lastName: 'Zachary', position: 'SALES_REP', order: 2 },
            { firstName: 'John', lastName: 'Doe', position: 'DEVELOPER', order: 4 },
            { firstName: 'John', lastName: 'Doe', position: null, order: 5 },
            { firstName: 'John Foo', lastName: 'Bar', position: 'SALES_REP', order: 8 },
          ]);
        });

        it('should return a collection sorted by a single sortBy entity and their translated value', () => {
          translateService.use('en');
          const columnDef = { id: 'users', field: 'users' } as Column;
          const sortBy = { property: 'position', sortDesc: false } as CollectionSortBy; // fieldType is string by default

          const result = service.sortCollection(columnDef, collection, sortBy, true);

          expect(result).toEqual([
            { firstName: 'John', lastName: 'Doe', position: null, order: 5 },
            { firstName: 'John', lastName: 'Doe', position: 'DEVELOPER', order: 4 },
            { firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 },
            { firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 13 },
            { firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 },
            { firstName: '', lastName: 'Cash', position: 'SALES_REP', order: 3 },
            { firstName: 'Bob', lastName: 'Cash', position: 'SALES_REP', order: 0 },
            { firstName: 'John', lastName: 'Zachary', position: 'SALES_REP', order: 2 },
            { firstName: 'John Foo', lastName: 'Bar', position: 'SALES_REP', order: 8 },
          ]);
        });
      });
    });

    describe('Collection of Strings/Numbers', () => {
      describe('filterCollection method', () => {
        it('should return on the columns that have firstName filled when the filtered value is actually undefined but will be checked as an empty string', () => {
          const filterBy = { operator: 'EQ', value: undefined } as CollectionFilterBy;

          const result = service.filterCollection(stringCollection, filterBy);

          expect(result).toEqual(['']);
        });

        it('should return an array without certain values filtered in a "chain" way', () => {
          const filterBy = [
            { operator: 'NE', value: 'John' },
            { operator: 'NE', value: 'Bob' }
          ] as CollectionFilterBy[];

          const result1 = service.filterCollection(stringCollection, filterBy);
          const result2 = service.filterCollection(stringCollection, filterBy, 'chain'); // chain is default

          expect(result1).toEqual(['Jane', 'Ava Luna', '', null, 'John Foo']);
          expect(result1).toEqual(result2);
        });

        it('should return an array with merged (unique values no duplicate) output of filtered values', () => {
          const filterBy = [
            { operator: OperatorType.equal, value: 'John' },
            { value: 'Bob' } // ommitted Operator are Equal by default
          ] as CollectionFilterBy[];

          const result = service.filterCollection(stringCollection, filterBy, FilterMultiplePassType.merge);

          expect(result).toEqual(['John', 'Bob']);
        });
      });

      describe('singleFilterCollection method', () => {
        // stringCollection = ['John', 'Jane', 'Ava Luna', '', 'Bob', 'John', null, 'John Foo'];

        it('should return an array by using the "contains" filter type', () => {
          const filterBy = { operator: OperatorType.contains, value: 'Foo' } as CollectionFilterBy;

          const result = service.singleFilterCollection(stringCollection, filterBy);

          expect(result).toEqual(['John Foo']);
        });

        it('should return an array by using the "notContains" filter type', () => {
          const filterBy = { operator: OperatorType.notContains, value: 'John' } as CollectionFilterBy;

          const result = service.singleFilterCollection(stringCollection, filterBy);

          expect(result).toEqual(['Jane', 'Ava Luna', '', 'Bob']);
        });
      });

      describe('sortCollection method', () => {
        it('should return a collection of numbers sorted', () => {
          translateService.use('en');
          const columnDef = { id: 'count', field: 'count', type: FieldType.number } as Column;

          const result1 = service.sortCollection(columnDef, [0, -11, 3, 99999, -200], { sortDesc: false } as CollectionSortBy);
          const result2 = service.sortCollection(columnDef, [0, -11, 3, 99999, -200], { sortDesc: true } as CollectionSortBy);

          expect(result1).toEqual([-200, -11, 0, 3, 99999]);
          expect(result2).toEqual([99999, 3, 0, -11, -200]);
        });

        it('should return a collection of translation values sorted', () => {
          translateService.use('en');
          const roleCollection = ['SALES_REP', 'DEVELOPER', 'SALES_REP', null, 'HUMAN_RESOURCES', 'FINANCE_MANAGER', 'UNKNOWN'];
          const columnDef = { id: 'count', field: 'count', type: FieldType.string } as Column;

          const result1 = service.sortCollection(columnDef, [...roleCollection], { sortDesc: false } as CollectionSortBy, true);
          const result2 = service.sortCollection(columnDef, [...roleCollection], { sortDesc: true } as CollectionSortBy, true);

          expect(result1).toEqual([null, 'DEVELOPER', 'FINANCE_MANAGER', 'HUMAN_RESOURCES', 'SALES_REP', 'SALES_REP', 'UNKNOWN']);
          expect(result2).toEqual(['UNKNOWN', 'SALES_REP', 'SALES_REP', 'HUMAN_RESOURCES', 'FINANCE_MANAGER', 'DEVELOPER', null]);
        });
      });
    }); // Collection of strings/numbers
  }); // with i18n

  describe('without I18N Service', () => {
    beforeEach(() => {
      translateService = undefined as any;
      service = new CollectionService(translateService);
    });

    it('should throw an error if "enableTranslate" is set but the I18N Service is null', () => {
      const columnDef = { id: 'users', field: 'users', dataKey: 'lastName' } as Column;

      expect(() => service.sortCollection(columnDef, collection, { property: 'lastName', sortDesc: true, fieldType: FieldType.string }, true))
        .toThrow('[Slickgrid-Universal] requires a Translate Service to be installed and configured');
    });
  });

  describe('Pre-Parse Dates', () => {
    const columns: Column[] = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'start', field: 'start', name: 'Start', type: FieldType.dateIso },
      { id: 'finish', field: 'finish', name: 'Finish', type: FieldType.dateIso },
    ];
    let collection: any[] = [];

    beforeEach(() => {
      collection = [
        { firstName: 'John', lastName: 'Z', start: '2024-02-05', finish: '2024-04-01' },
        { firstName: 'Jane', lastName: 'Doe', start: '2024-05-02', finish: '2024-06-02' },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(columns);
    });

    it('should read all rows and parse date string columns and reassign as Date object when calling preParseDateItems()', () => {
      service.preParseDateItems(collection, gridStub);

      expect(collection).toEqual([
        { firstName: 'John', lastName: 'Z', start: parse('2024-02-05', 'YYYY-MM-DD'), finish: parse('2024-04-01', 'YYYY-MM-DD') },
        { firstName: 'Jane', lastName: 'Doe', start: parse('2024-05-02', 'YYYY-MM-DD'), finish: parse('2024-06-02', 'YYYY-MM-DD') },
      ]);
    });

    it('should read a single row and parse date string columns and reassign as Date object when calling parseSingleDateItem()', () => {
      service.parseSingleDateItem(collection[0], gridStub);

      // text with only parsing/assigning first row
      expect(collection).toEqual([
        { firstName: 'John', lastName: 'Z', start: parse('2024-02-05', 'YYYY-MM-DD'), finish: parse('2024-04-01', 'YYYY-MM-DD') },
        { firstName: 'Jane', lastName: 'Doe', start: '2024-05-02', finish: '2024-06-02' },
      ]);
    });
  });
});
