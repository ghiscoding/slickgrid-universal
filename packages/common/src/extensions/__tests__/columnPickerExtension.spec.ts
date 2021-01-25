import { Column, ColumnPicker, GridOption, SlickColumnPicker, SlickGrid, SlickNamespace } from '../../interfaces/index';
import { ColumnPickerExtension } from '../columnPickerExtension';
import { ExtensionUtility } from '../extensionUtility';
import { SharedService } from '../../services/shared.service';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

declare const Slick: SlickNamespace;

const gridStub = {
  getOptions: jest.fn(),
  registerPlugin: jest.fn(),
  setColumns: jest.fn(),
  setOptions: jest.fn(),
} as unknown as SlickGrid;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn(),
  updateAllTitles: jest.fn(),
  onColumnsChanged: new Slick.Event(),
}));

describe('columnPickerExtension', () => {
  jest.mock('slickgrid/controls/slick.columnpicker', () => mockAddon);
  Slick.Controls = {
    ColumnPicker: mockAddon
  } as any;

  const columnsMock: Column[] = [{ id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' }, { id: 'field2', field: 'field2', width: 75 }];
  let extensionUtility: ExtensionUtility;
  let extension: ColumnPickerExtension;
  let sharedService: SharedService;
  let translateService: TranslateServiceStub;

  const gridOptionsMock = {
    enableColumnPicker: true,
    enableTranslate: true,
    columnPicker: {
      hideForceFitButton: false,
      hideSyncResizeButton: true,
      onExtensionRegistered: jest.fn(),
      onColumnsChanged: () => { }
    },
  } as GridOption;

  beforeEach(() => {
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, translateService);
    extension = new ColumnPickerExtension(extensionUtility, sharedService);
    translateService.use('fr');
  });

  it('should return null when either the grid object or the grid options is missing', () => {
    const output = extension.register();
    expect(output).toBeNull();
  });

  describe('registered addon', () => {
    beforeEach(() => {
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
      jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 1));
      jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
    });

    it('should register the addon', () => {
      const onRegisteredSpy = jest.spyOn(SharedService.prototype.gridOptions.columnPicker as ColumnPicker, 'onExtensionRegistered');
      const instance = extension.register() as SlickColumnPicker;
      const addonInstance = extension.getAddonInstance();

      expect(instance).toBeTruthy();
      expect(instance).toEqual(addonInstance);
      expect(onRegisteredSpy).toHaveBeenCalledWith(instance);
      expect(mockAddon).toHaveBeenCalledWith(columnsMock, gridStub, gridOptionsMock);
    });

    it('should call internal event handler subscribe and expect the "onColumnsChanged" grid option to be called when addon notify is called', () => {
      const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
      const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.columnPicker as ColumnPicker, 'onColumnsChanged');
      const visibleColsSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
      const readjustSpy = jest.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

      const instance = extension.register() as SlickColumnPicker;
      instance.onColumnsChanged.notify({ columnId: 'field1', showing: false, allColumns: columnsMock, columns: columnsMock.slice(0, 1), grid: gridStub }, new Slick.EventData(), gridStub);

      expect(readjustSpy).not.toHaveBeenCalled();
      expect(handlerSpy).toHaveBeenCalledTimes(1);
      expect(handlerSpy).toHaveBeenCalledWith(
        { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
        expect.anything()
      );
      expect(onColumnSpy).toHaveBeenCalledWith(expect.anything(), { columnId: 'field1', showing: false, allColumns: columnsMock, columns: columnsMock.slice(0, 1), grid: gridStub });
      expect(visibleColsSpy).not.toHaveBeenCalled();
    });

    it(`should call internal event handler subscribe and expect the "onColumnsChanged" grid option to be called when addon notify is called
    and it should override "visibleColumns" when array passed as arguments is bigger than previous visible columns`, () => {
      const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
      const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.columnPicker as ColumnPicker, 'onColumnsChanged');
      const visibleColsSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');

      const instance = extension.register() as SlickColumnPicker;
      instance.onColumnsChanged.notify({ columnId: 'field1', showing: true, allColumns: columnsMock, columns: columnsMock, grid: gridStub }, new Slick.EventData(), gridStub);

      expect(handlerSpy).toHaveBeenCalledTimes(1);
      expect(handlerSpy).toHaveBeenCalledWith(
        { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
        expect.anything()
      );
      expect(onColumnSpy).toHaveBeenCalledWith(expect.anything(), { columnId: 'field1', showing: true, allColumns: columnsMock, columns: columnsMock, grid: gridStub });
      expect(visibleColsSpy).toHaveBeenCalledWith(columnsMock);
    });

    it('should call internal "onColumnsChanged" event and expect "readjustFrozenColumnIndexWhenNeeded" method to be called when the grid is detected to be a frozen grid', () => {
      gridOptionsMock.frozenColumn = 0;
      const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
      const readjustSpy = jest.spyOn(extensionUtility, 'readjustFrozenColumnIndexWhenNeeded');

      const instance = extension.register() as SlickColumnPicker;
      instance.onColumnsChanged.notify({ columnId: 'field1', showing: false, allColumns: columnsMock, columns: columnsMock.slice(0, 1), grid: gridStub }, new Slick.EventData(), gridStub);

      expect(handlerSpy).toHaveBeenCalledTimes(1);
      expect(handlerSpy).toHaveBeenCalledWith(
        { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
        expect.anything()
      );
      expect(readjustSpy).toHaveBeenCalledWith(0, columnsMock, columnsMock.slice(0, 1));
    });

    it('should dispose of the addon', () => {
      const instance = extension.register() as SlickColumnPicker;
      const destroySpy = jest.spyOn(instance, 'destroy');

      extension.dispose();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('translateColumnPicker method', () => {
    it('should translate the column picker header titles', () => {
      const utilitySpy = jest.spyOn(extensionUtility, 'getPickerTitleOutputString');
      const translateSpy = jest.spyOn(extensionUtility, 'translateItems');

      const instance = extension.register() as SlickColumnPicker;
      extension.translateColumnPicker();
      const updateColsSpy = jest.spyOn(instance, 'updateAllTitles');

      expect(utilitySpy).toHaveBeenCalled();
      expect(translateSpy).toHaveBeenCalled();
      expect(updateColsSpy).toHaveBeenCalledWith(SharedService.prototype.gridOptions.columnPicker);
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).columnTitle).toBe('Colonnes');
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).forceFitTitle).toBe('Ajustement forcé des colonnes');
      expect((SharedService.prototype.gridOptions.columnPicker as ColumnPicker).syncResizeTitle).toBe('Redimension synchrone');
      expect(columnsMock).toEqual([
        { id: 'field1', field: 'field1', width: 100, name: 'Titre', nameKey: 'TITLE' },
        { id: 'field2', field: 'field2', width: 75 }
      ]);
    });
  });
});
