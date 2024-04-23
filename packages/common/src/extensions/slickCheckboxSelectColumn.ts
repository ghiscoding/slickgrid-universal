import { BindingEventService } from '@slickgrid-universal/binding';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, emptyElement } from '@slickgrid-universal/utils';

import { type SlickDataView, type SlickEventData, SlickEventHandler, type SlickGrid } from '../core/index';
import type { CheckboxSelectorOption, Column, DOMMouseOrTouchEvent, GridOption, OnHeaderClickEventArgs, OnKeyDownEventArgs, SelectableOverrideCallback } from '../interfaces/index';
import { SlickRowSelectionModel } from './slickRowSelectionModel';
import type { SelectionModel } from '../enums/index';

export interface RowLookup { [row: number]: boolean; }

const CHECK_ICON = 'sgi-icon-check';
const UNCHECK_ICON = 'sgi-icon-uncheck';

export class SlickCheckboxSelectColumn<T = any> {
  pluginName: 'CheckboxSelectColumn' = 'CheckboxSelectColumn' as const;
  protected _defaults = {
    columnId: '_checkbox_selector',
    cssClass: null,
    field: '_checkbox_selector',
    hideSelectAllCheckbox: false,
    name: '',
    toolTip: 'Select/Deselect All',
    width: 30,
    reorderable: false,
    applySelectOnAllPages: true, // when that is enabled the "Select All" will be applied to all pages (when using Pagination)
    hideInColumnTitleRow: false,
    hideInFilterHeaderRow: true
  } as unknown as CheckboxSelectorOption;
  protected _addonOptions: CheckboxSelectorOption = this._defaults;
  protected _bindEventService: BindingEventService;
  protected _checkboxColumnCellIndex: number | null = null;
  protected _dataView!: SlickDataView;
  protected _eventHandler: SlickEventHandler;
  protected _headerRowNode?: HTMLElement;
  protected _grid!: SlickGrid;
  protected _isSelectAllChecked = false;
  protected _isUsingDataView = false;
  protected _rowSelectionModel?: SelectionModel;
  protected _selectableOverride?: SelectableOverrideCallback<T> | number;
  protected _selectAll_UID: number;
  protected _selectedRowsLookup: RowLookup = {};

  constructor(protected readonly pubSubService: BasePubSubService, options?: CheckboxSelectorOption) {
    this._selectAll_UID = this.createUID();
    this._bindEventService = new BindingEventService();
    this._eventHandler = new SlickEventHandler();
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
    return this._grid?.getOptions() ?? {};
  }

  get selectAllUid() {
    return this._selectAll_UID;
  }

