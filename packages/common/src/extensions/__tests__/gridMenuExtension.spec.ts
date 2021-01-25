import { DelimiterType, FileType } from '../../enums/index';
import { Column, SlickDataView, GridOption, SlickGrid, SlickNamespace, GridMenu, SlickGridMenu, BackendServiceApi } from '../../interfaces/index';
import { GridMenuExtension } from '../gridMenuExtension';
import { ExtensionUtility } from '../extensionUtility';
import { SharedService } from '../../services/shared.service';
import { ExcelExportService, TextExportService, FilterService, SortService } from '../../services';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

declare const Slick: SlickNamespace;
jest.mock('flatpickr', () => { });

const gridId = 'grid1';
const gridUid = 'slickgrid_124343';
const containerId = 'demo-container';

const excelExportServiceStub = {
  className: 'ExcelExportService',
  exportToExcel: jest.fn(),
} as unknown as ExcelExportService;

const exportServiceStub = {
  className: 'TextExportService',
  exportToFile: jest.fn(),
} as unknown as TextExportService;

const filterServiceStub = {
  clearFilters: jest.fn(),
} as unknown as FilterService;

const sortServiceStub = {
  clearSorting: jest.fn(),
} as unknown as SortService;

const dataViewStub = {
  refresh: jest.fn(),
} as unknown as SlickDataView;

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getColumns: jest.fn(),
  getOptions: jest.fn(),
  getUID: () => gridUid,
  registerPlugin: jest.fn(),
  setColumns: jest.fn(),
  setHeaderRowVisibility: jest.fn(),
  setTopPanelVisibility: jest.fn(),
  setPreHeaderPanelVisibility: jest.fn(),
  setOptions: jest.fn(),
} as unknown as SlickGrid;

const mockGridMenuAddon = {
  init: jest.fn(),
  destroy: jest.fn(),
  showGridMenu: jest.fn(),
  updateAllTitles: jest.fn(),
  onColumnsChanged: new Slick.Event(),
  onCommand: new Slick.Event(),
  onAfterMenuShow: new Slick.Event(),
  onBeforeMenuShow: new Slick.Event(),
  onMenuClose: new Slick.Event(),
};
const mockAddon = jest.fn().mockImplementation(() => mockGridMenuAddon);

// define a <div> container to simulate the grid container
const template =
  `<div id="${containerId}" style="height: 800px; width: 600px;">
    <div id="slickGridContainer-${gridId}" class="grid-pane" style="width: 100%;">
    <div id="${gridId}" class="${gridUid}" style="width: 100%"></div>
    </div>
  </div>`;

