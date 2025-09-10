import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { arrayRemoveItemByIndex, isObjectEmpty } from '@slickgrid-universal/utils';

import type {
  CellArgs,
  Column,
  CurrentPinning,
  GridOption,
  GridServiceDeleteOption,
  GridServiceInsertOption,
  GridServiceUpdateOption,
  HideColumnOption,
  OnEventArgs,
  ShowColumnOption,
} from '../interfaces/index.js';
import type { FilterService } from './filter.service.js';
import type { GridStateService } from './gridState.service.js';
import type { PaginationService } from '../services/pagination.service.js';
import type { SharedService } from './shared.service.js';
import type { SlickDataView, SlickGrid } from '../core/index.js';
import type { SortService } from './sort.service.js';
import type { TreeDataService } from './treeData.service.js';
import { SlickRowSelectionModel } from '../extensions/slickRowSelectionModel.js';

const GridServiceDeleteOptionDefaults: GridServiceDeleteOption = { skipError: false, triggerEvent: true };
const GridServiceInsertOptionDefaults: GridServiceInsertOption = {
  highlightRow: true,
  resortGrid: false,
  selectRow: false,
  scrollRowIntoView: true,
  skipError: false,
  triggerEvent: true,
};
const GridServiceUpdateOptionDefaults: GridServiceUpdateOption = {
  highlightRow: false,
  selectRow: false,
  scrollRowIntoView: false,
  skipError: false,
  triggerEvent: true,
};
const HideColumnOptionDefaults: HideColumnOption = {
  applySetColumns: true,
  autoResizeColumns: true,
  triggerEvent: true,
  hideFromColumnPicker: false,
  hideFromGridMenu: false,
};
const ShowColumnOptionDefaults: ShowColumnOption = { autoResizeColumns: true, triggerEvent: true };

export class GridService {
  protected _grid!: SlickGrid;
  protected _rowSelectionPlugin?: SlickRowSelectionModel;

  constructor(
    protected readonly gridStateService: GridStateService,
    protected readonly filterService: FilterService,
    protected readonly pubSubService: BasePubSubService,
    protected readonly paginationService: PaginationService,
    protected readonly sharedService: SharedService,
    protected readonly sortService: SortService,
    protected readonly treeDataService: TreeDataService
  ) {}

  /** Getter of SlickGrid DataView object */
  protected get _dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>();
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  dispose(): void {
    this._rowSelectionPlugin?.dispose();
  }

  init(grid: SlickGrid): void {
    this._grid = grid;
  }

  /** Clear all Filters & Sorts */
  clearAllFiltersAndSorts(): void {
    // call both clear Filters & Sort but only trigger the last one to avoid sending multiple backend queries
    this.sortService?.clearSorting(false); // skip event trigger on this one
    this.filterService?.clearFilters();
  }

  /** Clear all the pinning (frozen) options */
  clearPinning(resetColumns = true): void {
    const visibleColumns = [...this.sharedService.visibleColumns];
    this.sharedService.slickGrid.setOptions({
      frozenColumn: -1,
      frozenRow: -1,
      frozenBottom: false,
      enableMouseWheelScrollHandler: false,
    });

    // SlickGrid seems to be somehow resetting the columns to their original positions,
    // so let's re-fix them to the position we kept as reference
    if (resetColumns && Array.isArray(visibleColumns)) {
      this.sharedService.slickGrid.setColumns(visibleColumns);
    }
  }

  /**
   * Set pinning (frozen) grid options
   * @param  {Object} pinningOptions - which pinning/frozen options to modify
   * @param {Boolean} shouldAutosizeColumns - defaults to True, should we call an `autosizeColumns()` after the pinning is done?
   * @param {Boolean} suppressRender - do we want to supress the grid re-rendering? (defaults to false)
   * @param {Boolean} suppressColumnSet - do we want to supress the columns set, via `setColumns()` method? (defaults to true)
   * @param {Boolean} suppressUpdateColumns - do we want to supress the columns update, via `updateColumns()` method? (defaults to false, if you're calling `grid.setColumns()` afterward then you should suppress this)
   */
  setPinning(
    pinningOptions: CurrentPinning,
    shouldAutosizeColumns = true,
    suppressRender = false,
    suppressColumnSet = true,
    suppressUpdateColumns = false
  ): void {
    if (isObjectEmpty(pinningOptions)) {
      this.clearPinning();
    } else {
      this.sharedService.slickGrid.setOptions(pinningOptions, suppressRender, suppressColumnSet);
      this.sharedService.frozenVisibleColumnId = this._grid.getFrozenColumnId();
      this.sharedService.gridOptions = this._grid.getOptions();
    }

    if (shouldAutosizeColumns) {
      this.sharedService.slickGrid.autosizeColumns();
    }
    if (!suppressUpdateColumns) {
      this._grid.updateColumns();
    }
  }

