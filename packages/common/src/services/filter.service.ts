import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { deepCopy, extend, queueMicrotaskOrSetTimeout, stripTags } from '@slickgrid-universal/utils';
import { dequal } from 'dequal/lite';
import { Constants } from '../constants.js';
import { SlickEvent, SlickEventData, SlickEventHandler, type SlickDataView, type SlickGrid } from '../core/index.js';
import { FieldType, OperatorType, type EmitterType, type OperatorString, type SearchTerm } from '../enums/index.js';
import { FilterConditions, getParsedSearchTermsByFieldType } from './../filter-conditions/index.js';
import { type FilterFactory } from './../filters/filterFactory.js';
import type {
  Column,
  ColumnFilters,
  CurrentFilter,
  DOMMouseOrTouchEvent,
  Filter,
  FilterArguments,
  FilterCallbackArg,
  FilterChangedArgs,
  FilterConditionOption,
  GridOption,
  SearchColumnFilter,
} from './../interfaces/index.js';
import type { BackendUtilityService } from './backendUtility.service.js';
import type { RxJsFacade, Subject } from './rxjsFacade.js';
import type { SharedService } from './shared.service.js';
import { findItemInTreeStructure, getDescendantProperty, mapOperatorByFieldType } from './utilities.js';

interface OnSearchChangeEventArgs {
  clearFilterTriggered?: boolean;
  shouldTriggerQuery?: boolean;
  columnId: string | number;
  columnDef: Column;
  columnFilters: ColumnFilters;
  operator: OperatorType | OperatorString | undefined;
  parsedSearchTerms?: SearchTerm | SearchTerm[] | undefined;
  searchTerms: SearchTerm[] | undefined;
  grid: SlickGrid;
  target?: HTMLElement;
}

export class FilterService {
  protected _eventHandler: SlickEventHandler;
  protected _isFilterFirstRender = true;
  protected _firstColumnIdRendered: string | number = '';
  protected _filtersMetadata: Array<Filter> = [];
  protected _columnFilters: ColumnFilters = {};
  protected _grid!: SlickGrid;
  protected _isTreePresetExecuted = false;
  protected _previousFilters: CurrentFilter[] = [];
  protected _onSearchChange: SlickEvent<OnSearchChangeEventArgs> | null;
  protected _tmpPreFilteredData?: Set<number | string>;
  protected httpCancelRequests$?: Subject<void>; // this will be used to cancel any pending http request

