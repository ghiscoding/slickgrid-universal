import { of, Subject, throwError } from 'rxjs';

import type { BackendServiceApi, GridOption } from '../../interfaces/index';
import { BackendUtilityService } from '../backendUtility.service';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub';

const graphqlServiceMock = {
  buildQuery: jest.fn(),
  updateFilters: jest.fn(),
  updatePagination: jest.fn(),
  updateSorters: jest.fn(),
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
        preProcess: jest.fn(),
        process: jest.fn(),
        postProcess: jest.fn(),
      },
      pagination: {
        pageSize: 10,
        pageSizes: [10, 25, 50],
        pageNumber: 1,
        totalItems: 0
      }
    } as GridOption;
    rxjsResourceStub = new RxJsResourceStub();
    service = new BackendUtilityService(rxjsResourceStub);
  });

  describe('executeBackendProcessesCallback method', () => {
    it('should execute the "internalPostProcess" when it is defined', () => {
      const now = new Date();
      gridOptionMock.backendServiceApi!.internalPostProcess = jest.fn();
      const spy = jest.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'internalPostProcess');
      service.executeBackendProcessesCallback(now, { data: {} }, gridOptionMock.backendServiceApi as BackendServiceApi, 0);

      expect(spy).toHaveBeenCalled();
    });

    it('should execute the "postProcess" when it is defined and add some metrics to the object', () => {
      const now = new Date();
      const mockResult = { data: { users: [{ firstName: 'John', lastName: 'Doe' }] } };
      const expectaction = {
        data: { users: [{ firstName: 'John', lastName: 'Doe' }], },
        metrics: {
          startTime: now,
          endTime: expect.any(Date),
          executionTime: expect.any(Number),
          itemCount: 1,
          totalItemCount: 1
        },
      };
      gridOptionMock.backendServiceApi!.postProcess = jest.fn();
      gridOptionMock.pagination = { totalItems: 1, pageSizes: [10, 25], pageSize: 10 };

      const spy = jest.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'postProcess');
      service.executeBackendProcessesCallback(now, mockResult, gridOptionMock.backendServiceApi as BackendServiceApi, 1);

      expect(spy).toHaveBeenCalledWith(expectaction);
    });

    it('should execute the service "postProcess" when it is defined', () => {
      const now = new Date();
      gridOptionMock.backendServiceApi!.service.postProcess = jest.fn();
      const spy = jest.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'postProcess');
      service.executeBackendProcessesCallback(now, { data: {} }, gridOptionMock.backendServiceApi as BackendServiceApi, 0);

      expect(spy).toHaveBeenCalled();
    });

    it('should execute the service "postProcess" when it is defined', () => {
      const now = new Date();
      gridOptionMock.backendServiceApi!.service.postProcess = jest.fn();
      const spy = jest.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'postProcess');
      service.executeBackendProcessesCallback(now, { data: {} }, gridOptionMock.backendServiceApi as BackendServiceApi, 0);

      expect(spy).toHaveBeenCalled();
    });

    it('should execute the service "postProcess" and infinite scroll when it is defined', () => {
      const now = new Date();
      gridOptionMock.backendServiceApi!.service.postProcess = jest.fn();
      gridOptionMock.backendServiceApi!.service.options = {
        infiniteScroll: true
      };
      const spy = jest.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'postProcess');
      service.executeBackendProcessesCallback(now, { data: {} }, gridOptionMock.backendServiceApi as BackendServiceApi, 0);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onBackendError method', () => {
    it('should run the "onError" callback method when provided', () => {
      gridOptionMock.backendServiceApi!.onError = jest.fn();
      const spy = jest.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'onError');

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
      const querySpy = jest.spyOn(gridOptionMock.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
      const executeSpy = jest.spyOn(service, 'executeBackendCallback');

      service.refreshBackendDataset(gridOptionMock);

      expect(querySpy).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalledWith(gridOptionMock.backendServiceApi as BackendServiceApi, query, null, expect.toBeDate(), gridOptionMock.pagination!.totalItems);
    });

    it('should call "executeBackendCallback" after calling the "refreshBackendDataset" method without Pagination (when disabled)', () => {
      gridOptionMock.enablePagination = false;
      const query = `query { users { id,name,gender,company } }`;
      const querySpy = jest.spyOn(gridOptionMock.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
      const executeSpy = jest.spyOn(service, 'executeBackendCallback');

      service.refreshBackendDataset(gridOptionMock);

      expect(querySpy).toHaveBeenCalled();
      expect(executeSpy).toHaveBeenCalledWith(gridOptionMock.backendServiceApi as BackendServiceApi, query, null, expect.toBeDate(), gridOptionMock.pagination!.totalItems);
    });

    it('should throw an error when backendServiceApi is undefined', (done) => {
      gridOptionMock.enablePagination = true;
      try {
        gridOptionMock.backendServiceApi = undefined;
        service.refreshBackendDataset(undefined as any);
      } catch (e) {
        expect(e.toString()).toContain('BackendServiceApi requires at least a "process" function and a "service" defined');
        done();
      }
    });
  });

  describe('executeBackendCallback method', () => {
    it('should expect that executeBackendProcessesCallback will be called after the process Observable resolves', (done) => {
      const subject = new Subject();
      const successCallbackMock = jest.fn();
      const now = new Date();
      const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
      const processResult = {
        data: { users: { nodes: [] }, pageInfo: { hasNextPage: true }, totalCount: 0 },
        metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 }
      };

      const nextSpy = jest.spyOn(subject, 'next');
      const processSpy = jest.spyOn(gridOptionMock.backendServiceApi!, 'process').mockReturnValue(of(processResult));
      const executeProcessesSpy = jest.spyOn(service, 'executeBackendProcessesCallback');

      service.addRxJsResource(rxjsResourceStub);
      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query, {}, now, 10, {
        successCallback: successCallbackMock,
        httpCancelRequestSubject: subject as Subject<void>,
      });

      setTimeout(() => {
        expect(successCallbackMock).toHaveBeenCalled();
        expect(nextSpy).toHaveBeenCalled();
        expect(processSpy).toHaveBeenCalled();
        expect(executeProcessesSpy).toHaveBeenCalledWith(now, processResult, gridOptionMock.backendServiceApi, 10);
        done();
      });
    });

    it('should expect that onBackendError will be called after the process Observable throws an error', (done) => {
      const errorExpected = 'observable error';
      const errorCallbackMock = jest.fn();
      const subject = new Subject();
      const now = new Date();
      service.onBackendError = jest.fn();
      const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
      const nextSpy = jest.spyOn(subject, 'next');
      const processSpy = jest.spyOn(gridOptionMock.backendServiceApi!, 'process').mockReturnValue(throwError(errorExpected));

      service.addRxJsResource(rxjsResourceStub);
      service.executeBackendCallback(gridOptionMock.backendServiceApi!, query, {}, now, 10, {
        errorCallback: errorCallbackMock,
        httpCancelRequestSubject: subject as Subject<void>,
      });

      setTimeout(() => {
        expect(errorCallbackMock).toHaveBeenCalled();
        expect(nextSpy).toHaveBeenCalled();
        expect(processSpy).toHaveBeenCalled();
        expect(service.onBackendError).toHaveBeenCalledWith(errorExpected, gridOptionMock.backendServiceApi);
        done();
      });
    });
  });
});
