import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement } from '@slickgrid-universal/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { SlickEvent, SlickEventData, type SlickGrid } from '../../core/index.js';
import * as utils from '../../core/utils.js';
import type { Column, ColumnPicker, GridOption } from '../../interfaces/index.js';
import { BackendUtilityService } from '../../services/backendUtility.service.js';
import { SharedService } from '../../services/shared.service.js';
import { ExtensionUtility } from '../extensionUtility.js';
import { SlickColumnPicker } from '../slickColumnPicker.js';

const gridUid = 'slickgrid_124343';

const gridStub = {
  getColumnIndex: vi.fn(),
  getColumns: vi.fn(),
  getGridPosition: vi.fn(),
  getOptions: vi.fn(),
  getSelectedRows: vi.fn(),
  getVisibleColumns: vi.fn(),
  getUID: () => gridUid,
  registerPlugin: vi.fn(),
  remapAllColumnsRowSpan: vi.fn(),
  setColumns: vi.fn(),
  setOptions: vi.fn(),
  setSelectedRows: vi.fn(),
  updateColumnById: vi.fn(),
  updateColumns: vi.fn(),
  validateColumnFreeze: vi.fn(),
  focus: vi.fn(),
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

    gridStub.updateColumnById = (columnId, props) => {
      const column = columnsMock.find((col) => col.id === columnId);
      if (column) {
        Object.assign(column, props);
      }
    };
    vi.spyOn(utils, 'applyHtmlToElement').mockImplementation((elm, val) => {
      elm.innerHTML = `${val || ''}`;
    });
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValue(columnsMock);
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

    it('should query an input checkbox change event and expect it to cancel the uncheck column when "validateColumnFreeze()" returns false', () => {
      const mockRowSelection = [0, 3, 5];
      vi.spyOn(gridStub, 'validateColumnFreeze').mockReturnValueOnce(false);
      vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);
      vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);
      const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');
      const setSelectionSpy = vi.spyOn(gridStub, 'setSelectedRows');

      gridOptionsMock.enableSelection = true;
      control.columns = columnsMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() } as any;
      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      const inputElm = control.menuElement!.querySelector('input[type="checkbox"]') as HTMLInputElement;
      inputElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      expect(control.menuElement!.style.display).toBe('block');
      expect(updateColumnSpy).not.toHaveBeenCalled();
      expect(setSelectionSpy).not.toHaveBeenCalled();
    });

    it('should query an input checkbox change event and expect it to cancel the uncheck column when "validateColumnFreeze()" returns false with Hybrid Selection enabled', () => {
      const mockRowSelection = [0, 3, 5];
      vi.spyOn(gridStub, 'validateColumnFreeze').mockReturnValueOnce(false);
      vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);
      vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);
      const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');
      const setSelectionSpy = vi.spyOn(gridStub, 'setSelectedRows');

      gridOptionsMock.enableSelection = true;
      control.columns = columnsMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() } as any;
      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      const inputElm = control.menuElement!.querySelector('input[type="checkbox"]') as HTMLInputElement;
      inputElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      expect(control.menuElement!.style.display).toBe('block');
      expect(updateColumnSpy).not.toHaveBeenCalled();
      expect(setSelectionSpy).not.toHaveBeenCalled();
    });

    it('should query an input checkbox change event and expect "setSelectedRows" method to be called using Row Selection when enabled', () => {
      const mockRowSelection = [0, 3, 5];
      vi.spyOn(gridStub, 'validateColumnFreeze').mockReturnValueOnce(true);
      vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);
      vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);
      const setSelectionSpy = vi.spyOn(gridStub, 'setSelectedRows');

      gridOptionsMock.enableSelection = true;
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

    it('should remap all RowSpan when input called as unchecked and RowSpan is enabled', () => {
      vi.spyOn(gridStub, 'validateColumnFreeze').mockReturnValueOnce(true);
      vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);
      const remapSpy = vi.spyOn(gridStub, 'remapAllColumnsRowSpan');

      gridOptionsMock.enableCellRowSpan = true;
      control.columns = columnsMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() } as any;
      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      const inputElm = control.menuElement!.querySelector('input[type="checkbox"]') as HTMLInputElement;
      inputElm.checked = false;
      inputElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      expect(control.menuElement!.style.display).toBe('block');
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(remapSpy).toHaveBeenCalled();
    });

    it('should open the Column Picker and then expect it to hide when clicking anywhere in the DOM body', () => {
      const mockRowSelection = [0, 3, 5];
      vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);
      vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);

      gridOptionsMock.enableSelection = true;
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

    it('should open the Column Picker and then expect it to hide when clicking anywhere in the DOM body with Hybrid Selection enabled', () => {
      const mockRowSelection = [0, 3, 5];
      vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);
      vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowSelection);

      gridOptionsMock.enableSelection = true;
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

    it('should query an input checkbox change event and expect "headerColumnValueExtractor" method to be called when defined', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'validateColumnFreeze').mockReturnValueOnce(true);
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

      gridOptionsMock.columnPicker!.headerColumnValueExtractor = (column: Column) => `${column?.columnGroup || ''} - ${column.name}`;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const liElmList = control.menuElement!.querySelectorAll<HTMLLIElement>('li');

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(liElmList[2].textContent).toBe('Billing - Field 3');
    });

    it('should return custom label when columnPickerLabel is defined', () => {
      vi.spyOn(gridStub, 'validateColumnFreeze').mockReturnValueOnce(true);
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(0);

      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const liElmList = control.menuElement!.querySelectorAll<HTMLLIElement>('li');

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
      expect(liElmList[1].textContent).toBe('Custom Label');
    });

    it('should open the column picker via "onPreHeaderContextMenu" and expect "Forcefit" to be checked when "hideForceFitButton" is false', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

      gridOptionsMock.columnPicker!.hideForceFitButton = false;
      gridOptionsMock.forceFitColumns = true;
      control.columns = columnsMock;
      control.init();

      const groupElm = createDomElement('div', { className: 'slick-column-name' });
      gridStub.onPreHeaderContextMenu.notify(
        { node: groupElm, grid: gridStub },
        { ...new SlickEventData(), preventDefault: vi.fn(), target: groupElm } as any,
        gridStub
      );
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
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

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
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

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
      vi.spyOn(gridStub, 'validateColumnFreeze').mockReturnValueOnce(true);
      const onColChangedMock = vi.fn();
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

      gridOptionsMock.columnPicker!.onColumnsChanged = onColChangedMock;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      const inputElm = control.menuElement!.querySelector('input[type="checkbox"]') as HTMLInputElement;
      inputElm.checked = true;
      inputElm.dispatchEvent(new Event('click', { bubbles: true }));

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
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);
      vi.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));
      const setOptionSpy = vi.spyOn(gridStub, 'setOptions');
      const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');

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
      expect(updateColumnSpy).toHaveBeenCalled();
    });

    it('should open the column picker via "onHeaderContextMenu", click on "syncresize" checkbox and expect "setOptions" to be called with "syncColumnCellResize" property', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);
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
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);
      vi.spyOn(control, 'getVisibleColumns').mockReturnValue(columnsMock.slice(1));

      gridOptionsMock.darkMode = true;
      control.columns = columnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);

      expect(control.menuElement?.classList.contains('slick-dark-mode')).toBeTruthy();
    });

    it('should reposition menu to the left when no available space on the right', () => {
      vi.spyOn(gridStub, 'getGridPosition').mockReturnValue({ left: 50, top: 0, right: 0, bottom: 200, height: 22, width: 300, visible: true });
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

      control.init();

      const groupElm = createDomElement('div', { className: 'slick-column-name' });
      gridStub.onPreHeaderContextMenu.notify(
        { node: groupElm, grid: gridStub },
        { ...new SlickEventData(), preventDefault: vi.fn(), target: groupElm, pageX: 305 } as any,
        gridStub
      );
      vi.spyOn(control, 'createPickerMenu').mockImplementation(function () {
        if (control.menuElement) {
          Object.defineProperty(control.menuElement, 'clientWidth', { writable: true, value: 122 });
          return control.menuElement;
        }
        return document.createElement('div');
      });
      gridStub.onPreHeaderContextMenu.notify(
        { node: groupElm, grid: gridStub },
        { ...new SlickEventData(), preventDefault: vi.fn(), target: groupElm, pageX: 305 } as any,
        gridStub
      );
      Object.defineProperty(control.menuElement, 'clientWidth', { writable: true, value: 122 });
      expect(control.menuElement?.style.left).toBe('183px');
    });

    describe('onColumnsReordered event', () => {
      it('should reorder some columns', () => {
        const columnsUnorderedMock: Column[] = [
          { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
          { id: 'field1', field: 'field1', name: 'Field 1', width: 100, nameKey: 'TITLE' },
          { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
          { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true },
        ];
        const columnsMock: Column[] = [
          { id: 'field1', field: 'field1', name: 'Field 1', width: 100, nameKey: 'TITLE' },
          { id: 'field2', field: 'field2', name: 'Field 2', width: 75, columnPickerLabel: 'Custom Label' },
          { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
          { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true },
        ];
        vi.spyOn(gridStub, 'getColumnIndex')
          .mockReturnValue(undefined as any)
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(1);
        const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');

        control.columns = columnsUnorderedMock;
        control.init();

        gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
        gridStub.onColumnsReordered.notify({ impactedColumns: columnsUnorderedMock, previousColumnOrder: [], grid: gridStub }, eventData as any, gridStub);
        control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
        const col4 = control.menuElement!.querySelector<HTMLInputElement>('li.hidden input[data-columnid=field4]');

        const expectedColumnMocks = [
          { id: 'field1', field: 'field1', name: 'Field 1', width: 100, nameKey: 'TITLE', hidden: false },
          { id: 'field2', field: 'field2', name: 'Field 2', width: 75, columnPickerLabel: 'Custom Label' },
          { id: 'field3', field: 'field3', name: 'Field 3', columnGroup: 'Billing', width: 75 },
          { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true },
        ];

        expect(handlerSpy).toHaveBeenCalledTimes(4);
        expect(control.getAllColumns()).toEqual(expectedColumnMocks);
        expect(control.getVisibleColumns()).toEqual(expectedColumnMocks);
        expect(control.columns).toEqual(expectedColumnMocks);
        expect(col4).toBeTruthy();
      });

      it('should trigger click on icon-checkbox-container when Enter key is pressed on focused menu item (onActivate)', () => {
        control.columns = columnsMock;
        gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
        const menuElm = control.menuElement!;
        // Find a real menu item with icon-checkbox-container
        const li = menuElm.querySelector('.slick-column-picker-list li:not(.hidden)') as HTMLElement;
        const iconDiv = li?.querySelector('.icon-checkbox-container') as HTMLElement;
        const clickSpy = iconDiv ? vi.spyOn(iconDiv, 'click') : undefined;
        // Focus the menu item
        li.tabIndex = 0;
        li.focus();
        expect(document.activeElement).toBe(li);
        // Dispatch Enter keydown on the menu container
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        menuElm.dispatchEvent(event);
        if (clickSpy) {
          expect(clickSpy).toHaveBeenCalled();
        } else {
          throw new Error('icon-checkbox-container not found in menu item');
        }
      });

      it('should dispose menu and focus grid when Escape key is pressed (onEscape)', () => {
        control.columns = columnsMock;
        gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
        expect(control.menuElement).toBeTruthy();
        const disposeSpy = vi.spyOn(control, 'disposeMenu');
        // Focus a menu item so keyboard nav will work
        const menuElm = control.menuElement!;
        const li = menuElm.querySelector('.slick-column-picker-list li:not(.hidden)') as HTMLElement;
        li.tabIndex = 0;
        li.focus();
        expect(document.activeElement).toBe(li);
        // Dispatch Escape keydown on the menu container
        const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        menuElm.dispatchEvent(event);
        expect(disposeSpy).toHaveBeenCalled();
        expect(gridStub.focus).toHaveBeenCalled();
      });

      it('should prevent default and stop propagation when Tab key is pressed (onTab)', () => {
        control.columns = columnsMock;
        gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
        const menuElm = control.menuElement!;
        const li = menuElm.querySelector('.slick-column-picker-list li:not(.hidden)') as HTMLElement;
        li.tabIndex = 0;
        li.focus();
        expect(document.activeElement).toBe(li);
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();
        // Patch the event prototype to spy on preventDefault/stopPropagation
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        Object.defineProperty(event, 'preventDefault', { value: preventDefault });
        Object.defineProperty(event, 'stopPropagation', { value: stopPropagation });
        menuElm.dispatchEvent(event);
        expect(preventDefault).toHaveBeenCalled();
        expect(stopPropagation).toHaveBeenCalled();
      });
    });
  });

  describe('translateColumnPicker method', () => {
    it('should translate the column picker header titles', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      const utilitySpy = vi.spyOn(extensionUtility, 'getPickerTitleOutputString');
      const translateSpy = vi.spyOn(extensionUtility, 'translateItems');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

      gridOptionsMock.columnPicker!.columnTitle = '';
      gridOptionsMock.columnPicker!.forceFitTitle = '';
      gridOptionsMock.columnPicker!.syncResizeTitle = '';
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
        { id: 'field1', field: 'field1', name: 'Titre', width: 100, nameKey: 'TITLE', hidden: false },
        { id: 'field2', field: 'field2', name: 'Field 2', width: 75, columnPickerLabel: 'Custom Label' },
        { id: 'field3', field: 'field3', name: 'Field 3', columnGroup: 'Billing', width: 75 },
        { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true },
      ]);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
    });

    it('should not translate when providing custom titles', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      const utilitySpy = vi.spyOn(extensionUtility, 'getPickerTitleOutputString');
      const translateSpy = vi.spyOn(extensionUtility, 'translateItems');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

      translateService.use('fr');
      gridOptionsMock.columnPicker!.columnTitle = 'Custom Column Title';
      gridOptionsMock.columnPicker!.forceFitTitle = 'Custom Force Fit Title';
      gridOptionsMock.columnPicker!.syncResizeTitle = 'Custom Sync Resize Title';
      gridOptionsMock.columnPicker!.hideForceFitButton = false;
      gridOptionsMock.syncColumnCellResize = true;
      gridOptionsMock.forceFitColumns = true;
      control.columns = columnsMock;
      control.init();
      control.translateColumnPicker();

      gridStub.onHeaderContextMenu.notify({ column: columnsMock[1], grid: gridStub }, eventData as any, gridStub);
      control.menuElement!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.dispatchEvent(new Event('click', { bubbles: true }));
      const columnTitleElm = control.menuElement!.querySelector('.slickgrid_124343 .slick-menu-title') as HTMLSpanElement;
      const labelForcefitElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-forcefit]') as HTMLDivElement;
      const labelSyncElm = control.menuElement!.querySelector('label[for=slickgrid_124343-colpicker-syncresize]') as HTMLDivElement;

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(columnTitleElm.textContent).toBe('Custom Column Title');
      expect(labelForcefitElm.textContent).toBe('Custom Force Fit Title');
      expect(labelSyncElm.textContent).toBe('Custom Sync Resize Title');
      expect(utilitySpy).toHaveBeenCalled();
      expect(translateSpy).toHaveBeenCalled();
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).columnTitle).toBe('Custom Column Title');
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).forceFitTitle).toBe('Custom Force Fit Title');
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).syncResizeTitle).toBe('Custom Sync Resize Title');
      expect(columnsMock).toEqual([
        { id: 'field1', field: 'field1', name: 'Titre', width: 100, nameKey: 'TITLE', hidden: false },
        { id: 'field2', field: 'field2', name: 'Field 2', width: 75, columnPickerLabel: 'Custom Label' },
        { id: 'field3', field: 'field3', name: 'Field 3', columnGroup: 'Billing', width: 75 },
        { id: 'field4', field: 'field4', name: 'Field 4', width: 75, excludeFromColumnPicker: true },
      ]);
      expect(control.getAllColumns()).toEqual(columnsMock);
      expect(control.getVisibleColumns()).toEqual(columnsMock);
    });
  });

  describe('columnSort functionality', () => {
    it('should sort columns alphabetically by name when "columnSort" function is provided', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

      // Create columns with names that are not in alphabetical order
      const unsortedColumnsMock: Column[] = [
        { id: 'field1', field: 'field1', name: 'Zebra Field', width: 100 },
        { id: 'field2', field: 'field2', name: 'Alpha Field', width: 75 },
        { id: 'field3', field: 'field3', name: 'Beta Field', width: 75 },
      ];

      // Mock the shared service to return our custom columns
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(unsortedColumnsMock);
      vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValue(unsortedColumnsMock);
      vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(unsortedColumnsMock);
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(unsortedColumnsMock);

      // Define the columnSort function to sort alphabetically by name
      gridOptionsMock.columnPicker!.columnSort = (col1: Column, col2: Column) => {
        const nameA = String(col1.name || '').toLowerCase();
        const nameB = String(col2.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      };

      control.columns = unsortedColumnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: unsortedColumnsMock[1], grid: gridStub }, eventData as any, gridStub);

      // Get the column labels from the menu in the order they appear
      const liElmList = control.menuElement!.querySelectorAll<HTMLLIElement>('li');
      const columnLabels: string[] = [];

      // Extract text content from each column item (excluding force fit and sync resize buttons)
      for (let i = 0; i < Math.min(liElmList.length, unsortedColumnsMock.length); i++) {
        const labelSpan = liElmList[i].querySelector('.checkbox-label');
        if (labelSpan && labelSpan.textContent) {
          columnLabels.push(labelSpan.textContent.trim());
        }
      }

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.getAllColumns()).toEqual(unsortedColumnsMock);
      expect(control.getVisibleColumns()).toEqual(unsortedColumnsMock);

      // Verify that columns are displayed in alphabetical order: Alpha Field, Beta Field, Zebra Field
      expect(columnLabels).toEqual(['Alpha Field', 'Beta Field', 'Zebra Field']);
    });

    it('should maintain the original column order when no "columnSort" function is provided', () => {
      const handlerSpy = vi.spyOn(control.eventHandler, 'subscribe');
      vi.spyOn(gridStub, 'getColumnIndex')
        .mockReturnValue(undefined as any)
        .mockReturnValue(1);

      // Create columns in a specific order
      const originalColumnsMock: Column[] = [
        { id: 'field1', field: 'field1', name: 'Zebra Field', width: 100 },
        { id: 'field2', field: 'field2', name: 'Alpha Field', width: 75 },
        { id: 'field3', field: 'field3', name: 'Beta Field', width: 75 },
      ];

      // Mock the shared service to return our custom columns
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(originalColumnsMock);
      vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValue(originalColumnsMock);
      vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(originalColumnsMock);
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(originalColumnsMock);

      // Don't set columnSort, so it should remain undefined
      gridOptionsMock.columnPicker!.columnSort = undefined;

      control.columns = originalColumnsMock;
      control.init();

      gridStub.onHeaderContextMenu.notify({ column: originalColumnsMock[1], grid: gridStub }, eventData as any, gridStub);

      // Get the column labels from the menu in the order they appear
      const liElmList = control.menuElement!.querySelectorAll<HTMLLIElement>('li');
      const columnLabels: string[] = [];

      // Extract text content from each column item (excluding force fit and sync resize buttons)
      for (let i = 0; i < Math.min(liElmList.length, originalColumnsMock.length); i++) {
        const labelSpan = liElmList[i].querySelector('.checkbox-label');
        if (labelSpan && labelSpan.textContent) {
          columnLabels.push(labelSpan.textContent.trim());
        }
      }

      expect(handlerSpy).toHaveBeenCalledTimes(4);
      expect(control.getAllColumns()).toEqual(originalColumnsMock);
      expect(control.getVisibleColumns()).toEqual(originalColumnsMock);

      // Verify that columns maintain their original order: Zebra Field, Alpha Field, Beta Field
      expect(columnLabels).toEqual(['Zebra Field', 'Alpha Field', 'Beta Field']);
    });
  });
});
