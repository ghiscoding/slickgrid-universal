import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlickEvent, SlickRange, type SlickEditorLock, type SlickGrid } from '../../core/index.js';
import type { Column, GridOption } from '../../interfaces/index.js';
import { SlickCellRangeSelector } from '../slickCellRangeSelector.js';
import { SlickHybridSelectionModel } from '../slickHybridSelectionModel.js';

const GRID_UID = 'slickgrid_12345';
const NB_ITEMS = 200;
const CALCULATED_PAGE_ROW_COUNT = 23; // pageRowCount with our mocked sizes is 23 => ((600 - 17) / 25)

const addVanillaEventPropagation = function <T = any>(event: T, commandKeys: string[] = [], keyName = '') {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
  if (commandKeys.length) {
    for (const commandKey of commandKeys) {
      Object.defineProperty(event, commandKey, { writable: true, configurable: true, value: true });
    }
  }
  if (keyName) {
    Object.defineProperty(event, 'key', { writable: true, configurable: true, value: keyName });
  }
  return event;
};

const mockGridOptions = {
  frozenColumn: 1,
  frozenRow: -1,
  rowHeight: 25,
} as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: vi.fn(),
  isActive: vi.fn(),
} as unknown as SlickEditorLock;

const dataViewStub = {
  getLength: () => NB_ITEMS,
  getPagingInfo: () => ({ pageSize: 0 }),
};

const mockColumns = [
  { id: 'firstName', field: 'firstName' },
  { id: 'lastName', field: 'lastName' },
  { id: 'age', field: 'age' },
];

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

const gridStub = {
  canCellBeActive: vi.fn(),
  canCellBeSelected: vi.fn(),
  getActiveCell: vi.fn(),
  getActiveCanvasNode: vi.fn(),
  getCanvasNode: vi.fn(),
  getCellFromEvent: vi.fn(),
  getCellFromPoint: vi.fn(),
  getCellNodeBox: vi.fn(),
  getPubSubService: () => pubSubServiceStub,
  getColumns: () => mockColumns,
  getData: () => dataViewStub,
  getDataLength: vi.fn(),
  getEditorLock: () => getEditorLockMock,
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
  getViewportRowCount: () => 23,
  getVisibleColumns: vi.fn(),
  getScrollbarDimensions: () => ({ height: 17, width: 17 }),
  getViewportNode: vi.fn(),
  hasDataView: () => true,
  focus: vi.fn(),
  invalidate: vi.fn(),
  registerPlugin: vi.fn(),
  setActiveCell: vi.fn(),
  scrollCellIntoView: vi.fn(),
  scrollRowIntoView: vi.fn(),
  unregisterPlugin: vi.fn(),
  onActiveCellChanged: new SlickEvent(),
  onClick: new SlickEvent(),
  onKeyDown: new SlickEvent(),
  onCellRangeSelected: new SlickEvent(),
  onBeforeCellRangeSelected: new SlickEvent(),
} as unknown as SlickGrid;

