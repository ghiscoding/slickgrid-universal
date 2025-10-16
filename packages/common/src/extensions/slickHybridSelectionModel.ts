import { isDefined } from '@slickgrid-universal/utils';
import { SlickEvent, SlickEventData, SlickRange, Utils as SlickUtils } from '../core/index.js';
import type { SlickDataView } from '../core/slickDataview.js';
import type { SlickGrid } from '../core/slickGrid.js';
import { Draggable } from '../core/slickInteractions.js';
import type { GridOption, SelectionModel } from '../index.js';
import type { CustomDataView, OnActiveCellChangedEventArgs } from '../interfaces/index.js';
import { SlickCellRangeDecorator } from './slickCellRangeDecorator.js';
import { SlickCellRangeSelector } from './slickCellRangeSelector.js';
import type { SlickRowMoveManager } from './slickRowMoveManager.js';

export declare type RowSelectOverride = (
  data: OnActiveCellChangedEventArgs,
  selectionModel: SlickHybridSelectionModel,
  grid: SlickGrid
) => boolean;

const noop = () => {};

export interface HybridSelectionModelOption {
  selectActiveCell: boolean;
  selectActiveRow: boolean;
  cellRangeSelector?: SlickCellRangeSelector;
  dragToSelect: boolean;
  autoScrollWhenDrag: boolean;
  handleRowMoveManagerColumn: boolean; // Row Selection on RowMoveManage column
  rowSelectColumnIdArr: string[]; // Row Selection on these columns
  rowSelectOverride: RowSelectOverride | undefined; // function to toggle Row Selection Models
}

export class SlickHybridSelectionModel implements SelectionModel {
  // hybrid selection model is CellSelectionModel except when selecting
  // specific columns, which behave as RowSelectionModel

  // --
  // public API
  pluginName = 'HybridSelectionModel' as const;
  onSelectedRangesChanged: SlickEvent = new SlickEvent<SlickRange[]>('onSelectedRangesChanged');

  // --
  // protected props
  protected _cachedPageRowCount = 0;
  protected _dataView?: CustomDataView | SlickDataView;
  protected _grid!: SlickGrid;
  protected _prevSelectedRow?: number;
  protected _prevKeyDown = '';
  protected _ranges: SlickRange[] = [];
  protected _selector: SlickCellRangeSelector;
  protected _isRowMoveManagerHandler: any;
  protected _activeSelectionIsRow = false;
  protected _options?: HybridSelectionModelOption;
  protected _defaults: HybridSelectionModelOption = {
    selectActiveCell: true,
    selectActiveRow: true,
    dragToSelect: false,
    autoScrollWhenDrag: true,
    handleRowMoveManagerColumn: true, // Row Selection on RowMoveManage column
    rowSelectColumnIdArr: [], // Row Selection on these columns
    rowSelectOverride: undefined, // function to toggle Row Selection Models
    cellRangeSelector: undefined,
  };

  constructor(options?: Partial<HybridSelectionModelOption>) {
    this._options = { ...this._defaults, ...options };

    if (options === undefined || options.cellRangeSelector === undefined) {
      this._selector = new SlickCellRangeSelector({
        selectionCss: { border: '2px solid black' } as CSSStyleDeclaration,
        copyToSelectionCss: { border: '2px solid purple' } as CSSStyleDeclaration,
      });
    } else {
      this._selector = options.cellRangeSelector;
    }
  }

  get addonOptions(): HybridSelectionModelOption | undefined {
    return this._options;
  }

  get gridOptions(): GridOption {
    return this._grid?.getOptions();
  }

  // Region: Setup
  // -----------------------------------------------------------------------------

  init(grid: SlickGrid): void {
    if (Draggable === undefined) {
      throw new Error('Slick.Draggable is undefined, make sure to import "slick.interactions.js"');
    }

    this._grid = grid;
    SlickUtils.addSlickEventPubSubWhenDefined(grid.getPubSubService()!, this);

    if (!this._selector && this._options?.dragToSelect) {
      if (!SlickCellRangeDecorator) {
        throw new Error('Slick.CellRangeDecorator is required when option dragToSelect set to true');
      }
      this._selector = new SlickCellRangeSelector({
        selectionCss: { border: 'none' } as CSSStyleDeclaration,
        autoScroll: this._options?.autoScrollWhenDrag,
      });
    }

    if (grid.hasDataView()) {
      this._dataView = grid.getData<CustomDataView | SlickDataView>();
    }
    this._grid.onActiveCellChanged.subscribe(this.handleActiveCellChange.bind(this));
    this._grid.onKeyDown.subscribe(this.handleKeyDown.bind(this));
    this._grid.onClick.subscribe(this.handleClick.bind(this));
    if (this._selector) {
      grid.registerPlugin(this._selector);
      this._selector.onCellRangeSelected.subscribe(this.handleCellRangeSelected.bind(this));
      this._selector.onBeforeCellRangeSelected.subscribe(this.handleBeforeCellRangeSelected.bind(this));
    }

    // not entirely sure why but it seems that we need to invalidate & rerender all the cells to avoid seeing blank cells
    this._grid.invalidate();
  }

