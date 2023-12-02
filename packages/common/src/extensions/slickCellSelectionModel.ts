import { isDefined } from '@slickgrid-universal/utils';

import type { CellRange, OnActiveCellChangedEventArgs, SlickDataView, SlickEventHandler, SlickGrid, SlickNamespace, SlickRange } from '../interfaces/index';
import { SlickCellRangeSelector } from './index';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export interface CellSelectionModelOption {
  selectActiveCell?: boolean;
  cellRangeSelector: SlickCellRangeSelector;
}

export class SlickCellSelectionModel {
  protected _addonOptions?: CellSelectionModelOption;
  protected _cachedPageRowCount = 0;
  protected _eventHandler: SlickEventHandler;
  protected _dataView?: SlickDataView;
  protected _grid!: SlickGrid;
  protected _prevSelectedRow?: number;
  protected _prevKeyDown = '';
  protected _ranges: CellRange[] = [];
  protected _selector: SlickCellRangeSelector;
  protected _defaults = {
    selectActiveCell: true,
  };
  onSelectedRangesChanged = new Slick.Event<CellRange[]>();
  pluginName: 'CellSelectionModel' = 'CellSelectionModel' as const;

  constructor(options?: { selectActiveCell: boolean; cellRangeSelector: SlickCellRangeSelector; }) {
    this._eventHandler = new Slick.EventHandler();
    if (options === undefined || options.cellRangeSelector === undefined) {
      this._selector = new SlickCellRangeSelector({ selectionCss: { border: '2px solid black' } as CSSStyleDeclaration });
    } else {
      this._selector = options.cellRangeSelector;
    }
    this._addonOptions = options;
  }

  get addonOptions() {
    return this._addonOptions;
  }

  get cellRangeSelector() {
    return this._selector;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }


  init(grid: SlickGrid) {
    this._grid = grid;
    if (this.hasDataView()) {
      this._dataView = grid?.getData() ?? {} as SlickDataView;
    }
    this._addonOptions = { ...this._defaults, ...this._addonOptions } as CellSelectionModelOption;
    this._eventHandler
      .subscribe(this._grid.onActiveCellChanged, this.handleActiveCellChange.bind(this) as EventListener)
      .subscribe(this._grid.onKeyDown, this.handleKeyDown.bind(this) as EventListener)
      .subscribe(this._selector.onBeforeCellRangeSelected, this.handleBeforeCellRangeSelected.bind(this) as EventListener)
      .subscribe(this._selector.onCellRangeSelected, this.handleCellRangeSelected.bind(this) as EventListener);

    // register the cell range selector plugin
    grid.registerPlugin(this._selector);
  }

  destroy() {
    this.dispose();
  }

  dispose() {
    if (this._selector) {
      this._selector.onBeforeCellRangeSelected.unsubscribe(this.handleBeforeCellRangeSelected.bind(this) as EventListener);
      this._selector.onCellRangeSelected.unsubscribe(this.handleCellRangeSelected.bind(this) as EventListener);
    }
    this._eventHandler.unsubscribeAll();
    this._grid?.unregisterPlugin(this._selector);
    this._selector?.dispose();
  }

  getSelectedRanges(): CellRange[] {
    return this._ranges;
  }

  /**
   * Get the number of rows displayed in the viewport
   * Note that the row count is an approximation because it is a calculated value using this formula (viewport / rowHeight = rowCount),
   * the viewport must also be displayed for this calculation to work.
   * @return {Number} rowCount
   */
  getViewportRowCount() {
    const viewportElm = this._grid.getViewportNode();
    const viewportHeight = viewportElm?.clientHeight ?? 0;
    const scrollbarHeight = this._grid.getScrollbarDimensions()?.height ?? 0;
    return Math.floor((viewportHeight - scrollbarHeight) / this._grid.getOptions().rowHeight!) || 1;
  }

  hasDataView() {
    return !Array.isArray(this._grid.getData());
  }

  rangesAreEqual(range1: CellRange[], range2: CellRange[]) {
    let areDifferent = (range1.length !== range2.length);
    if (!areDifferent) {
      for (let i = 0; i < range1.length; i++) {
        if (range1[i].fromCell !== range2[i].fromCell
          || range1[i].fromRow !== range2[i].fromRow
          || range1[i].toCell !== range2[i].toCell
          || range1[i].toRow !== range2[i].toRow
        ) {
          areDifferent = true;
          break;
        }
      }
    }
    return !areDifferent;
  }

  refreshSelections() {
    this.setSelectedRanges(this.getSelectedRanges());
  }

