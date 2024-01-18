jest.mock('../../extensions/slickDraggableGrouping');

import 'jest-extended';
import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import { ExtensionName } from '../../enums/index';
import { Column, ExtensionModel, GridOption } from '../../interfaces/index';
import { ExtensionUtility, SlickRowBasedEdit } from '../../extensions';
import { ExtensionService, FilterService, GridService, SharedService, SortService, TreeDataService } from '../index';
import { SlickEvent, SlickGrid } from '../../core/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import {
  SlickAutoTooltip,
  SlickCellExcelCopyManager,
  SlickCellMenu,
  SlickCellSelectionModel,
  SlickCheckboxSelectColumn,
  SlickColumnPicker,
  SlickContextMenu,
  SlickDraggableGrouping,
  SlickGridMenu,
  SlickHeaderButtons,
  SlickHeaderMenu,
  SlickRowMoveManager,
  SlickRowSelectionModel,
} from '../../extensions/index';

jest.mock('flatpickr', () => { });
const GRID_UID = 'slickgrid_12345';

const extensionUtilityStub = {
  getPickerTitleOutputString: jest.fn(),
  refreshBackendDataset: jest.fn(),
  sortItems: jest.fn(),
  translateItems: jest.fn(),
  translateMenuItemsFromTitleKey: jest.fn(),
  translateWhenEnabledAndServiceExist: jest.fn(),
} as unknown as ExtensionUtility;

