import 'slickgrid/controls/slick.gridmenu';

import {
  Extension,
  GetSlickEventType,
  GridOption,
  GridMenu,
  GridMenuItem,
  SlickEventData,
  SlickEventHandler,
  SlickGridMenu,
  SlickNamespace,
} from '../interfaces/index';
import { DelimiterType, FileType } from '../enums/index';
import { ExcelExportService } from '../services/excelExport.service';
import { TextExportService } from '../services/textExport.service';
import { ExtensionUtility } from './extensionUtility';
import { FilterService } from '../services/filter.service';
import { PubSubService } from '../services/pubSub.service';
import { SortService } from '../services/sort.service';
import { SharedService } from '../services/shared.service';
import { TranslaterService } from '../services/translater.service';
import { BackendUtilityService } from '../services/backendUtility.service';
import { getTranslationPrefix } from '../services/utilities';

// using external js libraries
declare const Slick: SlickNamespace;

export class GridMenuExtension implements Extension {
  private _addon: SlickGridMenu | null = null;
  private _areVisibleColumnDifferent = false;
  private _eventHandler: SlickEventHandler;
  private _gridMenuOptions: GridMenu | null = null;
  private _userOriginalGridMenu!: GridMenu;

  constructor(
    private readonly extensionUtility: ExtensionUtility,
    private readonly filterService: FilterService,
    private readonly pubSubService: PubSubService,
    private readonly sharedService: SharedService,
    private readonly sortService: SortService,
    private readonly backendUtilities?: BackendUtilityService,
    private readonly translaterService?: TranslaterService,
  ) {
    this._eventHandler = new Slick.EventHandler();
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  dispose() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
    if (this._addon?.destroy) {
      this._addon.destroy();
    }
    if (this.sharedService.gridOptions?.gridMenu?.customItems) {
      this.sharedService.gridOptions.gridMenu = this._userOriginalGridMenu;
    }
    this.extensionUtility.nullifyFunctionNameStartingWithOn(this._gridMenuOptions);
    this._addon = null;
    this._gridMenuOptions = null;
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickGridMenu | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): SlickGridMenu | null {
    if (this.sharedService.gridOptions?.enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }

    if (this.sharedService?.gridOptions?.gridMenu) {
      // keep original user grid menu, useful when switching locale to translate
      this._userOriginalGridMenu = { ...this.sharedService.gridOptions.gridMenu };

      this._gridMenuOptions = { ...this.getDefaultGridMenuOptions(), ...this.sharedService.gridOptions.gridMenu };
      this.sharedService.gridOptions.gridMenu = this._gridMenuOptions;

      // merge original user grid menu items with internal items
      // then sort all Grid Menu Custom Items (sorted by pointer, no need to use the return)
      const originalCustomItems = this._userOriginalGridMenu && Array.isArray(this._userOriginalGridMenu.customItems) ? this._userOriginalGridMenu.customItems : [];
      this._gridMenuOptions.customItems = [...originalCustomItems, ...this.addGridMenuCustomCommands(originalCustomItems)];
      this.extensionUtility.translateItems(this._gridMenuOptions.customItems, 'titleKey', 'title');
      this.extensionUtility.sortItems(this._gridMenuOptions.customItems, 'positionOrder');

      this._addon = new Slick.Controls.GridMenu(this.sharedService.allColumns, this.sharedService.slickGrid, this.sharedService.gridOptions);

      // hook all events
      if (this.sharedService.slickGrid && this._gridMenuOptions) {
        if (this._gridMenuOptions.onExtensionRegistered) {
          this._gridMenuOptions.onExtensionRegistered(this._addon);
        }

        if (this._gridMenuOptions && typeof this._gridMenuOptions.onBeforeMenuShow === 'function') {
          const onBeforeMenuShowHandler = this._addon.onBeforeMenuShow;
          if (onBeforeMenuShowHandler) {
            (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeMenuShowHandler>>).subscribe(onBeforeMenuShowHandler, (e, args) => {
              if (this._gridMenuOptions && this._gridMenuOptions.onBeforeMenuShow) {
                this._gridMenuOptions.onBeforeMenuShow(e, args);
              }
            });
          }
        }

        if (this._gridMenuOptions && typeof this._gridMenuOptions.onAfterMenuShow === 'function') {
          const onAfterMenuShowHandler = this._addon.onAfterMenuShow;
          if (onAfterMenuShowHandler) {
            (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onAfterMenuShowHandler>>).subscribe(onAfterMenuShowHandler, (e, args) => {
              if (this._gridMenuOptions && this._gridMenuOptions.onAfterMenuShow) {
                this._gridMenuOptions.onAfterMenuShow(e, args);
              }
            });
          }
        }

        const onColumnsChangedHandler = this._addon.onColumnsChanged;
        if (onColumnsChangedHandler) {
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onColumnsChangedHandler>>).subscribe(onColumnsChangedHandler, (e, args) => {
            this._areVisibleColumnDifferent = true;
            if (this._gridMenuOptions && typeof this._gridMenuOptions.onColumnsChanged === 'function') {
              this._gridMenuOptions.onColumnsChanged(e, args);
            }

            // keep reference to the updated visible columns list
            if (args && Array.isArray(args.columns) && args.columns.length > this.sharedService.visibleColumns.length) {
              this.sharedService.visibleColumns = args.columns;
            }

            // when using row selection, SlickGrid will only apply the "selected" CSS class on the visible columns only
            // and if the row selection was done prior to the column being shown then that column that was previously hidden (at the time of the row selection)
            // will not have the "selected" CSS class because it wasn't visible at the time.
            // To bypass this problem we can simply recall the row selection with the same selection and that will trigger a re-apply of the CSS class
            // on all columns including the column we just made visible
            if (this.sharedService.gridOptions.enableRowSelection && args.showing) {
              const rowSelection = args.grid.getSelectedRows();
              args.grid.setSelectedRows(rowSelection);
            }

            // if we're using frozen columns, we need to readjust pinning when the new hidden column becomes visible again on the left pinning container
            // we need to readjust frozenColumn index because SlickGrid freezes by index and has no knowledge of the columns themselves
            const frozenColumnIndex = this.sharedService.gridOptions.frozenColumn ?? -1;
            if (frozenColumnIndex >= 0) {
              const { allColumns, columns: visibleColumns } = args;
              this.extensionUtility.readjustFrozenColumnIndexWhenNeeded(frozenColumnIndex, allColumns, visibleColumns);
            }
          });
        }

        const onCommandHandler = this._addon.onCommand;
        if (onCommandHandler) {
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onCommandHandler>>).subscribe(onCommandHandler, (e, args) => {
            this.executeGridMenuInternalCustomCommands(e, args);
            if (this._gridMenuOptions && typeof this._gridMenuOptions.onCommand === 'function') {
              this._gridMenuOptions.onCommand(e, args);
            }
          });
        }
        const onMenuCloseHandler = this._addon.onMenuClose;
        if (onMenuCloseHandler) {
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onMenuCloseHandler>>).subscribe(onMenuCloseHandler, (e, args) => {
            if (this._gridMenuOptions && typeof this._gridMenuOptions.onMenuClose === 'function') {
              this._gridMenuOptions.onMenuClose(e, args);
            }

            // we also want to resize the columns if the user decided to hide certain column(s)
            if (this.sharedService.slickGrid && typeof this.sharedService.slickGrid.autosizeColumns === 'function') {
              // make sure that the grid still exist (by looking if the Grid UID is found in the DOM tree)
              const gridUid = this.sharedService.slickGrid.getUID();
              if (this._areVisibleColumnDifferent && gridUid && document.querySelector(`.${gridUid}`) !== null) {
                const gridOptions = this.sharedService.slickGrid.getOptions();
                if (gridOptions.enableAutoSizeColumns) {
                  this.sharedService.slickGrid.autosizeColumns();
                }
                this._areVisibleColumnDifferent = false;
              }
            }
          });
        }
      }
      return this._addon;
    }
    return null;
  }

  /** Refresh the dataset through the Backend Service */
  refreshBackendDataset(gridOptions?: GridOption) {
    // user can pass new set of grid options which will override current ones
    if (gridOptions) {
      this.sharedService.gridOptions = { ...this.sharedService.gridOptions, ...gridOptions };
    }
    this.backendUtilities?.refreshBackendDataset(this.sharedService.gridOptions);
  }

  showGridMenu(e: SlickEventData) {
    if (this._addon) {
      this._addon.showGridMenu(e);
    }
  }

  /** Translate the Grid Menu titles and column picker */
  translateGridMenu() {
    // update the properties by pointers, that is the only way to get Grid Menu Control to see the new values
    // we also need to call the control init so that it takes the new Grid object with latest values
    if (this.sharedService?.gridOptions?.gridMenu) {
      this.sharedService.gridOptions.gridMenu.customItems = [];
      this.emptyGridMenuTitles();

      // merge original user grid menu items with internal items
      // then sort all Grid Menu Custom Items (sorted by pointer, no need to use the return)
      const originalCustomItems = this._userOriginalGridMenu && Array.isArray(this._userOriginalGridMenu.customItems) ? this._userOriginalGridMenu.customItems : [];
      this.sharedService.gridOptions.gridMenu.customItems = [...originalCustomItems, ...this.addGridMenuCustomCommands(originalCustomItems)];
      this.extensionUtility.translateItems(this.sharedService.gridOptions.gridMenu.customItems, 'titleKey', 'title');
      this.extensionUtility.sortItems(this.sharedService.gridOptions.gridMenu.customItems, 'positionOrder');

      this.sharedService.gridOptions.gridMenu.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'gridMenu');
      this.sharedService.gridOptions.gridMenu.forceFitTitle = this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'gridMenu');
      this.sharedService.gridOptions.gridMenu.syncResizeTitle = this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'gridMenu');

      // translate all columns (including non-visible)
      this.extensionUtility.translateItems(this.sharedService.allColumns, 'nameKey', 'name');

      // update the Titles of each sections (command, customTitle, ...)
      if (this._addon?.updateAllTitles) {
        this._addon.updateAllTitles(this.sharedService.gridOptions.gridMenu);
      }
    }
  }

  // --
  // private functions
  // ------------------

  /** Create Grid Menu with Custom Commands if user has enabled Filters and/or uses a Backend Service (OData, GraphQL) */
  private addGridMenuCustomCommands(originalCustomItems: Array<GridMenuItem | 'divider'>) {
    const backendApi = this.sharedService.gridOptions.backendServiceApi || null;
    const gridMenuCustomItems: Array<GridMenuItem | 'divider'> = [];
    const gridOptions = this.sharedService.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);
    const commandLabels = this._gridMenuOptions?.commandLabels;

    // show grid menu: Unfreeze Columns/Rows
    if (this.sharedService.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideClearFrozenColumnsCommand) {
      const commandName = 'clear-pinning';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        const translationKey = commandLabels?.clearFrozenColumnsCommandKey ?? 'CLEAR_PINNING';
        gridMenuCustomItems.push(
          {
            iconCssClass: this._gridMenuOptions.iconClearFrozenColumnsCommand || 'fa fa-times',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${translationKey}`, `TEXT_${translationKey}`, commandLabels?.clearFrozenColumnsCommand),
            disabled: false,
            command: commandName,
            positionOrder: 52
          }
        );
      }
    }

    if (this.sharedService.gridOptions && (this.sharedService.gridOptions.enableFiltering && !this.sharedService.hideHeaderRowAfterPageLoad)) {
      // show grid menu: Clear all Filters
      if (this.sharedService.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideClearAllFiltersCommand) {
        const commandName = 'clear-filter';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconClearAllFiltersCommand || 'fa fa-filter text-danger',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.clearAllFiltersCommandKey}`, 'TEXT_CLEAR_ALL_FILTERS', commandLabels?.clearAllFiltersCommand),
              disabled: false,
              command: commandName,
              positionOrder: 50
            }
          );
        }
      }

      // show grid menu: toggle filter row
      if (this.sharedService.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideToggleFilterCommand) {
        const commandName = 'toggle-filter';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconToggleFilterCommand || 'fa fa-random',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.toggleFilterCommandKey}`, 'TEXT_TOGGLE_FILTER_ROW', commandLabels?.toggleFilterCommand),
              disabled: false,
              command: commandName,
              positionOrder: 53
            }
          );
        }
      }

      // show grid menu: refresh dataset
      if (backendApi && this.sharedService.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideRefreshDatasetCommand) {
        const commandName = 'refresh-dataset';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconRefreshDatasetCommand || 'fa fa-refresh',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.refreshDatasetCommandKey}`, 'TEXT_REFRESH_DATASET', commandLabels?.refreshDatasetCommand),
              disabled: false,
              command: commandName,
              positionOrder: 57
            }
          );
        }
      }
    }

    if (this.sharedService.gridOptions.showPreHeaderPanel) {
      // show grid menu: toggle pre-header row
      if (this.sharedService.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideTogglePreHeaderCommand) {
        const commandName = 'toggle-preheader';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconTogglePreHeaderCommand || 'fa fa-random',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.togglePreHeaderCommandKey}`, 'TEXT_TOGGLE_PRE_HEADER_ROW', commandLabels?.togglePreHeaderCommand),
              disabled: false,
              command: commandName,
              positionOrder: 53
            }
          );
        }
      }
    }

    if (this.sharedService.gridOptions.enableSorting) {
      // show grid menu: Clear all Sorting
      if (this.sharedService.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideClearAllSortingCommand) {
        const commandName = 'clear-sorting';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconClearAllSortingCommand || 'fa fa-unsorted text-danger',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.clearAllSortingCommandKey}`, 'TEXT_CLEAR_ALL_SORTING', commandLabels?.clearAllSortingCommand),
              disabled: false,
              command: commandName,
              positionOrder: 51
            }
          );
        }
      }
    }

    // show grid menu: Export to file
    if ((this.sharedService.gridOptions?.enableExport || this.sharedService.gridOptions?.enableTextExport) && this._gridMenuOptions && !this._gridMenuOptions.hideExportCsvCommand) {
      const commandName = 'export-csv';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this._gridMenuOptions.iconExportCsvCommand || 'fa fa-download',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.exportCsvCommandKey}`, 'TEXT_EXPORT_TO_CSV', commandLabels?.exportCsvCommand),
            disabled: false,
            command: commandName,
            positionOrder: 54
          }
        );
      }
    }

    // show grid menu: Export to Excel
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableExcelExport && this._gridMenuOptions && !this._gridMenuOptions.hideExportExcelCommand) {
      const commandName = 'export-excel';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this._gridMenuOptions.iconExportExcelCommand || 'fa fa-file-excel-o text-success',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.exportExcelCommandKey}`, 'TEXT_EXPORT_TO_EXCEL', commandLabels?.exportExcelCommand),
            disabled: false,
            command: commandName,
            positionOrder: 55
          }
        );
      }
    }

    // show grid menu: export to text file as tab delimited
    if ((this.sharedService.gridOptions?.enableExport || this.sharedService.gridOptions?.enableTextExport) && this._gridMenuOptions && !this._gridMenuOptions.hideExportTextDelimitedCommand) {
      const commandName = 'export-text-delimited';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this._gridMenuOptions.iconExportTextDelimitedCommand || 'fa fa-download',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.exportTextDelimitedCommandKey}`, 'TEXT_EXPORT_TO_TAB_DELIMITED', commandLabels?.exportTextDelimitedCommand),
            disabled: false,
            command: commandName,
            positionOrder: 56
          }
        );
      }
    }

    // add the custom "Commands" title if there are any commands
    if (this.sharedService && this.sharedService.gridOptions && this._gridMenuOptions && (Array.isArray(gridMenuCustomItems) && gridMenuCustomItems.length > 0 || (Array.isArray(this._gridMenuOptions.customItems) && this._gridMenuOptions.customItems.length > 0))) {
      this._gridMenuOptions.customTitle = this._gridMenuOptions.customTitle || this.extensionUtility.getPickerTitleOutputString('customTitle', 'gridMenu');
    }

    return gridMenuCustomItems;
  }

  /**
   * Execute the Grid Menu Custom command callback that was triggered by the onCommand subscribe
   * These are the default internal custom commands
   * @param event
   * @param GridMenuItem args
   */
  private executeGridMenuInternalCustomCommands(_e: Event, args: GridMenuItem) {
    const registeredResources = this.sharedService?.externalRegisteredResources || [];

    if (args && args.command) {
      switch (args.command) {
        case 'clear-pinning':
          const visibleColumns = [...this.sharedService.visibleColumns];
          const newGridOptions = { frozenColumn: -1, frozenRow: -1, frozenBottom: false, enableMouseWheelScrollHandler: false };
          this.sharedService.slickGrid.setOptions(newGridOptions);
          this.sharedService.gridOptions.frozenColumn = newGridOptions.frozenColumn;
          this.sharedService.gridOptions.frozenRow = newGridOptions.frozenRow;
          this.sharedService.gridOptions.frozenBottom = newGridOptions.frozenBottom;
          this.sharedService.gridOptions.enableMouseWheelScrollHandler = newGridOptions.enableMouseWheelScrollHandler;

          // SlickGrid seems to be somehow resetting the columns to their original positions,
          // so let's re-fix them to the position we kept as reference
          if (Array.isArray(visibleColumns)) {
            this.sharedService.slickGrid.setColumns(visibleColumns);
          }

          // we also need to autosize columns if the option is enabled
          const gridOptions = this.sharedService.slickGrid.getOptions();
          if (gridOptions.enableAutoSizeColumns) {
            this.sharedService.slickGrid.autosizeColumns();
          }
          this.pubSubService.publish('onGridMenuClearAllPinning');
          break;
        case 'clear-filter':
          this.filterService.clearFilters();
          this.sharedService.dataView.refresh();
          this.pubSubService.publish('onGridMenuClearAllFilters');
          break;
        case 'clear-sorting':
          this.sortService.clearSorting();
          this.sharedService.dataView.refresh();
          this.pubSubService.publish('onGridMenuClearAllSorting');
          break;
        case 'export-csv':
          const exportCsvService: TextExportService = registeredResources.find((service: any) => service.className === 'TextExportService');
          if (exportCsvService?.exportToFile) {
            exportCsvService.exportToFile({
              delimiter: DelimiterType.comma,
              format: FileType.csv,
            });
          } else {
            throw new Error(`[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu. Example:: this.gridOptions = { enableTextExport: true, registerExternalResources: [new TextExportService()] };`);
          }
          break;
        case 'export-excel':
          const excelService: ExcelExportService = registeredResources.find((service: any) => service.className === 'ExcelExportService');
          if (excelService?.exportToExcel) {
            excelService.exportToExcel();
          } else {
            throw new Error(`[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Grid Menu. Example:: this.gridOptions = { enableExcelExport: true, registerExternalResources: [new ExcelExportService()] };`);
          }
          break;
        case 'export-text-delimited':
          const exportTxtService: TextExportService = registeredResources.find((service: any) => service.className === 'TextExportService');
          if (exportTxtService?.exportToFile) {
            exportTxtService.exportToFile({
              delimiter: DelimiterType.tab,
              format: FileType.txt,
            });
          } else {
            throw new Error(`[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu. Example:: this.gridOptions = { enableTextExport: true, registerExternalResources: [new TextExportService()] };`);
          }
          break;
        case 'toggle-filter':
          let showHeaderRow = this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.showHeaderRow || false;
          showHeaderRow = !showHeaderRow; // inverse show header flag
          this.sharedService.slickGrid.setHeaderRowVisibility(showHeaderRow);

          // when displaying header row, we'll call "setColumns" which in terms will recreate the header row filters
          if (showHeaderRow === true) {
            this.sharedService.slickGrid.setColumns(this.sharedService.columnDefinitions);
            this.sharedService.slickGrid.scrollColumnIntoView(0); // quick fix to avoid filter being out of sync with horizontal scroll
          }
          break;
        case 'toggle-toppanel':
          const showTopPanel = this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.showTopPanel || false;
          this.sharedService.slickGrid.setTopPanelVisibility(!showTopPanel);
          break;
        case 'toggle-preheader':
          const showPreHeaderPanel = this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.showPreHeaderPanel || false;
          this.sharedService.slickGrid.setPreHeaderPanelVisibility(!showPreHeaderPanel);
          break;
        case 'refresh-dataset':
          this.refreshBackendDataset();
          break;
        default:
          break;
      }
    }
  }

  private emptyGridMenuTitles() {
    if (this.sharedService?.gridOptions?.gridMenu) {
      this.sharedService.gridOptions.gridMenu.customTitle = '';
      this.sharedService.gridOptions.gridMenu.columnTitle = '';
      this.sharedService.gridOptions.gridMenu.forceFitTitle = '';
      this.sharedService.gridOptions.gridMenu.syncResizeTitle = '';
    }
  }

  /** @return default Grid Menu options */
  private getDefaultGridMenuOptions(): GridMenu {
    return {
      customTitle: undefined,
      columnTitle: this.extensionUtility.getPickerTitleOutputString('columnTitle', 'gridMenu'),
      forceFitTitle: this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'gridMenu'),
      syncResizeTitle: this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'gridMenu'),
      iconCssClass: 'fa fa-bars',
      menuWidth: 18,
      customItems: [],
      hideClearAllFiltersCommand: false,
      hideRefreshDatasetCommand: false,
      hideToggleFilterCommand: false,
    };
  }
}
