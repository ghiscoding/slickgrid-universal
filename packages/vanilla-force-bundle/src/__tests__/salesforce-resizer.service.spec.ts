/// <reference types="node" />

import { Editors, SlickEvent, type SlickDataView, type SlickGrid } from '@slickgrid-universal/common';
import type { Column } from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { SalesforceGridOption as GridOption } from '../salesforce-grid-option.interface.js';
import { SalesforceResizerService as ResizerService } from '../salesforce-resizer.service.js';

const GRID_UID = 'slickgrid_12345';
const GRID_ID = 'grid1';
const CONTAINER_ID = 'demo-container';

const template = `<div id="${CONTAINER_ID}" style="height: 800px; width: 600px; overflow: hidden; display: block;">
    <div id="slickGridContainer-${GRID_ID}" class="gridPane" style="width: 100%;">
      <div id="${GRID_ID}" class="${GRID_UID}" style="width: 100%">
       <div class="slickgrid-container">
          <div class="slick-viewport">
            <div class="slick-header"></div>
            <div class="grid-canvas"></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

const mockDataView = {
  constructor: vi.fn(),
  init: vi.fn(),
  destroy: vi.fn(),
  getItemMetadata: vi.fn(),
  getItemCount: vi.fn(),
  getItems: vi.fn(),
  getLength: vi.fn(),
} as unknown as SlickDataView;

const gridStub = {
  autosizeColumns: vi.fn(),
  getContainerNode: vi.fn(),
  getCanvasNode: vi.fn(),
  getHeaderColumn: vi.fn(),
  getColumnIndex: vi.fn(),
  getColumns: vi.fn(),
  getOptions: vi.fn(),
  getRenderedRange: vi.fn(),
  getViewports: vi.fn(),
  getData: () => mockDataView,
  getUID: () => GRID_UID,
  reRenderColumns: vi.fn(),
  registerPlugin: vi.fn(),
  resizeCanvas: vi.fn(),
  setColumns: vi.fn(),
  setHeaderRowVisibility: vi.fn(),
  setTopPanelVisibility: vi.fn(),
  setPreHeaderPanelVisibility: vi.fn(),
  setOptions: vi.fn(),
  setSortColumns: vi.fn(),
  updateColumns: vi.fn(),
  onAutosizeColumns: new SlickEvent(),
  onColumnsResizeDblClick: new SlickEvent(),
  onSort: new SlickEvent(),
} as unknown as SlickGrid;

describe('Resizer Service', () => {
  let eventPubSubService: EventPubSubService;
  let service: ResizerService;
  let divContainer: HTMLDivElement;
  let mockGridOptions: GridOption;
  let resizeObserverMock: Mock<(callback: ResizeObserverCallback) => ResizeObserver>;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    resizeObserverMock = vi.fn(function (this: ResizeObserver, callback: ResizeObserverCallback): ResizeObserver {
      this.observe = vi.fn().mockImplementation(() => {
        callback([], this); // Execute the callback on observe, similar to the window.ResizeObserver.
      });
      this.unobserve = vi.fn();
      this.disconnect = vi.fn();
      return this;
    });

    global.ResizeObserver = resizeObserverMock;

    eventPubSubService = new EventPubSubService();
    service = new ResizerService(eventPubSubService);
    service.intervalRetryDelay = 1;
    mockGridOptions = {
      autoFixResizeWhenBrokenStyleDetected: false,
      enableAutoResize: true,
      autoResize: {
        container: '.grid1',
        maxHeight: 800,
        maxWidth: 1200,
        rightPadding: 10,
      },
      enableFiltering: true,
      headerRowHeight: 30,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 20,
      resizeByContentOptions: {},
    } as GridOption;
    vi.spyOn(gridStub, 'getCanvasNode').mockImplementation(() => divContainer.querySelector('.grid-canvas') as HTMLDivElement);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
    vi.spyOn(gridStub, 'getContainerNode').mockReturnValue(divContainer.querySelector(`.${GRID_UID}`) as HTMLDivElement);
  });

  afterEach(() => {
    vi.clearAllMocks();
    service.dispose();
  });

  describe('AutoFix broken resize styling UI', () => {
    let mockColDefs: Column[];

    afterEach(() => {
      vi.clearAllMocks();
      service.dispose();
      service.intervalRetryDelay = 1;
      service.requestStopOfAutoFixResizeGrid(true);
      mockColDefs = [
        // typically the `originalWidth` is set by the columnDefinitiosn setter in vanilla grid bundle but we can mock it for our test
        { id: 'userId', field: 'userId', width: 30, originalWidth: 30 },
        { id: 'firstName', field: 'firstName', editor: { model: Editors.text }, minWidth: 50 },
        { id: 'lastName', field: 'lastName', editor: { model: Editors.text }, minWidth: 50 },
        { id: 'gender', field: 'gender' },
        { id: 'age', field: 'age', type: 'number', resizeExtraWidthPadding: 2 },
        { id: 'street', field: 'street', maxWidth: 15 },
        { id: 'country', field: 'country', maxWidth: 15, resizeMaxWidthThreshold: 14, rerenderOnResize: true },
        { id: 'zip', field: 'zip', minWidth: 44, width: 30, type: 'number' },
      ] as Column[];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColDefs);
    });

    it('should try to resize grid when its UI is deemed broken and expect "resizeGridWhenStylingIsBrokenUntilCorrected" to be called on interval', () =>
      new Promise((done: any) => {
        const resizeSpy = vi.spyOn(service, 'resizeGrid').mockReturnValue(Promise.resolve({ height: 150, width: 350 }));
        Object.defineProperty(document.querySelector(`.${GRID_UID}`), 'offsetParent', { writable: true, configurable: true, value: 55 });

        mockGridOptions.autoFixResizeTimeout = 10;
        mockGridOptions.autoFixResizeRequiredGoodCount = 5;
        mockGridOptions.autoFixResizeWhenBrokenStyleDetected = true;
        service.intervalRetryDelay = 1;
        service.init(gridStub, divContainer);

        const divHeaderElm = divContainer.querySelector('.slick-header') as HTMLDivElement;
        vi.spyOn(divContainer, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 20 } as unknown as DOMRect);
        vi.spyOn(divHeaderElm, 'getBoundingClientRect').mockReturnValue({ top: 30, left: 25 } as unknown as DOMRect);
        divHeaderElm.style.top = '30px';
        divHeaderElm.style.left = '25px';
        divContainer.style.top = '10px';
        divContainer.style.left = '20px';

        const intervalId = setInterval(() => {
          Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: Math.random() * 1000 });
          Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: Math.random() * 1000 });
        }, service.intervalRetryDelay);

        setTimeout(() => {
          expect(divContainer.outerHTML).toBeTruthy();
          expect(resizeSpy).toHaveBeenCalled();
          expect(resizeSpy).toHaveBeenNthCalledWith(2, 10, undefined);
          expect(resizeSpy).toHaveBeenNthCalledWith(3);
          clearInterval(intervalId);
          done();
        }, 25);
      }));

    it('should try to resize grid when its UI is deemed broken and expect "resizeGridWhenStylingIsBrokenUntilCorrected" but it should stop whenever we force it', () =>
      new Promise((done: any) => {
        const resizeSpy = vi.spyOn(service, 'resizeGrid').mockReturnValue(Promise.resolve({ height: 150, width: 350 }));

        mockGridOptions.autoFixResizeWhenBrokenStyleDetected = true;
        service.intervalRetryDelay = 1;
        service.init(gridStub, divContainer);

        const divHeaderElm = divContainer.querySelector('.slick-header') as HTMLDivElement;
        vi.spyOn(divContainer, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 20 } as unknown as DOMRect);
        vi.spyOn(divHeaderElm, 'getBoundingClientRect').mockReturnValue({ top: 30, left: 25 } as unknown as DOMRect);
        divHeaderElm.style.top = '30px';
        divHeaderElm.style.left = '25px';
        divContainer.style.top = '10px';
        divContainer.style.left = '20px';

        const intervalId = setInterval(() => {
          Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: Math.random() * 1000 });
          Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: Math.random() * 1000 });
        }, service.intervalRetryDelay);

        service.requestStopOfAutoFixResizeGrid();
        // expect(divContainer.outerHTML).toBeTruthy();
        expect(resizeSpy).toHaveBeenCalled();

        setTimeout(() => {
          expect(divContainer.outerHTML).toBeTruthy();
          expect(resizeSpy).toHaveBeenCalled();
          clearInterval(intervalId);
          done();
        }, 10);
      }));

    it('should try to resize grid when its UI is deemed broken and the grid was previously hidden by a tab and becomes visible again', () =>
      new Promise((done: any) => {
        const resizeSpy = vi.spyOn(service, 'resizeGrid').mockReturnValue(Promise.resolve({ height: 150, width: 350 }));

        mockGridOptions.autoFixResizeWhenBrokenStyleDetected = true;
        service.intervalRetryDelay = 1;

        const gridElm = document.querySelector<HTMLDivElement>(`.${GRID_UID}`) as HTMLDivElement;
        service.init(gridStub, divContainer);
        Object.defineProperty(gridElm, 'offsetParent', { writable: true, configurable: true, value: 0 });

        const divHeaderElm = divContainer.querySelector('.slick-header') as HTMLDivElement;
        vi.spyOn(divContainer, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 20 } as unknown as DOMRect);
        vi.spyOn(divHeaderElm, 'getBoundingClientRect').mockReturnValue({ top: 30, left: 25 } as unknown as DOMRect);
        divHeaderElm.style.top = '30px';
        divHeaderElm.style.left = '25px';
        divContainer.style.top = '10px';
        divContainer.style.left = '20px';

        setTimeout(() => {
          Object.defineProperty(gridElm, 'offsetParent', { writable: true, configurable: true, value: 100 });
        }, 5);

        service.requestStopOfAutoFixResizeGrid();
        expect(resizeSpy).toHaveBeenCalled();

        setTimeout(() => {
          expect(divContainer.outerHTML).toBeTruthy();
          expect(resizeSpy).toHaveBeenCalled();
          done();
        }, 10);
      }));

    it('should try to resize grid when its UI is deemed broken and expect "resizeGridWhenStylingIsBrokenUntilCorrected" and then stops after manually requesting a stop', () =>
      new Promise((done: any) => {
        const resizeSpy = vi.spyOn(service, 'resizeGrid').mockReturnValue(Promise.resolve({ height: 150, width: 350 }));

        mockGridOptions.autoFixResizeWhenBrokenStyleDetected = true;
        service.intervalRetryDelay = 1;
        service.init(gridStub, divContainer);

        const divHeaderElm = divContainer.querySelector('.slick-header') as HTMLDivElement;
        vi.spyOn(divHeaderElm, 'getBoundingClientRect').mockReturnValue({ top: 30, left: 25 } as unknown as DOMRect);
        vi.spyOn(divContainer, 'getBoundingClientRect').mockReturnValue({ top: 4, left: 0 } as unknown as DOMRect);
        divHeaderElm.style.top = '30px';
        divHeaderElm.style.left = '25px';

        expect(divContainer.outerHTML).toBeTruthy();
        expect(resizeSpy).toHaveBeenCalled();

        setTimeout(() => {
          service.requestStopOfAutoFixResizeGrid();

          expect(divContainer.outerHTML).toBeTruthy();
          expect(resizeSpy).toHaveBeenCalled();
          done();
        }, 15);
      }));

    it('should set "_cResizeCheckRequired" when grid is hidden from UI while auto-fix loop is running', async () => {
      vi.useFakeTimers();

      try {
        mockGridOptions.autoFixResizeWhenBrokenStyleDetected = true;
        mockGridOptions.autoFixResizeTimeout = 3;
        service.intervalRetryDelay = 1;

        vi.spyOn(service as any, 'isGridVisibleInUI').mockReturnValue(false);
        service.init(gridStub, divContainer);

        await vi.advanceTimersByTimeAsync(service.intervalRetryDelay);

        expect((service as any)._cResizeCheckRequired).toBe(true);
      } finally {
        service.requestStopOfAutoFixResizeGrid(true);
        service.dispose();
        vi.useRealTimers();
      }
    });

    it('should try to resize grid when its UI is deemed broken by the 2nd condition check of "getRenderedRange"', () =>
      new Promise((done: any) => {
        const resizeSpy = vi.spyOn(service, 'resizeGrid').mockReturnValue(Promise.resolve({ height: 150, width: 350 }));
        Object.defineProperty(document.querySelector(`.${GRID_UID}`), 'offsetParent', { writable: true, configurable: true, value: 55 });
        vi.spyOn(mockDataView, 'getItemCount').mockReturnValue(99);
        vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue({ top: 0, bottom: 0, leftPx: 0, rightPx: 0 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: null });
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: null });

        mockGridOptions.autoFixResizeTimeout = 10;
        mockGridOptions.autoFixResizeRequiredGoodCount = 5;
        mockGridOptions.autoFixResizeWhenBrokenStyleDetected = true;
        service.intervalRetryDelay = 1;

        const divHeaderElm = divContainer.querySelector('.slick-header') as HTMLDivElement;
        const divViewportElm = divContainer.querySelector('.slick-viewport') as HTMLDivElement;
        vi.spyOn(divContainer, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 20 } as unknown as DOMRect);
        vi.spyOn(divHeaderElm, 'getBoundingClientRect').mockReturnValue({ top: 5, left: 25 } as unknown as DOMRect);
        vi.spyOn(divViewportElm, 'getBoundingClientRect').mockReturnValue({ top: 98, left: 25 } as unknown as DOMRect);
        divHeaderElm.style.top = '5px';
        divHeaderElm.style.left = '25px';
        divContainer.style.top = '10px';
        divContainer.style.left = '20px';
        service.init(gridStub, divContainer);

        const intervalId = setInterval(() => {
          if (window) {
            Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: Math.random() * 1000 });
            Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: Math.random() * 1000 });
          }
        }, service.intervalRetryDelay);

        setTimeout(() => {
          expect(divContainer.outerHTML).toBeTruthy();
          expect(resizeSpy).toHaveBeenCalled();
          expect(resizeSpy).toHaveBeenNthCalledWith(2, 10, undefined);
          expect(resizeSpy).toHaveBeenNthCalledWith(3);
          clearInterval(intervalId);
          done();
          service.requestStopOfAutoFixResizeGrid();
        }, 25);
      }));

    it('should try to resize grid when its UI is deemed broken but expect an error shown in the console when "resizeGrid" throws an error', () =>
      new Promise((done: any) => {
        const consoleSpy = vi.spyOn(console, 'log').mockReturnValue();
        const promise = new Promise((_resolve, reject) => setTimeout(() => reject('some error'), 0));
        vi.spyOn(service, 'resizeGrid').mockReturnValue(promise as any);

        service.init(gridStub, divContainer);

        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Error:', 'some error');
          done();
        }, 1);
      }));
  });
});
