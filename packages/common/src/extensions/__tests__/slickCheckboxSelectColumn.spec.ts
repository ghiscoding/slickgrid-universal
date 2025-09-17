import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { getHtmlStringOutput } from '@slickgrid-universal/utils';

import { SlickCheckboxSelectColumn } from '../slickCheckboxSelectColumn.js';
import type { Column, OnSelectedRowsChangedEventArgs } from '../../interfaces/index.js';
import type { SlickRowSelectionModel } from '../../extensions/slickRowSelectionModel.js';
import { SlickEvent, type SlickGrid } from '../../core/index.js';

vi.useFakeTimers();

const addVanillaEventPropagation = function <T = any>(event: T, commandKey = '', keyName = '', target?: HTMLElement, which: string | number = '') {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
  if (commandKey) {
    Object.defineProperty(event, commandKey, { writable: true, configurable: true, value: true });
  }
  if (keyName !== '') {
    Object.defineProperty(event, 'key', { writable: true, configurable: true, value: keyName });
  }
  if (which !== '') {
    Object.defineProperty(event, 'which', { writable: true, configurable: true, value: which });
  }
  if (target) {
    Object.defineProperty(event, 'target', { writable: true, configurable: true, value: target });
  }
  return event;
};

const dataViewStub = {
  collapseAllGroups: vi.fn(),
  getAllSelectedFilteredIds: vi.fn(),
  getFilteredItems: vi.fn(),
  getItemByIdx: vi.fn(),
  getItemCount: vi.fn(),
  getIdPropertyName: () => 'id',
  onPagingInfoChanged: new SlickEvent(),
  onSelectedRowIdsChanged: new SlickEvent(),
  setSelectedIds: vi.fn(),
};

const getEditorLockMock = {
  commitCurrentEdit: vi.fn(),
  isActive: vi.fn(),
};

const gridStub = {
  getEditorLock: () => getEditorLockMock,
  getColumns: vi.fn(),
  getData: () => dataViewStub,
  getDataItem: vi.fn(),
  getDataLength: vi.fn(),
  getOptions: vi.fn(),
  getSelectionModel: vi.fn(),
  getSelectedRows: vi.fn(),
  invalidateRow: vi.fn(),
  render: vi.fn(),
  registerPlugin: vi.fn(),
  setActiveCell: vi.fn(),
  setSelectionModel: vi.fn(),
  setSelectedRows: vi.fn(),
  updateColumnHeader: vi.fn(),
  onAfterSetColumns: new SlickEvent(),
  onClick: new SlickEvent(),
  onHeaderClick: new SlickEvent(),
  onHeaderRowCellRendered: new SlickEvent(),
  onKeyDown: new SlickEvent(),
  onSelectedRowsChanged: new SlickEvent(),
} as unknown as SlickGrid;

