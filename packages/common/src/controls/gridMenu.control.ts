import {
  Column,
  DOMEvent,
  GetSlickEventType,
  GridMenu,
  GridMenuCommandItemCallbackArgs,
  GridMenuEventWithElementCallbackArgs,
  GridMenuItem,
  GridMenuOption,
  MenuCommandItem,
  MenuOptionItem,
  SlickEventHandler,
} from '../interfaces/index';
import { DelimiterType, FileType } from '../enums';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { emptyElement, getHtmlElementOffset, getTranslationPrefix, } from '../services';
import { ExcelExportService } from '../services/excelExport.service';
import { FilterService } from '../services/filter.service';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';
import { SortService } from '../services/sort.service';
import { TextExportService } from '../services/textExport.service';
import { handleColumnPickerItemClick, populateColumnPicker, updateColumnPickerOrder } from '../extensions/extensionCommonUtils';
import { ExtractMenuType, MenuBaseClass, MenuType } from '../plugins/menuBaseClass';

/**
 * A control to add a Grid Menu with Extra Commands & Column Picker (hambuger menu on top-right of the grid)
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.gridOptions = {
 *     enableGridMenu: true,
 *     gridMenu: {
 *       ... grid menu options ...
 *       customItems: [{ ...command... }, { ...command... }]
 *     }
 *   }];
 * @class GridMenuControl
 * @constructor
 */
export class GridMenuControl extends MenuBaseClass<GridMenu> {
  protected _areVisibleColumnDifferent = false;
  protected _columns: Column[] = [];
  protected _columnCheckboxes: HTMLInputElement[] = [];
  protected _columnTitleElm!: HTMLDivElement;
  protected _commandMenuElm!: HTMLDivElement;
  protected _gridMenuButtonElm!: HTMLButtonElement;
  protected _isMenuOpen = false;
  protected _listElm!: HTMLSpanElement;
  protected _userOriginalGridMenu!: GridMenu;

