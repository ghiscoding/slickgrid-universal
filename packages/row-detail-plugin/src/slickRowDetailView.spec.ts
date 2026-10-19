import {
  createDomElement,
  OnRowsChangedEventArgs,
  SlickEvent,
  SlickEventData,
  type Column,
  type FormatterResultWithHtml,
  type GridOption,
  type SlickDataView,
  type SlickGrid,
} from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlickDataView as ActualDataView } from '../../common/src/core/slickDataView.js';
import { SlickGrid as ActualGrid } from '../../common/src/core/slickGrid.js';
import { SlickRowDetailView } from './slickRowDetailView.js';

vi.useFakeTimers();

const GRID_UID = 'slickgrid12345';
const gridOptionsMock = { enableAutoTooltip: true, rowHeight: 25 } as GridOption;

const dataviewStub = {
  beginUpdate: vi.fn(),
  deleteItem: vi.fn(),
  endUpdate: vi.fn(),
  getIdPropertyName: vi.fn(),
  getItem: vi.fn(),
  getItemById: vi.fn(),
  getItemByIdx: vi.fn(),
  getItemsByGroupingKey: vi.fn(),
  getIdxById: vi.fn(),
  getRowById: vi.fn(),
  insertItem: vi.fn(),
  updateItem: vi.fn(),
  onGroupCollapsed: new SlickEvent(),
  onGroupExpanded: new SlickEvent(),
  onRowsChanged: new SlickEvent(),
  onRowCountChanged: new SlickEvent(),
  onSetItemsCalled: new SlickEvent(),
} as unknown as SlickDataView;

const getEditorLockMock = {
  commitCurrentEdit: vi.fn(),
  isActive: vi.fn(),
};

const gridStub = {
  getCellFromEvent: vi.fn(),
  getCellNode: vi.fn(),
  getCellNodeBox: vi.fn(),
  getActiveCell: vi.fn(),
  getColumns: vi.fn(),
  getColumnByIdx: vi.fn(),
  getColumnIndex: vi.fn(),
  getDataItem: vi.fn(),
  getData: () => dataviewStub,
  getEditorLock: () => getEditorLockMock,
  getOptions: () => gridOptionsMock,
  getUID: () => GRID_UID,
  getRenderedRange: vi.fn(),
  getRowCache: vi.fn(),
  getRowHeight: vi.fn(),
  getRowTop: vi.fn(),
  getViewportNode: vi.fn(),
  invalidateRows: vi.fn(),
  registerPlugin: vi.fn(),
  render: vi.fn(),
  sanitizeHtmlString: (text: string) => text,
  updateRowCount: vi.fn(),
  onBeforeEditCell: new SlickEvent(),
  onBeforeRemoveCachedRow: new SlickEvent(),
  onClick: new SlickEvent(),
  onKeyDown: new SlickEvent(),
  onRendered: new SlickEvent(),
  onScroll: new SlickEvent(),
  onSort: new SlickEvent(),
} as unknown as SlickGrid;

let mockColumns: Column[] = [];

