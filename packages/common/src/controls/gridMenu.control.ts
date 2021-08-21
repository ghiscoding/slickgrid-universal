import {
  Column,
  DOMEvent,
  GetSlickEventType,
  GridMenu,
  GridMenuCommandItemCallbackArgs,
  GridMenuEventWithElementCallbackArgs,
  GridMenuItem,
  GridMenuOnColumnsChangedCallbackArgs,
  GridMenuOption,
  GridOption,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import { DelimiterType, FileType } from '../enums';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { emptyElement, getHtmlElementOffset, getTranslationPrefix, sanitizeTextByAvailableSanitizer } from '../services';
import { BindingEventService } from '../services/bindingEvent.service';
import { ExcelExportService } from '../services/excelExport.service';
import { FilterService } from '../services/filter.service';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';
import { SortService } from '../services/sort.service';
import { TextExportService } from '../services/textExport.service';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

/**
 * A control to add a Grid Menu (hambuger menu on top-right of the grid)
 * @class GridMenuControl
 * @constructor
 */
export class GridMenuControl {
  protected _areVisibleColumnDifferent = false;
  protected _bindEventService: BindingEventService;
  protected _columns: Column[] = [];
  protected _columnCheckboxes: HTMLInputElement[] = [];
  protected _columnTitleElm!: HTMLDivElement;
  protected _customMenuElm!: HTMLDivElement;
  protected _customTitleElm?: HTMLDivElement;
  protected _eventHandler!: SlickEventHandler;
  protected _gridMenuButtonElm!: HTMLButtonElement;
  protected _gridUid = '';
  protected _headerElm?: HTMLDivElement | null;
  protected _isMenuOpen = false;
  protected _listElm!: HTMLSpanElement;
  protected _gridMenuElm!: HTMLDivElement;
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
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
    this._columns = this.sharedService.allColumns ?? [];
    this._gridUid = this.grid?.getUID?.() ?? '';

    this.initEventHandlers();
    this.init();
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get columns(): Column[] {
    return this._columns;
  }
  set columns(newColumns: Column[]) {
    this._columns = newColumns;
  }

  get controlOptions(): GridMenu {
    return this.gridOptions.gridMenu || {};
  }
  set controlOptions(controlOptions: GridMenu) {
    this.sharedService.gridOptions.gridMenu = controlOptions;
  }

  get gridOptions(): GridOption {
    return this.sharedService.gridOptions ?? {};
  }

  get grid(): SlickGrid {
    return this.sharedService.slickGrid;
  }

  get menuElement(): HTMLDivElement {
    return this._gridMenuElm;
  }

  initEventHandlers() {
    // when grid columns are reordered then we also need to update/resync our picker column in the same order
    const onColumnsReorderedHandler = this.grid.onColumnsReordered;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onColumnsReorderedHandler>>).subscribe(onColumnsReorderedHandler, this.updateColumnOrder.bind(this));

    // subscribe to the grid, when it's destroyed, we should also destroy the Grid Menu
    const onBeforeDestroyHandler = this.grid.onBeforeDestroy;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeDestroyHandler>>).subscribe(onBeforeDestroyHandler, this.dispose.bind(this));

    // when a grid optionally changes from a regular grid to a frozen grid, we need to destroy & recreate the grid menu
    // we do this change because the Grid Menu is on the left container for a regular grid, it should however be displayed on the right container for a frozen grid
    const onSetOptionsHandler = this.grid.onSetOptions;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onSetOptionsHandler>>).subscribe(onSetOptionsHandler, (_e, args) => {
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
    this._userOriginalGridMenu = { ...this.controlOptions };
    this.controlOptions = { ...this._defaults, ...this.getDefaultGridMenuOptions(), ...this.controlOptions };

    // merge original user grid menu items with internal items
    // then sort all Grid Menu Custom Items (sorted by pointer, no need to use the return)
    const originalCustomItems = this._userOriginalGridMenu && Array.isArray(this._userOriginalGridMenu.customItems) ? this._userOriginalGridMenu.customItems : [];
    this.controlOptions.customItems = [...originalCustomItems, ...this.addGridMenuCustomCommands(originalCustomItems)];
    this.extensionUtility.translateItems(this.controlOptions.customItems, 'titleKey', 'title');
    this.extensionUtility.sortItems(this.controlOptions.customItems, 'positionOrder');

    // create the Grid Menu DOM element
    this.createGridMenu();
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose() {
    this.deleteMenu();
    this._eventHandler.unsubscribeAll();
    this._bindEventService.unbindAll();
    this._listElm?.remove?.();
    this._gridMenuElm?.remove?.();
  }

  deleteMenu() {
    this._bindEventService.unbindAll();
    const gridMenuElm = document.querySelector<HTMLDivElement>(`div.slick-gridmenu.${this._gridUid}`);
    if (gridMenuElm) {
      gridMenuElm.style.visibility = 'hidden';
    }
    this._gridMenuButtonElm?.remove();
    this._gridMenuElm?.remove();
    this._customMenuElm?.remove();
    if (this._headerElm) {
      this._headerElm.style.width = '100%'; // put back original width
    }
  }

  createColumnPickerContainer() {
    // user could pass a title on top of the columns list
    if (this.controlOptions?.columnTitle) {
      this._columnTitleElm = document.createElement('div');
      this._columnTitleElm.className = 'title';
      this._columnTitleElm.textContent = this.controlOptions?.columnTitle ?? this._defaults.columnTitle;
      this._gridMenuElm.appendChild(this._columnTitleElm);
    }

    this._listElm = document.createElement('span');
    this._listElm.className = 'slick-gridmenu-list';

    // update all columns on any of the column title button click from column picker
    this._bindEventService.bind(this._gridMenuElm, 'click', this.handleColumnPickerItemClick.bind(this) as EventListener);
  }

  createGridMenu() {
    const gridMenuWidth = this.controlOptions?.menuWidth ?? this._defaults.menuWidth;
    const headerSide = (this.gridOptions.hasOwnProperty('frozenColumn') && this.gridOptions.frozenColumn! >= 0) ? 'right' : 'left';
    this._headerElm = document.querySelector<HTMLDivElement>(`.${this._gridUid} .slick-header-${headerSide}`);

    if (this._headerElm) {
      // resize the header row to include the hamburger menu icon
      this._headerElm.style.width = `calc(100% - ${gridMenuWidth}px)`;

      // if header row is enabled, we also need to resize its width
      const enableResizeHeaderRow = (this.controlOptions && this.controlOptions.resizeOnShowHeaderRow !== undefined) ? this.controlOptions.resizeOnShowHeaderRow : this._defaults.resizeOnShowHeaderRow;
      if (enableResizeHeaderRow && this.gridOptions.showHeaderRow) {
        const headerRowElm = document.querySelector<HTMLDivElement>(`.${this._gridUid} .slick-headerrow`);
        if (headerRowElm) {
          headerRowElm.style.width = `calc(100% - ${gridMenuWidth}px)`;
        }
      }

      const showButton = (this.controlOptions && this.controlOptions.showButton !== undefined) ? this.controlOptions.showButton : this._defaults.showButton;
      if (showButton) {
        this._gridMenuButtonElm = document.createElement('button');
        this._gridMenuButtonElm.className = 'slick-gridmenu-button';
        if (this.controlOptions && this.controlOptions.iconCssClass) {
          this._gridMenuButtonElm.classList.add(...this.controlOptions.iconCssClass.split(' '));
        } else {
          const iconImage = (this.controlOptions && this.controlOptions.iconImage) ? this.controlOptions.iconImage : '';
          const iconImageElm = document.createElement('img');
          iconImageElm.src = iconImage;
          this._gridMenuButtonElm.appendChild(iconImageElm);
        }
        this._headerElm.parentNode?.prepend(this._gridMenuButtonElm);

        // show the Grid Menu when hamburger menu is clicked
        this._bindEventService.bind(this._gridMenuButtonElm, 'click', this.showGridMenu.bind(this) as EventListener);
      }

      this._gridUid = this.grid.getUID() ?? '';
      this.gridOptions.gridMenu = { ...this._defaults, ...this.controlOptions };

      // localization support for the picker
      this.translateTitleLabels();

      this._gridMenuElm = document.createElement('div');
      this._gridMenuElm.classList.add('slick-gridmenu', this._gridUid);
      this._gridMenuElm.style.visibility = 'hidden';

      const closePickerButtonElm = document.createElement('button');
      closePickerButtonElm.className = 'close';
      closePickerButtonElm.type = 'button';
      closePickerButtonElm.dataset.dismiss = 'slick-gridmenu';
      closePickerButtonElm.setAttribute('aria-label', 'Close');

      const closeSpanElm = document.createElement('span');
      closeSpanElm.className = 'close';
      closeSpanElm.innerHTML = '&times;';
      closeSpanElm.setAttribute('aria-hidden', 'true');

      this._customMenuElm = document.createElement('div');
      this._customMenuElm.className = 'slick-gridmenu-custom';

      closePickerButtonElm.appendChild(closeSpanElm);
      this._gridMenuElm.appendChild(closePickerButtonElm);
      this._gridMenuElm.appendChild(this._customMenuElm);

      this.populateCustomMenus(this.controlOptions, this._customMenuElm);
      this.createColumnPickerContainer();

      document.body.appendChild(this._gridMenuElm);

      // Hide the menu on outside click.
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
   * When clicking an input checkboxes from the column picker list to show/hide a column (or from the picker extra commands like forcefit columns)
   * @param event - input checkbox event
   * @returns
   */
  handleColumnPickerItemClick(event: DOMEvent<HTMLInputElement>) {
    if (event.target.dataset.option === 'autoresize') {
      // when calling setOptions, it will resize with ALL Columns (even the hidden ones)
      // we can avoid this problem by keeping a reference to the visibleColumns before setOptions and then setColumns after
      const previousVisibleColumns = this.getVisibleColumns();
      const isChecked = event.target.checked;
      this.grid.setOptions({ forceFitColumns: isChecked });
      this.grid.setColumns(previousVisibleColumns);
      return;
    }

    if (event.target.dataset.option === 'syncresize') {
      this.grid.setOptions({ syncColumnCellResize: !!(event.target.checked) });
      return;
    }

    if (event.target.type === 'checkbox') {
      this._areVisibleColumnDifferent = true;
      const isChecked = event.target.checked;
      const columnId = event.target.dataset.columnid || '';
      const visibleColumns: Column[] = [];
      this._columnCheckboxes.forEach((columnCheckbox: HTMLInputElement, idx: number) => {
        if (columnCheckbox.checked) {
          visibleColumns.push(this.columns[idx]);
        }
      });

      if (!visibleColumns.length) {
        event.target.checked = true;
        return;
      }

      this.grid.setColumns(visibleColumns);
      this.handleOnColumnsChanged(event, {
        columnId,
        showing: isChecked,
        allColumns: this.columns,
        visibleColumns,
        columns: visibleColumns,
        grid: this.grid
      });
    }
  }

  handleMenuCustomItemClick(event: Event, item: GridMenuItem) {
    if (item && item.command && !item.disabled && !item.divider) {
      const callbackArgs = {
        grid: this.grid,
        command: item.command,
        item,
        allColumns: this.columns,
        visibleColumns: this.getVisibleColumns()
      } as GridMenuCommandItemCallbackArgs;

      // execute Grid Menu callback with command,
      // we'll also execute optional user defined onCommand callback when provided
      this.executeGridMenuInternalCustomCommands(event, callbackArgs);
      this.pubSubService.publish('gridMenu:onCommand', callbackArgs);
      if (typeof this.controlOptions?.onCommand === 'function') {
        this.controlOptions.onCommand(event, callbackArgs);
      }

      // execute action callback when defined
      if (typeof item.action === 'function') {
        item.action.call(this, event, callbackArgs);
      }
    }

    // does the user want to leave open the Grid Menu after executing a command?
    if (!this.controlOptions.leaveOpen && !event.defaultPrevented) {
      this.hideMenu(event);
    }

    // Stop propagation so that it doesn't register as a header click event.
    event.preventDefault();
    event.stopPropagation();
  }

  /** Mouse down handler when clicking anywhere in the DOM body */
  handleBodyMouseDown(event: DOMEvent<HTMLDivElement>) {
    if ((this._gridMenuElm !== event.target && !this._gridMenuElm.contains(event.target) && this._isMenuOpen) || event.target.className === 'close') {
      this.hideMenu(event);
    }
  }

  /**
   * Hide the Grid Menu but only if it does detect as open prior to executing anything.
   * @param event
   * @returns
   */
  hideMenu(event: Event) {
    if (this._gridMenuElm?.style?.visibility === 'visible') {
      const callbackArgs = {
        grid: this.grid,
        menu: this._gridMenuElm,
        allColumns: this.columns,
        visibleColumns: this.getVisibleColumns()
      } as GridMenuEventWithElementCallbackArgs;

      // execute optional callback method defined by the user, if it returns false then we won't go further neither close the menu
      this.pubSubService.publish('gridMenu:onMenuClose', callbackArgs);
      if (typeof this.controlOptions?.onMenuClose === 'function' && this.controlOptions.onMenuClose(event, callbackArgs) === false) {
        return;
      }

      this._gridMenuElm.style.visibility = 'hidden';
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

  /**
   * Create and populate the Custom Menu Items and add them to the top of the DOM element (before the column picker)
   * @param {GridMenu} options - grid menu options
   * @param {HTMLDivElement} customMenuElm - custom menu container DOM element
   */
  populateCustomMenus(options: GridMenu, customMenuElm: HTMLDivElement) {
    if (Array.isArray(options?.customItems)) {
      // user could pass a title on top of the custom section
      if (this.controlOptions?.customTitle) {
        this._customTitleElm = document.createElement('div');
        this._customTitleElm.className = 'title';
        this._customTitleElm.textContent = this.controlOptions.customTitle;
        customMenuElm.appendChild(this._customTitleElm);
      }

      for (const item of options.customItems) {
        const callbackArgs = {
          grid: this.grid,
          menu: this._gridMenuElm,
          columns: this.columns,
          allColumns: this.getAllColumns(),
          visibleColumns: this.getVisibleColumns()
        } as GridMenuEventWithElementCallbackArgs;

        // run each override functions to know if the item is visible and usable
        let isItemVisible = true;
        let isItemUsable = true;
        if (typeof item === 'object') {
          isItemVisible = this.runOverrideFunctionWhenExists(item.itemVisibilityOverride, callbackArgs);
          isItemUsable = this.runOverrideFunctionWhenExists(item.itemUsabilityOverride, callbackArgs);
        }

        // if the result is not visible then there's no need to go further
        if (!isItemVisible) {
          continue;
        }

        // when the override is defined, we need to use its result to update the disabled property
        // so that "handleMenuItemCommandClick" has the correct flag and won't trigger a command clicked event
        if (typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'itemUsabilityOverride')) {
          item.disabled = isItemUsable ? false : true;
        }

        const liElm = document.createElement('li');
        liElm.className = 'slick-gridmenu-item';
        liElm.dataset.command = typeof item === 'object' && item.command || '';
        customMenuElm.appendChild(liElm);

        if ((typeof item === 'object' && item.divider) || item === 'divider') {
          liElm.classList.add('slick-gridmenu-item-divider');
          continue;
        }

        if (item.disabled) {
          liElm.classList.add('slick-gridmenu-item-disabled');
        }

        if (item.hidden) {
          liElm.classList.add('slick-gridmenu-item-hidden');
        }

        if (item.cssClass) {
          liElm.classList.add(...item.cssClass.split(' '));
        }

        if (item.tooltip) {
          liElm.title = item.tooltip;
        }

        const iconElm = document.createElement('div');
        iconElm.className = 'slick-gridmenu-icon';
        liElm.appendChild(iconElm);

        if (item.iconCssClass) {
          iconElm.classList.add(...item.iconCssClass.split(' '));
        }

        if (item.iconImage) {
          console.warn('[Slickgrid-Universal] The "iconImage" property of a Grid Menu item is no deprecated and will be removed in future version, consider using "iconCssClass" instead.');
          iconElm.style.backgroundImage = `url(${item.iconImage})`;
        }

        const textElm = document.createElement('span');
        textElm.className = 'slick-gridmenu-content';
        textElm.textContent = typeof item === 'object' && item.title || '';
        liElm.appendChild(textElm);

        if (item.textCssClass) {
          textElm.classList.add(...item.textCssClass.split(' '));
        }
        // execute command on menu item clicked
        this._bindEventService.bind(liElm, 'click', (e) => this.handleMenuCustomItemClick(e, item));
      }
    }
  }

  recreateGridMenu() {
    this.deleteMenu();
    this.init();
  }

  populateColumnPicker(e: MouseEvent, controlOptions: GridMenu) {
    for (const column of this.columns) {
      const columnId = column.id;
      const columnLiElm = document.createElement('li');
      columnLiElm.className = column.excludeFromColumnPicker ? 'hidden' : '';

      const colInputElm = document.createElement('input');
      colInputElm.type = 'checkbox';
      colInputElm.id = `${this._gridUid}-gridmenu-colpicker-${columnId}`;
      colInputElm.dataset.columnid = `${columnId}`;
      const colIndex = this.grid.getColumnIndex(columnId);
      if (colIndex >= 0) {
        colInputElm.checked = true;
      }
      columnLiElm.appendChild(colInputElm);
      this._columnCheckboxes.push(colInputElm);

      const headerColumnValueExtractorFn = typeof controlOptions?.headerColumnValueExtractor === 'function' ? controlOptions.headerColumnValueExtractor : this._defaults.headerColumnValueExtractor;
      const columnLabel = headerColumnValueExtractorFn!(column, this.gridOptions);

      const labelElm = document.createElement('label');
      labelElm.htmlFor = `${this._gridUid}-gridmenu-colpicker-${columnId}`;
      labelElm.innerHTML = sanitizeTextByAvailableSanitizer(this.gridOptions, columnLabel);
      columnLiElm.appendChild(labelElm);
      this._listElm.appendChild(columnLiElm);
    }

    if (!controlOptions.hideForceFitButton || !controlOptions.hideSyncResizeButton) {
      this._listElm.appendChild(document.createElement('hr'));
    }

    if (!(controlOptions?.hideForceFitButton)) {
      const forceFitTitle = controlOptions?.forceFitTitle;

      const fitInputElm = document.createElement('input');
      fitInputElm.type = 'checkbox';
      fitInputElm.id = `${this._gridUid}-gridmenu-colpicker-forcefit`;
      fitInputElm.dataset.option = 'autoresize';

      const labelElm = document.createElement('label');
      labelElm.htmlFor = `${this._gridUid}-gridmenu-colpicker-forcefit`;
      labelElm.textContent = forceFitTitle ?? '';
      if (this.gridOptions.forceFitColumns) {
        fitInputElm.checked = true;
      }

      const fitLiElm = document.createElement('li');
      fitLiElm.appendChild(fitInputElm);
      fitLiElm.appendChild(labelElm);
      this._listElm.appendChild(fitLiElm);
    }

    if (!(controlOptions?.hideSyncResizeButton)) {
      const syncResizeTitle = (controlOptions?.syncResizeTitle) || controlOptions.syncResizeTitle;
      const labelElm = document.createElement('label');
      labelElm.htmlFor = `${this._gridUid}-gridmenu-colpicker-syncresize`;
      labelElm.textContent = syncResizeTitle ?? '';

      const syncInputElm = document.createElement('input');
      syncInputElm.type = 'checkbox';
      syncInputElm.id = `${this._gridUid}-gridmenu-colpicker-syncresize`;
      syncInputElm.dataset.option = 'syncresize';
      if (this.gridOptions.syncColumnCellResize) {
        syncInputElm.checked = true;
      }

      const syncLiElm = document.createElement('li');
      syncLiElm.appendChild(syncInputElm);
      syncLiElm.appendChild(labelElm);
      this._listElm.appendChild(syncLiElm);
    }

    let buttonElm = (e.target as HTMLButtonElement).nodeName === 'BUTTON' ? (e.target as HTMLButtonElement) : (e.target as HTMLElement).querySelector('button') as HTMLButtonElement; // get button element
    if (!buttonElm) {
      buttonElm = (e.target as HTMLElement).parentElement as HTMLButtonElement; // external grid menu might fall in this last case if wrapped in a span/div
    }
    const menuIconOffset = getHtmlElementOffset(buttonElm as HTMLButtonElement);
    const buttonComptStyle = getComputedStyle(buttonElm as HTMLButtonElement);
    const buttonWidth = parseInt(buttonComptStyle?.width ?? this._defaults?.menuWidth, 10);

    const menuWidth = this._gridMenuElm?.offsetWidth ?? 0;
    const contentMinWidth = controlOptions?.contentMinWidth ?? this._defaults.contentMinWidth ?? 0;
    const currentMenuWidth = ((contentMinWidth > menuWidth) ? contentMinWidth : (menuWidth)) || 0;
    const nextPositionTop = menuIconOffset?.bottom ?? 0;
    const nextPositionLeft = menuIconOffset?.right ?? 0;
    const menuMarginBottom = ((controlOptions?.marginBottom !== undefined) ? controlOptions.marginBottom : this._defaults.marginBottom) || 0;
    const calculatedLeftPosition = controlOptions?.alignDropSide === 'left' ? nextPositionLeft - buttonWidth : nextPositionLeft - currentMenuWidth;

    this._gridMenuElm.style.top = `${nextPositionTop}px`;
    this._gridMenuElm.style.left = `${calculatedLeftPosition}px`;
    this._gridMenuElm.classList.add(controlOptions?.alignDropSide === 'left' ? 'dropleft' : 'dropright');
    this._gridMenuElm.appendChild(this._listElm);

    if (contentMinWidth! > 0) {
      this._gridMenuElm.style.minWidth = `${contentMinWidth}px`;
    }

    // set 'height' when defined OR ELSE use the 'max-height' with available window size and optional margin bottom
    if (controlOptions?.height !== undefined) {
      this._gridMenuElm.style.height = `${controlOptions.height}px`;
    } else {
      this._gridMenuElm.style.maxHeight = `${window.innerHeight - e.clientY - menuMarginBottom}px`;
    }

    this._gridMenuElm.style.visibility = 'visible';
    this._gridMenuElm.appendChild(this._listElm);
    this._isMenuOpen = true;
  }

  showGridMenu(e: MouseEvent, options?: GridMenuOption) {
    e.preventDefault();

    // empty both the picker list & the command list
    emptyElement(this._listElm);
    emptyElement(this._customMenuElm);

    const controlOptions: GridMenu = { ...this.controlOptions, ...options }; // merge optional picker option
    this.populateCustomMenus(controlOptions, this._customMenuElm);
    this.updateColumnOrder();
    this._columnCheckboxes = [];

    const callbackArgs = {
      grid: this.grid,
      menu: this._gridMenuElm,
      allColumns: this.columns,
      visibleColumns: this.getVisibleColumns()
    } as GridMenuEventWithElementCallbackArgs;

    // run the override function (when defined), if the result is false then we won't go further
    if (controlOptions && !this.runOverrideFunctionWhenExists(controlOptions.menuUsabilityOverride, callbackArgs)) {
      return;
    }

    // execute optional callback method defined by the user, if it returns false then we won't go further and not open the grid menu
    if (typeof e.stopPropagation === 'function') {
      this.pubSubService.publish('gridMenu:onBeforeMenuShow', callbackArgs);
      if (typeof controlOptions?.onBeforeMenuShow === 'function' && controlOptions.onBeforeMenuShow(e, callbackArgs) === false) {
        return;
      }
    }

    // load the column & create column picker list
    this.populateColumnPicker(e, controlOptions);

    // execute optional callback method defined by the user
    this.pubSubService.publish('gridMenu:onAfterMenuShow', callbackArgs);
    if (typeof controlOptions?.onAfterMenuShow === 'function') {
      controlOptions.onAfterMenuShow(e, callbackArgs);
    }
  }

  updateColumnOrder() {
    // Because columns can be reordered, we have to update the `columns` to reflect the new order, however we can't just take `grid.getColumns()`,
    // as it does not include columns currently hidden by the picker. We create a new `columns` structure by leaving currently-hidden
    // columns in their original ordinal position and interleaving the results of the current column sort.
    const current = this.grid.getColumns().slice(0);
    const ordered = new Array(this.columns.length);

    for (let i = 0; i < ordered.length; i++) {
      const columnIdx = this.grid.getColumnIndex(this.columns[i].id);
      if (columnIdx === undefined) {
        // if the column doesn't return a value from getColumnIndex, it is hidden. Leave it in this position.
        ordered[i] = this.columns[i];
      } else {
        // otherwise, grab the next visible column.
        ordered[i] = current.shift();
      }
    }

    // the new set of ordered columns becomes the new set of column picker columns
    this._columns = ordered;
  }

  /** Update the Titles of each sections (command, customTitle, ...) */
  updateAllTitles(options: GridMenuOption) {
    if (this._columnTitleElm?.textContent && options.customTitle) {
      this._columnTitleElm.textContent = options.customTitle;
    }
    if (this._columnTitleElm?.textContent && options.columnTitle) {
      this._columnTitleElm.textContent = options.columnTitle;
    }
  }

  /** Translate the Grid Menu titles and column picker */
  translateGridMenu() {
    // update the properties by pointers, that is the only way to get Grid Menu Control to see the new values
    // we also need to call the control init so that it takes the new Grid object with latest values
    if (this.controlOptions) {
      this.controlOptions.customItems = [];
      this.emptyGridMenuTitles();

      // merge original user grid menu items with internal items
      // then sort all Grid Menu Custom Items (sorted by pointer, no need to use the return)
      const originalCustomItems = this._userOriginalGridMenu && Array.isArray(this._userOriginalGridMenu.customItems) ? this._userOriginalGridMenu.customItems : [];
      this.controlOptions.customItems = [...originalCustomItems, ...this.addGridMenuCustomCommands(originalCustomItems)];
      this.extensionUtility.translateItems(this.controlOptions.customItems, 'titleKey', 'title');
      this.extensionUtility.sortItems(this.controlOptions.customItems, 'positionOrder');
      this.translateTitleLabels();

      // translate all columns (including non-visible)
      this.extensionUtility.translateItems(this._columns, 'nameKey', 'name');

      // update the Titles of each sections (command, customTitle, ...)
      this.updateAllTitles(this.controlOptions);
    }
  }

  translateTitleLabels() {
    this.controlOptions.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'gridMenu');
    this.controlOptions.forceFitTitle = this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'gridMenu');
    this.controlOptions.syncResizeTitle = this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'gridMenu');
  }

  // --
  // protected functions
  // ------------------

  protected emptyGridMenuTitles() {
    if (this.controlOptions) {
      this.controlOptions.customTitle = '';
      this.controlOptions.columnTitle = '';
      this.controlOptions.forceFitTitle = '';
      this.controlOptions.syncResizeTitle = '';
    }
  }

  /** Create Grid Menu with Custom Commands if user has enabled Filters and/or uses a Backend Service (OData, GraphQL) */
  protected addGridMenuCustomCommands(originalCustomItems: Array<GridMenuItem | 'divider'>) {
    const backendApi = this.gridOptions.backendServiceApi || null;
    const gridMenuCustomItems: Array<GridMenuItem | 'divider'> = [];
    const gridOptions = this.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);
    const commandLabels = this.controlOptions?.commandLabels;

    // show grid menu: Unfreeze Columns/Rows
    if (this.gridOptions && this.controlOptions && !this.controlOptions.hideClearFrozenColumnsCommand) {
      const commandName = 'clear-pinning';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.controlOptions.iconClearFrozenColumnsCommand || 'fa fa-times',
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
      if (this.gridOptions && this.controlOptions && !this.controlOptions.hideClearAllFiltersCommand) {
        const commandName = 'clear-filter';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.controlOptions.iconClearAllFiltersCommand || 'fa fa-filter text-danger',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.clearAllFiltersCommandKey}`, 'TEXT_CLEAR_ALL_FILTERS', commandLabels?.clearAllFiltersCommand),
              disabled: false,
              command: commandName,
              positionOrder: 50
            }
          );
        }
      }

      // show grid menu: toggle filter row
      if (this.gridOptions && this.controlOptions && !this.controlOptions.hideToggleFilterCommand) {
        const commandName = 'toggle-filter';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.controlOptions.iconToggleFilterCommand || 'fa fa-random',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.toggleFilterCommandKey}`, 'TEXT_TOGGLE_FILTER_ROW', commandLabels?.toggleFilterCommand),
              disabled: false,
              command: commandName,
              positionOrder: 53
            }
          );
        }
      }

      // show grid menu: refresh dataset
      if (backendApi && this.gridOptions && this.controlOptions && !this.controlOptions.hideRefreshDatasetCommand) {
        const commandName = 'refresh-dataset';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.controlOptions.iconRefreshDatasetCommand || 'fa fa-refresh',
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
      if (this.gridOptions && this.controlOptions && !this.controlOptions.hideTogglePreHeaderCommand) {
        const commandName = 'toggle-preheader';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.controlOptions.iconTogglePreHeaderCommand || 'fa fa-random',
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
      if (this.gridOptions && this.controlOptions && !this.controlOptions.hideClearAllSortingCommand) {
        const commandName = 'clear-sorting';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          gridMenuCustomItems.push(
            {
              iconCssClass: this.controlOptions.iconClearAllSortingCommand || 'fa fa-unsorted text-danger',
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
    if ((this.gridOptions?.enableExport || this.gridOptions?.enableTextExport) && this.controlOptions && !this.controlOptions.hideExportCsvCommand) {
      const commandName = 'export-csv';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.controlOptions.iconExportCsvCommand || 'fa fa-download',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.exportCsvCommandKey}`, 'TEXT_EXPORT_TO_CSV', commandLabels?.exportCsvCommand),
            disabled: false,
            command: commandName,
            positionOrder: 54
          }
        );
      }
    }

    // show grid menu: Export to Excel
    if (this.gridOptions && this.gridOptions.enableExcelExport && this.controlOptions && !this.controlOptions.hideExportExcelCommand) {
      const commandName = 'export-excel';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.controlOptions.iconExportExcelCommand || 'fa fa-file-excel-o text-success',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.exportExcelCommandKey}`, 'TEXT_EXPORT_TO_EXCEL', commandLabels?.exportExcelCommand),
            disabled: false,
            command: commandName,
            positionOrder: 55
          }
        );
      }
    }

    // show grid menu: export to text file as tab delimited
    if ((this.gridOptions?.enableExport || this.gridOptions?.enableTextExport) && this.controlOptions && !this.controlOptions.hideExportTextDelimitedCommand) {
      const commandName = 'export-text-delimited';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        gridMenuCustomItems.push(
          {
            iconCssClass: this.controlOptions.iconExportTextDelimitedCommand || 'fa fa-download',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}${commandLabels?.exportTextDelimitedCommandKey}`, 'TEXT_EXPORT_TO_TAB_DELIMITED', commandLabels?.exportTextDelimitedCommand),
            disabled: false,
            command: commandName,
            positionOrder: 56
          }
        );
      }
    }

    // add the custom "Commands" title if there are any commands
    if (this.gridOptions && this.controlOptions && (Array.isArray(gridMenuCustomItems) && gridMenuCustomItems.length > 0 || (Array.isArray(this.controlOptions.customItems) && this.controlOptions.customItems.length > 0))) {
      this.controlOptions.customTitle = this.controlOptions.customTitle || this.extensionUtility.getPickerTitleOutputString('customTitle', 'gridMenu');
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

  protected handleOnColumnsChanged(e: DOMEvent<HTMLInputElement>, args: GridMenuOnColumnsChangedCallbackArgs) {
    // execute optional callback method defined by the user
    this.pubSubService.publish('gridMenu:onColumnsChanged', args);
    if (typeof this.controlOptions?.onColumnsChanged === 'function') {
      this.controlOptions.onColumnsChanged(e, args);
    }

    // keep reference to the updated visible columns list
    if (args && Array.isArray(args.visibleColumns) && args.visibleColumns.length > this.sharedService.visibleColumns.length) {
      this.sharedService.visibleColumns = args.visibleColumns;
    }

    // when using row selection, SlickGrid will only apply the "selected" CSS class on the visible columns only
    // and if the row selection was done prior to the column being shown then that column that was previously hidden (at the time of the row selection)
    // will not have the "selected" CSS class because it wasn't visible at the time.
    // To bypass this problem we can simply recall the row selection with the same selection and that will trigger a re-apply of the CSS class
    // on all columns including the column we just made visible
    if (this.gridOptions.enableRowSelection && args.showing) {
      const rowSelection = args.grid.getSelectedRows();
      args.grid.setSelectedRows(rowSelection);
    }

    // if we're using frozen columns, we need to readjust pinning when the new hidden column becomes visible again on the left pinning container
    // we need to readjust frozenColumn index because SlickGrid freezes by index and has no knowledge of the columns themselves
    const frozenColumnIndex = this.gridOptions.frozenColumn ?? -1;
    if (frozenColumnIndex >= 0) {
      const { allColumns, visibleColumns } = args;
      this.extensionUtility.readjustFrozenColumnIndexWhenNeeded(frozenColumnIndex, allColumns, visibleColumns);
    }
  }

  /** Run the Override function when it exists, if it returns True then it is usable/visible */
  protected runOverrideFunctionWhenExists(overrideFn: any, args: any): boolean {
    if (typeof overrideFn === 'function') {
      return overrideFn.call(this, args);
    }
    return true;
  }
}