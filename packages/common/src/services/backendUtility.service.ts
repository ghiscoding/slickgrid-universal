import type { EmitterType } from '../enums/emitterType.type.js';
import type { BackendServiceApi, GridOption } from '../interfaces/index.js';
import type { Observable, RxJsFacade, Subject } from './rxjsFacade.js';

export interface BackendCallbacks {
  emitActionChangedCallback?: (type: EmitterType) => void;
  errorCallback?: (args: any) => void;
  successCallback?: (args: any) => void;
  httpCancelRequestSubject?: Subject<void>;
}

export class BackendUtilityService {
  protected _infiniteScrollBottomHit = false;

  constructor(protected rxjs?: RxJsFacade | undefined) {}

  addRxJsResource(rxjs: RxJsFacade): void {
    this.rxjs = rxjs;
  }

  /** Execute the Backend Processes Callback, that could come from an Observable or a Promise callback */
  executeBackendProcessesCallback(startTime: Date, processResult: any, backendApi: BackendServiceApi, totalItems: number): any {
    const endTime = new Date();

    if (processResult) {
      // allow the backend service to change the result.
      if (backendApi.service.postProcess) {
        backendApi.service.postProcess(processResult);
      }

      // define what our internal Post Process callback, only available for GraphQL Service for now
      // it will basically refresh the Dataset & Pagination removing the need for the user to always create his own PostProcess every time
      if (backendApi?.internalPostProcess) {
        backendApi.internalPostProcess(processResult);
      }
    }

    // send the response process to the postProcess callback
    if (backendApi.postProcess !== undefined) {
      if (processResult instanceof Object) {
        processResult.metrics = {
          startTime,
          endTime,
          executionTime: endTime.valueOf() - startTime.valueOf(),
          itemCount: totalItems,
          totalItemCount: totalItems,
        };

        if (backendApi.service.options?.infiniteScroll) {
          processResult.infiniteScrollBottomHit = this._infiniteScrollBottomHit;
          delete processResult.itemCount; // our item count is unknown when using infinite scroll
        }
      }
      backendApi.postProcess(processResult);
      this.setInfiniteScrollBottomHit(false);
    }
  }

  /** On a backend service api error, we will run the "onError" if there is 1 provided or just throw back the error when nothing is provided */
  onBackendError(e: any, backendApi: BackendServiceApi): void {
    if (typeof backendApi?.onError === 'function') {
      backendApi.onError(e);
    } else {
      throw e;
    }
  }

  /**
   * Execute the backend callback, which are mainly the "process" & "postProcess" methods.
   * Also note that "preProcess" was executed prior to this callback
   */
  executeBackendCallback(
    backendServiceApi: BackendServiceApi,
    query: string,
    args: any,
    startTime: Date,
    totalItems: number,
    extraCallbacks?: BackendCallbacks
  ): void {
    if (backendServiceApi) {
      // emit an onFilterChanged event when it's not called by a clear filter
      if (args && !args.clearFilterTriggered && !args.clearSortTriggered && extraCallbacks?.emitActionChangedCallback) {
        extraCallbacks.emitActionChangedCallback.call(this, 'remote');
      }

      // the processes can be Observables (like HttpClient) or Promises
      const process = backendServiceApi.process(query);
      if (process instanceof Promise && process.then) {
        process
          .then((processResult: any) => {
            this.executeBackendProcessesCallback(startTime, processResult, backendServiceApi, totalItems);
            extraCallbacks?.successCallback?.call(this, args);
          })
          .catch((error: any) => {
            extraCallbacks?.errorCallback?.call(this, args);
            this.onBackendError(error, backendServiceApi);
          });
      } else if (this.rxjs?.isObservable(process)) {
        const rxjs = this.rxjs as RxJsFacade;

        // this will abort any previous HTTP requests, that were previously hooked in the takeUntil, before sending a new request
        if (rxjs.isObservable(extraCallbacks?.httpCancelRequestSubject)) {
          extraCallbacks?.httpCancelRequestSubject!.next();
        }

        (process as unknown as Observable<any>)
          // the following takeUntil, will potentially be used later to cancel any pending http request (takeUntil another rx, that would be httpCancelRequests$, completes)
          // but make sure the observable is actually defined with the iif condition check before piping it to the takeUntil
          .pipe(
            rxjs.takeUntil(
              rxjs.iif(
                () => rxjs.isObservable(extraCallbacks?.httpCancelRequestSubject),
                extraCallbacks?.httpCancelRequestSubject,
                rxjs.EMPTY
              )
            )
          )
          .subscribe(
            (processResult: any) => {
              this.executeBackendProcessesCallback(startTime, processResult, backendServiceApi, totalItems);
              extraCallbacks?.successCallback?.call(this, args);
            },
            (error: any) => {
              extraCallbacks?.errorCallback?.call(this, args);
              this.onBackendError(error, backendServiceApi);
            }
          );
      }
    }
  }

  /** Refresh the dataset through the Backend Service */
  refreshBackendDataset(gridOptions: GridOption): void {
    let query = '';
    const backendApi = gridOptions?.backendServiceApi;

    if (!backendApi || !backendApi.service || !backendApi.process) {
      throw new Error(`BackendServiceApi requires at least a "process" function and a "service" defined`);
    }

    if (backendApi.service) {
      query = backendApi.service.buildQuery();
    }

    if (query && query !== '') {
      // keep start time & end timestamps & return it after process execution
      const startTime = new Date();
      backendApi.preProcess?.();

      const totalItems = gridOptions?.pagination?.totalItems ?? 0;
      this.executeBackendCallback(backendApi, query, null, startTime, totalItems);
    }
  }

  setInfiniteScrollBottomHit(scrollBottomHit: boolean): void {
    this._infiniteScrollBottomHit = scrollBottomHit;
  }
}
