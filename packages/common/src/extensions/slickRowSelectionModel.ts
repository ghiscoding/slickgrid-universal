import { type SelectionModel } from '../enums/index';
import type { GridOption, OnActiveCellChangedEventArgs, RowSelectionModelOption, } from '../interfaces/index';
import { SlickCellRangeSelector } from '../extensions/slickCellRangeSelector';
import { SlickEvent, SlickEventData, SlickEventHandler, type SlickGrid, SlickRange } from '../core/index';

export class SlickRowSelectionModel implements SelectionModel {
  pluginName: 'RowSelectionModel' = 'RowSelectionModel' as const;

  /** triggered when selected ranges changes */
  onSelectedRangesChanged = new SlickEvent<SlickRange[]>('onSelectedRangesChanged');

  protected _options: RowSelectionModelOption;
  protected _eventHandler: SlickEventHandler;
  protected _inHandler = false;
  protected _grid!: SlickGrid;
  protected _ranges: SlickRange[] = [];
  protected _selector?: SlickCellRangeSelector;
  protected _defaults = {
    autoScrollWhenDrag: true,
    cellRangeSelector: undefined,
    dragToSelect: false,
    selectActiveRow: true
  } as RowSelectionModelOption;

  constructor(options?: RowSelectionModelOption) {
    this._eventHandler = new SlickEventHandler();
    this._options = { ...this._defaults, ...options };
  }

