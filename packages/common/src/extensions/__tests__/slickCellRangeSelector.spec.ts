import 'jest-extended';

import { GridOption, SlickGrid, SlickNamespace, } from '../../interfaces/index';
import { SlickCellRangeSelector } from '../slickCellRangeSelector';

declare const Slick: SlickNamespace;
const GRID_UID = 'slickgrid_12345';
jest.mock('flatpickr', () => { });

const addJQueryEventPropagation = function (event) {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  return event;
}

const mockGridOptions = {
  frozenColumn: 1,
  frozenRow: -1,
} as GridOption;

const gridStub = {
  canCellBeSelected: jest.fn(),
  getActiveCell: jest.fn(),
  getActiveCanvasNode: jest.fn(),
  getCanvasNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getCellFromPoint: jest.fn(),
  getCellNodeBox: jest.fn(),
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
  focus: jest.fn(),
  onDragInit: new Slick.Event(),
  onDragStart: new Slick.Event(),
  onDrag: new Slick.Event(),
  onDragEnd: new Slick.Event(),
  onScroll: new Slick.Event(),
} as unknown as SlickGrid;

describe('CellRangeSelector Plugin', () => {
  let plugin: SlickCellRangeSelector;
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

  beforeEach(() => {
    plugin = new SlickCellRangeSelector();
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
    expect(plugin.addonOptions).toEqual({
      selectionCss: {
        border: '2px dashed blue',
      }
    });
  });

  it('should create the plugin and initialize it', () => {
    plugin.init(gridStub);

    expect(plugin.getCellDecorator()).toBeTruthy();
  });

  it('should handle drag but return without executing anything when item cannot be dragged and cell cannot be selected', () => {
    const divCanvas = document.createElement('div');
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(false);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue(true);

    plugin.init(gridStub);
    const decoratorHideSpy = jest.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addJQueryEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addJQueryEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addJQueryEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addJQueryEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    const dragEventEnd = addJQueryEventPropagation(new Event('dragEnd'));
    gridStub.onDragEnd.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEventEnd, gridStub);

    expect(focusSpy).not.toHaveBeenCalled();
    expect(decoratorHideSpy).not.toHaveBeenCalled();
    expect(decoratorShowSpy).not.toHaveBeenCalled();
  });

  it('should handle drag in bottom left canvas', () => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue(true);

    plugin.init(gridStub);
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addJQueryEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addJQueryEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addJQueryEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addJQueryEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalled();
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
  });

  it('should handle drag in bottom right canvas with decorator showing dragging range', () => {
    mockGridOptions.frozenColumn = 3;
    const divCanvas = document.createElement('div');
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue(true);

    plugin.init(gridStub);
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addJQueryEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addJQueryEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addJQueryEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addJQueryEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(onBeforeCellSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalledWith({
      fromCell: 2, fromRow: 3, toCell: 4, toRow: 5,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    });
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
  });

  it('should handle drag end in bottom right canvas with "onCellRangeSelected" published', () => {
    mockGridOptions.frozenColumn = 3;
    const divCanvas = document.createElement('div');
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue(true);
    const onCellRangeSpy = jest.spyOn(plugin.onCellRangeSelected, 'notify').mockReturnValue(true);

    plugin.init(gridStub);
    const decoratorHideSpy = jest.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addJQueryEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addJQueryEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addJQueryEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEventEnd = addJQueryEventPropagation(new Event('dragEnd'));
    gridStub.onDragEnd.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEventEnd, gridStub);

    const dragEvent = addJQueryEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(onBeforeCellRangeSpy).toHaveBeenCalled();
    expect(onCellRangeSpy).toHaveBeenCalledWith({
      range: {
        fromCell: 2, fromRow: 3, toCell: 4, toRow: 5,
        contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
      }
    });
    expect(decoratorHideSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalledWith({
      fromCell: 4, fromRow: 5, toCell: 4, toRow: 5,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    });
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
  });

  it('should handle drag and return when "canCellBeSelected" returs', () => {
    mockGridOptions.frozenColumn = 3;
    const divCanvas = document.createElement('div');
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValueOnce(true).mockReturnValueOnce(false);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue(true);
    const onCellRangeSpy = jest.spyOn(plugin.onCellRangeSelected, 'notify').mockReturnValue(true);

    plugin.init(gridStub);
    const decoratorHideSpy = jest.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addJQueryEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addJQueryEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addJQueryEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addJQueryEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(onBeforeCellRangeSpy).toHaveBeenCalled();
    expect(onCellRangeSpy).not.toHaveBeenCalled();
    expect(decoratorHideSpy).not.toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalledWith({
      fromCell: 4, fromRow: 5, toCell: 4, toRow: 5,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    });
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
  });

  it('should handle drag and expect the decorator to NOT call the "show" method and return (frozen row) with canvas bottom right', () => {
    mockGridOptions.frozenColumn = 3;
    mockGridOptions.frozenRow = 1;
    const divCanvas = document.createElement('div');
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 0 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue(true);

    plugin.init(gridStub);
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addJQueryEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addJQueryEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addJQueryEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addJQueryEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(onBeforeCellRangeSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).not.toHaveBeenCalledWith({
      fromCell: 4, fromRow: 5, toCell: 4, toRow: 5, // from handleDrag
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    });
    expect(decoratorShowSpy).toHaveBeenCalledWith({
      fromCell: 4, fromRow: 0, toCell: 4, toRow: 0, // from handleDragStart
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    });
  });

  it('should handle drag and expect the decorator to NOT call the "show" method and return (frozen column) with canvas top right', () => {
    mockGridOptions.frozenColumn = 5;
    mockGridOptions.frozenRow = 1;
    const divCanvas = document.createElement('div');
    divCanvas.className = 'grid-canvas-top grid-canvas-right';
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 0 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue(true);

    plugin.init(gridStub);
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addJQueryEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addJQueryEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addJQueryEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addJQueryEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(onBeforeCellRangeSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).not.toHaveBeenCalledWith({
      fromCell: 4, fromRow: 5, toCell: 4, toRow: 5, // from handleDrag
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    });
    expect(decoratorShowSpy).toHaveBeenCalledWith({
      fromCell: 4, fromRow: 0, toCell: 4, toRow: 0, // from handleDragStart
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    });
  });
});