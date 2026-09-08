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
    grid = new SlickGrid(
      container,
      data,
      columns.map((column) => ({ ...column })),
      {
        enableCellNavigation: true,
        devMode: { ownerNodeIndex: 0 },
        ...options,
      }
    );
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
    expect(slickGrid.getRowFromNode(document.createElement('div'))).toBeNull();

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
});
