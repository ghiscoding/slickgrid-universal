import { Column, GridOption, SlickGrid, SlickRowSelectionModel, SlickNamespace, SlickCheckboxSelectColumn } from '../../interfaces/index';
import { CheckboxSelectorExtension } from '../checkboxSelectorExtension';
import { ExtensionUtility } from '../extensionUtility';
import { SharedService } from '../../services/shared.service';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

jest.useFakeTimers();

declare const Slick: SlickNamespace;

const gridStub = {
  getOptions: jest.fn(),
  getSelectionModel: jest.fn(),
  registerPlugin: jest.fn(),
  setSelectionModel: jest.fn(),
} as unknown as SlickGrid;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn(),
  getColumnDefinition: jest.fn(),
  selectRows: jest.fn(),
}));

const mockSelectionModel = jest.fn().mockImplementation(() => ({
  pluginName: 'RowSelectionModel',
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
  getSelectedRanges: jest.fn(),
  setSelectedRanges: jest.fn(),
  getSelectedRows: jest.fn(),
  setSelectedRows: jest.fn(),
  onSelectedRangesChanged: new Slick.Event(),
} as SlickRowSelectionModel));


describe('checkboxSelectorExtension', () => {
  jest.mock('slickgrid/plugins/slick.checkboxselectcolumn', () => mockAddon);
  Slick.CheckboxSelectColumn = mockAddon;

  jest.mock('slickgrid/plugins/slick.rowselectionmodel', () => mockSelectionModel);
  Slick.RowSelectionModel = mockSelectionModel;

  let extension: CheckboxSelectorExtension;
  let extensionUtility: ExtensionUtility;
  let sharedService: SharedService;
  let translateService: TranslateServiceStub;
  const gridOptionsMock = { enableCheckboxSelector: true } as GridOption;

  beforeEach(() => {
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, translateService);
    extension = new CheckboxSelectorExtension(sharedService);
  });

  it('should return null after calling "create" method when either the column definitions or the grid options is missing', () => {
    const output = extension.create([] as Column[], null as any);
    expect(output).toBeNull();
  });

  it('should return null after calling "register" method when either the grid object or the grid options is missing', () => {
    const output = extension.register();
    expect(output).toBeNull();
  });

  describe('registered addon', () => {
    let columnSelectionMock: Column;
    let columnsMock: Column[];

    beforeEach(() => {
      columnsMock = [
        { id: 'field1', field: 'field1', width: 100, cssClass: 'red' },
        { id: 'field2', field: 'field2', width: 50 }
      ];
      columnSelectionMock = { id: '_checkbox_selector', field: 'sel' };
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    });

    it('should register the addon', () => {
      const pluginSpy = jest.spyOn(SharedService.prototype.slickGrid, 'registerPlugin');

      const instance = extension.create(columnsMock, gridOptionsMock) as SlickCheckboxSelectColumn;
      const selectionModel = extension.register() as SlickRowSelectionModel;
      const addonInstance = extension.getAddonInstance();

      expect(instance).toBeTruthy();
      expect(instance).toEqual(addonInstance);
      expect(selectionModel).not.toBeNull();
      expect(mockAddon).toHaveBeenCalledWith(undefined);
      expect(mockSelectionModel).toHaveBeenCalledWith(undefined);
      expect(pluginSpy).toHaveBeenCalledWith(instance);
    });

    it('should register the addon with the registered plugin provided as argument', () => {
      const pluginSpy = jest.spyOn(SharedService.prototype.slickGrid, 'registerPlugin');
      const selectionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'getSelectionModel');

      const instance = extension.create(columnsMock, gridOptionsMock) as SlickCheckboxSelectColumn;
      const selectionModel = extension.register() as SlickRowSelectionModel;
      const selectionModel2 = extension.register(selectionModel);

      expect(selectionModel).not.toBeNull();
      expect(selectionModel2).not.toBeNull();
      expect(mockAddon).toHaveBeenCalledWith(undefined);
      expect(selectionSpy).toHaveBeenCalled();
      expect(mockSelectionModel).toHaveBeenCalledWith(undefined);
      expect(pluginSpy).toHaveBeenCalledWith(instance);
    });

    it('should dispose of the addon', () => {
      const instance = extension.create(columnsMock, gridOptionsMock) as SlickCheckboxSelectColumn;
      const selectionModel = extension.register() as SlickRowSelectionModel;
      const addonDestroySpy = jest.spyOn(instance, 'destroy');
      const smDestroySpy = jest.spyOn(selectionModel, 'destroy');

      extension.dispose();

      expect(addonDestroySpy).toHaveBeenCalled();
      expect(smDestroySpy).toHaveBeenCalled();
    });

    it('should provide addon options and expect them to be called in the addon constructor', () => {
      const optionMock = { selectActiveRow: true };
      const selectionModelOptions = { ...gridOptionsMock, rowSelectionOptions: optionMock };
      const selectionColumn = { ...columnSelectionMock, excludeFromExport: true, excludeFromColumnPicker: true, excludeFromGridMenu: true, excludeFromQuery: true, excludeFromHeaderMenu: true };
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(selectionModelOptions);

      // we can only spy after 1st "create" call, we'll only get a valid selectionColumn on 2nd "create" call
      const instance = extension.create(columnsMock, gridOptionsMock) as SlickCheckboxSelectColumn;
      jest.spyOn(instance, 'getColumnDefinition').mockReturnValue(columnSelectionMock);
      expect(columnsMock[0]).not.toEqual(selectionColumn);

      // do our expect here after 2nd "create" call, the selectionColumn flags will change only after this 2nd call
      extension.create(columnsMock, gridOptionsMock);
      extension.register();

      expect(mockSelectionModel).toHaveBeenCalledWith(optionMock);
      expect(columnsMock[0]).toEqual(selectionColumn);
      expect(columnsMock).toEqual([
        { excludeFromColumnPicker: true, excludeFromExport: true, excludeFromGridMenu: true, excludeFromHeaderMenu: true, excludeFromQuery: true, field: 'sel', id: '_checkbox_selector', },
        { cssClass: 'red', field: 'field1', id: 'field1', width: 100, },
        { field: 'field2', id: 'field2', width: 50, }
      ]);
    });

    it('should be able to change the position of the checkbox column to another column index position in the grid', () => {
      const rowSelectionOptionMock = { selectActiveRow: true };
      gridOptionsMock.checkboxSelector = { columnIndexPosition: 2, };
      const selectionModelOptions = { ...gridOptionsMock, rowSelectionOptions: rowSelectionOptionMock };
      const selectionColumn = { ...columnSelectionMock, excludeFromExport: true, excludeFromColumnPicker: true, excludeFromGridMenu: true, excludeFromQuery: true, excludeFromHeaderMenu: true };
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(selectionModelOptions);

      // we can only spy after 1st "create" call, we'll only get a valid selectionColumn on 2nd "create" call
      const instance = extension.create(columnsMock, gridOptionsMock) as SlickCheckboxSelectColumn;
      jest.spyOn(instance, 'getColumnDefinition').mockReturnValue(columnSelectionMock);
      expect(columnsMock[0]).not.toEqual(selectionColumn);

      // do our expect here after 2nd "create" call, the selectionColumn flags will change only after this 2nd call
      extension.create(columnsMock, gridOptionsMock);
      extension.register();

      expect(mockSelectionModel).toHaveBeenCalledWith(rowSelectionOptionMock);
      expect(columnsMock[2]).toEqual(selectionColumn);
      expect(columnsMock).toEqual([
        { cssClass: 'red', field: 'field1', id: 'field1', width: 100, },
        { field: 'field2', id: 'field2', width: 50, },
        { excludeFromColumnPicker: true, excludeFromExport: true, excludeFromGridMenu: true, excludeFromHeaderMenu: true, excludeFromQuery: true, field: 'sel', id: '_checkbox_selector', },
      ]);
    });

    it('should be able to pre-select rows', () => {
      const selectionModelOptions = { ...gridOptionsMock, preselectedRows: [0], rowSelectionOptions: { selectActiveRow: true } };
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(selectionModelOptions);
      const pluginSpy = jest.spyOn(SharedService.prototype.slickGrid, 'registerPlugin');
      const selectionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'getSelectionModel').mockReturnValue(mockSelectionModel as unknown as SlickRowSelectionModel);

      const instance = extension.create(columnsMock, gridOptionsMock) as SlickCheckboxSelectColumn;
      const rowSpy = jest.spyOn(instance, 'selectRows');
      const selectionModel = extension.register() as SlickRowSelectionModel;

      jest.runAllTimers(); // fast-forward timer

      expect(selectionModel).not.toBeNull();
      expect(mockAddon).toHaveBeenCalledWith(undefined);
      expect(selectionSpy).toHaveBeenCalled();
      expect(mockSelectionModel).toHaveBeenCalledWith(undefined);
      expect(pluginSpy).toHaveBeenCalledWith(instance);
      expect(rowSpy).toHaveBeenCalledWith(selectionModelOptions.preselectedRows);
    });
  });
});
