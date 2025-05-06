import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type Column,
  type FormatterResultWithHtml,
  type GridOption,
  type SlickDataView,
  SlickEvent,
  SlickEventData,
  type SlickGrid,
  createDomElement,
} from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';

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
  getIdxById: vi.fn(),
  getRowById: vi.fn(),
  insertItem: vi.fn(),
  updateItem: vi.fn(),
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
  getColumns: vi.fn(),
  getDataItem: vi.fn(),
  getData: () => dataviewStub,
  getEditorLock: () => getEditorLockMock,
  getOptions: () => gridOptionsMock,
  getUID: () => GRID_UID,
  getRenderedRange: vi.fn(),
  getRowCache: vi.fn(),
  invalidateRows: vi.fn(),
  registerPlugin: vi.fn(),
  render: vi.fn(),
  sanitizeHtmlString: (s) => s,
  updateRowCount: vi.fn(),
  onBeforeEditCell: new SlickEvent(),
  onBeforeRemoveCachedRow: new SlickEvent(),
  onClick: new SlickEvent(),
  onRendered: new SlickEvent(),
  onScroll: new SlickEvent(),
  onSort: new SlickEvent(),
} as unknown as SlickGrid;

let mockColumns: Column[];

describe('SlickRowDetailView plugin', () => {
  let eventPubSubService: EventPubSubService;
  const divContainer = document.createElement('div');
  let plugin: SlickRowDetailView;
  const gridContainerElm = document.createElement('div');
  gridContainerElm.className = GRID_UID;

  beforeEach(() => {
    mockColumns = [
      { id: 'firstName', name: 'First Name', field: 'firstName', width: 100 },
      { id: 'lasstName', name: 'Last Name', field: 'lasstName', width: 100 },
    ];
    eventPubSubService = new EventPubSubService();
    plugin = new SlickRowDetailView(eventPubSubService);
    divContainer.className = `slickgrid-container ${GRID_UID}`;
    document.body.appendChild(divContainer);
  });

  afterEach(() => {
    plugin.dispose();
    vi.clearAllMocks();
  });

  it('should create the plugin', () => {
    plugin.init(gridStub);
    expect(plugin).toBeTruthy();
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
      } catch (e) {
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
    vi.spyOn(gridStub, 'getRowCache').mockReturnValueOnce({
      0: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      1: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      2: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      3: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
    });
    const invalidateRowsSpy = vi.spyOn(gridStub, 'invalidateRows');
    const renderSpy = vi.spyOn(gridStub, 'render');
    vi.spyOn(dataviewStub, 'getItemById').mockReturnValueOnce(mockItem);
    vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(1).mockReturnValueOnce(1);
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

  it('should trigger "onAsyncResponse" but throw an error when there is no item provided', () => {
    const consoleSpy = vi.spyOn(global.console, 'error').mockReturnValue();
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const postViewMock = (item) => `<span>Post ${item.id}</span>`;
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
    const postViewMock = (item) => `<span>Post ${item.id}</span>`;
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

  it('should trigger "onAsyncResponse" with Row Detail from post template with HTML Element when no detailView is provided and expect "updateItem" from DataView to be called with new template & data', () => {
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const postViewMock = (item) => createDomElement('span', { textContent: `Post ${item.id}` });
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
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const detailView = `<span>loading...</span>`;

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
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const detailView = `<span>loading...</span>`;

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
    const mockProcess = vi.fn();
    const expandDetailViewSpy = vi.spyOn(plugin, 'expandDetailView');
    const onBeforeSlickEventData = new SlickEventData();
    vi.spyOn(onBeforeSlickEventData, 'getReturnValue').mockReturnValue(false);
    const beforeRowDetailToggleSpy = vi.spyOn(plugin.onBeforeRowDetailToggle, 'notify').mockReturnValueOnce(onBeforeSlickEventData);
    const afterRowDetailToggleSpy = vi.spyOn(plugin.onAfterRowDetailToggle, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
    const detailView = `<span>loading...</span>`;
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
    const mockItem = { id: 1, firstName: 'John', lastName: 'Doe' };
    const mockProcess = vi.fn();
    vi.spyOn(dataviewStub, 'getItemById').mockReturnValueOnce(mockItem);
    vi.spyOn(dataviewStub, 'getRowById').mockReturnValueOnce(1).mockReturnValueOnce(1);

    const expandDetailViewSpy = vi.spyOn(plugin, 'expandDetailView');
    const beforeRowDetailToggleSpy = vi.spyOn(plugin.onBeforeRowDetailToggle, 'notify');
    const afterRowDetailToggleSpy = vi.spyOn(plugin.onAfterRowDetailToggle, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true };
    const detailView = `<span>loading...</span>`;
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
    const updateItemSpy = vi.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = vi.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const beforeRowDetailToggleSpy = vi.spyOn(plugin.onBeforeRowDetailToggle, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const detailView = `<span>loading...</span>`;
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
    const detailView = `<span>loading...</span>`;
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
    let detailViewContainerElm: HTMLDivElement;
    let cellDetailViewElm: HTMLDivElement;
    let innerDetailViewElm: HTMLDivElement;
    beforeEach(() => {
      detailViewContainerElm = document.createElement('div');
      detailViewContainerElm.className = `detailViewContainer_123`;
      cellDetailViewElm = document.createElement('div');
      cellDetailViewElm.className = `cellDetailView_123`;
      innerDetailViewElm = document.createElement('div');
      innerDetailViewElm.className = `innerDetailView_123`;
      detailViewContainerElm.appendChild(innerDetailViewElm);
      cellDetailViewElm.appendChild(detailViewContainerElm);
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
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 180 });
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
      plugin.resizeDetailView(itemMock);

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
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
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
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
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
      vi.spyOn(gridStub, 'getRowCache').mockReturnValue({
        121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        122: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        123: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        124: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        125: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      });
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 120, bottom: 150, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
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
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
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

      vi.spyOn(gridStub, 'getRowCache').mockReturnValue({
        121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        122: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        124: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        125: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      });
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 120, bottom: 150, left: 33, right: 18 } as any);

      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 53, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      vi.advanceTimersByTime(1);

      expect(onRowOutOfViewportSpy).toHaveBeenCalled();

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
      vi.spyOn(gridStub, 'getRowCache').mockReturnValueOnce({
        121: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        122: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        123: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        124: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
        125: { rowNode: [document.createElement('div')], cellColSpans: [], cellNodesByColumnIdx: [], cellRenderQueue: [] },
      });
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 120, bottom: 126, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
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
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 35, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 0, scrollHeight: 10, grid: gridStub }, eventData as any, gridStub);

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
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
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
      expect((formattedVal as HTMLElement).outerHTML).toBe(`<div class="detailView-toggle expand some-collapsed"></div>`);
    });

    it('should execute formatter and expect it to return empty string and render nothing when isPadding is True', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', __collapsed: true, __isPadding: true };
      plugin.init(gridStub);
      plugin.setOptions({ collapsedClass: 'some-collapsed' });
      plugin.expandableOverride(() => true);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect(formattedVal).toBe(``);
    });

    it('should execute formatter and expect it to render detail content from HTML string', () => {
      const mockItem = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: false,
        __isPadding: false,
        __sizePadding: 5,
        __detailContent: `<div>Loading...</div>`,
      };
      plugin.init(gridStub);
      plugin.setOptions({ expandedClass: 'some-expanded', maxRows: 2 });
      plugin.expandableOverride(() => true);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect(((formattedVal as FormatterResultWithHtml).html as HTMLElement).outerHTML).toBe(`<div class="detailView-toggle collapse some-expanded"></div>`);
      expect((formattedVal as FormatterResultWithHtml).insertElementAfterTarget!.outerHTML).toBe(
        `<div class="dynamic-cell-detail cellDetailView_123" style="height: 50px; top: 25px;"><div class="detail-container detailViewContainer_123"><div class="innerDetailView_123"><div>Loading...</div></div></div></div>`
      );
    });

    it('should execute formatter and expect it to render detail content from HTML Element', () => {
      const mockItem = {
        id: 123,
        firstName: 'John',
        lastName: 'Doe',
        __collapsed: false,
        __isPadding: false,
        __sizePadding: 5,
        __detailContent: createDomElement('div', { textContent: 'Loading...' }),
      };
      plugin.init(gridStub);
      plugin.setOptions({ expandedClass: 'some-expanded', maxRows: 2 });
      plugin.expandableOverride(() => true);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect(((formattedVal as FormatterResultWithHtml).html as HTMLElement).outerHTML).toBe(`<div class="detailView-toggle collapse some-expanded"></div>`);
      expect((formattedVal as FormatterResultWithHtml).insertElementAfterTarget!.outerHTML).toBe(
        `<div class="dynamic-cell-detail cellDetailView_123" style="height: 50px; top: 25px;"><div class="detail-container detailViewContainer_123"><div class="innerDetailView_123"><div>Loading...</div></div></div></div>`
      );
    });
  });
});
