import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub.js';
import type { BackendServiceApi, GridOption } from '../../interfaces/index.js';
import { BackendUtilityService } from '../backendUtility.service.js';

vi.useFakeTimers();

const graphqlServiceMock = {
  buildQuery: vi.fn(),
  updateFilters: vi.fn(),
  updatePagination: vi.fn(),
  updateSorters: vi.fn(),
} as unknown;

describe('Backend Utility Service', () => {
  let gridOptionMock: GridOption;
  let rxjsResourceStub: RxJsResourceStub;
  let service: BackendUtilityService;

  beforeEach(() => {
    gridOptionMock = {
      enablePagination: true,
      backendServiceApi: {
        service: graphqlServiceMock,
        preProcess: vi.fn(),
        process: vi.fn(),
        postProcess: vi.fn(),
      },
      pagination: {
        pageSize: 10,
        pageSizes: [10, 25, 50],
        pageNumber: 1,
        totalItems: 0,
      },
    } as GridOption;
    rxjsResourceStub = new RxJsResourceStub();
    service = new BackendUtilityService(rxjsResourceStub);
  });

  describe('executeBackendProcessesCallback method', () => {
    it('should execute the "internalPostProcess" when it is defined', () => {
      const now = new Date();
      gridOptionMock.backendServiceApi!.internalPostProcess = vi.fn();
      const spy = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'internalPostProcess');
      service.executeBackendProcessesCallback(now, { data: {} }, gridOptionMock.backendServiceApi as BackendServiceApi, 0);

      expect(spy).toHaveBeenCalled();
    });

    it('should execute the "postProcess" when it is defined and add some metrics to the object', () => {
      const now = new Date();
      const mockResult = { data: { users: [{ firstName: 'John', lastName: 'Doe' }] } };
      const expectaction = {
        data: { users: [{ firstName: 'John', lastName: 'Doe' }] },
        metrics: {
          startTime: now,
          endTime: expect.any(Date),
          executionTime: expect.any(Number),
          itemCount: 1,
          totalItemCount: 1,
        },
      };
      gridOptionMock.backendServiceApi!.postProcess = vi.fn();
      gridOptionMock.pagination = { totalItems: 1, pageSizes: [10, 25], pageSize: 10 };

      const spy = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'postProcess');
      service.executeBackendProcessesCallback(now, mockResult, gridOptionMock.backendServiceApi as BackendServiceApi, 1);

      expect(spy).toHaveBeenCalledWith(expectaction);
    });

    it('should execute the service "postProcess" when it is defined', () => {
      const now = new Date();
      gridOptionMock.backendServiceApi!.service.postProcess = vi.fn();
      const spy = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'postProcess');
      service.executeBackendProcessesCallback(now, { data: {} }, gridOptionMock.backendServiceApi as BackendServiceApi, 0);

      expect(spy).toHaveBeenCalled();
    });

    it('should execute the service "postProcess" when it is defined', () => {
      const now = new Date();
      gridOptionMock.backendServiceApi!.service.postProcess = vi.fn();
      const spy = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'postProcess');
      service.executeBackendProcessesCallback(now, { data: {} }, gridOptionMock.backendServiceApi as BackendServiceApi, 0);

      expect(spy).toHaveBeenCalled();
    });

    it('should execute the service "postProcess" and infinite scroll when it is defined', () => {
      const now = new Date();
      gridOptionMock.backendServiceApi!.service.postProcess = vi.fn();
      gridOptionMock.backendServiceApi!.service.options = {
        infiniteScroll: true,
      };
      const spy = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'postProcess');
      service.executeBackendProcessesCallback(now, { data: {} }, gridOptionMock.backendServiceApi as BackendServiceApi, 0);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onBackendError method', () => {
    it('should run the "onError" callback method when provided', () => {
      gridOptionMock.backendServiceApi!.onError = vi.fn();
      const spy = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'onError');

      service.onBackendError('some error', gridOptionMock.backendServiceApi!);

      expect(spy).toHaveBeenCalled();
    });

    it('should throw back the error when callback was provided', () => {
      gridOptionMock.backendServiceApi!.onError = undefined;
      expect(() => service.onBackendError('some error', gridOptionMock.backendServiceApi!)).toThrow();
    });
  });

  describe('refreshBackendDataset method', () => {
    it('should call "executeBackendCallback" after calling the "refreshBackendDataset" method with Pagination', () => {
      const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
      const querySpy = vi.spyOn(gridOptionMock.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
      const executeSpy = vi.spyOn(service, 'executeBackendCallback');

      service.refreshBackendDataset(gridOptionMock);

      expect(querySpy).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalledWith(
        gridOptionMock.backendServiceApi as BackendServiceApi,
        query,
        null,
        expect.any(Date),
        gridOptionMock.pagination!.totalItems
      );
    });

    it('should call "executeBackendCallback" after calling the "refreshBackendDataset" method without Pagination (when disabled)', () => {
      gridOptionMock.enablePagination = false;
      const query = `query { users { id,name,gender,company } }`;
      const querySpy = vi.spyOn(gridOptionMock.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
      const executeSpy = vi.spyOn(service, 'executeBackendCallback');

      service.refreshBackendDataset(gridOptionMock);

      expect(querySpy).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalledWith(
        gridOptionMock.backendServiceApi as BackendServiceApi,
        query,
        null,
        expect.any(Date),
        gridOptionMock.pagination!.totalItems
      );
    });

    it('should throw an error when backendServiceApi is undefined', () =>
      new Promise((done: any) => {
        gridOptionMock.enablePagination = true;
        try {
          gridOptionMock.backendServiceApi = undefined;
          service.refreshBackendDataset(undefined as any);
        } catch (e: any) {
          expect(e.toString()).toContain('BackendServiceApi requires at least a "process" function and a "service" defined');
          done();
        }
      }));
  });

  describe('executeBackendCallback method', () => {
    it('should expect that executeBackendProcessesCallback will be called after the process Observable resolves', () => {
      const subject = new Subject();
      const successCallbackMock = vi.fn();
      const now = new Date();
      const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
      const processResult = {
        data: { users: { nodes: [] }, pageInfo: { hasNextPage: true }, totalCount: 0 },
        metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 },
      };

      const nextSpy = vi.spyOn(subject, 'next');
      const processSpy = vi.spyOn(gridOptionMock.backendServiceApi!, 'process').mockReturnValue(of(processResult));
      const executeProcessesSpy = vi.spyOn(service, 'executeBackendProcessesCallback');

      service.addRxJsResource(rxjsResourceStub);
      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query, {}, now, 10, {
        successCallback: successCallbackMock,
        httpCancelRequestSubject: subject as Subject<void>,
      });

      vi.runAllTimers();

      expect(successCallbackMock).toHaveBeenCalled();
      expect(nextSpy).toHaveBeenCalled();
      expect(processSpy).toHaveBeenCalled();
      expect(executeProcessesSpy).toHaveBeenCalledWith(now, processResult, gridOptionMock.backendServiceApi, 10);
    });

    it('should expect that onBackendError will be called after the process Observable throws an error', () => {
      const errorExpected = 'observable error';
      const errorCallbackMock = vi.fn();
      const subject = new Subject();
      const now = new Date();
      service.onBackendError = vi.fn();
      const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
      const nextSpy = vi.spyOn(subject, 'next');
      const processSpy = vi.spyOn(gridOptionMock.backendServiceApi!, 'process').mockReturnValue(throwError(errorExpected));

      service.addRxJsResource(rxjsResourceStub);
      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query, {}, now, 10, {
        errorCallback: errorCallbackMock,
        httpCancelRequestSubject: subject as Subject<void>,
      });

      vi.runAllTimers();

      expect(errorCallbackMock).toHaveBeenCalled();
      expect(nextSpy).toHaveBeenCalled();
      expect(processSpy).toHaveBeenCalled();
      expect(service.onBackendError).toHaveBeenCalledWith(errorExpected, gridOptionMock.backendServiceApi);
    });

    it('should pass AbortSignal to the process method when executing a Promise-based backend callback', async () => {
      const now = new Date();
      const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
      const processResult = { data: { users: { nodes: [] } } };

      const processSpy = vi.spyOn(gridOptionMock.backendServiceApi!, 'process').mockReturnValue(Promise.resolve(processResult));

      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query, {}, now, 10);

      await vi.waitFor(() => {
        expect(processSpy).toHaveBeenCalledWith(query, { signal: expect.any(AbortSignal) });
      });
    });

    it('should abort previous request when a new Promise-based request is triggered', async () => {
      const now = new Date();
      const query1 = `query { users (first:20,offset:0) }`;
      const query2 = `query { users (first:20,offset:20) }`;

      let capturedSignal1: AbortSignal | undefined;
      const processSpy = vi
        .spyOn(gridOptionMock.backendServiceApi!, 'process')
        .mockImplementationOnce((q, opts) => {
          capturedSignal1 = opts?.signal;
          return new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100));
        })
        .mockImplementationOnce((q, opts) => {
          return Promise.resolve({ data: {} });
        });

      // First request
      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query1, {}, now, 10);

      // Second request (should abort the first)
      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query2, {}, now, 10);

      expect(capturedSignal1?.aborted).toBe(true);
      expect(processSpy).toHaveBeenCalledTimes(2);
    });

    it('should ignore stale Promise results when a newer request has been triggered', async () => {
      const now = new Date();
      const query1 = `query { users { name: "John" } }`;
      const query2 = `query { users { name: "Jane" } }`;
      const result1 = { data: { users: [{ name: 'John' }] } };
      const result2 = { data: { users: [{ name: 'Jane' }] } };

      const executeProcessesSpy = vi.spyOn(service, 'executeBackendProcessesCallback');

      vi.spyOn(gridOptionMock.backendServiceApi!, 'process')
        .mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve(result1), 100)))
        .mockImplementationOnce(() => Promise.resolve(result2));

      // First request (will be slow)
      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query1, {}, now, 10);

      // Second request (completes immediately)
      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query2, {}, now, 10);

      // Wait for both promises to settle
      await vi.waitFor(() => {
        // Only the second result should be processed
        expect(executeProcessesSpy).toHaveBeenCalledTimes(1);
        expect(executeProcessesSpy).toHaveBeenCalledWith(now, result2, gridOptionMock.backendServiceApi, 10);
      });
    });

    it('should silently ignore AbortError when a Promise-based request is aborted', async () => {
      const now = new Date();
      const query = `query { users (first:20,offset:0) }`;
      const errorCallbackMock = vi.fn();
      service.onBackendError = vi.fn();

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      vi.spyOn(gridOptionMock.backendServiceApi!, 'process').mockReturnValue(Promise.reject(abortError));

      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query, {}, now, 10, {
        errorCallback: errorCallbackMock,
      });

      await vi.waitFor(() => {
        // Error callbacks should NOT be called for AbortError
        expect(errorCallbackMock).not.toHaveBeenCalled();
        expect(service.onBackendError).not.toHaveBeenCalled();
      });
    });

    it('should handle real errors (non-AbortError) in Promise-based requests', async () => {
      const now = new Date();
      const query = `query { users (first:20,offset:0) }`;
      const errorCallbackMock = vi.fn();
      const realError = new Error('Network error');
      service.onBackendError = vi.fn();

      vi.spyOn(gridOptionMock.backendServiceApi!, 'process').mockReturnValue(Promise.reject(realError));

      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query, {}, now, 10, {
        errorCallback: errorCallbackMock,
      });

      await vi.waitFor(() => {
        expect(errorCallbackMock).toHaveBeenCalled();
        expect(service.onBackendError).toHaveBeenCalledWith(realError, gridOptionMock.backendServiceApi);
      });
    });

    it('should process successful Promise result when no newer request has been triggered', async () => {
      const now = new Date();
      const query = `query { users (first:20,offset:0) }`;
      const processResult = { data: { users: { nodes: [] } } };
      const successCallbackMock = vi.fn();

      const executeProcessesSpy = vi.spyOn(service, 'executeBackendProcessesCallback');
      vi.spyOn(gridOptionMock.backendServiceApi!, 'process').mockReturnValue(Promise.resolve(processResult));

      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query, {}, now, 10, {
        successCallback: successCallbackMock,
      });

      await vi.waitFor(() => {
        expect(executeProcessesSpy).toHaveBeenCalledWith(now, processResult, gridOptionMock.backendServiceApi, 10);
        expect(successCallbackMock).toHaveBeenCalled();
      });
    });
  });
});
