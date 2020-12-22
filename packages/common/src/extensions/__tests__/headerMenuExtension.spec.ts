import { HeaderMenuExtension } from '../headerMenuExtension';
import { ExtensionUtility } from '../extensionUtility';
import { SharedService } from '../../services/shared.service';
import { Column, ColumnSort, SlickDataView, GridOption, SlickGrid, SlickNamespace, HeaderMenu, SlickHeaderMenu } from '../../interfaces/index';
import { FilterService, SortService, PubSubService } from '../../services';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

declare const Slick: SlickNamespace;
jest.mock('flatpickr', () => { });

const filterServiceStub = {
  clearFilterByColumnId: jest.fn(),
} as unknown as FilterService;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as PubSubService;

const sortServiceStub = {
  clearSortByColumnId: jest.fn(),
  clearSorting: jest.fn(),
  emitSortChanged: jest.fn(),
  getCurrentColumnSorts: jest.fn(),
  onBackendSortChanged: jest.fn(),
  onLocalSortChanged: jest.fn(),
} as unknown as SortService;

const dataViewStub = {
  refresh: jest.fn(),
} as unknown as SlickDataView;

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getColumns: jest.fn(),
  getOptions: jest.fn(),
  registerPlugin: jest.fn(),
  setColumns: jest.fn(),
  setHeaderRowVisibility: jest.fn(),
  setTopPanelVisibility: jest.fn(),
  setPreHeaderPanelVisibility: jest.fn(),
  setOptions: jest.fn(),
  setSortColumns: jest.fn(),
  onSort: new Slick.Event(),
} as unknown as SlickGrid;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn(),
  onAfterMenuShow: new Slick.Event(),
  onBeforeMenuShow: new Slick.Event(),
  onColumnsChanged: new Slick.Event(),
  onCommand: new Slick.Event(),
}));