describe('SlickRowDetailView plugin', () => {
  let eventPubSubService: EventPubSubService;
  const divContainer = document.createElement('div');
  let plugin: SlickRowDetailView;
  const gridContainerElm = document.createElement('div');
  gridContainerElm.className = GRID_UID;

  beforeEach(() => {
    mockColumns = [
      { id: 'firstName', name: 'First Name', field: 'firstName', width: 100 },
      { id: 'lastName', name: 'Last Name', field: 'lastName', width: 100 },
    ];
    eventPubSubService = new EventPubSubService();
    plugin = new SlickRowDetailView(eventPubSubService);
    divContainer.className = `slickgrid-container ${GRID_UID}`;
    document.body.appendChild(divContainer);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.mocked(gridStub.getRowCache).mockReturnValue({});
    vi.mocked(dataviewStub.updateItem).mockImplementation(() => {
      if ((plugin as any)._pendingAsyncEndUpdates.size > 0) {
        dataviewStub.onRowsChanged.notify({ rows: [0] } as OnRowsChangedEventArgs);
        gridStub.onRendered.notify({ startRow: 0, endRow: 0, grid: gridStub });
      }
    });
  });

  afterEach(() => {
    plugin.dispose();
    divContainer.replaceChildren();
    vi.clearAllMocks();
  });

  it('should create the plugin', () => {
    plugin.init(gridStub);
    expect(plugin).toBeTruthy();
  });

  describe('detail panels with a real grid and DataView', () => {
    let grid: ActualGrid;
    let dataView: ActualDataView;
    let container: HTMLDivElement;

    beforeEach(() => {
      container = createDomElement('div', { style: { width: '800px', height: '400px' } }, divContainer);
      dataView = new ActualDataView();
      dataView.setItems(
        Array.from({ length: 20 }, (_, id) => ({
          id,
          firstName: `Task ${id}`,
          __collapsed: false,
          __sizePadding: 2,
          __detailContent: '<input value="Initial">',
        }))
      );
      grid = new ActualGrid(container, dataView, mockColumns, {
        rowHeight: 25,
        devMode: { ownerNodeIndex: 0 },
        rowDetailView: { columnId: 'firstName', panelRows: 2, loadOnce: true },
      });
      plugin.init(grid);
    });

    afterEach(() => {
      plugin.dispose();
      grid.destroy(true);
    });

    const mountPanel = (id: number): HTMLElement => {
      (plugin as any)._expandedRowIds.add(id);
      (plugin as any)._renderedViewportRowIds.add(id);
      (plugin as any).renderOverlayPanels();
      return container.querySelector<HTMLElement>(`.row-detail-${id}`)!;
    };

    it.each([
      { label: 'center row below a non-contiguous top pin', row: 2, top: [0, 4], bottom: [] },
      { label: 'center row above a non-contiguous bottom pin', row: 2, top: [], bottom: [0, 4] },
      { label: 'top-pinned parent', row: 4, top: [4], bottom: [] },
      { label: 'bottom-pinned parent', row: 2, top: [], bottom: [2] },
    ])('positions the panel below its $label', ({ row, top, bottom }) => {
      grid.setOptions({ pinning: { rows: { top, bottom } } });
      const panel = mountPanel(row);
      expect(panel.style.top).toBe(`${grid.getCellNodeBox(row + 1, 0)!.top}px`);
      grid.scrollTo(75);
      grid.render();
      expect(panel.style.top).toBe(`${grid.getCellNodeBox(row + 1, 0)!.top}px`);
      grid.setOptions({ pinning: null });
      grid.render();
      expect(panel.style.top).toBe(`${grid.getRowTop(row) + 25}px`);
    });

    it('caps inserted padding so collapse restores the original dataset', () => {
      const item = dataView.getItemById(2);
      item.__collapsed = true;
      plugin.setOptions({ panelRows: 6, maxRows: 2, process: () => undefined });
      plugin.expandDetailView(2);
      expect(item.__sizePadding).toBe(2);
      expect(dataView.getLength()).toBe(22);
      mountPanel(2);
      plugin.collapseDetailView(2);
      expect(dataView.getLength()).toBe(20);
      expect(dataView.getItemById('2.3')).toBeUndefined();
    });

    it('sizes panels from padding heights and follows horizontal scroll in either direction', () => {
      vi.spyOn(grid, 'getRowHeight').mockImplementation((row) => (row === 3 ? 40 : 25));
      const panel = mountPanel(2);
      expect(panel.style.height).toBe('65px');
      const canvas = panel.parentElement!;
      const viewport = canvas.parentElement!;
      vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({ left: 10 } as DOMRect);
      Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 420 });
      for (const left of [-152, 172]) {
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ left } as DOMRect);
        grid.onScroll.notify({ scrollLeft: 162, scrollTop: 0, grid });
        expect(panel.style.transform).toBe(`translateX(${10 - left}px)`);
        expect(panel.style.width).toBe('420px');
      }
      panel.remove();
      (plugin as any).refreshOverlayPanel(dataView.getItemById(2));
      expect(panel.style.height).toBe('65px');
    });

    it('unmounts a pinned parent panel when its padding leaves the rendered range', () => {
      grid.setOptions({ pinning: { rows: { top: [2] } } });
      mountPanel(2);
      vi.spyOn(grid, 'getRenderedRange').mockReturnValue({ top: 10, bottom: 15, leftPx: 0, rightPx: 800 });
      plugin.recalculateOutOfRangeViews();
      expect(container.querySelector('.row-detail-2')).toBeNull();
      vi.spyOn(grid, 'getRenderedRange').mockReturnValue({ top: 4, bottom: 15, leftPx: 0, rightPx: 800 });
      plugin.recalculateOutOfRangeViews();
      expect(container.querySelector('.row-detail-2')).not.toBeNull();
    });

    it('renders an async replacement object instead of the original loading item', () => {
      const original = dataView.getItemById(2);
      original.__detailContent = '<span>Loading...</span>';
      const panel = mountPanel(2);
      const replacement = { ...original, firstName: 'Loaded task' };

      plugin.onAsyncResponse.notify({ item: replacement, detailView: '<span>Loaded detail</span>' }, new SlickEventData());
      grid.render();

      expect(dataView.getItemById(2)).toBe(replacement);
      expect(original.__detailContent).toBe('<span>Loading...</span>');
      expect(panel.innerHTML).toBe('<span>Loaded detail</span>');
      expect(container.querySelector('.row-detail-2')).toBe(panel);
    });

    it('preserves live inputs and listeners when scrolling after saving an HTML snapshot', () => {
      const item = dataView.getItemById(2);
      const panel = mountPanel(2);
      const input = panel.querySelector('input')!;
      const clickSpy = vi.fn();
      input.addEventListener('click', clickSpy);
      input.value = 'Edited value';
      input.focus();
      input.setSelectionRange(1, 4);
      panel.appendChild(createDomElement('span', { textContent: 'Live content' }));
      plugin.saveDetailView(item);

      grid.onScroll.notify({ scrollLeft: 0, scrollTop: 0, grid });
      grid.render();

      expect(panel.querySelector('input')).toBe(input);
      expect(input.value).toBe('Edited value');
      expect(document.activeElement).toBe(input);
      expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4]);
      input.click();
      expect(clickSpy).toHaveBeenCalledOnce();
    });
  });

  it('hides a later detail when expanding a row above it shifts its position', () => {
    const earlierItem = { id: 1, __collapsed: true };
    const laterItem = { id: 2, __collapsed: false };
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { panelRows: 2, process: vi.fn() } as any,
    });
    vi.spyOn(dataviewStub, 'getItemById').mockImplementation((id) => (id === 1 ? earlierItem : laterItem));
    vi.spyOn(dataviewStub, 'getRowById').mockImplementation((id) => (id === 1 ? 0 : 3));
    plugin.init(gridStub);
    (plugin as any)._renderedViewportRowIds.add(laterItem.id);
    const outOfViewportSpy = vi.spyOn(plugin.onRowOutOfViewportRange, 'notify');

    plugin.expandDetailView(earlierItem.id);

    expect(outOfViewportSpy).toHaveBeenCalledWith(expect.objectContaining({ rowId: laterItem.id }), null, plugin);
    expect((plugin as any)._renderedViewportRowIds.has(laterItem.id)).toBe(false);
  });

  it('should not notify before out of viewport when the item is missing', () => {
    const onBeforeRowOutOfViewportSpy = vi.spyOn(plugin.onBeforeRowOutOfViewportRange, 'notify');

    (plugin as any).notifyBeforeOutOfViewport(undefined);

    expect(onBeforeRowOutOfViewportSpy).not.toHaveBeenCalled();
  });

  it('should retry notifying when the detail container is created after the grid render', () => {
    const item = { id: 987, rowIndex: 2 };
    plugin.init(gridStub);
    const onRowBackToViewportSpy = vi.spyOn(plugin.onRowBackToViewportRange, 'notify');

    (plugin as any).notifyViewportChange(item, 'add');

    expect(onRowBackToViewportSpy).not.toHaveBeenCalled();
    expect((plugin as any)._pendingBackToViewportRows.has(item.id)).toBe(true);

    const detailContainer = createDomElement('div', { className: `row-detail-${item.id}` });
    divContainer.appendChild(detailContainer);
    gridStub.onRendered.notify({ startRow: 0, endRow: 10, grid: gridStub });

    expect(onRowBackToViewportSpy).toHaveBeenCalledOnce();
    expect((plugin as any)._pendingBackToViewportRows.has(item.id)).toBe(false);
    detailContainer.remove();
  });

  it('should be able to change plugin options and "collapseAll" be called when "singleRowExpand" is enabled', () => {
    const collapseAllSpy = vi.spyOn(plugin, 'collapseAll');
    const mockOptions = {
      columnId: '_detail_selector',
      cssClass: 'some-detailView-toggle',
      expandedClass: 'some-class',
      collapsedClass: 'some-collapsed-class',
      field: '_detail_selector',
      keyPrefix: '::',
      loadOnce: true,
      collapseAllOnSort: true,
      reorderable: false,
      saveDetailViewOnScroll: true,
      singleRowExpand: true,
      useSimpleViewportCalc: true,
      alwaysRenderColumn: true,
      maxRows: 300,
      toolTip: 'some-tooltip',
      width: 40,
    };
    plugin.init(gridStub);
    plugin.setOptions(mockOptions);

    expect(plugin.addonOptions).toEqual(mockOptions);
    expect(plugin.getOptions()).toEqual(mockOptions);
    expect(collapseAllSpy).toHaveBeenCalled();
  });

  it('should throw an error when slick grid object is not provided to the init method', () =>
    new Promise((done: any) => {
      try {
        plugin.init(null as any);
      } catch (e: any) {
        expect(e.message).toBe('[Slickgrid-Universal] RowDetailView Plugin requires the Grid instance to be passed as argument to the "init()" method.');
        done();
      }
    }));

  it('should create and dispose of the plugin', () => {
    const disposeSpy = vi.spyOn(plugin, 'dispose');
    expect(plugin).toBeTruthy();

    plugin.dispose();

    expect(plugin.eventHandler).toBeTruthy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should collapse all rows when "collapseAllOnSort" is enabled and "onSort" event is triggered', () => {
    const collapseAllSpy = vi.spyOn(plugin, 'collapseAll');
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { collapseAllOnSort: true } as any });

    plugin.init(gridStub);
    eventPubSubService.publish('onSortChanged', {});

    expect(plugin.getExpandedRowIds()).toEqual([]);
    expect(plugin.getOutOfViewportRows()).toEqual([]);
    expect(collapseAllSpy).toHaveBeenCalled();
  });

  it('should collapse all rows when "onBeforeEditCell" event is triggered', () => {
    const collapseAllSpy = vi.spyOn(plugin, 'collapseAll');
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { collapseAllOnSort: true } as any });

    plugin.init(gridStub);
    gridStub.onBeforeEditCell.notify(
      { cell: undefined as any, row: undefined as any, grid: gridStub, column: {} as Column, item: {} },
      new SlickEventData(),
      gridStub
    );

    expect(plugin.getExpandedRowIds()).toEqual([]);
    expect(plugin.getOutOfViewportRows()).toEqual([]);
    expect(collapseAllSpy).toHaveBeenCalled();
  });

  it('should update grid row count and re-render grid when "onRowCountChanged" event is triggered', () => {
    const updateRowCountSpy = vi.spyOn(gridStub, 'updateRowCount');
    const renderSpy = vi.spyOn(gridStub, 'render');

    plugin.init(gridStub);
    dataviewStub.onRowCountChanged.notify(
      { previous: 0, current: 1, itemCount: 2, dataView: dataviewStub, callingOnRowsChanged: true },
      new SlickEventData(),
      gridStub
    );

    expect(plugin.eventHandler).toBeTruthy();
    expect(updateRowCountSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
  });

  it('should invalidate all rows and re-render grid when "onRowsChanged" event is triggered', () => {
    const mockItem = { id: 1, firstName: 'John', lastName: 'Doe' };
    const mockProcess = vi.fn();
    vi.spyOn(gridStub, 'getRowCache').mockReturnValue({
      0: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      1: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      2: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      3: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
    });
    const invalidateRowsSpy = vi.spyOn(gridStub, 'invalidateRows');
    const renderSpy = vi.spyOn(gridStub, 'render');
    vi.spyOn(dataviewStub, 'getItemById').mockReturnValueOnce(mockItem);
    vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(1);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { process: mockProcess, columnIndexPosition: 0, useRowClick: true, maxRows: 2, panelRows: 2 } as any,
    });

    plugin.init(gridStub);
    plugin.expandDetailView(1);
    dataviewStub.onRowsChanged.notify(
      { rows: [0, 1, 2, 3], itemCount: 4, calledOnRowCountChanged: true, dataView: dataviewStub },
      new SlickEventData(),
      gridStub
    );

    expect(plugin.eventHandler).toBeTruthy();
    expect(invalidateRowsSpy).toHaveBeenCalledWith([1]); // only row 1 should be invalidated
    expect(renderSpy).toHaveBeenCalled();

    (plugin as any)._renderedIds.add(mockItem.id);
    dataviewStub.onRowsChanged.notify({ rows: [1] } as OnRowsChangedEventArgs);
    expect(invalidateRowsSpy).toHaveBeenLastCalledWith([]);
  });

  it('should trigger "onAsyncResponse" when calling "expandDetailView()" when template is already cached from loadOnce', () => {
    const mockItem = { __detailViewLoaded: true, __detailContent: 'loading...', id: 1, firstName: 'John', lastName: 'Doe' };
    const mockProcess = vi.fn();
    vi.spyOn(gridStub, 'getRowCache').mockReturnValueOnce({
      0: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      1: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      2: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      3: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
    });
    const invalidateRowsSpy = vi.spyOn(gridStub, 'invalidateRows');
    const renderSpy = vi.spyOn(gridStub, 'render');
    vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(mockItem);
    vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(1).mockReturnValueOnce(1).mockReturnValueOnce(1);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { process: mockProcess, columnIndexPosition: 0, useRowClick: true, maxRows: 2, panelRows: 2 } as any,
    });
    const onAsyncResponseSpy = vi.spyOn(plugin.onAsyncResponse, 'notify');

    plugin.init(gridStub);
    plugin.addonOptions.loadOnce = true;
    plugin.expandDetailView(1);
    dataviewStub.onRowsChanged.notify(
      { rows: [0, 1, 2, 3], itemCount: 4, calledOnRowCountChanged: true, dataView: dataviewStub },
      new SlickEventData(),
      gridStub
    );

    expect(onAsyncResponseSpy).toHaveBeenCalledWith({
      item: mockItem,
      detailView: 'loading...',
      grid: gridStub,
    });
    expect(plugin.eventHandler).toBeTruthy();
    expect(renderSpy).toHaveBeenCalled();
    // don't invalidate row detail that were already rendered and visible
    expect(invalidateRowsSpy).toHaveBeenCalledWith([]);
  });

  it('should use dataview Id when defined in grid options and "onSetItemsCalled" event is triggered from dataview', () => {
    vi.spyOn(dataviewStub, 'getIdPropertyName').mockReturnValue('rowId');

    plugin.init(gridStub);
    dataviewStub.onSetItemsCalled.notify({ idProperty: 'rowId' } as any, new SlickEventData(), gridStub);

    expect(plugin.dataViewIdProperty).toBe('rowId');
  });

  it('should throw an error when calling "create" without "rowDetailView" options in grid options', () => {
    expect(() => plugin.create(mockColumns, {})).toThrow(
      '[Slickgrid-Universal] The Row Detail View requires options to be passed via the "rowDetailView" property of the Grid Options'
    );
  });

  it('should add the Row Detail to the column definitions at index when calling "create" without specifying position', () => {
    const pubSubSpy = vi.spyOn(eventPubSubService, 'publish');
    const processMock = vi.fn();
    const overrideMock = vi.fn();
    const rowDetailColumnMock = {
      id: '_detail_',
      field: '_detail_',
      name: '',
      alwaysRenderColumn: true,
      cssClass: 'some-class',
      excludeFromExport: true,
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromQuery: true,
      excludeFromHeaderMenu: true,
      formatter: expect.anything(),
      reorderable: false,
      resizable: false,
      sortable: false,
      toolTip: 'title',
      width: 30,
    };

    const output = plugin.create(mockColumns, {
      rowDetailView: { process: processMock, expandableOverride: overrideMock, panelRows: 4, columnId: '_detail_', cssClass: 'some-class', toolTip: 'title' },
    });

    expect(pubSubSpy).toHaveBeenCalledWith('onPluginColumnsChanged', {
      columns: expect.arrayContaining([{ ...rowDetailColumnMock, formatter: expect.any(Function) }]),
      pluginName: 'RowDetailView',
    });
    expect(mockColumns[0]).toEqual(rowDetailColumnMock);
    expect(plugin.getExpandableOverride()).toEqual(overrideMock);
    expect(output instanceof SlickRowDetailView).toBeTruthy();
  });

  it('should add the Row Detail to the column definitions at index when calling "create" and specifying column position', () => {
    const columnIndex = 1;
    const processMock = vi.fn();
    const output = plugin.create(mockColumns, {
      rowDetailView: { process: processMock, columnIndexPosition: columnIndex, panelRows: 4, columnId: '_detail_', cssClass: 'some-class', toolTip: 'title' },
    });

    expect(mockColumns[columnIndex]).toEqual({
      id: '_detail_',
      field: '_detail_',
      name: '',
      alwaysRenderColumn: true,
      cssClass: 'some-class',
      excludeFromExport: true,
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromQuery: true,
      excludeFromHeaderMenu: true,
      formatter: expect.anything(),
      reorderable: false,
      resizable: false,
      sortable: false,
      toolTip: 'title',
      width: 30,
    });
    expect(plugin.getExpandableOverride()).toBeFalsy();
    expect(output instanceof SlickRowDetailView).toBeTruthy();
  });

  it('should expect the item parent to be returned when calling "getFilterItem" and the grid row is a Row Detail and has padding', () => {
    const parentItemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    plugin.init(gridStub);
    const output = plugin.getFilterItem({ __isPadding: true, __parent: parentItemMock });

    expect(output).toEqual(parentItemMock);
  });

  it('should never expand a Row Detail padding item', () => {
    const processMock = vi.fn();
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const paddingItem = { id: '1.1', title: 'Task 1', __collapsed: true, __isPadding: true };
    vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(paddingItem);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { process: processMock, panelRows: 2, useRowClick: true } as any,
    });

    plugin.init(gridStub);
    plugin.expandDetailView(paddingItem.id);

    expect((plugin as any).checkExpandableOverride(1, paddingItem, gridStub)).toBe(false);
    expect(updateItemSpy).not.toHaveBeenCalled();
    expect(processMock).not.toHaveBeenCalled();
  });

  it('should trigger "onAsyncResponse" but throw an error when there is no item provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockReturnValue();
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const postViewMock = (item: any) => `<span>Post ${item.id}</span>`;
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { postTemplate: postViewMock } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({} as any, new SlickEventData());

    expect(consoleSpy).toHaveBeenCalledWith('SlickRowDetailView plugin requires the onAsyncResponse() to supply "args.item" property.');
    expect(updateItemSpy).not.toHaveBeenCalled();
  });

  it('should trigger "onAsyncResponse" with Row Detail from post template from HTML string when no detailView is provided and expect "updateItem" from DataView to be called with new template & data', () => {
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const postViewMock = (item: any) => `<span>Post ${item.id}</span>`;
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { postTemplate: postViewMock } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock }, new SlickEventData());

    expect(updateItemSpy).toHaveBeenCalledWith(123, {
      __detailContent: '<span>Post 123</span>',
      __detailViewLoaded: true,
      id: 123,
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      {
        grid: gridStub,
        item: itemMock,
      },
      expect.anything(),
      plugin
    );

    // triggering onRenderRows should end up invalidating an empty set of rows
    const invalidateSpy = vi.spyOn(gridStub, 'invalidateRows');
    vi.spyOn(gridStub, 'getRowCache').mockReturnValue({
      121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      122: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      123: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      124: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      125: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
    });
    vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(1);
    dataviewStub.onRowsChanged.notify(
      { rows: [122, 123, 124], itemCount: 4, calledOnRowCountChanged: true, dataView: dataviewStub },
      new SlickEventData(),
      gridStub
    );
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('should refresh framework overlay content without replacing the outer panel', () => {
    const itemMock = { id: 123, __sizePadding: 2, __detailContent: '<span>Updated</span>' };
    const viewport = document.createElement('div');
    const canvas = document.createElement('div');
    canvas.className = 'grid-canvas';
    viewport.appendChild(canvas);
    divContainer.appendChild(viewport);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { panelRows: 2, columnId: '_detail_selector' } as any,
    });
    vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(0);
    vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewport);
    vi.spyOn(gridStub, 'getRowTop').mockReturnValue(100);
    vi.spyOn(gridStub, 'getRowHeight').mockReturnValue(25);
    vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(itemMock);
    vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);

    plugin.init(gridStub);
    (plugin as any).refreshOverlayPanel(null);
    const gridRef = (plugin as any)._grid;
    (plugin as any)._grid = undefined;
    (plugin as any).renderOverlayPanels();
    (plugin as any)._grid = gridRef;
    (plugin as any)._expandedRowIds.add(itemMock.id);
    (plugin as any)._renderedViewportRowIds.add(itemMock.id);
    (plugin as any).renderOverlayPanels();
    const panel = (plugin as any)._overlayPanels.get(itemMock.id) as HTMLElement;

    (plugin as any).refreshOverlayPanel({ ...itemMock, __detailContent: createDomElement('span', { textContent: 'Element' }) });
    expect(panel.textContent).toBe('Element');
    (plugin as any).refreshOverlayPanel({ ...itemMock, __detailContent: '<span>String</span>' });
    expect(panel.innerHTML).toBe('<span>String</span>');

    vi.spyOn(gridStub, 'getColumnIndex').mockReturnValueOnce(undefined);
    plugin.setOptions({ columnId: undefined });
    (plugin as any).refreshOverlayPanel({ ...itemMock, __sizePadding: 0 });
    expect(panel.style.height).toBe('0px');
    expect(panel.style.boxSizing).toBe('border-box');

    vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(undefined);
    (plugin as any).refreshOverlayPanel({ ...itemMock, __detailContent: '<span>No row</span>' });

    (plugin as any)._overlayPanels.delete(itemMock.id);
    (plugin as any).refreshOverlayPanel(itemMock);
    vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(document.createElement('div'));
    (plugin as any).renderOverlayPanels();
  });

  it('should wait for the actual grid render before notifying the async end update', () => {
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    vi.mocked(dataviewStub.updateItem).mockImplementation(() => undefined);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { postTemplate: () => '<span>Post</span>' } as any,
    });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock }, new SlickEventData());

    expect(asyncEndUpdateSpy).not.toHaveBeenCalled();
    gridStub.onRendered.notify({ startRow: 0, endRow: 0, grid: gridStub });
    expect(asyncEndUpdateSpy).not.toHaveBeenCalled();

    dataviewStub.onRowsChanged.notify({ rows: [0] } as OnRowsChangedEventArgs);
    gridStub.onRendered.notify({ startRow: 0, endRow: 0, grid: gridStub });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith({ grid: gridStub, item: itemMock }, expect.anything(), plugin);
  });

  it('should call framework lifecycle hooks around the grid render', () => {
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const beforeRenderSpy = vi.spyOn(plugin as any, 'beforeDetailViewRender');
    const renderDetailViewSpy = vi.spyOn(plugin as any, 'renderDetailView');
    vi.mocked(dataviewStub.updateItem).mockImplementation(() => undefined);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { postTemplate: () => '<span>Post</span>' } as any,
    });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock }, new SlickEventData());

    expect(beforeRenderSpy).toHaveBeenCalledWith(itemMock);
    expect(beforeRenderSpy.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(dataviewStub.updateItem).mock.invocationCallOrder[0]);
    expect(renderDetailViewSpy).not.toHaveBeenCalled();

    dataviewStub.onRowsChanged.notify({ rows: [0] } as OnRowsChangedEventArgs);
    gridStub.onRendered.notify({ startRow: 0, endRow: 0, grid: gridStub });

    expect(renderDetailViewSpy).toHaveBeenCalledWith(itemMock);
  });

  it('should finish updateItem before calling the framework render hook when the grid renders synchronously', () => {
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const renderDetailViewSpy = vi.spyOn(plugin as any, 'renderDetailView');
    let updateItemCompleted = false;
    vi.mocked(dataviewStub.updateItem).mockImplementation(() => {
      dataviewStub.onRowsChanged.notify({ rows: [0] } as OnRowsChangedEventArgs);
      gridStub.onRendered.notify({ startRow: 0, endRow: 0, grid: gridStub });
      expect(renderDetailViewSpy).not.toHaveBeenCalled();
      updateItemCompleted = true;
    });
    renderDetailViewSpy.mockImplementation(() => expect(updateItemCompleted).toBe(true));
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { postTemplate: () => '<span>Post</span>' } as any,
    });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock }, new SlickEventData());

    expect(renderDetailViewSpy).toHaveBeenCalledWith(itemMock);
  });

  it('should wait for an async framework render hook before notifying the async end update', async () => {
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    vi.spyOn(plugin as any, 'renderDetailView').mockResolvedValue(undefined);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { postTemplate: () => '<span>Post</span>' } as any,
    });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock }, new SlickEventData());

    expect(asyncEndUpdateSpy).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith({ grid: gridStub, item: itemMock }, expect.anything(), plugin);
  });

  it('should trigger "onAsyncResponse" with Row Detail from post template with HTML Element when no detailView is provided and expect "updateItem" from DataView to be called with new template & data', () => {
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const postViewMock = (item: any) => createDomElement('span', { textContent: `Post ${item.id}` });
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { postTemplate: postViewMock } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock }, new SlickEventData());

    expect(updateItemSpy).toHaveBeenCalledWith(123, {
      __detailContent: createDomElement('span', { textContent: 'Post 123' }),
      __detailViewLoaded: true,
      id: 123,
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      {
        grid: gridStub,
        item: itemMock,
      },
      expect.anything(),
      plugin
    );
  });

  it('should trigger "onAsyncResponse" with Row Detail template when detailView is provided and expect "updateItem" from DataView to be called with new template & data', () => {
    const detailView = `<span>loading...</span>`;
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, detailView }, new SlickEventData());

    expect(updateItemSpy).toHaveBeenCalledWith(123, {
      __detailContent: `<span>loading...</span>`,
      __detailViewLoaded: true,
      id: 123,
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      {
        grid: gridStub,
        item: itemMock,
      },
      expect.anything(),
      plugin
    );
  });

  it('should trigger onClick and not call anything when "expandableOverride" returns False', () => {
    const detailView = `<span>loading...</span>`;
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };

    plugin.init(gridStub);
    plugin.expandableOverride(() => false);
    plugin.onAsyncResponse.notify({ item: itemMock, detailView }, new SlickEventData());

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(updateItemSpy).toHaveBeenCalledWith(123, {
      __detailContent: `<span>loading...</span>`,
      __detailViewLoaded: true,
      id: 123,
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      {
        grid: gridStub,
        item: itemMock,
      },
      expect.anything(),
      plugin
    );
    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(stopPropagationSpy).not.toHaveBeenCalled();
  });

  it('should trigger onClick and NOT expect Row Detail to be toggled when onBeforeRowDetailToggle returns false', () => {
    const detailView = `<span>loading...</span>`;
    const mockProcess = vi.fn();
    const expandDetailViewSpy = vi.spyOn(plugin, 'expandDetailView');
    const onBeforeSlickEventData = new SlickEventData();
    vi.spyOn(onBeforeSlickEventData, 'getReturnValue').mockReturnValue(false);
    const beforeRowDetailToggleSpy = vi.spyOn(plugin.onBeforeRowDetailToggle, 'notify').mockReturnValueOnce(onBeforeSlickEventData);
    const afterRowDetailToggleSpy = vi.spyOn(plugin.onAfterRowDetailToggle, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    vi.spyOn(gridStub, 'getDataItem').mockReturnValue(itemMock);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { process: mockProcess, columnIndexPosition: 0, useRowClick: true, maxRows: 2, panelRows: 2 } as any,
    });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, detailView }, new SlickEventData());

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(beforeRowDetailToggleSpy).toHaveBeenCalled();
    expect(afterRowDetailToggleSpy).not.toHaveBeenCalled();
    expect(expandDetailViewSpy).not.toHaveBeenCalled();
  });

  it('should trigger onClick and expect Row Detail to be toggled', () => {
    const detailView = `<span>loading...</span>`;
    const mockItem = { id: 1, firstName: 'John', lastName: 'Doe' };
    const mockProcess = vi.fn();
    vi.spyOn(dataviewStub, 'getItemById').mockReturnValueOnce(mockItem);
    vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(1).mockReturnValueOnce(1);

    const expandDetailViewSpy = vi.spyOn(plugin, 'expandDetailView');
    const beforeRowDetailToggleSpy = vi.spyOn(plugin.onBeforeRowDetailToggle, 'notify');
    const afterRowDetailToggleSpy = vi.spyOn(plugin.onAfterRowDetailToggle, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    vi.spyOn(gridStub, 'getDataItem').mockReturnValue(itemMock);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { process: mockProcess, columnIndexPosition: 0, useRowClick: true, maxRows: 2, panelRows: 2 } as any,
    });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, detailView }, new SlickEventData());

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(beforeRowDetailToggleSpy).toHaveBeenCalled();
    expect(afterRowDetailToggleSpy).toHaveBeenCalled();
    expect(expandDetailViewSpy).toHaveBeenCalledWith(123);
  });

  it('should trigger "onAsyncResponse" with Row Detail template with "useRowClick" enabled and then expect changes to be commited with prevent default event when editor isActive and commitCurrentEdit is returning false', () => {
    const detailView = `<span>loading...</span>`;
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const beforeRowDetailToggleSpy = vi.spyOn(plugin.onBeforeRowDetailToggle, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);
    vi.spyOn(gridStub, 'getDataItem').mockReturnValue(itemMock);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { columnIndexPosition: 0, useRowClick: true } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, detailView }, new SlickEventData());
    const filteredItem = plugin.getFilterItem(itemMock);

    expect(updateItemSpy).toHaveBeenCalledWith(123, {
      __detailContent: `<span>loading...</span>`,
      __detailViewLoaded: true,
      id: 123,
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      {
        grid: gridStub,
        item: itemMock,
      },
      expect.anything(),
      plugin
    );

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(filteredItem).toBeTruthy();
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(beforeRowDetailToggleSpy).not.toHaveBeenCalled();
  });

  it('should trigger "onAsyncResponse" with Row Detail template with "useRowClick" enabled and then expect DataView to clear/delete rows in the UI when opening Row Detail', () => {
    const detailView = `<span>loading...</span>`;
    const mockItem = { id: 1, firstName: 'John', lastName: 'Doe' };
    const mockProcess = vi.fn();
    vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(mockItem);
    vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(1).mockReturnValueOnce(1);
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const insertItemSpy = vi.spyOn(dataviewStub, 'insertItem');
    const beginUpdateSpy = vi.spyOn(dataviewStub, 'beginUpdate');
    const endUpdateSpy = vi.spyOn(dataviewStub, 'endUpdate');
    const deleteItemSpy = vi.spyOn(dataviewStub, 'deleteItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const loadingTemplate = () => `<span>loading...</span>`;
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    vi.spyOn(gridStub, 'getDataItem').mockReturnValue(itemMock);
    vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(0);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionsMock,
      rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useRowClick: true, singleRowExpand: true, loadOnce: true } as any,
    });
    const beforeRowDetailToggleSpy = vi.spyOn(plugin.onBeforeRowDetailToggle, 'notify');
    const afterRowDetailToggleSpy = vi.spyOn(plugin.onAfterRowDetailToggle, 'notify');

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, detailView }, new SlickEventData());

    expect(updateItemSpy).toHaveBeenCalledWith(123, {
      __detailContent: `<span>loading...</span>`,
      __detailViewLoaded: true,
      id: 123,
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      {
        grid: gridStub,
        item: itemMock,
      },
      expect.anything(),
      plugin
    );

    plugin.expandDetailView(itemMock.id);

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
    const stopImmediateSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    vi.spyOn(gridStub, 'getRenderedRange').mockReturnValueOnce({ top: 0, bottom: 20, left: 33, right: 18 } as any);
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(stopImmediateSpy).toHaveBeenCalled();
    expect(beforeRowDetailToggleSpy).toHaveBeenCalledWith(
      {
        grid: gridStub,
        item: {
          __detailViewLoaded: true,
          __detailContent: '<span>loading...</span>',
          id: 123,
          firstName: 'John',
          lastName: 'Doe',
        },
      },
      expect.anything(),
      expect.anything(),
      true
    );
    expect(afterRowDetailToggleSpy).toHaveBeenCalledWith(
      {
        grid: gridStub,
        item: {
          __detailViewLoaded: true,
          __detailContent: '<span>loading...</span>',
          id: 123,
          firstName: 'John',
          lastName: 'Doe',
        },
        expandedRows: [
          {
            __collapsed: true,
            __detailContent: '<span>loading...</span>',
            __detailViewLoaded: false,
            __height: 150,
            __sizePadding: 0,
            firstName: 'John',
            id: 1,
            lastName: 'Doe',
          },
        ],
      },
      expect.anything(),
      plugin
    );
    expect(insertItemSpy).toHaveBeenCalled();
    expect(beginUpdateSpy).toHaveBeenCalled();
    expect(deleteItemSpy).toHaveBeenCalledTimes(6); // panelRows(5) + 1
    expect(endUpdateSpy).toHaveBeenCalled();
  });

  describe('resize', () => {
    let cellDetailViewElm: HTMLDivElement;
    beforeEach(() => {
      cellDetailViewElm = document.createElement('div');
      cellDetailViewElm.className = `slick-row-detail-container row-detail-123`;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call "resizeDetailView" and expect it to return without calling "saveDetailView" when item provided is null', () => {
      const saveDetailSpy = vi.spyOn(plugin, 'saveDetailView');

      plugin.init(gridStub);
      plugin.resizeDetailView(null);

      expect(saveDetailSpy).not.toHaveBeenCalled();
    });

    it('should call "resizeDetailView" and expect it to return without calling "saveDetailView" when Row Detail is not found in the DOM', () => {
      const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
      const saveDetailSpy = vi.spyOn(plugin, 'saveDetailView');

      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);

      expect(saveDetailSpy).not.toHaveBeenCalled();
    });

    it('should resize the panel as content grows and shrinks while preserving template elements and saved content', () => {
      const item = { id: 123, __sizePadding: 0, __detailContent: '' };
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { panelRows: 2, loadOnce: true, maxRows: 7 } as any,
      });
      plugin.init(gridStub);
      const input = createDomElement('input', { value: 'Edited assignee' });
      cellDetailViewElm.appendChild(input);
      divContainer.appendChild(cellDetailViewElm);
      cellDetailViewElm.style.top = '125px';
      cellDetailViewElm.style.pointerEvents = 'auto';
      cellDetailViewElm.style.height = '50px';
      cellDetailViewElm.scrollTop = 20;
      let contentHeight = 180;
      Object.defineProperty(cellDetailViewElm, 'scrollHeight', {
        configurable: true,
        get: () => {
          cellDetailViewElm.scrollTop = 0;
          return cellDetailViewElm.style.height === 'auto' ? contentHeight : 500;
        },
      });

      plugin.resizeDetailView(item);

      expect(cellDetailViewElm.style.height).toBe('175px');
      expect(cellDetailViewElm.scrollTop).toBe(20);
      expect(item.__sizePadding).toBe(7);
      expect(item.__detailContent).toBe(input.outerHTML);

      contentHeight = 25;
      plugin.resizeDetailView(item);

      expect(cellDetailViewElm.style.height).toBe('50px');
      expect(cellDetailViewElm.scrollTop).toBe(20);
      expect(cellDetailViewElm.style.minHeight).toBe('');
      expect(cellDetailViewElm.style.top).toBe('125px');
      expect(cellDetailViewElm.style.pointerEvents).toBe('auto');
      expect(cellDetailViewElm.firstElementChild).toBe(input);
      expect(input.value).toBe('Edited assignee');
      expect(item.__sizePadding).toBe(2);
      cellDetailViewElm.remove();
    });

    it('should call "resizeDetailView" and expect it to call "saveDetailView" when Row Detail is found in the DOM', () => {
      const mockProcess = vi.fn();
      const itemMock = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: true,
        __detailViewLoaded: true,
        __sizePadding: 9,
        __height: 150,
        __detailContent: '<span>loading...</span>',
      };
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(itemMock);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(123).mockReturnValueOnce(123);
      const loadingTemplate = () => '<span>loading...</span>';
      const deleteItemSpy = vi.spyOn(dataviewStub, 'deleteItem');
      const insertItemSpy = vi.spyOn(dataviewStub, 'insertItem');
      const saveDetailSpy = vi.spyOn(plugin, 'saveDetailView');
      vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(cellDetailViewElm, 'scrollHeight', { writable: true, configurable: true, value: 180 });
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        minRowBuffer: 1,
        rowDetailView: {
          process: mockProcess,
          preTemplate: loadingTemplate,
          panelRows: 5,
          useRowClick: true,
          singleRowExpand: true,
          loadOnce: true,
          maxRows: 7,
        } as any,
      });
      plugin.init(gridStub);
      cellDetailViewElm.style.top = '125px';
      cellDetailViewElm.style.pointerEvents = 'auto';
      plugin.resizeDetailView(itemMock);

      expect(cellDetailViewElm.style.top).toBe('125px');
      expect(cellDetailViewElm.style.pointerEvents).toBe('auto');
      expect(cellDetailViewElm.style.height).toBe('175px');
      expect(saveDetailSpy).toHaveBeenCalledWith({
        firstName: 'John',
        id: 123,
        lastName: 'Doe',
        __collapsed: true,
        __detailContent: '',
        __detailViewLoaded: true,
        __height: 180,
        __sizePadding: 7,
      });
      expect(insertItemSpy).toHaveBeenCalledWith(
        4,
        expect.objectContaining({
          id: '123.1',
          __collapsed: true,
          __isPadding: true,
          __offset: 1,
          __parent: {
            __collapsed: true,
            __detailContent: '',
            __detailViewLoaded: true,
            __height: 180,
            __sizePadding: 7,
            firstName: 'John',
            id: 123,
            lastName: 'Doe',
          },
        })
      );
      expect(insertItemSpy).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          id: '123.2',
          __collapsed: true,
          __isPadding: true,
          __offset: 2,
          __parent: {
            __collapsed: true,
            __detailContent: '',
            __detailViewLoaded: true,
            __height: 180,
            __sizePadding: 7,
            firstName: 'John',
            id: 123,
            lastName: 'Doe',
          },
        })
      );
      expect(deleteItemSpy).toHaveBeenCalledTimes(9);

      // collapse & expand tests
      const collapseDetailSpy = vi.spyOn(plugin, 'collapseDetailView');
      plugin.expandDetailView(itemMock.id);
      plugin.collapseAll();

      expect(collapseDetailSpy).toHaveBeenCalled();
      expect(mockProcess).toHaveBeenCalledWith({
        __collapsed: true,
        __detailContent: '',
        __detailViewLoaded: false,
        __height: 150,
        __sizePadding: 0,
        firstName: 'John',
        id: 123,
        lastName: 'Doe',
      });
    });

    it('should call "resizeDetailView" and then calculate out of range detail views when calling on scroll', () => {
      const mockProcess = vi.fn();
      const itemMock = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: true,
        __detailViewLoaded: true,
        __sizePadding: 1,
        __height: 150,
        __detailContent: '<span>loading...</span>',
      };
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(itemMock);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(123).mockReturnValueOnce(123);
      const loadingTemplate = () => '<span>loading...</span>';
      vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(2);
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 20, bottom: 50, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(cellDetailViewElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        minRowBuffer: 1,
        rowDetailView: {
          process: mockProcess,
          preTemplate: loadingTemplate,
          panelRows: 5,
          useRowClick: true,
          saveDetailViewOnScroll: true,
          singleRowExpand: true,
          loadOnce: true,
        } as any,
      });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock.id);

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);

      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John',
        id: 123,
        lastName: 'Doe',
        __collapsed: false,
        __detailContent: '<span>loading...</span>',
        __detailViewLoaded: false,
        __height: 150,
        __sizePadding: 6,
      });
    });

    it('should call "resizeDetailView" and then calculate out of range detail views when calling on scroll (2)', () => {
      const mockProcess = vi.fn();
      const itemMock = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: true,
        __detailViewLoaded: true,
        __sizePadding: 1,
        __height: 150,
        __detailContent: '<span>loading...</span>',
      };
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(itemMock);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(1).mockReturnValueOnce(1);
      const loadingTemplate = () => '<span>loading...</span>';
      vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(50);
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 20, bottom: 44, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(cellDetailViewElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: {
          process: mockProcess,
          preTemplate: loadingTemplate,
          panelRows: 5,
          useRowClick: true,
          saveDetailViewOnScroll: true,
          singleRowExpand: true,
          loadOnce: true,
        } as any,
      });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock.id);

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 35, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      // plugin.lastRange = { bottom: 18, top: 30 };
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 0, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      plugin.recalculateOutOfRangeViews();

      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John',
        id: 123,
        lastName: 'Doe',
        __collapsed: false,
        __detailContent: '<span>loading...</span>',
        __detailViewLoaded: false,
        __height: 150,
        __sizePadding: 6,
      });
    });

    it('should call "onScroll" and expect "onRowBackToViewportRange" and "onRowOutOfViewportRange" to be triggered when row is found out and back to viewport range', () => {
      const mockProcess = vi.fn();
      const itemMock = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: true,
        __detailViewLoaded: true,
        __sizePadding: 1,
        __height: 150,
        __detailContent: '<span>loading...</span>',
      };
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(itemMock);
      const loadingTemplate = () => '<span>loading...</span>';
      vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      vi.spyOn(dataviewStub, 'getRowById')
        .mockReturnValueOnce(123)
        .mockReturnValueOnce(123)
        .mockReturnValueOnce(123)
        .mockReturnValueOnce(123)
        .mockReturnValueOnce(123);
      vi.spyOn(gridStub, 'getRowCache')
        .mockReturnValue({
          121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          122: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          123: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          124: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          125: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        })
        .mockReturnValueOnce({
          121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        });
      vi.spyOn(gridStub, 'getRenderedRange')
        .mockReturnValue({ top: 120, bottom: 150, left: 33, right: 18 } as any)
        .mockReturnValueOnce({ top: 140, bottom: 150, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(cellDetailViewElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: {
          process: mockProcess,
          preTemplate: loadingTemplate,
          panelRows: 5,
          useRowClick: true,
          saveDetailViewOnScroll: true,
          singleRowExpand: true,
          loadOnce: true,
        } as any,
      });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock.id);
      plugin.rowIdsOutOfViewport = [0, 2];

      const onRowBackToViewportSpy = vi.spyOn(plugin.onRowBackToViewportRange, 'notify');
      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 330, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 35, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 0, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);

      vi.advanceTimersByTime(2);

      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John',
        id: 123,
        lastName: 'Doe',
        __collapsed: false,
        __detailContent: '<span>loading...</span>',
        __detailViewLoaded: false,
        __height: 150,
        __sizePadding: 6,
      });
      expect(onRowBackToViewportSpy).toHaveBeenCalled();

      // -- out of range
      const onRowBackViewportSpy = vi.spyOn(plugin.onRowBackToViewportRange, 'notify');
      const onRowOutOfViewportSpy = vi.spyOn(plugin.onRowOutOfViewportRange, 'notify');
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(124).mockReturnValueOnce(123);
      vi.advanceTimersByTime(102);
      plugin.collapseDetailView(1);

      vi.spyOn(gridStub, 'getRowCache')
        .mockReturnValue({
          121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          122: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          124: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          125: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        })
        .mockReturnValueOnce({
          121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        });
      vi.spyOn(gridStub, 'getRenderedRange')
        .mockReturnValue({ top: 120, bottom: 150, left: 33, right: 18 } as any)
        .mockReturnValueOnce({ top: 140, bottom: 150, left: 33, right: 18 } as any);

      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 53, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);

      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 125, bottom: 150, left: 33, right: 18 } as any);
      plugin.expandDetailView(123);
      plugin.addonOptions.singleRowExpand = false;
      vi.spyOn(dataviewStub, 'getItemByIdx').mockReturnValue(itemMock);
      gridStub.onBeforeRemoveCachedRow.notify({ row: 123, grid: gridStub }, eventData as any, gridStub);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 0, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);
      plugin.expandDetailView(123);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 0, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValueOnce({ top: 114, bottom: 116, left: 33, right: 18 } as any);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(98);
      expect(onRowBackViewportSpy).toHaveBeenCalled();
      gridStub.onBeforeRemoveCachedRow.notify({ row: 99, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 125, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);
      expect(onRowOutOfViewportSpy).toHaveBeenCalled();

      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValueOnce({ top: 114, bottom: 116, left: 33, right: 18 } as any);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(99);
      gridStub.onBeforeRemoveCachedRow.notify({ row: 99, grid: gridStub }, eventData as any, gridStub);
      expect(onRowBackViewportSpy).toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 125, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);
      expect(onRowOutOfViewportSpy).toHaveBeenCalled();

      plugin.resetRenderedRows();
    });

    it('should hide a rendered Row Detail and trigger "onRowOutOfViewportRange" when its parent row gets filtered out of the DataView', () => {
      const mockProcess = vi.fn();
      const itemMock = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: true,
        __detailViewLoaded: true,
        __sizePadding: 1,
        __height: 150,
        __detailContent: '<span>loading...</span>',
      };
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(itemMock);
      vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(2);
      vi.spyOn(gridStub, 'getRowCache').mockReturnValue({
        2: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      });
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 0, bottom: 10, left: 33, right: 18 } as any);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { process: mockProcess, preTemplate: () => '<span>loading...</span>', panelRows: 5 } as any,
      });
      plugin.init(gridStub);
      plugin.expandDetailView(itemMock.id);
      plugin.recalculateOutOfRangeViews(); // renders the Row Detail while the parent row is part of the (filtered) DataView

      const onRowOutOfViewportSpy = vi.spyOn(plugin.onRowOutOfViewportRange, 'notify');

      // simulate the parent row being filtered out of the DataView
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(undefined as any);
      dataviewStub.onRowCountChanged.notify({} as any);

      expect(onRowOutOfViewportSpy).toHaveBeenCalled();
      expect(plugin.getExpandedRowIds()).toContain(itemMock.id); // stays expanded so it can reopen once the filter is cleared
    });

    it('should call "recalculateOutOfRangeViews" directly and remove a rendered Row Detail whose parent row no longer resolves to a row index', () => {
      const mockProcess = vi.fn();
      const itemMock = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: true,
        __detailViewLoaded: true,
        __sizePadding: 1,
        __height: 150,
        __detailContent: '<span>loading...</span>',
      };
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(itemMock);
      vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(2);
      vi.spyOn(gridStub, 'getRowCache').mockReturnValue({
        2: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      });
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 0, bottom: 10, left: 33, right: 18 } as any);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { process: mockProcess, preTemplate: () => '<span>loading...</span>', panelRows: 5 } as any,
      });
      plugin.init(gridStub);
      plugin.expandDetailView(itemMock.id);
      plugin.recalculateOutOfRangeViews(); // renders the Row Detail, adding it to the rendered viewport ids

      const onRowOutOfViewportSpy = vi.spyOn(plugin.onRowOutOfViewportRange, 'notify');

      // parent row no longer resolves to a row index, bypassing the "onRowCountChanged" hide step entirely
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(undefined as any);
      plugin.recalculateOutOfRangeViews();

      expect(onRowOutOfViewportSpy).toHaveBeenCalled();
    });

    it('should call "onScroll" and expect "onRowBackToViewportRange" be triggered when row is found out of range and direction is DOWN', () => {
      const mockProcess = vi.fn();
      const itemMock = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: true,
        __detailViewLoaded: true,
        __sizePadding: 1,
        __height: 150,
        __detailContent: '<span>loading...</span>',
      };
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(itemMock);
      const loadingTemplate = () => '<span>loading...</span>';
      vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(122);
      vi.spyOn(gridStub, 'getRowCache')
        .mockReturnValue({
          121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          122: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          123: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          124: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
          125: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        })
        .mockReturnValueOnce({
          121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        });
      vi.spyOn(gridStub, 'getRenderedRange')
        .mockReturnValue({ top: 120, bottom: 126, left: 33, right: 18 } as any)
        .mockReturnValueOnce({ top: 140, bottom: 150, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(cellDetailViewElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: {
          process: mockProcess,
          preTemplate: loadingTemplate,
          panelRows: 5,
          useRowClick: true,
          saveDetailViewOnScroll: true,
          singleRowExpand: true,
          loadOnce: true,
        } as any,
      });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock.id);
      plugin.rowIdsOutOfViewport = [123];

      const onRowBackToViewportSpy = vi.spyOn(plugin.onRowBackToViewportRange, 'notify');
      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 35, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 0, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);

      vi.advanceTimersByTime(101);

      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John',
        id: 123,
        lastName: 'Doe',
        __collapsed: false,
        __detailContent: '<span>loading...</span>',
        __detailViewLoaded: false,
        __height: 150,
        __sizePadding: 6,
      });
      expect(onRowBackToViewportSpy).toHaveBeenCalled();
    });

    it('should notify when the last detail row reaches the top of the viewport', () => {
      const item = { id: 123, __collapsed: false, __sizePadding: 5, __detailContent: '<span>Detail</span>' };
      let visibleTop = 129;
      const viewport = document.createElement('div');
      const canvas = createDomElement('div', { className: 'grid-canvas' });
      viewport.appendChild(canvas);
      divContainer.appendChild(viewport);
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(item);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(123);
      vi.spyOn(gridStub, 'getRowCache').mockReturnValue({ 123: { rowNode: [document.createElement('div')] } } as any);
      vi.spyOn(gridStub, 'getRenderedRange').mockImplementation(() => ({ top: visibleTop, bottom: 160, leftPx: 0, rightPx: 100 }));
      vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewport);
      vi.spyOn(gridStub, 'getRowTop').mockReturnValue(3075);
      vi.spyOn(gridStub, 'getRowHeight').mockReturnValue(25);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { panelRows: 5 } as any,
      });
      plugin.init(gridStub);
      (plugin as any)._expandedRowIds.add(item.id);
      const onRowBackToViewportSpy = vi.spyOn(plugin.onRowBackToViewportRange, 'notify');

      plugin.recalculateOutOfRangeViews();
      expect(onRowBackToViewportSpy).not.toHaveBeenCalled();

      // Parent row 123 plus five detail rows ends exactly at the viewport boundary.
      visibleTop = 128;
      plugin.recalculateOutOfRangeViews();

      expect(onRowBackToViewportSpy).toHaveBeenCalledWith(expect.objectContaining({ rowId: 123, rowIndex: 123 }), null, plugin);
      expect(canvas.querySelector(':scope > .row-detail-123')).toBeTruthy();
    });

    it('should call "resizeDetailView" and then calculate out of range detail views when calling on scroll and call "notifyOutOfViewport" when row is out of visibility', () => {
      const mockProcess = vi.fn();
      const itemMock = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: true,
        __detailViewLoaded: true,
        __sizePadding: 1,
        __height: 150,
        __detailContent: '<span>loading...</span>',
      };
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(itemMock);
      const loadingTemplate = () => '<span>loading...</span>';
      vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(2);
      vi.spyOn(gridStub, 'getRowCache').mockReturnValueOnce({
        0: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        1: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        2: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        3: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      });
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 20, bottom: 50, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(cellDetailViewElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: {
          process: mockProcess,
          preTemplate: loadingTemplate,
          panelRows: 5,
          useSimpleViewportCalc: true,
          useRowClick: true,
          saveDetailViewOnScroll: true,
          singleRowExpand: true,
          loadOnce: true,
        } as any,
      });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock.id);
      plugin.rowIdsOutOfViewport = [123];
      gridStub.onRendered.notify({ endRow: 15, startRow: 5, grid: gridStub }, new SlickEventData(), gridStub);

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);

      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John',
        id: 123,
        lastName: 'Doe',
        __collapsed: false,
        __detailContent: '<span>loading...</span>',
        __detailViewLoaded: false,
        __height: 150,
        __sizePadding: 6,
      });
      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John',
        id: 123,
        lastName: 'Doe',
        __collapsed: false,
        __detailContent: '<span>loading...</span>',
        __detailViewLoaded: false,
        __height: 150,
        __sizePadding: 6,
      });
    });
  });

  describe('with data Grouping', () => {
    const mockItem = { id: 123, firstName: 'John', lastName: 'Doe' };

    beforeEach(() => {
      const mockProcess = vi.fn();
      vi.spyOn(dataviewStub, 'getItemsByGroupingKey').mockReturnValue([mockItem]);
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(mockItem);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(1).mockReturnValueOnce(1);
      const loadingTemplate = () => `<span>loading...</span>`;
      vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
      vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      vi.spyOn(dataviewStub, 'getIdxById').mockReturnValue(0);
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useRowClick: true, singleRowExpand: true, loadOnce: true } as any,
      });
    });

    it('should notify out of viewport when "onGroupCollapsed" and then "onGroupExpanded" events are triggered for a single group', () => {
      const viewport = createDomElement('div');
      viewport.appendChild(createDomElement('div', { className: 'grid-canvas' }));
      divContainer.appendChild(viewport);
      vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewport);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(1);
      const onRowBackViewportSpy = vi.spyOn(plugin.onRowBackToViewportRange, 'notify');
      const onRowOutOfViewportSpy = vi.spyOn(plugin.onRowOutOfViewportRange, 'notify');
      plugin.init(gridStub);
      (plugin as any)._expandedRowIds.add(mockItem.id);
      (plugin as any)._renderedViewportRowIds.add(mockItem.id);
      (plugin as any).renderOverlayPanels();

      dataviewStub.onGroupCollapsed.notify({ level: 0, groupingKey: '1' }, new SlickEventData(), gridStub);
      expect(onRowOutOfViewportSpy).toHaveBeenCalled();
      expect(viewport.querySelector('.slick-row-detail-container')).toBeNull();

      dataviewStub.onGroupExpanded.notify({ level: 0, groupingKey: '1' }, new SlickEventData(), gridStub);
      expect(onRowBackViewportSpy).toHaveBeenCalled();
      expect(viewport.querySelector('.slick-row-detail-container')).toBeTruthy();
    });

    it('should notify out of viewport when "onGroupCollapsed" and then "onGroupExpanded" events are triggered for all groups', () => {
      const lifecycle: string[] = [];
      const onRowOutOfViewportSpy = vi.spyOn(plugin.onRowOutOfViewportRange, 'notify');
      const recalOutOfRangeViewSpy = vi.spyOn(plugin, 'recalculateOutOfRangeViews');
      plugin.onBeforeRowOutOfViewportRange.subscribe(() => lifecycle.push('before'));
      plugin.onRowOutOfViewportRange.subscribe(() => lifecycle.push('out'));
      plugin.init(gridStub);
      (plugin as any)._expandedRowIds.add(mockItem.id);
      (plugin as any)._renderedViewportRowIds.add(mockItem.id);

      dataviewStub.onGroupCollapsed.notify({ level: 0, groupingKey: null }, new SlickEventData(), gridStub);
      expect(onRowOutOfViewportSpy).toHaveBeenCalled();
      expect(lifecycle).toEqual(['before', 'out']);
      expect(plugin.getExpandedRowIds()).toEqual([]);

      dataviewStub.onGroupExpanded.notify({ level: 0, groupingKey: null }, new SlickEventData(), gridStub);
      expect(recalOutOfRangeViewSpy).toHaveBeenCalled();
      expect(plugin.getExpandedRowIds()).toEqual([mockItem.id]);
    });
  });

  describe('detailSelectionFormatter', () => {
    it('should execute formatter and expect it to return empty string when "checkExpandableOverride" is returning False', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe' };
      plugin.init(gridStub);
      plugin.expandableOverride(() => false);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect(formattedVal).toBe('');
    });

    it('should execute formatter and expect it to return a div with "expand" css class', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe' };
      plugin.init(gridStub);
      plugin.setOptions({ collapsedClass: 'some-collapsed' });
      plugin.expandableOverride(() => true);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect((formattedVal as HTMLElement).outerHTML).toBe(`<div class="sgi detailView-toggle expand some-collapsed" aria-expanded="false"></div>`);
    });

    it('should execute formatter and expect it to return empty string and render nothing when isPadding is True', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true, __isPadding: true };
      plugin.init(gridStub);
      plugin.setOptions({ collapsedClass: 'some-collapsed' });
      plugin.expandableOverride(() => true);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect(formattedVal).toBe(``);
    });

    it.each([
      ['HTML string', '<div>Loading...</div>'],
      ['HTML Element', createDomElement('div', { textContent: 'Loading...' })],
    ])('should render detail content from an %s in the overlay', (_type, detailContent) => {
      const mockItem = {
        id: 123,
        __collapsed: false,
        __isPadding: false,
        __sizePadding: 5,
        __detailContent: detailContent,
      };
      const viewport = document.createElement('div');
      const canvas = createDomElement('div', { className: 'grid-canvas' });
      viewport.appendChild(canvas);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { panelRows: 2, columnId: '_detail_selector' } as any,
      });
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(0);
      vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewport);
      vi.spyOn(gridStub, 'getRowCache').mockReturnValue({ 0: { rowNode: [document.createElement('div')] } } as any);
      vi.spyOn(gridStub, 'getRowTop').mockReturnValue(100);
      vi.spyOn(gridStub, 'getRowHeight').mockReturnValue(25);
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(mockItem);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      plugin.init(gridStub);
      plugin.setOptions({ expandedClass: 'some-expanded', maxRows: 2 });
      plugin.expandableOverride(() => true);

      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub) as FormatterResultWithHtml;
      expect((formattedVal.html as HTMLElement).outerHTML).toBe(`<div class="sgi detailView-toggle collapse some-expanded" aria-expanded="true"></div>`);
      expect(formattedVal.insertElementAfterTarget).toBeUndefined();
      (plugin as any)._expandedRowIds.add(mockItem.id);
      (plugin as any)._renderedViewportRowIds.add(mockItem.id);
      gridStub.onRendered.notify({ startRow: 0, endRow: 0, grid: gridStub });

      const panel = canvas.querySelector<HTMLElement>(':scope > .slick-row-detail-container')!;
      expect(panel.style.top).toBe('100px');
      expect(panel.style.height).toBe('125px');
      expect(panel.style.pointerEvents).toBe('auto');
      expect(panel.innerHTML).toBe('<div>Loading...</div>');
      expect(panel.className).toBe('slick-row-detail-container row-detail-123');
      expect(panel.children).toHaveLength(1);
      expect(panel.firstElementChild?.textContent).toBe('Loading...');
      expect(mockItem.__sizePadding).toBe(5);
    });

    it('should render expanded Row Detail directly in the canvas', () => {
      const mockItem = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: false,
        __isPadding: false,
        __sizePadding: 2,
        __detailContent: '<div>Loading...</div>',
      };
      const viewport = document.createElement('div');
      const canvas = document.createElement('div');
      canvas.className = 'grid-canvas';
      viewport.appendChild(canvas);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { panelRows: 2, columnId: '_detail_selector' } as any,
      });
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(0);
      vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewport);
      vi.spyOn(gridStub, 'getRowCache').mockReturnValue({ 0: { rowNode: [document.createElement('div')] } } as any);
      vi.spyOn(gridStub, 'getRowTop').mockReturnValue(100);
      vi.spyOn(gridStub, 'getRowHeight').mockReturnValue(25);
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(mockItem);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);

      plugin.init(gridStub);
      (plugin as any)._expandedRowIds.add(mockItem.id);
      (plugin as any)._renderedViewportRowIds.add(mockItem.id);
      (plugin as any).renderOverlayPanels();

      const panel = canvas.querySelector(':scope > .slick-row-detail-container') as HTMLElement;
      expect(panel).toBeTruthy();
      expect(panel.parentElement).toBe(canvas);
      expect(canvas.querySelector('.slick-row-detail-overlay')).toBeNull();
      expect(panel.style.top).toBe('100px');
      expect(
        (plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub) as FormatterResultWithHtml).insertElementAfterTarget
      ).toBeUndefined();

      // A redraw can reset viewport bookkeeping before framework adapters remount nested views.
      (plugin as any).resetRenderedRows();
      expect(canvas.querySelector(':scope > .slick-row-detail-container')).toBeTruthy();
    });

    it('should mount panels directly in the canvas without rendering options', () => {
      const mockItem = {
        id: 123,
        __collapsed: false,
        __isPadding: false,
        __sizePadding: 2,
        __detailContent: '<div>Loading...</div>',
      };
      const viewport = document.createElement('div');
      const canvas = document.createElement('div');
      canvas.className = 'grid-canvas';
      viewport.appendChild(canvas);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { panelRows: 2, columnId: '_detail_selector' } as any,
      });
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(0);
      vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewport);
      vi.spyOn(gridStub, 'getRowCache').mockReturnValue({ 0: { rowNode: [document.createElement('div')] } } as any);
      vi.spyOn(gridStub, 'getRowTop').mockReturnValue(100);
      vi.spyOn(gridStub, 'getRowHeight').mockReturnValue(25);
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(mockItem);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);

      plugin.init(gridStub);
      (plugin as any)._expandedRowIds.add(mockItem.id);
      (plugin as any)._renderedViewportRowIds.add(mockItem.id);
      (plugin as any).renderOverlayPanels();

      expect(canvas.querySelector(':scope > .slick-row-detail-container')).toBeTruthy();
      expect(
        (plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub) as FormatterResultWithHtml).insertElementAfterTarget
      ).toBeUndefined();
    });

    it.each([false, true])('should preserve panel identity across viewport changes only when keepComponentAlive is %s', (keepComponentAlive) => {
      const item = { id: 123, __sizePadding: 2, __detailContent: '<input value="Assignee">' };
      const viewport = document.createElement('div');
      const canvas = createDomElement('div', { className: 'grid-canvas' });
      viewport.appendChild(canvas);
      divContainer.appendChild(viewport);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { panelRows: 2, keepComponentAlive } as any,
      });
      vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewport);
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(item);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      plugin.init(gridStub);
      (plugin as any)._expandedRowIds.add(item.id);
      (plugin as any).notifyViewportChange(item, 'add', false);
      (plugin as any).renderOverlayPanels();
      const panel = canvas.querySelector<HTMLElement>('.slick-row-detail-container')!;
      const input = panel.querySelector('input')!;
      input.value = 'Edited assignee';
      panel.scrollTop = 20;

      (plugin as any).notifyViewportChange(item, 'remove', false);

      expect(panel.isConnected).toBe(false);
      expect((plugin as any)._overlayPanels.has(item.id)).toBe(keepComponentAlive);

      (plugin as any).notifyViewportChange(item, 'add');

      const restoredPanel = canvas.querySelector<HTMLElement>('.slick-row-detail-container')!;
      expect(restoredPanel === panel).toBe(keepComponentAlive);
      expect(restoredPanel.querySelector('input')?.value).toBe(keepComponentAlive ? 'Edited assignee' : 'Assignee');
      expect(restoredPanel.scrollTop).toBe(keepComponentAlive ? 20 : 0);
      plugin.collapseDetailView(item.id);
      expect(canvas.querySelector('.slick-row-detail-container')).toBeNull();
      expect((plugin as any)._overlayPanels.has(item.id)).toBe(false);
      (plugin as any).notifyViewportChange(item, 'remove', false);
    });

    it('should cover overlay panel viewport and reattachment branches', () => {
      const mockItem = {
        id: 123,
        __collapsed: false,
        __isPadding: false,
        __sizePadding: 2,
        __detailContent: '<div>Loading...</div>',
      };
      const viewport = document.createElement('div');
      const canvas = document.createElement('div');
      canvas.className = 'grid-canvas';
      viewport.appendChild(canvas);
      divContainer.appendChild(viewport);

      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { panelRows: 2, columnId: '_detail_selector' } as any,
      });
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(0);
      vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewport);
      vi.spyOn(gridStub, 'getRowTop').mockReturnValue(100);
      vi.spyOn(gridStub, 'getRowHeight').mockReturnValue(25);
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValue(mockItem);
      vi.spyOn(dataviewStub, 'getRowById').mockReturnValue(0);
      const rowBackSpy = vi.spyOn(plugin.onRowBackToViewportRange, 'notify');

      plugin.init(gridStub);
      (plugin as any)._expandedRowIds.add(mockItem.id);
      (plugin as any)._renderedViewportRowIds.add(mockItem.id);
      (plugin as any)._rowIdsOutOfViewport.add(mockItem.id);
      (plugin as any).renderOverlayPanels();
      expect(rowBackSpy).toHaveBeenCalled();

      // Reparent an existing panel when its canvas changes.
      const panel = (plugin as any)._overlayPanels.get(mockItem.id) as HTMLElement;
      panel.remove();
      const secondCanvas = document.createElement('div');
      secondCanvas.className = 'grid-canvas';
      const secondViewport = document.createElement('div');
      secondViewport.appendChild(secondCanvas);
      vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(secondViewport);
      (plugin as any).renderOverlayPanels();
      expect(panel.parentElement).toBe(secondCanvas);

      // Exercise the early-return paths for rows which are no longer rendered or available.
      (plugin as any)._renderedViewportRowIds.clear();
      (plugin as any).renderOverlayPanels();
      (plugin as any)._renderedViewportRowIds.add(mockItem.id);
      vi.spyOn(dataviewStub, 'getItemById').mockReturnValueOnce(undefined).mockReturnValueOnce(mockItem);
      vi.spyOn(gridStub, 'getViewportNode').mockReturnValueOnce(secondViewport).mockReturnValueOnce(document.createElement('div'));
      (plugin as any).renderOverlayPanels();
      (plugin as any).renderOverlayPanels();
    });

    it('should return expanded item ids for a grouping key', () => {
      const groupedItems = [{ id: 1 }, { id: '1.1', __isPadding: true }, { id: 2 }];
      vi.spyOn(dataviewStub, 'getItemsByGroupingKey').mockReturnValue(groupedItems as any);
      plugin.init(gridStub);

      expect((plugin as any).getGroupItemIds('group-1')).toEqual([1, 2]);
    });
  });

  describe('handleKeyDown - keyboard a11y handler', () => {
    let preventDefaultSpy: ReturnType<typeof vi.spyOn>;
    let stopPropagationSpy: ReturnType<typeof vi.spyOn>;
    let toggleRowSelectionSpy: ReturnType<typeof vi.spyOn>;
    let keyDownEvent: Event;
    const detailColumn = { id: '_detail_selector', field: '_detail_selector' };
    const mockActiveCell = { row: 0, cell: 0 };

    beforeEach(() => {
      vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(mockActiveCell);
      vi.spyOn(gridStub, 'getEditorLock').mockReturnValue({ isActive: () => false } as any);
      vi.spyOn(gridStub, 'getColumnByIdx').mockReturnValue(detailColumn as any);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock); // reset to defaults (no useRowClick)

      keyDownEvent = new Event('keydown');
      Object.defineProperty(keyDownEvent, 'key', { writable: true, configurable: true, value: ' ' });
      Object.defineProperty(keyDownEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
      Object.defineProperty(keyDownEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
      preventDefaultSpy = vi.spyOn(keyDownEvent, 'preventDefault');
      stopPropagationSpy = vi.spyOn(keyDownEvent, 'stopImmediatePropagation');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should toggle (expand) a collapsed row with Space key', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      toggleRowSelectionSpy = vi.spyOn(plugin as any, 'toggleRowSelection').mockImplementation(vi.fn());
      plugin.init(gridStub);

      gridStub.onKeyDown.notify({ row: 0, cell: 0, grid: gridStub }, keyDownEvent);

      expect(toggleRowSelectionSpy).toHaveBeenCalledWith(0, mockItem);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should expand a collapsed row with ArrowRight key', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      toggleRowSelectionSpy = vi.spyOn(plugin as any, 'toggleRowSelection').mockImplementation(vi.fn());
      Object.defineProperty(keyDownEvent, 'key', { writable: true, configurable: true, value: 'ArrowRight' });
      plugin.init(gridStub);

      gridStub.onKeyDown.notify({ row: 0, cell: 0, grid: gridStub }, keyDownEvent);

      expect(toggleRowSelectionSpy).toHaveBeenCalledWith(0, mockItem);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should NOT expand an already expanded row with ArrowRight key', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: false };
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      toggleRowSelectionSpy = vi.spyOn(plugin as any, 'toggleRowSelection');
      Object.defineProperty(keyDownEvent, 'key', { writable: true, configurable: true, value: 'ArrowRight' });
      plugin.init(gridStub);

      gridStub.onKeyDown.notify({ row: 0, cell: 0, grid: gridStub }, keyDownEvent);

      expect(toggleRowSelectionSpy).not.toHaveBeenCalled();
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(stopPropagationSpy).not.toHaveBeenCalled();
    });

    it('should collapse an expanded row with ArrowLeft key', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: false };
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      toggleRowSelectionSpy = vi.spyOn(plugin as any, 'toggleRowSelection').mockImplementation(vi.fn());
      Object.defineProperty(keyDownEvent, 'key', { writable: true, configurable: true, value: 'ArrowLeft' });
      plugin.init(gridStub);

      gridStub.onKeyDown.notify({ row: 0, cell: 0, grid: gridStub }, keyDownEvent);

      expect(toggleRowSelectionSpy).toHaveBeenCalledWith(0, mockItem);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should NOT collapse an already collapsed row with ArrowLeft key', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      toggleRowSelectionSpy = vi.spyOn(plugin as any, 'toggleRowSelection');
      Object.defineProperty(keyDownEvent, 'key', { writable: true, configurable: true, value: 'ArrowLeft' });
      plugin.init(gridStub);

      gridStub.onKeyDown.notify({ row: 0, cell: 0, grid: gridStub }, keyDownEvent);

      expect(toggleRowSelectionSpy).not.toHaveBeenCalled();
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(stopPropagationSpy).not.toHaveBeenCalled();
    });

    it('should not toggle when inline editor is active', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      vi.spyOn(gridStub, 'getEditorLock').mockReturnValue({ isActive: () => true } as any);
      toggleRowSelectionSpy = vi.spyOn(plugin as any, 'toggleRowSelection');
      plugin.init(gridStub);

      gridStub.onKeyDown.notify({ row: 0, cell: 0, grid: gridStub }, keyDownEvent);

      expect(toggleRowSelectionSpy).not.toHaveBeenCalled();
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(stopPropagationSpy).not.toHaveBeenCalled();
    });

    it('should not toggle when focused on a non-toggle column (without useRowClick)', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      (gridStub.getColumnByIdx as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'firstName' });
      toggleRowSelectionSpy = vi.spyOn(plugin as any, 'toggleRowSelection');
      plugin.init(gridStub);

      gridStub.onKeyDown.notify({ row: 0, cell: 1, grid: gridStub }, keyDownEvent);

      expect(toggleRowSelectionSpy).not.toHaveBeenCalled();
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should toggle from any column when useRowClick is enabled', () => {
      const mockProcess = vi.fn();
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      (gridStub.getColumnByIdx as ReturnType<typeof vi.fn>).mockReturnValue({ id: 'firstName' });
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({
        ...gridOptionsMock,
        rowDetailView: { process: mockProcess, columnIndexPosition: 0, useRowClick: true, panelRows: 2 } as any,
      });
      toggleRowSelectionSpy = vi.spyOn(plugin as any, 'toggleRowSelection').mockImplementation(vi.fn());
      plugin.init(gridStub);

      gridStub.onKeyDown.notify({ row: 0, cell: 1, grid: gridStub }, keyDownEvent);

      expect(toggleRowSelectionSpy).toHaveBeenCalledWith(0, mockItem);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should not toggle when checkExpandableOverride returns false', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockItem);
      toggleRowSelectionSpy = vi.spyOn(plugin as any, 'toggleRowSelection');
      plugin.init(gridStub);
      plugin.expandableOverride(() => false);

      gridStub.onKeyDown.notify({ row: 0, cell: 0, grid: gridStub }, keyDownEvent);

      expect(toggleRowSelectionSpy).not.toHaveBeenCalled();
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });
});
