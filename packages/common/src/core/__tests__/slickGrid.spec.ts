import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement } from '@slickgrid-universal/utils';

import { AutocompleterEditor, CheckboxEditor, InputEditor, LongTextEditor } from '../../editors/index.js';
import { SlickCellSelectionModel, SlickRowSelectionModel } from '../../extensions/index.js';
import type { Column, Editor, FormatterResultWithHtml, FormatterResultWithText, GridOption, EditCommand, CustomDataView } from '../../interfaces/index.js';
import { SlickEventData, SlickGlobalEditorLock } from '../slickCore.js';
import { SlickDataView } from '../slickDataview.js';
import { SlickGrid } from '../slickGrid.js';

vi.mock('../../formatters/formatterUtilities.js');
vi.useFakeTimers();

import { copyCellToClipboard } from '../../formatters/formatterUtilities.js';

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

const DEFAULT_COLUMN_HEIGHT = 25;
const DEFAULT_COLUMN_WIDTH = 80;
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

describe('SlickGrid core file', () => {
  let container: HTMLElement;
  let grid: SlickGrid;
  let defaultOptions: GridOption;
  let skipGridDestroy = false;

  beforeEach(() => {
    defaultOptions = {
      enableCellNavigation: true,
      columnResizingDelay: 1,
      scrollRenderThrottling: 1,
      asyncEditorLoadDelay: 1,
      asyncPostRenderDelay: 1,
      asyncPostRenderCleanupDelay: 2,
      devMode: { ownerNodeIndex: 0 },
    };
    container = document.createElement('div');
    container.id = 'myGrid';
    container.innerHTML = template;
    container.style.height = `${DEFAULT_GRID_HEIGHT}px`;
    container.style.width = `${DEFAULT_GRID_WIDTH}px`;
    document.body.appendChild(container);
    Object.defineProperty(container, 'height', { writable: true, configurable: true, value: DEFAULT_GRID_HEIGHT });
    Object.defineProperty(container, 'clientHeight', { writable: true, configurable: true, value: DEFAULT_GRID_HEIGHT });
    Object.defineProperty(container, 'clientWidth', { writable: true, configurable: true, value: DEFAULT_GRID_WIDTH });
  });

  afterEach(() => {
    document.body.textContent = '';
    if (!skipGridDestroy) {
      grid?.destroy(true);
    }
    skipGridDestroy = false;
  });

  it('should be able to instantiate SlickGrid without DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual([]);
    expect(grid.getCanvases()).toBeTruthy();
    expect(grid.getCanvasNode()).toBeTruthy();
    expect(grid.getActiveCanvasNode()).toBeTruthy();
    expect(grid.getContainerNode()).toEqual(container);
    expect(grid.getGridPosition()).toBeTruthy();
  });

  it('should be able to instantiate SlickGrid without DataView and always show vertical scroll', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, { ...defaultOptions, alwaysShowVerticalScroll: true });
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual([]);
    expect(grid.getCanvases()).toBeTruthy();
    expect(grid.getCanvasNode()).toBeTruthy();
    expect(grid.getActiveCanvasNode()).toBeTruthy();
    expect(grid.getContainerNode()).toEqual(container);
    expect(grid.getGridPosition()).toBeTruthy();
  });

  it('should be able to instantiate SlickGrid with an external PubSub Service', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions, pubSubServiceStub);
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual([]);
    expect(grid.getPubSubService()).toEqual(pubSubServiceStub);
  });

  it('should display a console warning when body zoom level is different than 100%', () => {
    const consoleWarnSpy = vi.spyOn(global.console, 'warn').mockReturnValue();

    document.body.style.zoom = '90%';
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions, pubSubServiceStub);
    grid.init();

    expect(grid).toBeTruthy();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[Slickgrid] Zoom level other than 100% is not supported'));
  });

  it('should not display a console warning when body zoom level is 100%', () => {
    const consoleWarnSpy = vi.spyOn(global.console, 'warn').mockReturnValue();

    document.body.style.zoom = '100%';
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions, pubSubServiceStub);
    grid.init();

    expect(grid).toBeTruthy();
    expect(consoleWarnSpy).not.toHaveBeenCalledWith('[Slickgrid] Zoom level other than 100% is not supported');
  });

  it('should not display a console warning when body zoom is not defined', () => {
    const consoleWarnSpy = vi.spyOn(global.console, 'warn').mockReturnValue();

    document.body.style.zoom = '';
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions, pubSubServiceStub);
    grid.init();

    expect(grid).toBeTruthy();
    expect(consoleWarnSpy).not.toHaveBeenCalledWith('[Slickgrid] Zoom level other than 100% is not supported');
  });

  it('should display a console warning when Row Detail is enabled with `rowTopOffsetRenderType` is set to "transfrom"', () => {
    const consoleWarnSpy = vi.spyOn(global.console, 'warn').mockReturnValue();

    document.body.style.zoom = '90%';
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>(
      '#myGrid',
      [],
      columns,
      { ...defaultOptions, rowTopOffsetRenderType: 'transform', enableRowDetailView: true },
      pubSubServiceStub
    );
    grid.init();

    expect(grid).toBeTruthy();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Slickgrid-Universal] `rowTopOffsetRenderType` should be set to "top" when using either RowDetail and/or RowSpan')
    );
  });

  it('should display a console warning when RowSpan is enabled with `rowTopOffsetRenderType` is set to "transfrom"', () => {
    const consoleWarnSpy = vi.spyOn(global.console, 'warn').mockReturnValue();

    document.body.style.zoom = '90%';
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>(
      '#myGrid',
      [],
      columns,
      { ...defaultOptions, rowTopOffsetRenderType: 'transform', enableCellRowSpan: true },
      pubSubServiceStub
    );
    grid.init();

    expect(grid).toBeTruthy();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Slickgrid-Universal] `rowTopOffsetRenderType` should be set to "top" when using either RowDetail and/or RowSpan')
    );
  });

  it('should be able to instantiate SlickGrid and get columns', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name', headerCssClass: 'header-class', headerCellAttrs: { 'some-attr': 3 } },
    ] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(grid).toBeTruthy();
    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].classList.contains('header-class')).toBeTruthy();
    expect(colHeaderElms[0].getAttribute('some-attr')).toBe('3');
    expect(grid.getOptions().addNewRowCssClass).toBe('new-class');
    expect(grid.getData()).toEqual([]);
    expect(grid.getColumns()).toEqual(columns);
    expect(grid.getColumnIndex('firstName')).toBe(0);
    expect(grid.getColumnByIndex(0)).toEqual(container.querySelector('div.slick-header-column[data-id="firstName"]'));

    const columnsMock = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'age', field: 'age', name: 'Age' },
    ] as Column[];
    grid.setColumns(columnsMock);

    expect(grid.getColumns()).toEqual(columnsMock);
    expect(grid.getColumnIndex('age')).toBe(2);
    expect(grid.getColumnIndex('invalid')).toBeUndefined();
    expect(grid.getColumnByIndex(-1)).toEqual(undefined);
    expect(grid.getColumnByIndex(99)).toEqual(undefined);
  });

  it('should be able to instantiate SlickGrid and set headerCssClass and expect it in column header', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', headerCssClass: 'header-class  other-class' }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].classList.contains('header-class')).toBeTruthy();
  });

  it('should be able to instantiate SlickGrid and set headerCellAttrs and expect it in column header', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', headerCellAttrs: { 'some-attr': 3 } }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].getAttribute('some-attr')).toBe('3');
  });

  it('should expect "slick-header-sortable" when column is sortable', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', sortable: true }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, { ...defaultOptions, enableColumnReorder: () => true });
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].classList.contains('slick-header-sortable')).toBeTruthy();
  });

  it('should expect "slick-header-sortable" when column is sortable', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', sortable: true }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].classList.contains('slick-header-sortable')).toBeTruthy();
  });

  it('should be able to instantiate SlickGrid without data and later add data with "setData()"', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual([]);

    const scrollToSpy = vi.spyOn(grid, 'scrollTo');
    grid.setData(
      [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ],
      true
    );

    expect(grid.getDataLength()).toBe(2);
    expect(scrollToSpy).toHaveBeenCalledWith(0);
  });

  it('should be able to instantiate SlickGrid without DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    const dim = grid.getScrollbarDimensions();
    const dim2 = grid.getDisplayedScrollbarDimensions();

    expect(grid).toBeTruthy();
    expect(dim).toEqual({ height: 0, width: 0 });
    expect(dim2).toEqual({ height: 0, width: 0 });
  });

  it('should be able to instantiate SlickGrid and invalidate some rows', () => {
    const columns = [
      {
        id: 'firstName',
        field: 'firstName',
        name: 'First Name',
        alwaysRenderColumn: true,
        cellAttrs: { 'cell-attr': 22 },
        formatter: (r, c, val) => ({
          text: val,
          addClasses: 'text-bold',
          toolTip: 'cell tooltip',
          insertElementAfterTarget: container.querySelector('.slick-header') as HTMLDivElement,
        }),
      },
    ] as Column[];
    const data = [
      { id: 0, firstName: 'John' },
      { id: 1, firstName: 'Jane' },
    ];

    grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
    const invalidSpy = vi.spyOn(grid, 'invalidateAllRows');
    const renderSpy = vi.spyOn(grid, 'render');
    const updateSpy = vi.spyOn(grid, 'updateRowCount');

    grid.setData(data);
    grid.invalidate();
    const cellElms = container.querySelectorAll('.slick-cell.l0.r0');

    expect(cellElms[0].getAttribute('cell-attr')).toBe('22');
    expect(cellElms[0].getAttribute('title')).toBe('cell tooltip');
    expect(cellElms[0].classList.contains('text-bold')).toBeTruthy();
    expect(invalidSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
  });

  it('should be able to disable column reorderable', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', reorderable: false }] as Column[];
    const data = [
      { id: 0, firstName: 'John' },
      { id: 1, firstName: 'Jane' },
    ];

    grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);
    const headerElms = container.querySelectorAll('.slick-header-column');

    expect(headerElms[0].classList.contains('unorderable')).toBeTruthy();
  });

  it('should be able to edit when editable grid option is enabled and invalidate some rows', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', editorClass: InputEditor }] as Column[];
    const data = [
      { id: 0, firstName: 'John' },
      { id: 1, firstName: 'Jane' },
    ];

    grid = new SlickGrid<any, Column>('#myGrid', [], columns, {
      ...defaultOptions,
      editable: true,
      enableAsyncPostRenderCleanup: true,
      asyncPostRenderCleanupDelay: 0,
    });
    grid.setData(data);
    grid.setActiveCell(0, 0);
    grid.editActiveCell(InputEditor as any, true);
    expect(grid.getCellEditor()).toBeTruthy();

    const onBeforeSpy = vi.spyOn(grid.onBeforeCellEditorDestroy, 'notify');
    grid.invalidateAllRows();

    expect(onBeforeSpy).toHaveBeenCalled();
  });

  it('should be able to edit when editable grid option is enabled and invalidate all rows', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', editorClass: InputEditor }] as Column[];
    const data = [
      { id: 0, firstName: 'John' },
      { id: 1, firstName: 'Jane' },
    ];

    grid = new SlickGrid<any, Column>('#myGrid', [], columns, { ...defaultOptions, editable: true });
    grid.setData(data);
    grid.setActiveCell(0, 0);
    grid.editActiveCell(InputEditor as any, true);

    const onBeforeSpy = vi.spyOn(grid.onBeforeCellEditorDestroy, 'notify');
    grid.invalidateRows([0, 1]);

    expect(onBeforeSpy).toHaveBeenCalled();
  });

  it('should be add rowspan metadata, invalidate all rowspan and expect cells/rows intersect', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', editorClass: InputEditor }] as Column[];
    const metadata = {
      0: { columns: { 0: { colspan: 2, rowspan: 2 } } },
    };
    const customDV = { getItemMetadata: (row) => metadata[row], getLength: () => 2 } as CustomDataView;
    grid = new SlickGrid<any, Column>('#myGrid', customDV, columns, { ...defaultOptions, editable: true, enableCellRowSpan: true });
    grid.setActiveCell(0, 0);
    grid.editActiveCell(InputEditor as any, true);

    vi.spyOn(grid, 'getRowSpanIntersect').mockReturnValueOnce(1);
    vi.spyOn(grid, 'getDataLength').mockReturnValueOnce(3).mockReturnValueOnce(3);
    vi.spyOn(grid, 'getRowSpanColumnIntersects').mockReturnValueOnce([0, 3]);
    vi.spyOn(grid, 'getParentRowSpanByCell').mockReturnValueOnce({ start: 0, end: 3, range: '0:3' });
    grid.remapAllColumnsRowSpan();
    grid.invalidateRows([0, 1]);

    expect(grid.getRowSpanIntersect(0)).toBe(1);
    expect(grid.getRowSpanColumnIntersects(0)).toEqual([0, 3]);
    expect(grid.canCellBeActive(0, 0)).toBe(true);
    expect(grid.canCellBeActive(1, 0)).toBe(false);

    customDV.getLength = () => 0;
    const resetActiveCellSpy = vi.spyOn(grid, 'resetActiveCell');
    grid.invalidateRow(0);
    grid.updateRowCount();
    expect(resetActiveCellSpy).toHaveBeenCalled();

    grid.invalidateRows([0, 1, 2]);
    grid.render();
    expect(grid.getParentRowSpanByCell(1, 1)).toEqual({ end: 1, range: '0:1', start: 0 });

    const pr = grid.findSpanStartingCell(0, 2);
    grid.setActiveCell(0, 0);
    grid.navigateRowStart();
    expect(pr).toEqual({ cell: 2, row: 0 });
  });

  it('should throw when trying to edit cell when editable grid option is disabled', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const data = [
      { id: 0, firstName: 'John' },
      { id: 1, firstName: 'Jane' },
    ];

    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.setData(data);
    grid.setActiveRow(0, 0);
    grid.setActiveCell(0, 0);
    expect(() => grid.editActiveCell(new InputEditor({ container: document.createElement('div'), column: columns[0], grid } as any, 'text'), true)).toThrow(
      'SlickGrid makeActiveCellEditable : should never get called when grid options.editable is false'
    );
    grid.invalidateRows([0, 1]);
  });

  it('should return void when calling invalidateRows without valid arguments', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const data = [
      { id: 0, firstName: 'John' },
      { id: 1, firstName: 'Jane' },
    ];

    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.setData(data);

    expect(grid.invalidateRows(false as any)).toBeFalsy();
  });

  it('should be able to instantiate SlickGrid with a DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const dv = new SlickDataView({});
    grid = new SlickGrid<any, Column>(container, dv, columns, defaultOptions);
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual(dv);
    expect(dv.getItems()).toEqual([]);
    expect(grid.getUID()).toMatch(/slickgrid_\d*$/);
  });

  it('should be able to add CSS classes to all Viewports', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const gridOptions = { ...defaultOptions, enableCellNavigation: true, viewportClass: 'vp-class1   vp-class2' } as GridOption;
    grid = new SlickGrid<any, Column>(container, [], columns, gridOptions);
    grid.init();
    const vpElms = container.querySelectorAll('.slick-viewport');

    expect(grid).toBeTruthy();
    expect(vpElms.length).toBe(4);
    expect(grid.getViewport()).toBeTruthy();
    expect(grid.getViewports().length).toBe(4);
    expect(grid.getViewportRowCount()).toBe(24);
    expect(vpElms[0].classList.contains('slick-viewport')).toBeTruthy();
    expect(vpElms[0].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[0].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[0].classList.contains('vp-class2')).toBeTruthy();
    expect(vpElms[1].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[2].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[3].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[3].classList.contains('vp-class2')).toBeTruthy();
  });

  it('should be able to set column minWidth', () => {
    const minWidth = 85; // make it greater than default 80 to see it changed
    const columns = [
      {
        id: 'firstName',
        field: 'firstName',
        name: 'First Name',
        minWidth,
        headerCssClass: 'header-class',
        headerCellAttrs: { 'some-attr': 3 },
      },
    ] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.init();

    expect(columns[0].width).toBe(minWidth);
  });

  it('should be able to set column maxWidth', () => {
    const maxWidth = 65; // make it lower than default 80 to see it changed
    const columns = [
      {
        id: 'firstName',
        field: 'firstName',
        name: 'First Name',
        maxWidth,
        headerCssClass: 'header-class',
        headerCellAttrs: { 'some-attr': 3 },
      },
    ] as Column[];
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, defaultOptions);
    grid.init();

    expect(columns[0].width).toBe(maxWidth);
  });

  it('should throw when no container provided', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const dv = new SlickDataView({});
    grid = null as any;

    expect(() => new SlickGrid<any, Column>(null as any, dv, columns, defaultOptions)).toThrow('SlickGrid requires a valid container');
  });

  describe('Row Selections', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const data = [
      { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
      { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
    ];

    describe('setSelectedRows() method', () => {
      it('should throw when calling setSelectedRows() without a selection model', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);

        expect(() => grid.setSelectedRows([0, 1])).toThrow('SlickGrid Selection model is not set');
      });

      it('should call setSelectedRanges() when editor lock isActive() is define and is returning false', () => {
        const rowSelectionModel = new SlickRowSelectionModel();
        const setRangeSpy = vi.spyOn(rowSelectionModel, 'setSelectedRanges');

        grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);
        grid.setSelectionModel(rowSelectionModel);
        vi.spyOn(grid.getEditorLock(), 'isActive').mockReturnValueOnce(false);

        grid.setSelectedRows([1]);
        grid.invalidateRow(0);
        grid.invalidateRow(1);
        grid.render();
        grid.setSelectedRows([0, 1]);
        const firstRowItemCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l0.r0') as HTMLDivElement;
        const secondRowItemCell = container.querySelector('.slick-row:nth-child(2) .slick-cell.l0.r0') as HTMLDivElement;

        expect(setRangeSpy).toHaveBeenCalledWith(
          [
            { fromCell: 0, fromRow: 0, toCell: 0, toRow: 0 },
            { fromCell: 0, fromRow: 1, toCell: 0, toRow: 1 },
          ],
          'SlickGrid.setSelectedRows'
        );
        expect(firstRowItemCell.classList.contains('selected')).toBeTruthy();
        expect(secondRowItemCell.classList.contains('selected')).toBeTruthy();
      });

      it('should not call setSelectedRanges() when editor lock isActive() is define and is returning true', () => {
        const rowSelectionModel = new SlickRowSelectionModel();
        const setRangeSpy = vi.spyOn(rowSelectionModel, 'setSelectedRanges');

        grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);
        grid.setSelectionModel(rowSelectionModel);
        vi.spyOn(grid.getEditorLock(), 'isActive').mockReturnValueOnce(true);

        grid.setSelectedRows([0, 1]);
        grid.render();

        expect(setRangeSpy).not.toHaveBeenCalled();
      });

      it('should not call setSelectedRanges() when editor lock is undefined', () => {
        const rowSelectionModel = new SlickRowSelectionModel();
        const setRangeSpy = vi.spyOn(rowSelectionModel, 'setSelectedRanges');
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, editorLock: undefined });
        grid.setSelectionModel(rowSelectionModel);

        vi.spyOn(grid, 'getEditorLock').mockReturnValue(undefined as any);
        grid.setSelectedRows([0, 1]);
        grid.render();

        expect(grid.getEditorLock()).toBeUndefined();
        expect(setRangeSpy).not.toHaveBeenCalledWith(
          [
            { fromCell: 0, fromRow: 0, toCell: 0, toRow: 0 },
            { fromCell: 0, fromRow: 1, toCell: 0, toRow: 1 },
          ],
          'SlickGrid.setSelectedRows'
        );
      });
    });
  });

  describe('Pre-Header Panel', () => {
    it('should create a preheader panel when enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const gridOptions = {
        ...defaultOptions,
        enableCellNavigation: true,
        preHeaderPanelHeight: 30,
        showPreHeaderPanel: true,
        frozenColumn: 0,
        createPreHeaderPanel: true,
      } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, gridOptions);
      grid.init();
      const preheaderElm = container.querySelector('.slick-preheader-panel');
      const preheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-preheader-panel');

      expect(grid).toBeTruthy();
      expect(preheaderElm).toBeTruthy();
      expect(preheaderElm?.querySelectorAll('div').length).toBe(3);
      expect(preheaderElms[0].style.display).not.toBe('none');
      expect(preheaderElms[1].style.display).not.toBe('none');
      expect(grid.getPreHeaderPanel()).toBeTruthy();
      expect(grid.getPreHeaderPanel()).toEqual(grid.getPreHeaderPanelLeft());
      expect(grid.getPreHeaderPanelRight().outerHTML).toBe('<div></div>');
    });

    it('should throw when frozen column is wider than actual grid width', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const gridOptions = {
        ...defaultOptions,
        enableColumnReorder: false,
        enableCellNavigation: true,
        preHeaderPanelHeight: 30,
        showPreHeaderPanel: true,
        frozenColumn: 0,
        createPreHeaderPanel: true,
        throwWhenFrozenNotAllViewable: true,
      } as GridOption;
      const data = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
      ];
      Object.defineProperty(container, 'clientWidth', { writable: true, value: 40 });
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0, width: 40 } as DOMRect);

      skipGridDestroy = true;
      expect(() => new SlickGrid<any, Column>(container, data, columns, gridOptions)).toThrow(
        '[SlickGrid] Frozen columns cannot be wider than the actual grid container width.'
      );
    });

    it('should hide column headers div when "showPreHeaderPanel" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const gridOptions = {
        ...defaultOptions,
        enableCellNavigation: true,
        preHeaderPanelHeight: 30,
        showPreHeaderPanel: false,
        createPreHeaderPanel: true,
      } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, gridOptions);
      grid.init();
      let preheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-preheader-panel');

      expect(grid).toBeTruthy();
      expect(preheaderElms).toBeTruthy();
      expect(preheaderElms[0].style.display).toBe('none');
      expect(preheaderElms[1].style.display).toBe('none');

      grid.setPreHeaderPanelVisibility(true);
      preheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-preheader-panel');
      expect(preheaderElms[0].style.display).not.toBe('none');
      expect(preheaderElms[1].style.display).not.toBe('none');

      grid.setPreHeaderPanelVisibility(false);
      preheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-preheader-panel');
      expect(preheaderElms[0].style.display).toBe('none');
      expect(preheaderElms[1].style.display).toBe('none');
    });
  });

  describe('Top-Header Panel', () => {
    it('should create a topheader panel when enabled', () => {
      const paneHeight = 25;
      const topHeaderPanelHeight = 30;
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const gridOptions = {
        ...defaultOptions,
        enableCellNavigation: true,
        topHeaderPanelHeight,
        showTopHeaderPanel: true,
        frozenColumn: 0,
        createTopHeaderPanel: true,
      } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, gridOptions);
      grid.init();
      const topheaderElm = container.querySelector('.slick-topheader-panel');
      const topheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-topheader-panel');

      expect(grid).toBeTruthy();
      expect(topheaderElm).toBeTruthy();
      expect(topheaderElm?.querySelectorAll('div').length).toBe(3);
      expect(topheaderElms[0].style.display).not.toBe('none');
      expect(grid.getTopHeaderPanel()).toBeTruthy();
      expect(grid.getTopHeaderPanel()).toEqual(grid.getTopHeaderPanel());

      const paneHeaderLeftElms = container.querySelectorAll<HTMLDivElement>('.slick-pane-header');
      vi.spyOn(paneHeaderLeftElms[0], 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0, height: paneHeight } as DOMRect);
      vi.spyOn(paneHeaderLeftElms[1], 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0, height: paneHeight } as DOMRect);

      // calling resize should add top offset of pane + topHeader
      grid.resizeCanvas();

      const paneTopLeftElm = container.querySelector('.slick-pane-top.slick-pane-left') as HTMLDivElement;

      expect(paneTopLeftElm.style.top).toBe(`${paneHeight + topHeaderPanelHeight}px`);
    });

    it('should hide column headers div when "showTopHeaderPanel" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const gridOptions = {
        ...defaultOptions,
        enableCellNavigation: true,
        topHeaderPanelHeight: 30,
        showTopHeaderPanel: false,
        createTopHeaderPanel: true,
      } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, gridOptions);
      grid.init();
      let topheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-topheader-panel');

      expect(grid).toBeTruthy();
      expect(topheaderElms).toBeTruthy();
      expect(topheaderElms[0].style.display).toBe('none');

      grid.setTopHeaderPanelVisibility(true);
      topheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-topheader-panel');
      expect(topheaderElms[0].style.display).not.toBe('none');

      grid.setTopHeaderPanelVisibility(false);
      topheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-topheader-panel');
      expect(topheaderElms[0].style.display).toBe('none');
    });

    it('should hide column headers div when "showTopHeaderPanel" is disabled and always show vertical scroll', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const gridOptions = {
        ...defaultOptions,
        alwaysShowVerticalScroll: true,
        enableCellNavigation: true,
        topHeaderPanelHeight: 30,
        showTopHeaderPanel: false,
        createTopHeaderPanel: true,
      } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, gridOptions);
      grid.init();
      const topheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-topheader-panel');
      const vpTopLeft = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      const vpTopRight = container.querySelector('.slick-viewport-top.slick-viewport-right') as HTMLDivElement;
      const vpBottomLeft = container.querySelector('.slick-viewport-bottom.slick-viewport-left') as HTMLDivElement;
      const vpBottomRight = container.querySelector('.slick-viewport-bottom.slick-viewport-right') as HTMLDivElement;

      expect(grid).toBeTruthy();
      expect(topheaderElms).toBeTruthy();
      expect(topheaderElms[0].style.display).toBe('none');
      expect(vpTopLeft.style.overflowY).toBe('scroll');
      expect(vpTopRight.style.overflowY).toBe('scroll');
      expect(vpBottomLeft.style.overflowY).toBe('scroll');
      expect(vpBottomRight.style.overflowY).toBe('scroll');
    });
  });

  describe('Headers', () => {
    it('should show column headers div by default', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
      grid.init();
      const headerElm = container.querySelector('.slick-header') as HTMLDivElement;

      expect(grid.getHeaderRow()).toBeTruthy();
      expect(grid.getHeaderRowColumn('firstName')).toBeUndefined();
      expect(grid).toBeTruthy();
      expect(headerElm).toBeTruthy();
      expect(headerElm.style.display).not.toBe('none');
    });

    it('should hide column headers div when "showColumnHeader" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, showColumnHeader: false });
      grid.init();
      let headerElms = container.querySelectorAll<HTMLDivElement>('.slick-header');

      expect(grid).toBeTruthy();
      expect(headerElms).toBeTruthy();
      expect(headerElms[0].style.display).toBe('none');
      expect(headerElms[1].style.display).toBe('none');

      grid.setColumnHeaderVisibility(true);
      headerElms = container.querySelectorAll<HTMLDivElement>('.slick-header');
      expect(headerElms[0].style.display).not.toBe('none');
      expect(headerElms[1].style.display).not.toBe('none');

      grid.setColumnHeaderVisibility(false);
      headerElms = container.querySelectorAll<HTMLDivElement>('.slick-header');
      expect(headerElms[0].style.display).toBe('none');
      expect(headerElms[1].style.display).toBe('none');
    });
  });

  describe('Footer', () => {
    it('should show footer when "showFooterRow" is enabled', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, createFooterRow: true, showFooterRow: true });
      grid.init();
      const headerElm = container.querySelector('.slick-footerrow') as HTMLDivElement;
      const footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');

      expect(headerElm).toBeTruthy();
      expect(headerElm.style.display).not.toBe('none');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn('firstName')).toEqual(footerElms[0].querySelector('.slick-footerrow-column'));
    });

    it('should hide/show column headers div when "showFooterRow" is disabled (with frozenColumn/frozenRow) and expect footer row column exists', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', colspan: 3 },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
      ] as Column[];
      const gridOptions = { ...defaultOptions, createFooterRow: true, showFooterRow: false, frozenColumn: 0, frozenRow: 0 } as GridOption;
      const data = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, gridOptions);
      grid.init();
      let footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      const onBeforeFooterRowCellDestroySpy = vi.spyOn(grid.onBeforeFooterRowCellDestroy, 'notify');

      expect(grid.getFooterRow()).toBeTruthy();
      expect(footerElms).toBeTruthy();
      expect(footerElms[0].style.display).toBe('none');
      expect(footerElms[1].style.display).toBe('none');

      grid.setActiveCell(2, 1);
      grid.setFooterRowVisibility(true);
      grid.updateColumns(); // this will trigger onBeforeFooterRowCellDestroySpy

      vi.spyOn(grid, 'getDataLength').mockReturnValueOnce(-1);
      grid.updateRowCount();

      expect(onBeforeFooterRowCellDestroySpy).toHaveBeenCalledTimes(4); // 2x left and 2x right, because we have 2x columns
      footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn('firstName')).toEqual(footerElms[0].querySelector('.slick-footerrow-column'));
      expect((container.querySelector('.slick-pane.slick-pane-bottom.slick-pane-left') as HTMLDivElement).style.display).not.toBe('none'); // frozenRow: 0
      expect((container.querySelector('.slick-pane.slick-pane-bottom.slick-pane-right') as HTMLDivElement).style.display).not.toBe('none'); // frozenRow: 0
    });

    it('should define colspan and rowspan then expect to cleanup rendered cells when SlickDataView and cell metadata are defined', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', colspan: 2, rowspan: 2 },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
        { id: 'age', field: 'age', name: 'Age' },
        { id: 'gender', field: 'gender', name: 'gender' },
        { id: 'scholarity', field: 'scholarity', name: 'scholarity', colspan: '*' },
        { id: 'bornCity', field: 'bornCity', name: 'bornCity' },
      ] as Column[];
      const gridOptions = { ...defaultOptions, enableCellRowSpan: true, createFooterRow: true, showFooterRow: false, minRowBuffer: 10 } as GridOption;
      const data: any[] = [];
      for (let i = 0; i < 1000; i++) {
        data.push({ id: i, firstName: 'John', lastName: 'Doe', age: 30 });
      }
      const dv = new SlickDataView({});
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, gridOptions);
      vi.spyOn(grid, 'getRowSpanIntersect').mockReturnValueOnce(1); // add a rowspan mandatory row to always render
      grid.init();
      let footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      const onBeforeFooterRowCellDestroySpy = vi.spyOn(grid.onBeforeFooterRowCellDestroy, 'notify');
      vi.spyOn(grid, 'getRenderedRange').mockReturnValue({ leftPx: 200, rightPx: 12, bottom: 230, top: 12 });
      vi.spyOn(dv, 'getItemMetadata').mockReturnValue({
        cssClasses: 'text-bold',
        focusable: true,
        formatter: (r, c, val) => val,
        columns: { 0: { colspan: '*' } },
      });

      expect(grid.getFooterRow()).toBeTruthy();
      expect(footerElms).toBeTruthy();
      expect(footerElms[0].style.display).toBe('none');
      expect(footerElms[1].style.display).toBe('none');

      grid.setActiveCell(200, 1);
      grid.updateCell(344, 5);
      vi.spyOn(grid, 'getRowSpanIntersect').mockReturnValueOnce(1); // add a rowspan mandatory row to always render
      vi.spyOn(grid, 'getParentRowSpanByCell').mockReturnValue(null).mockReturnValueOnce({ start: 0, end: 1, range: '0:1' }); // add a rowspan mandatory row to always render
      grid.setFooterRowVisibility(true);
      grid.updateColumns(); // this will trigger onBeforeFooterRowCellDestroySpy

      vi.spyOn(grid, 'getDataLength').mockReturnValueOnce(data.length + 1); // add 1 more to force a full rowspan cache remap
      const remapRowspanSpy = vi.spyOn(grid, 'remapAllColumnsRowSpan');
      grid.updateRowCount();

      expect(remapRowspanSpy).toHaveBeenCalled();
      expect(onBeforeFooterRowCellDestroySpy).toHaveBeenCalled();
      footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn('firstName')).toEqual(footerElms[0].querySelector('.slick-footerrow-column'));
    });

    it('should define colspan and rowspan but get a warning when enableCellRowSpan is disabled', () => {
      const consoleWarnSpy = vi.spyOn(global.console, 'warn').mockReturnValue();
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
      ] as Column[];
      const metadata = { 0: { columns: { 0: { colspan: 2, rowspan: 2 } } } };
      const gridOptions = { ...defaultOptions, enableCellRowSpan: false, minRowBuffer: 10 } as GridOption;
      const data: any[] = [];
      for (let i = 0; i < 2; i++) {
        data.push({ id: i, firstName: 'John', lastName: 'Doe', age: 30 });
      }
      const dv = new SlickDataView({});
      vi.spyOn(dv, 'getItemMetadata').mockReturnValue(metadata[0]);
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, gridOptions);
      grid.init();

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[SlickGrid] Cell "rowspan" is an opt-in grid option because of its small perf hit'));
    });

    it('should hide/show column headers div when "showFooterRow" is disabled and expect some row cache to be cleaned up', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', colspan: 3 },
        { id: 'lastName', field: 'lastName', name: 'Last Name', colspan: 2 },
      ] as Column[];
      const gridOptions = { ...defaultOptions, createFooterRow: true, showFooterRow: false, frozenColumn: 0, frozenRow: 0 } as GridOption;
      const data = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, gridOptions);
      grid.init();
      let footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      const onBeforeFooterRowCellDestroySpy = vi.spyOn(grid.onBeforeFooterRowCellDestroy, 'notify');
      const onBeforeRemoveCachedRowSpy = vi.spyOn(grid.onBeforeRemoveCachedRow, 'notify');
      vi.spyOn(grid, 'getRenderedRange').mockReturnValue({
        bottom: 1,
        leftPx: 0,
        rightPx: -1,
        top: 0,
      });

      expect(grid.getFooterRow()).toBeTruthy();
      expect(footerElms).toBeTruthy();
      expect(footerElms[0].style.display).toBe('none');
      expect(footerElms[1].style.display).toBe('none');

      grid.setActiveCell(2, 1);
      grid.setFooterRowVisibility(true);
      grid.updateColumns(); // this will trigger onBeforeFooterRowCellDestroySpy

      vi.spyOn(grid, 'getDataLength').mockReturnValueOnce(-1);
      grid.updateRowCount();

      expect(grid.getRowCache()).toEqual({});
      expect(onBeforeRemoveCachedRowSpy).toHaveBeenCalledTimes(4);
      expect(onBeforeFooterRowCellDestroySpy).toHaveBeenCalledTimes(4); // 2x left and 2x right, because we have 2x columns
      footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn('firstName')).toEqual(footerElms[0].querySelector('.slick-footerrow-column'));
      expect((container.querySelector('.slick-pane.slick-pane-bottom.slick-pane-left') as HTMLDivElement).style.display).not.toBe('none'); // frozenRow: 0
      expect((container.querySelector('.slick-pane.slick-pane-bottom.slick-pane-right') as HTMLDivElement).style.display).not.toBe('none'); // frozenRow: 0
    });

    it('should hide/show column headers div when "showFooterRow" is disabled (with frozenColumn/frozenRow/frozenBottom) and expect footer row column exists', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
      ] as Column[];
      const gridOptions = { ...defaultOptions, createFooterRow: true, showFooterRow: false, frozenColumn: 0, frozenRow: 0, frozenBottom: true } as GridOption;
      const data = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, gridOptions);
      grid.init();
      let footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      const onBeforeFooterRowCellDestroySpy = vi.spyOn(grid.onBeforeFooterRowCellDestroy, 'notify');

      expect(grid.getFooterRow()).toBeTruthy();
      expect(footerElms).toBeTruthy();
      expect(footerElms[0].style.display).toBe('none');
      expect(footerElms[1].style.display).toBe('none');

      grid.setFooterRowVisibility(true);
      grid.updateColumns(); // this will trigger onBeforeFooterRowCellDestroySpy

      expect(onBeforeFooterRowCellDestroySpy).toHaveBeenCalledTimes(4); // 2x left and 2x right, because we have 2x columns
      footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn('firstName')).toEqual(footerElms[0].querySelector('.slick-footerrow-column'));
      expect((container.querySelector('.slick-pane.slick-pane-bottom.slick-pane-left') as HTMLDivElement).style.display).not.toBe('none'); // frozenRow: 0
      expect((container.querySelector('.slick-pane.slick-pane-bottom.slick-pane-right') as HTMLDivElement).style.display).not.toBe('none'); // frozenRow: 0
    });

    it('should hide column headers div when "showFooterRow" is disabled and expect undefined footer row column', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
      ] as Column[];
      const gridOptions = { ...defaultOptions, createFooterRow: true, showFooterRow: false, frozenColumn: 1 } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, gridOptions);
      grid.init();
      let footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');

      expect(grid.getFooterRow()).toBeTruthy();
      expect(footerElms).toBeTruthy();
      expect(footerElms[0].style.display).toBe('none');
      expect(footerElms[1].style.display).toBe('none');

      grid.setFooterRowVisibility(true);
      footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn(2)).toBeUndefined();

      grid.setFooterRowVisibility(false);
      footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      expect(footerElms[0].style.display).toBe('none');
      expect(footerElms[1].style.display).toBe('none');
    });

    it('should hide column headers div when "showFooterRow" is disabled and return undefined footer row column', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
      ] as Column[];
      const gridOptions = { ...defaultOptions, createFooterRow: false, showFooterRow: false, frozenColumn: 1 } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, gridOptions);
      grid.init();
      const footerElm = container.querySelector<HTMLDivElement>('.slick-footerrow');

      expect(grid.getFooterRow()).toBeFalsy();
      expect(footerElm).toBeFalsy();
      expect(grid.getFooterRowColumn('firstName')).toBeUndefined();
    });

    it('should show footer when "showFooterRow" is enabled but not return any row when columns to the right are outside the range', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, createFooterRow: true, showFooterRow: true });
      vi.spyOn(grid, 'getRenderedRange').mockReturnValue({ leftPx: 0, rightPx: -1, bottom: 230, top: 12 });

      grid.init();
      grid.render();
      const headerElm = container.querySelector('.slick-footerrow') as HTMLDivElement;
      const footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      const firstItemCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l0.r0') as HTMLDivElement;

      expect(firstItemCell).toBeFalsy();
      expect(headerElm).toBeTruthy();
      expect(headerElm.style.display).not.toBe('none');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn('firstName')).toEqual(footerElms[0].querySelector('.slick-footerrow-column'));
    });

    it('should show footer when "showFooterRow" is enabled with frozen column', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', alwaysRenderColumn: true },
        { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [{ id: 0, firstName: 'John', lastName: 'Doe' }], columns, {
        ...defaultOptions,
        createFooterRow: true,
        showFooterRow: true,
        frozenColumn: 1,
      });
      vi.spyOn(grid, 'getRenderedRange').mockReturnValue({ leftPx: 200, rightPx: 12, bottom: 230, top: 12 });
      grid.init();
      grid.render();
      const headerElm = container.querySelector('.slick-footerrow') as HTMLDivElement;
      const footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      const firstItemCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l0.r0') as HTMLDivElement;

      expect(headerElm).toBeTruthy();
      expect(headerElm.style.display).not.toBe('none');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(firstItemCell.classList.contains('frozen')).toBeTruthy();
      expect(grid.getFooterRowColumn('firstName')).toEqual(footerElms[0].querySelector('.slick-footerrow-column'));
    });
  });

  describe('Top Panel', () => {
    it('should show top panel div when "showTopPanel" is enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, showTopPanel: true });
      grid.init();
      const topPanelElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel');
      const topPanelScrollerElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel-scroller');

      expect(grid.getTopPanel()).toEqual(topPanelElms[0]);
      expect(grid.getTopPanels()).toEqual([topPanelElms[0], topPanelElms[1]]);
      expect(topPanelScrollerElms.length).toBe(2);
      expect(topPanelScrollerElms[0].style.display).not.toBe('none');
      expect(topPanelScrollerElms[1].style.display).not.toBe('none');
    });

    it('should hide top panel div when "showTopPanel" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, showTopPanel: false });
      grid.init();
      let topPanelElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel-scroller');

      expect(topPanelElms).toBeTruthy();
      expect(topPanelElms[0].style.display).toBe('none');
      expect(topPanelElms[1].style.display).toBe('none');

      grid.setTopPanelVisibility(true);
      topPanelElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel-scroller');
      expect(topPanelElms[0].style.display).not.toBe('none');
      expect(topPanelElms[1].style.display).not.toBe('none');

      grid.setTopPanelVisibility(false);
      topPanelElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel-scroller');
      expect(topPanelElms[0].style.display).toBe('none');
      expect(topPanelElms[1].style.display).toBe('none');
    });
  });

  describe('Header Row', () => {
    it('should show top panel div when "showHeaderRow" is enabled', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, showHeaderRow: true, frozenColumn: 0 });
      grid.init();
      const headerElms = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');
      const firstNameColHeader = grid.getHeaderRowColumn('firstName');

      expect(grid).toBeTruthy();
      expect(headerElms.length).toBe(2);
      expect(headerElms[0].style.display).not.toBe('none');
      expect(headerElms[1].style.display).not.toBe('none');
      expect(firstNameColHeader).toEqual(headerElms[0].querySelector('.slick-headerrow-column'));
      expect(firstNameColHeader.classList.contains('frozen')).toBeTruthy();

      // recreate column headers
      grid.updateColumns();

      expect(headerElms.length).toBe(2);
      expect(headerElms[0].style.display).not.toBe('none');
      expect(headerElms[1].style.display).not.toBe('none');
      expect(firstNameColHeader).toEqual(headerElms[0].querySelector('.slick-headerrow-column'));
      expect(firstNameColHeader.classList.contains('frozen')).toBeTruthy();
    });

    it('should hide top panel div when "showHeaderRow" is disabled', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, showHeaderRow: false, frozenColumn: 1 });
      grid.init();
      let headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');

      expect(grid).toBeTruthy();
      expect(headerElm).toBeTruthy();
      expect(headerElm[0].style.display).toBe('none');
      expect(headerElm[1].style.display).toBe('none');

      grid.setHeaderRowVisibility(true);
      headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');
      expect(headerElm[0].style.display).not.toBe('none');
      expect(headerElm[1].style.display).not.toBe('none');
      expect(grid.getHeaderRowColumn('firstName')).toBeUndefined();

      grid.setHeaderRowVisibility(false);
      headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');
      expect(headerElm[0].style.display).toBe('none');
      expect(headerElm[1].style.display).toBe('none');
    });

    it('should hide top panel div when "showHeaderRow" is disabled and return undefined header row column', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, showHeaderRow: false, frozenColumn: 1 });
      grid.init();
      let headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');

      expect(grid).toBeTruthy();
      expect(headerElm).toBeTruthy();
      expect(headerElm[0].style.display).toBe('none');
      expect(headerElm[1].style.display).toBe('none');

      grid.setHeaderRowVisibility(true);
      headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');
      expect(headerElm[0].style.display).not.toBe('none');
      expect(headerElm[1].style.display).not.toBe('none');
      expect(grid.getHeaderRowColumn(2)).toBeUndefined();
    });
  });

  describe('applyHtmlCode() method', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const dv = new SlickDataView({});

    it('should be able to apply HTMLElement to a HTMLElement target and empty its content by default', () => {
      const divElm = document.createElement('div');
      divElm.textContent = 'text to be erased';
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some text';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyHtmlCode(divElm, spanElm);

      expect(divElm.outerHTML).toBe('<div><span>some text</span></div>');
    });

    it('should be able to apply HTMLElement to a HTMLElement target but not empty its content when defined', () => {
      const divElm = document.createElement('div');
      divElm.textContent = 'text not erased';
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some text';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyHtmlCode(divElm, spanElm, { emptyTarget: false });

      expect(divElm.outerHTML).toBe('<div>text not erased<span>some text</span></div>');
    });

    it('should be able to skip empty text content assignment to HTMLElement', () => {
      const divElm = document.createElement('div');
      divElm.textContent = 'text not erased';
      const spanElm = document.createElement('span');
      spanElm.textContent = '';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyHtmlCode(divElm, spanElm, { emptyTarget: false, skipEmptyReassignment: true });

      expect(divElm.outerHTML).toBe('<div>text not erased<span></span></div>');
    });

    it('should be able to apply DocumentFragment to a HTMLElement target', () => {
      const fragment = document.createDocumentFragment();
      const divElm = document.createElement('div');
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some text';
      divElm.appendChild(spanElm);
      fragment.appendChild(spanElm);

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyHtmlCode(divElm, fragment);

      expect(divElm.outerHTML).toBe('<div><span>some text</span></div>');
    });

    it('should be able to apply a number and not expect it to be sanitized but parsed as string', () => {
      const divElm = document.createElement('div');

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyHtmlCode(divElm, 123);

      expect(divElm.outerHTML).toBe('<div>123</div>');
    });

    it('should be able to apply a boolean and not expect it to be sanitized but parsed as string', () => {
      const divElm = document.createElement('div');

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyHtmlCode(divElm, false);

      expect(divElm.outerHTML).toBe('<div>false</div>');
    });

    it('should be able to supply a custom sanitizer to use before applying html code', () => {
      const sanitizer = (dirtyHtml: string) =>
        typeof dirtyHtml === 'string'
          ? dirtyHtml.replace(
              /(\b)(on[a-z]+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script(>*)|(&lt;)(\/*)(script|script defer)(.*)(&gt;|&gt;">)/gi,
              ''
            )
          : dirtyHtml;
      const divElm = document.createElement('div');
      const htmlStr = '<span><script>alert("hello")</script>only text kept</span>';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, { ...defaultOptions, sanitizer });
      grid.applyHtmlCode(divElm, htmlStr);

      expect(divElm.outerHTML).toBe('<div><span>only text kept</span></div>');
    });

    it('should expect HTML string to be kept as a string and not be converted (but html escaped) when "enableHtmlRendering" grid option is disabled', () => {
      const divElm = document.createElement('div');
      const htmlStr = '<span aria-label="some aria label">only text kept</span>';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, { ...defaultOptions, enableHtmlRendering: false });
      grid.applyHtmlCode(divElm, htmlStr);

      expect(divElm.outerHTML).toBe('<div>&lt;span aria-label="some aria label"&gt;only text kept&lt;/span&gt;</div>');
    });
  });

  describe('applyFormatResultToCellNode() method', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const dv = new SlickDataView({});
    const cellNodeElm = document.createElement('div');
    cellNodeElm.className = 'slick-cell';

    it('should expect cell target to be empty string when formatter result is null', () => {
      const formatterResult = null as any;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="slick-cell"></div>');
    });

    it('should be able to apply HTMLElement returned by a Formatter to a HTMLElement target', () => {
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some content';
      const formatterResult = spanElm;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="slick-cell"><span>some content</span></div>');
    });

    it('should be able to apply column header tooltip', () => {
      const tooltipColumns = [{ id: 'firstName', field: 'firstName', name: 'First Name', toolTip: 'header tooltip' }] as Column[];

      grid = new SlickGrid<any, Column>('#myGrid', dv, tooltipColumns, defaultOptions);
      const columnElms = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');

      expect(columnElms[0].title).toBe('header tooltip');
    });

    it('should be able to apply cell text, CSS classes and tooltip when Formatter is returnbing FormatterResultWithText', () => {
      const formatterResult = { addClasses: 'some-class', toolTip: 'some tooltip', text: 'some content' } as FormatterResultWithText;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="slick-cell some-class" title="some tooltip">some content</div>');
    });

    it('should be able to apply text, CSS classes and tooltip when Formatter is returnbing FormatterResultWithHtml', () => {
      const divElm = document.createElement('div');
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some content';
      divElm.appendChild(spanElm);
      const formatterResult = { addClasses: 'some-class', toolTip: 'some tooltip', html: divElm } as FormatterResultWithHtml;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="slick-cell some-class" title="some tooltip"><div><span>some content</span></div></div>');
    });

    it('should be able to apply text, CSS classes and removed CSS classes when Formatter is returnbing FormatterResultWithText', () => {
      const formatterResult = {
        addClasses: 'some-class',
        removeClasses: 'slick-cell',
        toolTip: 'some tooltip',
        text: 'some content',
      } as FormatterResultWithText;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, defaultOptions);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="some-class" title="some tooltip">some content</div>');
    });
  });

  describe('dataItemColumnValueExtractor', () => {
    it('should use dataItemColumnValueExtractor when provided to retrieve value to show in grid cell', () => {
      const columns = [
        { id: 'title', name: 'Name', field: 'name', asyncPostRender: (node) => (node.textContent = 'Item ' + Math.random()) },
        { id: 'field1', name: 'Field1', field: 'values', fieldIdx: 0 },
        { id: 'field2', name: 'Field2', field: 'values', fieldIdx: 1 },
        { id: 'field3', name: 'Field3', field: 'values', fieldIdx: 2 },
      ];
      const gridOptions = {
        enableCellNavigation: true,
        enableColumnReorder: false,
        rowHeight: 2500,
        dataItemColumnValueExtractor: (item, column: any) => {
          const values = item[column.field];
          if (column.fieldIdx !== undefined) {
            return values?.[column.fieldIdx];
          } else {
            return values;
          }
        },
        enableAsyncPostRenderCleanup: true,
        asyncPostRenderDelay: 1,
        asyncPostRenderCleanupDelay: 1,
      } as GridOption;
      const data: any[] = [];
      for (let i = 0; i < 500; i++) {
        data[i] = {
          name: 'Item ' + i,
          values: [i + 8, i + 9, i + 11],
        };
      }

      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, ...gridOptions });
      grid.init;
      grid.render();

      // below is simply testing scrollTo() with different offset
      const secondItemCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l1.r1') as HTMLDivElement;
      expect(secondItemCell.textContent).toBe('8');

      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopLeft = document.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      vi.spyOn(viewportTopLeft, 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0, height: 223 } as DOMRect);
      Object.defineProperty(viewportTopLeft, 'scrollTop', { writable: true, value: 3000 });
      Object.defineProperty(viewportTopLeft, 'scrollLeft', { writable: true, value: 88 });
      Object.defineProperty(viewportTopLeft, 'scrollHeight', { writable: true, value: 440 });
      Object.defineProperty(viewportTopLeft, 'scrollWidth', { writable: true, value: 459 });
      Object.defineProperty(viewportTopLeft, 'clientHeight', { writable: true, value: 223 });
      Object.defineProperty(viewportTopLeft, 'clientWidth', { writable: true, value: 128 });
      grid.updateRowCount();
      grid.scrollCellIntoView(3000, 2);
      grid.scrollCellIntoView(30, 2);
      grid.scrollTo(52);

      expect(onViewportChangedSpy).toHaveBeenCalled();
    });
  });

  describe('getItemMetadata', () => {
    it('should expect slick-row to be taking full width when getItemMetadata() is returning cssClasses & colpan: *', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ] as Column[];
      const gridOptions = {
        enableCellNavigation: true,
        enableColumnReorder: false,
        rowHeight: 2500,
      } as GridOption;
      const mockItems = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 0, firstName: 'Jane', lastName: 'Doe', age: 28 },
      ];

      const dv = new SlickDataView({});
      vi.spyOn(dv, 'getItemMetadata').mockReturnValue({
        cssClasses: 'text-bold',
        focusable: true,
        formatter: (r, c, val) => val,
        columns: { 0: { colspan: '*' } },
      });
      grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, ...gridOptions });
      dv.addItems(mockItems);
      grid.init;
      grid.render();

      const firstRowElm = container.querySelector('.slick-row');
      const firstCellElm = firstRowElm?.querySelector('.slick-cell');

      expect(firstRowElm?.classList.contains('text-bold')).toBeTruthy();
      expect(firstCellElm?.classList.contains('l0')).toBeTruthy();
      expect(firstCellElm?.classList.contains(`r${columns.length - 1}`)).toBeTruthy();
    });
  });

  describe('highlightRow() method', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'age', field: 'age', name: 'Age' },
    ] as Column[];
    const dv = new SlickDataView({});

    it('should call the method and expect the highlight to happen for a certain duration', () => {
      const mockItems = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 0, firstName: 'Jane', lastName: 'Doe', age: 28 },
      ];

      grid = new SlickGrid<any, Column>(container, dv, columns, defaultOptions);
      dv.addItems(mockItems);
      grid.init();
      grid.render();

      grid.highlightRow(0, 10);
      expect(grid).toBeTruthy();
      expect(grid.getDataLength()).toBe(2);
      expect(grid.getHeader(columns[0])).toBeInstanceOf(HTMLDivElement);
      expect(grid.getHeaderColumn(columns[0].id)).toBeInstanceOf(HTMLDivElement);

      let slickRowElms = container.querySelectorAll<HTMLDivElement>('.slick-row');
      expect(slickRowElms.length).toBe(2);
      expect(slickRowElms[0].classList.contains('highlight-animate')).toBeTruthy(); // only 1st row is highlighted
      expect(slickRowElms[1].classList.contains('highlight-animate')).toBeFalsy();

      vi.runAllTimers(); // fast-forward timer

      slickRowElms = container.querySelectorAll<HTMLDivElement>('.slick-row');
      expect(slickRowElms.length).toBe(2);
      expect(slickRowElms[0].classList.contains('highlight-animate')).toBeFalsy();
      expect(slickRowElms[1].classList.contains('highlight-animate')).toBeFalsy();
    });
  });

  describe('flashCell() method', () => {
    it('should flash cell 2 times', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ];
      const items = [
        { id: 0, name: 'Avery', age: 44 },
        { id: 1, name: 'Bob', age: 20 },
        { id: 2, name: 'Rachel', age: 46 },
      ];

      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
      grid.flashCell(1, 1, 10);

      let secondItemAgeCell = container.querySelector('.slick-row:nth-child(2) .slick-cell.l1.r1') as HTMLDivElement;
      expect(secondItemAgeCell.textContent).toBe('20');
      expect(secondItemAgeCell.classList.contains('flashing')).toBeFalsy();

      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(10);

        secondItemAgeCell = container.querySelector('.slick-row:nth-child(2) .slick-cell.l1.r1') as HTMLDivElement;
        if (i % 2) {
          expect(secondItemAgeCell.classList.contains('flashing')).toBeTruthy();
        } else {
          expect(secondItemAgeCell.classList.contains('flashing')).toBeFalsy();
        }
      }
    });
  });

  describe('plugins', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];

    it('should be able to register a plugin', () => {
      const rowSelectionModel = new SlickRowSelectionModel();
      grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
      grid.setSelectionModel(rowSelectionModel);
      rowSelectionModel.init(grid);

      grid.registerPlugin(rowSelectionModel);
      let loadedPlugin = grid.getPluginByName<SlickRowSelectionModel>('RowSelectionModel');
      const selectionModel = grid.getSelectionModel();
      expect(loadedPlugin).toBeTruthy();
      expect(selectionModel).toBeTruthy();

      grid.unregisterPlugin(loadedPlugin as SlickRowSelectionModel);
      loadedPlugin = grid.getPluginByName<SlickRowSelectionModel>('RowSelectionModel');
      expect(loadedPlugin).toBeFalsy();

      const p = grid.getPluginByName('RowSelectionModel');
      expect(p).toBeFalsy();
    });

    it('should clear previous selection model when calling setSelectionModel() with a different model', () => {
      const rowSelectionModel = new SlickRowSelectionModel();
      const rowSelectSpy = vi.spyOn(rowSelectionModel, 'destroy');
      const cellSelectionModel = new SlickCellSelectionModel();

      grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
      grid.setSelectionModel(rowSelectionModel);
      grid.setSelectionModel(cellSelectionModel);

      expect(rowSelectSpy).toHaveBeenCalled();
    });

    it('should change border color for darkMode', () => {
      const cellSelectionModel = new SlickCellSelectionModel();

      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, darkMode: true });
      cellSelectionModel.init(grid);

      expect(cellSelectionModel.cellRangeSelector.addonOptions.selectionCss.border).toBe('2px solid white');
    });
  });

  describe('Node Getters', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];

    describe('getActiveCanvasNode() function', () => {
      it('should return undefined when calling the method when the Event does not include any target', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        const mockEvent = new CustomEvent('click');
        const result = grid.getActiveCanvasNode(mockEvent);

        expect(result).toBeFalsy();
      });

      it('should return closest grid canvas when calling the method when the Event includes grid canvas', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        const mockEvent = new MouseEvent('click');
        const gridCanvasElm = container.querySelector('.grid-canvas');
        Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: gridCanvasElm });
        const result = grid.getActiveCanvasNode(mockEvent);

        expect(result).toEqual(gridCanvasElm);
      });

      it('should return grid canvas when event is null', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        const result = grid.getActiveCanvasNode();

        expect(result).toEqual(container.querySelector('.grid-canvas'));
      });

      it('should return native event from SlickEventData when it is an instance of it', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        const mockEvent = new MouseEvent('click');
        const gridCanvasElm = container.querySelector('.grid-canvas');
        Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: gridCanvasElm });
        const ed = new SlickEventData(mockEvent);
        const result = grid.getActiveCanvasNode(ed);

        expect(result).toEqual(gridCanvasElm);
      });
    });

    describe('getActiveViewportNode() function', () => {
      it('should return undefined when calling the method when the Event does not include any target', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        const mockEvent = new CustomEvent('click');
        const result = grid.getActiveViewportNode(mockEvent);

        expect(result).toBeFalsy();
      });

      it('should return closest grid canvas when calling the method when the Event includes grid canvas', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        const mockEvent = new MouseEvent('click');
        const viewportElm = container.querySelector('.slick-viewport');
        Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: viewportElm });
        const result = grid.getActiveViewportNode(mockEvent);

        expect(result).toEqual(viewportElm);
      });

      it('should return native event from SlickEventData when it is an instance of it', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        const mockEvent = new MouseEvent('click');
        const viewportElm = container.querySelector('.slick-viewport');
        Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: viewportElm });
        const ed = new SlickEventData(mockEvent);
        const result = grid.getActiveViewportNode(ed);

        expect(result).toEqual(viewportElm);
      });

      it('should call getCellNode() and return null when dataset is empty', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        const result = grid.getCellNode(0, 3);

        expect(result).toBeNull();
      });

      it('should call getCellNode() and return null trying to retrieve cell higher than what is in the dataset', () => {
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);
        const result = grid.getCellNode(0, 3);

        expect(result).toBeNull();
      });
    });

    describe('getViewportNode() function', () => {
      it('should return viewport element when calling the function when found in the grid container', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        const result = grid.getViewportNode();

        expect(result).toBeTruthy();
        expect(result).toEqual(container.querySelector('.slick-viewport'));
      });

      it('should return viewport element when calling the function when found in the grid container', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, frozenRow: 2, frozenBottom: true });
        const result = grid.getViewportNode(22, 3);

        expect(result).toBeTruthy();
        expect(result!.className).toEqual('slick-viewport slick-viewport-bottom slick-viewport-left');
        expect(result!.querySelector('div')!.className).toEqual('grid-canvas grid-canvas-bottom grid-canvas-left');
        expect(result!.querySelector('.slick-row.frozen')).toBeTruthy();
        expect(result!.querySelector('.slick-cell')).toBeTruthy();
      });

      it('should return undefined when calling the function when getViewports() is returning undefined', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
        vi.spyOn(grid, 'getViewports').mockReturnValueOnce(null as any);
        const result = grid.getViewportNode();

        expect(result).toBeFalsy();
      });

      it('should return slick header left & right depending on frozenColumn index', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, fullWidthRows: true, frozenColumn: 1 });

        expect(grid.getHeader()[0]).toBeInstanceOf(HTMLDivElement);
        expect((grid.getHeader()[0] as HTMLDivElement).className).toBe('slick-header-columns slick-header-columns-left');
        expect((grid.getHeader()[1] as HTMLDivElement).className).toBe('slick-header-columns slick-header-columns-right');
      });
    });

    describe('getCellNodeBox() function', () => {
      it('should return null when no data is empty', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);

        expect(grid.getCellNodeBox(0, 0)).toBeNull();
      });

      it('should return cell node box dimension for first cell (top/left) when data is found in the grid', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name' },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age', hidden: true },
        ] as Column[];
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);

        expect(grid.getCellNodeBox(0, 0)).toEqual({
          left: 0,
          top: 0,
          bottom: expect.any(Number),
          right: expect.any(Number),
        });
      });

      it('should return cell node box dimension for other cell when data is found in the grid', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name' },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age', hidden: true },
        ] as Column[];
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);

        expect(grid.getCellNodeBox(1, 1)).toEqual({
          left: 80, // default column width
          top: DEFAULT_COLUMN_HEIGHT, // default column height
          bottom: expect.any(Number),
          right: expect.any(Number),
        });
      });

      it('should return cell node box dimension for other cell but expect to skip hidden cells from calculation', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);

        expect(grid.getCellNodeBox(1, 1)).toEqual({
          left: 0, // 0 because 1st cell is hidden
          top: DEFAULT_COLUMN_HEIGHT, // default column height
          bottom: expect.any(Number),
          right: expect.any(Number),
        });
      });

      it('should return cell node box dimension on Frozen grid for other cell but expect to start our left calculation minus left frozen row', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenColumn: 1 });

        expect(grid.getCellNodeBox(1, 2)).toEqual({
          left: 0, // 0 because previous cell is frozen
          top: DEFAULT_COLUMN_HEIGHT, // default column height
          bottom: expect.any(Number),
          right: expect.any(Number),
        });
      });
    });

    describe('getFrozenRowOffset() function', () => {
      it('should return 0 offset when frozenRow is undefined', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenColumn: 1 });

        expect(grid.getFrozenRowOffset(1)).toBe(0);
      });

      it('should return offset of 0 when frozenRow is defined as 0', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenRow: 0 });

        expect(grid.getFrozenRowOffset(2)).toBe(0);
      });

      it('should return offset of default column height when frozenRow is defined as 1', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenRow: 1 });

        expect(grid.getFrozenRowOffset(2)).toBe(DEFAULT_COLUMN_HEIGHT);
      });

      it('should return offset of default column height when frozenBottom is enabled and frozenRow is defined as 2 but actual frozen row is calculated to 0 because of frozen bottom and data length of 2 (2-2=0)', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenBottom: true, frozenRow: 2 }); // 2 - 2 = 0 as actual frozen row

        expect(grid.getFrozenRowOffset(2)).toBe(0);
      });

      it('should return offset of default column height * 2 when frozenBottom is enabled and frozenRow is defined as 2 and column height is lower than viewport offset top', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
          { id: 2, firstName: 'Bob', lastName: 'Smith', age: 48 },
          { id: 3, firstName: 'Arnold', lastName: 'Smith', age: 37 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, {
          ...defaultOptions,
          frozenBottom: true,
          frozenRow: 2,
          topPanelHeight: 540,
          showTopPanel: true,
        });

        expect(grid.getFrozenRowOffset(2)).toBe(DEFAULT_COLUMN_HEIGHT * 2);
      });
    });
  });

  describe('Grid Dimensions', () => {
    it('should get 2 rows of cell height when rowspan is set to 2 when calling getCellHeight()', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', alwaysRenderColumn: true },
        { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [{ id: 0, firstName: 'John', lastName: 'Doe' }], columns, defaultOptions);
      vi.spyOn(grid, 'getRenderedRange').mockReturnValue({ leftPx: 200, rightPx: 12, bottom: 230, top: 12 });
      const cellHeight = grid.getCellHeight(0, 2);

      expect(cellHeight).toBe(50);
    });

    it('should return default column width when column is not wider than grid and fullWidthRows is disabled with mixinDefaults is enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, mixinDefaults: true });
      grid.activateChangedOptions();
      const result = grid.getCanvasWidth();

      expect(result).toBe(80);
      expect(grid.getAbsoluteColumnMinWidth()).toBe(0);
      expect(grid.getHeaderColumnWidthDiff()).toBe(0);
    });

    it('should not call onBeforeCellEditorDestroy when mixinDefaults is enabled and commitCurrentEdit is returning false', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, editable: true, mixinDefaults: true });
      const onBeforeCellEditorDestroySpy = vi.spyOn(grid.onBeforeCellEditorDestroy, 'notify');
      vi.spyOn(grid.getEditorLock(), 'commitCurrentEdit').mockReturnValueOnce(false);
      grid.activateChangedOptions();
      const result = grid.getCanvasWidth();

      expect(result).toBe(80);
      expect(grid.getAbsoluteColumnMinWidth()).toBe(0);
      expect(grid.getHeaderColumnWidthDiff()).toBe(0);
      expect(onBeforeCellEditorDestroySpy).not.toHaveBeenCalled();
    });

    it('should return default full grid width when column is not wider than grid but fullWidthRows is enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, fullWidthRows: true });
      const result = grid.getCanvasWidth();

      expect(result).toBe(DEFAULT_GRID_WIDTH);
    });

    it('should return original grid width of 800px', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, fullWidthRows: true });
      const result = grid.getCanvasWidth();

      expect(result).toBe(DEFAULT_GRID_WIDTH);
    });

    it('should return left viewport width of 160px which is the default column width times 2', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
        { id: 'age', field: 'age', name: 'age' },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, frozenColumn: 1 });
      const result = grid.getCanvasWidth();
      grid.resizeCanvas();
      grid.autosizeColumns();
      grid.reRenderColumns();
      grid.render();
      grid.updateColumnHeader(1);

      expect(grid.getHeader()[0]).toBeInstanceOf(HTMLDivElement);
      expect(grid.getHeader(columns[0])).toBeInstanceOf(HTMLDivElement);
      expect(grid.getVisibleColumns().length).toBe(2);
      expect(result).toBe(80 * 2);
    });

    it('should return left viewport total column widths but also use shrink leeway since we are larger than canvas width', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', minWidth: 110, width: 300, hidden: true },
        { id: 'lastName', field: 'lastName', name: 'Last Name', width: 620 },
        { id: 'age', field: 'age', name: 'age', width: 192, resizable: false },
        { id: 'gender', field: 'gender', name: 'gender', width: 200 },
        { id: 'active', field: 'active', name: 'active', width: 200, hidden: true },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, frozenColumn: 1 });
      const result = grid.getCanvasWidth();
      grid.resizeCanvas();
      grid.autosizeColumns();
      grid.reRenderColumns();
      grid.render();
      grid.updateColumnHeader(1);

      expect(grid.getHeader()[0]).toBeInstanceOf(HTMLDivElement);
      expect(grid.getHeader(columns[0])).toBeInstanceOf(HTMLDivElement);
      expect(grid.getVisibleColumns().length).toBe(3);
      expect(result).toBe(1012);
      expect(columns[0].width).toBe(0);
      expect(columns[1].width).toBeGreaterThanOrEqual(454);
      expect(columns[1].width).toBeLessThanOrEqual(456);
      expect(columns[2].width).toBe(192);
      expect(columns[3].width).toBeGreaterThanOrEqual(152);
      expect(columns[3].width).toBeLessThan(154);
      expect(columns[4].width).toBe(0); // hidden
    });

    it('should return visible columns', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
        { id: 'age', field: 'age', name: 'age' },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, frozenColumn: 1 });
      const updateSpy = vi.spyOn(grid.onBeforeUpdateColumns, 'notify');
      grid.updateColumns();
      expect(grid.getVisibleColumns().length).toBe(2);

      const newColumns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', hidden: false },
        { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
        { id: 'age', field: 'age', name: 'age', hidden: true },
      ] as Column[];
      grid.setColumns(newColumns);

      expect(updateSpy).toHaveBeenCalled();
      expect(grid.getHeader()[0]).toBeInstanceOf(HTMLDivElement);
      expect(grid.getVisibleColumns().length).toBe(1);
    });

    it('should return full grid width when fullWidthRows is enabled even with frozenColumn defined', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
        { id: 'age', field: 'age', name: 'age' },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, fullWidthRows: true, frozenColumn: 1 });
      const result = grid.getCanvasWidth();

      expect(grid.getVisibleColumns().length).toBe(2);
      expect(result).toBe(DEFAULT_GRID_WIDTH);
      expect(grid.getHeader()[0]).toBeInstanceOf(HTMLDivElement);
      expect((grid.getHeader()[0] as HTMLDivElement).className).toBe('slick-header-columns slick-header-columns-left');
      expect((grid.getHeader()[1] as HTMLDivElement).className).toBe('slick-header-columns slick-header-columns-right');
    });

    it('should return viewport element when calling the function when found in the grid container', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
      const result = grid.getHeadersWidth();

      expect(result).toBe(2000 + DEFAULT_GRID_WIDTH); // (1000 * 1) + 1000 + gridWidth 800
    });

    it('should return viewport element when calling the function when found in the grid container', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
        { id: 'age', field: 'age', name: 'age' },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, frozenColumn: 1 });
      grid.init();
      const result = grid.getHeadersWidth();

      expect(result).toBe(DEFAULT_GRID_WIDTH + (1000 + 80 * 2) + 1000 + 1000); // Left + Right => 800 + (1000 + (defaultColumnWidth * 2)) * 2 + 1000
    });

    it('should return viewport element when calling the function when found in the grid container', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, frozenColumn: 1 });
      grid.init();
      const result = grid.getHeadersWidth();

      expect(result).toBe(DEFAULT_GRID_WIDTH + (1000 + 80 * 2) * 2 + 1000); // Left + Right => 800 + (1000 + (defaultColumnWidth * 2)) * 2 + 1000
    });

    it('should define rowspan and test mandatory rows are always rendered', () => {
      const metadata = {
        0: { columns: { 0: { colspan: 2, rowspan: 28 } } },
      };
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', colspan: 2, rowspan: 2 },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
        { id: 'age', field: 'age', name: 'Age' },
        { id: 'gender', field: 'gender', name: 'gender' },
        { id: 'scholarity', field: 'scholarity', name: 'scholarity', colspan: '*' },
        { id: 'bornCity', field: 'bornCity', name: 'bornCity' },
      ] as Column[];
      const gridOptions = { ...defaultOptions, enableCellRowSpan: true, createFooterRow: true, showFooterRow: false, minRowBuffer: 10 } as GridOption;
      const data: any[] = [];
      for (let i = 0; i < 1000; i++) {
        data.push({ id: i, firstName: 'John', lastName: 'Doe', age: 30 });
      }
      const dv = new SlickDataView({ globalItemMetadataProvider: { getRowMetadata: (row) => metadata[row] } });
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, gridOptions);
      vi.spyOn(grid, 'getRowSpanIntersect') // add a rowspan mandatory row to always render
        .mockReturnValue(2);
      const getDataSpy = vi.spyOn(grid, 'getDataItem');

      grid.init();
      vi.spyOn(grid, 'getRenderedRange').mockReturnValue({ leftPx: 200, rightPx: 12, bottom: 80, top: 42 });
      vi.spyOn(dv, 'getItemMetadata').mockReturnValue({
        cssClasses: 'text-bold',
        focusable: true,
        formatter: (r, c, val) => val,
        columns: { 0: { colspan: '2:30' } },
      });

      grid.scrollCellIntoView(200, 0);
      vi.spyOn(grid, 'getRowSpanIntersect').mockReturnValueOnce(1); // add a rowspan mandatory row to always render
      vi.spyOn(grid, 'getRowSpanColumnIntersects').mockReturnValue([2, 3]);
      vi.spyOn(grid, 'getDataLength').mockReturnValueOnce(data.length + 1); // add 1 more to force a full rowspan cache remap
      const remapRowspanSpy = vi.spyOn(grid, 'remapAllColumnsRowSpan');
      grid.updateRowCount();

      const slickCells = document.querySelectorAll<HTMLDivElement>('.slick-cell');
      const slickCell0 = document.querySelector('.slick-cell.l0.r0') as HTMLDivElement;

      expect(remapRowspanSpy).toHaveBeenCalled();
      expect(slickCell0).toBeTruthy();
      expect(slickCells.length).toBe(48);
      expect(getDataSpy).toHaveBeenCalledTimes(32);
    });

    describe('getViewportHeight() method', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name', alwaysRenderColumn: true },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
        { id: 'age', field: 'age', name: 'Age' },
      ] as Column[];
      const data = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
        { id: 2, firstName: 'Bob', lastName: 'Smith', age: 48 },
        { id: 3, firstName: 'Arnold', lastName: 'Smith', age: 37 },
      ];

      it('should return full viewport height by data size when "autoHeight" is enabled', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, autoHeight: true });
        grid.init();

        expect(grid.getViewportHeight()).toBe(DEFAULT_COLUMN_HEIGHT * data.length);
      });

      it('should return full viewport height by data size when "autoHeight" is enabled and has frozenColumn', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, autoHeight: true, frozenColumn: 1 });
        grid.init();

        expect(grid.getViewportHeight()).toBe(DEFAULT_COLUMN_HEIGHT * data.length);
      });

      it('should return full viewport height by data size when "autoHeight" is enabled and has pre-header & frozenColumn', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, {
          ...defaultOptions,
          autoHeight: true,
          frozenColumn: 1,
          createPreHeaderPanel: true,
          showPreHeaderPanel: true,
          preHeaderPanelHeight: 44,
        });
        grid.init();

        expect(grid.getViewportHeight()).toBe(DEFAULT_COLUMN_HEIGHT * data.length);
      });

      it('should return full viewport height by data size + headerRow & preHeader when they are enabled with "autoHeight"', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, {
          ...defaultOptions,
          autoHeight: true,
          forceFitColumns: true,
          showHeaderRow: true,
          headerRowHeight: 50,
          createPreHeaderPanel: true,
          showPreHeaderPanel: true,
          preHeaderPanelHeight: 44,
        });
        grid.init();

        expect(grid.getViewportHeight()).toBe(DEFAULT_COLUMN_HEIGHT * data.length + 50 + 44);
        expect(grid.getCanvasWidth()).toBeGreaterThanOrEqual(799);
        expect(grid.getCanvasWidth()).toBeLessThanOrEqual(801);
      });

      it('should return full viewport height by data size + headerRow & footerRow when they are enabled with "autoHeight"', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, {
          ...defaultOptions,
          autoHeight: true,
          forceFitColumns: true,
          headerRowHeight: 50,
          showHeaderRow: true,
          footerRowHeight: 40,
          createFooterRow: true,
          showFooterRow: true,
        });
        grid.init();

        expect(grid.getViewportHeight()).toBe(DEFAULT_COLUMN_HEIGHT * data.length + 50 + 40);
        expect(grid.getCanvasWidth()).toBeGreaterThanOrEqual(799);
        expect(grid.getCanvasWidth()).toBeLessThanOrEqual(801);
      });

      it('should return original grid height when calling method', () => {
        const data = [
          { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
          { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
          { id: 2, firstName: 'Bob', lastName: 'Smith', age: 48 },
          { id: 3, firstName: 'Arnold', lastName: 'Smith', age: 37 },
        ];
        grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);
        grid.init();

        expect(grid.getViewportHeight()).toBe(DEFAULT_GRID_HEIGHT);
      });

      it('should return original grid height minus headerRow & footerRow heights when calling method', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, {
          ...defaultOptions,
          headerRowHeight: 50,
          showHeaderRow: true,
          footerRowHeight: 40,
          createFooterRow: true,
          showFooterRow: true,
        });
        grid.init();

        expect(grid.getViewportHeight()).toBe(DEFAULT_GRID_HEIGHT - 50 - 40);
      });
    });
  });

  describe('updateColumnHeader() method', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
    ] as Column[];

    it('should be able to change Header text content and title tooltip', () => {
      grid = new SlickGrid<any, Column>(container, [], [...columns], defaultOptions);
      const onBeforeHeaderSpy = vi.spyOn(grid.onBeforeHeaderCellDestroy, 'notify');
      const onHeaderCellRenderSpy = vi.spyOn(grid.onHeaderCellRendered, 'notify');
      let column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm[1].textContent).toBe('Last Name');

      grid.updateColumnHeader('lastName', 'Middle Name', 'middle name tooltip');

      column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm[1].textContent).toBe('Middle Name');
      expect(column2Elm[1].title).toBe('middle name tooltip');
      expect(onBeforeHeaderSpy).toHaveBeenCalled();
      expect(onHeaderCellRenderSpy).toHaveBeenCalled();
    });

    it('should not be able to change Header text content when enabling "explicitInitialization" and we called updateColumnHeader() and init() was not called', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, explicitInitialization: true });

      grid.updateColumnHeader('lastName', 'Middle Name', 'middle name tooltip');

      const column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm.length).toBe(0);
    });

    it('should not be able to change any Header text content when column provided is invalid', () => {
      grid = new SlickGrid<any, Column>(container, [], [...columns], defaultOptions);
      let column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm[1].textContent).toBe('Last Name');

      grid.updateColumnHeader('unknown', 'Middle Name', 'middle name tooltip');

      column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm[0].textContent).toBe('First Name');
      expect(column2Elm[1].textContent).toBe('Last Name');
    });
  });

  describe('reRenderColumns() method', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];

    it('should force grid render when calling method with true argument provided', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
      const invalidateSpy = vi.spyOn(grid, 'invalidateAllRows');
      const renderSpy = vi.spyOn(grid, 'render');

      grid.reRenderColumns(true);

      expect(invalidateSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('Editors', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', editorClass: LongTextEditor }] as Column[];
    let items: Array<{ id: number; name: string; age: number; active?: boolean }> = [];

    beforeEach(() => {
      items = [
        { id: 0, name: 'Avery', age: 44 },
        { id: 1, name: 'Bob', age: 20 },
        { id: 2, name: 'Rachel', age: 46 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 4, name: 'John', age: 20 },
        { id: 5, name: 'Arnold', age: 50 },
        { id: 6, name: 'Carole', age: 40 },
        { id: 7, name: 'Jason', age: 48 },
        { id: 8, name: 'Julie', age: 42 },
        { id: 9, name: 'Aaron', age: 23 },
        { id: 10, name: 'Ariane', age: 43 },
      ];
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should expect editor when calling getEditController()', () => {
      grid = new SlickGrid<any, Column>(container, items, columns, defaultOptions);

      const result = grid.getEditController();

      expect(result).toBeTruthy();
    });

    it('should return undefined editor when getDataItem() did not find any associated cell item', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', editorClass: InputEditor },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
      vi.spyOn(grid, 'getDataItem').mockReturnValue(null);
      grid.setActiveCell(0, 1);
      grid.editActiveCell(InputEditor as any, true);

      const result = grid.getCellEditor();

      expect(result).toBeFalsy();
    });

    it('should return undefined editor when trying to add a new row item and "cannotTriggerInsert" is set', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', cannotTriggerInsert: true, editorClass: InputEditor },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true, autoEditNewRow: false });
      const onBeforeEditCellSpy = vi.spyOn(grid.onBeforeEditCell, 'notify');
      grid.setActiveCell(0, 1);
      vi.spyOn(grid, 'getDataLength').mockReturnValue(0); // trick grid to think it's a new item
      grid.editActiveCell(InputEditor as any, true);

      expect(onBeforeEditCellSpy).not.toHaveBeenCalled();
    });

    it('should return undefined editor when onBeforeEditCell returns false', () => {
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', cannotTriggerInsert: true, editorClass: InputEditor },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true, autoEditNewRow: false });
      const sed = new SlickEventData();
      vi.spyOn(sed, 'getReturnValue').mockReturnValue(false);
      vi.spyOn(grid.onBeforeEditCell, 'notify').mockReturnValue(sed);
      grid.setActiveCell(0, 1);
      grid.editActiveCell(InputEditor as any, true);
      const result = grid.getCellEditor();

      expect(result).toBeFalsy();
    });

    it('should do nothing when trying to commit unchanged Age field Editor', () => {
      (navigator as any).__defineGetter__('userAgent', () => 'msie'); // this will call clearTextSelection() & window.getSelection()
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', editorClass: InputEditor },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
      grid.setActiveCell(0, 1);
      grid.editActiveCell(InputEditor as any, true);
      const editor = grid.getCellEditor();
      const onCellChangeSpy = vi.spyOn(grid.onCellChange, 'notify');
      vi.spyOn(editor!, 'isValueChanged').mockReturnValue(false); // unchanged value

      const result = grid.getEditController()?.commitCurrentEdit();

      expect(editor).toBeTruthy();
      expect(onCellChangeSpy).not.toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should commit Name field Editor via an Editor defined as ItemMetadata by column id & asyncEditorLoading enabled and expect it to call execute() command and triggering onCellChange() notify', () => {
      (navigator as any).__defineGetter__('userAgent', () => 'msie'); // this will call clearTextSelection() & document.selection.empty()
      Object.defineProperty(document, 'selection', { writable: true, value: { empty: () => {} } });
      const newValue = 33;
      const columns = [
        { id: 'name', field: 'name', name: 'Name', colspan: '*' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', editorClass: InputEditor },
      ] as Column[];
      const dv = new SlickDataView();
      dv.setItems(items);
      grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true, asyncEditorLoading: true });
      vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ columns: { age: { colspan: '*', editorClass: InputEditor } } } as any);
      grid.setActiveCell(0, 1);

      vi.advanceTimersByTime(2);
      const activeCellNode = container.querySelector('.slick-cell.editable.l1.r1');
      grid.editActiveCell(InputEditor as any, true);

      const editor = grid.getCellEditor();
      const updateRowSpy = vi.spyOn(grid, 'updateRow');
      const onCellChangeSpy = vi.spyOn(grid.onCellChange, 'notify');
      vi.spyOn(editor!, 'serializeValue').mockReturnValueOnce(newValue);
      expect(activeCellNode).toBeTruthy();

      const result = grid.getEditController()?.commitCurrentEdit();

      expect(editor).toBeTruthy();
      expect(updateRowSpy).toHaveBeenCalledWith(0);
      expect(onCellChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ command: 'execute', row: 0, cell: 1, item: { id: 0, name: 'Avery', age: newValue }, column: columns[1] }),
        expect.anything(),
        grid
      );
      expect(grid.getEditController()).toBeTruthy();
      expect(result).toBeTruthy();
    });

    it('should commit Name field Editor via an Editor defined as ItemMetadata by column id & asyncEditorLoading enabled and expect it to call execute() command and triggering onCellChange() notify', () => {
      (navigator as any).__defineGetter__('userAgent', () => 'Firefox');
      const newValue = 33;
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', colspan: '2', editorClass: InputEditor },
      ] as Column[];
      const dv = new SlickDataView();
      dv.setItems(items);
      grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true, asyncEditorLoading: true });
      vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ columns: { 1: { editorClass: InputEditor } } as any });
      grid.setActiveCell(0, 1);

      vi.advanceTimersByTime(2);
      const activeCellNode = container.querySelector('.slick-cell.editable.l1.r1');
      grid.editActiveCell(InputEditor as any, true);

      const editor = grid.getCellEditor();
      const updateRowSpy = vi.spyOn(grid, 'updateRow');
      const onCellChangeSpy = vi.spyOn(grid.onCellChange, 'notify');
      vi.spyOn(editor!, 'serializeValue').mockReturnValueOnce(newValue);
      expect(activeCellNode).toBeTruthy();

      const result = grid.getEditController()?.commitCurrentEdit();

      expect(editor).toBeTruthy();
      expect(updateRowSpy).toHaveBeenCalledWith(0);
      expect(onCellChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ command: 'execute', row: 0, cell: 1, item: { id: 0, name: 'Avery', age: newValue }, column: columns[1] }),
        expect.anything(),
        grid
      );
      expect(grid.getEditController()).toBeTruthy();
      expect(result).toBeTruthy();
    });

    it('should commit Age field Editor by calling execute() command and triggering onCellChange() notify', () => {
      const newValue = 33;
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', editorClass: LongTextEditor },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
      const onPositionSpy = vi.spyOn(grid.onActiveCellPositionChanged, 'notify');
      grid.setActiveCell(0, 1);
      grid.editActiveCell(LongTextEditor as any, true);
      const editor = grid.getCellEditor();
      const updateRowSpy = vi.spyOn(grid, 'updateRow');
      const onCellChangeSpy = vi.spyOn(grid.onCellChange, 'notify');
      vi.spyOn(editor!, 'serializeValue').mockReturnValue(newValue);

      const result = grid.getEditController()?.commitCurrentEdit();

      expect(onPositionSpy).toHaveBeenCalled();
      expect(editor).toBeTruthy();
      expect(updateRowSpy).toHaveBeenCalledWith(0);
      expect(onCellChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ command: 'execute', row: 0, cell: 1, item: { id: 0, name: 'Avery', age: newValue }, column: columns[1] }),
        expect.anything(),
        grid
      );
      expect(grid.getEditController()).toBeTruthy();
      expect(result).toBeTruthy();

      // test hide editor when editor is already opened but we start scrolling
      vi.spyOn(grid, 'getActiveCellPosition').mockReturnValue({ visible: false } as any);
      const canvasBottom = container.querySelector('.slick-viewport-left');
      grid.setActiveCell(0, 1);
      grid.editActiveCell(LongTextEditor as any, true);
      const hideEditorSpy = vi.spyOn(grid.getCellEditor()!, 'hide');
      canvasBottom?.dispatchEvent(new Event('scroll'));
      expect(hideEditorSpy).toHaveBeenCalled();
    });

    it('should commit Active field Editor by calling execute() command with preClick and triggering onCellChange() notify', () => {
      const newValue = false;
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', editorClass: CheckboxEditor },
        { id: 'active', field: 'active', name: 'Active', type: 'boolean' },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
      grid.setActiveCell(0, 1, true);
      const editor = grid.getCellEditor();
      const updateRowSpy = vi.spyOn(grid, 'updateRow');
      const onCellChangeSpy = vi.spyOn(grid.onCellChange, 'notify');
      vi.spyOn(editor!, 'serializeValue').mockReturnValueOnce(newValue);
      grid.editActiveCell(CheckboxEditor as any, true);

      const result = grid.getEditController()?.commitCurrentEdit();

      // expect(preClickSpy).toHaveBeenCalled();
      expect(editor).toBeTruthy();
      expect(updateRowSpy).toHaveBeenCalledWith(0);
      expect(onCellChangeSpy).toHaveBeenCalledWith(expect.objectContaining({ command: 'execute', row: 0, cell: 1 }), expect.anything(), grid);
      expect(grid.getEditController()).toBeTruthy();
      expect(result).toBeTruthy();
    });

    it('should commit & rollback Age field Editor by calling execute() & undo() commands from a custom EditCommandHandler and triggering onCellChange() notify', () => {
      const newValue = 33;
      const editQueue: Array<{ item: any; column: Column; editCommand: EditCommand }> = [];
      const undoLastEdit = () => {
        const lastEditCommand = editQueue.pop()?.editCommand;
        if (lastEditCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
          lastEditCommand.undo();
          grid.invalidate();
        }
      };
      const editCommandHandler = (item, column, editCommand) => {
        if (editCommand.prevSerializedValue !== editCommand.serializedValue) {
          editQueue.push({ item, column, editCommand });
          grid.invalidate();
          editCommand.execute();
        }
      };
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', editorClass: InputEditor },
      ] as Column[];

      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true, editCommandHandler });
      grid.setActiveCell(0, 1);
      grid.editActiveCell(InputEditor as any, true);
      const editor = grid.getCellEditor();
      const updateRowSpy = vi.spyOn(grid, 'updateRow');
      const onCellChangeSpy = vi.spyOn(grid.onCellChange, 'notify');
      vi.spyOn(editor!, 'serializeValue').mockReturnValueOnce(newValue);

      const result = grid.getEditController()?.commitCurrentEdit();

      expect(editor).toBeTruthy();
      expect(updateRowSpy).toHaveBeenCalledWith(0);
      expect(onCellChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ command: 'execute', row: 0, cell: 1, item: { id: 0, name: 'Avery', age: newValue }, column: columns[1] }),
        expect.anything(),
        grid
      );
      expect(grid.getEditController()).toBeTruthy();
      expect(result).toBeTruthy();

      undoLastEdit();

      expect(onCellChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ command: 'undo', row: 0, cell: 1, item: { id: 0, name: 'Avery', age: '44' }, column: columns[1] }),
        expect.anything(),
        grid
      );
    });

    it('should commit Age field Editor by applying new values and triggering onAddNewRow() notify', () => {
      const newValue = 77;
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', editorClass: InputEditor },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, enableAddRow: true, editable: true });

      grid.setActiveCell(1, 1);
      grid.editActiveCell(InputEditor as any, true);
      const editor = grid.getCellEditor();
      vi.spyOn(grid, 'getDataLength').mockReturnValueOnce(0); // trick grid to think it's a new item
      const onAddNewRowSpy = vi.spyOn(grid.onAddNewRow, 'notify');
      vi.spyOn(editor!, 'serializeValue').mockReturnValue(newValue);

      const result = grid.getEditController()?.commitCurrentEdit();

      expect(editor).toBeTruthy();
      expect(onAddNewRowSpy).toHaveBeenCalledWith(expect.objectContaining({ item: { age: newValue }, column: columns[1] }), expect.anything(), grid);
      expect(grid.getEditController()).toBeTruthy();
      expect(result).toBeTruthy();
    });

    it('should commit Age field Editor by applying new values and triggering onAddNewRow() notify with autoHeight enabled and expect different viewport height', () => {
      const newValue = 77;
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', editorClass: InputEditor },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, items, columns, {
        ...defaultOptions,
        autoHeight: true,
        enableCellNavigation: true,
        enableAddRow: true,
        editable: true,
      });
      const prevHeight = grid.getViewportHeight();
      grid.onAddNewRow.subscribe((e, args) => {
        grid.setData([...(grid.getData() as any[]), args.item]);
      });

      grid.setActiveCell(1, 1);
      grid.editActiveCell(InputEditor as any, true);
      const editor = grid.getCellEditor();
      vi.spyOn(grid, 'getDataLength').mockReturnValueOnce(0); // trick grid to think it's a new item
      const onAddNewRowSpy = vi.spyOn(grid.onAddNewRow, 'notify');
      vi.spyOn(editor!, 'serializeValue').mockReturnValue(newValue);

      const result = grid.getEditController()?.commitCurrentEdit();
      const newHeight = grid.getViewportHeight();

      expect(editor).toBeTruthy();
      expect(onAddNewRowSpy).toHaveBeenCalledWith(expect.objectContaining({ item: { age: newValue }, column: columns[1] }), expect.anything(), grid);
      expect(grid.getEditController()).toBeTruthy();
      expect(result).toBeTruthy();
      expect(prevHeight).not.toEqual(newHeight);
    });

    it('should not commit Age field Editor returns invalid result, expect triggering onValidationError() notify', () => {
      const invalidResult = { valid: false, msg: 'invalid value' };
      const columns = [
        { id: 'name', field: 'name', name: 'Name' },
        { id: 'age', field: 'age', name: 'Age', type: 'number', editorClass: InputEditor },
      ] as Column[];
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
      grid.setActiveCell(0, 1);
      grid.editActiveCell(InputEditor as any, true);
      const editor = grid.getCellEditor();
      const onValidationErrorSpy = vi.spyOn(grid.onValidationError, 'notify');
      vi.spyOn(editor!, 'validate').mockReturnValue(invalidResult);
      const activeCellNode = container.querySelector('.slick-cell.editable.l1.r1');

      const result = grid.getEditController()?.commitCurrentEdit();

      expect(editor).toBeTruthy();
      expect(onValidationErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          editor,
          cellNode: activeCellNode,
          validationResults: invalidResult,
          row: 0,
          cell: 1,
          column: columns[1],
        }),
        expect.anything(),
        grid
      );
      expect(grid.getEditController()).toBeTruthy();
      expect(result).toBeFalsy();
    });
  });

  describe('Column Reorder', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name', sortable: true },
      { id: 'lastName', field: 'lastName', name: 'Last Name', sortable: true },
      { id: 'age', field: 'age', name: 'Age', sortable: true },
    ] as Column[];
    const data = [
      { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
      { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
    ];
    let sortInstance;

    it('should reorder column to the left when current column pageX is lower than viewport left position', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);
      const headerColumnsElm = document.querySelector('.slick-header-columns.slick-header-columns-left') as HTMLDivElement;
      Object.keys(headerColumnsElm).forEach((prop) => {
        if (prop.startsWith('Sortable')) {
          sortInstance = headerColumnsElm[prop];
        }
      });
      const onColumnsReorderedSpy = vi.spyOn(grid.onColumnsReordered, 'notify');
      const headerColumnElms = document.querySelectorAll<HTMLDivElement>('.slick-header-column');
      const viewportTopLeft = document.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;

      const dragEvent = new CustomEvent('DragEvent');
      vi.spyOn(viewportTopLeft, 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0 } as DOMRect);
      Object.defineProperty(dragEvent, 'originalEvent', { writable: true, value: { pageX: 20 } });
      Object.defineProperty(dragEvent, 'related', { writable: true, value: headerColumnElms[0] });
      Object.defineProperty(dragEvent, 'item', { writable: true, value: headerColumnElms[0] });
      Object.defineProperty(headerColumnElms[0], 'clientLeft', { writable: true, value: 25 });
      Object.defineProperty(viewportTopLeft, 'clientLeft', { writable: true, value: 25 });

      expect(sortInstance).toBeTruthy();
      sortInstance.options.onStart(dragEvent);
      sortInstance.options.onMove(dragEvent);
      expect(viewportTopLeft.scrollLeft).toBe(0);

      vi.advanceTimersByTime(100);

      expect(viewportTopLeft.scrollLeft).toBe(-10);
      sortInstance.options.onEnd(dragEvent);
      expect(onColumnsReorderedSpy).toHaveBeenCalled();
    });

    it('should reorder column to the right when current column pageX is greater than container width', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);
      const headerColumnsElm = document.querySelector('.slick-header-columns.slick-header-columns-left') as HTMLDivElement;
      Object.keys(headerColumnsElm).forEach((prop) => {
        if (prop.startsWith('Sortable')) {
          sortInstance = headerColumnsElm[prop];
        }
      });
      const onColumnsReorderedSpy = vi.spyOn(grid.onColumnsReordered, 'notify');
      const headerColumnElms = document.querySelectorAll<HTMLDivElement>('.slick-header-column');
      const viewportTopLeft = document.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;

      const dragEvent = new CustomEvent('DragEvent');
      vi.spyOn(viewportTopLeft, 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0 } as DOMRect);
      Object.defineProperty(dragEvent, 'originalEvent', { writable: true, value: { pageX: DEFAULT_GRID_WIDTH + 11 } });
      Object.defineProperty(dragEvent, 'item', { writable: true, value: headerColumnElms[0] });
      Object.defineProperty(headerColumnElms[0], 'clientLeft', { writable: true, value: 25 });
      Object.defineProperty(viewportTopLeft, 'clientLeft', { writable: true, value: 25 });

      expect(sortInstance).toBeTruthy();
      sortInstance.options.onStart(dragEvent);
      expect(viewportTopLeft.scrollLeft).toBe(0);

      vi.advanceTimersByTime(100);

      expect(viewportTopLeft.scrollLeft).toBe(10);
      sortInstance.options.onEnd(dragEvent);
      expect(onColumnsReorderedSpy).toHaveBeenCalled();
    });

    it('should try reordering column but stay at same scroll position when grid has frozen columns', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenColumn: 0 });
      grid.setActiveCell(0, 1);
      const headerColumnsElm = document.querySelector('.slick-header-columns.slick-header-columns-left') as HTMLDivElement;
      Object.keys(headerColumnsElm).forEach((prop) => {
        if (prop.startsWith('Sortable')) {
          sortInstance = headerColumnsElm[prop];
        }
      });
      const onColumnsReorderedSpy = vi.spyOn(grid.onColumnsReordered, 'notify');
      const headerColumnElms = document.querySelectorAll<HTMLDivElement>('.slick-header-column');
      const viewportTopLeft = document.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;

      const dragEvent = new CustomEvent('DragEvent');
      vi.spyOn(viewportTopLeft, 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0 } as DOMRect);
      Object.defineProperty(dragEvent, 'originalEvent', { writable: true, value: { pageX: 20 } });
      Object.defineProperty(dragEvent, 'item', { writable: true, value: headerColumnElms[0] });
      Object.defineProperty(headerColumnElms[0], 'clientLeft', { writable: true, value: 25 });
      Object.defineProperty(viewportTopLeft, 'clientLeft', { writable: true, value: 25 });

      expect(sortInstance).toBeTruthy();
      sortInstance.options.onStart(dragEvent);
      expect(viewportTopLeft.scrollLeft).toBe(0);

      vi.advanceTimersByTime(100);

      expect(viewportTopLeft.scrollLeft).toBe(0); // same position
      sortInstance.options.onEnd(dragEvent);
      expect(onColumnsReorderedSpy).toHaveBeenCalled();
    });

    it('should not allow column reordering when Editor Lock commitCurrentEdit() is failing', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenColumn: 0 });
      vi.spyOn(grid.getEditorLock(), 'commitCurrentEdit').mockReturnValueOnce(false);
      const headerColumnsElm = document.querySelector('.slick-header-columns.slick-header-columns-left') as HTMLDivElement;
      Object.keys(headerColumnsElm).forEach((prop) => {
        if (prop.startsWith('Sortable')) {
          sortInstance = headerColumnsElm[prop];
        }
      });
      const onColumnsReorderedSpy = vi.spyOn(grid.onColumnsReordered, 'notify');
      const headerColumnElms = document.querySelectorAll<HTMLDivElement>('.slick-header-column');
      const viewportTopLeft = document.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;

      const dragEvent = new CustomEvent('DragEvent');
      vi.spyOn(viewportTopLeft, 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0 } as DOMRect);
      Object.defineProperty(dragEvent, 'originalEvent', { writable: true, value: { pageX: 20 } });
      Object.defineProperty(dragEvent, 'item', { writable: true, value: headerColumnElms[0] });
      Object.defineProperty(viewportTopLeft, 'clientLeft', { writable: true, value: 25 });

      expect(sortInstance).toBeTruthy();
      sortInstance.options.onStart(dragEvent);
      expect(viewportTopLeft.scrollLeft).toBe(0);

      vi.advanceTimersByTime(100);

      expect(viewportTopLeft.scrollLeft).toBe(0);
      sortInstance.options.onEnd(dragEvent);
      expect(onColumnsReorderedSpy).not.toHaveBeenCalled();
    });
  });

  describe('Drag & Drop (Draggable)', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name', sortable: true },
      {
        id: 'lastName',
        field: 'lastName',
        name: 'Last Name',
        sortable: true,
        asyncPostRender: (node) => (node.textContent = String(Math.random())),
        asyncPostRenderCleanup: (node) => (node.textContent = ''),
      },
      { id: 'age', field: 'age', name: 'Age', sortable: true },
    ] as Column[];
    const data = [
      { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
      { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
    ];
    for (let i = 0; i < 500; i++) {
      data[i] = {
        id: i,
        firstName: i % 2 ? 'John' : 'Jane',
        lastName: 'Doe',
        age: Math.random(),
      };
    }

    it('should not drag when cell is not in found in the grid', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);
      const onDragInitSpy = vi.spyOn(grid.onDragInit, 'notify');
      const slickCellElm = createDomElement('div', { className: 'slick-cell l0' });
      const cMouseDownEvent = new CustomEvent('mousedown');
      Object.defineProperty(cMouseDownEvent, 'target', { writable: true, value: slickCellElm });
      container.dispatchEvent(cMouseDownEvent);

      expect(onDragInitSpy).not.toHaveBeenCalled();
    });

    it('should not drag when event has cancelled bubbling (immediatePropagationStopped)', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);

      const cMouseDownEvent = new CustomEvent('mousedown');
      const sedMouseDown = new SlickEventData();
      sedMouseDown.addReturnValue(false);
      sedMouseDown.stopImmediatePropagation();
      const onDragInitSpy = vi.spyOn(grid.onDragInit, 'notify').mockReturnValue(sedMouseDown);
      const onDragStartSpy = vi.spyOn(grid.onDragStart, 'notify');
      const onDragSpy = vi.spyOn(grid.onDrag, 'notify');
      const onDragEndSpy = vi.spyOn(grid.onDragEnd, 'notify');
      const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
      slickCellElm.classList.add('dnd', 'cell-reorder');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      bodyMouseMoveEvent.stopImmediatePropagation(); // simulate bubbling stop from dragInit
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(cMouseDownEvent, 'target', { writable: true, value: slickCellElm });
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: slickCellElm });
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      document.body.dispatchEvent(bodyMouseUpEvent);

      expect(onDragInitSpy).toHaveBeenCalled();
      expect(onDragStartSpy).not.toHaveBeenCalled();
      expect(onDragSpy).not.toHaveBeenCalled();
      expect(onDragEndSpy).not.toHaveBeenCalled();
    });

    it('should not execute any events after onDragInit when it returns false', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);

      const cMouseDownEvent = new CustomEvent('mousedown');
      const onDragInitSpy = vi.spyOn(grid.onDragInit, 'notify');
      const onDragStartSpy = vi.spyOn(grid.onDragStart, 'notify');
      const onDragSpy = vi.spyOn(grid.onDrag, 'notify');
      const onDragEndSpy = vi.spyOn(grid.onDragEnd, 'notify');
      const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
      slickCellElm.classList.add('dnd', 'cell-reorder');

      const bodyMouseMoveEvent1 = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(cMouseDownEvent, 'target', { writable: true, value: slickCellElm });
      Object.defineProperty(bodyMouseMoveEvent1, 'target', { writable: true, value: slickCellElm });

      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent1);
      document.body.dispatchEvent(bodyMouseUpEvent);

      expect(onDragInitSpy).toHaveBeenCalled();
      expect(onDragStartSpy).not.toHaveBeenCalled();
      expect(onDragSpy).not.toHaveBeenCalled();
      expect(onDragEndSpy).not.toHaveBeenCalled();
    });

    it('should not execute onDragStart or any other events when onDragStart event has cancelled bubbling (immediatePropagationStopped)', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);

      const cMouseDownEvent = new CustomEvent('mousedown');
      const sedDragInit = new SlickEventData();
      const sedDragStart = new SlickEventData();
      sedDragInit.addReturnValue(true);
      sedDragStart.addReturnValue(false);
      sedDragInit.stopImmediatePropagation();
      sedDragStart.stopImmediatePropagation();
      const onDragInitSpy = vi.spyOn(grid.onDragInit, 'notify').mockReturnValue(sedDragInit);
      const onDragStartSpy = vi.spyOn(grid.onDragStart, 'notify').mockReturnValue(sedDragStart);
      const onDragSpy = vi.spyOn(grid.onDrag, 'notify');
      const onDragEndSpy = vi.spyOn(grid.onDragEnd, 'notify');
      const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
      slickCellElm.classList.add('dnd', 'cell-reorder');

      const bodyMouseMoveEvent1 = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(cMouseDownEvent, 'target', { writable: true, value: slickCellElm });
      Object.defineProperty(bodyMouseMoveEvent1, 'target', { writable: true, value: slickCellElm });

      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent1);
      document.body.dispatchEvent(bodyMouseUpEvent);

      expect(onDragInitSpy).toHaveBeenCalled();
      expect(onDragStartSpy).toHaveBeenCalled();
      expect(onDragSpy).toHaveBeenCalled();
      expect(onDragEndSpy).toHaveBeenCalled();
    });

    it('should drag from a cell and execute all onDrag events when a slick-cell is dragged and its event is stopped', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);

      const sedDragInit = new SlickEventData();
      sedDragInit.addReturnValue(true);
      sedDragInit.stopImmediatePropagation();
      const onDragInitSpy = vi.spyOn(grid.onDragInit, 'notify').mockReturnValue(sedDragInit);
      const onDragStartSpy = vi.spyOn(grid.onDragStart, 'notify');
      const onDragSpy = vi.spyOn(grid.onDrag, 'notify');
      const onDragEndSpy = vi.spyOn(grid.onDragEnd, 'notify');
      const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
      slickCellElm.classList.add('dnd', 'cell-reorder');

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(cMouseDownEvent, 'target', { writable: true, value: slickCellElm });
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: slickCellElm });
      Object.defineProperty(bodyMouseMoveEvent, 'clientX', { writable: true, value: 20 });
      Object.defineProperty(bodyMouseMoveEvent, 'clientY', { writable: true, value: 18 });

      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      document.body.dispatchEvent(bodyMouseUpEvent);

      expect(onDragInitSpy).toHaveBeenCalled();
      expect(onDragStartSpy).toHaveBeenCalled();
      expect(onDragSpy).toHaveBeenCalled();
      expect(onDragEndSpy).toHaveBeenCalled();
    });

    it('should drag from a cell and execute all onDrag events then cleanup async renderer when a slick-cell is dragged and its event is stopped', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, {
        ...defaultOptions,
        rowHeight: 2200,
        enableAsyncPostRender: true,
        enableAsyncPostRenderCleanup: true,
      });
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopLeft = document.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      vi.spyOn(viewportTopLeft, 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0, height: 223 } as DOMRect);
      Object.defineProperty(viewportTopLeft, 'scrollTop', { writable: true, value: 3000 });
      Object.defineProperty(viewportTopLeft, 'scrollLeft', { writable: true, value: 88 });
      Object.defineProperty(viewportTopLeft, 'scrollHeight', { writable: true, value: 440 });
      Object.defineProperty(viewportTopLeft, 'scrollWidth', { writable: true, value: 459 });
      Object.defineProperty(viewportTopLeft, 'clientHeight', { writable: true, value: 223 });
      Object.defineProperty(viewportTopLeft, 'clientWidth', { writable: true, value: 128 });

      const sedDragInit = new SlickEventData();
      sedDragInit.addReturnValue(true);
      sedDragInit.stopImmediatePropagation();
      const onDragInitSpy = vi.spyOn(grid.onDragInit, 'notify').mockReturnValue(sedDragInit);
      const onDragStartSpy = vi.spyOn(grid.onDragStart, 'notify');
      const onDragSpy = vi.spyOn(grid.onDrag, 'notify');
      const onDragEndSpy = vi.spyOn(grid.onDragEnd, 'notify');
      const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
      slickCellElm.classList.add('dnd', 'cell-reorder');

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(cMouseDownEvent, 'target', { writable: true, value: slickCellElm });
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: slickCellElm });
      Object.defineProperty(bodyMouseMoveEvent, 'clientX', { writable: true, value: 20 });
      Object.defineProperty(bodyMouseMoveEvent, 'clientY', { writable: true, value: 18 });

      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(onDragInitSpy).toHaveBeenCalled();
      expect(onDragStartSpy).toHaveBeenCalled();
      expect(onDragSpy).toHaveBeenCalled();
      expect(onDragEndSpy).toHaveBeenCalled();

      grid.scrollRowIntoView(30);
      expect((document.querySelector('.slick-row.odd') as HTMLDivElement).style.top).toMatch(/^[0-9]*px$/gi);
      grid.setActiveRow(30);
      grid.scrollTo(33);
      vi.advanceTimersByTime(10);

      vi.spyOn(grid, 'getCellNode').mockReturnValueOnce(document.createElement('div'));
      grid.updateCell(30, 1);
      grid.invalidateRows([31]);
      grid.scrollTo(2);
      vi.advanceTimersByTime(12);

      expect(onViewportChangedSpy).toHaveBeenCalled();
    });

    it('should "rowTopOffsetRenderType" use grid option and scrollTo row and expect transform of translateY to be changed', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, {
        ...defaultOptions,
        rowHeight: 2200,
        enableAsyncPostRender: true,
        enableAsyncPostRenderCleanup: true,
        rowTopOffsetRenderType: 'transform',
      });
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopLeft = document.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      vi.spyOn(viewportTopLeft, 'getBoundingClientRect').mockReturnValue({ left: 25, top: 10, right: 0, bottom: 0, height: 223 } as DOMRect);
      Object.defineProperty(viewportTopLeft, 'scrollTop', { writable: true, value: 3000 });
      Object.defineProperty(viewportTopLeft, 'scrollLeft', { writable: true, value: 88 });
      Object.defineProperty(viewportTopLeft, 'scrollHeight', { writable: true, value: 440 });
      Object.defineProperty(viewportTopLeft, 'scrollWidth', { writable: true, value: 459 });
      Object.defineProperty(viewportTopLeft, 'clientHeight', { writable: true, value: 223 });
      Object.defineProperty(viewportTopLeft, 'clientWidth', { writable: true, value: 128 });

      const sedDragInit = new SlickEventData();
      sedDragInit.addReturnValue(true);
      sedDragInit.stopImmediatePropagation();
      const onDragInitSpy = vi.spyOn(grid.onDragInit, 'notify').mockReturnValue(sedDragInit);
      const onDragStartSpy = vi.spyOn(grid.onDragStart, 'notify');
      const onDragSpy = vi.spyOn(grid.onDrag, 'notify');
      const onDragEndSpy = vi.spyOn(grid.onDragEnd, 'notify');
      const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
      slickCellElm.classList.add('dnd', 'cell-reorder');

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(cMouseDownEvent, 'target', { writable: true, value: slickCellElm });
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: slickCellElm });
      Object.defineProperty(bodyMouseMoveEvent, 'clientX', { writable: true, value: 20 });
      Object.defineProperty(bodyMouseMoveEvent, 'clientY', { writable: true, value: 18 });

      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(onDragInitSpy).toHaveBeenCalled();
      expect(onDragStartSpy).toHaveBeenCalled();
      expect(onDragSpy).toHaveBeenCalled();
      expect(onDragEndSpy).toHaveBeenCalled();

      grid.scrollRowIntoView(30);
      expect((document.querySelector('.slick-row.odd') as HTMLDivElement).style.transform).toMatch(/^translateY\([0-9]*px\)$/gi);
      grid.setActiveRow(30);
      grid.scrollTo(33);
      vi.advanceTimersByTime(10);

      grid.updateCell(0, 1);
      grid.invalidateRows([31]);
      grid.scrollTo(2);
      vi.advanceTimersByTime(12);

      expect(onViewportChangedSpy).toHaveBeenCalled();
    });

    it('should drag from a cell and execute all onDrag events except onDragStart when mousemove event target is not a slick-cell', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, defaultOptions);

      const sedDragInit = new SlickEventData();
      sedDragInit.addReturnValue(true);
      sedDragInit.stopImmediatePropagation();
      const onDragInitSpy = vi.spyOn(grid.onDragInit, 'notify').mockReturnValue(sedDragInit);
      const onDragStartSpy = vi.spyOn(grid.onDragStart, 'notify');
      const onDragSpy = vi.spyOn(grid.onDrag, 'notify');
      const onDragEndSpy = vi.spyOn(grid.onDragEnd, 'notify');
      const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
      slickCellElm.classList.add('dnd', 'cell-reorder');

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(cMouseDownEvent, 'target', { writable: true, value: slickCellElm });
      // Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: null });
      Object.defineProperty(bodyMouseMoveEvent, 'clientX', { writable: true, value: 20 });
      Object.defineProperty(bodyMouseMoveEvent, 'clientY', { writable: true, value: 18 });

      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      document.body.dispatchEvent(bodyMouseUpEvent);

      expect(onDragInitSpy).toHaveBeenCalled();
      expect(onDragStartSpy).not.toHaveBeenCalled();
      expect(onDragSpy).toHaveBeenCalled();
      expect(onDragEndSpy).toHaveBeenCalled();
    });
  });

  describe('Column Resizing', () => {
    const columns = [
      { id: 'id', field: 'id', name: 'Id', hidden: true },
      { id: 'firstName', field: 'firstName', name: 'First Name', sortable: true, width: 77, previousWidth: 20, rerenderOnResize: true },
      { id: 'lastName', field: 'lastName', name: 'Last Name', sortable: true, minWidth: 35, maxWidth: 78 },
      { id: 'age', field: 'age', name: 'Age', sortable: true, minWidth: 82, width: 86, maxWidth: 88 },
      { id: 'gender', field: 'gender', name: 'Gender', sortable: true },
    ] as Column[];
    const data = [
      { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
      { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
    ];

    it('should resize should not go through when column has an editor', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: false });
      // grid.init();

      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[1].querySelector('.slick-resizable-handle') as HTMLDivElement;
      vi.spyOn(grid.getEditorLock(), 'commitCurrentEdit').mockReturnValueOnce(false);

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 9 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: -22 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      // document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeFalsy();
    });

    it('should resize 2nd column that has a "width" defined using default sizing grid options', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: false });
      grid.init();

      const sedOnBeforeResize = new SlickEventData();
      sedOnBeforeResize.addReturnValue(true);
      vi.spyOn(grid.onBeforeColumnsResize, 'notify').mockReturnValue(sedOnBeforeResize);
      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[1].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 9 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: -22 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[1], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // header click won't get through
      const onHeaderClickSpy = vi.spyOn(grid.onHeaderClick, 'notify');
      container.querySelector('.slick-header')!.dispatchEvent(new CustomEvent('click'));
      expect(onHeaderClickSpy).not.toHaveBeenCalled();

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);

      vi.advanceTimersByTime(10);

      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'lastName', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(80);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(65);
      expect(columns[3].width).toBe(86);
      expect(columns[4].width).toBe(80);
    });

    it('should resize 3rd column that has a "minWidth" defined using default sizing grid options', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: false, syncColumnCellResize: true });
      grid.init();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[2].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 9 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: -22 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[2], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);

      vi.advanceTimersByTime(10);

      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'age', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(80);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(59);
      expect(columns[3].width).toBe(88);
      expect(columns[4].width).toBe(80);
    });

    it('should resize 3rd column that has a "minWidth" defined using default sizing grid options with a frozen column', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: false, frozenColumn: 0, syncColumnCellResize: true });
      grid.init();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const invalidateRowSpy = vi.spyOn(grid, 'invalidateAllRows');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[2].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(columnElms[0], 'offsetWidth', { writable: true, value: 40 });
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 9 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: -22 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[2], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      Object.defineProperty(columnElms[0], 'offsetWidth', { writable: true, value: 38 });
      document.body.dispatchEvent(bodyMouseUpEvent);

      vi.advanceTimersByTime(10);

      expect(invalidateRowSpy).toHaveBeenCalled();
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'age', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(80);
      expect(columns[1].width).toBe(40); // go over freezing column limit, assign offsetWidth found from column element
      expect(columns[2].width).toBe(59 - 40);
      expect(columns[3].width).toBe(88);
      expect(columns[4].width).toBe(80);
    });

    it('should resize 3rd column that has a "minWidth" with a frozen column that is greater than available columns', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: false, frozenColumn: 5, syncColumnCellResize: true });
      grid.init();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[2].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 9 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: -22 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[2], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);

      vi.advanceTimersByTime(10);

      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'age', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(80);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(59);
      expect(columns[3].width).toBe(88);
      expect(columns[4].width).toBe(80);
    });

    it('should resize 2nd column with forceFitColumns option enabled', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: true });
      grid.init();
      grid.autosizeColumns();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[1].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent1 = new CustomEvent('mousemove');
      const bodyMouseMoveEvent2 = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent1, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 74 });
      Object.defineProperty(columnElms[2], 'offsetWidth', { writable: true, value: 133 });
      Object.defineProperty(columnElms[3], 'offsetWidth', { writable: true, value: 198 });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 79 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent1, 'pageX', { writable: true, value: 78 });
      Object.defineProperty(bodyMouseMoveEvent2, 'pageX', { writable: true, value: 79 });
      Object.defineProperty(bodyMouseMoveEvent1, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent1);
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 75 });
      document.body.dispatchEvent(bodyMouseMoveEvent2);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[1], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'lastName', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(0);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(74);
      expect(columns[3].width).toBe(133);
      expect(columns[4].width).toBe(198);
    });

    it('should resize 2nd column with forceFitColumns and frozenColumn options enabled', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: true, frozenColumn: 1 });
      grid.init();
      grid.autosizeColumns();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[1].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent1 = new CustomEvent('mousemove');
      const bodyMouseMoveEvent2 = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent1, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 74 });
      Object.defineProperty(columnElms[2], 'offsetWidth', { writable: true, value: 133 });
      Object.defineProperty(columnElms[3], 'offsetWidth', { writable: true, value: 198 });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 70 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent1, 'pageX', { writable: true, value: 78 });
      Object.defineProperty(bodyMouseMoveEvent2, 'pageX', { writable: true, value: 72 });
      Object.defineProperty(bodyMouseMoveEvent1, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent1);
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 75 });
      document.body.dispatchEvent(bodyMouseMoveEvent2);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[1], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'lastName', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(0);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(76);
      expect(columns[3].width).toBe(131);
      expect(columns[4].width).toBe(198);
    });

    it('should resize 2nd column without forceFitColumns option', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: false });
      grid.init();
      grid.autosizeColumns();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[1].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent1 = new CustomEvent('mousemove');
      const bodyMouseMoveEvent2 = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent1, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 74 });
      Object.defineProperty(columnElms[2], 'offsetWidth', { writable: true, value: 133 });
      Object.defineProperty(columnElms[3], 'offsetWidth', { writable: true, value: 198 });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 79 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent1, 'pageX', { writable: true, value: 78 });
      Object.defineProperty(bodyMouseMoveEvent2, 'pageX', { writable: true, value: 79 });
      Object.defineProperty(bodyMouseMoveEvent1, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent1);
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 75 });
      document.body.dispatchEvent(bodyMouseMoveEvent2);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[1], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'lastName', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(0);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(74);
      expect(columns[3].width).toBe(88);
      expect(columns[4].width).toBeGreaterThanOrEqual(550);
      expect(columns[4].width).toBeLessThanOrEqual(552);
    });

    it('should resize 2nd column with forceFitColumns option enabled', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: true });
      grid.init();
      grid.autosizeColumns();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[1].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 74 });
      Object.defineProperty(columnElms[2], 'offsetWidth', { writable: true, value: 133 });
      Object.defineProperty(columnElms[3], 'offsetWidth', { writable: true, value: 198 });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 79 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: 78 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[1], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(columnElms[1].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'lastName', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(0);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(73);
      expect(columns[3].width).toBe(88);
      expect(columns[4].width).toBe(244);
    });

    it('should resize 3rd column with forceFitColumns option enabled', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: true });
      grid.init();
      grid.autosizeColumns();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[2].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 74 });
      Object.defineProperty(columnElms[2], 'offsetWidth', { writable: true, value: 133 });
      Object.defineProperty(columnElms[3], 'offsetWidth', { writable: true, value: 198 });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 79 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: 78 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[2], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'age', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(0);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(74);
      expect(columns[3].width).toBe(132);
      expect(columns[4].width).toBe(199);
    });

    it('should resize 3rd column with forceFitColumns option enabled with a frozen column', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: true, frozenColumn: 0 });
      grid.init();
      grid.autosizeColumns();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[2].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 74 });
      Object.defineProperty(columnElms[2], 'offsetWidth', { writable: true, value: 133 });
      Object.defineProperty(columnElms[3], 'offsetWidth', { writable: true, value: 198 });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 79 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: 78 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[2], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'age', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(0);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(74);
      expect(columns[3].width).toBe(132);
      expect(columns[4].width).toBe(199);
    });

    it('should resize 3rd column without forceFitColumns option but with a frozen column', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: false, frozenColumn: 0 });
      grid.init();
      grid.autosizeColumns();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const resizeHandleElm = columnElms[2].querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 74 });
      Object.defineProperty(columnElms[2], 'offsetWidth', { writable: true, value: 133 });
      Object.defineProperty(columnElms[3], 'offsetWidth', { writable: true, value: 198 });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 79 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: 78 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: columnElms[2], resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(columnElms[2].classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: 'age', grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(0);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(74);
      expect(columns[3].width).toBe(132);
      expect(columns[4].width).toBeGreaterThanOrEqual(550);
    });

    it('should resize 4th column with forceFitColumns option enabled and a column with maxWidth and a frozen column', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: true, frozenColumn: 0 });
      grid.init();
      grid.autosizeColumns();

      const onColumnsDragSpy = vi.spyOn(grid.onColumnsDrag, 'notify');
      const onColumnsResizedSpy = vi.spyOn(grid.onColumnsResized, 'notify');
      const columnElms = container.querySelectorAll('.slick-header-column');
      const column3 = columnElms[3 - 1]; // -1 because hidden column is removed from DOM
      const resizeHandleElm = column3.querySelector('.slick-resizable-handle') as HTMLDivElement;

      const cMouseDownEvent = new CustomEvent('mousedown');
      const bodyMouseMoveEvent = new CustomEvent('mousemove');
      const bodyMouseUpEvent = new CustomEvent('mouseup');
      Object.defineProperty(bodyMouseMoveEvent, 'target', { writable: true, value: resizeHandleElm });
      Object.defineProperty(columnElms[1], 'offsetWidth', { writable: true, value: 74 });
      Object.defineProperty(columnElms[2], 'offsetWidth', { writable: true, value: 133 });
      Object.defineProperty(columnElms[3], 'offsetWidth', { writable: true, value: 198 });
      Object.defineProperty(cMouseDownEvent, 'pageX', { writable: true, value: 79 });
      Object.defineProperty(cMouseDownEvent, 'pageY', { writable: true, value: 12 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageX', { writable: true, value: 78 });
      Object.defineProperty(bodyMouseMoveEvent, 'pageY', { writable: true, value: 13 });

      // start resizing
      resizeHandleElm.dispatchEvent(cMouseDownEvent);
      container.dispatchEvent(cMouseDownEvent);
      document.body.dispatchEvent(bodyMouseMoveEvent);
      expect(column3.classList.contains('slick-header-column-active')).toBeTruthy();
      expect(onColumnsDragSpy).toHaveBeenCalledWith({ triggeredByColumn: column3, resizeHandle: resizeHandleElm, grid }, expect.anything(), grid);

      // end resizing
      document.body.dispatchEvent(bodyMouseUpEvent);
      expect(column3.classList.contains('slick-header-column-active')).toBeFalsy();
      expect(onColumnsResizedSpy).toHaveBeenCalledWith({ triggeredByColumn: columns[3].id, grid }, expect.anything(), grid);
      expect(columns[0].width).toBe(0);
      expect(columns[1].width).toBe(0);
      expect(columns[2].width).toBe(74);
      expect(columns[3].width).toBe(132);
      expect(columns[4].width).toBe(199);
    });

    it('should expect the last column to never be resizable', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, forceFitColumns: true });
      grid.init();

      const columnElms = container.querySelectorAll('.slick-header-column');
      const column4 = columnElms[4 - 1]; // -1 because hidden column is removed from DOM
      const resizeHandleElm = column4.querySelector('.slick-resizable-handle') as HTMLDivElement;

      expect(resizeHandleElm).toBeNull();
    });
  });

  describe('Sorting', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name', sortable: true },
      { id: 'lastName', field: 'lastName', name: 'Last Name', sortable: true },
      { id: 'age', field: 'age', name: 'Age', sortable: true },
    ] as Column[];

    it('should find a single sort icons to sorted column when calling setSortColumn() with a single column to sort ascending', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
      grid.setSortColumn('firstName', true);

      const sortIndicators = container.querySelectorAll('.slick-sort-indicator');
      const sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      const sortDescIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-desc');

      expect(sortIndicators.length).toBe(columns.length);
      expect(sortAscIndicators.length).toBe(1);
      expect(sortDescIndicators.length).toBe(0);
      expect(grid.getSortColumns()).toEqual([{ columnId: 'firstName', sortAsc: true }]);
    });

    it('should not trigger onBeforeSort when clicking on column resize handle', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, multiColumnSort: false });
      grid.setSortColumns([{ columnId: 'firstName', sortAsc: false }]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');

      const sortIndicators = container.querySelectorAll('.slick-sort-indicator');
      const sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      const sortDescIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-desc');
      const sortNumberedIndicators = container.querySelectorAll('.slick-sort-indicator-numbered');
      const sortedColElms = container.querySelectorAll('.slick-sort-indicator.slick-header-column-sorted');

      expect(sortIndicators.length).toBe(columns.length);
      expect(sortAscIndicators.length).toBe(0);
      expect(sortDescIndicators.length).toBe(1);
      expect(sortedColElms.length).toBe(0);
      expect(sortNumberedIndicators.length).toBe(0);
      expect(grid.getSortColumns()).toEqual([{ columnId: 'firstName', sortAsc: false }]);

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]') as HTMLDivElement;
      const firstResizeHandleElm = firstNameHeaderColumnElm.querySelector('.slick-resizable-handle');
      const click = new CustomEvent('click');
      Object.defineProperty(click, 'target', { writable: true, value: firstResizeHandleElm });
      firstColHeaderElm?.dispatchEvent(click);

      expect(onBeforeSortSpy).not.toHaveBeenCalled();
    });

    it('should not trigger onBeforeSort when clicking on slick-header-columns div', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, multiColumnSort: false });
      grid.setSortColumns([{ columnId: 'firstName', sortAsc: false }]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');

      const sortIndicators = container.querySelectorAll('.slick-sort-indicator');
      const sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      const sortDescIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-desc');
      const sortNumberedIndicators = container.querySelectorAll('.slick-sort-indicator-numbered');
      const sortedColElms = container.querySelectorAll('.slick-sort-indicator.slick-header-column-sorted');

      expect(sortIndicators.length).toBe(columns.length);
      expect(sortAscIndicators.length).toBe(0);
      expect(sortDescIndicators.length).toBe(1);
      expect(sortedColElms.length).toBe(0);
      expect(sortNumberedIndicators.length).toBe(0);
      expect(grid.getSortColumns()).toEqual([{ columnId: 'firstName', sortAsc: false }]);

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const click = new CustomEvent('click');
      firstColHeaderElm?.dispatchEvent(click);

      expect(onBeforeSortSpy).not.toHaveBeenCalled();
    });

    it('should not trigger onBeforeSort when an open editor commit fails', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, multiColumnSort: false });
      grid.setSortColumns([{ columnId: 'firstName', sortAsc: false }]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');
      vi.spyOn(grid.getEditorLock(), 'commitCurrentEdit').mockReturnValueOnce(false);

      const sortIndicators = container.querySelectorAll('.slick-sort-indicator');
      const sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      const sortDescIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-desc');
      const sortNumberedIndicators = container.querySelectorAll('.slick-sort-indicator-numbered');
      const sortedColElms = container.querySelectorAll('.slick-sort-indicator.slick-header-column-sorted');

      expect(sortIndicators.length).toBe(columns.length);
      expect(sortAscIndicators.length).toBe(0);
      expect(sortDescIndicators.length).toBe(1);
      expect(sortedColElms.length).toBe(0);
      expect(sortNumberedIndicators.length).toBe(0);
      expect(grid.getSortColumns()).toEqual([{ columnId: 'firstName', sortAsc: false }]);

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const click2 = new CustomEvent('click');
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]');
      Object.defineProperty(click2, 'target', { writable: true, value: firstNameHeaderColumnElm });
      firstColHeaderElm?.dispatchEvent(click2);

      expect(onBeforeSortSpy).not.toHaveBeenCalled();
    });

    it('should find a single sorted icons when calling setSortColumn() with a single col being sorted when multiSort is disabled', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, multiColumnSort: false });
      grid.setSortColumns([{ columnId: 'firstName', sortAsc: false }]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');

      const sortIndicators = container.querySelectorAll('.slick-sort-indicator');
      let sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      const sortDescIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-desc');
      const sortNumberedIndicators = container.querySelectorAll('.slick-sort-indicator-numbered');
      const sortedColElms = container.querySelectorAll('.slick-sort-indicator.slick-header-column-sorted');

      expect(sortIndicators.length).toBe(columns.length);
      expect(sortAscIndicators.length).toBe(0);
      expect(sortDescIndicators.length).toBe(1);
      expect(sortedColElms.length).toBe(0);
      expect(sortNumberedIndicators.length).toBe(0);
      expect(grid.getSortColumns()).toEqual([{ columnId: 'firstName', sortAsc: false }]);

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const click = new CustomEvent('click');
      firstColHeaderElm?.dispatchEvent(click);

      sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      expect(sortAscIndicators.length).toBe(0); // same because closest .slick-header-column not found

      const click2 = new CustomEvent('click');
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]');
      Object.defineProperty(click2, 'target', { writable: true, value: firstNameHeaderColumnElm });
      firstColHeaderElm?.dispatchEvent(click2);

      // clicking on firstName with legacy behavior
      expect(onBeforeSortSpy).toHaveBeenCalledTimes(1);
      expect(onBeforeSortSpy).toHaveBeenCalledWith(
        {
          grid,
          multiColumnSort: false,
          sortAsc: true,
          columnId: 'firstName',
          previousSortColumns: [{ columnId: 'firstName', sortAsc: true }],
          sortCol: columns[0],
        },
        click2,
        grid
      );
    });

    it('should find multiple sorted icons when calling setSortColumn() with 2 columns being sorted when multiSort is enabled', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, multiColumnSort: true, numberedMultiColumnSort: true });
      grid.setSortColumns([{ columnId: 'firstName', sortAsc: false }, { columnId: 'lastName' }]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');

      const sortIndicators = container.querySelectorAll('.slick-sort-indicator');
      let sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      const sortDescIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-desc');
      const sortNumberedIndicators = container.querySelectorAll('.slick-sort-indicator-numbered');
      const sortedColElms = container.querySelectorAll('.slick-sort-indicator.slick-header-column-sorted');

      expect(sortIndicators.length).toBe(columns.length);
      expect(sortAscIndicators.length).toBe(1);
      expect(sortDescIndicators.length).toBe(1);
      expect(sortedColElms.length).toBe(0);
      expect(sortNumberedIndicators[0]?.classList.contains('slick-sort-indicator-desc')).toBeTruthy();
      expect(sortNumberedIndicators[0]?.textContent).toBe('1');
      expect(sortNumberedIndicators[1]?.classList.contains('slick-sort-indicator-asc')).toBeTruthy();
      expect(sortNumberedIndicators[1]?.textContent).toBe('2');
      expect(grid.getSortColumns()).toEqual([
        { columnId: 'firstName', sortAsc: false },
        { columnId: 'lastName', sortAsc: true },
      ]);

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const click = new CustomEvent('click');
      firstColHeaderElm?.dispatchEvent(click);

      sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      expect(sortAscIndicators.length).toBe(1); // same because closest .slick-header-column not found

      const click2 = new CustomEvent('click');
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]');
      Object.defineProperty(click2, 'target', { writable: true, value: firstNameHeaderColumnElm });
      firstColHeaderElm?.dispatchEvent(click2);

      // clicking on firstName with legacy behavior
      expect(onBeforeSortSpy).toHaveBeenCalledWith(
        {
          grid,
          multiColumnSort: true,
          previousSortColumns: [
            { columnId: 'firstName', sortAsc: true },
            { columnId: 'lastName', sortAsc: true },
          ],
          sortCols: [{ columnId: 'firstName', sortAsc: true, sortCol: columns[0] }],
        },
        click2,
        grid
      );
    });

    it('should find multiple sorted icons numbered icons when calling setSortColumn() with 2 columns being sorted when multiSort and tristateMultiColumnSort are enabled', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, {
        ...defaultOptions,
        multiColumnSort: true,
        numberedMultiColumnSort: true,
        tristateMultiColumnSort: true,
      });
      grid.setSortColumns([{ columnId: 'firstName', sortAsc: false }, { columnId: 'lastName' }]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');

      let sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      const sortDescIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-desc');
      const sortIndicators = container.querySelectorAll('.slick-sort-indicator');
      const sortNumberedIndicators = container.querySelectorAll('.slick-sort-indicator-numbered');
      const sortedColElms = container.querySelectorAll('.slick-sort-indicator.slick-header-column-sorted');

      expect(sortIndicators.length).toBe(columns.length);
      expect(sortAscIndicators.length).toBe(1);
      expect(sortDescIndicators.length).toBe(1);
      expect(sortedColElms.length).toBe(0);
      expect(sortNumberedIndicators[0]?.classList.contains('slick-sort-indicator-desc')).toBeTruthy();
      expect(sortNumberedIndicators[0]?.textContent).toBe('1');
      expect(sortNumberedIndicators[1]?.classList.contains('slick-sort-indicator-asc')).toBeTruthy();
      expect(sortNumberedIndicators[1]?.textContent).toBe('2');
      expect(grid.getSortColumns()).toEqual([
        { columnId: 'firstName', sortAsc: false },
        { columnId: 'lastName', sortAsc: true },
      ]);

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const click = new CustomEvent('click');
      firstColHeaderElm?.dispatchEvent(click);

      sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      expect(sortAscIndicators.length).toBe(1); // same because closest .slick-header-column not found

      const click2 = new CustomEvent('click');
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]');
      Object.defineProperty(click2, 'target', { writable: true, value: firstNameHeaderColumnElm });
      firstColHeaderElm?.dispatchEvent(click2);

      // only left with lastName since firstName is now sorted ascending because of tristate
      expect(onBeforeSortSpy).toHaveBeenCalledWith(
        {
          grid,
          multiColumnSort: true,
          previousSortColumns: [
            { columnId: 'firstName', sortAsc: true },
            { columnId: 'lastName', sortAsc: true },
          ],
          sortCols: [{ columnId: 'lastName', sortAsc: true, sortCol: columns[1] }],
        },
        click2,
        grid
      );
    });

    it('should find multiple sorted icons with separate numbered icons when calling setSortColumn() with 2 columns being sorted when multiSort, tristateMultiColumnSort and sortColNumberInSeparateSpan are enabled', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, {
        ...defaultOptions,
        multiColumnSort: true,
        numberedMultiColumnSort: true,
        tristateMultiColumnSort: true,
        sortColNumberInSeparateSpan: true,
      });
      grid.setSortColumns([{ columnId: 'firstName', sortAsc: false }, { columnId: 'lastName' }]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');

      let sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      const sortDescIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-desc');
      const sortIndicators = container.querySelectorAll('.slick-sort-indicator');
      const sortNumberedIndicators = container.querySelectorAll('.slick-sort-indicator-numbered');
      const sortedColElms = container.querySelectorAll('.slick-sort-indicator.slick-header-column-sorted');

      expect(sortIndicators.length).toBe(columns.length);
      expect(sortAscIndicators.length).toBe(1);
      expect(sortDescIndicators.length).toBe(1);
      expect(sortedColElms.length).toBe(0);
      expect(sortIndicators[0]?.classList.contains('slick-sort-indicator-desc')).toBeTruthy();
      expect(sortNumberedIndicators[0]?.textContent).toBe('1');
      expect(sortIndicators[1]?.classList.contains('slick-sort-indicator-asc')).toBeTruthy();
      expect(sortNumberedIndicators[1]?.textContent).toBe('2');
      expect(grid.getSortColumns()).toEqual([
        { columnId: 'firstName', sortAsc: false },
        { columnId: 'lastName', sortAsc: true },
      ]);

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const click = new CustomEvent('click');
      firstColHeaderElm?.dispatchEvent(click);

      sortAscIndicators = container.querySelectorAll('.slick-sort-indicator.slick-sort-indicator-asc');
      expect(sortAscIndicators.length).toBe(1); // same because closest .slick-header-column not found

      const click2 = new CustomEvent('click');
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]');
      Object.defineProperty(click2, 'target', { writable: true, value: firstNameHeaderColumnElm });
      firstColHeaderElm?.dispatchEvent(click2);

      // only left with lastName since firstName is now sorted ascending because of tristate
      expect(onBeforeSortSpy).toHaveBeenCalledWith(
        {
          grid,
          multiColumnSort: true,
          previousSortColumns: [
            { columnId: 'firstName', sortAsc: true },
            { columnId: 'lastName', sortAsc: true },
          ],
          sortCols: [{ columnId: 'lastName', sortAsc: true, sortCol: columns[1] }],
        },
        click2,
        grid
      );
    });

    it('should remove current sort when the sorting is triggered and tristateMultiColumnSort is enabled but multiColumnSort is disabled', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, {
        ...defaultOptions,
        multiColumnSort: false,
        numberedMultiColumnSort: true,
        tristateMultiColumnSort: true,
      });
      grid.setSortColumns([{ columnId: 'firstName', sortAsc: false }, { columnId: 'lastName' }]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const colClick = new CustomEvent('click');
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]');
      Object.defineProperty(colClick, 'target', { writable: true, value: firstNameHeaderColumnElm });
      firstColHeaderElm?.dispatchEvent(colClick);

      // only left with lastName since firstName is now sorted ascending because of tristate
      expect(onBeforeSortSpy).toHaveBeenCalledWith(
        {
          grid,
          multiColumnSort: false,
          previousSortColumns: [
            { columnId: 'firstName', sortAsc: true },
            { columnId: 'lastName', sortAsc: true },
          ],
          columnId: null,
          sortAsc: true,
          sortCol: null,
        },
        colClick,
        grid
      );
    });

    it('should sort by firstName when no previous sort exist and we triggered with tristateMultiColumnSort enabled but multiColumnSort is disabled', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, {
        ...defaultOptions,
        multiColumnSort: false,
        numberedMultiColumnSort: true,
        tristateMultiColumnSort: true,
      });
      grid.setSortColumns([]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const click = new CustomEvent('click');
      firstColHeaderElm?.dispatchEvent(click);

      const colClick = new CustomEvent('click');
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]');
      Object.defineProperty(colClick, 'target', { writable: true, value: firstNameHeaderColumnElm });
      firstColHeaderElm?.dispatchEvent(colClick);

      expect(onBeforeSortSpy).toHaveBeenCalledWith(
        {
          grid,
          multiColumnSort: false,
          previousSortColumns: [],
          columnId: 'firstName',
          sortAsc: true,
          sortCol: columns[0],
        },
        colClick,
        grid
      );
    });

    it('should sort by firstName when no previous sort exist and we triggered with tristateMultiColumnSort & multiColumnSort both disabled', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, {
        ...defaultOptions,
        multiColumnSort: false,
        numberedMultiColumnSort: true,
        tristateMultiColumnSort: false,
      });
      grid.setSortColumns([]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');

      const firstColHeaderElm = container.querySelector('.slick-header-columns');
      const click = new CustomEvent('click');
      firstColHeaderElm?.dispatchEvent(click);

      const colClick = new CustomEvent('click');
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]');
      Object.defineProperty(colClick, 'target', { writable: true, value: firstNameHeaderColumnElm });
      firstColHeaderElm?.dispatchEvent(colClick);

      expect(onBeforeSortSpy).toHaveBeenCalledWith(
        {
          grid,
          multiColumnSort: false,
          previousSortColumns: [],
          columnId: 'firstName',
          sortAsc: true,
          sortCol: columns[0],
        },
        colClick,
        grid
      );
    });

    it('should remove all sorting when multiSort is enabled and we clicked column with a metaKey (Ctrl/Win)', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, multiColumnSort: true });
      grid.setSortColumns([{ columnId: 'firstName', sortAsc: false }]);
      const onBeforeSortSpy = vi.spyOn(grid.onBeforeSort, 'notify');
      const firstColHeaderElm = container.querySelector('.slick-header-columns');

      const click2 = new CustomEvent('click');
      Object.defineProperty(click2, 'metaKey', { writable: true, value: true });
      const firstNameHeaderColumnElm = container.querySelector('.slick-header-column[data-id=firstName]');
      Object.defineProperty(click2, 'target', { writable: true, value: firstNameHeaderColumnElm });
      firstColHeaderElm?.dispatchEvent(click2);

      // clicking on firstName with legacy behavior
      expect(onBeforeSortSpy).toHaveBeenCalledTimes(1);
      expect(onBeforeSortSpy).toHaveBeenCalledWith(
        {
          grid,
          multiColumnSort: true,
          previousSortColumns: [{ columnId: 'firstName', sortAsc: true }],
          sortCols: [],
        },
        click2,
        grid
      );
    });
  });

  describe('Scrolling', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name', sortable: true },
      { id: 'lastName', field: 'lastName', name: 'Last Name', sortable: true },
      { id: 'age', field: 'age', name: 'Age', sortable: true },
    ] as Column[];
    const data = [
      { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
      { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
    ];

    it('should not scroll when calling scrollCellIntoView() with same position to frozen column', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenColumn: 1 });
      const renderSpy = vi.spyOn(grid, 'render');
      grid.scrollCellIntoView(1, 1, true);

      expect(renderSpy).toHaveBeenCalledTimes(1); // 1x by the grid initialization
    });

    it('should scroll when calling scrollCellIntoView() with lower position than frozen column', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenColumn: 0 });
      const renderSpy = vi.spyOn(grid, 'render');
      grid.scrollCellIntoView(1, 1, true);

      expect(renderSpy).toHaveBeenCalledTimes(3);
    });

    it('should scroll when calling scrollCellIntoView() with row having colspan returned from DataView getItemMetadata()', () => {
      const columnsCopy = [...columns];
      columnsCopy[1].colspan = '*';
      columnsCopy[2].colspan = '1';
      const dv = new SlickDataView();
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, frozenColumn: 0, enableMouseWheelScrollHandler: true });
      vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ columns: { lastName: { colspan: '*' } } } as any);
      const renderSpy = vi.spyOn(grid, 'render');
      grid.scrollCellIntoView(1, 1, true);
      grid.scrollCellIntoView(1, 2, true);

      expect(renderSpy).toHaveBeenCalledTimes(6);
    });

    it('should call scrollColumnIntoView() and expect left scroll to become 80 which is default column width', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenColumn: 0 });
      let viewportElm = container.querySelector('.slick-viewport-top.slick-viewport-right') as HTMLDivElement;
      Object.defineProperty(viewportElm, 'scrollLeft', { writable: true, value: 20 });
      Object.defineProperty(viewportElm, 'scrollWidth', { writable: true, value: 10 });
      viewportElm.dispatchEvent(new CustomEvent('scroll'));
      const renderSpy = vi.spyOn(grid, 'render');
      grid.scrollColumnIntoView(2);
      viewportElm = container.querySelector('.slick-viewport-top.slick-viewport-right') as HTMLDivElement;

      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(viewportElm.scrollLeft).toBe(80);
    });

    it('should call scrollColumnIntoView() and expect left scroll to be lower than scrollLeft and become 0', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenColumn: 0 });
      let viewportElm = container.querySelector('.slick-viewport-top.slick-viewport-right') as HTMLDivElement;
      Object.defineProperty(viewportElm, 'scrollLeft', { writable: true, value: 10 });
      Object.defineProperty(viewportElm, 'scrollWidth', { writable: true, value: 20 });
      viewportElm.dispatchEvent(new CustomEvent('scroll'));
      const renderSpy = vi.spyOn(grid, 'render');
      grid.scrollColumnIntoView(1);
      viewportElm = container.querySelector('.slick-viewport-top.slick-viewport-right') as HTMLDivElement;

      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(viewportElm.scrollLeft).toBe(0);
    });

    it('should scroll all elements shown when triggered by mousewheel and topHeader is enabled', () => {
      const dv = new SlickDataView();
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, {
        ...defaultOptions,
        enableMouseWheelScrollHandler: true,
        createTopHeaderPanel: true,
      });
      grid.setOptions({ enableMouseWheelScrollHandler: false });
      grid.setOptions({ enableMouseWheelScrollHandler: true });
      grid.scrollCellIntoView(1, 2, true);

      const mouseEvent = new Event('mousewheel');
      const mousePreventSpy = vi.spyOn(mouseEvent, 'preventDefault');
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      Object.defineProperty(viewportTopLeftElm, 'scrollHeight', { writable: true, value: DEFAULT_GRID_HEIGHT });
      Object.defineProperty(viewportTopLeftElm, 'scrollWidth', { writable: true, value: DEFAULT_GRID_WIDTH });
      Object.defineProperty(viewportTopLeftElm, 'clientHeight', { writable: true, value: 125 });
      Object.defineProperty(viewportTopLeftElm, 'clientWidth', { writable: true, value: 75 });

      const viewportLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      const topHeaderElm = container.querySelector('.slick-topheader-panel') as HTMLDivElement;
      Object.defineProperty(viewportLeftElm, 'scrollLeft', { writable: true, value: 88 });
      viewportLeftElm.dispatchEvent(mouseEvent);

      expect(topHeaderElm.scrollLeft).toBe(88);
      expect(viewportLeftElm.scrollLeft).toBe(88);
      expect(viewportLeftElm.scrollTop).toBe(25);
      expect(viewportTopLeftElm.scrollTop).toBe(25);
      expect(onViewportChangedSpy).toHaveBeenCalled();
      expect(mousePreventSpy).toHaveBeenCalled();
    });

    it('should scroll all elements shown when triggered by mousewheel and preHeader/footer are enabled and without any Frozen rows/columns', () => {
      const dv = new SlickDataView();
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, {
        ...defaultOptions,
        enableMouseWheelScrollHandler: true,
        createFooterRow: true,
        createPreHeaderPanel: true,
      });
      grid.setOptions({ enableMouseWheelScrollHandler: false });
      grid.setOptions({ enableMouseWheelScrollHandler: true });
      grid.scrollCellIntoView(1, 2, true);

      const mouseEvent = new Event('mousewheel');
      Object.defineProperty(mouseEvent, 'shiftKey', { writable: true, value: true });
      const mousePreventSpy = vi.spyOn(mouseEvent, 'preventDefault');
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      Object.defineProperty(viewportTopLeftElm, 'scrollHeight', { writable: true, value: DEFAULT_GRID_HEIGHT });
      Object.defineProperty(viewportTopLeftElm, 'scrollWidth', { writable: true, value: DEFAULT_GRID_WIDTH });
      Object.defineProperty(viewportTopLeftElm, 'clientHeight', { writable: true, value: 125 });
      Object.defineProperty(viewportTopLeftElm, 'clientWidth', { writable: true, value: 75 });

      const viewportLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      const preHeaderElm = container.querySelectorAll('.slick-preheader-panel');
      const footerRowElm = container.querySelectorAll('.slick-footerrow');
      Object.defineProperty(viewportLeftElm, 'scrollLeft', { writable: true, value: 88 });
      viewportLeftElm.dispatchEvent(mouseEvent);

      expect(preHeaderElm[1].scrollLeft).toBe(0);
      expect(footerRowElm[1].scrollLeft).toBe(0);
      expect(viewportLeftElm.scrollLeft).toBe(88);
      expect(viewportLeftElm.scrollTop).toBe(25);
      expect(viewportTopLeftElm.scrollTop).toBe(25);
      expect(onViewportChangedSpy).toHaveBeenCalled();
      expect(mousePreventSpy).toHaveBeenCalled();
    });

    it('should scroll all elements shown when triggered by mousewheel and preHeader/footer are enabled and without any Frozen rows/columns', () => {
      const dv = new SlickDataView();
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, {
        ...defaultOptions,
        enableMouseWheelScrollHandler: true,
        createFooterRow: true,
        createPreHeaderPanel: true,
      });
      grid.scrollCellIntoView(1, 2, true);

      const mouseEvent = new Event('mousewheel');
      const mousePreventSpy = vi.spyOn(mouseEvent, 'preventDefault');
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      Object.defineProperty(viewportTopLeftElm, 'scrollHeight', { writable: true, value: DEFAULT_GRID_HEIGHT });
      Object.defineProperty(viewportTopLeftElm, 'scrollWidth', { writable: true, value: DEFAULT_GRID_WIDTH });
      Object.defineProperty(viewportTopLeftElm, 'clientHeight', { writable: true, value: 125 });
      Object.defineProperty(viewportTopLeftElm, 'clientWidth', { writable: true, value: 75 });

      const viewportLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      const preHeaderElm = container.querySelectorAll('.slick-preheader-panel');
      const footerRowElm = container.querySelectorAll('.slick-footerrow');
      Object.defineProperty(viewportLeftElm, 'scrollLeft', { writable: true, value: 88 });
      viewportLeftElm.dispatchEvent(mouseEvent);

      expect(preHeaderElm[1].scrollLeft).toBe(0);
      expect(footerRowElm[1].scrollLeft).toBe(0);
      expect(viewportLeftElm.scrollLeft).toBe(88);
      expect(viewportLeftElm.scrollTop).toBe(25);
      expect(viewportTopLeftElm.scrollTop).toBe(25);
      expect(onViewportChangedSpy).toHaveBeenCalled();
      expect(mousePreventSpy).toHaveBeenCalled();
    });

    it('should scroll all elements shown when triggered by mousewheel and preHeader/footer/frozenColumn are enabled', () => {
      const dv = new SlickDataView();
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, {
        ...defaultOptions,
        frozenColumn: 0,
        enableMouseWheelScrollHandler: true,
        createFooterRow: true,
        createPreHeaderPanel: true,
      });
      grid.scrollCellIntoView(1, 2, true);

      const mouseEvent = new Event('mousewheel');
      const mousePreventSpy = vi.spyOn(mouseEvent, 'preventDefault');
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopRightElm = container.querySelector('.slick-viewport-top.slick-viewport-right') as HTMLDivElement;
      Object.defineProperty(viewportTopRightElm, 'scrollHeight', { writable: true, value: DEFAULT_GRID_HEIGHT });
      Object.defineProperty(viewportTopRightElm, 'scrollWidth', { writable: true, value: DEFAULT_GRID_WIDTH });
      Object.defineProperty(viewportTopRightElm, 'clientHeight', { writable: true, value: 125 });
      Object.defineProperty(viewportTopRightElm, 'clientWidth', { writable: true, value: 75 });

      const viewportLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      const preHeaderElm = container.querySelectorAll('.slick-preheader-panel');
      const footerRowElm = container.querySelectorAll('.slick-footerrow');
      Object.defineProperty(viewportLeftElm, 'scrollLeft', { writable: true, value: 88 });
      viewportLeftElm.dispatchEvent(mouseEvent);

      expect(preHeaderElm[1].scrollLeft).toBe(80);
      expect(footerRowElm[1].scrollLeft).toBe(80);
      expect(viewportLeftElm.scrollLeft).toBe(88);
      expect(viewportLeftElm.scrollTop).toBe(25);
      expect(viewportTopRightElm.scrollTop).toBe(25);
      expect(onViewportChangedSpy).toHaveBeenCalled();
      expect(mousePreventSpy).toHaveBeenCalled();
    });

    it('should scroll all elements shown when triggered by mousewheel and preHeader/footer/frozenRow are enabled', () => {
      container.style.height = '25px';
      const dv = new SlickDataView();
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, {
        ...defaultOptions,
        frozenRow: 0,
        enableMouseWheelScrollHandler: true,
        createFooterRow: true,
        createPreHeaderPanel: true,
      });
      grid.scrollCellIntoView(1, 2, true);

      const mouseEvent = new Event('mousewheel');
      const mousePreventSpy = vi.spyOn(mouseEvent, 'preventDefault');
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      const viewportBottomRightElm = container.querySelector('.slick-viewport-bottom.slick-viewport-left') as HTMLDivElement;
      Object.defineProperty(viewportBottomRightElm, 'scrollHeight', { writable: true, value: 25 });
      Object.defineProperty(viewportBottomRightElm, 'scrollWidth', { writable: true, value: DEFAULT_GRID_WIDTH });
      Object.defineProperty(viewportBottomRightElm, 'clientHeight', { writable: true, value: 125 });
      Object.defineProperty(viewportBottomRightElm, 'clientWidth', { writable: true, value: 75 });

      const viewportLeftElm = container.querySelector('.slick-viewport-bottom.slick-viewport-left') as HTMLDivElement;
      const preHeaderElm = container.querySelectorAll('.slick-preheader-panel');
      const footerRowElm = container.querySelectorAll('.slick-footerrow');
      Object.defineProperty(viewportLeftElm, 'scrollLeft', { writable: true, value: 88 });
      viewportLeftElm.dispatchEvent(mouseEvent);

      expect(viewportTopLeftElm.scrollLeft).toBe(88);
      expect(preHeaderElm[0].scrollLeft).toBe(88);
      expect(footerRowElm[0].scrollLeft).toBe(88);
      expect(viewportLeftElm.scrollLeft).toBe(88);
      expect(viewportLeftElm.scrollTop).toBe(25);
      expect(viewportBottomRightElm.scrollTop).toBe(25);
      expect(onViewportChangedSpy).toHaveBeenCalled();
      expect(mousePreventSpy).toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      viewportLeftElm.dispatchEvent(mouseEvent);
    });

    it('should scroll all elements shown when triggered by mousewheel and preHeader/footer/frozenRow are enabled', () => {
      container.style.height = '50px';
      container.style.width = '88px';
      const dv = new SlickDataView();
      dv.setItems([data[0]]);
      grid = new SlickGrid<any, Column>(container, dv, columns, {
        ...defaultOptions,
        frozenRow: 0,
        enableMouseWheelScrollHandler: true,
        createFooterRow: true,
        createPreHeaderPanel: true,
        rowHeight: 50,
      });
      let viewportBottomLeftElm = container.querySelector('.slick-viewport-bottom.slick-viewport-left') as HTMLDivElement;
      Object.defineProperty(viewportBottomLeftElm, 'scrollTop', { writable: true, value: 50 });
      grid.scrollCellIntoView(1, 2, true);

      const mouseEvent = new Event('mousewheel');
      const mousePreventSpy = vi.spyOn(mouseEvent, 'preventDefault');
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      viewportBottomLeftElm = container.querySelector('.slick-viewport-bottom.slick-viewport-left') as HTMLDivElement;
      Object.defineProperty(viewportBottomLeftElm, 'scrollHeight', { writable: true, value: 50 });
      Object.defineProperty(viewportBottomLeftElm, 'scrollWidth', { writable: true, value: DEFAULT_GRID_WIDTH });
      Object.defineProperty(viewportBottomLeftElm, 'clientHeight', { writable: true, value: 125 });
      Object.defineProperty(viewportBottomLeftElm, 'clientWidth', { writable: true, value: 75 });

      // let viewportLeftElm = container.querySelector('.slick-viewport-bottom.slick-viewport-left') as HTMLDivElement;
      const preHeaderElm = container.querySelectorAll('.slick-preheader-panel');
      const footerRowElm = container.querySelectorAll('.slick-footerrow');
      Object.defineProperty(viewportBottomLeftElm, 'scrollLeft', { writable: true, value: 88 });
      viewportBottomLeftElm.dispatchEvent(mouseEvent);

      expect(viewportTopLeftElm.scrollLeft).toBe(88);
      expect(preHeaderElm[0].scrollLeft).toBe(88);
      expect(footerRowElm[0].scrollLeft).toBe(88);
      expect(viewportBottomLeftElm.scrollLeft).toBe(88);
      expect(viewportBottomLeftElm.scrollTop).toBe(50);
      expect(viewportBottomLeftElm.scrollTop).toBe(50);
      expect(onViewportChangedSpy).toHaveBeenCalled();
      expect(mousePreventSpy).toHaveBeenCalled();
    });

    it('should scroll all elements shown when triggered by mousewheel and preHeader/footer/frozenColumn/frozenRow are enabled', () => {
      const dv = new SlickDataView();
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, {
        ...defaultOptions,
        frozenColumn: 0,
        frozenRow: 1,
        enableMouseWheelScrollHandler: true,
        createFooterRow: true,
        createPreHeaderPanel: true,
      });
      grid.scrollCellIntoView(1, 2, true);

      const mouseEvent = new Event('mousewheel');
      const mousePreventSpy = vi.spyOn(mouseEvent, 'preventDefault');
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportBottomRightElm = container.querySelector('.slick-viewport-bottom.slick-viewport-right') as HTMLDivElement;
      Object.defineProperty(viewportBottomRightElm, 'scrollHeight', { writable: true, value: DEFAULT_GRID_HEIGHT });
      Object.defineProperty(viewportBottomRightElm, 'scrollWidth', { writable: true, value: DEFAULT_GRID_WIDTH });
      Object.defineProperty(viewportBottomRightElm, 'clientHeight', { writable: true, value: 125 });
      Object.defineProperty(viewportBottomRightElm, 'clientWidth', { writable: true, value: 75 });

      const viewportLeftElm = container.querySelector('.slick-viewport-bottom.slick-viewport-left') as HTMLDivElement;
      const preHeaderElm = container.querySelectorAll('.slick-preheader-panel');
      const footerRowElm = container.querySelectorAll('.slick-footerrow');
      Object.defineProperty(viewportLeftElm, 'scrollLeft', { writable: true, value: 88 });
      viewportLeftElm.dispatchEvent(mouseEvent);

      expect(preHeaderElm[1].scrollLeft).toBe(80);
      expect(footerRowElm[1].scrollLeft).toBe(80);
      expect(viewportLeftElm.scrollLeft).toBe(88);
      expect(viewportLeftElm.scrollTop).toBe(0);
      expect(viewportBottomRightElm.scrollTop).toBe(0);
      expect(onViewportChangedSpy).toHaveBeenCalled();
      expect(mousePreventSpy).toHaveBeenCalled();
    });

    it('should scroll all elements shown when triggered by mousewheel and preHeader/footer/frozenColumn are enabled', () => {
      const dv = new SlickDataView();
      dv.setItems(data);
      grid = new SlickGrid<any, Column>(container, dv, columns, {
        ...defaultOptions,
        frozenColumn: 0,
        frozenRow: 0,
        enableMouseWheelScrollHandler: true,
        createFooterRow: true,
        createPreHeaderPanel: true,
      });
      grid.scrollCellIntoView(1, 2, true);

      const mouseEvent = new Event('mousewheel');
      const mousePreventSpy = vi.spyOn(mouseEvent, 'preventDefault');
      const onViewportChangedSpy = vi.spyOn(grid.onViewportChanged, 'notify');
      const viewportTopRightElm = container.querySelector('.slick-viewport-top.slick-viewport-right') as HTMLDivElement;
      Object.defineProperty(viewportTopRightElm, 'scrollHeight', { writable: true, value: DEFAULT_GRID_HEIGHT });
      Object.defineProperty(viewportTopRightElm, 'scrollWidth', { writable: true, value: DEFAULT_GRID_WIDTH });
      Object.defineProperty(viewportTopRightElm, 'clientHeight', { writable: true, value: 125 });
      Object.defineProperty(viewportTopRightElm, 'clientWidth', { writable: true, value: 75 });

      const viewportLeftElm = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
      const preHeaderElm = container.querySelectorAll('.slick-preheader-panel');
      const footerRowElm = container.querySelectorAll('.slick-footerrow');
      Object.defineProperty(viewportLeftElm, 'scrollLeft', { writable: true, value: 88 });
      viewportLeftElm.dispatchEvent(mouseEvent);

      expect(preHeaderElm[1].scrollLeft).toBe(0);
      expect(footerRowElm[1].scrollLeft).toBe(0);
      expect(viewportLeftElm.scrollLeft).toBe(88);
      expect(viewportLeftElm.scrollTop).toBe(25);
      expect(viewportTopRightElm.scrollTop).toBe(0);
      expect(onViewportChangedSpy).not.toHaveBeenCalled();
      expect(mousePreventSpy).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name', sortable: true },
      { id: 'lastName', field: 'lastName', name: 'Last Name', sortable: true },
      { id: 'age', field: 'age', name: 'Age', sortable: true },
    ] as Column[];
    const data = [
      { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
      { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
    ];

    it('should scroll to defined row position when calling scrollRowToTop()', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenRow: 0 });
      const scrollToSpy = vi.spyOn(grid, 'scrollTo');
      const renderSpy = vi.spyOn(grid, 'render');

      grid.scrollRowToTop(2);

      expect(scrollToSpy).toHaveBeenCalledWith(2 * DEFAULT_COLUMN_HEIGHT); // default rowHeight: 25
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should do page up when calling scrollRowIntoView() and we are further than row index that we want to scroll to', () => {
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, frozenRow: 0 });
      const scrollToSpy = vi.spyOn(grid, 'scrollTo');
      const renderSpy = vi.spyOn(grid, 'render');

      grid.scrollRowToTop(2);
      grid.updatePagingStatusFromView({ pageNum: 0, pageSize: 10, totalPages: 2 });
      grid.scrollRowIntoView(1, true);

      expect(scrollToSpy).toHaveBeenCalledWith(2 * DEFAULT_COLUMN_HEIGHT); // default rowHeight: 25
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should do nothing when trying to navigateTop when the dataset is empty', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, defaultOptions);
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      grid.navigateTop();

      expect(scrollCellSpy).not.toHaveBeenCalled();
    });

    it('should scroll when calling to navigateTop with dataset', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const resetCellSpy = vi.spyOn(grid, 'resetActiveCell');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveRow(0, 0);
      grid.navigateTop();

      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, true);
      expect(resetCellSpy).toHaveBeenCalled();
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll when calling to navigateBottom with dataset', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const resetCellSpy = vi.spyOn(grid, 'resetActiveCell');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      const scrollToSpy = vi.spyOn(grid, 'scrollTo');
      grid.setActiveRow(0, 0);
      grid.navigateBottom();

      expect(scrollCellSpy).toHaveBeenCalledWith(data.length - 1, 0, true);
      expect(scrollToSpy).toHaveBeenCalledWith(DEFAULT_COLUMN_HEIGHT);
      expect(resetCellSpy).toHaveBeenCalled();
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll when calling to navigateBottom with dataset and rowspan', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true, enableCellRowSpan: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const resetCellSpy = vi.spyOn(grid, 'resetActiveCell');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      const scrollToSpy = vi.spyOn(grid, 'scrollTo');
      const setActiveRowSpy = vi.spyOn(grid, 'setActiveRow');
      grid.setActiveRow(0, 0);
      grid.navigateBottom();

      expect(scrollCellSpy).toHaveBeenCalledWith(data.length - 1, 0, true);
      expect(scrollToSpy).toHaveBeenCalledWith(DEFAULT_COLUMN_HEIGHT);
      expect(resetCellSpy).toHaveBeenCalled();
      expect(onActiveCellSpy).toHaveBeenCalled();
      expect(setActiveRowSpy).toHaveBeenCalled();
    });

    it('should navigate to left then bottom and expect active cell to change with previous cell position that was activated by the left navigation', () => {
      const data = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const resetCellSpy = vi.spyOn(grid, 'resetActiveCell');
      const canCellActiveSpy = vi.spyOn(grid, 'canCellBeActive');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      const scrollToSpy = vi.spyOn(grid, 'scrollTo');
      grid.setActiveCell(0, 1);
      grid.navigateLeft();
      grid.navigateBottom();

      expect(scrollCellSpy).toHaveBeenCalledWith(data.length - 1, 0, true);
      expect(scrollToSpy).toHaveBeenCalledWith(DEFAULT_COLUMN_HEIGHT);
      expect(canCellActiveSpy).toHaveBeenCalledTimes(3);
      expect(resetCellSpy).not.toHaveBeenCalled();
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should add rowspan, then navigate to all possible sides', () => {
      const data = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28 },
      ];
      const metadata = {
        0: { columns: { 0: { colspan: 2, rowspan: 2 } } },
        3: { columns: { 1: { colspan: 2, rowspan: 3 } } },
      };
      const customDV = { getItemMetadata: (row) => metadata[row], getLength: () => 2, getItem: (i) => data[i], getItems: () => data } as CustomDataView;
      grid = new SlickGrid<any, Column>('#myGrid', customDV, columns, { ...defaultOptions, editable: true, enableCellRowSpan: true });
      grid.setActiveCell(0, 1);
      grid.navigateBottomEnd();
      grid.navigatePrev();

      grid.setActiveCell(0, 3);
      grid.navigateUp();
      grid.navigateBottomEnd();
      expect(grid.navigateNext()).toBe(true);
      expect(grid.navigatePrev()).toBe(true);
      expect(grid.navigatePrev()).toBe(true);
      expect(grid.navigateRowStart()).toBe(true);
      expect(grid.navigateRowEnd()).toBe(true);
      expect(grid.navigateNext()).toBe(true);
      expect(grid.navigateNext()).toBe(true);
      expect(grid.navigateDown()).toBe(true);
    });

    it('should navigate to left then page down and expect active cell to change with previous cell position that was activated by the left navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const resetCellSpy = vi.spyOn(grid, 'resetActiveCell');
      const canCellActiveSpy = vi.spyOn(grid, 'canCellBeActive');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      const scrollToSpy = vi.spyOn(grid, 'scrollTo');
      grid.setActiveCell(0, 1);
      grid.navigateLeft();
      grid.navigatePageDown();

      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, true);
      expect(scrollToSpy).toHaveBeenCalledWith(DEFAULT_COLUMN_HEIGHT);
      expect(canCellActiveSpy).toHaveBeenCalledTimes(3);
      expect(resetCellSpy).not.toHaveBeenCalled();
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll when calling to navigatePageDown with dataset', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      const scrollToSpy = vi.spyOn(grid, 'scrollTo');
      const renderSpy = vi.spyOn(grid, 'render');
      grid.setActiveRow(0, 0);
      grid.navigatePageDown();

      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, false);
      expect(scrollToSpy).toHaveBeenCalledWith(600);
      expect(renderSpy).toHaveBeenCalled();
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll when calling to navigatePageUp with dataset', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      const scrollToSpy = vi.spyOn(grid, 'scrollTo');
      const renderSpy = vi.spyOn(grid, 'render');
      grid.setActiveRow(0, 0);
      grid.navigatePageUp();

      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, false);
      expect(scrollToSpy).toHaveBeenCalledWith(-600);
      expect(renderSpy).toHaveBeenCalled();
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should return false when trying to scroll to left but enableCellNavigation is disabled', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: false });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 0);
      const result = grid.navigateLeft();

      expect(result).toBe(false);
      expect(grid.getActiveCellNode()).toBeFalsy();
      expect(scrollCellSpy).not.toHaveBeenCalled();
      expect(onActiveCellSpy).not.toHaveBeenCalled();
    });

    it('should try to scroll to left but return false cell is already at column index 0 and cannot go further', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 0);
      const result = grid.navigateLeft();

      expect(result).toBe(false);
      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll to left but return false when calling navigateLeft but cannot find first focusable cell', () => {
      const data = [{ id: 0, firstName: 'John' }];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'canCellBeActive').mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(false);
      grid.setActiveCell(0, 2);
      grid.navigateLeft();

      expect(scrollCellSpy).toHaveBeenCalledWith(0, 2, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll to left and return true when calling navigateLeft with valid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 1);
      const result = grid.navigateLeft();

      expect(result).toBe(true);
      expect(grid.getGridPosition()).toMatchObject({ left: 0 });
      expect(grid.getActiveCellPosition()).toMatchObject({ left: 0 });
      expect(grid.getActiveCellNode()).toBeTruthy();
      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, true);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll to left and return true but stay at same cell column when calling navigateLeft with an active editor', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      vi.spyOn(grid.getEditorLock(), 'commitCurrentEdit').mockReturnValueOnce(false);
      grid.setActiveCell(0, 1);
      const result = grid.navigateLeft();

      expect(result).toBe(true);
    });

    it('should scroll to right but return false when calling navigateRight but cannot go further', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 2);
      const result = grid.navigateRight();

      expect(result).toBe(false);
      expect(scrollCellSpy).toHaveBeenCalledWith(0, 2, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll to right and return true when calling navigateRight with valid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 1);
      grid.navigateRight();

      expect(scrollCellSpy).toHaveBeenCalledWith(0, 2, true);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate left but return false when calling navigateLeft and nothing is available on the left & right with frozenRow/frozenBottom', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true, frozenRow: 2, frozenBottom: true });
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(2, 1);
      // @ts-ignore
      vi.spyOn(grid, 'gotoRight').mockReturnValueOnce(null);
      const result = grid.navigateLeft();

      expect(result).toBe(false);
      expect(scrollCellSpy).toHaveBeenCalledWith(2, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate left but return false when calling navigateLeft and nothing is available on the left & right with frozenRow', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true, frozenRow: 2, frozenBottom: false });
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(2, 1);
      // @ts-ignore
      vi.spyOn(grid, 'gotoRight').mockReturnValueOnce(null);
      const result = grid.navigateLeft();

      expect(result).toBe(false);
      expect(scrollCellSpy).toHaveBeenCalledWith(2, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate left and return true when calling navigateLeft and only right is available', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true, frozenRow: 2, frozenBottom: true });
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(2, 1);
      // @ts-ignore
      vi.spyOn(grid, 'gotoRight').mockReturnValueOnce({ cell: 0, posX: 0, row: 1 });
      const result = grid.navigateLeft();

      expect(result).toBe(true);
      expect(scrollCellSpy).toHaveBeenCalledWith(2, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll up but return false when calling navigateUp but cannot go further', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 0);
      const result = grid.navigateUp();
      grid.focus();

      expect(result).toBe(false);
      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll to right and return true when calling navigateUp with valid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      grid.setActiveCell(1, 1);
      const result = grid.navigateUp();

      expect(result).toBe(true);
      expect(scrollCellSpy).toHaveBeenCalledWith(1, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll down but return false when calling navigateDown but cannot go further', () => {
      const data = [{ id: 0, firstName: 'John' }];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 0);
      const result = grid.navigateDown();

      expect(result).toBe(false);
      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll down and return true when calling navigateDown with valid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      grid.setActiveCell(1, 1);
      const result = grid.navigateDown();

      expect(result).toBe(true);
      expect(scrollCellSpy).toHaveBeenCalledWith(1, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should scroll down and return true when calling navigateDown with valid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true, frozenRow: 2, frozenBottom: true });
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(2, 1);
      // @ts-ignore
      vi.spyOn(grid, 'gotoLeft').mockReturnValueOnce({ cell: 0, posX: 0, row: 3 });
      const result = grid.navigatePrev();

      expect(result).toBeUndefined();
      expect(scrollCellSpy).toHaveBeenCalledWith(2, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to previous cell but return false when calling navigatePrev but cannot go further', () => {
      const data = [{ id: 0, firstName: 'John' }];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 0);
      const result = grid.navigatePrev();

      expect(result).toBe(false);
      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to previous cell and return true when calling navigatePrev but scroll to 0,0 when providing out of bound cell', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, -1);
      const result = grid.navigatePrev();

      expect(result).toBe(true);
      expect(scrollCellSpy).toHaveBeenCalledWith(1, 2, true);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to previous cell and return true when calling navigatePrev with valid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      grid.setActiveCell(1, 1);
      const result = grid.navigatePrev();

      expect(result).toBe(true);
      expect(grid.getActiveCellPosition()).toMatchObject({ left: 0 });
      expect(scrollCellSpy).toHaveBeenCalledWith(1, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to previous cell and return false when calling navigatePrev with invalid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      vi.spyOn(grid, 'canCellBeActive').mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(false);
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      grid.setActiveCell(1, 1);
      grid.navigatePrev();

      expect(scrollCellSpy).toHaveBeenCalledWith(1, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to next but decrease row count when calling navigateNext and cell is detected as out of bound', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      grid.setActiveCell(1, 2);
      grid.navigateNext();

      expect(scrollCellSpy).toHaveBeenCalledWith(1, 2, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to next but return false when calling navigateNext and cannot find any first focusable cell', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      vi.spyOn(grid, 'canCellBeActive').mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(false);
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(1, 2);
      grid.navigateNext();

      expect(scrollCellSpy).toHaveBeenCalledWith(1, 2, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to next cell and return true when calling navigateNext but cannot go further it will find next focusable cell nonetheless', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 2);
      const result = grid.navigateNext();

      expect(result).toBe(true);
      expect(scrollCellSpy).toHaveBeenCalledWith(0, 2, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to next cell and return true when calling navigateNext but scroll to 0,0 when providing out of bound cell', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 3);
      const result = grid.navigateNext();

      expect(result).toBe(true);
      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, true);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to next cell and return true when calling navigateNext with valid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      grid.setActiveCell(1, 1);
      const result = grid.navigateNext();

      expect(result).toBe(true);
      expect(scrollCellSpy).toHaveBeenCalledWith(1, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to first row start but return false when calling navigateRowStart but cannot go further', () => {
      const data = [{ id: 0, firstName: 'John' }];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      vi.spyOn(grid, 'canCellBeActive').mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(false);
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      grid.setActiveCell(0, 0);
      grid.navigateRowStart();

      expect(scrollCellSpy).toHaveBeenCalledWith(0, 0, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to first row start and return true when calling navigateRowStart with valid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      grid.setActiveCell(1, 1);
      const result = grid.navigateRowStart();

      expect(result).toBe(true);
      expect(scrollCellSpy).toHaveBeenCalledWith(1, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to end of row but return false when calling navigateRowEnd but cannot go further', () => {
      const data = [{ id: 0, firstName: 'John' }];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'canCellBeActive').mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(false);
      grid.setActiveCell(0, 2);
      const result = grid.navigateRowEnd();

      expect(result).toBe(false);
      expect(scrollCellSpy).toHaveBeenCalledWith(0, 2, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });

    it('should navigate to end of row and return true when calling navigateRowEnd with valid navigation', () => {
      const data = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Bob' },
      ];
      grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
      const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
      const onActiveCellSpy = vi.spyOn(grid.onActiveCellChanged, 'notify');
      vi.spyOn(grid, 'getCellFromPoint').mockReturnValueOnce({ row: 1, cell: 1 });
      grid.setActiveCell(1, 1);
      const result = grid.navigateRowEnd();

      expect(result).toBe(true);
      expect(scrollCellSpy).toHaveBeenCalledWith(1, 1, false);
      expect(onActiveCellSpy).toHaveBeenCalled();
    });
  });

  describe('CSS Styles', () => {
    const columns = [
      { id: 'name', field: 'name', name: 'Name' },
      { id: 'age', field: 'age', name: 'Age' },
    ];
    let items: Array<{ id: number; name: string; age: number }> = [];
    let hash: any = {};

    beforeEach(() => {
      items = [
        { id: 0, name: 'Avery', age: 44 },
        { id: 1, name: 'Bob', age: 20 },
        { id: 2, name: 'Rachel', age: 46 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 4, name: 'John', age: 20 },
        { id: 5, name: 'Arnold', age: 50 },
        { id: 6, name: 'Carole', age: 40 },
        { id: 7, name: 'Jason', age: 48 },
        { id: 8, name: 'Julie', age: 42 },
        { id: 9, name: 'Aaron', age: 23 },
        { id: 10, name: 'Ariane', age: 43 },
      ];
      hash = {};
      for (const item of items) {
        if (item.age >= 30) {
          hash[item.id] = { age: 'highlight' };
        }
      }
    });

    it('should throw when trying to add already existing hash', () => {
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });

      grid.setCellCssStyles('age_greater30_highlight', hash);
      expect(() => grid.addCellCssStyles('age_greater30_highlight', hash)).toThrow(
        'SlickGrid addCellCssStyles: cell CSS hash with key "age_greater30_highlight" already exists.'
      );
    });

    it('should exit early when trying to remove CSS Style key that does not exist in hash', () => {
      const hashCopy = { ...hash };
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });

      grid.setCellCssStyles('age_greater30_highlight', hash);
      grid.removeCellCssStyles('something_else');

      expect(hash).toEqual(hashCopy);
    });

    it('should addCellCssStyles/removeCellCssStyles with CSS style hashes and expect onCellCssStylesChanged event to be triggered and styling applied to cells', () => {
      grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
      const onCellStyleSpy = vi.spyOn(grid.onCellCssStylesChanged, 'notify');

      // 1. add CSS Cell Style
      grid.addCellCssStyles('age_greater30_highlight', hash);
      grid.render();

      let firstItemAgeCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l1.r1') as HTMLDivElement;
      let secondItemAgeCell = container.querySelector('.slick-row:nth-child(2) .slick-cell.l1.r1') as HTMLDivElement;

      expect(onCellStyleSpy).toHaveBeenNthCalledWith(1, { key: 'age_greater30_highlight', hash, grid }, expect.anything(), grid);
      expect(firstItemAgeCell.textContent).toBe('44');
      expect(firstItemAgeCell.classList.contains('highlight')).toBeTruthy();
      expect(secondItemAgeCell.textContent).toBe('20');
      expect(secondItemAgeCell.classList.contains('highlight')).toBeFalsy();

      // 2. then remove CSS Cell Style
      grid.removeCellCssStyles('age_greater30_highlight');

      firstItemAgeCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l1.r1') as HTMLDivElement;
      secondItemAgeCell = container.querySelector('.slick-row:nth-child(2) .slick-cell.l1.r1') as HTMLDivElement;

      expect(onCellStyleSpy).toHaveBeenLastCalledWith({ key: 'age_greater30_highlight', hash: null, grid }, expect.anything(), grid);
      expect(onCellStyleSpy).toHaveBeenCalledWith({ key: 'age_greater30_highlight', hash, grid }, expect.anything(), grid);
      expect(firstItemAgeCell.textContent).toBe('44');
      expect(firstItemAgeCell.classList.contains('highlight')).toBeFalsy();
      expect(secondItemAgeCell.textContent).toBe('20');
      expect(secondItemAgeCell.classList.contains('highlight')).toBeFalsy();
    });
  });

  describe('Slick Cell', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'age', field: 'age', name: 'Age' },
      { id: 'gender', field: 'gender', name: 'Gender', hidden: true },
    ] as Column[];
    const data = [
      { id: 0, firstName: 'John', lastName: 'Doe', age: 30, gender: 'male' },
      { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28, gender: 'female' },
      { id: 2, firstName: 'Bob', lastName: 'Smith', age: 48, gender: 'male' },
      { id: 3, firstName: 'Arnold', lastName: 'Smith', age: 37, gender: 'male' },
    ];

    describe('absBox() method', () => {
      it('should expect abs box to be visible with unchanged abs box properties', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });

        grid.setActiveCell(0, 1);
        vi.spyOn(window, 'getComputedStyle').mockReturnValueOnce({ overflowX: 'hidden', overflowY: 'hidden' } as any);
        const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
        Object.defineProperty(slickCellElm, 'parentNode', { writable: true, value: null });
        Object.defineProperty(slickCellElm, 'offsetTop', { writable: true, value: 11 });
        const result = grid.getActiveCellPosition();

        expect(result).toEqual({
          bottom: 11,
          height: 0,
          left: 0,
          right: 0,
          top: 11,
          width: 0,
          visible: true,
        });
      });

      it('should expect abs box to not be visible when top position is lower than scrollTop', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });

        grid.setActiveCell(0, 1);
        vi.spyOn(window, 'getComputedStyle').mockReturnValueOnce({ overflowX: 'hidden', overflowY: 'hidden' } as any);
        const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
        const slickRowElm = slickCellElm.parentNode as HTMLDivElement;
        Object.defineProperty(slickRowElm, 'clientHeight', { writable: true, value: 8 });
        Object.defineProperty(slickRowElm, 'offsetHeight', { writable: true, value: 11 });
        Object.defineProperty(slickRowElm, 'scrollHeight', { writable: true, value: 23 });
        Object.defineProperty(slickCellElm, 'offsetTop', { writable: true, value: 11 });
        Object.defineProperty(slickRowElm, 'scrollTop', { writable: true, value: 44 });
        const result = grid.getActiveCellPosition();

        expect(result).toEqual({
          bottom: -58,
          height: 0,
          left: -80,
          right: -80,
          top: -58,
          width: 0,
          visible: false,
        });
      });

      it('should expect abs box to not be visible when left position is lower than scrollLeft', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });

        grid.setActiveCell(0, 1);
        vi.spyOn(window, 'getComputedStyle').mockReturnValueOnce({ overflowX: 'hidden', overflowY: 'hidden' } as any);
        const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
        const slickRowElm = slickCellElm.parentNode as HTMLDivElement;
        Object.defineProperty(slickCellElm, 'offsetLeft', { writable: true, value: 11 });
        Object.defineProperty(slickRowElm, 'clientHeight', { writable: true, value: 8 });
        Object.defineProperty(slickRowElm, 'offsetWidth', { writable: true, value: 11 });
        Object.defineProperty(slickRowElm, 'scrollWidth', { writable: true, value: 23 });
        Object.defineProperty(slickRowElm, 'offsetLeft', { writable: true, value: 6 });
        Object.defineProperty(slickRowElm, 'offsetTop', { writable: true, value: 7 });
        Object.defineProperty(slickRowElm, 'scrollLeft', { writable: true, value: 44 });
        const result = grid.getActiveCellPosition();

        expect(result).toEqual({
          bottom: -25,
          height: 0,
          left: -113,
          right: -113,
          top: -25,
          width: 0,
          visible: false,
        });
      });

      it('should expect abs box to not be visible when left position is lower than scrollLeft and also increase left/top position when offsetParent is same as slick-row element', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });

        grid.setActiveCell(0, 1);
        vi.spyOn(window, 'getComputedStyle').mockReturnValueOnce({ overflowX: 'hidden', overflowY: 'hidden' } as any);
        const slickCellElm = container.querySelector('.slick-cell.l1.r1') as HTMLDivElement;
        const slickRowElm = slickCellElm.parentNode as HTMLDivElement;
        Object.defineProperty(slickCellElm, 'offsetLeft', { writable: true, value: 11 });
        Object.defineProperty(slickCellElm, 'offsetParent', { writable: true, value: slickRowElm });
        Object.defineProperty(slickRowElm, 'clientHeight', { writable: true, value: 8 });
        Object.defineProperty(slickRowElm, 'offsetWidth', { writable: true, value: 11 });
        Object.defineProperty(slickRowElm, 'scrollWidth', { writable: true, value: 23 });
        Object.defineProperty(slickRowElm, 'offsetLeft', { writable: true, value: 6 });
        Object.defineProperty(slickRowElm, 'offsetTop', { writable: true, value: 7 });
        Object.defineProperty(slickRowElm, 'scrollLeft', { writable: true, value: 44 });
        const result = grid.getActiveCellPosition();

        expect(result).toEqual({
          bottom: -18,
          height: 0,
          left: -107,
          right: -107,
          top: -18,
          width: 0,
          visible: false,
        });
      });
    });

    describe('getCellFromPoint() method', () => {
      const columns = [
        { id: 'firstName', field: 'firstName', name: 'First Name' },
        { id: 'middleName', field: 'middleName', name: 'Middle Name' },
        { id: 'lastName', field: 'lastName', name: 'Last Name' },
        { id: 'age', field: 'age', name: 'Age' },
        { id: 'gender', field: 'gender', name: 'Gender' },
        { id: 'doorNumber', field: 'doorNumber', name: 'Door Number', hidden: true },
        { id: 'streetName', field: 'streetName', name: 'Street Name', hidden: true },
      ] as Column[];
      const data = [
        { id: 0, firstName: 'John', lastName: 'Doe', age: 30, gender: 'male' },
        { id: 1, firstName: 'Jane', lastName: 'Doe', age: 28, gender: 'female' },
        { id: 2, firstName: 'Bob', lastName: 'Smith', age: 48, gender: 'male' },
        { id: 3, firstName: 'Arnold', lastName: 'Smith', age: 37, gender: 'male' },
      ];

      it('should return correct row/cell when providing x,y coordinates', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });

        const result1 = grid.getCellFromPoint(0, 0);
        const result2 = grid.getCellFromPoint(0, DEFAULT_COLUMN_HEIGHT + 5);
        const result3 = grid.getCellFromPoint(DEFAULT_COLUMN_WIDTH + 5, 0);
        const result4 = grid.getCellFromPoint(DEFAULT_COLUMN_WIDTH + 5, DEFAULT_COLUMN_HEIGHT + 5);
        const result5 = grid.getCellFromPoint(DEFAULT_COLUMN_WIDTH * 2 + 5, DEFAULT_COLUMN_HEIGHT * 2 + 5);
        const result6 = grid.getCellFromPoint(DEFAULT_COLUMN_WIDTH * 3 + 5, DEFAULT_COLUMN_HEIGHT * 3 + 5);
        const result7 = grid.getCellFromPoint(DEFAULT_COLUMN_WIDTH * 4 + 5, DEFAULT_COLUMN_HEIGHT * 4 + 5);

        expect(result1).toEqual({ cell: 0, row: 0 });
        expect(result2).toEqual({ cell: 0, row: 1 });
        expect(result3).toEqual({ cell: 1, row: 0 });
        expect(result4).toEqual({ cell: 1, row: 1 });
        expect(result5).toEqual({ cell: 2, row: 2 });
        expect(result6).toEqual({ cell: 3, row: 3 });
        expect(result7).toEqual({ cell: 4, row: 4 });
      });

      it('should return negative row/cell when x,y coordinates is outside the grid canvas', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });

        const result1 = grid.getCellFromPoint(0, -999);
        const result2 = grid.getCellFromPoint(-777, 0);
        const result3 = grid.getCellFromPoint(-(DEFAULT_COLUMN_WIDTH + 5), -(DEFAULT_COLUMN_HEIGHT + 5));
        const result4 = grid.getCellFromPoint(-(DEFAULT_COLUMN_WIDTH * 2 + 5), -(DEFAULT_COLUMN_HEIGHT * 2 + 5));
        const result5 = grid.getCellFromPoint(-(DEFAULT_COLUMN_WIDTH * 3 + 5), -(DEFAULT_COLUMN_HEIGHT * 3 + 5));

        expect(result1).toEqual({ cell: 0, row: -1 });
        expect(result2).toEqual({ cell: -1, row: 0 });
        expect(result3).toEqual({ cell: -1, row: -1 });
        expect(result4).toEqual({ cell: -1, row: -1 });
        expect(result5).toEqual({ cell: -1, row: -1 });
      });

      it('should return hidden cells as well since skipping them would add an unwanted offset', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });

        const result1 = grid.getCellFromPoint(DEFAULT_COLUMN_WIDTH * 5 + 5, DEFAULT_COLUMN_HEIGHT * 5 + 5);
        const result2 = grid.getCellFromPoint(DEFAULT_COLUMN_WIDTH * 6 + 5, DEFAULT_COLUMN_HEIGHT * 6 + 5);

        expect(result1).toEqual({ cell: 5, row: 5 });
        expect(result2).toEqual({ cell: 6, row: 6 });
      });
    });

    describe('getCellFromEvent() method', () => {
      it('should throw when cell node is not found in the grid', () => {
        const slickCell = createDomElement('div', { className: 'slick-cell' });
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: slickCell });

        expect(() => grid.getCellFromEvent(event)).toThrow('SlickGrid getCellFromNode: cannot get cell - slick-cell');
      });

      it('should return null if either the native event or passed in event is not set', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });

        expect(grid.getCellFromEvent(null as any)).toBeNull();
        expect(grid.getCellFromEvent(new SlickEventData(null))).toBeNull();
      });

      it('should return null when clicked cell is not a slick-cell closest ancestor', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(1)');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[0] });
        const result = grid.getCellFromEvent(event);

        expect(result).toBeNull();
      });

      it('should return { row:0, cell:0 } when clicked cell is first cell top left a native Event', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(1) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[0] });
        const result = grid.getCellFromEvent(event);

        expect(result).toEqual({ row: 0, cell: 0 });
      });

      it('should return { row:0, cell:0 } when clicked cell is first cell top left and is provided as a SlickEventData', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(1) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[0] });
        const sed = new SlickEventData(event);
        const result = grid.getCellFromEvent(sed);

        expect(result).toEqual({ row: 0, cell: 0 });
      });

      it('should return { row:1, cell:1 } when clicked cell is second cell of second row', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true });
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        const result = grid.getCellFromEvent(event);

        expect(result).toEqual({ row: 1, cell: 1 });
      });

      it('should return { row:1, cell:1 } when clicked cell is second cell of second row with a frozenRow is outside of range', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true, frozenRow: 2 });
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        Object.defineProperty(event, 'clientX', { writable: true, value: DEFAULT_COLUMN_WIDTH * 2 + 5 });
        Object.defineProperty(event, 'clientY', { writable: true, value: DEFAULT_COLUMN_HEIGHT * 1 + 5 });
        const result = grid.getCellFromEvent(event);

        expect(result).toEqual({ row: 1, cell: 1 });
      });

      it('should return { row:1, cell:1 } when clicked cell is second cell of second row with a frozenRow and frozenBottom is outside of range', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true, frozenRow: 2, frozenBottom: true });
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        Object.defineProperty(event, 'clientX', { writable: true, value: DEFAULT_COLUMN_WIDTH * 2 + 5 });
        Object.defineProperty(event, 'clientY', { writable: true, value: DEFAULT_COLUMN_HEIGHT * 1 + 5 });
        const result = grid.getCellFromEvent(event);

        expect(result).toEqual({ row: 1, cell: 1 });
      });

      it('should return { row:1, cell:1 } when clicked cell is second cell of second row with a frozenRow and frozenBottom is inside range', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true, frozenRow: 3, frozenBottom: true });
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        Object.defineProperty(event, 'clientX', { writable: true, value: DEFAULT_COLUMN_WIDTH * 2 + 5 });
        Object.defineProperty(event, 'clientY', { writable: true, value: DEFAULT_COLUMN_HEIGHT * 1 + 5 });
        const result = grid.getCellFromEvent(event);

        expect(result).toEqual({ row: 1, cell: 1 });
      });

      it('should return null when using frozenRow that result into invalid row/cell number', () => {
        grid = new SlickGrid<any, Column>(container, data, columns, { ...defaultOptions, enableCellNavigation: true, frozenRow: 3, frozenBottom: true });
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });

        const result = grid.getCellFromEvent(event); // not passing clientX/clientY will return NaN

        expect(result).toBeNull();
      });
    });
  });

  describe('Sanitizer', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name', sortable: true },
      { id: 'lastName', field: 'lastName', name: 'Last Name', sortable: true },
      { id: 'age', field: 'age', name: 'Age', sortable: true },
    ] as Column[];

    it('should use sanitizer when provided in grid options and expect <script> to be removed', () => {
      const sanitizer = (dirtyHtml: string) =>
        typeof dirtyHtml === 'string'
          ? dirtyHtml.replace(
              /(\b)(on[a-z]+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script(>*)|(&lt;)(\/*)(script|script defer)(.*)(&gt;|&gt;">)/gi,
              ''
            )
          : dirtyHtml;
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, sanitizer });

      const dirtyHtml = '<div class="some-class"><script>alert("hello world")</script></div>';
      const cleanHtml = '<div class="some-class"></div>';

      expect(grid.sanitizeHtmlString(dirtyHtml)).toBe(cleanHtml);
    });

    it('should return same input string when no sanitizer provided', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, sanitizer: undefined });

      const dirtyHtml = '<div class="some-class"><script>alert("hello world")</script></div>';

      expect(grid.sanitizeHtmlString(dirtyHtml)).toBe(dirtyHtml);
    });
  });

  describe('Update UI', () => {
    describe('updateCell() method', () => {
      it('should change an item property then call updateCell() and expect it to be updated in the UI with Formatter result', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', formatter: (row, cell, val) => (val > 20 ? `<strong>${val}</strong>` : null) } as any,
        ];
        const items = [
          { id: 0, name: 'Avery', age: 44 },
          { id: 1, name: 'Bob', age: 20 },
          { id: 2, name: 'Rachel', age: 46 },
        ];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const getDataItemSpy = vi.spyOn(grid, 'getDataItem');
        items[1].age = 25;
        grid.updateCell(1, 1);

        const secondItemAgeCell = container.querySelector('.slick-row:nth-child(2) .slick-cell.l1.r1') as HTMLDivElement;

        expect(getDataItemSpy).toHaveBeenCalledTimes(1);
        expect(secondItemAgeCell.innerHTML).toBe('<strong>25</strong>');
      });

      it('should change an item property then call updateCell() on a cell that does not exist and expect it to be an empty string cell', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', formatter: (row, cell, val) => (val > 20 ? `<strong>${val}</strong>` : null) } as any,
        ];
        const items = [
          { id: 0, name: 'Avery', age: 44 },
          { id: 1, name: 'Bob', age: 20 },
          { id: 2, name: 'Rachel', age: 46 },
        ];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        vi.spyOn(grid, 'getCellNode').mockReturnValueOnce(document.createElement('div'));
        const getDataItemSpy = vi.spyOn(grid, 'getDataItem').mockReturnValueOnce(null);
        items[1].age = 25;
        grid.updateCell(3, 3);

        const secondItemAgeCell = container.querySelector('.slick-row:nth-child(2) .slick-cell.l1.r1') as HTMLDivElement;

        expect(getDataItemSpy).toHaveBeenCalledTimes(1);
        expect(secondItemAgeCell.innerHTML).toBe('');
      });

      it('should change an item value via asyncPostRenderer then call updateCell() and expect it to be updated in the UI with Formatter result', () => {
        const newValue = '25';
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', asyncPostRender: (node) => (node.textContent = newValue) },
        ] as Column[];
        const items = [
          { id: 0, name: 'Avery', age: 44 },
          { id: 1, name: 'Bob', age: 20 },
          { id: 2, name: 'Rachel', age: 46 },
        ];
        const gridOptions = {
          ...defaultOptions,
          enableCellNavigation: true,
          enableAsyncPostRender: true,
          enableAsyncPostRenderCleanup: true,
          asyncPostRenderDelay: 1,
          asyncPostRenderCleanupDelay: 1,
        };
        grid = new SlickGrid<any, Column>(container, items, columns, gridOptions);
        let firstItemAgeCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l1.r1') as HTMLDivElement;
        expect(firstItemAgeCell.innerHTML).toBe('44');

        const getDataItemSpy = vi.spyOn(grid, 'getDataItem');
        grid.updateCell(0, 1);
        grid.invalidateRows([0]);
        vi.advanceTimersByTime(1);

        firstItemAgeCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l1.r1') as HTMLDivElement;
        expect(getDataItemSpy).toHaveBeenCalledTimes(2);
        expect(firstItemAgeCell.innerHTML).toBe('25');
      });

      it('should change an item from an Editor then call updateCell() and expect it call the editor loadValue() method', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        const items = [
          { id: 0, name: 'Avery', age: 44 },
          { id: 1, name: 'Bob', age: 20 },
          { id: 2, name: 'Rachel', age: 46 },
        ];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        grid.setActiveCell(0, 1);
        grid.editActiveCell(InputEditor as any, true);
        const currentEditor = grid.getCellEditor() as Editor;
        const editorSpy = vi.spyOn(currentEditor, 'loadValue');

        grid.updateCell(0, 1);

        expect(editorSpy).toHaveBeenCalledWith({ id: 0, name: 'Avery', age: 44 });
      });

      it('should call navigateDown() when calling save() on default editor', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        const items = [
          { id: 0, name: 'Avery', age: 44 },
          { id: 1, name: 'Bob', age: 20 },
          { id: 2, name: 'Rachel', age: 46 },
        ];

        const navigateDownSpy = vi.spyOn(grid, 'navigateDown');
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        grid.setActiveCell(0, 1);
        grid.editActiveCell(InputEditor as any, true);
        const currentEditor = grid.getCellEditor() as Editor;
        currentEditor.save!();

        expect(navigateDownSpy).not.toHaveBeenCalled();
      });

      it('should NOT call navigateDown() when calling save() on an AutoCompleterEditor that disabled navigate down', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: AutocompleterEditor },
        ] as Column[];
        const items = [
          { id: 0, name: 'Avery', age: 44 },
          { id: 1, name: 'Bob', age: 20 },
          { id: 2, name: 'Rachel', age: 46 },
        ];

        const navigateDownSpy = vi.spyOn(grid, 'navigateDown');
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        grid.setActiveCell(0, 1);
        grid.editActiveCell(AutocompleterEditor as any, true);
        const currentEditor = grid.getCellEditor() as Editor;
        currentEditor.save!();

        expect(navigateDownSpy).not.toHaveBeenCalled();
      });
    });

    describe('updateRow() method', () => {
      let items: Array<{ id: number; name: string; age: number }> = [];

      beforeEach(() => {
        items = [
          { id: 0, name: 'Avery', age: 44 },
          { id: 1, name: 'Bob', age: 20 },
          { id: 2, name: 'Rachel', age: 46 },
          { id: 3, name: 'Jane', age: 24 },
          { id: 4, name: 'John', age: 20 },
          { id: 5, name: 'Arnold', age: 50 },
          { id: 6, name: 'Carole', age: 40 },
          { id: 7, name: 'Jason', age: 48 },
          { id: 8, name: 'Julie', age: 42 },
          { id: 9, name: 'Aaron', age: 23 },
          { id: 10, name: 'Ariane', age: 43 },
        ];
      });

      it('should call the method but expect nothing to happen when row number is invalid', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', formatter: (row, cell, val) => `<strong>${val}</strong>` },
        ];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const getDataItemSpy = vi.spyOn(grid, 'getDataItem');
        grid.updateRow(999);

        expect(getDataItemSpy).not.toHaveBeenCalled();
      });

      it('should call the method but expect it to empty the cell node when getDataItem() returns no item', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const getDataItemSpy = vi.spyOn(grid, 'getDataItem').mockReturnValueOnce(null);
        items[1].age = 25;
        grid.updateRow(1);

        const secondItemAgeCell = container.querySelector('.slick-row:nth-child(2) .slick-cell.l1.r1') as HTMLDivElement;

        expect(getDataItemSpy).toHaveBeenCalledTimes(1);
        expect(secondItemAgeCell.innerHTML).toBe('');
      });

      it('should change an item property then call updateRow() and expect it to be updated in the UI with Formatter result', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', formatter: (row, cell, val) => `<strong>${val}</strong>` },
        ];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const getDataItemSpy = vi.spyOn(grid, 'getDataItem');
        items[1].age = 25;
        grid.updateRow(1);

        const secondItemAgeCell = container.querySelector('.slick-row:nth-child(2) .slick-cell.l1.r1') as HTMLDivElement;

        expect(getDataItemSpy).toHaveBeenCalledTimes(1);
        expect(secondItemAgeCell.innerHTML).toBe('<strong>25</strong>');
      });

      it('should change an item value via asyncPostRenderer then call updateRow() and expect it to be updated in the UI with Formatter result', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          {
            id: 'age',
            field: 'age',
            name: 'Age',
            asyncPostRender: (node, row, data) => (node.textContent = data),
            asyncPostRenderCleanup: (node) => (node.textContent = ''),
          },
        ] as Column[];
        const gridOptions = {
          ...defaultOptions,
          rowHeight: 2222,
          enableCellNavigation: true,
          enableAsyncPostRender: true,
          enableAsyncPostRenderCleanup: true,
          asyncPostRenderDelay: 1,
          asyncPostRenderCleanupDelay: 1,
        };
        grid = new SlickGrid<any, Column>(container, items, columns, gridOptions);
        let firstItemAgeCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l1.r1') as HTMLDivElement;
        expect(firstItemAgeCell.innerHTML).toBe('44');

        const getDataItemSpy = vi.spyOn(grid, 'getDataItem');
        grid.updateRow(0);
        vi.advanceTimersByTime(1);

        firstItemAgeCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l1.r1') as HTMLDivElement;
        expect(getDataItemSpy).toHaveBeenCalledTimes(2);
        // expect(firstItemAgeCell.innerHTML).toBe('25');

        grid.setActiveRow(0);
        grid.gotoCell(10, 1);
        expect(grid.getViewports()[0].scrollLeft).toBe(80);
        grid.setOptions({ frozenColumn: 2 });
        grid.render();
        vi.advanceTimersByTime(2); // cleanup asyncPostRender

        firstItemAgeCell = container.querySelector('.slick-row:nth-child(1) .slick-cell.l1.r1') as HTMLDivElement;
        expect(firstItemAgeCell.innerHTML).not.toBe('25');
        expect(grid.getViewports()[0].scrollLeft).toBe(0); // scroll left is 0 because it was reset by setOptions to avoid UI issues

        grid.scrollTo(8);
        vi.advanceTimersByTime(1);
      });

      it('should change an item from an Editor then call updateRow() and expect it call the editor loadValue() method', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        grid.setActiveCell(0, 1);
        grid.editActiveCell(InputEditor as any, true);
        const currentEditor = grid.getCellEditor() as Editor;
        const editorSpy = vi.spyOn(currentEditor, 'loadValue');

        grid.updateRow(0);

        expect(editorSpy).toHaveBeenCalledWith({ id: 0, name: 'Avery', age: 44 });
      });
    });
  });

  describe('Activate Cell/Row methods', () => {
    let items: Array<{ id: number; name: string; age: number }> = [];

    beforeEach(() => {
      items = [
        { id: 0, name: 'Avery', age: 44 },
        { id: 1, name: 'Bob', age: 20 },
        { id: 2, name: 'Rachel', age: 46 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 4, name: 'John', age: 20 },
        { id: 5, name: 'Arnold', age: 50 },
        { id: 6, name: 'Carole', age: 40 },
        { id: 7, name: 'Jason', age: 48 },
        { id: 8, name: 'Julie', age: 42 },
        { id: 9, name: 'Aaron', age: 23 },
        { id: 10, name: 'Ariane', age: 43 },
      ];
    });

    describe('setActiveRow() method', () => {
      it('should do nothing when row to activate is greater than data length or cell is greater than available column length', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const scrollViewSpy = vi.spyOn(grid, 'scrollCellIntoView');
        grid.setActiveRow(99, 1);
        grid.setActiveRow(1, 99);

        expect(scrollViewSpy).not.toHaveBeenCalled();
      });

      it('should do nothing when row or cell is a negative number', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const scrollViewSpy = vi.spyOn(grid, 'scrollCellIntoView');
        grid.setActiveRow(-1, 1);
        grid.setActiveRow(1, -1);

        expect(scrollViewSpy).not.toHaveBeenCalled();
      });

      it('should do nothing when row to activate is greater than data length', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const scrollViewSpy = vi.spyOn(grid, 'scrollCellIntoView');
        grid.setActiveRow(1, 1);

        expect(scrollViewSpy).toHaveBeenCalledWith(1, 1, false);
      });
    });

    describe('gotoCell() method', () => {
      it('should call gotoCell() and expect it to scroll to the cell', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
        grid.gotoCell(0, 1);

        expect(scrollCellSpy).toHaveBeenCalledWith(0, 1, false);
      });

      it('should call gotoCell() with invalid cell and expect to NOT scroll to the cell', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
        grid.gotoCell(99, 1);

        expect(scrollCellSpy).not.toHaveBeenCalled();
      });

      it('should call gotoCell() with commitCurrentEdit() returning false and expect to NOT scroll to the cell', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];

        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const scrollCellSpy = vi.spyOn(grid, 'scrollCellIntoView');
        vi.spyOn(grid.getEditorLock(), 'commitCurrentEdit').mockReturnValueOnce(false);
        grid.gotoCell(0, 1);

        expect(scrollCellSpy).not.toHaveBeenCalled();
      });
    });

    describe('canCellBeActive() method', () => {
      it('should return false when no items provided', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const result = grid.canCellBeActive(0, 0);

        expect(result).toBe(false);
      });

      it('should return false when column is hidden', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name', hidden: true }] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const result = grid.canCellBeActive(0, 0);

        expect(result).toBe(false);
      });

      it('should return true when cell is assign with default props', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const result = grid.canCellBeActive(0, 0);

        expect(result).toBe(true);
      });

      it('should return false when column has column focusable assigned as false', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name', focusable: false }] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const result = grid.canCellBeActive(0, 0);

        expect(result).toBe(false);
      });

      it('should return true when using DataView with a getItemMetadata() method available returning column focusable as true', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        const dv = new SlickDataView();
        dv.setItems(items);
        grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ focusable: true });
        const result = grid.canCellBeActive(0, 0);

        expect(result).toBe(true);
      });

      it('should return true when using DataView with a getItemMetadata() method available returning column focusable as false', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        const dv = new SlickDataView();
        dv.setItems(items);
        grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ focusable: false });
        const result = grid.canCellBeActive(0, 0);

        expect(result).toBe(false);
      });

      it('should return true when using DataView with a getItemMetadata() method available returning column focusable as true', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        const dv = new SlickDataView();
        dv.setItems(items);
        grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ columns } as any);
        const result = grid.canCellBeActive(0, 0);

        expect(result).toBe(true);
      });

      it('should return true when using DataView with a getItemMetadata() method available returning column focusable as false', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name', focusable: false }] as Column[];
        const dv = new SlickDataView();
        dv.setItems(items);
        grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ columns: { name: { focusable: false } } } as any);
        const result = grid.canCellBeActive(0, 0);

        expect(result).toBe(false);
      });
    });

    describe('canCellBeSelected() method', () => {
      it('should return false when no items provided', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const result = grid.canCellBeSelected(0, 0);

        expect(result).toBe(false);
      });

      it('should return false when column is hidden', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name', hidden: true }] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const result = grid.canCellBeSelected(0, 0);

        expect(result).toBe(false);
      });

      it('should return true when cell is assign with default props', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const result = grid.canCellBeSelected(0, 0);

        expect(result).toBe(true);
      });

      it('should return false when column has column selectable assigned as false', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name', selectable: false }] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const result = grid.canCellBeSelected(0, 0);

        expect(result).toBe(false);
      });

      it('should return true when using DataView with a getItemMetadata() method available returning column selectable as true', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        const dv = new SlickDataView();
        dv.setItems(items);
        grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ selectable: true });
        const result = grid.canCellBeSelected(0, 0);

        expect(result).toBe(true);
      });

      it('should return true when using DataView with a getItemMetadata() method available returning column selectable as false', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        const dv = new SlickDataView();
        dv.setItems(items);
        grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ selectable: false });
        const result = grid.canCellBeSelected(0, 0);

        expect(result).toBe(false);
      });

      it('should return true when using DataView with a getItemMetadata() method available returning column selectable as true', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name' }] as Column[];
        const dv = new SlickDataView();
        dv.setItems(items);
        grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ columns } as any);
        const result = grid.canCellBeSelected(0, 0);

        expect(result).toBe(true);
      });

      it('should return true when using DataView with a getItemMetadata() method available returning column selectable as false', () => {
        const columns = [{ id: 'name', field: 'name', name: 'Name', selectable: false }] as Column[];
        const dv = new SlickDataView();
        dv.setItems(items);
        grid = new SlickGrid<any, Column>(container, dv, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(dv, 'getItemMetadata').mockReturnValue({ columns } as any);
        const result = grid.canCellBeSelected(0, 0);

        expect(result).toBe(false);
      });
    });
  });

  describe('Grid Events', () => {
    let items: Array<{ id: number; name: string; age: number }> = [];

    beforeEach(() => {
      items = [
        { id: 0, name: 'Avery', age: 44 },
        { id: 1, name: 'Bob', age: 20 },
        { id: 2, name: 'Rachel', age: 46 },
        { id: 3, name: 'Jane', age: 24 },
        { id: 4, name: 'John', age: 20 },
        { id: 5, name: 'Arnold', age: 50 },
        { id: 6, name: 'Carole', age: 40 },
        { id: 7, name: 'Jason', age: 48 },
        { id: 8, name: 'Julie', age: 42 },
        { id: 9, name: 'Aaron', age: 23 },
        { id: 10, name: 'Ariane', age: 43 },
      ];
    });

    describe('Cell Click', () => {
      test('double-click event triggered on header resize handle should call "onColumnsResizeDblClick" notify', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onColumnsResizeDblClickSpy = vi.spyOn(grid.onColumnsResizeDblClick, 'notify');
        const columnElms = container.querySelectorAll('.slick-header-column');
        const resizeHandleElm = columnElms[0].querySelector('.slick-resizable-handle') as HTMLDivElement;

        const dblClickEvent = new Event('dblclick');
        resizeHandleElm.dispatchEvent(dblClickEvent);

        expect(onColumnsResizeDblClickSpy).toHaveBeenCalledWith({ triggeredByColumn: columns[0].id, grid }, expect.anything(), grid);
      });

      it('should not scroll or do anything when getCellFromEvent() returns null', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(grid, 'getCellFromEvent').mockReturnValue(null);
        const scrollViewSpy = vi.spyOn(grid, 'scrollRowIntoView');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2)');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(scrollViewSpy).not.toHaveBeenCalled();
      });

      it('should goto cell or do anything when event default is prevented', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const scrollViewSpy = vi.spyOn(grid, 'scrollRowIntoView');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'defaultPrevented', { writable: true, value: true });
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(scrollViewSpy).not.toHaveBeenCalled();
      });

      it('should scroll to cell when clicking on cell', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onClickSpy = vi.spyOn(grid.onClick, 'notify');
        const scrollViewSpy = vi.spyOn(grid, 'scrollRowIntoView');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(scrollViewSpy).toHaveBeenCalledWith(1, false);
        expect(onClickSpy).toHaveBeenCalled();
      });

      it('should scroll to cell when clicking on cell and expect window.getSelection to call removeAllRanges() and addRange() which is a hack to keep text selection on IE/Firefox', () => {
        const addRangeMock = vi.fn();
        const removeRangeMock = vi.fn();
        vi.spyOn(window, 'getSelection')
          .mockReturnValueOnce({ rangeCount: 2, getRangeAt: () => items[1].name } as any)
          .mockReturnValueOnce({ removeAllRanges: removeRangeMock, addRange: addRangeMock } as any);

        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onClickSpy = vi.spyOn(grid.onClick, 'notify');
        const scrollViewSpy = vi.spyOn(grid, 'scrollRowIntoView');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(removeRangeMock).toHaveBeenCalled();
        expect(addRangeMock).toHaveBeenCalledWith(items[1].name);
        expect(scrollViewSpy).toHaveBeenCalledWith(1, false);
        expect(onClickSpy).toHaveBeenCalled();
      });
    });

    describe('Cell Double-Click', () => {
      it('should goto cell or do anything when getCellFromEvent() returns null', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(grid, 'getCellFromEvent').mockReturnValue(null);
        const gotoCellSpy = vi.spyOn(grid, 'gotoCell');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2)');
        const event = new CustomEvent('dblclick');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(gotoCellSpy).not.toHaveBeenCalled();
      });

      it('should goto cell or do anything when event default is prevented', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const gotoCellSpy = vi.spyOn(grid, 'gotoCell');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('dblclick');
        Object.defineProperty(event, 'defaultPrevented', { writable: true, value: true });
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(gotoCellSpy).not.toHaveBeenCalled();
      });

      it('should scroll to cell when clicking on cell', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const gotoCellSpy = vi.spyOn(grid, 'gotoCell');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('dblclick');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(gotoCellSpy).toHaveBeenCalled();
      });
    });

    describe('Cell Context Menu', () => {
      it('should not trigger onContextMenu event when cannot find closest slick-cell', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onContextMenuSpy = vi.spyOn(grid.onContextMenu, 'notify');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2)');
        const event = new CustomEvent('contextmenu');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[0] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onContextMenuSpy).not.toHaveBeenCalled();
      });

      it('should not trigger onContextMenu event when current cell is active and is editable', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        grid.setActiveCell(1, 1);
        const onContextMenuSpy = vi.spyOn(grid.onContextMenu, 'notify');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('contextmenu');
        Object.defineProperty(event, 'defaultPrevented', { writable: true, value: true });
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onContextMenuSpy).not.toHaveBeenCalled();
      });

      it('should trigger onContextMenu event when current cell is not active and not editable', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onContextMenuSpy = vi.spyOn(grid.onContextMenu, 'notify');
        const secondRowSlickCells = container.querySelectorAll('.slick-row:nth-child(2) .slick-cell');
        const event = new CustomEvent('contextmenu');
        Object.defineProperty(event, 'target', { writable: true, value: secondRowSlickCells[1] });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onContextMenuSpy).toHaveBeenCalled();
      });
    });

    describe('Cell Mouse Events', () => {
      it('should trigger onMouseEnter notify when hovering a cell', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onMouseEnterSpy = vi.spyOn(grid.onMouseEnter, 'notify');
        container.querySelector('.grid-canvas-left')!.dispatchEvent(new CustomEvent('mouseover'));

        expect(onMouseEnterSpy).toHaveBeenCalled();
      });

      it('should trigger onHeaderMouseLeave notify when leaving the hovering of a cell', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onMouseLeaveSpy = vi.spyOn(grid.onMouseLeave, 'notify');
        container.querySelector('.grid-canvas-left')!.dispatchEvent(new CustomEvent('mouseout'));

        expect(onMouseLeaveSpy).toHaveBeenCalled();
      });
    });

    describe('Pre-Header Click', () => {
      it('should trigger onPreHeaderClick notify when not column resizing', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, {
          ...defaultOptions,
          enableCellNavigation: true,
          editable: true,
          createPreHeaderPanel: true,
          showPreHeaderPanel: true,
        });
        vi.spyOn(grid, 'getCellFromEvent').mockReturnValue(null);
        const onPreHeaderClickSpy = vi.spyOn(grid.onPreHeaderClick, 'notify');
        const preHeaderElms = container.querySelectorAll('.slick-preheader-panel');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: preHeaderElms[0] });
        preHeaderElms[0].dispatchEvent(event);

        expect(onPreHeaderClickSpy).toHaveBeenCalledWith({ node: preHeaderElms[0], grid }, expect.anything(), grid);
      });
    });

    describe('Pre-Header Context Menu', () => {
      it('should trigger onHeaderClick notify grid context menu event is triggered', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, {
          ...defaultOptions,
          enableCellNavigation: true,
          editable: true,
          createPreHeaderPanel: true,
          showPreHeaderPanel: true,
        });
        const onContextSpy = vi.spyOn(grid.onPreHeaderContextMenu, 'notify');
        const preHeaderElms = container.querySelectorAll('.slick-preheader-panel');
        const event = new CustomEvent('contextmenu');
        Object.defineProperty(event, 'target', { writable: true, value: preHeaderElms[0] });
        preHeaderElms[0].dispatchEvent(event);

        expect(onContextSpy).toHaveBeenCalledWith({ node: preHeaderElms[0], grid }, expect.anything(), grid);
      });
    });

    describe('Header Click', () => {
      it('should trigger onHeaderClick notify when not column resizing', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(grid, 'getCellFromEvent').mockReturnValue(null);
        const onHeaderClickSpy = vi.spyOn(grid.onHeaderClick, 'notify');
        const headerColumns = container.querySelectorAll('.slick-header-column');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: headerColumns[0] });
        container.querySelector('.slick-header.slick-header-left')!.dispatchEvent(event);

        expect(onHeaderClickSpy).toHaveBeenCalledWith({ column: columns[0], grid }, expect.anything(), grid);
      });
    });

    describe('Header Context Menu', () => {
      it('should trigger onHeaderClick notify grid context menu event is triggered', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onContextSpy = vi.spyOn(grid.onHeaderContextMenu, 'notify');
        const headerColumns = container.querySelectorAll('.slick-header-column');
        const event = new CustomEvent('contextmenu');
        Object.defineProperty(event, 'target', { writable: true, value: headerColumns[0] });
        container.querySelector('.slick-header.slick-header-left')!.dispatchEvent(event);

        expect(onContextSpy).toHaveBeenCalledWith({ column: columns[0], grid }, expect.anything(), grid);
      });
    });

    describe('Header Mouse Events', () => {
      it('should trigger onHeaderMouseEnter notify when hovering a header', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onHeaderMouseEnterSpy = vi.spyOn(grid.onHeaderMouseEnter, 'notify');
        container.querySelector('.slick-header-column')!.dispatchEvent(new CustomEvent('mouseenter'));

        expect(onHeaderMouseEnterSpy).toHaveBeenCalled();
      });

      it('should NOT trigger onHeaderMouseEnter notify when hovering a header when "slick-header-column" class is not found', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onHeaderMouseEnterSpy = vi.spyOn(grid.onHeaderMouseEnter, 'notify');
        const headerRowElm = container.querySelector('.slick-header-column');
        headerRowElm!.classList.remove('slick-header-column');
        headerRowElm!.dispatchEvent(new CustomEvent('mouseenter'));

        expect(onHeaderMouseEnterSpy).not.toHaveBeenCalled();
      });

      it('should trigger onHeaderMouseOver notify when hovering a header', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onHeaderMouseOverSpy = vi.spyOn(grid.onHeaderMouseOver, 'notify');
        container.querySelector('.slick-header-column')!.dispatchEvent(new CustomEvent('mouseover'));

        expect(onHeaderMouseOverSpy).toHaveBeenCalled();
      });

      it('should NOT trigger onHeaderMouseOver notify when hovering a header when "slick-header-column" class is not found', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onHeaderMouseOverSpy = vi.spyOn(grid.onHeaderMouseOver, 'notify');
        const headerRowElm = container.querySelector('.slick-header-column');
        headerRowElm!.classList.remove('slick-header-column');
        headerRowElm!.dispatchEvent(new CustomEvent('mouseover'));

        expect(onHeaderMouseOverSpy).not.toHaveBeenCalled();
      });

      it('should trigger onHeaderMouseLeave notify when leaving the hovering of a header when "slick-header-column" class is not found', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onHeaderMouseLeaveSpy = vi.spyOn(grid.onHeaderMouseLeave, 'notify');
        container.querySelector('.slick-header-column')!.dispatchEvent(new CustomEvent('mouseleave'));

        expect(onHeaderMouseLeaveSpy).toHaveBeenCalled();
      });

      it('should NOT trigger onHeaderMouseLeave notify when leaving the hovering of a header', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onHeaderMouseLeaveSpy = vi.spyOn(grid.onHeaderMouseLeave, 'notify');
        const headerRowElm = container.querySelector('.slick-header-column');
        headerRowElm!.classList.remove('slick-header-column');
        headerRowElm!.dispatchEvent(new CustomEvent('mouseleave'));

        expect(onHeaderMouseLeaveSpy).not.toHaveBeenCalled();
      });

      it('should trigger onHeaderMouseOut notify when leaving the hovering of a header when "slick-header-column" class is not found', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onHeaderMouseOutSpy = vi.spyOn(grid.onHeaderMouseOut, 'notify');
        container.querySelector('.slick-header-column')!.dispatchEvent(new CustomEvent('mouseout'));

        expect(onHeaderMouseOutSpy).toHaveBeenCalled();
      });

      it('should NOT trigger onHeaderMouseOut notify when leaving the hovering of a header', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true });
        const onHeaderMouseOutSpy = vi.spyOn(grid.onHeaderMouseOut, 'notify');
        const headerRowElm = container.querySelector('.slick-header-column');
        headerRowElm!.classList.remove('slick-header-column');
        headerRowElm!.dispatchEvent(new CustomEvent('mouseout'));

        expect(onHeaderMouseOutSpy).not.toHaveBeenCalled();
      });

      it('should trigger onHeaderRowMouseEnter notify when hovering a header', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, showHeaderRow: true, enableCellNavigation: true });
        const onHeaderRowMouseEnterSpy = vi.spyOn(grid.onHeaderRowMouseEnter, 'notify');
        container.querySelector('.slick-headerrow-column')!.dispatchEvent(new CustomEvent('mouseenter'));

        expect(onHeaderRowMouseEnterSpy).toHaveBeenCalled();
      });

      it('should trigger onHeaderRowMouseOver notify when hovering a header', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, showHeaderRow: true, enableCellNavigation: true });
        const onHeaderRowMouseOverSpy = vi.spyOn(grid.onHeaderRowMouseOver, 'notify');
        container.querySelector('.slick-headerrow-column')!.dispatchEvent(new CustomEvent('mouseover'));

        expect(onHeaderRowMouseOverSpy).toHaveBeenCalled();
      });

      it('should update viewport top/left scrollLeft when scrolling in headerRow DOM element', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, showHeaderRow: true, enableCellNavigation: true });
        const headerRowElm = container.querySelector('.slick-headerrow') as HTMLDivElement;
        Object.defineProperty(headerRowElm, 'scrollLeft', { writable: true, value: 25 });

        headerRowElm.dispatchEvent(new CustomEvent('scroll'));

        const viewportTopLeft = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
        expect(viewportTopLeft.scrollLeft).toBe(25);
      });

      it('should update viewport top/left scrollLeft when scrolling in footerRow DOM element', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, {
          ...defaultOptions,
          createFooterRow: true,
          showFooterRow: true,
          enableCellNavigation: true,
        });
        const footerRowElm = container.querySelector('.slick-footerrow') as HTMLDivElement;
        Object.defineProperty(footerRowElm, 'scrollLeft', { writable: true, value: 25 });

        footerRowElm.dispatchEvent(new CustomEvent('scroll'));

        const viewportTopLeft = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
        expect(viewportTopLeft.scrollLeft).toBe(25);
      });

      it('should update viewport top/left scrollLeft when scrolling in preHeader DOM element', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, {
          ...defaultOptions,
          createPreHeaderPanel: true,
          preHeaderPanelHeight: 44,
          showPreHeaderPanel: true,
          enableCellNavigation: true,
        });
        const preheaderElm = container.querySelector('.slick-preheader-panel') as HTMLDivElement;
        Object.defineProperty(preheaderElm, 'scrollLeft', { writable: true, value: 25 });

        preheaderElm.dispatchEvent(new CustomEvent('scroll'));

        const viewportTopLeft = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
        expect(viewportTopLeft.scrollLeft).toBe(25);

        // when enableTextSelectionOnCells isn't enabled and trigger IE related code
        const selectStartEvent = new CustomEvent('selectstart');
        Object.defineProperty(selectStartEvent, 'target', { writable: true, value: document.createElement('TextArea') });
        viewportTopLeft.dispatchEvent(selectStartEvent);
      });

      it('should update viewport top/left scrollLeft when scrolling in topHeader DOM element', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, {
          ...defaultOptions,
          createTopHeaderPanel: true,
          topHeaderPanelHeight: 44,
          showTopHeaderPanel: true,
          enableCellNavigation: true,
        });
        const topheaderElm = container.querySelector('.slick-topheader-panel') as HTMLDivElement;
        Object.defineProperty(topheaderElm, 'scrollLeft', { writable: true, value: 25 });

        topheaderElm.dispatchEvent(new CustomEvent('scroll'));

        const viewportTopLeft = container.querySelector('.slick-viewport-top.slick-viewport-left') as HTMLDivElement;
        expect(viewportTopLeft.scrollLeft).toBe(25);

        // when enableTextSelectionOnCells isn't enabled and trigger IE related code
        const selectStartEvent = new CustomEvent('selectstart');
        Object.defineProperty(selectStartEvent, 'target', { writable: true, value: document.createElement('TextArea') });
        viewportTopLeft.dispatchEvent(selectStartEvent);
      });

      it('should NOT trigger onHeaderRowMouseEnter notify when hovering a header when "slick-headerrow-column" class is not found', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, showHeaderRow: true, enableCellNavigation: true });
        const onHeaderRowMouseEnterSpy = vi.spyOn(grid.onHeaderRowMouseEnter, 'notify');
        const headerRowElm = container.querySelector('.slick-headerrow-column');
        headerRowElm!.classList.remove('slick-headerrow-column');
        headerRowElm!.dispatchEvent(new CustomEvent('mouseenter'));

        expect(onHeaderRowMouseEnterSpy).not.toHaveBeenCalled();
      });

      it('should NOT trigger onHeaderRowMouseOver notify when hovering a header when "slick-headerrow-column" class is not found', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, showHeaderRow: true, enableCellNavigation: true });
        const onHeaderRowMouseOverSpy = vi.spyOn(grid.onHeaderRowMouseOver, 'notify');
        const headerRowElm = container.querySelector('.slick-headerrow-column');
        headerRowElm!.classList.remove('slick-headerrow-column');
        headerRowElm!.dispatchEvent(new CustomEvent('mouseover'));

        expect(onHeaderRowMouseOverSpy).not.toHaveBeenCalled();
      });

      it('should trigger onHeaderRowMouseLeave notify when leaving the hovering of a header', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, showHeaderRow: true, enableCellNavigation: true });
        const onHeaderRowMouseLeaveSpy = vi.spyOn(grid.onHeaderRowMouseLeave, 'notify');
        container.querySelector('.slick-headerrow-column')!.dispatchEvent(new CustomEvent('mouseleave'));

        expect(onHeaderRowMouseLeaveSpy).toHaveBeenCalled();
      });

      it('should NOT trigger onHeaderRowMouseLeave notify when leaving the hovering of a header when "slick-headerrow-column" class is not found', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, showHeaderRow: true, enableCellNavigation: true });
        const onHeaderRowMouseLeaveSpy = vi.spyOn(grid.onHeaderRowMouseLeave, 'notify');
        const headerRowElm = container.querySelector('.slick-headerrow-column');
        headerRowElm!.classList.remove('slick-headerrow-column');
        headerRowElm!.dispatchEvent(new CustomEvent('mouseleave'));

        expect(onHeaderRowMouseLeaveSpy).not.toHaveBeenCalled();
      });

      it('should trigger onHeaderRowMouseOut notify when leaving the hovering of a header', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, showHeaderRow: true, enableCellNavigation: true });
        const onHeaderRowMouseOutSpy = vi.spyOn(grid.onHeaderRowMouseOut, 'notify');
        container.querySelector('.slick-headerrow-column')!.dispatchEvent(new CustomEvent('mouseout'));

        expect(onHeaderRowMouseOutSpy).toHaveBeenCalled();
      });

      it('should NOT trigger onHeaderRowMouseOut notify when leaving the hovering of a header when "slick-headerrow-column" class is not found', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, showHeaderRow: true, enableCellNavigation: true });
        const onHeaderRowMouseOutSpy = vi.spyOn(grid.onHeaderRowMouseOut, 'notify');
        const headerRowElm = container.querySelector('.slick-headerrow-column');
        headerRowElm!.classList.remove('slick-headerrow-column');
        headerRowElm!.dispatchEvent(new CustomEvent('mouseout'));

        expect(onHeaderRowMouseOutSpy).not.toHaveBeenCalled();
      });
    });

    describe('Footer Click', () => {
      it('should trigger onFooterClick notify when not column resizing', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, createFooterRow: true, enableCellNavigation: true });
        const onFooterClickSpy = vi.spyOn(grid.onFooterClick, 'notify');
        const FooterColumns = container.querySelectorAll('.slick-footerrow-column');
        const event = new CustomEvent('click');
        Object.defineProperty(event, 'target', { writable: true, value: FooterColumns[0] });
        container.querySelector('.slick-footerrow-columns.slick-footerrow-columns-left')!.dispatchEvent(event);

        expect(onFooterClickSpy).toHaveBeenCalledWith({ column: columns[0], grid }, expect.anything(), grid);
      });
    });

    describe('Footer Context Menu', () => {
      it('should trigger onFooterClick notify grid context menu event is triggered', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, createFooterRow: true, enableCellNavigation: true });
        const onContextSpy = vi.spyOn(grid.onFooterContextMenu, 'notify');
        const footerColumns = container.querySelectorAll('.slick-footerrow-column');
        const event = new CustomEvent('contextmenu');
        Object.defineProperty(event, 'target', { writable: true, value: footerColumns[0] });
        container.querySelector('.slick-footerrow-columns.slick-footerrow-columns-left')!.dispatchEvent(event);

        expect(onContextSpy).toHaveBeenCalledWith({ column: columns[0], grid }, expect.anything(), grid);
      });
    });

    describe('Keydown Events', () => {
      it('should copy cell value to clipboard when triggering Ctrl+C key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, {
          ...defaultOptions,
          enableCellNavigation: true,
          enableExcelCopyBuffer: false,
          editable: true,
        });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'C' });
        Object.defineProperty(event, 'ctrlKey', { writable: true, value: true });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(copyCellToClipboard).toHaveBeenCalled();
      });

      it('should call navigateRowStart() when triggering Home key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateRowStartSpy = vi.spyOn(grid, 'navigateRowStart');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'Home' });
        Object.defineProperty(event, 'ctrlKey', { writable: true, value: false });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateRowStartSpy).toHaveBeenCalled();
      });

      it('should call navigateRowStart() when triggering Ctrl+ArrowLeft key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateRowStartSpy = vi.spyOn(grid, 'navigateRowStart');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'ArrowLeft' });
        Object.defineProperty(event, 'ctrlKey', { writable: true, value: true });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateRowStartSpy).toHaveBeenCalled();
      });

      it('should call navigateTopStart() when triggering Ctrl+Home key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateTopStartSpy = vi.spyOn(grid, 'navigateTopStart');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'Home' });
        Object.defineProperty(event, 'ctrlKey', { writable: true, value: true });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateTopStartSpy).toHaveBeenCalled();
      });

      it('should call navigateTop() when triggering Ctrl+ArrowUp key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateTopSpy = vi.spyOn(grid, 'navigateTop');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'ArrowUp' });
        Object.defineProperty(event, 'ctrlKey', { writable: true, value: true });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateTopSpy).toHaveBeenCalled();
      });

      it('should call navigateBottomEnd() when triggering Ctrl+End key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateBottomEndSpy = vi.spyOn(grid, 'navigateBottomEnd');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'End' });
        Object.defineProperty(event, 'ctrlKey', { writable: true, value: true });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateBottomEndSpy).toHaveBeenCalled();
      });

      it('should call navigateRowEnd() when triggering End key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateRowEndSpy = vi.spyOn(grid, 'navigateRowEnd');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'End' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateRowEndSpy).toHaveBeenCalled();
      });

      it('should call navigateRowEnd() when triggering Ctrl+ArrowRight key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateRowEndSpy = vi.spyOn(grid, 'navigateRowEnd');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'ArrowRight' });
        Object.defineProperty(event, 'ctrlKey', { writable: true, value: true });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateRowEndSpy).toHaveBeenCalled();
      });

      it('should call navigateBottom() when triggering Ctrl+ArrowDown key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateBottomSpy = vi.spyOn(grid, 'navigateBottom');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'ArrowDown' });
        Object.defineProperty(event, 'ctrlKey', { writable: true, value: true });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateBottomSpy).toHaveBeenCalled();
      });

      it('should call navigateTop() when triggering Ctrl+ArrowUp key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateTopSpy = vi.spyOn(grid, 'navigateTop');
        const unsetActiveCellSpy = vi.spyOn(grid, 'unsetActiveCell');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'ArrowUp' });
        Object.defineProperty(event, 'ctrlKey', { writable: true, value: true });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateTopSpy).toHaveBeenCalled();
        expect(unsetActiveCellSpy).toHaveBeenCalled();
      });

      it('should call navigatePageDown() when triggering PageDown key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigatePageDownSpy = vi.spyOn(grid, 'navigatePageDown');
        const unsetActiveCellSpy = vi.spyOn(grid, 'unsetActiveCell');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'PageDown' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigatePageDownSpy).toHaveBeenCalled();
        expect(unsetActiveCellSpy).toHaveBeenCalled();
      });

      it('should call navigatePageUp() when triggering PageDown key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigatePageUpSpy = vi.spyOn(grid, 'navigatePageUp');
        const unsetActiveCellSpy = vi.spyOn(grid, 'unsetActiveCell');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'PageUp' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigatePageUpSpy).toHaveBeenCalled();
        expect(unsetActiveCellSpy).toHaveBeenCalled();
      });

      it('should call navigateLeft() when triggering PageDown key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateLeftSpy = vi.spyOn(grid, 'navigateLeft');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'ArrowLeft' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateLeftSpy).toHaveBeenCalled();
      });

      it('should call navigateRight() when triggering PageDown key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateRightSpy = vi.spyOn(grid, 'navigateRight');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'ArrowRight' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateRightSpy).toHaveBeenCalled();
      });

      it('should call navigateUp() when triggering PageDown key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateUpSpy = vi.spyOn(grid, 'navigateUp');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'ArrowUp' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateUpSpy).toHaveBeenCalled();
      });

      it('should call navigateDown() when triggering PageDown key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateDownSpy = vi.spyOn(grid, 'navigateDown');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'ArrowDown' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateDownSpy).toHaveBeenCalled();
      });

      it('should call navigateNext() when triggering PageDown key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigateNextSpy = vi.spyOn(grid, 'navigateNext');
        const unsetActiveCellSpy = vi.spyOn(grid, 'unsetActiveCell');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'Tab' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigateNextSpy).toHaveBeenCalled();
        expect(unsetActiveCellSpy).toHaveBeenCalled();
      });

      it('should call navigatePrev() when triggering Enter key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const navigatePrevSpy = vi.spyOn(grid, 'navigatePrev');
        const unsetActiveCellSpy = vi.spyOn(grid, 'unsetActiveCell');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'Tab' });
        Object.defineProperty(event, 'shiftKey', { writable: true, value: true });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(navigatePrevSpy).toHaveBeenCalled();
        expect(unsetActiveCellSpy).toHaveBeenCalled();
      });

      it('should do nothing when triggering Escape key without any editor to cancel', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const event = new CustomEvent('keydown');
        const cancelEditSpy = vi.spyOn(grid.getEditorLock(), 'cancelCurrentEdit');
        Object.defineProperty(event, 'key', { writable: true, value: 'Escape' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(cancelEditSpy).not.toHaveBeenCalled();
      });

      it('should cancel opened editor when triggering Escape key and editor is active', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const event = new CustomEvent('keydown');
        vi.spyOn(grid.getEditorLock(), 'isActive').mockReturnValue(true);
        const cancelEditSpy = vi.spyOn(grid.getEditorLock(), 'cancelCurrentEdit');
        Object.defineProperty(event, 'key', { writable: true, value: 'Escape' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(cancelEditSpy).toHaveBeenCalled();
      });

      it('should call navigateDown() when triggering Enter key', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const event = new CustomEvent('keydown');
        Object.defineProperty(event, 'key', { writable: true, value: 'Enter' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
      });

      it('should commit editor & set focus to next down cell when triggering Enter key with an active Editor', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        vi.spyOn(grid.getEditorLock(), 'commitCurrentEdit').mockReturnValueOnce(true);
        grid.setActiveCell(0, 1);
        grid.editActiveCell(InputEditor as any, true);
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const event = new CustomEvent('keydown');
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
        Object.defineProperty(event, 'key', { writable: true, value: 'Enter' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
      });

      it('should navigateDown() when triggering Enter key with an active Editor that is considered a new row', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        grid.setActiveCell(0, 1);
        grid.editActiveCell(InputEditor as any, true);
        vi.spyOn(grid, 'getDataLength').mockReturnValueOnce(0);
        const navigateDownSpy = vi.spyOn(grid, 'navigateDown');
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const event = new CustomEvent('keydown');
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
        Object.defineProperty(event, 'key', { writable: true, value: 'Enter' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
        expect(navigateDownSpy).toHaveBeenCalled();
      });

      it('should do nothing when active Editor has multiple keyCaptureList and event is triggered is part of that list', () => {
        const columns = [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'age', field: 'age', name: 'Age', editorClass: InputEditor },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, items, columns, { ...defaultOptions, enableCellNavigation: true, editable: true });
        grid.setActiveCell(0, 1);
        grid.editActiveCell(InputEditor as any, true);
        (InputEditor.prototype as any).keyCaptureList = [1, 2, 3];
        const onKeyDownSpy = vi.spyOn(grid.onKeyDown, 'notify');
        const event = new CustomEvent('keydown');
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
        Object.defineProperty(event, 'which', { writable: true, value: 2 });
        Object.defineProperty(event, 'key', { writable: true, value: 'Enter' });
        container.querySelector('.grid-canvas-left')!.dispatchEvent(event);

        expect(onKeyDownSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).not.toHaveBeenCalled();
      });
    });
  });
});
