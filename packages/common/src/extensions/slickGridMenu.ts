import {
  Column,
  DOMEvent,
  GridMenu,
  GridMenuCommandItemCallbackArgs,
  GridMenuEventWithElementCallbackArgs,
  GridMenuItem,
  GridMenuOption,
  GridOption,
  MenuCommandItem,
  SlickNamespace,
} from '../interfaces/index';
import { DelimiterType, FileType } from '../enums/index';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { createDomElement, emptyElement, findWidthOrDefault, getHtmlElementOffset, getTranslationPrefix, } from '../services/index';
import { ExcelExportService } from '../services/excelExport.service';
import { FilterService } from '../services/filter.service';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';
import { SortService } from '../services/sort.service';
import { TextExportService } from '../services/textExport.service';
import { addColumnTitleElementWhenDefined, addCloseButtomElement, handleColumnPickerItemClick, populateColumnPicker, updateColumnPickerOrder } from '../extensions/extensionCommonUtils';
import { ExtendableItemTypes, ExtractMenuType, MenuBaseClass, MenuType } from '../extensions/menuBaseClass';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

/**
 * A control to add a Grid Menu with Extra Commands & Column Picker (hambuger menu on top-right of the grid)
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.gridOptions = {
 *     enableGridMenu: true,
 *     gridMenu: {
 *       ... grid menu options ...
 *       commandItems: [{ ...command... }, { ...command... }]
 *     }
 *   }];
 * @class GridMenuControl
 * @constructor
 */
export class SlickGridMenu extends MenuBaseClass<GridMenu> {
  protected _areVisibleColumnDifferent = false;
  protected _columns: Column[] = [];
  protected _columnCheckboxes: HTMLInputElement[] = [];
  protected _columnTitleElm!: HTMLDivElement;
  protected _commandMenuElm!: HTMLDivElement;
  protected _gridMenuOptions: GridMenu | null = null;
  protected _gridMenuButtonElm!: HTMLButtonElement;
  protected _headerElm: HTMLDivElement | null = null;
  protected _isMenuOpen = false;
  protected _listElm!: HTMLSpanElement;
  protected _userOriginalGridMenu!: GridMenu;
  onAfterMenuShow = new Slick.Event();
  onBeforeMenuShow = new Slick.Event();
  onMenuClose = new Slick.Event();
  onCommand = new Slick.Event();
  onColumnsChanged = new Slick.Event();

  protected _defaults = {
    dropSide: 'left',
    showButton: true,
    hideForceFitButton: false,
    hideSyncResizeButton: false,
    forceFitTitle: 'Force fit columns',
    marginBottom: 15,
    menuWidth: 18,
    minHeight: 250,
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
    return this._gridMenuOptions || {};
  }

  get columns(): Column[] {
    return this._columns;
  }
  set columns(newColumns: Column[]) {
    this._columns = newColumns;
  }

  get gridOptions(): GridOption {
    return this.grid.getOptions() || {};
  }

