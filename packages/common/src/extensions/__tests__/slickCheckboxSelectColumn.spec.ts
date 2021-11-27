import { SlickCheckboxSelectColumn } from '../slickCheckboxSelectColumn';
import { Column, SlickGrid, SlickNamespace, } from '../../interfaces/index';
import { SlickRowSelectionModel } from '../../extensions/slickRowSelectionModel';

declare const Slick: SlickNamespace;

const addJQueryEventPropagation = function (event, commandKey = '', keyName = '', target?: HTMLElement) {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  if (commandKey) {
    Object.defineProperty(event, commandKey, { writable: true, configurable: true, value: true });
  }
  if (keyName) {
    Object.defineProperty(event, 'key', { writable: true, configurable: true, value: keyName });
  }
  if (target) {
    Object.defineProperty(event, 'target', { writable: true, configurable: true, value: target });
  }
  return event;
}

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
  isActive: jest.fn(),
};

const gridStub = {
  getEditorLock: () => getEditorLockMock,
  getColumns: jest.fn(),
  getDataItem: jest.fn(),
  getDataLength: jest.fn(),
  getOptions: jest.fn(),
  getSelectionModel: jest.fn(),
  getSelectedRows: jest.fn(),
  invalidateRow: jest.fn(),
  render: jest.fn(),
  registerPlugin: jest.fn(),
  setActiveCell: jest.fn(),
  setSelectionModel: jest.fn(),
  setSelectedRows: jest.fn(),
  updateColumnHeader: jest.fn(),
  onClick: new Slick.Event(),
  onHeaderClick: new Slick.Event(),
  onHeaderRowCellRendered: new Slick.Event(),
  onKeyDown: new Slick.Event(),
  onSelectedRowsChanged: new Slick.Event(),
} as unknown as SlickGrid;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  dispose: jest.fn(),
  getColumnDefinition: jest.fn(),
  onBeforeMoveRows: new Slick.Event(),
  onMoveRows: new Slick.Event(),
}));

const mockRowSelectionModel = {
  constructor: jest.fn(),
  init: jest.fn(),
  dispose: jest.fn(),
  getSelectedRows: jest.fn(),
  setSelectedRows: jest.fn(),
  getSelectedRanges: jest.fn(),
  setSelectedRanges: jest.fn(),
  onSelectedRangesChanged: new Slick.Event(),
} as unknown as SlickRowSelectionModel;

jest.mock('../../extensions/slickRowSelectionModel', () => ({
  SlickRowSelectionModel: jest.fn().mockImplementation(() => mockRowSelectionModel),
}));

