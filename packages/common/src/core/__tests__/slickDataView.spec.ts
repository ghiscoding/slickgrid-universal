import { SlickDataView } from '../slickDataview';
import 'flatpickr';

describe('SlickDatView core file', () => {
  let container: HTMLElement;
  let dataView: SlickDataView;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'myGrid';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.textContent = '';
    dataView.destroy();
  });

  it('should be able to instantiate SlickDataView', () => {
    dataView = new SlickDataView({});

    expect(dataView.getItems()).toEqual([]);
  });

  it('should be able to add items to the DataView', () => {
    const mockData = [
      { id: 1, firstName: 'John', lastName: 'Doe' },
      { id: 2, firstName: 'Jane', lastName: 'Doe' },
    ]
    dataView = new SlickDataView({});
    dataView.addItem(mockData[0]);
    dataView.addItem(mockData[1]);

    expect(dataView.getLength()).toBe(2);
    expect(dataView.getItemCount()).toBe(2);
    expect(dataView.getItems()).toEqual(mockData);
  });

  describe('batch CRUD methods', () => {
    afterEach(() => {
      dataView.endUpdate(); // close any batch that weren't closed because of potential error thrown
      dataView.destroy();
    });

    it('should batch items with addItems and begin/end batch update', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];

      dataView.beginUpdate(true);
      dataView.addItems(items);
      dataView.endUpdate();

      expect(dataView.getItems()).toEqual(items);
    });

    it('should batch more items with addItems with begin/end batch update and expect them to be inserted at the end of the dataset', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const newItems = [{ id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 }];

      dataView.setItems(items); // original items list

      dataView.beginUpdate(true);
      dataView.addItems(newItems); // batch extra items
      dataView.endUpdate();

      expect(dataView.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 },
        { id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 },
      ]);
    });

    it('should batch more items with insertItems with begin/end batch update and expect them to be inserted at the beginning of the dataset', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const newItems = [{ id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 }];

      dataView.setItems(items); // original items list

      dataView.beginUpdate(true);
      dataView.insertItems(0, newItems); // batch extra items
      dataView.endUpdate();

      expect(dataView.getItems()).toEqual([
        { id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 },
        { id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }
      ]);

      dataView.deleteItem(3);

      expect(dataView.getItems()).toEqual([
        { id: 4, name: 'Ronald', age: 34 },
        { id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }
      ]);
    });

    it('should batch more items with insertItems with begin/end batch update and expect them to be inserted at a certain index dataset', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const newItems = [{ id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 }];

      dataView.setItems(items); // original items list

      dataView.beginUpdate(true);
      dataView.insertItems(1, newItems); // batch extra items
      dataView.endUpdate();

      expect(dataView.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 },
        { id: 3, name: 'Smith', age: 30 }, { id: 4, name: 'Ronald', age: 34 },
        { id: 1, name: 'Jane', age: 24 }
      ]);

      dataView.deleteItems([3, 1]);

      expect(dataView.getItems()).toEqual([
        { id: 0, name: 'John', age: 20 },
        { id: 4, name: 'Ronald', age: 34 },
      ]);
    });

    it('should throw when trying to delete items with have invalid Ids', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];

      dataView.setItems(items); // original items list

      expect(() => dataView.deleteItems([-1, 1])).toThrow('[SlickGrid DataView] Invalid id');
    });

    it('should throw when trying to delete items with a batch that have invalid Ids', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];

      dataView.setItems(items); // original items list

      dataView.beginUpdate(true);
      expect(() => dataView.deleteItems([-1, 1])).toThrow('[SlickGrid DataView] Invalid id');
    });

    it('should call updateItems, without batch, and expect a refresh to be called', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const updatedItems = [{ id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 }];
      const refreshSpy = jest.spyOn(dataView, 'refresh');

      dataView.setItems(items); // original items list

      dataView.updateItems(updatedItems.map(item => item.id), updatedItems);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dataView.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 },
      ]);

      dataView.deleteItem(1);

      expect(dataView.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }
      ]);
    });

    it('should batch updateItems and expect a refresh to be called', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const updatedItems = [{ id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 }];
      const refreshSpy = jest.spyOn(dataView, 'refresh');

      dataView.setItems(items); // original items list

      dataView.beginUpdate(true);
      dataView.updateItems(updatedItems.map(item => item.id), updatedItems);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dataView.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 },
      ]);

      dataView.deleteItem(1);
      dataView.endUpdate();

      expect(dataView.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }
      ]);
    });

    it('should batch updateItems and expect a refresh to be called', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const updatedItems = [{ id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 }];
      const refreshSpy = jest.spyOn(dataView, 'refresh');

      dataView.setItems(items); // original items list

      dataView.beginUpdate(true);
      dataView.updateItems(updatedItems.map(item => item.id), updatedItems);

      expect(refreshSpy).toHaveBeenCalled();
      expect(dataView.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 },
      ]);

      dataView.deleteItem(1);
      dataView.endUpdate();

      expect(dataView.getItems()).toEqual([
        { id: 0, name: 'Smith', age: 30 }
      ]);
    });

    it('should throw when batching updateItems with some invalid Ids', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 1, name: 'Jane', age: 24 }];
      const updatedItems = [{ id: 0, name: 'Smith', age: 30 }, { id: 1, name: 'Ronald', age: 34 }];
      const refreshSpy = jest.spyOn(dataView, 'refresh');

      dataView.setItems(items); // original items list

      dataView.beginUpdate(true);

      expect(() => dataView.updateItems([-1, 1], updatedItems)).toThrow('[SlickGrid DataView] Invalid id');
    });

    it('should throw when trying to call setItems() with duplicate Ids', () => {
      const items = [{ id: 0, name: 'John', age: 20 }, { id: 0, name: 'Jane', age: 24 }];

      expect(() => dataView.setItems(items)).toThrow(`[SlickGrid DataView] Each data element must implement a unique 'id' property`);
    });
  });
});