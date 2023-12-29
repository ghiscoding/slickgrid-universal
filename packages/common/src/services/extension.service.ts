import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type { Column, ExtensionModel, GridOption, SlickRowDetailView, } from '../interfaces/index';
import { type ColumnReorderFunction, type ExtensionList, ExtensionName, type InferExtensionByName, type SlickControlList, type SlickPluginList } from '../enums/index';
import type { SharedService } from './shared.service';
import type { TranslaterService } from './translater.service';
import {
  ExtensionUtility,
  SlickAutoTooltip,
  SlickCellExcelCopyManager,
  SlickCellMenu,
  SlickCheckboxSelectColumn,
  SlickColumnPicker,
  SlickContextMenu,
  SlickDraggableGrouping,
  SlickGridMenu,
  SlickGroupItemMetadataProvider,
  SlickHeaderButtons,
  SlickHeaderMenu,
  SlickRowBasedEdit,
  SlickRowMoveManager,
  SlickRowSelectionModel
} from '../extensions/index';
import type { FilterService } from './filter.service';
import type { SortService } from './sort.service';
import type { TreeDataService } from './treeData.service';
import { GridService } from './grid.service';

interface ExtensionWithColumnIndexPosition {
  name: ExtensionName;
  columnIndexPosition: number;
  extension: SlickCheckboxSelectColumn | SlickRowDetailView | SlickRowMoveManager;
}

export class ExtensionService {
  protected _extensionCreatedList: ExtensionList<any> = {} as ExtensionList<any>;
  protected _extensionList: ExtensionList<any> = {} as ExtensionList<any>;

  protected _cellMenuPlugin?: SlickCellMenu;
  protected _cellExcelCopyManagerPlugin?: SlickCellExcelCopyManager;
  protected _checkboxSelectColumn?: SlickCheckboxSelectColumn;
  protected _contextMenuPlugin?: SlickContextMenu;
  protected _columnPickerControl?: SlickColumnPicker;
  protected _draggleGroupingPlugin?: SlickDraggableGrouping;
  protected _gridMenuControl?: SlickGridMenu;
  protected _groupItemMetadataProviderService?: SlickGroupItemMetadataProvider;
  protected _headerMenuPlugin?: SlickHeaderMenu;
  protected _rowMoveManagerPlugin?: SlickRowMoveManager;
  protected _rowSelectionModel?: SlickRowSelectionModel;

  get extensionList() {
    return this._extensionList;
  }

