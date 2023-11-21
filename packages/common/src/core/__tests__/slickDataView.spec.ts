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
});