import { Aggregators } from '../../aggregators';
import { SortDirectionNumber } from '../../enums';
import { Grouping } from '../../interfaces';
import { SortComparers } from '../../sortComparers';
import { SlickDataView } from '../slickDataview';
import 'flatpickr';

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
    ]
    dv = new SlickDataView({});
    dv.addItem(mockData[0]);
    dv.addItem(mockData[1]);

    expect(dv.getLength()).toBe(2);
    expect(dv.getItemCount()).toBe(2);
    expect(dv.getItems()).toEqual(mockData);
  });

  describe('batch CRUD methods', () => {
    afterEach(() => {
      dv.endUpdate(); // close any batch that weren't closed because of potential error thrown
      dv.destroy();
    });

    it('should batch items with addItems and begin/end batch update', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];

      dv.beginUpdate(true);
      dv.addItems(items);
      dv.endUpdate();

      expect(dv.getIdPropertyName()).toBe('id');
      expect(dv.getItems()).toEqual(items);
    });

    it('should batch more items with addItems with begin/end batch update and expect them to be inserted at the end of the dataset', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const newItems = [{ id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 }];

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.addItems(newItems); // batch extra items
      dv.endUpdate();

      expect(dv.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 },
        { id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 },
      ]);
    });

    it('should batch more items with insertItems with begin/end batch update and expect them to be inserted at the beginning of the dataset', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const newItems = [{ id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 }];

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.insertItems(0, newItems); // batch extra items
      dv.endUpdate();

      expect(dv.getItems()).toEqual([
        { id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 },
        { id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }
      ]);

      dv.deleteItem(3);

      expect(dv.getItems()).toEqual([
        { id: 4, name: 'Ronald', age: 34 },
        { id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }
      ]);
    });

    it('should be able to use different "id" when using setItems()', () => {
      const items = [{ keyId: 0, name: 'John', age: 20 }, { keyId: 1, name: 'Jane', age: 24 }];

      dv.beginUpdate(true);
      dv.setItems(items, 'keyId');
      dv.endUpdate();

      expect(dv.getIdPropertyName()).toBe('keyId');
      expect(dv.getItems()).toEqual(items);
    });

    it('should batch more items with insertItems with begin/end batch update and expect them to be inserted at a certain index dataset', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const newItems = [{ id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 }];

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.insertItems(1, newItems); // batch extra items
      dv.endUpdate();

      expect(dv.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 },
        { id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 },
        { id: 1, name: 'Jane', age: 24 }
      ]);

      dv.deleteItems([3, 1]);

      expect(dv.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 },
        { id: 4, name: 'Ronald', age: 34 },
      ]);
    });

    it('should throw when trying to delete items with have invalid Ids', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];

      dv.setItems(items); // original items list

      expect(() => dv.deleteItems([-1, 1])).toThrow('[SlickGrid DataView] Invalid id');
    });

    it('should throw when trying to delete items with a batch that have invalid Ids', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      expect(() => dv.deleteItems([-1, 1])).toThrow('[SlickGrid DataView] Invalid id');
    });

    it('should call updateItems, without batch, and expect a refresh to be called', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const updatedItems = [{ id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 }];
      const refreshSpy = jest.spyOn(dv, 'refresh');

      dv.setItems(items); // original items list

      dv.updateItems(updatedItems.map(item => item.id), updatedItems);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 },
      ]);

      dv.deleteItem(1);

      expect(dv.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }
      ]);
    });

    it('should batch updateItems and expect a refresh to be called', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const updatedItems = [{ id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 }];
      const refreshSpy = jest.spyOn(dv, 'refresh');

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.updateItems(updatedItems.map(item => item.id), updatedItems);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 },
      ]);

      dv.deleteItem(1);
      dv.endUpdate();

      expect(dv.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }
      ]);
    });

    it('should batch updateItems and expect a refresh to be called', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const updatedItems = [{ id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 }];
      const refreshSpy = jest.spyOn(dv, 'refresh');

      dv.setItems(items); // original items list

      dv.beginUpdate(true);
      dv.updateItems(updatedItems.map(item => item.id), updatedItems);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 },
      ]);

      dv.deleteItem(1);
      dv.endUpdate();

      expect(dv.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }
      ]);
    });

    it('should throw when batching updateItems with some invalid Ids', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const updatedItems = [{ id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 }];
      const refreshSpy = jest.spyOn(dv, 'refresh');

      dv.setItems(items); // original items list

      dv.beginUpdate(true);

      expect(() => dv.updateItems([-1, 1], updatedItems)).toThrow('[SlickGrid DataView] Invalid id');
    });

    it('should throw when trying to call setItems() with duplicate Ids', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 0, name: 'Jane', age: 24 }];

      expect(() => dv.setItems(items)).toThrow(`[SlickGrid DataView] Each data element must implement a unique 'id' property`);
    });

    it('should call insertItem() at a defined index location', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const newItem = { id: 2, name: 'Smith', age: 30 };
      const refreshSpy = jest.spyOn(dv, 'refresh');

      dv.setItems(items);
      dv.insertItem(1, newItem);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 },
        { id: 2, name: 'Smith', age: 30 },
        { id: 1, name: 'Jane', age: 24 }
      ]);
    });

    it('should throw when trying to call insertItem() with undefined Id', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const newItem = { id: undefined, name: 'Smith', age: 30 };

      dv.setItems(items);
      expect(() => dv.insertItem(1, newItem)).toThrow(`[SlickGrid DataView] Each data element must implement a unique 'id' property`);
    });

    it('should throw when trying to call insertItem() with undefined Id', () => {
      const items = [
        { id: 0, name: 'John', age: 20 },
        { id: 1, name: 'Jane', age: 24 },
        { id: undefined, name: 'Smith', age: 30 }];

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
      ]
      dv = new SlickDataView({});
      const refreshSpy = jest.spyOn(dv, 'refresh');
      dv.setItems(mockData);

      dv.setGrouping({
        getter: 'lastName',
        formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      } as Grouping);

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
        value: 'Doe'
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
      ]
      dv = new SlickDataView({});
      const refreshSpy = jest.spyOn(dv, 'refresh');
      dv.setItems(mockData);

      const agg = new Aggregators.Count('lastName');
      dv.setGrouping({
        getter: 'lastName',
        formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
        aggregators: [agg],
        aggregateCollapsed: false,
        sortAsc: true,
      } as Grouping);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dv.getGrouping().length).toBe(1);
      expect(dv.getGrouping()[0]).toMatchObject({ aggregators: [agg], getter: 'lastName' });

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
        value: 'Doe'
      });
      expect(dv.getItem(1)).toEqual(mockData[0]);
      expect(dv.getItem(2)).toEqual(mockData[1]);
      expect(dv.getItem(3)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        group: expect.anything(),
        initialized: true,
        count: { lastName: 2 }
      });
    });

    it('should call setGrouping() and be able to sort it descending by the Grouping field', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe' },
        { id: 2, firstName: 'Jane', lastName: 'Doe' },
        { id: 3, firstName: 'Bob', lastName: 'Smith' },
      ]
      dv = new SlickDataView({});
      const refreshSpy = jest.spyOn(dv, 'refresh');
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
        value: 'Smith'
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
        rows: [{ id: 1, firstName: 'John', lastName: 'Doe' }, { id: 2, firstName: 'Jane', lastName: 'Doe' }],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: null,
        value: 'Doe'
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
        value: 'Smith'
      });
      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 1,
        count: 2,
        groupingKey: 'Doe',
        groups: null,
        level: 0,
        rows: [{ id: 1, firstName: 'John', lastName: 'Doe' }, { id: 2, firstName: 'Jane', lastName: 'Doe' }],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: null,
        value: 'Doe'
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
        value: 'Smith'
      });
      expect(dv.getItem(1)).toEqual({ id: 3, firstName: 'Bob', lastName: 'Smith' });
    });

    it('should call setGrouping() then use collapseGroup() and expandGroup()', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 3, firstName: 'John', lastName: 'Smith', age: 26 },
      ]
      dv = new SlickDataView({});
      const refreshSpy = jest.spyOn(dv, 'refresh');
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
          { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 }
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe'
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
          { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 }
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe'
      });
      expect(dv.getItem(1)).not.toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
    });

    it('should call setGrouping() then use collapseGroup() and expandGroup() with Grouping delimiter', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 3, firstName: 'John', lastName: 'Smith', age: 26 },
      ]
      dv = new SlickDataView({});
      const refreshSpy = jest.spyOn(dv, 'refresh');
      dv.setItems([...mockData]);

      const agg1 = new Aggregators.Count('lastName');
      const agg2 = new Aggregators.Sum('age');
      dv.setGrouping({
        getter: 'lastName',
        formatter: (g) => `Family: ${g.value} <span class="text-green">(${g.count} items)</span>`,
        comparer: (a, b) => SortComparers.string(a.value, b.value, SortDirectionNumber.desc),
        aggregators: [agg1, agg2],
        predefinedValues: ['Smith']
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
        value: 'Smith'
      });
      expect(dv.getItem(1)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
      expect(dv.getItem(2)).toEqual({
        __groupTotals: true, __nonDataRow: true, group: expect.anything(), initialized: true, count: { lastName: 1 }, sum: { age: 26 }
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
          { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 }
        ],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe'
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
        value: 'Smith'
      });
      expect(dv.getItem(1)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
    });

    it('should call setGrouping() with multiple Groups from array and lazyTotalsCalculation with Group Totals calculation', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 3, firstName: 'John', lastName: 'Smith', age: 26 },
      ]
      dv = new SlickDataView({});
      const refreshSpy = jest.spyOn(dv, 'refresh');
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
        }
      ]);

      expect(dv.getItemMetadata(99)).toBeNull();
      expect(dv.getItemMetadata(2)).toBeNull();
      expect(dv.getItemMetadata(0)).toEqual({
        columns: {
          0: {
            colspan: '*',
            editor: null,
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
        value: 'Smith'
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
        value: 26
      });
      expect(dv.getItem(2)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
      expect(dv.getItem(3)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        count: { lastName: 1 },
        group: expect.anything(),
        initialized: true,
        sum: { age: 26 }
      });
      expect(dv.getItemMetadata(3)).toEqual({
        cssClasses: 'slick-group-totals slick-group-level-1',
        editor: null,
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
        value: 'Smith'
      });
      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 1,
        count: 2,
        groupingKey: 'Doe',
        groups: [expect.anything(), expect.anything()],
        level: 0,
        rows: [{ id: 1, firstName: 'John', lastName: 'Doe', age: 30 }, { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 }],
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
      ]
      dv = new SlickDataView({});
      dv.setItems([...mockData]);
      const refreshSpy = jest.spyOn(dv, 'refresh');

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
        }
      ]);

      expect(dv.getItemMetadata(99)).toBeNull();
      expect(dv.getItemMetadata(2)).toBeNull();
      expect(dv.getItemMetadata(0)).toEqual({
        columns: {
          0: {
            colspan: '*',
            editor: null,
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
        value: 'Smith'
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
        value: 26
      });
      expect(dv.getItem(2)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
      expect(dv.getItem(3)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        count: { lastName: 1 },
        group: expect.anything(),
        initialized: true,
        sum: { age: 0 }
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
        value: 'Smith'
      });
    });

    it('should call setGrouping() with multiple Groups from array with Group Totals calculation', () => {
      const mockData = [
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 3, firstName: 'John', lastName: 'Smith', age: 26 },
      ]
      dv = new SlickDataView({});
      const refreshSpy = jest.spyOn(dv, 'refresh');
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
          aggregateEmpty: true
        },
        {
          getter: 'age',
          formatter: (g) => `Age: ${g.value} <span class="text-green">(${g.count} items)</span>`,
          comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.desc),
          aggregators: [agg1, agg2],
          lazyTotalsCalculation: false,
          displayTotalsRow: true,
        }
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
        value: 26
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
        value: 'Smith'
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
        value: 26
      });
      expect(dv.getItem(2)).toEqual({ id: 3, firstName: 'John', lastName: 'Smith', age: 26 });
      expect(dv.getItem(3)).toEqual({
        __groupTotals: true,
        __nonDataRow: true,
        count: { lastName: 1 },
        group: expect.anything(),
        initialized: true,
        sum: { age: 26 }
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
        value: 'Smith'
      });
      expect(dv.getItem(1)).toEqual({
        __group: true,
        __nonDataRow: true,
        collapsed: 1,
        count: 2,
        groupingKey: 'Doe',
        groups: [expect.anything(), expect.anything()],
        level: 0,
        rows: [{ id: 1, firstName: 'John', lastName: 'Doe', age: 30 }, { id: 2, firstName: 'Jane', lastName: 'Doe', age: 28 }],
        selectChecked: false,
        title: 'Family: Doe <span class="text-green">(2 items)</span>',
        totals: expect.anything(),
        value: 'Doe',
      });
      expect(dv.getItem(2)).toBeUndefined();
    });
  });
});