import { emptyElement, getHtmlElementOffset, } from '../services/domUtilities';
import { CellRange, DOMMouseEvent, GridOption, SlickGrid, SlickNamespace } from '../interfaces/index';
import { CellRangeDecorator } from './index';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

interface DragPosition {
  startX: number;
  startY: number;
  range: DragRange;
}

interface DragRange {
  start: {
    row?: number;
    cell?: number;
  };
  end: {
    row?: number;
    cell?: number;
  };
}

export class CellRangeSelector {
  protected _addonOptions!: any;
  protected _currentlySelectedRange!: DragRange;
  protected _canvas!: HTMLElement;
  protected _grid!: SlickGrid;
  protected _gridOptions!: GridOption;
  protected _activeCanvas?: HTMLElement;
  protected _dragging = false;
  protected _decorator!: CellRangeDecorator;
  protected _eventHandler = new Slick.EventHandler();

  // Frozen row & column constiables
  protected _rowOffset: any;
  protected _columnOffset: any;
  protected _isRightCanvas = false;
  protected _isBottomCanvas = false;

  // Scrollings
  protected _scrollTop = 0;
  protected _scrollLeft = 0;
  protected _defaults = {
    selectionCss: {
      border: '2px dashed blue'
    } as CSSStyleDeclaration
  };
  pluginName = 'CellRangeSelector';
  onBeforeCellRangeSelected = new Slick.Event();
  onCellRangeSelected = new Slick.Event<{ range: CellRange; }>();

  constructor(options: any) {
    this._addonOptions = { ...this._defaults, ...options };
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._decorator = this._addonOptions.cellDecorator || new CellRangeDecorator(grid, this._addonOptions);
    this._grid = grid;
    this._canvas = this._grid.getCanvasNode();
    this._gridOptions = this._grid.getOptions();
    this._eventHandler
      .subscribe(this._grid.onScroll, this.handleScroll.bind(this) as EventListener)
      .subscribe(this._grid.onDragInit, this.handleDragInit.bind(this) as EventListener)
      .subscribe(this._grid.onDragStart, this.handleDragStart.bind(this) as EventListener)
      .subscribe(this._grid.onDrag, this.handleDrag.bind(this) as EventListener)
      .subscribe(this._grid.onDragEnd, this.handleDragEnd.bind(this) as EventListener);
  }

  destroy() {
    this._eventHandler.unsubscribeAll();
    emptyElement(this._activeCanvas);
    emptyElement(this._canvas);
    if (this._decorator?.destroy) {
      this._decorator.destroy();
    }
  }

  getCellDecorator() {
    return this._decorator;
  }

  handleScroll(_e: DOMMouseEvent<HTMLDivElement>, args: { scrollTop: number; scrollLeft: number; }) {
    this._scrollTop = args.scrollTop;
    this._scrollLeft = args.scrollLeft;
  }

  handleDragInit(e: any) {
    // Set the active canvas node because the decorator needs to append its
    // box to the correct canvas
    this._activeCanvas = this._grid.getActiveCanvasNode(e);

    this._rowOffset = 0;
    this._columnOffset = 0;
    this._isBottomCanvas = this._activeCanvas.classList.contains('grid-canvas-bottom');

    if (this._gridOptions.frozenRow! > -1 && this._isBottomCanvas) {
      this._rowOffset = (this._gridOptions.frozenBottom) ? document.querySelector('.' + this._grid.getUID() + ' .grid-canvas-bottom')?.clientHeight ?? 0 : document.querySelector('.' + this._grid.getUID() + ' .grid-canvas-top')?.clientHeight ?? 0;
    }

    this._isRightCanvas = this._activeCanvas.classList.contains('grid-canvas-right');

    if (this._gridOptions.frozenColumn! > -1 && this._isRightCanvas) {
      this._columnOffset = document.querySelector('.' + this._grid.getUID() + ' .grid-canvas-left')?.clientWidth ?? 0;
    }

    // prevent the grid from cancelling drag'n'drop by default
    e.stopImmediatePropagation();
  }

  handleDragStart(e: DOMMouseEvent<HTMLDivElement>, dd: DragPosition) {
    const cell = this._grid.getCellFromEvent(e);
    if (this.onBeforeCellRangeSelected.notify(cell) !== false) {
      if (this._grid.canCellBeSelected(cell!.row, cell!.cell)) {
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

  handleDrag(e: any, dd: DragPosition) {
    if (!this._dragging) {
      return;
    }
    e.stopImmediatePropagation();

    const end = this._grid.getCellFromPoint(
      e.pageX - (getHtmlElementOffset(this._activeCanvas)?.left ?? 0) + this._columnOffset,
      e.pageY - (getHtmlElementOffset(this._activeCanvas)?.top ?? 0) + this._rowOffset
    );

    // ... frozen column(s),
    if (this._gridOptions.frozenColumn! >= 0 && (!this._isRightCanvas && (end.cell > this._gridOptions.frozenColumn!)) || (this._isRightCanvas && (end.cell <= this._gridOptions.frozenColumn!))) {
      return;
    }

    // ... or frozen row(s)
    if (this._gridOptions.frozenRow! >= 0 && (!this._isBottomCanvas && (end.row >= this._gridOptions.frozenRow!)) || (this._isBottomCanvas && (end.row < this._gridOptions.frozenRow!))) {
      return;
    }

    // ... or regular grid (without any frozen options)
    if (!this._grid.canCellBeSelected(end.row, end.cell)) {
      return;
    }

    dd.range.end = end;

    this._decorator.show(new Slick.Range(dd.range.start.row, dd.range.start.cell, end.row, end.cell));
  }

  handleDragEnd(e: any, dd: DragPosition) {
    if (!this._dragging) {
      return;
    }

    this._dragging = false;
    e.stopImmediatePropagation();

    this._decorator.hide();
    this.onCellRangeSelected.notify({
      range: new Slick.Range(
        dd.range.start.row,
        dd.range.start.cell,
        dd.range.end.row,
        dd.range.end.cell
      )
    });
  }

  getCurrentRange() {
    return this._currentlySelectedRange;
  }
}