describe('Row Selection Model Plugin', () => {
  let plugin: SlickHybridSelectionModel;
  let mockColumns: Column[] = [];
  const gridContainerElm = document.createElement('div');
  gridContainerElm.className = GRID_UID;
  const viewportElm = document.createElement('div');
  viewportElm.className = 'slick-viewport';
  const canvasTL = document.createElement('div');
  canvasTL.className = 'grid-canvas grid-canvas-top grid-canvas-left';
  const canvasTR = document.createElement('div');
  canvasTR.className = 'grid-canvas grid-canvas-top grid-canvas-right';
  const canvasBL = document.createElement('div');
  canvasBL.className = 'grid-canvas grid-canvas-bottom grid-canvas-left';
  const canvasBR = document.createElement('div');
  canvasBR.className = 'grid-canvas grid-canvas-bottom grid-canvas-right';
  viewportElm.appendChild(canvasTL);
  viewportElm.appendChild(canvasTR);
  viewportElm.appendChild(canvasBL);
  viewportElm.appendChild(canvasBR);
  gridContainerElm.appendChild(viewportElm);
  document.body.appendChild(gridContainerElm);
  Object.defineProperty(canvasTL, 'clientHeight', { writable: true, configurable: true, value: 12 });
  Object.defineProperty(canvasTR, 'clientHeight', { writable: true, configurable: true, value: 14 });
  Object.defineProperty(canvasTL, 'clientWidth', { writable: true, configurable: true, value: 32 });
  Object.defineProperty(canvasTR, 'clientWidth', { writable: true, configurable: true, value: 33 });
  vi.spyOn(gridStub, 'getCanvasNode').mockReturnValue(canvasTL);

  beforeEach(() => {
    mockColumns = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'age', field: 'age', name: 'Age' },
    ];
    plugin = new SlickHybridSelectionModel();
  });

  afterEach(() => {
    vi.clearAllMocks();
    plugin?.dispose();
    mockGridOptions.frozenColumn = -1;
    mockGridOptions.frozenRow = -1;
    mockGridOptions.frozenBottom = false;
    mockGridOptions.multiSelect = true;
    mockGridOptions.enableRowMoveManager = false;
    vi.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  it('should dispose the plugin when calling destroy', () => {
    const disposeSpy = vi.spyOn(plugin, 'dispose');
    plugin.destroy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should create the plugin and initialize it', () => {
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({
      autoScrollWhenDrag: true,
      cellRangeSelector: expect.any(SlickCellRangeSelector),
      dragToSelect: false,
      handleRowMoveManagerColumn: true,
      rowSelectColumnIdArr: [],
      rowSelectOverride: undefined,
      selectActiveCell: true,
      selectActiveRow: true,
    });
  });

  it('should create the plugin and initialize it with just "selectActiveRow" option and still expect the same result', () => {
    plugin = new SlickHybridSelectionModel({ selectActiveRow: false });
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({
      autoScrollWhenDrag: true,
      cellRangeSelector: expect.any(SlickCellRangeSelector),
      dragToSelect: false,
      handleRowMoveManagerColumn: true,
      rowSelectColumnIdArr: [],
      rowSelectOverride: undefined,
      selectActiveCell: true,
      selectActiveRow: false,
    });
  });

  it('should create the plugin and initialize it with just "selectActiveRow" option and still expect the same result', () => {
    plugin = new SlickHybridSelectionModel({ selectActiveRow: true });
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({
      autoScrollWhenDrag: true,
      cellRangeSelector: expect.any(SlickCellRangeSelector),
      dragToSelect: false,
      handleRowMoveManagerColumn: true,
      rowSelectColumnIdArr: [],
      rowSelectOverride: undefined,
      selectActiveCell: true,
      selectActiveRow: true,
    });
  });

  it('should expect that "setSelectedRows" is being triggered when "refreshSelections" is called with rowSelectColumnIdArr defined with column IDs', () => {
    vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValueOnce([{ id: 'firstName', field: 'firstName', name: 'First Name' }]);
    vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);

    plugin = new SlickHybridSelectionModel({ rowSelectColumnIdArr: ['firstName'], selectActiveRow: false });
    plugin.init(gridStub);

    vi.spyOn(plugin, 'getSelectedRows').mockReturnValue([0, 1]);
    const setSelectedRowsSpy = vi.spyOn(plugin, 'setSelectedRows');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 0, row: 3, grid: gridStub }, mouseEvent, gridStub);
    plugin.refreshSelections();

    expect(setSelectedRowsSpy).toHaveBeenCalledWith([0, 1]);
  });

  it('should expect that "setSelectedRows" is being triggered when "refreshSelections" is called with enableRowMoveManager enabled', () => {
    vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValueOnce([]);
    vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);
    mockGridOptions.enableRowMoveManager = true;
    mockColumns.unshift({ id: '_move', field: '_move', behavior: 'selectAndMove' });

    plugin = new SlickHybridSelectionModel({ selectActiveRow: false });
    plugin.init(gridStub);

    vi.spyOn(plugin, 'getSelectedRows').mockReturnValue([0, 1]);
    const setSelectedRowsSpy = vi.spyOn(plugin, 'setSelectedRows');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 0, row: 3, grid: gridStub }, mouseEvent, gridStub);
    plugin.refreshSelections();

    expect(setSelectedRowsSpy).toHaveBeenCalledWith([0, 1]);
  });

  it('should expect that "setSelectedRows" is being triggered when "refreshSelections" is called with rowSelectOverride returning true', () => {
    vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValueOnce([]);
    vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);

    plugin = new SlickHybridSelectionModel({ rowSelectOverride: () => true, selectActiveRow: false });
    plugin.init(gridStub);

    vi.spyOn(plugin, 'getSelectedRows').mockReturnValue([0, 1]);
    const setSelectedRowsSpy = vi.spyOn(plugin, 'setSelectedRows');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 0, row: 3, grid: gridStub }, mouseEvent, gridStub);
    plugin.refreshSelections();

    expect(setSelectedRowsSpy).toHaveBeenCalledWith([0, 1]);
  });

  it('should call "setSelectedRanges" when "setSelectedRows" is called', () => {
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

    const setSelectedRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRows([0, 2]);

    const expectedRanges = [
      { fromCell: 0, fromRow: 0, toCell: 2, toRow: 0 },
      { fromCell: 0, fromRow: 2, toCell: 2, toRow: 2 },
    ];
    expect(setSelectedRangeSpy).toHaveBeenCalledWith(expectedRanges, 'SlickHybridSelectionModel.setSelectedRows', '');
    expect(plugin.getSelectedRanges()).toEqual(expectedRanges);
    expect(plugin.getSelectedRows()).toEqual([0, 2]);
  });

  it('should call "setSelectedRanges" with empty range input and not expect to "onSelectedRangesChanged" to be triggered', () => {
    const onSelectedRangeSpy = vi.spyOn(plugin.onSelectedRangesChanged, 'notify');
    plugin.activeSelectionIsRow = true;
    plugin.setSelectedRanges([]);
    expect(onSelectedRangeSpy).not.toHaveBeenCalled();
  });

  it('should call "setSelectedRanges" with valid ranges input and expect to "onSelectedRangesChanged" to be triggered', () => {
    const onSelectedRangeSpy = vi.spyOn(plugin.onSelectedRangesChanged, 'notify');

    plugin.activeSelectionIsRow = true;
    plugin.setSelectedRanges([new SlickRange(0, 0, 0, 2)]);

    expect(onSelectedRangeSpy).toHaveBeenCalledWith(
      [new SlickRange(0, 0, 0, 2)],
      expect.objectContaining({
        event: expect.objectContaining({ detail: { caller: 'SlickHybridSelectionModel.setSelectedRanges', selectionMode: '' } }),
      })
    );
  });

  it('should call "setSelectedRanges" with valid ranges input with a "caller" defined and expect to "onSelectedRangesChanged" to be triggered', () => {
    const caller = 'click.toggle';
    const onSelectedRangeSpy = vi.spyOn(plugin.onSelectedRangesChanged, 'notify');

    plugin.activeSelectionIsRow = true;
    plugin.setSelectedRanges([new SlickRange(0, 0, 0, 2)], caller);

    expect(onSelectedRangeSpy).toHaveBeenCalledWith(
      [new SlickRange(0, 0, 0, 2)],
      expect.objectContaining({ event: expect.objectContaining({ detail: { caller, selectionMode: '' } }) })
    );
  });

  it('should call "setSelectedRanges" with Slick Ranges when triggered by "onActiveCellChanged" and "selectActiveRow" is True', () => {
    vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);

    plugin = new SlickHybridSelectionModel({ rowSelectOverride: () => true, selectActiveRow: true });
    plugin.init(gridStub);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 2, row: 3, grid: gridStub }, mouseEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{ fromCell: 0, fromRow: 3, toCell: 2, toRow: 3 }], undefined, '');
  });

  it('should call "setSelectedRanges" with Slick Range with a Down direction when triggered by "onKeyDown" with key combo of Shift+ArrowDown and expect 4 ranges', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 3, row: 2 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

    const mockRanges = [new SlickRange(3, 2, 4, 3), new SlickRange(2, 1, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        { fromCell: 0, fromRow: 2, toCell: 2, toRow: 2 },
        { fromCell: 0, fromRow: 3, toCell: 2, toRow: 3 },
        { fromCell: 0, fromRow: 4, toCell: 2, toRow: 4 },
        { fromCell: 0, fromRow: 5, toCell: 2, toRow: 5 },
      ],
      undefined,
      ''
    );
  });

  it('should call "setSelectedRanges" with Slick Range with an Up direction when triggered by "onKeyDown" with key combo of Shift+ArrowUp and expect 2 ranges', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

    const mockRanges = [new SlickRange(2, 1, 4, 3), new SlickRange(3, 2, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        { fromCell: 0, fromRow: 2, toCell: 2, toRow: 2 },
        { fromCell: 0, fromRow: 3, toCell: 2, toRow: 3 },
      ],
      undefined,
      ''
    );
  });

  it('should call "setSelectedRanges" with Slick Range with an Up direction when triggered by "onKeyDown" with key combo of Shift+ArrowUp and expect only 1 range when getRowsRange Top is higher than Bottom', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 0 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(plugin, 'getSelectedRows').mockReturnValue([3, 3]);

    const mockRanges = [new SlickRange(2, 1, 4, 3), new SlickRange(3, 2, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 5, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{ fromCell: 0, fromRow: 2, toCell: 2, toRow: 2 }], undefined, '');
  });

  it('should call "setSelectedRanges" with same Slick Range with an Up direction when triggered by "onKeyDown" with key combo of Shift+ArrowUp and expect 2 ranges even when "getSelectedRows" returns an empty array', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(plugin, 'getSelectedRows').mockReturnValue([]);

    const mockRanges = [new SlickRange(2, 1, 4, 3), new SlickRange(3, 2, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        { fromCell: 0, fromRow: 2, toCell: 2, toRow: 2 },
        { fromCell: 0, fromRow: 3, toCell: 2, toRow: 3 },
      ],
      undefined,
      ''
    );
  });

  it('should not call "setSelectedRanges" when triggered by "onClick" and "canCellBeActive" returns false', () => {
    vi.spyOn(gridStub, 'canCellBeActive').mockReturnValue(false);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

    const mockRanges = [new SlickRange(2, 1, 4, 3), new SlickRange(3, 2, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), ['ctrlKey']);
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).not.toHaveBeenCalled();
  });

  it('should not call "setSelectedRanges" when triggered by "onClick" and "multiSelect" grid option is false', () => {
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({ ...mockGridOptions, multiSelect: false });
    vi.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

    const mockRanges = [new SlickRange(2, 1, 4, 3), new SlickRange(3, 2, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), ['ctrlKey']);
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).not.toHaveBeenCalled();
  });

  it('should call "setSelectedRanges" with Slick Range when triggered by "onClick" with CtrlKey and expect 3 ranges', () => {
    vi.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

    const mockRanges = [new SlickRange(2, 1, 4, 3), new SlickRange(3, 2, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), ['ctrlKey']);
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        { fromCell: 0, fromRow: 2, toCell: 2, toRow: 2 },
        { fromCell: 0, fromRow: 4, toCell: 2, toRow: 4 },
        { fromCell: 0, fromRow: 4, toCell: 2, toRow: 4 },
      ],
      undefined,
      ''
    );
  });

  it('should call "setSelectedRanges" with Slick Range when triggered by "onClick" with ShiftKey and expect 2 ranges and "setActiveCell" to be called', () => {
    vi.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');

    const mockRanges = [new SlickRange(2, 1, 4, 3), new SlickRange(3, 2, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), ['shiftKey']);
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setActiveCellSpy).toHaveBeenCalledWith(3, 2);
    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        { fromCell: 0, fromRow: 3, toCell: 2, toRow: 3 },
        { fromCell: 0, fromRow: 4, toCell: 2, toRow: 4 },
      ],
      undefined,
      ''
    );
  });

  it('should call "setSelectedRanges" with Slick Range when triggered by "onClick" with ShiftKey and expect 4 ranges and "setActiveCell" to be called when cell row is not found in selection', () => {
    vi.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');

    const mockRanges = [new SlickRange(2, 1, 4, 3), new SlickRange(3, 2, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), ['shiftKey']);
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setActiveCellSpy).toHaveBeenCalledWith(1, 0);
    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        { fromCell: 0, fromRow: 1, toCell: 2, toRow: 1 },
        { fromCell: 0, fromRow: 2, toCell: 2, toRow: 2 },
        { fromCell: 0, fromRow: 3, toCell: 2, toRow: 3 },
        { fromCell: 0, fromRow: 4, toCell: 2, toRow: 4 },
      ],
      undefined,
      ''
    );
  });

  it('should not call "setSelectedRanges" when triggered by "onClick" and cell row is not found in selection', () => {
    vi.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    vi.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);

    const mockRanges = [new SlickRange(2, 1, 4, 3), new SlickRange(3, 2, 4, 3)] as unknown as SlickRange[];
    plugin.activeSelectionIsRow = true;
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), ['ctrlKey']);
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        { fromCell: 0, fromRow: 2, toCell: 2, toRow: 2 },
        { fromCell: 0, fromRow: 3, toCell: 2, toRow: 3 },
        { fromCell: 0, fromRow: 4, toCell: 2, toRow: 4 },
        { fromCell: 0, fromRow: 3, toCell: 2, toRow: 3 },
        { fromCell: 0, fromRow: 4, toCell: 2, toRow: 4 },
        { fromCell: 0, fromRow: 1, toCell: 2, toRow: 1 },
      ],
      undefined,
      ''
    );
  });

  describe('with Selector', () => {
    beforeEach(() => {
      plugin.activeSelectionIsRow = true;
      plugin.addonOptions.dragToSelect = true;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call "setSelectedRanges" when "onCellRangeSelected" event is triggered', () => {
      const setSelectedRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onCellRangeSelected.notify({ range: new SlickRange(3, 2, 5, 4) } as any, scrollEvent, gridStub);

      expect(plugin.currentSelectionModeIsRow()).toBe(true);
      expect(setSelectedRangeSpy).toHaveBeenCalledWith(
        [
          {
            fromCell: 0,
            fromRow: 3,
            toCell: 2,
            toRow: 5,
          },
        ],
        undefined,
        undefined
      );
    });

    it('should be able to manually create Row Selection and then call "setSelectedRanges" when "onCellRangeSelected" event is triggered', () => {
      vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);
      const setSelectedRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');

      plugin.addonOptions.cellRangeSelector = new SlickCellRangeSelector({
        selectionCss: {
          border: 'none',
        } as CSSStyleDeclaration,
        autoScroll: true,
        minIntervalToShowNextCell: 30,
        maxIntervalToShowNextCell: 500,
        accelerateInterval: 5,
      });
      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onCellRangeSelected.notify({ range: new SlickRange(3, 2, 5, 4) } as any, scrollEvent, gridStub);

      expect(setSelectedRangeSpy).toHaveBeenCalledWith([{ fromCell: 0, fromRow: 3, toCell: 2, toRow: 5 }], undefined, undefined);
    });

    it('should call "setSelectedRanges" when "onCellRangeSelected" event is triggered', () => {
      const setSelectedRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
      mockGridOptions.multiSelect = false;

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onCellRangeSelected.notify({ range: new SlickRange(3, 2, 5, 4) } as any, scrollEvent, gridStub);

      expect(setSelectedRangeSpy).not.toHaveBeenCalled();
    });

    it('should call "setActiveCell" when "onBeforeCellRangeSelected" event is triggered', () => {
      const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');
      mockGridOptions.multiSelect = false;

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onBeforeCellRangeSelected.notify({ row: 2, cell: 4 }, scrollEvent, gridStub);

      expect(setActiveCellSpy).toHaveBeenCalledWith(2, 4);
    });

    it('should NOT call "setActiveCell" when EditorLock isActive is returning True', () => {
      const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');
      vi.spyOn(getEditorLockMock, 'isActive').mockReturnValue(true);
      mockGridOptions.multiSelect = false;

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onBeforeCellRangeSelected.notify({ row: 2, cell: 4 }, scrollEvent, gridStub);

      expect(setActiveCellSpy).not.toHaveBeenCalled();
    });

    it('should call "setActiveCell" when RowMoveManager is enabled and the column cell does NOT have any "behavior" defined', () => {
      const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');
      vi.spyOn(getEditorLockMock, 'isActive').mockReturnValue(false);
      mockGridOptions.enableRowMoveManager = true;
      mockGridOptions.multiSelect = false;

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onBeforeCellRangeSelected.notify({ row: 2, cell: 1 }, scrollEvent, gridStub);

      expect(setActiveCellSpy).toHaveBeenCalledWith(2, 1);
    });

    it('should NOT call "setActiveCell" when RowMoveManager is enabled and the column cell has a "behavior" defined as "selectAndMove"', () => {
      const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');
      vi.spyOn(getEditorLockMock, 'isActive').mockReturnValue(false);
      mockGridOptions.enableRowMoveManager = true;
      mockGridOptions.multiSelect = false;
      mockColumns.unshift({ id: '_move', field: '_move', behavior: 'selectAndMove' });
      vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);

      plugin.activeSelectionIsRow = true;
      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onBeforeCellRangeSelected.notify({ row: 2, cell: 0 }, scrollEvent, gridStub);

      expect(setActiveCellSpy).not.toHaveBeenCalled();
    });
  });
});