  protected _defaults = {
    alignDropSide: 'right',
    showButton: true,
    hideForceFitButton: false,
    hideSyncResizeButton: false,
    forceFitTitle: 'Force fit columns',
    marginBottom: 15,
    menuWidth: 18,
    contentMinWidth: 0,
    resizeOnShowHeaderRow: false,
    syncResizeTitle: 'Synchronous resize',
    headerColumnValueExtractor: (columnDef: Column) => columnDef.name
  } as GridMenuOption;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly filterService: FilterService,
    protected readonly pubSubService: PubSubService,
    protected readonly sharedService: SharedService,
    protected readonly sortService: SortService,
  ) {
    super(extensionUtility, pubSubService, sharedService);
    this._menuCssPrefix = 'slick-grid-menu';
    this._camelPluginName = 'gridMenu';
    this._columns = this.sharedService.allColumns ?? [];
    this._gridUid = this.grid?.getUID?.() ?? '';

    this.initEventHandlers();
    this.init();
  }

  get addonOptions(): GridMenu {
    return this.gridOptions.gridMenu || {};
  }
  set addonOptions(newOptions: GridMenu) {
    this.sharedService.gridOptions.gridMenu = newOptions;
  }

  get columns(): Column[] {
    return this._columns;
  }
  set columns(newColumns: Column[]) {
    this._columns = newColumns;
  }

  initEventHandlers() {
    // when grid columns are reordered then we also need to update/resync our picker column in the same order
    const onColumnsReorderedHandler = this.grid.onColumnsReordered;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onColumnsReorderedHandler>>).subscribe(onColumnsReorderedHandler, updateColumnPickerOrder.bind(this));

    // subscribe to the grid, when it's destroyed, we should also destroy the Grid Menu
    const onBeforeDestroyHandler = this.grid.onBeforeDestroy;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeDestroyHandler>>).subscribe(onBeforeDestroyHandler, this.dispose.bind(this));

    // when a grid optionally changes from a regular grid to a frozen grid, we need to destroy & recreate the grid menu
    // we do this change because the Grid Menu is on the left container for a regular grid, it should however be displayed on the right container for a frozen grid
    const onSetOptionsHandler = this.grid.onSetOptions;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onSetOptionsHandler>>).subscribe(onSetOptionsHandler, (_e, args) => {
      if (args && args.optionsBefore && args.optionsAfter) {
        this.sharedService.gridOptions = args.optionsAfter;
        const switchedFromRegularToFrozen = (args.optionsBefore.frozenColumn! >= 0 && args.optionsAfter.frozenColumn === -1);
        const switchedFromFrozenToRegular = (args.optionsBefore.frozenColumn === -1 && args.optionsAfter.frozenColumn! >= 0);
        if (switchedFromRegularToFrozen || switchedFromFrozenToRegular) {
          this.recreateGridMenu();
        }
      }
    });
  }

  /** Initialize plugin. */
  init() {
    this._gridUid = this.grid.getUID() ?? '';

    // keep original user grid menu, useful when switching locale to translate
    this._userOriginalGridMenu = { ...this.addonOptions };
    this.addonOptions = { ...this._defaults, ...this.getDefaultGridMenuOptions(), ...this.addonOptions };

    // merge original user grid menu items with internal items
    // then sort all Grid Menu Custom Items (sorted by pointer, no need to use the return)
    const originalCustomItems = this._userOriginalGridMenu && Array.isArray(this._userOriginalGridMenu.customItems) ? this._userOriginalGridMenu.customItems : [];
    this.addonOptions.customItems = [...originalCustomItems, ...this.addGridMenuCustomCommands(originalCustomItems)];
    this.extensionUtility.translateItems(this.addonOptions.customItems, 'titleKey', 'title');
    this.extensionUtility.sortItems(this.addonOptions.customItems, 'positionOrder');

    // create the Grid Menu DOM element
    this.createGridMenu();
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose() {
    this.deleteMenu();
    super.dispose();
  }

  deleteMenu() {
    this._bindEventService.unbindAll();
    const gridMenuElm = document.querySelector<HTMLDivElement>(`div.slick-grid-menu.${this._gridUid}`);
    if (gridMenuElm) {
      gridMenuElm.style.display = 'none';
    }
    this._gridMenuButtonElm?.remove();
    this._menuElm?.remove();
    this._commandMenuElm?.remove();
  }

  createColumnPickerContainer() {
    if (this._menuElm) {
      // user could pass a title on top of the columns list
      if (this.addonOptions?.columnTitle) {
        this._columnTitleElm = document.createElement('div');
        this._columnTitleElm.className = 'title';
        this._columnTitleElm.textContent = this.addonOptions?.columnTitle ?? this._defaults.columnTitle;
        this._menuElm.appendChild(this._columnTitleElm);
      }

      this._listElm = document.createElement('span');
      this._listElm.className = 'slick-grid-menu-list';

      // update all columns on any of the column title button click from column picker
      this._bindEventService.bind(this._menuElm, 'click', handleColumnPickerItemClick.bind(this) as EventListener);
    }
  }

  createGridMenu() {
    this._gridUid = this._gridUid ?? this.grid.getUID() ?? '';
    const gridUidSelector = this._gridUid ? `.${this._gridUid}` : '';
    const gridMenuWidth = this.addonOptions?.menuWidth ?? this._defaults.menuWidth;
    const headerSide = (this.gridOptions.hasOwnProperty('frozenColumn') && this.gridOptions.frozenColumn! >= 0) ? 'right' : 'left';
    this._menuElm = document.querySelector(`${gridUidSelector} .slick-header-${headerSide}`) as HTMLDivElement;

    if (this._menuElm) {
      // resize the header row to include the hamburger menu icon
      this._menuElm.style.width = `calc(100% - ${gridMenuWidth}px)`;

      // if header row is enabled, we also need to resize its width
      const enableResizeHeaderRow = (this.addonOptions && this.addonOptions.resizeOnShowHeaderRow !== undefined) ? this.addonOptions.resizeOnShowHeaderRow : this._defaults.resizeOnShowHeaderRow;
      if (enableResizeHeaderRow && this.gridOptions.showHeaderRow) {
        const headerRowElm = document.querySelector<HTMLDivElement>(`${gridUidSelector} .slick-headerrow`);
        if (headerRowElm) {
          headerRowElm.style.width = `calc(100% - ${gridMenuWidth}px)`;
        }
      }

      const showButton = (this.addonOptions?.showButton !== undefined) ? this.addonOptions.showButton : this._defaults.showButton;
      if (showButton) {
        this._gridMenuButtonElm = document.createElement('button');
        this._gridMenuButtonElm.className = 'slick-grid-menu-button';
        if (this.addonOptions && this.addonOptions.iconCssClass) {
          this._gridMenuButtonElm.classList.add(...this.addonOptions.iconCssClass.split(' '));
        } else {
          const iconImage = (this.addonOptions && this.addonOptions.iconImage) ? this.addonOptions.iconImage : '';
          const iconImageElm = document.createElement('img');
          iconImageElm.src = iconImage;
          this._gridMenuButtonElm.appendChild(iconImageElm);
        }
        this._menuElm.parentNode?.prepend(this._gridMenuButtonElm);

        // show the Grid Menu when hamburger menu is clicked
        this.addonOptions.commandTitle = this.addonOptions.customTitle || this.addonOptions.commandTitle;
        this._bindEventService.bind(this._gridMenuButtonElm, 'click', this.showGridMenu.bind(this) as EventListener);
      }

      this.gridOptions.gridMenu = { ...this._defaults, ...this.addonOptions };

      // localization support for the picker
      this.translateTitleLabels();

      this._menuElm = document.createElement('div');
      this._menuElm.classList.add('slick-grid-menu', this._gridUid);
      this._menuElm.style.display = 'none';

      const closePickerButtonElm = document.createElement('button');
      closePickerButtonElm.className = 'close';
      closePickerButtonElm.type = 'button';
      closePickerButtonElm.dataset.dismiss = 'slick-grid-menu';
      closePickerButtonElm.setAttribute('aria-label', 'Close');

      const closeSpanElm = document.createElement('span');
      closeSpanElm.className = 'close';
      closeSpanElm.innerHTML = '&times;';
      closeSpanElm.setAttribute('aria-hidden', 'true');

      this._commandMenuElm = document.createElement('div');
      this._commandMenuElm.className = 'slick-grid-menu-command-list';

      closePickerButtonElm.appendChild(closeSpanElm);
      this._menuElm.appendChild(closePickerButtonElm);
      this._menuElm.appendChild(this._commandMenuElm);

      this.populateCommandOrOptionItems(
        'command',
        this.addonOptions,
        this._commandMenuElm,
        this.addonOptions?.customItems || [] as any[],
        {
          grid: this.grid,
          menu: this._menuElm,
          columns: this.columns,
          allColumns: this.getAllColumns(),
          visibleColumns: this.getVisibleColumns()
        } as GridMenuEventWithElementCallbackArgs,
        this.handleMenuItemCommandClick,
      );
      this.createColumnPickerContainer();

      document.body.appendChild(this._menuElm);

      // hide the menu on outside click.
      this._bindEventService.bind(document.body, 'mousedown', this.handleBodyMouseDown.bind(this) as EventListener);

      // destroy the picker if user leaves the page
      this._bindEventService.bind(document.body, 'beforeunload', this.dispose.bind(this) as EventListener);
    }
  }

  /**
   * Get all columns including hidden columns.
   * @returns {Array<Object>} - all columns array
   */
  getAllColumns() {
    return this._columns;
  }

  /**
   * Get only the visible columns.
   * @returns {Array<Object>} - only the visible columns array
   */
  getVisibleColumns() {
    return this.grid.getColumns();
  }

  /**
   * Hide the Grid Menu but only if it does detect as open prior to executing anything.
   * @param event
   * @returns
   */
  hideMenu(event: Event) {
    if (this._menuElm?.style?.display === 'block') {
      const callbackArgs = {
        grid: this.grid,
        menu: this._menuElm,
        allColumns: this.columns,
        visibleColumns: this.getVisibleColumns()
      } as GridMenuEventWithElementCallbackArgs;

      // execute optional callback method defined by the user, if it returns false then we won't go further neither close the menu
      this.pubSubService.publish('gridMenu:onMenuClose', callbackArgs);
      if (typeof this.addonOptions?.onMenuClose === 'function' && this.addonOptions.onMenuClose(event, callbackArgs) === false) {
        return;
      }

      this._menuElm.style.display = 'none';
      this._isMenuOpen = false;

      // we also want to resize the columns if the user decided to hide certain column(s)
      if (typeof this.grid?.autosizeColumns === 'function') {
        // make sure that the grid still exist (by looking if the Grid UID is found in the DOM tree)
        const gridUid = this.grid.getUID() || '';
        if (this._areVisibleColumnDifferent && gridUid && document.querySelector(`.${gridUid}`) !== null) {
          if (this.gridOptions.enableAutoSizeColumns) {
            this.grid.autosizeColumns();
          }
          this._areVisibleColumnDifferent = false;
        }
      }
    }
  }

  recreateGridMenu() {
    this.deleteMenu();
    this.init();
  }

  repositionMenu(e: MouseEvent, addonOptions: GridMenu) {
    if (this._menuElm) {
      let buttonElm = (e.target as HTMLButtonElement).nodeName === 'BUTTON' ? (e.target as HTMLButtonElement) : (e.target as HTMLElement).querySelector('button') as HTMLButtonElement; // get button element
      if (!buttonElm) {
        buttonElm = (e.target as HTMLElement).parentElement as HTMLButtonElement; // external grid menu might fall in this last case if wrapped in a span/div
      }

      this._menuElm.style.display = 'block';
      const menuIconOffset = getHtmlElementOffset(buttonElm as HTMLButtonElement);
      const buttonComptStyle = getComputedStyle(buttonElm as HTMLButtonElement);
      const buttonWidth = parseInt(buttonComptStyle?.width ?? this._defaults?.menuWidth, 10);

      const menuWidth = this._menuElm?.offsetWidth ?? 0;
      const contentMinWidth = addonOptions?.contentMinWidth ?? this._defaults.contentMinWidth ?? 0;
      const currentMenuWidth = ((contentMinWidth > menuWidth) ? contentMinWidth : (menuWidth)) || 0;
      const nextPositionTop = menuIconOffset?.bottom ?? 0;
      const nextPositionLeft = menuIconOffset?.right ?? 0;
      const menuMarginBottom = ((addonOptions?.marginBottom !== undefined) ? addonOptions.marginBottom : this._defaults.marginBottom) || 0;
      const calculatedLeftPosition = addonOptions?.alignDropSide === 'left' ? nextPositionLeft - buttonWidth : nextPositionLeft - currentMenuWidth;

      this._menuElm.style.top = `${nextPositionTop}px`;
      this._menuElm.style.left = `${calculatedLeftPosition}px`;
      this._menuElm.classList.add(addonOptions?.alignDropSide === 'left' ? 'dropleft' : 'dropright');
      this._menuElm.appendChild(this._listElm);

      if (contentMinWidth! > 0) {
        this._menuElm.style.minWidth = `${contentMinWidth}px`;
      }

      // set 'height' when defined OR ELSE use the 'max-height' with available window size and optional margin bottom
      if (addonOptions?.height !== undefined) {
        this._menuElm.style.height = `${addonOptions.height}px`;
      } else {
        this._menuElm.style.maxHeight = `${window.innerHeight - e.clientY - menuMarginBottom}px`;
      }

      this._menuElm.style.display = 'block';
      this._menuElm.appendChild(this._listElm);
      this._isMenuOpen = true;
    }
  }

  showGridMenu(e: MouseEvent, options?: GridMenuOption) {
    e.preventDefault();

    // empty both the picker list & the command list
    emptyElement(this._listElm);
    emptyElement(this._commandMenuElm);

    const callbackArgs = {
      grid: this.grid,
      menu: this._menuElm,
      columns: this.columns,
      allColumns: this.getAllColumns(),
      visibleColumns: this.getVisibleColumns()
    } as GridMenuEventWithElementCallbackArgs;

    const addonOptions: GridMenu = { ...this.addonOptions, ...options }; // merge optional picker option
    addonOptions.customTitle = addonOptions.commandTitle;

    this.populateCommandOrOptionItems(
      'command',
      this.addonOptions,
      this._commandMenuElm,
      addonOptions?.customItems || [] as any[],
      callbackArgs,
      this.handleMenuItemCommandClick ,
    );

    updateColumnPickerOrder.call(this);
    this._columnCheckboxes = [];

    // run the override function (when defined), if the result is false then we won't go further
    if (addonOptions && !this.extensionUtility.runOverrideFunctionWhenExists<typeof callbackArgs>(addonOptions.menuUsabilityOverride, callbackArgs)) {
      return;
    }

    // execute optional callback method defined by the user, if it returns false then we won't go further and not open the grid menu
    if (typeof e.stopPropagation === 'function') {
      this.pubSubService.publish('gridMenu:onBeforeMenuShow', callbackArgs);
      if (typeof addonOptions?.onBeforeMenuShow === 'function' && addonOptions.onBeforeMenuShow(e, callbackArgs) === false) {
        return;
      }
    }

    // load the column & create column picker list
    populateColumnPicker.call(this, addonOptions);
    this.repositionMenu(e, addonOptions);

    // execute optional callback method defined by the user
    this.pubSubService.publish('gridMenu:onAfterMenuShow', callbackArgs);
    if (typeof addonOptions?.onAfterMenuShow === 'function') {
      addonOptions.onAfterMenuShow(e, callbackArgs);
    }
  }

  /** Update the Titles of each sections (command, commandTitle, ...) */
  updateAllTitles(options: GridMenuOption) {
    if (this._commandTitleElm?.textContent && (options.customTitle || options.commandTitle)) {
      this._commandTitleElm.textContent = (options.customTitle || options.commandTitle) as string;
    }
    if (this._columnTitleElm?.textContent && options.columnTitle) {
      this._columnTitleElm.textContent = options.columnTitle;
    }
  }

  /** Translate the Grid Menu titles and column picker */
  translateGridMenu() {
    // update the properties by pointers, that is the only way to get Grid Menu Control to see the new values
    // we also need to call the control init so that it takes the new Grid object with latest values
    if (this.addonOptions) {
      this.addonOptions.customItems = [];
      this.addonOptions.commandTitle = '';
      this.addonOptions.customTitle = '';
      this.addonOptions.columnTitle = '';
      this.addonOptions.forceFitTitle = '';
      this.addonOptions.syncResizeTitle = '';

      // merge original user grid menu items with internal items
      // then sort all Grid Menu Custom Items (sorted by pointer, no need to use the return)
      const originalCustomItems = this._userOriginalGridMenu && Array.isArray(this._userOriginalGridMenu.customItems) ? this._userOriginalGridMenu.customItems : [];
      this.addonOptions.customItems = [...originalCustomItems, ...this.addGridMenuCustomCommands(originalCustomItems)];
      this.extensionUtility.translateItems(this.addonOptions.customItems, 'titleKey', 'title');
      this.extensionUtility.sortItems(this.addonOptions.customItems, 'positionOrder');
      this.translateTitleLabels();

      // translate all columns (including non-visible)
      this.extensionUtility.translateItems(this._columns, 'nameKey', 'name');

      // update the Titles of each sections (command, commandTitle, ...)
      this.updateAllTitles(this.addonOptions);
    }
  }

  translateTitleLabels() {
    this.addonOptions.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'gridMenu');
    this.addonOptions.forceFitTitle = this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'gridMenu');
    this.addonOptions.syncResizeTitle = this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'gridMenu');
  }

  // --
  // protected functions
  // ------------------

  /** Create Grid Menu with Custom Commands if user has enabled Filters and/or uses a Backend Service (OData, GraphQL) */
  protected addGridMenuCustomCommands(originalCustomItems: Array<GridMenuItem | 'divider'>) {
    const backendApi = this.gridOptions.backendServiceApi || null;
    const gridMenuCustomItems: Array<GridMenuItem | 'divider'> = [];
    const gridOptions = this.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);
    const commandLabels = this.addonOptions?.commandLabels;

    // show grid menu: Unfreeze Columns/Rows
    if (this.gridOptions && this.addonOptions && !this.addonOptions.hideClearFrozenColumnsCommand) {
      const commandName = 'clear-pinning';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.addonOptions.iconClearFrozenColumnsCommand || 'fa fa-times',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.clearFrozenColumnsCommandKey}`, 'TEXT_CLEAR_PINNING', commandLabels?.clearFrozenColumnsCommand),
            disabled: false,
            command: commandName,
            positionOrder: 52
          }
        );
      }
    }

    if (this.gridOptions && (this.gridOptions.enableFiltering && !this.sharedService.hideHeaderRowAfterPageLoad)) {
      // show grid menu: Clear all Filters
      if (this.gridOptions && this.addonOptions && !this.addonOptions.hideClearAllFiltersCommand) {
        const commandName = 'clear-filter';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.addonOptions.iconClearAllFiltersCommand || 'fa fa-filter text-danger',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.clearAllFiltersCommandKey}`, 'TEXT_CLEAR_ALL_FILTERS', commandLabels?.clearAllFiltersCommand),
              disabled: false,
              command: commandName,
              positionOrder: 50
            }
          );
        }
      }

      // show grid menu: toggle filter row
      if (this.gridOptions && this.addonOptions && !this.addonOptions.hideToggleFilterCommand) {
        const commandName = 'toggle-filter';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.addonOptions.iconToggleFilterCommand || 'fa fa-random',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.toggleFilterCommandKey}`, 'TEXT_TOGGLE_FILTER_ROW', commandLabels?.toggleFilterCommand),
              disabled: false,
              command: commandName,
              positionOrder: 53
            }
          );
        }
      }

      // show grid menu: refresh dataset
      if (backendApi && this.gridOptions && this.addonOptions && !this.addonOptions.hideRefreshDatasetCommand) {
        const commandName = 'refresh-dataset';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.addonOptions.iconRefreshDatasetCommand || 'fa fa-refresh',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.refreshDatasetCommandKey}`, 'TEXT_REFRESH_DATASET', commandLabels?.refreshDatasetCommand),
              disabled: false,
              command: commandName,
              positionOrder: 57
            }
          );
        }
      }
    }

    if (this.gridOptions.showPreHeaderPanel) {
      // show grid menu: toggle pre-header row
      if (this.gridOptions && this.addonOptions && !this.addonOptions.hideTogglePreHeaderCommand) {
        const commandName = 'toggle-preheader';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.addonOptions.iconTogglePreHeaderCommand || 'fa fa-random',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.togglePreHeaderCommandKey}`, 'TEXT_TOGGLE_PRE_HEADER_ROW', commandLabels?.togglePreHeaderCommand),
              disabled: false,
              command: commandName,
              positionOrder: 53
            }
          );
        }
      }
    }

    if (this.gridOptions.enableSorting) {
      // show grid menu: Clear all Sorting
      if (this.gridOptions && this.addonOptions && !this.addonOptions.hideClearAllSortingCommand) {
        const commandName = 'clear-sorting';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.addonOptions.iconClearAllSortingCommand || 'fa fa-unsorted text-danger',
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
    if ((this.gridOptions?.enableExport || this.gridOptions?.enableTextExport) && this.addonOptions && !this.addonOptions.hideExportCsvCommand) {
      const commandName = 'export-csv';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.addonOptions.iconExportCsvCommand || 'fa fa-download',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.exportCsvCommandKey}`, 'TEXT_EXPORT_TO_CSV', commandLabels?.exportCsvCommand),
            disabled: false,
            command: commandName,
            positionOrder: 54
          }
        );
      }
    }

    // show grid menu: Export to Excel
    if (this.gridOptions && this.gridOptions.enableExcelExport && this.addonOptions && !this.addonOptions.hideExportExcelCommand) {
      const commandName = 'export-excel';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.addonOptions.iconExportExcelCommand || 'fa fa-file-excel-o text-success',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.exportExcelCommandKey}`, 'TEXT_EXPORT_TO_EXCEL', commandLabels?.exportExcelCommand),
            disabled: false,
            command: commandName,
            positionOrder: 55
          }
        );
      }
    }

    // show grid menu: export to text file as tab delimited
    if ((this.gridOptions?.enableExport || this.gridOptions?.enableTextExport) && this.addonOptions && !this.addonOptions.hideExportTextDelimitedCommand) {
      const commandName = 'export-text-delimited';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.addonOptions.iconExportTextDelimitedCommand || 'fa fa-download',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.exportTextDelimitedCommandKey}`, 'TEXT_EXPORT_TO_TAB_DELIMITED', commandLabels?.exportTextDelimitedCommand),
            disabled: false,
            command: commandName,
            positionOrder: 56
          }
        );
      }
    }

    // add the custom "Commands" title if there are any commands
    if (this.gridOptions && this.addonOptions && (Array.isArray(gridMenuCustomItems) && gridMenuCustomItems.length > 0 || (Array.isArray(this.addonOptions.customItems) && this.addonOptions.customItems.length > 0))) {
      if (this.addonOptions?.customTitleKey) {
        this.addonOptions.customTitle = this.addonOptions.customTitle || this.extensionUtility.getPickerTitleOutputString('customTitle', 'gridMenu');
      }
      this.addonOptions.commandTitle = this.addonOptions.customTitle || this.addonOptions.commandTitle || this.extensionUtility.getPickerTitleOutputString('commandTitle', 'gridMenu');
    }

    return gridMenuCustomItems;
  }

  /**
   * Execute the Grid Menu Custom command callback that was triggered by the onCommand subscribe
   * These are the default internal custom commands
   * @param event
   * @param GridMenuItem args
   */
  protected executeGridMenuInternalCustomCommands(_e: Event, args: GridMenuItem) {
    const registeredResources = this.sharedService?.externalRegisteredResources || [];

    if (args?.command) {
      switch (args.command) {
        case 'clear-pinning':
          const visibleColumns = [...this.sharedService.visibleColumns];
          const newGridOptions = { frozenColumn: -1, frozenRow: -1, frozenBottom: false, enableMouseWheelScrollHandler: false };
          this.grid.setOptions(newGridOptions);
          this.gridOptions.frozenColumn = newGridOptions.frozenColumn;
          this.gridOptions.frozenRow = newGridOptions.frozenRow;
          this.gridOptions.frozenBottom = newGridOptions.frozenBottom;
          this.gridOptions.enableMouseWheelScrollHandler = newGridOptions.enableMouseWheelScrollHandler;

          // SlickGrid seems to be somehow resetting the columns to their original positions,
          // so let's re-fix them to the position we kept as reference
          if (Array.isArray(visibleColumns)) {
            this.grid.setColumns(visibleColumns);
          }

          // we also need to autosize columns if the option is enabled
          const gridOptions = this.gridOptions;
          if (gridOptions.enableAutoSizeColumns) {
            this.grid.autosizeColumns();
          }
          break;
        case 'clear-filter':
          this.filterService.clearFilters();
          this.sharedService.dataView.refresh();
          break;
        case 'clear-sorting':
          this.sortService.clearSorting();
          this.sharedService.dataView.refresh();
          break;
        case 'export-csv':
          const exportCsvService: TextExportService = registeredResources.find((service: any) => service.className === 'TextExportService');
          if (exportCsvService?.exportToFile) {
            exportCsvService.exportToFile({
              delimiter: DelimiterType.comma,
              format: FileType.csv,
            });
          } else {
            console.error(`[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu. Example:: this.gridOptions = { enableTextExport: true, registerExternalResources: [new TextExportService()] };`);
          }
          break;
        case 'export-excel':
          const excelService: ExcelExportService = registeredResources.find((service: any) => service.className === 'ExcelExportService');
          if (excelService?.exportToExcel) {
            excelService.exportToExcel();
          } else {
            console.error(`[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Grid Menu. Example:: this.gridOptions = { enableExcelExport: true, registerExternalResources: [new ExcelExportService()] };`);
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
            console.error(`[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu. Example:: this.gridOptions = { enableTextExport: true, registerExternalResources: [new TextExportService()] };`);
          }
          break;
        case 'toggle-filter':
          let showHeaderRow = this.gridOptions?.showHeaderRow ?? false;
          showHeaderRow = !showHeaderRow; // inverse show header flag
          this.grid.setHeaderRowVisibility(showHeaderRow);

          // when displaying header row, we'll call "setColumns" which in terms will recreate the header row filters
          if (showHeaderRow === true) {
            this.grid.setColumns(this.sharedService.columnDefinitions);
            this.grid.scrollColumnIntoView(0); // quick fix to avoid filter being out of sync with horizontal scroll
          }
          break;
        case 'toggle-preheader':
          const showPreHeaderPanel = this.gridOptions?.showPreHeaderPanel ?? false;
          this.grid.setPreHeaderPanelVisibility(!showPreHeaderPanel);
          break;
        case 'refresh-dataset':
          this.extensionUtility.refreshBackendDataset();
          break;
        default:
          break;
      }
    }
  }

  /** @return default Grid Menu options */
  protected getDefaultGridMenuOptions(): GridMenu {
    return {
      customTitle: undefined,
      commandTitle: undefined,
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

  /** Mouse down handler when clicking anywhere in the DOM body */
  protected handleBodyMouseDown(event: DOMEvent<HTMLDivElement>) {
    if ((this._menuElm !== event.target && !this._menuElm?.contains(event.target) && this._isMenuOpen) || event.target.className === 'close') {
      this.hideMenu(event);
    }
  }

  protected handleMenuItemCommandClick(event: Event, _type: MenuType, item: ExtractMenuType<MenuCommandItem | MenuOptionItem | 'divider', MenuType>) {
    if (item !== 'divider' && (item as MenuCommandItem).command && !item.disabled && !item.divider) {
      const callbackArgs = {
        grid: this.grid,
        command: (item as MenuCommandItem).command,
        item,
        allColumns: this.columns,
        visibleColumns: this.getVisibleColumns()
      } as unknown as GridMenuCommandItemCallbackArgs;

      // execute Grid Menu callback with command,
      // we'll also execute optional user defined onCommand callback when provided
      this.executeGridMenuInternalCustomCommands(event, callbackArgs);
      this.pubSubService.publish('gridMenu:onCommand', callbackArgs);
      if (typeof this.addonOptions?.onCommand === 'function') {
        this.addonOptions.onCommand(event, callbackArgs);
      }

      // execute action callback when defined
      if (typeof item.action === 'function') {
        (item as MenuCommandItem).action!.call(this, event, callbackArgs as any);
      }
    }

    // does the user want to leave open the Grid Menu after executing a command?
    if (!this.addonOptions.leaveOpen && !event.defaultPrevented) {
      this.hideMenu(event);
    }

    // Stop propagation so that it doesn't register as a header click event.
    event.preventDefault();
    event.stopPropagation();
  }
}