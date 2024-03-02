import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import 'jest-extended';

import type { Column, DragRowMove, GridOption } from '../../interfaces/index';
import { SlickRowMoveManager } from '../slickRowMoveManager';
import { SlickEvent, SlickGrid } from '../../core/index';

const GRID_UID = 'slickgrid_12345';
jest.mock('flatpickr', () => { });

const addVanillaEventPropagation = function (event, target?: HTMLElement) {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
  if (target) {
    Object.defineProperty(event, 'target', { writable: true, configurable: true, value: target });
  }
  return event;
};

const mockGridOptions = {
  frozenColumn: 1,
  frozenRow: -1,
  multiSelect: true,
} as GridOption;

const getEditorLockMock = {
  cancelCurrentEdit: jest.fn(),
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
  getCellNode: jest.fn(),
  getCellNodeBox: jest.fn(),
  getColumns: jest.fn(),
  getDataItem: jest.fn(),
  getDataLength: jest.fn(),
  getSelectedRows: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getOptions: () => mockGridOptions,
  getUID: () => GRID_UID,
  focus: jest.fn(),
  registerPlugin: jest.fn(),
  setActiveCell: jest.fn(),
  setSelectedRows: jest.fn(),
  scrollCellIntoView: jest.fn(),
  scrollRowIntoView: jest.fn(),
  unregisterPlugin: jest.fn(),
  onDrag: new SlickEvent(),
  onDragInit: new SlickEvent(),
  onDragEnd: new SlickEvent(),
  onDragStart: new SlickEvent(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

describe('SlickRowMoveManager Plugin', () => {
  let plugin: SlickRowMoveManager;
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
  Object.defineProperty(canvasTL, 'top', { writable: true, configurable: true, value: 12 });
  Object.defineProperty(canvasTR, 'clientHeight', { writable: true, configurable: true, value: 14 });
  Object.defineProperty(canvasTL, 'clientWidth', { writable: true, configurable: true, value: 32 });
  Object.defineProperty(canvasTR, 'clientWidth', { writable: true, configurable: true, value: 33 });
  jest.spyOn(gridStub, 'getCanvasNode').mockReturnValue(canvasTL);

  beforeEach(() => {
    plugin = new SlickRowMoveManager(pubSubServiceStub);
  });

  afterEach(() => {
    jest.clearAllMocks();
    plugin?.dispose();
    mockGridOptions.frozenColumn = -1;
    mockGridOptions.frozenRow = -1;
    mockGridOptions.frozenBottom = false;
    mockGridOptions.multiSelect = true;
    mockGridOptions.rowHeight = 25;
    jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  it('should create the plugin and initialize it', () => {
    plugin.init(gridStub);

    expect(plugin.addonOptions).toEqual({
      autoScroll: true,
      cancelEditOnDrag: false,
      columnId: '_move',
      cssClass: 'slick-row-move-column',
      disableRowSelection: false,
      hideRowMoveShadow: true,
      reorderable: false,
      rowMoveShadowMarginLeft: 0,
      rowMoveShadowMarginTop: 0,
      rowMoveShadowOpacity: 0.9,
      rowMoveShadowScale: 0.75,
      singleRowMove: false,
      width: 40,
    });
  });

  it('should call the "create" method and expect plugin to be created with checkbox column to be created at position 0 when using default', () => {
    const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
    const rowMoveColumnMock = {
      excludeFromColumnPicker: true,
      excludeFromExport: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      excludeFromQuery: true,
      field: 'move-id',
      formatter: expect.toBeFunction(),
      id: 'move-id',
      name: '',
      behavior: 'selectAndMove',
      reorderable: false,
      resizable: false,
      width: 40,
    };

    plugin.create(mockColumns, { rowMoveManager: { columnId: 'move-id' } });

    expect(plugin).toBeTruthy();
    expect(pubSubSpy).toHaveBeenCalledWith('onPluginColumnsChanged', { columns: expect.arrayContaining([{ ...rowMoveColumnMock, formatter: expect.toBeFunction() }]), pluginName: 'RowMoveManager' });
    expect(mockColumns[0]).toEqual(rowMoveColumnMock);
  });

  it('should create the plugin and call "setOptions" and expect options changed', () => {
    plugin.init(gridStub);
    plugin.setOptions({ cssClass: 'some-class', hideRowMoveShadow: false, rowMoveShadowMarginLeft: 2, rowMoveShadowMarginTop: 5, rowMoveShadowOpacity: 1, rowMoveShadowScale: 0.9, singleRowMove: true, width: 20 });

    expect(plugin.addonOptions).toEqual({
      autoScroll: true,
      cancelEditOnDrag: false,
      columnId: '_move',
      cssClass: 'some-class',
      disableRowSelection: false,
      hideRowMoveShadow: false,
      reorderable: false,
      rowMoveShadowMarginLeft: 2,
      rowMoveShadowMarginTop: 5,
      rowMoveShadowOpacity: 1,
      rowMoveShadowScale: 0.9,
      singleRowMove: true,
      width: 20,
    });
  });

  it('should call the "create" method and expect plugin to be created at position 1 when defined', () => {
    plugin.create(mockColumns, { rowMoveManager: { columnIndexPosition: 1 } });

    expect(plugin).toBeTruthy();
    expect(mockColumns[1]).toEqual({
      behavior: 'selectAndMove',
      excludeFromColumnPicker: true,
      excludeFromExport: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      excludeFromQuery: true,
      field: 'move-id',
      formatter: expect.toBeFunction(),
      id: 'move-id',
      name: '',
      reorderable: false,
      resizable: false,
      width: 40,
    });
  });

  it('should process the "checkboxSelectionFormatter" and expect necessary Formatter to return null when usabilityOverride is provided as plugin option and is returning False', () => {
    plugin.init(gridStub, { usabilityOverride: () => false });
    const output = plugin.getColumnDefinition().formatter!(0, 0, null, { id: '_move', field: '' } as Column, { firstName: 'John', lastName: 'Doe', age: 33 }, gridStub);

    expect(plugin).toBeTruthy();
    expect(output).toEqual('');
  });

  it('should process the "checkboxSelectionFormatter" and expect necessary Formatter to return null when usabilityOverride is defined and returning False', () => {
    plugin.usabilityOverride(() => false);
    plugin.create(mockColumns, {});
    const output = plugin.getColumnDefinition().formatter!(0, 0, null, { id: '_move', field: '' } as Column, { firstName: 'John', lastName: 'Doe', age: 33 }, gridStub);

    expect(plugin).toBeTruthy();
    expect(output).toEqual('');
  });

  it('should process the "checkboxSelectionFormatter" and expect necessary Formatter to return regular formatter when usabilityOverride is returning True', () => {
    const iconElm = document.createElement('div');
    iconElm.className = 'slick-row-move-column';

    plugin.init(gridStub);
    plugin.usabilityOverride(() => true);
    const output = plugin.getColumnDefinition().formatter!(0, 0, null, { id: '_move', field: '' } as Column, { firstName: 'John', lastName: 'Doe', age: 33 }, gridStub);

    expect(plugin).toBeTruthy();
    expect(output).toEqual({ addClasses: 'cell-reorder dnd slick-row-move-column', html: iconElm });
  });

  it('should process the "checkboxSelectionFormatter" and expect necessary Formatter to return regular formatter when usabilityOverride is not a function', () => {
    const iconElm = document.createElement('div');
    iconElm.className = 'slick-row-move-column';

    plugin.init(gridStub);
    plugin.usabilityOverride(null as any);
    const output = plugin.getColumnDefinition().formatter!(0, 0, null, { id: '_move', field: '' } as Column, { firstName: 'John', lastName: 'Doe', age: 33 }, gridStub);

    expect(plugin).toBeTruthy();
    expect(output).toEqual({ addClasses: 'cell-reorder dnd slick-row-move-column', html: iconElm });
  });

  it('should create the plugin and trigger "dragInit" event and expect "stopImmediatePropagation" to be called', () => {
    plugin.init(gridStub);

    const divElm = document.createElement('div');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'), divElm);
    const stopImmediatePropagationSpy = jest.spyOn(mouseEvent, 'stopImmediatePropagation');
    gridStub.onDragInit.notify({
      count: 1, deltaX: 0, deltaY: 1, offsetX: 2, offsetY: 3, proxy: document.createElement('div'), guide: document.createElement('div'), row: 2, rows: [2],
    } as unknown as DragRowMove, mouseEvent);

    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
  });

  it('should create the plugin and trigger "dragEnd" event and expect it to return null when we are not actually dragging any row', () => {
    plugin.init(gridStub, { hideRowMoveShadow: false });

    const divElm = document.createElement('div');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'), divElm);
    const stopImmediatePropagationSpy = jest.spyOn(mouseEvent, 'stopImmediatePropagation');
    const mockArgs = {
      deltaX: 0, deltaY: 1, offsetX: 2, offsetY: 3,
      row: 2, rows: [2], selectedRows: [2], insertBefore: 4,
      canMove: true,
      proxy: document.createElement('div'),
      guide: document.createElement('div'),
      selectionProxy: document.createElement('div'),
      clonedSlickRow: document.createElement('div'),
    } as unknown as DragRowMove;
    gridStub.onDragEnd.notify(mockArgs, mouseEvent);

    expect(stopImmediatePropagationSpy).not.toHaveBeenCalled();
  });

  it('should create the plugin and trigger "dragStart" and "dragEnd" events, expect new row being moved when different and expect dragEnd to remove guide/proxy/shadow and finally onMoveRows to publish event and callback to be called', () => {
    const mockOnMoveRows = jest.fn();
    const mockNewMovedRow = 0;
    const mockSlickRow = document.createElement('div');
    mockSlickRow.className = 'slick-row';
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 1, row: mockNewMovedRow });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(mockSlickRow);
    jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([2]);
    const setSelectRowSpy = jest.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub, { hideRowMoveShadow: false, onMoveRows: mockOnMoveRows });
    const onMoveRowNotifySpy = jest.spyOn(plugin.onMoveRows, 'notify');

    const divElm = document.createElement('div');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'), divElm);
    const stopImmediatePropagationSpy = jest.spyOn(mouseEvent, 'stopImmediatePropagation');
    const mockArgs = {
      deltaX: 0, deltaY: 1, offsetX: 2, offsetY: 3,
      row: 2, rows: [2], selectedRows: [2], insertBefore: 4,
      canMove: true,
    } as any;
    gridStub.onDragStart.notify(mockArgs, mouseEvent);

    expect(stopImmediatePropagationSpy).toHaveBeenCalledTimes(1);
    expect(setSelectRowSpy).toHaveBeenCalledWith([mockNewMovedRow]);
    expect(mockArgs.insertBefore).toBe(-1);
    expect(mockArgs.selectedRows).toEqual([mockNewMovedRow]);
    expect(mockArgs.clonedSlickRow).toBeTruthy();
    expect(mockArgs.guide).toBeTruthy();
    expect(mockArgs.selectionProxy).toBeTruthy();
    expect(canvasTL.querySelector('.slick-reorder-guide')).toBeTruthy();
    expect(canvasTL.querySelector('.slick-reorder-proxy')).toBeTruthy();
    expect(canvasTL.querySelector('.slick-reorder-shadow-row')).toBeTruthy();

    gridStub.onDragEnd.notify(mockArgs, mouseEvent);
    expect(onMoveRowNotifySpy).toHaveBeenCalledWith({ insertBefore: -1, rows: [mockNewMovedRow], grid: gridStub, });
    expect(mockOnMoveRows).toHaveBeenCalledWith(expect.anything(), { insertBefore: -1, rows: [mockNewMovedRow], grid: gridStub, });
    expect(stopImmediatePropagationSpy).toHaveBeenCalledTimes(2);
  });

  it('should create the plugin and trigger "dragStart" and expect editor be cancelled when it is active editor', () => {
    const mockNewMovedRow = 0;
    const mockSlickRow = document.createElement('div');
    mockSlickRow.className = 'slick-row';
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 1, row: mockNewMovedRow });

    plugin.init(gridStub, { cancelEditOnDrag: true });
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
    const cancelEditorSpy = jest.spyOn(gridStub.getEditorLock(), 'cancelCurrentEdit');

    const divElm = document.createElement('div');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'), divElm);
    const stopImmediatePropagationSpy = jest.spyOn(mouseEvent, 'stopImmediatePropagation');
    const mockArgs = {
      canMove: true, deltaX: 0, deltaY: 1, offsetX: 2, offsetY: 3,
      row: 2, rows: [2], selectedRows: [2], insertBefore: 4,
    } as any;
    const output = gridStub.onDragStart.notify(mockArgs, mouseEvent).getReturnValue();

    expect(stopImmediatePropagationSpy).not.toHaveBeenCalled();
    expect(cancelEditorSpy).toHaveBeenCalled();
    expect(output).toBeFalsy();
  });

  it('should create the plugin and trigger "drag" event (without "dragStart") and the handler to return right away when row is not dragging', () => {
    const mockNewMovedRow = 0;
    const mockSlickRow = document.createElement('div');
    mockSlickRow.className = 'slick-row';
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 1, row: mockNewMovedRow });

    plugin.init(gridStub, { cancelEditOnDrag: true });
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);

    const divElm = document.createElement('div');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'), divElm);
    const stopImmediatePropagationSpy = jest.spyOn(mouseEvent, 'stopImmediatePropagation');
    const mockArgs = {
      canMove: true, deltaX: 0, deltaY: 1, offsetX: 2, offsetY: 3,
      row: 2, rows: [2], selectedRows: [2], insertBefore: 4,
    } as any;
    gridStub.onDragStart.notify(mockArgs, mouseEvent);
    gridStub.onDrag.notify(mockArgs, mouseEvent);

    expect(stopImmediatePropagationSpy).not.toHaveBeenCalled();
  });

  it('should create the plugin and trigger "dragStart" and "drag" events, expect new row being moved', () => {
    const mockOnBeforeMoveRows = jest.fn();
    const mockNewMovedRow = 0;
    const mockSlickRow = document.createElement('div');
    mockSlickRow.className = 'slick-row';
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 1, row: mockNewMovedRow });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(mockSlickRow);
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(5);
    jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([2]);
    const setSelectRowSpy = jest.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub, { hideRowMoveShadow: false, onBeforeMoveRows: mockOnBeforeMoveRows });
    plugin.usabilityOverride(() => true);
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);

    const divElm = document.createElement('div');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'), divElm);
    const stopImmediatePropagationSpy = jest.spyOn(mouseEvent, 'stopImmediatePropagation');
    const mockArgs = {
      deltaX: 0, deltaY: 1, offsetX: 2, offsetY: 3,
      row: 2, rows: [2], selectedRows: [2], insertBefore: 4,
      canMove: true,
    } as any;
    gridStub.onDragStart.notify(mockArgs, mouseEvent);

    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
    expect(setSelectRowSpy).toHaveBeenCalledWith([mockNewMovedRow]);
    expect(mockArgs.insertBefore).toBe(-1);
    expect(mockArgs.selectedRows).toEqual([mockNewMovedRow]);
    expect(mockArgs.clonedSlickRow).toBeTruthy();
    expect(mockArgs.guide).toBeTruthy();
    expect(mockArgs.selectionProxy).toBeTruthy();
    expect(canvasTL.querySelector('.slick-reorder-guide')).toBeTruthy();
    expect(canvasTL.querySelector('.slick-reorder-proxy')).toBeTruthy();
    expect(canvasTL.querySelector('.slick-reorder-shadow-row')).toBeTruthy();

    Object.defineProperty(mouseEvent, 'pageY', { writable: true, configurable: true, value: 12 });
    gridStub.onDrag.notify(mockArgs, mouseEvent);
    expect(mockArgs.selectionProxy.style.display).toBe('block');
    expect(mockArgs.selectionProxy.style.top).toBe('7px');
    expect(mockArgs.clonedSlickRow.style.display).toBe('block');
    expect(mockArgs.clonedSlickRow.style.top).toBe('6px');
    expect(mockArgs.canMove).toBeTrue();
    expect(mockOnBeforeMoveRows).toHaveBeenCalled();
    expect(mockArgs.guide.style.top).toBe('0px');
  });

  it('should create the plugin and trigger "dragStart" and "drag" events, expect new row to not be to moved when "onBeforeMoveRows" returns false', () => {
    const mockOnBeforeMoveRows = jest.fn();
    const mockNewMovedRow = 0;
    const mockSlickRow = document.createElement('div');
    mockSlickRow.className = 'slick-row';
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 1, row: mockNewMovedRow });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(mockSlickRow);
    jest.spyOn(gridStub, 'getDataLength').mockReturnValue(5);
    jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([2]);
    const setSelectRowSpy = jest.spyOn(gridStub, 'setSelectedRows');

    plugin.init(gridStub, { hideRowMoveShadow: false, onBeforeMoveRows: mockOnBeforeMoveRows });
    plugin.usabilityOverride(() => true);
    jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(false);

    const divElm = document.createElement('div');
    const mouseEvent = addVanillaEventPropagation(new Event('mouseenter'), divElm);
    const stopImmediatePropagationSpy = jest.spyOn(mouseEvent, 'stopImmediatePropagation');
    const mockArgs = {
      deltaX: 0, deltaY: 1, offsetX: 2, offsetY: 3,
      row: 2, rows: [2], selectedRows: [2], insertBefore: 4,
      canMove: true,
    } as any;
    gridStub.onDragStart.notify(mockArgs, mouseEvent);

    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
    expect(setSelectRowSpy).toHaveBeenCalledWith([mockNewMovedRow]);
    expect(mockArgs.insertBefore).toBe(-1);
    expect(mockArgs.selectedRows).toEqual([mockNewMovedRow]);
    expect(mockArgs.clonedSlickRow).toBeTruthy();
    expect(mockArgs.guide).toBeTruthy();
    expect(mockArgs.selectionProxy).toBeTruthy();
    expect(canvasTL.querySelector('.slick-reorder-guide')).toBeTruthy();
    expect(canvasTL.querySelector('.slick-reorder-proxy')).toBeTruthy();
    expect(canvasTL.querySelector('.slick-reorder-shadow-row')).toBeTruthy();

    Object.defineProperty(mouseEvent, 'pageY', { writable: true, configurable: true, value: 12 });
    mockOnBeforeMoveRows.mockReturnValue(false);
    gridStub.onDrag.notify(mockArgs, mouseEvent);
    expect(mockArgs.selectionProxy.style.display).toBe('block');
    expect(mockArgs.selectionProxy.style.top).toBe('7px');
    expect(mockArgs.clonedSlickRow.style.display).toBe('block');
    expect(mockArgs.clonedSlickRow.style.top).toBe('6px');
    expect(mockArgs.canMove).toBeFalse();
    expect(mockArgs.guide.style.top).toBe('-1000px');
  });

});