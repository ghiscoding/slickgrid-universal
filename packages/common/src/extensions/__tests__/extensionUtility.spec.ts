import type { Column, GridOption, MenuCommandItem } from '../../interfaces/index';
import { ExtensionUtility } from '../extensionUtility';
import { SharedService } from '../../services/shared.service';
import type { BackendUtilityService } from '../../services/backendUtility.service';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import type { SlickGrid } from '../../core';

const gridStub = {
  getOptions: jest.fn(),
  setColumns: jest.fn(),
  setOptions: jest.fn(),
  registerPlugin: jest.fn(),
} as unknown as SlickGrid;

const backendUtilityServiceStub = {
  executeBackendProcessesCallback: jest.fn(),
  executeBackendCallback: jest.fn(),
  onBackendError: jest.fn(),
  refreshBackendDataset: jest.fn(),
} as unknown as BackendUtilityService;

describe('extensionUtility', () => {
  let sharedService: SharedService;
  let utility: ExtensionUtility;
  let translateService: TranslateServiceStub;

  describe('with Translate Service', () => {
    beforeEach(async () => {
      sharedService = new SharedService();
      translateService = new TranslateServiceStub();
      utility = new ExtensionUtility(sharedService, backendUtilityServiceStub, translateService);
      await translateService.use('fr');
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

    describe('refreshBackendDataset method', () => {
      let gridOptionsMock;

      beforeEach(() => {
        gridOptionsMock = { enableTranslate: true, enableGridMenu: true } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      });

      it('should call refresh of backend when method is called', () => {
        const refreshSpy = jest.spyOn(backendUtilityServiceStub, 'refreshBackendDataset');
        utility.refreshBackendDataset();
        expect(refreshSpy).toHaveBeenCalledWith(gridOptionsMock);
      });

      it('should call refresh of backend when method is called', () => {
        const refreshSpy = jest.spyOn(backendUtilityServiceStub, 'refreshBackendDataset');
        utility.refreshBackendDataset({ enablePagination: true });
        expect(refreshSpy).toHaveBeenCalledWith({ ...gridOptionsMock, enablePagination: true });
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

    describe('translateMenuItemsFromTitleKey method', () => {
      it('should translate using the Translate Service', () => {
        const commandItem1 = { command: 'clear-filter', titleKey: 'CLEAR_ALL_FILTERS' } as MenuCommandItem;
        const commandItem2 = { command: 'clear-sorting', titleKey: 'CLEAR_ALL_SORTING' } as MenuCommandItem;

        utility.translateMenuItemsFromTitleKey([commandItem1, commandItem2]);

        expect(commandItem1.title).toBe('Supprimer tous les filtres');
        expect(commandItem2.title).toBe('Supprimer tous les tris');
      });

      it('should translate nested translation keys by providing a sub-items key', () => {
        const commandItem1 = { command: 'clear-filter', titleKey: 'CLEAR_ALL_FILTERS' } as MenuCommandItem;
        const commandItem2 = {
          command: 'group-by', titleKey: 'GROUP_BY', subMenuTitleKey: 'CONTAINS',
          commandItems: [
            { command: 'percent-complete', titleKey: 'FINANCE_MANAGER' }
          ]
        } as MenuCommandItem;

        utility.translateMenuItemsFromTitleKey([commandItem1, commandItem2], 'commandItems');

        expect(commandItem1.title).toBe('Supprimer tous les filtres');
        expect(commandItem2.title).toBe('Groupé par');
        expect(commandItem2.subMenuTitle).toBe('Contient');
        expect((commandItem2.commandItems![0] as MenuCommandItem).title).toBe('Responsable des finances');
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

      it('should increase "frozenColumn" from 0 to 1 when showing a column that was previously hidden and its index is lower or equal to provided argument of frozenColumnIndex', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const visibleColumns = [{ id: 'field1' }, { id: 'field2' }] as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded(0, allColumns, visibleColumns);

        expect(setOptionSpy).toHaveBeenCalledWith({ frozenColumn: 1 });
      });

      it('should keep "frozenColumn" at 1 when showing a column that was previously hidden and its index is greater than provided argument of frozenColumnIndex', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }] as Column[];
        const visibleColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded(1, allColumns, visibleColumns);

        expect(setOptionSpy).not.toHaveBeenCalled();
      });

      it('should decrease "frozenColumn" from 1 to 0 when hiding a column that was previously shown and its index is lower or equal to provided argument of frozenColumnIndex', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const visibleColumns = [{ id: 'field2' }] as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded(1, allColumns, visibleColumns);

        expect(setOptionSpy).toHaveBeenCalledWith({ frozenColumn: 0 });
      });

      it('should keep "frozenColumn" at 1 when hiding a column that was previously hidden and its index is greater than provided argument of frozenColumnIndex', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const visibleColumns = [{ id: 'field1' }, { id: 'field2' }] as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded(1, allColumns, visibleColumns);

        expect(setOptionSpy).not.toHaveBeenCalled();
      });

      it('should not change "frozenColumn" when showing a column that was not found in the visibleColumns columns array', () => {
        const allColumns = [{ id: 'field1' }, { id: 'field2' }, { id: 'field3' }] as Column[];
        const visibleColumns = [{ id: 'field1' }, { field: 'field2' }] as unknown as Column[];
        const setOptionSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setOptions');

        utility.readjustFrozenColumnIndexWhenNeeded(0, allColumns, visibleColumns);

        expect(setOptionSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('without Translate Service', () => {
    beforeEach(() => {
      translateService = undefined as any;
      utility = new ExtensionUtility(sharedService, backendUtilityServiceStub, translateService);
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

      it('should return the same text when provided as the 3rd argument', () => {
        const gridOptionsMock = { enableTranslate: false, enableGridMenu: true, gridMenu: { hideForceFitButton: false, hideSyncResizeButton: true, columnTitle: 'Columns' } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const output = utility.translateWhenEnabledAndServiceExist('COMMANDS', 'NOT_EXIST', 'last argument wins');
        expect(output).toBe('last argument wins');
      });
    });
  });
});