  initEventHandlers() {
    // when grid columns are reordered then we also need to update/resync our picker column in the same order
    this._eventHandler.subscribe(this.grid.onColumnsReordered, updateColumnPickerOrder.bind(this));

    // subscribe to the grid, when it's destroyed, we should also destroy the Grid Menu
    this._eventHandler.subscribe(this.grid.onBeforeDestroy, this.dispose.bind(this));

    // when a grid optionally changes from a regular grid to a frozen grid, we need to destroy & recreate the grid menu
    // we do this change because the Grid Menu is on the left container for a regular grid, it should however be displayed on the right container for a frozen grid
    this._eventHandler.subscribe(this.grid.onSetOptions, (_e, args) => {
      if (args && args.optionsBefore && args.optionsAfter) {
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
    this._userOriginalGridMenu = { ...this.sharedService.gridOptions.gridMenu };
    this._gridMenuOptions = { ...this._defaults, ...this.getDefaultGridMenuOptions(), ...this.sharedService.gridOptions.gridMenu };
    this.sharedService.gridOptions.gridMenu = this._gridMenuOptions;

    // merge original user grid menu items with internal items
    // then sort all Grid Menu Custom Items (sorted by pointer, no need to use the return)
    const gridMenuCommandItems = this._userOriginalGridMenu.commandItems || this._userOriginalGridMenu.customItems;
    const originalCommandItems = this._userOriginalGridMenu && Array.isArray(gridMenuCommandItems) ? gridMenuCommandItems : [];
    this._gridMenuOptions.commandItems = [...originalCommandItems, ...this.addGridMenuCustomCommands(originalCommandItems)];
    this.extensionUtility.translateMenuItemsFromTitleKey(this._gridMenuOptions.commandItems || []);
    this.extensionUtility.sortItems(this._gridMenuOptions.commandItems, 'positionOrder');
    this._gridMenuOptions.customItems = this._gridMenuOptions.commandItems;

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
    if (this._headerElm) {
      // put back original width (fixes width and frozen+gridMenu on left header)
      this._headerElm.style.width = '100%';
    }
    this._gridMenuButtonElm?.remove();
    this._menuElm?.remove();
    this._commandMenuElm?.remove();
  }

  createColumnPickerContainer() {
    if (this._menuElm) {
      // user could pass a title on top of the columns list
      addColumnTitleElementWhenDefined.call(this, this._menuElm);

      this._listElm = createDomElement('span', { className: 'slick-grid-menu-list' });

      // update all columns on any of the column title button click from column picker
      this._bindEventService.bind(this._menuElm, 'click', handleColumnPickerItemClick.bind(this) as EventListener);
    }
  }

  createGridMenu() {
    this._gridUid = this._gridUid ?? this.grid.getUID() ?? '';
    const gridUidSelector = this._gridUid ? `.${this._gridUid}` : '';
    const gridMenuWidth = this._gridMenuOptions?.menuWidth || this._defaults.menuWidth;
    const headerSide = (this.gridOptions.hasOwnProperty('frozenColumn') && this.gridOptions.frozenColumn! >= 0) ? 'right' : 'left';
    this._headerElm = document.querySelector<HTMLDivElement>(`${gridUidSelector} .slick-header-${headerSide}`);

    if (this._headerElm && this._gridMenuOptions) {
      // resize the header row to include the hamburger menu icon
      this._headerElm.style.width = `calc(100% - ${gridMenuWidth}px)`;

      // if header row is enabled, we also need to resize its width
      const enableResizeHeaderRow = this._gridMenuOptions.resizeOnShowHeaderRow ?? this._defaults.resizeOnShowHeaderRow;
      if (enableResizeHeaderRow && this.gridOptions.showHeaderRow) {
        const headerRowElm = document.querySelector<HTMLDivElement>(`${gridUidSelector} .slick-headerrow`);
        if (headerRowElm) {
          headerRowElm.style.width = `calc(100% - ${gridMenuWidth}px)`;
        }
      }

      const showButton = this._gridMenuOptions.showButton ?? this._defaults.showButton;
      if (showButton) {
        this._gridMenuButtonElm = createDomElement('button', { className: 'slick-grid-menu-button' });
        if (this._gridMenuOptions?.iconCssClass) {
          this._gridMenuButtonElm.classList.add(...this._gridMenuOptions.iconCssClass.split(' '));
        } else {
          const iconImage = this._gridMenuOptions?.iconImage ?? '';
          const iconImageElm = createDomElement('img', { src: iconImage });
          this._gridMenuButtonElm.appendChild(iconImageElm);
        }
        this._headerElm.parentElement!.insertBefore(this._gridMenuButtonElm, this._headerElm.parentElement!.firstChild);

        // show the Grid Menu when hamburger menu is clicked
        this._gridMenuOptions.commandTitle = this._gridMenuOptions.customTitle || this._gridMenuOptions.commandTitle;
        this._bindEventService.bind(this._gridMenuButtonElm, 'click', this.showGridMenu.bind(this) as EventListener);
      }

      this.sharedService.gridOptions.gridMenu = { ...this._defaults, ...this._gridMenuOptions };

      // localization support for the picker
      this.translateTitleLabels(this._gridMenuOptions);
      this.translateTitleLabels(this.sharedService.gridOptions.gridMenu);

      this._menuElm = document.createElement('div');
      this._menuElm.classList.add('slick-grid-menu', this._gridUid);
      this._menuElm.style.display = 'none';

      // add Close button
      addCloseButtomElement.call(this, this._menuElm);

      this._commandMenuElm = createDomElement('div', { className: 'slick-grid-menu-command-list' });
      this._menuElm.appendChild(this._commandMenuElm);

      this.populateCommandOrOptionItems(
        'command',
        this._gridMenuOptions,
        this._commandMenuElm,
        (this._gridMenuOptions?.commandItems || this._gridMenuOptions?.customItems) || [] as any[],
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
      this.pubSubService.publish('onGridMenuMenuClose', callbackArgs);
      if ((typeof this._gridMenuOptions?.onMenuClose === 'function' && this._gridMenuOptions.onMenuClose(event, callbackArgs) === false) || this.onMenuClose.notify(callbackArgs, null, this) === false) {
        return;
      }

      this._menuElm.style.display = 'none';
      this._menuElm.setAttribute('aria-expanded', 'false');
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

  /** destroy and recreate the Grid Menu in the DOM */
  recreateGridMenu() {
    this.deleteMenu();
    this.init();
  }

  repositionMenu(e: MouseEvent, addonOptions: GridMenu, showMenu = true) {
    if (this._menuElm) {
      let buttonElm = (e.target as HTMLButtonElement).nodeName === 'BUTTON' ? (e.target as HTMLButtonElement) : (e.target as HTMLElement).querySelector('button') as HTMLButtonElement; // get button element
      if (!buttonElm) {
        buttonElm = (e.target as HTMLElement).parentElement as HTMLButtonElement; // external grid menu might fall in this last case if wrapped in a span/div
      }

      // we need to display the menu to properly calculate its width but we can however make it invisible
      this._menuElm.style.display = 'block';
      this._menuElm.style.opacity = '0';
      const menuIconOffset = getHtmlElementOffset(buttonElm as HTMLButtonElement);
      const buttonComptStyle = getComputedStyle(buttonElm as HTMLButtonElement);
      const buttonWidth = parseInt(buttonComptStyle?.width ?? this._defaults?.menuWidth, 10);

      const menuWidth = this._menuElm?.offsetWidth ?? 0;
      const contentMinWidth = addonOptions?.contentMinWidth ?? this._defaults.contentMinWidth ?? 0;
      const currentMenuWidth = ((contentMinWidth > menuWidth) ? contentMinWidth : (menuWidth)) || 0;
      const nextPositionTop = menuIconOffset?.top ?? 0;
      const nextPositionLeft = menuIconOffset?.right ?? 0;
      const menuMarginBottom = ((addonOptions?.marginBottom !== undefined) ? addonOptions.marginBottom : this._defaults.marginBottom) || 0;
      const calculatedLeftPosition = addonOptions?.dropSide === 'right' ? nextPositionLeft - buttonWidth : nextPositionLeft - currentMenuWidth;

      this._menuElm.style.top = `${nextPositionTop + buttonElm.offsetHeight}px`; // top position has to include button height so the menu is placed just below it
      this._menuElm.style.left = `${calculatedLeftPosition}px`;
      if (addonOptions.dropSide === 'left') {
        this._menuElm.classList.remove('dropright');
        this._menuElm.classList.add('dropleft');
      } else {
        this._menuElm.classList.remove('dropleft');
        this._menuElm.classList.add('dropright');
      }
      this._menuElm.appendChild(this._listElm);

      if (contentMinWidth! > 0) {
        this._menuElm.style.minWidth = `${contentMinWidth}px`;
      }

      // set 'height' when defined OR ELSE use the 'max-height' with available window size and optional margin bottom
      this._menuElm.style.minHeight = findWidthOrDefault(addonOptions.minHeight, '');

      if (addonOptions?.height !== undefined) {
        this._menuElm.style.height = findWidthOrDefault(addonOptions.height, '');
      } else {
        this._menuElm.style.maxHeight = findWidthOrDefault(addonOptions.maxHeight, `${window.innerHeight - e.clientY - menuMarginBottom}px`);
      }

      this._menuElm.style.display = 'block';
      if (showMenu) {
        this._menuElm.style.opacity = '1'; // restore its visibility
      }

      this._menuElm.setAttribute('aria-expanded', 'true');
      this._menuElm.appendChild(this._listElm);
      this._isMenuOpen = true;
    }
  }

  showGridMenu(e: MouseEvent, options?: GridMenuOption) {
    e.preventDefault();

    // empty both the picker list & the command list
    emptyElement(this._listElm);
    emptyElement(this._commandMenuElm);

    if (this._gridMenuOptions) {
      const callbackArgs = {
        grid: this.grid,
        menu: this._menuElm,
        columns: this.columns,
        allColumns: this.getAllColumns(),
        visibleColumns: this.getVisibleColumns()
      } as GridMenuEventWithElementCallbackArgs;

      const addonOptions: GridMenu = { ...this._gridMenuOptions, ...options }; // merge optional picker option
      addonOptions.customTitle = addonOptions.commandTitle;

      this.populateCommandOrOptionItems(
        'command',
        addonOptions,
        this._commandMenuElm,
        (addonOptions?.commandItems || addonOptions?.customItems) || [] as any[],
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
        this.pubSubService.publish('onGridMenuBeforeMenuShow', callbackArgs);
        if ((typeof addonOptions?.onBeforeMenuShow === 'function' && addonOptions.onBeforeMenuShow(e, callbackArgs) === false) || this.onBeforeMenuShow.notify(callbackArgs, null, this)) {
          return;
        }
      }

      // load the column & create column picker list
      populateColumnPicker.call(this, addonOptions);

      // calculate the necessary menu height/width and reposition twice because if we do it only once and the grid menu is wider than the original width,
      // it will be offset the 1st time we open the menu but if we do it twice then it will be at the correct position every time
      this.repositionMenu(e, addonOptions, false);
      this.repositionMenu(e, addonOptions, true);

      // execute optional callback method defined by the user
      this.pubSubService.publish('onGridMenuAfterMenuShow', callbackArgs);
      if (typeof addonOptions?.onAfterMenuShow === 'function') {
        addonOptions.onAfterMenuShow(e, callbackArgs);
      }
      this.onAfterMenuShow.notify(callbackArgs, null, this);
    }
  }

  /** Update the Titles of each sections (command, commandTitle, ...) */
  updateAllTitles(options: GridMenuOption) {
    if (this._commandTitleElm?.textContent && (options.customTitle || options.commandTitle)) {
      this._commandTitleElm.textContent = (options.customTitle || options.commandTitle) as string;
      this._gridMenuOptions!.commandTitle = this._commandTitleElm.textContent;
    }
    if (this._columnTitleElm?.textContent && options.columnTitle) {
      this._columnTitleElm.textContent = options.columnTitle;
      this._gridMenuOptions!.columnTitle = options.columnTitle;
    }
  }

  /** Translate the Grid Menu titles and column picker */
  translateGridMenu() {
    // update the properties by pointers, that is the only way to get Grid Menu Control to see the new values
    // we also need to call the control init so that it takes the new Grid object with latest values
    if (this.sharedService.gridOptions.gridMenu) {
      this.sharedService.gridOptions.gridMenu.commandItems = [];
      this.sharedService.gridOptions.gridMenu.customItems = [];
      this.sharedService.gridOptions.gridMenu.commandTitle = '';
      this.sharedService.gridOptions.gridMenu.customTitle = '';
      this.sharedService.gridOptions.gridMenu.columnTitle = '';
      this.sharedService.gridOptions.gridMenu.forceFitTitle = '';
      this.sharedService.gridOptions.gridMenu.syncResizeTitle = '';

      // merge original user grid menu items with internal items
      // then sort all Grid Menu Custom Items (sorted by pointer, no need to use the return)
      const originalCommandItems = this._userOriginalGridMenu && Array.isArray(this._userOriginalGridMenu.commandItems) ? this._userOriginalGridMenu.commandItems : [];
      this.sharedService.gridOptions.gridMenu.commandItems = [...originalCommandItems, ...this.addGridMenuCustomCommands(originalCommandItems)];
      this.extensionUtility.translateMenuItemsFromTitleKey(this._gridMenuOptions?.commandItems || []);
      this.extensionUtility.sortItems(this.sharedService.gridOptions.gridMenu.commandItems, 'positionOrder');
      this.translateTitleLabels(this.sharedService.gridOptions.gridMenu);
      this.translateTitleLabels(this._gridMenuOptions);

      // translate all columns (including non-visible)
      this.extensionUtility.translateItems(this._columns, 'nameKey', 'name');

      // update the Titles of each sections (command, commandTitle, ...)
      this.updateAllTitles(this.sharedService.gridOptions.gridMenu);
      this.sharedService.gridOptions.gridMenu.customItems = this.sharedService.gridOptions.gridMenu.commandItems;
    }
  }

  translateTitleLabels(gridMenuOptions: GridMenu | null) {
    if (gridMenuOptions) {
      gridMenuOptions.commandTitle = this.extensionUtility.getPickerTitleOutputString('commandTitle', 'gridMenu');
      gridMenuOptions.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'gridMenu');
      gridMenuOptions.forceFitTitle = this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'gridMenu');
      gridMenuOptions.syncResizeTitle = this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'gridMenu');
    }
  }

  // --
  // protected functions
  // ------------------

  /** Create Grid Menu with Custom Commands if user has enabled Filters and/or uses a Backend Service (OData, GraphQL) */
  protected addGridMenuCustomCommands(originalCommandItems: Array<GridMenuItem | 'divider'>) {
    const backendApi = this.gridOptions.backendServiceApi || null;
    const gridMenuCommandItems: Array<GridMenuItem | 'divider'> = [];
    const gridOptions = this.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);
    const commandLabels = this._gridMenuOptions?.commandLabels;

    // show grid menu: Unfreeze Columns/Rows
    if (this.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideClearFrozenColumnsCommand) {
      const commandName = 'clear-pinning';
      if (!originalCommandItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCommandItems.push(
          {
            iconCssClass: this._gridMenuOptions.iconClearFrozenColumnsCommand || 'fa fa-times',
            titleKey: `${translationPrefix}${commandLabels?.clearFrozenColumnsCommandKey ?? 'CLEAR_PINNING'}`,
            disabled: false,
            command: commandName,
            positionOrder: 52
          }
        );
      }
    }

    if (this.gridOptions && (this.gridOptions.enableFiltering && !this.sharedService.hideHeaderRowAfterPageLoad)) {
      // show grid menu: Clear all Filters
      if (this.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideClearAllFiltersCommand) {
        const commandName = 'clear-filter';
        if (!originalCommandItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCommandItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconClearAllFiltersCommand || 'fa fa-filter text-danger',
              titleKey: `${translationPrefix}${commandLabels?.clearAllFiltersCommandKey ?? 'CLEAR_ALL_FILTERS'}`,
              disabled: false,
              command: commandName,
              positionOrder: 50
            }
          );
        }
      }

      // show grid menu: toggle filter row
      if (this.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideToggleFilterCommand) {
        const commandName = 'toggle-filter';
        if (!originalCommandItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCommandItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconToggleFilterCommand || 'fa fa-random',
              titleKey: `${translationPrefix}${commandLabels?.toggleFilterCommandKey ?? 'TOGGLE_FILTER_ROW'}`,
              disabled: false,
              command: commandName,
              positionOrder: 53
            }
          );
        }
      }

