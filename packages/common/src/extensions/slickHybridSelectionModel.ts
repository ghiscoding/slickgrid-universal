import { isDefined } from '@slickgrid-universal/utils';
import { SlickEvent, SlickEventData, SlickEventHandler, SlickRange } from '../core/index.js';
import type { SlickDataView } from '../core/slickDataview.js';
import type { SlickGrid } from '../core/slickGrid.js';
import type { GridOption, HybridSelectionModelOption, SelectionModel } from '../index.js';
import type { CustomDataView, OnActiveCellChangedEventArgs } from '../interfaces/index.js';
import { SlickCellRangeSelector } from './slickCellRangeSelector.js';

export class SlickHybridSelectionModel implements SelectionModel<HybridSelectionModelOption> {
  // hybrid selection model is CellSelectionModel except when selecting
  // specific columns, which behave as RowSelectionModel

  // --
  // public API
  pluginName = 'HybridSelectionModel' as const;
  onSelectedRangesChanged: SlickEvent<SlickRange[]>;

  // --
  // protected props
  protected _cachedPageRowCount = 0;
  protected _dataView?: CustomDataView | SlickDataView;
  protected _grid!: SlickGrid;
  protected _eventHandler: SlickEventHandler;
  protected _prevSelectedRow?: number;
  protected _prevKeyDown = '';
  protected _ranges: SlickRange[] = [];
  protected _selector?: SlickCellRangeSelector;
  protected _isRowMoveManagerHandler: any;
  protected _activeSelectionIsRow = false;
  protected _options: HybridSelectionModelOption;
  protected _defaults: HybridSelectionModelOption = {
    selectActiveCell: true,
    selectActiveRow: true,
    dragToSelect: false,
    autoScrollWhenDrag: true,
    handleRowMoveManagerColumn: true, // Row Selection on RowMoveManager column
    rowSelectColumnIds: [], // Row Selection on these columns
    rowSelectOverride: undefined, // function to toggle Row Selection Models
    cellRangeSelector: undefined,
    selectionType: 'mixed',
  };

  constructor(options?: Partial<HybridSelectionModelOption>) {
    this.onSelectedRangesChanged = new SlickEvent<SlickRange[]>('onSelectedRangesChanged');
    this._eventHandler = new SlickEventHandler();
    this._options = { ...this._defaults, ...options };
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get gridOptions(): GridOption {
    return this._grid?.getOptions();
  }

  set activeSelectionIsRow(value: boolean) {
    this._activeSelectionIsRow = value;
  }

  // Region: Setup
  // -----------------------------------------------------------------------------

  init(grid: SlickGrid): void {
    this._grid = grid;
    this._options = { ...this._defaults, ...this._options };
    this._selector = this._options.cellRangeSelector;

    if (this._options.selectionType === 'cell') {
      this._activeSelectionIsRow = false;
    } else if (this._options.selectionType === 'row') {
      this._activeSelectionIsRow = true;
    }

    // add PubSub instance to all SlickEvent
    const pubSub = grid.getPubSubService();
    if (pubSub) {
      this.onSelectedRangesChanged.setPubSubService(pubSub);
    }

    if (!this._selector && (!this._activeSelectionIsRow || (this._activeSelectionIsRow && this._options.dragToSelect))) {
      this._selector = new SlickCellRangeSelector(
        this._options?.dragToSelect
          ? {
              selectionCss: { border: 'none' } as CSSStyleDeclaration,
              autoScroll: this._options?.autoScrollWhenDrag,
            }
          : {
              selectionCss: { border: '2px solid gray' } as CSSStyleDeclaration,
              copyToSelectionCss: { border: '2px solid purple' } as CSSStyleDeclaration,
            }
      );
      this._options.cellRangeSelector = this._selector;
    }

    if (grid.hasDataView()) {
      this._dataView = grid.getData<CustomDataView | SlickDataView>();
    }

    this._eventHandler
      .subscribe(this._grid.onActiveCellChanged, this.handleActiveCellChange.bind(this))
      .subscribe(this._grid.onClick, this.handleClick.bind(this))
      .subscribe(this._grid.onKeyDown, this.handleKeyDown.bind(this));

    if (this._selector) {
      this._grid.registerPlugin(this._selector);
      this._eventHandler
        .subscribe(this._selector.onCellRangeSelecting, (e, args) =>
          this.handleCellRangeSelected(e, { ...args, caller: 'onCellRangeSelecting' })
        )
        .subscribe(this._selector.onCellRangeSelected, (e, args) =>
          this.handleCellRangeSelected(e, { ...args, caller: 'onCellRangeSelected' })
        )
        .subscribe(this._selector.onBeforeCellRangeSelected, this.handleBeforeCellRangeSelected.bind(this));
    }

    // not entirely sure why but it seems that we need to invalidate & rerender all the cells to avoid seeing blank cells
    this._grid.invalidate();
  }

  destroy(): void {
    this.dispose();
  }

  dispose(): void {
    this._eventHandler.unsubscribeAll();
    if (this._selector) {
      this._grid?.unregisterPlugin(this._selector);
    }
    this._selector?.destroy();
    this._selector?.dispose();
  }

  getOptions(): HybridSelectionModelOption {
    return this._options;
  }

  setOptions(options: Partial<HybridSelectionModelOption>): void {
    this._options = { ...this._options, ...options };
  }

  // Region: CellSelectionModel Members
  // -----------------------------------------------------------------------------

  removeInvalidRanges(ranges: SlickRange[]): SlickRange[] {
    const result: SlickRange[] = [];

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (this._grid.canCellBeSelected(r.fromRow, r.fromCell) && this._grid.canCellBeSelected(r.toRow, r.toCell)) {
        result.push(r);
      }
    }
    return result;
  }