const mockRowSelectionModel = {
  constructor: vi.fn(),
  init: vi.fn(),
  dispose: vi.fn(),
  getSelectedRows: vi.fn(),
  setSelectedRows: vi.fn(),
  getSelectedRanges: vi.fn(),
  setSelectedRanges: vi.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickRowSelectionModel;

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

vi.mock('../../extensions/slickRowSelectionModel', () => ({
  SlickRowSelectionModel: vi.fn().mockImplementation(() => mockRowSelectionModel),
}));

describe('SlickCheckboxSelectColumn Plugin', () => {
  let mockColumns: Column[];
  let plugin: SlickCheckboxSelectColumn;

  beforeEach(() => {
    mockColumns = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'age', field: 'age', name: 'Age' },
    ];
    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub);
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
  });

  afterEach(() => {
    plugin?.dispose();
    vi.clearAllMocks();
  });

  it('should create the plugin with default options', () => {
    const expectedOptions = {
      applySelectOnAllPages: true,
      columnId: '_checkbox_selector',
      cssClass: null,
      field: '_checkbox_selector',
      hideSelectAllCheckbox: false,
      name: '',
      reorderable: false,
      toolTip: 'Select/Deselect All',
      width: 30,
      hideInColumnTitleRow: false,
      hideInFilterHeaderRow: true,
    };
    expect(plugin).toBeTruthy();
    expect(plugin.addonOptions).toEqual(expectedOptions);
    expect(plugin.getOptions()).toEqual(expectedOptions);
  });

  it('should create the plugin and call "setOptions" and expect options changed and hide both Select All toggle when setting "hideSelectAllCheckbox: true"', () => {
    const updateColHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');

    plugin.init(gridStub);
    plugin.setOptions({ hideInColumnTitleRow: true, hideInFilterHeaderRow: true, hideSelectAllCheckbox: true, cssClass: 'some-class' });

    expect(plugin).toBeTruthy();
    expect(plugin.addonOptions).toEqual({
      applySelectOnAllPages: true,
      columnId: '_checkbox_selector',
      cssClass: 'some-class',
      field: '_checkbox_selector',
      hideSelectAllCheckbox: true,
      name: '',
      reorderable: false,
      toolTip: 'Select/Deselect All',
      width: 30,
      hideInColumnTitleRow: true,
      hideInFilterHeaderRow: true,
    });
    expect(updateColHeaderSpy).toHaveBeenCalledWith('_checkbox_selector', '', '');
  });

  it('should create the plugin and call "setOptions" and expect options changed and hide both Select All toggle when setting "hideSelectAllCheckbox: false" but both other hide flags are set to True', () => {
    const updateColHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');

    plugin.init(gridStub);
    plugin.setOptions({ hideInColumnTitleRow: true, hideInFilterHeaderRow: true, hideSelectAllCheckbox: false, cssClass: 'some-class' });

    expect(plugin).toBeTruthy();
    expect(updateColHeaderSpy).toHaveBeenCalledWith('_checkbox_selector', '', '');
  });

  it('should create the plugin and call "setOptions" and expect options changed and call grid "updateColumnHeader()" when setting "hideInColumnTitleRow: true" and a column "name"', () => {
    const colName = 'Selection';
    const updateColHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');

    plugin.init(gridStub);
    plugin.setOptions({ hideInColumnTitleRow: true, hideSelectAllCheckbox: false, cssClass: 'some-class', name: colName });

    expect(plugin).toBeTruthy();
    expect(updateColHeaderSpy).toHaveBeenCalledWith('_checkbox_selector', colName, '');
  });

  it('should create the plugin and call "setOptions" and expect options changed and render the Select All toggle when "hideInColumnTitleRow: false"', () => {
    const updateColHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub);
    plugin.setOptions({ hideInColumnTitleRow: false, hideInFilterHeaderRow: true, hideSelectAllCheckbox: false });

    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addVanillaEventPropagation(new Event('click'), '', '', checkboxElm);
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    const stopImmediatePropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onHeaderClick.notify({ column: { id: '_checkbox_selector', field: '_checkbox_selector' }, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(updateColHeaderSpy).toHaveBeenCalledWith(
      '_checkbox_selector',
      plugin.createCheckboxElement(`header-selector${plugin.selectAllUid}`),
      'Select/Deselect All'
    );
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).not.toHaveBeenCalled();
  });

  it('should recreate the Select All toggle whenever "onAfterSetColumns" grid event is triggered', () => {
    const updateColHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);
    vi.spyOn(dataViewStub, 'getAllSelectedFilteredIds').mockReturnValueOnce([]);
    vi.spyOn(dataViewStub, 'getFilteredItems').mockReturnValue([]);

    plugin.init(gridStub);
    plugin.setOptions({ hideInColumnTitleRow: false, hideInFilterHeaderRow: true, hideSelectAllCheckbox: false });

    gridStub.onAfterSetColumns.notify({ newColumns: [{ id: '_checkbox_selector', field: '_checkbox_selector' }], grid: gridStub });

    expect(plugin).toBeTruthy();
    expect(updateColHeaderSpy).toHaveBeenCalledTimes(2); // 1x for plugin creation, 1x for onAfterSetColumns trigger
    expect(updateColHeaderSpy).toHaveBeenCalledWith(
      '_checkbox_selector',
      plugin.createCheckboxElement(`header-selector${plugin.selectAllUid}`),
      'Select/Deselect All'
    );
  });

  it('should create the plugin and expect "setSelectedRows" to called with all rows toggling to be selected when "applySelectOnAllPages" is disabled', () => {
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(3);
    vi.spyOn(gridStub, 'getDataItem')
      .mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 })
      .mockReturnValueOnce({ firstName: 'Jane', lastName: 'Doe', age: 28 })
      .mockReturnValueOnce({ __group: true, __groupTotals: { age: { sum: 58 } } });
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');
    const onToggleEndMock = vi.fn();
    const onToggleStartMock = vi.fn();

    plugin.selectedRowsLookup = { 1: false, 2: true };
    plugin.init(gridStub);
    plugin.setOptions({
      applySelectOnAllPages: false,
      hideInColumnTitleRow: false,
      hideInFilterHeaderRow: true,
      hideSelectAllCheckbox: false,
      onSelectAllToggleStart: onToggleStartMock,
      onSelectAllToggleEnd: onToggleEndMock,
    });

    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    checkboxElm.checked = true;
    const clickEvent = addVanillaEventPropagation(new Event('click'), '', '', checkboxElm);
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
    const stopImmediatePropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onHeaderClick.notify({ column: { id: '_checkbox_selector', field: '_checkbox_selector' }, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).toHaveBeenCalledWith([0, 2], 'click.selectAll');
    expect(onToggleStartMock).toHaveBeenCalledWith(expect.anything(), { caller: 'click.selectAll', previousSelectedRows: undefined });
    expect(onToggleEndMock).toHaveBeenCalledWith(expect.anything(), { caller: 'click.selectAll', previousSelectedRows: undefined, rows: [0, 2] });
  });

  it('should create the plugin and expect "setSelectedRows" to called with all rows toggling to be selected when "applySelectOnAllPages" is enabled', () => {
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(3);
    vi.spyOn(gridStub, 'getDataItem')
      .mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 })
      .mockReturnValueOnce({ firstName: 'Jane', lastName: 'Doe', age: 28 })
      .mockReturnValueOnce({ __group: true, __groupTotals: { age: { sum: 58 } } });
    vi.spyOn(dataViewStub, 'getFilteredItems').mockReturnValue([{ id: 22, firstName: 'John', lastName: 'Doe', age: 30 }]);
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');
    const onToggleEndMock = vi.fn();
    const onToggleStartMock = vi.fn();
    const setSelectedIdsSpy = vi.spyOn(dataViewStub, 'setSelectedIds');

    plugin.selectedRowsLookup = { 1: false, 2: true };
    plugin.init(gridStub);
    plugin.setOptions({
      applySelectOnAllPages: true,
      hideInColumnTitleRow: false,
      hideInFilterHeaderRow: true,
      hideSelectAllCheckbox: false,
      onSelectAllToggleStart: onToggleStartMock,
      onSelectAllToggleEnd: onToggleEndMock,
    });

    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    checkboxElm.checked = true;
    const clickEvent = addVanillaEventPropagation(new Event('click'), '', '', checkboxElm);
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
    const stopImmediatePropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onHeaderClick.notify({ column: { id: '_checkbox_selector', field: '_checkbox_selector' }, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).toHaveBeenCalledWith([0, 2], 'click.selectAll');
    expect(onToggleStartMock).toHaveBeenCalledWith(expect.anything(), { caller: 'click.selectAll', previousSelectedRows: undefined });
    expect(onToggleEndMock).toHaveBeenCalledWith(expect.anything(), { caller: 'click.selectAll', previousSelectedRows: undefined, rows: [0, 2] });
    expect(setSelectedIdsSpy).toHaveBeenCalledWith([22], { isRowBeingAdded: true });
  });

  it('should create the plugin and call "setOptions" and expect options changed and hide both Select All toggle when setting "hideSelectAllCheckbox: false" and "hideInColumnTitleRow: true"', () => {
    const nodeElm = document.createElement('div');
    nodeElm.className = 'slick-headerrow-column';
    const updateColHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');

    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub, { hideInFilterHeaderRow: false, hideSelectAllCheckbox: false });
    plugin.init(gridStub);
    gridStub.onHeaderRowCellRendered.notify({ column: { id: '_checkbox_selector', field: '_checkbox_selector' }, node: nodeElm, grid: gridStub });
    plugin.setOptions({ hideInColumnTitleRow: true, hideInFilterHeaderRow: false, hideSelectAllCheckbox: false });
    let filterSelectAll = plugin.headerRowNode!.querySelector('#filter-checkbox-selectall-container') as HTMLSpanElement;

    expect(plugin).toBeTruthy();
    expect(updateColHeaderSpy).toHaveBeenCalledWith('_checkbox_selector', '', '');
    expect(filterSelectAll.style.display).toEqual('flex');

    filterSelectAll = plugin.headerRowNode!.querySelector('#filter-checkbox-selectall-container') as HTMLSpanElement;
    plugin.hideSelectAllFromColumnHeaderFilterRow();
    expect(filterSelectAll.style.display).toEqual('none');
  });

  it('should create the plugin and and expect it to automatically disable "applySelectOnAllPages" when the BackendServiceApi is used', () => {
    const nodeElm = document.createElement('div');
    nodeElm.className = 'slick-headerrow-column';
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({ backendServiceApi: {} as any });

    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub);
    plugin.init(gridStub);

    expect(plugin.getOptions()).toEqual(expect.objectContaining({ applySelectOnAllPages: false }));
  });

  it('should call "deSelectRows" and expect "setSelectedRows" to be called with only the rows that are found in selectable lookup', () => {
    vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub);
    plugin.selectedRowsLookup = { 1: false, 2: true };
    plugin.selectRows([1, 2, 3]);
    plugin.deSelectRows([1, 2, 3, 6, -1]);

    expect(setSelectedRowSpy).toHaveBeenNthCalledWith(2, [1], 'SlickCheckboxSelectColumn.deSelectRows'); // only 1 is found which was previous false
  });

  it('should pre-select some rows in a delay when "preselectedRows" is defined with a row selection model', () => {
    vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockRowSelectionModel);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({ preselectedRows: [1, 2] });
    vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue([]);

    const selectRowSpy = vi.spyOn(plugin, 'selectRows');
    plugin.init(gridStub);

    vi.advanceTimersByTime(1);

    expect(selectRowSpy).toHaveBeenCalledWith([1, 2]);
  });

  it('should call "toggleRowSelection" and expect toggled row to be added and called by the "setSelectedRows"', () => {
    vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 });
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub);
    plugin.selectRows([2, 3]);
    plugin.toggleRowSelection(2);

    expect(setActiveCellSpy).toHaveBeenCalledWith(2, 0);
    expect(setSelectedRowSpy).toHaveBeenNthCalledWith(2, [1, 2, 2], 'click.toggle');
  });

  it('should call "toggleRowSelection" and expect "setActiveCell" not being called when the selectableOverride is returning false', () => {
    vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 });
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');

    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub, { selectableOverride: () => false });
    plugin.init(gridStub);
    plugin.selectRows([2, 3]);
    plugin.toggleRowSelection(2);

    expect(setActiveCellSpy).not.toHaveBeenCalled();
  });

  it('should call "toggleRowSelection" and expect row to be removed when found in the selected rows lookup', () => {
    vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 });
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub);
    plugin.selectedRowsLookup = { 1: false, 2: true };
    plugin.selectRows([2, 3]);
    plugin.toggleRowSelection(2);

    expect(setSelectedRowSpy).toHaveBeenNthCalledWith(2, [1], 'click.toggle');
    expect(setActiveCellSpy).toHaveBeenCalledWith(2, 0);
  });

  it('should fill the "selectableOverride" and expect', () => {
    vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 });
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');

    const mockOverrride = vi.fn();
    mockOverrride.mockReturnValue(false);

    plugin.init(gridStub);
    plugin.selectableOverride(mockOverrride);
    plugin.toggleRowSelection(2);

    expect(setActiveCellSpy).not.toHaveBeenCalled();
  });

  it('should create a new row selection column definition', () => {
    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub);
    plugin.init(gridStub);
    const nameHtmlOutput = getHtmlStringOutput(plugin.getColumnDefinition()?.name || '', 'outerHTML');

    expect(plugin.getColumnDefinition()).toEqual({
      id: '_checkbox_selector',
      toolTip: 'Select/Deselect All',
      field: '_checkbox_selector',
      cssClass: null,
      excludeFromExport: true,
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromQuery: true,
      reorderable: false,
      excludeFromHeaderMenu: true,
      hideSelectAllCheckbox: false,
      resizable: false,
      sortable: false,
      width: 30,
      maxWidth: 30,
      name: expect.any(DocumentFragment),
      formatter: expect.any(Function),
    });
    expect(nameHtmlOutput).toBe(
      `<label class="checkbox-selector-label" for="header-selector${plugin.selectAllUid}"><div class="icon-checkbox-container"><input id="header-selector${plugin.selectAllUid}" type="checkbox" aria-checked="false"><div class="mdi mdi-icon-uncheck"></div></div></label>`
    );
  });

  it('should create the plugin and add the Toggle All checkbox in the filter header row and expect toggle all to work when clicked', () => {
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');
    const nodeElm = document.createElement('div');
    nodeElm.className = 'slick-headerrow-column';

    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub, { applySelectOnAllPages: false, hideInFilterHeaderRow: false });
    plugin.init(gridStub);

    gridStub.onHeaderRowCellRendered.notify({ column: { id: '_checkbox_selector', field: '_checkbox_selector' }, node: nodeElm, grid: gridStub });
    const checkboxContainerElm = nodeElm.querySelector('div.icon-checkbox-container') as HTMLDivElement;
    const inputCheckboxElm = checkboxContainerElm.querySelector('input[type=checkbox]') as HTMLDivElement;
    inputCheckboxElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));

    expect(inputCheckboxElm).toBeTruthy();
    expect(setSelectedRowSpy).toHaveBeenCalledWith([], 'click.unselectAll');
  });

  it('should call the "create" method and expect plugin to be created with checkbox column to be created at position 0 when using default', () => {
    const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
    const checkboxColumnMock = {
      cssClass: null,
      excludeFromColumnPicker: true,
      excludeFromExport: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      excludeFromQuery: true,
      reorderable: false,
      field: 'chk-id',
      hideSelectAllCheckbox: false,
      id: 'chk-id',
      resizable: false,
      sortable: false,
      toolTip: 'Select/Deselect All',
      width: 30,
      maxWidth: 30,
    };

    plugin.create(mockColumns, { checkboxSelector: { columnId: 'chk-id' } });
    const nameHtmlOutput = getHtmlStringOutput(mockColumns[0]?.name || '', 'outerHTML');

    expect(pubSubSpy).toHaveBeenCalledWith('onPluginColumnsChanged', {
      columns: expect.arrayContaining([{ ...checkboxColumnMock, name: expect.any(DocumentFragment), formatter: expect.any(Function) }]),
      pluginName: 'CheckboxSelectColumn',
    });
    expect(plugin).toBeTruthy();
    expect(mockColumns[0]).toEqual(expect.objectContaining({ ...checkboxColumnMock, formatter: expect.any(Function) }));
    expect(nameHtmlOutput).toBe(
      `<label class="checkbox-selector-label" for="header-selector${plugin.selectAllUid}"><div class="icon-checkbox-container"><input id="header-selector${plugin.selectAllUid}" type="checkbox" aria-checked="false"><div class="mdi mdi-icon-uncheck"></div></div></label>`
    );
  });

  it('should call the "create" method and expect plugin to be created at position 1 when defined', () => {
    plugin.create(mockColumns, { checkboxSelector: { columnIndexPosition: 1 } });
    const nameHtmlOutput = getHtmlStringOutput(mockColumns[1]?.name || '', 'outerHTML');

    expect(plugin).toBeTruthy();
    expect(mockColumns[1]).toEqual({
      cssClass: null,
      excludeFromColumnPicker: true,
      excludeFromExport: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      excludeFromQuery: true,
      reorderable: false,
      field: '_checkbox_selector',
      formatter: expect.any(Function),
      hideSelectAllCheckbox: false,
      id: '_checkbox_selector',
      name: expect.any(DocumentFragment),
      resizable: false,
      sortable: false,
      toolTip: 'Select/Deselect All',
      width: 30,
      maxWidth: 30,
    });
    expect(nameHtmlOutput).toBe(
      `<label class="checkbox-selector-label" for="header-selector${plugin.selectAllUid}"><div class="icon-checkbox-container"><input id="header-selector${plugin.selectAllUid}" type="checkbox" aria-checked="false"><div class="mdi mdi-icon-uncheck"></div></div></label>`
    );
  });

  it('should add a "name" and "hideSelectAllCheckbox: true" and call the "create" method and expect plugin to be created with a column name and without a checkbox', () => {
    const colName = 'Selection';
    plugin.create(mockColumns, { checkboxSelector: { columnIndexPosition: 1, name: colName, hideSelectAllCheckbox: true } });

    expect(plugin).toBeTruthy();
    expect(mockColumns[1]).toEqual({
      cssClass: null,
      excludeFromColumnPicker: true,
      excludeFromExport: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      excludeFromQuery: true,
      reorderable: false,
      field: '_checkbox_selector',
      formatter: expect.any(Function),
      hideSelectAllCheckbox: true,
      id: '_checkbox_selector',
      name: colName,
      resizable: false,
      sortable: false,
      toolTip: '',
      width: 30,
      maxWidth: 30,
    });
  });

  it('should process the "checkboxSelectionFormatter" and expect necessary Formatter to return null when selectableOverride is returning False', () => {
    plugin.selectableOverride(() => false);
    plugin.create(mockColumns, {});
    const output = plugin.getColumnDefinition().formatter!(
      0,
      0,
      null,
      { id: 'checkbox_selector', field: '' } as Column,
      { firstName: 'John', lastName: 'Doe', age: 33 },
      gridStub
    );

    expect(plugin).toBeTruthy();
    expect(output).toEqual(null);
  });

  it('should process the "checkboxSelectionFormatter" and expect necessary Formatter to return null when selectableOverride is returning False', () => {
    plugin.init(gridStub);
    plugin.selectableOverride(() => true);
    const output = plugin.getColumnDefinition().formatter!(
      0,
      0,
      null,
      { id: 'checkbox_selector', field: '' } as Column,
      { firstName: 'John', lastName: 'Doe', age: 33 },
      gridStub
    ) as DocumentFragment;

    expect(plugin).toBeTruthy();
    expect(output.querySelector('input')?.id).toMatch(/^selector.*/);
    expect(output.querySelector('label')?.htmlFor).toMatch(/^selector.*/);
  });

  it('should trigger "onClick" event and expect toggleRowSelection to be called', () => {
    const newCols = [
      { id: '_checkbox_selector', toolTip: 'Select/Deselect All', field: '_checkbox_selector' },
      { id: 'firstName', field: 'firstName', name: 'First Name' },
    ];
    const toggleRowSpy = vi.spyOn(plugin, 'toggleRowSelectionWithEvent');
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(newCols);
    plugin.create(newCols, { checkboxSelector: { columnIndexPosition: 0 } });

    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addVanillaEventPropagation(new Event('click'), '', '', checkboxElm);
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
    const stopImmediatePropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ cell: 0, row: 2, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(toggleRowSpy).toHaveBeenCalledWith(expect.anything(), 2);
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onClick" event and expect toggleRowSelection and "onRowToggleStart" be called when defined', () => {
    const toggleRowSpy = vi.spyOn(plugin, 'toggleRowSelectionWithEvent');
    const onToggleStartMock = vi.fn();

    plugin.init(gridStub);
    plugin.setOptions({ onRowToggleStart: onToggleStartMock });
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addVanillaEventPropagation(new Event('click'), '', '', checkboxElm);
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
    const stopImmediatePropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ cell: 0, row: 2, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(onToggleStartMock).toHaveBeenCalledWith(expect.anything(), { previousSelectedRows: [1, 2], row: 2 });
    expect(toggleRowSpy).toHaveBeenCalledWith(expect.anything(), 2);
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onClick" event and expect toggleRowSelection and "onRowToggleEnd" be called when defined', () => {
    const toggleRowSpy = vi.spyOn(plugin, 'toggleRowSelectionWithEvent');
    const onToggleEndMock = vi.fn();

    plugin.init(gridStub);
    plugin.setOptions({ onRowToggleEnd: onToggleEndMock });
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addVanillaEventPropagation(new Event('click'), '', '', checkboxElm);
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
    const stopImmediatePropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ cell: 0, row: 2, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(onToggleEndMock).toHaveBeenCalledWith(expect.anything(), { previousSelectedRows: [1, 2], row: 2 });
    expect(toggleRowSpy).toHaveBeenCalledWith(expect.anything(), 2);
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onClick" event and NOT expect toggleRowSelection to be called when editor "isActive" returns True and "commitCurrentEdit" returns False', () => {
    const toggleRowSpy = vi.spyOn(plugin, 'toggleRowSelectionWithEvent');
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);

    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addVanillaEventPropagation(new Event('click'), '', '', checkboxElm);
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    const stopImmediatePropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ cell: 0, row: 2, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(toggleRowSpy).not.toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onKeyDown" event and expect toggleRowSelection to be called when editor "isActive" returns False', () => {
    const toggleRowSpy = vi.spyOn(plugin, 'toggleRowSelectionWithEvent');
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);

    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const keyboardEvent = addVanillaEventPropagation(new Event('keyDown'), '', ' ', checkboxElm);
    const preventDefaultSpy = vi.spyOn(keyboardEvent, 'preventDefault');
    const stopImmediatePropagationSpy = vi.spyOn(keyboardEvent, 'stopImmediatePropagation');
    gridStub.onKeyDown.notify({ cell: 0, row: 2, grid: gridStub }, keyboardEvent);

    expect(plugin).toBeTruthy();
    expect(toggleRowSpy).toHaveBeenCalledWith(expect.anything(), 2);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onKeyDown" event and expect toggleRowSelection to be called when editor "commitCurrentEdit" returns True', () => {
    const newCols = [
      { id: '_checkbox_selector', toolTip: 'Select/Deselect All', field: '_checkbox_selector' },
      { id: 'firstName', field: 'firstName', name: 'First Name' },
    ];
    const toggleRowSpy = vi.spyOn(plugin, 'toggleRowSelectionWithEvent');
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(newCols);

    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const keyboardEvent = addVanillaEventPropagation(new Event('keyDown'), '', ' ', checkboxElm, ' ');
    const preventDefaultSpy = vi.spyOn(keyboardEvent, 'preventDefault');
    const stopImmediatePropagationSpy = vi.spyOn(keyboardEvent, 'stopImmediatePropagation');
    gridStub.onKeyDown.notify({ cell: 0, row: 2, grid: gridStub }, keyboardEvent);

    expect(plugin).toBeTruthy();
    expect(toggleRowSpy).toHaveBeenCalledWith(expect.anything(), 2);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onSelectedRowsChanged" event and invalidate row and render to be called but without "setSelectedRows" when "applySelectOnAllPages" is disabled & checkSelectableOverride returns True or is not provided', () => {
    const invalidateRowSpy = vi.spyOn(gridStub, 'invalidateRow');
    const renderSpy = vi.spyOn(gridStub, 'render');
    const updateColumnHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);

    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub, { applySelectOnAllPages: false, hideInColumnTitleRow: false, hideSelectAllCheckbox: false });
    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addVanillaEventPropagation(new Event('keyDown'), '', ' ', checkboxElm);
    gridStub.onSelectedRowsChanged.notify({ rows: [2, 3], previousSelectedRows: [0, 1], grid: gridStub } as OnSelectedRowsChangedEventArgs, clickEvent);

    expect(plugin).toBeTruthy();
    expect(invalidateRowSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).not.toHaveBeenCalled();
    expect(updateColumnHeaderSpy).toHaveBeenCalledWith(
      '_checkbox_selector',
      plugin.createCheckboxElement(`header-selector${plugin.selectAllUid}`),
      'Select/Deselect All'
    );
  });

  it('should trigger "onSelectedRowsChanged" event and invalidate row and render to be called but without "setSelectedRows" when we are not using a DataView & checkSelectableOverride returns True or is not provided', () => {
    const invalidateRowSpy = vi.spyOn(gridStub, 'invalidateRow');
    const renderSpy = vi.spyOn(gridStub, 'render');
    const updateColumnHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    vi.spyOn(gridStub, 'getData').mockReturnValueOnce([]);

    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub, { applySelectOnAllPages: true, hideInColumnTitleRow: false, hideSelectAllCheckbox: false });
    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addVanillaEventPropagation(new Event('keyDown'), '', ' ', checkboxElm);
    gridStub.onSelectedRowsChanged.notify({ rows: [2, 3], previousSelectedRows: [0, 1], grid: gridStub } as OnSelectedRowsChangedEventArgs, clickEvent);

    expect(plugin).toBeTruthy();
    expect(invalidateRowSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).not.toHaveBeenCalled();
    expect(updateColumnHeaderSpy).toHaveBeenCalledWith(
      '_checkbox_selector',
      plugin.createCheckboxElement(`header-selector${plugin.selectAllUid}`),
      'Select/Deselect All'
    );
  });

  it('should trigger "onSelectedRowsChanged" event and invalidate row and render to be called also with "setSelectedRows" when checkSelectableOverride returns False and input select checkbox is all checked', () => {
    const nodeElm = document.createElement('div');
    nodeElm.className = 'slick-headerrow-column';
    const invalidateRowSpy = vi.spyOn(gridStub, 'invalidateRow');
    const renderSpy = vi.spyOn(gridStub, 'render');
    const updateColumnHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');
    const setSelectedRowSpy = vi.spyOn(gridStub, 'setSelectedRows');
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);

    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub, {
      applySelectOnAllPages: false,
      hideInFilterHeaderRow: false,
      hideSelectAllCheckbox: false,
      selectableOverride: () => false,
    });
    plugin.init(gridStub);
    plugin.selectedRowsLookup = { 1: false, 2: true };

    gridStub.onHeaderRowCellRendered.notify({ column: { id: '_checkbox_selector', field: '_checkbox_selector' }, node: nodeElm, grid: gridStub });

    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addVanillaEventPropagation(new Event('keyDown'), '', ' ', checkboxElm);
    gridStub.onSelectedRowsChanged.notify({ rows: [2, 3], previousSelectedRows: [0, 1], grid: gridStub } as OnSelectedRowsChangedEventArgs, clickEvent);

    expect(plugin).toBeTruthy();
    expect(invalidateRowSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).toHaveBeenCalled();
    expect(updateColumnHeaderSpy).toHaveBeenCalledWith(
      '_checkbox_selector',
      plugin.createCheckboxElement(`header-selector${plugin.selectAllUid}`, true),
      'Select/Deselect All'
    );
  });

  it('should trigger "onSelectedRowIdsChanged" event and invalidate row and render to be called also with "setSelectedRows" when checkSelectableOverride returns False and input select checkbox is all checked', () => {
    const nodeElm = document.createElement('div');
    nodeElm.className = 'slick-headerrow-column';
    const updateColumnHeaderSpy = vi.spyOn(gridStub, 'updateColumnHeader');
    vi.spyOn(dataViewStub, 'getAllSelectedFilteredIds').mockReturnValueOnce([1, 2]);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    vi.spyOn(dataViewStub, 'getFilteredItems').mockReturnValueOnce([{ id: 22, firstName: 'John', lastName: 'Doe', age: 30 }]);
    vi.spyOn(dataViewStub, 'getItemCount').mockReturnValueOnce(2);
    vi.spyOn(dataViewStub, 'getItemByIdx').mockReturnValueOnce({ id: 22, firstName: 'John', lastName: 'Doe', age: 30 });

    plugin = new SlickCheckboxSelectColumn(pubSubServiceStub, { hideInFilterHeaderRow: false, hideSelectAllCheckbox: false, selectableOverride: () => false });
    plugin.init(gridStub);
    plugin.selectedRowsLookup = { 1: false, 2: true };

    gridStub.onHeaderRowCellRendered.notify({ column: { id: '_checkbox_selector', field: '_checkbox_selector' }, node: nodeElm, grid: gridStub });

    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addVanillaEventPropagation(new Event('keyDown'), '', ' ', checkboxElm);
    dataViewStub.onSelectedRowIdsChanged.notify(
      { rows: [0, 1], filteredIds: [1, 2], ids: [1, 2], selectedRowIds: [1, 2], dataView: dataViewStub, grid: gridStub },
      clickEvent
    );

    expect(plugin).toBeTruthy();
    expect(updateColumnHeaderSpy).toHaveBeenCalledWith(
      '_checkbox_selector',
      plugin.createCheckboxElement(`header-selector${plugin.selectAllUid}`, true),
      'Select/Deselect All'
    );
  });
});
