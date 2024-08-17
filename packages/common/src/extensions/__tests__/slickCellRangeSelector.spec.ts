import 'jest-extended';

import type { GridOption } from '../../interfaces/index';
import { SlickCellRangeSelector } from '../slickCellRangeSelector';
import { SlickEvent, type SlickGrid } from '../../core/index';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';

const GRID_UID = 'slickgrid_12345';

const addVanillaEventPropagation = function (event) {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  return event;
};

const mockGridOptions = {
  frozenColumn: 1,
  frozenRow: -1,
  rowHeight: 30,
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
  canCellBeSelected: jest.fn(),
  getAbsoluteColumnMinWidth: jest.fn(),
  getActiveCell: jest.fn(),
  getActiveCanvasNode: jest.fn(),
  getActiveViewportNode: jest.fn(),
  getCanvasNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getCellFromPoint: jest.fn(),
  getCellNodeBox: jest.fn(),
  getDisplayedScrollbarDimensions: jest.fn(),
  getPubSubService: () => pubSubServiceStub,
  getEditorLock: () => getEditorLockMock,
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
  focus: jest.fn(),
  scrollCellIntoView: jest.fn(),
  onDragInit: new SlickEvent(),
  onDragStart: new SlickEvent(),
  onDrag: new SlickEvent(),
  onDragEnd: new SlickEvent(),
  onScroll: new SlickEvent(),
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
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
    plugin?.dispose();
    mockGridOptions.frozenColumn = -1;
    mockGridOptions.frozenRow = -1;
    mockGridOptions.frozenBottom = false;
    mockGridOptions.rowHeight = 30;
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
    expect(plugin.addonOptions).toEqual({
      autoScroll: true,
      minIntervalToShowNextCell: 30,
      maxIntervalToShowNextCell: 600,
      accelerateInterval: 5,
      selectionCss: {
        border: '2px dashed blue',
      }
    });
  });

  it('should dispose the plugin when calling destroy', () => {
    const disposeSpy = jest.spyOn(plugin, 'dispose');
    plugin.destroy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should create the plugin and initialize it', () => {
    plugin.init(gridStub);

    expect(plugin.getCellDecorator()).toBeTruthy();
  });

  it('should handle drag but return without executing anything when item cannot be dragged and cell cannot be selected', () => {
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(false);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorHideSpy = jest.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    const dragEventEnd = addVanillaEventPropagation(new Event('dragEnd'));
    gridStub.onDragEnd.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEventEnd, gridStub);

    expect(focusSpy).not.toHaveBeenCalled();
    expect(decoratorHideSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).not.toHaveBeenCalled();
  });

  it('should handle drag in bottom left canvas', () => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const scrollSpy = jest.spyOn(gridStub, 'scrollCellIntoView');
    jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const initEvent = new Event('dragInit');
    const popagationSpy = jest.spyOn(initEvent, 'stopImmediatePropagation');

    plugin.init(gridStub);
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(initEvent);
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
    dragEvent.pageX = 0;
    dragEvent.pageY = 0;
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalled();
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
    expect(scrollSpy).not.toHaveBeenCalled();
    expect(popagationSpy).toHaveBeenCalled();
  });

  it('should handle drag in bottom right canvas with decorator showing dragging range', () => {
    mockGridOptions.frozenColumn = 3;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
    dragEvent.pageX = -2;
    dragEvent.pageY = -156;
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(onBeforeCellSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalledWith({
      fromCell: 4, fromRow: 5, toCell: 4, toRow: 5,
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    });
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
  });

  it('should handle drag end in bottom right canvas with "onCellRangeSelected" published', () => {
    mockGridOptions.frozenColumn = 3;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const onCellRangeSpy = jest.spyOn(plugin.onCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorHideSpy = jest.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEventEnd = addVanillaEventPropagation(new Event('dragEnd'));
    gridStub.onDragEnd.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEventEnd, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
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

  it('should handle drag and return when "canCellBeSelected" returns False', () => {
    mockGridOptions.frozenColumn = 3;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValueOnce(true).mockReturnValueOnce(false);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    jest.spyOn(gridStub, 'getCellNodeBox').mockReturnValue({ right: 2, bottom: 3, left: 4, top: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const onCellRangeSpy = jest.spyOn(plugin.onCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const scrollSpy = jest.spyOn(gridStub, 'scrollCellIntoView');
    const onCellRangeSelectingSpy = jest.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    const decoratorHideSpy = jest.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
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
    expect(scrollSpy).toHaveBeenCalledWith(5, 4);
    expect(onCellRangeSelectingSpy).not.toHaveBeenCalled();
  });

  it('should handle drag and cell range selection to be changed when "canCellBeSelected" returns True', () => {
    mockGridOptions.frozenColumn = 3;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValueOnce(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    jest.spyOn(gridStub, 'getCellNodeBox').mockReturnValue({ right: 2, bottom: 3, left: 4, top: 5 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const onCellRangeSpy = jest.spyOn(plugin.onCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const scrollSpy = jest.spyOn(gridStub, 'scrollCellIntoView');
    const onCellRangeSelectingSpy = jest.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    const decoratorHideSpy = jest.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
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
    expect(scrollSpy).toHaveBeenCalledWith(5, 4);
    expect(onCellRangeSelectingSpy).toHaveBeenCalledWith({
      range: {
        fromCell: 2, fromRow: 3, toCell: 4, toRow: 5,
        contains: expect.toBeFunction(),
        isSingleCell: expect.toBeFunction(),
        isSingleRow: expect.toBeFunction(),
        toString: expect.toBeFunction(),
      },
    });
  });

  it('should handle drag and expect the decorator to NOT call the "show" method and return (frozen row) with canvas bottom right', () => {
    mockGridOptions.frozenColumn = 3;
    mockGridOptions.frozenRow = 1;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 0 });
    const onBeforeCellRangeSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    // expect(focusSpy).toHaveBeenCalled();
    expect(onBeforeCellRangeSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).not.toHaveBeenCalledWith({
      fromCell: 4, fromRow: 5, toCell: 4, toRow: 5, // from handleDrag
      contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    });
    // expect(decoratorShowSpy).toHaveBeenCalledWith({
    //   fromCell: 4, fromRow: 0, toCell: 4, toRow: 0, // from handleDragStart
    //   contains: expect.toBeFunction(), toString: expect.toBeFunction(), isSingleCell: expect.toBeFunction(), isSingleRow: expect.toBeFunction(),
    // });
  });

  it('should handle drag and expect the decorator to NOT call the "show" method and return (frozen column) with canvas top right', () => {
    mockGridOptions.frozenColumn = 5;
    mockGridOptions.frozenRow = 1;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-right';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 0 });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
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

  it('should call onDrag and handle drag outside the viewport when drag is detected as outside the viewport', (done) => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(plugin, 'getMouseOffsetViewport').mockReturnValue({
      e: new MouseEvent('dragstart'),
      dd: { startX: 5, startY: 15, range: { start: { row: 2, cell: 22 }, end: { row: 5, cell: 22 } } },
      viewport: { left: 23, top: 24, right: 25, bottom: 26, offset: { left: 27, top: 28, right: 29, bottom: 30 } },
      offset: { x: 0, y: 0 },
      isOutsideViewport: true
    });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const getCellFromPointSpy = jest.spyOn(gridStub, 'getCellFromPoint');
    const onCellRangeSelectingSpy = jest.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    plugin.addonOptions.minIntervalToShowNextCell = 5;
    plugin.addonOptions.maxIntervalToShowNextCell = 6;
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalled();
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
    expect(getCellFromPointSpy).toHaveBeenCalledWith(3, 14);
    window.setTimeout(() => {
      expect(onCellRangeSelectingSpy).not.toHaveBeenCalled();
      done();
    }, 7);
  });

  it('should call onDrag and handle drag outside the viewport and expect drag to be moved to a new position', (done) => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    jest.spyOn(plugin, 'getMouseOffsetViewport').mockReturnValue({
      e: new MouseEvent('dragstart'),
      dd: { startX: 5, startY: 15, range: { start: { row: 2, cell: 22 }, end: { row: 5, cell: 22 } } },
      viewport: { left: 23, top: 24, right: 25, bottom: 26, offset: { left: 27, top: 28, right: 29, bottom: 30 } },
      offset: { x: 1, y: 1 },
      isOutsideViewport: true
    });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const getCellFromPointSpy = jest.spyOn(gridStub, 'getCellFromPoint');
    const onCellRangeSelectingSpy = jest.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    plugin.addonOptions.minIntervalToShowNextCell = 5;
    plugin.addonOptions.maxIntervalToShowNextCell = 6;
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalled();
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
    expect(getCellFromPointSpy).toHaveBeenCalledWith(3, 14);

    window.setTimeout(() => {
      expect(onCellRangeSelectingSpy).toHaveBeenCalledWith({
        range: {
          fromCell: 4, fromRow: 2, toCell: 22, toRow: 5,
          contains: expect.toBeFunction(),
          isSingleCell: expect.toBeFunction(),
          isSingleRow: expect.toBeFunction(),
          toString: expect.toBeFunction(),
        },
      });
      done();
    }, 7);
  });

  it('should call onDrag and handle drag outside the viewport with negative offset and expect drag to be moved to a new position', (done) => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValueOnce(true);
    jest.spyOn(plugin, 'getMouseOffsetViewport').mockReturnValue({
      e: new MouseEvent('dragstart'),
      dd: { startX: 5, startY: 15, range: { start: { row: 2, cell: 22 }, end: { row: 5, cell: 22 } } },
      viewport: { left: 23, top: 24, right: 25, bottom: 26, offset: { left: 27, top: 28, right: 29, bottom: 30 } },
      offset: { x: -2, y: -4 },
      isOutsideViewport: true
    });
    const focusSpy = jest.spyOn(gridStub, 'focus');
    jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const getCellFromPointSpy = jest.spyOn(gridStub, 'getCellFromPoint');
    const onCellRangeSelectingSpy = jest.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    plugin.addonOptions.minIntervalToShowNextCell = 5;
    plugin.addonOptions.maxIntervalToShowNextCell = 6;
    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const dragEventInit = addVanillaEventPropagation(new Event('dragInit'));
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalled();
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
    expect(getCellFromPointSpy).toHaveBeenCalledWith(3, 14);

    window.setTimeout(() => {
      expect(onCellRangeSelectingSpy).toHaveBeenCalledWith({
        range: {
          fromCell: 4, fromRow: 2, toCell: 22, toRow: 5,
          contains: expect.toBeFunction(),
          isSingleCell: expect.toBeFunction(),
          isSingleRow: expect.toBeFunction(),
          toString: expect.toBeFunction(),
        },
      });
      done();
    }, 7);
  });

  it('should maintain propagation only if editor is on current cell', () => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const scrollSpy = jest.spyOn(gridStub, 'scrollCellIntoView');
    jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 3, cell: 2 });
    plugin.init(gridStub);

    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const initEvent = new Event('dragInit');
    const propagationSpy = jest.spyOn(initEvent, 'stopImmediatePropagation');
    const dragEventInit = addVanillaEventPropagation(initEvent);
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
    dragEvent.pageX = 0;
    dragEvent.pageY = 0;
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalled();
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
    expect(scrollSpy).not.toHaveBeenCalled();
    expect(propagationSpy).not.toHaveBeenCalled();
  });

  it('should stop propagation if the editor is not on the current cell', () => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    jest.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    jest.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    jest.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 3, row: 3 });
    jest.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    jest.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const focusSpy = jest.spyOn(gridStub, 'focus');
    const scrollSpy = jest.spyOn(gridStub, 'scrollCellIntoView');
    jest.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 3, cell: 2 });
    plugin.init(gridStub);

    const decoratorShowSpy = jest.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const initEvent = new Event('dragInit');
    const propagationSpy = jest.spyOn(initEvent, 'stopImmediatePropagation');
    const dragEventInit = addVanillaEventPropagation(initEvent);
    gridStub.onDragInit.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventInit, gridStub);

    const dragEventStart = addVanillaEventPropagation(new Event('dragStart'));
    gridStub.onDragStart.notify({ offsetX: 6, offsetY: 7, row: 1, startX: 3, startY: 4 } as any, dragEventStart, gridStub);

    const dragEvent = addVanillaEventPropagation(new Event('drag'));
    dragEvent.pageX = 0;
    dragEvent.pageY = 0;
    gridStub.onDrag.notify({ startX: 3, startY: 4, range: { start: { cell: 2, row: 3 }, end: { cell: 4, row: 5 } }, grid: gridStub } as any, dragEvent, gridStub);

    expect(focusSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalled();
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
    expect(scrollSpy).not.toHaveBeenCalled();
    expect(propagationSpy).toHaveBeenCalled();
  });
});