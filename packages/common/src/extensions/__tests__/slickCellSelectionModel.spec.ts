import 'jest-extended';

import { GridOption, SlickGrid, SlickNamespace, SlickRange, } from '../../interfaces/index';
import { SlickCellRangeSelector } from '../slickCellRangeSelector';
import { SlickCellSelectionModel } from '../slickCellSelectionModel';

declare const Slick: SlickNamespace;
const GRID_UID = 'slickgrid_12345';
const NB_ITEMS = 200;
const CALCULATED_PAGE_ROW_COUNT = 23; // pageRowCount with our mocked sizes is 23 => ((600 - 17) / 25)
jest.mock('flatpickr', () => { });

const addVanillaEventPropagation = function (event, commandKeys: string[] = [], keyName = '') {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  if (commandKeys.length) {
    for (const commandKey of commandKeys) {
      Object.defineProperty(event, commandKey, { writable: true, configurable: true, value: true });
    }
  }
  if (keyName) {
    Object.defineProperty(event, 'key', { writable: true, configurable: true, value: keyName });
  }
  return event;
}

const mockGridOptions = {
  frozenColumn: 1,
  frozenRow: -1,
  rowHeight: 25
} as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
  isActive: jest.fn(),
};

const dataViewStub = {
  getLength: () => NB_ITEMS,
  getPagingInfo: () => ({ pageSize: 0 }),
};

const mockColumns = [
  { id: 'firstName', field: 'firstName' },
  { id: 'lastName', field: 'lastName' },
  { id: 'age', field: 'age' },
]

const gridStub = {
  canCellBeSelected: jest.fn(),
  getActiveCell: jest.fn(),
  getActiveCanvasNode: jest.fn(),
  getCanvasNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getCellFromPoint: jest.fn(),
  getCellNodeBox: jest.fn(),
  getColumns: () => mockColumns,
  getData: () => dataViewStub,
  getDataLength: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
  getScrollbarDimensions: () => ({ height: 17, width: 17 }),
  getViewportNode: jest.fn(),
  focus: jest.fn(),
  registerPlugin: jest.fn(),
  setActiveCell: jest.fn(),
  scrollCellIntoView: jest.fn(),
  scrollRowIntoView: jest.fn(),
  unregisterPlugin: jest.fn(),
  onActiveCellChanged: new Slick.Event(),
  onKeyDown: new Slick.Event(),
  onCellRangeSelected: new Slick.Event(),
  onBeforeCellRangeSelected: new Slick.Event(),
} as unknown as SlickGrid;

