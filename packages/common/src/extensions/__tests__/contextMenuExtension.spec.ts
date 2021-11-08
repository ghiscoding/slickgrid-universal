import { ContextMenuExtension } from '../contextMenuExtension';
import { ExtensionUtility } from '../extensionUtility';
import { Formatters } from '../../formatters';
import { SharedService } from '../../services/shared.service';
import { DelimiterType, FileType } from '../../enums/index';
import { Column, SlickDataView, GridOption, MenuCommandItem, SlickGrid, SlickNamespace, ContextMenu, SlickContextMenu } from '../../interfaces/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { ExcelExportService, PubSubService, TextExportService, TreeDataService } from '../../services';

declare const Slick: SlickNamespace;

const excelExportServiceStub = {
  className: 'ExcelExportService',
  exportToExcel: jest.fn(),
} as unknown as ExcelExportService;

const exportServiceStub = {
  className: 'TextExportService',
  exportToFile: jest.fn(),
} as unknown as TextExportService;

const dataViewStub = {
  collapseAllGroups: jest.fn(),
  expandAllGroups: jest.fn(),
  refresh: jest.fn(),
  getItems: jest.fn(),
  getGrouping: jest.fn(),
  setGrouping: jest.fn(),
  setItems: jest.fn(),
} as unknown as SlickDataView;

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getColumns: jest.fn(),
  getOptions: jest.fn(),
  invalidate: jest.fn(),
  registerPlugin: jest.fn(),
  onClick: new Slick.Event(),
  setColumns: jest.fn(),
  setActiveCell: jest.fn(),
  setHeaderRowVisibility: jest.fn(),
  setTopPanelVisibility: jest.fn(),
  setPreHeaderPanelVisibility: jest.fn(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as PubSubService;

const treeDataServiceStub = {
  init: jest.fn(),
  dispose: jest.fn(),
  handleOnCellClick: jest.fn(),
  toggleTreeDataCollapse: jest.fn(),
} as unknown as TreeDataService;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn(),
  closeMenu: jest.fn(),
  setOptions: jest.fn(),
  onBeforeMenuClose: new Slick.Event(),
  onBeforeMenuShow: new Slick.Event(),
  onAfterMenuShow: new Slick.Event(),
  onColumnsChanged: new Slick.Event(),
  onCommand: new Slick.Event(),
  onOptionSelected: new Slick.Event(),
}));

