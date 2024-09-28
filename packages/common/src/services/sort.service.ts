import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import type {
  Column,
  ColumnSort,
  GridOption,
  CurrentSorter,
  MultiColumnSort,
  SingleColumnSort,
  TreeDataOption,
  DOMMouseOrTouchEvent,
} from '../interfaces/index';
import { EmitterType, FieldType, SortDirection, SortDirectionNumber, type SortDirectionString, } from '../enums/index';
import type { BackendUtilityService } from './backendUtility.service';
import type { CollectionService } from './collection.service';
import { getDescendantProperty, flattenToParentChildArray, isColumnDateType } from './utilities';
import { sortByFieldType } from '../sortComparers/sortUtilities';
import type { SharedService } from './shared.service';
import type { RxJsFacade, Subject } from './rxjsFacade';
import { type SlickDataView, type SlickEventData, SlickEventHandler, type SlickGrid } from '../core/index';

const WARN_NO_PREPARSE_DATE_SIZE = 5000; // data size to warn user when pre-parse isn't enabled

export class SortService {
  protected _currentLocalSorters: CurrentSorter[] = [];
  protected _eventHandler: SlickEventHandler;
  protected _dataView?: SlickDataView;
  protected _grid!: SlickGrid;
  protected _isBackendGrid = false;
  protected httpCancelRequests$?: Subject<void>; // this will be used to cancel any pending http request