  /**
   * Get all column set in the grid, that is all visible/hidden columns
   * and also include any extra columns used by some plugins (like Row Selection, Row Detail, ...)
   */
  getAllColumnDefinitions(): Column[] {
    return this.sharedService.allColumns;
  }

  /** Get only visible column definitions and also include any extra columns by some plugins (like Row Selection, Row Detail, ...) */
  getVisibleColumnDefinitions(): Column[] {
    return this.sharedService.visibleColumns;
  }

  /**
   * From a SlickGrid Event triggered get the Column Definition and Item Data Context
   *
   * For example the SlickGrid onClick will return cell arguments when subscribing to it.
   * From these cellArgs, we want to get the Column Definition and Item Data
   * @param cell event args
   * @return object with columnDef and dataContext
   */
  getColumnFromEventArguments(args: CellArgs): OnEventArgs {
    if (!args?.grid || !args.grid.getColumns || !args.grid.getDataItem) {
      throw new Error(
        '[Slickgrid-Universal] To get the column definition and data, we need to have these arguments passed as objects (row, cell, grid)'
      );
    }

    return {
      row: args.row,
      cell: args.cell,
      columnDef: args.grid.getColumns()[args.cell],
      dataContext: args.grid.getDataItem(args.row),
      dataView: this._dataView,
      grid: this._grid,
    };
  }

  /** Get data item by it's row index number */
  getDataItemByRowNumber<T = any>(rowNumber: number): T {
    if (!this._grid || typeof this._grid.getDataItem !== 'function') {
      throw new Error(`[Slickgrid-Universal] We could not find SlickGrid Grid object or it's "getDataItem" method`);
    }
    return this._grid.getDataItem(rowNumber);
  }

  /** Get the Data Item from a grid row index */
  getDataItemByRowIndex<T = any>(index: number): T {
    if (!this._grid || typeof this._grid.getDataItem !== 'function') {
      throw new Error('[Slickgrid-Universal] We could not find SlickGrid Grid object and/or "getDataItem" method');
    }

    return this._grid.getDataItem(index);
  }

  /** Get the Data Item from an array of grid row indexes */
  getDataItemByRowIndexes<T = any>(indexes: number[]): T[] {
    if (!this._grid || typeof this._grid.getDataItem !== 'function') {
      throw new Error('[Slickgrid-Universal] We could not find SlickGrid Grid object and/or "getDataItem" method');
    }

    const dataItems: T[] = [];

    if (Array.isArray(indexes)) {
      indexes.forEach((idx) => {
        dataItems.push(this._grid.getDataItem(idx));
      });
    }

    return dataItems;
  }

  /** Get the currently selected row indexes */
  getSelectedRows(): number[] {
    if (!this._grid || typeof this._grid.getSelectedRows !== 'function') {
      throw new Error('[Slickgrid-Universal] We could not find SlickGrid Grid object and/or "getSelectedRows" method');
    }
    return this._grid.getSelectedRows();
  }

  /** Get the currently selected rows item data */
  getSelectedRowsDataItem<T = any>(): T[] {
    if (!this._grid || typeof this._grid.getSelectedRows !== 'function') {
      throw new Error('[Slickgrid-Universal] We could not find SlickGrid Grid object and/or "getSelectedRows" method');
    }

    const selectedRowIndexes = this._grid.getSelectedRows();
    return this.getDataItemByRowIndexes<T>(selectedRowIndexes);
  }

  /**
   * Hide a Column from the Grid by its id, the column will just become hidden and will still show up in columnPicker/gridMenu
   * @param {string | number} columnId - column definition id
   * @param {boolean} triggerEvent - do we want to trigger an event (`onHideColumns`) when column becomes hidden? Defaults to true.
   * @return {number} columnIndex - column index position when found or -1
   */
  hideColumnById(columnId: string | number, options?: HideColumnOption): number {
    if (this._grid) {
      options = { ...HideColumnOptionDefaults, ...options };
      const currentColumns = this._grid.getColumns();
      const colIndexFound = currentColumns.findIndex((col) => col.id === columnId);

      if (colIndexFound >= 0) {
        const visibleColumns = arrayRemoveItemByIndex<Column>(currentColumns, colIndexFound);

        // do we want to apply the new columns in the grid
        if (options?.applySetColumns) {
          this.sharedService.visibleColumns = visibleColumns;
          this._grid.setColumns(visibleColumns);
        }

        const columnIndexFromAllColumns = this.sharedService.allColumns.findIndex((col) => col.id === columnId);
        if (columnIndexFromAllColumns) {
          if (options?.hideFromColumnPicker) {
            this.sharedService.allColumns[columnIndexFromAllColumns].excludeFromColumnPicker = true;
          }
          if (options?.hideFromGridMenu) {
            this.sharedService.allColumns[columnIndexFromAllColumns].excludeFromGridMenu = true;
          }
        }

        // execute common grid commands when enabled
        this.executeVisibilityCommands(options, ['onHideColumns'], visibleColumns);
        return colIndexFound;
      }
    }
    return -1;
  }