  set selectedRowsLookup(selectedRows: RowLookup) {
    this._selectedRowsLookup = selectedRows;
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._isUsingDataView = !Array.isArray(grid.getData());
    if (this._isUsingDataView) {
      this._dataView = grid.getData<SlickDataView>();
    }

    // we cannot apply "Select All" to all pages when using a Backend Service API (OData, GraphQL, ...)
    if (this.gridOptions.backendServiceApi) {
      this._addonOptions.applySelectOnAllPages = false;
    }

    this._eventHandler
      .subscribe(grid.onSelectedRowsChanged, this.handleSelectedRowsChanged.bind(this))
      .subscribe(grid.onClick, this.handleClick.bind(this))
      .subscribe(grid.onKeyDown, this.handleKeyDown.bind(this));

    if (this._isUsingDataView && this._dataView) {
      // whenever columns changed, we need to rerender Select All, we can call handler to simulate that
      this._eventHandler.subscribe(grid.onAfterSetColumns, this.handleDataViewSelectedIdsChanged.bind(this));

      if (this._addonOptions.applySelectOnAllPages) {
        this._eventHandler
          .subscribe(this._dataView.onSelectedRowIdsChanged, this.handleDataViewSelectedIdsChanged.bind(this))
          .subscribe(this._dataView.onPagingInfoChanged, this.handleDataViewSelectedIdsChanged.bind(this));
      }
    }

    if (!this._addonOptions.hideInFilterHeaderRow) {
      this.addCheckboxToFilterHeaderRow(grid);
    }
    if (!this._addonOptions.hideInColumnTitleRow) {
      this._eventHandler.subscribe(this._grid.onHeaderClick, this.handleHeaderClick.bind(this));
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

      // add new checkbox column unless it was already added
      if (!columnDefinitions.some(col => col.id === selectionColumn.id)) {
        // column index position in the grid
        const columnPosition = gridOptions?.checkboxSelector?.columnIndexPosition ?? 0;
        if (columnPosition > 0) {
          columnDefinitions.splice(columnPosition, 0, selectionColumn);
        } else {
          columnDefinitions.unshift(selectionColumn);
        }
        this.pubSubService.publish(`onPluginColumnsChanged`, {
          columns: columnDefinitions,
          pluginName: this.pluginName
        });
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
        this._eventHandler.subscribe(this._grid.onHeaderClick, this.handleHeaderClick.bind(this));
      } else {
        this.hideSelectAllFromColumnHeaderTitleRow();
        if (this._addonOptions.name) {
          this._grid.updateColumnHeader(this._addonOptions.columnId || '', this._addonOptions.name, '');
        }
      }

      if (!this._addonOptions.hideInFilterHeaderRow) {
        const selectAllContainerElm = this.headerRowNode?.querySelector<HTMLSpanElement>('#filter-checkbox-selectall-container');
        if (selectAllContainerElm) {
          selectAllContainerElm.style.display = 'flex';
          selectAllContainerElm.ariaChecked = String(this._isSelectAllChecked);
          const selectAllInputElm = selectAllContainerElm.querySelector<HTMLInputElement>('input[type="checkbox"]');
          if (selectAllInputElm) {
            selectAllInputElm.ariaChecked = String(this._isSelectAllChecked);
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
    this._grid.setSelectedRows(this._grid.getSelectedRows().filter((n) => removeRows.indexOf(n) < 0), 'SlickCheckboxSelectColumn.deSelectRows');
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

  /**
   * use a DocumentFragment to return a fragment including an <input> then a <label> as siblings,
   * the label is using `for` to link it to the input `id`
   * @param {String} inputId - id to link the label
   * @param {Boolean} checked - is the input checkbox checked?
   * @returns
   */
  createCheckboxElement(inputId: string, checked = false) {
    const fragmentElm = new DocumentFragment();
    const labelElm = createDomElement('label', { className: 'checkbox-selector-label', htmlFor: inputId });
    const divElm = createDomElement('div', { className: 'icon-checkbox-container' });
    divElm.appendChild(
      createDomElement('input', { id: inputId, type: 'checkbox', checked, ariaChecked: String(checked) })
    );
    divElm.appendChild(
      createDomElement('div', { className: `sgi ${checked ? CHECK_ICON : UNCHECK_ICON}` })
    );
    labelElm.appendChild(divElm);
    fragmentElm.appendChild(labelElm);

    return fragmentElm;
  }

  getColumnDefinition(): Column {
    const columnId = String(this._addonOptions?.columnId ?? this._defaults.columnId);

    return {
      id: columnId,
      name: (this._addonOptions.hideSelectAllCheckbox || this._addonOptions.hideInColumnTitleRow)
        ? this._addonOptions.name || ''
        : this.createCheckboxElement(`header-selector${this._selectAll_UID}`),
      toolTip: (this._addonOptions.hideSelectAllCheckbox || this._addonOptions.hideInColumnTitleRow) ? '' : this._addonOptions.toolTip,
      field: columnId,
      cssClass: this._addonOptions.cssClass,
      excludeFromExport: true,
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromQuery: true,
      excludeFromHeaderMenu: true,
      hideSelectAllCheckbox: this._addonOptions.hideSelectAllCheckbox,
      resizable: false,
      reorderable: this._addonOptions.reorderable,
      sortable: false,
      width: this._addonOptions.width || 30,
      maxWidth: this._addonOptions.width || 30,
      formatter: this.checkboxSelectionFormatter.bind(this),
    } as Column;
  }

  hideSelectAllFromColumnHeaderTitleRow() {
    this._grid.updateColumnHeader(this._addonOptions.columnId || '', this._addonOptions.name || '', '');
  }

  hideSelectAllFromColumnHeaderFilterRow() {
    const selectAllContainerElm = this.headerRowNode?.querySelector<HTMLSpanElement>('#filter-checkbox-selectall-container');
    if (selectAllContainerElm) {
      selectAllContainerElm.style.display = 'none';
    }
  }

  /**
   * Toggle a row selection by providing a row number
   * @param {Number} row - grid row number to toggle
   */
  toggleRowSelection(row: number) {
    this.toggleRowSelectionWithEvent(null, row);
  }

  /**
   *  Toggle a row selection and also provide the event that triggered it
   * @param {Object} event - event that triggered the row selection change
   * @param {Number} row - grid row number to toggle
   * @returns
   */
  toggleRowSelectionWithEvent(event: SlickEventData | null, row: number) {
    const dataContext = this._grid.getDataItem(row);
    if (!this.checkSelectableOverride(row, dataContext, this._grid)) {
      return;
    }

    // user can optionally execute a callback defined in its grid options prior to toggling the row
    const previousSelectedRows = this._grid.getSelectedRows();
    if (typeof this._addonOptions.onRowToggleStart === 'function') {
      this._addonOptions.onRowToggleStart(event, { row, previousSelectedRows });
    }

    const newSelectedRows = this._selectedRowsLookup[row] ? this._grid.getSelectedRows().filter((n) => n !== row) : this._grid.getSelectedRows().concat(row);
    this._grid.setSelectedRows(newSelectedRows, 'click.toggle');
    this._grid.setActiveCell(row, this.getCheckboxColumnCellIndex());

    // user can optionally execute a callback defined in its grid options after the row toggle is completed
    if (this._addonOptions.onRowToggleEnd) {
      this._addonOptions.onRowToggleEnd(event, { row, previousSelectedRows });
    }
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
    this._eventHandler.subscribe(grid.onHeaderRowCellRendered, (_e, args) => {
      if (args.column.field === (this._addonOptions.field || '_checkbox_selector')) {
        emptyElement(args.node);

        const inputId = `header-filter-selector${this._selectAll_UID}`;
        const labelElm = createDomElement('label', { id: 'filter-checkbox-selectall-container', htmlFor: inputId });
        const divElm = createDomElement('div', { className: 'icon-checkbox-container' });
        divElm.appendChild(
          createDomElement('input', { id: inputId, type: 'checkbox', ariaChecked: 'false' })
        );
        divElm.appendChild(
          createDomElement('div', { className: 'sgi sgi-icon-uncheck' })
        );

        labelElm.appendChild(divElm);
        args.node.appendChild(labelElm);
        this._headerRowNode = args.node;
        this._headerRowNode.classList.add('checkbox-header');

        this._bindEventService.bind(labelElm, 'click', ((e: DOMMouseOrTouchEvent<HTMLInputElement>) => this.handleHeaderClick(e, args)) as EventListener);
      }
    });
  }

  protected checkboxSelectionFormatter(row: number, _cell: number, _val: any, _columnDef: Column, dataContext: any, grid: SlickGrid) {
    if (dataContext && this.checkSelectableOverride(row, dataContext, grid)) {
      const UID = this.createUID() + row;
      return this.createCheckboxElement(`selector${UID}`, !!this._selectedRowsLookup[row]);
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

  protected handleDataViewSelectedIdsChanged() {
    const selectedIds = this._dataView.getAllSelectedFilteredIds();
    const filteredItems = this._dataView.getFilteredItems();
    let disabledCount = 0;

    if (typeof this._selectableOverride === 'function' && selectedIds.length > 0) {
      for (let k = 0; k < this._dataView.getItemCount(); k++) {
        // If we are allowed to select the row
        const dataItem = this._dataView.getItemByIdx(k);
        const idProperty = this._dataView.getIdPropertyName();
        const dataItemId = dataItem[idProperty];
        const foundItemIdx = filteredItems.findIndex((item) => item[idProperty] === dataItemId);
        if (foundItemIdx >= 0 && !this.checkSelectableOverride(k, dataItem, this._grid)) {
          disabledCount++;
        }
      }
    }
    this._isSelectAllChecked = (selectedIds.length + disabledCount) >= filteredItems.length;

    if (!this._addonOptions.hideInColumnTitleRow && !this._addonOptions.hideSelectAllCheckbox) {
      this.renderSelectAllCheckbox(this._isSelectAllChecked);
    }
    if (!this._addonOptions.hideInFilterHeaderRow) {
      const selectAllElm = this.headerRowNode?.querySelector<HTMLInputElement>(`#header-filter-selector${this._selectAll_UID}`);
      const selectAllIconElm = this.headerRowNode?.querySelector<HTMLInputElement>('.icon-checkbox-container .sgi');
      if (selectAllElm) {
        selectAllElm.ariaChecked = String(this._isSelectAllChecked);
        selectAllElm.checked = this._isSelectAllChecked;
      }
      if (selectAllIconElm) {
        selectAllIconElm.className = `sgi ${this._isSelectAllChecked ? CHECK_ICON : UNCHECK_ICON}`;
      }
    }
  }

  protected handleClick(e: SlickEventData, args: { row: number; cell: number; grid: SlickGrid; }) {
    // clicking on a row select checkbox
    if (this._grid.getColumns()[args.cell].id === this._addonOptions.columnId && (e.target as HTMLInputElement).type === 'checkbox') {
      (e.target as HTMLInputElement).ariaChecked = String((e.target as HTMLInputElement).checked);

      // if editing, try to commit
      if (this._grid.getEditorLock().isActive() && !this._grid.getEditorLock().commitCurrentEdit()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      this.toggleRowSelectionWithEvent(e, args.row);
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }

  protected handleHeaderClick(e: DOMMouseOrTouchEvent<HTMLInputElement> | SlickEventData, args: OnHeaderClickEventArgs) {
    if (args.column.id === this._addonOptions.columnId && (e.target as HTMLInputElement).type === 'checkbox') {
      (e.target as HTMLInputElement).ariaChecked = String((e.target as HTMLInputElement).checked);

      // if editing, try to commit
      if (this._grid.getEditorLock().isActive() && !this._grid.getEditorLock().commitCurrentEdit()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      // who called the selection?
      let isAllSelected = (e.target as HTMLInputElement).checked;
      const caller = isAllSelected ? 'click.selectAll' : 'click.unselectAll';

      // trigger event before the real selection so that we have an event before & the next one after the change
      const previousSelectedRows = this._grid.getSelectedRows();

      // user can optionally execute a callback defined in its grid options prior to the Select All toggling
      if (this._addonOptions.onSelectAllToggleStart) {
        this._addonOptions.onSelectAllToggleStart(e, { previousSelectedRows, caller });
      }

      let newSelectedRows: number[] = []; // when unselecting all, the array will become empty
      if (isAllSelected) {
        const rows = [];
        for (let i = 0; i < this._grid.getDataLength(); i++) {
          // Get the row and check it's a selectable row before pushing it onto the stack
          const rowItem = this._grid.getDataItem(i);
          if (!rowItem.__group && !rowItem.__groupTotals && this.checkSelectableOverride(i, rowItem, this._grid)) {
            rows.push(i);
          }
        }
        newSelectedRows = rows;
        isAllSelected = true;
      }

      if (this._isUsingDataView && this._dataView && this._addonOptions.applySelectOnAllPages) {
        const ids = [];
        const filteredItems = this._dataView.getFilteredItems();
        for (let j = 0; j < filteredItems.length; j++) {
          // Get the row and check it's a selectable ID (it could be in a different page) before pushing it onto the stack
          const dataviewRowItem = filteredItems[j];
          if (this.checkSelectableOverride(j, dataviewRowItem, this._grid)) {
            ids.push(dataviewRowItem[this._dataView.getIdPropertyName()]);
          }
        }
        this._dataView.setSelectedIds(ids, { isRowBeingAdded: isAllSelected });
      }

      // we finally need to call the actual row selection from SlickGrid method
      this._grid.setSelectedRows(newSelectedRows, caller);

      // user can optionally execute a callback defined in its grid options after the Select All toggling is completed
      if (this._addonOptions.onSelectAllToggleEnd) {
        this._addonOptions.onSelectAllToggleEnd(e, { rows: newSelectedRows, previousSelectedRows, caller });
      }

      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }

  protected handleKeyDown(e: SlickEventData, args: OnKeyDownEventArgs) {
    if (e.key === ' ') {
      if (this._grid.getColumns()[args.cell].id === this._addonOptions.columnId) {
        // if editing, try to commit
        if (!this._grid.getEditorLock().isActive() || this._grid.getEditorLock().commitCurrentEdit()) {
          this.toggleRowSelectionWithEvent(e, args.row);
        }
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
  }

  protected handleSelectedRowsChanged() {
    const selectedRows = this._grid.getSelectedRows();
    const lookup: RowLookup = {};
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

    const removeList: number[] = [];
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
    if (typeof this._selectedRowsLookup === 'object') {
      Object.keys(this._selectedRowsLookup).forEach(selectedRow => {
        if (selectedRow !== undefined) {
          this._grid.invalidateRow(+selectedRow);
        }
      });
    }

    this._selectedRowsLookup = lookup;
    this._grid.render();
    this._isSelectAllChecked = (selectedRows?.length ?? 0) + disabledCount >= this._grid.getDataLength();

    if (!this._isUsingDataView || !this._addonOptions.applySelectOnAllPages) {
      if (!this._addonOptions.hideInColumnTitleRow && !this._addonOptions.hideSelectAllCheckbox) {
        this.renderSelectAllCheckbox(this._isSelectAllChecked);
      }
      if (!this._addonOptions.hideInFilterHeaderRow) {
        const selectAllElm = this.headerRowNode?.querySelector<HTMLInputElement>(`#header-filter-selector${this._selectAll_UID}`);
        if (selectAllElm) {
          selectAllElm.ariaChecked = String(this._isSelectAllChecked);
          selectAllElm.checked = this._isSelectAllChecked;
        }
      }
    }

    // Remove items that shouln't of been selected in the first place (Got here Ctrl + click)
    if (removeList.length > 0) {
      for (const itemToRemove of removeList) {
        const remIdx = selectedRows.indexOf(itemToRemove);
        selectedRows.splice(remIdx, 1);
      }
      this._grid.setSelectedRows(selectedRows, 'click.toggle');
    }
  }

  protected renderSelectAllCheckbox(isSelectAllChecked: boolean) {
    const colHeaderElm = this._grid.updateColumnHeader(
      this._addonOptions.columnId || '',
      this.createCheckboxElement(`header-selector${this._selectAll_UID}`, !!isSelectAllChecked),
      this._addonOptions.toolTip
    );
    colHeaderElm?.classList.add('header-checkbox-selectall');
  }
}