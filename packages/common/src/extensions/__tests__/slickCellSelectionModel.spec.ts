import 'jest-extended';

import { GridOption, SlickGrid, SlickNamespace, SlickRange, } from '../../interfaces/index';
import { SlickCellRangeSelector } from '../slickCellRangeSelector';
import { SlickCellSelectionModel } from '../slickCellSelectionModel';

declare const Slick: SlickNamespace;
const GRID_UID = 'slickgrid_12345';
jest.mock('flatpickr', () => { });

const addJQueryEventPropagation = function (event, commandKey = '', keyName = '') {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  if (commandKey) {
    Object.defineProperty(event, commandKey, { writable: true, configurable: true, value: true });
  }
  if (keyName) {
    Object.defineProperty(event, 'key', { writable: true, configurable: true, value: keyName });
  }
  return event;
}

const mockGridOptions = {
  frozenColumn: 1,
  frozenRow: -1,
} as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
  isActive: jest.fn(),
};

const gridStub = {
  canCellBeSelected: jest.fn(),
  getActiveCell: jest.fn(),
  getActiveCanvasNode: jest.fn(),
  getCanvasNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getCellFromPoint: jest.fn(),
  getCellNodeBox: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
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
    expect(plugin.canvas).toBeTruthy();
    expect(plugin.addonOptions).toEqual({ selectActiveCell: true });
    expect(registerSpy).toHaveBeenCalledWith(plugin.cellRangeSelector);
  });

  it('should create the plugin and initialize it with just "selectActiveCell" option and still expect the same result', () => {
    const registerSpy = jest.spyOn(gridStub, 'registerPlugin');

    plugin = new SlickCellSelectionModel({ selectActiveCell: false, cellRangeSelector: undefined });
    plugin.init(gridStub);

    expect(plugin.cellRangeSelector).toBeTruthy();
    expect(plugin.canvas).toBeTruthy();
    expect(plugin.addonOptions).toEqual({ selectActiveCell: false });
    expect(registerSpy).toHaveBeenCalledWith(plugin.cellRangeSelector);
  });

  it('should create the plugin and initialize it with just "selectActiveCell" option and still expect the same result', () => {
    const registerSpy = jest.spyOn(gridStub, 'registerPlugin');

    const mockCellRangeSelector = new SlickCellRangeSelector({ selectionCss: { border: '2px solid black' } as CSSStyleDeclaration });
    plugin = new SlickCellSelectionModel({ cellRangeSelector: mockCellRangeSelector, selectActiveCell: true });
    plugin.init(gridStub);

    expect(plugin.cellRangeSelector).toBeTruthy();
    expect(plugin.canvas).toBeTruthy();
    expect(plugin.addonOptions).toEqual({ selectActiveCell: true, cellRangeSelector: mockCellRangeSelector });
    expect(registerSpy).toHaveBeenCalledWith(plugin.cellRangeSelector);
  });

  it('should return False when onBeforeCellRangeSelected is called and getEditorLock returns False', () => {
    const mouseEvent = addJQueryEventPropagation(new Event('mouseenter'));
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const stopPropSpy = jest.spyOn(mouseEvent, 'stopPropagation');

    plugin.init(gridStub);
    const output = plugin.cellRangeSelector.onBeforeCellRangeSelected.notify({ cell: 2, row: 3 }, mouseEvent, gridStub);

    expect(output).toBeFalsy();
    expect(stopPropSpy).toHaveBeenCalled();
  });

  it('should call "setSelectedRanges" when "onCellRangeSelected"', () => {
    const mouseEvent = addJQueryEventPropagation(new Event('mouseenter'));
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');

    plugin.init(gridStub);
    plugin.cellRangeSelector.onCellRangeSelected.notify({ range: { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 } }, mouseEvent, gridStub);

    expect(setActiveCellSpy).toHaveBeenCalledWith(2, 1, false, false, true);
    expect(setSelectRangeSpy).toHaveBeenCalledWith([{ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }]);
  });

  it('should call "setSelectedRanges" with Slick Ranges when triggered by "onActiveCellChanged" and "selectActiveCell" is True', () => {
    plugin = new SlickCellSelectionModel({ selectActiveCell: true, cellRangeSelector: undefined });
    plugin.init(gridStub);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const mouseEvent = addJQueryEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 2, row: 3, grid: gridStub }, mouseEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 2, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with empty array when triggered by "onActiveCellChanged" and "selectActiveCell" is False', () => {
    plugin = new SlickCellSelectionModel({ selectActiveCell: false, cellRangeSelector: undefined });
    plugin.init(gridStub);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const mouseEvent = addJQueryEventPropagation(new Event('mouseenter'));
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
    const keyDownEvent = addJQueryEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowLeft');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 2, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range with a Right direction when triggered by "onKeyDown" with key combo of Shift+ArrowRight', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowRight');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 2, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range with a Right direction when triggered by "onKeyDown" with key combo of Shift+ArrowUp', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 2, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range with a Right direction when triggered by "onKeyDown" with key combo of Shift+ArrowDown', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });

    plugin.init(gridStub);
    plugin.setSelectedRanges([
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4, contains: () => false },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4, contains: () => false }
    ] as unknown as SlickRange[]);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowDown');
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
    const keyDownEvent = addJQueryEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowDown');
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