  removeInvalidRanges(ranges: CellRange[]) {
    const result = [];
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (this._grid.canCellBeSelected(r.fromRow, r.fromCell) && this._grid.canCellBeSelected(r.toRow, r.toCell)) {
        result.push(r);
      }
    }
    return result;
  }

  /** Provide a way to force a recalculation of page row count (for example on grid resize) */
  resetPageRowCount() {
    this._cachedPageRowCount = 0;
  }

  setSelectedRanges(ranges: CellRange[], caller = 'SlickCellSelectionModel.setSelectedRanges') {
    // simple check for: empty selection didn't change, prevent firing onSelectedRangesChanged
    if ((!this._ranges || this._ranges.length === 0) && (!ranges || ranges.length === 0)) {
      return;
    }

    // if range has not changed, don't fire onSelectedRangesChanged
    const rangeHasChanged = !this.rangesAreEqual(this._ranges, ranges);

    this._ranges = this.removeInvalidRanges(ranges);
    if (rangeHasChanged) {
      const eventData = new Slick.EventData();
      Object.defineProperty(eventData, 'detail', { writable: true, configurable: true, value: { caller } });
      this.onSelectedRangesChanged.notify(this._ranges, eventData);
    }
  }

  //
  // protected functions
  // ---------------------

  protected handleActiveCellChange(_e: Event, args: OnActiveCellChangedEventArgs) {
    this._prevSelectedRow = undefined;
    const isCellDefined = isDefined(args.cell);
    const isRowDefined = isDefined(args.row);

    if (this._addonOptions?.selectActiveCell && isRowDefined && isCellDefined) {
      this.setSelectedRanges([new Slick.Range(args.row, args.cell)]);
    } else if (!this._addonOptions?.selectActiveCell || (!isRowDefined && !isCellDefined)) {
      // clear the previous selection once the cell changes
      this.setSelectedRanges([]);
    }
  }

  protected handleBeforeCellRangeSelected(e: any): boolean | void {
    if (this._grid.getEditorLock().isActive()) {
      e.stopPropagation();
      return false;
    }
  }

  protected handleCellRangeSelected(_e: any, args: { range: CellRange; }) {
    this._grid.setActiveCell(args.range.fromRow, args.range.fromCell, false, false, true);
    this.setSelectedRanges([args.range as SlickRange]);
  }

  protected isKeyAllowed(key: string) {
    return ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageDown', 'PageUp', 'Home', 'End'].some(k => k === key);
  }

  protected handleKeyDown(e: KeyboardEvent) {
    let ranges: CellRange[];
    let last: SlickRange;
    const colLn = this._grid.getColumns().length;
    const active = this._grid.getActiveCell();

    let dataLn = 0;
    if (this._dataView) {
      dataLn = this._dataView?.getPagingInfo().pageSize || this._dataView.getLength();
    } else {
      dataLn = this._grid.getDataLength();
    }

    if (active && (e.shiftKey || e.ctrlKey) && !e.altKey && this.isKeyAllowed(e.key)) {
      ranges = this.getSelectedRanges().slice();
      if (!ranges.length) {
        ranges.push(new Slick.Range(active.row, active.cell));
      }
      // keyboard can work with last range only
      last = ranges.pop() as SlickRange;

      if (typeof last?.contains === 'function') {
        // can't handle selection out of active cell
        if (!last.contains(active.row, active.cell)) {
          last = new Slick.Range(active.row, active.cell);
        }
        let dRow = last.toRow - last.fromRow;
        let dCell = last.toCell - last.fromCell;

        // walking direction
        const dirRow = active.row === last.fromRow ? 1 : -1;
        const dirCell = active.cell === last.fromCell ? 1 : -1;
        const isSingleKeyMove = e.key.startsWith('Arrow');
        let toCell: undefined | number;
        let toRow = 0;

        if (isSingleKeyMove && !e.ctrlKey) {
          // single cell move: (Arrow{Up/ArrowDown/ArrowLeft/ArrowRight})
          if (e.key === 'ArrowLeft') {
            dCell -= dirCell;
          } else if (e.key === 'ArrowRight') {
            dCell += dirCell;
          } else if (e.key === 'ArrowUp') {
            dRow -= dirRow;
          } else if (e.key === 'ArrowDown') {
            dRow += dirRow;
          }
          toRow = active.row + dirRow * dRow;
        } else {
          // multiple cell moves: (Home, End, Page{Up/Down}), we need to know how many rows are displayed on a page
          if (this._cachedPageRowCount < 1) {
            this._cachedPageRowCount = this.getViewportRowCount();
          }
          if (this._prevSelectedRow === undefined) {
            this._prevSelectedRow = active.row;
          }

          if (e.shiftKey && !e.ctrlKey && e.key === 'Home') {
            toCell = 0;
            toRow = active.row;
          } else if (e.shiftKey && !e.ctrlKey && e.key === 'End') {
            toCell = colLn - 1;
            toRow = active.row;
          } else if (e.ctrlKey && e.shiftKey && e.key === 'Home') {
            toCell = 0;
            toRow = 0;
          } else if (e.ctrlKey && e.shiftKey && e.key === 'End') {
            toCell = colLn - 1;
            toRow = dataLn - 1;
          } else if (e.key === 'PageUp') {
            if (this._prevSelectedRow >= 0) {
              toRow = this._prevSelectedRow - this._cachedPageRowCount;
            }
            if (toRow < 0) {
              toRow = 0;
            }
          } else if (e.key === 'PageDown') {
            if (this._prevSelectedRow <= dataLn - 1) {
              toRow = this._prevSelectedRow + this._cachedPageRowCount;
            }
            if (toRow > dataLn - 1) {
              toRow = dataLn - 1;
            }
          }
          this._prevSelectedRow = toRow;
        }

        // define new selection range
        toCell ??= active.cell + dirCell * dCell;
        const newLast = new Slick.Range(active.row, active.cell, toRow, toCell);
        if (this.removeInvalidRanges([newLast]).length) {
          ranges.push(newLast);
          const viewRow = dirRow > 0 ? newLast.toRow : newLast.fromRow;
          const viewCell = dirCell > 0 ? newLast.toCell : newLast.fromCell;
          if (isSingleKeyMove) {
            this._grid.scrollRowIntoView(viewRow);
            this._grid.scrollCellIntoView(viewRow, viewCell, false);
          } else {
            this._grid.scrollRowIntoView(toRow);
            this._grid.scrollCellIntoView(toRow, viewCell, false);
          }
        } else {
          ranges.push(last);
        }
        this.setSelectedRanges(ranges);

        e.preventDefault();
        e.stopPropagation();
        this._prevKeyDown = e.key;
      }
    }
  }
}