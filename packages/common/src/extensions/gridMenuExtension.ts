import { Constants } from '../constants';
import {
  Column,
  Extension,
  GridOption,
  GridMenu,
  GridMenuItem,
  Locale,
  MenuCommandItemCallbackArgs,
  SlickEventHandler,
  SlickGrid,
} from '../interfaces/index';
import {
  DelimiterType,
  ExtensionName,
  FileType,
} from '../enums/index';
import { ExcelExportService } from '../services/excelExport.service';
import { FileExportService } from '../services/fileExport.service';
import { ExtensionUtility } from './extensionUtility';
import { FilterService } from '../services/filter.service';
import { SortService } from '../services/sort.service';
import { SharedService } from '../services/shared.service';
import { TranslaterService } from '../services/translater.service';
import { refreshBackendDataset } from '../services/backend-utilities';
import { getTranslationPrefix } from '../services/utilities';

// using external non-typed js libraries
declare const Slick: any;
declare const $: any;

export class GridMenuExtension implements Extension {
  private _addon: any;
  private _areVisibleColumnDifferent = false;
  private _eventHandler: SlickEventHandler;
  private _locales: Locale;
  private _userOriginalGridMenu: GridMenu;

  constructor(
    private extensionUtility: ExtensionUtility,
    private filterService: FilterService,
    private sharedService: SharedService,
    private sortService: SortService,
    private translaterService: TranslaterService,
  ) {
    this._eventHandler = new Slick.EventHandler();
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  dispose() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
    if (this._addon && this._addon.destroy) {
      this._addon.destroy();
    }
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu && this.sharedService.gridOptions.gridMenu.customItems) {
      this.sharedService.gridOptions.gridMenu = this._userOriginalGridMenu;
    }
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance() {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): any {
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }

