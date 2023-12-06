import { Column, GridOption } from '../../interfaces';
import { SlickDataView } from '../slickDataview';
import { SlickGrid } from '../slickGrid';

describe('SlickGrid core file', () => {
  let container: HTMLElement;
  let grid: SlickGrid;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'myGrid';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.textContent = '';
    grid?.destroy(true);
  });

  it('should be able to instantiate SlickGrid without DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true } as GridOption;
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options, undefined, true);
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual([]);
  });

  it('should be able to instantiate SlickGrid with a DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true } as GridOption;
    const dv = new SlickDataView({});
    grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options, undefined, true);
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual(dv);
    expect(dv.getItems()).toEqual([]);
  });
});