describe('Cell Selection Model Plugin', () => {
  let plugin: SlickHybridSelectionModel;
  const gridContainerElm = document.createElement('div');
  gridContainerElm.className = GRID_UID;
  const viewportElm = document.createElement('div');
  viewportElm.className = 'slick-viewport';
  const canvasTL = document.createElement('div');
  canvasTL.className = 'grid-canvas grid-canvas-top grid-canvas-left';
  const canvasTR = document.createElement('div');
  canvasTR.className = 'grid-canvas grid-canvas-top grid-canvas-right';
  const canvasBL = document.createElement('div');
  canvasBL.className = 'grid-canvas grid-canvas-bottom grid-canvas-left';
  const canvasBR = document.createElement('div');
  canvasBR.className = 'grid-canvas grid-canvas-bottom grid-canvas-right';
  viewportElm.appendChild(canvasTL);
  viewportElm.appendChild(canvasTR);
  viewportElm.appendChild(canvasBL);
  viewportElm.appendChild(canvasBR);
  gridContainerElm.appendChild(viewportElm);
  document.body.appendChild(gridContainerElm);
  Object.defineProperty(canvasTL, 'clientHeight', { writable: true, configurable: true, value: 12 });
  Object.defineProperty(canvasTR, 'clientHeight', { writable: true, configurable: true, value: 14 });
  Object.defineProperty(canvasTL, 'clientWidth', { writable: true, configurable: true, value: 32 });
  Object.defineProperty(canvasTR, 'clientWidth', { writable: true, configurable: true, value: 33 });
  vi.spyOn(gridStub, 'getCanvasNode').mockReturnValue(canvasTL);

  beforeEach(() => {
    plugin = new SlickHybridSelectionModel();
    vi.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewportElm);
    Object.defineProperty(viewportElm, 'clientHeight', { writable: true, configurable: true, value: 600 });
  });

  afterEach(() => {
    vi.clearAllMocks();
    plugin?.dispose();
    mockGridOptions.frozenColumn = -1;
    mockGridOptions.frozenRow = -1;
    mockGridOptions.frozenBottom = false;
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
    expect(plugin.getCellRangeSelector()).toBeUndefined();
  });

  it('should dispose the plugin when calling destroy', () => {
    const disposeSpy = vi.spyOn(plugin, 'dispose');
    plugin.destroy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should create the plugin and initialize it', () => {
    const registerSpy = vi.spyOn(gridStub, 'registerPlugin');

    plugin.init(gridStub);

    expect(plugin.getCellRangeSelector()).toBeTruthy();
    expect(plugin.addonOptions).toEqual({
      autoScrollWhenDrag: true,
      cellRangeSelector: expect.any(SlickCellRangeSelector),
      dragToSelect: false,
      handleRowMoveManagerColumn: true,
      rowSelectColumnIdArr: [],
      rowSelectOverride: undefined,
      selectActiveCell: true,
      selectActiveRow: true,
    });
    expect(registerSpy).toHaveBeenCalledWith(plugin.getCellRangeSelector());
  });

  it('should create the plugin and initialize it with just "selectActiveCell" option and still expect the same result', () => {
    const registerSpy = vi.spyOn(gridStub, 'registerPlugin');

    plugin = new SlickHybridSelectionModel({ selectActiveCell: false, cellRangeSelector: undefined as any });
    plugin.init(gridStub);

    expect(plugin.getCellRangeSelector()).toBeTruthy();
    expect(plugin.addonOptions).toEqual({
      autoScrollWhenDrag: true,
      cellRangeSelector: expect.any(SlickCellRangeSelector),
      dragToSelect: false,
      handleRowMoveManagerColumn: true,
      rowSelectColumnIdArr: [],
      rowSelectOverride: undefined,
      selectActiveCell: false,
      selectActiveRow: true,
    });
    expect(registerSpy).toHaveBeenCalledWith(plugin.getCellRangeSelector());
  });

  it('should create the plugin and initialize it with just "selectActiveCell" option and still expect the same result', () => {
    const registerSpy = vi.spyOn(gridStub, 'registerPlugin');

    const mockCellRangeSelector = new SlickCellRangeSelector({
      selectionCss: { border: '2px solid gray' } as CSSStyleDeclaration,
      copyToSelectionCss: { border: '2px solid purple' } as CSSStyleDeclaration,
    });
    plugin = new SlickHybridSelectionModel({ cellRangeSelector: mockCellRangeSelector, selectActiveCell: true });
    plugin.init(gridStub);

    expect(plugin.getCellRangeSelector()).toBeTruthy();
    expect(plugin.addonOptions).toEqual({
      autoScrollWhenDrag: true,
      cellRangeSelector: mockCellRangeSelector,
      dragToSelect: false,
      handleRowMoveManagerColumn: true,
      rowSelectColumnIdArr: [],
      rowSelectOverride: undefined,
      selectActiveCell: true,
      selectActiveRow: true,
    });
    expect(registerSpy).toHaveBeenCalledWith(plugin.getCellRangeSelector());
  });

  it('should expect that "setSelectedRanges" is being triggered when "refreshSelections" is called', () => {
    const registerSpy = vi.spyOn(gridStub, 'registerPlugin');

    plugin = new SlickHybridSelectionModel({ selectActiveCell: false, cellRangeSelector: undefined as any });
    plugin.init(gridStub);

    vi.spyOn(plugin, 'getSelectedRanges').mockReturnValue([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 },
    ] as unknown as SlickRange[]);
    const setSelectedRangesSpy = vi.spyOn(plugin, 'setSelectedRanges');
    plugin.refreshSelections();

    expect(plugin.getCellRangeSelector()).toBeTruthy();
    expect(registerSpy).toHaveBeenCalledWith(plugin.getCellRangeSelector());
    expect(setSelectedRangesSpy).toHaveBeenCalledWith(
      [
        { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
        { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 },
      ],
      undefined,
      ''
    );
  });

  it('should return False when onBeforeCellRangeSelected is called, getEditorLock returns False and the current cell is the active cell (within editor)', () => {
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    const stopPropSpy = vi.spyOn(mouseEvent, 'stopPropagation');

    plugin.init(gridStub);
    const output = plugin.getCellRangeSelector().onBeforeCellRangeSelected.notify({ cell: 2, row: 3 }, mouseEvent, gridStub).getReturnValue();

    expect(output).toBeFalsy();
    expect(stopPropSpy).toHaveBeenCalled();
  });

  it('should call "setSelectedRanges" when "onCellRangeSelected"', () => {
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const setActiveCellSpy = vi.spyOn(gridStub, 'setActiveCell');
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');

    plugin.init(gridStub);
    plugin
      .getCellRangeSelector()
      .onCellRangeSelected.notify(
        { range: { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 } as SlickRange, allowAutoEdit: false, selectionMode: 'SEL' },
        mouseEvent,
        gridStub
      );

    expect(setActiveCellSpy).toHaveBeenCalledWith(2, 1, false, false, true);
    expect(setSelectRangeSpy).toHaveBeenCalledWith([{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }], undefined, 'SEL');
  });

  it('should call "setSelectedRanges" with Slick Ranges when triggered by "onActiveCellChanged" and "selectActiveCell" is True', () => {
    vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValueOnce([]);
    plugin = new SlickHybridSelectionModel({ selectActiveCell: true, cellRangeSelector: undefined as any });
    plugin.init(gridStub);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 2, row: 3, grid: gridStub }, mouseEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        {
          fromCell: 2,
          fromRow: 3,
          toCell: 2,
          toRow: 3,
        },
      ],
      undefined,
      ''
    );
  });

  it('should call "setSelectedRanges" with empty array when triggered by "onActiveCellChanged" and "selectActiveCell" is False', () => {
    vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValueOnce([]);
    plugin = new SlickHybridSelectionModel({ selectActiveCell: false, cellRangeSelector: undefined as any });
    plugin.init(gridStub);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 2, row: 3, grid: gridStub }, mouseEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([], undefined, '');
  });

  it('should call "setSelectedRanges" with Slick Range with a Left direction when triggered by "onKeyDown" with key combo of Shift+ArrowLeft', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 },
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowLeft');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        {
          fromCell: 2,
          fromRow: 3,
          toCell: 2,
          toRow: 3,
        },
      ],
      undefined,
      ''
    );
  });

  it('should call "setSelectedRanges" with Slick Range with a Right direction when triggered by "onKeyDown" with key combo of Shift+ArrowRight', () => {
    // let's test this one without a DataView (aka SlickGrid only)
    vi.spyOn(gridStub, 'hasDataView').mockReturnValueOnce(false);
    vi.spyOn(gridStub, 'getDataLength').mockReturnValueOnce(NB_ITEMS);
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowRight');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        {
          fromCell: 2,
          fromRow: 3,
          toCell: 2,
          toRow: 3,
        },
      ],
      undefined,
      ''
    );
  });

  it('should call "setSelectedRanges" with Slick Range with an Up direction when triggered by "onKeyDown" with key combo of Shift+ArrowUp', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        {
          fromCell: 2,
          fromRow: 3,
          toCell: 2,
          toRow: 3,
        },
      ],
      undefined,
      ''
    );
  });

  it('should call "setSelectedRanges" with Slick Range with a Down direction when triggered by "onKeyDown" with key combo of Shift+ArrowDown', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith(
      [
        {
          fromCell: 2,
          fromRow: 3,
          toCell: 2,
          toRow: 3,
        },
      ],
      undefined,
      ''
    );
  });

  it('should call "setSelectedRanges" with Slick Range and expect with "canCellBeSelected" returning True', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollRowSpy = vi.spyOn(gridStub, 'scrollRowIntoView');
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');
    const onSelectedRangeSpy = vi.spyOn(plugin.onSelectedRangesChanged, 'notify');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: 2, fromRow: 3, toCell: 2, toRow: 4 } as unknown as SlickRange,
    ];

    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(4, 2, false);
    expect(scrollRowSpy).toHaveBeenCalledWith(4);
    expect(onSelectedRangeSpy).toHaveBeenCalledWith(
      expectedRangeCalled,
      expect.objectContaining({
        event: expect.objectContaining({
          detail: { addDragHandle: true, caller: 'SlickHybridSelectionModel.setSelectedRanges', selectionMode: '' },
        }),
      })
    );
  });

  it('should call "setSelectedRanges" with Slick Range from current position to a calculated size of a page down when using Shift+PageDown key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 3;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.resetPageRowCount();
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 4, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'PageDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: 2, fromRow: 3, toCell: 2, toRow: notifyingRowNumber + CALCULATED_PAGE_ROW_COUNT },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(notifyingRowNumber + CALCULATED_PAGE_ROW_COUNT, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to the last row index when using Shift+PageDown key combo but there is less rows than an actual page left to display', () => {
    const notifyingRowNumber = NB_ITEMS - 10; // will be less than a page size (row count)
    const lastRowIndex = NB_ITEMS - 1;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 4, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'PageDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 2, toRow: lastRowIndex },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(lastRowIndex, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to a calculated size of a page up when using Shift+PageUp key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const CALCULATED_PAGE_ROW_COUNT = 23;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'PageUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: 2, fromRow: notifyingRowNumber - CALCULATED_PAGE_ROW_COUNT, toCell: 2, toRow: 100 },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(notifyingRowNumber - CALCULATED_PAGE_ROW_COUNT, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to the first row index when using Shift+PageUp key combo but there is less rows than an actual page left to display', () => {
    const notifyingRowNumber = 10; // will be less than a page size (row count)
    const firstRowIndex = 0;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 4, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'PageUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: 2, fromRow: firstRowIndex, toCell: 2, toRow: notifyingRowNumber },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(firstRowIndex, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to row index 0 horizontally when using Shift+Home key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const expectedRowZeroIdx = 0;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'Home');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: expectedRowZeroIdx, fromRow: notifyingRowNumber, toCell: 2, toRow: 100 },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(100, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to row index 0 horizontally when using Shift+Ctrl+ArrowLeft key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const expectedRowZeroIdx = 0;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['ctrlKey', 'shiftKey'], 'ArrowLeft');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: expectedRowZeroIdx, fromRow: notifyingRowNumber, toCell: 2, toRow: 100 },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(100, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to same row last cell index horizontally when using Shift+End key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const columnsLn = mockColumns.length;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'End');
    gridStub.onKeyDown.notify({ cell: 1, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: columnsLn - 1, fromRow: notifyingRowNumber, toCell: 2, toRow: 100 },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(100, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to same row last cell index horizontally when using Shift+Ctrl+ArrowRight key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const columnsLn = mockColumns.length;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['ctrlKey', 'shiftKey'], 'ArrowRight');
    gridStub.onKeyDown.notify({ cell: 1, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: columnsLn - 1, fromRow: notifyingRowNumber, toCell: 2, toRow: 100 },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(100, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to grid top on same column when using Ctrl+Shift+ArrowUp key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['ctrlKey', 'shiftKey'], 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: 2, fromRow: 0, toCell: 2, toRow: 100 },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(100, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to grid bottom on same column when using Ctrl+Shift+ArrowDown key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['ctrlKey', 'shiftKey'], 'ArrowDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: 2, fromRow: 100, toCell: 2, toRow: NB_ITEMS - 1 },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(NB_ITEMS - 1, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to cell,row index 0 when using Ctrl+Shift+Home key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const expectedRowZeroIdx = 0;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['ctrlKey', 'shiftKey'], 'Home');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: 0, fromRow: expectedRowZeroIdx, toCell: 2, toRow: 100 },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(expectedRowZeroIdx, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to last row index when using Ctrl+Shift+End key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const expectedLastRowIdx = NB_ITEMS - 1;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['ctrlKey', 'shiftKey'], 'End');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 2, toRow: expectedLastRowIdx },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(expectedLastRowIdx, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to row index 0 horizontally when using Ctrl+A key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const expectedRowZeroIdx = 0;
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = vi.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false },
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = vi.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['ctrlKey'], 'a');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.any(Function) } as unknown as SlickRange,
      { fromCell: expectedRowZeroIdx, fromRow: expectedRowZeroIdx, toCell: 2, toRow: NB_ITEMS - 1 },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, undefined, '');
    expect(scrollCellSpy).toHaveBeenCalledWith(NB_ITEMS - 1, expectedRowZeroIdx, false);
  });

  it('should call "rangesAreEqual" and expect True when both ranges are equal', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    const output = plugin.rangesAreEqual(
      [{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 } as SlickRange],
      [{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 } as SlickRange]
    );

    expect(output).toBe(true);
  });

  it('should call "rangesAreEqual" and expect False when both ranges are not equal', () => {
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    const output = plugin.rangesAreEqual(
      [{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 } as SlickRange],
      [{ fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 } as SlickRange]
    );

    expect(output).toBe(false);
  });

  it('should return an empty range array when calling "canCellBeSelected" return false on all ranges', () => {
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(false);

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 },
    ] as unknown as SlickRange[]);
    const output = plugin.removeInvalidRanges([{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }] as SlickRange[]);

    expect(output).toEqual([]);
  });

  it('should return an same range array when calling "canCellBeSelected" return true for all ranges', () => {
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 },
    ] as unknown as SlickRange[];

    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);
    const output = plugin.removeInvalidRanges([{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }] as SlickRange[]);

    expect(output).toEqual([mockRanges[0]]);
    expect(plugin.getSelectedRanges()).toEqual(mockRanges);
  });
});
