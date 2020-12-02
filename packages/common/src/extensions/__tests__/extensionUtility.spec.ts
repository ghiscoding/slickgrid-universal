import { ExtensionName } from '../../enums/index';
import { Column, GridOption, SlickGrid } from '../../interfaces/index';
import { ExtensionUtility } from '../extensionUtility';
import { SharedService } from '../../services/shared.service';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

const gridStub = {
  getOptions: jest.fn(),
  setColumns: jest.fn(),
  setOptions: jest.fn(),
  registerPlugin: jest.fn(),
} as unknown as SlickGrid;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn()
}));

jest.mock('slickgrid/slick.groupitemmetadataprovider', () => mockAddon);
jest.mock('slickgrid/controls/slick.columnpicker', () => mockAddon);
jest.mock('slickgrid/controls/slick.gridmenu', () => mockAddon);
jest.mock('slickgrid/plugins/slick.autotooltips', () => mockAddon);
jest.mock('slickgrid/plugins/slick.cellmenu', () => mockAddon);
jest.mock('slickgrid/plugins/slick.cellexternalcopymanager', () => mockAddon);
jest.mock('slickgrid/plugins/slick.contextmenu', () => mockAddon);
jest.mock('slickgrid/plugins/slick.draggablegrouping', () => mockAddon);
jest.mock('slickgrid/plugins/slick.headerbuttons', () => mockAddon);
jest.mock('slickgrid/plugins/slick.headermenu', () => mockAddon);
jest.mock('slickgrid/plugins/slick.rowselectionmodel', () => mockAddon);
jest.mock('slickgrid/plugins/slick.rowdetailview', () => mockAddon);
jest.mock('slickgrid/plugins/slick.rowmovemanager', () => mockAddon);

const Slick = {
  AutoTooltips: mockAddon,
  DraggableGrouping: mockAddon,
  RowMoveManager: mockAddon,
  RowSelectionModel: mockAddon,
  Controls: {
    ColumnPicker: mockAddon,
    GridMenu: mockAddon,
  },
  Data: {
    GroupItemMetadataProvider: mockAddon
  },
  Plugins: {
    CellMenu: mockAddon,
    ContextMenu: mockAddon,
    CellExternalCopyManager: mockAddon,
    HeaderButtons: mockAddon,
    HeaderMenu: mockAddon,
    RowDetailView: mockAddon,
  }
};

