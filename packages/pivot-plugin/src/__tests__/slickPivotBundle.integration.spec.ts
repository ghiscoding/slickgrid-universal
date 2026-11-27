import { SlickEventData } from '@slickgrid-universal/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SlickVanillaGridBundle } from '../../../vanilla-bundle/src/components/slick-vanilla-grid-bundle.js';
import { SlickPivot } from '../slickPivot.js';
import { PivotEngine } from '../slickPivotEngine.js';
import { SlickPivotFieldList } from '../slickPivotFieldList.js';

Object.defineProperty(document.styleSheets[0], 'ownerNode', { get: () => Array.from(document.querySelectorAll('style')).at(-1) });

describe('pivot external resources with the vanilla bundle', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses host Pivot options over constructor options and preserves configured pre-header height', () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot({ pivotMode: true, fields: [{ id: 'region', label: 'Constructor caption' }], locale: 'en-US' });
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      {
        preHeaderPanelHeight: 42,
        externalResources: [pivot],
        pivotOptions: { pivotMode: false, fields: [{ id: 'region', label: 'Host caption' }], locale: 'fr-CA' },
      },
      [{ id: 1, region: 'East' }]
    );
    expect(bundle.slickGrid!.getOptions()).toEqual(expect.objectContaining({ createPreHeaderPanel: true, preHeaderPanelHeight: 42 }));
    expect(pivot.isPivotMode()).toBe(false);
    expect(pivot.getOptions().locale).toBe('fr-CA');
    expect(pivot.getFields()[0].label).toBe('Host caption');
    bundle.dispose();
  });

  it('prepares external resources in registration order', () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const observed: number[] = [];
    const resource = {
      pluginName: 'test',
      prepareGridOptions: (options: any) => {
        observed.push(options.preHeaderPanelHeight);
        options.preHeaderPanelHeight = 55;
      },
    };
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      {
        externalResources: [pivot, resource],
        pivotOptions: { pivotMode: false },
      },
      [{ id: 1, region: 'East' }]
    );
    expect(observed).toEqual([25]);
    expect(bundle.slickGrid!.getOptions().preHeaderPanelHeight).toBe(55);
    bundle.dispose();
  });

  it('derives supported field types from columns with empty data and honors Pivot overrides', () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [
        { id: 'int', field: 'int', name: 'Integer', type: 'integer' },
        { id: 'float', field: 'float', name: 'Float', type: 'float' },
        { id: 'date', field: 'date', name: 'Date', type: 'dateIso' },
        { id: 'flag', field: 'flag', name: 'Flag', type: 'boolean' },
        { id: 'text', field: 'text', name: 'Text', type: 'string' },
        { id: 'unknown', field: 'unknown', name: 'Unknown', type: 'unknown' },
      ],
      {
        externalResources: [pivot],
        pivotOptions: { pivotMode: false, fields: [{ id: 'float', type: 'string' }] },
      },
      []
    );
    expect(pivot.getFields().map(({ id, type }) => [id, type])).toEqual([
      ['int', 'number'],
      ['float', 'string'],
      ['date', 'date'],
      ['flag', 'boolean'],
      ['text', 'string'],
      ['unknown', undefined],
    ]);
    expect(pivot.inferFieldType('int')).toBe('number');
    expect(pivot.inferFieldType('date')).toBe('date');
    bundle.dispose();
  });

  it('commits the active source edit before switching to Pivot Mode', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      {
        editable: true,
        enableCellNavigation: true,
        autoEdit: false,
        externalResources: [pivot],
        pivotOptions: { pivotMode: false, spec: { rows: ['region'] } },
      },
      [{ id: 1, region: 'East' }]
    );
    const grid = bundle.slickGrid!;
    const commit = vi.fn(() => {
      bundle.dataView!.updateItem(1, { id: 1, region: 'North' });
      return true;
    });
    const editorLock = vi.spyOn(grid, 'getEditorLock').mockReturnValue({ isActive: () => true, commitCurrentEdit: commit } as any);
    await pivot.setPivotMode(true);
    expect(commit).toHaveBeenCalled();
    expect(bundle.dataView!.getItemById(1).region).toBe('North');
    expect(pivot.getResult()!.rowTree.children.map((node) => node.label)).toEqual(['North']);
    await pivot.setPivotMode(false);
    expect(grid.getDataItem(0).region).toBe('North');
    editorLock.mockRestore();
    bundle.dispose();
  });

  it.each([true, false])('restores the original header filter visibility when it starts as %s', async (visible) => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      { showHeaderRow: visible, externalResources: [pivot], pivotOptions: { pivotMode: false, spec: { rows: ['region'] } } },
      [{ id: 1, region: 'East' }]
    );
    const grid = bundle.slickGrid!;
    expect(grid.getOptions().showHeaderRow).toBe(visible);
    await pivot.setPivotMode(true);
    expect(grid.getOptions().showHeaderRow).toBe(false);
    await pivot.setPivotMode(false);
    expect(grid.getOptions().showHeaderRow).toBe(visible);
    await pivot.setPivotMode(true);
    pivot.dispose();
    expect(grid.getOptions().showHeaderRow).toBe(visible);
    bundle.dispose();
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

  it.each([true, false])('restores source header groups after Pivot Mode when pre-header visibility is %s', async (visible) => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [
        { id: 'region', field: 'region', name: 'Region', columnGroup: 'Customer' },
        { id: 'amount', field: 'amount', name: 'Amount', columnGroup: 'Sales' },
      ],
      {
        showPreHeaderPanel: visible,
        preHeaderPanelHeight: 41,
        externalResources: [pivot],
        pivotOptions: { pivotMode: false, spec: { rows: ['region'], columns: ['region'], values: [{ field: 'amount', aggregator: 'sum' }] } },
      },
      [{ id: 1, region: 'East', amount: 10 }]
    );
    const grid = bundle.slickGrid!;
    bundle.headerGroupingService.renderPreHeaderRowGroupingTitles();
    expect(grid.getPreHeaderPanel()!.textContent).toContain('Customer');
    await pivot.setPivotMode(true);
    expect(grid.getPreHeaderPanel()!.querySelector('.slick-pivot-header-caption')).not.toBeNull();
    await pivot.setPivotMode(false);
    await vi.waitFor(() => expect(grid.getPreHeaderPanel()!.textContent).toContain('Customer'));
    expect(grid.getOptions().showPreHeaderPanel).toBe(visible);
    expect(grid.getOptions().preHeaderPanelHeight).toBe(41);
    await pivot.setPivotMode(true);
    pivot.dispose();
    await vi.waitFor(() => expect(grid.getPreHeaderPanel()!.textContent).toContain('Customer'));
    expect(grid.getOptions().showPreHeaderPanel).toBe(visible);
    expect(grid.getOptions().preHeaderPanelHeight).toBe(41);
    bundle.dispose();
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

  it('emits source rows for a drill-down when the built-in details dialog is disabled', async () => {
    const container = document.createElement('div');
    const gridElement = document.createElement('div');
    gridElement.className = 'slickgrid-container';
    container.appendChild(gridElement);
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const fieldList = new SlickPivotFieldList({ container, pivot, details: false });
    const bundle = new SlickVanillaGridBundle(
      gridElement,
      [
        { id: 'region', field: 'region', name: 'Region' },
        { id: 'amount', field: 'amount', name: 'Amount' },
      ],
      {
        externalResources: [pivot, fieldList],
        pivotOptions: {
          pivotMode: true,
          fields: [{ id: 'amount', type: 'number' }],
          spec: { rows: ['region'], values: [{ field: 'amount', aggregator: 'sum' }] },
        },
      },
      [{ id: 1, region: 'East', amount: 10 }]
    );
    await Promise.resolve();
    const drilled = vi.fn();
    pivot.onPivotCellDrillDown.subscribe(drilled);
    bundle.slickGrid!.onDblClick.notify({ row: 0, cell: 1, grid: bundle.slickGrid! } as any);
    await vi.waitFor(() => expect(drilled).toHaveBeenCalled());
    expect(drilled.mock.calls[0][1]).toEqual(expect.objectContaining({ rowPath: { region: 'East' }, rows: [expect.objectContaining({ id: 1 })] }));
    expect(fieldList.getDetails()).toBeUndefined();
    expect(document.querySelector('.slick-pivot-details')).toBeNull();
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
    bundle.dataView!.updateItem(1, { id: 1, region: 'East', amount: 15 });
    await vi.waitFor(() => expect(pivot.getResult()?.cells['[]']['[]'][0]).toBe(35));
    bundle.dataView!.deleteItem(2);
    await vi.waitFor(() => expect(pivot.getResult()?.cells['[]']['[]'][0]).toBe(15));
    await pivot.setPivotMode(false);
    expect(bundle.slickGrid!.getData()).toBe(bundle.dataView);
    expect(bundle.dataView!.getItems()).toEqual([{ id: 1, region: 'East', amount: 15 }]);
    await pivot.setPivotMode(true);
    bundle.dataView!.setItems([{ id: 3, region: 'North', amount: 45 }]);
    await vi.waitFor(() => expect(pivot.getResult()?.cells['[]']['[]'][0]).toBe(45));
    await pivot.setPivotMode(false);
    expect(bundle.dataView!.getItems()).toEqual([{ id: 3, region: 'North', amount: 45 }]);
    bundle.dispose();
  });

  it('recomputes immediately when source data changes just before Pivot Mode is re-enabled', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      { externalResources: [pivot], pivotOptions: { pivotMode: true, refreshDelay: 1000, spec: { rows: ['region'] } } },
      [{ id: 1, region: 'East' }]
    );
    await Promise.resolve();
    await pivot.setPivotMode(false);
    bundle.dataView!.setItems([{ id: 2, region: 'West' }]);
    await pivot.setPivotMode(true);
    expect(pivot.getResult()!.rowTree.children.map((node) => node.label)).toEqual(['West']);
    bundle.dispose();
  });

  it('ignores a provider response after the Pivot resource is disposed', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    let resolveResult!: (result: any) => void;
    let signal!: AbortSignal;
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      {
        externalResources: [pivot],
        pivotOptions: {
          pivotMode: true,
          spec: { rows: ['region'] },
          provider: {
            execute: (_request, context) => {
              signal = context.signal;
              return new Promise((resolve) => {
                resolveResult = resolve;
              });
            },
          },
        },
      },
      [{ id: 1, region: 'East' }]
    );
    await Promise.resolve();
    const changed = vi.fn();
    pivot.onPivotChanged.subscribe(changed);
    pivot.dispose();
    expect(signal.aborted).toBe(true);
    resolveResult(new PivotEngine({ fields: [{ id: 'region' }] }).execute([{ region: 'West' }], { rows: ['region'] }));
    await Promise.resolve();
    expect(changed).not.toHaveBeenCalled();
    expect(bundle.slickGrid!.getData()).toBe(bundle.dataView);
    bundle.dispose();
  });

  it('keeps the host grid intact when an older provider request resolves after mode changes', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const requests: Array<{ signal: AbortSignal; resolve: (result: any) => void }> = [];
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      {
        externalResources: [pivot],
        pivotOptions: {
          pivotMode: true,
          spec: { rows: ['region'] },
          provider: { execute: (_request, context) => new Promise((resolve) => requests.push({ signal: context.signal, resolve })) },
        },
      },
      [{ id: 1, region: 'East' }]
    );
    await Promise.resolve();
    await pivot.setPivotMode(false);
    const enabling = pivot.setPivotMode(true);
    expect(requests).toHaveLength(2);
    expect(requests[0].signal.aborted).toBe(true);
    const engine = new PivotEngine({ fields: [{ id: 'region' }] });
    requests[1].resolve(engine.execute([{ region: 'North' }], { rows: ['region'] }));
    await enabling;
    requests[0].resolve(engine.execute([{ region: 'West' }], { rows: ['region'] }));
    await Promise.resolve();
    expect(pivot.getResult()!.rowTree.children.map((node) => node.label)).toEqual(['North']);
    await pivot.setPivotMode(false);
    expect(bundle.slickGrid!.getData()).toBe(bundle.dataView);
    expect(bundle.slickGrid!.getDataItem(0).region).toBe('East');
    bundle.dispose();
  });

  it('restores source row selection and column visibility after switching modes', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const menuContext = vi.fn(() => false);
    const bundle = new SlickVanillaGridBundle(
      container,
      [
        { id: 'region', field: 'region', name: 'Region' },
        { id: 'amount', field: 'amount', name: 'Amount' },
      ],
      {
        enableSelection: true,
        enableGridMenu: true,
        enableContextMenu: true,
        contextMenu: { menuUsabilityOverride: menuContext },
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
    grid.setColumns([grid.getColumns()[1], grid.getColumns()[0]]);
    grid.updateColumnById('region', { width: 175 });
    grid.updateColumnById('amount', { hidden: true });
    grid.updateColumns();
    grid.setSortColumns([{ columnId: 'region', sortAsc: false }]);
    await pivot.setPivotMode(true);
    grid.onContextMenu.notify({ row: 0, cell: 0, grid } as any, new SlickEventData());
    expect(menuContext).toHaveBeenLastCalledWith(expect.objectContaining({ dataContext: expect.objectContaining({ __pivot: expect.any(Object) }) }));
    grid.setSelectedRows([0]);
    expect(pivot.rowModel.getAllSelectedIds()).toEqual([pivot.rowModel.getItem(0).id]);
    expect(pivot.rowModel.getAllSelectedFilteredIds()).toEqual([pivot.rowModel.getItem(0).id]);
    await pivot.setPivotMode(false);
    grid.onContextMenu.notify({ row: 0, cell: 0, grid } as any, new SlickEventData());
    expect(menuContext).toHaveBeenLastCalledWith(expect.objectContaining({ dataContext: expect.objectContaining({ id: 1, region: 'East' }) }));
    expect(grid.getSelectedRows()).toEqual([1]);
    expect(grid.getColumns().map((column) => column.id)).toEqual(['amount', 'region']);
    expect(grid.getColumns().find((column) => column.id === 'region')?.width).toBe(175);
    expect(grid.getSortColumns()).toEqual([{ columnId: 'region', sortAsc: false }]);
    expect(grid.getColumns().find((column) => column.id === 'amount')?.hidden).toBe(true);
    expect(bundle.extensionService.getExtensionInstanceByName('gridMenu').columns.find((column: any) => column.id === 'amount')?.hidden).toBe(true);
    bundle.dispose();
  });

  it('restores source selection by ID after rows are reordered while pivoting', async () => {
    const container = document.createElement('div');
    container.className = 'slickgrid-container';
    document.body.appendChild(container);
    const pivot = new SlickPivot();
    const bundle = new SlickVanillaGridBundle(
      container,
      [{ id: 'region', field: 'region', name: 'Region' }],
      {
        enableSelection: true,
        dataView: { syncGridSelection: true },
        externalResources: [pivot],
        pivotOptions: { pivotMode: false, refreshDelay: 0, spec: { rows: ['region'] } },
      },
      [
        { id: 1, region: 'East' },
        { id: 2, region: 'West' },
      ]
    );
    const grid = bundle.slickGrid!;
    grid.setSelectedRows([1]);
    await pivot.setPivotMode(true);
    bundle.dataView!.setItems([
      { id: 2, region: 'West' },
      { id: 1, region: 'East' },
    ]);
    await vi.waitFor(() => expect(bundle.dataView!.getItem(0).id).toBe(2));
    await pivot.setPivotMode(false);
    expect(grid.getSelectedRows()).toEqual([0]);
    expect(grid.getDataItem(grid.getSelectedRows()[0]).id).toBe(2);
    await pivot.setPivotMode(true);
    bundle.dataView!.deleteItem(2);
    await pivot.setPivotMode(false);
    expect(grid.getSelectedRows()).toEqual([]);
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
    bundle.slickGrid!.setColumns([{ id: 'region', field: 'region', name: 'Updated region' }]);
    await pivot.setPivotMode(true);
    expect(pivot.getFields()[0].label).toBe('Updated region');
    await pivot.setPivotMode(false);
    expect(bundle.slickGrid!.getColumns()[0].name).toBe('Updated region');
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
