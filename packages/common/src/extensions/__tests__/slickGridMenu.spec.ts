import 'jest-extended';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import { DelimiterType, FileType } from '../../enums/index';
import type { Column, DOMEvent, GridMenu, GridOption } from '../../interfaces/index';
import { SlickGridMenu } from '../slickGridMenu';
import { BackendUtilityService, type ExcelExportService, type FilterService, SharedService, type SortService, type TextExportService, } from '../../services';
import { type SlickDataView, SlickEvent, SlickEventData, type SlickGrid } from '../../core/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { ExtensionUtility } from '../../extensions/extensionUtility';

const gridId = 'grid1';
const gridUid = 'slickgrid_124343';
const containerId = 'demo-container';

const excelExportServiceStub = {
  className: 'ExcelExportService',
  exportToExcel: jest.fn(),
} as unknown as ExcelExportService;

const textExportServiceStub = {
  className: 'TextExportService',
  exportToFile: jest.fn(),
} as unknown as TextExportService;

const filterServiceStub = {
  clearFilters: jest.fn(),
} as unknown as FilterService;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  subscribeEvent: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

const sortServiceStub = {
  clearSorting: jest.fn(),
} as unknown as SortService;

const dataViewStub = {
  refresh: jest.fn(),
} as unknown as SlickDataView;

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getColumns: jest.fn(),
  getContainerNode: jest.fn(),
  getGridPosition: () => ({ width: 10, left: 0 }),
  getOptions: jest.fn(),
  getSelectedRows: jest.fn(),
  getUID: () => gridUid,
  registerPlugin: jest.fn(),
  setColumns: jest.fn(),
  setHeaderRowVisibility: jest.fn(),
  setSelectedRows: jest.fn(),
  setTopPanelVisibility: jest.fn(),
  setPreHeaderPanelVisibility: jest.fn(),
  setOptions: jest.fn(),
  scrollColumnIntoView: jest.fn(),
  onBeforeDestroy: new SlickEvent(),
  onClick: new SlickEvent(),
  onColumnsReordered: new SlickEvent(),
  onSetOptions: new SlickEvent(),
} as unknown as SlickGrid;

// define a <div> container to simulate the grid container
const template =
  `<div id="${containerId}" style="height: 800px; width: 600px;">
    <div id="slickGridContainer-${gridId}" class="grid-pane" style="width: 100%;">
      <div id="${gridId}" class="${gridUid} slickgrid-container" style="width: 100%">
        <div class="slick-pane slick-pane-header slick-pane-left">
          <div class="slick-headerrow"></div>
          <div class="slick-header-left"></div>
        </div>
        <div class="slick-pane slick-pane-header slick-pane-right">
          <div class="slick-headerrow"></div>
          <div class="slick-header-right"></div>
        </div>
      </div>
    </div>
  </div>`;

