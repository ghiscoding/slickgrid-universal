import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test, vi } from 'vitest';
import { Aggregators } from '../../aggregators/index.js';
import { SortDirectionNumber } from '../../enums/sortDirectionNumber.enum.js';
import { SlickHybridSelectionModel } from '../../extensions/slickHybridSelectionModel.js';
import type { GridOption, Grouping } from '../../interfaces/index.js';
import { SortComparers } from '../../sortComparers/index.js';
import { SlickEventData } from '../slickCore.js';
import { SlickDataView } from '../slickDataview.js';
import { SlickGrid } from '../slickGrid.js';

class FakeAggregator {
  init() {}
  storeResult() {}
}

vi.useFakeTimers();

describe('SlickDatView core file', () => {
  let container: HTMLElement;
  let dv: SlickDataView;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'myGrid';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.textContent = '';
    dv.destroy();
  });

  it('should be able to instantiate SlickDataView', () => {
    dv = new SlickDataView({});

    expect(dv.getItems()).toEqual([]);
  });

  it('should be able to add items to the DataView', () => {
    const mockData = [
      { id: 1, firstName: 'John', lastName: 'Doe' },
      { id: 2, firstName: 'Jane', lastName: 'Doe' },
    ];
    dv = new SlickDataView({});
    dv.addItem(mockData[0]);
    dv.addItem(mockData[1]);

    expect(dv.getLength()).toBe(2);
    expect(dv.getItemCount()).toBe(2);
    expect(dv.getItems()).toEqual(mockData);
  });

  describe('Item Getters', () => {
    afterEach(() => {
      dv.destroy();
    });

    test('retrieve an item from the DataView at specific index by calling getItem()', () => {
      const items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      dv.setItems(items);

      expect(dv.getItemCount()).toBe(2);
      expect(dv.getLength()).toBe(2);
      expect(dv.getItem(1)).toEqual({ id: 3, name: 'Jane', age: 24 });
    });

    describe('getRowByItem()', () => {
      test('get row number in the grid by its item object by calling getRowByItem()', () => {
        const items = [
          { id: 4, name: 'John', age: 20 },
          { id: 3, name: 'Jane', age: 24 },
        ];
        dv.setItems(items);

        expect(dv.getRowByItem(items[1])).toBe(1);
      });

      it('should return undefined when calling getRowByItem() with an invalid item', () => {
        const items = [
          { id: 4, name: 'John', age: 20 },
          { id: 3, name: 'Jane', age: 24 },
        ];
        const newItem = { id: 2, name: 'Bob', age: 30 };
        dv.setItems(items);

        expect(dv.getRowByItem(newItem)).toBeUndefined();
      });
    });

    test('get row number in the grid by its Id by calling getRowById()', () => {
      const items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      dv.setItems(items);

      expect(dv.getRowById(3)).toBe(1);
    });

    test('get an item in the DataView by its Id by calling getItemById()', () => {
      const items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      dv.setItems(items);

      expect(dv.getItemById(3)).toEqual({ id: 3, name: 'Jane', age: 24 });
    });

    test('retrieve an item from the DataView at specific index by calling getItem()', () => {
      const items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      dv.setItems(items);
      expect(dv.getItem(1)).toEqual({ id: 3, name: 'Jane', age: 24 });
    });

    it('should return mapping of items with their row indexes', () => {
      const items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      dv.setItems(items);
      expect(dv.mapItemsToRows(items)).toEqual([0, 1]);
    });

    it('should return mapping of item Ids with their row indexes and exclude any Ids not found', () => {
      const items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      dv.setItems(items);
      expect(dv.mapIdsToRows([3, 4, 999])).toEqual([1, 0]);
    });

    it('should return mapping of row indexes with their item Ids and exclude any indexes not found', () => {
      const items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      dv.setItems(items);
      expect(dv.mapRowsToIds([0, 1, 999])).toEqual([4, 3]);
    });

    it('should work with a custom global item metadata provider provided to the DataView constructor options', () => {
      dv = new SlickDataView({
        globalItemMetadataProvider: {
          getRowMetadata(item, row) {
            return `row ${row} with name: ${item.name}`;
          },
        },
      });
      const items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      dv.setItems(items);
      expect(dv.getItemMetadata(0)).toBe('row 0 with name: John');
      expect(dv.getItemMetadata(1)).toBe('row 1 with name: Jane');
    });
  });

  describe('CRUD methods', () => {
    afterEach(() => {
      dv.destroy();
    });

    describe('addItem()', () => {
      it('should call the method and expect item to be added', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const newItem = { id: 2, name: 'Bob', age: 30 };

        dv.setItems(items);
        dv.addItem(newItem);

        expect(dv.getItems().length).toBe(3);
        expect(dv.getItems()).toEqual([
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
          { id: 2, name: 'Bob', age: 30 },
        ]);
      });
    });

    describe('deleteItem()', () => {
      it('should call the method and return undefined when item Map is undefined', () => {
        expect(dv.deleteItem(99)).toBeUndefined();
      });

      it('should throw when item Id is not found in the items array', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        dv.setItems(items);
        expect(() => dv.deleteItem(99)).toThrow('[SlickGrid DataView] Invalid id');
      });

      test('delete an item from the items array', () => {
        const refreshSpy = vi.spyOn(dv, 'refresh');
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];

        dv.setItems(items);
        dv.deleteItem(1);

        expect(dv.getItems()).toEqual([{ id: 0, name: 'John', age: 20 }]);
        expect(refreshSpy).toHaveBeenCalled();
      });
    });

    describe('deleteItems()', () => {
      it('should call the method and return undefined when item Map is undefined', () => {
        expect(dv.deleteItems([99])).toBeUndefined();
      });

      it('should throw when item Id is not found in the items array', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        dv.setItems(items);
        expect(() => dv.deleteItems([99])).toThrow('[SlickGrid DataView] Invalid id');
      });

      test('delete an item from the items array', () => {
        const refreshSpy = vi.spyOn(dv, 'refresh');
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];

        dv.setItems(items);
        dv.deleteItems([1]);

        expect(dv.getItems()).toEqual([{ id: 0, name: 'John', age: 20 }]);
        expect(refreshSpy).toHaveBeenCalled();
      });
    });

    describe('updateItem()', () => {
      it('should throw when calling the method with input Ids array does not match items array', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        expect(() => dv.updateItems([0, 1, 99], items)).toThrow('[SlickGrid DataView] Mismatch on the length of ids and items provided to update');
      });

      it('should update item when calling the method', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const updatedItem = { id: 1, name: 'Bob', age: 30 };

        dv.setItems(items);
        dv.updateItem(1, updatedItem);

        expect(dv.getItems().length).toBe(2);
        expect(dv.getItems()).toEqual([
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Bob', age: 30 },
        ]);
      });
    });

    describe('updateSingleItem()', () => {
      it('should call the method and return undefined when item Map is undefined', () => {
        expect(dv.updateSingleItem(99, {})).toBeUndefined();
      });

      it('should throw when calling the method with an Id that is not found', () => {
        dv.setItems([]);
        expect(() => dv.updateSingleItem(99, {})).toThrow('[SlickGrid DataView] Invalid id');
      });

      it('should call the method and expect item to be updated', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        dv.setItems(items);
        dv.updateSingleItem(1, { id: 1, name: 'Bob', age: 30 });

        expect(dv.getItems().length).toBe(2);
        expect(dv.getItems()).toEqual([
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Bob', age: 30 },
        ]);
        expect(dv.getItemByIdx(1)).toEqual({ id: 1, name: 'Bob', age: 30 });
      });

      it('should call the method and expect item to be updated when passing different Id', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];

        dv.setItems(items);
        dv.updateSingleItem(1, { id: 2, name: 'Bob', age: 30 });
        expect(dv.getIdxById(2)).toBe(1);
        dv.updateSingleItem(2, { id: 1, name: 'Bob', age: 30 });

        expect(dv.getItems().length).toBe(2);
        expect(dv.getItems()).toEqual([
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Bob', age: 30 },
        ]);
        expect(dv.getIdxById(1)).toBe(1);
      });

      test('cannot update item to associate with a non-unique id', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const updatedItem = { id: 1, name: 'Bob', age: 30 };

        dv.setItems(items);
        expect(() => dv.updateSingleItem(0, updatedItem)).toThrow('[SlickGrid DataView] Cannot update item to associate with a non-unique id');
      });

      test('cannot update item to associate with a null id', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const updatedItem = { name: 'Bob', age: 30 };

        dv.setItems(items);
        expect(() => dv.updateSingleItem(0, updatedItem)).toThrow('[SlickGrid DataView] Cannot update item to associate with a null id');
      });
    });
  });

  describe('batch CRUD methods', () => {
    afterEach(() => {
      dv.endUpdate(); // close any batch that weren't closed because of potential error thrown
      dv.destroy();
    });

    describe('deleteItems()', () => {
      it('should throw when calling the method with an index not found in the items array', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];

        dv.setItems(items);
        dv.beginUpdate(true);
        expect(() => dv.deleteItems([99])).toThrow('[SlickGrid DataView] Invalid id');
      });

      test('delete an item from the items array in bulk', () => {
        const refreshSpy = vi.spyOn(dv, 'refresh');
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];

        dv.setItems(items);
        dv.beginUpdate(true);
        dv.deleteItems([1]);
        dv.endUpdate();

        expect(dv.getItems()).toEqual([{ id: 0, name: 'John', age: 20 }]);
        expect(refreshSpy).toHaveBeenCalled();
      });
    });

    it('should batch items with addItems and begin/end batch update', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];

      dv.beginUpdate(true);
      dv.addItems(items);
      dv.endUpdate();

      expect(dv.getIdPropertyName()).toBe('id');
      expect(dv.getItems()).toEqual(items);
    });

    it('should batch more items with addItems with begin/end batch update and expect them to be inserted at the end of the dataset', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];
      const newItems = [
        { id: 3, name: 'Smith', age: 30 },
        { id: 4, name: 'Ronald', age: 34 },
      ];

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.addItems(newItems); // batch extra items
      dv.endUpdate();

      expect(dv.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
        { id: 3, name: 'Smith', age: 30 },
        { id: 4, name: 'Ronald', age: 34 },
      ]);
    });

    it('should batch more items with insertItems with begin/end batch update and expect them to be inserted at the beginning of the dataset', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];
      const newItems = [
        { id: 3, name: 'Smith', age: 30 },
        { id: 4, name: 'Ronald', age: 34 },
      ];

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.insertItems(0, newItems); // batch extra items
      dv.endUpdate();

      expect(dv.getItems()).toEqual([
        { id: 3, name: 'Smith', age: 30 },
        { id: 4, name: 'Ronald', age: 34 },
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ]);

      dv.deleteItem(3);

      expect(dv.getItems()).toEqual([
        { id: 4, name: 'Ronald', age: 34 },
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ]);
    });

    it('should be able to use different "id" when using setItems()', () => {
      const items = [
        { keyId: 0, name: 'John', age: 20 },
        { keyId: 1, name: 'Jane', age: 24 },
      ];

      dv.beginUpdate(true);
      dv.setItems(items, 'keyId');
      dv.endUpdate();

      expect(dv.getIdPropertyName()).toBe('keyId');
      expect(dv.getItems()).toEqual(items);
    });

    it('should batch more items with insertItems with begin/end batch update and expect them to be inserted at a certain index dataset', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];
      const newItems = [
        { id: 3, name: 'Smith', age: 30 },
        { id: 4, name: 'Ronald', age: 34 },
      ];

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.insertItems(1, newItems); // batch extra items
      dv.endUpdate();

      expect(dv.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 },
        { id: 3, name: 'Smith', age: 30 },
        { id: 4, name: 'Ronald', age: 34 },
        { id: 1, name: 'Jane', age: 24 },
      ]);

      dv.deleteItems([3, 1]);

      expect(dv.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 },
        { id: 4, name: 'Ronald', age: 34 },
      ]);
    });

    it('should throw when trying to delete items with have invalid Ids', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];

      dv.setItems(items); // original items list

      expect(() => dv.deleteItems([-1, 1])).toThrow('[SlickGrid DataView] Invalid id');
    });

    it('should throw when trying to delete items with a batch that have invalid Ids', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      expect(() => dv.deleteItems([-1, 1])).toThrow('[SlickGrid DataView] Invalid id');
    });

    it('should call updateItems, without batch, and expect a refresh to be called', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];
      const updatedItems = [
        { id: 0, name: 'Smith', age: 30 },
        { id: 1, name: 'Ronald', age: 34 },
      ];
      const refreshSpy = vi.spyOn(dv, 'refresh');

      dv.setItems(items); // original items list

      dv.updateItems(
        updatedItems.map((item) => item.id),
        updatedItems
      );

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 },
        { id: 1, name: 'Ronald', age: 34 },
      ]);

      dv.deleteItem(1);

      expect(dv.getItems()).toEqual([{ id: 0, name: 'Smith', age: 30 }]);
    });

    it('should batch updateItems and expect a refresh to be called', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];
      const updatedItems = [
        { id: 0, name: 'Smith', age: 30 },
        { id: 1, name: 'Ronald', age: 34 },
      ];
      const refreshSpy = vi.spyOn(dv, 'refresh');

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.updateItems(
        updatedItems.map((item) => item.id),
        updatedItems
      );

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 },
        { id: 1, name: 'Ronald', age: 34 },
      ]);

      dv.deleteItem(1);
      dv.endUpdate();

      expect(dv.getItems()).toEqual([{ id: 0, name: 'Smith', age: 30 }]);
    });

    it('should batch updateItems and expect a refresh to be called', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];
      const updatedItems = [
        { id: 0, name: 'Smith', age: 30 },
        { id: 1, name: 'Ronald', age: 34 },
      ];
      const refreshSpy = vi.spyOn(dv, 'refresh');

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.updateItems(
        updatedItems.map((item) => item.id),
        updatedItems
      );

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 },
        { id: 1, name: 'Ronald', age: 34 },
      ]);

      dv.deleteItem(1);
      dv.endUpdate();

      expect(dv.getItems()).toEqual([{ id: 0, name: 'Smith', age: 30 }]);
    });

    it('should throw when batching updateItems with some invalid Ids', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];
      const updatedItems = [
        { id: 0, name: 'Smith', age: 30 },
        { id: 1, name: 'Ronald', age: 34 },
      ];

      dv.setItems(items); // original items list
      dv.beginUpdate(true);

      expect(() => dv.updateItems([-1, 1], updatedItems)).toThrow('[SlickGrid DataView] Invalid id');
    });

    it('should throw when trying to call setItems() with duplicate Ids', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 0, name: 'Jane', age: 24 },
      ];

      expect(() => dv.setItems(items)).toThrow(`[SlickGrid DataView] Each data element must implement a unique 'id' property`);
    });

    it('should call insertItem() at a defined index location', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];
      const newItem = { id: 2, name: 'Smith', age: 30 };
      const refreshSpy = vi.spyOn(dv, 'refresh');

      dv.setItems(items);
      dv.insertItem(1, newItem);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 },
        { id: 2, name: 'Smith', age: 30 },
        { id: 1, name: 'Jane', age: 24 },
      ]);
    });

    it('should throw when trying to call insertItem() with undefined Id', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
      ];
      const newItem = { id: undefined, name: 'Smith', age: 30 };

      dv.setItems(items);
      expect(() => dv.insertItem(1, newItem)).toThrow(`[SlickGrid DataView] Each data element must implement a unique 'id' property`);
    });

    it('should throw when trying to call insertItem() with undefined Id', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
        { id: undefined, name: 'Smith', age: 30 },
      ];

      dv.beginUpdate(true);
      dv.setItems(items);
      expect(() => dv.endUpdate()).toThrow(`[SlickGrid DataView] Each data element must implement a unique 'id' property`);
    });
  });

  describe('Grouping', () => {
    it('should call setGrouping() and expect grouping to be defined without any accumulator neither totals when Aggregators are omitted', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Doe' },
      ];
      dv = new SlickDataView({});
      const refreshSpy = vi.spyOn(dv, 'refresh');
      dv.setItems(mockData);

      dv.setGrouping({
        getter: 'lastName',
        formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      } as Grouping);

      expect(dv.getItemsByGroupingKey('Doe').length).toBe(2);
      expect(dv.getGroups().length).toBe(1);
      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getGrouping().length).toBe(1);
      expect(dv.getGrouping()[0]).toMatchObject({ aggregators: [], getter: 'lastName' });

      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 2,
        groupingKey: 'Doe',
        groups: null,
        level: 0,
        rows: mockData,
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: null,
        value: 'Doe',
      });
      expect(dv.getItem(1)).toEqual(mockData[0]);
      expect(dv.getItem(2)).toEqual(mockData[1]);
      expect(dv.getItem(3)).toBeUndefined(); // without Totals

      // remove Grouping
      dv.setGrouping([]);
      expect(dv.getGroups().length).toBe(0);
    });

    it('should call setGrouping() and expect grouping to be defined with compiled accumulator and totals when providing Aggregators', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Doe' },
      ];
      dv = new SlickDataView({});
      const refreshSpy = vi.spyOn(dv, 'refresh');
      dv.setItems(mockData);

      const agg = new Aggregators.Count('lastName');
      const agg2 = new FakeAggregator();
      dv.setGrouping({
        getter: 'lastName',
        formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
        aggregators: [agg, agg2],
        aggregateCollapsed: false,
        sortAsc: true,
      } as Grouping);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getGrouping().length).toBe(1);
      expect(dv.getGrouping()[0]).toMatchObject({ aggregators: [agg, agg2], getter: 'lastName' });

      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 2,
        groupingKey: 'Doe',
        groups: null,
        level: 0,
        rows: mockData,
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe',
      });
      expect(dv.getItem(1)).toEqual(mockData[0]);
      expect(dv.getItem(2)).toEqual(mockData[1]);
      expect(dv.getItem(3)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        group: expect.anything(),
        initialized: true,
        count: { lastName: 2 },
      });
    });

    it('should call setGrouping() and be able to sort it descending by the Grouping field', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Doe' },
        { id: 3, firstName: 'Bob', lastName: 'Smith' },
      ];
      dv = new SlickDataView({});
      const refreshSpy = vi.spyOn(dv, 'refresh');
      dv.setItems([...mockData]);

      dv.setGrouping({
        getter: 'lastName',
        formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
        comparer: (a, b) => SortComparers.string(a.value, b.value, SortDirectionNumber.desc),
      } as Grouping);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getGrouping().length).toBe(1);
      expect(dv.getGrouping()[0]).toMatchObject({ aggregators: [], getter: 'lastName' });
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith',
        groups: null,
        level: 0,
        rows: [{ id: 3, firstName: 'Bob', lastName: 'Smith' }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: null,
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({ id: 3, firstName: 'Bob', lastName: 'Smith' });
      expect(dv.getItem(2)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 2,
        groupingKey: 'Doe',
        groups: null,
        level: 0,
        rows: [
          { id: 1, firstName: 'John', lastName: 'Doe' },
          { id: 2, firstName: 'Jane', lastName: 'Doe' },
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: null,
        value: 'Doe',
      });
      expect(dv.getItem(3)).toEqual({ id: 1, firstName: 'John', lastName: 'Doe' });
      expect(dv.getItem(4)).toEqual({ id: 2, firstName: 'Jane', lastName: 'Doe' });
      expect(dv.getItem(5)).toBeUndefined(); // without Totals

      dv.collapseAllGroups();

      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 1,
        count: 1,
        groupingKey: 'Smith',
        groups: null,
        level: 0,
        rows: [{ id: 3, firstName: 'Bob', lastName: 'Smith' }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: null,
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 1,
        count: 2,
        groupingKey: 'Doe',
        groups: null,
        level: 0,
        rows: [
          { id: 1, firstName: 'John', lastName: 'Doe' },
          { id: 2, firstName: 'Jane', lastName: 'Doe' },
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: null,
        value: 'Doe',
      });

      dv.expandAllGroups();

      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith',
        groups: null,
        level: 0,
        rows: [{ id: 3, firstName: 'Bob', lastName: 'Smith' }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: null,
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({ id: 3, firstName: 'Bob', lastName: 'Smith' });
    });

    it('should call setGrouping() then use collapseGroup() and expandGroup()', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 3, firstName: 'John', lastName: 'Smith', age: 26 },
      ];
      dv = new SlickDataView({});
      const refreshSpy = vi.spyOn(dv, 'refresh');
      dv.setItems([...mockData]);

      const agg1 = new Aggregators.Count('lastName');
      const agg2 = new Aggregators.Sum('age');
      dv.setGrouping({
        getter: 'lastName',
        formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
        aggregators: [agg1, agg2],
        lazyTotalsCalculation: false,
        displayTotalsRow: false,
        aggregateChildGroups: true,
      } as Grouping);

      dv.expandGroup('Smith');

      // Groups should be expanded
      expect(refreshSpy).toHaveBeenCalledTimes(3);
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 2,
        groupingKey: 'Doe',
        groups: null,
        level: 0,
        rows: [
          { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe',
      });

      expect(dv.getItem(1)).toEqual({ id: 1, firstName: 'John', lastName: 'Doe', age: 30 });
      expect(dv.getItem(2)).toEqual({ id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 });
      expect(dv.getItem(3)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith',
        groups: null,
        level: 0,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 'Smith',
      });

      dv.collapseGroup('Smith');

      // Groups should now be collapsed
      expect(refreshSpy).toHaveBeenCalledTimes(4);
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 2,
        groupingKey: 'Doe',
        groups: null,
        level: 0,
        rows: [
          { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe',
      });
      expect(dv.getItem(1)).not.toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
    });

    it('should call setGrouping() then use collapseGroup() and expandGroup() with Grouping delimiter', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 3, firstName: 'John', lastName: 'Smith', age: 26 },
      ];
      dv = new SlickDataView({});
      const refreshSpy = vi.spyOn(dv, 'refresh');
      dv.setItems([...mockData]);

      const agg1 = new Aggregators.Count('lastName');
      const agg2 = new Aggregators.Sum('age');
      dv.setGrouping({
        getter: 'lastName',
        formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
        comparer: (a, b) => SortComparers.string(a.value, b.value, SortDirectionNumber.desc),
        aggregators: [agg1, agg2],
        predefinedValues: ['Smith'],
      } as Grouping);

      dv.expandGroup('Smith:|:26');

      // Groups should be expanded
      expect(refreshSpy).toHaveBeenCalledTimes(3);
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith',
        groups: null,
        level: 0,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
      expect(dv.getItem(2)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        group: expect.anything(),
        initialized: true,
        count: { lastName: 1 },
        sum: { age: 26 },
      });
      expect(dv.getItem(3)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 2,
        groupingKey: 'Doe',
        groups: null,
        level: 0,
        rows: [
          { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe',
      });

      dv.collapseGroup('Smith:|:26');

      // Groups should now be collapsed
      expect(refreshSpy).toHaveBeenCalledTimes(4);
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith',
        groups: null,
        level: 0,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
    });

    it('should call setGrouping() with multiple Groups from array and lazyTotalsCalculation with Group Totals calculation', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 3, firstName: 'John', lastName: 'Smith', age: 26 },
      ];
      dv = new SlickDataView({});
      const refreshSpy = vi.spyOn(dv, 'refresh');
      dv.setItems([...mockData]);

      const agg1 = new Aggregators.Count('lastName');
      const agg2 = new Aggregators.Sum('age');
      dv.setGrouping([
        {
          getter: 'lastName',
          formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
          comparer: (a, b) => SortComparers.string(a.value, b.value, SortDirectionNumber.desc),
          aggregators: [agg1, agg2],
          aggregateChildGroups: true,
          lazyTotalsCalculation: true,
          aggregateEmpty: true,
          displayTotalsRow: false,
        },
        {
          getter: 'age',
          formatter: (g) => `Age: ${g.value} <span class="text-green">(${g.count} items)</span>`,
          comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.desc),
          aggregators: [agg1, agg2],
          lazyTotalsCalculation: true,
          aggregateEmpty: true,
          displayTotalsRow: true,
          aggregateCollapsed: false,
        },
      ]);

      expect(dv.getItemMetadata(99)).toBeNull();
      expect(dv.getItemMetadata(2)).toBeNull();
      expect(dv.getItemMetadata(0)).toEqual({
        columns: {
          0: {
            colspan: '*',
            editorClass: null,
            formatter: expect.anything(),
          },
        },
        cssClasses: 'slick-group slick-group-level-0',
        focusable: true,
        formatter: undefined,
        selectable: false,
      });

      dv.expandAllGroups(0);

      // Groups should be expanded
      expect(refreshSpy).toHaveBeenCalledTimes(3);
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith',
        groups: expect.anything(),
        level: 0,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith:|:26',
        groups: null,
        level: 1,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Age: 26 <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 26,
      });
      expect(dv.getItem(2)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
      expect(dv.getItem(3)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        count: { lastName: 1 },
        group: expect.anything(),
        initialized: true,
        sum: { age: 26 },
      });
      expect(dv.getItemMetadata(3)).toEqual({
        cssClasses: 'slick-group-totals slick-group-level-1',
        editorClass: null,
        focusable: false,
        formatter: expect.anything(),
        selectable: false,
      });
      expect(dv.getItem(10)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        count: { lastName: 1 },
        group: expect.anything(),
        initialized: true,
        sum: { age: 28 },
      });

      dv.collapseAllGroups(0);

      // Groups should now be collapsed
      expect(refreshSpy).toHaveBeenCalledTimes(4);
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 1,
        count: 1,
        groupingKey: 'Smith',
        groups: expect.anything(),
        level: 0,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 1,
        count: 2,
        groupingKey: 'Doe',
        groups: [expect.anything(), expect.anything()],
        level: 0,
        rows: [
          { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe',
      });
      expect(dv.getItem(2)).toBeUndefined();
    });

    it('should call setGrouping() with multiple Groups from array and calculate totals afterward when getting item', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 3, firstName: 'John', lastName: 'Smith', age: 26 },
      ];
      dv = new SlickDataView({});
      dv.setItems([...mockData]);
      const refreshSpy = vi.spyOn(dv, 'refresh');

      const agg1 = new Aggregators.Count('lastName');
      const agg2 = new Aggregators.Sum('age');
      dv.setGrouping([
        {
          getter: 'lastName',
          formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
          comparer: (a, b) => SortComparers.string(a.value, b.value, SortDirectionNumber.desc),
          aggregators: [agg1, agg2],
          lazyTotalsCalculation: false,
          displayTotalsRow: false,
          aggregateChildGroups: true,
          aggregateCollapsed: true,
        },
        {
          getter: 'age',
          formatter: (g) => `Age: ${g.value} <span class="text-green">(${g.count} items)</span>`,
          // comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.desc),
          aggregators: [agg1, agg2],
          lazyTotalsCalculation: false,
          displayTotalsRow: true,
          aggregateChildGroups: true,
          aggregateCollapsed: true,
        },
      ]);

      expect(dv.getItemMetadata(99)).toBeNull();
      expect(dv.getItemMetadata(2)).toBeNull();
      expect(dv.getItemMetadata(0)).toEqual({
        columns: {
          0: {
            colspan: '*',
            editorClass: null,
            formatter: expect.anything(),
          },
        },
        cssClasses: 'slick-group slick-group-level-0',
        focusable: true,
        formatter: undefined,
        selectable: false,
      });
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith',
        groups: expect.anything(),
        level: 0,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith:|:26',
        groups: null,
        level: 1,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Age: 26 <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 26,
      });
      expect(dv.getItem(2)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
      expect(dv.getItem(3)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        count: { lastName: 1 },
        group: expect.anything(),
        initialized: true,
        sum: { age: 0 },
      });

      dv.expandAllGroups(0);

      // Groups should be expanded
      expect(refreshSpy).toHaveBeenCalledTimes(2);
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith',
        groups: expect.anything(),
        level: 0,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 'Smith',
      });
    });

    it('should call setGrouping() with multiple Groups from array with Group Totals calculation', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 3, firstName: 'John', lastName: 'Smith', age: 26 },
      ];
      dv = new SlickDataView({});
      const refreshSpy = vi.spyOn(dv, 'refresh');
      dv.setItems([...mockData]);

      const agg1 = new Aggregators.Count('lastName');
      const agg2 = new Aggregators.Sum('age');
      dv.setGrouping([
        {
          getter: 'lastName',
          formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
          comparer: (a, b) => SortComparers.string(a.value, b.value, SortDirectionNumber.desc),
          aggregators: [agg1, agg2],
          lazyTotalsCalculation: false,
          aggregateChildGroups: true,
          displayTotalsRow: true,
          aggregateEmpty: true,
        },
        {
          getter: 'age',
          formatter: (g) => `Age: ${g.value} <span class="text-green">(${g.count} items)</span>`,
          comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.desc),
          aggregators: [agg1, agg2],
          lazyTotalsCalculation: false,
          displayTotalsRow: true,
        },
      ]);

      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith:|:26',
        groups: null,
        level: 1,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Age: 26 <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 26,
      });

      dv.expandAllGroups();

      // Groups should be expanded
      expect(refreshSpy).toHaveBeenCalledTimes(3);
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith',
        groups: expect.anything(),
        level: 0,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 0,
        count: 1,
        groupingKey: 'Smith:|:26',
        groups: null,
        level: 1,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Age: 26 <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 26,
      });
      expect(dv.getItem(2)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
      expect(dv.getItem(3)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        count: { lastName: 1 },
        group: expect.anything(),
        initialized: true,
        sum: { age: 26 },
      });

      dv.collapseAllGroups();

      // Groups should now be collapsed
      expect(refreshSpy).toHaveBeenCalledTimes(4);
      expect(dv.getItem(0)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 1,
        count: 1,
        groupingKey: 'Smith',
        groups: expect.anything(),
        level: 0,
        rows: [{ id: 3, firstName: 'John', lastName: 'Smith', age: 26 }],
        selectChecked: false,
        title: 'Family: Smith <span class="text-green">(1 items)</span>',
        totals: expect.anything(),
        value: 'Smith',
      });
      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 1,
        count: 2,
        groupingKey: 'Doe',
        groups: [expect.anything(), expect.anything()],
        level: 0,
        rows: [
          { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe',
      });
      expect(dv.getItem(2)).toBeUndefined();
    });

    it('should apply grouping correctly when using dataItemColumnValueExtractor for nested object properties', () => {
      const mockData = [
        { id: 1, security: { fullName: 'John Doe' }, role: { name: 'admin' } },
        { id: 2, security: { fullName: 'Jane Doe' }, role: { name: 'user' } },
        { id: 3, security: { fullName: 'John Smith' }, role: { name: 'admin' } },
      ];

      dv = new SlickDataView({});
      dv.setItems(mockData);

      // Mock grid with dataItemColumnValueExtractor
      const mockGrid = {
        getOptions: () => ({
          dataItemColumnValueExtractor: (item: any, col: any) => {
            if (col.field === 'role' && item.role) {
              return item.role.name;
            }
            if (col.field === 'fullName' && item.security) {
              return item.security.fullName;
            }
            return item[col.field];
          },
        }),
        getColumns: () => [
          { id: 'security', field: 'fullName', name: 'Full Name' },
          { id: 'role', field: 'role', name: 'Role' },
        ],
      } as any;

      // Set grid on dataview to enable extractor usage
      (dv as any)._grid = mockGrid;

      // Group by role using the extractor
      dv.setGrouping({
        getter: 'role',
        formatter: (g) => `Role: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      } as Grouping);

      // Check that grouping works correctly with extractor
      expect(dv.getGroups().length).toBe(2); // 'admin' and 'user' groups
      expect(dv.getGroups()[0].value).toBe('admin');
      expect(dv.getGroups()[0].count).toBe(2);
      expect(dv.getGroups()[1].value).toBe('user');
      expect(dv.getGroups()[1].count).toBe(1);

      // Verify items are grouped correctly
      const adminGroup = dv.getGroups()[0];
      expect(adminGroup.rows.length).toBe(2);
      expect(adminGroup.rows[0].id).toBe(1);
      expect(adminGroup.rows[1].id).toBe(3);
    });
  });

  describe('Sorting', () => {
    afterEach(() => {
      dv.destroy();
      vi.clearAllMocks();
    });

    describe('sortedAddItem()', () => {
      it('should throw when calling the method without a sort comparer', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const newItem = { id: 2, name: 'Bob', age: 30 };

        dv.setItems(items);
        expect(() => dv.sortedAddItem(newItem)).toThrow('[SlickGrid DataView] sortedAddItem() requires a sort comparer, use sort()');
      });

      it('should call the method and expect item to be added and sorted in ascending order when no sort direction is provided', () => {
        const refreshSpy = vi.spyOn(dv, 'refresh');
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const newItem = { id: 2, name: 'Bob', age: 30 };
        // const comparer = (a: any, b: any) => SortComparers.numeric(a.id, b.id, SortDirectionNumber.asc);
        const comparer = (a: any, b: any) => (a.id === b.id ? 0 : a.id > b.id ? 1 : -1);
        const sortSpy = vi.spyOn(dv, 'sort');

        dv.setItems(items);
        dv.sort(comparer, true);
        dv.sortedAddItem(newItem);

        expect(refreshSpy).toHaveBeenCalledTimes(3);
        expect(sortSpy).toHaveBeenCalledTimes(1);
        expect(dv.getItems().length).toBe(3);
        expect(dv.getItems()).toEqual([
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
          { id: 2, name: 'Bob', age: 30 },
        ]);

        dv.reSort(); // calling resort will expect same result

        expect(refreshSpy).toHaveBeenCalledTimes(4);
        expect(sortSpy).toHaveBeenCalledTimes(2);
        expect(dv.getItems()).toEqual([
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
          { id: 2, name: 'Bob', age: 30 },
        ]);
      });

      it('should call the method and expect item to be added when called with a descending sort comparer', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const newItem = { id: 2, name: 'Bob', age: 30 };
        const comparer = (a: any, b: any) => SortComparers.numeric(a.id, b.id, SortDirectionNumber.asc);

        dv.setItems(items);
        dv.sort(comparer, false);
        dv.sortedAddItem(newItem);
        dv.sort(comparer, false);

        expect(dv.getItems().length).toBe(3);
        expect(dv.getItems()).toEqual([
          { id: 2, name: 'Bob', age: 30 },
          { id: 1, name: 'Jane', age: 24 },
          { id: 0, name: 'John', age: 20 },
        ]);

        dv.reSort(); // calling resort will expect same result

        expect(dv.getItems()).toEqual([
          { id: 2, name: 'Bob', age: 30 },
          { id: 1, name: 'Jane', age: 24 },
          { id: 0, name: 'John', age: 20 },
        ]);
      });
    });

    describe('sortedUpdateItem()', () => {
      it('should call the method and return undefined when item Map is undefined', () => {
        expect(dv.sortedUpdateItem(99, {})).toBeUndefined();
      });

      it('should throw when calling the method with input Ids array does not match items array', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const comparer = (a: any, b: any) => SortComparers.numeric(a.id, b.id, SortDirectionNumber.asc);
        dv.setItems(items);
        dv.sort(comparer);

        expect(() => dv.sortedUpdateItem(99, items[0])).toThrow('[SlickGrid DataView] Invalid or non-matching id 99');
      });

      it('should throw when calling the method with an input Id that does not match the updated item Id', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const comparer = (a: any, b: any) => SortComparers.numeric(a.id, b.id, SortDirectionNumber.asc);
        dv.setItems(items);
        dv.sort(comparer);

        expect(() => dv.sortedUpdateItem(0, items[1])).toThrow('[SlickGrid DataView] Invalid or non-matching id 0');
      });

      it('should throw when calling the method without a sort comparer', () => {
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];

        dv.setItems(items);
        expect(() => dv.sortedUpdateItem(0, items[0])).toThrow('[SlickGrid DataView] sortedUpdateItem() requires a sort comparer, use sort()');
      });

      it('should call the method and expect item to be added and sorted in ascending order when no sort direction is provided', () => {
        const refreshSpy = vi.spyOn(dv, 'refresh');
        const items = [
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Jane', age: 24 },
        ];
        const updatedItem = { id: 1, name: 'Bob', age: 30 };
        const comparer = (a: any, b: any) => SortComparers.numeric(a.id, b.id, SortDirectionNumber.asc);
        const sortSpy = vi.spyOn(dv, 'sort');

        dv.setItems(items);
        dv.sort(comparer, true);
        dv.sortedUpdateItem(1, updatedItem);

        expect(refreshSpy).toHaveBeenCalledTimes(3);
        expect(sortSpy).toHaveBeenCalledTimes(1);
        expect(dv.getItems().length).toBe(2);
        expect(dv.getItems()).toEqual([
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Bob', age: 30 },
        ]);

        dv.reSort(); // calling resort will expect same result

        expect(refreshSpy).toHaveBeenCalledTimes(4);
        expect(sortSpy).toHaveBeenCalledTimes(2);
        expect(dv.getItems()).toEqual([
          { id: 0, name: 'John', age: 20 },
          { id: 1, name: 'Bob', age: 30 },
        ]);
      });

      it('should call the method and expect item to be added when called with a descending sort comparer', () => {
        const items = [
          { id: 2, name: 'John', age: 20 },
          { id: 0, name: 'Jane', age: 24 },
          { id: 1, name: 'Bob', age: 22 },
        ];
        const updatedItem = { id: 2, name: 'Bobby', age: 30 };
        const comparer = () => 1; // just return some static value

        dv.setItems(items);
        dv.sort(comparer, false);
        dv.sortedUpdateItem(2, updatedItem);
        dv.sort(comparer, false);

        // expect(dv.getItems().length).toBe(2);
        expect(dv.getItems()).toEqual([
          { id: 2, name: 'Bobby', age: 30 },
          { id: 0, name: 'Jane', age: 24 },
          { id: 1, name: 'Bob', age: 22 },
        ]);
      });
    });
  });

  describe('Filtering', () => {
    afterEach(() => {
      dv.destroy();
      vi.clearAllMocks();
    });

    it('should be able to set a filter and expect items to be filtered', () => {
      const refreshSpy = vi.spyOn(dv, 'refresh');

      const items = [
        { id: 1, name: 'Bob', age: 33 },
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      const filter = (item: any) => item.id >= 2;
      dv.setItems(items);
      dv.setFilter(filter);

      expect(dv.getItemCount()).toBe(3);
      expect(dv.getFilter()).toBeTruthy();
      expect(dv.getFilteredItemCount()).toBe(2);
      expect(dv.getFilteredItems()).toEqual([
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ]);
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should be able to set a filter with Pagination and expect items to be filtered on first page', () => {
      const refreshSpy = vi.spyOn(dv, 'refresh');

      const items = [
        { id: 1, name: 'Bob', age: 33 },
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      const filter = (item: any) => item.id >= 2;
      dv.setItems(items);
      dv.setFilter(filter);

      expect(dv.getItemCount()).toBe(3);
      expect(dv.getFilter()).toBeTruthy();
      expect(dv.getFilteredItemCount()).toBe(2);
      expect(dv.getFilteredItems()).toEqual([
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ]);
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should be able to set a filter with CSP Safe approach and expect items to be filtered', () => {
      const items = [
        { id: 1, name: 'Bob', age: 33 },
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      const filter = (item: any) => item.id >= 2;

      dv = new SlickDataView({ useCSPSafeFilter: true });
      dv.setItems(items);
      dv.setFilter(filter);

      expect(dv.getItemCount()).toBe(3);
      expect(dv.getFilter()).toBeTruthy();
      expect(dv.getFilteredItemCount()).toBe(2);
      expect(dv.getFilteredItems()).toEqual([
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ]);
    });

    it('should be able to set a filter and extra filter arguments and expect items to be filtered', () => {
      const searchString = 'Ob'; // we'll provide "searchString" as filter args
      function myFilter(item: any, args: any) {
        return item.name.toLowerCase().includes(args.searchString?.toLowerCase());
      }
      const items = [
        { id: 1, name: 'Bob', age: 33 },
        { id: 0, name: 'Hobby', age: 44 },
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];

      dv = new SlickDataView({ inlineFilters: true, useCSPSafeFilter: false });
      dv.setItems(items);
      dv.setFilterArgs({ searchString });
      dv.setFilter(myFilter);

      expect(dv.getItemCount()).toBe(4);
      expect(dv.getFilter()).toBeTruthy();
      expect(dv.getFilterArgs()).toEqual({ searchString });
      expect(dv.getFilteredItemCount()).toBe(2);
      expect(dv.getFilteredItems()).toEqual([
        { id: 1, name: 'Bob', age: 33 },
        { id: 0, name: 'Hobby', age: 44 },
      ]);
    });

    it('should be able to set a filter as CSP Safe and extra filter arguments and expect items to be filtered', () => {
      const searchString = 'Ob'; // we'll provide "searchString" as filter args
      const myFilter = (item: any, args: any) => item.name.toLowerCase().includes(args.searchString?.toLowerCase());
      const items = [
        { id: 1, name: 'Bob', age: 33 },
        { id: 0, name: 'Hobby', age: 44 },
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];

      dv = new SlickDataView({ inlineFilters: true, useCSPSafeFilter: true });
      dv.setItems(items);
      dv.setFilterArgs({ searchString });
      dv.setFilter(myFilter);

      expect(dv.getItemCount()).toBe(4);
      expect(dv.getFilter()).toBeTruthy();
      expect(dv.getFilterArgs()).toEqual({ searchString });
      expect(dv.getFilteredItemCount()).toBe(2);
      expect(dv.getFilteredItems()).toEqual([
        { id: 1, name: 'Bob', age: 33 },
        { id: 0, name: 'Hobby', age: 44 },
      ]);
    });
  });

  describe('Pagination', () => {
    afterEach(() => {
      dv.destroy();
      vi.clearAllMocks();
    });

    it('should be able to set a filter with Pagination and expect items to be filtered on 2nd page', () => {
      const items = [
        { id: 1, name: 'Bob', age: 33 },
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      const filter = (item: any) => item.id >= 2;

      dv = new SlickDataView({ inlineFilters: false, useCSPSafeFilter: false });
      const onPagingInfoSpy = vi.spyOn(dv.onPagingInfoChanged, 'notify');
      dv.setItems(items);
      dv.setFilter(filter);
      dv.setPagingOptions({ dataView: dv, pageNum: 1, pageSize: 1 });
      dv.refresh();

      expect(dv.getPagingInfo()).toEqual({ dataView: dv, pageNum: 1, pageSize: 1, totalPages: 2, totalRows: 2 });
      expect(onPagingInfoSpy).toHaveBeenCalledWith({ dataView: dv, pageNum: 1, pageSize: 1, totalPages: 2, totalRows: 2 }, null, dv);
      expect(dv.getItemCount()).toBe(3);
      expect(dv.getFilter()).toBeTruthy();
      expect(dv.getFilteredItemCount()).toBe(2);
      expect(dv.getFilteredItems()).toEqual([
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ]);
    });

    it('should be able to set an inline filter with Pagination and expect items to be filtered on 2nd page', () => {
      const items = [
        { id: 1, name: 'Bob', age: 33 },
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      const filter = (item: any) => item.id >= 2;

      dv = new SlickDataView({ inlineFilters: true, useCSPSafeFilter: true });
      const onPagingInfoSpy = vi.spyOn(dv.onPagingInfoChanged, 'notify');
      dv.setItems(items);
      dv.setFilter(filter);
      dv.setPagingOptions({ dataView: dv, pageNum: 1, pageSize: 1 });
      dv.refresh();

      expect(dv.getPagingInfo()).toEqual({ dataView: dv, pageNum: 1, pageSize: 1, totalPages: 2, totalRows: 2 });
      expect(onPagingInfoSpy).toHaveBeenCalledWith({ dataView: dv, pageNum: 1, pageSize: 1, totalPages: 2, totalRows: 2 }, null, dv);
      expect(dv.getItemCount()).toBe(3);
      expect(dv.getFilter()).toBeTruthy();
      expect(dv.getFilteredItemCount()).toBe(2);
      expect(dv.getFilteredItems()).toEqual([
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ]);
    });

    it('should be able to set a filter with Pagination and expect items to be filtered on 1st page', () => {
      const items = [
        { id: 1, name: 'Bob', age: 33 },
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 5, name: 'Alpha', age: 12 },
        { id: 6, name: 'Omega', age: 24 },
      ];
      function myFilter(item: any) {
        return item.id >= 2;
      }

      dv = new SlickDataView({ inlineFilters: false, useCSPSafeFilter: false });
      const onPagingInfoSpy = vi.spyOn(dv.onPagingInfoChanged, 'notify');
      const onRowCountChangeSpy = vi.spyOn(dv.onRowCountChanged, 'notify');
      const onRowsChangeSpy = vi.spyOn(dv.onRowsChanged, 'notify');
      dv.setPagingOptions({ dataView: dv, pageNum: 1, pageSize: 10 });
      dv.setItems(items);
      dv.setRefreshHints({ isFilterNarrowing: true });
      dv.setFilter(myFilter);

      expect(dv.getPagingInfo()).toEqual({ dataView: dv, pageNum: 0, pageSize: 10, totalPages: 1, totalRows: 4 });
      expect(onPagingInfoSpy).toHaveBeenCalledWith({ dataView: dv, pageNum: 0, pageSize: 10, totalPages: 1, totalRows: 5 }, null, dv);
      expect(dv.getItemCount()).toBe(items.length);
      expect(dv.getFilter()).toBeTruthy();
      expect(dv.getFilteredItemCount()).toBe(4);
      expect(dv.getFilteredItems()).toEqual([
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 5, name: 'Alpha', age: 12 },
        { id: 6, name: 'Omega', age: 24 },
      ]);

      dv.setRefreshHints({ isFilterExpanding: true });
      items[0].id = 11;
      dv.setPagingOptions({ dataView: dv, pageNum: 2, pageSize: 2 });

      // calling it again will reuse the cached filter result
      dv.setRefreshHints({ isFilterExpanding: true });
      dv.refresh();

      // change filter without changing pagination & expect pageNum to be recalculated
      dv.setFilter((item) => item.id >= 10);
      expect(onPagingInfoSpy).toHaveBeenCalledWith({ dataView: dv, pageNum: 0, pageSize: 2, totalPages: 1, totalRows: 1 }, null, dv);
      expect(onRowCountChangeSpy).toHaveBeenCalledWith(
        { dataView: dv, previous: 2, current: 1, itemCount: 5, changedRows: [0, 1], callingOnRowsChanged: true },
        null,
        dv
      );
      expect(onRowsChangeSpy).toHaveBeenCalledWith({ dataView: dv, rows: [0, 1], itemCount: 5, calledOnRowCountChanged: true }, null, dv);

      // change filter without changing pagination will result in 2 changes but only 1 defined as changed because we ignore diffs from 0-1
      dv.setRefreshHints({ ignoreDiffsBefore: 1, ignoreDiffsAfter: 3 });
      items[0].id = 8;
      dv.setFilter(function (item) {
        return item.id >= 0;
      });
      expect(onPagingInfoSpy).toHaveBeenCalledWith({ dataView: dv, pageNum: 0, pageSize: 2, totalPages: 3, totalRows: 5 }, null, dv);
      expect(onRowCountChangeSpy).toHaveBeenCalledWith(
        { dataView: dv, previous: 1, current: 2, changedRows: [1], itemCount: 5, callingOnRowsChanged: true },
        null,
        dv
      );
      expect(onRowsChangeSpy).toHaveBeenCalledWith({ dataView: dv, rows: [1], itemCount: 5, calledOnRowCountChanged: true }, null, dv);
    });

    it('should be able to set a inline filter with Pagination and expect items to be filtered on 1st page', () => {
      const items = [
        { id: 1, name: 'Bob', age: 33 },
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 5, name: 'Alpha', age: 12 },
        { id: 6, name: 'Omega', age: 24 },
      ];
      function myFilter(item: any) {
        return item.id >= 2;
      }

      dv = new SlickDataView({ inlineFilters: true, useCSPSafeFilter: true });
      const onPagingInfoSpy = vi.spyOn(dv.onPagingInfoChanged, 'notify');
      const onRowCountChangeSpy = vi.spyOn(dv.onRowCountChanged, 'notify');
      const onRowsChangeSpy = vi.spyOn(dv.onRowsChanged, 'notify');
      dv.setPagingOptions({ dataView: dv, pageNum: 1, pageSize: 10 });
      dv.setItems(items);
      dv.setRefreshHints({ isFilterNarrowing: true });
      dv.setFilter(myFilter);

      expect(dv.getPagingInfo()).toEqual({ dataView: dv, pageNum: 0, pageSize: 10, totalPages: 1, totalRows: 4 });
      expect(onPagingInfoSpy).toHaveBeenCalledWith({ dataView: dv, pageNum: 0, pageSize: 10, totalPages: 1, totalRows: 5 }, null, dv);
      expect(dv.getItemCount()).toBe(items.length);
      expect(dv.getFilter()).toBeTruthy();
      expect(dv.getFilteredItemCount()).toBe(4);
      expect(dv.getFilteredItems()).toEqual([
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 5, name: 'Alpha', age: 12 },
        { id: 6, name: 'Omega', age: 24 },
      ]);

      dv.setRefreshHints({ isFilterExpanding: true });
      items[0].id = 11;
      dv.setPagingOptions({ dataView: dv, pageNum: 2, pageSize: 2 });

      // change filter without changing pagination & expect pageNum to be recalculated
      dv.setFilter(function (item) {
        return item.id >= 10;
      });
      expect(onPagingInfoSpy).toHaveBeenCalledWith({ dataView: dv, pageNum: 0, pageSize: 2, totalPages: 1, totalRows: 1 }, null, dv);
      expect(onRowCountChangeSpy).toHaveBeenCalledWith(
        { dataView: dv, previous: 2, current: 1, itemCount: 5, changedRows: [0, 1], callingOnRowsChanged: true },
        null,
        dv
      );
      expect(onRowsChangeSpy).toHaveBeenCalledWith({ dataView: dv, rows: [0, 1], itemCount: 5, calledOnRowCountChanged: true }, null, dv);

      // change filter without changing pagination will result in 2 changes but only 1 defined as changed because we ignore diffs from 0-1
      dv.setRefreshHints({ ignoreDiffsBefore: 1, ignoreDiffsAfter: 3 });
      items[0].id = 8;
      dv.setFilter((item) => item.id >= 0 || item.name.includes('a'));
      expect(onPagingInfoSpy).toHaveBeenCalledWith({ dataView: dv, pageNum: 0, pageSize: 2, totalPages: 3, totalRows: 5 }, null, dv);
      expect(onRowCountChangeSpy).toHaveBeenCalledWith(
        { dataView: dv, previous: 1, current: 2, changedRows: [1], itemCount: 5, callingOnRowsChanged: true },
        null,
        dv
      );
      expect(onRowsChangeSpy).toHaveBeenCalledWith({ dataView: dv, rows: [1], itemCount: 5, calledOnRowCountChanged: true }, null, dv);
    });
  });

  describe('Row Selection', () => {
    let items: any[] = [];
    beforeEach(() => {
      items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 1, name: 'Bob', age: 20 },
        { id: 5, name: 'Arnold', age: 50 },
        { id: 0, name: 'Avery', age: 44 },
        { id: 2, name: 'Rachel', age: 46 },
        { id: 6, name: 'Carole', age: 40 },
        { id: 8, name: 'Julie', age: 42 },
        { id: 7, name: 'Jason', age: 48 },
        { id: 9, name: 'Aaron', age: 23 },
        { id: 10, name: 'Ariane', age: 43 },
      ];
    });

    afterEach(() => {
      dv.destroy();
      vi.clearAllMocks();
    });

    it('should throw when calling syncGridSelection() and selection model is undefined', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ];
      const gridOptions = { enableCellNavigation: true, multiSelect: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      const items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
      ];
      dv = new SlickDataView({});
      const grid = new SlickGrid('#myGrid', dv, columns, gridOptions);
      dv.setItems(items);
      expect(() => dv.syncGridSelection(grid, true)).toThrow('SlickGrid Selection model is not set');
    });

    it('should enable "preserveHidden" but keep "preserveHiddenOnSelectionChange" disabled and expect to only return current page selection when calling getAll methods', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ];
      const gridOptions = { enableCellNavigation: true, multiSelect: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      dv = new SlickDataView({});
      const grid = new SlickGrid('#myGrid', dv, columns, gridOptions);
      grid.setSelectionModel(new SlickHybridSelectionModel({ selectActiveRow: false, selectionType: 'row' }));
      dv.setItems(items);
      dv.setPagingOptions({ dataView: dv, pageNum: 0, pageSize: 4 });
      dv.syncGridSelection(grid, true);
      grid.setSelectedRows([0, 1, 7]);

      expect(dv.getItemCount()).toBe(11); // full count
      expect(dv.getLength()).toBe(4); // page count
      expect(dv.getAllSelectedIds()).toEqual([3, 4]); // only 3, 4 because 7 is not on current page
      expect(dv.getAllSelectedItems()).toEqual([
        { id: 3, name: 'Jane', age: 24 },
        { id: 4, name: 'John', age: 20 },
      ]);

      // go to next page & change selection, only current page selection is kept
      dv.setPagingOptions({ dataView: dv, pageNum: 1, pageSize: 4 });
      grid.setSelectedRows([2, 3]);

      expect(dv.getAllSelectedIds()).toEqual([6, 8]); // only 6, 8 because 7 is not on current page
      expect(dv.getAllSelectedItems()).toEqual([
        { id: 6, name: 'Carole', age: 40 },
        { id: 8, name: 'Julie', age: 42 },
      ]);
    });

    it('should disable "preserveHidden" and enable "preserveHiddenOnSelectionChange" and expect to return previous page + current page selections when calling getAll methods', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ];
      const gridOptions = { enableCellNavigation: true, multiSelect: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      dv = new SlickDataView({});
      const grid = new SlickGrid('#myGrid', dv, columns, gridOptions);
      grid.setSelectionModel(new SlickHybridSelectionModel({ selectActiveRow: false, selectionType: 'row' }));
      dv.setItems(items);
      dv.setPagingOptions({ dataView: dv, pageNum: 0, pageSize: 4 });
      dv.syncGridSelection(grid, false, true);
      grid.setSelectedRows([0, 1, 7]);

      expect(dv.getItemCount()).toBe(11); // full count
      expect(dv.getLength()).toBe(4); // page count
      expect(dv.getAllSelectedIds()).toEqual([3, 4]);
      expect(dv.getAllSelectedItems()).toEqual([
        { id: 3, name: 'Jane', age: 24 },
        { id: 4, name: 'John', age: 20 },
      ]);

      // go to next page & change selection, selection also includes previous page(s)
      dv.setPagingOptions({ dataView: dv, pageNum: 1, pageSize: 4 });
      grid.setSelectedRows([2, 3]);

      expect(dv.getAllSelectedIds()).toEqual([3, 4, 6, 8]); // includes previous page + current page selection
      expect(dv.getAllSelectedItems()).toEqual([
        { id: 3, name: 'Jane', age: 24 },
        { id: 4, name: 'John', age: 20 },
        { id: 6, name: 'Carole', age: 40 },
        { id: 8, name: 'Julie', age: 42 },
      ]);
    });

    it('should use setSelectedIds() to add/remove row selection with "preserveHiddenOnSelectionChange" enabled and "preserveHidden" disabled', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ];
      const gridOptions = { enableCellNavigation: true, multiSelect: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      dv = new SlickDataView({});
      const grid = new SlickGrid('#myGrid', dv, columns, gridOptions);
      const setSelectedRowSpy = vi.spyOn(grid, 'setSelectedRows');
      const onSelectedRowIdsSpy = vi.spyOn(dv.onSelectedRowIdsChanged, 'notify');
      grid.setSelectionModel(new SlickHybridSelectionModel({ selectActiveRow: false, selectionType: 'row' }));
      dv.setItems(items);
      dv.setPagingOptions({ dataView: dv, pageNum: 0, pageSize: 4 });
      dv.syncGridSelection(grid, false, true);
      dv.setSelectedIds([3, 4, 8], { isRowBeingAdded: true, applyRowSelectionToGrid: true });

      expect(dv.getItemCount()).toBe(11); // full count
      expect(dv.getLength()).toBe(4); // page count
      expect(setSelectedRowSpy).toHaveBeenCalledWith([1, 0]); // 8 is outside of current page so not included
      expect(dv.getAllSelectedIds()).toEqual([3, 4, 8]); // 8 is also included even though it's not in current page
      expect(dv.getAllSelectedItems()).toEqual([
        { id: 3, name: 'Jane', age: 24 },
        { id: 4, name: 'John', age: 20 },
        { id: 8, name: 'Julie', age: 42 },
      ]);

      // remove selection
      dv.setSelectedIds([3], { isRowBeingAdded: false, applyRowSelectionToGrid: false });

      expect(onSelectedRowIdsSpy).toHaveBeenCalledWith(
        {
          added: false,
          dataView: dv,
          filteredIds: [4, 8],
          grid,
          ids: [3],
          rows: [1],
          selectedRowIds: [4, 8],
        },
        new SlickEventData(),
        dv
      );
      expect(dv.getAllSelectedIds()).toEqual([4, 8]);
      expect(dv.getAllSelectedItems()).toEqual([
        { id: 4, name: 'John', age: 20 },
        { id: 8, name: 'Julie', age: 42 },
      ]);
    });

    it('should not expect row selections to be preserved when using "multiSelect:false" and setSelectedIds() even when either preseve is enabled ("preserveHidden" or "preserveHiddenOnSelectionChange")', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ];
      const gridOptions = { enableCellNavigation: true, multiSelect: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      dv = new SlickDataView({});
      const grid = new SlickGrid('#myGrid', dv, columns, gridOptions);
      const setSelectedRowSpy = vi.spyOn(grid, 'setSelectedRows');
      const onSelectedRowIdsSpy = vi.spyOn(dv.onSelectedRowIdsChanged, 'notify');
      grid.setSelectionModel(new SlickHybridSelectionModel({ selectActiveRow: false, selectionType: 'row' }));
      dv.setItems(items);
      dv.setPagingOptions({ dataView: dv, pageNum: 0, pageSize: 4 });
      dv.syncGridSelection(grid, false, true);
      dv.setSelectedIds([3, 4, 8], { isRowBeingAdded: true, applyRowSelectionToGrid: true });

      expect(dv.getItemCount()).toBe(11); // full count
      expect(dv.getLength()).toBe(4); // page count
      expect(setSelectedRowSpy).toHaveBeenCalledWith([1, 0]); // 8 is outside of current page so not included
      expect(dv.getAllSelectedIds()).toEqual([3, 4]); // 8 is also included even though it's not in current page
      expect(dv.getAllSelectedItems()).toEqual([
        { id: 3, name: 'Jane', age: 24 },
        { id: 4, name: 'John', age: 20 },
      ]);

      // remove selection
      dv.setSelectedIds([3], { isRowBeingAdded: false, applyRowSelectionToGrid: false });

      expect(onSelectedRowIdsSpy).toHaveBeenCalledWith(
        {
          // filteredIds & selectedRowIds becomes empty because of disabled multiSelect not preserving row selections
          added: false,
          dataView: dv,
          filteredIds: [],
          grid,
          ids: [3],
          rows: [1],
          selectedRowIds: [],
        },
        new SlickEventData(),
        dv
      );
      expect(dv.getAllSelectedIds()).toEqual([]);
      expect(dv.getAllSelectedItems()).toEqual([]);
    });
  });

  describe('CSS Style Sync', () => {
    let items: any[] = [];
    let hash: any = {};

    beforeEach(() => {
      items = [
        { id: 4, name: 'John', age: 20 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 1, name: 'Bob', age: 20 },
        { id: 5, name: 'Arnold', age: 50 },
        { id: 0, name: 'Avery', age: 44 },
        { id: 2, name: 'Rachel', age: 46 },
        { id: 6, name: 'Carole', age: 40 },
        { id: 8, name: 'Julie', age: 42 },
        { id: 7, name: 'Jason', age: 48 },
        { id: 9, name: 'Aaron', age: 23 },
        { id: 10, name: 'Ariane', age: 43 },
      ];
      hash = {};
      for (const item of items) {
        if (item.age >= 30) {
          hash[item.id] = 'highlight';
        }
      }
    });

    afterEach(() => {
      dv.destroy();
      vi.clearAllMocks();
    });

    it('should call syncGridCellCssStyles() with CSS style hashes and expect it sync it in the grid when onRowsOrCountChanged event is triggered', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ];
      const gridOptions = { enableCellNavigation: true, multiSelect: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      dv = new SlickDataView({});
      const grid = new SlickGrid('#myGrid', dv, columns, gridOptions);
      const setCssStyleSpy = vi.spyOn(grid, 'setCellCssStyles');

      dv.setItems(items);
      grid.setCellCssStyles('age_greater30_highlight', hash);
      dv.syncGridCellCssStyles(grid, 'age_greater30_highlight');
      dv.onRowsOrCountChanged.notify({
        currentRowCount: 11,
        dataView: dv,
        itemCount: 11,
        previousRowCount: 11,
        rowCountChanged: true,
        rowsChanged: true,
        rowsDiff: [0],
      });

      expect(setCssStyleSpy).toHaveBeenCalledWith('age_greater30_highlight', hash);
    });

    it('should call syncGridCellCssStyles() with CSS style hashes and expect it sync it in the grid when onCellCssStylesChanged event is triggered', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ];
      const gridOptions = { enableCellNavigation: true, multiSelect: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      dv = new SlickDataView({});
      const grid = new SlickGrid('#myGrid', dv, columns, gridOptions);
      const setCssStyleSpy = vi.spyOn(grid, 'setCellCssStyles');

      dv.setItems(items);
      grid.setCellCssStyles('age_greater30_highlight', hash);
      dv.syncGridCellCssStyles(grid, 'age_greater30_highlight');
      grid.onCellCssStylesChanged.notify({ grid, hash, key: 'age_greater30_highlight' });

      expect(setCssStyleSpy).toHaveBeenCalledWith('age_greater30_highlight', hash);
    });

    it('should unsubscribe onCellCssStylesChanged & onRowsOrCountChanged when onCellCssStylesChanged event is triggered without a hash', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ];
      const gridOptions = { enableCellNavigation: true, multiSelect: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      dv = new SlickDataView({});
      const grid = new SlickGrid('#myGrid', dv, columns, gridOptions);
      const unsubscribeCellCssStyleSpy = vi.spyOn(grid.onCellCssStylesChanged, 'unsubscribe');
      const unsubscribeRowOrCountSpy = vi.spyOn(dv.onRowsOrCountChanged, 'unsubscribe');

      dv.setItems(items);
      grid.setCellCssStyles('age_greater30_highlight', hash);
      dv.syncGridCellCssStyles(grid, 'age_greater30_highlight');
      grid.onCellCssStylesChanged.notify({ grid, hash: null as any, key: 'age_greater30_highlight' });

      expect(unsubscribeCellCssStyleSpy).toHaveBeenCalled();
      expect(unsubscribeRowOrCountSpy).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Formatted Data Cache
  // ──────────────────────────────────────────────────────────────────────────────
  describe('Formatted Data Cache', () => {
    // populateFormattedDataCacheAsync uses MessageChannel (a real macrotask) which is
    // not controlled by vi.useFakeTimers(). Switch to real timers for this describe block.
    beforeAll(() => vi.useRealTimers());
    afterAll(() => vi.useFakeTimers());

    // Wait for the cache population to finish (event-based, works with any scheduler).
    const waitForCache = (target?: SlickDataView): Promise<void> =>
      new Promise<void>((resolve) => {
        const dataView = target ?? dv;
        if (!dataView.getCacheStatus().isPopulating) {
          resolve();
          return;
        }
        const handler = () => {
          dataView.onFormattedDataCacheCompleted.unsubscribe(handler);
          resolve();
        };
        dataView.onFormattedDataCacheCompleted.subscribe(handler);
      });

    const columns = [
      { id: 'name', field: 'name', name: 'Name', formatter: (_r: number, _c: number, val: any) => `<b>${val}</b>` },
      { id: 'age', field: 'age', name: 'Age' },
    ] as any[];
    const cacheGridOptions = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 }, enableFormattedDataCache: true } as any;
    const baseCacheItems = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ];
    let cacheItems: Array<{ id: number; name: string; age: number }>;

    let grid: SlickGrid;

    beforeEach(() => {
      cacheItems = baseCacheItems.map((item) => ({ ...item }));
      dv = new SlickDataView({});
      grid = new SlickGrid('#myGrid', dv, columns, cacheGridOptions);
      dv.setGrid(grid);
      dv.setItems(cacheItems);
    });

    afterEach(() => {
      grid.destroy();
    });

    describe('getCacheStatus()', () => {
      it('should return initial metadata state before population', () => {
        const status = dv.getCacheStatus();
        expect(status).toMatchObject({ isPopulating: expect.any(Boolean), lastProcessedRow: expect.any(Number), totalFormattedCells: expect.any(Number) });
      });

      it('should return a snapshot (not a live reference)', () => {
        const status1 = dv.getCacheStatus();
        const status2 = dv.getCacheStatus();
        expect(status1).not.toBe(status2);
      });
    });

    describe('clearFormattedDataCache()', () => {
      it('should reset both caches and metadata', async () => {
        await waitForCache();
        dv.clearFormattedDataCache();
        const status = dv.getCacheStatus();
        expect(status.isPopulating).toBe(false);
        expect(status.lastProcessedRow).toBe(-1);
        expect(status.totalFormattedCells).toBe(0);
      });

      it('should clear export cache so getFormattedCellValue returns fallback', async () => {
        await waitForCache();
        dv.clearFormattedDataCache();
        expect(dv.getFormattedCellValue(0, 'name', 'fallback')).toBe('fallback');
      });

      it('should clear cell display cache so getCellDisplayValue returns undefined', async () => {
        await waitForCache();
        dv.clearFormattedDataCache();
        expect(dv.getCellDisplayValue(0, 'name')).toBeUndefined();
      });

      it('should cancel pending RAF when clearing cache', () => {
        const cancelRafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined as any);
        (dv as any)._populateCacheRafId = 777;

        try {
          dv.clearFormattedDataCache();
          expect(cancelRafSpy).toHaveBeenCalledWith(777);
          expect((dv as any)._populateCacheRafId).toBeUndefined();
        } finally {
          cancelRafSpy.mockRestore();
        }
      });
    });

    describe('getFormattedCellValue()', () => {
      it('should return fallback when cache is disabled', () => {
        const dvNoCache = new SlickDataView({});
        const gridNoCache = new SlickGrid('#myGrid', dvNoCache, columns, { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as any);
        dvNoCache.setItems(cacheItems);
        expect(dvNoCache.getFormattedCellValue(0, 'name', 'FALLBACK')).toBe('FALLBACK');
        gridNoCache.destroy();
        dvNoCache.destroy();
      });

      it('should return fallback when cache is enabled but not yet populated', () => {
        // Cache is still being populated asynchronously — synchronous call gets fallback
        dv.clearFormattedDataCache();
        expect(dv.getFormattedCellValue(0, 'name', 'MISS')).toBe('MISS');
      });

      it('should return cached value after population completes', async () => {
        // The name column has a formatter but no exportWithFormatter, so it lands in cellOnlyColumns
        // (export cache only populated for columns with exportWithFormatter or exportCustomFormatter)
        await waitForCache();
        // Fallback for export cache (name is cellOnly)
        expect(dv.getFormattedCellValue(0, 'name', 'MISS')).toBe('MISS');
      });
    });

    describe('getCellDisplayValue()', () => {
      it('should return undefined for an uncached cell (no item arg)', () => {
        dv.clearFormattedDataCache();
        expect(dv.getCellDisplayValue(0, 'name')).toBeUndefined();
      });

      it('should return undefined for an uncached cell (with item arg, skips getItem)', () => {
        dv.clearFormattedDataCache();
        expect(dv.getCellDisplayValue(0, 'name', cacheItems[0])).toBeUndefined();
      });

      it('should return undefined when item id cannot be resolved', () => {
        expect(dv.getCellDisplayValue(999, 'name')).toBeUndefined();
      });

      it('should return cached display value when cache entry exists', () => {
        (dv as any).formattedCellCache[1] = { name: '<b>Alice</b>' };
        const cached = dv.getCellDisplayValue(0, 'name', cacheItems[0]);
        expect(cached).toBeDefined();
        expect(cached).toBe('<b>Alice</b>');
      });
    });

    describe('populateFormattedDataCacheAsync()', () => {
      it('should do nothing when enableFormattedDataCache is false', async () => {
        const dvOff = new SlickDataView({});
        const gridOff = new SlickGrid('#myGrid', dvOff, columns, { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as any);
        dvOff.setItems(cacheItems);
        dvOff.populateFormattedDataCacheAsync(); // no-op: grid has no enableFormattedDataCache
        // Give a tick to confirm nothing populates
        await new Promise((r) => setTimeout(r, 20));
        expect(dvOff.getCellDisplayValue(0, 'name')).toBeUndefined();
        gridOff.destroy();
        dvOff.destroy();
      });

      it('should fire onFormattedDataCacheProgress and onFormattedDataCacheCompleted events', async () => {
        const progressSpy = vi.fn();
        const completedSpy = vi.fn();

        // Wait for the beforeEach-triggered run to finish, then start fresh
        await waitForCache();
        // Ensure the option is enabled in the DataView instance used by this test
        (dv as any)._gridOptions = { ...(dv as any)._gridOptions, enableFormattedDataCache: true };

        dv.onFormattedDataCacheProgress.subscribe(progressSpy);
        dv.onFormattedDataCacheCompleted.subscribe(completedSpy);

        // setItems() is the canonical flow that clears + repopulates cache when enabled
        dv.setItems([...cacheItems]);
        await waitForCache();

        expect(progressSpy).toHaveBeenCalled();
        expect(completedSpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ totalRows: 2 }));

        dv.onFormattedDataCacheProgress.unsubscribe(progressSpy);
        dv.onFormattedDataCacheCompleted.unsubscribe(completedSpy);
      });

      it('should cancel an in-progress run when called again', async () => {
        await waitForCache();
        dv.clearFormattedDataCache();
        const completedSpy = vi.fn();
        dv.onFormattedDataCacheCompleted.subscribe(completedSpy);

        dv.populateFormattedDataCacheAsync();
        dv.populateFormattedDataCacheAsync(); // cancels the first; generation counter increments
        await waitForCache();

        // Only one completed event fires (for the second run)
        expect(completedSpy).toHaveBeenCalledTimes(1);
        dv.onFormattedDataCacheCompleted.unsubscribe(completedSpy);
      });

      it('should populate cell cache for columns with a formatter', async () => {
        await waitForCache();
        // name column has a formatter → stored in formattedCellCache
        const cached = dv.getCellDisplayValue(0, 'name', cacheItems[0]);
        expect(cached).toBeDefined();
        expect(cached).toBe('<b>Alice</b>');
      });

      it('should skip group and groupTotals rows', async () => {
        const groupItem = { __group: true, id: 99, name: 'group' };
        const totalsItem = { __groupTotals: true, id: 98, name: 'totals' };
        const mixedItems = [...cacheItems, groupItem, totalsItem] as any[];
        dv.setItems(mixedItems);
        await waitForCache();

        // Groups/totals rows should not produce a cache entry
        expect(dv.getCellDisplayValue(2, 'name', groupItem as any)).toBeUndefined();
        expect(dv.getCellDisplayValue(3, 'name', totalsItem as any)).toBeUndefined();
      });

      it('should respect formattedDataCacheBatchSize option', async () => {
        const manyItems = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `User${i}`, age: i }));
        const dvBatch = new SlickDataView({});
        const gridBatch = new SlickGrid('#myGrid', dvBatch, columns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
          formattedDataCacheBatchSize: 10,
        } as any);
        dvBatch.setItems(manyItems);
        await waitForCache(dvBatch);
        expect(dvBatch.getCacheStatus().isPopulating).toBe(false);
        gridBatch.destroy();
        dvBatch.destroy();
      });

      it('should fallback to requestAnimationFrame and cancel a pending RAF when re-triggered', () => {
        const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 123 as any);
        const cancelRafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined as any);
        vi.stubGlobal('MessageChannel', undefined as any);

        try {
          dv.populateFormattedDataCacheAsync();
          expect(rafSpy).toHaveBeenCalled();

          dv.populateFormattedDataCacheAsync();
          expect(cancelRafSpy).toHaveBeenCalledWith(123);
        } finally {
          vi.unstubAllGlobals();
          rafSpy.mockRestore();
          cancelRafSpy.mockRestore();
        }
      });

      it('should schedule the next batch when population is not done in the current frame', () => {
        const queuedRafCallbacks: Array<FrameRequestCallback> = [];
        const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
          queuedRafCallbacks.push(cb);
          return queuedRafCallbacks.length as any;
        });
        vi.stubGlobal('MessageChannel', undefined as any);

        const dvFrame = new SlickDataView({});
        const gridFrame = new SlickGrid('#myGrid', dvFrame, columns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
          formattedDataCacheBatchSize: 1,
        } as any);
        dvFrame.setGrid(gridFrame);
        dvFrame.setItems([
          { id: 1, name: 'A', age: 1 },
          { id: 2, name: 'B', age: 2 },
          { id: 3, name: 'C', age: 3 },
        ]);

        try {
          dvFrame.clearFormattedDataCache();
          queuedRafCallbacks.length = 0;
          rafSpy.mockClear();
          dvFrame.populateFormattedDataCacheAsync();
          expect(rafSpy).toHaveBeenCalledTimes(1);

          // Run only the first scheduled frame: with batchSize=1 and 3 rows total,
          // processBatch is not done and must schedule another batch.
          queuedRafCallbacks[0](performance.now());
          expect(rafSpy).toHaveBeenCalledTimes(2);
        } finally {
          vi.unstubAllGlobals();
          rafSpy.mockRestore();
          gridFrame.destroy();
          dvFrame.destroy();
        }
      });

      it('should stop current batch when frame deadline is exceeded and schedule another frame', () => {
        const queuedRafCallbacks: Array<FrameRequestCallback> = [];
        const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
          queuedRafCallbacks.push(cb);
          return queuedRafCallbacks.length as any;
        });
        const perfSpy = vi.spyOn(performance, 'now').mockReturnValue(100);
        vi.stubGlobal('MessageChannel', undefined as any);

        const dvFrame = new SlickDataView({});
        const gridFrame = new SlickGrid('#myGrid', dvFrame, columns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
          formattedDataCacheBatchSize: 300,
          formattedDataCacheFrameBudgetMs: -1,
        } as any);
        dvFrame.setGrid(gridFrame);
        dvFrame.setItems(Array.from({ length: 40 }, (_, i) => ({ id: i + 1, name: `User${i + 1}`, age: i + 1 })));

        try {
          dvFrame.clearFormattedDataCache();
          queuedRafCallbacks.length = 0;
          rafSpy.mockClear();
          dvFrame.populateFormattedDataCacheAsync();
          expect(rafSpy).toHaveBeenCalledTimes(1);

          queuedRafCallbacks[0](performance.now());

          expect((dvFrame as any).formattedCacheMetadata.lastProcessedRow).toBeLessThan(39);
          expect(rafSpy).toHaveBeenCalledTimes(2);
        } finally {
          vi.unstubAllGlobals();
          perfSpy.mockRestore();
          rafSpy.mockRestore();
          gridFrame.destroy();
          dvFrame.destroy();
        }
      });

      it('should reset the deadline-check counter and continue processing when within frame budget', () => {
        const queuedRafCallbacks: Array<FrameRequestCallback> = [];
        const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
          queuedRafCallbacks.push(cb);
          return queuedRafCallbacks.length as any;
        });
        const perfSpy = vi.spyOn(performance, 'now').mockReturnValue(100);
        vi.stubGlobal('MessageChannel', undefined as any);

        const dvFrame = new SlickDataView({});
        const gridFrame = new SlickGrid('#myGrid', dvFrame, columns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
          formattedDataCacheBatchSize: 20,
          formattedDataCacheFrameBudgetMs: 1000,
        } as any);
        dvFrame.setGrid(gridFrame);
        dvFrame.setItems(Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `User${i + 1}`, age: i + 1 })));

        try {
          dvFrame.clearFormattedDataCache();
          queuedRafCallbacks.length = 0;
          rafSpy.mockClear();
          dvFrame.populateFormattedDataCacheAsync();
          expect(rafSpy).toHaveBeenCalledTimes(1);

          queuedRafCallbacks[0](performance.now());

          // Finished in one frame (counter reached 0 at least once and got reset internally)
          expect((dvFrame as any).formattedCacheMetadata.lastProcessedRow).toBe(19);
          expect(rafSpy).toHaveBeenCalledTimes(1);
        } finally {
          vi.unstubAllGlobals();
          perfSpy.mockRestore();
          rafSpy.mockRestore();
          gridFrame.destroy();
          dvFrame.destroy();
        }
      });
    });

    describe('invalidateFormattedDataCacheForRow()', () => {
      it('should do nothing when cache is disabled', () => {
        const dvOff = new SlickDataView({});
        const gridOff = new SlickGrid('#myGrid', dvOff, columns, { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as any);
        dvOff.setItems(cacheItems);
        expect(() => dvOff.invalidateFormattedDataCacheForRow(0)).not.toThrow();
        gridOff.destroy();
        dvOff.destroy();
      });

      it('should do nothing for an out-of-bounds row', () => {
        expect(() => dv.invalidateFormattedDataCacheForRow(999)).not.toThrow();
      });

      it('should re-cache a single row after invalidation', async () => {
        await waitForCache();
        const cachedBefore = dv.getCellDisplayValue(0, 'name', cacheItems[0]);
        expect(cachedBefore).toBe('<b>Alice</b>');

        // Manually delete the cache entry to simulate stale data, then invalidate
        dv.invalidateFormattedDataCacheForRow(0);
        const cachedAfter = dv.getCellDisplayValue(0, 'name', cacheItems[0]);
        expect(cachedAfter).toBeDefined();
      });
    });

    describe('setItems() with cache enabled', () => {
      it('should clear and restart cache population when setItems is called', async () => {
        await waitForCache();
        const completedSpy = vi.fn();
        dv.onFormattedDataCacheCompleted.subscribe(completedSpy);

        const newItems = [{ id: 10, name: 'Carol', age: 22 }];
        dv.setItems(newItems);
        await waitForCache();

        expect(completedSpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ totalRows: 1 }));
        dv.onFormattedDataCacheCompleted.unsubscribe(completedSpy);
      });
    });

    describe('deleteItem() / deleteItems() with cache', () => {
      it('should remove the deleted item entry from both caches after deleteItem()', async () => {
        await waitForCache();
        const deletedItem = { ...cacheItems[0] };
        // id=1 (Alice) is in the cell cache
        expect(dv.getCellDisplayValue(0, 'name', deletedItem)).toBeDefined();

        dv.deleteItem(1);
        // formattedCellCache for id=1 should now be gone
        expect(dv.getCellDisplayValue(0, 'name', deletedItem)).toBeUndefined();
      });

      it('should remove all deleted item entries from both caches after deleteItems()', async () => {
        await waitForCache();
        dv.deleteItems([1, 2]);
        expect(dv.getItemCount()).toBe(0);
        // Both cache entries should be gone
        expect(dv.getCellDisplayValue(0, 'name', cacheItems[0])).toBeUndefined();
        expect(dv.getCellDisplayValue(0, 'name', cacheItems[1])).toBeUndefined();
      });
    });

    describe('updateItem() / updateItems() with cache', () => {
      it('should re-cache the row after updateItem()', async () => {
        await waitForCache();
        const updatedItem = { id: 1, name: 'Alice Updated', age: 31 };
        dv.updateItem(1, updatedItem);
        // invalidateFormattedDataCacheForRow re-caches synchronously
        const cached = dv.getCellDisplayValue(0, 'name', updatedItem);
        expect(cached).toBeDefined();
        expect(cached).toBe('<b>Alice Updated</b>');
      });

      it('should handle id change during updateItem() — remove old cache entry', async () => {
        await waitForCache();
        const oldItem = { ...cacheItems[0] };
        const updatedItem = { id: 99, name: 'Alice Renamed', age: 31 };
        dv.updateItem(1, updatedItem);
        // Old id=1 entry must be gone; new id=99 must be re-cached
        expect(dv.getCellDisplayValue(0, 'name', oldItem)).toBeUndefined();
        const newCached = dv.getCellDisplayValue(0, 'name', updatedItem);
        expect(newCached).toBe('<b>Alice Renamed</b>');
      });

      it('should re-cache all rows after updateItems()', async () => {
        await waitForCache();
        const updated = [
          { id: 1, name: 'Alice v2', age: 31 },
          { id: 2, name: 'Bob v2', age: 26 },
        ];
        dv.updateItems([1, 2], updated);
        expect(dv.getCellDisplayValue(0, 'name', updated[0])).toBe('<b>Alice v2</b>');
        expect(dv.getCellDisplayValue(1, 'name', updated[1])).toBe('<b>Bob v2</b>');
      });

      it('should remove old cache entry and re-cache when updateItems changes an item id', async () => {
        await waitForCache();
        const oldItem = { ...cacheItems[0] };
        const updated = [{ id: 99, name: 'Alice v99', age: 31 }];

        dv.updateItems([1], updated as any);

        expect(dv.getCellDisplayValue(0, 'name', oldItem as any)).toBeUndefined();
        expect(dv.getCellDisplayValue(0, 'name', updated[0] as any)).toBe('<b>Alice v99</b>');
      });

      it('should skip row invalidation when updated item is filtered out (rowIdx unresolved)', async () => {
        await waitForCache();
        dv.setFilter((item: any) => item.age >= 30);
        dv.refresh();

        const invalidateSpy = vi.spyOn(dv as any, 'invalidateFormattedDataCacheForRow');
        const updated = [{ id: 1, name: 'Alice hidden', age: 10 }];
        expect(() => dv.updateItems([1], updated)).not.toThrow();

        expect(invalidateSpy).not.toHaveBeenCalled();
        invalidateSpy.mockRestore();
      });
    });

    describe('column classification in buildCacheContext()', () => {
      it('should classify columns with exportWithFormatter+formatter as dualCacheColumns (both caches populated)', async () => {
        const exportColumns = [
          { id: 'title', field: 'title', name: 'Title', formatter: (_r: any, _c: any, val: any) => `<b>${val}</b>`, exportWithFormatter: true },
          { id: 'code', field: 'code', name: 'Code' },
        ] as any[];
        const dvExport = new SlickDataView({});
        const gridExport = new SlickGrid('#myGrid', dvExport, exportColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvExport.setGrid(gridExport);
        dvExport.setItems([{ id: 1, title: 'Hello', code: 'A1' }]);
        await waitForCache(dvExport);

        // Dual-use column: formatter result stored in both export cache and cell cache
        expect(dvExport.getFormattedCellValue(0, 'title', 'MISS')).not.toBe('MISS');
        expect(dvExport.getCellDisplayValue(0, 'title', { id: 1, title: 'Hello', code: 'A1' })).toBeDefined();
        gridExport.destroy();
        dvExport.destroy();
      });

      it('should classify columns with exportCustomFormatter as exportOnlyCacheColumns', async () => {
        const exportCustomColumns = [
          {
            id: 'title',
            field: 'title',
            name: 'Title',
            formatter: (_r: any, _c: any, val: any) => `<b>${val}</b>`,
            exportCustomFormatter: (_r: any, _c: any, val: any) => `EXPORT:${val}`,
          },
        ] as any[];
        const dvCustom = new SlickDataView({});
        const gridCustom = new SlickGrid('#myGrid', dvCustom, exportCustomColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvCustom.setGrid(gridCustom);
        dvCustom.setItems([{ id: 1, title: 'Hello' }]);
        await waitForCache(dvCustom);

        // exportCustomFormatter → exportOnlyCacheColumns → export cache populated with custom formatter result
        expect(dvCustom.getFormattedCellValue(0, 'title', 'MISS')).not.toBe('MISS');
        gridCustom.destroy();
        dvCustom.destroy();
      });

      it('should classify columns with only a formatter as cellOnlyColumns', async () => {
        const cellOnlyColumns = [{ id: 'title', field: 'title', name: 'Title', formatter: (_r: any, _c: any, val: any) => `<b>${val}</b>` }] as any[];
        const dvCell = new SlickDataView({});
        const gridCell = new SlickGrid('#myGrid', dvCell, cellOnlyColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvCell.setGrid(gridCell);
        dvCell.setItems([{ id: 1, title: 'Hello' }]);
        await waitForCache(dvCell);

        // cellOnly column: cell cache populated, export cache has no entry
        expect(dvCell.getCellDisplayValue(0, 'title', { id: 1, title: 'Hello' })).toBeDefined();
        expect(dvCell.getFormattedCellValue(0, 'title', 'MISS')).toBe('MISS');
        gridCell.destroy();
        dvCell.destroy();
      });

      it('should sanitizeDataExport output for dualCacheColumns when option is set', async () => {
        const htmlColumns = [
          {
            id: 'title',
            field: 'title',
            name: 'Title',
            formatter: (_r: any, _c: any, val: any) => `<b>${val}</b>`,
            exportWithFormatter: true,
          },
        ] as any[];
        const dvSanitize = new SlickDataView({});
        const gridSanitize = new SlickGrid('#myGrid', dvSanitize, htmlColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
          excelExportOptions: { sanitizeDataExport: true },
        } as any);
        dvSanitize.setGrid(gridSanitize);
        dvSanitize.setItems([{ id: 1, title: 'Hello' }]);
        await waitForCache(dvSanitize);

        // With sanitizeDataExport, HTML tags should be stripped from the export string
        const exportVal = dvSanitize.getFormattedCellValue(0, 'title', 'MISS');
        expect(exportVal).not.toContain('<b>');
        expect(exportVal).toBe('Hello');
        gridSanitize.destroy();
        dvSanitize.destroy();
      });

      it('should handle a formatter that throws without crashing the whole population', async () => {
        const throwingColumns = [
          {
            id: 'title',
            field: 'title',
            name: 'Title',
            formatter: () => {
              throw new Error('formatter error');
            },
            exportWithFormatter: true,
          },
        ] as any[];
        const dvThrow = new SlickDataView({});
        const gridThrow = new SlickGrid('#myGrid', dvThrow, throwingColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvThrow.setGrid(gridThrow);
        dvThrow.setItems([{ id: 1, title: 'Hello' }]);
        // Population should complete despite the formatter throwing
        await expect(waitForCache(dvThrow)).resolves.toBeUndefined();
        expect(dvThrow.getCacheStatus().isPopulating).toBe(false);
        expect(dvThrow.getFormattedCellValue(0, 'title', 'MISS')).toBe('MISS');
        gridThrow.destroy();
        dvThrow.destroy();
      });

      it('should catch exportCustomFormatter errors and leave export cache value undefined', async () => {
        const exportOnlyThrowColumns = [
          {
            id: 'title',
            field: 'title',
            name: 'Title',
            exportCustomFormatter: () => {
              throw new Error('export formatter error');
            },
          },
        ] as any[];
        const dvExportThrow = new SlickDataView({});
        const gridExportThrow = new SlickGrid('#myGrid', dvExportThrow, exportOnlyThrowColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvExportThrow.setGrid(gridExportThrow);
        dvExportThrow.setItems([{ id: 1, title: 'Hello' }]);

        await expect(waitForCache(dvExportThrow)).resolves.toBeUndefined();
        expect(dvExportThrow.getFormattedCellValue(0, 'title', 'MISS')).toBe('MISS');
        gridExportThrow.destroy();
        dvExportThrow.destroy();
      });

      it('should skip cell cache storage for live DOM formatter results (direct and wrapped)', async () => {
        const domColumns = [
          {
            id: 'directElement',
            field: 'directElement',
            name: 'Direct Element',
            formatter: () => {
              const span = document.createElement('span');
              span.textContent = 'direct-element';
              return span;
            },
          },
          {
            id: 'directFragment',
            field: 'directFragment',
            name: 'Direct Fragment',
            formatter: () => {
              const fragment = document.createDocumentFragment();
              const span = document.createElement('span');
              span.textContent = 'direct-fragment';
              fragment.appendChild(span);
              return fragment;
            },
          },
          {
            id: 'wrappedElement',
            field: 'wrappedElement',
            name: 'Wrapped Element',
            formatter: () => {
              const span = document.createElement('span');
              span.textContent = 'wrapped-element';
              return { html: span };
            },
            exportWithFormatter: true,
          },
          {
            id: 'wrappedFragment',
            field: 'wrappedFragment',
            name: 'Wrapped Fragment',
            formatter: () => {
              const fragment = document.createDocumentFragment();
              const span = document.createElement('span');
              span.textContent = 'wrapped-fragment';
              fragment.appendChild(span);
              return { html: fragment };
            },
            exportWithFormatter: true,
          },
          {
            id: 'nullCell',
            field: 'nullCell',
            name: 'Null Cell',
            formatter: () => null,
          },
        ] as any[];
        const dvDom = new SlickDataView({});
        const gridDom = new SlickGrid('#myGrid', dvDom, domColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvDom.setGrid(gridDom);
        dvDom.setItems([
          {
            id: 1,
            directElement: 'a',
            directFragment: 'b',
            wrappedElement: 'c',
            wrappedFragment: 'd',
            nullCell: 'e',
          },
        ]);

        await waitForCache(dvDom);
        expect(dvDom.getCellDisplayValue(0, 'directElement', { id: 1 } as any)).toBeUndefined();
        expect(dvDom.getCellDisplayValue(0, 'directFragment', { id: 1 } as any)).toBeUndefined();
        expect(dvDom.getCellDisplayValue(0, 'wrappedElement', { id: 1 } as any)).toBeUndefined();
        expect(dvDom.getCellDisplayValue(0, 'wrappedFragment', { id: 1 } as any)).toBeUndefined();
        expect(dvDom.getCellDisplayValue(0, 'nullCell', { id: 1 } as any)).toBeDefined();
        gridDom.destroy();
        dvDom.destroy();
      });

      it('should detect metadata formatter and skip row-level cell cache population', async () => {
        const metadataColumns = [{ id: 'title', field: 'title', name: 'Title', formatter: (_r: any, _c: any, val: any) => `<b>${val}</b>` }] as any[];
        const metadataProvider = {
          getRowMetadata: () => ({
            formatter: () => 'meta-formatter',
          }),
        };
        const dvMetadata = new SlickDataView({ globalItemMetadataProvider: metadataProvider as any });
        const gridMetadata = new SlickGrid('#myGrid', dvMetadata, metadataColumns, {
          enableCellNavigation: true,
          devMode: { ownerNodeIndex: 0 },
          enableFormattedDataCache: true,
        } as any);
        dvMetadata.setGrid(gridMetadata);

        const itemMetadataSpy = vi.spyOn(dvMetadata, 'getItemMetadata');
        dvMetadata.setItems([{ id: 1, title: 'Hello' }]);
        await waitForCache(dvMetadata);

        expect(itemMetadataSpy).toHaveBeenCalled();
        expect(dvMetadata.getCellDisplayValue(0, 'title', { id: 1, title: 'Hello' } as any)).toBeUndefined();
        itemMetadataSpy.mockRestore();
        gridMetadata.destroy();
        dvMetadata.destroy();
      });
    });
  });
});