  get addonOptions() {
    return this._options;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get gridOptions(): GridOption {
    return this._grid?.getOptions();
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._options = { ...this._defaults, ...this._options };
    this._selector = this.addonOptions.cellRangeSelector;

    // add PubSub instance to all SlickEvent
    const pubSub = grid.getPubSubService();
    if (pubSub) {
      this.onSelectedRangesChanged.setPubSubService(pubSub);
    }

    if (!this._selector && this._options.dragToSelect) {
      this._selector = new SlickCellRangeSelector({
        selectionCss: { border: 'none' } as CSSStyleDeclaration,
        autoScroll: this._options.autoScrollWhenDrag
      });
      this.addonOptions.cellRangeSelector = this._selector;
    }

    this._eventHandler
      .subscribe(this._grid.onActiveCellChanged, this.handleActiveCellChange.bind(this))
      .subscribe(this._grid.onClick, this.handleClick.bind(this))
      .subscribe(this._grid.onKeyDown, this.handleKeyDown.bind(this));

    if (this._selector) {
      this._grid.registerPlugin(this._selector);
      this._selector.onCellRangeSelecting.subscribe(this.handleCellRangeSelected.bind(this));
      this._selector.onCellRangeSelected.subscribe(this.handleCellRangeSelected.bind(this));
      this._selector.onBeforeCellRangeSelected.subscribe(this.handleBeforeCellRangeSelected.bind(this));
    }
  }

  destroy() {
    this.dispose();
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
    this.disposeSelector();
  }

  disposeSelector() {
    if (this._selector) {
      this._selector.onCellRangeSelecting.unsubscribe(this.handleCellRangeSelected.bind(this));
      this._selector.onCellRangeSelected.unsubscribe(this.handleCellRangeSelected.bind(this));
      this._selector.onBeforeCellRangeSelected.unsubscribe(this.handleBeforeCellRangeSelected.bind(this));
      this._grid.unregisterPlugin(this._selector);
      this._selector?.destroy();
      this._selector?.dispose();
    }
  }

  getCellRangeSelector() {
    return this._selector;
  }

  getSelectedRanges() {
    return this._ranges;
  }

  getSelectedRows(): number[] {
    return this.rangesToRows(this._ranges);
  }

  refreshSelections() {
    this.setSelectedRows(this.getSelectedRows());
  }

  setSelectedRows(rows: number[]) {
    this.setSelectedRanges(this.rowsToRanges(rows), 'SlickRowSelectionModel.setSelectedRows');
  }

  setSelectedRanges(ranges: SlickRange[], caller = 'SlickRowSelectionModel.setSelectedRanges') {
    // simple check for: empty selection didn't change, prevent firing onSelectedRangesChanged
    if ((!this._ranges || this._ranges.length === 0) && (!ranges || ranges.length === 0)) {
      return;
    }
    this._ranges = ranges;

    // provide extra "caller" argument through SlickEventData event to avoid breaking the previous pubsub event structure
    // that only accepts an array of selected range `SlickRange[]`, the SlickEventData args will be merged and used later by `onSelectedRowsChanged`
    const eventData = new SlickEventData(new CustomEvent('click', { detail: { caller } }), this._ranges);
    this.onSelectedRangesChanged.notify(this._ranges, eventData);
  }

  //
  // protected functions
  // ---------------------

  protected getRowsRange(from: number, to: number) {
    let i;
    const rows = [];
    for (i = from; i <= to; i++) {
      rows.push(i);
    }
    for (i = to; i < from; i++) {
      rows.push(i);
    }
    return rows;
  }

  protected handleBeforeCellRangeSelected(e: SlickEventData, cell: { row: number; cell: number; }): boolean | void {
    let isRowMoveColumn = false;
    if (this.gridOptions.enableRowMoveManager) {
      isRowMoveColumn = this.isHandlerColumn(cell.cell) ?? false;
    }
    if (this._grid.getEditorLock().isActive() || isRowMoveColumn) {
      e.stopPropagation();
      return false;
    }
    this._grid.setActiveCell(cell.row, cell.cell);
  }

  protected handleCellRangeSelected(_e: SlickEventData, args: { range: SlickRange; }): boolean | void {
    if (!this.gridOptions.multiSelect || !this.addonOptions.selectActiveRow) {
      return false;
    }
    this.setSelectedRanges([new SlickRange(args.range.fromRow, 0, args.range.toRow, this._grid.getColumns().length - 1)]);
  }

  protected handleActiveCellChange(_e: SlickEventData, args: OnActiveCellChangedEventArgs) {
    if (this._options.selectActiveRow && args.row !== null) {
      this.setSelectedRanges([new SlickRange(args.row, 0, args.row, this._grid.getColumns().length - 1)]);
    }
  }

  protected handleClick(e: SlickEventData): boolean | void {
    const cell = this._grid.getCellFromEvent(e);
    if (!cell || !this._grid.canCellBeActive(cell.row, cell.cell)) {
      return false;
    }

    if (!this.gridOptions.multiSelect || (
      !e.ctrlKey && !e.shiftKey && !e.metaKey)) {
      return false;
    }

    let selection = this.rangesToRows(this._ranges);
    const idx = selection.indexOf(cell.row);

    if (idx === -1 && (e.ctrlKey || e.metaKey)) {
      selection.push(cell.row);
      this._grid.setActiveCell(cell.row, cell.cell);
    } else if (idx !== -1 && (e.ctrlKey || e.metaKey)) {
      selection = selection.filter((o: number) => o !== cell.row);
      this._grid.setActiveCell(cell.row, cell.cell);
    } else if (selection.length && e.shiftKey) {
      const last = selection.pop();
      const from = Math.min(cell.row, last as number);
      const to = Math.max(cell.row, last as number);
      selection = [];
      for (let i = from; i <= to; i++) {
        if (i !== last) {
          selection.push(i);
        }
      }
      selection.push(last as number);
      this._grid.setActiveCell(cell.row, cell.cell);
    }

    const tempRanges = this.rowsToRanges(selection);
    this.setSelectedRanges(tempRanges);
    e.stopImmediatePropagation();

    return true;
  }

  protected handleKeyDown(e: SlickEventData) {
    const activeRow = this._grid.getActiveCell();

    if (this.gridOptions.multiSelect && activeRow &&
      e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey &&
      (e.key === 'ArrowUp' || e.key === 'ArrowDown')
    ) {
      let selectedRows = this.getSelectedRows();
      selectedRows.sort((x: number, y: number) => x - y);

      if (!selectedRows.length) {
        selectedRows = [activeRow.row];
      }

      let active: number;
      let top = selectedRows[0];
      let bottom = selectedRows[selectedRows.length - 1];

      if (e.key === 'ArrowDown') {
        active = (activeRow.row < bottom || top === bottom) ? ++bottom : ++top;
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

  /** is the column a column Row Move OR Select Row Move */
  isHandlerColumn(columnIndex: number): boolean {
    const columns = this._grid.getColumns();
    const col = columns[columnIndex].behavior || '';
    return /move|selectAndMove/.test(col);
  }

  protected rangesToRows(ranges: SlickRange[]): number[] {
    const rows = [];
    for (let i = 0; i < ranges.length; i++) {
      for (let j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
        rows.push(j);
      }
    }
    return rows;
  }

  protected rowsToRanges(rows: number[]) {
    const ranges: SlickRange[] = [];
    const lastCell = this._grid.getColumns().length - 1;
    rows.forEach(row => ranges.push(new SlickRange(row, 0, row, lastCell)));
    return ranges;
  }
}