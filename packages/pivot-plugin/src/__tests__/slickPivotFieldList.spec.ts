import { SlickDataView, SlickGrid } from '@slickgrid-universal/common';
import { afterEach, describe, expect, it } from 'vitest';
import { SlickPivot } from '../slickPivot.js';
import { SlickPivotFieldList } from '../slickPivotFieldList.js';

Object.defineProperty(document.styleSheets[0], 'ownerNode', { get: () => Array.from(document.querySelectorAll('style')).at(-1) });

describe('SlickPivotFieldList', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts beside the host grid and switches modes without replacing it', async () => {
    const container = document.createElement('div');
    const gridElement = document.createElement('div');
    gridElement.className = 'slickgrid-container';
    container.appendChild(gridElement);
    document.body.appendChild(container);
    const data = new SlickDataView();
    data.setItems([
      { id: 1, region: 'East', amount: 10 },
      { id: 2, region: 'West', amount: 20 },
    ]);
    const columns = [
      { id: 'region', field: 'region', name: 'Region' },
      { id: 'amount', field: 'amount', name: 'Amount' },
    ];
    const grid = new SlickGrid(gridElement, data, columns, SlickPivot.getGridOptions({ enableCellNavigation: true }));
    const pivot = new SlickPivot({ fields: [{ id: 'amount', type: 'number' }], spec: { rows: ['region'], values: [{ field: 'amount', aggregator: 'sum' }] } });
    grid.registerPlugin(pivot);
    const fieldList = new SlickPivotFieldList({ container, pivot });
    grid.registerPlugin(fieldList);
    expect(container.querySelector('.slick-pivot-layout-fields')).not.toBeNull();
    expect(grid.getData()).toBe(pivot.rowModel);
    await pivot.setPivotMode(false);
    expect(grid.getData()).toBe(data);
    expect(grid.getContainerNode()).toBe(gridElement);
    await pivot.setPivotMode(true);
    expect(grid.getData()).toBe(pivot.rowModel);
    grid.destroy();
  });
});
