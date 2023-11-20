import { Column, GridOption } from '../../interfaces';
import { SlickDataView } from '../slickDataview';
import { SlickGrid } from '../slickGrid';

describe('SlickGrid core file', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'myGrid';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.textContent = '';
  });

  it('should be able to instantiate SlickGrid without DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true } as GridOption;
    const grid = new SlickGrid<any, Column>('#myGrid', [], columns, options, true);

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual([]);
  });

  it('should be able to instantiate SlickGrid with a DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true } as GridOption;
    const dv = new SlickDataView({});
    const grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options, true);

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual(dv);
    expect(dv.getItems()).toEqual([]);
  });
});