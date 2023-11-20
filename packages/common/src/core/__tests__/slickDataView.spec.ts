import { SlickDataView } from '../slickDataview';

describe('SlickDatView core file', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'myGrid';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.textContent = '';
  });

  it('should be able to instantiate SlickDataView', () => {
    const dv = new SlickDataView({});

    expect(dv.getItems()).toEqual([]);
  });

  it('should be able to add items to the DataView', () => {
    const mockData = [
      { id: 1, firstName: 'John', lastName: 'Doe' },
      { id: 2, firstName: 'Jane', lastName: 'Doe' },
    ]
    const dv = new SlickDataView({});
    dv.addItem(mockData[0]);
    dv.addItem(mockData[1]);

    expect(dv.getLength()).toBe(2);
    expect(dv.getItemCount()).toBe(2);
    expect(dv.getItems()).toEqual(mockData);
  });
});