  destroy(): void {
    this._grid.onActiveCellChanged.unsubscribe(this.handleActiveCellChange.bind(this));
    this._grid.onKeyDown.unsubscribe(this.handleKeyDown.bind(this));
    this._grid.onClick.unsubscribe(this.handleClick.bind(this));
    this._selector.onCellRangeSelected.unsubscribe(this.handleCellRangeSelected.bind(this));
    this._selector.onBeforeCellRangeSelected.unsubscribe(this.handleBeforeCellRangeSelected.bind(this));
    this._grid.unregisterPlugin(this._selector);
    this._selector?.destroy();
  }

  // Region: CellSelectionModel Members
  // -----------------------------------------------------------------------------

  protected removeInvalidRanges(ranges: SlickRange[]): SlickRange[] {
    const result: SlickRange[] = [];

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (this._grid.canCellBeSelected(r.fromRow, r.fromCell) && this._grid.canCellBeSelected(r.toRow, r.toCell)) {
        result.push(r);
      }
    }

    return result;
  }

  protected rangesAreEqual(range1: SlickRange[], range2: SlickRange[]): boolean {
    let areDifferent = range1.length !== range2.length;
    if (!areDifferent) {
      for (let i = 0; i < range1.length; i++) {
        if (
          range1[i].fromCell !== range2[i].fromCell ||
          range1[i].fromRow !== range2[i].fromRow ||
          range1[i].toCell !== range2[i].toCell ||
          range1[i].toRow !== range2[i].toRow
        ) {
          areDifferent = true;
          break;
        }
      }
    }
    return !areDifferent;
  }

  // Region: RowSelectionModel Members
  // -----------------------------------------------------------------------------

  protected rangesToRows(ranges: SlickRange[]): number[] {
    const rows: number[] = [];
    for (let i = 0; i < ranges.length; i++) {
      for (let j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
        rows.push(j);
      }
    }
    return rows;
  }

  protected rowsToRanges(rows: number[]): SlickRange[] {
    const ranges: SlickRange[] = [];
    const lastCell = this._grid.getColumns().length - 1;
    rows.forEach((row) => ranges.push(new SlickRange(row, 0, row, lastCell)));
    return ranges;
  }

  protected getRowsRange(from: number, to: number): number[] {
    let i;
    const rows: number[] = [];
    for (i = from; i <= to; i++) {
      rows.push(i);
    }
    for (i = to; i < from; i++) {
      rows.push(i);
    }
    return rows;
  }

  getSelectedRows(): number[] {
    return this.rangesToRows(this._ranges);
  }

  setSelectedRows(rows: number[]): void {
    this.setSelectedRanges(this.rowsToRanges(rows), 'SlickRowSelectionModel.setSelectedRows', '');
  }

  // Region: Shared Members
  // -----------------------------------------------------------------------------

  /** Provide a way to force a recalculation of page row count (for example on grid resize) */
  resetPageRowCount(): void {
    this._cachedPageRowCount = 0;
  }

  setSelectedRanges(ranges: SlickRange[], caller = 'SlickHybridSelectionModel.setSelectedRanges', selectionMode = ''): void {
    // simple check for: empty selection didn't change, prevent firing onSelectedRangesChanged
    if ((!this._ranges || this._ranges.length === 0) && (!ranges || ranges.length === 0)) {
      return;
    }

    // if range has not changed, don't fire onSelectedRangesChanged
    const rangeHasChanged = !this.rangesAreEqual(this._ranges, ranges);

    if (this._activeSelectionIsRow) {
      this._ranges = ranges;

      // provide extra "caller" argument through SlickEventData event to avoid breaking the previous pubsub event structure
      // that only accepts an array of selected range `SlickRange[]`, the SlickEventData args will be merged and used later by `onSelectedRowsChanged`
      const eventData = new SlickEventData(new CustomEvent('click', { detail: { caller, selectionMode } }), this._ranges);
      this.onSelectedRangesChanged.notify(this._ranges, eventData);
    } else {
      this._ranges = this.removeInvalidRanges(ranges);
      if (rangeHasChanged) {
        // provide extra "caller" argument through SlickEventData event to avoid breaking the previous pubsub event structure
        // that only accepts an array of selected range `SlickRange[]`, the SlickEventData args will be merged and used later by `onSelectedRowsChanged`
        const eventData = new SlickEventData(
          new CustomEvent('click', { detail: { caller, selectionMode, addDragHandle: true } }),
          this._ranges
        );
        this.onSelectedRangesChanged.notify(this._ranges, eventData);
      }
    }
  }

  currentSelectionModeIsRow(): boolean {
    return this._activeSelectionIsRow;
  }

  getSelectedRanges(): SlickRange[] {
    return this._ranges;
  }

  refreshSelections(): void {
    if (this._activeSelectionIsRow) {
      this.setSelectedRows(this.getSelectedRows());
    } else {
      this.setSelectedRanges(this.getSelectedRanges(), undefined, '');
    }
  }

  getRowMoveManagerPlugin(): SlickRowMoveManager | undefined {
    return this._grid.getPluginByName('RowMoveManager') || this._grid.getPluginByName('CrossGridRowMoveManager');
  }

  rowSelectionModelIsActive(data: OnActiveCellChangedEventArgs): boolean {
    // work out required selection mode
    if (this._options?.rowSelectOverride) {
      return this._options?.rowSelectOverride(data, this, this._grid);
    }

    if (this._options?.handleRowMoveManagerColumn) {
      const rowMoveManager = this.getRowMoveManagerPlugin();
      if (rowMoveManager?.isHandlerColumn(data.cell)) {
        return true;
      }
    }

    const targetColumn = this._grid.getVisibleColumns()[data.cell];
    return this._options?.rowSelectColumnIdArr.includes(`${targetColumn.id}`) || false;
  }

  protected handleActiveCellChange(_e: SlickEventData, args: OnActiveCellChangedEventArgs): void {
    this._prevSelectedRow = undefined;
    const isCellDefined = isDefined(args.cell);
    const isRowDefined = isDefined(args.row);
    this._activeSelectionIsRow = this.rowSelectionModelIsActive(args);

    if (this._activeSelectionIsRow) {
      if (this._options?.selectActiveRow && args.row !== null) {
        this.setSelectedRanges([new SlickRange(args.row, 0, args.row, this._grid.getColumns().length - 1)], undefined, '');
      }
    } else {
      if (this._options?.selectActiveCell && isRowDefined && isCellDefined) {
        // if any row selections are visible, leave them untouched unless `selectActiveCell` is enabled
        if (this._options.selectActiveRow) {
          this.setSelectedRanges([new SlickRange(args.row, args.cell)], undefined, '');
        }
      } else if (!this._options?.selectActiveCell || (!isRowDefined && !isCellDefined)) {
        // clear the previous selection once the cell changes
        this.setSelectedRanges([], undefined, '');
      }
    }
  }

  protected isKeyAllowed(key: string): boolean {
    return ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageDown', 'PageUp', 'Home', 'End'].some((k) => k === key);
  }

  protected handleKeyDown(e: SlickEventData): void {
    if (!this._activeSelectionIsRow) {
      let ranges: SlickRange[], last: SlickRange;
      const colLn = this._grid.getColumns().length;
      const active = this._grid.getActiveCell();
      let dataLn = 0;
      if (this._dataView && 'getPagingInfo' in this._dataView) {
        dataLn = this._dataView?.getPagingInfo().pageSize || this._dataView.getLength();
      } else {
        dataLn = this._grid.getDataLength();
      }

      if (active && (e.shiftKey || e.ctrlKey) && !e.altKey && this.isKeyAllowed(e.key as string)) {
        ranges = this.getSelectedRanges().slice();
        if (!ranges.length) {
          ranges.push(new SlickRange(active.row, active.cell));
        }
        // keyboard can work with last range only
        last = ranges.pop() as SlickRange;

        // can't handle selection out of active cell
        if (!last.contains(active.row, active.cell)) {
          last = new SlickRange(active.row, active.cell);
        }

        let dRow = last.toRow - last.fromRow;
        let dCell = last.toCell - last.fromCell;

        // walking direction
        const dirRow = active.row === last.fromRow ? 1 : -1;
        const dirCell = active.cell === last.fromCell ? 1 : -1;
        const isSingleKeyMove = e.key!.startsWith('Arrow');
        let toCell: undefined | number = undefined;
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
          // multiple cell moves: (Home, End, Page{Up/Down})
          if (this._cachedPageRowCount < 1) {
            this._cachedPageRowCount = this._grid.getViewportRowCount();
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
        const new_last = new SlickRange(active.row, active.cell, toRow, toCell);
        if (this.removeInvalidRanges([new_last]).length) {
          ranges.push(new_last);
          const viewRow = dirRow > 0 ? new_last.toRow : new_last.fromRow;
          const viewCell = dirCell > 0 ? new_last.toCell : new_last.fromCell;

          if (isSingleKeyMove) {
            this._grid.scrollRowIntoView(viewRow);
            this._grid.scrollCellIntoView(viewRow, viewCell);
          } else {
            this._grid.scrollRowIntoView(toRow);
            this._grid.scrollCellIntoView(toRow, viewCell);
          }
        } else {
          ranges.push(last);
        }

        this.setSelectedRanges(ranges, undefined, '');

        e.preventDefault();
        e.stopPropagation();
        this._prevKeyDown = e.key as string;
      }
    } else {
      const activeRow = this._grid.getActiveCell();
      if (
        this._grid.getOptions().multiSelect &&
        activeRow &&
        e.shiftKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown')
      ) {
        let selectedRows = this.getSelectedRows();
        selectedRows.sort(function (x, y) {
          return x - y;
        });

        if (!selectedRows.length) {
          selectedRows = [activeRow.row];
        }

        let top = selectedRows[0];
        let bottom = selectedRows[selectedRows.length - 1];
        let active: number;

        if (e.key === 'ArrowDown') {
          active = activeRow.row < bottom || top === bottom ? ++bottom : ++top;
        } else {
          active = activeRow.row < bottom ? --bottom : --top;
        }

        if (active >= 0 && active < this._grid.getDataLength()) {
          this._grid.scrollRowIntoView(active);
          const tempRanges = this.rowsToRanges(this.getRowsRange(top, bottom));
          this.setSelectedRanges(tempRanges, undefined, '');
        }

        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  protected handleClick(e: SlickEventData): boolean | void {
    if (!this._activeSelectionIsRow) {
      return;
    }

    const cell = this._grid.getCellFromEvent(e);
    if (!cell || !this._grid.canCellBeActive(cell.row, cell.cell)) {
      return false;
    }

    if (!this._grid.getOptions().multiSelect || (!e.ctrlKey && !e.shiftKey && !e.metaKey)) {
      return false;
    }

    let selection = this.rangesToRows(this._ranges);
    const idx = selection.indexOf(cell.row);

    if (idx === -1 && (e.ctrlKey || e.metaKey)) {
      selection.push(cell.row);
      this._grid.setActiveCell(cell.row, cell.cell);
    } else if (idx !== -1 && (e.ctrlKey || e.metaKey)) {
      selection = selection.filter((o) => o !== cell.row);
      this._grid.setActiveCell(cell.row, cell.cell);
    } else if (selection.length && e.shiftKey) {
      const last = selection.pop() as number;
      const from = Math.min(cell.row, last);
      const to = Math.max(cell.row, last);
      selection = [];
      for (let i = from; i <= to; i++) {
        if (i !== last) {
          selection.push(i);
        }
      }
      selection.push(last);
      this._grid.setActiveCell(cell.row, cell.cell);
    }

    const tempRanges = this.rowsToRanges(selection);
    this.setSelectedRanges(tempRanges, undefined, '');
    e.stopImmediatePropagation();

    return true;
  }

  protected handleBeforeCellRangeSelected(e: SlickEventData, cell: { row: number; cell: number }): boolean | void {
    if (this._activeSelectionIsRow) {
      if (!this._isRowMoveManagerHandler) {
        const rowMoveManager = this._grid.getPluginByName<SlickRowMoveManager>('RowMoveManager');
        this._isRowMoveManagerHandler = rowMoveManager ? rowMoveManager.isHandlerColumn : noop;
      }
      if (this._grid.getEditorLock().isActive() || this._isRowMoveManagerHandler(cell.cell)) {
        e.stopPropagation();
        return false;
      }
      this._grid.setActiveCell(cell.row, cell.cell);
    } else {
      if (this._grid.getEditorLock().isActive()) {
        e.stopPropagation();
        return false;
      }
    }
  }

  protected handleCellRangeSelected(
    _e: SlickEventData,
    args: { range: SlickRange; selectionMode: string; allowAutoEdit?: boolean }
  ): boolean {
    if (this._activeSelectionIsRow) {
      if (!this.gridOptions.multiSelect || !this.addonOptions?.selectActiveRow) {
        return false;
      }
      this.setSelectedRanges(
        [new SlickRange(args.range.fromRow, 0, args.range.toRow, this._grid.getColumns().length - 1)],
        undefined,
        args.selectionMode
      );
    } else {
      this._grid.setActiveCell(args.range.fromRow, args.range.fromCell, args.allowAutoEdit ? undefined : false, false, true);
      this.setSelectedRanges([args.range], undefined, args.selectionMode);
    }
    return true;
  }
}
