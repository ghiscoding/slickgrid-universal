import { GridOption, PubSubService, SlickGrid, SlickNamespace, } from '@slickgrid-universal/common';
import { ResizerService } from '../resizer.service';

declare const Slick: SlickNamespace;
const DATAGRID_FOOTER_HEIGHT = 25;
const DATAGRID_PAGINATION_HEIGHT = 35;
const GRID_UID = 'slickgrid_12345';

const mockResizerImplementation = {
  init: jest.fn(),
  destroy: jest.fn(),
  bindAutoResizeDataGrid: jest.fn(),
  getLastResizeDimensions: jest.fn(),
  pauseResizer: jest.fn(),
  resizeGrid: jest.fn(),
  onGridAfterResize: new Slick.Event(),
  onGridBeforeResize: new Slick.Event(),
};
const mockAddon = jest.fn().mockImplementation(() => mockResizerImplementation);

jest.mock('slickgrid/plugins/slick.resizer', () => mockAddon);

Slick.Plugins = {
  Resizer: mockAddon
} as any;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as PubSubService;

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getColumns: jest.fn(),
  getOptions: jest.fn(),
  getUID: () => GRID_UID,
  registerPlugin: jest.fn(),
  setColumns: jest.fn(),
  setHeaderRowVisibility: jest.fn(),
  setTopPanelVisibility: jest.fn(),
  setPreHeaderPanelVisibility: jest.fn(),
  setOptions: jest.fn(),
  setSortColumns: jest.fn(),
  onSort: new Slick.Event(),
} as unknown as SlickGrid;