describe('contextMenuExtension', () => {
  jest.mock('slickgrid/plugins/slick.contextmenu', () => mockAddon);
  Slick.Plugins = {
    ContextMenu: mockAddon
  } as any;

  const columnsMock: Column[] = [{ id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' }, { id: 'field2', field: 'field2', width: 75 }];
  let extensionUtility: ExtensionUtility;
  let translateService: TranslateServiceStub;
  let extension: ContextMenuExtension;
  let sharedService: SharedService;

  const gridOptionsMock = {
    enableAutoSizeColumns: true,
    enableContextMenu: true,
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
    contextMenu: {
      commandItems: [],
      autoAdjustDrop: true,
      autoAlignSide: true,
      hideCloseButton: false,
      hideClearAllGrouping: false,
      hideCollapseAllGroups: false,
      hideCommandSection: false,
      hideCopyCellValueCommand: false,
      hideExpandAllGroups: false,
      hideExportCsvCommand: false,
      hideExportExcelCommand: false,
      hideExportTextDelimitedCommand: true,
      hideMenuOnScroll: true,
      hideOptionSection: false,
      onExtensionRegistered: jest.fn(),
      onCommand: () => { },
      onBeforeMenuShow: () => { },
      onBeforeMenuClose: () => { },
      onAfterMenuShow: () => { },
      onOptionSelected: () => { },
    },
    pagination: {
      totalItems: 0
    },
    showHeaderRow: false,
    showTopPanel: false,
    showPreHeaderPanel: false
  } as unknown as GridOption;

  describe('with I18N Service', () => {
    beforeEach(() => {
      sharedService = new SharedService();
      translateService = new TranslateServiceStub();
      extensionUtility = new ExtensionUtility(sharedService, translateService);
      extension = new ContextMenuExtension(extensionUtility, pubSubServiceStub, sharedService, treeDataServiceStub, translateService);
      translateService.use('fr');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return null when either the grid object or the grid options is missing', () => {
      const output = extension.register();
      expect(output).toBeNull();
    });

    describe('registered addon', () => {
      beforeEach(() => {
        jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(dataViewStub);
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 1));
        jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
      });

      it('should register the addon', () => {
        const onRegisteredSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onExtensionRegistered');

        const instance = extension.register() as SlickContextMenu;
        const addonInstance = extension.getAddonInstance();

        expect(instance).toBeTruthy();
        expect(instance).toEqual(addonInstance);
        expect(onRegisteredSpy).toHaveBeenCalledWith(instance);
        expect(mockAddon).toHaveBeenCalledWith({
          commandItems: [{
            action: expect.anything(),
            command: 'copy',
            disabled: false,
            iconCssClass: 'fa fa-clone',
            itemUsabilityOverride: expect.anything(),
            positionOrder: 50,
            title: 'Copier',
          }],
          autoAdjustDrop: true,
          autoAlignSide: true,
          hideCloseButton: false,
          hideClearAllGrouping: false,
          hideCollapseAllGroups: false,
          hideCommandSection: false,
          hideCopyCellValueCommand: false,
          hideExpandAllGroups: false,
          hideExportCsvCommand: false,
          hideExportExcelCommand: false,
          hideExportTextDelimitedCommand: true,
          hideMenuOnScroll: true,
          hideOptionSection: false,
          onCommand: expect.anything(),
          onOptionSelected: expect.anything(),
          onBeforeMenuClose: expect.anything(),
          onBeforeMenuShow: expect.anything(),
          onAfterMenuShow: expect.anything(),
          onExtensionRegistered: expect.anything(),
        });
      });

      it('should call internal event handler subscribe and expect the "onBeforeMenuShow" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onb4CloseSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuClose');
        const onb4ShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuShow');
        const onAfterShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onAfterMenuShow');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onCommand');
        const onOptionSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onOptionSelected');

        const instance = extension.register() as SlickContextMenu;
        instance.onBeforeMenuShow.notify({ cell: 0, row: 0, grid: gridStub }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onb4ShowSpy).toHaveBeenCalledWith(expect.anything(), { cell: 0, row: 0, grid: gridStub });
        expect(onb4CloseSpy).not.toHaveBeenCalled();
        expect(onCommandSpy).not.toHaveBeenCalled();
        expect(onOptionSpy).not.toHaveBeenCalled();
        expect(onAfterShowSpy).not.toHaveBeenCalled();
      });

      it('should call internal event handler subscribe and expect the "onBeforeMenuClose" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onb4CloseSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuClose');
        const onb4ShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuShow');
        const onAfterShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onAfterMenuShow');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onCommand');
        const onOptionSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onOptionSelected');

        const menuElm = document.createElement('div');
        const instance = extension.register() as SlickContextMenu;
        instance.onBeforeMenuClose.notify({ cell: 0, row: 0, grid: gridStub, menu: menuElm }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onb4CloseSpy).toHaveBeenCalledWith(expect.anything(), { cell: 0, row: 0, grid: gridStub, menu: menuElm });
        expect(onb4ShowSpy).not.toHaveBeenCalled();
        expect(onCommandSpy).not.toHaveBeenCalled();
        expect(onOptionSpy).not.toHaveBeenCalled();
        expect(onAfterShowSpy).not.toHaveBeenCalled();
      });

      it('should call internal event handler subscribe and expect the "onAfterMenuShow" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onb4CloseSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuClose');
        const onb4ShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuShow');
        const onAfterShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onAfterMenuShow');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onCommand');
        const onOptionSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onOptionSelected');

        const instance = extension.register() as SlickContextMenu;
        instance.onAfterMenuShow.notify({ cell: 0, row: 0, grid: gridStub }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onAfterShowSpy).toHaveBeenCalledWith(expect.anything(), { cell: 0, row: 0, grid: gridStub });
        expect(onb4ShowSpy).not.toHaveBeenCalled();
        expect(onb4CloseSpy).not.toHaveBeenCalled();
        expect(onCommandSpy).not.toHaveBeenCalled();
        expect(onOptionSpy).not.toHaveBeenCalled();
      });

      it('should call internal event handler subscribe and expect the "onCommand" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onb4CloseSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuClose');
        const onb4ShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuShow');
        const onAfterShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onAfterMenuShow');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onCommand');
        const onOptionSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onOptionSelected');

        const instance = extension.register() as SlickContextMenu;
        instance.onCommand.notify({ item: { command: 'help' }, column: {} as Column, grid: gridStub, command: 'help' }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onCommandSpy).toHaveBeenCalledWith(expect.anything(), { item: { command: 'help' }, column: {} as Column, grid: gridStub, command: 'help' });
        expect(onOptionSpy).not.toHaveBeenCalled();
        expect(onb4CloseSpy).not.toHaveBeenCalled();
        expect(onb4ShowSpy).not.toHaveBeenCalled();
        expect(onAfterShowSpy).not.toHaveBeenCalled();
      });

      it('should call internal event handler subscribe and expect the "onOptionSelected" option to be called when addon notify is called', () => {
        const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
        const onb4CloseSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuClose');
        const onb4ShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onBeforeMenuShow');
        const onAfterShowSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onAfterMenuShow');
        const onCommandSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onCommand');
        const onOptionSpy = jest.spyOn(SharedService.prototype.gridOptions.contextMenu as ContextMenu, 'onOptionSelected');

        const instance = extension.register() as SlickContextMenu;
        instance.onOptionSelected.notify({ item: { option: 'help' }, column: {} as Column, grid: gridStub, option: 'help' }, new Slick.EventData(), gridStub);

        expect(handlerSpy).toHaveBeenCalledTimes(5);
        expect(handlerSpy).toHaveBeenCalledWith(
          { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
          expect.anything()
        );
        expect(onOptionSpy).toHaveBeenCalledWith(expect.anything(), { item: { option: 'help' }, column: {} as Column, grid: gridStub, option: 'help' });
        expect(onCommandSpy).not.toHaveBeenCalled();
        expect(onb4CloseSpy).not.toHaveBeenCalled();
        expect(onb4ShowSpy).not.toHaveBeenCalled();
        expect(onAfterShowSpy).not.toHaveBeenCalled();
      });

      it('should dispose of the addon', () => {
        const instance = extension.register() as SlickContextMenu;
        const destroySpy = jest.spyOn(instance, 'destroy');

        extension.dispose();

        expect(destroySpy).toHaveBeenCalled();
      });
    });

    describe('addContextMenuCommandCommands method', () => {
      afterEach(() => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      });

      it('should expect an empty "commandItems" array when "hideCopyCellValueCommand" is set True', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, contextMenu: { hideCopyCellValueCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([]);
      });

      it('should have the "copy"  menu command when "hideCopyCellValueCommand" is set to False', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-clone', title: 'Copier', disabled: false, command: 'copy', positionOrder: 50, itemUsabilityOverride: expect.anything() }
        ]);
      });

      it('should have the "export-csv" menu command when "enableTextExport" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportExcelCommand: true, hideExportTextDelimitedCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-download', title: 'Exporter en format CSV', disabled: false, command: 'export-csv', positionOrder: 51 }
        ]);
      });

      it('should not have the "export-csv" menu command when "enableTextExport" and "hideExportCsvCommand" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportExcelCommand: true, hideExportCsvCommand: true, hideExportTextDelimitedCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([]);
      });

      it('should have the "export-excel" menu command when "enableTextExport" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: true, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-file-excel-o text-success', title: 'Exporter vers Excel', disabled: false, command: 'export-excel', positionOrder: 52 }
        ]);
      });

      it('should have the "export-text-delimited" menu command when "enableTextExport" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-download', title: 'Exporter en format texte (délimité par tabulation)', disabled: false, command: 'export-text-delimited', positionOrder: 53 }
        ]);
      });

      it('should not have the "export-text-delimited" menu command when "enableTextExport" and "hideExportCsvCommand" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportExcelCommand: true, hideExportCsvCommand: true, hideExportTextDelimitedCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([]);
      });

      it('should have the "clear-grouping" menu command when "enableDraggableGrouping" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableDraggableGrouping: true, contextMenu: { hideCopyCellValueCommand: true, hideCollapseAllGroups: true, hideExpandAllGroups: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-times', title: 'Supprimer tous les groupes', disabled: false, command: 'clear-grouping', positionOrder: 55, itemUsabilityOverride: expect.anything() }
        ]);
      });

      it('should have the "clear-grouping" menu command when "enableGrouping" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCopyCellValueCommand: true, hideCollapseAllGroups: true, hideExpandAllGroups: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-times', title: 'Supprimer tous les groupes', disabled: false, command: 'clear-grouping', positionOrder: 55, itemUsabilityOverride: expect.anything() }
        ]);
      });

      it('should NOT have the "clear-grouping" menu command when "enableGrouping" and "hideClearAllGrouping" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCopyCellValueCommand: true, hideCollapseAllGroups: true, hideExpandAllGroups: true, hideClearAllGrouping: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([]);
      });

      it('should have the "collapse-all-groups" menu command when "enableGrouping" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCopyCellValueCommand: true, hideClearAllGrouping: true, hideCollapseAllGroups: false, hideExpandAllGroups: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-compress', title: 'Réduire tous les groupes', disabled: false, command: 'collapse-all-groups', positionOrder: 56, itemUsabilityOverride: expect.anything() }
        ]);
      });

      it('should have the "collapse-all-groups" menu command when "enableTreeData" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideCopyCellValueCommand: true, hideClearAllGrouping: true, hideCollapseAllGroups: false, hideExpandAllGroups: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-compress', title: 'Réduire tous les groupes', disabled: false, command: 'collapse-all-groups', positionOrder: 56, itemUsabilityOverride: expect.anything() }
        ]);
      });

      it('should NOT have the "collapse-all-groups" menu command when "enableGrouping" and "hideClearAllGrouping" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCopyCellValueCommand: true, hideClearAllGrouping: true, hideCollapseAllGroups: true, hideExpandAllGroups: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([]);
      });

      it('should have the "expand-all-groups" menu command when "enableGrouping" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCopyCellValueCommand: true, hideClearAllGrouping: true, hideCollapseAllGroups: true, hideExpandAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-expand', title: 'Étendre tous les groupes', disabled: false, command: 'expand-all-groups', positionOrder: 57, itemUsabilityOverride: expect.anything() }
        ]);
      });

      it('should have the "expand-all-groups" menu command when "enableTreeData" is set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideCopyCellValueCommand: true, hideClearAllGrouping: true, hideCollapseAllGroups: true, hideExpandAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-expand', title: 'Étendre tous les groupes', disabled: false, command: 'expand-all-groups', positionOrder: 57, itemUsabilityOverride: expect.anything() }
        ]);
      });

      it('should NOT have the "expand-all-groups" menu command when "enableGrouping" and "hideClearAllGrouping" are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCopyCellValueCommand: true, hideClearAllGrouping: true, hideCollapseAllGroups: true, hideExpandAllGroups: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([]);
      });

      it('should have 2 Grouping commands (collapse, expand) when enableTreeData is set and none of the hidden flags are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideCopyCellValueCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-compress', title: 'Réduire tous les groupes', disabled: false, command: 'collapse-all-groups', positionOrder: 56, itemUsabilityOverride: expect.anything() },
          { action: expect.anything(), iconCssClass: 'fa fa-expand', title: 'Étendre tous les groupes', disabled: false, command: 'expand-all-groups', positionOrder: 57, itemUsabilityOverride: expect.anything() }
        ]);
      });

      it('should have all 3 Grouping commands (clear, collapse, expand) when grouping is enabled and none of the hidden flags are set', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCopyCellValueCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-times', title: 'Supprimer tous les groupes', disabled: false, command: 'clear-grouping', positionOrder: 55, itemUsabilityOverride: expect.anything() },
          { action: expect.anything(), iconCssClass: 'fa fa-compress', title: 'Réduire tous les groupes', disabled: false, command: 'collapse-all-groups', positionOrder: 56, itemUsabilityOverride: expect.anything() },
          { action: expect.anything(), iconCssClass: 'fa fa-expand', title: 'Étendre tous les groupes', disabled: false, command: 'expand-all-groups', positionOrder: 57, itemUsabilityOverride: expect.anything() }
        ]);
      });

      it('should have all 3 Grouping commands (clear, collapse, expand) & the copy command when there no hidden flags in the contextMenu object', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), iconCssClass: 'fa fa-clone', title: 'Copier', disabled: false, command: 'copy', positionOrder: 50, itemUsabilityOverride: expect.anything() },
          { divider: true, command: '', positionOrder: 54 },
          { action: expect.anything(), iconCssClass: 'fa fa-times', title: 'Supprimer tous les groupes', disabled: false, command: 'clear-grouping', positionOrder: 55, itemUsabilityOverride: expect.anything() },
          { action: expect.anything(), iconCssClass: 'fa fa-compress', title: 'Réduire tous les groupes', disabled: false, command: 'collapse-all-groups', positionOrder: 56, itemUsabilityOverride: expect.anything() },
          { action: expect.anything(), iconCssClass: 'fa fa-expand', title: 'Étendre tous les groupes', disabled: false, command: 'expand-all-groups', positionOrder: 57, itemUsabilityOverride: expect.anything() }
        ]);
      });
    });

    describe('adding Context Menu Command Items', () => {
      const commandItemsMock = [{
        iconCssClass: 'fa fa-question-circle',
        title: 'Help',
        titleKey: 'HELP',
        disabled: false,
        command: 'help',
        positionOrder: 99
      }];

      beforeEach(() => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableTextExport: true,
          contextMenu: {
            commandItems: commandItemsMock,
            hideCopyCellValueCommand: true,
            hideExportCsvCommand: false,
            hideExportExcelCommand: false,
            hideExportTextDelimitedCommand: true,
            hideClearAllGrouping: true,
            hideCollapseAllGroups: true,
            hideExpandAllGroups: true,
          }
        } as GridOption;

        jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(dataViewStub);
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
      });

      afterEach(() => {
        extension.dispose();
      });

      it('should have user Context Menu Command items when "enableTranslate" is disabled', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock, enableTranslate: false, enableTextExport: true,
          contextMenu: {
            commandItems: commandItemsMock,
            hideCopyCellValueCommand: true,
            hideExportCsvCommand: false,
            hideExportExcelCommand: true,
            hideExportTextDelimitedCommand: true,
            hideClearAllGrouping: true,
            hideCollapseAllGroups: true,
            hideExpandAllGroups: true,
          }
        } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), command: 'export-csv', disabled: false, iconCssClass: 'fa fa-download', positionOrder: 51, title: 'Export in CSV format' },
          // { action: expect.anything(), command: 'export-excel', disabled: false, iconCssClass: 'fa fa-file-excel-o text-success', positionOrder: 54, title: 'Exporter vers Excel' },
          { command: 'help', disabled: false, iconCssClass: 'fa fa-question-circle', positionOrder: 99, title: 'Help', titleKey: 'HELP' },
        ]);
      });

      it('should have user Context Menu Command items when "enableTranslate" is active', () => {
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), command: 'export-csv', disabled: false, iconCssClass: 'fa fa-download', positionOrder: 51, title: 'Exporter en format CSV' },
          // { action: expect.anything(), command: 'export-excel', disabled: false, iconCssClass: 'fa fa-file-excel-o text-success', positionOrder: 54, title: 'Exporter vers Excel' },
          { command: 'help', disabled: false, iconCssClass: 'fa fa-question-circle', positionOrder: 99, title: 'Aide', titleKey: 'HELP' },
        ]);
      });

      it('should have same user Context Menu Command items even when Context Menu extension is registered multiple times', () => {
        extension.register();
        extension.register();
        expect((SharedService.prototype.gridOptions.contextMenu as ContextMenu).commandItems).toEqual([
          { action: expect.anything(), command: 'export-csv', disabled: false, iconCssClass: 'fa fa-download', positionOrder: 51, title: 'Exporter en format CSV' },
          // { action: expect.anything(), command: 'export-excel', disabled: false, iconCssClass: 'fa fa-file-excel-o text-success', positionOrder: 54, title: 'Exporter vers Excel' },
          { command: 'help', disabled: false, iconCssClass: 'fa fa-question-circle', positionOrder: 99, title: 'Aide', titleKey: 'HELP' },
        ]);
      });
    });

    describe('executeContextMenuInternalCommandCommands method', () => {
      beforeEach(() => {
        if (window.document) {
          window.document.createRange = () => ({
            selectNodeContents: () => { },
            setStart: () => { },
            setEnd: () => { },
            commonAncestorContainer: { nodeName: 'BODY', ownerDocument: document },
          } as any);

          window.document.execCommand = () => (true);

          window.getSelection = () => ({
            removeAllRanges: () => { },
            addRange: () => { },
          } as any);
        }
      });

      it('should call "copyToClipboard", without export formatter, when the command triggered is "copy"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const execSpy = jest.spyOn(window.document, 'execCommand');
        extension.register();
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John'
        });

        expect(execSpy).toHaveBeenCalledWith('copy', false, 'John');
      });

      it('should call "copyToClipboard", WITH export formatter, when the command triggered is "copy"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, exportOptions: { exportWithFormatter: true } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', formatter: Formatters.uppercase } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const execSpy = jest.spyOn(window.document, 'execCommand');
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John'
        });

        expect(execSpy).toHaveBeenCalledWith('copy', false, 'JOHN');
      });

      it('should call "copyToClipboard" and get the value even when there is a "queryFieldNameGetterFn" callback defined with dot notation the command triggered is "copy"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'lastName' } as Column;
        const dataContextMock = { id: 123, firstName: '\u034f\u034fJohny', lastName: '\u034f\u034fDoe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const execSpy = jest.spyOn(window.document, 'execCommand');
        extension.register();
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John'
        });

        expect(execSpy).toHaveBeenCalledWith('copy', false, 'Doe');
      });

      it('should call "copyToClipboard" and get the value even when there is a "queryFieldNameGetterFn" callback defined with dot notation the command triggered is "copy"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'user.lastName' } as Column;
        const dataContextMock = { id: 123, user: { firstName: 'John', lastName: '·\u034f ⮞   Doe', age: 50 } };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const execSpy = jest.spyOn(window.document, 'execCommand');
        extension.register();
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John'
        });

        expect(execSpy).toHaveBeenCalledWith('copy', false, 'Doe');
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return True when a value to copy is found in the dataContext object', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(true);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return False when a value to copy is an empty string', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: '', lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(false);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return False when a value to copy is null', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: null, lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(false);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return False when the dataContext object does not contain the field property specified', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(false);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return True when there is a "queryFieldNameGetterFn" which itself returns a value', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'lastName' } as Column;
        const dataContextMock = { id: 123, firstName: null, lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(true);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return True when there is a "queryFieldNameGetterFn" and a dot notation field which does return a value', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'user.firstName', queryFieldNameGetterFn: () => 'user.lastName' } as Column;
        const dataContextMock = { id: 123, user: { firstName: null, lastName: 'Doe', age: 50 } };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(true);
      });

      it('should call "exportToExcel" and expect an error thrown when ExcelExportService is not registered prior to calling the method', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: true, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-excel') as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any))
          .toThrow('[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Context Menu.');
      });

      it('should call "exportToFile" with CSV and expect an error thrown when TextExportService is not registered prior to calling the method', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-csv') as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any))
          .toThrow('[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu.');
      });

      it('should call "exportToFile" with Text Delimited and expect an error thrown when TextExportService is not registered prior to calling the method', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-text-delimited') as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any))
          .toThrow('[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu.');
      });


      it('should call "exportToExcel" when the command triggered is "export-excel"', () => {
        const excelExportSpy = jest.spyOn(excelExportServiceStub, 'exportToExcel');
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: true, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([excelExportServiceStub]);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-excel') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any);

        expect(excelExportSpy).toHaveBeenCalled();
      });

      it('should call "exportToFile" with CSV set when the command triggered is "export-csv"', () => {
        const exportSpy = jest.spyOn(exportServiceStub, 'exportToFile');
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([exportServiceStub]);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-csv') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any);

        expect(exportSpy).toHaveBeenCalledWith({
          delimiter: DelimiterType.comma,
          format: FileType.csv,
        });
      });

      it('should call "exportToFile" with Text Delimited set when the command triggered is "export-text-delimited"', () => {
        const exportSpy = jest.spyOn(exportServiceStub, 'exportToFile');
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([exportServiceStub]);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-text-delimited') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any);

        expect(exportSpy).toHaveBeenCalledWith({
          delimiter: DelimiterType.tab,
          format: FileType.txt,
        });
      });

      it('should call "setGrouping" from the DataView when Grouping is enabled and the command triggered is "clear-grouping"', () => {
        const pubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'setGrouping');
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'clear-grouping') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'clear-grouping', cell: 0, row: 0 } as any);

        expect(dataviewSpy).toHaveBeenCalledWith([]);
        expect(pubSpy).toHaveBeenCalledWith('onContextMenuClearGrouping');
        expect(pubSubSpy).toHaveBeenCalledWith('onContextMenuClearGrouping');
      });

      it('should call "collapseAllGroups" from the DataView when Grouping is enabled and the command triggered is "collapse-all-groups"', () => {
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'collapseAllGroups');
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCollapseAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'collapse-all-groups', cell: 0, row: 0 } as any);

        expect(dataviewSpy).toHaveBeenCalledWith();
        expect(pubSubSpy).toHaveBeenCalledWith('onContextMenuCollapseAllGroups');
      });

      it('should call "collapseAllGroups" from the DataView when Tree Data is enabled and the command triggered is "collapse-all-groups"', () => {
        jest.spyOn(SharedService.prototype.dataView, 'getItems').mockReturnValueOnce(columnsMock);
        const treeDataSpy = jest.spyOn(treeDataServiceStub, 'toggleTreeDataCollapse');
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideCollapseAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'collapse-all-groups', cell: 0, row: 0 } as any);

        expect(treeDataSpy).toHaveBeenCalledWith(true);
      });

      it('should call "expandAllGroups" from the DataView when Grouping is enabled and the command triggered is "expand-all-groups"', () => {
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'expandAllGroups');
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideExpandAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'expand-all-groups', cell: 0, row: 0 } as any);

        expect(dataviewSpy).toHaveBeenCalledWith();
        expect(pubSubSpy).toHaveBeenCalledWith('onContextMenuExpandAllGroups');
      });

      it('should call "expandAllGroups" from the DataView when Tree Data is enabled and the command triggered is "expand-all-groups"', () => {
        const treeDataSpy = jest.spyOn(treeDataServiceStub, 'toggleTreeDataCollapse');
        jest.spyOn(SharedService.prototype.dataView, 'getItems').mockReturnValueOnce(columnsMock);
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideExpandAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'expand-all-groups', cell: 0, row: 0 } as any);

        expect(treeDataSpy).toHaveBeenCalledWith(false);
      });

      it('should expect "itemUsabilityOverride" callback on all the Grouping command to return False when there are NO Groups in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'getGrouping').mockReturnValue([]);
        extension.register();

        const menuClearCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'clear-grouping') as MenuCommandItem;
        const isClearCommandUsable = menuClearCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);

        expect(isClearCommandUsable).toBe(false);
        expect(isCollapseCommandUsable).toBe(false);
        expect(isExpandCommandUsable).toBe(false);
        expect(dataviewSpy).toHaveBeenCalled();
      });

      it('should expect "itemUsabilityOverride" callback on all the Grouping command to return True when there are Groups defined in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'getGrouping').mockReturnValue([{ collapsed: true }]);
        extension.register();

        const menuClearCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'clear-grouping') as MenuCommandItem;
        const isClearCommandUsable = menuClearCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);

        expect(isClearCommandUsable).toBe(true);
        expect(isCollapseCommandUsable).toBe(true);
        expect(isExpandCommandUsable).toBe(true);
        expect(dataviewSpy).toHaveBeenCalled();
      });

      it('should expect "itemUsabilityOverride" callback on all the Tree Data Grouping command to return Tree (collapse, expand) at all time even when there are NO Groups in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);

        expect(isCollapseCommandUsable).toBe(true);
        expect(isExpandCommandUsable).toBe(true);
      });

      it('should expect "itemUsabilityOverride" callback on all the Tree Data Grouping command to return True (collapse, expand) when there are Groups defined in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);

        expect(isCollapseCommandUsable).toBe(true);
        expect(isExpandCommandUsable).toBe(true);
      });
    });

    describe('translateContextMenu method', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should have all context menu commands translated and an extra internal command (copy) and expect not to see duplicate commands', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: true,
          enableTextExport: true,
          contextMenu: {
            hideExportTextDelimitedCommand: false,
            commandTitleKey: 'COMMANDS',
            commandItems: [
              { iconCssClass: 'fa fa-clone', title: 'Copy', command: 'copy', disabled: false, positionOrder: 50 },
              { iconCssClass: 'fa fa-download', title: 'Export to CSV', command: 'export-csv', disabled: false, positionOrder: 51 },
              { iconCssClass: 'fa fa-file-excel-o text-success', title: 'Export to Excel', command: 'export-excel', disabled: false, positionOrder: 52 },
              { iconCssClass: 'fa fa-download', title: 'Export in Text format (Tab delimited)', command: 'export-text-delimited', disabled: false, positionOrder: 53 },
              { iconCssClass: 'fa fa-sort-asc', title: 'Trier par ordre croissant', titleKey: 'SORT_ASCENDING', command: 'sort-asc', positionOrder: 60 },
              { iconCssClass: 'fa fa-sort-desc', title: 'Trier par ordre décroissant', titleKey: 'SORT_DESCENDING', command: 'sort-desc', positionOrder: 61 },
              { divider: true, command: '', positionOrder: 62 },
              { iconCssClass: 'fa fa-filter', title: 'Supprimer le filtre', titleKey: 'REMOVE_FILTER', command: 'clear-filter', positionOrder: 63 },
              { iconCssClass: 'fa fa-unsorted', title: 'Supprimer le tri', titleKey: 'REMOVE_SORT', command: 'clear-sort', positionOrder: 64 },
              { iconCssClass: 'fa fa-times', command: 'hide', titleKey: 'HIDE_COLUMN', positionOrder: 65, title: 'Cacher la colonne' },
            ]
          }
        } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        translateService.use('en');
        extension.translateContextMenu();

        expect(copyGridOptionsMock.contextMenu).toEqual({
          hideExportTextDelimitedCommand: false,
          commandTitle: 'Commands',
          commandTitleKey: 'COMMANDS',
          commandItems: [
            { iconCssClass: 'fa fa-clone', title: 'Copy', command: 'copy', disabled: false, positionOrder: 50 },
            { iconCssClass: 'fa fa-download', title: 'Export to CSV', command: 'export-csv', disabled: false, positionOrder: 51 },
            { iconCssClass: 'fa fa-file-excel-o text-success', title: 'Export to Excel', command: 'export-excel', disabled: false, positionOrder: 52 },
            { iconCssClass: 'fa fa-download', title: 'Export in Text format (Tab delimited)', command: 'export-text-delimited', disabled: false, positionOrder: 53 },
            { iconCssClass: 'fa fa-sort-asc', title: 'Sort Ascending', titleKey: 'SORT_ASCENDING', command: 'sort-asc', positionOrder: 60 },
            { iconCssClass: 'fa fa-sort-desc', title: 'Sort Descending', titleKey: 'SORT_DESCENDING', command: 'sort-desc', positionOrder: 61 },
            { divider: true, command: '', positionOrder: 62 },
            { iconCssClass: 'fa fa-filter', title: 'Remove Filter', titleKey: 'REMOVE_FILTER', command: 'clear-filter', positionOrder: 63 },
            { iconCssClass: 'fa fa-unsorted', title: 'Remove Sort', titleKey: 'REMOVE_SORT', command: 'clear-sort', positionOrder: 64 },
            { iconCssClass: 'fa fa-times', titleKey: 'HIDE_COLUMN', command: 'hide', positionOrder: 65, title: 'Hide Column' },
          ]
        });
      });

      it('should have all context menu options translated', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          contextMenu: {
            optionTitleKey: 'OPTIONS_LIST',
            optionItems: [
              { iconCssClass: 'fa fa-sort-asc', title: 'Trier par ordre croissant', titleKey: 'SORT_ASCENDING', option: 'sort-asc', positionOrder: 60 },
              { iconCssClass: 'fa fa-sort-desc', title: 'Trier par ordre décroissant', titleKey: 'SORT_DESCENDING', option: 'sort-desc', positionOrder: 61 },
              'divider',
              { iconCssClass: 'fa fa-filter', title: 'Supprimer le filtre', titleKey: 'REMOVE_FILTER', option: 'clear-filter', positionOrder: 63 },
              { iconCssClass: 'fa fa-unsorted', title: 'Supprimer le tri', titleKey: 'REMOVE_SORT', option: 'clear-sort', positionOrder: 64 },
              { iconCssClass: 'fa fa-times', option: 'hide', titleKey: 'HIDE_COLUMN', positionOrder: 65, title: 'Cacher la colonne' },
            ]
          }
        } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        extension.register();

        translateService.use('en');
        extension.translateContextMenu();

        expect(copyGridOptionsMock.contextMenu).toEqual({
          optionTitle: 'Options List',
          optionTitleKey: 'OPTIONS_LIST',
          optionItems: [
            { iconCssClass: 'fa fa-sort-asc', title: 'Sort Ascending', titleKey: 'SORT_ASCENDING', option: 'sort-asc', positionOrder: 60 },
            { iconCssClass: 'fa fa-sort-desc', title: 'Sort Descending', titleKey: 'SORT_DESCENDING', option: 'sort-desc', positionOrder: 61 },
            'divider',
            { iconCssClass: 'fa fa-filter', title: 'Remove Filter', titleKey: 'REMOVE_FILTER', option: 'clear-filter', positionOrder: 63 },
            { iconCssClass: 'fa fa-unsorted', title: 'Remove Sort', titleKey: 'REMOVE_SORT', option: 'clear-sort', positionOrder: 64 },
            { iconCssClass: 'fa fa-times', titleKey: 'HIDE_COLUMN', option: 'hide', positionOrder: 65, title: 'Hide Column' },
          ],
          commandItems: [
            { action: expect.anything(), iconCssClass: 'fa fa-clone', title: 'Copy', command: 'copy', disabled: false, itemUsabilityOverride: expect.anything(), positionOrder: 50 },
          ]
        });
      });
    });
    // });

    describe('without Translate Service', () => {
      beforeEach(() => {
        translateService = undefined as any;
        extension = new ContextMenuExtension({} as ExtensionUtility, pubSubServiceStub, { gridOptions: { enableTranslate: true } } as SharedService, treeDataServiceStub, translateService);
      });

      it('should throw an error if "enableTranslate" is set but the I18N Service is null', () => {
        expect(() => extension.register()).toThrowError('[Slickgrid-Universal] requires a Translate Service to be installed and configured');
      });
    });
  });
});
