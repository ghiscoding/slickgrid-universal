import { emptyElement, getHtmlElementOffset, } from '../services/domUtilities';
import { CellRange, CellRangeSelectorOption, DOMMouseEvent, DragPosition, DragRange, GridOption, OnScrollEventArgs, SlickEventHandler, SlickGrid, SlickNamespace } from '../interfaces/index';
import { SlickCellRangeDecorator } from './index';
import { deepMerge } from '../services/utilities';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class SlickCellRangeSelector {
  protected _activeCanvas?: HTMLElement;
  protected _addonOptions!: CellRangeSelectorOption;
  protected _currentlySelectedRange: DragRange | null = null;
  protected _canvas!: HTMLElement;
  protected _decorator!: SlickCellRangeDecorator;
  protected _dragging = false;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _gridOptions!: GridOption;
  protected _gridUid = '';

  // Frozen row & column constiables
  protected _columnOffset = 0;
  protected _rowOffset = 0;
  protected _isRightCanvas = false;
  protected _isBottomCanvas = false;

  // Scrollings
  protected _scrollLeft = 0;
  protected _scrollTop = 0;
  protected _defaults = {
    selectionCss: {
      border: '2px dashed blue'
    }
  } as CellRangeSelectorOption;
  pluginName = 'CellRangeSelector';
  onBeforeCellRangeSelected = new Slick.Event();
  onCellRangeSelected = new Slick.Event<{ range: CellRange; }>();

  constructor(options?: Partial<CellRangeSelectorOption>) {
    this._eventHandler = new Slick.EventHandler();
    this._addonOptions = deepMerge(this._defaults, options);
  }

  get addonOptions() {
    return this._addonOptions;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this._gridUid || (this._grid?.getUID() ?? '');
  }
  get gridUidSelector(): string {
    return this.gridUid ? `.${this.gridUid}` : '';
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._decorator = this._addonOptions.cellDecorator || new SlickCellRangeDecorator(grid, this._addonOptions);
    this._canvas = grid.getCanvasNode();
    this._gridOptions = grid.getOptions();
    this._gridUid = grid.getUID();

    this._eventHandler
      .subscribe(this._grid.onDrag, this.handleDrag.bind(this) as EventListener)
      .subscribe(this._grid.onDragInit, this.handleDragInit.bind(this) as EventListener)
      .subscribe(this._grid.onDragStart, this.handleDragStart.bind(this) as EventListener)
      .subscribe(this._grid.onDragEnd, this.handleDragEnd.bind(this) as EventListener)
      .subscribe(this._grid.onScroll, this.handleScroll.bind(this) as EventListener);
  }

  /** Dispose the plugin. */
  dispose() {
    this._eventHandler?.unsubscribeAll();
    emptyElement(this._activeCanvas);
    emptyElement(this._canvas);
    if (this._decorator?.dispose) {
      this._decorator.dispose();
    }
  }

  getCellDecorator() {
    return this._decorator;
  }

  getCurrentRange() {
    return this._currentlySelectedRange;
  }

  //
  // protected functions
  // ---------------------

  protected handleDrag(e: any, dd: DragPosition) {
    if (!this._dragging) {
      return;
    }
    e.stopImmediatePropagation();

    const end = this._grid.getCellFromPoint(
      e.pageX - (getHtmlElementOffset(this._activeCanvas)?.left ?? 0) + this._columnOffset,
      e.pageY - (getHtmlElementOffset(this._activeCanvas)?.top ?? 0) + this._rowOffset
    );

    // ... frozen column(s),
    if (this._gridOptions.frozenColumn! >= 0 && ((!this._isRightCanvas && (end.cell > this._gridOptions.frozenColumn!)) || (this._isRightCanvas && (end.cell <= this._gridOptions.frozenColumn!)))) {
      return;
    }

    // ... or frozen row(s)
    if (this._gridOptions.frozenRow! >= 0 && ((!this._isBottomCanvas && (end.row >= this._gridOptions.frozenRow!)) || (this._isBottomCanvas && (end.row < this._gridOptions.frozenRow!)))) {
      return;
    }

    // ... or regular grid (without any frozen options)
    if (!this._grid.canCellBeSelected(end.row, end.cell)) {
      return;
    }

    dd.range.end = end;
    this._decorator.show(new Slick.Range(dd.range.start.row, dd.range.start.cell, end.row, end.cell));
  }

  protected handleDragEnd(e: any, dd: DragPosition) {
    if (!this._dragging) {
      return;
    }

    this._dragging = false;
    e.stopImmediatePropagation();

    this._decorator.hide();
    this.onCellRangeSelected.notify({
      range: new Slick.Range(dd.range.start.row, dd.range.start.cell, dd.range.end.row, dd.range.end.cell)
    });
  }

  protected handleDragInit(e: any) {
    // Set the active canvas node because the decorator needs to append its
    // box to the correct canvas
    this._activeCanvas = this._grid.getActiveCanvasNode(e);

    this._rowOffset = 0;
    this._columnOffset = 0;
    this._isBottomCanvas = this._activeCanvas.classList.contains('grid-canvas-bottom');

    if (this._gridOptions.frozenRow! > -1 && this._isBottomCanvas) {
      const canvasSelector = `${this.gridUidSelector} .grid-canvas-${this._gridOptions.frozenBottom ? 'bottom' : 'top'}`;
      this._rowOffset = document.querySelector(canvasSelector)?.clientHeight ?? 0;
    }

    this._isRightCanvas = this._activeCanvas.classList.contains('grid-canvas-right');

    if (this._gridOptions.frozenColumn! > -1 && this._isRightCanvas) {
      this._columnOffset = document.querySelector(`${this.gridUidSelector} .grid-canvas-left`)?.clientWidth ?? 0;
    }

    // prevent the grid from cancelling drag'n'drop by default
    e.stopImmediatePropagation();
  }

  protected handleDragStart(e: DOMMouseEvent<HTMLDivElement>, dd: DragPosition) {
    const cellObj = this._grid.getCellFromEvent(e);
    if (this.onBeforeCellRangeSelected.notify(cellObj) !== false) {
      if (cellObj && this._grid.canCellBeSelected(cellObj.row, cellObj.cell)) {
        this._dragging = true;
        e.stopImmediatePropagation();
      }
    }
    if (!this._dragging) {
      return;
    }

    this._grid.focus();

    let startX = dd.startX - (getHtmlElementOffset(this._canvas)?.left ?? 0);
    if (this._gridOptions.frozenColumn! >= 0 && this._isRightCanvas) {
      startX += this._scrollLeft;
    }

    let startY = dd.startY - (getHtmlElementOffset(this._canvas)?.top ?? 0);
    if (this._gridOptions.frozenRow! >= 0 && this._isBottomCanvas) {
      startY += this._scrollTop;
    }

    const start = this._grid.getCellFromPoint(startX, startY);
    dd.range = { start, end: {} };
    this._currentlySelectedRange = dd.range;
    return this._decorator.show(new Slick.Range(start.row, start.cell));
  }

  protected handleScroll(_e: DOMMouseEvent<HTMLDivElement>, args: OnScrollEventArgs) {
    this._scrollTop = args.scrollTop;
    this._scrollLeft = args.scrollLeft;
  }
}