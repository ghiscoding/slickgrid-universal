import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import {
  classNameToList,
  createDomElement,
  emptyElement,
  extend,
  findWidthOrDefault,
  getHtmlStringOutput,
} from '@slickgrid-universal/utils';
import { SlickEvent, Utils as SlickUtils } from '../core/index.js';
import { DelimiterType } from '../enums/index.js';
import {
  addCloseButtomElement,
  addColumnTitleElementWhenDefined,
  handleColumnPickerItemClick,
  populateColumnPicker,
  updateColumnPickerOrder,
} from '../extensions/extensionCommonUtils.js';
import type { ExtensionUtility } from '../extensions/extensionUtility.js';
import { MenuBaseClass, type ExtendableItemTypes, type ExtractMenuType, type MenuType } from '../extensions/menuBaseClass.js';
import type {
  Column,
  DOMEvent,
  DOMMouseOrTouchEvent,
  GridMenu,
  GridMenuCommandItemCallbackArgs,
  GridMenuEventWithElementCallbackArgs,
  GridMenuItem,
  GridMenuOption,
  GridOption,
  onGridMenuColumnsChangedCallbackArgs,
} from '../interfaces/index.js';
import type { ExcelExportService } from '../services/excelExport.service.js';
import type { FilterService } from '../services/filter.service.js';
import { getTranslationPrefix } from '../services/index.js';
import type { SharedService } from '../services/shared.service.js';
import type { SortService } from '../services/sort.service.js';
import type { TextExportService } from '../services/textExport.service.js';

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
  // public events
  onAfterMenuShow: SlickEvent<GridMenuEventWithElementCallbackArgs>;
  onBeforeMenuShow: SlickEvent<GridMenuEventWithElementCallbackArgs>;
  onMenuClose: SlickEvent<GridMenuEventWithElementCallbackArgs>;
  onCommand: SlickEvent<GridMenuCommandItemCallbackArgs>;
  onColumnsChanged: SlickEvent<onGridMenuColumnsChangedCallbackArgs>;

  protected _areVisibleColumnDifferent = false;
  protected _columns: Column[] = [];
  protected _columnCheckboxes: HTMLInputElement[] = [];
  protected _columnTitleElm!: HTMLDivElement;
  protected _commandMenuElm: HTMLDivElement | null = null;
  protected _gridMenuButtonElm!: HTMLButtonElement;
  protected _headerElm: HTMLDivElement | null = null;
  protected _isMenuOpen = false;
  protected _listElm!: HTMLSpanElement;
  protected _subMenuParentId = '';
  protected _originalGridMenu!: GridMenu;
  protected _userOriginalGridMenu!: GridMenu;
  protected _defaults = {
    autoAlignSide: true,
    dropSide: 'left',
    showButton: true,
    hideForceFitButton: false,
    hideSyncResizeButton: false,
    forceFitTitle: 'Force fit columns',
    marginBottom: 15,
    menuWidth: 18,
    minHeight: 150,
    contentMinWidth: 0,
    resizeOnShowHeaderRow: false,
    syncResizeTitle: 'Synchronous resize',
    subMenuOpenByEvent: 'mouseover',
    headerColumnValueExtractor: (columnDef: Column) =>
      getHtmlStringOutput(columnDef.columnPickerLabel || columnDef.name || '', 'innerHTML'),
  } as GridMenuOption;
  pluginName: 'GridMenu' = 'GridMenu' as const;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly filterService: FilterService,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService,
    protected readonly sortService: SortService
  ) {
    super(extensionUtility, pubSubService, sharedService);
    this._menuCssPrefix = 'slick-menu';
    this._menuPluginCssPrefix = 'slick-grid-menu';
    this._camelPluginName = 'gridMenu';
    this._columns = this.sharedService.allColumns ?? [];
    this._gridUid = this.grid?.getUID() ?? '';
    this.onAfterMenuShow = new SlickEvent<GridMenuEventWithElementCallbackArgs>('onAfterMenuShow');
    this.onBeforeMenuShow = new SlickEvent<GridMenuEventWithElementCallbackArgs>('onBeforeMenuShow');
    this.onMenuClose = new SlickEvent<GridMenuEventWithElementCallbackArgs>('onMenuClose');
    this.onCommand = new SlickEvent<GridMenuCommandItemCallbackArgs>('onCommand');
    this.onColumnsChanged = new SlickEvent<onGridMenuColumnsChangedCallbackArgs>('onColumnsChanged');

    this.initEventHandlers();
    this.init();
  }

  get addonOptions(): GridMenu {
    return this._addonOptions || {};
  }

  get columns(): Column[] {
    return this._columns;
  }
  set columns(newColumns: Column[]) {
    this._columns = newColumns;
  }

  get gridOptions(): GridOption {
    return this.grid?.getOptions() || {};
  }

  get gridUidSelector(): string {
    return this.gridUid ? `.${this.gridUid}` : '';
  }

  initEventHandlers(): void {
    // when grid columns are reordered then we also need to update/resync our picker column in the same order
    this._eventHandler.subscribe(this.grid.onColumnsReordered, updateColumnPickerOrder.bind(this));
    this._eventHandler.subscribe(this.grid.onClick, (e) => this.hideMenu(e as any));

    // subscribe to the grid, when it's destroyed, we should also destroy the Grid Menu
    this._eventHandler.subscribe(this.grid.onBeforeDestroy, this.dispose.bind(this));

    // when a grid optionally changes from a regular grid to a frozen grid, we need to destroy & recreate the grid menu
    // we do this change because the Grid Menu is on the left container for a regular grid, it should however be displayed on the right container for a frozen grid
    this._eventHandler.subscribe(this.grid.onSetOptions, (_e, args) => {
      if (args && args.optionsBefore && args.optionsAfter) {
        const switchedFromRegularToFrozen = args.optionsBefore.frozenColumn! >= 0 && args.optionsAfter.frozenColumn === -1;
        const switchedFromFrozenToRegular = args.optionsBefore.frozenColumn === -1 && args.optionsAfter.frozenColumn! >= 0;
        if (switchedFromRegularToFrozen || switchedFromFrozenToRegular) {
          this.recreateGridMenu();
        }
      }
    });
  }

  /** Initialize plugin. */
  init(isFirstLoad = true): void {
    this._gridUid = this.grid.getUID() ?? '';

    // add PubSub instance to all SlickEvent
    SlickUtils.addSlickEventPubSubWhenDefined(this.pubSubService, this);

    // keep original user grid menu, useful when switching locale to translate
    if (isFirstLoad) {
      this._originalGridMenu = extend(true, {}, this.sharedService.gridOptions.gridMenu);
    }
    this._userOriginalGridMenu = { ...this.sharedService.gridOptions.gridMenu };
    this._addonOptions = { ...this._defaults, ...this.getDefaultGridMenuOptions(), ...this.sharedService.gridOptions.gridMenu };
    this.sharedService.gridOptions.gridMenu = this._addonOptions;

    // merge original user grid menu items with internal items
    // then sort all Grid Menu command items (sorted by pointer, no need to use the return)
    const gridMenuCommandItems = this._userOriginalGridMenu.commandItems;
    const originalCommandItems = this._userOriginalGridMenu && Array.isArray(gridMenuCommandItems) ? gridMenuCommandItems : [];
    this._addonOptions.commandItems = [...originalCommandItems, ...this.addGridMenuCustomCommands(originalCommandItems)];
    this.extensionUtility.translateMenuItemsFromTitleKey(this._addonOptions.commandItems || [], 'commandItems');
    this.extensionUtility.sortItems(this._addonOptions.commandItems, 'positionOrder');

    // create the Grid Menu DOM element
    this.createGridMenu();
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose(): void {
    this.deleteMenu();
    super.dispose();
  }

  deleteMenu(): void {
    this._bindEventService.unbindAll();
    this._menuElm?.remove();
    this._menuElm = null;
    this._gridMenuButtonElm?.remove();
    if (this._headerElm) {
      // put back grid header original width (fixes width and frozen+gridMenu on left header)
      this._headerElm.style.width = '100%';
    }
  }

  createColumnPickerContainer(): void {
    if (this._menuElm) {
      // user could pass a title on top of the columns list
      addColumnTitleElementWhenDefined.call(this, this._menuElm);

      this._listElm = createDomElement('div', { className: 'slick-column-picker-list', role: 'menu' });

      // update all columns on any of the column title button click from column picker
      this._bindEventService.bind(
        this._menuElm,
        'click',
        handleColumnPickerItemClick.bind(this) as EventListener,
        undefined,
        'parent-menu'
      );
    }
  }

  /** Create parent grid menu container */
  createGridMenu(): void {
    const gridUidSelector = this._gridUid ? `.${this._gridUid}` : '';
    const gridMenuWidth = this._addonOptions?.menuWidth || this._defaults.menuWidth;
    const headerSide = this.gridOptions.hasOwnProperty('frozenColumn') && this.gridOptions.frozenColumn! >= 0 ? 'right' : 'left';
    const gridContainer = this.grid.getContainerNode();
    this._headerElm = gridContainer.querySelector<HTMLDivElement>(`.slick-header-${headerSide}`);

    if (this._headerElm && this._addonOptions) {
      // resize the header row to include the hamburger menu icon
      this._headerElm.style.width = `calc(100% - ${gridMenuWidth}px)`;

      // if header row is enabled, we also need to resize its width
      const enableResizeHeaderRow = this._addonOptions.resizeOnShowHeaderRow ?? this._defaults.resizeOnShowHeaderRow;
      if (enableResizeHeaderRow && this.gridOptions.showHeaderRow) {
        const headerRowElm = gridContainer.querySelector<HTMLDivElement>(`${gridUidSelector} .slick-headerrow`);
        if (headerRowElm) {
          headerRowElm.style.width = `calc(100% - ${gridMenuWidth}px)`;
        }
      }

      const showButton = this._addonOptions.showButton ?? this._defaults.showButton;
      if (showButton) {
        this._gridMenuButtonElm = createDomElement('button', { className: 'slick-grid-menu-button', ariaLabel: 'Grid Menu' });
        if (this._addonOptions?.iconCssClass) {
          this._gridMenuButtonElm.classList.add(...classNameToList(this._addonOptions.iconCssClass));
        }
        // add the grid menu button in the preheader (when exists) or always in the column header (default)
        const buttonContainerTarget = this._addonOptions.iconButtonContainer === 'preheader' ? 'firstChild' : 'lastChild';
        this._headerElm.parentElement!.insertBefore(this._gridMenuButtonElm, this._headerElm.parentElement![buttonContainerTarget]);

        // show the Grid Menu when hamburger menu is clicked
        this._bindEventService.bind(this._gridMenuButtonElm, 'click', this.showGridMenu.bind(this) as EventListener);
      }

      this.sharedService.gridOptions.gridMenu = { ...this._defaults, ...this._addonOptions };

      // localization support for the picker
      this.translateTitleLabels(this._addonOptions);
      this.translateTitleLabels(this.sharedService.gridOptions.gridMenu);

      // hide the menu on outside click.
      this._bindEventService.bind(document.body, 'mousedown', this.handleBodyMouseDown.bind(this) as EventListener);

      // destroy the picker if user leaves the page
      this._bindEventService.bind(document.body, 'beforeunload', this.dispose.bind(this) as EventListener);
    }
  }

  /** Create the menu or sub-menu(s) but without the column picker which is a separate single process */
  createCommandMenu(
    commandItems: Array<GridMenuItem | 'divider'>,
    level = 0,
    item?: ExtractMenuType<ExtendableItemTypes, MenuType>
  ): HTMLDivElement {
    // to avoid having multiple sub-menu trees opened
    // we need to somehow keep trace of which parent menu the tree belongs to
    // and we should keep ref of only the first sub-menu parent, we can use the command name (remove any whitespaces though)
    const subMenuCommand = (item as GridMenuItem)?.command;
    let subMenuId = level === 1 && subMenuCommand ? subMenuCommand.replace(/\s/g, '') : '';
    if (subMenuId) {
      this._subMenuParentId = subMenuId;
    }
    if (level > 1) {
      subMenuId = this._subMenuParentId;
    }

    const menuClasses = `${this.menuCssClass} slick-menu-level-${level} ${this._gridUid}`;
    const bodyMenuElm = document.body.querySelector<HTMLDivElement>(
      `.${this.menuCssClass}.slick-menu-level-${level}${this.gridUidSelector}`
    );

    // return menu/sub-menu if it's already opened unless we are on different sub-menu tree if so close them all
    if (bodyMenuElm) {
      if (bodyMenuElm.dataset.subMenuParent === subMenuId) {
        return bodyMenuElm;
      }
      this.disposeSubMenus();
    }

    const menuElm = createDomElement('div', {
      role: 'menu',
      className: menuClasses,
      ariaLabel: level > 1 ? 'SubMenu' : 'Grid Menu',
    });
    if (level > 0) {
      menuElm.classList.add('slick-submenu');
      if (subMenuId) {
        menuElm.dataset.subMenuParent = subMenuId;
      }
    }

    const callbackArgs = {
      grid: this.grid,
      menu: this._menuElm,
      columns: this.columns,
      allColumns: this.getAllColumns(),
      visibleColumns: this.getVisibleColumns(),
      level,
    } as GridMenuEventWithElementCallbackArgs;
    this._commandMenuElm = this.recreateCommandList(commandItems, menuElm, callbackArgs, item);

    // increment level for possible next sub-menus if exists
    level++;

    return menuElm;
  }

  /**
   * Get all columns including hidden columns.
   * @returns {Array<Object>} - all columns array
   */
  getAllColumns(): Column[] {
    return this._columns;
  }

  /**
   * Get only the visible columns.
   * @returns {Array<Object>} - only the visible columns array
   */
  getVisibleColumns(): Column[] {
    return this.grid.getColumns();
  }

  /**
   * Hide the Grid Menu but only if it does detect as open prior to executing anything.
   * @param event
   * @returns
   */
  hideMenu(event: Event): void {
    const callbackArgs = {
      grid: this.grid,
      menu: this._menuElm,
      allColumns: this.columns,
      visibleColumns: this.getVisibleColumns(),
    } as GridMenuEventWithElementCallbackArgs;

    // execute optional callback method defined by the user, if it returns false then we won't go further neither close the menu
    this.pubSubService.publish('onGridMenuMenuClose', callbackArgs);
    if (
      (typeof this._addonOptions?.onMenuClose === 'function' && this._addonOptions.onMenuClose(event, callbackArgs) === false) ||
      this.onMenuClose.notify(callbackArgs, null, this).getReturnValue() === false
    ) {
      return;
    }

    this._isMenuOpen = false;

    // we also want to resize the columns if the user decided to hide certain column(s)
    if (typeof this.grid?.autosizeColumns === 'function' && this._addonOptions?.autoResizeColumns !== false) {
      // make sure that the grid still exist (by looking if the Grid UID is found in the DOM tree)
      const gridUid = this.grid.getUID() || '';
      if (this._areVisibleColumnDifferent && gridUid && document.querySelector(`.${gridUid}`) !== null) {
        if (this.gridOptions.enableAutoSizeColumns) {
          this.grid.autosizeColumns();
        }
        this._areVisibleColumnDifferent = false;
      }
    }

    // dispose of all sub-menus from the DOM and unbind all listeners
    this.disposeSubMenus();
    this._menuElm?.remove();
    this._menuElm = null;
  }

  /** destroy and recreate the Grid Menu in the DOM */
  recreateGridMenu(): void {
    this.deleteMenu();
    this.init(false);
  }

  /** Open the Grid Menu */
  openGridMenu(): void {
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, composed: false });
    Object.defineProperty(clickEvent, 'target', {
      writable: true,
      configurable: true,
      value: createDomElement('button', { className: 'slick-grid-menu-button' }),
    });
    this.showGridMenu(clickEvent);
  }

  /** show Grid Menu from the click event, which in theory will recreate the grid menu in the DOM */
  showGridMenu(e: MouseEvent | TouchEvent, options?: GridMenuOption): void {
    const targetEvent: MouseEvent | Touch = (e as TouchEvent)?.touches?.[0] ?? e;
    e.preventDefault();

    // empty the entire menu so that it's recreated every time it opens
    emptyElement(this._menuElm);
    this._menuElm?.remove();

    if (this._addonOptions) {
      const callbackArgs = {
        grid: this.grid,
        menu: this._menuElm,
        columns: this.columns,
        allColumns: this.getAllColumns(),
        visibleColumns: this.getVisibleColumns(),
      } as GridMenuEventWithElementCallbackArgs;

      const addonOptions: GridMenu = { ...this._addonOptions, ...options }; // merge optional picker option

      // run the override function (when defined), if the result is false then we won't go further
      if (
        addonOptions &&
        !this.extensionUtility.runOverrideFunctionWhenExists<typeof callbackArgs>(addonOptions.menuUsabilityOverride, callbackArgs)
      ) {
        return;
      }

      // execute optional callback method defined by the user, if it returns false then we won't go further and not open the grid menu
      if (typeof e.stopPropagation === 'function') {
        this.pubSubService.publish('onGridMenuBeforeMenuShow', callbackArgs);
        if (
          (typeof addonOptions?.onBeforeMenuShow === 'function' && addonOptions.onBeforeMenuShow(e, callbackArgs) === false) ||
          this.onBeforeMenuShow.notify(callbackArgs, null, this).getReturnValue() === false
        ) {
          return;
        }
      }

      this._menuElm = this.createCommandMenu(this._addonOptions?.commandItems ?? []);
      this.createColumnPickerContainer();
      updateColumnPickerOrder.call(this);
      this._columnCheckboxes = [];

      // load the column & create column picker list
      populateColumnPicker.call(this, addonOptions);
      document.body.appendChild(this._menuElm);

      // add dark mode CSS class when enabled
      if (this.gridOptions.darkMode) {
        this._menuElm.classList.add('slick-dark-mode');
      }

      // calculate the necessary menu height/width and reposition twice because if we do it only once and the grid menu is wider than the original width,
      // it will be offset the 1st time we open the menu but if we do it twice then it will be at the correct position every time
      this._menuElm.style.opacity = '0';

      const menuMarginBottom = (addonOptions?.marginBottom !== undefined ? addonOptions.marginBottom : this._defaults.marginBottom) || 0;

      // set 'height' when defined OR ELSE use the 'max-height' with available window size and optional margin bottom
      this._menuElm.style.minHeight = findWidthOrDefault(addonOptions?.minHeight, '');

      if (addonOptions?.height !== undefined) {
        this._menuElm.style.height = findWidthOrDefault(addonOptions.height, '');
      } else {
        this._menuElm.style.maxHeight = findWidthOrDefault(
          addonOptions?.maxHeight,
          `${window.innerHeight - targetEvent.clientY - menuMarginBottom}px`
        );
      }

      let buttonElm =
        (e.target as HTMLButtonElement).nodeName === 'BUTTON'
          ? (e.target as HTMLButtonElement)
          : ((e.target as HTMLElement).querySelector('button') as HTMLButtonElement); // get button element
      if (!buttonElm) {
        buttonElm = (e.target as HTMLElement).parentElement as HTMLButtonElement; // external grid menu might fall in this last case if wrapped in a span/div
      }

      this._menuElm.ariaExpanded = 'true';
      this._menuElm.appendChild(this._listElm);

      // once we have both lists (commandItems + columnPicker), we are ready to reposition the menu since its height/width should be calculated by then
      this.repositionMenu(e as any, this._menuElm, buttonElm, addonOptions);
      this._isMenuOpen = true;

      // execute optional callback method defined by the user
      this.pubSubService.publish('onGridMenuAfterMenuShow', callbackArgs);
      if (typeof addonOptions?.onAfterMenuShow === 'function') {
        addonOptions.onAfterMenuShow(e, callbackArgs);
      }
      this.onAfterMenuShow.notify(callbackArgs, null, this);
    }
  }

  /** Translate the Grid Menu titles and column picker */
  translateGridMenu(): void {
    // update the properties by pointers, that is the only way to get Grid Menu Control to see the new values
    // we also need to call the control init so that it takes the new Grid object with latest values
    if (this.sharedService.gridOptions.gridMenu) {
      this.sharedService.gridOptions.gridMenu.commandItems = [];
      this.sharedService.gridOptions.gridMenu.commandTitle = this._originalGridMenu.commandTitle || '';
      this.sharedService.gridOptions.gridMenu.columnTitle = this._originalGridMenu.columnTitle || '';
      this.sharedService.gridOptions.gridMenu.forceFitTitle = this._originalGridMenu.forceFitTitle || '';
      this.sharedService.gridOptions.gridMenu.syncResizeTitle = this._originalGridMenu.syncResizeTitle || '';

      // merge original user grid menu items with internal items
      // then sort all Grid Menu command items (sorted by pointer, no need to use the return)
      // prettier-ignore
      const originalCommandItems = this._userOriginalGridMenu && Array.isArray(this._userOriginalGridMenu.commandItems) ? this._userOriginalGridMenu.commandItems : [];
      this.sharedService.gridOptions.gridMenu.commandItems = [
        ...originalCommandItems,
        ...this.addGridMenuCustomCommands(originalCommandItems),
      ];
      this.extensionUtility.translateMenuItemsFromTitleKey(this._addonOptions?.commandItems || [], 'commandItems');
      this.extensionUtility.sortItems(this.sharedService.gridOptions.gridMenu.commandItems, 'positionOrder');
      this.translateTitleLabels(this.sharedService.gridOptions.gridMenu);
      this.translateTitleLabels(this._addonOptions);

      // translate all columns (including non-visible)
      this.extensionUtility.translateItems(this._columns, 'nameKey', 'name');
    }
  }

  translateTitleLabels(gridMenuOptions: GridMenu | null): void {
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
  protected addGridMenuCustomCommands(originalCommandItems: Array<GridMenuItem | 'divider'>): Array<GridMenuItem | 'divider'> {
    const backendApi = this.gridOptions.backendServiceApi || null;
    const gridMenuCommandItems: Array<GridMenuItem | 'divider'> = [];
    const gridOptions = this.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);
    const commandLabels = this._addonOptions?.commandLabels;
    const cmdExists = (commandName: string) =>
      originalCommandItems.some((item) => item !== 'divider' && 'command' in item && item.command === commandName);

    if (this._addonOptions && this.gridOptions) {
      // show grid menu: Unfreeze Columns/Rows
      if (!this._addonOptions.hideClearFrozenColumnsCommand) {
        const commandName = 'clear-pinning';
        if (!cmdExists(commandName)) {
          gridMenuCommandItems.push({
            iconCssClass: this._addonOptions.iconClearFrozenColumnsCommand || 'mdi mdi-pin-off-outline',
            _orgTitle: commandLabels?.clearFrozenColumnsCommand || '',
            titleKey: `${translationPrefix}${commandLabels?.clearFrozenColumnsCommandKey ?? 'CLEAR_PINNING'}`,
            disabled: false,
            command: commandName,
            positionOrder: 52,
          });
        }
      }

      if (this.gridOptions.enableFiltering && !this.sharedService.hideHeaderRowAfterPageLoad) {
        // show grid menu: Clear all Filters
        if (!this._addonOptions.hideClearAllFiltersCommand) {
          const commandName = 'clear-filter';
          if (!cmdExists(commandName)) {
            gridMenuCommandItems.push({
              iconCssClass: this._addonOptions.iconClearAllFiltersCommand || 'mdi mdi-filter-remove-outline',
              _orgTitle: commandLabels?.clearAllFiltersCommand || '',
              titleKey: `${translationPrefix}${commandLabels?.clearAllFiltersCommandKey ?? 'CLEAR_ALL_FILTERS'}`,
              disabled: false,
              command: commandName,
              positionOrder: 50,
            });
          }
        }

        // show grid menu: toggle filter row
        if (!this._addonOptions.hideToggleFilterCommand) {
          const commandName = 'toggle-filter';
          if (!cmdExists(commandName)) {
            gridMenuCommandItems.push({
              iconCssClass: this._addonOptions.iconToggleFilterCommand || 'mdi mdi-flip-vertical',
              _orgTitle: commandLabels?.toggleFilterCommand || '',
              titleKey: `${translationPrefix}${commandLabels?.toggleFilterCommandKey ?? 'TOGGLE_FILTER_ROW'}`,
              disabled: false,
              command: commandName,
              positionOrder: 53,
            });
          }
        }

        // show grid menu: refresh dataset
        if (backendApi && !this._addonOptions.hideRefreshDatasetCommand) {
          const commandName = 'refresh-dataset';
          if (!cmdExists(commandName)) {
            gridMenuCommandItems.push({
              iconCssClass: this._addonOptions.iconRefreshDatasetCommand || 'mdi mdi-sync',
              _orgTitle: commandLabels?.refreshDatasetCommand || '',
              titleKey: `${translationPrefix}${commandLabels?.refreshDatasetCommandKey ?? 'REFRESH_DATASET'}`,
              disabled: false,
              command: commandName,
              positionOrder: 58,
            });
          }
        }
      }

      // show grid menu: toggle dark mode
      if (!this._addonOptions.hideToggleDarkModeCommand) {
        const commandName = 'toggle-dark-mode';
        if (!cmdExists(commandName)) {
          gridMenuCommandItems.push({
            iconCssClass: this._addonOptions.iconToggleDarkModeCommand || 'mdi mdi-brightness-4',
            _orgTitle: commandLabels?.toggleDarkModeCommand || '',
            titleKey: `${translationPrefix}${commandLabels?.toggleDarkModeCommandKey ?? 'TOGGLE_DARK_MODE'}`,
            disabled: false,
            command: commandName,
            positionOrder: 54,
          });
        }
      }

      if (this.gridOptions.showPreHeaderPanel) {
        // show grid menu: toggle pre-header row
        if (!this._addonOptions.hideTogglePreHeaderCommand) {
          const commandName = 'toggle-preheader';
          if (!cmdExists(commandName)) {
            gridMenuCommandItems.push({
              iconCssClass: this._addonOptions.iconTogglePreHeaderCommand || 'mdi mdi-flip-vertical',
              _orgTitle: commandLabels?.togglePreHeaderCommand || '',
              titleKey: `${translationPrefix}${commandLabels?.togglePreHeaderCommandKey ?? 'TOGGLE_PRE_HEADER_ROW'}`,
              disabled: false,
              command: commandName,
              positionOrder: 53,
            });
          }
        }
      }

      if (this.gridOptions.enableSorting) {
        // show grid menu: Clear all Sorting
        if (!this._addonOptions.hideClearAllSortingCommand) {
          const commandName = 'clear-sorting';
          if (!cmdExists(commandName)) {
            gridMenuCommandItems.push({
              iconCssClass: this._addonOptions.iconClearAllSortingCommand || 'mdi mdi-sort-variant-off',
              _orgTitle: commandLabels?.clearAllSortingCommand || '',
              titleKey: `${translationPrefix}${commandLabels?.clearAllSortingCommandKey ?? 'CLEAR_ALL_SORTING'}`,
              disabled: false,
              command: commandName,
              positionOrder: 51,
            });
          }
        }
      }

      // show grid menu: Export to file
      if (this.gridOptions.enableTextExport && !this._addonOptions.hideExportCsvCommand) {
        const commandName = 'export-csv';
        if (!cmdExists(commandName)) {
          gridMenuCommandItems.push({
            iconCssClass: this._addonOptions.iconExportCsvCommand || 'mdi mdi-download',
            _orgTitle: commandLabels?.exportCsvCommand || '',
            titleKey: `${translationPrefix}${commandLabels?.exportCsvCommandKey ?? 'EXPORT_TO_CSV'}`,
            disabled: false,
            command: commandName,
            positionOrder: 55,
          });
        }
      }

      // show grid menu: Export to Excel
      if (this.gridOptions.enableExcelExport && !this._addonOptions.hideExportExcelCommand) {
        const commandName = 'export-excel';
        if (!cmdExists(commandName)) {
          gridMenuCommandItems.push({
            iconCssClass: this._addonOptions.iconExportExcelCommand || 'mdi mdi-file-excel-outline text-success',
            _orgTitle: commandLabels?.exportExcelCommand || '',
            titleKey: `${translationPrefix}${commandLabels?.exportExcelCommandKey ?? 'EXPORT_TO_EXCEL'}`,
            disabled: false,
            command: commandName,
            positionOrder: 56,
          });
        }
      }

      // show grid menu: export to text file as tab delimited
      if (this.gridOptions.enableTextExport && !this._addonOptions.hideExportTextDelimitedCommand) {
        const commandName = 'export-text-delimited';
        if (!cmdExists(commandName)) {
          gridMenuCommandItems.push({
            iconCssClass: this._addonOptions.iconExportTextDelimitedCommand || 'mdi mdi-download',
            _orgTitle: commandLabels?.exportTextDelimitedCommand || '',
            titleKey: `${translationPrefix}${commandLabels?.exportTextDelimitedCommandKey ?? 'EXPORT_TO_TAB_DELIMITED'}`,
            disabled: false,
            command: commandName,
            positionOrder: 57,
          });
        }
      }

      // add the custom "Commands" title if there are any commands
      const commandItems = this._addonOptions?.commandItems || [];
      if (
        (Array.isArray(gridMenuCommandItems) && gridMenuCommandItems.length > 0) ||
        (Array.isArray(commandItems) && commandItems.length > 0)
      ) {
        this._addonOptions.commandTitle ||= this.extensionUtility.getPickerTitleOutputString('commandTitle', 'gridMenu');
      }
    }

    return gridMenuCommandItems;
  }

  /**
   * Execute the Grid Menu Custom command callback that was triggered by the onCommand subscribe
   * These are the default internal custom commands
   * @param event
   * @param GridMenuItem args
   */
  protected executeGridMenuInternalCustomCommands(_e: Event, args: GridMenuItem): void {
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
              format: 'csv',
            });
          } else {
            console.error(
              `[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu. Example:: this.gridOptions = { enableTextExport: true, externalResources: [new TextExportService()] };`
            );
          }
          break;
        case 'export-excel':
          const excelService: ExcelExportService = registeredResources.find((service: any) => service.className === 'ExcelExportService');
          if (excelService?.exportToExcel) {
            excelService.exportToExcel();
          } else {
            console.error(
              `[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Grid Menu. Example:: this.gridOptions = { enableExcelExport: true, externalResources: [new ExcelExportService()] };`
            );
          }
          break;
        case 'export-text-delimited':
          const exportTxtService: TextExportService = registeredResources.find((service: any) => service.className === 'TextExportService');
          if (exportTxtService?.exportToFile) {
            exportTxtService.exportToFile({
              delimiter: DelimiterType.tab,
              format: 'txt',
            });
          } else {
            console.error(
              `[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Grid Menu. Example:: this.gridOptions = { enableTextExport: true, externalResources: [new TextExportService()] };`
            );
          }
          break;
        case 'toggle-dark-mode':
          const currentDarkMode = this.sharedService.gridOptions.darkMode;
          this.grid.setOptions({ darkMode: !currentDarkMode });
          this.sharedService.gridOptions.darkMode = !currentDarkMode;
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
      commandTitle: undefined,
      columnTitle: this.extensionUtility.getPickerTitleOutputString('columnTitle', 'gridMenu'),
      forceFitTitle: this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'gridMenu'),
      syncResizeTitle: this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'gridMenu'),
      iconCssClass: 'mdi mdi-menu',
      menuWidth: 18,
      commandItems: [],
      hideClearAllFiltersCommand: false,
      hideRefreshDatasetCommand: false,
      hideToggleFilterCommand: false,
    };
  }

  /** Mouse down handler when clicking anywhere in the DOM body */
  protected handleBodyMouseDown(e: DOMEvent<HTMLElement>): void {
    if (this.menuElement) {
      let isMenuClicked = false;
      const parentMenuElm = e.target.closest(`.${this.menuCssClass}`);

      // did we click inside the menu or any of its sub-menu(s)
      if (this.menuElement.contains(e.target) || parentMenuElm) {
        isMenuClicked = true;
      }

      if (
        (this._isMenuOpen && this.menuElement !== e.target && !isMenuClicked && !e.defaultPrevented) ||
        (e.target.className === 'close' && parentMenuElm)
      ) {
        this.hideMenu(e);
      }
    }
  }

  protected handleMenuItemCommandClick(
    event: DOMMouseOrTouchEvent<HTMLDivElement>,
    _type: MenuType,
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    level = 0
  ): void {
    if (item !== 'divider' && !item.disabled && !(item as GridMenuItem).divider) {
      const command = (item as GridMenuItem).command || '';

      if (command && !(item as GridMenuItem).commandItems) {
        const callbackArgs = {
          grid: this.grid,
          command: (item as GridMenuItem).command,
          item,
          allColumns: this.columns,
          visibleColumns: this.getVisibleColumns(),
        } as GridMenuCommandItemCallbackArgs;

        // execute Grid Menu callback with command,
        // we'll also execute optional user defined onCommand callback when provided
        this.executeGridMenuInternalCustomCommands(event, callbackArgs);
        this.pubSubService.publish('onGridMenuCommand', callbackArgs);
        if (typeof this._addonOptions?.onCommand === 'function') {
          this._addonOptions.onCommand(event, callbackArgs);
        }
        this.onCommand.notify(callbackArgs, null, this);

        // execute action callback when defined
        if (typeof item.action === 'function') {
          (item as GridMenuItem).action!.call(this, event, callbackArgs);
        }

        // does the user want to leave open the Grid Menu after executing a command?
        if (!this._addonOptions?.leaveOpen && !event.defaultPrevented) {
          this.hideMenu(event);
        }

        // Stop propagation so that it doesn't register as a header click event.
        event.preventDefault();
        event.stopPropagation();
      } else if ((item as GridMenuItem).commandItems) {
        this.repositionSubMenu(event, item, level);
      }
    }
  }

  protected handleMenuItemMouseOver(
    e: DOMMouseOrTouchEvent<HTMLElement>,
    _type: MenuType,
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    level = 0
  ): void {
    if (item !== 'divider' && !item.disabled && !(item as GridMenuItem).divider) {
      if ((item as GridMenuItem).commandItems) {
        this.repositionSubMenu(e, item, level);
      } else if (level === 0) {
        this.disposeSubMenus();
      }
    }
  }

  /** Re/Create Command List by adding title, close & list of commands */
  recreateCommandList(
    commandItems: Array<GridMenuItem | 'divider'>,
    menuElm: HTMLElement,
    callbackArgs: GridMenuEventWithElementCallbackArgs,
    item?: ExtractMenuType<ExtendableItemTypes, MenuType>
  ): HTMLDivElement | null {
    // -- Command List section
    const level = callbackArgs.level || 0;
    if (commandItems.length > 0) {
      const commandMenuElm = createDomElement('div', { className: `${this._menuCssPrefix}-command-list`, role: 'menu' }, menuElm);
      if (level === 0) {
        this.populateCommandOrOptionTitle('command', this.addonOptions, commandMenuElm, level);
        // prettier-ignore
        const commandMenuHeaderElm = menuElm.querySelector<HTMLDivElement>(`.slick-command-header`) ?? createDomElement('div', { className: 'slick-command-header' });
        commandMenuHeaderElm.classList.add('with-close');
        addCloseButtomElement.call(this, commandMenuHeaderElm);
        commandMenuElm.appendChild(commandMenuHeaderElm);
      }

      // when creating sub-menu also add its sub-menu title when exists
      if (item && level > 0) {
        this.addSubMenuTitleWhenExists(item as ExtractMenuType<ExtendableItemTypes, MenuType>, commandMenuElm); // add sub-menu title when exists
      }

      this.populateCommandOrOptionItems(
        'command',
        this._addonOptions!,
        commandMenuElm,
        commandItems as Array<ExtractMenuType<ExtendableItemTypes, MenuType>>,
        callbackArgs,
        this.handleMenuItemCommandClick,
        this.handleMenuItemMouseOver
      );
      return commandMenuElm;
    }
    return null;
  }

  protected repositionSubMenu(
    e: DOMMouseOrTouchEvent<HTMLElement>,
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    level: number
  ): void {
    // creating sub-menu, we'll also pass level & the item object since we might have "subMenuTitle" to show
    const commandItems = (item as GridMenuItem)?.commandItems || [];
    const subMenuElm = this.createCommandMenu(commandItems as Array<GridMenuItem | 'divider'>, level + 1, item);
    subMenuElm.style.display = 'block';
    document.body.appendChild(subMenuElm);
    this.repositionMenu(e, subMenuElm, this._gridMenuButtonElm, this._addonOptions);
  }
}