  rangesAreEqual(range1: SlickRange[], range2: SlickRange[]): boolean {
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

  getCellRangeSelector(): SlickCellRangeSelector | undefined {
    return this._selector;
  }

  getSelectedRanges(): SlickRange[] {
    return this._ranges;
  }

  getSelectedRows(): number[] {
    return this.rangesToRows(this._ranges);
  }

  setSelectedRows(rows: number[]): void {
    this.setSelectedRanges(this.rowsToRanges(rows), 'SlickHybridSelectionModel.setSelectedRows', '');
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

    if (this._activeSelectionIsRow) {
      this._ranges = ranges;

      // provide extra "caller" argument through SlickEventData event to avoid breaking the previous pubsub event structure
      // that only accepts an array of selected range `SlickRange[]`, the SlickEventData args will be merged and used later by `onSelectedRowsChanged`
      const eventData = new SlickEventData(new CustomEvent('click', { detail: { caller, selectionMode } }), this._ranges);
      this.onSelectedRangesChanged.notify(this._ranges, eventData);
    } else {
      // if range has not changed, don't fire onSelectedRangesChanged
      const rangeHasChanged = !this.rangesAreEqual(this._ranges, ranges);

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

  refreshSelections(): void {
    if (this._activeSelectionIsRow) {
      this.setSelectedRows(this.getSelectedRows());
    } else {
      this.setSelectedRanges(this.getSelectedRanges(), undefined, '');
    }
  }

  rowSelectionModelIsActive(data: OnActiveCellChangedEventArgs): boolean {
    if (this._options.selectionType === 'cell') {
      return false;
    } else if (this._options.selectionType === 'row') {
      return true;
    }

    // work out required selection mode
    if (this._options?.rowSelectOverride) {
      return this._options?.rowSelectOverride(data, this, this._grid);
    }

    if (!isDefined(data.cell)) {
      return false;
    }

    if (this.gridOptions.enableRowMoveManager && this.isHandlerColumn(data.cell)) {
      return true;
    }

    const targetColumn = this._grid.getVisibleColumns()[data.cell];
    if (targetColumn) {
      return this._options?.rowSelectColumnIds?.includes(`${targetColumn.id}`) || false;
    }
    return false;
  }

  protected handleActiveCellChange(_e: SlickEventData, args: OnActiveCellChangedEventArgs): void {
    this._prevSelectedRow = undefined;
    const isCellDefined = isDefined(args.cell);
    const isRowDefined = isDefined(args.row);
    this._activeSelectionIsRow = this.rowSelectionModelIsActive(args);

    if (this._activeSelectionIsRow) {
      if (this._options?.selectActiveRow && isRowDefined) {
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

  protected isKeyAllowed(key: string, isShiftKeyPressed?: boolean): boolean {
    return [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'PageDown',
      'PageUp',
      'Home',
      'End',
      ...(!isShiftKeyPressed ? ['a', 'A'] : []),
    ].some((k) => k === key);
  }

  protected handleKeyDown(e: SlickEventData): void {
    if (!this._activeSelectionIsRow) {
      let ranges: SlickRange[];
      let last: SlickRange;
      const colLn = this._grid.getColumns().length;
      const active = this._grid.getActiveCell();

      let dataLn = 0;
      if (this._dataView && 'getPagingInfo' in this._dataView) {
        dataLn = this._dataView?.getPagingInfo().pageSize || this._dataView.getLength();
      } else {
        dataLn = this._grid.getDataLength();
      }

      if (active && (e.shiftKey || e.ctrlKey) && !e.altKey && this.isKeyAllowed(e.key as string, e.shiftKey)) {
        ranges = this.getSelectedRanges().slice();
        if (!ranges.length) {
          ranges.push(new SlickRange(active.row, active.cell));
        }
        // keyboard can work with last range only
        last = ranges.pop() as SlickRange;

        if (typeof last?.contains === 'function') {
          // can't handle selection out of active cell
          if (!last.contains(active.row, active.cell)) {
            last = new SlickRange(active.row, active.cell);
          }
          let dRow = last.toRow - last.fromRow;
          let dCell = last.toCell - last.fromCell;
          let toCell: undefined | number;
          let toRow = 0;

          // when using Ctrl+{a, A} we will change our position to cell 0,0 and select all grid cells
          if (e.ctrlKey && e.key?.toLowerCase() === 'a') {
            this._grid.setActiveCell(0, 0, false, false, true);
            active.row = 0;
            active.cell = 0;
            toCell = colLn - 1;
            toRow = dataLn - 1;
          }

          // walking direction
          const dirRow = active.row === last.fromRow ? 1 : -1;
          const dirCell = active.cell === last.fromCell ? 1 : -1;
          const isSingleKeyMove = e.key!.startsWith('Arrow');

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
              this._cachedPageRowCount = this._grid.getViewportRowCount();
            }
            if (this._prevSelectedRow === undefined) {
              this._prevSelectedRow = active.row;
            }

            if ((!e.ctrlKey && e.shiftKey && e.key === 'Home') || (e.ctrlKey && e.shiftKey && e.key === 'ArrowLeft')) {
              toCell = 0;
              toRow = active.row;
            } else if ((!e.ctrlKey && e.shiftKey && e.key === 'End') || (e.ctrlKey && e.shiftKey && e.key === 'ArrowRight')) {
              toCell = colLn - 1;
              toRow = active.row;
            } else if (e.ctrlKey && e.shiftKey && e.key === 'ArrowUp') {
              toRow = 0;
            } else if (e.ctrlKey && e.shiftKey && e.key === 'ArrowDown') {
              toRow = dataLn - 1;
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
          const newLast = new SlickRange(active.row, active.cell, toRow, toCell);
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
          this.setSelectedRanges(ranges, undefined, '');

          e.preventDefault();
          e.stopPropagation();
          this._prevKeyDown = e.key as string;
        }
      }
    } else {
      const activeRow = this._grid.getActiveCell();
      if (
        this.gridOptions.multiSelect &&
        activeRow &&
        e.shiftKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        (e.key === 'ArrowUp' || e.key === 'ArrowDown')
      ) {
        let selectedRows = this.getSelectedRows();
        selectedRows.sort((x, y) => x - y);

        if (!selectedRows.length) {
          selectedRows = [activeRow.row];
        }

        let active: number;
        let top = selectedRows[0];
        let bottom = selectedRows[selectedRows.length - 1];

        if (e.key === 'ArrowDown') {
          active = activeRow.row < bottom || top === bottom ? ++bottom : ++top;
        } else {
          active = activeRow.row < bottom ? --bottom : --top;
        }

        if (active >= 0 && active < this._grid.getDataLength()) {
          this._grid.scrollRowIntoView(active);
          const tempRanges = this.rowsToRanges(this.getRowsRange(top, bottom));
          this.setSelectedRanges(tempRanges);
        }

        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  protected handleClick(e: SlickEventData): boolean | void {
    if (this._activeSelectionIsRow) {
      const cell = this._grid.getCellFromEvent(e);
      if (!cell || !this._grid.canCellBeActive(cell.row, cell.cell)) {
        return false;
      }

      if (!this.gridOptions.multiSelect || (!e.ctrlKey && !e.shiftKey && !e.metaKey)) {
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
      this.setSelectedRanges(tempRanges);
      e.stopImmediatePropagation();

      return true;
    }
  }

  /** is the column a column Row Move OR Select Row Move */
  isHandlerColumn(columnIndex: number): boolean {
    const columns = this._grid.getColumns();
    const col = columns[columnIndex].behavior || '';
    return /move|selectAndMove/.test(col);
  }

  protected handleBeforeCellRangeSelected(e: SlickEventData, cell: { row: number; cell: number }): boolean | void {
    if (this._activeSelectionIsRow) {
      let isRowMoveColumn = false;
      if (this.gridOptions.enableRowMoveManager) {
        isRowMoveColumn = this.isHandlerColumn(cell.cell) ?? false;
      }
      if (this._grid.getEditorLock().isActive() || isRowMoveColumn) {
        e.stopPropagation();
        return false;
      }
      this._grid.setActiveCell(cell.row, cell.cell);
    } else {
      const cell = this._grid.getCellFromEvent(e);
      const activeCell = this._grid.getActiveCell();
      if (this._grid.getEditorLock().isActive() && activeCell && cell && activeCell.row === cell.row && activeCell.cell === cell.cell) {
        e.stopPropagation();
        return false;
      }
    }
  }

  protected handleCellRangeSelected(
    _e: SlickEventData,
    args: { range: SlickRange; selectionMode: string; allowAutoEdit?: boolean; caller: 'onCellRangeSelecting' | 'onCellRangeSelected' }
  ): boolean {
    if (this._activeSelectionIsRow) {
      if (!this.gridOptions.multiSelect || (!this._options?.selectActiveRow && this._options.selectionType !== 'row')) {
        return false;
      }
      this.setSelectedRanges(
        [new SlickRange(args.range.fromRow, 0, args.range.toRow, this._grid.getColumns().length - 1)],
        undefined,
        args.selectionMode
      );
    } else {
      if (args.caller === 'onCellRangeSelecting') {
        return false;
      }
      this._grid.setActiveCell(args.range.fromRow, args.range.fromCell, args.allowAutoEdit ? undefined : false, false, true);
      this.setSelectedRanges([args.range], undefined, args.selectionMode);
    }
    return true;
  }
}