  get gridOptions(): GridOption {
    return this.sharedService.gridOptions || {};
  }

  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly filterService: FilterService,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService,
    protected readonly sortService: SortService,
    protected readonly treeDataService: TreeDataService,
    protected readonly translaterService?: TranslaterService,
    protected readonly lazyGridService?: () => GridService
  ) { }

  /** Dispose of all the controls & plugins */
  dispose() {
    this.sharedService.visibleColumns = [];

    // dispose of each control/plugin & reset the list
    if (typeof this._extensionList === 'object') {
      const extensionNames = Object.keys(this._extensionList);

      // dispose each extension
      extensionNames.forEach(extensionName => {
        if (this._extensionList.hasOwnProperty(extensionName)) {
          const extension = this._extensionList[extensionName as keyof Record<ExtensionName, ExtensionModel<any>>] as ExtensionModel<any>;
          if (typeof extension?.instance?.dispose === 'function') {
            extension.instance.dispose();
          }
        }
      });
      // delete the extension from the _extensionList object
      extensionNames.forEach(key => {
        delete this._extensionList[key as keyof Record<ExtensionName, ExtensionModel<any>>];
      });
    }
    this._cellMenuPlugin = null as any;
    this._cellExcelCopyManagerPlugin = null as any;
    this._checkboxSelectColumn = null as any;
    this._contextMenuPlugin = null as any;
    this._columnPickerControl = null as any;
    this._draggleGroupingPlugin = null as any;
    this._gridMenuControl = null as any;
    this._groupItemMetadataProviderService = null as any;
    this._headerMenuPlugin = null as any;
    this._rowMoveManagerPlugin = null as any;
    this._rowSelectionModel = null as any;
    this._extensionCreatedList = null as any;
    this._extensionList = null as any;
  }

  /**
   * Get an external plugin Extension
   * @param {String} name
   * @param {Object} extension
   */
  addExtensionToList<T = any>(name: ExtensionName, extension: { name: ExtensionName; instance: T; }) {
    this._extensionList[name] = extension;
  }

  /** Get all columns (includes visible and non-visible) */
  getAllColumns(): Column[] {
    return this.sharedService.allColumns || [];
  }

  /** Get only visible columns */
  getVisibleColumns(): Column[] {
    return this.sharedService.visibleColumns || [];
  }

  /**
   * Get an Extension that was created by calling its "create" method (there are only 3 extensions which uses this method)
   *  @param name
   */
  getCreatedExtensionByName<P extends (SlickControlList | SlickPluginList) = any>(name: ExtensionName): ExtensionModel<P> | undefined {
    if (this._extensionCreatedList?.hasOwnProperty(name)) {
      return this._extensionCreatedList[name];
    }
    return undefined;
  }

  /**
   * Get an Extension by it's name.
   * NOTE: it's preferable to @use `getExtensionInstanceByName` if you just want the instance since it will automatically infer the extension.
   * @param name
   */
  getExtensionByName<P extends (SlickControlList | SlickPluginList) = any>(name: ExtensionName): ExtensionModel<P> | undefined {
    return this._extensionList?.[name];
  }

  /**
   * Get Extension Instance by its name.
   * @param name
   */
  getExtensionInstanceByName<T extends ExtensionName>(name: T): InferExtensionByName<T> {
    return this.getExtensionByName(name)?.instance as InferExtensionByName<T>;
  }

  /** Auto-resize all the column in the grid to fit the grid width */
  autoResizeColumns() {
    this.sharedService.slickGrid.autosizeColumns();
  }

  /** Bind/Create different Controls or Plugins after the Grid is created */
  bindDifferentExtensions() {
    if (this.gridOptions) {
      // make sure all columns are translated before creating ColumnPicker/GridMenu Controls
      // this is to avoid having hidden columns not being translated on first load
      if (this.gridOptions.enableTranslate) {
        this.translateItems(this.sharedService.allColumns, 'nameKey', 'name');
      }

      // Row Based Edit Plugin
      if (this.gridOptions.enableRowBasedEdit) {
        const instance = new SlickRowBasedEdit(this.gridOptions.rowBasedEditOptions);
        const gridService = this.lazyGridService?.();
        if (!gridService) {
          throw new Error('[Slickgrid-Universal] requires a GridService to be configured and available');
        }

        instance.init(this.sharedService.slickGrid, gridService);
        this._extensionList[ExtensionName.rowBasedEdit] = { name: ExtensionName.rowBasedEdit, instance };
      }

      // Auto Tooltip Plugin
      if (this.gridOptions.enableAutoTooltip) {
        const instance = new SlickAutoTooltip(this.gridOptions?.autoTooltipOptions);
        this.sharedService.slickGrid.registerPlugin<SlickAutoTooltip>(instance);
        this._extensionList[ExtensionName.autoTooltip] = { name: ExtensionName.autoTooltip, instance };
      }

      // Cell External Copy Manager Plugin (Excel Like)
      if (this.gridOptions.enableExcelCopyBuffer) {
        this._cellExcelCopyManagerPlugin = new SlickCellExcelCopyManager();
        this._cellExcelCopyManagerPlugin.init(this.sharedService.slickGrid, this.sharedService.gridOptions.excelCopyBufferOptions);
        if (this.gridOptions.excelCopyBufferOptions?.onExtensionRegistered) {
          this.gridOptions.excelCopyBufferOptions.onExtensionRegistered(this._cellExcelCopyManagerPlugin);
        }
        this._extensionList[ExtensionName.cellExternalCopyManager] = { name: ExtensionName.cellExternalCopyManager, instance: this._cellExcelCopyManagerPlugin };
      }

      // (Action) Cell Menu Plugin
      if (this.gridOptions.enableCellMenu) {
        this._cellMenuPlugin = new SlickCellMenu(this.extensionUtility, this.pubSubService, this.sharedService);
        if (this.gridOptions.cellMenu?.onExtensionRegistered) {
          this.gridOptions.cellMenu.onExtensionRegistered(this._cellMenuPlugin);
        }
        this._extensionList[ExtensionName.cellMenu] = { name: ExtensionName.cellMenu, instance: this._cellMenuPlugin };
      }

      // Row Selection Plugin
      // this extension should be registered BEFORE the CheckboxSelector, RowDetail or RowMoveManager since it can be use by these 2 plugins
      if (!this._rowSelectionModel && (this.gridOptions.enableRowSelection || this.gridOptions.enableCheckboxSelector || this.gridOptions.enableRowDetailView || this.gridOptions.enableRowMoveManager)) {
        if (!this._rowSelectionModel || !this.sharedService.slickGrid.getSelectionModel()) {
          const rowSelectionOptions = this.gridOptions.rowSelectionOptions ?? {};
          if (this.gridOptions.enableRowMoveManager && this.gridOptions.rowMoveManager?.dragToSelect !== false) {
            rowSelectionOptions.dragToSelect = true;
          }
          this._rowSelectionModel = new SlickRowSelectionModel(rowSelectionOptions);
          this.sharedService.slickGrid.setSelectionModel(this._rowSelectionModel);
        }
        this._extensionList[ExtensionName.rowSelection] = { name: ExtensionName.rowSelection, instance: this._rowSelectionModel };
      }

      // Checkbox Selector Plugin
      if (this.gridOptions.enableCheckboxSelector) {
        this._checkboxSelectColumn = this._checkboxSelectColumn || new SlickCheckboxSelectColumn(this.pubSubService, this.gridOptions.checkboxSelector);
        this._checkboxSelectColumn.init(this.sharedService.slickGrid);
        const createdExtension = this.getCreatedExtensionByName(ExtensionName.checkboxSelector); // get the instance from when it was really created earlier
        const instance = createdExtension && createdExtension.instance;
        if (instance) {
          this._extensionList[ExtensionName.checkboxSelector] = { name: ExtensionName.checkboxSelector, instance: this._checkboxSelectColumn };
        }
      }

      // Column Picker Control
      if (this.gridOptions.enableColumnPicker) {
        this._columnPickerControl = new SlickColumnPicker(this.extensionUtility, this.pubSubService, this.sharedService);
        if (this.gridOptions.columnPicker?.onExtensionRegistered) {
          this.gridOptions.columnPicker.onExtensionRegistered(this._columnPickerControl);
        }
        this._extensionList[ExtensionName.columnPicker] = { name: ExtensionName.columnPicker, instance: this._columnPickerControl };
      }

      // Context Menu Control
      if (this.gridOptions.enableContextMenu) {
        this._contextMenuPlugin = new SlickContextMenu(this.extensionUtility, this.pubSubService, this.sharedService, this.treeDataService);
        if (this.gridOptions.contextMenu?.onExtensionRegistered) {
          this.gridOptions.contextMenu.onExtensionRegistered(this._contextMenuPlugin);
        }
        this._extensionList[ExtensionName.contextMenu] = { name: ExtensionName.contextMenu, instance: this._contextMenuPlugin };
      }

      // Draggable Grouping Plugin
      if (this.gridOptions.enableDraggableGrouping) {
        if (this._draggleGroupingPlugin) {
          this._draggleGroupingPlugin.init(this.sharedService.slickGrid, this.gridOptions.draggableGrouping);
          if (this.gridOptions.draggableGrouping?.onExtensionRegistered) {
            this.gridOptions.draggableGrouping.onExtensionRegistered(this._draggleGroupingPlugin);
          }
          this._extensionList[ExtensionName.contextMenu] = { name: ExtensionName.contextMenu, instance: this._draggleGroupingPlugin };
        }
        this._extensionList[ExtensionName.draggableGrouping] = { name: ExtensionName.draggableGrouping, instance: this._draggleGroupingPlugin };
      }

      // Grid Menu Control
      if (this.gridOptions.enableGridMenu) {
        this._gridMenuControl = new SlickGridMenu(this.extensionUtility, this.filterService, this.pubSubService, this.sharedService, this.sortService);
        if (this.gridOptions.gridMenu?.onExtensionRegistered) {
          this.gridOptions.gridMenu.onExtensionRegistered(this._gridMenuControl);
        }
        this._extensionList[ExtensionName.gridMenu] = { name: ExtensionName.gridMenu, instance: this._gridMenuControl };
      }

      // Header Button Plugin
      if (this.gridOptions.enableHeaderButton) {
        const headerButtonPlugin = new SlickHeaderButtons(this.extensionUtility, this.pubSubService, this.sharedService);
        if (this.gridOptions.headerButton?.onExtensionRegistered) {
          this.gridOptions.headerButton.onExtensionRegistered(headerButtonPlugin);
        }
        this._extensionList[ExtensionName.headerButton] = { name: ExtensionName.headerButton, instance: headerButtonPlugin };
      }

      // Header Menu Plugin
      if (this.gridOptions.enableHeaderMenu) {
        this._headerMenuPlugin = new SlickHeaderMenu(this.extensionUtility, this.filterService, this.pubSubService, this.sharedService, this.sortService);
        if (this.gridOptions.headerMenu?.onExtensionRegistered) {
          this.gridOptions.headerMenu.onExtensionRegistered(this._headerMenuPlugin);
        }
        this._extensionList[ExtensionName.headerMenu] = { name: ExtensionName.headerMenu, instance: this._headerMenuPlugin };
      }

      // Row Move Manager Plugin
      if (this.gridOptions.enableRowMoveManager) {
        this._rowMoveManagerPlugin = this._rowMoveManagerPlugin || new SlickRowMoveManager(this.pubSubService);
        this._rowMoveManagerPlugin.init(this.sharedService.slickGrid, this.gridOptions.rowMoveManager);
        const createdExtension = this.getCreatedExtensionByName(ExtensionName.rowMoveManager); // get the instance from when it was really created earlier
        const instance = createdExtension?.instance;
        if (instance) {
          this._extensionList[ExtensionName.rowMoveManager] = { name: ExtensionName.rowMoveManager, instance: this._rowMoveManagerPlugin };
        }
      }
    }
  }

  /**
   * Bind/Create certain plugins before the Grid creation to avoid having odd behaviors.
   * Mostly because the column definitions might change after the grid creation, so we want to make sure to add it before then
   * @param columnDefinitions
   * @param gridOptions
   */
  createExtensionsBeforeGridCreation(columnDefinitions: Column[], gridOptions: GridOption) {
    const featureWithColumnIndexPositions: ExtensionWithColumnIndexPosition[] = [];

    // the following 3 features might have `columnIndexPosition` that we need to respect their column order, we will execute them by their sort order further down
    // we push them into a array and we'll process them by their position (if provided, else use same order that they were inserted)
    if (gridOptions.enableCheckboxSelector) {
      if (!this.getCreatedExtensionByName(ExtensionName.checkboxSelector)) {
        this._checkboxSelectColumn = new SlickCheckboxSelectColumn(this.pubSubService, this.sharedService.gridOptions.checkboxSelector);
        featureWithColumnIndexPositions.push({ name: ExtensionName.checkboxSelector, extension: this._checkboxSelectColumn, columnIndexPosition: gridOptions?.checkboxSelector?.columnIndexPosition ?? featureWithColumnIndexPositions.length });
      }
    }
    if (gridOptions.enableRowMoveManager) {
      if (!this.getCreatedExtensionByName(ExtensionName.rowMoveManager)) {
        this._rowMoveManagerPlugin = new SlickRowMoveManager(this.pubSubService);
        featureWithColumnIndexPositions.push({ name: ExtensionName.rowMoveManager, extension: this._rowMoveManagerPlugin, columnIndexPosition: gridOptions?.rowMoveManager?.columnIndexPosition ?? featureWithColumnIndexPositions.length });
      }
    }

    // since some features could have a `columnIndexPosition`, we need to make sure these indexes are respected in the column definitions
    this.createExtensionByTheirColumnIndex(featureWithColumnIndexPositions, columnDefinitions, gridOptions);

    if (gridOptions.enableDraggableGrouping) {
      if (!this.getCreatedExtensionByName(ExtensionName.draggableGrouping)) {
        this._draggleGroupingPlugin = new SlickDraggableGrouping(this.extensionUtility, this.pubSubService, this.sharedService);
        if (this._draggleGroupingPlugin) {
          gridOptions.enableColumnReorder = this._draggleGroupingPlugin.setupColumnReorder.bind(this._draggleGroupingPlugin) as ColumnReorderFunction;
          this._extensionCreatedList[ExtensionName.draggableGrouping] = { name: ExtensionName.draggableGrouping, instance: this._draggleGroupingPlugin };
        }
      }
    }
  }

  /** Hide a column from the grid */
  hideColumn(column: Column) {
    if (typeof this.sharedService?.slickGrid?.getColumns === 'function') {
      const columnIndex = this.sharedService.slickGrid.getColumnIndex(column.id);
      this.sharedService.visibleColumns = this.removeColumnByIndex(this.sharedService.slickGrid.getColumns(), columnIndex);
      this.sharedService.slickGrid.setColumns(this.sharedService.visibleColumns);
    }
  }

  /** Refresh the dataset through the Backend Service */
  refreshBackendDataset(gridOptions?: GridOption) {
    this.extensionUtility.refreshBackendDataset(gridOptions);
  }

  /**
   * Remove a column from the grid by it's index in the grid
   * @param columns input
   * @param index
   */
  removeColumnByIndex(columns: Column[], index: number): Column[] {
    if (Array.isArray(columns)) {
      return columns.filter((_el: Column, i: number) => index !== i);
    }
    return columns;
  }

  /** Translate all possible Extensions at once */
  translateAllExtensions() {
    this.translateCellMenu();
    this.translateColumnHeaders();
    this.translateColumnPicker();
    this.translateContextMenu();
    this.translateGridMenu();
    this.translateHeaderMenu();
  }

  /** Translate the Cell Menu titles, we need to loop through all column definition to re-translate them */
  translateCellMenu() {
    this._cellMenuPlugin?.translateCellMenu?.();
  }

  /** Translate the Column Picker and it's last 2 checkboxes */
  translateColumnPicker() {
    if (this._columnPickerControl?.translateColumnPicker) {
      this._columnPickerControl.translateColumnPicker();
    }
  }

  /** Translate the Context Menu titles, we need to loop through all column definition to re-translate them */
  translateContextMenu() {
    this._contextMenuPlugin?.translateContextMenu?.();
  }

  /**
   * Translate the Header Menu titles, we need to loop through all column definition to re-translate them
   */
  translateGridMenu() {
    this._gridMenuControl?.translateGridMenu?.();
  }

  /**
   * Translate the Header Menu titles, we need to loop through all column definition to re-translate them
   */
  translateHeaderMenu() {
    this._headerMenuPlugin?.translateHeaderMenu?.();
  }

  /**
   * Translate manually the header titles.
   * We could optionally pass a locale (that will change currently loaded locale), else it will use current locale
   * @param locale to use
   * @param new column definitions (optional)
   */
  translateColumnHeaders(locale?: boolean | string, newColumnDefinitions?: Column[]) {
    if (this.sharedService && this.gridOptions && this.gridOptions.enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }

    if (locale && this.translaterService?.use) {
      this.translaterService.use(locale as string);
    }

    let columnDefinitions = newColumnDefinitions;
    if (!columnDefinitions) {
      columnDefinitions = this.sharedService.columnDefinitions;
    }

    this.translateItems(columnDefinitions, 'nameKey', 'name');
    this.translateItems(this.sharedService.allColumns, 'nameKey', 'name');

    // re-render the column headers
    this.renderColumnHeaders(columnDefinitions, Array.isArray(newColumnDefinitions));
    this._gridMenuControl?.translateGridMenu?.();
  }

  /**
   * Render (or re-render) the column headers from column definitions.
   * calling setColumns() will trigger a grid re-render
   */
  renderColumnHeaders(newColumnDefinitions?: Column[], forceColumnDefinitionsOverwrite = false) {
    let collection = newColumnDefinitions;
    if (!collection) {
      collection = this.sharedService.columnDefinitions;
    }
    if (Array.isArray(collection) && this.sharedService.slickGrid && this.sharedService.slickGrid.setColumns) {
      if (collection.length > this.sharedService.allColumns.length || forceColumnDefinitionsOverwrite) {
        this.sharedService.allColumns = collection;
      }
      this.sharedService.slickGrid.setColumns(collection);
    }

    // replace Column Picker columns with newer data which includes new translations
    if (this.gridOptions.enableColumnPicker && this._columnPickerControl) {
      this._columnPickerControl.columns = this.sharedService.allColumns;
    }

    // replace the Grid Menu columns array list
    if (this.gridOptions.enableGridMenu && this._gridMenuControl) {
      this._gridMenuControl.columns = this.sharedService.allColumns ?? [];
      this._gridMenuControl.recreateGridMenu();
    }
  }

  //
  // protected functions
  // -------------------

  /**
   * Some extension (feature) have specific `columnIndexPosition` that the developer want to use, we need to make sure these indexes are respected in the column definitions in the order provided.
   * The following 3 features could have that optional `columnIndexPosition` and we need to respect their column order, we will first sort by their optional order and only after we will create them by their specific order.
   * We'll process them by their position (if provided, else use same order that they were inserted)
   * @param featureWithIndexPositions
   * @param columnDefinitions
   * @param gridOptions
   */
  protected createExtensionByTheirColumnIndex(featureWithIndexPositions: ExtensionWithColumnIndexPosition[], columnDefinitions: Column[], gridOptions: GridOption) {
    // 1- first step is to sort them by their index position
    featureWithIndexPositions.sort((feat1, feat2) => feat1.columnIndexPosition - feat2.columnIndexPosition);

    // 2- second step, we can now proceed to create each extension/addon and that will position them accordingly in the column definitions list
    featureWithIndexPositions.forEach(feature => {
      const instance = feature.extension.create(columnDefinitions, gridOptions);
      if (instance) {
        this._extensionCreatedList[feature.name] = { name: feature.name, instance };
      }
    });
  }

  /** Translate an array of items from an input key and assign translated value to the output key */
  protected translateItems(items: any[], inputKey: string, outputKey: string) {
    if (this.gridOptions?.enableTranslate && !(this.translaterService?.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }

    if (Array.isArray(items)) {
      items.forEach(item => {
        if (item[inputKey]) {
          item[outputKey] = this.translaterService?.translate(item[inputKey]);
        }
      });
    }
  }
}
