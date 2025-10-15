import type { BasePubSubService, EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { dequal } from 'dequal/lite';
import { SlickEventHandler, type SlickDataView, type SlickGrid } from '../core/index.js';
import { ExtensionName } from '../enums/index.js';
import type {
  Column,
  CurrentColumn,
  CurrentFilter,
  CurrentPagination,
  CurrentRowSelection,
  CurrentSorter,
  GridOption,
  GridState,
  TreeToggleStateChange,
} from '../interfaces/index.js';
import type { ExtensionService } from './extension.service.js';
import type { FilterService } from './filter.service.js';
import type { SharedService } from './shared.service.js';
import type { SortService } from './sort.service.js';
import type { TreeDataService } from './treeData.service.js';

export class GridStateService {
  protected _eventHandler: SlickEventHandler;
  protected _columns: Column[] = [];
  protected _grid!: SlickGrid;
  protected _subscriptions: EventSubscription[] = [];
  protected _selectedRowIndexes: number[] | undefined = [];
  protected _selectedRowDataContextIds: Array<number | string> | undefined = []; // used with row selection
  protected _wasRecheckedAfterPageChange = true; // used with row selection & pagination

  constructor(
    protected readonly extensionService: ExtensionService,
    protected readonly filterService: FilterService,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService,
    protected readonly sortService: SortService,
    protected readonly treeDataService: TreeDataService
  ) {
    this._eventHandler = new SlickEventHandler();
  }

  /** Getter of SlickGrid DataView object */
  get _dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>() ?? {};
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  /** Getter of the selected data context object IDs */
  get selectedRowDataContextIds(): Array<number | string> | undefined {
    return this._selectedRowDataContextIds;
  }

  /** Setter of the selected data context object IDs */
  set selectedRowDataContextIds(dataContextIds: Array<number | string> | undefined) {
    this._selectedRowDataContextIds = dataContextIds;
  }

  /**
   * Initialize the Service
   * @param grid
   */
  init(grid: SlickGrid): void {
    this._grid = grid;
    this.subscribeToAllGridChanges(grid);
  }

  /** Dispose of all the SlickGrid & PubSub subscriptions */
  dispose(): void {
    this._columns = [];

    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();

    // also dispose of all Subscriptions
    this.pubSubService.unsubscribeAll(this._subscriptions);
  }

  /**
   * Dynamically change the arrangement/distribution of the columns Positions/Visibilities and optionally Widths.
   * For a column to have its visibly as hidden, it has to be part of the original list but excluded from the list provided as argument to be considered a hidden field.
   * If you are passing columns Width, then you probably don't want to trigger the autosizeColumns (2nd argument to False).
   * We could also resize the columns by their content but be aware that you can only trigger 1 type of resize at a time (either the 2nd argument or the 3rd last argument but not both at same time)
   * The resize by content could be called by the 3rd argument OR simply by enabling `enableAutoResizeColumnsByCellContent` but again this will only get executed when the 2nd argument is set to false.
   * @param {Array<Column>} definedColumns - defined columns
   * @param {Boolean} triggerAutoSizeColumns - True by default, do we also want to call the "autosizeColumns()" method to make the columns fit in the grid?
   * @param {Boolean} triggerColumnsFullResizeByContent - False by default, do we also want to call full columns resize by their content?
   */
  changeColumnsArrangement(
    definedColumns: CurrentColumn[],
    triggerAutoSizeColumns = true,
    triggerColumnsFullResizeByContent = false
  ): void {
    if (Array.isArray(definedColumns) && definedColumns.length > 0) {
      const newArrangedColumns: Column[] = this.getAssociatedGridColumns(this._grid, definedColumns);

      if (newArrangedColumns && Array.isArray(newArrangedColumns) && newArrangedColumns.length > 0) {
        // make sure that the checkbox selector is still visible in the list when it is enabled
        if (Array.isArray(this.sharedService.allColumns)) {
          const dynamicAddonColumnByIndexPositionList: { columnId: string; columnIndexPosition: number }[] = [];

          if (this._gridOptions.enableCheckboxSelector) {
            const columnIndexPosition = this._gridOptions?.checkboxSelector?.columnIndexPosition ?? 0;
            dynamicAddonColumnByIndexPositionList.push({ columnId: '_checkbox_selector', columnIndexPosition });
          }
          if (this._gridOptions.enableRowDetailView) {
            const columnIndexPosition = this._gridOptions?.rowDetailView?.columnIndexPosition ?? 0;
            dynamicAddonColumnByIndexPositionList.push({ columnId: '_detail_selector', columnIndexPosition });
          }
          if (this._gridOptions.enableRowMoveManager) {
            const columnIndexPosition = this._gridOptions?.rowMoveManager?.columnIndexPosition ?? 0;
            dynamicAddonColumnByIndexPositionList.push({ columnId: '_move', columnIndexPosition });
          }

          // since some features could have a `columnIndexPosition`, we need to make sure these indexes are respected in the column definitions
          this.addColumnDynamicWhenFeatureEnabled(dynamicAddonColumnByIndexPositionList, this.sharedService.allColumns, newArrangedColumns);
        }

        // keep copy the original optional `width` properties optionally provided by the user.
        // We will use this when doing a resize by cell content, if user provided a `width` it won't override it.
        newArrangedColumns.forEach((col) => (col.originalWidth = col.width || col.originalWidth));

        // finally set the new presets columns (including checkbox selector if need be)
        this._grid.setColumns(newArrangedColumns);
        this.sharedService.visibleColumns = newArrangedColumns;

        // resize the columns to fit the grid canvas
        if (triggerAutoSizeColumns) {
          this._grid.autosizeColumns();
        } else if (
          triggerColumnsFullResizeByContent ||
          (this._gridOptions.enableAutoResizeColumnsByCellContent && !this._gridOptions.autosizeColumnsByCellContentOnFirstLoad)
        ) {
          this.pubSubService.publish('onFullResizeByContentRequested', { caller: 'GridStateService' });
        }
      }
    }
  }

  /**
   * Get the current grid state (filters/sorters/pagination)
   * @return grid state
   */
  getCurrentGridState(): GridState {
    const { frozenColumn, frozenRow, frozenBottom } = this.sharedService.gridOptions;
    const gridState: GridState = {
      columns: this.getCurrentColumns(),
      filters: this.getCurrentFilters(),
      sorters: this.getCurrentSorters(),
      pinning: { frozenColumn, frozenRow, frozenBottom },
    };

    // optional Grouping
    const currentGrouping = this.getCurrentGrouping();
    if (currentGrouping) {
      gridState.grouping = currentGrouping;
    }

    // optional Pagination
    const currentPagination = this.getCurrentPagination();
    if (currentPagination) {
      gridState.pagination = currentPagination;
    }

    // optional Row Selection
    if (this.hasRowSelectionEnabled()) {
      const currentRowSelection = this.getCurrentRowSelections();
      if (currentRowSelection) {
        gridState.rowSelection = currentRowSelection;
      }
    }

    // optional Tree Data toggle items
    if (this._gridOptions?.enableTreeData) {
      const treeDataTreeToggleState = this.getCurrentTreeDataToggleState();
      if (treeDataTreeToggleState) {
        gridState.treeData = treeDataTreeToggleState;
      }
    }

    return gridState;
  }

  /**
   * Get the Columns (and their state: visibility/position) that are currently applied in the grid
   * @return current columns
   */
  getColumns(): Column[] {
    return this._columns;
  }

  /**
   * From an array of Grid Column Definitions, get the associated Current Columns
   * @param gridColumns
   */
  getAssociatedCurrentColumns(gridColumns: Column[]): CurrentColumn[] {
    const currentColumns: CurrentColumn[] = [];

    if (gridColumns && Array.isArray(gridColumns)) {
      gridColumns.forEach((column: Column) => {
        if (column?.id) {
          currentColumns.push({
            columnId: column.id as string,
            cssClass: column.cssClass || '',
            headerCssClass: column.headerCssClass || '',
            width: column.width || 0,
          });
        }
      });
    }
    return currentColumns;
  }

  /**
   * From an array of Current Columns, get the associated Grid Column Definitions
   * @param grid
   * @param currentColumns
   */
  getAssociatedGridColumns(grid: SlickGrid, currentColumns: CurrentColumn[]): Column[] {
    const columns: Column[] = [];
    const gridColumns: Column[] = this.sharedService.allColumns || grid.getColumns();

    if (currentColumns && Array.isArray(currentColumns)) {
      currentColumns.forEach((currentColumn: CurrentColumn) => {
        const gridColumn: Column | undefined = gridColumns.find((c: Column) => c.id === currentColumn.columnId);
        if (gridColumn?.id) {
          columns.push({
            ...gridColumn,
            cssClass: currentColumn.cssClass || gridColumn.cssClass,
            headerCssClass: currentColumn.headerCssClass || gridColumn.headerCssClass,

            // for the width we will only pull the custom width or else nothing
            // since we don't want to use the default width that SlickGrid uses internally (which is 60px),
            // because that would cancel any column resize done by Slickgrid-Universal (like autoResizeColumnsByCellContent)
            width: currentColumn.width,
          });
        }
      });
    }
    this._columns = columns;
    return columns;
  }

  /**
   * Get the Columns (and their states: visibility/position/width) that are currently applied in the grid
   * @return current columns
   */
  getCurrentColumns(): CurrentColumn[] {
    return this.getAssociatedCurrentColumns(this._grid.getColumns() || []);
  }

  /**
   * Get the Filters (and their state, columnId, searchTerm(s)) that are currently applied in the grid
   * @return current filters
   */
  getCurrentFilters(): CurrentFilter[] | null {
    if (this._gridOptions?.backendServiceApi) {
      const backendService = this._gridOptions.backendServiceApi.service;
      if (backendService?.getCurrentFilters) {
        return backendService.getCurrentFilters() as CurrentFilter[];
      }
    } else if (this.filterService?.getCurrentLocalFilters) {
      return this.filterService.getCurrentLocalFilters();
    }
    return null;
  }

  /**
   * Get the Grouping column IDs or null when there are no Grouping set
   * @returns current Grouping column IDs
   */
  getCurrentGrouping(): string[] | null {
    if (this._gridOptions?.enableGrouping || this._gridOptions.enableDraggableGrouping) {
      return this._dataView.getGrouping().map((g) => g.getter?.toString() || '');
    }
    return null;
  }

  /**
   * Get current Pagination (and its state, pageNumber, pageSize) that are currently applied in the grid
   * @return current pagination state
   */
  getCurrentPagination(): CurrentPagination | null {
    if (this._gridOptions?.enablePagination) {
      if (this._gridOptions.backendServiceApi) {
        const backendService = this._gridOptions.backendServiceApi.service;
        if (backendService?.getCurrentPagination) {
          return backendService.getCurrentPagination();
        }
      }
      return this.sharedService.currentPagination;
    }
    return null;
  }

  /**
   * Get the current Row Selections (and its state, gridRowIndexes, dataContextIds, filteredDataContextIds) that are currently applied in the grid
   * @param boolean are we requesting a refresh of the Section FilteredRow
   * @return current row selection
   */
  getCurrentRowSelections(): CurrentRowSelection | null {
    if (this._grid && this._dataView && this.hasRowSelectionEnabled()) {
      return {
        gridRowIndexes: this._grid.getSelectedRows() || [],
        dataContextIds: this._dataView.getAllSelectedIds() || [],
        filteredDataContextIds: this._dataView.getAllSelectedFilteredIds() || [],
      };
    }
    return null;
  }

  /**
   * Get the current Sorters (and their state, columnId, direction) that are currently applied in the grid
   * @return current sorters
   */
  getCurrentSorters(): CurrentSorter[] | null {
    if (this._gridOptions?.backendServiceApi) {
      const backendService = this._gridOptions.backendServiceApi.service;
      if (backendService?.getCurrentSorters) {
        return backendService.getCurrentSorters() as CurrentSorter[];
      }
    } else if (this.sortService?.getCurrentLocalSorters) {
      return this.sortService.getCurrentLocalSorters();
    }
    return null;
  }

  /**
   * Get the current list of Tree Data item(s) that got toggled in the grid
   * @returns {Array<TreeToggledItem>} treeDataToggledItems - items that were toggled (array of `parentId` and `isCollapsed` flag)
   */
  getCurrentTreeDataToggleState(): Omit<TreeToggleStateChange, 'fromItemId'> | null {
    if (this._gridOptions?.enableTreeData && this.treeDataService) {
      return this.treeDataService.getCurrentToggleState();
    }
    return null;
  }

  /** Check whether the row selection needs to be preserved */
  needToPreserveRowSelection(): boolean {
    let preservedRowSelection = false;
    if (this._gridOptions?.dataView && this._gridOptions.dataView.hasOwnProperty('syncGridSelection')) {
      const syncGridSelection = this._gridOptions.dataView.syncGridSelection;
      if (typeof syncGridSelection === 'boolean') {
        preservedRowSelection = this._gridOptions.dataView.syncGridSelection as boolean;
      } else if (typeof syncGridSelection === 'object') {
        preservedRowSelection = syncGridSelection.preserveHidden || syncGridSelection.preserveHiddenOnSelectionChange;
      }

      // if the result is True but the grid is using a Backend Service, we will do an extra flag check the reason is because it might have some unintended behaviors
      // with the BackendServiceApi because technically the data in the page changes the DataView on every page.
      if (
        preservedRowSelection &&
        this._gridOptions.backendServiceApi &&
        this._gridOptions.dataView.hasOwnProperty('syncGridSelectionWithBackendService')
      ) {
        preservedRowSelection = this._gridOptions.dataView.syncGridSelectionWithBackendService as boolean;
      }
    }
    return preservedRowSelection;
  }

  resetColumns(columnDefinitions?: Column[]): void {
    const columns: Column[] = columnDefinitions || this._columns;
    const currentColumns: CurrentColumn[] = this.getAssociatedCurrentColumns(columns);
    this.pubSubService.publish('onGridStateChanged', {
      change: { newValues: currentColumns, type: 'columns' },
      gridState: this.getCurrentGridState(),
    });
  }

  /**
   * Reset the grid to its original (all) columns, that is to display the entire set of columns with their original positions & visibilities
   * @param {Boolean} triggerAutoSizeColumns - True by default, do we also want to call the "autosizeColumns()" method to make the columns fit in the grid?
   */
  resetToOriginalColumns(triggerAutoSizeColumns = true): void {
    this._grid.setColumns(this.sharedService.allColumns);
    this.sharedService.visibleColumns = this.sharedService.allColumns;

    // resize the columns to fit the grid canvas
    if (triggerAutoSizeColumns) {
      this._grid.autosizeColumns();
    }
  }

  /** if we use Row Selection or the Checkbox Selector, we need to reset any selection */
  resetRowSelectionWhenRequired(): void {
    if (!this.needToPreserveRowSelection() && (this._gridOptions.enableRowSelection || this._gridOptions.enableCheckboxSelector)) {
      // this also requires the Row Selection Model to be registered as well
      if (this.extensionService?.getExtensionByName?.(ExtensionName.rowSelection)?.instance) {
        this._grid.setSelectedRows([]);
      }
    }
  }

  /**
   * Subscribe to all necessary SlickGrid or Service Events that deals with a Grid change,
   * when triggered, we will publish a Grid State Event with current Grid State
   */
  subscribeToAllGridChanges(grid: SlickGrid): void {
    // Subscribe to Event Emitter of Filter changed
    this._subscriptions.push(
      this.pubSubService.subscribe<CurrentFilter[]>('onFilterChanged', (currentFilters) => {
        this.resetRowSelectionWhenRequired();
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues: currentFilters, type: 'filter' },
          gridState: this.getCurrentGridState(),
        });
      })
    );

    // Subscribe to Event Emitter of Filter cleared
    this._subscriptions.push(
      this.pubSubService.subscribe('onFilterCleared', () => {
        this.resetRowSelectionWhenRequired();
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues: [], type: 'filter' },
          gridState: this.getCurrentGridState(),
        });
      })
    );

    // Subscribe to Event Emitter of Sort changed
    this._subscriptions.push(
      this.pubSubService.subscribe<CurrentSorter[]>('onSortChanged', (currentSorters) => {
        this.resetRowSelectionWhenRequired();
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues: currentSorters, type: 'sorter' },
          gridState: this.getCurrentGridState(),
        });
      })
    );
    // Subscribe to Event Emitter of Sort cleared
    this._subscriptions.push(
      this.pubSubService.subscribe('onSortCleared', () => {
        this.resetRowSelectionWhenRequired();
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues: [], type: 'sorter' },
          gridState: this.getCurrentGridState(),
        });
      })
    );

    // Subscribe to ColumnPicker and/or GridMenu for show/hide Columns visibility changes
    this.bindExtensionAddonEventToGridStateChange(ExtensionName.columnPicker, 'onColumnsChanged');
    this.bindExtensionAddonEventToGridStateChange(ExtensionName.gridMenu, 'onColumnsChanged');

    // subscribe to Column Resize & Reordering
    this.bindSlickGridColumnChangeEventToGridStateChange('onColumnsReordered', grid);
    this.bindSlickGridColumnChangeEventToGridStateChange('onColumnsResized', grid);
    this.bindSlickGridOnSetOptionsEventToGridStateChange(grid);

    // subscribe to Row Selection changes (when enabled)
    if (this._gridOptions.enableRowSelection || this._gridOptions.enableCheckboxSelector) {
      this._eventHandler.subscribe(this._dataView.onSelectedRowIdsChanged, (e, args) => {
        const previousSelectedRowIndexes = (this._selectedRowIndexes || []).slice();
        const previousSelectedFilteredRowDataContextIds = (this.selectedRowDataContextIds || []).slice();
        this.selectedRowDataContextIds = args.filteredIds;
        this._selectedRowIndexes = args.rows;

        // prettier-ignore
        if (!dequal(this.selectedRowDataContextIds, previousSelectedFilteredRowDataContextIds) || !dequal(this._selectedRowIndexes, previousSelectedRowIndexes)) {
          const newValues = {
            gridRowIndexes: this._selectedRowIndexes || [],
            dataContextIds: args.selectedRowIds,
            filteredDataContextIds: args.filteredIds,
          } as CurrentRowSelection;
          this.pubSubService.publish('onGridStateChanged', {
            change: { newValues, type: 'rowSelection' },
            gridState: this.getCurrentGridState(),
          });
        }
      });
    }

    // subscribe to HeaderMenu & GridService show/hide column(s)
    this._subscriptions.push(
      this.pubSubService.subscribe<{ columns: Column[]; hiddenColumn?: Column }>(['onHideColumns', 'onShowColumns'], (data) => {
        const currentColumns: CurrentColumn[] = this.getAssociatedCurrentColumns(data.columns);
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues: currentColumns, type: 'columns' },
          gridState: this.getCurrentGridState(),
        });
      })
    );

    // subscribe to Tree Data toggle items changes
    this._subscriptions.push(
      this.pubSubService.subscribe<TreeToggleStateChange>('onTreeItemToggled', (toggleChange) => {
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues: toggleChange, type: 'treeData' },
          gridState: this.getCurrentGridState(),
        });
      })
    );

    // subscribe to Tree Data full tree toggle changes
    this._subscriptions.push(
      this.pubSubService.subscribe<Omit<TreeToggleStateChange, 'fromItemId'>>('onTreeFullToggleEnd', (toggleChange) => {
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues: toggleChange, type: 'treeData' },
          gridState: this.getCurrentGridState(),
        });
      })
    );
  }

  // --
  // protected methods
  // ------------------

  /**
   * Add certain column(s), when the feature is/are enabled, to an output column definitions array (by reference).
   * Basically some features (for example: Row Selection, Row Detail, Row Move) will be added as column(s) dynamically and internally by the lib,
   * we just ask the developer to enable the feature, via flags, and internally the lib will create the necessary column.
   * So specifically for these column(s) and feature(s), we need to re-add them internally when the user calls the `changeColumnsArrangement()` method.
   * @param {Array<Object>} dynamicAddonColumnByIndexPositionList - array of plugin columnId and columnIndexPosition that will be re-added (if it wasn't already found in the output array) dynamically
   * @param {Array<Column>} fullColumns - full column definitions array that includes every columns (including Row Selection, Row Detail, Row Move when enabled)
   * @param {Array<Column>} newArrangedColumns - output array that will be use to show in the UI (it could have less columns than fullColumnDefinitions array since user might hide some columns)
   */
  protected addColumnDynamicWhenFeatureEnabled(
    dynamicAddonColumnByIndexPositionList: Array<{ columnId: string; columnIndexPosition: number }>,
    fullColumns: Column[],
    newArrangedColumns: Column[]
  ): void {
    // 1- first step is to sort them by their index position
    dynamicAddonColumnByIndexPositionList.sort((feat1, feat2) => feat1.columnIndexPosition - feat2.columnIndexPosition);

    // 2- second step, we can now proceed to create each extension/addon and that will position them accordingly in the column definitions list
    dynamicAddonColumnByIndexPositionList.forEach((feature) => {
      const pluginColumnIdx = fullColumns.findIndex((col) => col.id === feature.columnId);
      const associatedGridCheckboxColumnIdx = newArrangedColumns.findIndex((col) => col.id === feature.columnId);

      if (pluginColumnIdx >= 0 && associatedGridCheckboxColumnIdx === -1) {
        const pluginColumn = fullColumns[pluginColumnIdx];
        pluginColumnIdx === 0 ? newArrangedColumns.unshift(pluginColumn) : newArrangedColumns.splice(pluginColumnIdx, 0, pluginColumn);
      }
    });
  }

  /**
   * Bind a SlickGrid Extension Event to a Grid State change event
   * @param extension name
   * @param event name
   */
  protected bindExtensionAddonEventToGridStateChange(extensionName: ExtensionName, eventName: string): void {
    const extension = this.extensionService?.getExtensionByName?.(extensionName);
    const slickEvent = extension?.instance?.[eventName];

    if (slickEvent && typeof slickEvent.subscribe === 'function') {
      this._eventHandler.subscribe(slickEvent, (_e, args) => {
        const columns: Column[] = args?.columns;
        const currentColumns: CurrentColumn[] = this.getAssociatedCurrentColumns(columns);
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues: currentColumns, type: 'columns' },
          gridState: this.getCurrentGridState(),
        });
      });
    }
  }

  /**
   * Bind a Grid Event (of Column changes) to a Grid State change event
   * @param event - event name
   * @param grid - SlickGrid object
   */
  protected bindSlickGridColumnChangeEventToGridStateChange(eventName: string, grid: SlickGrid): void {
    const slickGridEvent = (grid as any)?.[eventName];

    if (slickGridEvent && typeof slickGridEvent.subscribe === 'function') {
      this._eventHandler.subscribe(slickGridEvent, () => {
        const columns: Column[] = grid.getColumns();
        const currentColumns: CurrentColumn[] = this.getAssociatedCurrentColumns(columns);
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues: currentColumns, type: 'columns' },
          gridState: this.getCurrentGridState(),
        });
      });
    }
  }

  /**
   * Bind a Grid Event (of grid option changes) to a Grid State change event, if we detect that any of the pinning (frozen) options changes then we'll trigger a Grid State change
   * @param grid - SlickGrid object
   */
  protected bindSlickGridOnSetOptionsEventToGridStateChange(grid: SlickGrid): void {
    const onSetOptionsHandler = grid.onSetOptions;
    this._eventHandler.subscribe(onSetOptionsHandler, (_e, args) => {
      const { frozenBottom: frozenBottomBefore, frozenColumn: frozenColumnBefore, frozenRow: frozenRowBefore } = args.optionsBefore;
      const { frozenBottom: frozenBottomAfter, frozenColumn: frozenColumnAfter, frozenRow: frozenRowAfter } = args.optionsAfter;

      // prettier-ignore
      if ((frozenBottomBefore !== frozenBottomAfter) || (frozenColumnBefore !== frozenColumnAfter) || (frozenRowBefore !== frozenRowAfter)) {
        const newValues = { frozenBottom: frozenBottomAfter, frozenColumn: frozenColumnAfter, frozenRow: frozenRowAfter };
        const currentGridState = this.getCurrentGridState();
        this.pubSubService.publish('onGridStateChanged', {
          change: { newValues, type: 'pinning' },
          gridState: currentGridState,
        });
      }
    });
  }

  /** Check wether the grid has the Row Selection enabled */
  protected hasRowSelectionEnabled(): boolean {
    const selectionModel = this._grid.getSelectionModel();
    const isRowSelectionEnabled = !!(this._gridOptions.enableRowSelection || this._gridOptions.enableCheckboxSelector);
    return isRowSelectionEnabled && !!selectionModel;
  }
}