    if (this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu) {
      // keep original user grid menu, useful when switching locale to translate
      this._userOriginalGridMenu = { ...this.sharedService.gridOptions.gridMenu };

      // get locales provided by user in forRoot or else use default English locales via the Constants
      this._locales = this.sharedService.gridOptions && this.sharedService.gridOptions.locales || Constants.locales;

      // dynamically import the SlickGrid plugin (addon) with RequireJS
      this.extensionUtility.loadExtensionDynamically(ExtensionName.gridMenu);
      this.sharedService.gridOptions.gridMenu = { ...this.getDefaultGridMenuOptions(), ...this.sharedService.gridOptions.gridMenu };

      // merge original user grid menu items with internal items
      // then sort all Grid Menu Custom Items (sorted by pointer, no need to use the return)
      const originalCustomItems = this._userOriginalGridMenu && Array.isArray(this._userOriginalGridMenu.customItems) ? this._userOriginalGridMenu.customItems : [];
      this.sharedService.gridOptions.gridMenu.customItems = [...originalCustomItems, ...this.addGridMenuCustomCommands(originalCustomItems)];
      this.extensionUtility.translateItems(this.sharedService.gridOptions.gridMenu.customItems, 'titleKey', 'title');
      this.extensionUtility.sortItems(this.sharedService.gridOptions.gridMenu.customItems, 'positionOrder');

      this._addon = new Slick.Controls.GridMenu(this.sharedService.allColumns, this.sharedService.grid, this.sharedService.gridOptions);

      // hook all events
      if (this.sharedService.grid && this.sharedService.gridOptions.gridMenu) {
        if (this.sharedService.gridOptions.gridMenu.onExtensionRegistered) {
          this.sharedService.gridOptions.gridMenu.onExtensionRegistered(this._addon);
        }
        if (this.sharedService.gridOptions.gridMenu && typeof this.sharedService.gridOptions.gridMenu.onBeforeMenuShow === 'function') {
          this._eventHandler.subscribe(this._addon.onBeforeMenuShow, (e: any, args: { grid: SlickGrid; menu: any; columns: Column[] }) => {
            if (this.sharedService.gridOptions.gridMenu && this.sharedService.gridOptions.gridMenu.onBeforeMenuShow) {
              this.sharedService.gridOptions.gridMenu.onBeforeMenuShow(e, args);
            }
          });
        }
        if (this.sharedService.gridOptions.gridMenu && typeof this.sharedService.gridOptions.gridMenu.onAfterMenuShow === 'function') {
          this._eventHandler.subscribe(this._addon.onAfterMenuShow, (e: any, args: { grid: SlickGrid; menu: any; columns: Column[] }) => {
            if (this.sharedService.gridOptions.gridMenu && this.sharedService.gridOptions.gridMenu.onAfterMenuShow) {
              this.sharedService.gridOptions.gridMenu.onAfterMenuShow(e, args);
            }
          });
        }
        this._eventHandler.subscribe(this._addon.onColumnsChanged, (e: any, args: { grid: SlickGrid; allColumns: Column[]; columns: Column[]; }) => {
          this._areVisibleColumnDifferent = true;
          if (this.sharedService.gridOptions.gridMenu && typeof this.sharedService.gridOptions.gridMenu.onColumnsChanged === 'function') {
            this.sharedService.gridOptions.gridMenu.onColumnsChanged(e, args);
          }
          if (args && Array.isArray(args.columns) && args.columns.length > this.sharedService.visibleColumns.length) {
            this.sharedService.visibleColumns = args.columns;
          }
        });
        this._eventHandler.subscribe(this._addon.onCommand, (e: any, args: MenuCommandItemCallbackArgs) => {
          this.executeGridMenuInternalCustomCommands(e, args);
          if (this.sharedService.gridOptions.gridMenu && typeof this.sharedService.gridOptions.gridMenu.onCommand === 'function') {
            this.sharedService.gridOptions.gridMenu.onCommand(e, args);
          }
        });
        this._eventHandler.subscribe(this._addon.onMenuClose, (e: any, args: { grid: SlickGrid; menu: any; allColumns: Column[], visibleColumns: Column[] }) => {
          if (this.sharedService.gridOptions.gridMenu && typeof this.sharedService.gridOptions.gridMenu.onMenuClose === 'function') {
            this.sharedService.gridOptions.gridMenu.onMenuClose(e, args);
          }

          // we also want to resize the columns if the user decided to hide certain column(s)
          if (this.sharedService.grid && typeof this.sharedService.grid.autosizeColumns === 'function') {
            // make sure that the grid still exist (by looking if the Grid UID is found in the DOM tree)
            const gridUid = this.sharedService.grid.getUID();
            if (this._areVisibleColumnDifferent && gridUid && $(`.${gridUid}`).length > 0) {
              if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableAutoSizeColumns) {
                this.sharedService.grid.autosizeColumns();
              }
              this._areVisibleColumnDifferent = false;
            }
          }
        });
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
    refreshBackendDataset(this.sharedService.gridOptions);
  }

  showGridMenu(e: Event) {
    this._addon.showGridMenu(e);
  }

  /** Translate the Grid Menu titles and column picker */
  translateGridMenu() {
    // update the properties by pointers, that is the only way to get Grid Menu Control to see the new values
    // we also need to call the control init so that it takes the new Grid object with latest values
    if (this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu) {
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
      if (this._addon && this._addon.updateAllTitles) {
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

    if (this.sharedService.gridOptions && (this.sharedService.gridOptions.enableFiltering && !this.sharedService.hideHeaderRowAfterPageLoad)) {
      // show grid menu: Clear all Filters
      if (this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu && !this.sharedService.gridOptions.gridMenu.hideClearAllFiltersCommand) {
        const commandName = 'clear-filter';
        if (!originalCustomItems.find((item: GridMenuItem) => item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.sharedService.gridOptions.gridMenu.iconClearAllFiltersCommand || 'fa fa-filter text-danger',
              title: this.sharedService.gridOptions.enableTranslate ? this.translaterService.translate(`${translationPrefix}CLEAR_ALL_FILTERS`) : this._locales && this._locales.TEXT_CLEAR_ALL_FILTERS,
              disabled: false,
              command: commandName,
              positionOrder: 50
            }
          );
        }
      }

      // show grid menu: toggle filter row
      if (this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu && !this.sharedService.gridOptions.gridMenu.hideToggleFilterCommand) {
        const commandName = 'toggle-filter';
        if (!originalCustomItems.find((item: GridMenuItem) => item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.sharedService.gridOptions.gridMenu.iconToggleFilterCommand || 'fa fa-random',
              title: this.sharedService.gridOptions.enableTranslate ? this.translaterService.translate(`${translationPrefix}TOGGLE_FILTER_ROW`) : this._locales && this._locales.TEXT_TOGGLE_FILTER_ROW,
              disabled: false,
              command: commandName,
              positionOrder: 52
            }
          );
        }
      }

      // show grid menu: refresh dataset
      if (backendApi && this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu && !this.sharedService.gridOptions.gridMenu.hideRefreshDatasetCommand) {
        const commandName = 'refresh-dataset';
        if (!originalCustomItems.find((item: GridMenuItem) => item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.sharedService.gridOptions.gridMenu.iconRefreshDatasetCommand || 'fa fa-refresh',
              title: this.sharedService.gridOptions.enableTranslate ? this.translaterService.translate(`${translationPrefix}REFRESH_DATASET`) : this._locales && this._locales.TEXT_REFRESH_DATASET,
              disabled: false,
              command: commandName,
              positionOrder: 56
            }
          );
        }
      }
    }

