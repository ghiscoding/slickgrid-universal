import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { SlickEvent, type SlickGrid } from '../../core/index.js';
import { ExtensionName } from '../../enums/index.js';
import {
  ExtensionUtility,
  SlickAutoTooltip,
  SlickCellExcelCopyManager,
  SlickCellMenu,
  SlickColumnPicker,
  SlickContextMenu,
  SlickDraggableGrouping,
  SlickGridMenu,
  SlickHeaderButtons,
  SlickHeaderMenu,
  SlickRowBasedEdit,
  SlickRowSelectionModel,
  type SlickCellSelectionModel,
  type SlickCheckboxSelectColumn,
  type SlickRowMoveManager,
} from '../../extensions/index.js';
import type { Column, ExtensionModel, GridOption } from '../../interfaces/index.js';
import { ExtensionService, SharedService, type FilterService, type GridService, type SortService, type TreeDataService } from '../index.js';

const GRID_UID = 'slickgrid_12345';

vi.mock('../../extensions/slickDraggableGrouping');
vi.mock('../../extensions/slickRowBasedEdit');

const mockCellSelectionModel = {
  pluginName: 'CellSelectionModel',
  constructor: vi.fn(),
  init: vi.fn(),
  destroy: vi.fn(),
  getSelectedRanges: vi.fn(),
  setSelectedRanges: vi.fn(),
  getSelectedRows: vi.fn(),
  setSelectedRows: vi.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickCellSelectionModel;
vi.mock('../../extensions/slickCellSelectionModel');

const mockRowSelectionModel = {
  constructor: vi.fn(),
  init: vi.fn(),
  destroy: vi.fn(),
  dispose: vi.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickRowSelectionModel;
vi.mock('../../extensions/slickRowSelectionModel', () => ({
  SlickRowSelectionModel: vi.fn().mockImplementation(function () {
    return mockRowSelectionModel;
  }),
}));

const mockCheckboxSelectColumn = {
  constructor: vi.fn(),
  init: vi.fn(),
  create: vi.fn(),
  destroy: vi.fn(),
  dispose: vi.fn(),
} as unknown as SlickCheckboxSelectColumn;
vi.mock('../../extensions/slickCheckboxSelectColumn', () => ({
  SlickCheckboxSelectColumn: vi.fn().mockImplementation(function () {
    return mockCheckboxSelectColumn;
  }),
}));

const mockRowMoveManager = {
  constructor: vi.fn(),
  init: vi.fn(),
  create: vi.fn(),
  destroy: vi.fn(),
  dispose: vi.fn(),
} as unknown as SlickRowMoveManager;
vi.mock('../../extensions/slickRowMoveManager', () => ({
  SlickRowMoveManager: vi.fn().mockImplementation(function () {
    return mockRowMoveManager;
  }),
}));

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

const gridStub = {
  autosizeColumns: vi.fn(),
  destroy: vi.fn(),
  getColumnIndex: vi.fn(),
  getContainerNode: vi.fn(),
  getPubSubService: () => pubSubServiceStub,
  getData: vi.fn(),
  getOptions: vi.fn(),
  getPluginByName: vi.fn(),
  getPreHeaderPanel: vi.fn(),
  getSelectionModel: vi.fn(),
  getUID: () => GRID_UID,
  getColumns: vi.fn(),
  setColumns: vi.fn(),
  hasDataView: () => false,
  onColumnsResized: vi.fn(),
  registerPlugin: vi.fn(),
  setSelectionModel: vi.fn(),
  updateColumnHeader: vi.fn(),
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
  onPreHeaderClick: new SlickEvent(),
  onPreHeaderContextMenu: new SlickEvent(),
  onKeyDown: new SlickEvent(),
  onSelectedRowsChanged: new SlickEvent(),
  onScroll: new SlickEvent(),
  onSetOptions: new SlickEvent(),
} as unknown as SlickGrid;

const filterServiceStub = {
  addRxJsResource: vi.fn(),
  clearFilters: vi.fn(),
  dispose: vi.fn(),
  init: vi.fn(),
  bindBackendOnFilter: vi.fn(),
  bindLocalOnFilter: vi.fn(),
  bindLocalOnSort: vi.fn(),
  bindBackendOnSort: vi.fn(),
  populateColumnFilterSearchTermPresets: vi.fn(),
  refreshTreeDataFilters: vi.fn(),
  getColumnFilters: vi.fn(),
} as unknown as FilterService;

const sortServiceStub = {
  addRxJsResource: vi.fn(),
  bindBackendOnSort: vi.fn(),
  bindLocalOnSort: vi.fn(),
  dispose: vi.fn(),
  loadGridSorters: vi.fn(),
  processTreeDataInitialSort: vi.fn(),
  sortHierarchicalDataset: vi.fn(),
} as unknown as SortService;

const treeDataServiceStub = {
  convertFlatParentChildToTreeDataset: vi.fn(),
  init: vi.fn(),
  convertFlatParentChildToTreeDatasetAndSort: vi.fn(),
  dispose: vi.fn(),
  handleOnCellClick: vi.fn(),
  toggleTreeDataCollapse: vi.fn(),
} as unknown as TreeDataService;

const extensionStub = {
  create: vi.fn(),
  dispose: vi.fn(),
  getAddonInstance: vi.fn(),
  register: vi.fn(),
};
const extensionGridMenuStub = {
  ...extensionStub,
  refreshBackendDataset: vi.fn(),
  translateGridMenu: vi.fn(),
};
const extensionColumnPickerStub = {
  ...extensionStub,
  translateColumnPicker: vi.fn(),
};

describe('ExtensionService', () => {
  let extensionUtility: ExtensionUtility;
  let sharedService: SharedService;
  let service: ExtensionService;
  let translateService: TranslateServiceStub;

  describe('with Translate Service', () => {
    beforeEach(() => {
      sharedService = new SharedService();
      translateService = new TranslateServiceStub();
      translateService.use('fr');
      extensionUtility = new ExtensionUtility(sharedService, undefined, translateService);
      sharedService.slickGrid = gridStub;

      service = new ExtensionService(
        extensionUtility,
        filterServiceStub,
        pubSubServiceStub,
        sharedService,
        sortServiceStub,
        treeDataServiceStub,
        translateService,
        () => ({}) as GridService
      );
      vi.spyOn(gridStub, 'getContainerNode').mockReturnValue(document.body as HTMLDivElement);
    });

    afterEach(() => {
      vi.clearAllMocks();
      service.dispose();
    });

    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should return "allColumns" from the SharedService when "getAllColumns" method is called', () => {
      const spy = vi.spyOn(SharedService.prototype, 'allColumns', 'get');
      service.getAllColumns();
      expect(spy).toHaveBeenCalled();
    });

    it('should return "visibleColumns" from the SharedService when "getVisibleColumns" method is called', () => {
      const spy = vi.spyOn(SharedService.prototype, 'visibleColumns', 'get');
      service.getVisibleColumns();
      expect(spy).toHaveBeenCalled();
    });

    it('should return "autosizeColumns" from the SharedService Grid object when "autoResizeColumns" method is called', () => {
      sharedService.slickGrid = gridStub;
      service.autoResizeColumns();
      expect(gridStub.autosizeColumns).toHaveBeenCalled();
    });

    it('should return empty object when "extensionlList" GETTER is called', () => {
      expect(service.extensionList).toEqual({});
    });

    describe('getExtensionInstanceByName | getExtensionInstanceByName method', () => {
      it('should return null when method is called with an invalid and non instantiated addon', () => {
        const extensionMock = { name: ExtensionName.columnPicker, addon: null, instance: null } as ExtensionModel<any>;
        const spy = vi.spyOn(service, 'getExtensionByName').mockReturnValue(extensionMock);

        const output = service.getExtensionInstanceByName(ExtensionName.columnPicker);

        expect(spy).toHaveBeenCalled();
        expect(output).toBeNull();
      });

      it('should return extension addon when method is called with a valid and instantiated addon', () => {
        const instanceMock = { onColumnsChanged: vi.fn() };
        const extensionMock = { name: ExtensionName.columnPicker, instance: instanceMock as unknown } as ExtensionModel<any>;
        const spy = vi.spyOn(service, 'getExtensionByName').mockReturnValue(extensionMock);

        const output1 = service.getExtensionInstanceByName(ExtensionName.columnPicker);
        const output2 = service.getExtensionInstanceByName(ExtensionName.columnPicker);

        expect(spy).toHaveBeenCalled();
        expect(output1).toEqual(instanceMock);
        expect(output2).toEqual(instanceMock);
      });

      it('should register any addon and expect the instance returned from "getExtensionByName" equal the one returned from "getExtensionInstanceByName"', () => {
        const gridOptionsMock = { enableGridMenu: true } as GridOption;
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

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
      const instanceMock: any = { onColumnsChanged: vi.fn() };

      beforeEach(() => {
        vi.clearAllMocks();
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
        const columnSpy = vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();

        expect(columnSpy).toHaveBeenCalled();
        expect(gridSpy).toHaveBeenCalled();
        expect(columnsMock).toEqual([columnAfterTranslate]);
      });

      it('should register the AutoTooltip addon when "enableAutoTooltip" is set in the grid options', () => {
        const gridOptionsMock = { enableAutoTooltip: true } as GridOption;
        const extSpy = vi.spyOn(gridStub, 'registerPlugin');
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName<SlickAutoTooltip>(ExtensionName.autoTooltip);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.autoTooltip);

        expect(extSpy).toHaveBeenCalled();
        expect(output).toEqual({ name: ExtensionName.autoTooltip, instance: pluginInstance } as ExtensionModel<any>);
        expect(output!.instance instanceof SlickAutoTooltip).toBe(true);
      });

      it('should register the row based edit plugin when "enableRowBasedEdit" and "editable" is set in the grid options', () => {
        const onRegisteredMock = vi.fn();
        const gridOptionsMock = {
          enableRowBasedEdit: true,
          editable: true,
          rowBasedEditOptions: {
            onExtensionRegistered: onRegisteredMock,
          },
        } as GridOption;
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.rowBasedEdit);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.rowBasedEdit);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
        expect(SlickRowBasedEdit).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.rowBasedEdit, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should throw a custom exception if gridService not ready during row based plugin instantiation', () => {
        const onRegisteredMock = vi.fn();
        const gridOptionsMock = {
          enableRowBasedEdit: true,
          editable: true,
          rowBasedEditOptions: {
            onExtensionRegistered: onRegisteredMock,
          },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        vi.spyOn(SlickRowBasedEdit.prototype, 'init').mockImplementation(function () {
          return null;
        });

        service = new ExtensionService(
          extensionUtility,
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
        vi.spyOn(extensionColumnPickerStub, 'register').mockReturnValueOnce(instanceMock);
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.columnPicker);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.columnPicker);

        expect(gridSpy).toHaveBeenCalled();
        expect(output).toEqual({ name: ExtensionName.columnPicker, instance: pluginInstance } as ExtensionModel<any>);
        expect(output!.instance instanceof SlickColumnPicker).toBe(true);
      });

      it('should call "onExtensionRegistered" when defined in grid option and the ColumnPicker control gets created', () => {
        const onRegisteredMock = vi.fn();
        const gridOptionsMock = {
          enableColumnPicker: true,
          columnPicker: {
            onExtensionRegistered: onRegisteredMock,
          },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.columnPicker);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
        expect(output!.instance instanceof SlickColumnPicker).toBe(true);
      });

      it('should register the DraggableGrouping addon when "enableDraggableGrouping" is set in the grid options', () => {
        const onRegisteredMock = vi.fn();
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        vi.spyOn(gridStub, 'getPreHeaderPanel').mockReturnValue(document.createElement('div'));
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const gridOptionsMock = { enableDraggableGrouping: true, draggableGrouping: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();

        const output = service.getExtensionByName(ExtensionName.draggableGrouping);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.draggableGrouping);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
        expect(output!.instance instanceof SlickDraggableGrouping).toBe(true);
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.draggableGrouping, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the GridMenu addon when "enableGridMenu" is set in the grid options', () => {
        const onRegisteredMock = vi.fn();
        const gridOptionsMock = {
          enableGridMenu: true,
          gridMenu: {
            onExtensionRegistered: onRegisteredMock,
          },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.gridMenu);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
        expect(output!.instance instanceof SlickGridMenu).toBe(true);
      });

      it('should register the CheckboxSelector addon when "enableCheckboxSelector" is set in the grid options', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = { enableCheckboxSelector: true } as GridOption;
        const extCreateSpy = vi.spyOn(mockCheckboxSelectColumn, 'create').mockReturnValueOnce(mockCheckboxSelectColumn);
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();
        const rowSelectionInstance = service.getExtensionByName(ExtensionName.rowSelection);
        const output = service.getExtensionByName(ExtensionName.checkboxSelector);

        expect(gridSpy).toHaveBeenCalled();
        expect(extCreateSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
        expect(rowSelectionInstance).not.toBeNull();
        expect(SlickRowSelectionModel).toHaveBeenCalledWith({});
        expect(output).toEqual({ name: ExtensionName.checkboxSelector, instance: mockCheckboxSelectColumn as unknown } as ExtensionModel<any>);
      });

      it('should call "onExtensionRegistered" when defined in grid option and the CheckboxSelectColumn plugin gets created', () => {
        const onRegisteredMock = vi.fn();
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = {
          enableCheckboxSelector: true,
          checkboxSelector: {
            onExtensionRegistered: onRegisteredMock,
          },
        } as GridOption;
        const extCreateSpy = vi.spyOn(mockCheckboxSelectColumn, 'create').mockReturnValueOnce(mockCheckboxSelectColumn);
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();
        const rowSelectionInstance = service.getExtensionByName(ExtensionName.rowSelection);
        const output = service.getExtensionByName(ExtensionName.checkboxSelector);

        expect(gridSpy).toHaveBeenCalled();
        expect(extCreateSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
        expect(rowSelectionInstance).not.toBeNull();
        expect(SlickRowSelectionModel).toHaveBeenCalledWith({});
        expect(output).toEqual({ name: ExtensionName.checkboxSelector, instance: mockCheckboxSelectColumn as unknown } as ExtensionModel<any>);
        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
      });

      it('should register the RowMoveManager addon when "enableRowMoveManager" is set in the grid options', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = { enableRowMoveManager: true } as GridOption;
        const extCreateSpy = vi.spyOn(mockRowMoveManager, 'create').mockReturnValue(mockRowMoveManager);
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);
        service.bindDifferentExtensions();
        const rowSelectionInstance = service.getExtensionByName(ExtensionName.rowSelection);
        const output = service.getExtensionByName(ExtensionName.rowMoveManager);

        expect(gridSpy).toHaveBeenCalled();
        expect(extCreateSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
        expect(rowSelectionInstance).not.toBeNull();
        expect(SlickRowSelectionModel).toHaveBeenCalledWith({ dragToSelect: true });
        expect(output).toEqual({ name: ExtensionName.rowMoveManager, instance: mockRowMoveManager as unknown } as ExtensionModel<any>);
      });

      it('should register the RowSelection addon when "enableCheckboxSelector" (false) and "enableRowSelection" (true) are set in the grid options', () => {
        const gridOptionsMock = { enableCheckboxSelector: false, enableRowSelection: true } as GridOption;
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.rowSelection);

        expect(gridSpy).toHaveBeenCalled();
        expect(output).toEqual({ name: ExtensionName.rowSelection, instance: mockRowSelectionModel } as ExtensionModel<any>);
      });

      it('should register the CellMenu addon when "enableCellMenu" is set in the grid options', () => {
        const onRegisteredMock = vi.fn();
        const gridOptionsMock = { enableCellMenu: true, cellMenu: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.cellMenu);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.cellMenu);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
        expect(output!.instance instanceof SlickCellMenu).toBe(true);
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.cellMenu, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the ContextMenu addon when "enableContextMenu" is set in the grid options', () => {
        const onRegisteredMock = vi.fn();
        const gridOptionsMock = { enableContextMenu: true, contextMenu: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.contextMenu);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.contextMenu);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
        expect(output!.instance instanceof SlickContextMenu).toBe(true);
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.contextMenu, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the HeaderButton addon when "enableHeaderButton" is set in the grid options', () => {
        const onRegisteredMock = vi.fn();
        const gridOptionsMock = { enableHeaderButton: true, headerButton: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.headerButton);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.headerButton);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
        expect(output!.instance instanceof SlickHeaderButtons).toBe(true);
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.headerButton, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the HeaderMenu addon when "enableHeaderMenu" is set in the grid options', () => {
        const onRegisteredMock = vi.fn();
        const gridOptionsMock = { enableHeaderMenu: true, headerMenu: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.headerMenu);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.headerMenu);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
        expect(output!.instance instanceof SlickHeaderMenu).toBe(true);
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.headerMenu, instance: pluginInstance } as ExtensionModel<any>);
      });

      it('should register the ExcelCopyBuffer addon when "enableExcelCopyBuffer" is set in the grid options', () => {
        const onRegisteredMock = vi.fn();
        const gridOptionsMock = { enableExcelCopyBuffer: true, excelCopyBufferOptions: { onExtensionRegistered: onRegisteredMock } } as GridOption;
        const gridSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockCellSelectionModel);

        service.bindDifferentExtensions();
        const output = service.getExtensionByName(ExtensionName.cellExternalCopyManager);
        const pluginInstance = service.getExtensionInstanceByName(ExtensionName.cellExternalCopyManager);

        expect(onRegisteredMock).toHaveBeenCalledWith(expect.any(Object));
        expect(output!.instance instanceof SlickCellExcelCopyManager).toBe(true);
        expect(gridSpy).toHaveBeenCalled();
        expect(pluginInstance).toBeTruthy();
        expect(output!.instance).toEqual(pluginInstance);
        expect(output).toEqual({ name: ExtensionName.cellExternalCopyManager, instance: pluginInstance } as ExtensionModel<any>);
      });
    });

    describe('createExtensionsBeforeGridCreation method', () => {
      beforeEach(() => {
        sharedService.slickGrid = gridStub;
      });

      it('should call checkboxSelectorExtension create when "enableCheckboxSelector" is set in the grid options provided', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = { enableCheckboxSelector: true } as GridOption;
        const extSpy = vi.spyOn(mockCheckboxSelectColumn, 'create');

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);

        expect(extSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
      });

      it('should call rowBasedEditplugin create when "enableRowBasedEdit" is set in the grid options provided', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const gridOptionsMock = { enableRowBasedEdit: true } as GridOption;
        const extSpy = vi.spyOn(SlickRowBasedEdit.prototype, 'create');

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
        const columnsMock = [
          { id: 'field1', field: 'field1', width: 100, cssClass: 'red' },
          { id: 'field2', field: 'field2', width: 50 },
        ] as Column[];
        const gridOptionsMock = {
          enableCheckboxSelector: true,
          enableRowSelection: true,
          checkboxSelector: { columnIndexPosition: 1 },
          enableRowMoveManager: true,
          rowMoveManager: { columnIndexPosition: 0 },
        } as GridOption;
        const extCheckSelectSpy = vi.spyOn(mockCheckboxSelectColumn, 'create');
        const extRowMoveSpy = vi.spyOn(mockRowMoveManager, 'create');

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);

        expect(extCheckSelectSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
        expect(extRowMoveSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
      });

      it('should create & init external extensions when "preRegisterExternalExtensions" is set in the grid options', () => {
        const createMock = vi.fn();
        const initMock = vi.fn();
        class ExternalExtension {
          create(columns: Column[], gridOptions: GridOption) {
            createMock(columns, gridOptions);
          }
          init(grid: SlickGrid) {
            initMock(grid);
          }
        }

        const columnsMock = [
          { id: 'field1', field: 'field1', width: 100, cssClass: 'red' },
          { id: 'field2', field: 'field2', width: 50 },
        ] as Column[];
        const gridOptionsMock = {
          enableCheckboxSelector: true,
          enableRowSelection: true,
          checkboxSelector: { columnIndexPosition: 1 },
          preRegisterExternalExtensions: () => {
            const ext = new ExternalExtension();
            return [{ name: ExtensionName.rowDetailView, instance: ext }];
          },
        } as GridOption;
        const extCheckSelectSpy = vi.spyOn(mockCheckboxSelectColumn, 'create');

        service.createExtensionsBeforeGridCreation(columnsMock, gridOptionsMock);

        expect(extCheckSelectSpy).toHaveBeenCalledWith(columnsMock, gridOptionsMock);
        expect(createMock).toHaveBeenCalledWith(columnsMock, gridOptionsMock);

        service.bindDifferentExtensions();
        expect(initMock).toHaveBeenCalledWith(gridStub);
        expect(service.extensionList.rowDetailView).toBeTruthy();
      });
    });

    it('should call hideColumn and expect "visibleColumns" to be updated accordingly', () => {
      const columnsMock = [
        { id: 'field1', width: 100 },
        { id: 'field2', width: 150 },
        { id: 'field3', field: 'field3' },
      ] as Column[];
      const updatedColumnsMock = [
        { id: 'field1', width: 100 },
        { id: 'field3', field: 'field3' },
      ] as Column[];
      sharedService.slickGrid = gridStub;
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(1);
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
      const setColumnsSpy = vi.spyOn(gridStub, 'setColumns');

      service.hideColumn(columnsMock[1]);

      expect(sharedService.visibleColumns).toEqual(updatedColumnsMock);
      expect(setColumnsSpy).toHaveBeenCalledWith(updatedColumnsMock);
    });

    it('should call the refreshBackendDataset method on the GridMenu Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableGridMenu: true } as GridOption;
      const extSpy = vi.spyOn(extensionUtility, 'refreshBackendDataset');
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

      service.refreshBackendDataset();
      service.refreshBackendDataset(gridOptionsMock);

      expect(extSpy).toHaveBeenNthCalledWith(1, undefined);
      expect(extSpy).toHaveBeenNthCalledWith(2, gridOptionsMock);
    });

    it('should call all extensions translate methods when calling "translateAllExtensions"', () => {
      const cellMenuSpy = vi.spyOn(service, 'translateCellMenu');
      const contextMenuSpy = vi.spyOn(service, 'translateContextMenu');
      const colHeaderSpy = vi.spyOn(service, 'translateColumnHeaders');
      const headerMenuSpy = vi.spyOn(service, 'translateHeaderMenu');

      service.translateAllExtensions();

      expect(cellMenuSpy).toHaveBeenCalled();
      expect(contextMenuSpy).toHaveBeenCalled();
      expect(colHeaderSpy).toHaveBeenCalled();
      expect(headerMenuSpy).toHaveBeenCalled();
    });

    it('should call removeColumnByIndex and return original input when it is not an array provided', () => {
      const input = { foo: 'bar' };
      // @ts-ignore:2345
      const output = service.removeColumnByIndex(input, 1);
      expect(output).toEqual(input);
    });

    it('should call removeColumnByIndex and return input array without the item at index position', () => {
      const columnsMock = [
        { id: 'field1', width: 100 },
        { id: 'field2', width: 150 },
        { id: 'field3', field: 'field3' },
      ] as Column[];
      const updatedColumnsMock = [
        { id: 'field1', width: 100 },
        { id: 'field3', field: 'field3' },
      ] as Column[];
      const output = service.removeColumnByIndex(columnsMock, 1);
      expect(output).toEqual(updatedColumnsMock);
    });

    it('should call the translateColumnPicker method on the ColumnPicker Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableColumnPicker: true } as GridOption;
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

      service.bindDifferentExtensions();

      const columnPickerInstance = service.getExtensionByName(ExtensionName.columnPicker)!.instance;
      const extSpy = vi.spyOn(columnPickerInstance, 'translateColumnPicker');
      service.translateColumnPicker();
      expect(extSpy).toHaveBeenCalled();
    });

    it('should call the translateCellMenu method on the CellMenu Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableCellMenu: true, cellMenu: {} } as GridOption;
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      vi.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue([]);

      service.bindDifferentExtensions();
      const pluginInstance = service.getExtensionInstanceByName(ExtensionName.cellMenu);
      const translateSpy = vi.spyOn(pluginInstance, 'translateCellMenu');
      service.translateCellMenu();

      expect(translateSpy).toHaveBeenCalled();
    });

    it('should call the translateContextMenu method on the ContextMenu Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableContextMenu: true, contextMenu: {} } as GridOption;
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

      service.bindDifferentExtensions();
      const pluginInstance = service.getExtensionInstanceByName(ExtensionName.contextMenu);
      const translateSpy = vi.spyOn(pluginInstance, 'translateContextMenu');
      service.translateContextMenu();

      expect(translateSpy).toHaveBeenCalled();
    });

    it('should call the translateGridMenu method on the GridMenu Extension when service with same method name is called', () => {
      const columnsMock = [
        { id: 'field1', field: 'field1', nameKey: 'HELLO' },
        { id: 'field2', field: 'field2', nameKey: 'WORLD' },
      ] as Column[];
      const gridOptionsMock = { enableGridMenu: true } as GridOption;
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);

      service.bindDifferentExtensions();
      service.renderColumnHeaders(columnsMock);
      const gridMenuInstance = service.getExtensionInstanceByName(ExtensionName.gridMenu);
      const translateSpy = vi.spyOn(gridMenuInstance, 'translateGridMenu');
      service.translateGridMenu();

      expect(translateSpy).toHaveBeenCalled();
      expect(gridMenuInstance.columns).toEqual(columnsMock);
    });

    it('should call the translateHeaderMenu method on the HeaderMenu Extension when service with same method name is called', () => {
      const gridOptionsMock = { enableHeaderMenu: true, headerMenu: {} } as GridOption;
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      vi.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue([]);

      service.bindDifferentExtensions();
      const pluginInstance = service.getExtensionInstanceByName(ExtensionName.headerMenu);
      const translateSpy = vi.spyOn(pluginInstance, 'translateHeaderMenu');
      service.translateHeaderMenu();

      expect(translateSpy).toHaveBeenCalled();
    });

    describe('translateColumnHeaders method', () => {
      it('should translate items with default locale when no arguments is passed to the method', () => {
        const columnsBeforeTranslateMock = [{ id: 'field1', field: 'field1', name: 'Hello', nameKey: 'HELLO' }] as Column[];
        const columnsAfterTranslateMock = [{ id: 'field1', field: 'field1', name: 'Bonjour', nameKey: 'HELLO' }] as Column[];
        vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsBeforeTranslateMock);
        sharedService.allColumns = columnsBeforeTranslateMock;
        const renderSpy = vi.spyOn(service, 'renderColumnHeaders');

        service.translateColumnHeaders();

        expect(renderSpy).toHaveBeenCalledWith(columnsAfterTranslateMock, false);
        expect(columnsBeforeTranslateMock).toEqual(columnsAfterTranslateMock);
      });

      it('should translate items with locale provided as argument to the method', () => {
        const columnsBeforeTranslateMock = [{ id: 'field1', field: 'field1', nameKey: 'HELLO' }] as Column[];
        const columnsAfterTranslateMock = [{ id: 'field1', field: 'field1', name: 'Hello', nameKey: 'HELLO' }] as Column[];
        vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsBeforeTranslateMock);
        sharedService.allColumns = columnsBeforeTranslateMock;
        const renderSpy = vi.spyOn(service, 'renderColumnHeaders');

        service.translateColumnHeaders('en');

        expect(renderSpy).toHaveBeenCalledWith(columnsAfterTranslateMock, false);
        expect(columnsBeforeTranslateMock).toEqual(columnsAfterTranslateMock);
      });

      it('should translate items with locale & column definitions provided as arguments to the method', () => {
        const columnsBeforeTranslateMock = [{ id: 'field1', field: 'field1', nameKey: 'HELLO' }] as Column[];
        const columnsAfterTranslateMock = [{ id: 'field1', field: 'field1', name: 'Hello', nameKey: 'HELLO' }] as Column[];
        const colDefSpy = vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get');
        sharedService.allColumns = columnsBeforeTranslateMock;
        const renderSpy = vi.spyOn(service, 'renderColumnHeaders');

        service.translateColumnHeaders('en', columnsBeforeTranslateMock);

        expect(colDefSpy).not.toHaveBeenCalled();
        expect(renderSpy).toHaveBeenCalledWith(columnsAfterTranslateMock, true);
        expect(columnsBeforeTranslateMock).toEqual(columnsAfterTranslateMock);
      });
    });

    describe('renderColumnHeaders method', () => {
      beforeEach(() => {
        const columnsMock = [{ id: 'field1', field: 'field1', nameKey: 'HELLO' }] as Column[];
        vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
      });

      it('should call "setColumns" on the Shared Service with the Shared "columnDefinitions" when no arguments is provided', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', nameKey: 'HELLO' }] as Column[];
        sharedService.slickGrid = gridStub;
        const colSpy = vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
        const setColumnsSpy = vi.spyOn(gridStub, 'setColumns');

        service.renderColumnHeaders();

        expect(colSpy).toHaveBeenCalled();
        expect(setColumnsSpy).toHaveBeenCalledWith(columnsMock);
      });

      it('should override "allColumns" on the Shared Service and call "setColumns" with the collection provided as argument', () => {
        const columnsMock = [
          { id: 'field1', field: 'field1', nameKey: 'HELLO' },
          { id: 'field2', field: 'field2', nameKey: 'WORLD' },
        ] as Column[];
        sharedService.slickGrid = gridStub;
        const allColsSpy = vi.spyOn(SharedService.prototype, 'allColumns', 'set');
        const setColumnsSpy = vi.spyOn(gridStub, 'setColumns');

        service.renderColumnHeaders(columnsMock);

        expect(setColumnsSpy).toHaveBeenCalledWith(columnsMock);
        expect(allColsSpy).toHaveBeenCalledWith(columnsMock);
      });

      it(`should call "setColumns" with the collection provided as argument but NOT override "allColumns" on the Shared Service
    when collection provided is smaller than "allColumns" that already exists`, () => {
        const columnsMock = [{ id: 'field1', field: 'field1', nameKey: 'HELLO' }] as Column[];
        sharedService.slickGrid = gridStub;
        const setColumnsSpy = vi.spyOn(gridStub, 'setColumns');

        service.renderColumnHeaders(columnsMock);

        expect(setColumnsSpy).toHaveBeenCalledWith(columnsMock);
      });

      it('should replace the Column Picker columns when plugin is enabled and method is called with new column definition collection provided as argument', () => {
        const columnsMock = [
          { id: 'field1', field: 'field1', nameKey: 'HELLO' },
          { id: 'field2', field: 'field2', nameKey: 'WORLD' },
        ] as Column[];
        const instanceMock: any = { translateColumnPicker: vi.fn() };
        const gridOptionsMock = { enableColumnPicker: true } as GridOption;
        vi.spyOn(extensionColumnPickerStub, 'register').mockReturnValueOnce(instanceMock);
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        const setColumnsSpy = vi.spyOn(gridStub, 'setColumns');

        service.bindDifferentExtensions();
        service.renderColumnHeaders(columnsMock);

        expect(setColumnsSpy).toHaveBeenCalledWith(columnsMock);
        expect(service.getExtensionByName(ExtensionName.columnPicker)!.instance.columns).toEqual(columnsMock);
      });

      it('should replace the Grid Menu columns when plugin is enabled and method is called with new column definition collection provided as argument', () => {
        const columnsMock = [
          { id: 'field1', field: 'field1', nameKey: 'HELLO' },
          { id: 'field2', field: 'field2', nameKey: 'WORLD' },
        ] as Column[];
        const instanceMock: any = { translateGridMenu: vi.fn() };
        const gridOptionsMock = { enableGridMenu: true } as GridOption;
        vi.spyOn(extensionGridMenuStub, 'register').mockReturnValueOnce(instanceMock);
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        const setColumnsSpy = vi.spyOn(gridStub, 'setColumns');

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
      extensionUtility = new ExtensionUtility(sharedService, undefined, translateService);
      service = new ExtensionService(
        extensionUtility,
        filterServiceStub,
        pubSubServiceStub,
        sharedService,
        sortServiceStub,
        treeDataServiceStub,
        translateService
      );

      const gridOptionsMock = { enableTranslate: true } as GridOption;
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    });

    it('should throw an error if "enableTranslate" is set but the Translate Service is null and "translateColumnHeaders" method is called', () => {
      expect(() => service.translateColumnHeaders()).toThrow('[Slickgrid-Universal] requires a Translate Service to be installed and configured');
    });

    it('should throw an error if "enableTranslate" is set but the Translate Service is null and "translateItems" private method is called', () =>
      new Promise((done: any) => {
        try {
          const gridOptionsMock = { enableTranslate: true } as GridOption;
          const columnBeforeTranslate = { id: 'field1', field: 'field1', name: 'Hello', nameKey: 'HELLO' };
          const columnsMock = [columnBeforeTranslate] as Column[];
          vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
          vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

          service.bindDifferentExtensions();
        } catch (e: any) {
          expect(e.message).toContain('[Slickgrid-Universal] requires a Translate Service to be installed and configured');
          done();
        }
      }));
  });
});
