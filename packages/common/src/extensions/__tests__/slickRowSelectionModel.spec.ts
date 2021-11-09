import 'jest-extended';

import { Column, GridOption, SlickGrid, SlickNamespace, SlickRange, } from '../../interfaces/index';
import { SlickRowSelectionModel } from '../slickRowSelectionModel';

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
  multiSelect: true,
} as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
  isActive: jest.fn(),
};

const gridStub = {
  canCellBeActive: jest.fn(),
  getActiveCell: jest.fn(),
  getActiveCanvasNode: jest.fn(),
  getCanvasNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getCellFromPoint: jest.fn(),
  getCellNodeBox: jest.fn(),
  getColumns: jest.fn(),
  getDataLength: jest.fn(),
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
  onClick: new Slick.Event(),
  onKeyDown: new Slick.Event(),
  onSelectedRangesChanged: new Slick.Event(),
  onBeforeCellRangeSelected: new Slick.Event(),
} as unknown as SlickGrid;

describe('SlickRowSelectionModel Plugin', () => {
  let plugin: SlickRowSelectionModel;
  const mockColumns = [
    { id: 'firstName', field: 'firstName', name: 'First Name', },
    { id: 'lastName', field: 'lastName', name: 'Last Name', },
    { id: 'age', field: 'age', name: 'Age', },
  ] as Column[];
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
    plugin = new SlickRowSelectionModel();
  });

  afterEach(() => {
    jest.clearAllMocks();
    plugin?.dispose();
    mockGridOptions.frozenColumn = -1;
    mockGridOptions.frozenRow = -1;
    mockGridOptions.frozenBottom = false;
    mockGridOptions.multiSelect = true;
    jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  it('should dispose of the addon', () => {
    const disposeSpy = jest.spyOn(plugin, 'dispose');
    plugin.destroy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should create the plugin and initialize it', () => {
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({ selectActiveRow: true });
  });

  it('should create the plugin and initialize it with just "selectActiveRow" option and still expect the same result', () => {
    plugin = new SlickRowSelectionModel({ selectActiveRow: false, });
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({ selectActiveRow: false });
  });

  it('should create the plugin and initialize it with just "selectActiveRow" option and still expect the same result', () => {
    plugin = new SlickRowSelectionModel({ selectActiveRow: true });
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({ selectActiveRow: true, });
  });

  it('should call "setSelectedRanges" when "setSelectedRows" is called', () => {
    jest.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);
    const setSelectedRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');

    plugin.init(gridStub);
    plugin.setSelectedRows([0, 2]);

    const expectedRanges = [{
      fromCell: 0, fromRow: 0, toCell: 2, toRow: 0,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 2, toCell: 2, toRow: 2,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }];
    expect(setSelectedRangeSpy).toHaveBeenCalledWith(expectedRanges);
    expect(plugin.getSelectedRanges()).toEqual(expectedRanges);
    expect(plugin.getSelectedRows()).toEqual([0, 2]);
  });

  it('should call "setSelectedRanges" with empty range input and not expect to "onSelectedRangesChanged" to be triggered', () => {
    const onSelectedRangeSpy = jest.spyOn(plugin.onSelectedRangesChanged, 'notify');
    plugin.setSelectedRanges([]);
    expect(onSelectedRangeSpy).not.toHaveBeenCalled();
  });

  it('should call "setSelectedRanges" with valid ranges input and expect to "onSelectedRangesChanged" to be triggered', () => {
    const onSelectedRangeSpy = jest.spyOn(plugin.onSelectedRangesChanged, 'notify');
    plugin.setSelectedRanges([{ fromCell: 0, fromRow: 0, toCell: 2, toRow: 0, }]);
    expect(onSelectedRangeSpy).toHaveBeenCalledWith([{ fromCell: 0, fromRow: 0, toCell: 2, toRow: 0, }]);
  });

  it('should call "setSelectedRanges" with Slick Ranges when triggered by "onActiveCellChanged" and "selectActiveRow" is True', () => {
    jest.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);
    plugin = new SlickRowSelectionModel({ selectActiveRow: true, });
    plugin.init(gridStub);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const mouseEvent = addJQueryEventPropagation(new Event('mouseenter'));
    gridStub.onActiveCellChanged.notify({ cell: 2, row: 3, grid: gridStub }, mouseEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 0, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range with a Down direction when triggered by "onKeyDown" with key combo of Shift+ArrowDown and expect 4 ranges', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 3, row: 2 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const mockRanges = [
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 },
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowDown');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 0, fromRow: 2, toCell: 2, toRow: 2,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 4, toCell: 2, toRow: 4,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 5, toCell: 2, toRow: 5,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range with an Up direction when triggered by "onKeyDown" with key combo of Shift+ArrowUp and expect 2 ranges', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 0, fromRow: 2, toCell: 2, toRow: 2,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range with an Up direction when triggered by "onKeyDown" with key combo of Shift+ArrowUp and expect only 1 range when getRowsRange Top is higher than Bottom', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 0 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(plugin, 'getSelectedRows').mockReturnValue([3, 3]);
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 5, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 0, fromRow: 2, toCell: 2, toRow: 2,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with same Slick Range with an Up direction when triggered by "onKeyDown" with key combo of Shift+ArrowUp and expect 2 ranges even when "getSelectedRows" returns an empty array', () => {
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(plugin, 'getSelectedRows').mockReturnValue([]);
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowUp');
    gridStub.onKeyDown.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 0, fromRow: 2, toCell: 2, toRow: 2,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should not call "setSelectedRanges" when triggered by "onClick" and "canCellBeActive" returns false', () => {
    jest.spyOn(gridStub, 'canCellBeActive').mockReturnValue(false);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('click'), 'ctrlKey');
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).not.toHaveBeenCalled();
  });

  it('should not call "setSelectedRanges" when triggered by "onClick" and "multiSelect" grid option is false', () => {
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({ ...mockGridOptions, multiSelect: false });
    jest.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('click'), 'ctrlKey');
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).not.toHaveBeenCalled();
  });

  it('should call "setSelectedRanges" with Slick Range when triggered by "onClick" with CtrlKey and expect 3 ranges', () => {
    jest.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('click'), 'ctrlKey');
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 0, fromRow: 2, toCell: 2, toRow: 2,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 4, toCell: 2, toRow: 4,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 4, toCell: 2, toRow: 4,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range when triggered by "onClick" with ShiftKey and expect 2 ranges and "setActiveCell" to be called', () => {
    jest.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('click'), 'shiftKey');
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setActiveCellSpy).toHaveBeenCalledWith(3, 2);
    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 0, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 4, toCell: 2, toRow: 4,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should call "setSelectedRanges" with Slick Range when triggered by "onClick" with ShiftKey and expect 4 ranges and "setActiveCell" to be called when cell row is not found in selection', () => {
    jest.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('click'), 'shiftKey');
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setActiveCellSpy).toHaveBeenCalledWith(1, 0);
    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 0, fromRow: 1, toCell: 2, toRow: 1,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 2, toCell: 2, toRow: 2,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 4, toCell: 2, toRow: 4,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });

  it('should not call "setSelectedRanges" when triggered by "onClick" and cell row is not found in selection', () => {
    jest.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const mockRanges = [
      { fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 },
      { fromCell: 2, fromRow: 3, toCell: 3, toRow: 4 }
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addJQueryEventPropagation(new Event('click'), 'ctrlKey');
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).toHaveBeenCalledWith([{
      fromCell: 0, fromRow: 2, toCell: 2, toRow: 2,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 4, toCell: 2, toRow: 4,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 3, toCell: 2, toRow: 3,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 4, toCell: 2, toRow: 4,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }, {
      fromCell: 0, fromRow: 1, toCell: 2, toRow: 1,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    }]);
  });
});