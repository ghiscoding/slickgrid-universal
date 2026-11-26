import { afterEach, describe, expect, it, vi } from 'vitest';
import { SlickVanillaGridBundle } from '../../../vanilla-bundle/src/components/slick-vanilla-grid-bundle.js';
import { SlickPivot } from '../slickPivot.js';
import { SlickPivotFieldList } from '../slickPivotFieldList.js';

Object.defineProperty(document.styleSheets[0], 'ownerNode', { get: () => Array.from(document.querySelectorAll('style')).at(-1) });

describe('pivot external resources with the vanilla bundle', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('allows an initial pivot activation to be cancelled before the grid is ready', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      { externalResources: [pivot], pivotOptions: { pivotMode: true, spec: { rows: ['region'] } } },
      [{ id: 1, region: 'East' }]
    );

    await pivot.setPivotMode(false);
    await Promise.resolve();
    expect(pivot.isPivotMode()).toBe(false);
    expect(bundle.slickGrid?.getData()).toBe(bundle.dataView);
    bundle.dispose();
  });

  it('does not activate pivot after the bundle is disposed during deferred startup', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      { externalResources: [pivot], pivotOptions: { pivotMode: true, spec: { rows: ['region'] } } },
      [{ id: 1, region: 'East' }]
    );
    const modeChanged = vi.fn();
    pivot.onPivotModeChanged.subscribe(modeChanged);
    bundle.dispose();
    await Promise.resolve();
    expect(modeChanged).not.toHaveBeenCalled();
    expect(pivot.isPivotMode()).toBe(false);
  });

  it('restores the host grid when the pivot resource is disposed independently', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      { enableGridMenu: true, externalResources: [pivot], pivotOptions: { pivotMode: true, spec: { rows: ['region'] } } },
      [{ id: 1, region: 'East' }]
    );
    await Promise.resolve();
    const grid = bundle.slickGrid!;
    const menu = bundle.extensionService.getExtensionInstanceByName('gridMenu');
    expect(grid.getData()).toBe(pivot.rowModel);
    pivot.dispose();
    expect(grid.getData()).toBe(bundle.dataView);
    expect(grid.getColumns().map((column) => column.id)).toEqual(['region']);
    expect(bundle.extensionService.getExtensionInstanceByName('gridMenu')).toBe(menu);
    bundle.dispose();
  });

  it('recomputes after source DataView updates and restores the updated source rows', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [
        { id: 'region', field: 'region', name: 'Region' },
        { id: 'amount', field: 'amount', name: 'Amount' },
      ],
      {
        externalResources: [pivot],
        pivotOptions: {
          pivotMode: true,
          refreshDelay: 0,
          fields: [{ id: 'amount', type: 'number' }],
          spec: { rows: ['region'], values: [{ field: 'amount', aggregator: 'sum' }] },
        },
      },
      [{ id: 1, region: 'East', amount: 10 }]
    );
    await Promise.resolve();
    bundle.dataView!.addItem({ id: 2, region: 'West', amount: 20 });
    await vi.waitFor(() => expect(pivot.getResult()?.sourceRowCount).toBe(2));
    expect(pivot.getResult()?.cells['[]']['[]'][0]).toBe(30);
    await pivot.setPivotMode(false);
    expect(bundle.slickGrid!.getData()).toBe(bundle.dataView);
    expect(bundle.dataView!.getItems()).toHaveLength(2);
    bundle.dispose();
  });

  it('restores source row selection and column visibility after switching modes', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [
        { id: 'region', field: 'region', name: 'Region' },
        { id: 'amount', field: 'amount', name: 'Amount' },
      ],
      {
        enableSelection: true,
        enableGridMenu: true,
        dataView: { syncGridSelection: true },
        externalResources: [pivot],
        pivotOptions: { pivotMode: false, spec: { rows: ['region'], values: [{ field: 'amount', aggregator: 'sum' }] } },
      },
      [
        { id: 1, region: 'East', amount: 10 },
        { id: 2, region: 'West', amount: 20 },
      ]
    );
    const grid = bundle.slickGrid!;
    grid.setSelectedRows([1]);
    grid.updateColumnById('amount', { hidden: true });
    grid.updateColumns();
    await pivot.setPivotMode(true);
    grid.setSelectedRows([0]);
    expect(pivot.rowModel.getAllSelectedIds()).toEqual([pivot.rowModel.getItem(0).id]);
    expect(pivot.rowModel.getAllSelectedFilteredIds()).toEqual([pivot.rowModel.getItem(0).id]);
    await pivot.setPivotMode(false);
    expect(grid.getSelectedRows()).toEqual([1]);
    expect(grid.getColumns().find((column) => column.id === 'amount')?.hidden).toBe(true);
    expect(bundle.extensionService.getExtensionInstanceByName('gridMenu').columns.find((column: any) => column.id === 'amount')?.hidden).toBe(true);
    bundle.dispose();
  });

  it('derives field captions from DOM column names', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const caption = document.createElement('span');
    caption.textContent = 'Region caption';
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: caption as any }],
      { externalResources: [pivot], pivotOptions: { pivotMode: false, spec: { rows: ['region'] } } },
      [{ id: 1, region: 'East' }]
    );
    expect(pivot.getFields()[0].label).toBe('Region caption');
    bundle.dispose();
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
        { id: 'regionId', field: 'region', name: 'Region' },
        { id: 'amount', field: 'amount', name: 'Amount' },
      ],
      {
        enableCellNavigation: true,
        enableSorting: true,
        enableGridMenu: true,
        enableColumnPicker: true,
        enableHeaderMenu: true,
        externalResources: [pivot, fieldList],
        pivotOptions: {
          pivotMode: true,
          fields: [{ id: 'amount', type: 'number' }],
          spec: { rows: ['regionId'], columns: ['regionId'], values: [{ field: 'amount', aggregator: 'sum' }] },
        },
      },
      [
        { id: 1, region: 'East', amount: 10 },
        { id: 2, region: 'West', amount: 20 },
      ]
    );
    expect(pivot.getGrid()).toBe(bundle.slickGrid);
    expect(fieldList.getPanel()).toBeDefined();
    expect(pivot.getFields()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'regionId', field: 'region', label: 'Region' }),
        expect.objectContaining({ id: 'amount', field: 'amount', label: 'Amount', type: 'number' }),
      ])
    );
    bundle.slickGrid!.setSortColumns([{ columnId: 'regionId', sortAsc: true }]);
    await Promise.resolve();
    expect(bundle.slickGrid?.getData()).toBe(pivot.rowModel);
    const picker = bundle.extensionService.getExtensionInstanceByName('columnPicker');
    const menu = bundle.extensionService.getExtensionInstanceByName('gridMenu');
    expect(picker.columns.map((column) => column.id)).toEqual(bundle.slickGrid!.getColumns().map((column) => column.id));
    expect(menu.columns.map((column) => column.id)).toEqual(bundle.slickGrid!.getColumns().map((column) => column.id));
    const valueColumn = bundle.slickGrid!.getColumns()[1];
    const sourceSort = vi.spyOn(bundle.dataView!, 'sort');
    bundle.slickGrid!.onSort.notify({ columnId: valueColumn.id, sortCol: valueColumn, sortAsc: false, multiColumnSort: false, grid: bundle.slickGrid! });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sourceSort).not.toHaveBeenCalled();
    expect(pivot.getSpec().sort?.some((sort) => sort.direction === 'desc')).toBe(true);
    bundle.extensionService.getExtensionInstanceByName('headerMenu').hideColumn(valueColumn);
    expect(menu.columns.find((column) => column.id === valueColumn.id)?.hidden).toBe(true);
    bundle.slickGrid!.updateColumnById(valueColumn.id, { hidden: false });
    bundle.slickGrid!.updateColumns();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(bundle.slickGrid?.getPreHeaderPanel()?.querySelector('.slick-pivot-header-caption')).not.toBeNull();
    await pivot.setPivotMode(false);
    expect(bundle.slickGrid?.getData()).toBe(bundle.dataView);
    expect(picker.columns.map((column) => column.id)).toEqual(['regionId', 'amount']);
    expect(menu.columns.map((column) => column.id)).toEqual(['regionId', 'amount']);
    await pivot.refresh();
    bundle.slickGrid!.setColumns([{ id: 'amount', field: 'amount', name: 'Amount' }]);
    await pivot.togglePivotMode();
    expect(bundle.slickGrid?.getData()).toBe(pivot.rowModel);
    expect(pivot.getSpec().rows).toEqual([]);
    bundle.dispose();
  });
});
