import * as isequal_ from 'lodash.isequal';
const isequal = isequal_; // patch to fix rollup to work

import { BackendServiceApi, CurrentPagination, DataView, Pagination, ServicePagination, SlickGrid, Subscription, SlickEventData } from '../interfaces/index';
import { executeBackendProcessesCallback, onBackendError } from './backend-utilities';
import { SharedService } from './shared.service';
import { PubSubService } from './pubSub.service';

// using external non-typed js libraries
declare const Slick: any;

export class PaginationService {
  private _initialized = false;
  private _isLocalGrid = true;
  private _backendServiceApi: BackendServiceApi | undefined;
  private _dataFrom = 1;
  private _dataTo = 1;
  private _itemsPerPage: number;
  private _pageCount = 1;
  private _pageNumber = 1;
  private _totalItems = 0;
  private _availablePageSizes: number[];
  private _eventHandler = new Slick.EventHandler();
  private _paginationOptions: Pagination;
  private _subscriptions: Subscription[] = [];

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Constructor */
  constructor(private pubSubService: PubSubService, private sharedService: SharedService) { }

  /** Getter of SlickGrid DataView object */
  get dataView(): DataView {
    return (this.grid?.getData && this.grid.getData()) as DataView;
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

  init(grid: SlickGrid, paginationOptions: Pagination, backendServiceApi?: BackendServiceApi) {
    this._availablePageSizes = paginationOptions.pageSizes;
    this.grid = grid;
    this._backendServiceApi = backendServiceApi;
    this._paginationOptions = paginationOptions;
    this._isLocalGrid = !backendServiceApi;
    this._pageNumber = paginationOptions.pageNumber || 1;

    if (backendServiceApi && (!backendServiceApi.service || !backendServiceApi.process)) {
      throw new Error(`BackendServiceApi requires the following 2 properties "process" and "service" to be defined.`);
    }

    if (this._isLocalGrid && this.dataView) {
      this.dataView.onPagingInfoChanged.subscribe((_e: SlickEventData, pagingInfo: { totalRows: number; pageNum: number; }) => {
        if (this._totalItems !== pagingInfo.totalRows) {
          this._totalItems = pagingInfo.totalRows;
          this._paginationOptions.totalItems = this._totalItems;
          this.refreshPagination(false, false);
        }
      });
      setTimeout(() => {
        this.dataView.setRefreshHints({ isFilterUnchanged: true });
        this.dataView.setPagingOptions({ pageSize: this.paginationOptions.pageSize, pageNum: (this._pageNumber - 1) }); // dataView page starts at 0 instead of 1
      });
    }

    // Subscribe to Filter Clear & Changed and go back to page 1 when that happen
    this._subscriptions.push(this.pubSubService.subscribe('onFilterChanged', () => this.resetPagination()));
    this._subscriptions.push(this.pubSubService.subscribe('onFilterCleared', () => this.resetPagination()));

    // Subscribe to any dataview row count changed so that when Adding/Deleting item(s) through the DataView
    // that would trigger a refresh of the pagination numbers
    if (this.dataView) {
      this._subscriptions.push(this.pubSubService.subscribe(`onItemAdded`, (items: any | any[]) => {
        this.processOnItemAddedOrRemoved(items, true);
      }));
      this._subscriptions.push(this.pubSubService.subscribe(`onItemDeleted`, (items: any | any[]) => this.processOnItemAddedOrRemoved(items, false)));
    }

    this.refreshPagination(false, false);
    this._initialized = true;
  }

  dispose() {
    this._initialized = false;

    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();

    // also unsubscribe all Subscriptions
    this.pubSubService.unsubscribeAll(this._subscriptions);
  }

  getCurrentPagination(): CurrentPagination & { pageSizes: number[] } {
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

  changeItemPerPage(itemsPerPage: number, event?: any): Promise<any> {
    this._pageNumber = 1;
    this._pageCount = Math.ceil(this._totalItems / itemsPerPage);
    this._itemsPerPage = itemsPerPage;
    return this.processOnPageChanged(this._pageNumber, event);
  }

  goToFirstPage(event?: any): Promise<any> {
    this._pageNumber = 1;
    return this.processOnPageChanged(this._pageNumber, event);
  }

  goToLastPage(event?: any): Promise<any> {
    this._pageNumber = this._pageCount || 1;
    return this.processOnPageChanged(this._pageNumber || 1, event);
  }

  goToNextPage(event?: any): Promise<any> {
    if (this._pageNumber < this._pageCount) {
      this._pageNumber++;
      return this.processOnPageChanged(this._pageNumber, event);
    } else {
      return new Promise(resolve => resolve(false));
    }
  }

  goToPageNumber(pageNumber: number, event?: any): Promise<any> {
    const previousPageNumber = this._pageNumber;

    if (pageNumber < 1) {
      this._pageNumber = 1;
    } else if (pageNumber > this._pageCount) {
      this._pageNumber = this._pageCount;
    } else {
      this._pageNumber = pageNumber;
    }

    if (this._pageNumber !== previousPageNumber) {
      return this.processOnPageChanged(this._pageNumber, event);
    } else {
      return new Promise(resolve => resolve(false));
    }
  }

  goToPreviousPage(event?: any): Promise<any> {
    if (this._pageNumber > 1) {
      this._pageNumber--;
      return this.processOnPageChanged(this._pageNumber, event);
    } else {
      return new Promise(resolve => resolve(false));
    }
  }

  refreshPagination(isPageNumberReset = false, triggerChangedEvent = true) {
    const previousPagination = { ...this.getCurrentPagination() };

    if (this._paginationOptions) {
      const pagination = this._paginationOptions;

      // set the number of items per page if not already set
      if (!this._itemsPerPage) {
        if (this._isLocalGrid) {
          this._itemsPerPage = pagination.pageSize;
        } else {
          this._itemsPerPage = +((this._backendServiceApi && this._backendServiceApi.options && this._backendServiceApi.options.paginationOptions && this._backendServiceApi.options.paginationOptions.first) ? this._backendServiceApi.options.paginationOptions.first : pagination.pageSize);
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
    const currentPagination = this.getCurrentPagination();
    this.sharedService.currentPagination = currentPagination;

    if (triggerChangedEvent && !isequal(previousPagination, currentPagination)) {
      this.pubSubService.publish(`onPaginationChanged`, this.getFullPagination());
    }
    this.sharedService.currentPagination = this.getCurrentPagination();
  }

  /** Reset the Pagination to first page and recalculate necessary numbers */
  resetPagination(triggerChangedEvent = true) {
    if (this._isLocalGrid) {
      // on a local grid we also need to reset the DataView paging to 1st page
      this.dataView.setPagingOptions({ pageSize: this._itemsPerPage, pageNum: 0 });
    }
    this.refreshPagination(true, triggerChangedEvent);
  }

  /**
   * Toggle the Pagination (show/hide), it will use the visible if defined else it will automatically inverse when called without argument
   *
   * IMPORTANT NOTE:
   * The Pagination must be created on initial page load, then only after can you toggle it.
   * Basically this method WILL NOT WORK to show the Pagination if it was not there from the start.
   */
  togglePaginationVisibility(visible?: boolean) {
    if (this.grid && this.sharedService && this.sharedService.gridOptions) {
      const isVisible = visible !== undefined ? visible : !this.sharedService.gridOptions.enablePagination;
      this.sharedService.gridOptions.enablePagination = isVisible;
      this.pubSubService.publish(`onPaginationVisibilityChanged`, { visible: isVisible });

      // make sure to reset the Pagination and go back to first page to avoid any issues with Pagination being offset
      if (isVisible) {
        this.goToFirstPage();
      }

      // when using a local grid, we can reset the DataView pagination by changing its page size
      // page size of 0 would show all, hence cancel the pagination
      if (this._isLocalGrid) {
        const pageSize = visible ? this._itemsPerPage : 0;
        this.dataView.setPagingOptions({ pageSize, pageNum: 0 });
      }
    }
  }

  processOnPageChanged(pageNumber: number, event?: Event | undefined): Promise<any> {
    return new Promise((resolve, reject) => {
      this.recalculateFromToIndexes();

      if (this._isLocalGrid) {
        this.dataView.setPagingOptions({ pageSize: this._itemsPerPage, pageNum: (pageNumber - 1) }); // dataView page starts at 0 instead of 1
        this.pubSubService.publish(`onPaginationChanged`, this.getFullPagination());
      } else {
        const itemsPerPage = +this._itemsPerPage;

        // keep start time & end timestamps & return it after process execution
        const startTime = new Date();

        // run any pre-process, if defined, for example a spinner
        if (this._backendServiceApi && this._backendServiceApi.preProcess) {
          this._backendServiceApi.preProcess();
        }

        if (this._backendServiceApi && this._backendServiceApi.process) {
          const query = this._backendServiceApi.service.processOnPaginationChanged(event, { newPage: pageNumber, pageSize: itemsPerPage });

          // the processes can be Promises
          const process = this._backendServiceApi.process(query);
          if (process instanceof Promise) {
            process
              .then((processResult: any) => {
                executeBackendProcessesCallback(startTime, processResult, this._backendServiceApi, this._totalItems);
                resolve(this.getFullPagination());
              })
              .catch((error) => {
                onBackendError(error, this._backendServiceApi);
                reject(process);
              });
          }
        }
        this.pubSubService.publish(`onPaginationChanged`, this.getFullPagination());
      }
    });
  }

  recalculateFromToIndexes() {
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
    if (this._totalItems > 0 && this._pageNumber === 0) {
      this._pageNumber = 1;
    }

    // do a final check on the From/To and make sure they are not over or below min/max acceptable values
    if (this._dataTo > this._totalItems) {
      this._dataTo = this._totalItems;
    } else if (this._totalItems < this._itemsPerPage) {
      this._dataTo = this._totalItems;
    }
  }

  // --
  // private functions
  // --------------------

  /**
   * When item is added or removed, we will refresh the numbers on the pagination however we won't trigger a backend change
   * This will have a side effect though, which is that the "To" count won't be matching the "items per page" count,
   * that is a necessary side effect to avoid triggering a backend query just to refresh the paging,
   * basically we assume that this offset is fine for the time being,
   * until user does an action which will refresh the data hence the pagination which will then become normal again
   */
  private processOnItemAddedOrRemoved(items: any | any[], isItemAdded = true) {
    if (items !== null) {
      const previousDataTo = this._dataTo;
      const itemCount = Array.isArray(items) ? items.length : 1;
      const itemCountWithDirection = isItemAdded ? +itemCount : -itemCount;

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
