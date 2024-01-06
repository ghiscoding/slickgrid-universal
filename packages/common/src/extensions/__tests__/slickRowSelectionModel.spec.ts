import 'jest-extended';
import { SlickEvent, SlickGrid, SlickRange } from '../../core/index';

import type { Column, GridOption } from '../../interfaces/index';
import { SlickCellRangeSelector } from '../slickCellRangeSelector';
import { SlickRowSelectionModel } from '../slickRowSelectionModel';
import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

const GRID_UID = 'slickgrid_12345';
jest.mock('flatpickr', () => { });

const addVanillaEventPropagation = function (event, commandKey = '', keyName = '') {
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

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

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
  getPubSubService: () => pubSubServiceStub,
  getEditorLock: () => getEditorLockMock,
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
  focus: jest.fn(),
  registerPlugin: jest.fn(),
  setActiveCell: jest.fn(),
  scrollCellIntoView: jest.fn(),
  scrollRowIntoView: jest.fn(),
  unregisterPlugin: jest.fn(),
  onActiveCellChanged: new SlickEvent(),
  onClick: new SlickEvent(),
  onKeyDown: new SlickEvent(),
  onSelectedRangesChanged: new SlickEvent(),
  onBeforeCellRangeSelected: new SlickEvent(),
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

  it('should dispose the plugin when calling destroy', () => {
    const disposeSpy = jest.spyOn(plugin, 'dispose');
    plugin.destroy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should create the plugin and initialize it', () => {
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({
      autoScrollWhenDrag: true,
      cellRangeSelector: undefined,
      dragToSelect: false,
      selectActiveRow: true
    });
  });

  it('should create the plugin and initialize it with just "selectActiveRow" option and still expect the same result', () => {
    plugin = new SlickRowSelectionModel({ selectActiveRow: false, });
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({
      autoScrollWhenDrag: true,
      cellRangeSelector: undefined,
      dragToSelect: false,
      selectActiveRow: false
    });
  });

  it('should create the plugin and initialize it with just "selectActiveRow" option and still expect the same result', () => {
    plugin = new SlickRowSelectionModel({ selectActiveRow: true });
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({
      autoScrollWhenDrag: true,
      cellRangeSelector: undefined,
      dragToSelect: false,
      selectActiveRow: true,
    });
  });

  it('should expect that "setSelectedRows" is being triggered when "refreshSelections" is called', () => {
    jest.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);
    plugin = new SlickRowSelectionModel({ selectActiveRow: false, });
    plugin.init(gridStub);

    jest.spyOn(plugin, 'getSelectedRows').mockReturnValue([0, 1]);
    const setSelectedRowsSpy = jest.spyOn(plugin, 'setSelectedRows');
    plugin.refreshSelections();

    expect(setSelectedRowsSpy).toHaveBeenCalledWith([0, 1]);
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
    expect(setSelectedRangeSpy).toHaveBeenCalledWith(expectedRanges, 'SlickRowSelectionModel.setSelectedRows');
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

    plugin.setSelectedRanges([new SlickRange(0, 0, 0, 2)]);

    expect(onSelectedRangeSpy).toHaveBeenCalledWith(
      [new SlickRange(0, 0, 0, 2)],
      expect.objectContaining({
        detail: { caller: 'SlickRowSelectionModel.setSelectedRanges' }
      }));
  });

  it('should call "setSelectedRanges" with Slick Ranges when triggered by "onActiveCellChanged" and "selectActiveRow" is True', () => {
    jest.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumns);
    plugin = new SlickRowSelectionModel({ selectActiveRow: true, });
    plugin.init(gridStub);
    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'));
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
      new SlickRange(3, 2, 4, 3),
      new SlickRange(2, 1, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowDown');
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
      new SlickRange(2, 1, 4, 3),
      new SlickRange(3, 2, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowUp');
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
      new SlickRange(2, 1, 4, 3),
      new SlickRange(3, 2, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowUp');
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
      new SlickRange(2, 1, 4, 3),
      new SlickRange(3, 2, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('keydown'), 'shiftKey', 'ArrowUp');
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
      new SlickRange(2, 1, 4, 3),
      new SlickRange(3, 2, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), 'ctrlKey');
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
      new SlickRange(2, 1, 4, 3),
      new SlickRange(3, 2, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), 'ctrlKey');
    gridStub.onClick.notify({ cell: 2, row: 3, grid: gridStub }, keyDownEvent, gridStub);

    expect(setSelectRangeSpy).not.toHaveBeenCalled();
  });

  it('should call "setSelectedRanges" with Slick Range when triggered by "onClick" with CtrlKey and expect 3 ranges', () => {
    jest.spyOn(gridStub, 'canCellBeActive').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(6);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    const mockRanges = [
      new SlickRange(2, 1, 4, 3),
      new SlickRange(3, 2, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), 'ctrlKey');
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
      new SlickRange(2, 1, 4, 3),
      new SlickRange(3, 2, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), 'shiftKey');
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
      new SlickRange(2, 1, 4, 3),
      new SlickRange(3, 2, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), 'shiftKey');
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
      new SlickRange(2, 1, 4, 3),
      new SlickRange(3, 2, 4, 3)
    ] as unknown as SlickRange[];
    plugin.init(gridStub);
    plugin.setSelectedRanges(mockRanges);

    const setSelectRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
    const keyDownEvent = addVanillaEventPropagation(new Event('click'), 'ctrlKey');
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

  describe('with Selector', () => {
    beforeEach(() => {
      plugin.addonOptions.dragToSelect = true;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call "setSelectedRanges" when "onCellRangeSelected" event is triggered', () => {
      const setSelectedRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onCellRangeSelected.notify({ range: new SlickRange(3, 2, 5, 4) }, scrollEvent, gridStub);

      expect(setSelectedRangeSpy).toHaveBeenCalledWith([{
        fromCell: 0, fromRow: 3, toCell: 2, toRow: 5,
        contains: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(), toString: expect.toBeFunction()
      }]);
    });

    it('should be able to manually create Row Selection and then call "setSelectedRanges" when "onCellRangeSelected" event is triggered', () => {
      const setSelectedRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');

      plugin.addonOptions.cellRangeSelector = new SlickCellRangeSelector({
        selectionCss: {
          border: 'none'
        } as CSSStyleDeclaration,
        autoScroll: true,
        minIntervalToShowNextCell: 30,
        maxIntervalToShowNextCell: 500,
        accelerateInterval: 5
      });
      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onCellRangeSelected.notify({ range: new SlickRange(3, 2, 5, 4) }, scrollEvent, gridStub);

      expect(setSelectedRangeSpy).toHaveBeenCalledWith([{
        fromCell: 0, fromRow: 3, toCell: 2, toRow: 5,
        contains: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(), toString: expect.toBeFunction()
      }]);
    });

    it('should call "setSelectedRanges" when "onCellRangeSelected" event is triggered', () => {
      const setSelectedRangeSpy = jest.spyOn(plugin, 'setSelectedRanges');
      mockGridOptions.multiSelect = false;

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onCellRangeSelected.notify({ range: new SlickRange(3, 2, 5, 4) }, scrollEvent, gridStub);

      expect(setSelectedRangeSpy).not.toHaveBeenCalled();
    });

    it('should call "setActiveCell" when "onBeforeCellRangeSelected" event is triggered', () => {
      const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
      mockGridOptions.multiSelect = false;

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onBeforeCellRangeSelected.notify({ row: 2, cell: 4 }, scrollEvent, gridStub);

      expect(setActiveCellSpy).toHaveBeenCalledWith(2, 4);
    });

    it('should NOT call "setActiveCell" when EditorLock isActive is returning True', () => {
      const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
      jest.spyOn(getEditorLockMock, 'isActive').mockReturnValue(true);
      mockGridOptions.multiSelect = false;

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onBeforeCellRangeSelected.notify({ row: 2, cell: 4 }, scrollEvent, gridStub);

      expect(setActiveCellSpy).not.toHaveBeenCalled();
    });

    it('should call "setActiveCell" when RowMoveManager is enabled and the column cell does NOT have any "behavior" defined', () => {
      const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
      jest.spyOn(getEditorLockMock, 'isActive').mockReturnValue(false);
      mockGridOptions.enableRowMoveManager = true;
      mockGridOptions.multiSelect = false;

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onBeforeCellRangeSelected.notify({ row: 2, cell: 1 }, scrollEvent, gridStub);

      expect(setActiveCellSpy).toHaveBeenCalledWith(2, 1);
    });

    it('should NOT call "setActiveCell" when RowMoveManager is enabled and the column cell has a "behavior" defined as "selectAndMove"', () => {
      const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
      jest.spyOn(getEditorLockMock, 'isActive').mockReturnValue(false);
      mockGridOptions.enableRowMoveManager = true;
      mockGridOptions.multiSelect = false;
      mockColumns.unshift({ id: '_move', field: '_move', behavior: 'selectAndMove' });

      plugin.init(gridStub);
      const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
      plugin.getCellRangeSelector()!.onBeforeCellRangeSelected.notify({ row: 2, cell: 0 }, scrollEvent, gridStub);

      expect(setActiveCellSpy).not.toHaveBeenCalled();
    });
  });
});