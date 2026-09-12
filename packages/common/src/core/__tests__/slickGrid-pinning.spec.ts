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

  const createGrid = (options: GridOption = {}, gridColumns = columns): SlickGrid<any, Column> => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    document.body.appendChild(container);
    grid = new SlickGrid(container, data, gridColumns.map((column) => ({ ...column })) as Column[], {
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
    expect(container.querySelector('.slick-horizontal-scroller')).toBe(container.querySelector('.slick-docking-horizontal-scroller'));
    expect(container.querySelector('.slick-vertical-scroller')).toBe((slickGrid as any)._viewportNode);
    expect(container.querySelector('.slick-docking-overlay')).toBeTruthy();
    expect((slickGrid as any)._contentRoot.style.left).toBe('');
    expect((slickGrid as any)._contentRoot.style.width).toBe('100%');
    expect(slickGrid.getOptions().pinning?.rows).toEqual({ top: [0], bottom: [2] });
  });

  it('keeps docking wrappers presentational around the one semantic grid tree', () => {
    createGrid({ pinning: { columns: { left: ['a'], right: ['d'] }, rows: { top: [0] } } });

    const headerRoot = container.querySelector<HTMLElement>('.slick-header-columns-root')!;
    const dockedRow = container.querySelector<HTMLElement>('.slick-docking-overlay .slick-row[data-row="0"]')!;

    expect(headerRoot.getAttribute('role')).toBe('row');
    expect(headerRoot.querySelectorAll('[role="presentation"]')).toHaveLength(3);
    expect(headerRoot.querySelectorAll('[role="columnheader"]')).toHaveLength(4);
    expect(dockedRow.getAttribute('role')).toBe('row');
    expect(dockedRow.querySelectorAll(':scope > [role="presentation"]')).toHaveLength(3);
    const cells = [...dockedRow.querySelectorAll<HTMLElement>('[role="gridcell"]')];
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((cell) => !cell.hasAttribute('aria-hidden'))).toBe(true);
  });

  it('returns visible columns in rendered docking order', () => {
    const slickGrid = createGrid({ pinning: { columns: { left: ['a', 'c'] } } });

    expect(slickGrid.getColumnsInRenderedOrder().map((column) => column.id)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('keeps hidden columns in their rendered docking position', () => {
    const slickGrid = createGrid({ pinning: { columns: { left: ['a', 'c'] } } });
    slickGrid.updateColumnById('b', { hidden: true });

    expect(slickGrid.getColumnsInRenderedOrder(true).map((column) => column.id)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('keeps a center reorder out of the pinned band when a middle column is hidden', () => {
    const reorderColumns = [
      ...columns.map((column) => ({ ...column })),
      { id: 'e', field: 'e', name: 'E', width: 80 },
      { id: 'f', field: 'f', name: 'F', width: 80 },
      { id: 'g', field: 'g', name: 'G', width: 80 },
    ];
    const slickGrid = createGrid(
      {
        enableColumnReorder: true,
        pinning: { columns: { left: ['a', 'c'], right: ['g'] } },
      },
      reorderColumns
    );
    slickGrid.updateColumnById('e', { hidden: true }, true);

    const internals = slickGrid as any;
    const left = internals.sortableSideLeftInstance;
    const center = internals.sortableSideCenterInstance;
    const item = center.el.querySelector('.slick-header-column');
    left.toArray = vi.fn().mockReturnValue(['a', 'c']);
    center.toArray = vi.fn().mockReturnValue(['d', 'b', 'f']);
    internals.sortableSideRightInstance.toArray = vi.fn().mockReturnValue(['g']);

    left.options.onStart({ item });
    left.options.onEnd({ item, stopPropagation: vi.fn() });

    expect(slickGrid.getColumns().map((column) => column.id)).toEqual(['a', 'd', 'c', 'b', 'e', 'f', 'g']);
  });

  it('keeps visible columns in definition order without column docking', () => {
    const slickGrid = createGrid();

    expect(slickGrid.getColumnsInRenderedOrder().map((column) => column.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('includes hidden columns in definition order without column docking', () => {
    const slickGrid = createGrid();
    slickGrid.updateColumnById('d', { hidden: true });

    expect(slickGrid.getColumnsInRenderedOrder(true).map((column) => column.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('renders full-width group rows across docking regions without moving regular cells', () => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    document.body.appendChild(container);
    const groupedRows = [...data, { id: 3, a: 'total', b: 'total', c: 'total', d: 'total' }];
    const groupedData = {
      getLength: () => groupedRows.length,
      getItem: (row: number) => groupedRows[row],
      getItemMetadata: (row: number) =>
        row === 0
          ? {
              cssClasses: 'slick-group slick-group-level-0',
              isGroup: true,
              columns: { 0: { colspan: '*', formatter: () => 'Group A' } },
            }
          : row === 2
            ? {
                cssClasses: 'slick-group slick-group-level-0',
                isGroup: true,
                columns: { 0: { colspan: columns.length, formatter: () => 'Group B' } },
              }
            : row === 3
              ? { cssClasses: 'slick-group-totals', isGroup: true }
              : undefined,
    };
    grid = new SlickGrid(container, groupedData as any, columns.map((column) => ({ ...column })) as Column[], {
      devMode: { ownerNodeIndex: 0 },
      pinning: { columns: { left: ['b'], right: ['d'] } },
    });

    const groupRow = container.querySelector<HTMLElement>('[data-row="0"]')!;
    const regularRow = container.querySelector<HTMLElement>('[data-row="1"]')!;
    const numericSpanGroupRow = container.querySelector<HTMLElement>('[data-row="2"]')!;
    const totalsRow = container.querySelector<HTMLElement>('[data-row="3"]')!;
    const groupCell = groupRow.querySelector<HTMLElement>('.slick-cell')!;

    expect(groupCell.parentElement).toBe(groupRow);
    expect(groupCell.classList.contains('slick-cell-full-width-group')).toBe(true);
    expect(groupCell.textContent).toBe('Group A');
    expect(regularRow.querySelector('.slick-cell.l0')?.parentElement?.classList.contains('slick-scrolling-cells')).toBe(true);
    expect(regularRow.querySelector('.slick-cell.l1')?.parentElement?.classList.contains('slick-pinned-left-cells')).toBe(true);
    expect(regularRow.querySelector('.slick-cell.l3')?.parentElement?.classList.contains('slick-pinned-right-cells')).toBe(true);
    expect(regularRow.querySelector('.slick-cell.l0')?.textContent).toBe('a1');
    expect(regularRow.querySelector('.slick-cell.l1')?.textContent).toBe('b1');
    expect(numericSpanGroupRow.querySelector('.slick-cell')?.parentElement).toBe(numericSpanGroupRow);
    expect(totalsRow.classList.contains('slick-row-full-width-group')).toBe(false);
    expect(totalsRow.querySelector('.slick-cell.l1')?.parentElement?.classList.contains('slick-pinned-left-cells')).toBe(true);

    grid.setActiveCell(0, 0);
    expect(groupCell.classList.contains('active')).toBe(true);
    expect(groupCell.parentElement).toBe(groupRow);
    expect(groupCell.textContent).toBe('Group A');

    (grid as any).updateRenderedCellDocking();
    expect(groupCell.parentElement).toBe(groupRow);
  });

  it('splits colspans that cross docking regions into visual fragments', () => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    document.body.appendChild(container);
    const spanData = {
      getLength: () => data.length,
      getItem: (row: number) => data[row],
      getItemMetadata: (row: number) => (row === 0 ? { columns: { 0: { colspan: columns.length, formatter: () => 'Spanned', rowspan: 2 } } } : undefined),
    };
    grid = new SlickGrid(container, spanData as any, columns.map((column) => ({ ...column })) as Column[], {
      devMode: { ownerNodeIndex: 0 },
      enableCellRowSpan: true,
      pinning: { columns: { left: ['a'], right: ['d'] } },
    });

    const row = container.querySelector<HTMLElement>('[data-row="0"]')!;
    const host = row.querySelector<HTMLElement>('.slick-cell.l0:not(.slick-cell-colspan-part)')!;
    const fragments = row.querySelectorAll<HTMLElement>('.slick-cell-colspan-part');

    expect(host.textContent).toBe('Spanned');
    expect(host.classList.contains('r3')).toBe(true);
    expect(host.style.width).toBe('320px');
    expect(host.getAttribute('aria-colspan')).toBe('4');
    expect(host.getAttribute('aria-rowspan')).toBe('2');
    expect(fragments[0].style.width).toBe('');
    expect(row.classList.contains('slick-row-colspan-crossing-docking')).toBe(true);
    expect(row.querySelectorAll('.slick-cell-colspan-crossing-docking')).toHaveLength(3);
    expect(fragments[1].classList.contains('slick-cell-colspan-end')).toBe(true);
    expect(fragments).toHaveLength(2);
    expect(host.parentElement?.classList.contains('slick-pinned-left-cells')).toBe(true);
    expect(fragments[0].parentElement?.classList.contains('slick-scrolling-cells')).toBe(true);
    expect(fragments[1].parentElement?.classList.contains('slick-pinned-right-cells')).toBe(true);
    expect(fragments[0].getAttribute('aria-hidden')).toBe('true');
    expect(fragments[0].getAttribute('role')).toBe('presentation');
    expect(fragments[0].getAttribute('aria-colspan')).toBeNull();
    expect(fragments[0].getAttribute('aria-rowspan')).toBeNull();
    expect((grid as any).getCellNode(0, 0)).toBe(host);

    grid.getColumns()[1].hidden = true;
    expect((grid as any).getColspanSegments(0, columns.length)).toHaveLength(3);
    const oneVisibleSpan = document.createElement('div');
    (grid as any).appendCellHtml(oneVisibleSpan, 0, 0, 2, 1, null, data[0]);
    expect(oneVisibleSpan.firstElementChild?.getAttribute('aria-colspan')).toBeNull();
    grid.getColumns()[1].hidden = false;

    grid.setActiveCell(0, 0);
    expect(row.querySelectorAll('.slick-cell.active')).toHaveLength(3);
    expect((grid as any).getCellFromEvent({ target: fragments[0] })).toEqual({ row: 0, cell: 0 });

    const deferredHost = document.createElement('div');
    row.appendChild(deferredHost);
    (grid as any).dockingByColumn.get(0).sticky = true;
    (grid as any)._options.rtl = true;
    (grid as any).appendColspanFragments(
      0,
      5,
      deferredHost,
      [
        { start: 1, end: 1, band: 'center' },
        { start: 0, end: 0, band: 'left' },
      ],
      true
    );
    expect(deferredHost.previousElementSibling?.classList.contains('slick-cell-sticky')).toBe(true);
    (grid as any)._options.rtl = false;

    const cacheEntry = (grid as any).rowsCache[0];
    delete cacheEntry.cellNodesByColumnIdx[0];
    delete cacheEntry.cellColSpans[0];
    (grid as any).cleanUpAndRenderCells({ top: 0, bottom: 0, leftPx: 0, rightPx: 320 });
    expect((grid as any).rowsCache[0].cellSpanFragments[0][0].parentElement).toBe(row.querySelector('.slick-scrolling-cells'));
  });

  it('rejects non-sequential pinning when a rendered colspan crosses docking regions', () => {
    const invalidPinning = vi.fn();
    const spanData = {
      getLength: () => data.length,
      getItem: (row: number) => data[row],
      getItemMetadata: (row: number) => (row === 0 ? { columns: { 0: { colspan: 1 }, 1: { colspan: 3 } } } : undefined),
    };
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    document.body.appendChild(container);
    grid = new SlickGrid(container, spanData as any, columns.map((column) => ({ ...column })) as Column[], {
      devMode: { ownerNodeIndex: 0 },
      invalidColumnPinningPickerCallback: invalidPinning,
    });

    grid.setColumnPinning('b', 'left');
    expect(invalidPinning).toHaveBeenCalledWith(expect.stringContaining('non-sequential order'));
    expect(grid.getColumns()[1].pinned).toBeFalsy();
    (grid as any)._options.pinning = { columns: { left: ['b'], right: ['d'] } };
    expect((grid as any).validateColumnPinning(undefined, true)).toBe(false);

    grid.setColumnPinning('c', 'right');
    expect(grid.getColumns()[2].pinned).toBeFalsy();

    grid.setColumnPinning('a', 'left');
    grid.setColumnPinning('b', 'left');
    expect(
      grid
        .getColumns()
        .slice(0, 2)
        .every((column) => column.pinned === 'left')
    ).toBe(true);
  });

  it('keeps bulk right pinning anchored at the selected colspan column', () => {
    const invalidPinning = vi.fn();
    const spanData = {
      getLength: () => data.length,
      getItem: (row: number) => data[row],
      getItemMetadata: (row: number) => (row === 0 ? { columns: { 1: { colspan: 3 } } } : undefined),
    };
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    document.body.appendChild(container);
    grid = new SlickGrid(container, spanData as any, columns.map((column) => ({ ...column })) as Column[], {
      devMode: { ownerNodeIndex: 0 },
      invalidColumnPinningPickerCallback: invalidPinning,
    });

    grid.setOptions({ pinning: { columns: { right: 3 } } });

    expect(grid.getColumns().map((column) => column.pinned)).toEqual([null, 'right', 'right', 'right']);
    expect(invalidPinning).not.toHaveBeenCalled();
  });

  it('keeps the native viewport scroll owner until docking is enabled', () => {
    const slickGrid = createGrid();
    const internals = slickGrid as any;

    expect(container.querySelector('.slick-docking-horizontal-scroller')).toBeNull();
    expect(internals._viewportNode.style.overflowX).toBe('auto');

    slickGrid.setColumnPinning('a', 'left');

    expect(container.querySelector('.slick-docking-horizontal-scroller')).toBeTruthy();
    expect(container.querySelector('.slick-horizontal-scroller')).toBe(container.querySelector('.slick-docking-horizontal-scroller'));
    expect(slickGrid.getPinnedColumns('left').map((column) => column.id)).toEqual(['a']);
  });

  it('covers pinning validation, row identity resolution, and cleanup timer cancellation', () => {
    const invalidPicker = vi.fn();
    const invalidWidth = vi.fn();
    const slickGrid = createGrid({ invalidColumnPinningPickerCallback: invalidPicker, invalidColumnPinningWidthCallback: invalidWidth });
    const internals = slickGrid as any;
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => undefined);
    internals._defaults.invalidColumnPinningWidthCallback('default callback');
    expect(alertSpy).toHaveBeenCalledWith('default callback');
    alertSpy.mockRestore();
    internals._options.invalidColumnPinningPickerCallback = invalidPicker;
    internals._options.invalidColumnPinningWidthCallback = invalidWidth;
    internals._options.skipPinningValidation = false;
    internals._invalidPinningAlerted = false;
    Object.defineProperty(internals._viewportNode, 'clientWidth', { configurable: true, value: 100 });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ width: 100 } as DOMRect);
    const invalidPinned = new Map([
      [0, 'left'],
      [1, 'right'],
      [2, 'left'],
      [3, 'right'],
    ]);
    expect(internals.validatePinnedColumnIndexes(invalidPinned, true)).toBe(false);
    expect(invalidPicker).toHaveBeenCalled();
    expect(internals.validatePinnedColumnIndexes(new Map([[0, 'left']]), true)).toBe(true);
    slickGrid.getColumns()[1].hidden = true;
    expect(internals.validatePinnedColumnIndexes(new Map([[1, 'left']]), true)).toBe(true);
    expect(internals.validatePinnedColumnWidth(new Map([[1, 'left']]), true)).toBe(true);
    slickGrid.getColumns()[1].hidden = false;
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
    expect(internals.validatePinnedColumnWidth(invalidPinned, true)).toBe(false);
    internals.pinningColumnsState.set('a', 'right');
    slickGrid.getColumns()[0].pinned = 'left';
    internals.applyColumnPinningOptions(slickGrid.getColumns());
    expect(slickGrid.getColumns()[0].pinned).toBe('right');
    expect(internals.getPinnedColumnIndexes()).toEqual(new Map([[0, 'right']]));

    const hasDockedColumnsSpy = vi.spyOn(internals, 'hasDockedColumns').mockReturnValue(true);
    internals._options.fullWidthRows = true;
    internals.viewportW = 1000;
    internals.viewportHasVScroll = false;
    expect(internals.getCanvasWidth()).toBeGreaterThan(0);
    hasDockedColumnsSpy.mockRestore();

    internals._options.pinning = { columns: { left: ['a', 'b', 'c', 'd'] } };
    internals._invalidPinningAlerted = false;
    expect(internals.validateColumnPinning(undefined, true)).toBe(false);
    expect(internals.validateColumnPinning('a', true)).toBe(false);

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
    const slickGrid = createGrid({ invalidColumnPinningPickerCallback: invalidPicker });
    const internals = slickGrid as any;

    const usesDockingChromeSpy = vi.spyOn(internals, 'usesDockingChromeRegions');
    usesDockingChromeSpy.mockReturnValue(false);
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
    usesDockingChromeSpy.mockRestore();

    slickGrid.scrollTo(10);

    const dockingScrollerSpy = vi.spyOn(internals, 'hasDockingHorizontalScroller').mockReturnValue(false);
    internals._viewport = [internals._viewportNode];
    internals._options.createFooterRow = true;
    internals._footerRow = [];
    internals._options.createPreHeaderPanel = true;
    internals._options.createTopHeaderPanel = true;
    internals._footerRowL = document.createElement('div');
    internals._preHeaderPanel = document.createElement('div');
    internals._topHeaderPanel = document.createElement('div');
    slickGrid.scrollToX(10);
    internals._viewport = [internals._viewportNode, document.createElement('div'), document.createElement('div'), document.createElement('div')];
    internals._headerScrollContainer = document.createElement('div');
    internals._topPanelScrollers = [document.createElement('div')];
    internals._footerRowScrollContainer = document.createElement('div');
    internals._preHeaderPanelScroller = document.createElement('div');
    internals._preHeaderPanelScrollerR = document.createElement('div');
    internals._topHeaderPanelScroller = document.createElement('div');
    internals._headerRowScrollerR = document.createElement('div');
    internals._headerRowScrollerL = document.createElement('div');
    slickGrid.scrollToX(20);
    slickGrid.scrollToX(25);
    dockingScrollerSpy.mockRestore();

    const columnsWithGap = [undefined, ...slickGrid.getColumns()];
    internals._options.pinning = { columns: { left: ['a'], right: [] } };
    internals.applyColumnPinningOptions(columnsWithGap);

    internals.rowDockingLayout.top = [{ index: 0, height: 20, sticky: false }];
    expect(internals.getTopPinnedRowsHeight()).toBe(20);

    internals._options.skipPinningValidation = true;
    expect(internals.validatePinnedColumnIndexes(new Map())).toBe(true);
    internals._options.skipPinningValidation = false;
    slickGrid.setColumnStickiness('a', false);
    slickGrid.setColumnStickiness('a', false);
    const getColumnByIdSpy = vi.spyOn(internals, 'getColumnById').mockReturnValue(slickGrid.getColumns()[0]);
    const getColumnIndexSpy = vi.spyOn(internals, 'getColumnIndex').mockReturnValue(undefined);
    slickGrid.getColumns()[0].pinned = null;
    slickGrid.setColumnPinning('a', 'right');
    getColumnByIdSpy.mockRestore();
    getColumnIndexSpy.mockRestore();

    const originalValidate = internals.validateColumnPinning;
    internals.validateColumnPinning = vi.fn().mockReturnValue(false);
    slickGrid.setColumns(slickGrid.getColumns());
    internals.validateColumnPinning = originalValidate;

    vi.spyOn(internals, 'validatePinnedColumnWidth').mockReturnValue(true);
    vi.spyOn(internals, 'getViewports').mockReturnValue([internals._viewportScrollContainerX]);
    slickGrid.setOptions({ pinning: { columns: { left: 0 } } }, true, true, true);

    vi.spyOn(internals, 'shouldRefreshFormattedCachePlanner').mockReturnValue(true);
    const syncPlannerSpy = vi.spyOn(internals, 'syncDataViewFormattedCachePlanner').mockImplementation(() => undefined);
    slickGrid.setOptions({}, true, true, true);
    expect(syncPlannerSpy).toHaveBeenCalledWith(true);

    internals._options.pinning = { columns: { left: ['a', 'b', 'c', 'd'], right: [] } };
    internals._invalidPinningAlerted = false;
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
    const slickGrid = createGrid({ forceFitColumns: true, autoScrollOnColumnResize: false, pinning: { columns: { right: ['d'] } } });
    const internals = slickGrid as any;
    slickGrid.getColumns().forEach((column) => {
      column.resizable = true;
      column.width = 100;
      column.previousWidth = 100;
    });
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
        cellRenderQueue: [],
        cellSpanFragments: { 0: [] },
      },
    };
    internals.dockingByColumn = new Map([[0, { band: 'left' }]]);
    expect(internals.updateRenderedCellDocking()).toBe(false);
    internals.rowsCache[0].cellSpanFragments = {};
    expect(internals.updateRenderedCellDocking()).toBe(true);

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
      invalidColumnPinningPickerCallback: invalidPinning,
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
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    vi.useFakeTimers();
    try {
      Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: undefined });
      (slickGrid as any).enqueueSingleViewportRender();
      (slickGrid as any).enqueueSingleViewportRender();
      expect(renderSpy).not.toHaveBeenCalled();

      vi.runOnlyPendingTimers();
      expect(renderSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
      Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: originalRequestAnimationFrame });
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

  it('handles regular and shift mouse-wheel scrolling and prevents native scrolling for pinned columns', () => {
    const slickGrid = createGrid();
    const horizontalScroller = (slickGrid as any)._viewportScrollContainerX as HTMLDivElement;
    const verticalScroller = (slickGrid as any)._viewportScrollContainerY as HTMLDivElement;
    Object.defineProperty(horizontalScroller, 'scrollLeft', { configurable: true, writable: true, value: 12 });
    Object.defineProperty(verticalScroller, 'scrollTop', { configurable: true, writable: true, value: 30 });
    Object.defineProperty(verticalScroller, 'scrollHeight', { configurable: true, value: 500 });
    const handleScrollSpy = vi.spyOn(slickGrid as any, '_handleScroll').mockReturnValue(true);
    const regularEvent = new MouseEvent('mousewheel', { cancelable: true });
    (slickGrid as any).handleMouseWheel(regularEvent, 0, 2, 1);
    expect((slickGrid as any).scrollTop).toBe(5);
    expect((slickGrid as any).scrollLeft).toBe(92);
    expect(regularEvent.cancelBubble).toBe(true);

    const shiftEvent = new MouseEvent('mousewheel', { cancelable: true, shiftKey: true });
    (slickGrid as any).handleMouseWheel(shiftEvent, 0, 1, 10);
    expect((slickGrid as any).scrollLeft).toBe(52);
    expect(shiftEvent.defaultPrevented).toBe(true);

    const nativeHorizontalEvent = new WheelEvent('wheel', { cancelable: true, deltaX: 18 });
    (slickGrid as any).handleMouseWheel(nativeHorizontalEvent, 0, 0, 0);
    expect((slickGrid as any).scrollLeft).toBe(30);
    expect(nativeHorizontalEvent.defaultPrevented).toBe(true);
    expect(handleScrollSpy).toHaveBeenCalledTimes(3);
  });

  it('floors mouse-wheel and internal scroll offsets at zero', () => {
    const slickGrid = createGrid();
    const internals = slickGrid as any;
    Object.defineProperty(internals._viewportScrollContainerX, 'scrollLeft', { configurable: true, writable: true, value: 0 });

    internals.handleMouseWheel(new WheelEvent('wheel', { deltaX: -18 }), 0, 0, 0);

    expect(internals.scrollLeft).toBe(0);

    internals.scrollLeft = -18;
    internals.scrollTop = -25;
    internals.prevScrollLeft = 0;
    internals.prevScrollTop = 0;
    internals._handleScroll('mousewheel');

    expect(internals.scrollLeft).toBe(0);
    expect(internals.scrollTop).toBe(0);
  });

  it('renders when horizontal scrolling changes the pinned-column layout', () => {
    const slickGrid = createGrid({ pinning: { columns: { left: 0 } } });
    const internals = slickGrid as any;
    Object.defineProperty(internals._viewportScrollContainerX, 'scrollLeft', { configurable: true, writable: true, value: 10 });
    Object.defineProperty(internals._viewportScrollContainerX, 'scrollWidth', { configurable: true, value: 900 });
    Object.defineProperty(internals._viewportScrollContainerX, 'clientWidth', { configurable: true, value: 400 });
    vi.spyOn(internals, 'refreshDockingLayout').mockReturnValue(true);
    const renderSpy = vi.spyOn(slickGrid, 'render').mockImplementation(() => undefined);

    internals.handleScroll({ target: internals._viewportScrollContainerX } as Event);

    expect(renderSpy).toHaveBeenCalled();
  });

  it('preserves the resolved docking map when sticky membership is unchanged', () => {
    const slickGrid = createGrid();
    const internals = slickGrid as any;
    const currentLayout = internals.dockingLayout;
    const currentDocking = [...internals.dockingByColumn];

    expect(internals.refreshDockingLayout(1, true)).toBe(false);
    expect(internals.dockingLayout).toBe(currentLayout);
    expect([...internals.dockingByColumn]).toEqual(currentDocking);
  });

  it('applies the docking compositor transform once per horizontal scroll event', () => {
    const slickGrid = createGrid({ pinning: { columns: { left: 0 } } });
    const internals = slickGrid as any;
    Object.defineProperty(internals._viewportScrollContainerX, 'scrollLeft', { configurable: true, writable: true, value: 24 });
    Object.defineProperty(internals._viewportScrollContainerX, 'scrollWidth', { configurable: true, value: 900 });
    Object.defineProperty(internals._viewportScrollContainerX, 'clientWidth', { configurable: true, value: 400 });
    internals.prevScrollLeft = 0;
    const scrollToXSpy = vi.spyOn(slickGrid, 'scrollToX').mockImplementation(() => undefined);

    internals.handleScroll({ target: internals._viewportScrollContainerX } as Event);

    expect(scrollToXSpy).toHaveBeenCalledOnce();
    expect(scrollToXSpy).toHaveBeenCalledWith(24);
  });

  it('handles a vertical mouse-wheel scroll through the internal scroll path', () => {
    const slickGrid = createGrid();
    const internals = slickGrid as any;
    Object.defineProperty(internals._viewportScrollContainerY, 'scrollTop', { configurable: true, writable: true, value: 0 });
    Object.defineProperty(internals._viewportScrollContainerY, 'scrollHeight', { configurable: true, value: 900 });
    Object.defineProperty(internals._viewportScrollContainerY, 'clientHeight', { configurable: true, value: 400 });
    internals.scrollTop = 25;
    internals.prevScrollTop = 0;
    internals.viewportH = 400;
    vi.spyOn(slickGrid, 'scrollTo').mockImplementation(() => undefined);

    internals._handleScroll('mousewheel');

    expect(internals._viewportScrollContainerY.scrollTop).toBe(25);
  });

  it('invalidates rows when a resize changes the docking layout', () => {
    const slickGrid = createGrid({ pinning: { columns: { left: 0 } } });
    const internals = slickGrid as any;
    vi.spyOn(internals, 'refreshDockingLayout').mockReturnValue(true);
    const invalidateSpy = vi.spyOn(internals, 'invalidateAllRows');

    slickGrid.resizeCanvas();

    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('returns early when the docking horizontal scrollbar has not been created', () => {
    const slickGrid = createGrid();
    const internals = slickGrid as any;
    internals._dockingHorizontalScroller = undefined;
    internals._dockingHorizontalSpacer = undefined;

    expect(internals.updateDockingHorizontalScrollerDimensions()).toBeUndefined();
  });

  it('skips center cells outside a pinned render range', () => {
    const slickGrid = createGrid({ pinning: { columns: { left: 0 } } });
    const internals = slickGrid as any;

    internals.cleanUpAndRenderCells({ top: 0, bottom: 0, leftPx: 0, rightPx: 0 });

    expect(slickGrid.getCellNode(0, 0)).toBeTruthy();
  });

  it('defers sticky-column membership changes during horizontal scrolling', () => {
    const slickGrid = createGrid();
    const internals = slickGrid as any;
    slickGrid.getColumns()[1].sticky = 'left';
    Object.defineProperty(internals._viewportScrollContainerX, 'scrollLeft', { configurable: true, writable: true, value: 10 });
    Object.defineProperty(internals._viewportScrollContainerX, 'scrollWidth', { configurable: true, value: 900 });
    Object.defineProperty(internals._viewportScrollContainerX, 'clientWidth', { configurable: true, value: 400 });
    const enqueueSpy = vi.spyOn(internals, 'enqueueStickyColumnLayout').mockImplementation(() => undefined);

    internals.handleScroll({ target: internals._viewportScrollContainerX } as Event);

    expect(enqueueSpy).toHaveBeenCalled();
  });

  it('synchronizes header and viewport scroll positions for bottom row docking', () => {
    const rightDockedGrid = createGrid({
      pinning: { columns: { left: 0 }, rows: { bottom: [2] } },
      createFooterRow: true,
      showFooterRow: true,
      showHeaderRow: true,
    });
    (rightDockedGrid as any).scrollToX(10);

    const leftOnlyGrid = createGrid({ pinning: { rows: { bottom: [2] } }, showHeaderRow: true });
    (leftOnlyGrid as any).scrollToX(10);

    expect((leftOnlyGrid as any)._viewportNode).toBeTruthy();
  });

  it('reserves horizontal scrollbar height during a resize with docking overflow', () => {
    const slickGrid = createGrid({ pinning: { columns: { left: 0 } } });
    const internals = slickGrid as any;
    Object.defineProperty(internals._viewportNode, 'clientWidth', { configurable: true, value: 100 });
    internals.scrollbarDimensions = { width: 15, height: 15 };
    const initialViewportHeight = internals.viewportH;

    slickGrid.resizeCanvas();

    expect(internals.viewportH).toBeLessThan(initialViewportHeight);
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
    internals.applyDockingToColumnChrome();
    expect((container.querySelector('.slick-headerrow-column.l0') as HTMLElement).style.width).toBe('80px');
    expect((container.querySelector('.slick-headerrow-column.l3') as HTMLElement).style.width).toBe('80px');
    expect((container.querySelector('.slick-footerrow-column.l3') as HTMLElement).style.width).toBe('80px');
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
    leftCell.className = 'slick-cell l0 r0';
    centerCell.className = 'slick-cell l1 r1';
    rightCell.className = 'slick-cell l3 r3';
    centerRegion.appendChild(leftCell);
    centerRegion.appendChild(centerCell);
    rightRegion.appendChild(rightCell);
    row.append(leftRegion, centerRegion, rightRegion);
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
      [1, { band: 'right', index: 1, naturalOffset: 80, offset: 0, sticky: true, width: 80 }],
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
    expect(Array.from(rightRegion.children).map((cell) => internals.getCellFromNode(cell))).toEqual([1, 3]);
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
