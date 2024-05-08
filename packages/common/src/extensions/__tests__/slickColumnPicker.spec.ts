import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import { SlickEvent, SlickEventData, SlickGrid } from '../../core/index';
import type { Column, ColumnPicker, GridOption } from '../../interfaces/index';
import { SlickColumnPicker } from '../slickColumnPicker';
import { ExtensionUtility } from '../extensionUtility';
import { SharedService } from '../../services/shared.service';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { BackendUtilityService } from '../../services/backendUtility.service';

const gridUid = 'slickgrid_124343';

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  getColumnIndex: jest.fn(),
  getColumns: jest.fn(),
  getOptions: jest.fn(),
  getSelectedRows: jest.fn(),
  getUID: () => gridUid,
  registerPlugin: jest.fn(),
  setColumns: jest.fn(),
  setOptions: jest.fn(),
  setSelectedRows: jest.fn(),
  onClick: new SlickEvent(),
  onColumnsReordered: new SlickEvent(),
  onHeaderContextMenu: new SlickEvent(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

describe('ColumnPickerControl', () => {
  const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
  const columnsMock: Column[] = [
    { id: 'field1', field: 'field1', name: 'Field 1', width: 100, nameKey: 'TITLE' },
    { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
    { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
    { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true },
  ];

  let control: SlickColumnPicker;
  let backendUtilityService: BackendUtilityService;
  let sharedService: SharedService;
  let translateService: TranslateServiceStub;
  let extensionUtility: ExtensionUtility;

  const gridOptionsMock = {
    enableColumnPicker: true,
    enableTranslate: true,
    columnPicker: {
      hideForceFitButton: false,
      hideSyncResizeButton: true,
      onExtensionRegistered: jest.fn(),
    },
  } as GridOption;

  beforeEach(() => {
    sharedService = new SharedService();
    backendUtilityService = new BackendUtilityService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);

    jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
    jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 1));
    jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

    control = new SlickColumnPicker(extensionUtility, pubSubServiceStub, sharedService);
    translateService.use('fr');
  });

  afterEach(() => {
    control?.eventHandler.unsubscribeAll();
    control?.dispose();
    jest.clearAllMocks();
  });

  describe('registered control', () => {
    afterEach(() => {
      gridOptionsMock.columnPicker!.headerColumnValueExtractor = null as any;
      gridOptionsMock.columnPicker!.onColumnsChanged = null as any;
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

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() } as any;
      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      const inputElm = control.menuElement!.querySelector('input[type="checkbox"]') as HTMLInputElement;
      inputElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      expect(control.menuElement!.style.display).toBe('block');
      expect(setSelectionSpy).toHaveBeenCalledWith(mockRowSelection);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
    });

    it('should open the Column Picker and then expect it to hide when clicking anywhere in the DOM body', () => {
      const mockRowSelection = [0, 3, 5];
      jest.spyOn(control.eventHandler, 'subscribe');
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);

      gridOptionsMock.enableRowSelection = true;
      control.columns = columnsMock;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() } as any;
      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);

      // click inside menu shouldn't close it
      expect(control.menuElement!.style.display).toBe('block');
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
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);

      // cell click should close it
      gridStub.onClick.notify({ row: 1, cell: 2, grid: gridStub }, eventData as any, gridStub);

      expect(control.menuElement).toBeFalsy();
    });

    it('should query an input checkbox change event and expect "headerColumnValueExtractor" method to be called when defined', () => {
      const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      const readjustSpy = jest.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

      gridOptionsMock.columnPicker!.headerColumnValueExtractor = (column: Column) => `${column?.columnGroup || ''} - ${column.name}`;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const liElmList = control.menuElement!.querySelectorAll<HTMLLIElement>('li');

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(liElmList[2].textContent).toBe('Billing - Field 3');
    });

    it('should open the column picker via "onHeaderContextMenu" and expect "Forcefit" to be checked when "hideForceFitButton" is false', () => {
      const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

      gridOptionsMock.columnPicker!.hideForceFitButton = false;
      gridOptionsMock.forceFitColumns = true;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const inputForcefitElm = control.menuElement!.querySelector('#slickgrid_124343-colpicker-forcefit') as HTMLInputElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-forcefit]') as HTMLDivElement;

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(inputForcefitElm.checked).toBeTruthy();
      expect(inputForcefitElm.dataset.option).toBe('autoresize');
      expect(labelSyncElm.textContent).toBe('Force fit columns');
    });

    it('should open the column picker via "onHeaderContextMenu" and expect "Sync Resize" to be checked when "hideSyncResizeButton" is false', () => {
      const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

      gridOptionsMock.columnPicker!.hideSyncResizeButton = false;
      gridOptionsMock.syncColumnCellResize = true;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-colpicker-syncresize') as HTMLInputElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-syncresize]') as HTMLDivElement;

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(inputSyncElm.checked).toBeTruthy();
      expect(inputSyncElm.dataset.option).toBe('syncresize');
      expect(labelSyncElm.textContent).toBe('Synchronous resize');
    });

    it('should open the column picker via "onHeaderContextMenu" and expect "onColumnsChanged" to be called when defined', () => {
      const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
      const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
      const onColChangedMock = jest.fn();
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

      gridOptionsMock.columnPicker!.onColumnsChanged = onColChangedMock;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));

      const expectedCallbackArgs = {
        columnId: 'field1',
        showing: true,
        allColumns: columnsMock,
        columns: columnsMock,
        visibleColumns: columnsMock,
        grid: gridStub,
      };
      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(onColChangedMock).toBeCalledWith(expect.anything(), expectedCallbackArgs);
      expect(pubSubSpy).toHaveBeenCalledWith('onColumnPickerColumnsChanged', expectedCallbackArgs);
    });

    it('should open the column picker via "onHeaderContextMenu", click on "Force Fit Columns" checkbox and expect "setOptions" and "setColumns" to be called with previous visible columns', () => {
      const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      jest.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));
      const setOptionSpy = jest.spyOn(gridStub, 'setOptions');
      const setColumnSpy = jest.spyOn(gridStub, 'setColumns');

      gridOptionsMock.columnPicker!.hideForceFitButton = false;
      gridOptionsMock.columnPicker!.forceFitTitle = 'Custom Force Fit';
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      const inputForcefitElm = control.menuElement!.querySelector('#slickgrid_124343-colpicker-forcefit') as HTMLInputElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-forcefit]') as HTMLDivElement;
      inputForcefitElm.dispatchEvent(new Event('click', { bubbles: true }));

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(inputForcefitElm.checked).toBeTruthy();
      expect(inputForcefitElm.dataset.option).toBe('autoresize');
      expect(labelSyncElm.textContent).toBe('Custom Force Fit');
      expect(setOptionSpy).toHaveBeenCalledWith({ forceFitColumns: true });
      expect(setColumnSpy).toHaveBeenCalledWith(columnsMock.slice(1));
    });

    it('should open the column picker via "onHeaderContextMenu", click on "syncresize" checkbox and expect "setOptions" to be called with "syncColumnCellResize" property', () => {
      const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      jest.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));
      const setOptionSpy = jest.spyOn(gridStub, 'setOptions');

      gridOptionsMock.columnPicker!.hideSyncResizeButton = false;
      gridOptionsMock.columnPicker!.syncResizeTitle = 'Custom Resize Title';
      gridOptionsMock.syncColumnCellResize = true;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-colpicker-syncresize') as HTMLInputElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-syncresize]') as HTMLDivElement;
      inputSyncElm.dispatchEvent(new Event('click', { bubbles: true }));

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(inputSyncElm.checked).toBeTruthy();
      expect(inputSyncElm.dataset.option).toBe('syncresize');
      expect(labelSyncElm.textContent).toBe('Custom Resize Title');
      expect(setOptionSpy).toHaveBeenCalledWith({ syncColumnCellResize: true });
    });

    it('should enable Dark Mode and expect ".slick-dark-mode" CSS class to be found on parent element when opening column picker', () => {
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      jest.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));

      gridOptionsMock.darkMode = true;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);

      expect(control.menuElement?.classList.contains('slick-dark-mode')).toBeTruthy();
    });

    describe('onColumnsReordered event', () => {
      it('should reorder some columns', () => {
        const columnsUnorderedMock: Column[] = [
          { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
          { id: 'field1', field: 'field1', name: 'Field 1', width: 100, nameKey: 'TITLE' },
          { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
          { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true, }
        ];
        const columnsMock: Column[] = [
          { id: 'field1', field: 'field1', name: 'Field 1', width: 100, nameKey: 'TITLE' },
          { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
          { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
          { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true, }
        ];
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValueOnce(0).mockReturnValueOnce(1);
        const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');

        control.columns = columnsUnorderedMock;
        control.init();

        gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
        gridStub.onColumnsReordered.notify({ impactedColumns: columnsUnorderedMock, grid: gridStub }, eventData as any, gridStub);
        control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
        const col4 = control.menuElement!.querySelector<HTMLInputElement>('li.hidden input[data-columnid=field4]');

        expect(handlerSpy).toHaveBeenCalledTimes(3);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
        expect(control.columns).toEqual(columnsMock);
        expect(col4).toBeTruthy();
      });
    });
  });

  describe('translateColumnPicker method', () => {
    it('should translate the column picker header titles', () => {
      const handlerSpy = jest.spyOn(control.eventHandler, 'subscribe');
      const utilitySpy = jest.spyOn(extensionUtility, 'getPickerTitleOutputString');
      const translateSpy = jest.spyOn(extensionUtility, 'translateItems');
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

      gridOptionsMock.columnPicker!.hideForceFitButton = false;
      gridOptionsMock.syncColumnCellResize = true;
      gridOptionsMock.forceFitColumns = true;
      control.columns = columnsMock;
      control.init();
      control.translateColumnPicker();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const labelForcefitElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-forcefit]') as HTMLDivElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-syncresize]') as HTMLDivElement;

      expect(handlerSpy).toHaveBeenCalledTimes(3);
      expect(labelForcefitElm.textContent).toBe('Ajustement forcé des colonnes');
      expect(labelSyncElm.textContent).toBe('Redimension synchrone');
      expect(utilitySpy).toHaveBeenCalled();
      expect(translateSpy).toHaveBeenCalled();
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).columnTitle).toBe('Colonnes');
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).forceFitTitle).toBe('Ajustement forcé des colonnes');
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).syncResizeTitle).toBe('Redimension synchrone');
      expect(columnsMock).toEqual([
        { id: 'field1', field: 'field1', name: 'Titre', width: 100, nameKey: 'TITLE' },
        { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
        { id: 'field3', field: 'field3', name: 'Field 3', columnGroup: 'Billing', width: 75 },
        { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true, }
      ]);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
    });
  });
});