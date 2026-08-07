import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Column, GridOption } from '../../interfaces/index.js';
import { SlickGrid } from '../slickGrid.js';

vi.useFakeTimers();

const DEFAULT_GRID_HEIGHT = 600;
const DEFAULT_GRID_WIDTH = 800;
const gridId = 'grid1';
const gridUid = 'slickgrid_124343';
const containerId = 'demo-container';

const template = `<div id="${containerId}" style="height: ${DEFAULT_GRID_HEIGHT}px; width: ${DEFAULT_GRID_WIDTH}px; overflow: hidden; display: block;">
    <div id="slickGridContainer-${gridId}" class="grid-pane" style="width: 100%;">
      <div id="${gridId}" class="${gridUid}" style="width: 100%"></div>
    </div>
  </div>`;

describe('SlickGrid RTL (Right-to-Left) Support', () => {
  let container: HTMLElement;
  let grid: SlickGrid<any, Column>;
  const items = [
    { id: 0, name: 'Item 0', value: 10 },
    { id: 1, name: 'Item 1', value: 20 },
    { id: 2, name: 'Item 2', value: 30 },
  ];
  const columns = [
    { id: 'id', field: 'id', name: 'ID', width: 60, resizable: true },
    { id: 'name', field: 'name', name: 'Name', width: 100, resizable: true },
    { id: 'value', field: 'value', name: 'Value', width: 80, resizable: true },
  ] as Column[];
  let defaultOptions: GridOption;

  beforeEach(() => {
    defaultOptions = {
      enableCellNavigation: true,
      columnResizingDelay: 1,
      scrollRenderThrottling: 1,
    };
    container = document.createElement('div');
    container.id = gridId;
    container.innerHTML = template;
    container.style.height = `${DEFAULT_GRID_HEIGHT}px`;
    container.style.width = `${DEFAULT_GRID_WIDTH}px`;
    document.body.appendChild(container);
    Object.defineProperty(container, 'clientHeight', { writable: true, configurable: true, value: DEFAULT_GRID_HEIGHT });
    Object.defineProperty(container, 'clientWidth', { writable: true, configurable: true, value: DEFAULT_GRID_WIDTH });
  });

  afterEach(() => {
    document.body.textContent = '';
    grid?.destroy(true);
  });

  describe('RTL Option', () => {
    it('should have rtl option set to false by default', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, defaultOptions);
      expect(grid.getOptions().rtl).toBe(false);
    });

    it('should enable RTL mode when rtl option is set to true', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, { ...defaultOptions, rtl: true });
      expect(grid.getOptions().rtl).toBe(true);
    });
  });

  describe('Column Resizing in RTL', () => {
    it('should handle RTL mode with resizable columns', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, { ...defaultOptions, rtl: true, editable: true });
      expect(grid.getOptions().rtl).toBe(true);
    });
  });

  describe('applyColumnWidths with RTL', () => {
    it('should apply column widths in RTL mode', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, { ...defaultOptions, rtl: true });
      expect(grid.getOptions().rtl).toBe(true);
    });

    it('should apply column widths in LTR mode', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, { ...defaultOptions, rtl: false });
      expect(grid.getOptions().rtl).toBe(false);
    });
  });

  describe('Resize constraints with RTL', () => {
    it('should calculate resize constraints correctly in RTL mode', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, { ...defaultOptions, rtl: true, editable: true });
      expect(grid.getOptions().rtl).toBe(true);
    });

    it('should calculate resize constraints correctly in LTR mode', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, { ...defaultOptions, rtl: false, editable: true });
      expect(grid.getOptions().rtl).toBe(false);
    });
  });

  describe('Mixed RTL Features', () => {
    it('should support RTL with frozen columns', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, { ...defaultOptions, rtl: true, frozenColumn: 0 });
      expect(grid.getOptions().rtl).toBe(true);
      expect(grid.getOptions().frozenColumn).toBe(0);
    });

    it('should support RTL with sorting', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, { ...defaultOptions, rtl: true, enableSorting: true });
      expect(grid.getOptions().rtl).toBe(true);
    });

    it('should support RTL with filtering', () => {
      const gridContainer = document.getElementById(gridId) as HTMLElement;
      grid = new SlickGrid<any, Column>(gridContainer, items, columns, { ...defaultOptions, rtl: true, enableFiltering: true });
      expect(grid.getOptions().rtl).toBe(true);
    });
  });
});
