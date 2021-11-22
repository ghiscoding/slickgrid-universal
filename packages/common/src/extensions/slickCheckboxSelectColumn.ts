import { KeyCode } from '../enums/keyCode.enum';
import { CheckboxSelectorOption, Column, GridOption, SelectableOverrideCallback, SlickEventData, SlickEventHandler, SlickGrid, SlickNamespace } from '../interfaces/index';
import { SlickRowSelectionModel } from './slickRowSelectionModel';
import { createDomElement, emptyElement } from '../services/domUtilities';
import { BindingEventService } from '../services/bindingEvent.service';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class SlickCheckboxSelectColumn<T = any> {
  pluginName = 'CheckboxSelectColumn';
  protected _defaults = {
    columnId: '_checkbox_selector',
    cssClass: null,
    field: 'sel',
    hideSelectAllCheckbox: false,
    toolTip: 'Select/Deselect All',
    width: 30,
    hideInColumnTitleRow: false,
    hideInFilterHeaderRow: true
  } as unknown as CheckboxSelectorOption;
  protected _addonOptions: CheckboxSelectorOption = this._defaults;
  protected _bindEventService: BindingEventService;
  protected _checkboxColumnCellIndex: number | null = null;
  protected _eventHandler: SlickEventHandler;
  protected _headerRowNode?: HTMLElement;
  protected _grid!: SlickGrid;
  protected _isSelectAllChecked = false;
  protected _rowSelectionModel?: SlickRowSelectionModel;
  protected _selectableOverride?: SelectableOverrideCallback<T> | number;
  protected _selectAll_UID: number;
  protected _selectedRowsLookup: any = {};

  constructor(options?: CheckboxSelectorOption) {
    this._selectAll_UID = this.createUID();
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
    this._addonOptions = { ...this._defaults, ...options } as CheckboxSelectorOption;
  }

  get addonOptions() {
    return this._addonOptions;
  }

  get headerRowNode(): HTMLElement | undefined {
    return this._headerRowNode;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._grid?.getOptions?.() ?? {};
  }

  get selectAllUid() {
    return this._selectAll_UID;
  }

  set selectedRowsLookup(selectedRows: any) {
    this._selectedRowsLookup = selectedRows;
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._eventHandler
      .subscribe(grid.onSelectedRowsChanged, this.handleSelectedRowsChanged.bind(this) as EventListener)
      .subscribe(grid.onClick, this.handleClick.bind(this) as EventListener)
      .subscribe(grid.onKeyDown, this.handleKeyDown.bind(this) as EventListener);

    if (!this._addonOptions.hideInFilterHeaderRow) {
      this.addCheckboxToFilterHeaderRow(grid);
    }
    if (!this._addonOptions.hideInColumnTitleRow) {
      this._eventHandler.subscribe(this._grid.onHeaderClick, this.handleHeaderClick.bind(this) as EventListener);
    }

    // this also requires the Row Selection Model to be registered as well
    if (!this._rowSelectionModel || !this._grid.getSelectionModel()) {
      this._rowSelectionModel = new SlickRowSelectionModel(this.gridOptions.rowSelectionOptions);
      this._grid.setSelectionModel(this._rowSelectionModel);
    }

    // user might want to pre-select some rows
    // the setTimeout is because of timing issue with styling (row selection happen but rows aren't highlighted properly)
    if (this.gridOptions.preselectedRows && this._rowSelectionModel && this._grid.getSelectionModel()) {
      setTimeout(() => this.selectRows(this.gridOptions.preselectedRows || []));
    }

    // user could override the checkbox icon logic from within the options or after instantiating the plugin
    if (typeof this._addonOptions.selectableOverride === 'function') {
      this.selectableOverride(this._addonOptions.selectableOverride);
    }
  }

  /** @deprecated @use `dispose` Destroy plugin. */
  destroy() {
    this.dispose();
  }

  dispose() {
    this._bindEventService.unbindAll();
    this._eventHandler.unsubscribeAll();
  }

  /**
   * Create the plugin before the Grid creation to avoid having odd behaviors.
   * Mostly because the column definitions might change after the grid creation, so we want to make sure to add it before then
   */
  create(columnDefinitions: Column[], gridOptions: GridOption): SlickCheckboxSelectColumn | null {
    this._addonOptions = { ...this._defaults, ...gridOptions.checkboxSelector } as CheckboxSelectorOption;
    if (Array.isArray(columnDefinitions) && gridOptions) {
      const selectionColumn: Column = this.getColumnDefinition();
      // column index position in the grid
      const columnPosition = gridOptions?.checkboxSelector?.columnIndexPosition ?? 0;
      if (columnPosition > 0) {
        columnDefinitions.splice(columnPosition, 0, selectionColumn);
      } else {
        columnDefinitions.unshift(selectionColumn);
      }
    }
    return this;
  }

  getOptions() {
    return this._addonOptions;
  }

  setOptions(options: CheckboxSelectorOption) {
    this._addonOptions = { ...this._addonOptions, ...options } as CheckboxSelectorOption;

    if (this._addonOptions.hideSelectAllCheckbox) {
      this.hideSelectAllFromColumnHeaderTitleRow();
      this.hideSelectAllFromColumnHeaderFilterRow();
    } else {
      if (!this._addonOptions.hideInColumnTitleRow) {
        this.renderSelectAllCheckbox(this._isSelectAllChecked);
        this._eventHandler.subscribe(this._grid.onHeaderClick, this.handleHeaderClick.bind(this) as EventListener);
      } else {
        this.hideSelectAllFromColumnHeaderTitleRow();
      }

      if (!this._addonOptions.hideInFilterHeaderRow) {
        const selectAllContainerElm = this.headerRowNode?.querySelector<HTMLSpanElement>('#filter-checkbox-selectall-container');
        if (selectAllContainerElm) {
          selectAllContainerElm.style.display = 'flex';
          const selectAllInputElm = selectAllContainerElm.querySelector<HTMLInputElement>('input[type="checkbox"]');
          if (selectAllInputElm) {
            selectAllInputElm.checked = this._isSelectAllChecked;
          }
        }
      } else {
        this.hideSelectAllFromColumnHeaderFilterRow();
      }
    }
  }

  deSelectRows(rowArray: number[]) {
    const removeRows: number[] = [];
    for (const row of rowArray) {
      if (this._selectedRowsLookup[row]) {
        removeRows[removeRows.length] = row;
      }
    }
    this._grid.setSelectedRows(this._grid.getSelectedRows().filter((n) => removeRows.indexOf(n) < 0));
  }

  selectRows(rowArray: number[]) {
    const addRows = [];
    for (const row of rowArray) {
      if (this._selectedRowsLookup[row]) {
        addRows[addRows.length] = row;
      }
    }
    const newSelectedRows = this._grid.getSelectedRows()?.concat(addRows);
    this._grid.setSelectedRows(newSelectedRows);
  }

  getColumnDefinition(): Column {
    return {
      id: this._addonOptions.columnId,
      name: (this._addonOptions.hideSelectAllCheckbox || this._addonOptions.hideInColumnTitleRow) ? '' : `<input id="header-selector${this._selectAll_UID}" type="checkbox"><label for="header-selector${this._selectAll_UID}"></label>`,
      toolTip: (this._addonOptions.hideSelectAllCheckbox || this._addonOptions.hideInColumnTitleRow) ? '' : this._addonOptions.toolTip,
      field: this._addonOptions.field || 'sel',
      cssClass: this._addonOptions.cssClass,
      excludeFromExport: true,
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromQuery: true,
      excludeFromHeaderMenu: true,
      hideSelectAllCheckbox: this._addonOptions.hideSelectAllCheckbox,
      resizable: false,
      sortable: false,
      width: this._addonOptions.width || 30,
      formatter: this.checkboxSelectionFormatter.bind(this),
    } as Column;
  }

  hideSelectAllFromColumnHeaderTitleRow() {
    this._grid.updateColumnHeader(this._addonOptions.columnId || '', '', '');
  }

  hideSelectAllFromColumnHeaderFilterRow() {
    const selectAllContainerElm = this.headerRowNode?.querySelector<HTMLSpanElement>('#filter-checkbox-selectall-container');
    if (selectAllContainerElm) {
      selectAllContainerElm.style.display = 'none';
    }
  }

  toggleRowSelection(row: number) {
    const dataContext = this._grid.getDataItem(row);
    if (!this.checkSelectableOverride(row, dataContext, this._grid)) {
      return;
    }

    const newSelectedRows = this._selectedRowsLookup[row] ? this._grid.getSelectedRows().filter((n) => n !== row) : this._grid.getSelectedRows().concat(row);
    this._grid.setSelectedRows(newSelectedRows);
    this._grid.setActiveCell(row, this.getCheckboxColumnCellIndex());
  }


  /**
   * Method that user can pass to override the default behavior or making every row a selectable row.
   * In order word, user can choose which rows to be selectable or not by providing his own logic.
   * @param overrideFn: override function callback
   */
  selectableOverride(overrideFn: SelectableOverrideCallback<T>) {
    this._selectableOverride = overrideFn;
  }

  //
  // protected functions
  // ---------------------

  protected addCheckboxToFilterHeaderRow(grid: SlickGrid) {
    this._eventHandler.subscribe(grid.onHeaderRowCellRendered, (_e: any, args: any) => {
      if (args.column.field === (this.addonOptions.field || 'sel')) {
        emptyElement(args.node);

        // <span class="container"><input type="checkbox"><label for="checkbox"></label></span>
        const spanElm = createDomElement('span', { id: 'filter-checkbox-selectall-container' });
        spanElm.appendChild(
          createDomElement('input', { type: 'checkbox', id: `header-filter-selector${this._selectAll_UID}` })
        );
        spanElm.appendChild(
          createDomElement('label', { htmlFor: `header-filter-selector${this._selectAll_UID}` })
        );
        args.node.appendChild(spanElm);
        this._headerRowNode = args.node;

        this._bindEventService.bind(spanElm, 'click', ((evnt: Event) => this.handleHeaderClick(evnt, args)) as EventListener);
      }
    });
  }

  protected checkboxSelectionFormatter(row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid: SlickGrid) {
    if (dataContext && this.checkSelectableOverride(row, dataContext, grid)) {
      const UID = this.createUID() + row;
      return `<input id="selector${UID}" type="checkbox" ${this._selectedRowsLookup[row] ? `checked="checked"` : ''}><label for="selector${UID}"></label>`;
    }
    return null;
  }

  protected checkSelectableOverride(row: number, dataContext: any, grid: SlickGrid) {
    if (typeof this._selectableOverride === 'function') {
      return this._selectableOverride(row, dataContext, grid);
    }
    return true;
  }

  protected createUID(): number {
    return Math.round(10000000 * Math.random());
  }

  protected getCheckboxColumnCellIndex() {
    if (this._checkboxColumnCellIndex === null) {
      this._checkboxColumnCellIndex = 0;
      const colArr = this._grid.getColumns();
      for (let i = 0; i < colArr.length; i++) {
        if (colArr[i].id === this._addonOptions.columnId) {
          this._checkboxColumnCellIndex = i;
        }
      }
    }
    return this._checkboxColumnCellIndex;
  }

  protected handleClick(e: any, args: any) {
    // clicking on a row select checkbox
    if (this._grid.getColumns()[args.cell].id === this._addonOptions.columnId && e.target.type === 'checkbox') {
      // if editing, try to commit
      if (this._grid.getEditorLock().isActive() && !this._grid.getEditorLock().commitCurrentEdit()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      this.toggleRowSelection(args.row);
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }

  protected handleHeaderClick(e: any, args: any) {
    if (args.column.id === this._addonOptions.columnId && e.target.type === 'checkbox') {
      // if editing, try to commit
      if (this._grid.getEditorLock().isActive() && !this._grid.getEditorLock().commitCurrentEdit()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      if (e.target.checked) {
        const rows = [];
        for (let i = 0; i < this._grid.getDataLength(); i++) {
          // Get the row and check it's a selectable row before pushing it onto the stack
          const rowItem = this._grid.getDataItem(i);
          if (!rowItem.__group && !rowItem.__groupTotals && this.checkSelectableOverride(i, rowItem, this._grid)) {
            rows.push(i);
          }
        }
        this._grid.setSelectedRows(rows);
      } else {
        this._grid.setSelectedRows([]);
      }
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }

  protected handleKeyDown(e: SlickEventData, args: any) {
    if (e.which === KeyCode.SPACE || e.key === ' ') {
      if (this._grid.getColumns()[args.cell].id === this._addonOptions.columnId) {
        // if editing, try to commit
        if (!this._grid.getEditorLock().isActive() || this._grid.getEditorLock().commitCurrentEdit()) {
          this.toggleRowSelection(args.row);
        }
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
  }

  protected handleSelectedRowsChanged() {
    const selectedRows = this._grid.getSelectedRows();
    const lookup: any = {};
    let row = 0;
    let i = 0;
    let k = 0;
    let disabledCount = 0;
    if (typeof this._selectableOverride === 'function') {
      for (k = 0; k < this._grid.getDataLength(); k++) {
        // If we are allowed to select the row
        const dataItem = this._grid.getDataItem(k);
        if (!this.checkSelectableOverride(i, dataItem, this._grid)) {
          disabledCount++;
        }
      }
    }

    const removeList = [];
    for (i = 0; i < selectedRows.length; i++) {
      row = selectedRows[i];

      // If we are allowed to select the row
      const rowItem = this._grid.getDataItem(row);
      if (this.checkSelectableOverride(i, rowItem, this._grid)) {
        lookup[row] = true;
        if (lookup[row] !== this._selectedRowsLookup[row]) {
          this._grid.invalidateRow(row);
          delete this._selectedRowsLookup[row];
        }
      } else {
        removeList.push(row);
      }
    }
    for (const selectedRow in this._selectedRowsLookup) {
      if (selectedRow !== undefined) {
        this._grid.invalidateRow(+selectedRow);
      }
    }

    this._selectedRowsLookup = lookup;
    this._grid.render();
    this._isSelectAllChecked = (selectedRows?.length ?? 0) + disabledCount >= this._grid.getDataLength();

    if (!this._addonOptions.hideInColumnTitleRow && !this._addonOptions.hideSelectAllCheckbox) {
      this.renderSelectAllCheckbox(this._isSelectAllChecked);
    }
    if (!this._addonOptions.hideInFilterHeaderRow) {
      const selectAllElm = this.headerRowNode?.querySelector<HTMLInputElement>(`#header-filter-selector${this._selectAll_UID}`);
      if (selectAllElm) {
        selectAllElm.checked = this._isSelectAllChecked;
      }
    }
    // Remove items that shouln't of been selected in the first place (Got here Ctrl + click)
    if (removeList.length > 0) {
      for (const itemToRemove of removeList) {
        const remIdx = selectedRows.indexOf(itemToRemove);
        selectedRows.splice(remIdx, 1);
      }
      this._grid.setSelectedRows(selectedRows);
    }
  }

  protected renderSelectAllCheckbox(isSelectAllChecked: boolean) {
    const checkedStr = isSelectAllChecked ? ` checked="checked"` : '';
    this._grid.updateColumnHeader(
      this._addonOptions.columnId || '',
      `<input id="header-selector${this._selectAll_UID}" type="checkbox"${checkedStr}><label for="header-selector${this._selectAll_UID}"></label>`,
      this._addonOptions.toolTip
    );
  }
}