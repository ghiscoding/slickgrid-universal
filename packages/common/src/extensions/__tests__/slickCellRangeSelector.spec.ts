import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GridOption } from '../../interfaces/index';
import { SlickCellRangeSelector } from '../slickCellRangeSelector';
import { SlickEvent, type SlickGrid } from '../../core/index';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';

vi.useFakeTimers();

const GRID_UID = 'slickgrid_12345';

const addVanillaEventPropagation = function (event) {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
  return event;
};

const mockGridOptions = {
  frozenColumn: 1,
  frozenRow: -1,
  rowHeight: 30,
} as GridOption;

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

const getEditorLockMock = {
  commitCurrentEdit: vi.fn(),
  isActive: vi.fn(),
};

const gridStub = {
  canCellBeSelected: vi.fn(),
  getAbsoluteColumnMinWidth: vi.fn(),
  getActiveCell: vi.fn(),
  getActiveCanvasNode: vi.fn(),
  getActiveViewportNode: vi.fn(),
  getCanvasNode: vi.fn(),
  getCellFromEvent: vi.fn(),
  getCellFromPoint: vi.fn(),
  getCellNodeBox: vi.fn(),
  getDisplayedScrollbarDimensions: vi.fn(),
  getPubSubService: () => pubSubServiceStub,
  getEditorLock: () => getEditorLockMock,
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
  focus: vi.fn(),
  scrollCellIntoView: vi.fn(),
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
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);
    vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
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
    const disposeSpy = vi.spyOn(plugin, 'dispose');
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
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(false);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorHideSpy = vi.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 2, row: 3 });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    const scrollSpy = vi.spyOn(gridStub, 'scrollCellIntoView');
    vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const initEvent = new Event('dragInit');
    const popagationSpy = vi.spyOn(initEvent, 'stopImmediatePropagation');

    plugin.init(gridStub);
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    const onBeforeCellSpy = vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const onCellRangeSpy = vi.spyOn(plugin.onCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorHideSpy = vi.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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
      }
    });
    expect(decoratorHideSpy).toHaveBeenCalled();
    expect(decoratorShowSpy).toHaveBeenCalledWith({
      fromCell: 4, fromRow: 5, toCell: 4, toRow: 5,
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
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValueOnce(true).mockReturnValueOnce(false);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    vi.spyOn(gridStub, 'getCellNodeBox').mockReturnValue({ right: 2, bottom: 3, left: 4, top: 5 });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const onCellRangeSpy = vi.spyOn(plugin.onCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const scrollSpy = vi.spyOn(gridStub, 'scrollCellIntoView');
    const onCellRangeSelectingSpy = vi.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    const decoratorHideSpy = vi.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValueOnce(true);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    vi.spyOn(gridStub, 'getCellNodeBox').mockReturnValue({ right: 2, bottom: 3, left: 4, top: 5 });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const onCellRangeSpy = vi.spyOn(plugin.onCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const scrollSpy = vi.spyOn(gridStub, 'scrollCellIntoView');
    const onCellRangeSelectingSpy = vi.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    const decoratorHideSpy = vi.spyOn(plugin.getCellDecorator(), 'hide');
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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
    });
    expect(plugin.getCurrentRange()).toEqual({ start: { cell: 4, row: 5 }, end: {} });
    expect(scrollSpy).toHaveBeenCalledWith(5, 4);
    expect(onCellRangeSelectingSpy).toHaveBeenCalledWith({
      range: {
        fromCell: 2, fromRow: 3, toCell: 4, toRow: 5,
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
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 0 });
    const onBeforeCellRangeSpy = vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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
    });
    // expect(decoratorShowSpy).toHaveBeenCalledWith({
    //   fromCell: 4, fromRow: 0, toCell: 4, toRow: 0, // from handleDragStart
    //   contains: expect.any(Function), toString: expect.any(Function), isSingleCell: expect.any(Function), isSingleRow: expect.any(Function),
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
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 0 });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    const onBeforeCellRangeSpy = vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    plugin.init(gridStub);
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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
    });
    expect(decoratorShowSpy).toHaveBeenCalledWith({
      fromCell: 4, fromRow: 0, toCell: 4, toRow: 0, // from handleDragStart
    });
  });

  it('should call onDrag and handle drag outside the viewport when drag is detected as outside the viewport', () => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    vi.spyOn(plugin, 'getMouseOffsetViewport').mockReturnValue({
      e: new MouseEvent('dragstart'),
      dd: { startX: 5, startY: 15, range: { start: { row: 2, cell: 22 }, end: { row: 5, cell: 22 } } },
      viewport: { left: 23, top: 24, right: 25, bottom: 26, offset: { left: 27, top: 28, right: 29, bottom: 30 } },
      offset: { x: 0, y: 0 },
      isOutsideViewport: true
    });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const getCellFromPointSpy = vi.spyOn(gridStub, 'getCellFromPoint');
    const onCellRangeSelectingSpy = vi.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    plugin.addonOptions.minIntervalToShowNextCell = 5;
    plugin.addonOptions.maxIntervalToShowNextCell = 6;
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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

    vi.advanceTimersByTime(7);
    expect(onCellRangeSelectingSpy).not.toHaveBeenCalled();
  });

  it('should call onDrag and handle drag outside the viewport and expect drag to be moved to a new position', () => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    vi.spyOn(plugin, 'getMouseOffsetViewport').mockReturnValue({
      e: new MouseEvent('dragstart'),
      dd: { startX: 5, startY: 15, range: { start: { row: 2, cell: 22 }, end: { row: 5, cell: 22 } } },
      viewport: { left: 23, top: 24, right: 25, bottom: 26, offset: { left: 27, top: 28, right: 29, bottom: 30 } },
      offset: { x: 1, y: 1 },
      isOutsideViewport: true
    });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const getCellFromPointSpy = vi.spyOn(gridStub, 'getCellFromPoint');
    const onCellRangeSelectingSpy = vi.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    plugin.addonOptions.minIntervalToShowNextCell = 5;
    plugin.addonOptions.maxIntervalToShowNextCell = 6;
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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

    vi.advanceTimersByTime(7);

    expect(onCellRangeSelectingSpy).toHaveBeenCalledWith({
      range: {
        fromCell: 4, fromRow: 2, toCell: 22, toRow: 5,
      },
    });
  });

  it('should call onDrag and handle drag outside the viewport with negative offset and expect drag to be moved to a new position', () => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValueOnce(true);
    vi.spyOn(plugin, 'getMouseOffsetViewport').mockReturnValue({
      e: new MouseEvent('dragstart'),
      dd: { startX: 5, startY: 15, range: { start: { row: 2, cell: 22 }, end: { row: 5, cell: 22 } } },
      viewport: { left: 23, top: 24, right: 25, bottom: 26, offset: { left: 27, top: 28, right: 29, bottom: 30 } },
      offset: { x: -2, y: -4 },
      isOutsideViewport: true
    });
    const focusSpy = vi.spyOn(gridStub, 'focus');
    vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);
    const getCellFromPointSpy = vi.spyOn(gridStub, 'getCellFromPoint');
    const onCellRangeSelectingSpy = vi.spyOn(plugin.onCellRangeSelecting, 'notify');

    plugin.init(gridStub);
    plugin.addonOptions.minIntervalToShowNextCell = 5;
    plugin.addonOptions.maxIntervalToShowNextCell = 6;
    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

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

    vi.advanceTimersByTime(7);

    expect(onCellRangeSelectingSpy).toHaveBeenCalledWith({
      range: {
        fromCell: 4, fromRow: 2, toCell: 22, toRow: 5,
      },
    });
  });

  it('should maintain propagation only if editor is on current cell', () => {
    mockGridOptions.frozenRow = 2;
    const divCanvas = document.createElement('div');
    const divViewport = document.createElement('div');
    divViewport.className = 'slick-viewport';
    divCanvas.className = 'grid-canvas-bottom grid-canvas-left';
    divViewport.appendChild(divCanvas);
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 2, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const focusSpy = vi.spyOn(gridStub, 'focus');
    const scrollSpy = vi.spyOn(gridStub, 'scrollCellIntoView');
    vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 3, cell: 2 });
    plugin.init(gridStub);

    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const initEvent = new Event('dragInit');
    const propagationSpy = vi.spyOn(initEvent, 'stopImmediatePropagation');
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
    vi.spyOn(gridStub, 'getActiveViewportNode').mockReturnValue(divViewport);
    vi.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divCanvas);
    vi.spyOn(gridStub, 'getDisplayedScrollbarDimensions').mockReturnValue({ height: 200, width: 155 });
    vi.spyOn(gridStub, 'getAbsoluteColumnMinWidth').mockReturnValue(47);
    vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 3, row: 3 });
    vi.spyOn(gridStub, 'canCellBeSelected').mockReturnValue(true);
    vi.spyOn(gridStub, 'getCellFromPoint').mockReturnValue({ cell: 4, row: 5 });
    vi.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const focusSpy = vi.spyOn(gridStub, 'focus');
    const scrollSpy = vi.spyOn(gridStub, 'scrollCellIntoView');
    vi.spyOn(plugin.onBeforeCellRangeSelected, 'notify').mockReturnValue({
      getReturnValue: () => true
    } as any);

    vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 3, cell: 2 });
    plugin.init(gridStub);

    const decoratorShowSpy = vi.spyOn(plugin.getCellDecorator(), 'show');

    const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
    gridStub.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: gridStub }, scrollEvent, gridStub);

    const initEvent = new Event('dragInit');
    const propagationSpy = vi.spyOn(initEvent, 'stopImmediatePropagation');
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