      // show grid menu: refresh dataset
      if (backendApi && this.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideRefreshDatasetCommand) {
        const commandName = 'refresh-dataset';
        if (!originalCommandItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCommandItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconRefreshDatasetCommand || 'fa fa-refresh',
              titleKey: `${translationPrefix}${commandLabels?.refreshDatasetCommandKey ?? 'REFRESH_DATASET'}`,
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
      if (this.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideTogglePreHeaderCommand) {
        const commandName = 'toggle-preheader';
        if (!originalCommandItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCommandItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconTogglePreHeaderCommand || 'fa fa-random',
              titleKey: `${translationPrefix}${commandLabels?.togglePreHeaderCommandKey ?? 'TOGGLE_PRE_HEADER_ROW'}`,
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
      if (this.gridOptions && this._gridMenuOptions && !this._gridMenuOptions.hideClearAllSortingCommand) {
        const commandName = 'clear-sorting';
        if (!originalCommandItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCommandItems.push(
            {
              iconCssClass: this._gridMenuOptions.iconClearAllSortingCommand || 'fa fa-unsorted text-danger',
              titleKey: `${translationPrefix}${commandLabels?.clearAllSortingCommandKey ?? 'CLEAR_ALL_SORTING'}`,
              disabled: false,
              command: commandName,
              positionOrder: 51
            }
          );
        }
      }
    }

    // show grid menu: Export to file
    if ((this.gridOptions?.enableExport || this.gridOptions?.enableTextExport) && this._gridMenuOptions && !this._gridMenuOptions.hideExportCsvCommand) {
      const commandName = 'export-csv';
      if (!originalCommandItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCommandItems.push(
          {
            iconCssClass: this._gridMenuOptions.iconExportCsvCommand || 'fa fa-download',
            titleKey: `${translationPrefix}${commandLabels?.exportCsvCommandKey ?? 'EXPORT_TO_CSV'}`,
            disabled: false,
            command: commandName,
            positionOrder: 54
          }
        );
      }
    }

    // show grid menu: Export to Excel
    if (this.gridOptions && this.gridOptions.enableExcelExport && this._gridMenuOptions && !this._gridMenuOptions.hideExportExcelCommand) {
      const commandName = 'export-excel';
      if (!originalCommandItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCommandItems.push(
          {
            iconCssClass: this._gridMenuOptions.iconExportExcelCommand || 'fa fa-file-excel-o text-success',
            titleKey: `${translationPrefix}${commandLabels?.exportExcelCommandKey ?? 'EXPORT_TO_EXCEL'}`,
            disabled: false,
            command: commandName,
            positionOrder: 55
          }
        );
      }
    }

    // show grid menu: export to text file as tab delimited
    if ((this.gridOptions?.enableExport || this.gridOptions?.enableTextExport) && this._gridMenuOptions && !this._gridMenuOptions.hideExportTextDelimitedCommand) {
      const commandName = 'export-text-delimited';
      if (!originalCommandItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCommandItems.push(
          {
            iconCssClass: this._gridMenuOptions.iconExportTextDelimitedCommand || 'fa fa-download',
            titleKey: `${translationPrefix}${commandLabels?.exportTextDelimitedCommandKey ?? 'EXPORT_TO_TAB_DELIMITED'}`,
            disabled: false,
            command: commandName,
            positionOrder: 56
          }
        );
      }
    }

    // add the custom "Commands" title if there are any commands
    const commandItems = (this._gridMenuOptions?.commandItems ?? this._gridMenuOptions?.customItems) || [];
    if (this.gridOptions && this._gridMenuOptions && (Array.isArray(gridMenuCommandItems) && gridMenuCommandItems.length > 0 || (Array.isArray(commandItems) && commandItems.length > 0))) {
      this._gridMenuOptions.commandTitleKey = this._gridMenuOptions?.customTitleKey;
      this._gridMenuOptions.commandTitle = this._gridMenuOptions.customTitle || this._gridMenuOptions.commandTitle || this.extensionUtility.getPickerTitleOutputString('commandTitle', 'gridMenu');
    }

    return gridMenuCommandItems;
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
          this.sharedService.gridOptions.frozenColumn = newGridOptions.frozenColumn;
          this.sharedService.gridOptions.frozenRow = newGridOptions.frozenRow;
          this.sharedService.gridOptions.frozenBottom = newGridOptions.frozenBottom;
          this.sharedService.gridOptions.enableMouseWheelScrollHandler = newGridOptions.enableMouseWheelScrollHandler;

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
      commandItems: [],
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

  protected handleMenuItemCommandClick(event: Event, _type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>): boolean | void {
    if (item === 'divider' || (item as MenuCommandItem).command && (item.disabled || (item as MenuCommandItem).divider)) {
      return false;
    }

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
    this.pubSubService.publish('onGridMenuCommand', callbackArgs);
    if (typeof this._gridMenuOptions?.onCommand === 'function') {
      this._gridMenuOptions.onCommand(event, callbackArgs);
    }
    this.onCommand.notify(callbackArgs, null, this);

    // execute action callback when defined
    if (typeof item.action === 'function') {
      (item as MenuCommandItem).action!.call(this, event, callbackArgs as any);
    }

    // does the user want to leave open the Grid Menu after executing a command?
    if (!this._gridMenuOptions?.leaveOpen && !event.defaultPrevented) {
      this.hideMenu(event);
    }

    // Stop propagation so that it doesn't register as a header click event.
    event.preventDefault();
    event.stopPropagation();
  }
}