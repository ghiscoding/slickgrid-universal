import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { PaginationService } from './../pagination.service';
import { SharedService } from '../shared.service';
import type { BackendUtilityService } from '../backendUtility.service';
import type { BackendServiceApi, Column, CursorPageInfo, GridOption, Pagination } from '../../interfaces/index';
import { type SlickDataView, SlickEvent, SlickEventData, type SlickGrid } from '../../core/index';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub';

vi.useFakeTimers();

const fnCallbacks = {};
const mockPubSub = {
  publish: vi.fn(),
  subscribe: (eventName, fn) => {
    const eventNames = Array.isArray(eventName) ? eventName : [eventName];
    eventNames.forEach(eventName => fnCallbacks[eventName] = fn);
  },
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
};
vi.mock('@slickgrid-universal/event-pub-sub', () => ({
  BasePubSubService: () => mockPubSub
}));

const backendUtilityServiceStub = {
  executeBackendProcessesCallback: vi.fn(),
  executeBackendCallback: vi.fn(),
  onBackendError: vi.fn(),
  refreshBackendDataset: vi.fn(),
} as unknown as BackendUtilityService;

const dataviewStub = {
  onPagingInfoChanged: new SlickEvent(),
  onRowCountChanged: new SlickEvent(),
  onRowsChanged: new SlickEvent(),
  setPagingOptions: vi.fn(),
  setRefreshHints: vi.fn(),
} as unknown as SlickDataView;

const mockBackendService = {
  resetPaginationOptions: vi.fn(),
  buildQuery: vi.fn(),
  updateOptions: vi.fn(),
  processOnFilterChanged: vi.fn(),
  processOnSortChanged: vi.fn(),
  processOnPaginationChanged: vi.fn(),
};

const mockGridOption = {
  enableAutoResize: true,
  enablePagination: true,
  backendServiceApi: {
    service: mockBackendService,
    process: vi.fn(),
    options: {
      columnDefinitions: [{ id: 'name', field: 'name' }] as Column[],
      datasetName: 'user',
    }
  },
  pagination: {
    pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100],
    pageSize: 25,
    totalItems: 85
  }
} as GridOption;

const mockGridOptionWithCursorPaginationBackend = {
  ...mockGridOption,
  backendServiceApi: {
    service: mockBackendService,
    process: vi.fn(),
    options: {
      columnDefinitions: [{ id: 'name', field: 'name' }] as Column[],
      datasetName: 'user',
      useCursor: true,
    }
  },
} as GridOption;

const mockCursorPageInfo = {
  startCursor: "b", endCursor: "c", hasNextPage: true, hasPreviousPage: true, // b-c simulates page 2
} as CursorPageInfo;

const gridStub = {
  autosizeColumns: vi.fn(),
  getColumnIndex: vi.fn(),
  getData: () => dataviewStub,
  getOptions: () => mockGridOption,
  getColumns: vi.fn(),
  setColumns: vi.fn(),
  setOptions: vi.fn(),
  onColumnsReordered: vi.fn(),
  onColumnsResized: vi.fn(),
  registerPlugin: vi.fn(),
  scrollTo: vi.fn(),
} as unknown as SlickGrid;

