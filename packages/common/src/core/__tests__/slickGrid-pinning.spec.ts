import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Column, GridOption } from '../../interfaces/index.js';
import { SlickGrid } from '../slickGrid.js';

const columns: Column[] = [
  { id: 'a', field: 'a', name: 'A', width: 80 },
  { id: 'b', field: 'b', name: 'B', width: 80 },
  { id: 'c', field: 'c', name: 'C', width: 80 },
  { id: 'd', field: 'd', name: 'D', width: 80 },
];
const data = [
  { id: 0, a: 'a0', b: 'b0', c: 'c0', d: 'd0' },
  { id: 1, a: 'a1', b: 'b1', c: 'c1', d: 'd1' },
  { id: 2, a: 'a2', b: 'b2', c: 'c2', d: 'd2' },
];

describe('SlickGrid unified pinning', () => {
  let grid: SlickGrid<any, Column> | undefined;
  let container: HTMLDivElement;

  afterEach(() => {
    grid?.destroy(true);
    container?.remove();
  });

  const createGrid = (options: GridOption = {}): SlickGrid<any, Column> => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    document.body.appendChild(container);
    grid = new SlickGrid(container, data, columns.map((column) => ({ ...column })) as Column[], {
      enableCellNavigation: true,
      devMode: { ownerNodeIndex: 0 },
      ...options,
    });
    return grid;
  };

  it('applies numeric and explicit column pinning with row docking', () => {
    const slickGrid = createGrid({
      pinning: { columns: { left: 0, right: ['d'] }, rows: { top: [0], bottom: [2] } },
      stickyRows: { top: [1] },
    });

    expect(slickGrid.getColumns().map((column) => column.pinned)).toEqual(['left', null, null, 'right']);
    expect(slickGrid.getPinnedColumns('left').map((column) => column.id)).toEqual(['a']);
    expect(slickGrid.getPinnedColumns('right').map((column) => column.id)).toEqual(['d']);
    expect(container.querySelector('.slick-docking-horizontal-scroller')).toBeTruthy();
    expect(container.querySelector('.slick-docking-overlay')).toBeTruthy();
    expect(slickGrid.getOptions().pinning?.rows).toEqual({ top: [0], bottom: [2] });
  });

  it('covers legacy freeze validation and full-width calculations', () => {
    const invalidPicker = vi.fn();
    const invalidWidth = vi.fn();
    const slickGrid = createGrid({ invalidColumnFreezePickerCallback: invalidPicker, invalidColumnFreezeWidthCallback: invalidWidth });
    const internals = slickGrid as any;
    internals._options.pinning = undefined;
    internals._options.frozenColumn = 0;
    internals._options.skipFreezeColumnValidation = false;
    internals._options.invalidColumnFreezePickerCallback = invalidPicker;
    internals._prevFrozenColumnIdx = -1;
    internals.viewportW = 800;
    internals._options.fullWidthRows = true;
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    internals._defaults.invalidColumnFreezePickerCallback('invalid');
    expect(alertSpy).toHaveBeenCalledWith('invalid');

    expect(slickGrid.validateColumnFreeze()).toBeTruthy();
    expect(slickGrid.validateColumnFreeze('b')).toBeTruthy();
    expect(slickGrid.validateColumnFreeze('a', true)).toBeFalsy();
    expect(invalidPicker).toHaveBeenCalledTimes(1);

    internals._options.frozenColumn = 2;
    expect(slickGrid.validateColumnFreeze('a')).toBeTruthy();
    internals._options.frozenColumn = 0;
    internals._options.invalidColumnFreezeWidthCallback = invalidWidth;
    internals._invalidfrozenAlerted = false;
    container.style.width = '100px';
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 100 });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ width: 100 } as DOMRect);
    expect(slickGrid.validateColumnFreezeWidth(2)).toBeFalsy();
    expect(invalidWidth).toHaveBeenCalled();

    internals._options.pinning = { columns: { left: ['a'], right: [] } };
    expect(slickGrid.validateColumnFreeze('a')).toBeTruthy();

    const canvasWidth = slickGrid.getCanvasWidth();
    expect(canvasWidth).toBeGreaterThan(0);
    expect(internals.canvasWidthR).toBeGreaterThan(internals.canvasWidthL);
  });

  it('covers pinning validation, row identity resolution, and cleanup timer cancellation', () => {
    const invalidPicker = vi.fn();
    const invalidWidth = vi.fn();
    const slickGrid = createGrid({ invalidColumnFreezePickerCallback: invalidPicker, invalidColumnFreezeWidthCallback: invalidWidth });
    const internals = slickGrid as any;
    internals._options.invalidColumnFreezePickerCallback = invalidPicker;
    internals._options.invalidColumnFreezeWidthCallback = invalidWidth;
    internals._options.skipFreezeColumnValidation = false;
    internals._invalidfrozenAlerted = false;
    Object.defineProperty(internals._viewportTopL, 'clientWidth', { configurable: true, value: 100 });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ width: 100 } as DOMRect);
    const invalidPinned = new Map([
      [0, 'left'],
      [1, 'right'],
      [2, 'left'],
      [3, 'right'],
    ]);
    expect(internals.validatePinnedColumnIndexes(invalidPinned, true)).toBe(false);
    expect(invalidPicker).toHaveBeenCalled();
    internals._invalidfrozenAlerted = false;
    expect(internals.validatePinnedColumnIndexes(new Map([[0, 'left']]), true)).toBe(true);
    slickGrid.getColumns()[0].minWidth = 90;
    slickGrid.getColumns()[0].maxWidth = 95;
    expect(
      internals.validatePinnedColumnIndexes(
        new Map([
          [0, 'left'],
          [1, 'right'],
        ]),
        true
      )
    ).toBe(false);
    expect(invalidWidth).toHaveBeenCalled();
    internals.pinningColumnsState.set('a', 'right');
    slickGrid.getColumns()[0].pinned = 'left';
    internals.applyColumnPinningOptions(slickGrid.getColumns());
    expect(slickGrid.getColumns()[0].pinned).toBe('right');
    expect(internals.getPinnedColumnIndexes()).toEqual(new Map([[0, 'right']]));

    expect(internals.getRowIdentity(0)).toBe(0);
    expect(internals.getRowIdentity(99)).toBe(99);
    internals.dockingRowIndexByReference.set('cached', 2);
    expect(internals.resolveDockingRowIndex('cached')).toBe(2);
    internals.data = [{ id: 'row-a' }];
    expect(internals.resolveDockingRowIndex('row-a')).toBe(0);
    internals.data = { getRowById: vi.fn().mockReturnValueOnce(1).mockReturnValue(undefined) };
    expect(internals.resolveDockingRowIndex('from-view')).toBe(1);
    expect(internals.resolveDockingRowIndex('missing')).toBeUndefined();

    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    const cancelAnimationFrameSpy = vi.fn();
    Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: cancelAnimationFrameSpy });
    internals.stickyColumnLayoutFrame = 4;
    internals.singleViewportRenderTimer = setTimeout(() => undefined, 100);
    internals._columnResizeTimer = setTimeout(() => undefined, 100);
    internals.clearAllTimers();
    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(4);
    expect(internals.stickyColumnLayoutFrame).toBeUndefined();
    Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: originalCancelAnimationFrame });
  });

  it('covers remaining compatibility guards and scroll helpers', () => {
    const slickGrid = createGrid();
    const internals = slickGrid as any;
    const scrollSource = document.createElement('div');
    Object.defineProperty(scrollSource, 'scrollLeft', { configurable: true, writable: true, value: 25 });
    Object.defineProperty(internals._viewportScrollContainerX, 'scrollLeft', { configurable: true, writable: true, value: 0 });
    internals.handleElementScroll(scrollSource);
    expect(internals._viewportScrollContainerX.scrollLeft).toBe(25);
    internals.clearDockingNativeHorizontalScrollOffsets();
    internals._dockingHorizontalScroller = undefined;
    internals._viewportScrollContainerX.scrollLeft = 0;
    internals.handleElementScroll(scrollSource);
    internals.clearDockingNativeHorizontalScrollOffsets();
    internals.applyDockingScrollOffsetToRow(document.createElement('div'), {});

    const row = document.createElement('div');
    internals.rowsCache = { 0: { rowNode: [row] }, 1: { rowNode: [row] } };
    internals.dockingByRow = new Map([[0, { band: 'top' }]]);
    const applyRowTopOffsetSpy = vi.spyOn(internals, 'applyRowTopOffset').mockImplementation(() => undefined);
    internals.updateRowPositions(true);
    expect(applyRowTopOffsetSpy).toHaveBeenCalledWith(row, 0);

    internals._options.frozenBottom = true;
    internals.actualFrozenRow = 1;
    vi.spyOn(slickGrid as any, 'getRowPosition').mockImplementation((...args: unknown[]) => (args[0] as number) * 10);
    expect(internals.computeFrozenRowsHeight(4)).toBe(30);
    internals._options.frozenBottom = false;
    internals._options.frozenRow = 2;
    expect(internals.computeFrozenRowsHeight(4)).toBe(20);

    expect(internals.getColumnByIndex(-1)).toBeUndefined();
    const hiddenColumns = slickGrid.getColumns();
    hiddenColumns[1].hidden = true;
    internals.columnPosLeft = [0, 80, 80, 160];
    internals.columnPosRight = [80, 80, 160, 240];
    expect(internals.getColumnRangeRight(1, 0)).toBe(80);
    hiddenColumns[1].hidden = false;

    expect(internals.updateRenderedCellDocking()).toBe(false);
    internals._options.pinning = { columns: { left: ['a'] } };
    internals.rowsCache = { 0: { rowNode: [document.createElement('div')] } };
    expect(internals.updateRenderedCellDocking()).toBe(false);
    internals.rowsCache = { 0: { rowNode: undefined, cellNodesByColumnIdx: {} } };
    expect(internals.updateRenderedCellDocking()).toBe(true);
    expect(internals.getRowDockingRegion(document.createElement('div'), 0)).toBeInstanceOf(HTMLElement);
    internals.syncDockedRowContainers();

    internals._options.pinning = undefined;
    internals._dockingOverlay = document.createElement('div');
    container.appendChild(internals._dockingOverlay);
    internals.refreshRowDockingLayout();
    expect(internals._dockingOverlay).toBeUndefined();

    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: undefined });
    internals.stickyColumnLayoutFrame = 5;
    internals.clearAllTimers();
    Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: originalCancelAnimationFrame });
  });

  it('covers legacy sortable callbacks and column auto-scroll guards', () => {
    vi.useFakeTimers();
    try {
      const slickGrid = createGrid({ enableColumnReorder: true });
      const internals = slickGrid as any;
      const sortable = internals.sortableSideLeftInstance as any;
      const item = internals._headerL.children[0] as HTMLElement;
      const related = document.createElement('div');
      related.classList.add(internals._options.unorderableColumnCssClass);

      expect(sortable.options.onMove({ related })).toBe(false);
      related.classList.remove(internals._options.unorderableColumnCssClass);
      expect(sortable.options.onMove({ related })).toBe(true);

      Object.defineProperty(container, 'clientWidth', { configurable: true, value: 800 });
      Object.defineProperty(internals._viewportScrollContainerX, 'clientWidth', { configurable: true, value: 200 });
      Object.defineProperty(internals._viewportScrollContainerX, 'scrollLeft', { configurable: true, writable: true, value: 0 });
      sortable.options.onStart({ item });
      const moveEvent = new MouseEvent('mousemove', { bubbles: true, clientX: 700, clientY: 10 });
      Object.defineProperty(moveEvent, 'pageX', { configurable: true, value: 900 });
      document.dispatchEvent(moveEvent);
      vi.advanceTimersByTime(30);
      expect(internals._viewportScrollContainerX.scrollLeft).toBe(10);

      document.dispatchEvent(moveEvent);
      internals.initialized = false;
      vi.advanceTimersByTime(30);
      document.dispatchEvent(moveEvent);
      internals.initialized = true;
      internals.sortableSideLeftInstance.toArray = vi.fn().mockReturnValue(['b', 'a', 'c', 'd']);
      const setColumnsSpy = vi.spyOn(slickGrid, 'setColumns').mockImplementation(() => undefined);
      const scrollToXSpy = vi.spyOn(slickGrid, 'scrollToX').mockImplementation(() => undefined);
      const setupResizeSpy = vi.spyOn(internals, 'setupColumnResize').mockImplementation(() => undefined);
      const focusSpy = vi.spyOn(slickGrid, 'setFocus').mockImplementation(() => undefined);
      internals.activeCellNode = item;
      sortable.options.onEnd({ item, stopPropagation: vi.fn() });

      expect(setColumnsSpy).toHaveBeenCalled();
      expect(scrollToXSpy).toHaveBeenCalled();
      expect(setupResizeSpy).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('covers compatibility getters, scrollTo, option rejection, and wheel setup', () => {
    const invalidPicker = vi.fn();
    const slickGrid = createGrid({ invalidColumnFreezePickerCallback: invalidPicker });
    const internals = slickGrid as any;

    const hasFrozenColumnsSpy = vi.spyOn(internals, 'hasFrozenColumns');
    hasFrozenColumnsSpy.mockReturnValue(false);
    slickGrid.getHeader();
    hasFrozenColumnsSpy.mockRestore();

    const usesDockingChromeSpy = vi.spyOn(internals, 'usesDockingChromeRegions');
    usesDockingChromeSpy.mockReturnValue(false);
    internals._options.frozenColumn = -1;
    slickGrid.getHeader();
    slickGrid.getHeaderColumn(0);
    slickGrid.getHeaderRowColumn(0);
    slickGrid.getFooterRowColumn(0);
    usesDockingChromeSpy.mockReturnValue(true);
    slickGrid.getHeader(slickGrid.getColumns()[0]);
    slickGrid.getColumnByIndex(0);
    slickGrid.getHeaderColumn(0);
    slickGrid.getHeaderRowColumn(0);
    slickGrid.getFooterRowColumn(0);
    internals._options.frozenColumn = 0;
    usesDockingChromeSpy.mockRestore();

    internals._options.pinning = undefined;
    internals._options.frozenColumn = 0;
    internals._headers = [internals._headerL];
    expect(slickGrid.getColumnByIndex(0)).toBe(internals._headerL.children[0]);
    expect(slickGrid.getHeaderColumn(0)).toBe(internals._headerL.children[0]);

    internals.hasFrozenRows = true;
    internals._options.frozenBottom = false;
    internals.actualFrozenRow = 0;
    internals._viewportTopL = document.createElement('div');
    internals._viewportBottomL = document.createElement('div');
    internals._viewportBottomR = document.createElement('div');
    internals._viewportTopL.scrollTop = 0;
    internals._viewportBottomL.scrollTop = 0;
    internals._viewportBottomR.scrollTop = 0;
    slickGrid.scrollTo(10);

    const dockingScrollerSpy = vi.spyOn(internals, 'hasDockingHorizontalScroller').mockReturnValue(false);
    internals._viewport = [internals._viewportTopL];
    internals._options.createFooterRow = true;
    internals._footerRow = [];
    internals._options.createPreHeaderPanel = true;
    internals._options.createTopHeaderPanel = true;
    internals._footerRowL = document.createElement('div');
    internals._preHeaderPanel = document.createElement('div');
    internals._topHeaderPanel = document.createElement('div');
    slickGrid.scrollToX(10);
    internals._viewport = [internals._viewportTopL, document.createElement('div'), internals._viewportBottomL, internals._viewportBottomR];
    internals._headerScrollContainer = document.createElement('div');
    internals._topPanelScrollers = [document.createElement('div')];
    internals._footerRowScrollContainer = document.createElement('div');
    internals._preHeaderPanelScroller = document.createElement('div');
    internals._preHeaderPanelScrollerR = document.createElement('div');
    internals._topHeaderPanelScroller = document.createElement('div');
    internals._viewportTopR = document.createElement('div');
    internals._headerRowScrollerR = document.createElement('div');
    internals._headerRowScrollerL = document.createElement('div');
    internals._options.frozenColumn = 0;
    internals.hasFrozenRows = true;
    slickGrid.scrollToX(20);
    internals._options.frozenColumn = -1;
    slickGrid.scrollToX(25);
    internals._options.frozenColumn = 0;
    dockingScrollerSpy.mockRestore();

    const columnsWithGap = [undefined, ...slickGrid.getColumns()];
    internals._options.pinning = { columns: { left: ['a'], right: [] } };
    internals.applyColumnPinningOptions(columnsWithGap);

    internals.rowDockingLayout.top = [{ index: 0, height: 20, sticky: false }];
    expect(internals.getTopPinnedRowsHeight()).toBe(20);

    internals._options.skipFreezeColumnValidation = true;
    expect(internals.validatePinnedColumnIndexes(new Map())).toBe(true);
    internals._options.skipFreezeColumnValidation = false;
    slickGrid.setColumnStickiness('a', false);
    slickGrid.setColumnStickiness('a', false);
    internals._options.frozenColumn = 0;
    expect(slickGrid.getFrozenColumnId()).toBe('a');

    const getColumnByIdSpy = vi.spyOn(internals, 'getColumnById').mockReturnValue(slickGrid.getColumns()[0]);
    const getColumnIndexSpy = vi.spyOn(internals, 'getColumnIndex').mockReturnValue(undefined);
    slickGrid.getColumns()[0].pinned = null;
    slickGrid.setColumnPinning('a', 'right');
    getColumnByIdSpy.mockRestore();
    getColumnIndexSpy.mockRestore();

    const originalValidate = internals.validateColumnFreeze;
    internals.validateColumnFreeze = vi.fn().mockReturnValue(false);
    slickGrid.setColumns(slickGrid.getColumns());
    internals.validateColumnFreeze = originalValidate;

    vi.spyOn(internals, 'validateColumnFreezeWidth').mockReturnValue(true);
    vi.spyOn(internals, 'getViewports').mockReturnValue([internals._viewportScrollContainerX]);
    const handleScrollSpy = vi.spyOn(internals, 'handleScroll').mockImplementation(() => undefined);
    slickGrid.setOptions({ frozenColumn: 0 }, true, true, true);
    expect(handleScrollSpy).toHaveBeenCalled();

    vi.spyOn(internals, 'shouldRefreshFormattedCachePlanner').mockReturnValue(true);
    const syncPlannerSpy = vi.spyOn(internals, 'syncDataViewFormattedCachePlanner').mockImplementation(() => undefined);
    slickGrid.setOptions({}, true, true, true);
    expect(syncPlannerSpy).toHaveBeenCalledWith(true);

    internals._options.pinning = { columns: { left: ['a', 'b', 'c', 'd'], right: [] } };
    internals._invalidfrozenAlerted = false;
    slickGrid.setOptions({ pinning: { columns: { left: ['a', 'b', 'c', 'd'], right: [] } } }, true, true, true);
    expect(invalidPicker).toHaveBeenCalled();

    const destroyInstancesSpy = vi.spyOn(internals, 'destroyAllInstances');
    internals.slickMouseWheelInstances = [];
    slickGrid.setOptions({ enableMouseWheelScrollHandler: true }, true, true, true);
    expect(internals.slickMouseWheelInstances.length).toBeGreaterThan(0);
    slickGrid.setOptions({ enableMouseWheelScrollHandler: false }, true, true, true);
    expect(destroyInstancesSpy).toHaveBeenCalled();
  });

  it('covers docking chrome guards, edge compensation, and post-render row cleanup', () => {
    const slickGrid = createGrid({
      createFooterRow: true,
      pinning: { columns: { left: ['a'], right: ['d'] } },
      showHeaderRow: true,
    });
    const internals = slickGrid as any;
    const header = slickGrid.getHeaderColumn('a');
    header.style.borderRightWidth = '1px';
    internals._options.rtl = false;
    internals.applyDockingToColumnChrome();
    header.style.borderLeftWidth = '1px';
    internals._options.rtl = true;
    internals.applyDockingToColumnChrome();
    internals._options.rtl = false;

    expect(internals.getRightDockedChromeLeft(document.createElement('div'), { offset: 0 })).toEqual(expect.any(Number));

    const invalidHeader = document.createElement('div');
    invalidHeader.className = 'slick-header-column';
    invalidHeader.dataset.id = 'not-a-column';
    internals._headerL.appendChild(invalidHeader);
    internals.syncDockingChromeRegions();
    const movableHeader = document.createElement('div');
    movableHeader.className = 'slick-header-column';
    movableHeader.dataset.id = 'a';
    internals._headerL.appendChild(movableHeader);
    internals.syncDockingChromeRegions();
    const invalidHeaderRow = document.createElement('div');
    invalidHeaderRow.className = 'slick-headerrow-column';
    internals._headerRowL.appendChild(invalidHeaderRow);
    internals.syncDockingChromeRegions();
    const dockingRegions = internals.dockingHeaderRegions;
    internals.dockingHeaderRegions = undefined;
    internals.syncDockingChromeRegions();
    internals.dockingHeaderRegions = dockingRegions;

    const rowNode = document.createElement('div');
    const cellNode = document.createElement('div');
    container.append(rowNode, cellNode);
    internals.postProcessedCleanupQueue = [];
    internals.queuePostProcessedRowForCleanup({ rowNode: [rowNode], cellNodesByColumnIdx: { 0: cellNode } }, { 0: { status: 'C' } }, 0);
    internals.queuePostProcessedRowForCleanup({ rowNode: undefined, cellNodesByColumnIdx: {} }, undefined, 1);
    expect(internals.postProcessedCleanupQueue.length).toBeGreaterThan(0);
  });

  it('covers legacy resize calculations and column cache cleanup paths', () => {
    vi.useFakeTimers();
    const slickGrid = createGrid({ forceFitColumns: true, autoScrollOnColumnResize: false });
    const internals = slickGrid as any;
    slickGrid.getColumns().forEach((column) => {
      column.resizable = true;
      column.width = 100;
      column.previousWidth = 100;
    });
    internals._options.frozenColumn = 0;
    internals._options.frozenRightViewportMinWidth = 10;
    internals.canvasWidthL = 100;
    internals.canvasWidthR = 300;
    internals.viewportW = 250;
    const headerColumns = Array.from(container.querySelectorAll('.slick-header-column')) as HTMLElement[];
    headerColumns.forEach((element) => Object.defineProperty(element, 'offsetWidth', { configurable: true, value: 100 }));
    vi.spyOn(internals, 'getHeaderChildren').mockReturnValue(headerColumns);
    internals.setupColumnResize();
    const firstHandle = container.querySelector('.slick-resizable-handle') as HTMLDivElement;
    const middleHandle = container.querySelectorAll('.slick-resizable-handle')[2] as HTMLDivElement;
    expect(firstHandle).toBeTruthy();
    const down = new CustomEvent('mousedown');
    Object.defineProperty(down, 'pageX', { configurable: true, value: 100 });
    Object.defineProperty(down, 'clientX', { configurable: true, value: 100 });
    const moveLeft = new CustomEvent('mousemove');
    Object.defineProperty(moveLeft, 'pageX', { configurable: true, value: 50 });
    Object.defineProperty(moveLeft, 'clientX', { configurable: true, value: 50 });
    const moveRight = new CustomEvent('mousemove');
    Object.defineProperty(moveRight, 'pageX', { configurable: true, value: 150 });
    Object.defineProperty(moveRight, 'clientX', { configurable: true, value: 150 });
    const up = new CustomEvent('mouseup');
    firstHandle.dispatchEvent(down);
    container.dispatchEvent(down);
    document.body.dispatchEvent(moveLeft);
    document.body.dispatchEvent(moveRight);
    middleHandle.dispatchEvent(down);
    container.dispatchEvent(down);
    document.body.dispatchEvent(moveLeft);
    document.body.dispatchEvent(moveRight);
    document.body.dispatchEvent(up);

    internals._options.forceFitColumns = false;
    internals.setupColumnResize();
    const secondHandle = container.querySelector('.slick-resizable-handle') as HTMLDivElement;
    const secondMiddleHandle = container.querySelectorAll('.slick-resizable-handle')[2] as HTMLDivElement;
    secondHandle.dispatchEvent(down);
    container.dispatchEvent(down);
    document.body.dispatchEvent(moveLeft);
    document.body.dispatchEvent(moveRight);
    secondMiddleHandle.dispatchEvent(down);
    container.dispatchEvent(down);
    document.body.dispatchEvent(moveLeft);
    document.body.dispatchEvent(moveRight);
    document.body.dispatchEvent(up);

    internals._options.autoScrollOnColumnResize = true;
    internals.setupColumnResize();
    const autoHandle = container.querySelector('.slick-resizable-handle') as HTMLDivElement;
    const autoMove = new CustomEvent('mousemove');
    Object.defineProperty(autoMove, 'pageX', { configurable: true, value: 400 });
    Object.defineProperty(autoMove, 'clientX', { configurable: true, value: 400 });
    autoHandle.dispatchEvent(down);
    container.dispatchEvent(down);
    document.body.dispatchEvent(autoMove);
    internals.initialized = false;
    vi.advanceTimersByTime(30);
    document.body.dispatchEvent(autoMove);
    internals.initialized = true;
    document.body.dispatchEvent(up);

    internals._options.pinning = { columns: { left: ['a'], right: [] } };
    internals.dockingByColumn = new Map([[0, { band: 'left', sticky: true }]]);
    const cellRow = document.createElement('div');
    internals.appendCellHtml(cellRow, 0, 0, 1, 1, null, data[0]);
    expect(cellRow.firstElementChild?.classList.contains('slick-cell-sticky')).toBe(true);

    const cleanupRow = document.createElement('div');
    cleanupRow.dataset.row = '2';
    container.appendChild(cleanupRow);
    internals._options.enableAsyncPostRenderCleanup = true;
    internals.rowsCache = { 2: { rowNode: [cleanupRow], cellNodesByColumnIdx: { 0: document.createElement('div') } } };
    internals.postProcessedRows = { 2: { 0: 'C' } };
    internals.removeRowFromCache(2);
    expect(internals.rowsCache[2]).toBeUndefined();

    slickGrid.getColumns()[1].hidden = true;
    slickGrid.getColumns()[2].hidden = true;
    internals.dockingByColumn = new Map([[3, { band: 'right' }]]);
    internals.columnPosRight = [80, 80, 80, 320];
    expect(internals.getColumnRangeRight(1, 0)).toEqual(expect.any(Number));
    expect(internals.getColumnRangeRight(2, 0)).toEqual(expect.any(Number));

    const dockingRow = document.createElement('div');
    dockingRow.className = 'slick-row slick-row-docked';
    internals.rowsCache = {
      0: {
        rowNode: [dockingRow],
        cellNodesByColumnIdx: { 0: document.createElement('div'), hasOwnProperty: () => false },
      },
    };
    internals.dockingByColumn = new Map([[0, { band: 'left' }]]);
    internals.updateRenderedCellDocking();

    const planner = internals.formattedDataCachePlanner;
    expect(planner(slickGrid.getColumns()[0], { excelExportOptions: { exportWithFormatter: true } })).toBeDefined();
    expect(planner(slickGrid.getColumns()[1], { textExportOptions: undefined, pdfExportOptions: undefined })).toBeUndefined();
    expect(
      planner(slickGrid.getColumns()[1], {
        excelExportOptions: undefined,
        textExportOptions: { exportWithFormatter: false },
        pdfExportOptions: { exportWithFormatter: true },
      })
    ).toBeDefined();
    vi.useRealTimers();
  });

  it('covers frozen canvas resize branches and variable row-height recalculation', () => {
    const slickGrid = createGrid({ createPreHeaderPanel: true, showPreHeaderPanel: true });
    const internals = slickGrid as any;
    internals.viewportW = 200;
    internals.viewportH = 400;
    internals.frozenRowsHeight = 50;
    internals.hasFrozenRows = true;
    internals._options.frozenColumn = 0;
    internals._options.frozenRow = 0;
    internals._options.frozenBottom = true;
    internals._options.autoHeight = false;
    Object.defineProperty(internals._viewportTopL, 'clientWidth', { configurable: true, value: 100 });
    internals.dockingLayout.contentWidth = 500;
    internals.scrollbarDimensions = { width: 15, height: 15 };

    vi.spyOn(internals, 'getViewportWidth').mockImplementation(() => internals.viewportW);
    vi.spyOn(internals, 'getViewportHeight').mockImplementation(() => internals.viewportH);
    vi.spyOn(internals, 'hasDockingHorizontalScroller').mockReturnValue(true);
    vi.spyOn(internals, 'refreshDockingLayout').mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValue(false);
    vi.spyOn(internals, 'updateDockingOverlayDimensions').mockImplementation(() => undefined);
    vi.spyOn(internals, 'updateDockingHorizontalScrollerDimensions').mockImplementation(() => undefined);
    vi.spyOn(internals, 'measureScrollbar').mockReturnValue({ width: 15, height: 15 });
    vi.spyOn(internals, 'updateColumnCaches').mockImplementation(() => undefined);
    vi.spyOn(internals, 'applyColumnWidths').mockImplementation(() => undefined);
    vi.spyOn(internals, 'applyDockingToColumnChrome').mockImplementation(() => undefined);
    vi.spyOn(internals, 'invalidateAllRows').mockImplementation(() => undefined);
    vi.spyOn(internals, 'scrollToX').mockImplementation(() => undefined);
    vi.spyOn(internals, 'updateRowCount').mockImplementation(() => undefined);
    vi.spyOn(internals, 'handleScroll').mockImplementation(() => undefined);
    vi.spyOn(internals, 'render').mockImplementation(() => undefined);

    internals.resizeCanvas();

    internals._options.autoHeight = true;
    internals._options.frozenBottom = false;
    internals.hasFrozenRows = false;
    internals._options.showPreHeaderPanel = true;
    internals._options.showTopHeaderPanel = true;
    internals._options.topHeaderPanelHeight = 5;
    internals._paneHeaderL.style.height = '10px';
    Object.defineProperty(internals._paneHeaderL, 'offsetHeight', { configurable: true, value: 10 });
    vi.spyOn(internals._paneHeaderL, 'getBoundingClientRect').mockReturnValue({ height: 10 } as DOMRect);
    internals.resizeCanvas();

    internals._options.autoHeight = false;
    internals.hasFrozenRows = true;
    internals._options.frozenColumn = -1;
    internals.resizeCanvas();

    internals._dockingHorizontalScroller = undefined;
    (internals.updateDockingHorizontalScrollerDimensions as any).mockRestore();
    internals.updateDockingHorizontalScrollerDimensions();
    internals._options.enableVariableRowHeight = true;
    internals.rowPositionIndexer = undefined;
    internals.rowHeightsDirty = true;
    internals.frozenRowHeightsChanged = false;
    vi.spyOn(internals, 'computeFrozenRowsHeight').mockReturnValue(55);
    internals.hasFrozenRows = true;
    internals.actualFrozenRow = 1;
    internals.ensureRowPositionIndexer(3);
    expect(internals.frozenRowHeightsChanged).toBe(true);

    internals.rowsCache = { 0: { rowNode: [document.createElement('div')], cellNodesByColumnIdx: {} } };
    internals._options.frozenRow = 0;
    internals.cleanUpCells({ top: 0, bottom: 0, leftPx: 0, rightPx: 100 } as any, 0);
    internals.rowsCache = { 0: { rowNode: [document.createElement('div')], cellRenderQueue: [], cellNodesByColumnIdx: {}, cellColSpans: {} } };
    internals.dockingByColumn = new Map([[3, { band: 'right' }]]);
    internals.columnPosLeft = [100, 100, 100, 100];
    vi.spyOn(internals, 'hasDockedColumns').mockReturnValue(true);
    vi.spyOn(internals, 'cleanUpCells').mockImplementation(() => undefined);
    internals.cleanUpAndRenderCells({ top: 0, bottom: 0, leftPx: 0, rightPx: 0 });
    expect(() => slickGrid.getSelectedRows()).toThrow('SlickGrid Selection model is not set');
  });

  it('re-applies canvas sizing when frozen row heights change', () => {
    const slickGrid = createGrid();
    const internals = slickGrid as any;
    internals.frozenRowHeightsChanged = true;
    const resizeSpy = vi.spyOn(internals, 'resizeCanvas').mockImplementation(() => undefined);
    internals.updateRowCount();
    expect(resizeSpy).toHaveBeenCalled();
    expect(internals.frozenRowHeightsChanged).toBe(false);
  });

  it('calculates cell boxes across top/bottom rows and left/right pinned columns', () => {
    const slickGrid = createGrid({
      pinning: { columns: { left: 0, right: ['d'] }, rows: { top: [0], bottom: [2] } },
    });
    Object.defineProperty((slickGrid as any)._viewportScrollContainerY, 'clientHeight', { configurable: true, value: 400 });

    const topLeft = slickGrid.getCellNodeBox(0, 0);
    const bottomRight = slickGrid.getCellNodeBox(2, 3);

    expect(topLeft?.top).toBe(0);
    expect(topLeft?.left).toBe(0);
    expect(bottomRight?.top).toBeGreaterThanOrEqual(0);
    expect(bottomRight?.left).toEqual(expect.any(Number));
  });

  it('updates column pinning and stickiness through the public API', () => {
    const invalidPinning = vi.fn();
    const slickGrid = createGrid({
      pinning: { columns: { left: [] } },
      invalidColumnFreezePickerCallback: invalidPinning,
    });

    slickGrid.setColumnPinning('b', 'left');
    expect(slickGrid.getPinnedColumns('left').map((column) => column.id)).toEqual(['b']);
    expect(slickGrid.getOptions().pinning?.columns?.left).toEqual(['b']);

    slickGrid.setColumnPinning('c', 'right');
    expect(slickGrid.getPinnedColumns('right').map((column) => column.id)).toEqual(['c']);
    slickGrid.setColumnPinning('b', null);
    expect(slickGrid.getPinnedColumns('left')).toEqual([]);

    slickGrid.setColumnStickiness('a', 'both');
    expect(slickGrid.getColumns()[0].sticky).toBe('both');
    slickGrid.setColumnStickiness('a', false);
    expect(slickGrid.getColumns()[0].sticky).toBe(false);
    slickGrid.setColumnPinning('missing', 'left');
    slickGrid.setColumnPinning('c', 'right');

    slickGrid.setColumnPinning('a', 'left');
    slickGrid.setColumnPinning('d', 'left');
    slickGrid.setColumnPinning('b', 'left');
    expect(invalidPinning).toHaveBeenCalled();
  });

  it('merges pinning options while replacing row lists atomically', () => {
    const slickGrid = createGrid({ pinning: { columns: { left: 0, right: [] }, rows: { top: [0, 1], bottom: [2] } } });

    slickGrid.setOptions({
      pinning: { columns: { right: ['d'] }, rows: { top: [1], bottom: [] } },
      stickyRows: { top: [2], bottom: [], both: [] },
    });

    expect(slickGrid.getOptions().pinning).toEqual({ columns: { left: 0, right: ['d'] }, rows: { top: [1], bottom: [] } });
    expect(slickGrid.getOptions().stickyRows).toEqual({ top: [2], bottom: [], both: [] });
    expect(slickGrid.getColumns().map((column) => column.pinned)).toEqual(['left', null, null, 'right']);

    slickGrid.setOptions({ pinning: { columns: { left: [], right: [] }, rows: { top: [], bottom: [] } } });
    expect(slickGrid.getColumns().every((column) => !column.pinned)).toBe(true);
  });

  it('activates a cell rendered in a docked row using its data-row coordinate', () => {
    const slickGrid = createGrid({ pinning: { rows: { top: [0], bottom: [] } } });
    const dockedCell = container.querySelector('.slick-docking-overlay [data-row="0"] .slick-cell') as HTMLDivElement;

    expect(dockedCell).toBeTruthy();
    (slickGrid as any).setActiveCellInternal(dockedCell);

    expect(slickGrid.getActiveCell()).toEqual({ row: 0, cell: 0 });
  });

  it('resolves legacy bottom-row coordinates and restores focus when no editor is created', () => {
    const slickGrid = createGrid({});
    const canvas = document.createElement('div');
    canvas.className = 'grid-canvas grid-canvas-bottom';
    const rowNode = document.createElement('div');
    rowNode.className = 'slick-row';
    rowNode.dataset.row = '1';
    const cell = document.createElement('div');
    cell.className = 'slick-cell';
    rowNode.appendChild(cell);
    canvas.appendChild(rowNode);
    container.appendChild(canvas);

    (slickGrid as any).hasFrozenRows = true;
    (slickGrid as any).actualFrozenRow = 1;
    vi.spyOn(slickGrid as any, 'getFrozenRowOffset').mockReturnValue(5);
    vi.spyOn(slickGrid as any, 'getCellFromPoint').mockReturnValue({ row: 1, cell: 0 });
    vi.spyOn(slickGrid as any, 'getCellFromNode').mockReturnValue(0);
    (slickGrid as any).setActiveCellInternal(cell);

    const focusSpy = vi.spyOn(slickGrid, 'setFocus');
    slickGrid.gotoCell(0, 0);
    expect(focusSpy).toHaveBeenCalled();
  });

  it('maps events from a frozen bottom canvas through the frozen-row offset', () => {
    const slickGrid = createGrid({});
    const canvas = document.createElement('div');
    canvas.className = 'grid-canvas grid-canvas-bottom';
    const rowNode = document.createElement('div');
    rowNode.className = 'slick-row';
    rowNode.dataset.row = '1';
    const cell = document.createElement('div');
    cell.className = 'slick-cell';
    rowNode.appendChild(cell);
    canvas.appendChild(rowNode);
    container.appendChild(canvas);

    (slickGrid as any).hasFrozenRows = true;
    (slickGrid as any).actualFrozenRow = 1;
    vi.spyOn(slickGrid as any, 'getFrozenRowOffset').mockReturnValue(25);
    vi.spyOn(slickGrid as any, 'getRowFromNode').mockReturnValue(1);
    vi.spyOn(slickGrid as any, 'getCellFromPoint').mockReturnValue({ row: 1, cell: 0 });
    vi.spyOn(slickGrid as any, 'getCellFromNode').mockReturnValue(0);
    const event = new MouseEvent('click', { bubbles: true, clientX: 5, clientY: 5 });
    Object.defineProperty(event, 'target', { configurable: true, value: cell });

    expect(slickGrid.getCellFromEvent(event)).toEqual({ row: 1, cell: 0 });
  });

  it('returns zero for rows above a frozen top boundary', () => {
    const slickGrid = createGrid({});
    (slickGrid as any).hasFrozenRows = true;
    (slickGrid as any)._options.frozenBottom = false;
    (slickGrid as any).actualFrozenRow = 2;
    (slickGrid as any).frozenRowsHeight = 50;

    expect(slickGrid.getFrozenRowOffset(1)).toBe(0);
    expect(slickGrid.getFrozenRowOffset(2)).toBe(50);
  });

  it('covers frozen-bottom offset calculations and missing row lookup', () => {
    const slickGrid = createGrid({});
    expect((slickGrid as any).getRowFromNode(document.createElement('div'))).toBeNull();

    (slickGrid as any).hasFrozenRows = true;
    (slickGrid as any)._options.frozenBottom = true;
    (slickGrid as any).actualFrozenRow = 2;
    (slickGrid as any).h = 20;
    (slickGrid as any).viewportTopH = 30;
    vi.spyOn(slickGrid, 'getRowPosition').mockReturnValue(55);
    expect(slickGrid.getFrozenRowOffset(2)).toBe(55);

    (slickGrid as any).viewportTopH = 10;
    expect(slickGrid.getFrozenRowOffset(2)).toBe(20);
    expect(slickGrid.getFrozenRowOffset(1)).toBe(0);
  });

  it('queues one deferred sticky-column layout and falls back when animation frames are unavailable', () => {
    const slickGrid = createGrid();
    const renderSpy = vi.spyOn(slickGrid, 'render').mockImplementation(() => undefined);
    const refreshSpy = vi.spyOn(slickGrid as any, 'refreshDockingLayout').mockReturnValue(true);
    const updateRenderedCellDockingSpy = vi
      .spyOn(slickGrid as any, 'updateRenderedCellDocking')
      .mockReturnValue(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const invalidateSpy = vi.spyOn(slickGrid as any, 'invalidateAllRows');
    vi.spyOn(slickGrid as any, 'updateColumnPositionCaches');
    vi.spyOn(slickGrid as any, 'applyColumnWidths');
    vi.spyOn(slickGrid as any, 'scrollToX');
    vi.spyOn(slickGrid as any, 'applyDockingToColumnChrome');
    const applyDockingDimensionsToRowsSpy = vi.spyOn(slickGrid as any, 'applyDockingDimensionsToRows');
    const enqueueSingleViewportRenderSpy = vi.spyOn(slickGrid as any, 'enqueueSingleViewportRender').mockImplementation(() => undefined);

    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    vi.useFakeTimers();
    try {
      let runFrame: FrameRequestCallback | undefined;
      const requestAnimationFrameSpy = vi.fn((callback: FrameRequestCallback) => {
        runFrame = callback;
        return 1;
      });
      Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: requestAnimationFrameSpy });
      (slickGrid as any).enqueueStickyColumnLayout();
      expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
      runFrame?.(0);
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      (slickGrid as any).singleViewportRenderTimer = setTimeout(() => undefined, 100);
      (slickGrid as any).stickyColumnLayoutFrame = undefined;
      Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: requestAnimationFrameSpy });
      (slickGrid as any).enqueueStickyColumnLayout();
      runFrame?.(0);
      expect(updateRenderedCellDockingSpy).toHaveBeenCalledTimes(2);
      expect(applyDockingDimensionsToRowsSpy).toHaveBeenCalledTimes(1);
      expect(enqueueSingleViewportRenderSpy).toHaveBeenCalledTimes(1);

      (slickGrid as any).stickyColumnLayoutFrame = undefined;
      (slickGrid as any).initialized = false;
      (slickGrid as any).enqueueStickyColumnLayout();
      runFrame?.(0);
      expect(refreshSpy).toHaveBeenCalledTimes(2);

      (slickGrid as any).initialized = true;
      (slickGrid as any).stickyColumnLayoutFrame = undefined;
      refreshSpy.mockReturnValueOnce(false);
      (slickGrid as any).enqueueStickyColumnLayout();
      runFrame?.(0);
      expect(refreshSpy).toHaveBeenCalledTimes(3);

      (slickGrid as any).stickyColumnLayoutFrame = undefined;
      (slickGrid as any).singleViewportRenderTimer = setTimeout(() => undefined, 100);
      Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: undefined });
      (slickGrid as any).enqueueStickyColumnLayout();
      (slickGrid as any).enqueueStickyColumnLayout();
      vi.advanceTimersByTime(16);

      expect(refreshSpy).toHaveBeenCalledTimes(4);
      expect(invalidateSpy).toHaveBeenCalledTimes(2);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
      Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: originalRequestAnimationFrame });
    }
  });

  it('defers a single-viewport render until the scheduled render callback runs', () => {
    const slickGrid = createGrid();
    const renderSpy = vi.spyOn(slickGrid, 'render').mockImplementation(() => undefined);
    vi.useFakeTimers();
    try {
      (slickGrid as any).enqueueSingleViewportRender();
      (slickGrid as any).enqueueSingleViewportRender();
      expect(renderSpy).not.toHaveBeenCalled();

      vi.runOnlyPendingTimers();
      expect(renderSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cleans up queued async post-render nodes by cleanup group', () => {
    const slickGrid = createGrid();
    const cleanupSpy = vi.fn();
    slickGrid.getColumns()[0].asyncPostRenderCleanup = cleanupSpy;
    const removedNode = document.createElement('span');
    const cleanupNode = document.createElement('span');
    container.append(removedNode, cleanupNode);
    (slickGrid as any).postProcessedCleanupQueue = [
      { groupId: 7, actionType: 'R', node: [removedNode] },
      { groupId: 7, actionType: 'C', node: cleanupNode, rowIdx: 1, columnIdx: 0 },
    ];

    vi.useFakeTimers();
    try {
      (slickGrid as any).asyncPostProcessCleanupRows();

      expect(removedNode.isConnected).toBe(false);
      expect(cleanupSpy).toHaveBeenCalledWith(cleanupNode, 1, slickGrid.getColumns()[0]);
      expect((slickGrid as any).postProcessedCleanupQueue).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('handles regular and shift mouse-wheel scrolling and prevents native scrolling for frozen columns', () => {
    const slickGrid = createGrid();
    const horizontalScroller = (slickGrid as any)._viewportScrollContainerX as HTMLDivElement;
    const verticalScroller = (slickGrid as any)._viewportScrollContainerY as HTMLDivElement;
    Object.defineProperty(horizontalScroller, 'scrollLeft', { configurable: true, writable: true, value: 12 });
    Object.defineProperty(verticalScroller, 'scrollTop', { configurable: true, writable: true, value: 30 });
    Object.defineProperty(verticalScroller, 'scrollHeight', { configurable: true, value: 500 });
    const handleScrollSpy = vi.spyOn(slickGrid as any, '_handleScroll').mockReturnValue(true);
    const frozenColumnsSpy = vi
      .spyOn(slickGrid as any, 'hasFrozenColumns')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const regularEvent = new MouseEvent('mousewheel', { cancelable: true });
    (slickGrid as any).handleMouseWheel(regularEvent, 0, 2, 1);
    expect((slickGrid as any).scrollTop).toBe(5);
    expect((slickGrid as any).scrollLeft).toBe(32);
    expect(regularEvent.cancelBubble).toBe(true);

    const shiftEvent = new MouseEvent('mousewheel', { cancelable: true, shiftKey: true });
    (slickGrid as any).handleMouseWheel(shiftEvent, 0, 1, 10);
    expect((slickGrid as any).scrollLeft).toBe(22);
    expect(shiftEvent.defaultPrevented).toBe(true);
    expect(handleScrollSpy).toHaveBeenCalledTimes(2);
    expect(frozenColumnsSpy).toHaveBeenCalledTimes(2);
  });

  it('focuses a keyboard target without allowing the event to bubble', () => {
    const slickGrid = createGrid();
    const target = document.createElement('button');
    container.appendChild(target);
    const stopBubblingSpy = vi.spyOn(slickGrid as any, 'stopFullBubbling');
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });

    (slickGrid as any).focusElementWithoutBubbling(event, target);
    expect(document.activeElement).toBe(target);
    expect(stopBubblingSpy).toHaveBeenCalledWith(event);

    (slickGrid as any).focusElementWithoutBubbling(event, null);
    expect(stopBubblingSpy).toHaveBeenCalledTimes(1);
  });

  it('moves focus between compatibility frozen panes when tabbing filter controls', () => {
    const slickGrid = createGrid();
    (slickGrid as any)._options.frozenColumn = 0;

    const leftPane = document.createElement('div');
    leftPane.className = 'slick-pane-left';
    const leftHeader = document.createElement('div');
    leftHeader.className = 'slick-header-columns';
    const leftFilter = document.createElement('button');
    leftFilter.tabIndex = 0;
    leftHeader.appendChild(leftFilter);
    leftPane.appendChild(leftHeader);

    const rightPane = document.createElement('div');
    rightPane.className = 'slick-pane-right';
    const rightHeader = document.createElement('div');
    rightHeader.className = 'slick-header-columns';
    const rightFilter = document.createElement('button');
    rightFilter.tabIndex = 0;
    rightHeader.appendChild(rightFilter);
    rightPane.appendChild(rightHeader);
    container.append(leftPane, rightPane);

    for (const element of [leftFilter, rightFilter]) {
      Object.defineProperty(element, 'offsetParent', { configurable: true, value: container });
    }

    const shiftTabEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab', shiftKey: true });
    Object.defineProperty(shiftTabEvent, 'target', { configurable: true, value: rightFilter });
    (slickGrid as any).handleContainerKeyDown(shiftTabEvent);
    expect(document.activeElement).toBe(leftFilter);

    const tabEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' });
    Object.defineProperty(tabEvent, 'target', { configurable: true, value: leftFilter });
    (slickGrid as any).handleContainerKeyDown(tabEvent);
    expect(document.activeElement).toBe(rightFilter);
  });

  it('covers compatibility pane layout updates with frozen rows and columns', () => {
    const slickGrid = createGrid({
      createFooterRow: true,
      createPreHeaderPanel: true,
      showHeaderRow: true,
      showPreHeaderPanel: true,
    });
    const internals = slickGrid as any;
    internals._options.frozenColumn = 0;
    internals._options.frozenRow = 0;
    internals._options.pinning = undefined;
    internals.hasFrozenRows = true;
    internals.actualFrozenRow = 0;
    const headerRight = document.createElement('div');
    const headerRowRight = document.createElement('div');
    const footerRight = document.createElement('div');
    container.append(headerRight, headerRowRight, footerRight);
    internals._headerR = headerRight;
    internals._headerRowR = headerRowRight;
    internals._footerRowR = footerRight;
    internals._headers = [internals._headerL, headerRight];
    internals._headerRows = [internals._headerRowL, headerRowRight];
    internals._footerRow = [internals._footerRowL, footerRight];

    expect(() => {
      internals.createColumnHeaders();
      internals.createColumnFooter();
      internals.createColumnHeaders();
      internals.createColumnFooter();
      expect(slickGrid.getHeader()).toEqual(internals._headers);
      expect(slickGrid.getHeader(slickGrid.getColumns()[0])).toBe(internals._headerL);
      expect(slickGrid.getHeader(slickGrid.getColumns()[1])).toBe(internals._headerR);
      expect(slickGrid.getHeaderColumn(1)).toBe(internals._headerR.children[0]);
      expect(slickGrid.getHeaderRowColumn(0)).toBe(internals._headerRowL.children[0]);
      expect(slickGrid.getHeaderRowColumn(1)).toBe(internals._headerRowR.children[0]);
      expect(slickGrid.getFooterRowColumn(0)).toBe(internals._footerRowL.children[0]);
      expect(slickGrid.getFooterRowColumn(1)).toBe(internals._footerRowR.children[0]);
      (slickGrid as any).updateCanvasWidth(true);
      internals.resizeCanvas();
      slickGrid.scrollToX(10);
      internals._viewport = [internals._viewportTopL, internals._viewportTopR, internals._viewportBottomL, internals._viewportBottomR];
      internals._headers = [internals._headerL, internals._headerR];
      internals._headerScroller = [internals._headerScrollerL, internals._headerScrollerR];
      internals._topPanelScrollers = [internals._topPanelScrollerL, internals._topPanelScrollerR];
      internals._footerRowScrollContainer = internals._footerRowScrollerL;
      internals._options.createTopHeaderPanel = true;
      internals._options.createPreHeaderPanel = true;
      internals._options.createFooterRow = true;
      internals._topHeaderPanel = document.createElement('div');
      internals._topHeaderPanelScroller = document.createElement('div');
      internals._preHeaderPanelScroller = document.createElement('div');
      internals._preHeaderPanelScrollerR = document.createElement('div');
      slickGrid.scrollToX(20);
      internals._options.frozenColumn = -1;
      internals.updateCanvasWidth(true);
    }).not.toThrow();
  });

  it('handles vertical scroll synchronization across compatibility frozen panes', () => {
    const slickGrid = createGrid();
    const internals = slickGrid as any;
    internals._options.frozenColumn = 0;
    internals._options.autoHeight = false;
    Object.defineProperties(internals._viewportScrollContainerY, {
      scrollHeight: { configurable: true, value: 500 },
      scrollTop: { configurable: true, writable: true, value: 20 },
      clientHeight: { configurable: true, value: 100 },
    });
    Object.defineProperties(internals._viewportScrollContainerX, {
      scrollWidth: { configurable: true, value: 500 },
      scrollLeft: { configurable: true, writable: true, value: 20 },
      clientWidth: { configurable: true, value: 100 },
    });
    internals.scrollTop = 20;
    internals.scrollLeft = 20;
    internals.prevScrollTop = 0;
    internals.prevScrollLeft = 0;
    internals.lastRenderedScrollTop = -100;
    internals.lastRenderedScrollLeft = -100;
    internals.viewportH = 100;
    internals.viewportW = 100;
    internals.hasFrozenRows = true;
    internals._options.frozenBottom = false;
    vi.spyOn(slickGrid as any, 'scrollTo').mockImplementation(() => undefined);
    vi.spyOn(slickGrid as any, 'scrollToX').mockImplementation(() => undefined);
    vi.spyOn(slickGrid as any, 'refreshDockingLayout')
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    vi.spyOn(slickGrid as any, 'applyDockingScrollOffsets').mockImplementation(() => undefined);
    vi.spyOn(slickGrid as any, 'refreshRowDockingLayout').mockReturnValue(false);
    vi.spyOn(slickGrid as any, 'updateColumnCaches').mockImplementation(() => undefined);
    vi.spyOn(slickGrid as any, 'applyColumnWidths').mockImplementation(() => undefined);
    vi.spyOn(slickGrid as any, 'applyDockingToColumnChrome').mockImplementation(() => undefined);
    vi.spyOn(slickGrid as any, 'invalidateAllRows').mockImplementation(() => undefined);
    vi.spyOn(slickGrid, 'render').mockImplementation(() => undefined);
    const enqueueStickyColumnLayoutSpy = vi.spyOn(slickGrid as any, 'enqueueStickyColumnLayout').mockImplementation(() => undefined);

    vi.useFakeTimers();
    try {
      expect((slickGrid as any)._handleScroll('mousewheel')).toBe(true);
      expect(internals._viewportBottomL.scrollTop).toBe(20);

      internals.hasFrozenRows = false;
      internals.prevScrollTop = 20;
      internals.scrollTop = 30;
      Object.defineProperty(internals._viewportScrollContainerY, 'scrollTop', { configurable: true, writable: true, value: 30 });
      expect((slickGrid as any)._handleScroll('mousewheel')).toBe(true);
      expect(internals._viewportTopL.scrollTop).toBe(30);

      slickGrid.getColumns()[0].sticky = 'left';
      internals.prevScrollLeft = 30;
      internals.scrollLeft = 40;
      Object.defineProperty(internals._viewportScrollContainerX, 'scrollLeft', { configurable: true, writable: true, value: 40 });
      expect((slickGrid as any)._handleScroll('scroll')).toBe(true);
      expect(enqueueStickyColumnLayoutSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('updates rendered docking rows and chrome when using native horizontal scrolling', () => {
    const slickGrid = createGrid({
      createFooterRow: true,
      pinning: { columns: { left: ['a'], right: ['d'] } },
      showFooterRow: true,
      showHeaderRow: true,
    });
    const internals = slickGrid as any;
    internals._dockingHorizontalScroller = undefined;
    internals.viewportHasVScroll = true;
    internals.scrollbarDimensions = { width: 15, height: 15 };
    container.querySelectorAll<HTMLElement>('.slick-headerrow-column, .slick-footerrow-column').forEach((element) => {
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ width: 80 } as DOMRect);
    });
    internals.applyDockingToColumnChrome();
    internals._options.rtl = true;
    internals.applyDockingToColumnChrome();
    internals._options.rtl = false;
    Object.defineProperty(internals._viewportScrollContainerX, 'clientWidth', { configurable: true, value: 200 });
    internals.viewportW = 200;
    internals.scrollLeft = 15;

    const row = document.createElement('div');
    row.className = 'slick-row slick-row-docked';
    row.dataset.row = '0';
    const leftRegion = document.createElement('div');
    leftRegion.className = 'slick-pinned-left-cells';
    const centerRegion = document.createElement('div');
    centerRegion.className = 'slick-scrolling-cells';
    const rightRegion = document.createElement('div');
    rightRegion.className = 'slick-pinned-right-cells';
    const leftCell = document.createElement('div');
    const centerCell = document.createElement('div');
    const rightCell = document.createElement('div');
    centerRegion.appendChild(leftCell);
    rightRegion.appendChild(centerCell);
    row.append(leftRegion, centerRegion, rightRegion, rightCell);
    container.appendChild(row);

    internals.dockingLayout = {
      left: [{ band: 'left', index: 0, naturalOffset: 0, offset: 0, sticky: false, width: 80 }],
      center: [],
      right: [{ band: 'right', index: 3, naturalOffset: 240, offset: 0, sticky: false, width: 80 }],
      contentWidth: 320,
      leftBaseWidth: 80,
      leftWidth: 80,
      rightWidth: 80,
      revision: 1,
    };
    internals.dockingByColumn = new Map([
      [0, { band: 'left', index: 0, naturalOffset: 0, offset: 0, sticky: false, width: 80 }],
      [3, { band: 'right', index: 3, naturalOffset: 240, offset: 0, sticky: false, width: 80 }],
    ]);
    internals.rowsCache = {
      0: {
        rowNode: [row],
        cellNodesByColumnIdx: { 0: leftCell, 1: centerCell, 3: rightCell },
        cellRegions: { left: leftRegion, center: centerRegion, right: rightRegion },
      },
    };
    vi.spyOn(slickGrid as any, 'ensureCellNodesInRowsCache').mockImplementation(() => undefined);

    internals.applyDockingDimensionsToRows();
    expect(row.style.gridTemplateColumns).toBe('80px 160px 80px');
    expect(leftRegion.classList.contains('slick-pinned-left-cells-active')).toBe(true);
    expect(rightRegion.classList.contains('slick-pinned-right-cells-active')).toBe(true);

    internals._dockingHorizontalScroller = document.createElement('div');
    internals.applyDockingScrollOffsetToRow(row, internals.rowsCache[0]);
    internals.applyDockingChromeScrollOffsets();
    internals._dockingHorizontalScroller = undefined;

    expect(internals.updateRenderedCellDocking()).toBe(true);
    expect(leftCell.parentElement).toBe(leftRegion);
    expect(rightCell.parentElement).toBe(rightRegion);
    internals.applyDockingScrollOffsets();
    expect(leftRegion.style.transform).toBe('');
    expect(rightRegion.style.transform).toContain('translateX');

    const chrome = document.createElement('div');
    internals.dockingChromeByColumn = new Map([
      [0, [chrome]],
      [3, [chrome]],
    ]);
    internals.applyDockingChromeScrollOffsets();
    expect(chrome.style.transform).toContain('translateX');
  });
});
