import { KeyCode } from '../enums/index';
import type {
  CellRange,
  GridOption,
  OnActiveCellChangedEventArgs,
  RowSelectionModelOption,
  SlickEventData,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import { SlickCellRangeSelector } from '../extensions/slickCellRangeSelector';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class SlickRowSelectionModel {
  protected _addonOptions: RowSelectionModelOption;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _ranges: CellRange[] = [];
  protected _selector?: SlickCellRangeSelector;
  protected _defaults = {
    autoScrollWhenDrag: true,
    cellRangeSelector: undefined,
    dragToSelect: false,
    selectActiveRow: true
  } as RowSelectionModelOption;
  pluginName: 'RowSelectionModel' = 'RowSelectionModel' as const;

  /** triggered when selected ranges changes */
  onSelectedRangesChanged = new Slick.Event<CellRange[]>();

  constructor(options?: RowSelectionModelOption) {
    this._eventHandler = new Slick.EventHandler();
    this._addonOptions = { ...this._defaults, ...options };
  }

  get addonOptions() {
    return this._addonOptions;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get gridOptions(): GridOption {
    return this._grid.getOptions();
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._addonOptions = { ...this._defaults, ...this._addonOptions };
    this._selector = this.addonOptions.cellRangeSelector;

    if (!this._selector && this._addonOptions.dragToSelect) {
      this._selector = new SlickCellRangeSelector({
        selectionCss: { border: 'none' } as CSSStyleDeclaration,
        autoScroll: this._addonOptions.autoScrollWhenDrag
      });
      this.addonOptions.cellRangeSelector = this._selector;
    }

    this._eventHandler
      .subscribe(this._grid.onActiveCellChanged, this.handleActiveCellChange.bind(this))
      .subscribe(this._grid.onClick, this.handleClick.bind(this))
      .subscribe(this._grid.onKeyDown, this.handleKeyDown.bind(this));

    if (this._selector) {
      this._grid.registerPlugin(this._selector);
      this._selector.onCellRangeSelecting.subscribe(this.handleCellRangeSelected.bind(this) as EventListener);
      this._selector.onCellRangeSelected.subscribe(this.handleCellRangeSelected.bind(this) as EventListener);
      this._selector.onBeforeCellRangeSelected.subscribe(this.handleBeforeCellRangeSelected.bind(this) as EventListener);
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
      this._selector.onCellRangeSelecting.unsubscribe(this.handleCellRangeSelected.bind(this) as EventListener);
      this._selector.onCellRangeSelected.unsubscribe(this.handleCellRangeSelected.bind(this) as EventListener);
      this._selector.onBeforeCellRangeSelected.unsubscribe(this.handleBeforeCellRangeSelected.bind(this) as EventListener);
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

  setSelectedRanges(ranges: CellRange[], caller = 'SlickRowSelectionModel.setSelectedRanges') {
    // simple check for: empty selection didn't change, prevent firing onSelectedRangesChanged
    if ((!this._ranges || this._ranges.length === 0) && (!ranges || ranges.length === 0)) {
      return;
    }
    this._ranges = ranges;
    // provide extra "caller" argument through SlickEventData event to avoid breaking the previous pubsub event structure
    // that only accepts an array of selected range `SlickRange[]`, the SlickEventData args will be merged and used later by `onSelectedRowsChanged`
    const eventData = new Slick.EventData(new CustomEvent('click', { detail: { caller } }), this._ranges);
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

  protected handleCellRangeSelected(_e: SlickEventData, args: { range: CellRange; }): boolean | void {
    if (!this.gridOptions.multiSelect || !this.addonOptions.selectActiveRow) {
      return false;
    }
    this.setSelectedRanges([new Slick.Range(args.range.fromRow, 0, args.range.toRow, this._grid.getColumns().length - 1)]);
  }

  protected handleActiveCellChange(_e: SlickEventData, args: OnActiveCellChangedEventArgs) {
    if (this._addonOptions.selectActiveRow && args.row !== null) {
      this.setSelectedRanges([new Slick.Range(args.row, 0, args.row, this._grid.getColumns().length - 1)]);
    }
  }

  protected handleClick(e: MouseEvent): boolean | void {
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
      (e.which === KeyCode.UP || e.key === 'ArrowUp' || e.which === KeyCode.DOWN || e.key === 'ArrowDown')
    ) {
      let selectedRows = this.getSelectedRows();
      selectedRows.sort((x: number, y: number) => x - y);

      if (!selectedRows.length) {
        selectedRows = [activeRow.row];
      }

      let active: number;
      let top = selectedRows[0];
      let bottom = selectedRows[selectedRows.length - 1];

      if (e.which === KeyCode.DOWN || e.key === 'ArrowDown') {
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

  protected rangesToRows(ranges: CellRange[]): number[] {
    const rows = [];
    for (let i = 0; i < ranges.length; i++) {
      for (let j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
        rows.push(j);
      }
    }
    return rows;
  }

  protected rowsToRanges(rows: number[]) {
    const ranges = [];
    const lastCell = this._grid.getColumns().length - 1;
    for (const row of rows) {
      ranges.push(new Slick.Range(row, 0, row, lastCell));
    }
    return ranges;
  }
}