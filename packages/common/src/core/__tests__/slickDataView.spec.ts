import { SlickDataView } from '../slickDataview';

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
  });
});