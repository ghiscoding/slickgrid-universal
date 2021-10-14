import { KeyCode } from '../enums/index';
import { CellRange, OnActiveCellChangedEventArgs, SlickEventHandler, SlickGrid, SlickNamespace, SlickRange, } from '../interfaces/index';
import { SlickCellRangeSelector } from './index';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export interface CellSelectionModelOption {
  selectActiveCell: boolean;
  cellRangeSelector: SlickCellRangeSelector;
}

export class SlickCellSelectionModel {
  protected _addonOptions?: CellSelectionModelOption;
  protected _canvas: HTMLElement | null = null;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _ranges: CellRange[] = [];
  protected _selector: SlickCellRangeSelector;
  protected _defaults = {
    selectActiveCell: true,
  };
  onSelectedRangesChanged = new Slick.Event();
  pluginName = 'CellSelectionModel';

  constructor(options?: { selectActiveCell: boolean; cellRangeSelector: SlickCellRangeSelector; }) {
    this._eventHandler = new Slick.EventHandler();
    if (options === undefined || options.cellRangeSelector === undefined) {
      this._selector = new SlickCellRangeSelector({ selectionCss: { border: '2px solid black' } as unknown as CSSStyleDeclaration });
    } else {
      this._selector = options.cellRangeSelector;
    }
    this._addonOptions = options;
  }

  get addonOptions() {
    return this._addonOptions;
  }

  get canvas() {
    return this._canvas;
  }

  get cellRangeSelector() {
    return this._selector;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }


  init(grid: SlickGrid) {
    this._grid = grid;
    this._addonOptions = { ...this._defaults, ...this._addonOptions } as CellSelectionModelOption;
    this._eventHandler
      .subscribe(this._grid.onActiveCellChanged, this.handleActiveCellChange.bind(this) as EventListener)
      .subscribe(this._grid.onKeyDown, this.handleKeyDown.bind(this) as EventListener)
      .subscribe(this._selector.onBeforeCellRangeSelected, this.handleBeforeCellRangeSelected.bind(this) as EventListener)
      .subscribe(this._selector.onCellRangeSelected, this.handleCellRangeSelected.bind(this) as EventListener);

    // register the cell range selector plugin
    grid.registerPlugin(this._selector);
    this._canvas = this._grid.getCanvasNode();
  }

  /** @deprecated @use `dispose` Destroy plugin. */
  destroy() {
    this.dispose();
  }

  dispose() {
    this._canvas = null;
    this._eventHandler.unsubscribeAll();
    this._grid?.unregisterPlugin(this._selector);
    this._selector?.dispose();
  }

  getSelectedRanges() {
    return this._ranges;
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

  setSelectedRanges(ranges: CellRange[]) {
    // simple check for: empty selection didn't change, prevent firing onSelectedRangesChanged
    if ((!this._ranges || this._ranges.length === 0) && (!ranges || ranges.length === 0)) {
      return;
    }

    // if range has not changed, don't fire onSelectedRangesChanged
    const rangeHasChanged = !this.rangesAreEqual(this._ranges, ranges);

    this._ranges = this.removeInvalidRanges(ranges);
    if (rangeHasChanged) {
      this.onSelectedRangesChanged.notify(this._ranges);
    }
  }

  //
  // protected functions
  // ---------------------

  protected handleActiveCellChange(_e: any, args: OnActiveCellChangedEventArgs) {
    if (this._addonOptions?.selectActiveCell && args.row !== null && args.cell !== null) {
      this.setSelectedRanges([new Slick.Range(args.row, args.cell)]);
    } else if (!this._addonOptions?.selectActiveCell) {
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

  protected handleKeyDown(e: any) {
    let ranges: CellRange[];
    let last: SlickRange;
    const active = this._grid.getActiveCell();
    const metaKey = e.ctrlKey || e.metaKey;

    if (active && e.shiftKey && !metaKey && !e.altKey &&
      (e.which === KeyCode.LEFT || e.key === 'ArrowLeft'
        || e.which === KeyCode.RIGHT || e.key === 'ArrowRight'
        || e.which === KeyCode.UP || e.key === 'ArrowUp'
        || e.which === KeyCode.DOWN || e.key === 'ArrowDown')) {

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

        if (e.which === KeyCode.LEFT || e.key === 'ArrowLeft') {
          dCell -= dirCell;
        } else if (e.which === KeyCode.RIGHT || e.key === 'ArrowRight') {
          dCell += dirCell;
        } else if (e.which === KeyCode.UP || e.key === 'ArrowUp') {
          dRow -= dirRow;
        } else if (e.which === KeyCode.DOWN || e.key === 'ArrowDown') {
          dRow += dirRow;
        }

        // define new selection range
        const newLast = new Slick.Range(active.row, active.cell, active.row + dirRow * dRow, active.cell + dirCell * dCell);
        if (this.removeInvalidRanges([newLast]).length) {
          ranges.push(newLast);
          const viewRow = dirRow > 0 ? newLast.toRow : newLast.fromRow;
          const viewCell = dirCell > 0 ? newLast.toCell : newLast.fromCell;
          this._grid.scrollRowIntoView(viewRow);
          this._grid.scrollCellIntoView(viewRow, viewCell, false);
        } else {
          ranges.push(last);
        }
        this.setSelectedRanges(ranges);

        e.preventDefault();
        e.stopPropagation();
      }
    }
  }
}