describe('headerMenuExtension', () => {
  jest.mock('slickgrid/plugins/slick.headermenu', () => mockAddon);
  Slick.Plugins = { HeaderMenu: mockAddon } as any;

  const columnsMock: Column[] = [{ id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' }, { id: 'field2', field: 'field2', width: 75 }];
  let extensionUtility: ExtensionUtility;
  let extension: HeaderMenuExtension;
  let sharedService: SharedService;
  let translateService: TranslateServiceStub;
  let divElement: HTMLDivElement;

  const gridOptionsMock = {
    enableAutoSizeColumns: true,
    enableHeaderMenu: true,
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
    headerMenu: {
      hideFreezeColumnsCommand: false,
      hideForceFitButton: false,
      hideSyncResizeButton: true,
      onExtensionRegistered: jest.fn(),
      onCommand: () => { },
      onBeforeMenuShow: () => { },
      onAfterMenuShow: () => { },
    },
    multiColumnSort: true,
    pagination: {
      totalItems: 0
    },
    showHeaderRow: false,
    showTopPanel: false,
    showPreHeaderPanel: false
  } as unknown as GridOption;

  describe('with I18N Service', () => {
    beforeEach(() => {
      divElement = document.createElement('div');
      sharedService = new SharedService();
      translateService = new TranslateServiceStub();
      extensionUtility = new ExtensionUtility(sharedService, translateService);
      extension = new HeaderMenuExtension(extensionUtility, filterServiceStub, pubSubServiceStub, sharedService, sortServiceStub, translateService);
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
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
      });

      it('should register the addon', () => {
        const pluginSpy = jest.spyOn(SharedService.prototype.slickGrid, 'registerPlugin');
        const onRegisteredSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onExtensionRegistered');

        const instance = extension.register() as SlickHeaderMenu;
        const addonInstance = extension.getAddonInstance();

        expect(instance).toBeTruthy();
        expect(instance).toEqual(addonInstance);
        expect(mockAddon).toHaveBeenCalledWith({
          autoAlignOffset: 12,
          minWidth: 140,
          hideFreezeColumnsCommand: false,
          hideColumnHideCommand: false,
          hideForceFitButton: false,
          hideSyncResizeButton: true,
          hideSortCommands: false,
          title: '',
          onCommand: expect.anything(),
          onAfterMenuShow: expect.anything(),
          onBeforeMenuShow: expect.anything(),
          onExtensionRegistered: expect.anything(),
        });
        expect(onRegisteredSpy).toHaveBeenCalledWith(instance);
        expect(pluginSpy).toHaveBeenCalledWith(instance);
      });

      it('should call internal event handler subscribe and expect the "onBeforeMenuShow" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onBeforeSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onBeforeMenuShow');
        const onAfterSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onAfterMenuShow');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onBeforeMenuShow!.notify({ grid: gridStub, column: {} as Column, menu: divElement }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(3);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onBeforeSpy).toHaveBeenCalledWith(expect.anything(), { grid: gridStub, column: {} as Column, menu: divElement });
        expect(onCommandSpy).not.toHaveBeenCalled();
        expect(onAfterSpy).not.toHaveBeenCalled();
      });

      it('should call internal event handler subscribe and expect the "onAfterMenuShow" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onAfterSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onAfterMenuShow');
        const onBeforeSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onBeforeMenuShow');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onAfterMenuShow!.notify({ grid: gridStub, column: {} as Column, menu: divElement }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(3);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onAfterSpy).toHaveBeenCalledWith(expect.anything(), { grid: gridStub, column: {} as Column, menu: divElement });
        expect(onBeforeSpy).not.toHaveBeenCalled();
        expect(onCommandSpy).not.toHaveBeenCalled();
      });

      it('should call internal event handler subscribe and expect the "onCommand" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onBeforeSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onBeforeMenuShow');
        const onAfterSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onAfterMenuShow');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ grid: gridStub, command: 'help', item: { command: 'help' }, column: {} as Column }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(3);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onCommandSpy).toHaveBeenCalledWith(expect.anything(), { grid: gridStub, command: 'help', item: { command: 'help' }, column: {} as Column });
        expect(onBeforeSpy).not.toHaveBeenCalled();
        expect(onAfterSpy).not.toHaveBeenCalled();
      });

      it('should dispose of the addon', () => {
        const instance = extension.register() as SlickHeaderMenu;
        const destroySpy = jest.spyOn(instance, 'destroy');

        extension.dispose();

        expect(destroySpy).toHaveBeenCalled();
      });
    });

    describe('addHeaderMenuCustomCommands method', () => {
      const mockColumn = { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE', sortable: true, filterable: true } as any;

      beforeEach(() => {
        jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue([mockColumn]);
      });
      afterEach(() => {
        mockColumn.header = undefined;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      });

      it('should have the commands "frozen-columns" and "hide" in the header menu list', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, headerMenu: { hideFreezeColumnsCommand: false } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        expect(mockColumn.header.menu.items).not.toBeNull();
        expect(mockColumn.header.menu.items).toEqual([
          { iconCssClass: 'fa fa-thumb-tack', title: 'Geler les colonnes', command: 'freeze-columns', positionOrder: 48 },
          { divider: true, command: '', positionOrder: 49 },
          { iconCssClass: 'fa fa-times', title: 'Cacher la colonne', command: 'hide', positionOrder: 55 }
        ]);
      });

      it('should have the command "hide-column" in the header menu list', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: false } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        expect(mockColumn.header.menu.items).not.toBeNull();
        expect(mockColumn.header.menu.items).toEqual([
          { iconCssClass: 'fa fa-times', title: 'Cacher la colonne', command: 'hide', positionOrder: 55 }
        ]);
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableSorting: true, headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);

        extension.register();

        const headerMenuExpected = [
          { iconCssClass: 'fa fa-sort-asc', title: 'Trier par ordre croissant', command: 'sort-asc', positionOrder: 50 },
          { iconCssClass: 'fa fa-sort-desc', title: 'Trier par ordre décroissant', command: 'sort-desc', positionOrder: 51 },
          { divider: true, command: '', positionOrder: 52 },
          { iconCssClass: 'fa fa-unsorted', title: 'Supprimer le tri', command: 'clear-sort', positionOrder: 54 }
        ];
        expect(mockColumn.header.menu.items).not.toBeNull();
        expect(mockColumn.header.menu.items).toEqual(headerMenuExpected);

        // double-check that registering again won't add duplicate commands
        extension.register();
        expect(mockColumn.header.menu.items).toEqual(headerMenuExpected);
      });

      it('should expect only the "hide-column" command in the menu when "enableSorting" and "hideSortCommands" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableSorting: true } as unknown as GridOption;
        copyGridOptionsMock.headerMenu!.hideColumnHideCommand = false;
        copyGridOptionsMock.headerMenu!.hideSortCommands = true;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);

        extension.register();

        expect(mockColumn.header.menu.items).not.toBeNull();
        expect(mockColumn.header.menu.items).toEqual([
          { iconCssClass: 'fa fa-thumb-tack', title: 'Geler les colonnes', command: 'freeze-columns', positionOrder: 48 },
          { divider: true, command: '', positionOrder: 49 },
          { iconCssClass: 'fa fa-times', title: 'Cacher la colonne', command: 'hide', positionOrder: 55 }
        ]);
      });

      it('should expect all menu related to Filtering when "enableFiltering" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true } } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);

        extension.register();

        const headerMenuExpected = [{ iconCssClass: 'fa fa-filter', title: 'Supprimer le filtre', command: 'clear-filter', positionOrder: 53 }];
        expect(mockColumn.header.menu.items).not.toBeNull();
        expect(mockColumn.header.menu.items).toEqual(headerMenuExpected);

        // double-check that registering again won't add duplicate commands
        extension.register();
        expect(mockColumn.header.menu.items).toEqual(headerMenuExpected);
      });
    });

    describe('hideColumn method', () => {
      it('should call hideColumn and expect "visibleColumns" to be updated accordingly', () => {
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(1);
        jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
        const setOptionSpy = jest.spyOn(gridStub, 'setOptions');
        const visibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
        const updatedColumnsMock = [{
          id: 'field1', field: 'field1', nameKey: 'TITLE', width: 100,
          header: {
            menu: {
              items: [
                { iconCssClass: 'fa fa-thumb-tack', title: 'Geler les colonnes', command: 'freeze-columns', positionOrder: 48 },
                { divider: true, command: '', positionOrder: 49 },
                { command: 'hide', iconCssClass: 'fa fa-times', positionOrder: 55, title: 'Cacher la colonne' }
              ]
            }
          }
        }] as Column[];

        extension.hideColumn(columnsMock[1]);

        expect(setOptionSpy).not.toHaveBeenCalled();
        expect(visibleSpy).toHaveBeenCalledWith(updatedColumnsMock);
        expect(setColumnsSpy).toHaveBeenCalledWith(updatedColumnsMock);
      });

      it('should call hideColumn and expect "setOptions" to be called with new "frozenColumn" index when the grid is detected to be a frozen grid', () => {
        gridOptionsMock.frozenColumn = 1;
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(1);
        jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
        const setOptionSpy = jest.spyOn(gridStub, 'setOptions');
        const visibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
        const updatedColumnsMock = [{
          id: 'field1', field: 'field1', nameKey: 'TITLE', width: 100,
          header: {
            menu: {
              items: [
                { iconCssClass: 'fa fa-thumb-tack', title: 'Geler les colonnes', command: 'freeze-columns', positionOrder: 48 },
                { divider: true, command: '', positionOrder: 49 },
                { command: 'hide', iconCssClass: 'fa fa-times', positionOrder: 55, title: 'Cacher la colonne' }
              ]
            }
          }
        }] as Column[];

        extension.hideColumn(columnsMock[1]);

        expect(setOptionSpy).toHaveBeenCalledWith({ frozenColumn: 0 });
        expect(visibleSpy).toHaveBeenCalledWith(updatedColumnsMock);
        expect(setColumnsSpy).toHaveBeenCalledWith(updatedColumnsMock);
      });
    });

    describe('translateHeaderMenu method', () => {
      it('should call the resetHeaderMenuTranslations and have all header menu translated', () => {
        const mockColumns: Column[] = [{
          id: 'field1', field: 'field1', width: 100,
          header: {
            menu: {
              items: [
                { iconCssClass: 'fa fa-thumb-tack', title: 'Geler les colonnes', command: 'freeze-columns', positionOrder: 48 },
                { divider: true, command: '', positionOrder: 49 },
                { iconCssClass: 'fa fa-sort-asc', title: 'Trier par ordre croissant', command: 'sort-asc', positionOrder: 50 },
                { iconCssClass: 'fa fa-sort-desc', title: 'Trier par ordre décroissant', command: 'sort-desc', positionOrder: 51 },
                { divider: true, command: '', positionOrder: 52 },
                { iconCssClass: 'fa fa-filter', title: 'Supprimer le filtre', command: 'clear-filter', positionOrder: 53 },
                { iconCssClass: 'fa fa-unsorted', title: 'Supprimer le tri', command: 'clear-sort', positionOrder: 54 },
                { iconCssClass: 'fa fa-times', command: 'hide', positionOrder: 55, title: 'Cacher la colonne' },
              ]
            }
          }
        }];
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(mockColumns);

        translateService.use('en');
        extension.translateHeaderMenu();

        expect(mockColumns).toEqual([{
          id: 'field1', field: 'field1', width: 100,
          header: {
            menu: {
              items: [
                { iconCssClass: 'fa fa-thumb-tack', title: 'Freeze Columns', command: 'freeze-columns', positionOrder: 48 },
                { divider: true, command: '', positionOrder: 49 },
                { iconCssClass: 'fa fa-sort-asc', title: 'Sort Ascending', command: 'sort-asc', positionOrder: 50 },
                { iconCssClass: 'fa fa-sort-desc', title: 'Sort Descending', command: 'sort-desc', positionOrder: 51 },
                { divider: true, command: '', positionOrder: 52 },
                { iconCssClass: 'fa fa-filter', title: 'Remove Filter', command: 'clear-filter', positionOrder: 53 },
                { iconCssClass: 'fa fa-unsorted', title: 'Remove Sort', command: 'clear-sort', positionOrder: 54 },
                { iconCssClass: 'fa fa-times', command: 'hide', positionOrder: 55, title: 'Hide Column' },
              ]
            }
          }
        }]);
      });
    });

    describe('executeHeaderMenuInternalCommands method', () => {
      it('should trigger the command "freeze-columns" and grid "setOptions" method to be called with current column position', () => {
        const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ column: columnsMock[0], grid: gridStub, command: 'freeze-columns', item: { command: 'freeze-columns' } }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: 0, enableMouseWheelScrollHandler: true });
        expect(setColumnsSpy).toHaveBeenCalled();
      });

      it('should trigger the command "freeze-columns" and grid "setOptions" method to be called with frozen column of -1 because the column found is not visible', () => {
        const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ column: columnsMock[1], grid: gridStub, command: 'freeze-columns', item: { command: 'freeze-columns' } }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: -1, enableMouseWheelScrollHandler: true });
        expect(setColumnsSpy).toHaveBeenCalled();
      });

      it('should trigger the command "hide" and expect the grid "autosizeColumns" method being called', () => {
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');
        const autosizeSpy = jest.spyOn(SharedService.prototype.slickGrid, 'autosizeColumns');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ column: columnsMock[0], grid: gridStub, command: 'hide', item: { command: 'hide' } }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(autosizeSpy).toHaveBeenCalled();
      });

      it('should trigger the command "clear-filter" and expect "clearColumnFilter" method being called with dataview refresh', () => {
        const filterSpy = jest.spyOn(filterServiceStub, 'clearFilterByColumnId');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ column: columnsMock[0], grid: gridStub, command: 'clear-filter', item: { command: 'clear-filter' } }, new Slick.EventData(), gridStub);

        expect(onCommandSpy).toHaveBeenCalled();
        expect(filterSpy).toHaveBeenCalledWith(expect.anything(), columnsMock[0].id);
      });

      it('should trigger the command "clear-sort" and expect "clearSortByColumnId" being called with event and column id', () => {
        const clearSortSpy = jest.spyOn(sortServiceStub, 'clearSortByColumnId');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ column: columnsMock[0], grid: gridStub, command: 'clear-sort', item: { command: 'clear-sort' } }, new Slick.EventData(), gridStub);

        expect(clearSortSpy).toHaveBeenCalledWith(expect.anything(), columnsMock[0].id);
        expect(onCommandSpy).toHaveBeenCalled();
      });

      it('should trigger the command "sort-asc" and expect Sort Service to call "onBackendSortChanged" being called without the sorted column', () => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const mockSortedCols: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } }];
        const mockSortedOuput: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } }];
        const previousSortSpy = jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const backendSortSpy = jest.spyOn(sortServiceStub, 'onBackendSortChanged');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');
        const setSortSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setSortColumns');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ column: mockSortedCols[1].sortCol, grid: gridStub, command: 'sort-asc', item: { command: 'sort-asc' } }, new Slick.EventData(), gridStub);

        expect(previousSortSpy).toHaveBeenCalled();
        expect(backendSortSpy).toHaveBeenCalledWith(expect.anything(), { multiColumnSort: true, sortCols: mockSortedOuput, grid: gridStub });
        expect(onCommandSpy).toHaveBeenCalled();
        expect(setSortSpy).toHaveBeenCalled();
      });

      it('should trigger the command "sort-desc" and expect Sort Service to call "onBackendSortChanged" being called without the sorted column', () => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const mockSortedCols: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } }];
        const mockSortedOuput: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } }];
        const previousSortSpy = jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const backendSortSpy = jest.spyOn(sortServiceStub, 'onBackendSortChanged');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');
        const setSortSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setSortColumns');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ column: mockSortedCols[1].sortCol, grid: gridStub, command: 'sort-desc', item: { command: 'sort-desc' } }, new Slick.EventData(), gridStub);

        expect(previousSortSpy).toHaveBeenCalled();
        expect(backendSortSpy).toHaveBeenCalledWith(expect.anything(), { multiColumnSort: true, sortCols: mockSortedOuput, grid: gridStub });
        expect(onCommandSpy).toHaveBeenCalled();
        expect(setSortSpy).toHaveBeenCalled();
      });

      it('should trigger the command "sort-desc" and expect Sort Service to call "onLocalSortChanged" being called without the sorted column', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, backendServiceApi: undefined } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(dataViewStub);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const mockSortedCols: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } }];
        const mockSortedOuput: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } }];
        const previousSortSpy = jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const localSortSpy = jest.spyOn(sortServiceStub, 'onLocalSortChanged');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');
        const setSortSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setSortColumns');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ column: mockSortedCols[1].sortCol, grid: gridStub, command: 'sort-desc', item: { command: 'sort-desc' } }, new Slick.EventData(), gridStub);

        expect(previousSortSpy).toHaveBeenCalled();
        expect(localSortSpy).toHaveBeenCalledWith(gridStub, mockSortedOuput);
        expect(onCommandSpy).toHaveBeenCalled();
        expect(setSortSpy).toHaveBeenCalled();
      });

      it('should trigger the command "sort-desc" and expect "onSort" event triggered when no DataView is provided', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, backendServiceApi: undefined } as unknown as GridOption;
        jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(undefined as any);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const mockSortedCols: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } }];
        const mockSortedOuput: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } }];
        const previousSortSpy = jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.headerMenu as HeaderMenu, 'onCommand');
        const setSortSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setSortColumns');
        const gridSortSpy = jest.spyOn(gridStub.onSort, 'notify');

        const instance = extension.register() as SlickHeaderMenu;
        instance.onCommand!.notify({ column: mockSortedCols[1].sortCol, grid: gridStub, command: 'sort-desc', item: { command: 'sort-desc' } }, new Slick.EventData(), gridStub);

        expect(previousSortSpy).toHaveBeenCalled();
        expect(gridSortSpy).toHaveBeenCalledWith(mockSortedOuput);
        expect(onCommandSpy).toHaveBeenCalled();
        expect(setSortSpy).toHaveBeenCalled();
      });
    });
  });

  describe('without Translate Service', () => {
    beforeEach(() => {
      translateService = undefined as any;
      extension = new HeaderMenuExtension({} as ExtensionUtility, filterServiceStub, pubSubServiceStub, { gridOptions: { enableTranslate: true } } as SharedService, {} as SortService, translateService);
    });

    it('should throw an error if "enableTranslate" is set but the Translate Service is null', () => {
      expect(() => extension.register()).toThrowError('[Slickgrid-Universal] requires a Translate Service to be installed and configured');
    });
  });
});
