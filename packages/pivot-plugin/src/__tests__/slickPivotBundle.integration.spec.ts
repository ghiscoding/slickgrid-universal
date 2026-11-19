import { afterEach, describe, expect, it } from 'vitest';
import { SlickVanillaGridBundle } from '../../../vanilla-bundle/src/components/slick-vanilla-grid-bundle.js';
import { SlickPivot } from '../slick.pivot.js';
import { SlickPivotFieldList } from '../slick.pivotfieldlist.js';

Object.defineProperty(document.styleSheets[0], 'ownerNode', { get: () => Array.from(document.querySelectorAll('style')).at(-1) });

describe('pivot external resources with the vanilla bundle', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses the bundle grid and DataView across mode switches', async () => {
    const container = document.createElement('div');
    const gridElement = document.createElement('div');
    gridElement.className = 'slickgrid-container';
    container.appendChild(gridElement);
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const fieldList = new SlickPivotFieldList({ container, pivot });
    const bundle = new SlickVanillaGridBundle(
      gridElement,
      [
        { id: 'region', field: 'region', name: 'Region' },
        { id: 'amount', field: 'amount', name: 'Amount' },
      ],
      {
        enableCellNavigation: true,
        enableGridMenu: true,
        enableColumnPicker: true,
        enableHeaderMenu: true,
        externalResources: [pivot, fieldList],
        pivotOptions: {
          pivotMode: false,
          fields: [{ id: 'amount', type: 'number' }],
          spec: { rows: ['region'], columns: ['region'], values: [{ field: 'amount', aggregator: 'sum' }] },
        },
      },
      [
        { id: 1, region: 'East', amount: 10 },
        { id: 2, region: 'West', amount: 20 },
      ]
    );
    expect(pivot.getGrid()).toBe(bundle.slickGrid);
    expect(fieldList.getPanel()).toBeDefined();
    await pivot.setPivotMode(true);
    expect(bundle.slickGrid?.getData()).toBe(pivot.rowModel);
    const picker = bundle.extensionService.getExtensionInstanceByName('columnPicker');
    const menu = bundle.extensionService.getExtensionInstanceByName('gridMenu');
    expect(picker.columns.map((column) => column.id)).toEqual(bundle.slickGrid.getColumns().map((column) => column.id));
    expect(menu.columns.map((column) => column.id)).toEqual(bundle.slickGrid.getColumns().map((column) => column.id));
    const valueColumn = bundle.slickGrid.getColumns()[1];
    bundle.extensionService.getExtensionInstanceByName('headerMenu').hideColumn(valueColumn);
    expect(menu.columns.find((column) => column.id === valueColumn.id)?.hidden).toBe(true);
    bundle.slickGrid.updateColumnById(valueColumn.id, { hidden: false });
    bundle.slickGrid.updateColumns();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(bundle.slickGrid?.getPreHeaderPanel()?.querySelector('.slick-pivot-header-caption')).not.toBeNull();
    await pivot.setPivotMode(false);
    expect(bundle.slickGrid?.getData()).toBe(bundle.dataView);
    expect(picker.columns.map((column) => column.id)).toEqual(['region', 'amount']);
    expect(menu.columns.map((column) => column.id)).toEqual(['region', 'amount']);
    await pivot.setPivotMode(true);
    expect(bundle.slickGrid?.getData()).toBe(pivot.rowModel);
    bundle.dispose();
  });
});
