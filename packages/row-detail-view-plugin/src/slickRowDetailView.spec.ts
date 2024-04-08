import 'jest-extended';
import {
  type Column,
  type FormatterResultWithHtml,
  type GridOption,
  type SlickDataView,
  SlickEvent,
  SlickEventData,
  type SlickGrid,
  createDomElement
} from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';

import { SlickRowDetailView } from './slickRowDetailView';

const GRID_UID = 'slickgrid12345';
const gridOptionsMock = { enableAutoTooltip: true, rowHeight: 25 } as GridOption;

const dataviewStub = {
  beginUpdate: jest.fn(),
  deleteItem: jest.fn(),
  endUpdate: jest.fn(),
  getIdPropertyName: jest.fn(),
  getItem: jest.fn(),
  getIdxById: jest.fn(),
  getRowById: jest.fn(),
  insertItem: jest.fn(),
  updateItem: jest.fn(),
  onRowsChanged: new SlickEvent(),
  onRowCountChanged: new SlickEvent(),
  onSetItemsCalled: new SlickEvent(),
} as unknown as SlickDataView;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
  isActive: jest.fn(),
};

const gridStub = {
  getCellFromEvent: jest.fn(),
  getCellNode: jest.fn(),
  getColumns: jest.fn(),
  getDataItem: jest.fn(),
  getData: () => dataviewStub,
  getEditorLock: () => getEditorLockMock,
  getOptions: () => gridOptionsMock,
  getUID: () => GRID_UID,
  getRenderedRange: jest.fn(),
  invalidateRows: jest.fn(),
  registerPlugin: jest.fn(),
  render: jest.fn(),
  sanitizeHtmlString: (s) => s,
  updateRowCount: jest.fn(),
  onBeforeEditCell: new SlickEvent(),
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
    jest.clearAllMocks();
  });

  it('should create the plugin', () => {
    plugin.init(gridStub);
    expect(plugin).toBeTruthy();
  });

  it('should be able to change plugin options and "collapseAll" be called when "singleRowExpand" is enabled', () => {
    const collapseAllSpy = jest.spyOn(plugin, 'collapseAll');
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

  it('should throw an error when slick grid object is not provided to the init method', (done) => {
    try {
      plugin.init(null as any);
    } catch (e) {
      expect(e.message).toBe('[Slickgrid-Universal] RowDetailView Plugin requires the Grid instance to be passed as argument to the "init()" method.');
      done();
    }
  });

  it('should create and dispose of the plugin', () => {
    const disposeSpy = jest.spyOn(plugin, 'dispose');
    expect(plugin).toBeTruthy();

    plugin.dispose();

    expect(plugin.eventHandler).toBeTruthy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should collapse all rows when "collapseAllOnSort" is enabled and "onSort" event is triggered', () => {
    const collapseAllSpy = jest.spyOn(plugin, 'collapseAll');
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { collapseAllOnSort: true } as any });

    plugin.init(gridStub);
    eventPubSubService.publish('onSortChanged', {});

    expect(plugin.getExpandedRows()).toEqual([]);
    expect(plugin.getOutOfViewportRows()).toEqual([]);
    expect(collapseAllSpy).toHaveBeenCalled();
  });

  it('should collapse all rows when "onBeforeEditCell" event is triggered', () => {
    const collapseAllSpy = jest.spyOn(plugin, 'collapseAll');
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { collapseAllOnSort: true } as any });

    plugin.init(gridStub);
    gridStub.onBeforeEditCell.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, column: {} as Column, item: {} }, new SlickEventData(), gridStub);

    expect(plugin.getExpandedRows()).toEqual([]);
    expect(plugin.getOutOfViewportRows()).toEqual([]);
    expect(collapseAllSpy).toHaveBeenCalled();
  });

  it('should update grid row count and re-render grid when "onRowCountChanged" event is triggered', () => {
    const updateRowCountSpy = jest.spyOn(gridStub, 'updateRowCount');
    const renderSpy = jest.spyOn(gridStub, 'render');

    plugin.init(gridStub);
    dataviewStub.onRowCountChanged.notify({ previous: 0, current: 1, itemCount: 2, dataView: dataviewStub, callingOnRowsChanged: true }, new SlickEventData(), gridStub);

    expect(plugin.eventHandler).toBeTruthy();
    expect(updateRowCountSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
  });

  it('should invalidate all rows and re-render grid when "onRowsChanged" event is triggered', () => {
    const invalidateRowsSpy = jest.spyOn(gridStub, 'invalidateRows');
    const renderSpy = jest.spyOn(gridStub, 'render');

    plugin.init(gridStub);
    dataviewStub.onRowsChanged.notify({ rows: [1, 3], itemCount: 2, calledOnRowCountChanged: true, dataView: dataviewStub }, new SlickEventData(), gridStub);

    expect(plugin.eventHandler).toBeTruthy();
    expect(invalidateRowsSpy).toHaveBeenCalledWith([1, 3]);
    expect(renderSpy).toHaveBeenCalled();
  });

  it('should use dataview Id when defined in grid options and "onSetItemsCalled" event is triggered from dataview', () => {
    jest.spyOn(dataviewStub, 'getIdPropertyName').mockReturnValue('rowId');

    plugin.init(gridStub);
    dataviewStub.onSetItemsCalled.notify({ idProperty: 'rowId' } as any, new SlickEventData(), gridStub);

    expect(plugin.dataViewIdProperty).toBe('rowId');
  });

  it('should use a simple cache calculate when "useSimpleViewportCalc" is enabled and "onRendered" event is triggered', () => {
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { useSimpleViewportCalc: true } as any });

    plugin.init(gridStub);
    gridStub.onRendered.notify({ endRow: 2, startRow: 0, grid: gridStub }, new SlickEventData(), gridStub);

    expect(plugin.visibleRenderedCellCount).toEqual(2); // end-start => 2-0=2
  });

  it('should throw an error when calling "create" without "rowDetailView" options in grid options', () => {
    expect(() => plugin.create(mockColumns, {})).toThrowError('[Slickgrid-Universal] The Row Detail View requires options to be passed via the "rowDetailView" property of the Grid Options');
  });

  it('should add the Row Detail to the column definitions at index when calling "create" without specifying position', () => {
    const pubSubSpy = jest.spyOn(eventPubSubService, 'publish');
    const processMock = jest.fn();
    const overrideMock = jest.fn();
    const rowDetailColumnMock = {
      id: '_detail_', field: '_detail_', name: '', alwaysRenderColumn: true, cssClass: 'some-class',
      excludeFromExport: true, excludeFromColumnPicker: true, excludeFromGridMenu: true, excludeFromQuery: true, excludeFromHeaderMenu: true,
      formatter: expect.anything(),
      reorderable: false, resizable: false, sortable: false, toolTip: 'title', width: 30,
    };

    const output = plugin.create(mockColumns, { rowDetailView: { process: processMock, expandableOverride: overrideMock, panelRows: 4, columnId: '_detail_', cssClass: 'some-class', toolTip: 'title' } });

    expect(pubSubSpy).toHaveBeenCalledWith('onPluginColumnsChanged', { columns: expect.arrayContaining([{ ...rowDetailColumnMock, formatter: expect.toBeFunction() }]), pluginName: 'RowDetailView' });
    expect(mockColumns[0]).toEqual(rowDetailColumnMock);
    expect(plugin.getExpandableOverride()).toEqual(overrideMock);
    expect(output instanceof SlickRowDetailView).toBeTruthy();
  });

  it('should add the Row Detail to the column definitions at index when calling "create" and specifying column position', () => {
    const columnIndex = 1;
    const processMock = jest.fn();
    const output = plugin.create(mockColumns, { rowDetailView: { process: processMock, columnIndexPosition: columnIndex, panelRows: 4, columnId: '_detail_', cssClass: 'some-class', toolTip: 'title' } });

    expect(mockColumns[columnIndex]).toEqual({
      id: '_detail_', field: '_detail_', name: '', alwaysRenderColumn: true, cssClass: 'some-class',
      excludeFromExport: true, excludeFromColumnPicker: true, excludeFromGridMenu: true, excludeFromQuery: true, excludeFromHeaderMenu: true,
      formatter: expect.anything(),
      reorderable: false, resizable: false, sortable: false, toolTip: 'title', width: 30,
    });
    expect(plugin.getExpandableOverride()).toBeFalsy();
    expect(output instanceof SlickRowDetailView).toBeTruthy();
  });

  it('should expect the item parent to be returned when calling "getFilterItem" and the grid row is a Row Detail and has padding', () => {
    const parentItemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    plugin.init(gridStub);
    const output = plugin.getFilterItem({ _isPadding: true, _parent: parentItemMock });

    expect(output).toEqual(parentItemMock);
  });

  it('should trigger "onAsyncResponse" but throw an error when there is no item neither itemDetail provided', () => {
    const consoleSpy = jest.spyOn(global.console, 'error').mockReturnValue();
    const updateItemSpy = jest.spyOn(dataviewStub, 'updateItem');
    const postViewMock = (item) => `<span>Post ${item.id}</span>`;
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { postTemplate: postViewMock } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({} as any, new SlickEventData());

    expect(consoleSpy).toHaveBeenCalledWith('SlickRowDetailView plugin requires the onAsyncResponse() to supply "args.item" property.');
    expect(updateItemSpy).not.toHaveBeenCalled();
  });

  it('should trigger "onAsyncResponse" with Row Detail from post template from HTML string when no detailView is provided and expect "updateItem" from DataView to be called with new template & data', () => {
    const updateItemSpy = jest.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = jest.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const postViewMock = (item) => `<span>Post ${item.id}</span>`;
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { postTemplate: postViewMock } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, itemDetail: itemMock, }, new SlickEventData());

    expect(updateItemSpy).toHaveBeenCalledWith(123, { _detailContent: '<span>Post 123</span>', _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      { grid: gridStub, item: itemMock, itemDetail: { _detailContent: '<span>Post 123</span>', _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' } },
      expect.anything(),
      plugin
    );
  });

  it('should trigger "onAsyncResponse" with Row Detail from post template with HTML Element when no detailView is provided and expect "updateItem" from DataView to be called with new template & data', () => {
    const updateItemSpy = jest.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = jest.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const postViewMock = (item) => createDomElement('span', { textContent: `Post ${item.id}` });
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { postTemplate: postViewMock } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, itemDetail: itemMock, }, new SlickEventData());

    expect(updateItemSpy).toHaveBeenCalledWith(123, { _detailContent: createDomElement('span', { textContent: 'Post 123' }), _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      { grid: gridStub, item: itemMock, itemDetail: { _detailContent: createDomElement('span', { textContent: 'Post 123' }), _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' } },
      expect.anything(),
      plugin
    );
  });

  it('should trigger "onAsyncResponse" with Row Detail template when detailView is provided and expect "updateItem" from DataView to be called with new template & data', () => {
    const updateItemSpy = jest.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = jest.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const detailView = `<span>loading...</span>`;

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, itemDetail: itemMock, detailView, }, new SlickEventData());

    expect(updateItemSpy).toHaveBeenCalledWith(123, { _detailContent: `<span>loading...</span>`, _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      { grid: gridStub, item: itemMock, itemDetail: { _detailContent: `<span>loading...</span>`, _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' } },
      expect.anything(),
      plugin
    );
  });

  it('should trigger onClick and not call anything when "expandableOverride" returns False', () => {
    const updateItemSpy = jest.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = jest.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const detailView = `<span>loading...</span>`;

    plugin.init(gridStub);
    plugin.expandableOverride(() => false);
    plugin.onAsyncResponse.notify({ item: itemMock, itemDetail: itemMock, detailView, }, new SlickEventData());

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(updateItemSpy).toHaveBeenCalledWith(123, { _detailContent: `<span>loading...</span>`, _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      { grid: gridStub, item: itemMock, itemDetail: { _detailContent: `<span>loading...</span>`, _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' } },
      expect.anything(),
      plugin
    );
    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(stopPropagationSpy).not.toHaveBeenCalled();
  });

  it('should trigger onClick and NOT expect Row Detail to be toggled when onBeforeRowDetailToggle returns false', () => {
    const mockProcess = jest.fn();
    const expandDetailViewSpy = jest.spyOn(plugin, 'expandDetailView');
    const onBeforeSlickEventData = new SlickEventData();
    jest.spyOn(onBeforeSlickEventData, 'getReturnValue').mockReturnValue(false);
    const beforeRowDetailToggleSpy = jest.spyOn(plugin.onBeforeRowDetailToggle, 'notify').mockReturnValueOnce(onBeforeSlickEventData);
    const afterRowDetailToggleSpy = jest.spyOn(plugin.onAfterRowDetailToggle, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe', _collapsed: true };
    const detailView = `<span>loading...</span>`;
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    jest.spyOn(gridStub, 'getDataItem').mockReturnValue(itemMock);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { process: mockProcess, columnIndexPosition: 0, useRowClick: true, maxRows: 2, panelRows: 2 } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, itemDetail: itemMock, detailView, }, new SlickEventData());

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(beforeRowDetailToggleSpy).toHaveBeenCalled();
    expect(afterRowDetailToggleSpy).not.toHaveBeenCalled();
    expect(expandDetailViewSpy).not.toHaveBeenCalled();
  });

  it('should trigger onClick and expect Row Detail to be toggled', () => {
    const mockProcess = jest.fn();
    const expandDetailViewSpy = jest.spyOn(plugin, 'expandDetailView');
    const beforeRowDetailToggleSpy = jest.spyOn(plugin.onBeforeRowDetailToggle, 'notify');
    const afterRowDetailToggleSpy = jest.spyOn(plugin.onAfterRowDetailToggle, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe', _collapsed: true };
    const detailView = `<span>loading...</span>`;
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    jest.spyOn(gridStub, 'getDataItem').mockReturnValue(itemMock);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { process: mockProcess, columnIndexPosition: 0, useRowClick: true, maxRows: 2, panelRows: 2 } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, itemDetail: itemMock, detailView, }, new SlickEventData());

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(beforeRowDetailToggleSpy).toHaveBeenCalled();
    expect(afterRowDetailToggleSpy).toHaveBeenCalled();
    expect(expandDetailViewSpy).toHaveBeenCalledWith({
      _collapsed: false, _detailContent: undefined, _detailViewLoaded: true,
      _height: 75, _sizePadding: 3, firstName: 'John', id: 123, lastName: 'Doe'
    });
  });

  it('should trigger "onAsyncResponse" with Row Detail template with "useRowClick" enabled and then expect changes to be commited with prevent default event when editor isActive and commitCurrentEdit is returning false', () => {
    const updateItemSpy = jest.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = jest.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const beforeRowDetailToggleSpy = jest.spyOn(plugin.onBeforeRowDetailToggle, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const detailView = `<span>loading...</span>`;
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);
    jest.spyOn(gridStub, 'getDataItem').mockReturnValue(itemMock);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { columnIndexPosition: 0, useRowClick: true } as any });

    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, itemDetail: itemMock, detailView, }, new SlickEventData());
    const filteredItem = plugin.getFilterItem(itemMock);

    expect(updateItemSpy).toHaveBeenCalledWith(123, { _detailContent: `<span>loading...</span>`, _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      { grid: gridStub, item: itemMock, itemDetail: { _detailContent: `<span>loading...</span>`, _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' } },
      expect.anything(),
      plugin
    );

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(filteredItem).toBeTruthy();
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(beforeRowDetailToggleSpy).not.toHaveBeenCalled();
  });

  it('should trigger "onAsyncResponse" with Row Detail template with "useRowClick" enabled and then expect DataView to clear/delete rows in the UI when opening Row Detail', () => {
    const mockProcess = jest.fn();
    const updateItemSpy = jest.spyOn(dataviewStub, 'updateItem');
    const asyncEndUpdateSpy = jest.spyOn(plugin.onAsyncEndUpdate, 'notify');
    const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
    const detailView = `<span>loading...</span>`;
    const loadingTemplate = () => `<span>loading...</span>`;
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    jest.spyOn(gridStub, 'getDataItem').mockReturnValue(itemMock);
    jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(0);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useRowClick: true, singleRowExpand: true, loadOnce: true } as any });
    plugin.init(gridStub);
    plugin.onAsyncResponse.notify({ item: itemMock, itemDetail: itemMock, detailView, }, new SlickEventData());

    expect(updateItemSpy).toHaveBeenCalledWith(123, { _detailContent: `<span>loading...</span>`, _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' });
    expect(asyncEndUpdateSpy).toHaveBeenCalledWith(
      { grid: gridStub, item: itemMock, itemDetail: { _detailContent: `<span>loading...</span>`, _detailViewLoaded: true, id: 123, firstName: 'John', lastName: 'Doe' } },
      expect.anything(),
      plugin
    );

    plugin.expandDetailView(itemMock);

    const beforeRowDetailToggleSpy = jest.spyOn(plugin.onBeforeRowDetailToggle, 'notify');
    const afterRowDetailToggleSpy = jest.spyOn(plugin.onAfterRowDetailToggle, 'notify');
    const insertItemSpy = jest.spyOn(dataviewStub, 'insertItem');
    const beginUpdateSpy = jest.spyOn(dataviewStub, 'beginUpdate');
    const endUpdateSpy = jest.spyOn(dataviewStub, 'endUpdate');
    const deleteItemSpy = jest.spyOn(dataviewStub, 'deleteItem');
    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: document.createElement('div') });
    Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
    const stopImmediateSpy = jest.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ row: 0, cell: 1, grid: gridStub }, clickEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(stopImmediateSpy).toHaveBeenCalled();
    expect(beforeRowDetailToggleSpy).toHaveBeenCalledWith({
      grid: gridStub,
      item: {
        _collapsed: true, _detailViewLoaded: true, _sizePadding: 0, _height: 150, _detailContent: '<span>loading...</span>',
        id: 123, firstName: 'John', lastName: 'Doe',
      }
    }, expect.anything(), expect.anything(), true);
    expect(afterRowDetailToggleSpy).toHaveBeenCalledWith(
      {
        grid: gridStub,
        item: { _collapsed: true, _detailViewLoaded: true, _sizePadding: 0, _height: 150, _detailContent: '<span>loading...</span>', id: 123, firstName: 'John', lastName: 'Doe', },
        expandedRows: [],
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

    it('should call "resizeDetailView" and expect it to return without calling "saveDetailView" when item provided is null', () => {
      const saveDetailSpy = jest.spyOn(plugin, 'saveDetailView');

      plugin.init(gridStub);
      plugin.resizeDetailView(null);

      expect(saveDetailSpy).not.toHaveBeenCalled();
    });

    it('should call "resizeDetailView" and expect it to return without calling "saveDetailView" when Row Detail is not found in the DOM', () => {
      const itemMock = { id: 123, firstName: 'John', lastName: 'Doe' };
      const saveDetailSpy = jest.spyOn(plugin, 'saveDetailView');

      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);

      expect(saveDetailSpy).not.toHaveBeenCalled();
    });

    it('should call "resizeDetailView" and expect it to call "saveDetailView" when Row Detail is found in the DOM', () => {
      const itemMock = {
        id: 123, firstName: 'John', lastName: 'Doe',
        _collapsed: true, _detailViewLoaded: true, _sizePadding: 9, _height: 150, _detailContent: '<span>loading...</span>',
      };
      const mockProcess = jest.fn();
      const loadingTemplate = () => '<span>loading...</span>';
      const deleteItemSpy = jest.spyOn(dataviewStub, 'deleteItem');
      const insertItemSpy = jest.spyOn(dataviewStub, 'insertItem');
      const saveDetailSpy = jest.spyOn(plugin, 'saveDetailView');
      jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 180 });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, minRowBuffer: 1, rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useRowClick: true, singleRowExpand: true, loadOnce: true, maxRows: 7, } as any });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);

      expect(saveDetailSpy).toHaveBeenCalledWith({
        firstName: 'John', id: 123, lastName: 'Doe',
        _collapsed: true, _detailContent: '', _detailViewLoaded: true, _height: 180, _sizePadding: 7,
      });
      expect(insertItemSpy).toHaveBeenCalledWith(4, expect.objectContaining({
        id: '123.1', _collapsed: true, _isPadding: true, _offset: 1,
        _parent: { _collapsed: true, _detailContent: '', _detailViewLoaded: true, _height: 180, _sizePadding: 7, firstName: 'John', id: 123, lastName: 'Doe' },
      }));
      expect(insertItemSpy).toHaveBeenCalledWith(5, expect.objectContaining({
        id: '123.2', _collapsed: true, _isPadding: true, _offset: 2,
        _parent: { _collapsed: true, _detailContent: '', _detailViewLoaded: true, _height: 180, _sizePadding: 7, firstName: 'John', id: 123, lastName: 'Doe' },
      }));
      expect(deleteItemSpy).toHaveBeenCalledTimes(9);

      // collapse & expand tests
      const collapseDetailSpy = jest.spyOn(plugin, 'collapseDetailView');
      plugin.expandDetailView(itemMock);
      plugin.collapseAll();

      expect(collapseDetailSpy).toHaveBeenCalled();
      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John', id: 123, lastName: 'Doe',
        _collapsed: true, _detailContent: '', _detailViewLoaded: false, _height: 150, _sizePadding: 0,
      });
    });

    it('should call "resizeDetailView" and then calculate out of range detail views when calling on scroll', () => {
      const itemMock = {
        id: 123, firstName: 'John', lastName: 'Doe',
        _collapsed: true, _detailViewLoaded: true, _sizePadding: 1, _height: 150, _detailContent: '<span>loading...</span>',
      };
      const mockProcess = jest.fn();
      const loadingTemplate = () => '<span>loading...</span>';
      jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(2);
      jest.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 20, bottom: 50, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, minRowBuffer: 1, rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useRowClick: true, saveDetailViewOnScroll: true, singleRowExpand: true, loadOnce: true } as any });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock);

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, grid: gridStub }, eventData as any, gridStub);

      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John', id: 123, lastName: 'Doe',
        _collapsed: false, _detailContent: '', _detailViewLoaded: false, _height: 150, _sizePadding: 6,
      });
    });

    it('should call "resizeDetailView" and then calculate out of range detail views when calling on scroll (2)', () => {
      const itemMock = {
        id: 123, firstName: 'John', lastName: 'Doe',
        _collapsed: true, _detailViewLoaded: true, _sizePadding: 1, _height: 150, _detailContent: '<span>loading...</span>',
      };
      const mockProcess = jest.fn();
      const loadingTemplate = () => '<span>loading...</span>';
      jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(50);
      jest.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 20, bottom: 44, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useRowClick: true, saveDetailViewOnScroll: true, singleRowExpand: true, loadOnce: true } as any });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock);

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, grid: gridStub }, eventData as any, gridStub);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 35, grid: gridStub }, eventData as any, gridStub);
      plugin.lastRange = { bottom: 18, top: 30 };
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 0, grid: gridStub }, eventData as any, gridStub);

      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John', id: 123, lastName: 'Doe',
        _collapsed: false, _detailContent: '', _detailViewLoaded: false, _height: 150, _sizePadding: 6,
      });
    });

    it('should call "onScroll" and expect "onRowBackToViewportRange" be triggered when row is found out of range and direction is UP', (done) => {
      const itemMock = {
        id: 123, firstName: 'John', lastName: 'Doe',
        _collapsed: true, _detailViewLoaded: true, _sizePadding: 1, _height: 150, _detailContent: '<span>loading...</span>',
      };
      const mockProcess = jest.fn();
      const loadingTemplate = () => '<span>loading...</span>';
      jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(50);
      jest.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 46, bottom: 44, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useRowClick: true, saveDetailViewOnScroll: true, singleRowExpand: true, loadOnce: true } as any });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock);
      plugin.lastRange = { top: 47, bottom: 55 };
      plugin.rowIdsOutOfViewport = [123];

      const onRowBackToViewportSpy = jest.spyOn(plugin.onRowBackToViewportRange, 'notify');
      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, grid: gridStub }, eventData as any, gridStub);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 35, grid: gridStub }, eventData as any, gridStub);
      plugin.lastRange = { bottom: 18, top: 30 };
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 0, grid: gridStub }, eventData as any, gridStub);

      setTimeout(() => {
        expect(mockProcess).toHaveBeenCalledWith({
          firstName: 'John', id: 123, lastName: 'Doe',
          _collapsed: false, _detailContent: '', _detailViewLoaded: false, _height: 150, _sizePadding: 6,
        });
        expect(onRowBackToViewportSpy).toHaveBeenCalled();
        done();
      }, 101);
    });


    it('should call "onScroll" and expect "onRowBackToViewportRange" be triggered when row is found out of range and direction is DOWN', (done) => {
      const itemMock = {
        id: 123, firstName: 'John', lastName: 'Doe',
        _collapsed: true, _detailViewLoaded: true, _sizePadding: 1, _height: 150, _detailContent: '<span>loading...</span>',
      };
      const mockProcess = jest.fn();
      const loadingTemplate = () => '<span>loading...</span>';
      jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(50);
      jest.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 33, bottom: 44, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useRowClick: true, saveDetailViewOnScroll: true, singleRowExpand: true, loadOnce: true } as any });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock);
      plugin.lastRange = { top: 22, bottom: 55 };
      plugin.rowIdsOutOfViewport = [123];

      const onRowBackToViewportSpy = jest.spyOn(plugin.onRowBackToViewportRange, 'notify');
      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, grid: gridStub }, eventData as any, gridStub);
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 35, grid: gridStub }, eventData as any, gridStub);
      plugin.lastRange = { bottom: 18, top: 30 };
      gridStub.onScroll.notify({ scrollLeft: 22, scrollTop: 0, grid: gridStub }, eventData as any, gridStub);

      setTimeout(() => {
        expect(mockProcess).toHaveBeenCalledWith({
          firstName: 'John', id: 123, lastName: 'Doe',
          _collapsed: false, _detailContent: '<span>loading...</span>', _detailViewLoaded: false, _height: 150, _sizePadding: 6,
        });
        expect(onRowBackToViewportSpy).toHaveBeenCalled();
        done();
      }, 101);
    });

    it('should use "useSimpleViewportCalc" and call "resizeDetailView" and then calculate out of range detail views when calling on scroll and call "notifyOutOfViewport" when row is out of visibility', () => {
      const itemMock = {
        id: 123, firstName: 'John', lastName: 'Doe',
        _collapsed: true, _detailViewLoaded: true, _sizePadding: 1, _height: 150, _detailContent: '<span>loading...</span>',
      };
      const mockProcess = jest.fn();
      const loadingTemplate = () => '<span>loading...</span>';
      jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(2);
      jest.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 20, bottom: 50, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useSimpleViewportCalc: true, useRowClick: true, saveDetailViewOnScroll: true, singleRowExpand: true, loadOnce: true } as any });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock);
      plugin.rowIdsOutOfViewport = [123];
      gridStub.onRendered.notify({ endRow: 15, startRow: 5, grid: gridStub }, new SlickEventData(), gridStub);

      const onRowOutOfViewportRangeSpy = jest.spyOn(plugin.onRowOutOfViewportRange, 'notify');
      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, grid: gridStub }, eventData as any, gridStub);

      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John', id: 123, lastName: 'Doe',
        _collapsed: false, _detailContent: '<span>loading...</span>', _detailViewLoaded: false, _height: 150, _sizePadding: 6,
      });
      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John', id: 123, lastName: 'Doe',
        _collapsed: false, _detailContent: '<span>loading...</span>', _detailViewLoaded: false, _height: 150, _sizePadding: 6,
      });
      expect(onRowOutOfViewportRangeSpy).toHaveBeenCalled();
    });

    it('should use "useSimpleViewportCalc" and call "notifyBackToViewportWhenDomExist" when row is out of visibility', (done) => {
      const itemMock = {
        id: 123, firstName: 'John', lastName: 'Doe',
        _collapsed: true, _detailViewLoaded: true, _sizePadding: 1, _height: 150, _detailContent: '<span>loading...</span>',
      };
      const mockProcess = jest.fn();
      const loadingTemplate = () => '<span>loading...</span>';
      jest.spyOn(dataviewStub, 'getIdxById').mockReturnValue(3);
      jest.spyOn(dataviewStub, 'getRowById').mockReturnValue(2);
      jest.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 20, bottom: 50, left: 33, right: 18 } as any);
      divContainer.appendChild(cellDetailViewElm);
      Object.defineProperty(detailViewContainerElm, 'scrollHeight', { writable: true, configurable: true, value: 4 });
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...gridOptionsMock, rowDetailView: { process: mockProcess, preTemplate: loadingTemplate, panelRows: 5, useSimpleViewportCalc: true, useRowClick: true, saveDetailViewOnScroll: true, singleRowExpand: true, loadOnce: true } as any });
      plugin.init(gridStub);
      plugin.resizeDetailView(itemMock);
      plugin.expandDetailView(itemMock);
      plugin.rowIdsOutOfViewport = [123];
      gridStub.onRendered.notify({ endRow: 77, startRow: 5, grid: gridStub }, new SlickEventData(), gridStub);

      const onRowBackToViewportSpy = jest.spyOn(plugin.onRowBackToViewportRange, 'notify');
      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onScroll.notify({ scrollLeft: 20, scrollTop: 33, grid: gridStub }, eventData as any, gridStub);

      expect(mockProcess).toHaveBeenCalledWith({
        firstName: 'John', id: 123, lastName: 'Doe',
        _collapsed: false, _detailContent: '<span>loading...</span>', _detailViewLoaded: false, _height: 150, _sizePadding: 6,
      });
      setTimeout(() => {
        expect(mockProcess).toHaveBeenCalledWith({
          firstName: 'John', id: 123, lastName: 'Doe',
          _collapsed: false, _detailContent: '<span>loading...</span>', _detailViewLoaded: false, _height: 150, _sizePadding: 6,
        });
        expect(onRowBackToViewportSpy).toHaveBeenCalled();
        done();
      }, 101);
    });
  });

  describe('detailSelectionFormatter', () => {
    it('should execute formatter and expect it to return empty string when "checkExpandableOverride" is returning False', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', };
      plugin.init(gridStub);
      plugin.expandableOverride(() => false);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect(formattedVal).toBe('');
    });

    it('should execute formatter and expect it to return a div with "expand" css class', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', };
      plugin.init(gridStub);
      plugin.setOptions({ collapsedClass: 'some-collapsed' });
      plugin.expandableOverride(() => true);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect((formattedVal as HTMLElement).outerHTML).toBe(`<div class="detailView-toggle expand some-collapsed"></div>`);
    });

    it('should execute formatter and expect it to return empty string and render nothing when isPadding is True', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', _collapsed: true, _isPadding: true };
      plugin.init(gridStub);
      plugin.setOptions({ collapsedClass: 'some-collapsed' });
      plugin.expandableOverride(() => true);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect(formattedVal).toBe(``);
    });

    it('should execute formatter and expect it to render detail content from HTML string', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', _collapsed: false, _isPadding: false, _sizePadding: 5, _detailContent: `<div>Loading...</div>` };
      plugin.init(gridStub);
      plugin.setOptions({ expandedClass: 'some-expanded', maxRows: 2 });
      plugin.expandableOverride(() => true);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect(((formattedVal as FormatterResultWithHtml).html as HTMLElement).outerHTML).toBe(`<div class="detailView-toggle collapse some-expanded"></div>`);
      expect((formattedVal as FormatterResultWithHtml).insertElementAfterTarget!.outerHTML).toBe(`<div class="dynamic-cell-detail cellDetailView_123" style="height: 50px; top: 25px;"><div class="detail-container detailViewContainer_123"><div class="innerDetailView_123"><div>Loading...</div></div></div></div>`);
    });

    it('should execute formatter and expect it to render detail content from HTML Element', () => {
      const mockItem = { id: 123, firstName: 'John', lastName: 'Doe', _collapsed: false, _isPadding: false, _sizePadding: 5, _detailContent: createDomElement('div', { textContent: 'Loading...' }) };
      plugin.init(gridStub);
      plugin.setOptions({ expandedClass: 'some-expanded', maxRows: 2 });
      plugin.expandableOverride(() => true);
      const formattedVal = plugin.getColumnDefinition().formatter!(0, 1, '', mockColumns[0], mockItem, gridStub);
      expect(((formattedVal as FormatterResultWithHtml).html as HTMLElement).outerHTML).toBe(`<div class="detailView-toggle collapse some-expanded"></div>`);
      expect((formattedVal as FormatterResultWithHtml).insertElementAfterTarget!.outerHTML).toBe(`<div class="dynamic-cell-detail cellDetailView_123" style="height: 50px; top: 25px;"><div class="detail-container detailViewContainer_123"><div class="innerDetailView_123"><div>Loading...</div></div></div></div>`);
    });
  });
});