describe('extensionUtility', () => {
  let sharedService: SharedService;
  let utility: ExtensionUtility;
  let translateService: TranslateServiceStub;

  describe('with Translate Service', () => {
    beforeEach(async () => {
      sharedService = new SharedService();
      translateService = new TranslateServiceStub();
      utility = new ExtensionUtility(sharedService, translateService);
      await translateService.use('fr');
    });

    describe('loadExtensionDynamically method', () => {
      it('should check that autoTooltip gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.autoTooltip);
        const autoTooltip = new Slick.AutoTooltips();
        expect(mockAddon).toHaveBeenCalled();
        expect(autoTooltip).not.toBeNull();
      });

      it('should check that cellExternalCopyManager gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.cellExternalCopyManager);
        const autoTooltip = new Slick.Plugins.CellExternalCopyManager();
        expect(mockAddon).toHaveBeenCalled();
        expect(autoTooltip).not.toBeNull();
      });

      it('should check that cellMenu gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.cellMenu);
        const cellMenu = new Slick.Plugins.CellMenu();
        expect(mockAddon).toHaveBeenCalled();
        expect(cellMenu).not.toBeNull();
      });

      it('should check that columnPicker gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.columnPicker);
        const columnPicker = new Slick.Controls.ColumnPicker();
        expect(mockAddon).toHaveBeenCalled();
        expect(columnPicker).not.toBeNull();
      });

      it('should check that contextMenu gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.contextMenu);
        const contextMenu = new Slick.Plugins.ContextMenu();
        expect(mockAddon).toHaveBeenCalled();
        expect(contextMenu).not.toBeNull();
      });

      it('should check that draggableGrouping gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.draggableGrouping);
        const draggableGrouping = new Slick.DraggableGrouping();
        expect(mockAddon).toHaveBeenCalled();
        expect(draggableGrouping).not.toBeNull();
      });

      it('should check that gridMenu gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.gridMenu);
        const gridMenu = new Slick.Controls.GridMenu();
        expect(mockAddon).toHaveBeenCalled();
        expect(gridMenu).not.toBeNull();
      });

      it('should check that groupItemMetaProvider gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.groupItemMetaProvider);
        const groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
        expect(mockAddon).toHaveBeenCalled();
        expect(groupItemMetadataProvider).not.toBeNull();
      });

      it('should check that headerButton gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.headerButton);
        const headerButton = new Slick.Plugins.HeaderButtons();
        expect(mockAddon).toHaveBeenCalled();
        expect(headerButton).not.toBeNull();
      });

      it('should check that headerMenu gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.headerMenu);
        const headerMenu = new Slick.Plugins.HeaderMenu();
        expect(mockAddon).toHaveBeenCalled();
        expect(headerMenu).not.toBeNull();
      });

      it('should check that rowSelection gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.rowSelection);
        const rowSelection = new Slick.RowSelectionModel();
        expect(mockAddon).toHaveBeenCalled();
        expect(rowSelection).not.toBeNull();
      });

      it('should check that rowDetail gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.rowDetailView);
        const rowDetailView = new Slick.Plugins.RowDetailView();
        expect(mockAddon).toHaveBeenCalled();
        expect(rowDetailView).not.toBeNull();
      });

      it('should check that rowMoveManager gets loaded', () => {
        utility.loadExtensionDynamically(ExtensionName.rowMoveManager);
        const rowMoveManager = new Slick.RowMoveManager();
        expect(mockAddon).toHaveBeenCalled();
        expect(rowMoveManager).not.toBeNull();
      });
    });

    describe('getPickerTitleOutputString method', () => {
      it('should translate titleKey when there is one', () => {
        const gridOptionsMock = { enableTranslate: true, enableGridMenu: true, gridMenu: { hideForceFitButton: false, hideSyncResizeButton: true, columnTitleKey: 'TITLE' } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        const output = utility.getPickerTitleOutputString('columnTitle', 'gridMenu');

        expect(output).toEqual('Titre');
      });

      it('should return undefined when the given property is not found', () => {
        const gridOptionsMock = { enableTranslate: true, enableGridMenu: true, gridMenu: { hideForceFitButton: false, hideSyncResizeButton: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        const output = utility.getPickerTitleOutputString('unknown', 'gridMenu');

        expect(output).toEqual(undefined);
      });
    });

    describe('sortItems method', () => {
      it('should sort the items by their order property', () => {
        const inputArray = [{ field: 'field1', order: 3 }, { field: 'field2', order: 1 }, { field: 'field3', order: 2 }];
        const expectedArray = [{ field: 'field2', order: 1 }, { field: 'field3', order: 2 }, { field: 'field1', order: 3 }];

        utility.sortItems(inputArray, 'order');

        expect(inputArray).toEqual(expectedArray);
      });

      it('should sort the items by their order property when found and then return the object without the property', () => {
        const inputArray = [{ field: 'field1', order: 3 }, { field: 'field3', order: 2 }, { field: 'field2' }];
        const expectedArray = [{ field: 'field3', order: 2 }, { field: 'field1', order: 3 }, { field: 'field2' }];

        utility.sortItems(inputArray, 'order');

        expect(inputArray).toEqual(expectedArray);
      });
    });

    describe('translateWhenEnabledAndServiceExist method', () => {
      it('should translate using the Translate Service', () => {
        const output = utility.translateWhenEnabledAndServiceExist('COMMANDS', 'TEXT_COMMANDS');
        expect(output).toBe('Commandes');
      });
    });

    describe('readjustFrozenColumnIndexWhenNeeded method', () => {
      let gridOptionsMock: GridOption;

      beforeEach(() => {
        gridOptionsMock = { frozenColumn: 1 } as GridOption;
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        jest.spyOn(SharedService.prototype, 'frozenVisibleColumnId', 'get').mockReturnValue('field2');
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should increase "frozenColumn" from 0 to 1 when showing a column that was previously hidden and its index is lower or equal to provided argument (2nd arg, frozenColumnIndex)', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const visibleColumns = [{ id: 'field1' }, { id: 'field2' }] as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded('field1', 0, true, allColumns, visibleColumns);

        expect(setOptionSpy).toHaveBeenCalledWith({ frozenColumn: 1 });
      });

      it('should keep "frozenColumn" at 0 when showing a column that was previously hidden and its index is greater than provided argument (2nd arg, frozenColumnIndex)', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const visibleColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded('field3', 0, true, allColumns, visibleColumns);

        expect(setOptionSpy).not.toHaveBeenCalled();
      });

      it('should decrease "frozenColumn" from 1 to 0 when hiding a column that was previously shown and its index is lower or equal to provided argument (2nd arg, frozenColumnIndex)', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const visibleColumns = [{ id: 'field1' }, { id: 'field2' }] as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded('field1', 1, false, allColumns, visibleColumns);

        expect(setOptionSpy).toHaveBeenCalledWith({ frozenColumn: 0 });
      });

      it('should keep "frozenColumn" at 1 when hiding a column that was previously hidden and its index is greater than provided argument (2nd arg, frozenColumnIndex)', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const visibleColumns = [{ id: 'field1' }, { id: 'field2' }] as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded('field3', 1, false, allColumns, visibleColumns);

        expect(setOptionSpy).not.toHaveBeenCalled();
      });

      it('should not change "frozenColumn" when showing a column that was not found in the visibleColumns columns array', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const visibleColumns = [{ id: 'field1' }, { field: 'field2' }] as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded('fiel3', 0, true, allColumns, visibleColumns);

        expect(setOptionSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('without Translate Service', () => {
    beforeEach(() => {
      translateService = undefined as any;
      utility = new ExtensionUtility(sharedService, translateService);
    });

    it('should throw an error if "enableTranslate" is set but the I18N Service is null', () => {
      const gridOptionsMock = { enableTranslate: true, enableGridMenu: true, gridMenu: { hideForceFitButton: false, hideSyncResizeButton: true, columnTitleKey: 'TITLE' } } as GridOption;
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

      expect(() => utility.getPickerTitleOutputString('columnTitle', 'gridMenu')).toThrowError('[Slickgrid-Universal] requires a Translate Service to be installed and configured');
    });

    describe('translateWhenEnabledAndServiceExist method', () => {
      it('should use the Locales Constants when found', () => {
        const gridOptionsMock = { enableTranslate: false, enableGridMenu: true, gridMenu: { hideForceFitButton: false, hideSyncResizeButton: true, columnTitle: 'Columns' } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const output = utility.translateWhenEnabledAndServiceExist('COMMANDS', 'TEXT_COMMANDS');
        expect(output).toBe('Commands');
      });

      it('should return the same key passed as argument when not found in the Locales Constants', () => {
        const gridOptionsMock = { enableTranslate: false, enableGridMenu: true, gridMenu: { hideForceFitButton: false, hideSyncResizeButton: true, columnTitle: 'Columns' } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const output = utility.translateWhenEnabledAndServiceExist('COMMANDS', 'NOT_EXIST');
        expect(output).toBe('NOT_EXIST');
      });
    });
  });
});
