import type { BasePubSubService, EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { dequal } from 'dequal/lite';

import type {
  BackendServiceApi,
  CurrentPagination,
  CursorPageInfo,
  Pagination,
  PaginationCursorChangedArgs,
  ServicePagination,
} from '../interfaces/index';
import type { BackendUtilityService } from './backendUtility.service';
import type { SharedService } from './shared.service';
import { propertyObserver } from './observers';
import type { Observable, RxJsFacade } from './rxjsFacade';
import { type SlickDataView, SlickEventHandler, type SlickGrid } from '../core/index';

export class PaginationService {
  protected _eventHandler: SlickEventHandler;
  protected _initialized = false;
  protected _isLocalGrid = true;
  protected _backendServiceApi: BackendServiceApi | undefined;
  protected _dataFrom = 1;
  protected _dataTo = 1;
  protected _itemsPerPage = 0;
  protected _pageCount = 1;
  protected _pageNumber = 1;
  protected _totalItems = 0;
  protected _availablePageSizes: number[] = [];
  protected _paginationOptions!: Pagination;
  protected _previousPagination?: Pagination;
  protected _subscriptions: EventSubscription[] = [];
  protected _cursorPageInfo?: CursorPageInfo;
  protected _isCursorBased = false;

  /** SlickGrid Grid object */
  grid!: SlickGrid;

  /** Constructor */
  constructor(protected readonly pubSubService: BasePubSubService, protected readonly sharedService: SharedService, protected readonly backendUtilities?: BackendUtilityService | undefined, protected rxjs?: RxJsFacade | undefined) {
    this._eventHandler = new SlickEventHandler();
  }

  /** Getter of SlickGrid DataView object */
  get dataView(): SlickDataView | undefined {
    return this.grid?.getData<SlickDataView>() ?? {};
  }

  set paginationOptions(paginationOptions: Pagination) {
    this._paginationOptions = paginationOptions;
  }
  get paginationOptions(): Pagination {
    return this._paginationOptions;
  }

  get availablePageSizes(): number[] {
    return this._availablePageSizes;
  }

  get dataFrom(): number {
    return this._dataFrom;
  }

  get dataTo(): number {
    return this._dataTo;
  }

  get itemsPerPage(): number {
    return this._itemsPerPage;
  }

  get pageCount(): number {
    return this._pageCount;
  }

  get pageNumber(): number {
    return this._pageNumber;
  }

  get totalItems(): number {
    return this._totalItems;
  }

  set totalItems(totalItems: number) {
    this._totalItems = totalItems;
    if (this._initialized) {
      this.refreshPagination();
    }
  }

  /**
   * https://dev.to/jackmarchant/offset-and-cursor-pagination-explained-b89
   * Cursor based pagination does not allow navigation to a page in the middle of a set of pages (eg: LinkedList vs Vector).
   *  Further, Pagination with page numbers only makes sense in non-relay style pagination
   *  Relay style pagination is better suited to infinite scrolling
   *
   * eg
   *  relay pagination - Infinte scrolling appending data
   *    page1: {startCursor: A, endCursor: B }
   *    page2: {startCursor: A, endCursor: C }
   *    page3: {startCursor: A, endCursor: D }
   *
   *  non-relay pagination - Getting page chunks
   *    page1: {startCursor: A, endCursor: B }
   *    page2: {startCursor: B, endCursor: C }
   *    page3: {startCursor: C, endCursor: D }
   */
  get isCursorBased(): boolean {
    return this._isCursorBased;
  }

  addRxJsResource(rxjs: RxJsFacade): void {
    this.rxjs = rxjs;
  }

  init(grid: SlickGrid, paginationOptions: Pagination, backendServiceApi?: BackendServiceApi): void {
    this._availablePageSizes = paginationOptions.pageSizes;
    this.grid = grid;
    this._backendServiceApi = backendServiceApi;
    this._paginationOptions = paginationOptions;
    this._isLocalGrid = !backendServiceApi;
    this._pageNumber = paginationOptions.pageNumber || 1;
    this._isCursorBased = backendServiceApi?.options?.useCursor ?? false;

    if (backendServiceApi && (!backendServiceApi.service || !backendServiceApi.process)) {
      throw new Error(`BackendServiceApi requires the following 2 properties "process" and "service" to be defined.`);
    }

    if (this._isLocalGrid && this.dataView) {
      this._eventHandler.subscribe(this.dataView.onPagingInfoChanged, (_e, pagingInfo) => {
        if (this._totalItems !== pagingInfo.totalRows) {
          this.updateTotalItems(pagingInfo.totalRows);
          this._previousPagination = { pageNumber: pagingInfo.pageNum, pageSize: pagingInfo.pageSize, pageSizes: this.availablePageSizes, totalItems: pagingInfo.totalRows };
        }
      });
      queueMicrotask(() => {
        if (this.dataView) {
          this.dataView.setRefreshHints({ isFilterUnchanged: true });
          this.dataView.setPagingOptions({ pageSize: this.paginationOptions.pageSize, pageNum: (this._pageNumber - 1) }); // dataView page starts at 0 instead of 1
        }
      });
    }

    // Subscribe to Filter Clear & Changed and go back to page 1 when that happen
    this._subscriptions.push(this.pubSubService.subscribe('onFilterChanged', () => this.resetPagination()));
    this._subscriptions.push(this.pubSubService.subscribe('onFilterCleared', () => this.resetPagination()));

    // Subscribe to any dataview row count changed so that when Adding/Deleting item(s) through the DataView
    // that would trigger a refresh of the pagination numbers
    if (this.dataView) {
      this._subscriptions.push(this.pubSubService.subscribe<any | any[]>(`onItemAdded`, items => this.processOnItemAddedOrRemoved(items, true)));
      this._subscriptions.push(this.pubSubService.subscribe<any | any[]>(`onItemDeleted`, items => this.processOnItemAddedOrRemoved(items, false)));
    }

    this.refreshPagination(false, false, true);

    // also keep reference to current pagination in case we need to rollback
    const pagination = this.getFullPagination();
    this._previousPagination = { pageNumber: pagination.pageNumber, pageSize: pagination.pageSize, pageSizes: pagination.pageSizes, totalItems: this.totalItems };

    this._initialized = true;

    // observe for pagination total items change and update our local totalItems ref
    propertyObserver(paginationOptions, 'totalItems', (newTotal) => this._totalItems = newTotal);
  }

  dispose(): void {
    this._initialized = false;

    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();

    // also unsubscribe all Subscriptions
    this.pubSubService.unsubscribeAll(this._subscriptions);
  }

  getCurrentPagination(): CurrentPagination & { pageSizes: number[]; } {
    return {
      pageNumber: this._pageNumber,
      pageSize: this._itemsPerPage,
      pageSizes: this._availablePageSizes,
    };
  }

  getFullPagination(): ServicePagination {
    return {
      pageCount: this._pageCount,
      pageNumber: this._pageNumber,
      pageSize: this._itemsPerPage,
      pageSizes: this._availablePageSizes,
      totalItems: this._totalItems,
      dataFrom: this._dataFrom,
      dataTo: this._dataTo,
    };
  }

  getCurrentPageNumber(): number {
    return this._pageNumber;
  }

  getCurrentItemPerPage(): number {
    return this._itemsPerPage;
  }

  changeItemPerPage(itemsPerPage: number, event?: any, triggerChangeEvent = true): Promise<ServicePagination> {
    this._pageNumber = 1;
    this._pageCount = Math.ceil(this._totalItems / itemsPerPage);
    this._itemsPerPage = itemsPerPage;
    return triggerChangeEvent ? this.processOnPageChanged(this._pageNumber, event) : Promise.resolve(this.getFullPagination());
  }

  goToFirstPage(event?: any, triggerChangeEvent = true): Promise<ServicePagination> {
    this._pageNumber = 1;
    if (triggerChangeEvent) {
      return this.isCursorBased && this._cursorPageInfo
        ? this.processOnPageChanged(this._pageNumber, event, { newPage: this._pageNumber, pageSize: this._itemsPerPage, first: this._itemsPerPage })
        : this.processOnPageChanged(this._pageNumber, event);
    }
    return Promise.resolve(this.getFullPagination());
  }

  goToLastPage(event?: any, triggerChangeEvent = true): Promise<ServicePagination> {
    this._pageNumber = this._pageCount || 1;
    if (triggerChangeEvent) {
      return this.isCursorBased && this._cursorPageInfo
        ? this.processOnPageChanged(this._pageNumber, event, { newPage: this._pageNumber, pageSize: this._itemsPerPage, last: this._itemsPerPage })
        : this.processOnPageChanged(this._pageNumber, event);
    }
    return Promise.resolve(this.getFullPagination());
  }

  goToNextPage(event?: any, triggerChangeEvent = true): Promise<boolean | ServicePagination> {
    if (this._pageNumber < this._pageCount) {
      this._pageNumber++;
      if (triggerChangeEvent) {
        return this.isCursorBased && this._cursorPageInfo
          ? this.processOnPageChanged(this._pageNumber, event, { newPage: this._pageNumber, pageSize: this._itemsPerPage, first: this._itemsPerPage, after: this._cursorPageInfo.endCursor })
          : this.processOnPageChanged(this._pageNumber, event);
      } else {
        return Promise.resolve(this.getFullPagination());
      }
    }
    return Promise.resolve(false);
  }

  goToPageNumber(pageNumber: number, event?: any, triggerChangeEvent = true): Promise<boolean | ServicePagination> {
    if (this.isCursorBased) {
      console.assert(true, 'Cursor based navigation cannot navigate to arbitrary page');
      return Promise.resolve(false);
    }

    const previousPageNumber = this._pageNumber;

    if (pageNumber < 1) {
      this._pageNumber = 1;
    } else if (pageNumber > this._pageCount) {
      this._pageNumber = this._pageCount;
    } else {
      this._pageNumber = pageNumber;
    }

    if (this._pageNumber !== previousPageNumber) {
      return triggerChangeEvent ? this.processOnPageChanged(this._pageNumber, event) : Promise.resolve(this.getFullPagination());
    }
    return Promise.resolve(false);
  }

  goToPreviousPage(event?: any, triggerChangeEvent = true): Promise<boolean | ServicePagination> {
    if (this._pageNumber > 1) {
      this._pageNumber--;
      if (triggerChangeEvent) {
        return this.isCursorBased && this._cursorPageInfo
          ? this.processOnPageChanged(this._pageNumber, event, { newPage: this._pageNumber, pageSize: this._itemsPerPage, last: this._itemsPerPage, before: this._cursorPageInfo.startCursor })
          : this.processOnPageChanged(this._pageNumber, event);
      } else {
        return Promise.resolve(this.getFullPagination());
      }
    }
    return Promise.resolve(false);
  }

  refreshPagination(isPageNumberReset = false, triggerChangedEvent = true, triggerInitializedEvent = false): void {
    const previousPagination = { ...this.getFullPagination() };

    if (this._paginationOptions) {
      const pagination = this._paginationOptions;

      // set the number of items per page if not already set
      if (!this._itemsPerPage) {
        if (this._isLocalGrid) {
          this._itemsPerPage = pagination.pageSize;
        } else {
          this._itemsPerPage = +((this._backendServiceApi?.options?.paginationOptions?.first) ? this._backendServiceApi.options.paginationOptions.first : pagination.pageSize);
        }
      }

      // if totalItems changed, we should always go back to the first page and recalculation the From-To indexes
      if (isPageNumberReset || this._totalItems !== pagination.totalItems) {
        if (isPageNumberReset) {
          this._pageNumber = 1;
          this.paginationOptions.pageNumber = 1;
        } else if (!this._initialized && pagination.pageNumber && pagination.pageNumber > 1) {
          this._pageNumber = pagination.pageNumber || 1;
        }

        // when page number is set to 1 then also reset the "offset" of backend service
        if (this._pageNumber === 1 && this._backendServiceApi) {
          this._backendServiceApi.service.resetPaginationOptions();
        }
      }

      // calculate and refresh the multiple properties of the pagination UI
      this._availablePageSizes = pagination.pageSizes;
      if (!this._totalItems && pagination.totalItems) {
        this._totalItems = pagination.totalItems;
      }
      this.recalculateFromToIndexes();
    }
    this._pageCount = Math.ceil(this._totalItems / this._itemsPerPage);
    this.sharedService.currentPagination = this.getCurrentPagination();

    // publish the refresh event on anytime the pagination is refreshed or re-rendered (run every time)
    // useful when binding a slick-pagination View
    this.pubSubService.publish(`onPaginationRefreshed`, this.getFullPagination());

    // publish a pagination change only when flag requires it (triggered by page or pageSize change, dataset length change by a filter or others)
    if (triggerChangedEvent && !dequal(previousPagination, this.getFullPagination())) {
      this.pubSubService.publish(`onPaginationChanged`, this.getFullPagination());
    }

    // publish on the first pagination initialization (called by the "init()" method on first load)
    if (triggerInitializedEvent && !dequal(previousPagination, this.getFullPagination())) {
      this.pubSubService.publish(`onPaginationPresetsInitialized`, this.getFullPagination());
    }
    const pagination = this.getFullPagination();
    this._previousPagination = { pageNumber: pagination.pageNumber, pageSize: pagination.pageSize, pageSizes: pagination.pageSizes, totalItems: this.totalItems };
  }

  /** Reset the Pagination to first page and recalculate necessary numbers */
  resetPagination(triggerChangedEvent = true): void {
    if (this._isLocalGrid && this.dataView && this.sharedService?.gridOptions?.enablePagination) {
      // on a local grid we also need to reset the DataView paging to 1st page
      this.dataView.setPagingOptions({ pageSize: this._itemsPerPage, pageNum: 0 });
    }
    this._cursorPageInfo = undefined;
    this.refreshPagination(true, triggerChangedEvent);
  }

  /**
   * Toggle the Pagination (show/hide), it will use the visible if defined else it will automatically inverse when called without argument
   *
   * IMPORTANT NOTE:
   * The Pagination must be created on initial page load, then only after can you toggle it.
   * Basically this method WILL NOT WORK to show the Pagination if it was never created from the start.
   */
  togglePaginationVisibility(visible?: boolean): void {
    if (this.grid && this.sharedService?.gridOptions) {
      const isVisible = visible !== undefined ? visible : !this.sharedService.gridOptions.enablePagination;

      // make sure to reset the Pagination and go back to first page to avoid any issues with Pagination being offset
      if (isVisible) {
        this.goToFirstPage();
      }

      // when using a local grid, we can reset the DataView pagination by changing its page size
      // page size of 0 would show all, hence cancel the pagination
      if (this._isLocalGrid && this.dataView) {
        const pageSize = visible ? this._itemsPerPage : 0;
        this.dataView.setPagingOptions({ pageSize, pageNum: 0 });
      }

      // finally toggle the "enablePagination" flag and make sure it happens AFTER the setPagingOptions is called (when using local grid)
      // to avoid conflict with GridState bindSlickGridRowSelectionToGridStateChange() method
      this.sharedService.gridOptions.enablePagination = isVisible;
      this.pubSubService.publish(`onPaginationVisibilityChanged`, { visible: isVisible });
    }
  }

  processOnPageChanged(pageNumber: number, event?: Event | undefined, cursorArgs?: PaginationCursorChangedArgs): Promise<ServicePagination> {
    console.assert(!this.isCursorBased || cursorArgs, 'Configured for cursor based pagination - cursorArgs expected');

    if (this.pubSubService.publish('onBeforePaginationChange', this.getFullPagination()) === false) {
      this.resetToPreviousPagination();
      return Promise.resolve(this.getFullPagination());
    }

    return new Promise((resolve, reject) => {
      this.recalculateFromToIndexes();

      if (this._isLocalGrid && this.dataView) {
        this.dataView.setPagingOptions({ pageSize: this._itemsPerPage, pageNum: pageNumber - 1 }); // dataView page starts at 0 instead of 1
        this.pubSubService.publish(`onPaginationChanged`, this.getFullPagination());
        this.pubSubService.publish(`onPaginationRefreshed`, this.getFullPagination());
        resolve(this.getFullPagination());
      } else {
        const itemsPerPage = +this._itemsPerPage;

        // keep start time & end timestamps & return it after process execution
        const startTime = new Date();

        // run any pre-process, if defined, for example a spinner
        if (this._backendServiceApi?.preProcess) {
          this._backendServiceApi.preProcess();
        }

        if (this._backendServiceApi?.process) {
          const query = this.isCursorBased && cursorArgs
            ? this._backendServiceApi.service.processOnPaginationChanged(event, cursorArgs)
            : this._backendServiceApi.service.processOnPaginationChanged(event, { newPage: pageNumber, pageSize: itemsPerPage });

          // the processes can be Promises
          const process = this._backendServiceApi.process(query);
          if (process instanceof Promise) {
            process
              .then((processResult: any) => {
                this.backendUtilities?.executeBackendProcessesCallback(startTime, processResult, this._backendServiceApi as BackendServiceApi, this._totalItems);
                const pagination = this.getFullPagination();
                this._previousPagination = { pageNumber: pagination.pageNumber, pageSize: pagination.pageSize, pageSizes: pagination.pageSizes, totalItems: this.totalItems };
                resolve(this.getFullPagination());
              })
              .catch((error) => {
                this.resetToPreviousPagination();
                this.backendUtilities?.onBackendError(error, this._backendServiceApi as BackendServiceApi);
                if (!this._backendServiceApi?.onError || !this.backendUtilities?.onBackendError) {
                  reject(process);
                }
              });
          } else if (this.rxjs?.isObservable(process)) {
            this._subscriptions.push(
              (process as Observable<any>).subscribe(
                (processResult: any) => {
                  const pagination = this.getFullPagination();
                  this._previousPagination = { pageNumber: pagination.pageNumber, pageSize: pagination.pageSize, pageSizes: pagination.pageSizes, totalItems: this.totalItems };
                  resolve(this.backendUtilities?.executeBackendProcessesCallback(startTime, processResult, this._backendServiceApi as BackendServiceApi, this._totalItems));
                },
                (error: any) => {
                  this.resetToPreviousPagination();
                  this.backendUtilities?.onBackendError(error, this._backendServiceApi as BackendServiceApi);
                  if (!this._backendServiceApi?.onError || !this.backendUtilities?.onBackendError) {
                    reject(process);
                  }
                }
              )
            );
          }

          this.pubSubService.publish(`onPaginationRefreshed`, this.getFullPagination());
          this.pubSubService.publish(`onPaginationChanged`, this.getFullPagination());
        }
      }
    });
  }

  recalculateFromToIndexes(): void {
    // when page is out of boundaries, reset it to page 1
    if (((this._pageNumber - 1) * this._itemsPerPage > this._totalItems) || (this._totalItems > 0 && this._pageNumber === 0)) {
      this._pageNumber = 1;
    }

    if (this._totalItems === 0) {
      this._dataFrom = 0;
      this._dataTo = 1;
      this._pageNumber = 0;
    } else {
      this._dataFrom = this._pageNumber > 1 ? ((this._pageNumber * this._itemsPerPage) - this._itemsPerPage + 1) : 1;
      this._dataTo = (this._totalItems < this._itemsPerPage) ? this._totalItems : ((this._pageNumber || 1) * this._itemsPerPage);
      if (this._dataTo > this._totalItems) {
        this._dataTo = this._totalItems;
      }
    }

    // do a final check on the From/To and make sure they are not greater or smaller than min/max acceptable values
    if (this._dataTo > this._totalItems) {
      this._dataTo = this._totalItems;
    } else if (this._totalItems < this._itemsPerPage) {
      this._dataTo = this._totalItems;
    }
  }

  /**
   * Reset (revert) to previous pagination, it could be because you prevented `onBeforePaginationChange`, `onBeforePagingInfoChanged` from DataView OR a Backend Error was thrown.
   * It will reapply the previous filter state in the UI.
   */
  resetToPreviousPagination(): void {
    const hasPageNumberChange = this._previousPagination?.pageNumber !== this.getFullPagination().pageNumber;
    const hasPageSizeChange = this._previousPagination?.pageSize !== this.getFullPagination().pageSize;

    if (hasPageSizeChange) {
      this.changeItemPerPage(this._previousPagination?.pageSize ?? 0, null, false);
    }
    if (hasPageNumberChange) {
      this.goToPageNumber(this._previousPagination?.pageNumber ?? 0, null, false);
    }

    // refresh the pagination in the UI
    // and re-update the Backend query string without triggering an actual query
    if (hasPageNumberChange || hasPageSizeChange) {
      this.refreshPagination();
      this._backendServiceApi?.service?.updatePagination?.(this._previousPagination?.pageNumber ?? 0, this._previousPagination?.pageSize ?? 0);
    }
  }

  setCursorBased(isCursorBased: boolean): void {
    this._isCursorBased = isCursorBased;
    if (isCursorBased) {
      this.setCursorPageInfo({ startCursor: '', endCursor: '', hasNextPage: false, hasPreviousPage: false }); // reset cursor
    }
    this.goToFirstPage();
    this.pubSubService.publish(`onPaginationSetCursorBased`, { isCursorBased });
  }

  setCursorPageInfo(pageInfo: CursorPageInfo): void {
    this._cursorPageInfo = pageInfo;
  }

  updateTotalItems(totalItems: number, triggerChangedEvent = false): void {
    this._totalItems = totalItems;
    if (this._paginationOptions) {
      this._paginationOptions.totalItems = totalItems;
      this.refreshPagination(false, triggerChangedEvent);
    }
  }

  // --
  // protected functions
  // --------------------

  /**
   * When item is added or removed, we will refresh the numbers on the pagination however we won't trigger a backend change
   * This will have a side effect though, which is that the "To" count won't be matching the "items per page" count,
   * that is a necessary side effect to avoid triggering a backend query just to refresh the paging,
   * basically we assume that this offset is fine for the time being,
   * until user does an action which will refresh the data hence the pagination which will then become normal again
   */
  protected processOnItemAddedOrRemoved(items: any | any[], isItemAdded = true): void {
    if (items !== null) {
      const previousDataTo = this._dataTo;
      const itemCount = Array.isArray(items) ? items.length : 1;
      const itemCountWithDirection = isItemAdded ? +(itemCount) : -(itemCount);

      // refresh the total count in the pagination and in the UI
      this._totalItems += itemCountWithDirection;
      this.recalculateFromToIndexes();

      // finally refresh the "To" count and we know it might be different than the "items per page" count
      // but this is necessary since we don't want an actual backend refresh
      this._dataTo = previousDataTo + itemCountWithDirection;
      this.pubSubService.publish(`onPaginationChanged`, this.getFullPagination());
    }
  }
}