  /**
   * Hide multiple columns by their Ids, the column will just become hidden and will still show up in columnPicker/gridMenu
   * @param {Array<string | number>} columnIds - column ids to hide
   * @param {boolean} triggerEvent - do we want to trigger an event "onHideColumns" when column becomes hidden? Defaults to true.
   */
  hideColumnByIds(columnIds: Array<string | number>, options?: HideColumnOption): void {
    if (Array.isArray(columnIds)) {
      const finalVisibileColumns = this._grid.getColumns().filter((c) => !columnIds.includes(c.id));
      options = { ...HideColumnOptionDefaults, ...options };
      for (const columnId of columnIds) {
        // hide each column by its id but wait after the for loop to auto resize columns in the grid
        this.hideColumnById(columnId, { ...options, triggerEvent: false, applySetColumns: false, autoResizeColumns: false });
      }

      // after looping through all columns, we can apply the leftover visible columns in the grid & keep shared ref
      this.sharedService.visibleColumns = finalVisibileColumns;
      this._grid.setColumns(finalVisibileColumns);

      // execute common grid commands when enabled
      this.executeVisibilityCommands(options, ['onHideColumns'], finalVisibileColumns);
    }
  }

  /**
   * Show multiple columns by their Ids, any column outside the provided array will be considered hidden but will still show up in columnPicker/gridMenu
   * @param {Array<string | number>} columnIds - column ids to show
   * @param {boolean} triggerEvent - do we want to trigger an event (onShowColumns) when column becomes hidden? Defaults to true.
   */
  showColumnByIds(columnIds: Array<string | number>, options?: ShowColumnOption): void {
    if (this._grid) {
      options = { ...ShowColumnOptionDefaults, ...options };
      const columns = this.sharedService.allColumns.filter((c) => columnIds.includes(c.id));
      this._grid.setColumns(columns);
      this.sharedService.visibleColumns = columns;

      // execute common grid commands when enabled
      this.executeVisibilityCommands(options, ['onShowColumns'], this.sharedService.visibleColumns);
    }
  }

  protected executeVisibilityCommands(
    options: { autoResizeColumns?: boolean; triggerEvent?: boolean },
    eventNames: string[],
    columns: Column[]
  ): void {
    // do we want to auto-resize the columns in the grid after hidding/showing columns?
    if (options?.autoResizeColumns) {
      this._grid.autosizeColumns();
    }

    // do we want to trigger an event after showing
    if (options?.triggerEvent) {
      eventNames.forEach((name) => this.pubSubService.publish(name, { columns }));
    }
  }

  /**
   * Highlight then fade a row for certain duration (ms).
   * @param {Number} rowNumber - grid row number
   * @param {Number} [duration] - duration in ms
   */
  highlightRow(rowNumber: number | number[], duration?: number): void {
    // create a SelectionModel if there's not one yet
    if (!this._grid.getSelectionModel()) {
      this._rowSelectionPlugin = new SlickRowSelectionModel(this._gridOptions.rowSelectionOptions);
      this._grid.setSelectionModel(this._rowSelectionPlugin);
    }

    duration ||= this._gridOptions.rowHighlightDuration;
    if (Array.isArray(rowNumber)) {
      rowNumber.forEach((row) => this._grid.highlightRow(row));
    } else {
      this._grid.highlightRow(rowNumber, duration);
    }
  }

  /** Select the selected row by a row index */
  setSelectedRow(rowIndex: number): void {
    this._grid?.setSelectedRows([rowIndex]);
  }

  /** Set selected rows with provided array of row indexes */
  setSelectedRows(rowIndexes: number[]): void {
    this._grid?.setSelectedRows(rowIndexes);
  }

  /** Re-Render the Grid */
  renderGrid(): void {
    this._grid?.invalidate();
  }

  /**
   * Reset the grid to it's original state (clear any filters, sorting & pagination if exists) .
   * The column definitions could be passed as argument to reset (this can be used after a Grid State reset)
   * The reset will clear the Filters & Sort, then will reset the Columns to their original state
   */
  resetGrid(columns?: Column[]): void {
    // clear any Pinning/Frozen columns/rows
    // do it prior to setting the Columns back on the next few lines
    this.clearPinning(false);

    // reset columns to original states & refresh the grid
    if (this._grid) {
      const originalColumns = this.sharedService.allColumns || [];

      if (Array.isArray(originalColumns) && originalColumns.length > 0) {
        // set the grid columns to it's original column definitions
        this._grid.setColumns(originalColumns);
        if (this._gridOptions?.enableAutoSizeColumns) {
          this._grid.autosizeColumns();
        }
        this.gridStateService.resetColumns(columns);
      }
    }

    if (typeof this.filterService?.clearFilters === 'function') {
      this.filterService.clearFilters();
    }
    if (typeof this.sortService?.clearSorting === 'function') {
      this.sortService.clearSorting();
    }
  }