  constructor(
    protected filterFactory: FilterFactory,
    protected pubSubService: BasePubSubService,
    protected sharedService: SharedService,
    protected backendUtilities?: BackendUtilityService | undefined,
    protected rxjs?: RxJsFacade | undefined
  ) {
    this._onSearchChange = new SlickEvent<OnSearchChangeEventArgs>();
    this._eventHandler = new SlickEventHandler();
    if (this.rxjs) {
      this.httpCancelRequests$ = this.rxjs.createSubject<void>();
    }
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter to know if the filter was already rendered or if it was its first time render */
  get isFilterFirstRender(): boolean {
    return this._isFilterFirstRender;
  }

  /** Getter of the SlickGrid Event Handler */
  get onSearchChange(): SlickEvent | null {
    return this._onSearchChange;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  /** Getter for the Column Definitions pulled through the Grid Object */
  protected get _columnDefinitions(): Column[] {
    return this._grid?.getColumns() ?? [];
  }

  /** Getter of SlickGrid DataView object */
  protected get _dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>() ?? {};
  }

  addRxJsResource(rxjs: RxJsFacade): void {
    this.rxjs = rxjs;
  }

  /**
   * Initialize the Service
   * @param grid
   */
  init(grid: SlickGrid): void {
    this._grid = grid;

    if (this._gridOptions && this._gridOptions.enableTreeData && this._gridOptions.treeDataOptions) {
      this._grid.setSortColumns([{ columnId: this._gridOptions.treeDataOptions.columnId, sortAsc: true }]);
    }
  }

  dispose(): void {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();

    if (this.httpCancelRequests$ && this.rxjs?.isObservable(this.httpCancelRequests$)) {
      this.httpCancelRequests$.next(); // this cancels any pending http requests
      this.httpCancelRequests$.complete();
    }
    this.disposeColumnFilters();
    this._onSearchChange = null;
  }

  /**
   * Dispose of the filters, since it's a singleton, we don't want to affect other grids with same columns
   */
  disposeColumnFilters(): void {
    this.removeAllColumnFiltersProperties();

    // also destroy each Filter instances
    if (Array.isArray(this._filtersMetadata)) {
      let filter = this._filtersMetadata.pop();
      while (filter) {
        if (typeof filter?.destroy === 'function') {
          filter.destroy();
        }
        filter = this._filtersMetadata.pop();
      }
    }
  }

  /**
   * Bind a backend filter hook to the grid
   * @param grid SlickGrid Grid object
   */
  bindBackendOnFilter(grid: SlickGrid): void {
    this._filtersMetadata = [];

    // subscribe to SlickGrid onHeaderRowCellRendered event to create filter template
    this._eventHandler.subscribe(grid.onHeaderRowCellRendered, (_e, args) => {
      // firstColumnIdRendered is null at first, so if it changes to being filled and equal, then we would know that it was already rendered
      // this is to avoid rendering the filter twice (only the Select Filter for now), rendering it again also clears the filter which has unwanted side effect
      if (args.column.id === this._firstColumnIdRendered) {
        this._isFilterFirstRender = false;
      }
      this.addFilterTemplateToHeaderRow(args, this._isFilterFirstRender);
      if (this._firstColumnIdRendered === '') {
        this._firstColumnIdRendered = args.column.id;
      }
    });

    // destroy Filter(s) to avoid leak and not keep orphan filters in the DOM tree
    this.subscribeToOnHeaderRowCellRendered(grid);

    // subscribe to the SlickGrid event and call the backend execution
    if (this._onSearchChange) {
      this._eventHandler.subscribe(this._onSearchChange, this.onBackendFilterChange.bind(this));
    }
  }

  /**
   * Bind a local filter hook to the grid
   * @param grid SlickGrid Grid object
   * @param gridOptions Grid Options object
   * @param dataView
   */
  bindLocalOnFilter(grid: SlickGrid): void {
    this._filtersMetadata = [];
    this._dataView.setFilterArgs({ columnFilters: this._columnFilters, grid: this._grid, dataView: this._dataView });
    this._dataView.setFilter(this.customLocalFilter.bind(this));

    // bind any search filter change (e.g. input filter input change event)
    if (this._onSearchChange) {
      this._eventHandler.subscribe(this._onSearchChange, async (_e, args) => {
        const isClearFilterEvent = args?.clearFilterTriggered ?? false;

        // emit an onBeforeFilterChange event except when it's called by a clear filter
        if (!isClearFilterEvent) {
          await this.emitFilterChanged('local', true);
        }

        // When using Tree Data, we need to do it in 2 steps
        // step 1. we need to prefilter (search) the data prior, the result will be an array of IDs which are the node(s) and their parent nodes when necessary.
        // step 2. calling the DataView.refresh() is what triggers the final filtering, with "customLocalFilter()" which will decide which rows should persist
        if (this._gridOptions.enableTreeData === true) {
          this._tmpPreFilteredData = this.preFilterTreeData(this._dataView.getItems(), this._columnFilters);
        }

        // emit an onFilterChanged event except when it's called by a clear filter
        if (!isClearFilterEvent) {
          await this.emitFilterChanged('local');
        }

        if (args.columnId !== null) {
          this._dataView.refresh();
        }

        // keep a copy of the filters in case we need to rollback
        this._previousFilters = this.extractBasicFilterDetails(this._columnFilters);
      });
    }

    // subscribe to SlickGrid onHeaderRowCellRendered event to create filter template
    this._eventHandler.subscribe(grid.onHeaderRowCellRendered, (_e, args) => {
      this.addFilterTemplateToHeaderRow(args);
    });

    // destroy Filter(s) to avoid leak and not keep orphan filters
    this.subscribeToOnHeaderRowCellRendered(grid);
  }

  async clearFilterByColumnId(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, columnId: number | string): Promise<boolean> {
    await this.pubSubService.publish('onBeforeFilterClear', { columnId }, 0);

    const isBackendApi = this._gridOptions.backendServiceApi ?? false;
    const emitter = isBackendApi ? 'remote' : 'local';

    // get current column filter before clearing, this allow us to know if the filter was empty prior to calling the clear filter
    const currentFilterColumnIds = Object.keys(this._columnFilters);
    let currentColFilter: string | undefined;
    if (Array.isArray(currentFilterColumnIds)) {
      currentColFilter = currentFilterColumnIds.find((name) => name === `${columnId}`);
    }

    // find the filter object and call its clear method with true (the argument tells the method it was called by a clear filter)
    const colFilter: Filter | undefined = this._filtersMetadata.find((filter: Filter) => filter.columnDef.id === columnId);
    if (colFilter?.clear) {
      colFilter.clear(true);
    }

    // when using a backend service, we need to manually trigger a filter change but only if the filter was previously filled
    if (isBackendApi && currentColFilter !== undefined) {
      this.onBackendFilterChange(event, {
        grid: this._grid,
        columnFilters: this._columnFilters,
      } as unknown as OnSearchChangeEventArgs);
    }

    // emit an event when filter is cleared
    await this.emitFilterChanged(emitter);
    return true;
  }

  /** Clear the search filters (below the column titles) */
  async clearFilters(triggerChange = true): Promise<void> {
    // emit an event before the process start
    if (triggerChange) {
      await this.pubSubService.publish('onBeforeFilterClear', true, 0);
    }

    this._filtersMetadata.forEach((filter: Filter) => {
      if (filter?.clear) {
        // clear element but don't trigger individual clear change,
        // we'll do 1 trigger for all filters at once afterward
        filter.clear(false);
      }
    });

    // also delete the columnFilters object and remove any filters from the object
    this.removeAllColumnFiltersProperties();

    // also remove any search terms directly on each column definitions
    if (Array.isArray(this._columnDefinitions)) {
      this._columnDefinitions.forEach((columnDef: Column) => {
        if (columnDef.filter?.searchTerms) {
          delete columnDef.filter.searchTerms;
        }
      });
    }

    // we also need to refresh the dataView and optionally the grid (it's optional since we use DataView)
    if (this._dataView && this._grid) {
      this._dataView.refresh();
      this._grid.invalidate();
    }

    // when using backend service, we need to query only once so it's better to do it here
    const backendApi = this._gridOptions.backendServiceApi;
    if (backendApi && triggerChange) {
      const callbackArgs = {
        clearFilterTriggered: true,
        shouldTriggerQuery: triggerChange,
        grid: this._grid,
        columnFilters: this._columnFilters,
      };
      const queryResponse = backendApi.service.processOnFilterChanged(undefined, callbackArgs as FilterChangedArgs);
      const query = queryResponse as string;
      const totalItems = this._gridOptions.pagination?.totalItems ?? 0;
      this.backendUtilities?.executeBackendCallback(backendApi, query, callbackArgs, new Date(), totalItems, {
        errorCallback: this.resetToPreviousSearchFilters.bind(this),
        successCallback: (responseArgs) => (this._previousFilters = this.extractBasicFilterDetails(responseArgs.columnFilters)),
        emitActionChangedCallback: this.emitFilterChanged.bind(this),
      });
    } else {
      // keep a copy of the filters in case we need to rollback
      this._previousFilters = this.extractBasicFilterDetails(this._columnFilters);
    }

    // emit an event when filters are all cleared
    if (triggerChange) {
      this.pubSubService.publish('onFilterCleared', true);
    }
  }

  /** Local Grid Filter search */
  customLocalFilter(item: any, args: { columnFilters: ColumnFilters; dataView: SlickDataView; grid: SlickGrid }): boolean {
    const grid = args?.grid;
    const columnFilters = args?.columnFilters ?? {};
    const isGridWithTreeData = this._gridOptions.enableTreeData ?? false;
    const treeDataOptions = this._gridOptions.treeDataOptions;

    // when the column is a Tree Data structure and the parent is collapsed, there's no need to go further and we can just skip this row and continue with the next row
    // so we always run this check even when there are no filter search, the reason is because the user might click on the expand/collapse
    if (isGridWithTreeData && treeDataOptions) {
      const collapsedPropName = treeDataOptions.collapsedPropName ?? Constants.treeDataProperties.COLLAPSED_PROP;
      const parentPropName = treeDataOptions.parentPropName ?? Constants.treeDataProperties.PARENT_PROP;
      const childrenPropName = treeDataOptions?.childrenPropName ?? Constants.treeDataProperties.CHILDREN_PROP;
      const primaryDataId = this._gridOptions.datasetIdPropertyName ?? 'id';
      const autoRecalcTotalsOnFilterChange = treeDataOptions.autoRecalcTotalsOnFilterChange ?? false;

      // typically when a parent is collapsed we can exit early (by returning false) but we can't do that when we use auto-recalc totals
      // if that happens, we need to keep a ref and recalculate total for all tree leafs then only after we can exit
      let isParentCollapsed = false; // will be used only when auto-recalc is enabled
      if (item[parentPropName] !== null) {
        let parent = this._dataView.getItemById(item[parentPropName]);
        while (parent) {
          if (parent[collapsedPropName]) {
            if (autoRecalcTotalsOnFilterChange) {
              isParentCollapsed = true; // when auto-recalc tree totals is enabled, we need to keep ref without exiting the loop just yet
            } else {
              // not using auto-recalc, we can exit early and not display any row that have their parent collapsed
              return false;
            }
          }
          parent = this._dataView.getItemById(parent[parentPropName]);
        }
      }

      // filter out any row items that aren't part of our pre-processed "preFilterTreeData()" result
      if (this._tmpPreFilteredData instanceof Set) {
        const filtered = this._tmpPreFilteredData.has(item[primaryDataId]); // return true when found, false otherwise

        // when user enables Tree Data auto-recalc, we need to keep ref (only in hierarchical tree) of which datacontext was filtered or not
        if (autoRecalcTotalsOnFilterChange) {
          const treeItem = findItemInTreeStructure(
            this.sharedService.hierarchicalDataset!,
            (x) => x[primaryDataId] === item[primaryDataId],
            childrenPropName
          );
          if (treeItem) {
            treeItem.__filteredOut = !filtered;
          }
          if (isParentCollapsed) {
            return false; // now that we are done analyzing "__filteredOut", we can now return false to hide (not show) collapsed children
          }
        }
        return filtered;
      }
    } else if (typeof columnFilters === 'object') {
      for (const columnId of Object.keys(columnFilters)) {
        const searchColFilter = columnFilters[columnId] as SearchColumnFilter;
        const columnDef = searchColFilter.columnDef;
        const columnFilterDef = columnDef?.filter;

        // user could provide a custom filter predicate on the column definition
        if (typeof columnFilterDef?.filterPredicate === 'function') {
          // only return on false, when row is filtered out and no further filter to be considered
          if (!columnFilterDef.filterPredicate(item, searchColFilter)) {
            return false;
          }
        } else {
          // otherwise execute built-in filter condition checks
          const conditionOptions = this.preProcessFilterConditionOnDataContext(item, searchColFilter, grid);
          if (typeof conditionOptions === 'boolean') {
            return conditionOptions; // reaching this line means that the value is not being filtered out, return it right away
          }

          let parsedSearchTerms = searchColFilter?.parsedSearchTerms; // parsed term could be a single value or an array of values

          // in the rare case of an empty search term (it can happen when creating an external grid global search)
          // then we'll use the parsed terms and whenever they are filled in, we typically won't need to ask for these values anymore.
          if (parsedSearchTerms === undefined) {
            // parsed term could be a single value or an array of values
            parsedSearchTerms = getParsedSearchTermsByFieldType(searchColFilter.searchTerms, columnDef.type || FieldType.string);
            if (parsedSearchTerms !== undefined) {
              searchColFilter.parsedSearchTerms = parsedSearchTerms;
            }
          }

          // execute the filtering conditions check, comparing all cell values vs search term(s)
          if (!FilterConditions.executeFilterConditionTest(conditionOptions as FilterConditionOption, parsedSearchTerms)) {
            return false;
          }
        }
      }
    }

    // reaching this line means that the row is valid and passes all filter conditions
    return true;
  }

  /**
   * Loop through each form input search filter and parse their searchTerms, for example a CompoundDate Filter will be parsed as a Date object.
   * Also if we are dealing with a text filter input, an operator can optionally be part of the filter itself and we need to extract it from there,
   * for example a filter of "John*" will be analyzed as { operator: StartsWith, searchTerms: ['John'] }
   * @param inputSearchTerms - filter search terms
   * @param columnFilter - column filter object (the object properties represent each column id and the value is the filter metadata)
   * @returns FilterConditionOption
   */
  parseFormInputFilterConditions(
    inputSearchTerms: SearchTerm[] | undefined,
    columnFilter: Omit<SearchColumnFilter, 'searchTerms'>
  ): Omit<FilterConditionOption, 'cellValue'> {
    const searchValues: SearchTerm[] = deepCopy(inputSearchTerms) || [];
    let fieldSearchValue = Array.isArray(searchValues) && searchValues.length === 1 ? searchValues[0] : '';
    const columnDef = columnFilter.columnDef;
    const fieldType = columnDef.filter?.type ?? columnDef.type ?? FieldType.string;

    let matches = null;
    if (fieldType !== FieldType.object) {
      fieldSearchValue = fieldSearchValue === undefined || fieldSearchValue === null ? '' : `${fieldSearchValue}`; // make sure it's a string

      // run regex to find possible filter operators unless the user disabled the feature
      const autoParseInputFilterOperator = columnDef.autoParseInputFilterOperator ?? this._gridOptions.autoParseInputFilterOperator;

      // group (2): comboStartsWith, (3): comboEndsWith, (4): Operator, (1 or 5): searchValue, (6): last char is '*' (meaning starts with, ex.: abc*)
      matches =
        autoParseInputFilterOperator !== false
          ? fieldSearchValue.match(/^((.*[^\\*\r\n])[*]{1}(.*[^*\r\n]))|^([<>!=*]{0,2})(.*[^<>!=*])?([*])*$/) || []
          : [fieldSearchValue, '', '', '', '', fieldSearchValue, ''];
    }

    const comboStartsWith = matches?.[2] || '';
    const comboEndsWith = matches?.[3] || '';
    let operator = matches?.[4] || columnFilter.operator;
    let searchTerm = matches?.[1] || matches?.[5] || '';
    const inputLastChar = matches?.[6] || (operator === '*z' ? '*' : '');

    if (typeof fieldSearchValue === 'string') {
      fieldSearchValue = fieldSearchValue.replace(`'`, `''`); // escape any single quotes by doubling them
      if (comboStartsWith && comboEndsWith) {
        searchTerm = fieldSearchValue;
        operator = OperatorType.startsWithEndsWith;
      } else if (operator === '*' || operator === '*z') {
        operator = OperatorType.endsWith;
      } else if (operator === 'a*' || inputLastChar === '*') {
        operator = OperatorType.startsWith;
      }
    }

    // if search value has a regex match we will only keep the value without the operator
    // in this case we need to overwrite the returned search values to truncate operator from the string search
    if (Array.isArray(matches) && matches.length >= 1 && Array.isArray(searchValues) && searchValues.length === 1) {
      // string starts with a whitespace we'll trim only the first whitespace char
      // e.g. " " becomes "" and " slick grid " becomes "slick grid " (notice last whitespace is kept)
      searchValues[0] = searchTerm.length > 0 && searchTerm.substring(0, 1) === ' ' ? searchTerm.substring(1) : searchTerm;
    }

    return {
      dataKey: columnDef.dataKey,
      fieldType,
      searchTerms: searchValues || [],
      operator: operator as OperatorString,
      searchInputLastChar: inputLastChar,
      filterSearchType: columnDef.filterSearchType,
      defaultFilterRangeOperator: this._gridOptions.defaultFilterRangeOperator,
    } as FilterConditionOption;
  }

  /**
   * PreProcess the filter(s) condition(s) on each item data context, the result might be a boolean or a FilterConditionOption object.
   * It will be a boolean when the searchTerms are invalid or the column is not found (if so it will return True and the item won't be filtered out from the grid)
   * or else return a FilterConditionOption object with the necessary info for the test condition needs to be processed in a further stage.
   * @param item - item data context
   * @param columnFilter - column filter object (the object properties represent each column id and the value is the filter metadata)
   * @param grid - SlickGrid object
   * @returns FilterConditionOption or boolean
   */
  preProcessFilterConditionOnDataContext(item: any, columnFilter: SearchColumnFilter, grid: SlickGrid): FilterConditionOption | true {
    const columnDef = columnFilter.columnDef;
    const columnId = columnFilter.columnId;
    let columnIndex = grid.getColumnIndex(columnId) as number;

    // it might be a hidden column, if so it won't be part of the getColumns (because it could be hidden via setColumns())
    // when that happens we can try to get the column definition from all defined columns
    if (!columnDef && this.sharedService && Array.isArray(this.sharedService.allColumns)) {
      columnIndex = this.sharedService.allColumns.findIndex((col) => col.field === columnId);
    }

    // if we still don't have a column definition then we should return then row anyway (true)
    if (!columnDef) {
      return true;
    }

    // Row Detail View plugin, if the row is padding we just get the value we're filtering on from it's parent
    if (this._gridOptions.enableRowDetailView) {
      const metadataPrefix = this._gridOptions.rowDetailView?.keyPrefix || '__';
      if (item[`${metadataPrefix}isPadding`] && item[`${metadataPrefix}parent`]) {
        item = item[`${metadataPrefix}parent`];
      }
    }

    let queryFieldName = columnDef.filter?.queryField || columnDef.queryFieldFilter || columnDef.queryField || columnDef.field || '';
    if (typeof columnDef.queryFieldNameGetterFn === 'function') {
      queryFieldName = columnDef.queryFieldNameGetterFn(item);
    }
    const fieldType = columnDef.filter?.type ?? columnDef.type ?? FieldType.string;
    let cellValue = item[queryFieldName];

    // when item is a complex object (dot "." notation), we need to filter the value contained in the object tree
    if (queryFieldName?.indexOf('.') >= 0) {
      cellValue = getDescendantProperty(item, queryFieldName);
    }

    const operator = columnFilter.operator;
    const searchValues = columnFilter.searchTerms || [];

    // no need to query if search value is empty or if the search value is in fact equal to the operator
    if (
      !searchValues ||
      (Array.isArray(searchValues) && (searchValues.length === 0 || (searchValues.length === 1 && operator === searchValues[0])))
    ) {
      return true;
    }

    // filter search terms should always be string type (even though we permit the end user to input numbers)
    // so make sure each term are strings, if user has some default search terms, we will cast them to string
    if (searchValues && Array.isArray(searchValues) && fieldType !== FieldType.object) {
      for (let k = 0, ln = searchValues.length; k < ln; k++) {
        // make sure all search terms are strings
        searchValues[k] = (searchValues[k] === undefined || searchValues[k] === null ? '' : searchValues[k]) + '';
      }
    }

    // when using localization (i18n), the user might want to use the formatted output to do its filtering
    if (columnDef?.params?.useFormatterOuputToFilter === true) {
      const idPropName = this._gridOptions.datasetIdPropertyName || 'id';
      const rowIndex = this._dataView && typeof this._dataView.getIdxById === 'function' ? this._dataView.getIdxById(item[idPropName]) : 0;
      // prettier-ignore
      const formattedCellValue = (columnDef && typeof columnDef.formatter === 'function') ? columnDef.formatter(rowIndex || 0, columnIndex, cellValue, columnDef, item, this._grid) : '';
      cellValue = stripTags(formattedCellValue as string);
    }

    // make sure cell value is always a string
    if (typeof cellValue === 'number') {
      cellValue = cellValue.toString();
    }

    return {
      dataKey: columnDef.dataKey,
      fieldType,
      searchTerms: searchValues,
      cellValue,
      operator: operator as OperatorString,
      searchInputLastChar: columnFilter.searchInputLastChar,
      filterSearchType: columnDef.filterSearchType,
      ignoreAccentOnStringFilterAndSort: this._gridOptions.ignoreAccentOnStringFilterAndSort ?? false,
      defaultFilterRangeOperator: this._gridOptions.defaultFilterRangeOperator,
    } as FilterConditionOption;
  }

  /**
   * When using Tree Data, we need to prefilter (search) the data prior, the result will be an array of IDs which are the node(s) and their parent nodes when necessary.
   * This will then be passed to the DataView setFilter(customLocalFilter), which will itself loop through the list of IDs and display/hide the row when found.
   * We do this in 2 steps so that we can still use the DataSet setFilter()
   */
  preFilterTreeData(inputItems: any[], columnFilters: ColumnFilters): Set<string | number> {
    const treeDataOptions = this._gridOptions.treeDataOptions;
    const collapsedPropName = treeDataOptions?.collapsedPropName ?? Constants.treeDataProperties.COLLAPSED_PROP;
    const parentPropName = treeDataOptions?.parentPropName ?? Constants.treeDataProperties.PARENT_PROP;
    const hasChildrenPropName = treeDataOptions?.hasChildrenPropName ?? Constants.treeDataProperties.HAS_CHILDREN_PROP;
    const primaryDataId = this._gridOptions.datasetIdPropertyName ?? 'id';
    const treeDataToggledItems = this._gridOptions.presets?.treeData?.toggledItems;
    const isInitiallyCollapsed = this._gridOptions.treeDataOptions?.initiallyCollapsed ?? false;
    const treeDataColumnId = this._gridOptions.treeDataOptions?.columnId;
    const excludeChildrenWhenFilteringTree = this._gridOptions.treeDataOptions?.excludeChildrenWhenFilteringTree;
    const isNotExcludingChildAndValidateOnlyTreeColumn =
      !excludeChildrenWhenFilteringTree && this._gridOptions.treeDataOptions?.autoApproveParentItemWhenTreeColumnIsValid === true;

    const treeObj = {};
    const filteredChildrenAndParents = new Set<number | string>(); // use Set instead of simple array to avoid duplicates

    // a Map of unique itemId/value pair where the value is a boolean which tells us if the parent matches the filter criteria or not
    // we will use this when the Tree Data option `excludeChildrenWhenFilteringTree` is enabled
    const filteredParents = new Map<number | string, boolean>();

    if (Array.isArray(inputItems)) {
      inputItems.forEach((inputItem) => {
        (treeObj as any)[inputItem[primaryDataId]] = inputItem;
        // as the filtered data is then used again as each subsequent letter
        // we need to delete the .__used property, otherwise the logic below
        // in the while loop (which checks for parents) doesn't work
        delete (treeObj as any)[inputItem[primaryDataId]].__used;
      });

      // Step 1. prepare search filter by getting their parsed value(s), for example if it's a date filter then parse it to a Date object
      // loop through all column filters once and get parsed filter search value then save a reference in the columnFilter itself
      // it is much more effective to do it outside and prior to Step 2 so that we don't re-parse search filter for no reason while checking every row
      if (typeof columnFilters === 'object') {
        Object.keys(columnFilters).forEach((columnId) => {
          const columnFilter = columnFilters[columnId] as SearchColumnFilter;
          const searchValues: SearchTerm[] = columnFilter?.searchTerms ? deepCopy(columnFilter.searchTerms) : [];
          const inputSearchConditions = this.parseFormInputFilterConditions(searchValues, columnFilter);

          const columnDef = columnFilter.columnDef;
          const fieldType = columnDef?.filter?.type ?? columnDef?.type ?? FieldType.string;
          const parsedSearchTerms = getParsedSearchTermsByFieldType(inputSearchConditions.searchTerms, fieldType); // parsed term could be a single value or an array of values
          if (parsedSearchTerms !== undefined) {
            columnFilter.parsedSearchTerms = parsedSearchTerms;
          }
        });
      }

      // Step 2. loop through every item data context to execute filter condition check
      inputItems.forEach((item) => {
        const hasChildren = item[hasChildrenPropName];
        let matchFilter = true; // valid until proven otherwise

        // loop through all column filters and execute filter condition(s)
        for (const columnId of Object.keys(columnFilters)) {
          const columnFilter = columnFilters[columnId] as SearchColumnFilter;
          const conditionOptionResult = this.preProcessFilterConditionOnDataContext(item, columnFilter, this._grid);

          if (conditionOptionResult) {
            const parsedSearchTerms = columnFilter?.parsedSearchTerms; // parsed term could be a single value or an array of values
            // prettier-ignore
            const conditionResult = (typeof conditionOptionResult === 'boolean') ? conditionOptionResult : FilterConditions.executeFilterConditionTest(conditionOptionResult as FilterConditionOption, parsedSearchTerms);

            // when using `excludeChildrenWhenFilteringTree: false`, we can auto-approve current item if it's the column holding the Tree structure and is a Parent that passes the first filter criteria
            // in other words, if we're on the column with the Tree and its filter is valid (and is a parent), then skip any other filter(s)
            if (
              conditionResult &&
              isNotExcludingChildAndValidateOnlyTreeColumn &&
              hasChildren &&
              columnFilter.columnId === treeDataColumnId
            ) {
              filteredParents.set(item[primaryDataId], true);
              break;
            }

            // if item is valid OR we aren't excluding children and its parent is valid then we'll consider this valid
            // however we don't return true, we need to continue and loop through next filter(s) since we still need to check other keys in columnFilters
            if (conditionResult || (!excludeChildrenWhenFilteringTree && filteredParents.get(item[parentPropName]) === true)) {
              if (hasChildren && columnFilter.columnId === treeDataColumnId) {
                filteredParents.set(item[primaryDataId], true); // when it's a Parent item, we'll keep a Map ref as being a Parent with valid criteria
              }
              // if our filter is valid OR we're on the Tree column then let's continue
              if (conditionResult || (!excludeChildrenWhenFilteringTree && columnFilter.columnId === treeDataColumnId)) {
                continue;
              }
            } else {
              // when it's a Parent item AND its Parent isn't valid AND we aren't on the Tree column
              // we'll keep reference of the parent via a Map key/value pair and make its value as False because this Parent item is considered invalid
              if (hasChildren && filteredParents.get(item[parentPropName]) !== true && columnFilter.columnId !== treeDataColumnId) {
                filteredParents.set(item[primaryDataId], false);
              }
            }
          }

          // if we reach this line then our filter is invalid
          matchFilter = false;
          continue;
        }

        // build an array from the matched filters, anything valid from filter condition
        // will be pushed to the filteredChildrenAndParents array
        if (matchFilter) {
          // add child (id):
          filteredChildrenAndParents.add(item[primaryDataId]);
          let parent = (treeObj as any)[item[parentPropName]] ?? false;

          // if there are any presets of collapsed parents, let's processed them
          const presetToggleShouldBeCollapsed = !isInitiallyCollapsed;
          if (
            !this._isTreePresetExecuted &&
            Array.isArray(treeDataToggledItems) &&
            treeDataToggledItems.some(
              (collapsedItem) => collapsedItem.itemId === parent.id && collapsedItem.isCollapsed === presetToggleShouldBeCollapsed
            )
          ) {
            parent[collapsedPropName] = presetToggleShouldBeCollapsed;
          }

          while (parent) {
            // only add parent (id) if not already added:
            parent.__used ?? filteredChildrenAndParents.add(parent[primaryDataId]);
            // mark each parent as used to not use them again later:
            (treeObj as any)[parent[primaryDataId]].__used = true;
            // try to find parent of the current parent, if exists:
            parent = (treeObj as any)[parent[parentPropName]] ?? false;
          }
        }
      });
    }
    this._isTreePresetExecuted = true;

    return filteredChildrenAndParents;
  }

  getColumnFilters(): ColumnFilters {
    return this._columnFilters;
  }

  getPreviousFilters(): CurrentFilter[] {
    return this._previousFilters;
  }

  getFiltersMetadata(): Filter[] {
    return this._filtersMetadata;
  }

  getCurrentLocalFilters(): CurrentFilter[] {
    const currentFilters: CurrentFilter[] = [];
    if (this._columnFilters) {
      for (const colId of Object.keys(this._columnFilters)) {
        const columnFilter = this._columnFilters[colId];
        const filter = { columnId: colId || '' } as CurrentFilter;

        if (columnFilter?.searchTerms) {
          filter.searchTerms = columnFilter.searchTerms;
        }
        if (columnFilter.operator) {
          filter.operator = columnFilter.operator;
        }
        if (columnFilter.targetSelector) {
          filter.targetSelector = columnFilter.targetSelector;
        }
        if (Array.isArray(filter.searchTerms) && filter.searchTerms.length > 0) {
          currentFilters.push(filter);
        }
      }
    }
    return currentFilters;
  }

  /**
   * A simple function that will be called to emit a change when a filter changes.
   * Other services, like Pagination, can then subscribe to it.
   * @param caller
   */
  emitFilterChanged(caller: EmitterType, isBeforeExecution = false): void | boolean | Promise<boolean> {
    const eventName = isBeforeExecution ? 'onBeforeFilterChange' : 'onFilterChanged';

    if (caller === 'remote' && this._gridOptions.backendServiceApi) {
      let currentFilters: CurrentFilter[] = [];
      const backendService = this._gridOptions.backendServiceApi.service;
      if (backendService?.getCurrentFilters) {
        currentFilters = backendService.getCurrentFilters() as CurrentFilter[];
      }
      return this.pubSubService.publish(eventName, currentFilters);
    } else if (caller === 'local') {
      return this.pubSubService.publish(eventName, this.getCurrentLocalFilters());
    }
  }

  async onBackendFilterChange(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, args: OnSearchChangeEventArgs): Promise<void> {
    const isTriggeringQueryEvent = args?.shouldTriggerQuery;

    if (isTriggeringQueryEvent) {
      await this.emitFilterChanged('remote', true);
    }

    if (!args?.grid) {
      throw new Error(
        'Something went wrong when trying to bind the "onBackendFilterChange(event, args)" function, it seems that "args" is not populated correctly'
      );
    }

    const backendApi = this._gridOptions.backendServiceApi;

    if (!backendApi || !backendApi.process || !backendApi.service) {
      throw new Error(`BackendServiceApi requires at least a "process" function and a "service" defined`);
    }

    // keep start time & end timestamps & return it after process execution
    const startTime = new Date();

    // run a preProcess callback if defined
    backendApi.preProcess?.();

    // query backend, except when it's called by a ClearFilters then we won't
    if (isTriggeringQueryEvent) {
      const query = await backendApi.service.processOnFilterChanged(event as Event, args as FilterChangedArgs);
      const totalItems = this._gridOptions.pagination?.totalItems ?? 0;
      this.backendUtilities?.executeBackendCallback(backendApi, query, args, startTime, totalItems, {
        errorCallback: this.resetToPreviousSearchFilters.bind(this),
        successCallback: (responseArgs) => (this._previousFilters = this.extractBasicFilterDetails(responseArgs.columnFilters)),
        emitActionChangedCallback: this.emitFilterChanged.bind(this),
        httpCancelRequestSubject: this.httpCancelRequests$,
      });
    }
  }

  /**
   * When user passes an array of preset filters, we need to pre-populate each column filter searchTerm(s)
   * The process is to loop through the preset filters array, find the associated column from columnDefinitions and fill in the filter object searchTerm(s)
   * This is basically the same as if we would manually add searchTerm(s) to a column filter object in the column definition, but we do it programmatically.
   * At the end of the day, when creating the Filter (DOM Element), it will use these searchTerm(s) so we can take advantage of that without recoding each Filter type (DOM element)
   * @param grid
   */
  populateColumnFilterSearchTermPresets(filters: CurrentFilter[]): Column[] {
    if (Array.isArray(filters)) {
      this._columnDefinitions.forEach((columnDef: Column) => {
        // clear any columnDef searchTerms before applying Presets
        if (columnDef.filter?.searchTerms) {
          delete columnDef.filter.searchTerms;
        }

        // from each presets, we will find the associated columnDef and apply the preset searchTerms & operator if there is
        const columnPreset = filters.find((presetFilter: CurrentFilter) => presetFilter.columnId === columnDef.id);
        if (columnPreset && Array.isArray(columnPreset?.searchTerms)) {
          columnDef.filter = columnDef.filter || {};
          columnDef.filter.operator = columnPreset.operator || columnDef.filter.operator || '';
          columnDef.filter.searchTerms = columnPreset.searchTerms;
        }
      });

      // when we have a Filter Presets on a Tree Data View grid, we need to call the pre-filtering of tree data
      if (this._gridOptions.enableTreeData) {
        this.refreshTreeDataFilters();
      }

      // keep reference of the filters
      this._previousFilters = this.extractBasicFilterDetails(this._columnFilters);
    }
    return this._columnDefinitions;
  }

  /**
   * when we have a Filter Presets on a Tree Data View grid, we need to call the pre-filtering of tree data
   * we need to do this because Tree Data is the only type of grid that requires a pre-filter (preFilterTreeData) to be executed before the final filtering
   * @param {Array<Object>} [items] - optional flat array of parent/child items to use while redoing the full sort & refresh
   */
  refreshTreeDataFilters(items?: any[]): void {
    const inputItems = items ?? this._dataView?.getItems() ?? [];

    if (this._dataView && this._gridOptions.enableTreeData && inputItems.length > 0) {
      this._tmpPreFilteredData = this.preFilterTreeData(inputItems, this._columnFilters);
      this._dataView.refresh(); // and finally this refresh() is what triggers a DataView filtering check
    } else if (
      inputItems.length === 0 &&
      Array.isArray(this.sharedService.hierarchicalDataset) &&
      this.sharedService.hierarchicalDataset.length > 0
    ) {
      // in some occasion, we might be dealing with a dataset that is hierarchical from the start (the source dataset is already a tree structure)
      // and we did not have time to convert it to a flat dataset yet (for SlickGrid to use),
      // we would end up calling the pre-filter too early because these pre-filter works only a flat dataset
      // for that use case (like Example 6), we can queue a microtask to be executed at the end of current task
      queueMicrotaskOrSetTimeout(() => this.refreshTreeDataFilters());
    }
  }

  /**
   * Toggle the Filter Functionality
   * @param {boolean} isFilterDisabled - optionally force a disable/enable of the Sort Functionality? Defaults to True
   * @param {boolean} clearFiltersWhenDisabled - when disabling the Filter, do we also want to clear all the filters as well? Defaults to True
   */
  disableFilterFunctionality(isFilterDisabled = true, clearFiltersWhenDisabled = true): void {
    const prevShowFilterFlag = this._gridOptions.enableFiltering;
    const newShowFilterFlag = !prevShowFilterFlag;

    if (newShowFilterFlag !== isFilterDisabled) {
      if (clearFiltersWhenDisabled && isFilterDisabled) {
        this.clearFilters();
      }
      this.disableAllFilteringCommands(isFilterDisabled);
      this._grid.setOptions({ enableFiltering: newShowFilterFlag }, false, true);
      this._grid.setHeaderRowVisibility(newShowFilterFlag);
      this._gridOptions.enableFiltering = !isFilterDisabled;
      this.sharedService.gridOptions = this._gridOptions;

      // when displaying header row, we'll call "setColumns" which in terms will recreate the header row filters
      this._grid.updateColumns();
      // this._grid.setColumns(this.sharedService.columnDefinitions);
    }
  }

  /**
   * Reset (revert) to previous filters, it could be because you prevented `onBeforeSearchChange` OR a Backend Error was thrown.
   * It will reapply the previous filter state in the UI.
   */
  resetToPreviousSearchFilters(): void {
    this.updateFilters(this._previousFilters, false, false, false);
  }

  /**
   * Toggle the Filter Functionality (show/hide the header row filter bar as well)
   * @param {boolean} clearFiltersWhenDisabled - when disabling the filters, do we want to clear the filters before hiding the filters? Defaults to True
   */
  toggleFilterFunctionality(clearFiltersWhenDisabled = true): void {
    const prevShowFilterFlag = this._gridOptions.enableFiltering;
    this.disableFilterFunctionality(prevShowFilterFlag, clearFiltersWhenDisabled);
  }

  /**
   * Toggle the Header Row filter bar (this does not disable the Filtering itself, you can use "toggleFilterFunctionality()" instead, however this will reset any column positions)
   */
  toggleHeaderFilterRow(): void {
    let showHeaderRow = this._gridOptions.showHeaderRow ?? false;
    showHeaderRow = !showHeaderRow; // inverse show header flag
    this._grid.setHeaderRowVisibility(showHeaderRow);

    // when displaying header row, we'll call "setColumns" which in terms will recreate the header row filters
    if (showHeaderRow === true) {
      // this._grid.setColumns(this.sharedService.columnDefinitions);
      this._grid.updateColumns();
    }
  }

  /**
   * Set the sort icons in the UI (ONLY the icons, it does not do any sorting)
   * The column sort icons are not necessarily inter-connected to the sorting functionality itself,
   * you can change the sorting icons separately by passing an array of columnId/sortAsc and that will change ONLY the icons
   * @param sortColumns
   */
  setSortColumnIcons(sortColumns: { columnId: string; sortAsc: boolean }[]): void {
    if (this._grid && Array.isArray(sortColumns)) {
      this._grid.setSortColumns(sortColumns);
    }
  }

  /**
   * Update Filters dynamically just by providing an array of filter(s).
   * You can also choose emit (default) a Filter Changed event that will be picked by the Grid State Service.
   *
   * Also for backend service only, you can choose to trigger a backend query (default) or not if you wish to do it later,
   * this could be useful when using updateFilters & updateSorting and you wish to only send the backend query once.
   * @param filters array
   * @param triggerEvent defaults to True, do we want to emit a filter changed event?
   * @param triggerBackendQuery defaults to True, which will query the backend.
   * @param triggerOnSearchChangeEvent defaults to False, can be useful with Tree Data structure where the onSearchEvent has to run to execute a prefiltering step
   */
  async updateFilters(
    filters: CurrentFilter[],
    emitChangedEvent = true,
    triggerBackendQuery = true,
    triggerOnSearchChangeEvent = false
  ): Promise<boolean> {
    if (!this._filtersMetadata || this._filtersMetadata.length === 0 || !this._gridOptions || !this._gridOptions.enableFiltering) {
      throw new Error(
        '[Slickgrid-Universal] in order to use "updateFilters" method, you need to have Filterable Columns defined in your grid and "enableFiltering" set in your Grid Options'
      );
    }

    if (Array.isArray(filters)) {
      // start by clearing all filters (without triggering an event) before applying any new filters
      this.clearFilters(false);

      // pre-fill (value + operator) and render all filters in the DOM
      // loop through each Filters provided (which has a columnId property)
      // then find their associated Filter instances that were originally created in the grid
      filters.forEach((newFilter) => {
        const uiFilter = this._filtersMetadata.find((filter) => newFilter.columnId === filter.columnDef.id);
        if (newFilter && uiFilter) {
          const newOperator = newFilter.operator || uiFilter.defaultOperator;
          this.updateColumnFilters(newFilter.searchTerms, uiFilter.columnDef, newOperator);
          uiFilter.setValues(newFilter.searchTerms || [], newOperator);

          if (triggerOnSearchChangeEvent || this._gridOptions.enableTreeData) {
            this.callbackSearchEvent(undefined, {
              columnDef: uiFilter.columnDef,
              operator: newOperator,
              searchTerms: newFilter.searchTerms,
              shouldTriggerQuery: true,
              forceOnSearchChangeEvent: true,
            });
          }
        }
      });

      const backendApi = this._gridOptions.backendServiceApi;
      const emitterType: EmitterType = backendApi ? 'remote' : 'local';

      // trigger the onBeforeFilterChange event before the process
      if (emitChangedEvent) {
        await this.emitFilterChanged(emitterType, true);
      }

      // refresh the DataView and trigger an event after all filters were updated and rendered
      this._dataView.refresh();

      if (backendApi) {
        const backendApiService = backendApi?.service;
        if (backendApiService?.updateFilters) {
          backendApiService.updateFilters(filters, true);
          if (triggerBackendQuery) {
            this.backendUtilities?.refreshBackendDataset(this._gridOptions);
          }
        }
      }

      if (emitChangedEvent) {
        await this.emitFilterChanged(emitterType);
      }
    }
    return true;
  }

  /**
   * **NOTE**: This should only ever be used when having a global external search and hidding the grid inline filters (with `enableFiltering: true` and `showHeaderRow: false`).
   * For inline filters, please use `updateFilters()` instead.
   *
   * Update a Single Filter dynamically just by providing (columnId, operator and searchTerms)
   * You can also choose emit (default) a Filter Changed event that will be picked by the Grid State Service.
   * Also for backend service only, you can choose to trigger a backend query (default) or not if you wish to do it later,
   * this could be useful when using updateFilters & updateSorting and you wish to only send the backend query once.
   * @param filters array
   * @param triggerEvent defaults to True, do we want to emit a filter changed event?
   * @param triggerBackendQuery defaults to True, which will query the backend.
   */
  async updateSingleFilter(filter: CurrentFilter, emitChangedEvent = true, triggerBackendQuery = true): Promise<boolean> {
    const columnDef = this.sharedService.allColumns.find((col) => col.id === filter.columnId);
    if (columnDef && filter.columnId) {
      this._columnFilters = {};
      const emptySearchTermReturnAllValues = columnDef.filter?.emptySearchTermReturnAllValues ?? true;

      if (
        Array.isArray(filter.searchTerms) &&
        (filter.searchTerms.length > 1 ||
          (filter.searchTerms.length === 1 && (!emptySearchTermReturnAllValues || filter.searchTerms[0] !== '')))
      ) {
        // pass a columnFilter object as an object which it's property name must be a column field name (e.g.: 'duration': {...} )
        this._columnFilters[filter.columnId] = {
          columnId: filter.columnId,
          operator: filter.operator,
          searchTerms: filter.searchTerms,
          columnDef,
          type: columnDef.type ?? FieldType.string,
        };
      }

      const backendApi = this._gridOptions.backendServiceApi;
      const emitterType: EmitterType = backendApi ? 'remote' : 'local';

      // trigger the onBeforeFilterChange event before the process
      if (emitChangedEvent) {
        await this.emitFilterChanged(emitterType, true);
      }

      if (backendApi) {
        const backendApiService = backendApi?.service;
        if (backendApiService?.updateFilters) {
          backendApiService.updateFilters(this._columnFilters, true);
          if (triggerBackendQuery) {
            this.backendUtilities?.refreshBackendDataset(this._gridOptions);
          }
        }
      } else {
        this._dataView.setFilterArgs({
          columnFilters: this._columnFilters,
          grid: this._grid,
        });

        // when using Tree Data, we also need to refresh the filters because of the tree structure with recursion
        if (this._gridOptions.enableTreeData) {
          this.refreshTreeDataFilters();
        }

        this._dataView.refresh();
      }

      if (emitChangedEvent) {
        await this.emitFilterChanged(emitterType);
      }
    }
    return true;
  }

  /**
   * Draw DOM Element Filter on custom HTML element
   * @param column - column id or column object
   * @param filterContainer - id element HTML or DOM element filter
   */
  drawFilterTemplate(column: Column | string, filterContainer: HTMLDivElement | string): Filter | null | undefined {
    let filterContainerElm: HTMLDivElement | null;
    if (typeof filterContainer === 'string') {
      filterContainerElm = document.querySelector(filterContainer);
      if (filterContainerElm === null) {
        return null;
      }
    } else {
      filterContainerElm = filterContainer;
    }
    const columnDef = typeof column === 'string' ? this.sharedService.allColumns.find((col) => col.id === column) : column;
    const columnId = columnDef?.id ?? '';

    if (columnId !== 'selector' && columnDef?.filterable) {
      let searchTerms: SearchTerm[] | undefined;
      let operator: OperatorString | OperatorType | undefined;
      const newFilter: Filter | undefined = this.filterFactory.createFilter(columnDef.filter);
      operator = (columnDef && columnDef.filter && columnDef.filter.operator) || (newFilter && newFilter.operator);

      if (this._columnFilters[columnDef.id]) {
        searchTerms = this._columnFilters[columnDef.id].searchTerms || undefined;
        operator = this._columnFilters[columnDef.id].operator || undefined;
      } else if (columnDef.filter) {
        // when hiding/showing (with Column Picker or Grid Menu), it will try to re-create yet again the filters (since SlickGrid does a re-render)
        // because of that we need to first get searchTerm(s) from the columnFilters (that is what the user last typed in a filter search input)
        searchTerms = columnDef.filter.searchTerms || undefined;
        this.updateColumnFilters(searchTerms, columnDef, operator);
      }

      const filterArguments: FilterArguments = {
        grid: this._grid,
        operator,
        searchTerms,
        columnDef,
        filterContainerElm,
        callback: this.callbackSearchEvent.bind(this),
      };

      if (newFilter) {
        newFilter.init(filterArguments);

        // when hiding/showing (with Column Picker or Grid Menu), it will try to re-create yet again the filters (since SlickGrid does a re-render)
        // we need to also set again the values in the DOM elements if the values were set by a searchTerm(s)
        if (searchTerms && newFilter.setValues) {
          newFilter.setValues(searchTerms, operator);
        }
      }
      return newFilter;
    }
    return null;
  }

  // --
  // protected functions
  // -------------------

  /** Add all created filters (from their template) to the header row section area */
  protected addFilterTemplateToHeaderRow(args: { column: Column; grid: SlickGrid; node: HTMLElement }, isFilterFirstRender = true): void {
    const columnDef = args.column;
    const columnId = columnDef?.id ?? '';

    if (columnId !== 'selector' && columnDef?.filterable && !columnDef?.hidden) {
      let searchTerms: SearchTerm[] | undefined;
      let operator: OperatorString | OperatorType | undefined;
      const newFilter: Filter | undefined = this.filterFactory.createFilter(columnDef.filter);
      operator = (columnDef && columnDef.filter && columnDef.filter.operator) || (newFilter && newFilter.operator);

      if (this._columnFilters[columnDef.id]) {
        searchTerms = this._columnFilters[columnDef.id].searchTerms || undefined;
        operator = this._columnFilters[columnDef.id].operator || undefined;
      } else if (columnDef.filter) {
        // when hiding/showing (with Column Picker or Grid Menu), it will try to re-create yet again the filters (since SlickGrid does a re-render)
        // because of that we need to first get searchTerm(s) from the columnFilters (that is what the user last typed in a filter search input)
        searchTerms = columnDef.filter.searchTerms || undefined;
        this.updateColumnFilters(searchTerms, columnDef, operator);
      }

      const filterArguments: FilterArguments = {
        grid: this._grid,
        operator,
        searchTerms,
        columnDef,
        filterContainerElm: args.node,
        callback: this.callbackSearchEvent.bind(this),
      };

      if (newFilter && filterArguments.filterContainerElm) {
        newFilter.init(filterArguments, isFilterFirstRender);
        const filterExistIndex = this._filtersMetadata.findIndex((filter) => newFilter.columnDef.id === filter.columnDef.id);

        // add to the filters arrays or replace it when found
        if (filterExistIndex === -1) {
          this._filtersMetadata.push(newFilter);
        } else {
          this._filtersMetadata[filterExistIndex] = newFilter;
        }

        // when hiding/showing (with Column Picker or Grid Menu), it will try to re-create yet again the filters (since SlickGrid does a re-render)
        // we need to also set again the values in the DOM elements if the values were set by a searchTerm(s)
        if (searchTerms && newFilter.setValues) {
          newFilter.setValues(searchTerms, operator);
        }
      }
    }
  }

  /**
   * Callback method that is called and executed by the individual Filter (DOM element),
   * for example when user starts typing chars on a search input (which uses InputFilter), this Filter will execute the callback from an input change event.
   */
  protected callbackSearchEvent(event: Event | undefined, args: FilterCallbackArg): void {
    if (args) {
      const searchTerm = event?.target ? (event.target as HTMLInputElement).value : undefined;
      const searchTerms = args.searchTerms && Array.isArray(args.searchTerms) ? args.searchTerms : searchTerm ? [searchTerm] : undefined;
      const columnDef = args.columnDef || null;
      const columnId = columnDef?.id ?? '';
      const fieldType = columnDef?.filter?.type ?? columnDef?.type ?? FieldType.string;
      const operator = args.operator || undefined;
      const hasSearchTerms = searchTerms && Array.isArray(searchTerms);
      const termsCount = hasSearchTerms && searchTerms && searchTerms.length;
      const oldColumnFilters = { ...this._columnFilters };
      const emptySearchTermReturnAllValues = columnDef.filter?.emptySearchTermReturnAllValues ?? true;
      let parsedSearchTerms: SearchTerm | SearchTerm[] | undefined;

      if (columnDef && columnId) {
        if (
          !hasSearchTerms ||
          termsCount === 0 ||
          (termsCount === 1 && Array.isArray(searchTerms) && emptySearchTermReturnAllValues && searchTerms[0] === '')
        ) {
          // delete the property from the columnFilters when it becomes empty
          // without doing this, it would leave an incorrect state of the previous column filters when filtering on another column
          delete this._columnFilters[columnId];
        } else {
          const colId = `${columnId}`;
          const colFilter: Omit<SearchColumnFilter, 'searchTerms'> = {
            columnId: colId,
            columnDef,
            parsedSearchTerms: [],
            type: fieldType,
            targetSelector: this.getSelectorStringFromElement(event?.target as HTMLElement | undefined),
          };
          const inputSearchConditions = this.parseFormInputFilterConditions(searchTerms, colFilter);
          colFilter.operator = operator || inputSearchConditions.operator || mapOperatorByFieldType(fieldType);
          parsedSearchTerms = getParsedSearchTermsByFieldType(inputSearchConditions.searchTerms, fieldType);
          if (parsedSearchTerms !== undefined) {
            colFilter.parsedSearchTerms = parsedSearchTerms;
          }

          // use searchTerms only coming from the input search result because original terms might include extra operator symbols within their string
          // and the input search result would be correctly stripped them from input result and assigned to the appropriate operator
          // for example we might have: { searchTerms: ['*doe'] } and that should be reassigned to: { operator: EndsWith, searchTerms: 'doe' }
          (colFilter as SearchColumnFilter).searchTerms = inputSearchConditions.searchTerms || [];
          this._columnFilters[colId] = colFilter as SearchColumnFilter;
        }
      }

      // event might have been created as a CustomEvent (e.g. CompoundDateFilter), without being a valid SlickEventData,
      // if so we will create a new SlickEventData and merge it with that CustomEvent to avoid having SlickGrid errors
      const eventData =
        event && typeof (event as any).isPropagationStopped !== 'function' ? extend({}, new SlickEventData(), event) : event;

      // trigger an event only if Filters changed or if ENTER key was pressed
      const eventKey = (event as KeyboardEvent)?.key;
      if (
        this._onSearchChange &&
        (args.forceOnSearchChangeEvent || eventKey === 'Enter' || !dequal(oldColumnFilters, this._columnFilters))
      ) {
        const eventArgs = {
          clearFilterTriggered: args.clearFilterTriggered,
          shouldTriggerQuery: args.shouldTriggerQuery,
          columnId,
          columnDef,
          columnFilters: this._columnFilters,
          operator: operator || mapOperatorByFieldType(fieldType),
          searchTerms,
          parsedSearchTerms,
          grid: this._grid,
          target: event?.target,
        } as OnSearchChangeEventArgs;

        const onBeforeDispatchResult = this.pubSubService.publish('onBeforeSearchChange', eventArgs);
        if (onBeforeDispatchResult === false) {
          if (this._gridOptions.resetFilterSearchValueAfterOnBeforeCancellation) {
            this.resetToPreviousSearchFilters();
          }
        } else {
          this._onSearchChange.notify(eventArgs, eventData);
        }
      }
    }
  }

  /**
   * Loop through all column definitions and do the following thing
   * 1. loop through each Header Menu commands and change the "hidden" commands to show/hide depending if it's enabled/disabled
   * Also note that we aren't deleting any properties, we just toggle their flags so that we can reloop through at later point in time.
   * (if we previously deleted these properties we wouldn't be able to change them back since these properties wouldn't exist anymore, hence why we just hide the commands)
   * @param {boolean} isDisabling - are we disabling the filter functionality? Defaults to true
   */
  protected disableAllFilteringCommands(isDisabling = true): Column[] {
    const columnDefinitions = this._grid.getColumns();

    // loop through column definition to hide/show header menu commands
    columnDefinitions.forEach((col) => {
      if (col?.header?.menu) {
        col.header.menu.commandItems?.forEach((menuItem) => {
          if (menuItem && typeof menuItem !== 'string') {
            const menuCommand = menuItem.command;
            if (menuCommand === 'clear-filter') {
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
        if (menuItem && typeof menuItem !== 'string') {
          const menuCommand = menuItem.command;
          if (menuCommand === 'clear-filter' || menuCommand === 'toggle-filter') {
            menuItem.hidden = isDisabling;
          }
        }
      });
    }

    return columnDefinitions;
  }

  /**
   * From a ColumnFilters object, extract only the basic filter details (columnId, operator & searchTerms)
   * @param {Object} columnFiltersObject - columnFilters object
   * @returns - basic details of a column filter
   */
  protected extractBasicFilterDetails(columnFiltersObject: ColumnFilters): CurrentFilter[] {
    const filters: CurrentFilter[] = [];

    if (columnFiltersObject && typeof columnFiltersObject === 'object') {
      for (const columnId of Object.keys(columnFiltersObject)) {
        const { operator, searchTerms } = columnFiltersObject[`${columnId}`];
        filters.push({ columnId, operator, searchTerms });
      }
    }
    return filters;
  }

  protected getSelectorStringFromElement(elm?: HTMLElement | null): string {
    if (elm?.localName) {
      return elm?.className ? `${elm.localName}.${Array.from(elm.classList).join('.')}` : elm.localName;
    }
    return '';
  }

  /**
   * When clearing or disposing of all filters, we need to loop through all columnFilters and delete them 1 by 1
   * only trying to make columnFilter an empty (without looping) would not trigger a dataset change
   */
  protected removeAllColumnFiltersProperties(): void {
    if (typeof this._columnFilters === 'object') {
      Object.keys(this._columnFilters).forEach((columnId) => {
        if (columnId && this._columnFilters[columnId]) {
          delete this._columnFilters[columnId];
        }
      });
    }
  }

  /**
   * Subscribe to `onBeforeHeaderRowCellDestroy` to destroy Filter(s) to avoid leak and not keep orphan filters
   * @param {Object} grid - Slick Grid object
   */
  protected subscribeToOnHeaderRowCellRendered(grid: SlickGrid): void {
    this._eventHandler.subscribe(grid.onBeforeHeaderRowCellDestroy, (_e, args) => {
      const colFilter: Filter | undefined = this._filtersMetadata.find((filter: Filter) => filter.columnDef.id === args.column.id);
      colFilter?.destroy?.();
    });
  }

  protected updateColumnFilters(searchTerms: SearchTerm[] | undefined, columnDef: Column, operator?: OperatorType | OperatorString): void {
    const fieldType = columnDef.filter?.type ?? columnDef.type ?? FieldType.string;
    const parsedSearchTerms = getParsedSearchTermsByFieldType(searchTerms, fieldType); // parsed term could be a single value or an array of values

    if (searchTerms && columnDef) {
      this._columnFilters[columnDef.id] = {
        columnId: columnDef.id,
        columnDef,
        searchTerms,
        operator,
        parsedSearchTerms,
        type: fieldType,
      };
    }
  }
}