    if (this.sharedService.gridOptions.showPreHeaderPanel) {
      // show grid menu: toggle pre-header row
      if (this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu && !this.sharedService.gridOptions.gridMenu.hideTogglePreHeaderCommand) {
        const commandName = 'toggle-preheader';
        if (!originalCustomItems.find((item: GridMenuItem) => item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.sharedService.gridOptions.gridMenu.iconTogglePreHeaderCommand || 'fa fa-random',
              title: this.sharedService.gridOptions.enableTranslate ? this.translaterService.translate(`${translationPrefix}TOGGLE_PRE_HEADER_ROW`) : this._locales && this._locales.TEXT_TOGGLE_PRE_HEADER_ROW,
              disabled: false,
              command: commandName,
              positionOrder: 52
            }
          );
        }
      }
    }

    if (this.sharedService.gridOptions.enableSorting) {
      // show grid menu: Clear all Sorting
      if (this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu && !this.sharedService.gridOptions.gridMenu.hideClearAllSortingCommand) {
        const commandName = 'clear-sorting';
        if (!originalCustomItems.find((item: GridMenuItem) => item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.sharedService.gridOptions.gridMenu.iconClearAllSortingCommand || 'fa fa-unsorted text-danger',
              title: this.sharedService.gridOptions.enableTranslate ? this.translaterService.translate(`${translationPrefix}CLEAR_ALL_SORTING`) : this._locales && this._locales.TEXT_CLEAR_ALL_SORTING,
              disabled: false,
              command: commandName,
              positionOrder: 51
            }
          );
        }
      }
    }

    // show grid menu: Export to file
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableExport && this.sharedService.gridOptions.gridMenu && !this.sharedService.gridOptions.gridMenu.hideExportCsvCommand) {
      const commandName = 'export-csv';
      if (!originalCustomItems.find((item: GridMenuItem) => item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.sharedService.gridOptions.gridMenu.iconExportCsvCommand || 'fa fa-download',
            title: this.sharedService.gridOptions.enableTranslate ? this.translaterService.translate(`${translationPrefix}EXPORT_TO_CSV`) : this._locales && this._locales.TEXT_EXPORT_TO_CSV,
            disabled: false,
            command: commandName,
            positionOrder: 53
          }
        );
      }
    }

    // show grid menu: Export to Excel
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableExcelExport && this.sharedService.gridOptions.gridMenu && !this.sharedService.gridOptions.gridMenu.hideExportExcelCommand) {
      const commandName = 'export-excel';
      if (!originalCustomItems.find((item: GridMenuItem) => item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.sharedService.gridOptions.gridMenu.iconExportExcelCommand || 'fa fa-file-excel-o text-success',
            title: this.sharedService.gridOptions.enableTranslate ? this.translaterService.translate(`${translationPrefix}EXPORT_TO_EXCEL`) : this._locales && this._locales.TEXT_EXPORT_TO_EXCEL,
            disabled: false,
            command: commandName,
            positionOrder: 54
          }
        );
      }
    }

    // show grid menu: export to text file as tab delimited
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableExport && this.sharedService.gridOptions.gridMenu && !this.sharedService.gridOptions.gridMenu.hideExportTextDelimitedCommand) {
      const commandName = 'export-text-delimited';
      if (!originalCustomItems.find((item: GridMenuItem) => item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.sharedService.gridOptions.gridMenu.iconExportTextDelimitedCommand || 'fa fa-download',
            title: this.sharedService.gridOptions.enableTranslate ? this.translaterService.translate(`${translationPrefix}EXPORT_TO_TAB_DELIMITED`) : this._locales && this._locales.TEXT_EXPORT_TO_TAB_DELIMITED,
            disabled: false,
            command: commandName,
            positionOrder: 55
          }
        );
      }
    }

    // add the custom "Commands" title if there are any commands
    if (this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu && (Array.isArray(gridMenuCustomItems) && gridMenuCustomItems.length > 0 || (Array.isArray(this.sharedService.gridOptions.gridMenu.customItems) && this.sharedService.gridOptions.gridMenu.customItems.length > 0))) {
      this.sharedService.gridOptions.gridMenu.customTitle = this.sharedService.gridOptions.gridMenu.customTitle || this.extensionUtility.getPickerTitleOutputString('customTitle', 'gridMenu');
    }

    return gridMenuCustomItems;
  }

  /**
   * Execute the Grid Menu Custom command callback that was triggered by the onCommand subscribe
   * These are the default internal custom commands
   * @param event
   * @param GridMenuItem args
   */
  private executeGridMenuInternalCustomCommands(e: Event, args: GridMenuItem) {
    const registedServices = this.sharedService?.externalRegisteredServices || [];

    if (args && args.command) {
      switch (args.command) {
        case 'clear-filter':
          this.filterService.clearFilters();
          this.sharedService.dataView.refresh();
          break;
        case 'clear-sorting':
          this.sortService.clearSorting();
          this.sharedService.dataView.refresh();
          break;
        case 'export-csv':
          const exportCsvService: FileExportService = registedServices.find((service: any) => service.className === 'FileExportService');
          if (exportCsvService?.exportToFile) {
            exportCsvService.exportToFile({
              delimiter: DelimiterType.comma,
              filename: 'export',
              format: FileType.csv,
              useUtf8WithBom: true,
            });
          } else {
            throw new Error(`[Slickgrid-Universal] You must register the FileExportService to properly use Export to File in the Grid Menu. Example:: this.gridOptions = { enableExport: true, registerExternalServices: [new FileExportService()] };`);
          }
          break;
        case 'export-excel':
          const excelService: ExcelExportService = registedServices.find((service: any) => service.className === 'ExcelExportService');
          if (excelService?.exportToExcel) {
            excelService.exportToExcel({
              filename: 'export',
              format: FileType.xlsx,
            });
          } else {
            throw new Error(`[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Grid Menu. Example:: this.gridOptions = { enableExcelExport: true, registerExternalServices: [new ExcelExportService()] };`);
          }
          break;
        case 'export-text-delimited':
          const exportTxtService: FileExportService = registedServices.find((service: any) => service.className === 'FileExportService');
          if (exportTxtService?.exportToFile) {
            exportTxtService.exportToFile({
              delimiter: DelimiterType.tab,
              filename: 'export',
              format: FileType.txt,
              useUtf8WithBom: true,
            });
          } else {
            throw new Error(`[Slickgrid-Universal] You must register the FileExportService to properly use Export to File in the Grid Menu. Example:: this.gridOptions = { enableExport: true, registerExternalServices: [new FileExportService()] };`);
          }
          break;
        case 'toggle-filter':
          const showHeaderRow = this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.showHeaderRow || false;
          this.sharedService.grid.setHeaderRowVisibility(!showHeaderRow);
          break;
        case 'toggle-toppanel':
          const showTopPanel = this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.showTopPanel || false;
          this.sharedService.grid.setTopPanelVisibility(!showTopPanel);
          break;
        case 'toggle-preheader':
          const showPreHeaderPanel = this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.showPreHeaderPanel || false;
          this.sharedService.grid.setPreHeaderPanelVisibility(!showPreHeaderPanel);
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
    if (this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.gridMenu) {
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