  /**
   * Add an item (data item) to the datagrid, by default it will highlight (flashing) the inserted row but we can disable it too
   * @param item object which must contain a unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the upsert (highlightRow, resortGrid, selectRow, triggerEvent)
   * @return rowIndex: typically index 0 when adding to position "top" or a different number when adding to the "bottom"
   */
  addItem<T = any>(item: T, options?: GridServiceInsertOption): number | undefined {
    const insertOptions = { ...GridServiceInsertOptionDefaults, ...options };

    if (!insertOptions?.skipError && (!this._grid || !this._gridOptions || !this._dataView)) {
      throw new Error('[Slickgrid-Universal] We could not find SlickGrid Grid, DataView objects');
    }
    const idPropName = this._gridOptions.datasetIdPropertyName || 'id';
    if (!insertOptions?.skipError && (!item || !item.hasOwnProperty(idPropName))) {
      throw new Error(`[Slickgrid-Universal] Adding an item requires the item to include an "${idPropName}" property`);
    }

    if (this._gridOptions?.enableTreeData && options?.position === 'top') {
      throw new Error(
        '[Slickgrid-Universal] Please note that `addItem({ position: "top" })` is not supported when used with Tree Data because of the extra complexity.'
      );
    }

    const insertPosition = insertOptions?.position;

    // insert position top/bottom, defaults to top
    // when position is top we'll call insert at index 0, else call addItem which just push to the DataView array
    if (insertPosition === 'bottom' || this._gridOptions?.enableTreeData) {
      this._dataView.addItem(item);
    } else {
      this._dataView.insertItem(0, item); // insert at index 0
    }

    // row number in the grid, by default it will be on first row (top is the default)
    let rowNumber: number | undefined = 0;
    const itemId = (item as any)?.[idPropName] ?? '';

    if (this._gridOptions?.enableTreeData) {
      // if we add/remove item(s) from the dataset, we need to also refresh our tree data filters
      this.invalidateHierarchicalDataset();
      rowNumber = this._dataView.getRowById(itemId);
      if (insertOptions.scrollRowIntoView) {
        this._grid.scrollRowIntoView(rowNumber ?? 0, false);
      }
    } else if (insertOptions.resortGrid) {
      // do we want the item to be sorted in the grid, when set to False it will insert on first row (defaults to false)
      this._dataView.reSort();

      // find the row number in the grid and if user wanted to see highlighted row
      // we need to do it here after resort and get each row number because it possibly changes after the sort
      rowNumber = this._dataView.getRowById(itemId);
    } else {
      // scroll to row index 0 when inserting on top else scroll to the bottom where it got inserted
      rowNumber = insertPosition === 'bottom' ? this._dataView.getRowById(itemId) : 0;
      if (insertOptions.scrollRowIntoView) {
        this._grid.scrollRowIntoView(rowNumber ?? 0);
      }
    }

    // if highlight is enabled, we'll highlight the row we just added
    if (insertOptions.highlightRow && rowNumber !== undefined) {
      this.highlightRow(rowNumber);
    }

    // if row selection (checkbox selector) is enabled, we'll select the row in the grid
    if (
      rowNumber !== undefined &&
      insertOptions.selectRow &&
      this._gridOptions &&
      (this._gridOptions.enableCheckboxSelector || this._gridOptions.enableRowSelection)
    ) {
      this.setSelectedRow(rowNumber);
    }

    // do we want to trigger an event after adding the item
    if (insertOptions.triggerEvent) {
      this.pubSubService.publish<T[]>('onItemsAdded', [item]);
    }

    // when using Pagination in a local grid, we need to either go to first page or last page depending on which position user want to insert the new row
    const isLocalGrid = !this._gridOptions?.backendServiceApi;
    if (isLocalGrid && this._gridOptions.enablePagination) {
      insertPosition === 'bottom' ? this.paginationService.goToLastPage() : this.paginationService.goToFirstPage();
    }

    return rowNumber;
  }