describe('PaginationService', () => {
  let service: PaginationService;
  let sharedService: SharedService;
  let rxjsResourceStub: RxJsResourceStub;

  beforeEach(() => {
    sharedService = new SharedService();
    rxjsResourceStub = new RxJsResourceStub();
    service = new PaginationService(mockPubSub, sharedService, backendUtilityServiceStub, rxjsResourceStub);
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(mockGridOption);
  });

  afterEach(() => {
    mockGridOption.pagination!.pageSize = 25;
    mockGridOption.pagination!.pageNumber = 2;
    mockGridOption.pagination!.totalItems = 85;
    service.dispose();
    vi.clearAllMocks();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize the service and call "refreshPagination" and trigger "onPaginationChanged" event', () => {
    const refreshSpy = vi.spyOn(service, 'refreshPagination');
    service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);

    expect(service.paginationOptions).toEqual(mockGridOption.pagination);
    expect(refreshSpy).toHaveBeenCalled();
    expect(service.getCurrentPageNumber()).toBe(2);
  });

  it('should initialize the service and be able to change the grid options by the SETTER and expect the GETTER to have updated options', () => {
    service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
    service.paginationOptions = mockGridOption.pagination as Pagination;

    expect(service.paginationOptions).toEqual(mockGridOption.pagination);
    expect(service.getCurrentPageNumber()).toBe(2);
  });

  it('should initialize the service and be able to change the totalItems by the SETTER and not expect the "refreshPagination" method to be called within the SETTER before initialization', () => {
    const spy = vi.spyOn(service, 'refreshPagination');
    service.totalItems = 125;
    service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);

    expect(service.totalItems).toEqual(125);
    expect(service.getCurrentPageNumber()).toBe(2);
    expect(spy).toHaveBeenCalledWith(false, false, true);
  });

  it('should be able to change the totalItems by the SETTER after the initialization and expect the "refreshPagination" method to be called', () => {
    const spy = vi.spyOn(service, 'refreshPagination');
    service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
    service.totalItems = 125;

    expect(service.totalItems).toEqual(125);
    expect(service.getCurrentPageNumber()).toBe(2);
    expect(spy).toHaveBeenCalledTimes(2); // called 2x times inside the init() and SETTER
  });

  describe('Getters and Setters', () => {
    it('should get the availablePageSizes and equal the one defined in the grid options pagination', () => {
      mockGridOption.pagination!.pageSizes = [5, 10, 15, 20];
      service.init(gridStub, mockGridOption.pagination as Pagination);
      expect(service.availablePageSizes).toEqual(mockGridOption.pagination!.pageSizes);
    });

    it('should get the itemsPerPage and equal the one defined in the grid options pagination', () => {
      mockGridOption.pagination!.pageSize = 20;
      service.init(gridStub, mockGridOption.pagination as Pagination);
      expect(service.itemsPerPage).toEqual(mockGridOption.pagination!.pageSize);
    });

    it('should get the pageCount and equal the one defined in the grid options pagination', () => {
      service.init(gridStub, mockGridOption.pagination as Pagination);
      expect(service.pageCount).toEqual(4); // since totalItems is 85 and our pageSize is 20/page
    });

    it('should get the pageNumber and equal the one defined in the grid options pagination', () => {
      mockGridOption.pagination!.pageNumber = 3;
      service.init(gridStub, mockGridOption.pagination as Pagination);
      expect(service.pageNumber).toEqual(mockGridOption.pagination!.pageNumber);
    });
  });

  describe('changeItemPerPage method', () => {
    it('should be on page 0 when total items is 0', () => {
      mockGridOption.pagination!.totalItems = 0;
      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.changeItemPerPage(30);

      expect(service.getCurrentPageNumber()).toBe(0);
      expect(service.getCurrentItemPerPage()).toBe(30);
    });

    it('should be on page 1 with 2 pages when total items is 51 and we set 50 per page', () => {
      mockGridOption.pagination!.pageSize = 25;
      mockGridOption.pagination!.pageNumber = 2;
      mockGridOption.pagination!.totalItems = 51;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.changeItemPerPage(50);

      expect(service.getCurrentPageNumber()).toBe(1);
      expect(service.getCurrentItemPerPage()).toBe(50);
    });

    it('should be on page 1 with 2 pages when total items is 100 and we set 50 per page', () => {
      mockGridOption.pagination!.pageSize = 25;
      mockGridOption.pagination!.pageNumber = 2;
      mockGridOption.pagination!.totalItems = 100;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.changeItemPerPage(50);

      expect(service.getCurrentPageNumber()).toBe(1);
      expect(service.getCurrentItemPerPage()).toBe(50);
    });
  });

  describe('goToFirstPage method', () => {
    it('should be able to change isCursorBased flag by calling setCursorBased()', () => {
      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);

      service.setCursorBased(true);
      expect(service.isCursorBased).toBeTruthy();

      service.setCursorBased(false);
      expect(service.isCursorBased).toBeFalsy();
    });

    it('should expect current page to be 1 and "processOnPageChanged" method to be called', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');
      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToFirstPage();

      expect(service.dataFrom).toBe(1);
      expect(service.dataTo).toBe(25);
      expect(service.getCurrentPageNumber()).toBe(1);
      expect(spy).toHaveBeenCalledWith(1, undefined);
    });

    it('should expect current page to be 1 and "processOnPageChanged" method to be called with cursorArgs when backend service is cursor based', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');
      service.init(gridStub, mockGridOptionWithCursorPaginationBackend.pagination as Pagination, mockGridOptionWithCursorPaginationBackend.backendServiceApi);
      service.setCursorPageInfo(mockCursorPageInfo);
      service.goToFirstPage();

      expect(service.dataFrom).toBe(1);
      expect(service.dataTo).toBe(25);
      expect(service.getCurrentPageNumber()).toBe(1);
      expect(spy).toHaveBeenCalledWith(1, undefined, { first: 25, newPage: 1, pageSize: 25 });
    });

    it('should expect current page to be 1 and "processOnPageChanged" method NOT to be called', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');
      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToFirstPage(null, false);

      expect(service.getCurrentPageNumber()).toBe(1);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('goToLastPage method', () => {
    it('should call "goToLastPage" method and expect current page to be last page and "processOnPageChanged" method to be called', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToLastPage();

      expect(service.dataFrom).toBe(76);
      expect(service.dataTo).toBe(85);
      expect(service.getCurrentPageNumber()).toBe(4);
      expect(spy).toHaveBeenCalledWith(4, undefined);
    });

    it('should call "goToLastPage" method and expect current page to be last page and "processOnPageChanged" method to be called with cursorArgs when backend service is cursor based', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOptionWithCursorPaginationBackend.pagination as Pagination, mockGridOptionWithCursorPaginationBackend.backendServiceApi);
      service.setCursorPageInfo(mockCursorPageInfo);
      service.goToLastPage();

      expect(service.dataFrom).toBe(76);
      expect(service.dataTo).toBe(85);
      expect(service.getCurrentPageNumber()).toBe(4);
      expect(spy).toHaveBeenCalledWith(4, undefined, { last: 25, newPage: 4, pageSize: 25 });
    });

    it('should call "goToLastPage" method and expect current page to be last page and "processOnPageChanged" method NOT to be called', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToLastPage(null, false);

      expect(service.getCurrentPageNumber()).toBe(4);
      expect(spy).not.toHaveBeenCalledWith();
    });
  });

  describe('goToNextPage method', () => {
    it('should expect page to increment by 1 and "processOnPageChanged" method to be called', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToNextPage();

      expect(service.dataFrom).toBe(51);
      expect(service.dataTo).toBe(75);
      expect(service.getCurrentPageNumber()).toBe(3);
      expect(spy).toHaveBeenCalledWith(3, undefined);
    });

    it('should expect page to increment by 1 and "processOnPageChanged" method to be called with cursorArgs when backend service is cursor based', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOptionWithCursorPaginationBackend.pagination as Pagination, mockGridOptionWithCursorPaginationBackend.backendServiceApi);
      service.setCursorPageInfo(mockCursorPageInfo);
      service.goToNextPage();

      expect(service.dataFrom).toBe(51);
      expect(service.dataTo).toBe(75);
      expect(service.getCurrentPageNumber()).toBe(3);
      expect(spy).toHaveBeenCalledWith(3, undefined, { first: 25, after: "c", newPage: 3, pageSize: 25 });
    });

    it('should expect page to increment by 1 and "processOnPageChanged" method NOT to be called', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToNextPage(null, false);

      expect(service.getCurrentPageNumber()).toBe(3);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not expect "processOnPageChanged" method to be called when we are already on last page', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');
      mockGridOption.pagination!.pageNumber = 4;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToNextPage();

      expect(service.dataFrom).toBe(76);
      expect(service.dataTo).toBe(85);
      expect(service.getCurrentPageNumber()).toBe(4);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('goToPreviousPage method', () => {
    it('should expect page to decrement by 1 and "processOnPageChanged" method to be called', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToPreviousPage();

      expect(service.dataFrom).toBe(1);
      expect(service.dataTo).toBe(25);
      expect(service.getCurrentPageNumber()).toBe(1);
      expect(spy).toHaveBeenCalledWith(1, undefined);
    });

    it('should expect page to decrement by 1 and "processOnPageChanged" method to be called  with cursorArgs when backend service is cursor based', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOptionWithCursorPaginationBackend.pagination as Pagination, mockGridOptionWithCursorPaginationBackend.backendServiceApi);
      service.setCursorPageInfo(mockCursorPageInfo);
      service.goToPreviousPage();

      expect(service.dataFrom).toBe(1);
      expect(service.dataTo).toBe(25);
      expect(service.getCurrentPageNumber()).toBe(1);
      expect(spy).toHaveBeenCalledWith(1, undefined, { last: 25, before: "b", newPage: 1, pageSize: 25 });
    });

    it('should expect page to decrement by 1 and "processOnPageChanged" method NOT to be called', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOptionWithCursorPaginationBackend.pagination as Pagination, mockGridOptionWithCursorPaginationBackend.backendServiceApi);
      service.goToPreviousPage(null, false);

      expect(service.getCurrentPageNumber()).toBe(1);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not expect "processOnPageChanged" method to be called when we are already on first page', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');
      mockGridOption.pagination!.pageNumber = 1;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToPreviousPage();

      expect(service.dataFrom).toBe(1);
      expect(service.dataTo).toBe(25);
      expect(service.getCurrentPageNumber()).toBe(1);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('goToPageNumber', () => {
    it('should expect page to decrement by 1 and "processOnPageChanged" method to be called', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToPageNumber(4);

      expect(service.dataFrom).toBe(76);
      expect(service.dataTo).toBe(85);
      expect(service.getCurrentPageNumber()).toBe(4);
      expect(spy).toHaveBeenCalledWith(4, undefined);
    });

    it('should expect to go to page 1 when input number is below 1', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToPageNumber(0);

      expect(service.dataFrom).toBe(1);
      expect(service.dataTo).toBe(25);
      expect(service.getCurrentPageNumber()).toBe(1);
      expect(spy).toHaveBeenCalledWith(1, undefined);
    });

    it('should expect to go to last page (4) when input number is bigger than the last page number', () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToPageNumber(10);

      expect(service.dataFrom).toBe(76);
      expect(service.dataTo).toBe(85);
      expect(service.getCurrentPageNumber()).toBe(4);
      expect(spy).toHaveBeenCalledWith(4, undefined);
    });

    it('should not expect "processOnPageChanged" method to be called when we are already on same page', async () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');
      mockGridOption.pagination!.pageNumber = 2;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      const output = await service.goToPageNumber(2);

      expect(service.dataFrom).toBe(26);
      expect(service.dataTo).toBe(50);
      expect(service.getCurrentPageNumber()).toBe(2);
      expect(spy).not.toHaveBeenCalled();
      expect(output).toBeFalsy();
    });

    it('should not expect "processOnPageChanged" method to be called when backend service is cursor based', async () => {
      const spy = vi.spyOn(service, 'processOnPageChanged');
      service.setCursorPageInfo(mockCursorPageInfo);
      service.init(gridStub, mockGridOptionWithCursorPaginationBackend.pagination as Pagination, mockGridOptionWithCursorPaginationBackend.backendServiceApi);

      const output = await service.goToPageNumber(3);

      // stay on current page
      expect(service.dataFrom).toBe(26);
      expect(service.dataTo).toBe(50);
      expect(service.getCurrentPageNumber()).toBe(2);
      expect(spy).not.toHaveBeenCalled();
      expect(output).toBeFalsy();
    });
  });

  describe('processOnPageChanged method', () => {
    beforeEach(() => {
      mockGridOption.backendServiceApi = {
        service: mockBackendService,
        process: vi.fn(),
        options: {
          columnDefinitions: [{ id: 'name', field: 'name' }] as Column[],
          datasetName: 'user',
        },
        onError: vi.fn(),
      };
    });

    afterEach(() => {
      vi.clearAllMocks();
      vi.spyOn(mockPubSub, 'publish').mockReturnValue(true);
    });

    it('should execute "preProcess" method when defined', () => {
      const spy = vi.fn();
      mockGridOption.backendServiceApi!.preProcess = spy;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.processOnPageChanged(1);

      expect(spy).toHaveBeenCalled();
    });

    it('should NOT execute anything and return a Promise with Pagination before calling the change', async () => {
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish').mockReturnValue(false);

      const preProcessSpy = vi.fn();
      mockGridOption.backendServiceApi!.preProcess = preProcessSpy;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      const output = await service.processOnPageChanged(1);

      expect(output).toBeTruthy();
      expect(pubSubSpy).toHaveBeenCalled();
      expect(preProcessSpy).not.toHaveBeenCalled();
    });

    it('should execute "process" method and catch error when process Promise rejects and there is no "onError" defined', async () => {
      const mockError = { error: '404' };
      const postSpy = vi.fn();
      mockGridOption.backendServiceApi!.process = postSpy;
      mockGridOption.backendServiceApi!.onError = undefined;
      vi.spyOn(mockBackendService, 'processOnPaginationChanged').mockReturnValue('backend query');
      vi.spyOn(mockGridOption.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(Promise.reject(mockError));
      const backendErrorSpy = vi.spyOn(backendUtilityServiceStub, 'onBackendError');

      try {
        service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
        await service.processOnPageChanged(1);
      } catch (e) {
        expect(backendErrorSpy).toHaveBeenCalledWith(mockError, mockGridOption.backendServiceApi);
      }
    });

    it('should execute "process" method and catch error when process Observable fails', async () => {
      const mockError = 'observable error';
      const postSpy = vi.fn();
      mockGridOption.backendServiceApi!.onError = undefined;
      mockGridOption.backendServiceApi!.process = postSpy;
      vi.spyOn(mockBackendService, 'processOnPaginationChanged').mockReturnValue('backend query');
      vi.spyOn(mockGridOption.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(throwError(mockError));
      const backendErrorSpy = vi.spyOn(backendUtilityServiceStub, 'onBackendError');

      try {
        service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
        await service.processOnPageChanged(1);
      } catch (e) {
        expect(backendErrorSpy).toHaveBeenCalledWith(mockError, mockGridOption.backendServiceApi);
      }
    });

    it('should execute "process" method when defined as a Promise', async () => {
      const backendExecuteSpy = vi.spyOn(backendUtilityServiceStub, 'executeBackendProcessesCallback');
      vi.spyOn(mockBackendService, 'processOnPaginationChanged').mockReturnValue('backend query');
      const now = new Date();
      const processResult = { users: [{ name: 'John' }], metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 } };
      const postSpy = vi.fn(() => Promise.resolve(processResult));
      mockGridOption.backendServiceApi!.process = postSpy;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.processOnPageChanged(1);

      vi.runAllTimers();
      await new Promise(process.nextTick);

      expect(postSpy).toHaveBeenCalled();
      expect(backendExecuteSpy).toHaveBeenCalledWith(expect.any(Date), processResult, mockGridOption.backendServiceApi as BackendServiceApi, 85);
    });

    it('should execute "process" method when defined as an Observable', async () => {
      const backendExecuteSpy = vi.spyOn(backendUtilityServiceStub, 'executeBackendProcessesCallback');
      vi.spyOn(mockBackendService, 'processOnPaginationChanged').mockReturnValue('backend query');
      const now = new Date();
      const processResult = { users: [{ name: 'John' }], metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 } };
      const postSpy = vi.fn(() => of(processResult));
      mockGridOption.backendServiceApi!.process = postSpy;

      service.addRxJsResource(rxjsResourceStub);
      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.processOnPageChanged(1);

      vi.runAllTimers();
      await new Promise(process.nextTick);

      expect(postSpy).toHaveBeenCalled();
      expect(backendExecuteSpy).toHaveBeenCalledWith(expect.any(Date), processResult, mockGridOption.backendServiceApi as BackendServiceApi, 85);
    });

    it('should call "setPagingOptions" from the DataView and trigger "onPaginationChanged" when using a Local Grid', () => {
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const setPagingSpy = vi.spyOn(dataviewStub, 'setPagingOptions');

      mockGridOption.backendServiceApi = null as any;
      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.processOnPageChanged(1);

      expect(setPagingSpy).toHaveBeenCalledWith({ pageSize: 25, pageNum: 0 });
      expect(pubSubSpy).toHaveBeenCalledWith(`onPaginationChanged`, {
        dataFrom: 26, dataTo: 50, pageSize: 25, pageCount: 4, pageNumber: 2, totalItems: 85, pageSizes: mockGridOption.pagination!.pageSizes,
      });
    });
  });

  describe('recalculateFromToIndexes method', () => {
    it('should recalculate the From/To as 0 when total items is 0', () => {
      mockGridOption.pagination!.pageSize = 25;
      mockGridOption.pagination!.pageNumber = 2;
      mockGridOption.pagination!.totalItems = 0;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.recalculateFromToIndexes();

      expect(service.dataFrom).toBe(0);
      expect(service.dataTo).toBe(0);
    });

    it('should recalculate the From/To within range', () => {
      mockGridOption.pagination!.pageSize = 25;
      mockGridOption.pagination!.pageNumber = 2;
      mockGridOption.pagination!.totalItems = 85;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.recalculateFromToIndexes();

      expect(service.dataFrom).toBe(26);
      expect(service.dataTo).toBe(50);
    });

    it('should recalculate the From/To within range and have the To equal the total items when total items is not a modulo of 1', () => {
      mockGridOption.pagination!.pageSize = 25;
      mockGridOption.pagination!.pageNumber = 4;
      mockGridOption.pagination!.totalItems = 85;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.recalculateFromToIndexes();

      expect(service.dataFrom).toBe(76);
      expect(service.dataTo).toBe(85);
    });
  });

  describe('refreshPagination method', () => {
    beforeEach(() => {
      mockGridOption.backendServiceApi = {
        service: mockBackendService,
        process: vi.fn(),
        options: {
          columnDefinitions: [{ id: 'name', field: 'name' }] as Column[],
          datasetName: 'user',
        }
      };
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should throw an error when backendServiceApi is defined without a "process" method', () => new Promise((done: any) => {
      try {
        mockGridOption.backendServiceApi = {} as BackendServiceApi;
        service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
        service.refreshPagination();
      } catch (e) {
        expect(e.toString()).toContain(`BackendServiceApi requires the following 2 properties "process" and "service" to be defined.`);
        done();
      }
    }));

    it('should call refreshPagination when "onFilterCleared" is triggered and Pagination is enabled', () => {
      const resetSpy = vi.spyOn(service, 'resetPagination');
      const refreshSpy = vi.spyOn(service, 'refreshPagination');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onFilterCleared'](true);

      expect(resetSpy).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalledWith(true, true);
    });

    it('should call refreshPagination when "onFilterChanged" is triggered and Pagination is enabled', () => {
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const resetSpy = vi.spyOn(service, 'resetPagination');
      const refreshSpy = vi.spyOn(service, 'refreshPagination');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onFilterChanged']({ columnId: 'field1', operator: '=', searchTerms: [] });

      expect(pubSubSpy).toHaveBeenCalledWith('onPaginationChanged', {
        dataFrom: 1, dataTo: 25, pageCount: 4, pageNumber: 1, pageSize: 25, pageSizes: [5, 10, 15, 20], totalItems: 85
      });
      expect(resetSpy).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalledWith(true, true);
    });

    it('should call reset and refreshPagination when "onSortChanged" is triggered and Infinite Scroll is enabled', () => {
      const resetSpy = vi.spyOn(service, 'resetPagination');
      const refreshSpy = vi.spyOn(service, 'refreshPagination');
      mockGridOption.backendServiceApi!.options.infiniteScroll = true;

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onSortChanged'](true);

      expect(resetSpy).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalledWith(true, true);
    });
  });

  describe('resetPagination method', () => {
    it('should call "refreshPagination" with 2 arguments True when calling the method', () => {
      const spy = vi.spyOn(service, 'refreshPagination');
      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.resetPagination();

      expect(spy).toHaveBeenCalledWith(true, true);
    });

    it('should call "refreshPagination" with True and False arguments when calling the method with False being passed as input argument', () => {
      const spy = vi.spyOn(service, 'refreshPagination');
      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.resetPagination(false);

      expect(spy).toHaveBeenCalledWith(true, false);
    });

    it('should reset the DataView when using local grid by calling "setPagingOptions" with page 0 and also call "refreshPagination" method', () => {
      const gridOptionsMock = { enablePagination: true };
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      const spy = vi.spyOn(service, 'refreshPagination');
      const setPagingSpy = vi.spyOn(dataviewStub, 'setPagingOptions');

      mockGridOption.backendServiceApi = null as any;
      service.init(gridStub, mockGridOption.pagination as Pagination, null as any);
      service.resetPagination();

      expect(setPagingSpy).toHaveBeenCalledWith({ pageSize: 25, pageNum: 0 });
      expect(spy).toHaveBeenCalledWith(true, true);
    });

    it('should NOT reset the DataView "setPagingOptions" when Pagination is NOT enabled', () => {
      const gridOptionsMock = { enablePagination: false };
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      const spy = vi.spyOn(service, 'refreshPagination');
      const setPagingSpy = vi.spyOn(dataviewStub, 'setPagingOptions');

      mockGridOption.backendServiceApi = null as any;
      service.init(gridStub, mockGridOption.pagination as Pagination, null as any);
      service.resetPagination();

      expect(setPagingSpy).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(true, true);
    });
  });

  describe('resetToPreviousPagination method', () => {
    it('should call "changeItemPerPage" when page size is different', () => {
      const changeItemSpy = vi.spyOn(service, 'changeItemPerPage');
      const refreshSpy = vi.spyOn(service, 'refreshPagination');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.changeItemPerPage(100, null, false); // change without triggering event to simulate a change
      service.resetToPreviousPagination();

      expect(changeItemSpy).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should call "goToPageNumber" when page size is different', () => {
      const gotoPageSpy = vi.spyOn(service, 'goToPageNumber');
      const refreshSpy = vi.spyOn(service, 'refreshPagination');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.goToPageNumber(100, null, false); // change without triggering event to simulate a change
      service.resetToPreviousPagination();

      expect(gotoPageSpy).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('setCursorBased method', () => {
    it('should call the method and expect "onPaginationSetCursorBased" to be triggered', () => {
      const setCursorSpy = vi.spyOn(service, 'setCursorPageInfo');
      const gotoFirstSpy = vi.spyOn(service, 'goToFirstPage');
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);

      service.setCursorBased(false);
      expect(setCursorSpy).toHaveBeenCalledTimes(0);
      expect(gotoFirstSpy).toHaveBeenCalledTimes(1);
      expect(pubSubSpy).toHaveBeenCalledWith('onPaginationSetCursorBased', { isCursorBased: false });

      service.setCursorBased(true);
      expect(setCursorSpy).toHaveBeenCalledTimes(1);
      expect(gotoFirstSpy).toHaveBeenCalledTimes(2);
      expect(pubSubSpy).toHaveBeenCalledWith('onPaginationSetCursorBased', { isCursorBased: true });
    });
  });

  // processOnItemAddedOrRemoved is private but we can spy on recalculateFromToIndexes
  describe('processOnItemAddedOrRemoved private method', () => {
    afterEach(() => {
      mockGridOption.pagination!.pageSize = 25;
      mockGridOption.pagination!.pageNumber = 2;
      mockGridOption.pagination!.totalItems = 85;
      vi.clearAllMocks();
    });

    it('should call "processOnItemAddedOrRemoved" and expect the (To) to be incremented by 1 when "onItemAdded" is triggered with a single item', () => {
      const mockItems = { name: 'John' };
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const recalculateSpy = vi.spyOn(service, 'recalculateFromToIndexes');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onItemAdded'](mockItems);

      expect(recalculateSpy).toHaveBeenCalledTimes(2);
      expect(pubSubSpy).toHaveBeenCalledWith(`onPaginationChanged`, {
        dataFrom: 26, dataTo: (50 + 1), pageSize: 25, pageCount: 4, pageNumber: 2, totalItems: (85 + 1), pageSizes: mockGridOption.pagination!.pageSizes
      });
      expect(service.dataFrom).toBe(26);
      expect(service.dataTo).toBe(50 + 1);
    });

    it('should call "processOnItemAddedOrRemoved" and expect the (To) to be incremented by 2 when "onItemAdded" is triggered with an array of 2 new items', () => {
      const mockItems = [{ name: 'John' }, { name: 'Jane' }];
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const recalculateSpy = vi.spyOn(service, 'recalculateFromToIndexes');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onItemAdded'](mockItems);

      expect(recalculateSpy).toHaveBeenCalledTimes(2);
      expect(pubSubSpy).toHaveBeenCalledWith(`onPaginationChanged`, {
        dataFrom: 26, dataTo: (50 + mockItems.length), pageSize: 25, pageCount: 4, pageNumber: 2, totalItems: (85 + mockItems.length), pageSizes: mockGridOption.pagination!.pageSizes
      });
      expect(service.dataFrom).toBe(26);
      expect(service.dataTo).toBe(50 + mockItems.length);
    });

    it('should call "processOnItemAddedOrRemoved" and expect not onPaginationChanged to be triggered and the (To) to remain the same when "onItemAdded" is triggered without any items', () => {
      const recalculateSpy = vi.spyOn(service, 'recalculateFromToIndexes');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onItemAdded'](null);

      expect(recalculateSpy).toHaveBeenCalledTimes(1);
      expect(service.dataFrom).toBe(26);
      expect(service.dataTo).toBe(50);
    });

    it('should call "processOnItemAddedOrRemoved" and expect the (To) to be decremented by 2 when "onItemDeleted" is triggered with a single item', () => {
      const mockItems = { name: 'John' };
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const recalculateSpy = vi.spyOn(service, 'recalculateFromToIndexes');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onItemDeleted'](mockItems);

      // called 2x times by init() then by processOnItemAddedOrRemoved()
      expect(recalculateSpy).toHaveBeenCalledTimes(2);
      expect(pubSubSpy).toHaveBeenCalledWith(`onPaginationChanged`, {
        dataFrom: 26, dataTo: (50 - 1), pageSize: 25, pageCount: 4, pageNumber: 2, totalItems: (85 - 1), pageSizes: mockGridOption.pagination!.pageSizes
      });
      expect(service.dataFrom).toBe(26);
      expect(service.dataTo).toBe(50 - 1);
    });

    it('should call "processOnItemAddedOrRemoved" and expect the (To) to be decremented by 2 when "onItemDeleted" is triggered with an array of 2 new items', () => {
      const mockItems = [{ name: 'John' }, { name: 'Jane' }];
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const recalculateSpy = vi.spyOn(service, 'recalculateFromToIndexes');

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onItemDeleted'](mockItems);

      expect(recalculateSpy).toHaveBeenCalledTimes(2); // called 2x times by init() then by processOnItemAddedOrRemoved()
      expect(pubSubSpy).toHaveBeenCalledWith(`onPaginationChanged`, {
        dataFrom: 26, dataTo: (50 - mockItems.length), pageSize: 25, pageCount: 4, pageNumber: 2, totalItems: (85 - mockItems.length), pageSizes: mockGridOption.pagination!.pageSizes
      });
    });

    it('should call "processOnItemAddedOrRemoved" and expect the (To) to remain the same when "onItemDeleted" is triggered without any items', () => {
      const recalculateSpy = vi.spyOn(service, 'recalculateFromToIndexes');

      // service.totalItems = 85;
      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onItemDeleted'](null);

      // called 1x time by init() only
      expect(recalculateSpy).toHaveBeenCalledTimes(1);
      expect(service.dataFrom).toBe(26);
      expect(service.dataTo).toBe(50);
    });

    it('should call "processOnItemAddedOrRemoved" and expect the (To) to equal the total items when it is lower than the total pageSize count', () => {
      mockGridOption.pagination!.pageNumber = 4;
      mockGridOption.pagination!.totalItems = 100;
      const mockItems = { name: 'John' };

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onItemAdded'](mockItems);
      service.changeItemPerPage(200);

      expect(service.dataFrom).toBe(1);
      expect(service.dataTo).toBe(101);
    });

    it('should call "processOnItemAddedOrRemoved" and expect the (To) to equal the total items when it is higher than the total pageSize count', () => {
      mockGridOption.pagination!.pageNumber = 4;
      mockGridOption.pagination!.totalItems = 99;
      const mockItems = { name: 'John' };

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      fnCallbacks['onItemAdded'](mockItems);
      service.changeItemPerPage(100);

      expect(service.dataFrom).toBe(1);
      expect(service.dataTo).toBe(100);
    });
  });

  describe('with Local Grid', () => {
    beforeEach(() => {
      mockGridOption.pagination!.pageSize = 25;
      mockGridOption.pagination!.pageNumber = 1;
      mockGridOption.pagination!.totalItems = 85;
      mockGridOption.backendServiceApi = null as any;
    });

    it('should initialize the service and call "refreshPagination" with some DataView calls', () => {
      const refreshSpy = vi.spyOn(service, 'refreshPagination');
      const onPagingSpy = vi.spyOn(dataviewStub.onPagingInfoChanged, 'subscribe');
      const setRefreshSpy = vi.spyOn(dataviewStub, 'setRefreshHints');
      const setPagingSpy = vi.spyOn(dataviewStub, 'setPagingOptions');
      service.init(gridStub, mockGridOption.pagination as Pagination);

      vi.runAllTimers();

      expect(service.paginationOptions).toEqual(mockGridOption.pagination);
      expect(refreshSpy).toHaveBeenCalled();
      expect(onPagingSpy).toHaveBeenCalled();
      expect(setRefreshSpy).toHaveBeenCalled();
      expect(setPagingSpy).toHaveBeenCalledWith({ pageSize: 25, pageNum: 0 });
      expect(service.getCurrentPageNumber()).toBe(1);
    });

    it('should initialize the service with a page number bigger than 1 (3) and the DataView calls to set pagingInfo to page 2 (3-1)', () => {
      const refreshSpy = vi.spyOn(service, 'refreshPagination');
      const onPagingSpy = vi.spyOn(dataviewStub.onPagingInfoChanged, 'subscribe');
      const setRefreshSpy = vi.spyOn(dataviewStub, 'setRefreshHints');
      const setPagingSpy = vi.spyOn(dataviewStub, 'setPagingOptions');
      mockGridOption.pagination!.pageNumber = 3;
      service.init(gridStub, mockGridOption.pagination as Pagination);

      vi.runAllTimers();

      expect(service.paginationOptions).toEqual(mockGridOption.pagination);
      expect(refreshSpy).toHaveBeenCalled();
      expect(onPagingSpy).toHaveBeenCalled();
      expect(setRefreshSpy).toHaveBeenCalled();
      expect(setPagingSpy).toHaveBeenCalledWith({ pageSize: 25, pageNum: 2 });
      expect(service.getCurrentPageNumber()).toBe(3);
    });

    it('should change the totalItems when "onPagingInfoChanged" from the DataView is triggered with a different total', () => {
      const expectedNewTotal = 22;
      const mockSlickPagingInfo = { pageSize: 5, pageNum: 2, totalRows: expectedNewTotal, totalPages: 3, dataView: dataviewStub };

      service.init(gridStub, mockGridOption.pagination as Pagination);
      dataviewStub.onPagingInfoChanged.notify(mockSlickPagingInfo, new SlickEventData(), dataviewStub);

      expect(service.totalItems).toBe(expectedNewTotal);
    });
  });

  describe('showPagination method', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should trigger "onShowPaginationChanged" without calling the DataView when using Backend Services', () => {
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const setPagingSpy = vi.spyOn(dataviewStub, 'setPagingOptions');
      const expectedPagination = { dataFrom: 26, dataTo: 50, pageCount: 4, pageNumber: 2, pageSize: 25, pageSizes: [5, 10, 15, 20,], totalItems: 85, };
      mockGridOption.backendServiceApi = {
        service: mockBackendService,
        process: vi.fn(),
      };

      service.init(gridStub, mockGridOption.pagination as Pagination, mockGridOption.backendServiceApi);
      service.togglePaginationVisibility(false);

      expect(sharedService.gridOptions.enablePagination).toBe(false);
      expect(pubSubSpy).toHaveBeenNthCalledWith(1, `onPaginationRefreshed`, expectedPagination);
      expect(pubSubSpy).toHaveBeenNthCalledWith(2, `onPaginationPresetsInitialized`, expectedPagination);
      expect(pubSubSpy).toHaveBeenNthCalledWith(3, `onPaginationVisibilityChanged`, { visible: false });
      expect(setPagingSpy).not.toHaveBeenCalled();
    });

    it('should reset DataView Pagination when using Local Grid and ShowPagination is set to False', () => {
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const setPagingSpy = vi.spyOn(dataviewStub, 'setPagingOptions');
      mockGridOption.backendServiceApi = null as any;

      service.init(gridStub, mockGridOption.pagination as Pagination);
      service.togglePaginationVisibility(false);

      expect(sharedService.gridOptions.enablePagination).toBe(false);
      expect(pubSubSpy).toHaveBeenNthCalledWith(3, `onPaginationVisibilityChanged`, { visible: false });
      expect(setPagingSpy).toHaveBeenCalledWith({ pageSize: 0, pageNum: 0 });
    });

    it('should reset DataView Pagination when using Local Grid and also expect to back to Page 1 when re-enabling the Pagination', () => {
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const setPagingSpy = vi.spyOn(dataviewStub, 'setPagingOptions');
      const gotoSpy = vi.spyOn(service, 'goToFirstPage');
      mockGridOption.backendServiceApi = null as any;

      service.init(gridStub, mockGridOption.pagination as Pagination);
      service.togglePaginationVisibility(true);

      expect(sharedService.gridOptions.enablePagination).toBe(true);
      expect(gotoSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledWith(`onPaginationVisibilityChanged`, { visible: true });
      expect(setPagingSpy).toHaveBeenCalledWith({ pageSize: mockGridOption.pagination!.pageSize, pageNum: 0 });
    });
  });
});