describe('gridMenuExtension', () => {
  jest.mock('slickgrid/controls/slick.gridmenu', () => mockAddon);
  Slick.Controls = { GridMenu: mockAddon } as any;

  const columnsMock: Column[] = [{ id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' }, { id: 'field2', field: 'field2', width: 75 }];
  let divElement: HTMLDivElement;
  let extensionUtility: ExtensionUtility;
  let translateService: TranslateServiceStub;
  let extension: GridMenuExtension;
  let sharedService: SharedService;

  const gridOptionsMock = {
    enableAutoSizeColumns: true,
    enableGridMenu: true,
    enableTranslate: true,
    backendServiceApi: {
      service: {
        buildQuery: jest.fn(),
      },
      internalPostProcess: jest.fn(),
      preProcess: jest.fn(),
      process: jest.fn(),
      postProcess: jest.fn(),
    },
    gridMenu: {
      customItems: [],
      hideClearAllFiltersCommand: false,
      hideClearFrozenColumnsCommand: true,
      hideForceFitButton: false,
      hideSyncResizeButton: true,
      onExtensionRegistered: jest.fn(),
      onCommand: () => { },
      onColumnsChanged: () => { },
      onAfterMenuShow: () => { },
      onBeforeMenuShow: () => { },
      onMenuClose: () => { },
    },
    pagination: {
      totalItems: 0
    },
    showHeaderRow: false,
    showTopPanel: false,
    showPreHeaderPanel: false
  } as unknown as GridOption;

  describe('with I18N Service', () => {
    beforeEach(() => {
      const div = document.createElement('div');
      divElement = document.createElement('div');
      div.innerHTML = template;
      document.body.appendChild(div);

      sharedService = new SharedService();
      translateService = new TranslateServiceStub();
      extensionUtility = new ExtensionUtility(sharedService, translateService);
      extension = new GridMenuExtension(extensionUtility, filterServiceStub, sharedService, sortServiceStub, translateService);
      translateService.use('fr');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return null when either the grid object or the grid options is missing', () => {
      const output = extension.register();
      expect(output).toBeNull();
    });

    describe('registered addon', () => {
      beforeEach(() => {
        jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(dataViewStub);
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 1));
        jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
      });

      it('should register the addon', () => {
        const onRegisteredSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onExtensionRegistered');
        const instance = extension.register() as SlickGridMenu;
        const addonInstance = extension.getAddonInstance();

        expect(instance).toBeTruthy();
        expect(instance).toEqual(addonInstance);
        expect(onRegisteredSpy).toHaveBeenCalledWith(instance);
        expect(mockAddon).toHaveBeenCalledWith(columnsMock, gridStub, gridOptionsMock);
      });

      it('should call internal event handler subscribe and expect the "onColumnsChanged" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onColumnsChanged');
        const onBeforeSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onBeforeMenuShow');
        const onAfterSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onAfterMenuShow');
        const onCloseSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onMenuClose');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');
        const visibleColsSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
        const readjustSpy = jest.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

        const instance = extension.register() as SlickGridMenu;
        instance.onColumnsChanged!.notify({ columnId: 'field1', showing: false, allColumns: columnsMock, columns: columnsMock.slice(0, 1), grid: gridStub }, new Slick.EventData(), gridStub);

        expect(readjustSpy).not.toHaveBeenCalled();
        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onColumnSpy).toHaveBeenCalledWith(expect.anything(), { columnId: 'field1', showing: false, allColumns: columnsMock, columns: columnsMock.slice(0, 1), grid: gridStub });
        expect(onAfterSpy).not.toHaveBeenCalled();
        expect(onBeforeSpy).not.toHaveBeenCalled();
        expect(onCloseSpy).not.toHaveBeenCalled();
        expect(onCommandSpy).not.toHaveBeenCalled();
        expect(visibleColsSpy).not.toHaveBeenCalled();
      });

      it(`should call internal event handler subscribe and expect the "onColumnsChanged" option to be called
    and it should override "visibleColumns" when array passed as arguments is bigger than previous visible columns`, () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onColumnsChanged');
        const onBeforeSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onBeforeMenuShow');
        const onAfterSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onAfterMenuShow');
        const onCloseSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onMenuClose');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');
        const visibleColsSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');

        const instance = extension.register() as SlickGridMenu;
        instance.onColumnsChanged!.notify({ columnId: 'field1', showing: true, allColumns: columnsMock, columns: columnsMock, grid: gridStub }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onColumnSpy).toHaveBeenCalledWith(expect.anything(), { columnId: 'field1', showing: true, allColumns: columnsMock, columns: columnsMock, grid: gridStub });
        expect(onAfterSpy).not.toHaveBeenCalled();
        expect(onBeforeSpy).not.toHaveBeenCalled();
        expect(onCloseSpy).not.toHaveBeenCalled();
        expect(onCommandSpy).not.toHaveBeenCalled();
        expect(visibleColsSpy).toHaveBeenCalledWith(columnsMock);
      });

      it('should call internal "onColumnsChanged" event and expect "readjustFrozenColumnIndexWhenNeeded" method to be called when the grid is detected to be a frozen grid', () => {
        gridOptionsMock.frozenColumn = 0;
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const readjustSpy = jest.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

        const instance = extension.register() as SlickGridMenu;
        instance.onColumnsChanged.notify({ columnId: 'field1', showing: false, allColumns: columnsMock, columns: columnsMock.slice(0, 1), grid: gridStub }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock.slice(0, 1));
      });

      it('should call internal event handler subscribe and expect the "onBeforeMenuShow" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onColumnsChanged');
        const onBeforeSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onBeforeMenuShow');
        const onAfterSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onAfterMenuShow');
        const onCloseSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onMenuClose');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');

        const instance = extension.register() as SlickGridMenu;
        instance.onBeforeMenuShow!.notify({ columns: [], grid: gridStub, menu: divElement }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onBeforeSpy).toHaveBeenCalledWith(expect.anything(), { columns: [], grid: gridStub, menu: divElement });
        expect(onAfterSpy).not.toHaveBeenCalled();
        expect(onColumnSpy).not.toHaveBeenCalled();
        expect(onCloseSpy).not.toHaveBeenCalled();
        expect(onCommandSpy).not.toHaveBeenCalled();
      });

      it('should call internal event handler subscribe and expect the "onMenuClose" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onColumnsChanged');
        const onBeforeSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onBeforeMenuShow');
        const onAfterSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onAfterMenuShow');
        const onCloseSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onMenuClose');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');

        const instance = extension.register() as SlickGridMenu;
        instance.onMenuClose!.notify({ allColumns: [], visibleColumns: [], grid: gridStub, menu: divElement }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onCloseSpy).toHaveBeenCalledWith(expect.anything(), { allColumns: [], visibleColumns: [], grid: gridStub, menu: divElement });
        expect(onAfterSpy).not.toHaveBeenCalled();
        expect(onColumnSpy).not.toHaveBeenCalled();
        expect(onBeforeSpy).not.toHaveBeenCalled();
        expect(onCommandSpy).not.toHaveBeenCalled();
      });

      it('should call internal event handler subscribe and expect the "onCommand" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onColumnsChanged');
        const onBeforeSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onBeforeMenuShow');
        const onAfterSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onAfterMenuShow');
        const onCloseSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onMenuClose');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'help' }, column: {} as Column, grid: gridStub, command: 'help' }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onCommandSpy).toHaveBeenCalledWith(expect.anything(), { item: { command: 'help' }, column: {} as Column, grid: gridStub, command: 'help' });
        expect(onAfterSpy).not.toHaveBeenCalled();
        expect(onColumnSpy).not.toHaveBeenCalled();
        expect(onBeforeSpy).not.toHaveBeenCalled();
        expect(onCloseSpy).not.toHaveBeenCalled();
      });

      it('should call internal event handler subscribe and expect the "onAfterMenuShow" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onColumnsChanged');
        const onAfterSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onAfterMenuShow');
        const onBeforeSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onBeforeMenuShow');
        const onCloseSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onMenuClose');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');

        const instance = extension.register() as SlickGridMenu;
        instance.onAfterMenuShow!.notify({ columns: [], grid: gridStub, menu: divElement }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onAfterSpy).toHaveBeenCalledWith(expect.anything(), { columns: [], grid: gridStub, menu: divElement });
        expect(onBeforeSpy).not.toHaveBeenCalled();
        expect(onColumnSpy).not.toHaveBeenCalled();
        expect(onCloseSpy).not.toHaveBeenCalled();
        expect(onCommandSpy).not.toHaveBeenCalled();
      });

      it('should call "autosizeColumns" method when the "onMenuClose" event was triggered and the columns are different', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onColumnsChanged');
        const onCloseSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onMenuClose');
        const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');

        const instance = extension.register() as SlickGridMenu;
        instance!.onColumnsChanged!.notify({ columnId: 'field1', showing: true, grid: gridStub, allColumns: columnsMock, columns: columnsMock.slice(0, 1) }, new Slick.EventData(), gridStub);
        instance.onMenuClose!.notify({ allColumns: columnsMock, visibleColumns: columnsMock, grid: gridStub, menu: divElement }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalled();
        expect(onCloseSpy).toHaveBeenCalled();
        expect(onColumnSpy).toHaveBeenCalled();
        expect(autoSizeSpy).toHaveBeenCalled();
      });

      it('should dispose of the addon', () => {
        const instance = extension.register() as SlickGridMenu;
        const destroySpy = jest.spyOn(instance, 'destroy');

        extension.dispose();

        expect(destroySpy).toHaveBeenCalled();
      });
    });

    describe('addGridMenuCustomCommands method', () => {
      afterEach(() => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      });

      it('should expect an empty "customItems" array when both Filter & Sort are disabled', () => {
        extension.register();
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([]);
      });

      it('should expect menu related to "Clear Frozen Columns"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, gridMenu: { hideClearFrozenColumnsCommand: false, } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-times', title: 'Libérer les colonnes gelées', disabled: false, command: 'clear-frozen-columns', positionOrder: 49 },
        ]);
      });

      it('should expect all menu related to Filter when "enableFilering" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-filter text-danger', title: 'Supprimer tous les filtres', disabled: false, command: 'clear-filter', positionOrder: 50 },
          { iconCssClass: 'fa fa-random', title: 'Basculer la ligne des filtres', disabled: false, command: 'toggle-filter', positionOrder: 52 },
          { iconCssClass: 'fa fa-refresh', title: 'Rafraîchir les données', disabled: false, command: 'refresh-dataset', positionOrder: 56 }
        ]);
      });

      it('should have only 1 menu "clear-filter" when all other menus are defined as hidden & when "enableFilering" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, gridMenu: { hideClearFrozenColumnsCommand: true, hideToggleFilterCommand: true, hideRefreshDatasetCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-filter text-danger', title: 'Supprimer tous les filtres', disabled: false, command: 'clear-filter', positionOrder: 50 }
        ]);
      });

      it('should have only 1 menu "toggle-filter" when all other menus are defined as hidden & when "enableFilering" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, gridMenu: { hideClearFrozenColumnsCommand: true, hideClearAllFiltersCommand: true, hideRefreshDatasetCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-random', title: 'Basculer la ligne des filtres', disabled: false, command: 'toggle-filter', positionOrder: 52 },
        ]);
      });

      it('should have only 1 menu "refresh-dataset" when all other menus are defined as hidden & when "enableFilering" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, gridMenu: { hideClearFrozenColumnsCommand: true, hideClearAllFiltersCommand: true, hideToggleFilterCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-refresh', title: 'Rafraîchir les données', disabled: false, command: 'refresh-dataset', positionOrder: 56 }
        ]);
      });

      it('should have the "toggle-preheader" menu command when "showPreHeaderPanel" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, showPreHeaderPanel: true } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-random', title: 'Basculer la ligne de pré-en-tête', disabled: false, command: 'toggle-preheader', positionOrder: 52 }
        ]);
      });

      it('should not have the "toggle-preheader" menu command when "showPreHeaderPanel" and "hideTogglePreHeaderCommand" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, showPreHeaderPanel: true, gridMenu: { hideClearFrozenColumnsCommand: true, hideTogglePreHeaderCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([]);
      });

      it('should have the "clear-sorting" menu command when "enableSorting" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableSorting: true } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-unsorted text-danger', title: 'Supprimer tous les tris', disabled: false, command: 'clear-sorting', positionOrder: 51 }
        ]);
      });

      it('should not have the "clear-sorting" menu command when "enableSorting" and "hideClearAllSortingCommand" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableSorting: true, gridMenu: { hideClearFrozenColumnsCommand: true, hideClearAllSortingCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([]);
      });

      it('should have the "export-csv" menu command when "enableTextExport" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, gridMenu: { hideClearFrozenColumnsCommand: true, hideExportExcelCommand: true, hideExportTextDelimitedCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-download', title: 'Exporter en format CSV', disabled: false, command: 'export-csv', positionOrder: 53 }
        ]);
      });

      it('should not have the "export-csv" menu command when "enableTextExport" and "hideExportCsvCommand" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, gridMenu: { hideClearFrozenColumnsCommand: true, hideExportExcelCommand: true, hideExportCsvCommand: true, hideExportTextDelimitedCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([]);
      });

      it('should have the "export-excel" menu command when "enableTextExport" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: true, enableTextExport: false, gridMenu: { hideClearFrozenColumnsCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: false } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-file-excel-o text-success', title: 'Exporter vers Excel', disabled: false, command: 'export-excel', positionOrder: 54 }
        ]);
      });

      it('should have the "export-text-delimited" menu command when "enableTextExport" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, gridMenu: { hideClearFrozenColumnsCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        extension.register(); // calling 2x register to make sure it doesn't duplicate commands
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { iconCssClass: 'fa fa-download', title: 'Exporter en format texte (délimité par tabulation)', disabled: false, command: 'export-text-delimited', positionOrder: 55 }
        ]);
      });

      it('should not have the "export-text-delimited" menu command when "enableTextExport" and "hideExportCsvCommand" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, gridMenu: { hideClearFrozenColumnsCommand: true, hideExportExcelCommand: true, hideExportCsvCommand: true, hideExportTextDelimitedCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([]);
      });
    });

    describe('adding Grid Menu Custom Items', () => {
      const customItemsMock = [{
        iconCssClass: 'fa fa-question-circle',
        titleKey: 'HELP',
        disabled: false,
        command: 'help',
        positionOrder: 99
      }];

      beforeEach(() => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableTextExport: true,
          gridMenu: {
            customItems: customItemsMock,
            hideClearFrozenColumnsCommand: true,
            hideExportCsvCommand: false,
            hideExportExcelCommand: false,
            hideExportTextDelimitedCommand: true,
            hideRefreshDatasetCommand: true,
            hideSyncResizeButton: true,
            hideToggleFilterCommand: true,
            hideTogglePreHeaderCommand: true
          }
        } as unknown as GridOption;

        jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(dataViewStub);
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
      });

      afterEach(() => {
        extension.dispose();
      });

      it('should have user grid menu custom items', () => {
        extension.register();
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { command: 'export-csv', disabled: false, iconCssClass: 'fa fa-download', positionOrder: 53, title: 'Exporter en format CSV' },
          // { command: 'export-excel', disabled: false, iconCssClass: 'fa fa-file-excel-o text-success', positionOrder: 53, title: 'Exporter vers Excel' },
          { command: 'help', disabled: false, iconCssClass: 'fa fa-question-circle', positionOrder: 99, title: 'Aide', titleKey: 'HELP' },
        ]);
      });

      it('should have same user grid menu custom items even when grid menu extension is registered multiple times', () => {
        extension.register();
        extension.register();
        expect(SharedService.prototype.gridOptions.gridMenu!.customItems).toEqual([
          { command: 'export-csv', disabled: false, iconCssClass: 'fa fa-download', positionOrder: 53, title: 'Exporter en format CSV' },
          // { command: 'export-excel', disabled: false, iconCssClass: 'fa fa-file-excel-o text-success', positionOrder: 53, title: 'Exporter vers Excel' },
          { command: 'help', disabled: false, iconCssClass: 'fa fa-question-circle', positionOrder: 99, title: 'Aide', titleKey: 'HELP' },
        ]);
      });
    });

    describe('refreshBackendDataset method', () => {
      afterEach(() => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      });

      it('should throw an error when backendServiceApi is not provided in the grid options', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, backendServiceApi: {} } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        expect(() => extension.refreshBackendDataset()).toThrowError(`BackendServiceApi requires at least a "process" function and a "service" defined`);
      });

      it('should call the backend service API to refresh the dataset', (done) => {
        const now = new Date();
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const processResult = {
          data: { users: { nodes: [] }, pageInfo: { hasNextPage: true }, totalCount: 0 },
          metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 }
        };
        const preSpy = jest.spyOn(gridOptionsMock.backendServiceApi as BackendServiceApi, 'preProcess');
        const postSpy = jest.spyOn(gridOptionsMock.backendServiceApi as BackendServiceApi, 'postProcess');
        const promise = new Promise((resolve) => setTimeout(() => resolve(processResult), 1));
        const processSpy = jest.spyOn(gridOptionsMock.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(promise);
        jest.spyOn(gridOptionsMock.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);

        extension.refreshBackendDataset({ enableAddRow: true });

        expect(preSpy).toHaveBeenCalled();
        expect(processSpy).toHaveBeenCalled();
        promise.then(() => {
          expect(postSpy).toHaveBeenCalledWith(processResult);
          done();
        });
      });
    });

    describe('executeGridMenuInternalCustomCommands method', () => {
      afterEach(() => {
        jest.clearAllMocks();
        extension.eventHandler.unsubscribeAll();
        mockGridMenuAddon.onCommand = new Slick.Event();
      });

      it('should call "clearFrozenColumns" when the command triggered is "clear-frozen-columns"', () => {
        const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 1));

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'clear-frozen-columns' }, column: {} as Column, grid: gridStub, command: 'clear-frozen-columns' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(setColumnsSpy).toHaveBeenCalled();
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: -1, enableMouseWheelScrollHandler: false });
      });

      it('should call "clearFilters" and dataview refresh when the command triggered is "clear-filter"', () => {
        const filterSpy = jest.spyOn(filterServiceStub, 'clearFilters');
        const refreshSpy = jest.spyOn(SharedService.prototype.dataView, 'refresh');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'clear-filter' }, column: {} as Column, grid: gridStub, command: 'clear-filter' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(filterSpy).toHaveBeenCalled();
        expect(refreshSpy).toHaveBeenCalled();
      });

      it('should call "clearSorting" and dataview refresh when the command triggered is "clear-sorting"', () => {
        const sortSpy = jest.spyOn(sortServiceStub, 'clearSorting');
        const refreshSpy = jest.spyOn(SharedService.prototype.dataView, 'refresh');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'clear-sorting' }, column: {} as Column, grid: gridStub, command: 'clear-sorting' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(sortSpy).toHaveBeenCalled();
        expect(refreshSpy).toHaveBeenCalled();
      });

      it('should call "exportToExcel" and expect an error thrown when ExcelExportService is not registered prior to calling the method', (done) => {
        try {
          jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);
          const instance = extension.register() as SlickGridMenu;
          instance.onCommand!.notify({ item: { command: 'export-excel' }, column: {} as Column, grid: gridStub, command: 'export-excel' }, new Slick.EventData(), gridStub);
        } catch (e) {
          expect(e.message).toContain('[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Grid Menu.');
          done();
        }
      });

      it('should call "exportToFile" with CSV and expect an error thrown when TextExportService is not registered prior to calling the method', (done) => {
        try {
          jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);
          const instance = extension.register() as SlickGridMenu;
          instance.onCommand!.notify({ item: { command: 'export-csv' }, column: {} as Column, grid: gridStub, command: 'export-csv' }, new Slick.EventData(), gridStub);
        } catch (e) {
          expect(e.message).toContain('[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu.');
          done();
        }
      });

      it('should call "exportToFile" with Text Delimited and expect an error thrown when TextExportService is not registered prior to calling the method', (done) => {
        try {
          const instance = extension.register() as SlickGridMenu;
          instance.onCommand!.notify({ item: { command: 'export-text-delimited' }, column: {} as Column, grid: gridStub, command: 'export-text-delimited' }, new Slick.EventData(), gridStub);
        } catch (e) {
          expect(e.message).toContain('[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu.');
          done();
        }
      });

      it('should call "exportToExcel" when the command triggered is "export-excel"', () => {
        const excelExportSpy = jest.spyOn(excelExportServiceStub, 'exportToExcel');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([excelExportServiceStub]);

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'export-excel' }, column: {} as Column, grid: gridStub, command: 'export-excel' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(excelExportSpy).toHaveBeenCalled();
      });

      it('should call "exportToFile" with CSV set when the command triggered is "export-csv"', () => {
        const exportSpy = jest.spyOn(exportServiceStub, 'exportToFile');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([exportServiceStub]);

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'export-csv' }, column: {} as Column, grid: gridStub, command: 'export-csv' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(exportSpy).toHaveBeenCalledWith({
          delimiter: DelimiterType.comma,
          format: FileType.csv,
        });
      });

      it('should call "exportToFile" with Text Delimited set when the command triggered is "export-text-delimited"', () => {
        const exportSpy = jest.spyOn(exportServiceStub, 'exportToFile');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([exportServiceStub]);

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'export-text-delimited' }, column: {} as Column, grid: gridStub, command: 'export-text-delimited' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(exportSpy).toHaveBeenCalledWith({
          delimiter: DelimiterType.tab,
          format: FileType.txt,
        });
      });

      it('should call the grid "setHeaderRowVisibility" method when the command triggered is "toggle-filter"', () => {
        gridOptionsMock.showHeaderRow = false;
        const gridSpy = jest.spyOn(gridStub, 'setHeaderRowVisibility');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');
        const setColumnSpy = jest.spyOn(gridStub, 'setColumns');

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'toggle-filter' }, column: {} as Column, grid: gridStub, command: 'toggle-filter' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(gridSpy).toHaveBeenCalledWith(true);
        expect(setColumnSpy).toHaveBeenCalledTimes(1);

        gridOptionsMock.showHeaderRow = true;
        instance.onCommand!.notify({ item: { command: 'toggle-filter' }, column: {} as Column, grid: gridStub, command: 'toggle-filter' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(gridSpy).toHaveBeenCalledWith(false);
        expect(setColumnSpy).toHaveBeenCalledTimes(1); // same as before, so count won't increase
      });

      it('should call the grid "setTopPanelVisibility" method when the command triggered is "toggle-toppanel"', () => {
        gridOptionsMock.showTopPanel = false;
        const gridSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setTopPanelVisibility');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'toggle-toppanel' }, column: {} as Column, grid: gridStub, command: 'toggle-toppanel' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(gridSpy).toHaveBeenCalledWith(true);

        gridOptionsMock.showTopPanel = true;
        instance.onCommand!.notify({ item: { command: 'toggle-toppanel' }, column: {} as Column, grid: gridStub, command: 'toggle-toppanel' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(gridSpy).toHaveBeenCalledWith(false);
      });

      it('should call the grid "setPreHeaderPanelVisibility" method when the command triggered is "toggle-preheader"', () => {
        gridOptionsMock.showPreHeaderPanel = false;
        const gridSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setPreHeaderPanelVisibility');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'toggle-preheader' }, column: {} as Column, grid: gridStub, command: 'toggle-preheader' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(gridSpy).toHaveBeenCalledWith(true);

        gridOptionsMock.showPreHeaderPanel = true;
        instance.onCommand!.notify({ item: { command: 'toggle-preheader' }, column: {} as Column, grid: gridStub, command: 'toggle-preheader' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(gridSpy).toHaveBeenCalledWith(false);
      });

      it('should call "refreshBackendDataset" method when the command triggered is "refresh-dataset"', () => {
        const refreshSpy = jest.spyOn(extension, 'refreshBackendDataset');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.gridMenu as GridMenu, 'onCommand');

        const instance = extension.register() as SlickGridMenu;
        instance.onCommand!.notify({ item: { command: 'refresh-dataset' }, column: {} as Column, grid: gridStub, command: 'refresh-dataset' }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(refreshSpy).toHaveBeenCalled();
      });
    });

    describe('translateGridMenu method', () => {
      it('should translate the column picker header titles', () => {
        const utilitySpy = jest.spyOn(extensionUtility, 'getPickerTitleOutputString');
        const translateSpy = jest.spyOn(extensionUtility, 'translateItems');

        const instance = extension.register() as SlickGridMenu;
        extension.translateGridMenu();
        const updateColsSpy = jest.spyOn(instance, 'updateAllTitles');

        expect(utilitySpy).toHaveBeenCalled();
        expect(translateSpy).toHaveBeenCalled();
        expect(updateColsSpy).toHaveBeenCalledWith(SharedService.prototype.gridOptions.gridMenu);
        expect(SharedService.prototype.gridOptions.gridMenu!.columnTitle).toBe('Colonnes');
        expect(SharedService.prototype.gridOptions.gridMenu!.forceFitTitle).toBe('Ajustement forcé des colonnes');
        expect(SharedService.prototype.gridOptions.gridMenu!.syncResizeTitle).toBe('Redimension synchrone');
        expect(columnsMock).toEqual([
          { id: 'field1', field: 'field1', width: 100, name: 'Titre', nameKey: 'TITLE' },
          { id: 'field2', field: 'field2', width: 75 }
        ]);
      });
    });

    describe('showGridMenu method', () => {
      it('should call the show grid menu', () => {
        const instance = extension.register() as SlickGridMenu;

        const showSpy = jest.spyOn(instance, 'showGridMenu');
        extension.showGridMenu(null as any);

        expect(showSpy).toHaveBeenCalled();
      });
    });
  });

  describe('without Translate Service', () => {
    beforeEach(() => {
      translateService = undefined as any;
      extension = new GridMenuExtension({} as ExtensionUtility, filterServiceStub, { gridOptions: { enableTranslate: true } } as SharedService, {} as SortService, translateService);
    });

    it('should throw an error if "enableTranslate" is set but the I18N Service is null', () => {
      expect(() => extension.register()).toThrowError('[Slickgrid-Universal] requires a Translate Service to be installed and configured');
    });
  });
});