describe('Resizer Service', () => {
  let service: ResizerService;
  let divContainer: HTMLDivElement;
  let divHeaderElm: HTMLDivElement;
  let divViewportElm: HTMLDivElement;
  let mockGridOptions: GridOption;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.className = GRID_UID;
    divViewportElm = document.createElement('div');
    divViewportElm.className = `slick-viewport`;
    divHeaderElm = document.createElement('div');
    divHeaderElm.className = `slick-header`;
    divViewportElm.appendChild(divHeaderElm);
    divContainer.appendChild(divViewportElm);
    document.body.appendChild(divContainer);

    service = new ResizerService(pubSubServiceStub);
    mockGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid1'
      },
      enableFiltering: true,
      headerRowHeight: 30,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 20,
    } as GridOption;
    jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.dispose();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('registered addon', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should register the addon', () => {
      service.init(gridStub, divContainer);
      const instance = service.getAddonInstance();

      expect(instance).toBeTruthy();
      expect(mockAddon).toHaveBeenCalledWith({ container: '.grid1', gridContainer: divContainer, }, undefined);
    });

    it('should call internal event handler subscribe and expect the "onGridBeforeResize" event to be called when addon notify is called', () => {
      const handlerSpy = jest.spyOn(service.eventHandler, 'subscribe');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.init(gridStub, divContainer);
      const instance = service.getAddonInstance();
      instance.onGridBeforeResize.notify({ grid: gridStub }, new Slick.EventData(), gridStub);

      expect(handlerSpy).toHaveBeenCalledTimes(2);
      expect(handlerSpy).toHaveBeenCalledWith(
        { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
        expect.anything()
      );
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridBeforeResize`, { grid: gridStub });
    });

    it('should call internal event handler subscribe and expect the "onGridAfterResize" event to be called when addon notify is called', () => {
      const handlerSpy = jest.spyOn(service.eventHandler, 'subscribe');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

      service.init(gridStub, divContainer);
      const instance = service.getAddonInstance();
      instance.onGridAfterResize.notify({ grid: gridStub, dimensions: { height: 200, width: 800 } }, new Slick.EventData(), gridStub);

      expect(handlerSpy).toHaveBeenCalledTimes(2);
      expect(handlerSpy).toHaveBeenCalledWith(
        { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
        expect.anything()
      );
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridAfterResize`, { grid: gridStub, dimensions: { height: 200, width: 800 } });
    });

    it('should dispose of the addon', () => {
      service.init(gridStub, divContainer);

      const instance = service.getAddonInstance();
      const destroySpy = jest.spyOn(instance, 'destroy');
      service.dispose();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should call the plugin "getLastResizeDimensions" method and get last dimensions', () => {
      service.init(gridStub, divContainer);
      const instance = service.getAddonInstance();
      const spy = jest.spyOn(instance, 'getLastResizeDimensions').mockReturnValue({ height: 200, width: 800 });

      const dimensions = service.getLastResizeDimensions();

      expect(spy).toHaveBeenCalled();
      expect(dimensions).toEqual({ height: 200, width: 800 });
    });

    it('should call the plugin "pauseResizer" method', () => {
      service.init(gridStub, divContainer);
      const instance = service.getAddonInstance();
      const spy = jest.spyOn(instance, 'pauseResizer');

      service.pauseResizer(true);

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should call the plugin "resizeGrid" method', () => {
      service.init(gridStub, divContainer);
      const instance = service.getAddonInstance();
      const spy = jest.spyOn(instance, 'resizeGrid');

      service.resizeGrid(10, { height: 600, width: 800 });

      expect(spy).toHaveBeenCalledWith(10, { height: 600, width: 800 }, undefined);
    });

    it('should expect autoResize bottom padding to be added to default pagination padding', () => {
      mockGridOptions = { autoResize: { bottomPadding: 50 } };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);

      service.init(gridStub, divContainer);

      expect(mockGridOptions.autoResize.bottomPadding).toEqual(50); // calculated by the lib
    });

    it('should expect autoResize bottom padding with custom footer height to be added to default pagination padding when "showCustomFooter" was enabled', () => {
      mockGridOptions = { autoResize: { bottomPadding: 50 }, showCustomFooter: true };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);

      service.init(gridStub, divContainer);

      expect(mockGridOptions.autoResize.bottomPadding).toEqual(50 + DATAGRID_FOOTER_HEIGHT); // calculated by the lib
    });

    it('should expect autoResize bottom padding with pagination height to be added to default pagination padding when "enablePagination" was enabled', () => {
      mockGridOptions = { autoResize: { bottomPadding: 50 }, enablePagination: true };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);

      service.init(gridStub, divContainer);

      expect(mockGridOptions.autoResize.bottomPadding).toEqual(50 + DATAGRID_PAGINATION_HEIGHT); // calculated by the lib
    });

    it('should set a fixed width when provided in the grid options', () => {
      const fixedWidth = 255;
      mockGridOptions = { autoCommitEdit: false, autoResize: { bottomPadding: 50 }, gridWidth: fixedWidth };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(mockGridOptions);

      service.init(gridStub, divContainer);

      expect(divContainer.style.width).toEqual(`${fixedWidth}px`);
    });

    it('should try to resize grid when its UI is deemed broken and expect "resizeGridWhenStylingIsBrokenUntilCorrected" to be called on interval', (done) => {
      const promise = new Promise(resolve => setTimeout(() => resolve({ height: 150, width: 350 }), 1));
      const resizeSpy = jest.spyOn(mockResizerImplementation, 'resizeGrid').mockReturnValue(promise);

      service.init(gridStub, divContainer);
      service.intervalRetryDelay = 2;

      jest.spyOn(divHeaderElm, 'getBoundingClientRect').mockReturnValue({ top: 30, left: 25 } as unknown as DOMRect);
      divHeaderElm.style.top = '30px';
      divHeaderElm.style.left = '25px';

      expect(divContainer.outerHTML).toBeTruthy();
      expect(resizeSpy).toHaveBeenCalledTimes(2);

      setTimeout(() => {
        service.requestStopOfAutoFixResizeGrid();

        expect(divContainer.outerHTML).toBeTruthy();
        expect(resizeSpy).toHaveBeenCalled();
        done();
      }, 15);
    });

    it('should try to resize grid when its UI is deemed broken but expect an error shown in the console when "resizeGrid" throws an error', (done) => {
      const consoleSpy = jest.spyOn(global.console, 'log').mockReturnValue();
      const promise = new Promise((_resolve, reject) => setTimeout(() => reject('some error'), 0));
      jest.spyOn(mockResizerImplementation, 'resizeGrid').mockReturnValue(promise);

      service.init(gridStub, divContainer);

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error:', 'some error');
        done();
      }, 1);
    });
  });
});