const mockCellSelectionModel = {
  pluginName: 'CellSelectionModel',
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
  getSelectedRanges: jest.fn(),
  setSelectedRanges: jest.fn(),
  getSelectedRows: jest.fn(),
  setSelectedRows: jest.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickCellSelectionModel;
jest.mock('../../extensions/slickCellSelectionModel');

const mockRowSelectionModel = {
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
  dispose: jest.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickRowSelectionModel;
jest.mock('../../extensions/slickRowSelectionModel', () => ({
  SlickRowSelectionModel: jest.fn().mockImplementation(() => mockRowSelectionModel),
}));

const mockCheckboxSelectColumn = {
  constructor: jest.fn(),
  init: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
  dispose: jest.fn(),
} as unknown as SlickCheckboxSelectColumn;
jest.mock('../../extensions/slickCheckboxSelectColumn', () => ({
  SlickCheckboxSelectColumn: jest.fn().mockImplementation(() => mockCheckboxSelectColumn),
}));

const mockRowMoveManager = {
  constructor: jest.fn(),
  init: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
  dispose: jest.fn(),
} as unknown as SlickRowMoveManager;
jest.mock('../../extensions/slickRowMoveManager', () => ({
  SlickRowMoveManager: jest.fn().mockImplementation(() => mockRowMoveManager),
}));

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getContainerNode: jest.fn(),
  getPubSubService: () => pubSubServiceStub,
  getOptions: jest.fn(),
  getPluginByName: jest.fn(),
  getPreHeaderPanel: jest.fn(),
  getSelectionModel: jest.fn(),
  getUID: () => GRID_UID,
  getColumns: jest.fn(),
  setColumns: jest.fn(),
  onColumnsResized: jest.fn(),
  registerPlugin: jest.fn(),
  setSelectionModel: jest.fn(),
  updateColumnHeader: jest.fn(),
  onActiveCellChanged: new SlickEvent(),
  onBeforeDestroy: new SlickEvent(),
  onBeforeHeaderCellDestroy: new SlickEvent(),
  onBeforeSetColumns: new SlickEvent(),
  onClick: new SlickEvent(),
  onColumnsReordered: new SlickEvent(),
  onContextMenu: new SlickEvent(),
  onHeaderCellRendered: new SlickEvent(),
  onHeaderClick: new SlickEvent(),
  onHeaderContextMenu: new SlickEvent(),
  onKeyDown: new SlickEvent(),
  onSelectedRowsChanged: new SlickEvent(),
  onScroll: new SlickEvent(),
  onSetOptions: new SlickEvent(),
} as unknown as SlickGrid;

const filterServiceStub = {
  addRxJsResource: jest.fn(),
  clearFilters: jest.fn(),
  dispose: jest.fn(),
  init: jest.fn(),
  bindBackendOnFilter: jest.fn(),
  bindLocalOnFilter: jest.fn(),
  bindLocalOnSort: jest.fn(),
  bindBackendOnSort: jest.fn(),
  populateColumnFilterSearchTermPresets: jest.fn(),
  refreshTreeDataFilters: jest.fn(),
  getColumnFilters: jest.fn(),
} as unknown as FilterService;

const sortServiceStub = {
  addRxJsResource: jest.fn(),
  bindBackendOnSort: jest.fn(),
  bindLocalOnSort: jest.fn(),
  dispose: jest.fn(),
  loadGridSorters: jest.fn(),
  processTreeDataInitialSort: jest.fn(),
  sortHierarchicalDataset: jest.fn(),
} as unknown as SortService;

const treeDataServiceStub = {
  convertFlatParentChildToTreeDataset: jest.fn(),
  init: jest.fn(),
  convertFlatParentChildToTreeDatasetAndSort: jest.fn(),
  dispose: jest.fn(),
  handleOnCellClick: jest.fn(),
  toggleTreeDataCollapse: jest.fn(),
} as unknown as TreeDataService;

const extensionStub = {
  create: jest.fn(),
  dispose: jest.fn(),
  getAddonInstance: jest.fn(),
  register: jest.fn()
};
const extensionGridMenuStub = {
  ...extensionStub,
  refreshBackendDataset: jest.fn(),
  translateGridMenu: jest.fn()
};
const extensionColumnPickerStub = {
  ...extensionStub,
  translateColumnPicker: jest.fn()
};

describe('ExtensionService', () => {
  let sharedService: SharedService;
  let service: ExtensionService;
  let translateService: TranslateServiceStub;

  describe('with Translate Service', () => {
    beforeEach(() => {
      sharedService = new SharedService();
      translateService = new TranslateServiceStub();
      translateService.use('fr');

      service = new ExtensionService(
        extensionUtilityStub,
        filterServiceStub,
        pubSubServiceStub,
        sharedService,
        sortServiceStub,
        treeDataServiceStub,
        translateService,
        () => ({}) as GridService
      );
      jest.spyOn(gridStub, 'getContainerNode').mockReturnValue(document.body as HTMLDivElement);
    });

    afterEach(() => {
      jest.clearAllMocks();
      service.dispose();
    });

    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should return "allColumns" from the SharedService when "getAllColumns" method is called', () => {
      const spy = jest.spyOn(SharedService.prototype, 'allColumns', 'get');
      service.getAllColumns();
      expect(spy).toHaveBeenCalled();
    });

    it('should return "visibleColumns" from the SharedService when "getVisibleColumns" method is called', () => {
      const spy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'get');
      service.getVisibleColumns();
      expect(spy).toHaveBeenCalled();
    });

    it('should return "autosizeColumns" from the SharedService Grid object when "autoResizeColumns" method is called', () => {
      const spy = jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      service.autoResizeColumns();
      expect(spy).toHaveBeenCalled();
    });

    it('should return empty object when "extensionlList" GETTER is called', () => {
      expect(service.extensionList).toEqual({});
    });

    describe('getExtensionInstanceByName | getExtensionInstanceByName method', () => {
      it('should return null when method is called with an invalid and non instantiated addon', () => {
        const extensionMock = { name: ExtensionName.columnPicker, addon: null, instance: null } as ExtensionModel<any>;
        const spy = jest.spyOn(service, 'getExtensionByName').mockReturnValue(extensionMock);

        const output = service.getExtensionInstanceByName(ExtensionName.columnPicker);

        expect(spy).toHaveBeenCalled();
        expect(output).toBeNull();
      });

      it('should return extension addon when method is called with a valid and instantiated addon', () => {
        const instanceMock = { onColumnsChanged: jest.fn() };
        const extensionMock = { name: ExtensionName.columnPicker, instance: instanceMock as unknown } as ExtensionModel<any>;
        const spy = jest.spyOn(service, 'getExtensionByName').mockReturnValue(extensionMock);

        const output1 = service.getExtensionInstanceByName(ExtensionName.columnPicker);
        const output2 = service.getExtensionInstanceByName(ExtensionName.columnPicker);

        expect(spy).toHaveBeenCalled();
        expect(output1).toEqual(instanceMock);
        expect(output2).toEqual(instanceMock);
      });

      it('should register any addon and expect the instance returned from "getExtensionByName" equal the one returned from "getExtensionInstanceByName"', () => {
        const gridOptionsMock = { enableGridMenu: true } as GridOption;
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const gridMenuInstance = service.getExtensionInstanceByName(ExtensionName.gridMenu);
        const output = service.getExtensionByName(ExtensionName.gridMenu);
        const instance1 = service.getExtensionInstanceByName(ExtensionName.gridMenu);
        const instance2 = service.getExtensionInstanceByName(ExtensionName.gridMenu);

        expect(gridSpy).toHaveBeenCalled();
        expect(gridMenuInstance).toBeTruthy();
        expect(output!.instance).toEqual(instance1);
        expect(output!.instance).toEqual(instance2);
        expect(output).toEqual({ name: ExtensionName.gridMenu, instance: gridMenuInstance as unknown } as ExtensionModel<any>);
      });
    });

    describe('bindDifferentExtensions method', () => {
      const instanceMock = { onColumnsChanged: jest.fn() };

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should return undefined when calling "getExtensionByName" method without anything set yet', () => {
        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.autoTooltip);
        expect(output).toEqual(undefined);
      });

      it('should call "translateItems" method is "enableTranslate" is set to true in the grid options, then column name property should be translated', () => {
        const gridOptionsMock = { enableTranslate: true } as GridOption;
        const columnBeforeTranslate = { id: 'field1', field: 'field1', name: 'Hello', nameKey: 'HELLO' };
        const columnAfterTranslate = { id: 'field1', field: 'field1', name: 'Bonjour', nameKey: 'HELLO' };
        const columnsMock = [columnBeforeTranslate] as Column[];
        const columnSpy = jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();

        expect(columnSpy).toHaveBeenCalled();
        expect(gridSpy).toHaveBeenCalled();
        expect(columnsMock).toEqual([columnAfterTranslate]);
      });

      it('should register the AutoTooltip addon when "enableAutoTooltip" is set in the grid options', () => {
        const gridOptionsMock = { enableAutoTooltip: true } as GridOption;
        const extSpy = jest.spyOn(gridStub, 'registerPlugin');
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName<SlickAutoTooltip>(ExtensionName.autoTooltip);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.autoTooltip);

        expect(extSpy).toHaveBeenCalled();
        expect(output).toEqual({ name: ExtensionName.autoTooltip, instance: pluginInstance } as ExtensionModel<any>);
        expect(output!.instance instanceof SlickAutoTooltip).toBeTrue();
      });

      it('should register the row based edit plugin when "enableRowBasedEdit" and "editable" is set in the grid options', () => {
        const onRegisteredMock = jest.fn();
        const gridOptionsMock = {
          enableRowBasedEdit: true,
          editable: true,
          rowBasedEditOptions: {
            onExtensionRegistered: onRegisteredMock
          }
        } as GridOption;
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const extSpy = jest.spyOn(SlickRowBasedEdit.prototype, 'init').mockImplementation();

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.rowBasedEdit);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.rowBasedEdit);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.toBeObject());
        expect(gridSpy).toHaveBeenCalled();
        expect(extSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.rowBasedEdit, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should throw a custom exception if gridService not ready during row based plugin instantiation', () => {
        const onRegisteredMock = jest.fn();
        const gridOptionsMock = {
          enableRowBasedEdit: true,
          editable: true,
          rowBasedEditOptions: {
            onExtensionRegistered: onRegisteredMock
          }
        } as GridOption;
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const extSpy = jest.spyOn(SlickRowBasedEdit.prototype, 'init').mockImplementation();

        service = new ExtensionService(
          extensionUtilityStub,
          filterServiceStub,
          pubSubServiceStub,
          sharedService,
          sortServiceStub,
          treeDataServiceStub,
          translateService,
          () => undefined as unknown as GridService
        );

        expect(() => service.bindDifferentExtensions()).toThrow();
      });

      it('should register the ColumnPicker addon when "enableColumnPicker" is set in the grid options', () => {
        const gridOptionsMock = { enableColumnPicker: true } as GridOption;
        jest.spyOn(extensionColumnPickerStub, 'register').mockReturnValueOnce(instanceMock);
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.columnPicker);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.columnPicker);

        expect(gridSpy).toHaveBeenCalled();
        expect(output).toEqual({ name: ExtensionName.columnPicker, instance: pluginInstance } as ExtensionModel<any>);
        expect(output!.instance instanceof SlickColumnPicker).toBeTrue();
      });

      it('should call "onExtensionRegistered" when defined in grid option and the ColumnPicker control gets created', () => {
        const onRegisteredMock = jest.fn();
        const gridOptionsMock = {
          enableColumnPicker: true,
          columnPicker: {
            onExtensionRegistered: onRegisteredMock
          }
        } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.columnPicker);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.toBeObject());
        expect(output!.instance instanceof SlickColumnPicker).toBeTrue();
      });

      it('should register the DraggableGrouping addon when "enableDraggableGrouping" is set in the grid options', () => {
        const onRegisteredMock = jest.fn();
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        jest.spyOn(gridStub, 'getPreHeaderPanel').mockReturnValue(document.createElement('div'));
        jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const gridOptionsMock = { enableDraggableGrouping: true, draggableGrouping: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();

        const output = service.getExtensionByName(ExtensionName.draggableGrouping);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.draggableGrouping);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.toBeObject());
        expect(output!.instance instanceof SlickDraggableGrouping).toBeTrue();
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.draggableGrouping, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the GridMenu addon when "enableGridMenu" is set in the grid options', () => {
        const onRegisteredMock = jest.fn();
        const gridOptionsMock = {
          enableGridMenu: true,
          gridMenu: {
            onExtensionRegistered: onRegisteredMock
          }
        } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.gridMenu);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.toBeObject());
        expect(output!.instance instanceof SlickGridMenu).toBeTrue();
      });

      it('should register the CheckboxSelector addon when "enableCheckboxSelector" is set in the grid options', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = { enableCheckboxSelector: true } as GridOption;
        const extCreateSpy = jest.spyOn(mockCheckboxSelectColumn, 'create').mockReturnValueOnce(mockCheckboxSelectColumn);
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const rowSelectionSpy = jest.spyOn(SlickRowSelectionModel.prototype, 'constructor' as any);

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();
        const rowSelectionInstance = service.getExtensionByName(ExtensionName.rowSelection);
        const output = service.getExtensionByName(ExtensionName.checkboxSelector);

        expect(gridSpy).toHaveBeenCalled();
        expect(extCreateSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
        expect(rowSelectionInstance).not.toBeNull();
        expect(rowSelectionSpy).toHaveBeenCalledWith({});
        expect(output).toEqual({ name: ExtensionName.checkboxSelector, instance: mockCheckboxSelectColumn as unknown } as ExtensionModel<any>);
      });

      it('should call "onExtensionRegistered" when defined in grid option and the CheckboxSelectColumn plugin gets created', () => {
        const onRegisteredMock = jest.fn();
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = {
          enableCheckboxSelector: true,
          checkboxSelector: {
            onExtensionRegistered: onRegisteredMock
          }
        } as GridOption;
        const extCreateSpy = jest.spyOn(mockCheckboxSelectColumn, 'create').mockReturnValueOnce(mockCheckboxSelectColumn);
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const rowSelectionSpy = jest.spyOn(SlickRowSelectionModel.prototype, 'constructor' as any);

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();
        const rowSelectionInstance = service.getExtensionByName(ExtensionName.rowSelection);
        const output = service.getExtensionByName(ExtensionName.checkboxSelector);

        expect(gridSpy).toHaveBeenCalled();
        expect(extCreateSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
        expect(rowSelectionInstance).not.toBeNull();
        expect(rowSelectionSpy).toHaveBeenCalledWith({});
        expect(output).toEqual({ name: ExtensionName.checkboxSelector, instance: mockCheckboxSelectColumn as unknown } as ExtensionModel<any>);
        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
      });

      it('should register the RowMoveManager addon when "enableRowMoveManager" is set in the grid options', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = { enableRowMoveManager: true } as GridOption;
        const extCreateSpy = jest.spyOn(mockRowMoveManager, 'create').mockReturnValue(mockRowMoveManager);
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        const rowSelectionSpy = jest.spyOn(SlickRowSelectionModel.prototype, 'constructor' as any);

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();
        const rowSelectionInstance = service.getExtensionByName(ExtensionName.rowSelection);
        const output = service.getExtensionByName(ExtensionName.rowMoveManager);

        expect(gridSpy).toHaveBeenCalled();
        expect(extCreateSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
        expect(rowSelectionInstance).not.toBeNull();
        expect(rowSelectionSpy).toHaveBeenCalledWith({ dragToSelect: true });
        expect(output).toEqual({ name: ExtensionName.rowMoveManager, instance: mockRowMoveManager as unknown } as ExtensionModel<any>);
      });

      it('should register the RowSelection addon when "enableCheckboxSelector" (false) and "enableRowSelection" (true) are set in the grid options', () => {
        const gridOptionsMock = { enableCheckboxSelector: false, enableRowSelection: true } as GridOption;
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.rowSelection);

        expect(gridSpy).toHaveBeenCalled();
        expect(output).toEqual({ name: ExtensionName.rowSelection, instance: mockRowSelectionModel } as ExtensionModel<any>);
      });

      it('should register the CellMenu addon when "enableCellMenu" is set in the grid options', () => {
        const onRegisteredMock = jest.fn();
        const gridOptionsMock = { enableCellMenu: true, cellMenu: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.cellMenu);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.cellMenu);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.toBeObject());
        expect(output!.instance instanceof SlickCellMenu).toBeTrue();
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.cellMenu, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the ContextMenu addon when "enableContextMenu" is set in the grid options', () => {
        const onRegisteredMock = jest.fn();
        const gridOptionsMock = { enableContextMenu: true, contextMenu: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.contextMenu);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.contextMenu);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.toBeObject());
        expect(output!.instance instanceof SlickContextMenu).toBeTrue();
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.contextMenu, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the HeaderButton addon when "enableHeaderButton" is set in the grid options', () => {
        const onRegisteredMock = jest.fn();
        const gridOptionsMock = { enableHeaderButton: true, headerButton: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.headerButton);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.headerButton);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.toBeObject());
        expect(output!.instance instanceof SlickHeaderButtons).toBeTrue();
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.headerButton, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the HeaderMenu addon when "enableHeaderMenu" is set in the grid options', () => {
        const onRegisteredMock = jest.fn();
        const gridOptionsMock = { enableHeaderMenu: true, headerMenu: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.headerMenu);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.headerMenu);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.toBeObject());
        expect(output!.instance instanceof SlickHeaderMenu).toBeTrue();
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.headerMenu, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the ExcelCopyBuffer addon when "enableExcelCopyBuffer" is set in the grid options', () => {
        const onRegisteredMock = jest.fn();
        const gridOptionsMock = { enableExcelCopyBuffer: true, excelCopyBufferOptions: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        jest.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockCellSelectionModel);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.cellExternalCopyManager);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.cellExternalCopyManager);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.toBeObject());
        expect(output!.instance instanceof SlickCellExcelCopyManager).toBeTrue();
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.cellExternalCopyManager, instance: pluginInstance } as ExtensionModel<any>);
      });
    });

    describe('createExtensionsBeforeGridCreation method', () => {
      let instanceMock;

      beforeEach(() => {
        instanceMock = { onColumnsChanged: () => { } };
      });

      it('should call checkboxSelectorExtension create when "enableCheckboxSelector" is set in the grid options provided', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = { enableCheckboxSelector: true } as GridOption;
        const extSpy = jest.spyOn(mockCheckboxSelectColumn, 'create');

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);

        expect(extSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
      });

      it('should call rowBasedEditplugin create when "enableRowBasedEdit" is set in the grid options provided', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = { enableRowBasedEdit: true } as GridOption;
        const extSpy = jest.spyOn(SlickRowBasedEdit.prototype, 'create');

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);

        expect(extSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
      });

      it('should call draggableGroupingExtension create when "enableDraggableGrouping" is set in the grid options provided', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = { enableDraggableGrouping: true } as GridOption;

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        const instance = service.getCreatedExtensionByName<SlickDraggableGrouping>(ExtensionName.draggableGrouping);
        service.addExtensionToList(ExtensionName.draggableGrouping, { name: ExtensionName.draggableGrouping, instance });
        const instance2 = service.getCreatedExtensionByName(ExtensionName.draggableGrouping);

        expect(instance).toBeTruthy();
        expect(instance).toEqual(instance2);
      });

      it('should call RowMoveManager create when "enableRowMoveManager" is set in the grid options provided', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }, { id: 'field2', field: 'field2', width: 50, }] as Column[];
        const gridOptionsMock = {
          enableCheckboxSelector: true, enableRowSelection: true,
          checkboxSelector: { columnIndexPosition: 1 },
          enableRowMoveManager: true,
          rowMoveManager: { columnIndexPosition: 0 }
        } as GridOption;
        const extCheckSelectSpy = jest.spyOn(mockCheckboxSelectColumn, 'create');
        const extRowMoveSpy = jest.spyOn(mockRowMoveManager, 'create');

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);


        expect(extCheckSelectSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
        expect(extRowMoveSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
      });
    });

    it('should call hideColumn and expect "visibleColumns" to be updated accordingly', () => {
      const columnsMock = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      const updatedColumnsMock = [{ id: 'field1', width: 100 }, { id: 'field3', field: 'field3' }] as Column[];
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(1);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
      const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
      const visibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');

      service.hideColumn(columnsMock[1]);

      expect(visibleSpy).toHaveBeenCalledWith(updatedColumnsMock);
      expect(setColumnsSpy).toHaveBeenCalledWith(updatedColumnsMock);
    });

    it('should call the refreshBackendDataset method on the GridMenu Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableGridMenu: true } as GridOption;
      const extSpy = jest.spyOn(extensionUtilityStub, 'refreshBackendDataset');
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

      service.refreshBackendDataset();
      service.refreshBackendDataset(gridOptionsMock);

      expect(extSpy).toHaveBeenNthCalledWith(1, undefined);
      expect(extSpy).toHaveBeenNthCalledWith(2, gridOptionsMock);
    });

    it('should call all extensions translate methods when calling "translateAllExtensions"', () => {
      const cellMenuSpy = jest.spyOn(service, 'translateCellMenu');
      const contextMenuSpy = jest.spyOn(service, 'translateContextMenu');
      const colHeaderSpy = jest.spyOn(service, 'translateColumnHeaders');
      const colPickerSpy = jest.spyOn(service, 'translateColumnPicker');
      const contextSpy = jest.spyOn(service, 'translateContextMenu');
      const gridMenuSpy = jest.spyOn(service, 'translateGridMenu');
      const headerMenuSpy = jest.spyOn(service, 'translateHeaderMenu');

      service.translateAllExtensions();

      expect(cellMenuSpy).toHaveBeenCalled();
      expect(contextMenuSpy).toHaveBeenCalled();
      expect(colHeaderSpy).toHaveBeenCalled();
      expect(colPickerSpy).toHaveBeenCalled();
      expect(contextSpy).toHaveBeenCalled();
      expect(gridMenuSpy).toHaveBeenCalled();
      expect(headerMenuSpy).toHaveBeenCalled();
    });

    it('should call removeColumnByIndex and return original input when it is not an array provided', () => {
      const input = { foo: 'bar' };
      // @ts-ignore:2345
      const output = service.removeColumnByIndex(input, 1);
      expect(output).toEqual(input);
    });

    it('should call removeColumnByIndex and return input array without the item at index position', () => {
      const columnsMock = [{ id: 'field1', width: 100 }, { id: 'field2', width: 150 }, { id: 'field3', field: 'field3' }] as Column[];
      const updatedColumnsMock = [{ id: 'field1', width: 100 }, { id: 'field3', field: 'field3' }] as Column[];
      const output = service.removeColumnByIndex(columnsMock, 1);
      expect(output).toEqual(updatedColumnsMock);
    });

    it('should call the translateColumnPicker method on the ColumnPicker Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableColumnPicker: true } as GridOption;
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

      service.bindDifferentExtensions();

      const columnPickerInstance = service.getExtensionByName(ExtensionName.columnPicker)!.instance;
      const extSpy = jest.spyOn(columnPickerInstance, 'translateColumnPicker');
      service.translateColumnPicker();
      expect(extSpy).toHaveBeenCalled();
    });

    it('should call the translateCellMenu method on the CellMenu Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableCellMenu: true, cellMenu: {} } as GridOption;
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue([]);

      service.bindDifferentExtensions();
      const pluginInstance = service.getExtensionInstanceByName(ExtensionName.cellMenu);
      const translateSpy = jest.spyOn(pluginInstance, 'translateCellMenu');
      service.translateCellMenu();

      expect(translateSpy).toHaveBeenCalled();
    });

    it('should call the translateContextMenu method on the ContextMenu Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableContextMenu: true, contextMenu: {} } as GridOption;
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

      service.bindDifferentExtensions();
      const pluginInstance = service.getExtensionInstanceByName(ExtensionName.contextMenu);
      const translateSpy = jest.spyOn(pluginInstance, 'translateContextMenu');
      service.translateContextMenu();

      expect(translateSpy).toHaveBeenCalled();
    });

    it('should call the translateGridMenu method on the GridMenu Extension when service with same method name is called', () => {
      const columnsMock = [
        { id: 'field1', field: 'field1', nameKey: 'HELLO' },
        { id: 'field2', field: 'field2', nameKey: 'WORLD' }
      ] as Column[];
      const gridOptionsMock = { enableGridMenu: true } as GridOption;
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);

      service.bindDifferentExtensions();
      service.renderColumnHeaders(columnsMock);
      const gridMenuInstance = service.getExtensionInstanceByName(ExtensionName.gridMenu);
      const translateSpy = jest.spyOn(gridMenuInstance, 'translateGridMenu');
      service.translateGridMenu();

      expect(translateSpy).toHaveBeenCalled();
      expect(gridMenuInstance.columns).toEqual(columnsMock);
    });

    it('should call the translateHeaderMenu method on the HeaderMenu Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableHeaderMenu: true, headerMenu: {} } as GridOption;
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue([]);

      service.bindDifferentExtensions();
      const pluginInstance = service.getExtensionInstanceByName(ExtensionName.headerMenu);
      const translateSpy = jest.spyOn(pluginInstance, 'translateHeaderMenu');
      service.translateHeaderMenu();

      expect(translateSpy).toHaveBeenCalled();
    });

    describe('translateColumnHeaders method', () => {
      it('should translate items with default locale when no arguments is passed to the method', () => {
        const columnsBeforeTranslateMock = [{ id: 'field1', field: 'field1', name: 'Hello', nameKey: 'HELLO' }] as Column[];
        const columnsAfterTranslateMock = [{ id: 'field1', field: 'field1', name: 'Bonjour', nameKey: 'HELLO' }] as Column[];
        jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsBeforeTranslateMock);
        const columnSpy = jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsBeforeTranslateMock);
        const renderSpy = jest.spyOn(service, 'renderColumnHeaders');

        service.translateColumnHeaders();

        expect(columnSpy).toHaveBeenCalled();
        expect(renderSpy).toHaveBeenCalledWith(columnsAfterTranslateMock, false);
        expect(columnsBeforeTranslateMock).toEqual(columnsAfterTranslateMock);
      });

      it('should translate items with locale provided as argument to the method', () => {
        const columnsBeforeTranslateMock = [{ id: 'field1', field: 'field1', nameKey: 'HELLO' }] as Column[];
        const columnsAfterTranslateMock = [{ id: 'field1', field: 'field1', name: 'Hello', nameKey: 'HELLO' }] as Column[];
        jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsBeforeTranslateMock);
        const columnSpy = jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsBeforeTranslateMock);
        const renderSpy = jest.spyOn(service, 'renderColumnHeaders');

        service.translateColumnHeaders('en');

        expect(columnSpy).toHaveBeenCalled();
        expect(renderSpy).toHaveBeenCalledWith(columnsAfterTranslateMock, false);
        expect(columnsBeforeTranslateMock).toEqual(columnsAfterTranslateMock);
      });

      it('should translate items with locale & column definitions provided as arguments to the method', () => {
        const columnsBeforeTranslateMock = [{ id: 'field1', field: 'field1', nameKey: 'HELLO' }] as Column[];
        const columnsAfterTranslateMock = [{ id: 'field1', field: 'field1', name: 'Hello', nameKey: 'HELLO' }] as Column[];
        const colDefSpy = jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get');
        const columnSpy = jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsBeforeTranslateMock);
        const renderSpy = jest.spyOn(service, 'renderColumnHeaders');

        service.translateColumnHeaders('en', columnsBeforeTranslateMock);

        expect(columnSpy).toHaveBeenCalled();
        expect(colDefSpy).not.toHaveBeenCalled();
        expect(renderSpy).toHaveBeenCalledWith(columnsAfterTranslateMock, true);
        expect(columnsBeforeTranslateMock).toEqual(columnsAfterTranslateMock);
      });
    });

    describe('renderColumnHeaders method', () => {
      beforeEach(() => {
        const columnsMock = [{ id: 'field1', field: 'field1', nameKey: 'HELLO' }] as Column[];
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
      });

      it('should call "setColumns" on the Shared Service with the Shared "columnDefinitions" when no arguments is provided', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', nameKey: 'HELLO' }] as Column[];
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        const colSpy = jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');

        service.renderColumnHeaders();

        expect(colSpy).toHaveBeenCalled();
        expect(setColumnsSpy).toHaveBeenCalledWith(columnsMock);
      });

      it('should override "allColumns" on the Shared Service and call "setColumns" with the collection provided as argument', () => {
        const columnsMock = [
          { id: 'field1', field: 'field1', nameKey: 'HELLO' },
          { id: 'field2', field: 'field2', nameKey: 'WORLD' }
        ] as Column[];
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        const allColsSpy = jest.spyOn(SharedService.prototype, 'allColumns', 'set');
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');

        service.renderColumnHeaders(columnsMock);

        expect(setColumnsSpy).toHaveBeenCalledWith(columnsMock);
        expect(allColsSpy).toHaveBeenCalledWith(columnsMock);
      });

      it(`should call "setColumns" with the collection provided as argument but NOT override "allColumns" on the Shared Service
    when collection provided is smaller than "allColumns" that already exists`, () => {
        const columnsMock = [
          { id: 'field1', field: 'field1', nameKey: 'HELLO' }
        ] as Column[];
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        const spyAllCols = jest.spyOn(SharedService.prototype, 'allColumns', 'set');
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');

        service.renderColumnHeaders(columnsMock);

        expect(setColumnsSpy).toHaveBeenCalledWith(columnsMock);
        expect(spyAllCols).not.toHaveBeenCalled();
      });

      it('should replace the Column Picker columns when plugin is enabled and method is called with new column definition collection provided as argument', () => {
        const columnsMock = [
          { id: 'field1', field: 'field1', nameKey: 'HELLO' },
          { id: 'field2', field: 'field2', nameKey: 'WORLD' }
        ] as Column[];
        const instanceMock = { translateColumnPicker: jest.fn() };
        const gridOptionsMock = { enableColumnPicker: true } as GridOption;
        jest.spyOn(extensionColumnPickerStub, 'register').mockReturnValueOnce(instanceMock);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');

        service.bindDifferentExtensions();
        service.renderColumnHeaders(columnsMock);

        expect(setColumnsSpy).toHaveBeenCalledWith(columnsMock);
        expect(service.getExtensionByName(ExtensionName.columnPicker)!.instance.columns).toEqual(columnsMock);
      });

      it('should replace the Grid Menu columns when plugin is enabled and method is called with new column definition collection provided as argument', () => {
        const columnsMock = [
          { id: 'field1', field: 'field1', nameKey: 'HELLO' },
          { id: 'field2', field: 'field2', nameKey: 'WORLD' }
        ] as Column[];
        const instanceMock = { translateGridMenu: jest.fn() };
        const gridOptionsMock = { enableGridMenu: true } as GridOption;
        jest.spyOn(extensionGridMenuStub, 'register').mockReturnValueOnce(instanceMock);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');

        service.bindDifferentExtensions();
        service.renderColumnHeaders(columnsMock);

        expect(setColumnsSpy).toHaveBeenCalledWith(columnsMock);
        expect(service.getExtensionByName(ExtensionName.gridMenu)!.instance.columns).toEqual(columnsMock);
      });
    });
  });

  describe('without Translate Service', () => {
    beforeEach(() => {
      translateService = undefined as any;
      service = new ExtensionService(
        extensionUtilityStub,
        filterServiceStub,
        pubSubServiceStub,
        sharedService,
        sortServiceStub,
        treeDataServiceStub,
        translateService,
      );

      const gridOptionsMock = { enableTranslate: true } as GridOption;
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    });

    it('should throw an error if "enableTranslate" is set but the Translate Service is null and "translateColumnHeaders" method is called', () => {
      expect(() => service.translateColumnHeaders())
        .toThrowError('[Slickgrid-Universal] requires a Translate Service to be installed and configured');
    });

    it('should throw an error if "enableTranslate" is set but the Translate Service is null and "translateItems" private method is called', (done) => {
      try {
        const gridOptionsMock = { enableTranslate: true } as GridOption;
        const columnBeforeTranslate = { id: 'field1', field: 'field1', name: 'Hello', nameKey: 'HELLO' };
        const columnsMock = [columnBeforeTranslate] as Column[];
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
      } catch (e) {
        expect(e.message).toContain('[Slickgrid-Universal] requires a Translate Service to be installed and configured');
        done();
      }
    });
  });
});