  /**
   * Add item array (data item) to the datagrid, by default it will highlight (flashing) the inserted row but we can disable it too
   * @param item object arrays, which must contain unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the upsert (highlightRow, resortGrid, selectRow, triggerEvent)
   */
  addItems<T = any>(items: T | T[], options?: GridServiceInsertOption): number[] {
    const insertOptions = { ...GridServiceInsertOptionDefaults, ...options };
    const idPropName = this._gridOptions.datasetIdPropertyName || 'id';
    const insertPosition = insertOptions?.position;
    const rowNumbers: number[] = [];

    // loop through all items to add
    if (!Array.isArray(items)) {
      return [this.addItem<T>(items, insertOptions) || 0]; // on a single item, just call addItem()
    } else {
      // begin bulk transaction
      this._dataView.beginUpdate(true);

      // insert position top/bottom, defaults to top
      // when position is top we'll call insert at index 0, else call addItem which just push to the DataView array
      if (insertPosition === 'bottom' || this._gridOptions?.enableTreeData) {
        this._dataView.addItems(items);
      } else {
        this._dataView.insertItems(0, items); // insert at index 0 to the start of the dataset
      }

      // end the bulk transaction since we're all done
      this._dataView.endUpdate();
    }

    if (this._gridOptions?.enableTreeData) {
      // if we add/remove item(s) from the dataset, we need to also refresh our tree data filters
      this.invalidateHierarchicalDataset();
      const firstItemId = (items as any)[0]?.[idPropName] ?? '';
      const rowNumber = this._dataView.getRowById(firstItemId);
      if (insertOptions.scrollRowIntoView) {
        this._grid.scrollRowIntoView(rowNumber ?? 0, false);
      }
    } else if (insertOptions.resortGrid) {
      // do we want the item to be sorted in the grid, when set to False it will insert on first row (defaults to false)
      this._dataView.reSort();
    }

    // when insert position if defined and we're not using a Tree Data grid
    if (insertPosition && insertOptions.scrollRowIntoView && !this._gridOptions?.enableTreeData) {
      // "top" insert will scroll to row index 0 or else "bottom" will scroll to the bottom of the grid
      insertPosition === 'bottom' ? this._grid.navigateBottom() : this._grid.navigateTop();
    }

    // get row numbers of all new inserted items
    // we need to do it after resort and get each row number because it possibly changed after the sort
    items.forEach((item: T) => rowNumbers.push(this._dataView.getRowById(item[idPropName as keyof T] as string | number) as number));

    // if user wanted to see highlighted row
    if (insertOptions.highlightRow) {
      this.highlightRow(rowNumbers);
    }

    // select the row in the grid
    if (
      insertOptions.selectRow &&
      this._gridOptions &&
      (this._gridOptions.enableCheckboxSelector || this._gridOptions.enableRowSelection)
    ) {
      this.setSelectedRows(rowNumbers);
    }

    // do we want to trigger an event after adding the item
    if (insertOptions.triggerEvent) {
      this.pubSubService.publish<T[]>('onItemsAdded', items);
    }

    return rowNumbers;
  }

  /**
   * Delete an existing item from the datagrid (dataView)
   * @param item object which must contain a unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the upsert (triggerEvent)
   * @return item id deleted
   */
  deleteItem<T = any>(item: T, options?: GridServiceDeleteOption): number | string {
    options = { ...GridServiceDeleteOptionDefaults, ...options };
    const idPropName = this._gridOptions.datasetIdPropertyName || 'id';

    if (!options?.skipError && (!item || !item.hasOwnProperty(idPropName))) {
      throw new Error(`[Slickgrid-Universal] Deleting an item requires the item to include an "${idPropName}" property`);
    }
    return this.deleteItemById(item[idPropName as keyof T] as string | number, options);
  }

  /**
   * Delete an array of existing items from the datagrid
   * @param item object which must contain a unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the upsert (triggerEvent)
   * @return item id deleted
   */
  deleteItems<T = any>(items: T | T[], options?: GridServiceDeleteOption): Array<number | string> {
    options = { ...GridServiceDeleteOptionDefaults, ...options };
    const idPropName = this._gridOptions.datasetIdPropertyName || 'id';

    // when it's not an array, we can call directly the single item delete
    if (!Array.isArray(items)) {
      this.deleteItem<T>(items, options);
      return [(items as any)[idPropName]];
    }

    // begin bulk transaction
    this._dataView.beginUpdate(true);

    const itemIds: string[] = [];
    items.forEach((item: T) => {
      if ((item as any)?.[idPropName] !== undefined) {
        itemIds.push((item as any)[idPropName]);
      }
    });

    // delete the item from the dataView
    this._dataView.deleteItems(itemIds);

    // end the bulk transaction since we're all done
    this._dataView.endUpdate();

    // do we want to trigger an event after deleting the item
    if (options.triggerEvent) {
      this.pubSubService.publish<T[]>('onItemsDeleted', items);
    }
    return itemIds;
  }

