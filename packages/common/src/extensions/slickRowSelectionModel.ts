import { KeyCode } from '../enums/index';
import { CellRange, OnActiveCellChangedEventArgs, RowSelectionModelOption, SlickEventHandler, SlickGrid, SlickNamespace, } from '../interfaces/index';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class SlickRowSelectionModel {
  protected _addonOptions: RowSelectionModelOption;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _ranges: CellRange[] = [];
  protected _defaults = {
    selectActiveRow: true
  } as RowSelectionModelOption;
  pluginName = 'RowSelectionModel';

  /** triggered when selected ranges changes */
  onSelectedRangesChanged = new Slick.Event();

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


  init(grid: SlickGrid) {
    this._grid = grid;
    this._addonOptions = { ...this._defaults, ...this._addonOptions };

    this._eventHandler
      .subscribe(this._grid.onActiveCellChanged, this.handleActiveCellChange.bind(this) as EventListener)
      .subscribe(this._grid.onClick, this.handleClick.bind(this) as EventListener)
      .subscribe(this._grid.onKeyDown, this.handleKeyDown.bind(this) as EventListener);
  }

  /** @deprecated @use `dispose` Destroy plugin. */
  destroy() {
    this.dispose();
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
  }

  getSelectedRanges() {
    return this._ranges;
  }

  getSelectedRows() {
    return this.rangesToRows(this._ranges);
  }

  setSelectedRows(rows: number[]) {
    this.setSelectedRanges(this.rowsToRanges(rows));
  }

  setSelectedRanges(ranges: CellRange[]) {
    // simple check for: empty selection didn't change, prevent firing onSelectedRangesChanged
    if ((!this._ranges || this._ranges.length === 0) && (!ranges || ranges.length === 0)) {
      return;
    }
    this._ranges = ranges;
    this.onSelectedRangesChanged.notify(this._ranges);
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

  protected handleActiveCellChange(_e: any, args: OnActiveCellChangedEventArgs) {
    if (this._addonOptions.selectActiveRow && args.row !== null) {
      this.setSelectedRanges([new Slick.Range(args.row, 0, args.row, this._grid.getColumns().length - 1)]);
    }
  }

  protected handleClick(e: any): boolean | void {
    const cell = this._grid.getCellFromEvent(e);
    if (!cell || !this._grid.canCellBeActive(cell.row, cell.cell)) {
      return false;
    }

    if (!this._grid.getOptions().multiSelect || (
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

  protected handleKeyDown(e: any) {
    const activeRow = this._grid.getActiveCell();

    if (this._grid.getOptions().multiSelect && activeRow &&
      e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey &&
      (e.which === KeyCode.UP || e.key === 'ArrowUp' || e.which === KeyCode.DOWN || e.key === 'ArrowDown')
    ) {
      let selectedRows = this.getSelectedRows();
      selectedRows.sort((x: number, y: number) => x - y);

      if (!selectedRows.length) {
        selectedRows = [activeRow.row];
      }

      let active;
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

  protected rangesToRows(ranges: CellRange[]) {
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