describe('CellSelectionModel Plugin', () => {
  let plugin: SlickCellSelectionModel;
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
  jest.spyOn(gridStub, 'getCanvasNode').mockReturnValue(canvasTL);

  beforeEach(() => {
    plugin = new SlickCellSelectionModel();
    jest.spyOn(gridStub, 'getViewportNode').mockReturnValue(viewportElm);
    Object.defineProperty(viewportElm, 'clientHeight', { writable: true, configurable: true, value: 600 });
  });

  afterEach(() => {
    jest.clearAllMocks();
    plugin?.dispose();
    mockGridOptions.frozenColumn = -1;
    mockGridOptions.frozenRow = -1;
    mockGridOptions.frozenBottom = false;
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
    expect(plugin.cellRangeSelector).toBeTruthy();
  });

  it('should dispose the plugin when calling destroy', () => {
    const disposeSpy = jest.spyOn(plugin, 'dispose');
    plugin.destroy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should create the plugin and initialize it', () => {
    const registerSpy = jest.spyOn(gridStub, 'registerPlugin');

    plugin.init(gridStub);

    expect(plugin.cellRangeSelector).toBeTruthy();
    expect(plugin.addonOptions).toEqual({ selectActiveCell: true });
    expect(registerSpy).toHaveBeenCalledWith(plugin.cellRangeSelector);
  });

  it('should create the plugin and initialize it with just "selectActiveCell" option and still expect the same result', () => {
    const registerSpy = jest.spyOn(gridStub, 'registerPlugin');

    plugin = new SlickCellSelectionModel({ selectActiveCell: false, cellRangeSelector: undefined as any });
    plugin.init(gridStub);

    expect(plugin.cellRangeSelector).toBeTruthy();
    expect(plugin.addonOptions).toEqual({ selectActiveCell: false });
    expect(registerSpy).toHaveBeenCalledWith(plugin.cellRangeSelector);
  });

  it('should create the plugin and initialize it with just "selectActiveCell" option and still expect the same result', () => {
    const registerSpy = jest.spyOn(gridStub, 'registerPlugin');

    const mockCellRangeSelector = new SlickCellRangeSelector({ selectionCss: { border: '2px solid black' } as CSSStyleDeclaration });
    plugin = new SlickCellSelectionModel({ cellRangeSelector: mockCellRangeSelector, selectActiveCell: true });
    plugin.init(gridStub);

    expect(plugin.cellRangeSelector).toBeTruthy();
    expect(plugin.addonOptions).toEqual({ selectActiveCell: true, cellRangeSelector: mockCellRangeSelector });
    expect(registerSpy).toHaveBeenCalledWith(plugin.cellRangeSelector);
  });

  it('should expect that "setSelectedRanges" is being triggered when "refreshSelections" is called', () => {
    const registerSpy = jest.spyOn(gridStub, 'registerPlugin');

    plugin = new SlickCellSelectionModel({ selectActiveCell: false, cellRangeSelector: undefined as any });
    plugin.init(gridStub);

    jest.spyOn(plugin, 'getSelectedRanges').mockReturnValue([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ]);
    const setSelectedRangesSpy = jest.spyOn(plugin, 'setSelectedRanges');
    plugin.refreshSelections();

    expect(plugin.cellRangeSelector).toBeTruthy();
    expect(registerSpy).toHaveBeenCalledWith(plugin.cellRangeSelector);
    expect(setSelectedRangesSpy).toHaveBeenCalledWith([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ]);
  });

  it('should return False when onBeforeCellRangeSelected is called and getEditorLock returns False', () => {
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const stopPropSpy = jest.spyOn(mouseEvent, 'stopPropagation');

    plugin.init(gridStub);
    const output = plugin.cellRangeSelector.onBeforeCellRangeSelected.notify({ cell: 2, row: 3 }, mouseEvent, gridStub).getReturnValue();

    expect(output).toBeFalsy();
    expect(stopPropSpy).toHaveBeenCalled();
  });

  it('should call "setSelectedRanges" when "onCellRangeSelected"', () => {
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');

    plugin.init(gridStub);
    plugin.cellRangeSelector.onCellRangeSelected.notify({ range: { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 } }, mouseEvent, gridStub);

    expect(setActiveCellSpy).toHaveBeenCalledWith(2, 1, false, false, true);
    expect(setSelectRangeSpy).toHaveBeenCalledWith([{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }]);
  });

  it('should call "setSelectedRanges" with Slick Ranges when triggered by "onActiveCellChanged" and "selectActiveCell" is True', () => {
    plugin = new SlickCellSelectionModel({ selectActiveCell: true, cellRangeSelector: undefined as any });
    plugin.init(gridStub);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 2, row: 3, grid: gridStub }, mouseEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 2, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with empty array when triggered by "onActiveCellChanged" and "selectActiveCell" is False', () => {
    plugin = new SlickCellSelectionModel({ selectActiveCell: false, cellRangeSelector: undefined as any });
    plugin.init(gridStub);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 2, row: 3, grid: gridStub }, mouseEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([]);
  });

  it('should call "setSelectedRanges" with Slick Range with a Left direction when triggered by "onKeyDown" with key combo of Shift+ArrowLeft', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowLeft');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 2, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range with a Right direction when triggered by "onKeyDown" with key combo of Shift+ArrowRight', () => {
    // let's test this one without a DataView (aka SlickGrid only)
    jest.spyOn(gridStub, 'getData').mockReturnValueOnce([]);
    jest.spyOn(gridStub, 'getDataLength').mockReturnValueOnce(NB_ITEMS);
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowRight');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 2, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range with an Up direction when triggered by "onKeyDown" with key combo of Shift+ArrowUp', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 2, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range with a Down direction when triggered by "onKeyDown" with key combo of Shift+ArrowDown', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 2, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range and expect with "canCellBeSelected" returning True', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollRowSpy = jest.spyOn(gridStub, 'scrollRowIntoView');
    const scrollCellSpy = jest.spyOn(gridStub, 'scrollCellIntoView');
    const onSelectedRangeSpy = jest.spyOn(plugin.onSelectedRangesChanged, 'notify');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'ArrowDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: expect.toBeFunction(), } as unknown as SlickRange,
      {
        fromCell: 2, fromRow: 3, toCell: 2, toRow: 4,
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled);
    expect(scrollCellSpy).toHaveBeenCalledWith(4, 2, false);
    expect(scrollRowSpy).toHaveBeenCalledWith(4);
    expect(onSelectedRangeSpy).toHaveBeenCalledWith(expectedRangeCalled, expect.objectContaining({ detail: { caller: 'SlickCellSelectionModel.setSelectedRanges' } }));
  });

  it('should call "setSelectedRanges" with Slick Range from current position to a calculated size of a page down when using Shift+PageDown key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 3;
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = jest.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.resetPageRowCount();
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 4, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'PageDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: expect.toBeFunction(), } as unknown as SlickRange,
      {
        fromCell: 2, fromRow: 3, toCell: 2, toRow: (notifyingRowNumber + CALCULATED_PAGE_ROW_COUNT),
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled);
    expect(scrollCellSpy).toHaveBeenCalledWith((notifyingRowNumber + CALCULATED_PAGE_ROW_COUNT), 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to the last row index when using Shift+PageDown key combo but there is less rows than an actual page left to display', () => {
    const notifyingRowNumber = NB_ITEMS - 10; // will be less than a page size (row count)
    const lastRowIndex = NB_ITEMS - 1;
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = jest.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 4, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'PageDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: expect.toBeFunction(), } as unknown as SlickRange,
      {
        fromCell: 2, fromRow: notifyingRowNumber, toCell: 2, toRow: lastRowIndex,
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled);
    expect(scrollCellSpy).toHaveBeenCalledWith(lastRowIndex, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to a calculated size of a page up when using Shift+PageUp key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const CALCULATED_PAGE_ROW_COUNT = 23;
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = jest.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'PageUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.toBeFunction(), } as unknown as SlickRange,
      {
        fromCell: 2, fromRow: (notifyingRowNumber - CALCULATED_PAGE_ROW_COUNT), toCell: 2, toRow: 100,
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled);
    expect(scrollCellSpy).toHaveBeenCalledWith((notifyingRowNumber - CALCULATED_PAGE_ROW_COUNT), 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to the first row index when using Shift+PageUp key combo but there is less rows than an actual page left to display', () => {
    const notifyingRowNumber = 10; // will be less than a page size (row count)
    const firstRowIndex = 0;
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = jest.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 4, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'PageUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: expect.toBeFunction(), } as unknown as SlickRange,
      {
        fromCell: 2, fromRow: firstRowIndex, toCell: 2, toRow: notifyingRowNumber,
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled);
    expect(scrollCellSpy).toHaveBeenCalledWith(firstRowIndex, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to row index 0 horizontally when using Shift+Home key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const expectedRowZeroIdx = 0;
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = jest.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'Home');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.toBeFunction(), } as unknown as SlickRange,
      {
        fromCell: expectedRowZeroIdx, fromRow: notifyingRowNumber, toCell: 2, toRow: 100,
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled);
    expect(scrollCellSpy).toHaveBeenCalledWith(100, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to same row last cell index horizontally when using Shift+End key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const columnsLn = mockColumns.length;
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = jest.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['shiftKey'], 'End');
    gridStub.onKeyDown.notify({ cell: 1, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.toBeFunction(), } as unknown as SlickRange,
      {
        fromCell: columnsLn - 1, fromRow: notifyingRowNumber, toCell: 2, toRow: 100,
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled);
    expect(scrollCellSpy).toHaveBeenCalledWith(100, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to cell,row index 0 when using Ctrl+Shift+Home key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const expectedRowZeroIdx = 0;
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = jest.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['ctrlKey', 'shiftKey'], 'Home');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.toBeFunction(), } as unknown as SlickRange,
      {
        fromCell: 0, fromRow: expectedRowZeroIdx, toCell: 2, toRow: 100,
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled);
    expect(scrollCellSpy).toHaveBeenCalledWith(expectedRowZeroIdx, 2, false);
  });

  it('should call "setSelectedRanges" with Slick Range from current position to last row index when using Ctrl+Shift+End key combo when triggered by "onKeyDown"', () => {
    const notifyingRowNumber = 100;
    const expectedLastRowIdx = NB_ITEMS - 1;
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: notifyingRowNumber });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const scrollCellSpy = jest.spyOn(gridStub, 'scrollCellIntoView');

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: () => false },
      { fromCell: 2, fromRow: notifyingRowNumber, toCell: 3, toRow: 120, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), ['ctrlKey', 'shiftKey'], 'End');
    gridStub.onKeyDown.notify({ cell: 2, row: 101, grid: gridStub }, keyDownEvent, gridStub);

    const expectedRangeCalled = [
      { fromCell: 1, fromRow: 99, toCell: 3, toRow: 120, contains: expect.toBeFunction(), } as unknown as SlickRange,
      {
        fromCell: 2, fromRow: notifyingRowNumber, toCell: 2, toRow: expectedLastRowIdx,
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      },
    ];
    expect(setSelectRangeSpy).toHaveBeenCalledWith(expectedRangeCalled);
    expect(scrollCellSpy).toHaveBeenCalledWith(expectedLastRowIdx, 2, false);
  });

  it('should call "rangesAreEqual" and expect True when both ranges are equal', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    const output = plugin.rangesAreEqual(
      [{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }],
      [{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }]
    );

    expect(output).toBeTrue();
  });

  it('should call "rangesAreEqual" and expect False when both ranges are not equal', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    const output = plugin.rangesAreEqual(
      [{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }],
      [{ fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }]
    );

    expect(output).toBeFalse();
  });

  it('should return an empty range array when calling "canCellBeSelected" return false on all ranges', () => {
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(false);

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[]);
    const output = plugin.removeInvalidRanges([{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }] as SlickRange[]);

    expect(output).toEqual([]);
  });

  it('should return an same range array when calling "canCellBeSelected" return true for all ranges', () => {
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];

    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);
    const output = plugin.removeInvalidRanges([{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }] as SlickRange[]);

    expect(output).toEqual([mockRanges[0]]);
    expect(plugin.getSelectedRanges()).toEqual(mockRanges);
  });
});