  /**
   * Delete an existing item from the datagrid (dataView) by it's id
   * @param itemId: item unique id
   * @param options: provide the possibility to do certain actions after or during the upsert (triggerEvent)
   * @return item id deleted
   */
  deleteItemById(itemId: string | number, options?: GridServiceDeleteOption): number | string {
    options = { ...GridServiceDeleteOptionDefaults, ...options };

    if (!options?.skipError && (itemId === null || itemId === undefined)) {
      throw new Error(`[Slickgrid-Universal] Cannot delete a row without a valid "id"`);
    }

    // when user has row selection enabled, we should clear any selection to avoid confusion after a delete
    const isSyncGridSelectionEnabled = (this.gridStateService && this.gridStateService.needToPreserveRowSelection()) || false;
    if (
      !isSyncGridSelectionEnabled &&
      this._grid &&
      this._gridOptions &&
      (this._gridOptions.enableCheckboxSelector || this._gridOptions.enableRowSelection)
    ) {
      this.setSelectedRows([]);
    }

    // delete the item from the dataView
    this._dataView.deleteItem(itemId);

    // do we want to trigger an event after deleting the item
    if (options.triggerEvent) {
      this.pubSubService.publish<Array<string | number>>('onItemsDeleted', [itemId]);
    }
    return itemId;
  }

  /**
   * Delete an array of existing items from the datagrid
   * @param itemIds array of item unique IDs
   * @param options: provide the possibility to do certain actions after or during the upsert (triggerEvent)
   */
  deleteItemByIds(itemIds: Array<number | string>, options?: GridServiceDeleteOption): Array<number | string> {
    options = { ...GridServiceDeleteOptionDefaults, ...options };

    // when it's not an array, we can call directly the single item delete
    if (Array.isArray(itemIds)) {
      // begin bulk transaction
      this._dataView.beginUpdate(true);

      for (let i = 0; i < itemIds.length; i++) {
        if (itemIds[i] !== null) {
          this.deleteItemById(itemIds[i], { triggerEvent: false });
        }
      }

      // end the bulk transaction since we're all done
      this._dataView.endUpdate();

      // do we want to trigger an event after deleting the item
      if (options.triggerEvent) {
        this.pubSubService.publish<Array<number | string>>('onItemsDeleted', itemIds);
      }
      return itemIds;
    }
    return [];
  }

  /**
   * Update an existing item with new properties inside the datagrid
   * @param item object which must contain a unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the upsert (highlightRow, selectRow, triggerEvent)
   * @return grid row index
   */
  updateItem<T = any>(item: T, options?: GridServiceUpdateOption): number | undefined {
    options = { ...GridServiceUpdateOptionDefaults, ...options };
    const idPropName = this._gridOptions.datasetIdPropertyName || 'id';
    const itemId = !item || !item.hasOwnProperty(idPropName) ? undefined : (item as any)[idPropName];

    if (!options?.skipError && itemId === undefined) {
      throw new Error(`[Slickgrid-Universal] Calling Update of an item requires the item to include an "${idPropName}" property`);
    }

    return this.updateItemById(itemId, item, options);
  }

  /**
   * Update an array of existing items with new properties inside the datagrid
   * @param item object arrays, which must contain unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the update (highlightRow, selectRow, triggerEvent)
   * @return grid row indexes
   */
  updateItems<T = any>(items: T | T[], options?: GridServiceUpdateOption): Array<number | undefined> {
    options = { ...GridServiceUpdateOptionDefaults, ...options };
    const idPropName = this._gridOptions.datasetIdPropertyName || 'id';

    // when it's not an array, we can call directly the single item update
    if (!Array.isArray(items)) {
      return [this.updateItem<T>(items, options)];
    }

    // begin bulk transaction
    this._dataView.beginUpdate(true);

    // loop through each item, get their Ids and row number position in the grid
    // also call a grid render on the modified row for the item to be reflected in the UI
    const rowNumbers: number[] = [];
    const itemIds: Array<string | number> = [];
    items.forEach((item: T) => {
      const itemId = !item || !item.hasOwnProperty(idPropName) ? undefined : (item as any)[idPropName];
      itemIds.push(itemId);

      if (this._dataView.getIdxById(itemId) !== undefined) {
        const rowNumber = this._dataView.getRowById(itemId);
        if (rowNumber !== undefined) {
          rowNumbers.push(rowNumber);
          this._grid.updateRow(rowNumber);
        }
      }
    });

    // Update the items in the dataView, note that the itemIds must be in the same order as the items
    this._dataView.updateItems(itemIds, items);

    // end the bulk transaction since we're all done
    this._dataView.endUpdate();

    if (this._gridOptions?.enableTreeData) {
      // if we add/remove item(s) from the dataset, we need to also refresh our tree data filters
      this.invalidateHierarchicalDataset();
    }

    // only highlight at the end, all at once
    // we have to do this because doing highlight 1 by 1 would only re-select the last highlighted row which is wrong behavior
    if (options.highlightRow) {
      this.highlightRow(rowNumbers);
    }

    // select the row in the grid
    if (options.selectRow && this._gridOptions && (this._gridOptions.enableCheckboxSelector || this._gridOptions.enableRowSelection)) {
      this.setSelectedRows(rowNumbers);
    }

    // do we want to trigger an event after updating the item
    if (options.triggerEvent) {
      this.pubSubService.publish<T[]>('onItemsUpdated', items);
    }

    return rowNumbers;
  }