describe('SlickCheckboxSelectColumn Plugin', () => {
  Slick.RowMoveManager = mockAddon;

  const mockColumns = [
    { id: 'firstName', field: 'firstName', name: 'First Name', },
    { id: 'lastName', field: 'lastName', name: 'Last Name', },
    { id: 'age', field: 'age', name: 'Age', },
  ] as Column[];
  let plugin: SlickCheckboxSelectColumn;

  beforeEach(() => {
    plugin = new SlickCheckboxSelectColumn();
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    // jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([]);
  });

  afterEach(() => {
    plugin?.dispose();
    jest.clearAllMocks();
  });

  it('should create the plugin with default options', () => {
    const expectedOptions = {
      columnId: '_checkbox_selector',
      cssClass: null,
      field: 'sel',
      hideSelectAllCheckbox: false,
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
    const updateColHeaderSpy = jest.spyOn(gridStub, 'updateColumnHeader');

    plugin.init(gridStub);
    plugin.setOptions({ hideInColumnTitleRow: true, hideInFilterHeaderRow: true, hideSelectAllCheckbox: true, cssClass: 'some-class' });

    expect(plugin).toBeTruthy();
    expect(plugin.addonOptions).toEqual({
      columnId: '_checkbox_selector',
      cssClass: 'some-class',
      field: 'sel',
      hideSelectAllCheckbox: true,
      toolTip: 'Select/Deselect All',
      width: 30,
      hideInColumnTitleRow: true,
      hideInFilterHeaderRow: true,
    });
    expect(updateColHeaderSpy).toHaveBeenCalledWith('_checkbox_selector', '', '');
  });

  it('should create the plugin and call "setOptions" and expect options changed and hide both Select All toggle when setting "hideSelectAllCheckbox: false" but both other hide flags are set to True', () => {
    const updateColHeaderSpy = jest.spyOn(gridStub, 'updateColumnHeader');

    plugin.init(gridStub);
    plugin.setOptions({ hideInColumnTitleRow: true, hideInFilterHeaderRow: true, hideSelectAllCheckbox: false, cssClass: 'some-class' });

    expect(plugin).toBeTruthy();
    expect(updateColHeaderSpy).toHaveBeenCalledWith('_checkbox_selector', '', '');
  });

  it('should create the plugin and call "setOptions" and expect options changed and render the Select All toggle when "hideInColumnTitleRow: false"', () => {
    const updateColHeaderSpy = jest.spyOn(gridStub, 'updateColumnHeader');
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);
    const setSelectedRowSpy = jest.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub);
    plugin.setOptions({ hideInColumnTitleRow: false, hideInFilterHeaderRow: true, hideSelectAllCheckbox: false, });

    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addJQueryEventPropagation(new Event('click'), '', '', checkboxElm);
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
    const stopImmediatePropagationSpy = jest.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onHeaderClick.notify({ column: { id: '_checkbox_selector', field: 'sel' }, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(updateColHeaderSpy).toHaveBeenCalledWith(
      '_checkbox_selector',
      `<input id="header-selector${plugin.selectAllUid}" type="checkbox"><label for="header-selector${plugin.selectAllUid}"></label>`,
      'Select/Deselect All'
    );
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).not.toHaveBeenCalled();
  });

  it('should create the plugin and expect "setSelectedRows" to called with all rows toggling to be selected', () => {
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(3);
    jest.spyOn(gridStub, 'getDataItem')
      .mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 })
      .mockReturnValueOnce({ firstName: 'Jane', lastName: 'Doe', age: 28 })
      .mockReturnValueOnce({ __group: true, __groupTotals: { age: { sum: 58 } } });
    const setSelectedRowSpy = jest.spyOn(gridStub, 'setSelectedRows');

    plugin.selectedRowsLookup = { 1: false, 2: true };
    plugin.init(gridStub);
    plugin.setOptions({ hideInColumnTitleRow: false, hideInFilterHeaderRow: true, hideSelectAllCheckbox: false, });

    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    checkboxElm.checked = true;
    const clickEvent = addJQueryEventPropagation(new Event('click'), '', '', checkboxElm);
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
    const stopImmediatePropagationSpy = jest.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onHeaderClick.notify({ column: { id: '_checkbox_selector', field: 'sel' }, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).toHaveBeenCalledWith([0, 1, 2]);
  });

  it('should create the plugin and call "setOptions" and expect options changed and hide both Select All toggle when setting "hideSelectAllCheckbox: false" and "hideInColumnTitleRow: true"', () => {
    const nodeElm = document.createElement('div');
    nodeElm.className = 'slick-headerrow-column';
    const updateColHeaderSpy = jest.spyOn(gridStub, 'updateColumnHeader');

    plugin = new SlickCheckboxSelectColumn({ hideInFilterHeaderRow: false, hideSelectAllCheckbox: false, });
    plugin.init(gridStub);
    gridStub.onHeaderRowCellRendered.notify({ column: { id: '_checkbox_selector', field: 'sel' }, node: nodeElm, grid: gridStub });
    plugin.setOptions({ hideInColumnTitleRow: true, hideInFilterHeaderRow: false, hideSelectAllCheckbox: false, });
    let filterSelectAll = plugin.headerRowNode.querySelector(`#filter-checkbox-selectall-container`) as HTMLSpanElement;

    expect(plugin).toBeTruthy();
    expect(updateColHeaderSpy).toHaveBeenCalledWith('_checkbox_selector', '', '');
    expect(filterSelectAll.style.display).toEqual('flex');

    filterSelectAll = plugin.headerRowNode.querySelector(`#filter-checkbox-selectall-container`) as HTMLSpanElement;
    plugin.hideSelectAllFromColumnHeaderFilterRow();
    expect(filterSelectAll.style.display).toEqual('none');
  });

  it('should call "deSelectRows" and expect "setSelectedRows" to be called with only the rows that are found in selectable lookup', () => {
    jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setSelectedRowSpy = jest.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub);
    plugin.selectedRowsLookup = { 1: false, 2: true };
    plugin.selectRows([1, 2, 3]);
    plugin.deSelectRows([1, 2, 3, 6, -1]);

    expect(setSelectedRowSpy).toHaveBeenNthCalledWith(2, [1]); // only 1 is found which was previous false
  });

  it('should pre-select some rows in a delay when "preselectedRows" is defined with a row selection model', (done) => {
    jest.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockRowSelectionModel);
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ preselectedRows: [1, 2] });
    jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([]);

    const selectRowSpy = jest.spyOn(plugin, 'selectRows');
    plugin.init(gridStub);

    setTimeout(() => {
      expect(selectRowSpy).toHaveBeenCalledWith([1, 2]);
      done();
    }, 1);
  });

  it('should call "toggleRowSelection" and expect toggled row to be added and called by the "setSelectedRows"', () => {
    jest.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
    const setSelectedRowSpy = jest.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub);
    plugin.selectRows([2, 3]);
    plugin.toggleRowSelection(2);

    expect(setActiveCellSpy).toHaveBeenCalledWith(2, 0);
    expect(setSelectedRowSpy).toHaveBeenNthCalledWith(2, [1, 2, 2]);
  });

  it('should call "toggleRowSelection" and expect "setActiveCell" not being called when the selectableOverride is returning false', () => {
    jest.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');

    plugin = new SlickCheckboxSelectColumn({ selectableOverride: () => false });
    plugin.init(gridStub);
    plugin.selectRows([2, 3]);
    plugin.toggleRowSelection(2);

    expect(setActiveCellSpy).not.toHaveBeenCalled();
  });

  it('should call "toggleRowSelection" and expect row to be removed when found in the selected rows lookup', () => {
    jest.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
    const setSelectedRowSpy = jest.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub);
    plugin.selectedRowsLookup = { 1: false, 2: true };
    plugin.selectRows([2, 3]);
    plugin.toggleRowSelection(2);

    expect(setSelectedRowSpy).toHaveBeenNthCalledWith(2, [1]);
    expect(setActiveCellSpy).toHaveBeenCalledWith(2, 0);
  });

  it('should fill the "selectableOverride" and expect', () => {
    jest.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 30 });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([1, 2]);
    const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');

    const mockOverrride = jest.fn();
    mockOverrride.mockReturnValue(false);

    plugin.init(gridStub);
    plugin.selectableOverride(mockOverrride);
    plugin.toggleRowSelection(2);

    expect(setActiveCellSpy).not.toHaveBeenCalled();
  });

  it('should create a new row selection column definition', () => {
    plugin = new SlickCheckboxSelectColumn();
    plugin.init(gridStub);

    expect(plugin.getColumnDefinition()).toEqual({
      id: '_checkbox_selector',
      name: `<input id="header-selector${plugin.selectAllUid}" type="checkbox"><label for="header-selector${plugin.selectAllUid}"></label>`,
      toolTip: 'Select/Deselect All',
      field: 'sel',
      cssClass: null,
      excludeFromExport: true,
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromQuery: true,
      excludeFromHeaderMenu: true,
      hideSelectAllCheckbox: false,
      resizable: false,
      sortable: false,
      width: 30,
      formatter: expect.toBeFunction(),
    });
  });

  it('should create the plugin and add the Toggle All checkbox in the filter header row and expect toggle all to work when clicked', () => {
    const setSelectedRowSpy = jest.spyOn(gridStub, 'setSelectedRows');
    const nodeElm = document.createElement('div');
    nodeElm.className = 'slick-headerrow-column';

    plugin = new SlickCheckboxSelectColumn({ hideInFilterHeaderRow: false, });
    plugin.init(gridStub);

    gridStub.onHeaderRowCellRendered.notify({ column: { id: '_checkbox_selector', field: 'sel' }, node: nodeElm, grid: gridStub });
    const checkboxContainerElm = nodeElm.querySelector('span#filter-checkbox-selectall-container');
    const inputCheckboxElm = checkboxContainerElm.querySelector('input[type=checkbox]');
    inputCheckboxElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));

    expect(inputCheckboxElm).toBeTruthy();
    expect(setSelectedRowSpy).toHaveBeenCalledWith([]);
  });

  it('should call the "create" method and expect plugin to be created with checkbox column to be created at position 0 when using default', () => {
    plugin.create(mockColumns, { checkboxSelector: { columnId: 'chk-id' } });

    expect(plugin).toBeTruthy();
    expect(mockColumns[0]).toEqual({
      cssClass: null,
      excludeFromColumnPicker: true,
      excludeFromExport: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      excludeFromQuery: true,
      field: 'sel',
      formatter: expect.toBeFunction(),
      hideSelectAllCheckbox: false,
      id: 'chk-id',
      name: `<input id="header-selector${plugin.selectAllUid}" type="checkbox"><label for="header-selector${plugin.selectAllUid}"></label>`,
      resizable: false,
      sortable: false,
      toolTip: 'Select/Deselect All',
      width: 30,
    });
  });

  it('should call the "create" method and expect plugin to be created at position 1 when defined', () => {
    plugin.create(mockColumns, { checkboxSelector: { columnIndexPosition: 1 } });

    expect(plugin).toBeTruthy();
    expect(mockColumns[1]).toEqual({
      cssClass: null,
      excludeFromColumnPicker: true,
      excludeFromExport: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      excludeFromQuery: true,
      field: 'sel',
      formatter: expect.toBeFunction(),
      hideSelectAllCheckbox: false,
      id: '_checkbox_selector',
      name: `<input id="header-selector${plugin.selectAllUid}" type="checkbox"><label for="header-selector${plugin.selectAllUid}"></label>`,
      resizable: false,
      sortable: false,
      toolTip: 'Select/Deselect All',
      width: 30,
    });
  });

  it('should process the "checkboxSelectionFormatter" and expect necessary Formatter to return null when selectableOverride is returning False', () => {
    plugin.selectableOverride(() => false);
    plugin.create(mockColumns, {});
    const output = plugin.getColumnDefinition().formatter(0, 0, null, { id: 'checkbox_selector', field: '' } as Column, { firstName: 'John', lastName: 'Doe', age: 33 }, gridStub);

    expect(plugin).toBeTruthy();
    expect(output).toEqual(null);
  });

  it('should process the "checkboxSelectionFormatter" and expect necessary Formatter to return null when selectableOverride is returning False', () => {
    plugin.init(gridStub);
    plugin.selectableOverride(() => true);
    const output = plugin.getColumnDefinition().formatter(0, 0, null, { id: 'checkbox_selector', field: '' } as Column, { firstName: 'John', lastName: 'Doe', age: 33 }, gridStub);

    expect(plugin).toBeTruthy();
    expect(output).toContain(`<input id="selector`);
    expect(output).toContain(`<label for="selector`);
  });

  it('should trigger "onClick" event and expect toggleRowSelection to be called', () => {
    const toggleRowSpy = jest.spyOn(plugin, 'toggleRowSelection');

    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addJQueryEventPropagation(new Event('click'), '', '', checkboxElm);
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
    const stopImmediatePropagationSpy = jest.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ cell: 0, row: 2, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(toggleRowSpy).toHaveBeenCalledWith(2);
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onClick" event and NOT expect toggleRowSelection to be called when editor "isActive" returns True and "commitCurrentEdit" returns False', () => {
    const toggleRowSpy = jest.spyOn(plugin, 'toggleRowSelection');
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);

    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addJQueryEventPropagation(new Event('click'), '', '', checkboxElm);
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
    const stopImmediatePropagationSpy = jest.spyOn(clickEvent, 'stopImmediatePropagation');
    gridStub.onClick.notify({ cell: 0, row: 2, grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(toggleRowSpy).not.toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onKeyDown" event and expect toggleRowSelection to be called when editor "isActive" returns False', () => {
    const toggleRowSpy = jest.spyOn(plugin, 'toggleRowSelection');
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);

    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const keyboardEvent = addJQueryEventPropagation(new Event('keyDown'), '', ' ', checkboxElm);
    const preventDefaultSpy = jest.spyOn(keyboardEvent, 'preventDefault');
    const stopImmediatePropagationSpy = jest.spyOn(keyboardEvent, 'stopImmediatePropagation');
    gridStub.onKeyDown.notify({ cell: 0, row: 2, grid: gridStub }, keyboardEvent);

    expect(plugin).toBeTruthy();
    expect(toggleRowSpy).toHaveBeenCalledWith(2);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onKeyDown" event and expect toggleRowSelection to be called when editor "commitCurrentEdit" returns True', () => {
    const toggleRowSpy = jest.spyOn(plugin, 'toggleRowSelection');
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);

    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const keyboardEvent = addJQueryEventPropagation(new Event('keyDown'), '', ' ', checkboxElm);
    const preventDefaultSpy = jest.spyOn(keyboardEvent, 'preventDefault');
    const stopImmediatePropagationSpy = jest.spyOn(keyboardEvent, 'stopImmediatePropagation');
    gridStub.onKeyDown.notify({ cell: 0, row: 2, grid: gridStub }, keyboardEvent);

    expect(plugin).toBeTruthy();
    expect(toggleRowSpy).toHaveBeenCalledWith(2);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should trigger "onSelectedRowsChanged" event and invalidate row and render to be called but without "setSelectedRows" when checkSelectableOverride returns True or not provided', () => {
    const invalidateRowSpy = jest.spyOn(gridStub, 'invalidateRow');
    const renderSpy = jest.spyOn(gridStub, 'render');
    const updateColumnHeaderSpy = jest.spyOn(gridStub, 'updateColumnHeader');
    const setSelectedRowSpy = jest.spyOn(gridStub, 'setSelectedRows');
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);

    plugin = new SlickCheckboxSelectColumn({ hideInColumnTitleRow: false, hideSelectAllCheckbox: false });
    plugin.init(gridStub);
    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addJQueryEventPropagation(new Event('keyDown'), '', ' ', checkboxElm);
    gridStub.onSelectedRowsChanged.notify({ rows: [2, 3], previousSelectedRows: [0, 1], grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(invalidateRowSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).not.toHaveBeenCalled();
    expect(updateColumnHeaderSpy).toHaveBeenCalledWith(
      '_checkbox_selector',
      `<input id="header-selector${plugin.selectAllUid}" type="checkbox"><label for="header-selector${plugin.selectAllUid}"></label>`,
      'Select/Deselect All'
    );
  });

  it('should trigger "onSelectedRowsChanged" event and invalidate row and render to be called also with "setSelectedRows" when checkSelectableOverride returns False and input select checkbox is all checked', () => {
    const nodeElm = document.createElement('div');
    nodeElm.className = 'slick-headerrow-column';
    const invalidateRowSpy = jest.spyOn(gridStub, 'invalidateRow');
    const renderSpy = jest.spyOn(gridStub, 'render');
    const updateColumnHeaderSpy = jest.spyOn(gridStub, 'updateColumnHeader');
    const setSelectedRowSpy = jest.spyOn(gridStub, 'setSelectedRows');
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);

    plugin = new SlickCheckboxSelectColumn({ hideInFilterHeaderRow: false, hideSelectAllCheckbox: false, selectableOverride: () => false });
    plugin.init(gridStub);
    plugin.selectedRowsLookup = { 1: false, 2: true };

    gridStub.onHeaderRowCellRendered.notify({ column: { id: '_checkbox_selector', field: 'sel' }, node: nodeElm, grid: gridStub });

    const checkboxElm = document.createElement('input');
    checkboxElm.type = 'checkbox';
    const clickEvent = addJQueryEventPropagation(new Event('keyDown'), '', ' ', checkboxElm);
    gridStub.onSelectedRowsChanged.notify({ rows: [2, 3], previousSelectedRows: [0, 1], grid: gridStub }, clickEvent);

    expect(plugin).toBeTruthy();
    expect(invalidateRowSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
    expect(setSelectedRowSpy).toHaveBeenCalled();
    expect(updateColumnHeaderSpy).toHaveBeenCalledWith(
      '_checkbox_selector',
      `<input id="header-selector${plugin.selectAllUid}" type="checkbox" checked="checked"><label for="header-selector${plugin.selectAllUid}"></label>`,
      'Select/Deselect All'
    );
  });
});
