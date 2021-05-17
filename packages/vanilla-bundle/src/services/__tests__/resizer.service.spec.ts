import { Column, Editors, FieldType, GridOption, SlickGrid, SlickNamespace, } from '@slickgrid-universal/common';
import { EventPubSubService } from '../eventPubSub.service';
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

const mockDataView = {
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
  getItemMetadata: jest.fn(),
  getItems: jest.fn(),
};

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getColumns: jest.fn(),
  getOptions: jest.fn(),
  getData: () => mockDataView,
  getUID: () => GRID_UID,
  reRenderColumns: jest.fn(),
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
  let eventPubSubService: EventPubSubService;
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

    eventPubSubService = new EventPubSubService(divContainer);
    service = new ResizerService(eventPubSubService);
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
      const pubSubSpy = jest.spyOn(eventPubSubService, 'publish');

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
      const pubSubSpy = jest.spyOn(eventPubSubService, 'publish');

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

    it('should call "onGridAfterResize" event and expect "resizeColumnsByCellContent" to be called when "enableAutoResizeColumnsByCellContent" is set', () => {
      const resizeContentSpy = jest.spyOn(service, 'resizeColumnsByCellContent');
      const pubSubSpy = jest.spyOn(eventPubSubService, 'publish');

      mockGridOptions.enableAutoResizeColumnsByCellContent = true;
      service.init(gridStub, divContainer);
      service.resizeGrid();
      const instance = service.getAddonInstance();
      instance.onGridAfterResize.notify({ grid: gridStub, dimensions: { height: 200, width: 800 } }, new Slick.EventData(), gridStub);

      expect(pubSubSpy).toHaveBeenCalledWith(`onGridAfterResize`, { grid: gridStub, dimensions: { height: 200, width: 800 } });
      expect(resizeContentSpy).toHaveBeenCalled();
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

    describe('resizeColumnsByCellContent method', () => {
      let mockColDefs: Column[];
      let mockData: any[];

      beforeEach(() => {
        mockGridOptions.resizeCellCharWidthInPx = 7;
        mockGridOptions.resizeCellPaddingWidthInPx = 6;
        mockGridOptions.resizeFormatterPaddingWidthInPx = 5;
        mockGridOptions.resizeDefaultRatioForStringType = 0.88;
        mockGridOptions.resizeAlwaysRecalculateColumnWidth = false;
        mockGridOptions.resizeMaxItemToInspectCellContentWidth = 4;
        mockColDefs = [
          // typically the `originalWidth` is set by the columnDefinitiosn setter in vanilla grid bundle but we can mock it for our test
          { id: 'userId', field: 'userId', width: 30, originalWidth: 30 },
          { id: 'firstName', field: 'firstName', editor: { model: Editors.text }, minWidth: 50 },
          { id: 'lastName', field: 'lastName', editor: { model: Editors.text }, minWidth: 50 },
          { id: 'gender', field: 'gender', resizeCalcWidthRatio: 1.2 },
          { id: 'age', field: 'age', type: FieldType.number, resizeExtraWidthPadding: 2 },
          { id: 'street', field: 'street', maxWidth: 15 },
          { id: 'country', field: 'country', maxWidth: 15, resizeMaxWidthThreshold: 14, rerenderOnResize: true },
        ] as Column[];
        mockData = [
          { userId: 1, firstName: 'John', lastName: 'Doe', gender: 'male', age: 20, street: '478 Kunze Land', country: 'United States of America' },
          { userId: 2, firstName: 'Destinee', lastName: 'Shanahan', gender: 'female', age: 25, street: '20519 Watson Lodge', country: 'Australia' },
          { userId: 3, firstName: 'Sarai', lastName: 'Altenwerth', gender: 'female', age: 30, street: '184 Preston Pine', country: 'United States of America' },
          { userId: 4, firstName: 'Tyshawn', lastName: 'Hyatt', gender: 'male', age: 35, street: '541 Senger Drives', country: 'Canada' },
          { userId: 5, firstName: 'Alvina', lastName: 'Franecki', gender: 'female', age: 100, street: '20229 Tia Turnpike', country: 'United States of America' },
          { userId: 6, firstName: 'Therese', lastName: 'Brakus', gender: 'female', age: 99, street: '34767 Lindgren Dam', country: 'Bosnia' },
        ];

        jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColDefs);
        jest.spyOn(mockDataView, 'getItems').mockReturnValue(mockData);
      });

      it('should call the resize and expect first column have a fixed width while other will have a calculated width when resizing by their content', () => {
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
        const reRenderColumnsSpy = jest.spyOn(gridStub, 'reRenderColumns');
        const pubSubSpy = jest.spyOn(eventPubSubService, 'publish');

        service.init(gridStub, divContainer);
        service.resizeColumnsByCellContent(true);

        expect(setColumnsSpy).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'userId', width: 30 }),
            expect.objectContaining({ id: 'firstName', width: 56 }), // longest word "Destinee" (length 8 * charWidth(7) * ratio(0.88)) + cellPadding(6) = 55.28 ceil to => 56
            expect.objectContaining({ id: 'lastName', width: 68 }), // longest word "Altenwerth" (length 10 * charWidth(7) * ratio(0.88)) + cellPadding(6) = 67.6 ceil to => 68
            expect.objectContaining({ id: 'gender', width: 57 }), // longest word "female" (length 6 * charWidth(7) * customRatio(1.2)) + cellPadding(6) = 56.4 ceil to 57
            expect.objectContaining({ id: 'age', width: 29 }), // longest number 100 (length 3 * charWidth(7) * ratio(1)) + cellPadding(6) + extraPadding(2) = 44.96 ceil to 45
            expect.objectContaining({ id: 'street', width: 15 }), // longest number "20229 Tia Turnpike" goes over maxWidth so we fallback to it
            expect.objectContaining({ id: 'country', width: 14 }), // longest number "United States of America" goes over resizeMaxWidthThreshold so we fallback to it
          ]));
        expect(reRenderColumnsSpy).toHaveBeenCalledWith(true);
        expect(pubSubSpy).toBeCalledWith('onBeforeResizeByContent');
        expect(pubSubSpy).toBeCalledWith('onAfterResizeByContent', {
          calculateColumnWidths: { userId: 30, firstName: 56, lastName: 68, gender: 57, age: 29, street: 15, country: 14, },
          readItemCount: 5
        });
      });

      it('should call the resize and expect first column have a fixed width while other will have a calculated width when resizing by their content and grid is editable', () => {
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
        const reRenderColumnsSpy = jest.spyOn(gridStub, 'reRenderColumns');
        const pubSubSpy = jest.spyOn(eventPubSubService, 'publish');

        mockGridOptions.editable = true;
        service.init(gridStub, divContainer);
        service.resizeColumnsByCellContent(true);

        // same as previous except firstName/lastName have editors with padding of 5px
        expect(setColumnsSpy).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'userId', width: 30 }),
            expect.objectContaining({ id: 'firstName', width: 61 }), // longest word "Destinee" (length 8 * charWidth(7) * ratio(0.88)) + cellPadding(6) + editorPadding(5) = 60.28 ceil to => 61
            expect.objectContaining({ id: 'lastName', width: 73 }), // longest word "Altenwerth" (length 10 * charWidth(7) * ratio(0.88)) + cellPadding(6) + editorPadding(5) = 72.6 ceil to => 73
            expect.objectContaining({ id: 'gender', width: 57 }), // longest word "female" (length 6 * charWidth(7) * customRatio(1.2)) + cellPadding(6) = 56.4 ceil to 57
            expect.objectContaining({ id: 'age', width: 29 }), // longest number 100 (length 3 * charWidth(7) * ratio(1)) + cellPadding(6) + extraPadding(2) = 44.96 ceil to 45
            expect.objectContaining({ id: 'street', width: 15 }), // longest number "20229 Tia Turnpike" goes over maxWidth so we fallback to it
            expect.objectContaining({ id: 'country', width: 14 }), // longest number "United States of America" goes over resizeMaxWidthThreshold so we fallback to it
          ]));
        expect(reRenderColumnsSpy).toHaveBeenCalledWith(true);
        expect(pubSubSpy).toBeCalledWith('onBeforeResizeByContent');
        expect(pubSubSpy).toBeCalledWith('onAfterResizeByContent', {
          calculateColumnWidths: { userId: 30, firstName: 61, lastName: 73, gender: 57, age: 29, street: 15, country: 14, },
          readItemCount: 5
        });
      });

      it('should call "resizeColumnsByCellContent" when "onFullResizeByContentRequested" pubsub event is triggered', () => {
        const resizeSpy = jest.spyOn(service, 'resizeColumnsByCellContent');

        service.init(gridStub, divContainer);
        eventPubSubService.publish('onFullResizeByContentRequested', { caller: 'GridStateService' });

        expect(resizeSpy).toHaveBeenCalledWith(true);
      });
    });
  });
});