  /**
   * Update an existing item in the datagrid by it's id and new properties
   * @param itemId: item unique id
   * @param item object which must contain a unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the upsert (highlightRow, selectRow, triggerEvent)
   * @return grid row number
   */
  updateItemById<T = any>(itemId: number | string, item: T, options?: GridServiceUpdateOption): number | undefined {
    options = { ...GridServiceUpdateOptionDefaults, ...options };
    if (!options?.skipError && itemId === undefined) {
      throw new Error(`[Slickgrid-Universal] Cannot update a row without a valid "id"`);
    }
    const rowNumber = this._dataView.getRowById(itemId) as number;

    // when using pagination the item to update might not be on current page, so we bypass this condition
    if (!options?.skipError && !item && !this._gridOptions.enablePagination) {
      throw new Error(`[Slickgrid-Universal] The item to update in the grid was not found with id: ${itemId}`);
    }

    if (this._dataView.getIdxById(itemId) !== undefined) {
      // Update the item itself inside the dataView
      this._dataView.updateItem(itemId, item);
      if (rowNumber !== undefined) {
        this._grid.updateRow(rowNumber);
      }

      if (this._gridOptions?.enableTreeData) {
        // if we add/remove item(s) from the dataset, we need to also refresh our tree data filters
        this.invalidateHierarchicalDataset();
      }

      // do we want to scroll to the row so that it shows in the Viewport (UI)
      if (options.scrollRowIntoView && rowNumber !== undefined) {
        this._grid.scrollRowIntoView(rowNumber);
      }

      // highlight the row we just updated, if defined
      if (options.highlightRow && rowNumber !== undefined) {
        this.highlightRow(rowNumber);
      }

      // select the row in the grid
      if (
        rowNumber !== undefined &&
        options.selectRow &&
        this._gridOptions &&
        (this._gridOptions.enableCheckboxSelector || this._gridOptions.enableRowSelection)
      ) {
        this.setSelectedRow(rowNumber);
      }

      // do we want to trigger an event after updating the item
      if (options.triggerEvent) {
        this.pubSubService.publish<T[]>('onItemsUpdated', [item]);
      }
    }
    return rowNumber;
  }

  /**
   * Insert a row into the grid if it doesn't already exist or update if it does.
   * @param item object which must contain a unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the upsert (highlightRow, resortGrid, selectRow, triggerEvent)
   */
  upsertItem<T = any>(item: T, options?: GridServiceInsertOption): { added: number | undefined; updated: number | undefined } {
    options = { ...GridServiceInsertOptionDefaults, ...options };
    const idPropName = this._gridOptions.datasetIdPropertyName || 'id';
    const itemId = !item || !item.hasOwnProperty(idPropName) ? undefined : (item as any)[idPropName];

    if (!options?.skipError && itemId === undefined) {
      throw new Error(`[Slickgrid-Universal] Calling Upsert of an item requires the item to include an "${idPropName}" property`);
    }

    return this.upsertItemById<T>(itemId, item, options);
  }

