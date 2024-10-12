import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement } from '@slickgrid-universal/utils';

import { SlickEvent, SlickEventData, type SlickGrid } from '../../core/index.js';
import type { Column, ColumnPicker, GridOption } from '../../interfaces/index.js';
import { SlickColumnPicker } from '../slickColumnPicker.js';
import { ExtensionUtility } from '../extensionUtility.js';
import { SharedService } from '../../services/shared.service.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { BackendUtilityService } from '../../services/backendUtility.service.js';

const gridUid = 'slickgrid_124343';

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  getColumnIndex: vi.fn(),
  getColumns: vi.fn(),
  getGridPosition: vi.fn(),
  getOptions: vi.fn(),
  getSelectedRows: vi.fn(),
  getUID: () => gridUid,
  registerPlugin: vi.fn(),
  setColumns: vi.fn(),
  setOptions: vi.fn(),
  setSelectedRows: vi.fn(),
  onClick: new SlickEvent(),
  onColumnsReordered: new SlickEvent(),
  onHeaderContextMenu: new SlickEvent(),
  onPreHeaderClick: new SlickEvent(),
  onPreHeaderContextMenu: new SlickEvent(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

describe('ColumnPickerControl', () => {
  const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
  const columnsMock: Column[] = [
    { id: 'field1', field: 'field1', name: 'Field 1', width: 100, nameKey: 'TITLE' },
    { id: 'field2', field: 'field2', name: 'Field 2', width: 75, columnPickerLabel: 'Custom Label' },
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
      onExtensionRegistered: vi.fn(),
    },
  } as GridOption;

  beforeEach(() => {
    sharedService = new SharedService();
    backendUtilityService = new BackendUtilityService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);
    sharedService.slickGrid = gridStub;

    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
    vi.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 1));
    vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

    control = new SlickColumnPicker(extensionUtility, pubSubServiceStub, sharedService);
    translateService.use('fr');
  });

  afterEach(() => {
    control?.eventHandler.unsubscribeAll();
    control?.dispose();
    vi.clearAllMocks();
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
      vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);
      const setSelectionSpy = vi.spyOn(gridStub, 'setSelectedRows');

      gridOptionsMock.enableRowSelection = true;
      control.columns = columnsMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() } as any;
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
      vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);

      gridOptionsMock.enableRowSelection = true;
      control.columns = columnsMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() } as any;
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
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      const readjustSpy = vi.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

      gridOptionsMock.frozenColumn = 0;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);

      // cell click should close it
      gridStub.onClick.notify({ row: 1, cell: 2, grid: gridStub }, eventData as any, gridStub);

      expect(control.menuElement).toBeFalsy();
    });

    it('should query an input checkbox change event and expect "headerColumnValueExtractor" method to be called when defined', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      const readjustSpy = vi.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

      gridOptionsMock.columnPicker!.headerColumnValueExtractor = (column: Column) => `${column?.columnGroup || ''} - ${column.name}`;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const liElmList = control.menuElement!.querySelectorAll<HTMLLIElement>('li');

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(liElmList[2].textContent).toBe('Billing - Field 3');
    });

    it('should return custom label when columnPickerLabel is defined', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(0);
      const readjustSpy = vi.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const liElmList = control.menuElement!.querySelectorAll<HTMLLIElement>('li');

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(liElmList[1].textContent).toBe('Custom Label');
    });

    it('should open the column picker via "onPreHeaderContextMenu" and expect "Forcefit" to be checked when "hideForceFitButton" is false', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

      gridOptionsMock.columnPicker!.hideForceFitButton = false;
      gridOptionsMock.forceFitColumns = true;
      control.columns = columnsMock;
      control.init();

      const groupElm = createDomElement('div', { className: 'slick-column-name' });
      gridStub.onPreHeaderContextMenu.notify({ node: groupElm, grid: gridStub }, { ...new SlickEventData(), preventDefault: vi.fn(), target: groupElm } as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const inputForcefitElm = control.menuElement!.querySelector('#slickgrid_124343-colpicker-forcefit') as HTMLInputElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-forcefit]') as HTMLDivElement;

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.menuElement?.style.display).not.toBe('none');
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(inputForcefitElm.checked).toBeTruthy();
      expect(inputForcefitElm.dataset.option).toBe('autoresize');
      expect(labelSyncElm.textContent).toBe('Force fit columns');
    });

    it('should open the column picker via "onHeaderContextMenu" and expect "Forcefit" to be checked when "hideForceFitButton" is false', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

      gridOptionsMock.columnPicker!.hideForceFitButton = false;
      gridOptionsMock.forceFitColumns = true;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const inputForcefitElm = control.menuElement!.querySelector('#slickgrid_124343-colpicker-forcefit') as HTMLInputElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-forcefit]') as HTMLDivElement;

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(inputForcefitElm.checked).toBeTruthy();
      expect(inputForcefitElm.dataset.option).toBe('autoresize');
      expect(labelSyncElm.textContent).toBe('Force fit columns');
    });

    it('should open the column picker via "onHeaderContextMenu" and expect "Sync Resize" to be checked when "hideSyncResizeButton" is false', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

      gridOptionsMock.columnPicker!.hideSyncResizeButton = false;
      gridOptionsMock.syncColumnCellResize = true;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-colpicker-syncresize') as HTMLInputElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-syncresize]') as HTMLDivElement;

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(inputSyncElm.checked).toBeTruthy();
      expect(inputSyncElm.dataset.option).toBe('syncresize');
      expect(labelSyncElm.textContent).toBe('Synchronous resize');
    });

    it('should open the column picker via "onHeaderContextMenu" and expect "onColumnsChanged" to be called when defined', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
      const onColChangedMock = vi.fn();
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

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
      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(onColChangedMock).toHaveBeenCalledWith(expect.anything(), expectedCallbackArgs);
      expect(pubSubSpy).toHaveBeenCalledWith('onColumnPickerColumnsChanged', expectedCallbackArgs);
    });

    it('should open the column picker via "onHeaderContextMenu", click on "Force Fit Columns" checkbox and expect "setOptions" and "setColumns" to be called with previous visible columns', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      vi.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));
      const setOptionSpy = vi.spyOn(gridStub, 'setOptions');
      const setColumnSpy = vi.spyOn(gridStub, 'setColumns');

      gridOptionsMock.columnPicker!.hideForceFitButton = false;
      gridOptionsMock.columnPicker!.forceFitTitle = 'Custom Force Fit';
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      const inputForcefitElm = control.menuElement!.querySelector('#slickgrid_124343-colpicker-forcefit') as HTMLInputElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-forcefit]') as HTMLDivElement;
      inputForcefitElm.dispatchEvent(new Event('click', { bubbles: true }));

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(inputForcefitElm.checked).toBeTruthy();
      expect(inputForcefitElm.dataset.option).toBe('autoresize');
      expect(labelSyncElm.textContent).toBe('Custom Force Fit');
      expect(setOptionSpy).toHaveBeenCalledWith({ forceFitColumns: true });
      expect(setColumnSpy).toHaveBeenCalledWith(columnsMock.slice(1));
    });

    it('should open the column picker via "onHeaderContextMenu", click on "syncresize" checkbox and expect "setOptions" to be called with "syncColumnCellResize" property', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      vi.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));
      const setOptionSpy = vi.spyOn(gridStub, 'setOptions');

      gridOptionsMock.columnPicker!.hideSyncResizeButton = false;
      gridOptionsMock.columnPicker!.syncResizeTitle = 'Custom Resize Title';
      gridOptionsMock.syncColumnCellResize = true;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      const inputSyncElm = control.menuElement!.querySelector('#slickgrid_124343-colpicker-syncresize') as HTMLInputElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-syncresize]') as HTMLDivElement;
      inputSyncElm.dispatchEvent(new Event('click', { bubbles: true }));

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(inputSyncElm.checked).toBeTruthy();
      expect(inputSyncElm.dataset.option).toBe('syncresize');
      expect(labelSyncElm.textContent).toBe('Custom Resize Title');
      expect(setOptionSpy).toHaveBeenCalledWith({ syncColumnCellResize: true });
    });

    it('should enable Dark Mode and expect ".slick-dark-mode" CSS class to be found on parent element when opening column picker', () => {
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);
      vi.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));

      gridOptionsMock.darkMode = true;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);

      expect(control.menuElement?.classList.contains('slick-dark-mode')).toBeTruthy();
    });

    it('should reposition menu to the left when no available space on the right', () => {
      vi.spyOn(gridStub, 'getGridPosition').mockReturnValue({ left: 50, top: 0, right: 0, bottom: 200, height: 22, width: 300, visible: true });
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

      control.init();

      const groupElm = createDomElement('div', { className: 'slick-column-name' });
      gridStub.onPreHeaderContextMenu.notify({ node: groupElm, grid: gridStub }, { ...new SlickEventData(), preventDefault: vi.fn(), target: groupElm, pageX: 305 } as any, gridStub);
      vi.spyOn(control, 'createPickerMenu').mockImplementation(() => {
        if (control.menuElement) {
          Object.defineProperty(control.menuElement, 'clientWidth', { writable: true, value: 122 });
          return control.menuElement;
        }
        return document.createElement('div');
      });
      gridStub.onPreHeaderContextMenu.notify({ node: groupElm, grid: gridStub }, { ...new SlickEventData(), preventDefault: vi.fn(), target: groupElm, pageX: 305 } as any, gridStub);
      Object.defineProperty(control.menuElement, 'clientWidth', { writable: true, value: 122 });
      expect(control.menuElement?.style.left).toBe('183px');
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
          { id: 'field2', field: 'field2', name: 'Field 2', width: 75, columnPickerLabel: 'Custom Label' },
          { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
          { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true, }
        ];
        vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValueOnce(0).mockReturnValueOnce(1);
        const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');

        control.columns = columnsUnorderedMock;
        control.init();

        gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
        gridStub.onColumnsReordered.notify({ impactedColumns: columnsUnorderedMock, grid: gridStub }, eventData as any, gridStub);
        control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
        const col4 = control.menuElement!.querySelector<HTMLInputElement>('li.hidden input[data-columnid=field4]');

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(control.getAllColumns()).toEqual(columnsMock);
        expect(control.getVisibleColumns()).toEqual(columnsMock);
        expect(control.columns).toEqual(columnsMock);
        expect(col4).toBeTruthy();
      });
    });
  });

  describe('translateColumnPicker method', () => {
    it('should translate the column picker header titles', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      const utilitySpy = vi.spyOn(extensionUtility, 'getPickerTitleOutputString');
      const translateSpy = vi.spyOn(extensionUtility, 'translateItems');
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(undefined as any).mockReturnValue(1);

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

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(labelForcefitElm.textContent).toBe('Ajustement forcé des colonnes');
      expect(labelSyncElm.textContent).toBe('Redimension synchrone');
      expect(utilitySpy).toHaveBeenCalled();
      expect(translateSpy).toHaveBeenCalled();
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).columnTitle).toBe('Colonnes');
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).forceFitTitle).toBe('Ajustement forcé des colonnes');
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).syncResizeTitle).toBe('Redimension synchrone');
      expect(columnsMock).toEqual([
        { id: 'field1', field: 'field1', name: 'Titre', width: 100, nameKey: 'TITLE' },
        { id: 'field2', field: 'field2', name: 'Field 2', width: 75, columnPickerLabel: 'Custom Label' },
        { id: 'field3', field: 'field3', name: 'Field 3', columnGroup: 'Billing', width: 75 },
        { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true, }
      ]);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
    });
  });
});