  constructor(
    protected readonly collectionService: CollectionService,
    protected readonly sharedService: SharedService,
    protected readonly pubSubService: BasePubSubService,
    protected readonly backendUtilities?: BackendUtilityService | undefined,
    protected rxjs?: RxJsFacade | undefined,
  ) {
    this._eventHandler = new SlickEventHandler();
    if (this.rxjs) {
      this.httpCancelRequests$ = this.rxjs.createSubject<void>();
    }
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  /** Getter for the Column Definitions pulled through the Grid Object */
  protected get _columnDefinitions(): Column[] {
    return this._grid?.getColumns() ?? [];
  }

  dispose(): void {
    // unsubscribe all SlickGrid events
    if (this._eventHandler?.unsubscribeAll) {
      this._eventHandler.unsubscribeAll();
    }
    if (this.httpCancelRequests$ && this.rxjs?.isObservable(this.httpCancelRequests$)) {
      this.httpCancelRequests$.next(); // this cancels any pending http requests
      this.httpCancelRequests$.complete();
    }
  }

  addRxJsResource(rxjs: RxJsFacade): void {
    this.rxjs = rxjs;
  }

  /**
   * Bind a backend sort (single/multi) hook to the grid
   * @param grid SlickGrid Grid object
   * @param dataView SlickGrid DataView object
   */
  bindBackendOnSort(grid: SlickGrid): void {
    this._isBackendGrid = true;
    this._grid = grid;
    this._dataView = grid?.getData<SlickDataView>();

    // subscribe to the SlickGrid event and call the backend execution
    this._eventHandler.subscribe(grid.onSort, this.onBackendSortChanged.bind(this));
  }

  /**
   * Bind a local sort (single/multi) hook to the grid
   * @param grid SlickGrid Grid object
   * @param gridOptions Grid Options object
   * @param dataView
   */
  bindLocalOnSort(grid: SlickGrid): void {
    this._isBackendGrid = false;
    this._grid = grid;
    this._dataView = grid?.getData<SlickDataView>();

    this.processTreeDataInitialSort();
    this._eventHandler.subscribe(grid.onSort, this.handleLocalOnSort.bind(this));

    // when pre-parsing Dates is enabled and user is inserting/updating an item(s),
    // we'll automatically run Date parsing for these items to keep sort in sync
    if (this._gridOptions.preParseDateColumns) {
      this._eventHandler.subscribe(grid.onCellChange, (_e, args) => this.preParseSingleDateItem(args.item));
      this.pubSubService.subscribe(['onItemAdded', 'onItemUpdated'], (item) => this.preParseSingleDateItem(item));
    } else if (this._dataView?.getLength() > WARN_NO_PREPARSE_DATE_SIZE && grid.getColumns().some(c => isColumnDateType(c.type))) {
      console.warn(
        '[Slickgrid-Universal] For getting better perf, we suggest you enable the `preParseDateColumns` grid option, ' +
        'for more info visit:: https://ghiscoding.gitbook.io/slickgrid-universal/column-functionalities/sorting#pre-parse-date-columns-for-better-perf'
      );
    }
  }

  /** when pre-parse is enabled, parse date strings and convert them to JS Date objects */
  preParseSingleDateItem(item: any): void {
    if (this._gridOptions.preParseDateColumns) {
      const items = Array.isArray(item) ? item : [item];
      items.forEach(itm => this.collectionService.parseSingleDateItem(itm, this._grid, this._gridOptions.preParseDateColumns!));
    }
  }

  /** when pre-parse is enabled, parse date strings and convert them to JS Date objects */
  preParseAllDateItems(): void {
    if (this._gridOptions.preParseDateColumns) {
      const items = this._dataView?.getItems() || [];
      this.collectionService.preParseByMutationDateItems(items, this._grid, this._gridOptions.preParseDateColumns);
      this.sharedService.isItemsDateParsed = true;
    }
  }

  handleLocalOnSort(_e: SlickEventData, args: SingleColumnSort | MultiColumnSort): void {
    // multiSort and singleSort are not exactly the same, but we want to structure it the same so that the `for` loop works the same,
    // and also to avoid having to rewrite the `for` loop in the sort, so we will make the singleSort an array of 1 object
    const sortColumns: Array<SingleColumnSort> = (args.multiColumnSort)
      ? (args as MultiColumnSort).sortCols
      : new Array({
        columnId: (args as SingleColumnSort).sortCol?.id ?? '',
        sortAsc: (args as SingleColumnSort).sortAsc,
        sortCol: (args as SingleColumnSort).sortCol
      });

    // keep current sorters
    this._currentLocalSorters = []; // reset current local sorters
    if (Array.isArray(sortColumns)) {
      sortColumns.forEach((sortColumn: SingleColumnSort) => {
        if (sortColumn.sortCol) {
          this._currentLocalSorters.push({
            columnId: sortColumn.sortCol.id,
            direction: sortColumn.sortAsc ? SortDirection.ASC : SortDirection.DESC
          });
        }
      });
    }

    this.onLocalSortChanged(this._grid, sortColumns);
    this.emitSortChanged(EmitterType.local);
  }

  clearSortByColumnId(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData | undefined, columnId: string | number): void {
    // get previously sorted columns
    const allSortedCols = this.getCurrentColumnSorts() as ColumnSort[];
    const sortedColsWithoutCurrent = this.getCurrentColumnSorts(`${columnId}`) as ColumnSort[];

    if (Array.isArray(allSortedCols) && Array.isArray(sortedColsWithoutCurrent) && allSortedCols.length !== sortedColsWithoutCurrent.length) {
      if (this._gridOptions.backendServiceApi) {
        this.onBackendSortChanged(event, { multiColumnSort: true, sortCols: sortedColsWithoutCurrent, grid: this._grid });
      } else if (this._dataView) {
        this.onLocalSortChanged(this._grid, sortedColsWithoutCurrent, true, true);
      } else {
        // when using customDataView, we will simply send it as a onSort event with notify
        const isMultiSort = this._gridOptions.multiColumnSort || false;
        const sortOutput = isMultiSort ? sortedColsWithoutCurrent as unknown as MultiColumnSort : sortedColsWithoutCurrent[0] as unknown as SingleColumnSort;
        this._grid.onSort.notify(sortOutput);
      }

      // update the grid sortColumns array which will at the same add the visual sort icon(s) on the UI
      const updatedSortColumns: ColumnSort[] = sortedColsWithoutCurrent.map((col) => {
        return {
          columnId: col?.sortCol?.id ?? '',
          sortAsc: col?.sortAsc,
          sortCol: col?.sortCol,
        };
      });
      this._grid.setSortColumns(updatedSortColumns); // add sort icon in UI
    }

    // when there's no more sorting, we re-sort by the default sort field, user can customize it "defaultColumnSortFieldId", defaults to "id"
    if (Array.isArray(sortedColsWithoutCurrent) && sortedColsWithoutCurrent.length === 0) {
      this.sortLocalGridByDefaultSortFieldId();
    }
  }

  /**
   * Clear Sorting
   * - 1st, remove the SlickGrid sort icons (this setSortColumns function call really does only that)
   * - 2nd, we also need to trigger a sort change
   *   - for a backend grid, we will trigger a backend sort changed with an empty sort columns array
   *   - however for a local grid, we need to pass a sort column and so we will sort by the 1st column
   * @param trigger query event after executing clear filter?
   */
  clearSorting(triggerQueryEvent = true): void {
    if (this._grid && this._gridOptions && this._dataView) {
      // remove any sort icons (this setSortColumns function call really does only that)
      this._grid.setSortColumns([]);

      // we also need to trigger a sort change
      // for a backend grid, we will trigger a backend sort changed with an empty sort columns array
      // however for a local grid, we need to pass a sort column and so we will sort by the 1st column
      if (triggerQueryEvent) {
        if (this._isBackendGrid) {
          this.onBackendSortChanged(undefined, { grid: this._grid, multiColumnSort: true, sortCols: [], clearSortTriggered: true });
        } else {
          if (this._columnDefinitions && Array.isArray(this._columnDefinitions) && this._columnDefinitions.length > 0) {
            this.sortLocalGridByDefaultSortFieldId();
          }
        }
      } else if (this._isBackendGrid) {
        const backendService = this._gridOptions.backendServiceApi?.service;
        if (backendService?.clearSorters) {
          backendService.clearSorters();
        }
      }
    }

    // set current sorter to empty & emit a sort changed event
    this._currentLocalSorters = [];

    // emit an event when sorts are all cleared
    this.pubSubService.publish('onSortCleared', true);
  }

  /**
   * Toggle the Sorting Functionality
   * @param {boolean} isSortingDisabled - optionally force a disable/enable of the Sort Functionality? Defaults to True
   * @param {boolean} clearSortingWhenDisabled - when disabling the sorting, do we also want to clear the sorting as well? Defaults to True
   */
  disableSortFunctionality(isSortingDisabled = true, clearSortingWhenDisabled = true): void {
    const prevSorting = this._gridOptions.enableSorting;
    const newSorting = !prevSorting;

    this._gridOptions.enableSorting = newSorting;
    let updatedColumnDefinitions;
    if (isSortingDisabled) {
      if (clearSortingWhenDisabled) {
        this.clearSorting();
      }
      this._eventHandler.unsubscribeAll();
      updatedColumnDefinitions = this.disableAllSortingCommands(true);
    } else {
      updatedColumnDefinitions = this.disableAllSortingCommands(false);
      this._eventHandler.subscribe(this._grid.onSort, (e, args) => this.handleLocalOnSort(e, args as SingleColumnSort | MultiColumnSort));
    }
    this._grid.setOptions({ enableSorting: this._gridOptions.enableSorting }, false, true);
    this.sharedService.gridOptions = this._gridOptions;

    // reset columns so that it recreate the column headers and remove/add the sort icon hints
    // basically without this, the sort icon hints were still showing up even after disabling the Sorting
    this._grid.setColumns(updatedColumnDefinitions);
  }

  /**
   * Toggle the Sorting functionality
   * @param {boolean} clearSortingWhenDisabled - when disabling the sorting, do we also want to clear the sorting as well? Defaults to True
   */
  toggleSortFunctionality(clearSortingOnDisable = true): void {
    const previousSorting = this._gridOptions.enableSorting;
    this.disableSortFunctionality(previousSorting, clearSortingOnDisable);
  }

  /**
   * A simple function that will be called to emit a change when a sort changes.
   * Other services, like Pagination, can then subscribe to it.
   * @param sender
   */
  emitSortChanged(sender: EmitterType, currentLocalSorters?: CurrentSorter[]): void {
    if (sender === EmitterType.remote && this._gridOptions.backendServiceApi) {
      let currentSorters: CurrentSorter[] = [];
      const backendService = this._gridOptions.backendServiceApi.service;
      if (backendService?.getCurrentSorters) {
        currentSorters = backendService.getCurrentSorters() as CurrentSorter[];
      }
      this.pubSubService.publish('onSortChanged', currentSorters);
    } else if (sender === EmitterType.local) {
      if (currentLocalSorters) {
        this._currentLocalSorters = currentLocalSorters;
      }
      this.pubSubService.publish('onSortChanged', this.getCurrentLocalSorters());
    }
  }

  getCurrentLocalSorters(): CurrentSorter[] {
    return this._currentLocalSorters;
  }

  /**
   * Get current column sorts,
   * If a column is passed as an argument, that will be exclusion so we won't add this column to our output array since it is already in the array.
   * The usage of this method is that we want to know the sort prior to calling the next sorting command
   */
  getCurrentColumnSorts(excludedColumnId?: string): ColumnSort[] {
    // getSortColumns() only returns sortAsc & columnId, we want the entire column definition
    if (this._grid) {
      const oldSortColumns = this._grid.getSortColumns();

      // get the column definition but only keep column which are not equal to our current column
      if (Array.isArray(oldSortColumns)) {
        const sortedCols = oldSortColumns.reduce((cols: ColumnSort[], col: SingleColumnSort | MultiColumnSort) => {
          if (col && (!excludedColumnId || (col as SingleColumnSort).columnId !== excludedColumnId)) {
            cols.push({ columnId: (col as SingleColumnSort).columnId || '', sortCol: this._columnDefinitions[this._grid.getColumnIndex((col as SingleColumnSort).columnId || '')], sortAsc: (col as SingleColumnSort).sortAsc });
          }
          return cols;
        }, []);

        return sortedCols;
      }
    }
    return [];
  }

  /** Load defined Sorting (sorters) into the grid */
  loadGridSorters(sorters: CurrentSorter[]): ColumnSort[] {
    this._currentLocalSorters = []; // reset current local sorters
    const sortCols: ColumnSort[] = [];

    if (Array.isArray(sorters)) {
      const tmpSorters = this._gridOptions.multiColumnSort ? sorters : sorters.slice(0, 1);

      tmpSorters.forEach((sorter: CurrentSorter) => {
        const column = this._columnDefinitions.find((col: Column) => col.id === sorter.columnId);
        if (column) {
          if (!column.sortable) {
            let errorMsg = '[Slickgrid-Universal] Cannot add sort icon to a column that is not sortable, please add `sortable: true` to your column or remove it from your list of columns to sort.';
            if (this._gridOptions.enableTreeData) {
              errorMsg += ' Also note that TreeData feature requires the column holding the tree (expand/collapse icons) to be sortable.';
            }
            throw new Error(errorMsg);
          }
          sortCols.push({
            columnId: column.id,
            sortAsc: ((sorter.direction.toUpperCase() === SortDirection.ASC) ? true : false),
            sortCol: column
          });

          // keep current sorters
          this._currentLocalSorters.push({
            columnId: String(column.id),
            direction: sorter.direction.toUpperCase() as SortDirectionString
          });
        }
      });

      this.onLocalSortChanged(this._grid, sortCols);
      this._grid.setSortColumns(sortCols.map(col => ({ columnId: col.columnId, sortAsc: col.sortAsc }))); // use this to add sort icon(s) in UI
    }
    return sortCols;
  }

  /** Process the initial sort, typically it will sort ascending by the column that has the Tree Data unless user specifies a different initialSort */
  processTreeDataInitialSort(): void {
    // when a Tree Data view is defined, we must sort the data so that the UI works correctly
    if (this._gridOptions.enableTreeData && this._gridOptions.treeDataOptions) {
      // first presort it once by tree level
      const treeDataOptions = this._gridOptions.treeDataOptions;
      const columnWithTreeData = this._columnDefinitions.find((col: Column) => col.id === treeDataOptions.columnId);
      if (columnWithTreeData) {
        let sortDirection = SortDirection.ASC;
        let sortTreeLevelColumn: ColumnSort = { columnId: treeDataOptions.columnId, sortCol: columnWithTreeData, sortAsc: true };

        // user could provide a custom sort field id, if so get that column and sort by it
        if (treeDataOptions?.initialSort?.columnId) {
          const initialSortColumnId = treeDataOptions.initialSort.columnId;
          const initialSortColumn = this._columnDefinitions.find((col: Column) => col.id === initialSortColumnId);
          sortDirection = (treeDataOptions.initialSort.direction || SortDirection.ASC).toUpperCase() as SortDirection;
          sortTreeLevelColumn = { columnId: initialSortColumnId, sortCol: initialSortColumn, sortAsc: (sortDirection === SortDirection.ASC) } as ColumnSort;
        }

        // when we have a valid column with Tree Data, we can sort by that column
        if (sortTreeLevelColumn?.columnId && this.sharedService?.hierarchicalDataset) {
          this.updateSorting([{ columnId: sortTreeLevelColumn.columnId || '', direction: sortDirection }]);
        }
      }
    }
  }

  /**
   * When working with Backend Service, we'll use the `onBeforeSort` which will return false since we want to manually apply the sort icons only after the server response
   * @param event - optional Event that triggered the sort
   * @param args - sort event arguments
   * @returns - False since we'll apply the sort icon(s) manually only after server responded
   */
  onBackendSortChanged(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData | undefined, args: (SingleColumnSort | MultiColumnSort) & { clearSortTriggered?: boolean; }): void {
    if (!args || !args.grid) {
      throw new Error('Something went wrong when trying to bind the "onBackendSortChanged(event, args)" function, it seems that "args" is not populated correctly');
    }
    const gridOptions: GridOption = args.grid?.getOptions() ?? {};
    const backendApi = gridOptions.backendServiceApi;

    if (!backendApi || !backendApi.process || !backendApi.service) {
      throw new Error(`BackendServiceApi requires at least a "process" function and a "service" defined`);
    }

    // keep start time & end timestamps & return it after process execution
    const startTime = new Date();

    if (backendApi.preProcess) {
      backendApi.preProcess();
    }

    // query backend
    const query = backendApi.service.processOnSortChanged(event as Event, args);
    const totalItems = gridOptions?.pagination?.totalItems || 0;
    this.backendUtilities?.executeBackendCallback(backendApi, query, args, startTime, totalItems, {
      emitActionChangedCallback: this.emitSortChanged.bind(this),
      errorCallback: () => {
        // revert to previous sort icons & also revert backend service query
        this._grid.setSortColumns(args.previousSortColumns || []);

        // we also need to provide the `sortCol` when using the backend service `updateSorters` method
        const sorterData = args.previousSortColumns?.map(cs => ({
          columnId: cs.columnId,
          sortAsc: cs.sortAsc,
          sortCol: this._columnDefinitions.find(col => col.id === cs.columnId) as Column
        }));
        backendApi?.service?.updateSorters?.(sorterData || []);
      },
      httpCancelRequestSubject: this.httpCancelRequests$
    });
  }

  /** When a Sort Changes on a Local grid (JSON dataset) */
  async onLocalSortChanged(grid: SlickGrid, sortColumns: Array<ColumnSort & { clearSortTriggered?: boolean; }>, forceReSort = false, emitSortChanged = false): Promise<void> {
    const datasetIdPropertyName = this._gridOptions.datasetIdPropertyName || 'id';
    const isTreeDataEnabled = this._gridOptions.enableTreeData || false;
    const dataView = grid.getData<SlickDataView>();
    await this.pubSubService.publish('onBeforeSortChange', { sortColumns }, 0);

    if (grid && dataView) {
      // when Date pre-parsing is enabled but not yet parsed, let's execute the Dates parsing
      if (this._gridOptions.preParseDateColumns && !this.sharedService.isItemsDateParsed && sortColumns.some(c => isColumnDateType(c.sortCol?.type))) {
        this.preParseAllDateItems();
      }

      if (forceReSort && !isTreeDataEnabled) {
        dataView.reSort();
      }

      if (isTreeDataEnabled && this._dataView && this.sharedService && Array.isArray(this.sharedService.hierarchicalDataset)) {
        const datasetSortResult = this.sortHierarchicalDataset(this.sharedService.hierarchicalDataset, sortColumns);

        // we could use the DataView sort but that would require re-sorting again (since the 2nd array that is currently in the DataView would have to be resorted against the 1st array that was sorting from tree sort)
        // it is simply much faster to just replace the entire dataset
        this._dataView.setItems(datasetSortResult.flat, datasetIdPropertyName);

        // also trigger a row count changed to avoid having an invalid filtered item count in the grid footer
        // basically without this the item count in the footer is incorrect and shows the full dataset length instead of the previous filtered count
        // that happens because we just overwrote the entire dataset the DataView.refresh() doesn't detect a row count change so we trigger it manually
        this._dataView.onRowCountChanged.notify({ previous: this._dataView.getFilteredItemCount(), current: this._dataView.getLength(), itemCount: this._dataView.getItemCount(), dataView: this._dataView, callingOnRowsChanged: true });
      } else {
        dataView.sort(this.sortComparers.bind(this, sortColumns));
      }

      grid.invalidate();

      if (emitSortChanged) {
        this.emitSortChanged(EmitterType.local, sortColumns.map(col => {
          return {
            columnId: col.sortCol?.id ?? 'id',
            direction: col.sortAsc ? SortDirection.ASC : SortDirection.DESC
          };
        }));
      }
    }
  }

  /**
   * Takes a hierarchical dataset and sort it recursively by reference and returns both flat & hierarchical sorted datasets.
   * Note: for perf reasons, it mutates the array by adding extra props like `treeLevel`
   */
  sortHierarchicalDataset<T>(hierarchicalDataset: T[], sortColumns: Array<ColumnSort & { clearSortTriggered?: boolean; }>, emitSortChanged = false): { hierarchical: T[]; flat: any[]; } {
    this.sortTreeData(hierarchicalDataset, sortColumns);
    const dataViewIdIdentifier = this._gridOptions.datasetIdPropertyName || 'id';
    const treeDataOpt: TreeDataOption = this._gridOptions.treeDataOptions || { columnId: '' };
    const treeDataOptions = { ...treeDataOpt, identifierPropName: treeDataOpt.identifierPropName ?? dataViewIdIdentifier, shouldAddTreeLevelNumber: true };
    const sortedFlatArray = flattenToParentChildArray(hierarchicalDataset, treeDataOptions);

    if (emitSortChanged) {
      // update current sorters
      this._currentLocalSorters = [];
      sortColumns.forEach(sortCol => {
        this._currentLocalSorters.push({ columnId: sortCol.columnId, direction: sortCol.sortAsc ? 'ASC' : 'DESC' });
      });
      const emitterType = this._gridOptions.backendServiceApi ? EmitterType.remote : EmitterType.local;
      this.emitSortChanged(emitterType);
    }

    return { hierarchical: hierarchicalDataset, flat: sortedFlatArray };
  }

  /** Call a local grid sort by its default sort field id (user can customize default field by configuring "defaultColumnSortFieldId" in the grid options, defaults to "id") */
  sortLocalGridByDefaultSortFieldId(): void {
    const sortColFieldId = this._gridOptions && this._gridOptions.defaultColumnSortFieldId || this._gridOptions.datasetIdPropertyName || 'id';
    const sortCol = { id: sortColFieldId, field: sortColFieldId } as Column;
    this.onLocalSortChanged(this._grid, new Array({ columnId: sortCol.id, sortAsc: true, sortCol, clearSortTriggered: true }), false, true);
  }

  sortComparers(sortColumns: ColumnSort[], dataRow1: any, dataRow2: any): number {
    if (Array.isArray(sortColumns)) {
      for (const sortColumn of sortColumns) {
        const result = this.sortComparer(sortColumn, dataRow1, dataRow2);
        if (result !== undefined) {
          return result;
        }
      }
    }
    return SortDirectionNumber.neutral;
  }

  sortComparer(sortColumn: ColumnSort, dataRow1: any, dataRow2: any, querySortField?: string): number | undefined {
    if (sortColumn?.sortCol) {
      const columnDef = sortColumn.sortCol;
      const fieldType = columnDef.type || FieldType.string;
      const sortDirection = sortColumn.sortAsc ? SortDirectionNumber.asc : SortDirectionNumber.desc;
      let queryFieldName1 = querySortField || columnDef.queryFieldSorter || columnDef.queryField || columnDef.field;

      if (this._gridOptions.preParseDateColumns && isColumnDateType(fieldType) && sortColumn?.columnId) {
        queryFieldName1 = typeof this._gridOptions.preParseDateColumns === 'string' ? `${this._gridOptions.preParseDateColumns}${sortColumn.columnId}` : `${sortColumn.columnId}`;
      }
      let queryFieldName2 = queryFieldName1;

      // if user provided a query field name getter callback, we need to get the name on each item independently
      if (typeof columnDef.queryFieldNameGetterFn === 'function') {
        queryFieldName1 = columnDef.queryFieldNameGetterFn(dataRow1);
        queryFieldName2 = columnDef.queryFieldNameGetterFn(dataRow2);
      }

      let value1 = dataRow1[queryFieldName1];
      let value2 = dataRow2[queryFieldName2];

      // when item is a complex object (dot "." notation), we need to filter the value contained in the object tree
      if (queryFieldName1?.indexOf('.') >= 0) {
        value1 = getDescendantProperty(dataRow1, queryFieldName1);
      }
      if (queryFieldName2?.indexOf('.') >= 0) {
        value2 = getDescendantProperty(dataRow2, queryFieldName2);
      }

      // user could provide his own custom Sorter
      if (columnDef.sortComparer) {
        const customSortResult = columnDef.sortComparer(value1, value2, sortDirection, columnDef, this._gridOptions);
        if (customSortResult !== SortDirectionNumber.neutral) {
          return customSortResult;
        }
      } else {
        const sortResult = sortByFieldType(fieldType, value1, value2, sortDirection, columnDef, this._gridOptions);
        if (sortResult !== SortDirectionNumber.neutral) {
          return sortResult;
        }
      }
    }
    return undefined;
  }

  sortTreeData(treeArray: any[], sortColumns: Array<ColumnSort>): void {
    if (Array.isArray(sortColumns)) {
      sortColumns.forEach(sortColumn => {
        this.sortTreeChildren(treeArray, sortColumn, 0);
      });
    }
  }

  /** Sort the Tree Children of a hierarchical dataset by recursion */
  sortTreeChildren(treeArray: any[], sortColumn: ColumnSort, treeLevel: number): void {
    const childrenPropName = this._gridOptions.treeDataOptions?.childrenPropName ?? 'children';
    treeArray.sort((a: any, b: any) => this.sortComparer(sortColumn, a, b) ?? SortDirectionNumber.neutral);

    // when item has a child, we'll sort recursively
    treeArray.forEach(item => {
      if (item) {
        const hasChildren = item.hasOwnProperty(childrenPropName) && Array.isArray(item[childrenPropName]);
        // when item has a child, we'll sort recursively
        if (hasChildren) {
          treeLevel++;
          this.sortTreeChildren(item[childrenPropName], sortColumn, treeLevel);
          treeLevel--;
        }
      }
    });
  }

  /**
   * Update Sorting (sorters) dynamically just by providing an array of sorter(s).
   * You can also choose emit (default) a Sort Changed event that will be picked by the Grid State Service.
   *
   * Also for backend service only, you can choose to trigger a backend query (default) or not if you wish to do it later,
   * this could be useful when using updateFilters & updateSorting and you wish to only send the backend query once.
   * @param sorters array
   * @param triggerEvent defaults to True, do we want to emit a sort changed event?
   * @param triggerBackendQuery defaults to True, which will query the backend.
   */
  updateSorting(sorters: CurrentSorter[], emitChangedEvent = true, triggerBackendQuery = true): void {
    if (!this._gridOptions || !this._gridOptions.enableSorting) {
      throw new Error('[Slickgrid-Universal] in order to use "updateSorting" method, you need to have Sortable Columns defined in your grid and "enableSorting" set in your Grid Options');
    }

    if (Array.isArray(sorters)) {
      const backendApi = this._gridOptions.backendServiceApi;

      if (backendApi) {
        const backendApiService = backendApi?.service;
        if (backendApiService?.updateSorters) {
          backendApiService.updateSorters(undefined, sorters);
          if (triggerBackendQuery) {
            this.backendUtilities?.refreshBackendDataset(this._gridOptions);
          }
        }
      } else {
        this.loadGridSorters(sorters);
      }

      if (emitChangedEvent) {
        const emitterType = backendApi ? EmitterType.remote : EmitterType.local;
        this.emitSortChanged(emitterType);
      }
    }
  }

  // --
  // protected functions
  // -------------------

  /**
   * Loop through all column definitions and do the following 2 things
   * 1. disable/enable the "sortable" property of each column
   * 2. loop through each Header Menu commands and change the "hidden" commands to show/hide depending if it's enabled/disabled
   * Also note that we aren't deleting any properties, we just toggle their flags so that we can reloop through at later point in time.
   * (if we previously deleted these properties we wouldn't be able to change them back since these properties wouldn't exist anymore, hence why we just hide the commands)
   * @param {boolean} isDisabling - are we disabling the sort functionality? Defaults to true
   */
  protected disableAllSortingCommands(isDisabling = true): Column[] {
    const columnDefinitions = this._grid.getColumns();

    // loop through column definition to hide/show header menu commands
    columnDefinitions.forEach((col) => {
      if (col.sortable !== undefined) {
        col.sortable = !isDisabling;
      }
      if (col?.header?.menu) {
        (col.header.menu.commandItems)?.forEach(menuItem => {
          if (menuItem && typeof menuItem !== 'string') {
            const menuCommand = menuItem.command;
            if (menuCommand === 'sort-asc' || menuCommand === 'sort-desc' || menuCommand === 'clear-sort') {
              menuItem.hidden = isDisabling;
            }
          }
        });
      }
    });

    // loop through column definition to hide/show grid menu commands
    const commandItems = this._gridOptions.gridMenu?.commandItems;
    if (commandItems) {
      commandItems.forEach((menuItem) => {
        if (menuItem && typeof menuItem !== 'string' && menuItem.command === 'clear-sorting') {
          menuItem.hidden = isDisabling;
        }
      });
    }

    return columnDefinitions;
  }
}