  /**
   * Update an array of existing items with new properties inside the datagrid
   * @param item object arrays, which must contain unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the upsert (highlightRow, resortGrid, selectRow, triggerEvent)
   * @return row numbers in the grid
   */
  upsertItems<T = any>(items: T | T[], options?: GridServiceInsertOption): { added: number | undefined; updated: number | undefined }[] {
    options = { ...GridServiceInsertOptionDefaults, ...options };
    // when it's not an array, we can call directly the single item upsert
    if (!Array.isArray(items)) {
      return [this.upsertItem<T>(items, options)];
    }

    // begin bulk transaction
    this._dataView.beginUpdate(true);

    const upsertedRows: { added: number | undefined; updated: number | undefined }[] = [];
    items.forEach((item: T) => {
      upsertedRows.push(
        this.upsertItem<T>(item, { ...options, highlightRow: false, resortGrid: false, selectRow: false, triggerEvent: false })
      );
    });

    // end the bulk transaction since we're all done
    this._dataView.endUpdate();

    const rowNumbers = upsertedRows.map((upsertRow) => (upsertRow.added !== undefined ? upsertRow.added : upsertRow.updated)) as number[];

    // only highlight at the end, all at once
    // we have to do this because doing highlight 1 by 1 would only re-select the last highlighted row which is wrong behavior
    if (options.highlightRow) {
      this.highlightRow(rowNumbers);
    }

    // select the row in the grid
    if (options.selectRow && this._gridOptions && (this._gridOptions.enableCheckboxSelector || this._gridOptions.enableRowSelection)) {
      this.setSelectedRows(rowNumbers);
    }

    // do we want to trigger an event after updating the item
    if (options.triggerEvent) {
      this.pubSubService.publish<T[]>('onItemsUpserted', items);
      const addedItems = upsertedRows.filter((upsertRow) => upsertRow.added !== undefined);
      if (Array.isArray(addedItems) && addedItems.length > 0) {
        this.pubSubService.publish<Array<{ added: number | undefined; updated: number | undefined }>>('onItemsAdded', addedItems);
      }
      const updatedItems = upsertedRows.filter((upsertRow) => upsertRow.updated !== undefined);
      if (Array.isArray(updatedItems) && updatedItems.length > 0) {
        this.pubSubService.publish<Array<{ added: number | undefined; updated: number | undefined }>>('onItemsUpdated', updatedItems);
      }
    }
    return upsertedRows;
  }

  /**
   * Update an existing item in the datagrid by it's id and new properties
   * @param itemId: item unique id
   * @param item object which must contain a unique "id" property and any other suitable properties
   * @param options: provide the possibility to do certain actions after or during the upsert (highlightRow, resortGrid, selectRow, triggerEvent)
   * @return grid row number in the grid
   */
  upsertItemById<T = any>(
    itemId: number | string,
    item: T,
    options?: GridServiceInsertOption
  ): { added: number | undefined; updated: number | undefined } {
    let isItemAdded = false;
    options = { ...GridServiceInsertOptionDefaults, ...options };
    if (!options?.skipError && itemId === undefined && !this.hasRowSelectionEnabled()) {
      throw new Error(`[Slickgrid-Universal] Calling Upsert of an item requires the item to include a valid and unique "id" property`);
    }

    let rowNumberAdded: number | undefined;
    let rowNumberUpdated: number | undefined;
    if (this._dataView.getRowById(itemId) === undefined) {
      rowNumberAdded = this.addItem<T>(item, options);
      isItemAdded = true;
    } else {
      rowNumberUpdated = this.updateItem<T>(item, {
        highlightRow: options.highlightRow,
        selectRow: options.selectRow,
        triggerEvent: options.triggerEvent,
      });
      isItemAdded = false;
    }

    // do we want to trigger an event after updating the item
    if (options.triggerEvent) {
      this.pubSubService.publish<T[]>('onItemsUpserted', [item]);
      this.pubSubService.publish<T[]>(isItemAdded ? 'onItemsAdded' : 'onItemsUpdated', [item]);
    }
    return { added: rowNumberAdded, updated: rowNumberUpdated };
  }

  /**
   * When dealing with hierarchical (tree) dataset, we can invalidate all the rows and force a full resort & re-render of the hierarchical tree dataset.
   * This method will automatically be called anytime user called `addItem()` or `addItems()` and it will reuse current column sorting when found (or use initial sort).
   * However please note that it won't be called when `updateItem`, if the data that gets updated does change the tree data column then you should call this method.
   * @param {Array<Object>} [items] - optional flat array of parent/child items to use while redoing the full sort & refresh
   */
  invalidateHierarchicalDataset(items?: any[]): void {
    // if we add/remove item(s) from the dataset, we need to also refresh our tree data filters
    if (this._gridOptions?.enableTreeData && this.treeDataService) {
      const inputItems = items ?? this._dataView.getItems();
      const sortCols = this.sortService.getCurrentColumnSorts();
      const sortedDatasetResult = this.treeDataService.convertFlatParentChildToTreeDatasetAndSort(
        inputItems || [],
        this.sharedService.allColumns,
        this._gridOptions,
        sortCols
      );
      this.sharedService.hierarchicalDataset = sortedDatasetResult.hierarchical;
      this.filterService.refreshTreeDataFilters(items);
      this._dataView.setItems(sortedDatasetResult.flat);
      this._grid.invalidate();
    }
  }

  // --
  // protected functions
  // -------------------

  /** Check wether the grid has the Row Selection enabled */
  protected hasRowSelectionEnabled(): boolean {
    const selectionModel = this._grid.getSelectionModel();
    const isRowSelectionEnabled = !!(this._gridOptions.enableRowSelection || this._gridOptions.enableCheckboxSelector);
    return isRowSelectionEnabled && !!selectionModel;
  }
}