describe('GridMenuControl', () => {
  let control: SlickGridMenu;
  const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
  const columnsMock: Column[] = [
    { id: 'field1', field: 'field1', name: 'Field 1', width: 100, nameKey: 'TITLE' },
    { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
    { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
  ];
  let backendUtilityService: BackendUtilityService;
  let extensionUtility: ExtensionUtility;
  let translateService: TranslateServiceStub;
  let sharedService: SharedService;

  const gridMenuOptionsMock = {
    commandLabels: {
      clearAllFiltersCommandKey: 'CLEAR_ALL_FILTERS',
      clearAllSortingCommandKey: 'CLEAR_ALL_SORTING',
      clearFrozenColumnsCommandKey: 'CLEAR_PINNING',
      exportCsvCommandKey: 'EXPORT_TO_CSV',
      exportExcelCommandKey: 'EXPORT_TO_EXCEL',
      exportTextDelimitedCommandKey: 'EXPORT_TO_TAB_DELIMITED',
      refreshDatasetCommandKey: 'REFRESH_DATASET',
      toggleFilterCommandKey: 'TOGGLE_FILTER_ROW',
      togglePreHeaderCommandKey: 'TOGGLE_PRE_HEADER_ROW',
    },
    commandTitleKey: 'COMMANDS',
    commandItems: [],
    hideClearAllFiltersCommand: false,
    hideClearFrozenColumnsCommand: true,
    hideForceFitButton: false,
    hideSyncResizeButton: true,
    hideToggleDarkModeCommand: true,
    onExtensionRegistered: jest.fn(),
    onCommand: () => { },
    onColumnsChanged: () => { },
    onAfterMenuShow: () => { },
    onBeforeMenuShow: () => { },
    onMenuClose: () => { },
  };
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
    gridMenu: gridMenuOptionsMock,
    pagination: {
      totalItems: 0
    },
    showHeaderRow: false,
    showTopPanel: false,
    showPreHeaderPanel: false
  } as unknown as GridOption;
  let div;

  describe('with I18N Service', () => {
    const consoleErrorSpy = jest.spyOn(global.console, 'error').mockReturnValue();

    beforeEach(() => {
      div = document.createElement('div');
      div.innerHTML = template;
      document.body.appendChild(div);
      backendUtilityService = new BackendUtilityService();
      sharedService = new SharedService();
      translateService = new TranslateServiceStub();
      extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);

      jest.spyOn(gridStub, 'getContainerNode').mockReturnValue(document.body as HTMLDivElement);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(dataViewStub);
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
      jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 1));
      jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);

      control = new SlickGridMenu(extensionUtility, filterServiceStub, pubSubServiceStub, sharedService, sortServiceStub);
      translateService.use('en');
    });

    afterEach(() => {
      control?.eventHandler.unsubscribeAll();
      control?.dispose();
      jest.clearAllMocks();
    });

    describe('registered control', () => {
      beforeEach(() => {
        control.dispose();
        document.body.innerHTML = '';
        div = document.createElement('div');
        div.innerHTML = template;
        document.body.appendChild(div);
      });

      afterEach(() => {
        gridMenuOptionsMock.onBeforeMenuShow = undefined as any;
        control?.eventHandler.unsubscribeAll();
        gridOptionsMock.gridMenu = gridMenuOptionsMock;
        jest.clearAllMocks();
        control.dispose();
      });

      it('should expect the Control to be created', () => {
        expect(control).toBeTruthy();
      });

      it('should query an input checkbox change event and expect "setSelectedRows" method to be called using Row Selection when enabled', () => {
        const mockRowSelection = [0, 3, 5];
        jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
        jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);
        const setSelectionSpy = jest.spyOn(gridStub, 'setSelectedRows');

        gridOptionsMock.enableRowSelection = true;
        control.columns = columnsMock;
        control.init();
        control.openGridMenu();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const inputElm = control.menuElement!.querySelector('input[type="checkbox"]') as HTMLInputElement;
        inputElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        expect(control.menuElement!.style.display).toBe('block');
        expect(setSelectionSpy).toHaveBeenCalledWith(mockRowSelection);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
      });

      it('should open the Grid Menu and then expect it to hide when clicking anywhere in the DOM body', () => {
        const mockRowSelection = [0, 3, 5];
        jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
        jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);

        gridOptionsMock.enableRowSelection = true;
        gridOptionsMock.showHeaderRow = true;
        gridOptionsMock.gridMenu!.menuWidth = 16;
        gridOptionsMock.gridMenu!.resizeOnShowHeaderRow = true;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const headerRowElm = document.querySelector('.slick-headerrow') as HTMLDivElement;

        expect(control.menuElement!.style.display).toBe('block');
        expect(headerRowElm.style.width).toBe(`calc(100% - 16px)`);

        // click inside menu shouldn't close it
        control.menuElement!.dispatchEvent(new Event('mousedown', { bubbles: true }));
        expect(control.menuElement).toBeTruthy();

        // click anywhere else should close it
        const bodyElm = document.body;
        bodyElm.dispatchEvent(new Event('mousedown', { bubbles: true }));

        expect(control.menuElement).toBeFalsy();
      });

      it('should query an input checkbox change event and expect "readjustFrozenColumnIndexWhenNeeded" method to be called when the grid is detected to be a frozen grid', () => {
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
        const readjustSpy = jest.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

        gridOptionsMock.frozenColumn = 0;
        control.columns = columnsMock;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);

        // cell click should close it
        gridStub.onClick.notify({ row: 1, cell: 2, grid: gridStub }, eventData as any, gridStub);

        expect(control.menuElement).toBeFalsy();
      });

      it('should query an input checkbox change event and expect "readjustFrozenColumnIndexWhenNeeded" method to be called when the grid is detected to be a frozen grid', () => {
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
        const readjustSpy = jest.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

        gridOptionsMock.frozenColumn = 0;
        control.columns = columnsMock;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
      });

      it('should expect the Grid Menu to change from the Left side container to the Right side when changing from a regular to a frozen grid via "setOptions"', () => {
        const recreateSpy = jest.spyOn(control, 'recreateGridMenu');
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);

        control.initEventHandlers();
        gridStub.onSetOptions.notify({ grid: gridStub, optionsBefore: { frozenColumn: -1 }, optionsAfter: { frozenColumn: 2 } }, new SlickEventData(), gridStub);
        expect(recreateSpy).toHaveBeenCalledTimes(1);

        gridStub.onSetOptions.notify({ grid: gridStub, optionsBefore: { frozenColumn: 2 }, optionsAfter: { frozenColumn: -1 } }, new SlickEventData(), gridStub);
        expect(recreateSpy).toHaveBeenCalledTimes(2);
      });

      it('should query an input checkbox change event and expect "headerColumnValueExtractor" method to be called when defined', () => {
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
        const readjustSpy = jest.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

        gridOptionsMock.gridMenu!.headerColumnValueExtractor = (column: Column) => `${column?.columnGroup || ''} - ${column.name}`;
        control.columns = columnsMock;
        gridOptionsMock.frozenColumn = 0;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
        const liElmList = control.menuElement!.querySelectorAll<HTMLLIElement>('li');

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
        expect(liElmList[2].textContent).toBe('Billing - Field 3');
      });

      it('should query an input checkbox change event and expect "headerColumnValueExtractor" method to be called from default option when it is not provided', () => {
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
        const readjustSpy = jest.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

        gridOptionsMock.gridMenu!.headerColumnValueExtractor = null as any;
        control.columns = columnsMock;
        gridOptionsMock.frozenColumn = 0;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
        const liElmList = control.menuElement!.querySelectorAll<HTMLLIElement>('li');

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
        expect(liElmList[2].textContent).toBe('Field 3');
      });

      it('should open the Grid Menu and expect its minWidth and height to be overriden when provided as grid menu options', () => {
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

        gridOptionsMock.gridMenu!.contentMinWidth = 200;
        gridOptionsMock.gridMenu!.height = 300;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const gridMenuElm = document.querySelector('.slick-grid-menu') as HTMLDivElement;

        expect(gridMenuElm.style.minWidth).toBe('200px');
        expect(gridMenuElm.style.height).toBe('300px');
      });

      it('should enable Dark Mode and expect ".slick-dark-mode" CSS class to be found on parent element when opening Grid Menu', () => {
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

        gridOptionsMock.darkMode = true;
        gridOptionsMock.gridMenu!.contentMinWidth = 200;
        gridOptionsMock.gridMenu!.height = 300;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const gridMenuElm = document.querySelector('.slick-grid-menu') as HTMLDivElement;

        expect(gridMenuElm.style.minWidth).toBe('200px');
        expect(gridMenuElm.style.height).toBe('300px');
        expect(gridMenuElm.classList.contains('slick-dark-mode')).toBeTruthy();
      });

      it('should open the Grid Menu via "showGridMenu" method from an external button which has span inside it and expect the Grid Menu still work, with drop aligned on left when defined', () => {
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
        const repositionSpy = jest.spyOn(control, 'repositionMenu');

        control.init();
        const spanEvent = new MouseEvent('click', { bubbles: true, cancelable: true, composed: false });
        const spanBtnElm = document.createElement('span');
        const buttonElm = document.createElement('button');
        spanBtnElm.textContent = 'Grid Menu';
        Object.defineProperty(spanEvent, 'target', { writable: true, configurable: true, value: spanBtnElm });
        Object.defineProperty(spanBtnElm, 'parentElement', { writable: true, configurable: true, value: buttonElm });
        control.showGridMenu(spanEvent, { dropSide: 'left' });
        const gridMenuElm = document.querySelector('.slick-grid-menu') as HTMLDivElement;

        expect(gridMenuElm.style.display).toBe('block');
        expect(gridMenuElm.classList.contains('dropleft')).toBeTrue();
        expect(repositionSpy).toHaveBeenCalledTimes(1);
      });

      it('should open the Grid Menu via "showGridMenu" method from an external button which has span inside it and expect the Grid Menu still work, with drop aligned on right when defined', () => {
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
        const repositionSpy = jest.spyOn(control, 'repositionMenu');

        control.init();
        const spanEvent = new MouseEvent('click', { bubbles: true, cancelable: true, composed: false });
        const spanBtnElm = document.createElement('span');
        const buttonElm = document.createElement('button');
        spanBtnElm.textContent = 'Grid Menu';
        Object.defineProperty(spanEvent, 'target', { writable: true, configurable: true, value: spanBtnElm });
        Object.defineProperty(spanBtnElm, 'parentElement', { writable: true, configurable: true, value: buttonElm });
        control.showGridMenu(spanEvent, { dropSide: 'right' });
        const gridMenuElm = document.querySelector('.slick-grid-menu') as HTMLDivElement;

        expect(gridMenuElm.style.display).toBe('block');
        expect(gridMenuElm.classList.contains('dropright')).toBeTrue();
        expect(repositionSpy).toHaveBeenCalledTimes(1);
      });

      it('should open the Grid Menu and expect "Forcefit" to be checked when "hideForceFitButton" is false', () => {
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

        gridOptionsMock.gridMenu!.hideForceFitButton = false;
        gridOptionsMock.forceFitColumns = true;
        control.columns = columnsMock;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
        const inputForcefitElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-forcefit') as HTMLInputElement;
        const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-gridmenu-colpicker-forcefit]') as HTMLLabelElement;

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
        expect(inputForcefitElm.checked).toBeTruthy();
        expect(inputForcefitElm.dataset.option).toBe('autoresize');
        expect(labelSyncElm.textContent).toBe('Force fit columns');
      });

      it('should open the Grid Menu and expect "Sync Resize" to be checked when "hideSyncResizeButton" is false', () => {
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

        gridOptionsMock.gridMenu!.hideSyncResizeButton = false;
        gridOptionsMock.syncColumnCellResize = true;
        control.columns = columnsMock;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
        const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-syncresize') as HTMLInputElement;
        const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-gridmenu-colpicker-syncresize]') as HTMLLabelElement;

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
        expect(inputSyncElm.checked).toBeTruthy();
        expect(inputSyncElm.dataset.option).toBe('syncresize');
        expect(labelSyncElm.textContent).toBe('Synchronous resize');
      });

      it('should open the Grid Menu and expect "onColumnsChanged" to be called when defined', () => {
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const onColChangedMock = jest.fn();
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

        gridOptionsMock.gridMenu!.onColumnsChanged = onColChangedMock;
        control.columns = columnsMock;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));

        const expectedCallbackArgs = {
          columnId: 'field1',
          showing: true,
          allColumns: columnsMock,
          columns: columnsMock,
          visibleColumns: columnsMock,
          grid: gridStub,
        };
        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
        expect(onColChangedMock).toBeCalledWith(expect.anything(), expectedCallbackArgs);
        expect(pubSubSpy).toHaveBeenCalledWith('onGridMenuColumnsChanged', expectedCallbackArgs);
      });

      it('should open the grid menu via its hamburger menu and click on "Force Fit Columns" checkbox and expect "setOptions" and "setColumns" to be called with previous visible columns', () => {
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any as any).mockReturnValue(1);
        jest.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));
        const setOptionSpy = jest.spyOn(gridStub, 'setOptions');
        const setColumnSpy = jest.spyOn(gridStub, 'setColumns');

        gridOptionsMock.gridMenu!.hideForceFitButton = false;
        gridOptionsMock.gridMenu!.forceFitTitle = 'Custom Force Fit';
        control.columns = columnsMock;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const inputForcefitElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-forcefit') as HTMLInputElement;
        const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-gridmenu-colpicker-forcefit]') as HTMLLabelElement;
        inputForcefitElm.dispatchEvent(new Event('click', { bubbles: true }));

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(inputForcefitElm.checked).toBeTruthy();
        expect(inputForcefitElm.dataset.option).toBe('autoresize');
        expect(labelSyncElm.textContent).toBe('Custom Force Fit');
        expect(setOptionSpy).toHaveBeenCalledWith({ forceFitColumns: true });
        expect(setColumnSpy).toHaveBeenCalledWith(columnsMock.slice(1));
      });

      it('should open the grid menu via its hamburger menu and click on "syncresize" checkbox and expect "setOptions" to be called with "syncColumnCellResize" property', () => {
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
        jest.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));
        const setOptionSpy = jest.spyOn(gridStub, 'setOptions');

        gridOptionsMock.gridMenu!.hideSyncResizeButton = false;
        gridOptionsMock.gridMenu!.syncResizeTitle = 'Custom Resize Title';
        gridOptionsMock.syncColumnCellResize = true;
        control.columns = columnsMock;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-syncresize') as HTMLInputElement;
        const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-gridmenu-colpicker-syncresize]') as HTMLLabelElement;
        inputSyncElm.dispatchEvent(new Event('click', { bubbles: true }));

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(inputSyncElm.checked).toBeTruthy();
        expect(inputSyncElm.dataset.option).toBe('syncresize');
        expect(labelSyncElm.textContent).toBe('Custom Resize Title');
        expect(setOptionSpy).toHaveBeenCalledWith({ syncColumnCellResize: true });
      });

      it('should NOT show the Grid Menu when user defines the callback "menuUsabilityOverride" which returns False', () => {
        gridOptionsMock.gridMenu!.menuUsabilityOverride = () => false;
        gridOptionsMock.gridMenu!.hideForceFitButton = false;
        gridOptionsMock.gridMenu!.hideSyncResizeButton = false;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        expect(control.menuElement).toBeFalsy();
      });

      it('should NOT show the Grid Menu when user defines the callback "onBeforeMenuShow" which returns False', () => {
        gridOptionsMock.gridMenu!.menuUsabilityOverride = () => true;
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        gridOptionsMock.gridMenu!.onBeforeMenuShow = () => false;
        gridOptionsMock.gridMenu!.hideForceFitButton = false;
        gridOptionsMock.gridMenu!.hideSyncResizeButton = false;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        expect(control.menuElement).toBeFalsy();
        expect(pubSubSpy).toHaveBeenCalledWith('onGridMenuBeforeMenuShow', {
          grid: gridStub,
          menu: null,
          allColumns: columnsMock,
          columns: columnsMock,
          visibleColumns: columnsMock
        });
      });

      it('should show the Grid Menu when user defines the callback "onBeforeMenuShow" which returns True', () => {
        gridOptionsMock.gridMenu!.onBeforeMenuShow = () => true;
        gridOptionsMock.gridMenu!.hideForceFitButton = false;
        gridOptionsMock.gridMenu!.hideSyncResizeButton = false;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const forceFitElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-forcefit') as HTMLInputElement;
        const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-syncresize') as HTMLInputElement;

        expect(control.menuElement!.style.display).toBe('block');
        expect(forceFitElm).toBeTruthy();
        expect(inputSyncElm).toBeTruthy();
      });

      it('should execute "onAfterMenuShow" callback when defined', () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        gridOptionsMock.gridMenu!.onAfterMenuShow = () => true;
        const onAfterSpy = jest.spyOn(gridOptionsMock.gridMenu!, 'onAfterMenuShow');
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        expect(onAfterSpy).toHaveBeenCalled();
        expect(control.menuElement!.style.display).toBe('block');

        control.hideMenu(new Event('click', { bubbles: true, cancelable: true, composed: false }) as DOMEvent<HTMLDivElement>);
        expect(control.menuElement).toBeFalsy();
        expect(pubSubSpy).toHaveBeenCalledWith('onGridMenuAfterMenuShow', {
          grid: gridStub,
          menu: null,
          allColumns: columnsMock,
          columns: columnsMock,
          visibleColumns: columnsMock
        });
      });

      it('should NOT close the Grid Menu by calling "hideMenu" when user defines the callback "onMenuClose" which returns False', () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

        gridOptionsMock.gridMenu!.onMenuClose = () => false;
        gridOptionsMock.gridMenu!.hideForceFitButton = false;
        gridOptionsMock.gridMenu!.hideSyncResizeButton = false;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const forceFitElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-forcefit') as HTMLInputElement;
        const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-syncresize') as HTMLInputElement;

        expect(control.menuElement!.style.display).toBe('block');
        expect(forceFitElm).toBeTruthy();
        expect(inputSyncElm).toBeTruthy();

        control.hideMenu(new Event('click', { bubbles: true, cancelable: true, composed: false }) as DOMEvent<HTMLDivElement>);
        expect(control.menuElement!.style.display).toBe('block');
        expect(pubSubSpy).toHaveBeenCalledWith('onGridMenuMenuClose', {
          grid: gridStub,
          menu: document.querySelector('.slick-grid-menu'),
          allColumns: columnsMock,
          visibleColumns: columnsMock
        });
      });

      it('should close the Grid Menu by calling "hideMenu" when user defines the callback "onMenuClose" which returns True', () => {
        const autosizeSpy = jest.spyOn(gridStub, 'autosizeColumns');

        gridOptionsMock.gridMenu!.onMenuClose = () => true;
        gridOptionsMock.gridMenu!.hideForceFitButton = false;
        gridOptionsMock.gridMenu!.hideSyncResizeButton = false;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const forceFitElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-forcefit') as HTMLInputElement;
        const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-syncresize') as HTMLInputElement;

        expect(control.menuElement!.style.display).toBe('block');
        expect(forceFitElm).toBeTruthy();
        expect(inputSyncElm).toBeTruthy();

        control.hideMenu(new Event('click', { bubbles: true, cancelable: true, composed: false }) as DOMEvent<HTMLDivElement>);
        expect(control.menuElement).toBeFalsy();
        expect(autosizeSpy).not.toHaveBeenCalled();
      });

      it('should close the Grid Menu by calling "hideMenu" and call "autosizeColumns" when "enableAutoSizeColumns" is enabled and the columns are different', () => {
        gridOptionsMock.gridMenu!.hideForceFitButton = false;
        gridOptionsMock.gridMenu!.hideSyncResizeButton = false;
        gridOptionsMock.enableAutoSizeColumns = true;
        const autosizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const forceFitElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-forcefit') as HTMLInputElement;
        const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-gridmenu-colpicker-syncresize') as HTMLInputElement;
        const pickerField1Elm = document.querySelector('input[type="checkbox"][data-columnid="field1"]') as HTMLInputElement;
        expect(pickerField1Elm.checked).toBeTrue();
        pickerField1Elm.checked = false;
        pickerField1Elm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        expect(control.menuElement!.style.display).toBe('block');
        expect(forceFitElm).toBeTruthy();
        expect(inputSyncElm).toBeTruthy();
        expect(pickerField1Elm.checked).toBeFalse();

        control.hideMenu(new Event('click', { bubbles: true, cancelable: true, composed: false }) as DOMEvent<HTMLDivElement>);
        expect(control.menuElement).toBeFalsy();
        expect(autosizeSpy).toHaveBeenCalled();
      });

      it('should add a custom Grid Menu item and expect the "action" and "onCommand" callbacks to be called when command is clicked in the list', () => {
        const helpFnMock = jest.fn();
        const onCommandMock = jest.fn();
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', action: helpFnMock }];
        gridOptionsMock.gridMenu!.onCommand = onCommandMock;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;
        const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
        helpCommandElm.dispatchEvent(clickEvent);

        const expectedCallbackArgs = {
          grid: gridStub,
          command: 'help',
          item: { command: 'help', title: 'Help', action: helpFnMock },
          allColumns: columnsMock,
          visibleColumns: columnsMock
        };
        expect(helpFnMock).toHaveBeenCalled();
        expect(onCommandMock).toHaveBeenCalledWith(clickEvent, expectedCallbackArgs);
        expect(pubSubSpy).toHaveBeenCalledWith('onGridMenuCommand', expectedCallbackArgs);
      });

      it('should add a custom Grid Menu item and NOT expect the "action" and "onCommand" callbacks to be called when item is "disabled"', () => {
        const helpFnMock = jest.fn();
        const onCommandMock = jest.fn();

        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', action: helpFnMock, disabled: true }];
        gridOptionsMock.gridMenu!.onCommand = onCommandMock;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;
        const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
        helpCommandElm.dispatchEvent(clickEvent);

        expect(helpFnMock).not.toHaveBeenCalled();
        expect(onCommandMock).not.toHaveBeenCalled();
        expect(helpCommandElm.classList.contains('slick-menu-item-disabled')).toBeTrue();
      });

      it('should add a custom Grid Menu item and NOT expect the "action" and "onCommand" callbacks to be called when item "itemUsabilityOverride" callback returns False', () => {
        const helpFnMock = jest.fn();
        const onCommandMock = jest.fn();

        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', action: helpFnMock, itemUsabilityOverride: () => false }];
        gridOptionsMock.gridMenu!.onCommand = onCommandMock;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;
        const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
        helpCommandElm.dispatchEvent(clickEvent);

        expect(helpFnMock).not.toHaveBeenCalled();
        expect(onCommandMock).not.toHaveBeenCalled();
      });

      it('should add a custom Grid Menu item and expect the "action" and "onCommand" callbacks to be called when command is clicked in the list and its "itemUsabilityOverride" callback returns True', () => {
        const helpFnMock = jest.fn();
        const onCommandMock = jest.fn();

        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', action: helpFnMock, itemUsabilityOverride: () => true }];
        gridOptionsMock.gridMenu!.onCommand = onCommandMock;
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;
        const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
        helpCommandElm.dispatchEvent(clickEvent);

        expect(helpFnMock).toHaveBeenCalled();
        expect(onCommandMock).toHaveBeenCalledWith(clickEvent, {
          grid: gridStub,
          command: 'help',
          item: { command: 'help', title: 'Help', action: helpFnMock, disabled: false, itemUsabilityOverride: expect.toBeFunction(), },
          allColumns: columnsMock,
          visibleColumns: columnsMock
        });
      });

      it('should add a custom Grid Menu item and expect item to be hidden from the DOM list when "hidden" is enabled', () => {
        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', hidden: true }];
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;

        expect(helpCommandElm.classList.contains('slick-menu-item-hidden')).toBeTrue();
      });

      it('should add a custom Grid Menu item and expect item to NOT be created in the DOM list when "itemVisibilityOverride" callback returns False', () => {
        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', itemVisibilityOverride: () => false }];
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;

        expect(helpCommandElm).toBeFalsy();
      });

      it('should add a custom Grid Menu item and expect item to be disabled when "disabled" is set to True', () => {
        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', disabled: true }];
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;

        expect(helpCommandElm.classList.contains('slick-menu-item-disabled')).toBeTrue();
      });

      it('should add a custom Grid Menu "divider" item object and expect a divider to be created', () => {
        gridOptionsMock.gridMenu!.commandItems = [{ command: 'divider', divider: true }];
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=divider]') as HTMLInputElement;

        expect(helpCommandElm.classList.contains('slick-menu-item-divider')).toBeTrue();
      });

      it('should add a custom Grid Menu "divider" string and expect a divider to be created', () => {
        gridOptionsMock.gridMenu!.commandItems = ['divider'];
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item') as HTMLInputElement;

        expect(helpCommandElm.classList.contains('slick-menu-item-divider')).toBeTrue();
      });

      it('should add a custom Grid Menu item with "cssClass" and expect all classes to be added to the item in the DOM', () => {
        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', cssClass: 'text-danger red' }];
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;

        expect(helpCommandElm.classList.contains('slick-menu-item')).toBeTrue();
        expect(helpCommandElm.classList.contains('text-danger')).toBeTrue();
        expect(helpCommandElm.classList.contains('red')).toBeTrue();
        expect(helpCommandElm.className).toBe('slick-menu-item text-danger red');
      });

      it('should add a custom Grid Menu item with "iconCssClass" and expect an icon to be included on the item DOM element', () => {
        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', iconCssClass: 'mdi   mdi-close' }];
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;
        const helpIconElm = helpCommandElm.querySelector('.slick-menu-icon') as HTMLInputElement;
        const helpTextElm = helpCommandElm.querySelector('.slick-menu-content') as HTMLInputElement;

        expect(helpTextElm.textContent).toBe('Help');
        expect(helpIconElm.classList.contains('slick-menu-icon')).toBeTrue();
        expect(helpIconElm.classList.contains('mdi')).toBeTrue();
        expect(helpIconElm.classList.contains('mdi-close')).toBeTrue();
        expect(helpIconElm.className).toBe('slick-menu-icon mdi mdi-close');
      });

      it('should add a custom Grid Menu item with "tooltip" and expect the item title attribute to be part of the item DOM element', () => {
        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', tooltip: 'some tooltip text' }];
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;

        expect(helpCommandElm.title).toBe('some tooltip text');
      });

      it('should add a custom Grid Menu item with "textCssClass" and expect extra css classes added to the item text DOM element', () => {
        gridOptionsMock.gridMenu!.commandItems = [{ command: 'help', title: 'Help', textCssClass: 'red bold' }];
        control.columns = columnsMock;
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const helpCommandElm = control.menuElement!.querySelector('.slick-menu-item[data-command=help]') as HTMLInputElement;
        const helpTextElm = helpCommandElm.querySelector('.slick-menu-content') as HTMLInputElement;

        expect(helpTextElm.textContent).toBe('Help');
        expect(helpTextElm.classList.contains('red')).toBeTrue();
        expect(helpTextElm.classList.contains('bold')).toBeTrue();
        expect(helpTextElm.className).toBe('slick-menu-content red bold');
      });

      it('should be able to recreate the Grid Menu', () => {
        const deleteSpy = jest.spyOn(control, 'deleteMenu');
        const initSpy = jest.spyOn(control, 'init');

        control.recreateGridMenu();

        expect(deleteSpy).toBeCalled();
        expect(initSpy).toBeCalled();
      });

      describe('with sub-menus', () => {
        let mockCommandItems: any[] = [];
        const actionMock = jest.fn();

        beforeEach(() => {
          mockCommandItems = [
            { command: 'help', title: 'Help', textCssClass: 'red bold' },
            {
              command: 'sub-commands', title: 'Sub Commands', subMenuTitle: 'Sub Command Title', action: actionMock, commandItems: [
                { command: 'command3', title: 'Command 3', positionOrder: 70, },
                { command: 'command4', title: 'Command 4', positionOrder: 71, },
                {
                  command: 'more-sub-commands', title: 'More Sub Commands', subMenuTitle: 'Sub Command Title 2', subMenuTitleCssClass: 'text-color-warning', commandItems: [
                    { command: 'command5', title: 'Command 5', positionOrder: 72, },
                  ]
                }
              ]
            },
            {
              command: 'sub-commands2', title: 'Sub Commands 2', commandItems: [
                { command: 'command33', title: 'Command 33', positionOrder: 70, },
              ]
            }
          ];
        });

        it('should create a Grid Menu item with commands sub-menu items and expect sub-menu list to show in the DOM element aligned left when sub-menu is clicked', () => {
          const disposeSubMenuSpy = jest.spyOn(control, 'disposeSubMenus');
          Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });

          gridOptionsMock.gridMenu!.subItemChevronClass = 'mdi mdi-chevron-right';
          gridOptionsMock.gridMenu!.dropSide = 'left';
          gridOptionsMock.gridMenu!.commandItems = mockCommandItems;
          control.columns = columnsMock;
          control.init();
          const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
          buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          const gridMenu1Elm = document.body.querySelector('.slick-grid-menu.slick-menu-level-0') as HTMLDivElement;
          const commandList1Elm = gridMenu1Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
          Object.defineProperty(commandList1Elm, 'clientWidth', { writable: true, configurable: true, value: 70 });
          const subCommands1Elm = commandList1Elm.querySelector('[data-command="sub-commands"]') as HTMLDivElement;
          const helpCommandElm = commandList1Elm.querySelector('[data-command="help"]') as HTMLDivElement;
          Object.defineProperty(subCommands1Elm, 'clientWidth', { writable: true, configurable: true, value: 70 });
          const commandContentElm2 = subCommands1Elm.querySelector('.slick-menu-content') as HTMLDivElement;
          const commandChevronElm = commandList1Elm.querySelector('.sub-item-chevron') as HTMLSpanElement;

          subCommands1Elm!.dispatchEvent(new Event('click'));
          const gridMenu2Elm = document.body.querySelector('.slick-grid-menu.slick-menu-level-1') as HTMLDivElement;
          const commandList2Elm = gridMenu2Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
          const subCommand3Elm = commandList2Elm.querySelector('[data-command="command3"]') as HTMLDivElement;
          const subCommands2Elm = commandList2Elm.querySelector('[data-command="more-sub-commands"]') as HTMLDivElement;

          subCommands2Elm!.dispatchEvent(new Event('mouseover')); // mouseover or click should work
          const cellMenu3Elm = document.body.querySelector('.slick-grid-menu.slick-menu-level-2') as HTMLDivElement;
          const commandList3Elm = cellMenu3Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
          const subCommand5Elm = commandList3Elm.querySelector('[data-command="command5"]') as HTMLDivElement;
          const subMenuTitleElm = commandList3Elm.querySelector('.slick-menu-title') as HTMLDivElement;

          expect(commandList1Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
          expect(commandList2Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
          expect(commandContentElm2.textContent).toBe('Sub Commands');
          expect(subMenuTitleElm.textContent).toBe('Sub Command Title 2');
          expect(subMenuTitleElm.className).toBe('slick-menu-title text-color-warning');
          expect(commandChevronElm.className).toBe('sub-item-chevron mdi mdi-chevron-right');
          expect(subCommand3Elm.textContent).toContain('Command 3');
          expect(subCommand5Elm.textContent).toContain('Command 5');
          expect(gridMenu1Elm.classList.contains('dropleft'));
          expect(gridMenu2Elm.classList.contains('dropup')).toBeFalsy();
          expect(gridMenu2Elm.classList.contains('dropdown')).toBeTruthy();

          // return Grid Menu menu/sub-menu if it's already opened unless we are on different sub-menu tree if so close them all
          subCommands1Elm!.dispatchEvent(new Event('click'));
          expect(disposeSubMenuSpy).toHaveBeenCalledTimes(0);
          const subCommands12Elm = commandList1Elm.querySelector('[data-command="sub-commands2"]') as HTMLDivElement;
          subCommands12Elm!.dispatchEvent(new Event('mouseover'));
          expect(disposeSubMenuSpy).toHaveBeenCalledTimes(1);
          expect(disposeSubMenuSpy).toHaveBeenCalled();
          subCommands1Elm!.dispatchEvent(new Event('mouseover'));
          expect(disposeSubMenuSpy).toHaveBeenCalledTimes(2);

          // calling another command on parent menu should dispose sub-menus
          helpCommandElm!.dispatchEvent(new Event('mouseover'));
          expect(disposeSubMenuSpy).toHaveBeenCalledTimes(3);
        });

        it('should create a Cell Menu item with commands sub-menu items and expect sub-menu list to show in the DOM element align right when sub-menu is clicked', () => {
          const disposeSubMenuSpy = jest.spyOn(control, 'disposeSubMenus');
          Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });

          gridOptionsMock.gridMenu!.subItemChevronClass = 'mdi mdi-chevron-right';
          gridOptionsMock.gridMenu!.dropSide = 'right';
          gridOptionsMock.gridMenu!.commandItems = mockCommandItems;
          control.columns = columnsMock;
          control.init();
          const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
          buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          const gridMenu1Elm = document.body.querySelector('.slick-grid-menu.slick-menu-level-0') as HTMLDivElement;
          const commandList1Elm = gridMenu1Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
          const subCommands1Elm = commandList1Elm.querySelector('[data-command="sub-commands"]') as HTMLDivElement;
          const commandContentElm2 = subCommands1Elm.querySelector('.slick-menu-content') as HTMLDivElement;
          const commandChevronElm = commandList1Elm.querySelector('.sub-item-chevron') as HTMLSpanElement;

          subCommands1Elm!.dispatchEvent(new Event('click'));
          const gridMenu2Elm = document.body.querySelector('.slick-grid-menu.slick-menu-level-1') as HTMLDivElement;
          const commandList2Elm = gridMenu2Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
          const subCommand3Elm = commandList2Elm.querySelector('[data-command="command3"]') as HTMLDivElement;
          const subCommands2Elm = commandList2Elm.querySelector('[data-command="more-sub-commands"]') as HTMLDivElement;

          subCommands2Elm!.dispatchEvent(new Event('click'));
          const cellMenu3Elm = document.body.querySelector('.slick-grid-menu.slick-menu-level-2') as HTMLDivElement;
          const commandList3Elm = cellMenu3Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
          const subCommand5Elm = commandList3Elm.querySelector('[data-command="command5"]') as HTMLDivElement;
          const subMenuTitleElm = commandList3Elm.querySelector('.slick-menu-title') as HTMLDivElement;

          expect(commandList1Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
          expect(commandList2Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
          expect(commandContentElm2.textContent).toBe('Sub Commands');
          expect(subMenuTitleElm.textContent).toBe('Sub Command Title 2');
          expect(subMenuTitleElm.className).toBe('slick-menu-title text-color-warning');
          expect(commandChevronElm.className).toBe('sub-item-chevron mdi mdi-chevron-right');
          expect(subCommand3Elm.textContent).toContain('Command 3');
          expect(subCommand5Elm.textContent).toContain('Command 5');
          expect(gridMenu1Elm.classList.contains('dropright'));
          expect(gridMenu2Elm.classList.contains('dropup')).toBeFalsy();
          expect(gridMenu2Elm.classList.contains('dropdown')).toBeTruthy();

          // return menu/sub-menu if it's already opened unless we are on different sub-menu tree if so close them all
          subCommands1Elm!.dispatchEvent(new Event('click'));
          expect(disposeSubMenuSpy).toHaveBeenCalledTimes(0);
          const subCommands12Elm = commandList1Elm.querySelector('[data-command="sub-commands2"]') as HTMLDivElement;
          subCommands12Elm!.dispatchEvent(new Event('click'));
          expect(disposeSubMenuSpy).toHaveBeenCalledTimes(1);
          expect(disposeSubMenuSpy).toHaveBeenCalled();
        });

        it('should create a Grid Menu item with commands sub-menu items and expect sub-menu to be positioned on top (dropup)', () => {
          Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });

          gridOptionsMock.gridMenu!.commandItems = mockCommandItems;
          control.columns = columnsMock;
          control.init();

          const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
          buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          const gridMenu1Elm = document.body.querySelector('.slick-grid-menu.slick-menu-level-0') as HTMLDivElement;
          const commandList1Elm = gridMenu1Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
          const subCommands1Elm = commandList1Elm.querySelector('[data-command="sub-commands"]') as HTMLDivElement;

          subCommands1Elm!.dispatchEvent(new Event('click'));
          const gridMenu2Elm = document.body.querySelector('.slick-grid-menu.slick-menu-level-1') as HTMLDivElement;
          Object.defineProperty(gridMenu2Elm, 'clientHeight', { writable: true, configurable: true, value: 320 });

          const divEvent = new MouseEvent('click', { bubbles: true, cancelable: true, composed: false });
          const subMenuElm = document.createElement('div');
          const menuItem = document.createElement('div');
          menuItem.className = 'slick-menu-item';
          menuItem.style.top = '465px';
          jest.spyOn(menuItem, 'getBoundingClientRect').mockReturnValue({ top: 465, left: 25 } as any);
          Object.defineProperty(menuItem, 'target', { writable: true, configurable: true, value: menuItem });
          subMenuElm.className = 'slick-submenu';
          Object.defineProperty(divEvent, 'target', { writable: true, configurable: true, value: subMenuElm });
          menuItem.appendChild(subMenuElm);

          control.repositionMenu(divEvent, gridMenu2Elm);
          const gridMenu2Elm2 = document.body.querySelector('.slick-grid-menu.slick-menu-level-1') as HTMLDivElement;

          expect(gridMenu2Elm2.classList.contains('dropup')).toBeTruthy();
          expect(gridMenu2Elm2.classList.contains('dropdown')).toBeFalsy();
        });
      });

      describe('addGridMenuCustomCommands method', () => {
        beforeEach(() => {
          translateService.use('fr');
          control.translateGridMenu();
        });

        afterEach(() => {
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        });

        it('should expect an empty "commandItems" array when both Filter & Sort are disabled', () => {
          control.columns = columnsMock;
          control.init();
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([]);
        });

        it('should expect menu related to "Unfreeze Columns/Rows"', () => {
          const copyGridOptionsMock = { ...gridOptionsMock, gridMenu: { commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: false, hideToggleDarkModeCommand: true, } } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-pin-off-outline', titleKey: 'CLEAR_PINNING', title: 'Dégeler les colonnes/rangées', disabled: false, command: 'clear-pinning', positionOrder: 52 },
          ]);
        });

        it('should expect all menu related to Filter when "enableFilering" is set', () => {
          const copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-filter-remove-outline', titleKey: 'CLEAR_ALL_FILTERS', title: 'Supprimer tous les filtres', disabled: false, command: 'clear-filter', positionOrder: 50 },
            { iconCssClass: 'mdi mdi-flip-vertical', titleKey: 'TOGGLE_FILTER_ROW', title: 'Basculer la ligne des filtres', disabled: false, command: 'toggle-filter', positionOrder: 53 },
            { iconCssClass: 'mdi mdi-sync', titleKey: 'REFRESH_DATASET', title: 'Rafraîchir les données', disabled: false, command: 'refresh-dataset', positionOrder: 58 }
          ]);
        });

        it('should have only 1 menu "clear-filter" when all other menus are defined as hidden & when "enableFilering" is set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideToggleFilterCommand: true, hideRefreshDatasetCommand: true, hideToggleDarkModeCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-filter-remove-outline', titleKey: 'CLEAR_ALL_FILTERS', title: 'Supprimer tous les filtres', disabled: false, command: 'clear-filter', positionOrder: 50 }
          ]);
        });

        it('should have only 1 menu "toggle-filter" when all other menus are defined as hidden & when "enableFilering" is set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideClearAllFiltersCommand: true, hideToggleDarkModeCommand: true, hideRefreshDatasetCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-flip-vertical', titleKey: 'TOGGLE_FILTER_ROW', title: 'Basculer la ligne des filtres', disabled: false, command: 'toggle-filter', positionOrder: 53 },
          ]);
        });

        it('should have only 1 menu "toggle-dark-mode" when all other menus are defined as hidden', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true,
              hideClearAllFiltersCommand: true, hideToggleFilterCommand: true, hideToggleDarkModeCommand: false, hideRefreshDatasetCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-brightness-4', titleKey: 'TOGGLE_DARK_MODE', title: 'Basculer le mode clair/sombre', disabled: false, command: 'toggle-dark-mode', positionOrder: 54 },
          ]);
        });

        it('should have only 1 menu "refresh-dataset" when all other menus are defined as hidden & when "enableFilering" is set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideClearAllFiltersCommand: true, hideToggleDarkModeCommand: true, hideToggleFilterCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-sync', titleKey: 'REFRESH_DATASET', title: 'Rafraîchir les données', disabled: false, command: 'refresh-dataset', positionOrder: 58 }
          ]);
        });

        it('should have the "toggle-preheader" menu command when "showPreHeaderPanel" is set', () => {
          const copyGridOptionsMock = { ...gridOptionsMock, showPreHeaderPanel: true } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-flip-vertical', titleKey: 'TOGGLE_PRE_HEADER_ROW', title: 'Basculer la ligne de pré-en-tête', disabled: false, command: 'toggle-preheader', positionOrder: 53 }
          ]);
        });

        it('should not have the "toggle-preheader" menu command when "showPreHeaderPanel" and "hideTogglePreHeaderCommand" are set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, showPreHeaderPanel: true, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideTogglePreHeaderCommand: true, hideToggleDarkModeCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([]);
        });

        it('should have the "clear-sorting" menu command when "enableSorting" is set', () => {
          const copyGridOptionsMock = { ...gridOptionsMock, enableSorting: true } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-sort-variant-off', titleKey: 'CLEAR_ALL_SORTING', title: 'Supprimer tous les tris', disabled: false, command: 'clear-sorting', positionOrder: 51 }
          ]);
        });

        it('should not have the "clear-sorting" menu command when "enableSorting" and "hideClearAllSortingCommand" are set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, enableSorting: true, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideClearAllSortingCommand: true, hideToggleDarkModeCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([]);
        });

        it('should have the "export-csv" menu command when "enableTextExport" is set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, enableTextExport: true, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideExportExcelCommand: true, hideExportTextDelimitedCommand: true, hideToggleDarkModeCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-download', titleKey: 'EXPORT_TO_CSV', title: 'Exporter en format CSV', disabled: false, command: 'export-csv', positionOrder: 55 }
          ]);
        });

        it('should not have the "export-csv" menu command when "enableTextExport" and "hideExportCsvCommand" are set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, enableTextExport: true, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideExportExcelCommand: true, hideExportCsvCommand: true, hideExportTextDelimitedCommand: true, hideToggleDarkModeCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([]);
        });

        it('should have the "export-excel" menu command when "enableTextExport" is set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, enableExcelExport: true, enableTextExport: false, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: false, hideToggleDarkModeCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-file-excel-outline text-success', titleKey: 'EXPORT_TO_EXCEL', title: 'Exporter vers Excel', disabled: false, command: 'export-excel', positionOrder: 56 }
          ]);
        });

        it('should have the "export-text-delimited" menu command when "enableTextExport" is set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, enableTextExport: true, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: true, hideToggleDarkModeCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([
            { iconCssClass: 'mdi mdi-download', titleKey: 'EXPORT_TO_TAB_DELIMITED', title: 'Exporter en format texte (délimité par tabulation)', disabled: false, command: 'export-text-delimited', positionOrder: 57 }
          ]);
        });

        it('should not have the "export-text-delimited" menu command when "enableTextExport" and "hideExportCsvCommand" are set', () => {
          const copyGridOptionsMock = {
            ...gridOptionsMock, enableTextExport: true, gridMenu: {
              commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: true, hideExportExcelCommand: true, hideExportCsvCommand: true, hideExportTextDelimitedCommand: true, hideToggleDarkModeCommand: true
            }
          } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          control.columns = columnsMock;
          control.init();
          control.init(); // calling 2x register to make sure it doesn't duplicate commands
          expect(SharedService.prototype.gridOptions.gridMenu!.commandItems).toEqual([]);
        });
      });

      describe('executeGridMenuInternalCustomCommands method', () => {
        beforeEach(() => {
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
          jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
          jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 1));
        });

        it('should call "clearFrozenColumns" when the command triggered is "clear-pinning"', () => {
          const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
          const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
          const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
          const copyGridOptionsMock = { ...gridOptionsMock, gridMenu: { commandLabels: gridOptionsMock.gridMenu!.commandLabels, hideClearFrozenColumnsCommand: false, } } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);

          control.init();
          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=clear-pinning]')!.dispatchEvent(clickEvent);

          expect(setColumnsSpy).toHaveBeenCalled();
          expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: -1, frozenRow: -1, frozenBottom: false, enableMouseWheelScrollHandler: false });
          expect(pubSubSpy).toHaveBeenCalledWith('onGridMenuClearAllPinning');
        });

        it('should call "clearFilters" and dataview refresh when the command triggered is "clear-filter"', () => {
          const filterSpy = jest.spyOn(filterServiceStub, 'clearFilters');
          const refreshSpy = jest.spyOn(SharedService.prototype.dataView, 'refresh');
          const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
          const copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);

          control.init();
          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=clear-filter]')!.dispatchEvent(clickEvent);

          expect(filterSpy).toHaveBeenCalled();
          expect(refreshSpy).toHaveBeenCalled();
          expect(pubSubSpy).toHaveBeenCalledWith('onGridMenuClearAllFilters');
        });

        it('should call "clearSorting" and dataview refresh when the command triggered is "clear-sorting"', () => {
          const sortSpy = jest.spyOn(sortServiceStub, 'clearSorting');
          const refreshSpy = jest.spyOn(SharedService.prototype.dataView, 'refresh');
          const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
          const copyGridOptionsMock = { ...gridOptionsMock, enableSorting: true, } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);

          control.init();
          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=clear-sorting]')!.dispatchEvent(clickEvent);

          expect(sortSpy).toHaveBeenCalled();
          expect(refreshSpy).toHaveBeenCalled();
          expect(pubSubSpy).toHaveBeenCalledWith('onGridMenuClearAllSorting');
        });

        it('should call "exportToExcel" and expect an error thrown when ExcelExportService is not registered prior to calling the method', () => {
          const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: true, } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);

          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=export-excel]')!.dispatchEvent(clickEvent);

          expect(consoleErrorSpy).toHaveBeenCalledWith(expect.toInclude('[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Grid Menu.'));
        });

        it('should call "exportToFile" with CSV and expect an error thrown when TextExportService is not registered prior to calling the method', () => {
          const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, hideExportCsvCommand: false, } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);

          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=export-csv]')!.dispatchEvent(clickEvent);

          expect(consoleErrorSpy).toHaveBeenCalledWith(expect.toInclude('[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu.'));
        });

        it('should call "exportToFile" with Text Delimited and expect an error thrown when TextExportService is not registered prior to calling the method', () => {
          const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, hideExportTextDelimitedCommand: false, } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);

          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=export-text-delimited]')!.dispatchEvent(clickEvent);

          expect(consoleErrorSpy).toHaveBeenCalledWith(expect.toInclude('[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu.'));
        });

        it('should call "exportToExcel" when the command triggered is "export-excel"', () => {
          const excelExportSpy = jest.spyOn(excelExportServiceStub, 'exportToExcel');
          const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: true, } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([excelExportServiceStub]);
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);

          control.init();
          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=export-excel]')!.dispatchEvent(clickEvent);

          expect(excelExportSpy).toHaveBeenCalled();
        });

        it('should call "exportToFile" with CSV set when the command triggered is "export-csv"', () => {
          const exportSpy = jest.spyOn(textExportServiceStub, 'exportToFile');
          const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([textExportServiceStub]);
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);

          control.init();
          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=export-csv]')!.dispatchEvent(clickEvent);

          expect(exportSpy).toHaveBeenCalledWith({ delimiter: DelimiterType.comma, format: FileType.csv });
        });

        it('should call "exportToFile" with Text Delimited set when the command triggered is "export-text-delimited"', () => {
          const exportSpy = jest.spyOn(textExportServiceStub, 'exportToFile');
          const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, hideExportTextDelimitedCommand: false } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([textExportServiceStub]);
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);

          control.init();
          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=export-text-delimited]')!.dispatchEvent(clickEvent);

          expect(exportSpy).toHaveBeenCalledWith({ delimiter: DelimiterType.tab, format: FileType.txt });
        });

        it('should toggle the darkMode grid option when the command triggered is "toggle-dark-mode"', () => {
          const copyGridOptionsMock = { ...gridOptionsMock, darkMode: false, gridMenu: { hideToggleDarkModeCommand: false } } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);

          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=toggle-dark-mode]')!.dispatchEvent(clickEvent);

          expect(copyGridOptionsMock.darkMode).toBeTruthy();
        });

        it('should call the grid "setHeaderRowVisibility" method when the command triggered is "toggle-filter"', () => {
          let copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, showHeaderRow: false, hideToggleFilterCommand: false } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          const setHeaderSpy = jest.spyOn(gridStub, 'setHeaderRowVisibility');
          const scrollSpy = jest.spyOn(gridStub, 'scrollColumnIntoView');
          const setColumnSpy = jest.spyOn(gridStub, 'setColumns');

          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=toggle-filter]')!.dispatchEvent(clickEvent);

          expect(setHeaderSpy).toHaveBeenCalledWith(true);
          expect(scrollSpy).toHaveBeenCalledWith(0);
          expect(setColumnSpy).toHaveBeenCalledTimes(1);

          copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, showHeaderRow: true, hideToggleFilterCommand: false } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=toggle-filter]')!.dispatchEvent(clickEvent);

          expect(setHeaderSpy).toHaveBeenCalledWith(false);
          expect(setColumnSpy).toHaveBeenCalledTimes(1); // same as before, so count won't increase
        });

        it('should call the grid "setPreHeaderPanelVisibility" method when the command triggered is "toggle-preheader"', () => {
          let copyGridOptionsMock = { ...gridOptionsMock, showPreHeaderPanel: true, hideTogglePreHeaderCommand: false } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          const gridSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setPreHeaderPanelVisibility');

          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=toggle-preheader]')!.dispatchEvent(clickEvent);

          expect(gridSpy).toHaveBeenCalledWith(false);

          copyGridOptionsMock = { ...gridOptionsMock, showPreHeaderPanel: false, hideTogglePreHeaderCommand: false } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=toggle-preheader]')!.dispatchEvent(clickEvent);

          expect(gridSpy).toHaveBeenCalledWith(true);
        });

        it('should call "refreshBackendDataset" method when the command triggered is "refresh-dataset"', () => {
          const refreshSpy = jest.spyOn(extensionUtility, 'refreshBackendDataset');
          const copyGridOptionsMock = { ...gridOptionsMock, enableFiltering: true, hideHeaderRowAfterPageLoad: false, hideRefreshDatasetCommand: false, } as unknown as GridOption;
          jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          jest.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);

          control.init();
          control.columns = columnsMock;
          const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
          document.querySelector('.slick-grid-menu-button')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
          control.menuElement!.querySelector('.slick-menu-item[data-command=refresh-dataset]')!.dispatchEvent(clickEvent);

          expect(refreshSpy).toHaveBeenCalled();
        });
      });
    });

    describe('onColumnsReordered event', () => {
      it('should reorder some columns', () => {
        const columnsUnorderedMock: Column[] = [
          { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
          { id: 'field1', field: 'field1', name: 'Titre', width: 100, nameKey: 'TITLE' },
          { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
        ];
        const columnsMock: Column[] = [
          { id: 'field1', field: 'field1', name: 'Titre', width: 100, nameKey: 'TITLE' },
          { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
          { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
        ];
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValueOnce(0).mockReturnValueOnce(1);
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');

        control.columns = columnsUnorderedMock;
        control.initEventHandlers();
        control.init();
        const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
        buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        gridStub.onColumnsReordered.notify({ impactedColumns: columnsUnorderedMock, grid: gridStub }, eventData as any, gridStub);
        control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
        expect(control.columns).toEqual(columnsMock);
      });
    });
  });

  describe('translateGridMenu method', () => {
    beforeEach(() => {
      control.dispose();
      document.body.innerHTML = '';
      div = document.createElement('div');
      div.innerHTML = template;
      document.body.appendChild(div);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    });

    it('should translate the column picker header titles', () => {
      const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
      const utilitySpy = jest.spyOn(extensionUtility, 'getPickerTitleOutputString');
      const translateSpy = jest.spyOn(extensionUtility, 'translateItems');
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

      translateService.use('fr');
      gridOptionsMock.gridMenu!.hideForceFitButton = false;
      gridOptionsMock.gridMenu!.hideSyncResizeButton = false;
      gridOptionsMock.syncColumnCellResize = true;
      gridOptionsMock.forceFitColumns = true;
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      control.columns = columnsMock;
      control.initEventHandlers();
      control.translateGridMenu();
      control.init();
      const buttonElm = document.querySelector('.slick-grid-menu-button') as HTMLDivElement;
      buttonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const labelForcefitElm = control.menuElement!.querySelector('label[for=slickgrid_124343-gridmenu-colpicker-forcefit]') as HTMLLabelElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-gridmenu-colpicker-syncresize]') as HTMLLabelElement;

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(labelForcefitElm.textContent).toBe('Ajustement forcé des colonnes');
      expect(labelSyncElm.textContent).toBe('Redimension synchrone');
      expect(utilitySpy).toHaveBeenCalled();
      expect(translateSpy).toHaveBeenCalled();
      expect((SharedService.prototype.gridOptions.gridMenu as GridMenu).columnTitle).toBe('Colonnes');
      expect((SharedService.prototype.gridOptions.gridMenu as GridMenu).forceFitTitle).toBe('Ajustement forcé des colonnes');
      expect((SharedService.prototype.gridOptions.gridMenu as GridMenu).syncResizeTitle).toBe('Redimension synchrone');
      expect(columnsMock).toEqual([
        { id: 'field1', field: 'field1', name: 'Titre', width: 100, nameKey: 'TITLE' },
        { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
        { id: 'field3', field: 'field3', name: 'Field 3', columnGroup: 'Billing', width: 75 },
      ]);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
    });
  });
});