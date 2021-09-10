import {
  CellMenu,
  CellMenuOption,
  Column,
  DOMMouseEvent,
  GetSlickEventType,
  GridOption,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  MenuFromCellCallbackArgs,
  MenuOptionItem,
  MenuOptionItemCallbackArgs,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import { findWidthOrDefault, getHtmlElementOffset, hasData, windowScrollPosition } from '../services/index';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { BindingEventService } from '../services/bindingEvent.service';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

/**
 * A plugin to add Menu on a Cell click (click on the cell that has the cellMenu object defined)
 * The "cellMenu" is defined in a Column Definition object
 * Similar to the ContextMenu plugin (could be used in combo),
 * except that it subscribes to the cell "onClick" event (regular mouse click or touch).
 *
 * A general use of this plugin is for an Action Dropdown Menu to do certain things on the row that was clicked
 * You can use it to change the cell data property through a list of Options AND/OR through a list of Commands.
 *
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.columnDefinitions = [{
 *     id: 'myColumn', name: 'My column',
 *     cellMenu: {
 *       // ... cell menu options
 *       commandItems: [{ ...menu item options... }, { ...menu item options... }]
 *     }
 *   }];
 */
export class CellMenuPlugin {
  protected _bindEventService: BindingEventService;
  protected _currentCell = -1;
  protected _currentRow = -1;
  protected _eventHandler!: SlickEventHandler;
  protected _commandTitleElm?: HTMLDivElement;
  protected _optionTitleElm?: HTMLDivElement;
  protected _addonOptions: CellMenu = {};
  protected _menuElm?: HTMLDivElement | null;
  protected _defaults = {
    autoAdjustDrop: true,     // dropup/dropdown
    autoAlignSide: true,      // left/right
    autoAdjustDropOffset: 0,
    autoAlignSideOffset: 0,
    hideMenuOnScroll: true,
    maxHeight: 'none',
    width: 'auto',
  } as unknown as CellMenuOption;
  pluginName: 'CellMenu' = 'CellMenu';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: PubSubService,
    protected readonly sharedService: SharedService,
  ) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
    this.init(sharedService.gridOptions.cellMenu);
  }

  get addonOptions(): CellMenu {
    return this._addonOptions as CellMenu;
  }
  set addonOptions(newOptions: CellMenu) {
    this._addonOptions = newOptions;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get grid(): SlickGrid {
    return this.sharedService.slickGrid;
  }

  get gridOptions(): GridOption {
    return this.sharedService.gridOptions ?? {};
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this.grid?.getUID() ?? '';
  }
  get gridUidSelector(): string {
    return this.gridUid ? `.${this.gridUid}` : '';
  }

  get menuElement(): HTMLDivElement | null {
    return this._menuElm || document.querySelector(`.slick-cell-menu${this.gridUidSelector}`);
  }

  /** Initialize plugin. */
  init(cellMenuOptions?: CellMenu) {
    this._addonOptions = { ...this._defaults, ...cellMenuOptions };

    // sort all menu items by their position order when defined
    this.sortMenuItems(this.sharedService.allColumns);

    const onClickHandler = this.grid.onClick;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onClickHandler>>).subscribe(onClickHandler, this.handleCellClick.bind(this) as EventListener);

    if (this._addonOptions.hideMenuOnScroll) {
      const onScrollHandler = this.grid.onScroll;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onScrollHandler>>).subscribe(onScrollHandler, this.closeMenu.bind(this) as EventListener);
    }
  }

  /** Dispose (destroy) of the plugin */
  dispose() {
    this._eventHandler?.unsubscribeAll();
    this._bindEventService.unbindAll();
    this.pubSubService.unsubscribeAll();
    this._commandTitleElm?.remove();
    this._optionTitleElm?.remove();
    this.menuElement?.remove();
  }

  createMenu(event: DOMMouseEvent<HTMLDivElement>) {
    this.menuElement?.remove();
    this._menuElm = undefined;
    const cell = this.grid.getCellFromEvent(event);

    if (cell) {
      this._currentCell = cell.cell ?? 0;
      this._currentRow = cell.row ?? 0;
      const columnDef = this.grid.getColumns()[this._currentCell];
      const dataContext = this.grid.getDataItem(this._currentRow);

      const commandItems = this._addonOptions?.commandItems || [];
      const optionItems = this._addonOptions?.optionItems || [];

      // make sure there's at least something to show before creating the Cell Menu
      if (!columnDef || !columnDef.cellMenu || (!commandItems.length && !optionItems.length)) {
        return;
      }

      // Let the user modify the menu or cancel altogether,
      // or provide alternative menu implementation.
      const callbackArgs = {
        cell: this._currentCell,
        row: this._currentRow,
        grid: this.grid,
        // menu: this._pluginOptions,
      } as MenuFromCellCallbackArgs;

      // delete any prior Cell Menu
      this.closeMenu(event, callbackArgs);

      // execute optional callback method defined by the user, if it returns false then we won't go further and not open the cell menu
      if (typeof event.stopPropagation === 'function') {
        this.pubSubService.publish('cellMenu:onBeforeMenuShow', callbackArgs);
        if (typeof this.addonOptions?.onBeforeMenuShow === 'function' && this.addonOptions?.onBeforeMenuShow(event, callbackArgs) === false) {
          return;
        }
      }

      const maxHeight = isNaN(this.addonOptions.maxHeight as any) ? this.addonOptions.maxHeight : `${this.addonOptions.maxHeight ?? 0}px`;

      // create a new cell menu
      this._menuElm = document.createElement('div');
      this._menuElm.className = `slick-cell-menu ${this.gridUid}`;
      this._menuElm.style.maxHeight = maxHeight as string;
      this._menuElm.style.width = findWidthOrDefault(this.addonOptions?.width);
      this._menuElm.style.top = `${event.pageY + 5}px`;
      this._menuElm.style.left = `${event.pageX}px`;
      this._menuElm.style.display = 'none';

      const closeButtonElm = document.createElement('button');
      closeButtonElm.className = 'close';
      closeButtonElm.type = 'button';
      closeButtonElm.dataset.dismiss = 'slick-cell-menu';
      closeButtonElm.setAttribute('aria-label', 'Close');

      const closeSpanElm = document.createElement('span');
      closeSpanElm.className = 'close';
      closeSpanElm.innerHTML = '&times;';
      closeSpanElm.setAttribute('aria-hidden', 'true');
      closeButtonElm.appendChild(closeSpanElm);

      // -- Option List section
      if (!this.addonOptions.hideOptionSection && optionItems.length > 0) {
        const optionMenuElm = document.createElement('div');
        optionMenuElm.className = 'slick-cell-menu-option-list';
        if (!this.addonOptions.hideCloseButton) {
          this._bindEventService.bind(closeButtonElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener);
          this._menuElm.appendChild(closeButtonElm);
        }
        this._menuElm.appendChild(optionMenuElm);
        this.populateCommandOrOptionItems<MenuOptionItem | 'divider', MenuOptionItemCallbackArgs>(
          'option',
          this.addonOptions,
          optionMenuElm,
          optionItems,
          { cell: this._currentCell, row: this._currentRow, column: columnDef, dataContext, grid: this.grid }
        );
      }

      // -- Command List section
      if (!this.addonOptions.hideCommandSection && commandItems.length > 0) {
        const commandMenuElm = document.createElement('div');
        commandMenuElm.className = 'slick-cell-menu-command-list';
        if (!this.addonOptions.hideCloseButton && (optionItems.length === 0 || this.addonOptions.hideOptionSection)) {
          this._bindEventService.bind(closeButtonElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener);
          this._menuElm.appendChild(closeButtonElm);
        }
        this._menuElm.appendChild(commandMenuElm);
        this.populateCommandOrOptionItems<MenuCommandItem | 'divider', MenuCommandItemCallbackArgs>(
          'command',
          this.addonOptions,
          commandMenuElm,
          commandItems,
          { cell: this._currentCell, row: this._currentRow, column: columnDef, dataContext, grid: this.grid }
        );
      }

      this._menuElm.style.display = 'block';
      document.body.appendChild(this._menuElm);

      // execute optional callback method defined by the user
      this.pubSubService.publish('cellMenu:onAfterMenuShow', callbackArgs);
      if (typeof this.addonOptions?.onAfterMenuShow === 'function' && this.addonOptions?.onAfterMenuShow(event, callbackArgs) === false) {
        return;
      }
    }
    return this._menuElm;
  }

  closeMenu(e: DOMMouseEvent<HTMLDivElement>, args: MenuFromCellCallbackArgs) {
    if (this.menuElement) {
      if (typeof this.addonOptions?.onBeforeMenuClose === 'function' && this.addonOptions?.onBeforeMenuClose(e, args) === false) {
        return;
      }
      this.hideMenu();
    }
  }

  /** Hide the Cell Menu */
  hideMenu() {
    this.menuElement?.remove();
    this._menuElm = null;
  }

  setOptions(newOptions: CellMenu) {
    this._addonOptions = { ...this._addonOptions, ...newOptions };
  }

  /** Translate the Cell Menu titles, we need to loop through all column definition to re-translate all list titles & all commands/options */
  translateCellMenu() {
    const gridOptions = this.sharedService?.gridOptions;
    const columnDefinitions = this.sharedService.allColumns;

    if (gridOptions?.enableTranslate && Array.isArray(columnDefinitions)) {
      columnDefinitions.forEach((columnDef: Column) => {
        if (columnDef?.cellMenu && (Array.isArray(columnDef.cellMenu.commandItems) || Array.isArray(columnDef.cellMenu.optionItems))) {
          // get both items list
          const columnCellMenuCommandItems: Array<MenuCommandItem | 'divider'> = columnDef.cellMenu.commandItems || [];
          const columnCellMenuOptionItems: Array<MenuOptionItem | 'divider'> = columnDef.cellMenu.optionItems || [];

          // translate their titles only if they have a titleKey defined
          if (columnDef.cellMenu.commandTitleKey) {
            columnDef.cellMenu.commandTitle = this.extensionUtility.translateWhenEnabledAndServiceExist(columnDef.cellMenu.commandTitleKey, 'TEXT_COMMANDS') || columnDef.cellMenu.commandTitle;
          }
          if (columnDef.cellMenu.optionTitleKey) {
            columnDef.cellMenu.optionTitle = this.extensionUtility.translateWhenEnabledAndServiceExist(columnDef.cellMenu.optionTitleKey, 'TEXT_COMMANDS') || columnDef.cellMenu.optionTitle;
          }

          // translate both command/option items (whichever is provided)
          this.extensionUtility.translateMenuItemsFromTitleKey(columnCellMenuCommandItems);
          this.extensionUtility.translateMenuItemsFromTitleKey(columnCellMenuOptionItems);

          this.extensionUtility.translateItems(columnCellMenuCommandItems, 'titleKey', 'title');
          this.extensionUtility.translateItems(columnCellMenuOptionItems, 'titleKey', 'title');
        }
      });
    }
  }

  // --
  // event handlers
  // ------------------

  protected handleCellClick(event: DOMMouseEvent<HTMLDivElement>, args: MenuCommandItemCallbackArgs) {
    const cell = this.grid.getCellFromEvent(event);
    if (cell) {
      const dataContext = this.grid.getDataItem(cell.row);
      const columnDef = this.grid.getColumns()[cell.cell];

      // prevent event from bubbling but only on column that has a cell menu defined
      if (columnDef?.cellMenu) {
        event.preventDefault();
      }

      // merge the cellMenu of the column definition with the default properties
      this._addonOptions = { ...this._addonOptions, ...columnDef.cellMenu };

      // run the override function (when defined), if the result is false it won't go further
      if (!args) {
        args = {} as MenuCommandItemCallbackArgs;
      }
      args.column = columnDef;
      args.dataContext = dataContext;
      args.grid = this.grid;
      if (!this.extensionUtility.runOverrideFunctionWhenExists(this._addonOptions.menuUsabilityOverride, args)) {
        return;
      }

      // create the DOM element
      this._menuElm = this.createMenu(event);

      // reposition the menu to where the user clicked
      if (this._menuElm) {
        this.repositionMenu(event);
        this._menuElm.style.display = 'block';
      }

      // Hide the menu on outside click.
      this._bindEventService.bind(document.body, 'mousedown', this.handleBodyMouseDown.bind(this) as EventListener);
    }
  }

  protected handleCloseButtonClicked(e: DOMMouseEvent<HTMLDivElement>) {
    if (!e.defaultPrevented) {
      this.closeMenu(e, { cell: 0, row: 0, grid: this.grid, });
    }
  }

  /** Mouse down handler when clicking anywhere in the DOM body */
  protected handleBodyMouseDown(e: DOMMouseEvent<HTMLDivElement>) {
    if ((this.menuElement !== e.target && !this.menuElement?.contains(e.target)) || e.target.className === 'close') {
      this.closeMenu(e, { cell: this._currentCell, row: this._currentRow, grid: this.grid });
    }
  }

  protected handleMenuItemCommandOrOptionClick<M extends MenuCommandItem | MenuOptionItem, C extends MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs>(event: DOMMouseEvent<HTMLDivElement>, type: 'command' | 'option', item: M, row: number, cell: number) {
    if ((item as never)?.[type] !== undefined && !item.disabled && !item.divider) {
      if (type === 'option' && !this.grid.getEditorLock().commitCurrentEdit()) {
        return;
      }

      const columnDef = this.grid.getColumns()[cell];
      const dataContext = this.grid.getDataItem(row);

      // user could execute a callback through 2 ways
      // via the onOptionSelected event and/or an action callback
      const callbackArgs = {
        cell,
        row,
        grid: this.grid,
        [type]: (item as never)[type],
        item,
        column: columnDef,
        dataContext,
      } as C;

      // execute Cell Menu callback with command,
      // we'll also execute optional user defined onOptionSelected callback when provided
      // this.executeCellMenuInternalCustomCommands(event, callbackArgs);
      const eventType = type === 'command' ? 'onCommand' : 'onOptionSelected';
      const eventName = `cellMenu:${eventType}`;
      this.pubSubService.publish(eventName, callbackArgs);
      if (typeof (this._addonOptions as never)?.[eventType] === 'function') {
        (this._addonOptions as any)[eventType](event, callbackArgs);
      }

      // execute action callback when defined
      if (typeof item.action === 'function') {
        (item as any).action.call(this, event, callbackArgs);
      }

      // does the user want to leave open the Cell Menu after executing a command?
      if (!event.defaultPrevented) {
        this.closeMenu(event, { cell, row, grid: this.grid });
      }
    }
  }

  // --
  // protected functions
  // ------------------

  protected calculateAvailableSpaceBottom(element: HTMLElement) {
    let availableSpace = 0;
    const windowHeight = window.innerHeight ?? 0;
    const pageScrollTop = windowScrollPosition()?.top ?? 0;
    const elmOffset = getHtmlElementOffset(element);
    if (elmOffset) {
      const elementOffsetTop = elmOffset.top ?? 0;
      availableSpace = windowHeight - (elementOffsetTop - pageScrollTop);
    }
    return availableSpace;
  }

  protected calculateAvailableSpaceTop(element: HTMLElement) {
    let availableSpace = 0;
    const pageScrollTop = windowScrollPosition()?.top ?? 0;
    const elmOffset = getHtmlElementOffset(element);
    if (elmOffset) {
      const elementOffsetTop = elmOffset.top ?? 0;
      availableSpace = elementOffsetTop - pageScrollTop;
    }
    return availableSpace;
  }

  /** Construct the Command/Options Items section. */
  protected populateCommandOrOptionItems<M extends MenuCommandItem | MenuOptionItem | 'divider', R extends MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs>(type: 'command' | 'option', cellMenu: CellMenu, commandOrOptionMenuElm: HTMLElement, commandOrOptionItems: Array<M>, args: Partial<R>) {
    if (args && commandOrOptionItems && cellMenu) {
      // user could pass a title on top of the Commands/Options section
      const titleProp = type === 'command' ? 'commandTitle' : 'optionTitle';
      if (cellMenu?.[titleProp]) {
        this[`_${type}TitleElm`] = document.createElement('div');
        this[`_${type}TitleElm`]!.className = 'title';
        this[`_${type}TitleElm`]!.textContent = (cellMenu as never)[titleProp];
        commandOrOptionMenuElm.appendChild(this[`_${type}TitleElm`]!);
      }

      for (let i = 0, ln = commandOrOptionItems.length; i < ln; i++) {
        const item = commandOrOptionItems[i];

        // run each override functions to know if the item is visible and usable
        let isItemVisible = true;
        let isItemUsable = true;
        if (typeof item === 'object') {
          isItemVisible = this.extensionUtility.runOverrideFunctionWhenExists<typeof args>(item.itemVisibilityOverride, args);
          isItemUsable = this.extensionUtility.runOverrideFunctionWhenExists<typeof args>(item.itemUsabilityOverride, args);
        }

        // if the result is not visible then there's no need to go further
        if (!isItemVisible) {
          continue;
        }

        // when the override is defined (and previously executed), we need to use its result to update the disabled property
        // so that "handleMenuItemCommandClick" has the correct flag and won't trigger a command clicked event
        if (typeof item === 'object' && item.itemUsabilityOverride) {
          item.disabled = isItemUsable ? false : true;
        }

        const divOptionElm = document.createElement('div');
        divOptionElm.className = 'slick-cell-menu-item';
        if (typeof item === 'object' && hasData((item as never)[type])) {
          divOptionElm.dataset[type] = (item as never)?.[type];
        }
        commandOrOptionMenuElm.appendChild(divOptionElm);

        if ((typeof item === 'object' && item.divider) || item === 'divider') {
          divOptionElm.classList.add('slick-cell-menu-item-divider');
          continue;
        }

        if (item.disabled) {
          divOptionElm.classList.add('slick-cell-menu-item-disabled');
        }

        if (item.hidden) {
          divOptionElm.classList.add('slick-cell-menu-item-hidden');
        }

        if (item.cssClass) {
          divOptionElm.classList.add(...item.cssClass.split(' '));
        }

        if (item.tooltip) {
          divOptionElm.title = item.tooltip;
        }

        const iconElm = document.createElement('div');
        iconElm.className = 'slick-cell-menu-icon';
        divOptionElm.appendChild(iconElm);

        if (item.iconCssClass) {
          iconElm.classList.add(...item.iconCssClass.split(' '));
        }

        if (item.iconImage) {
          console.warn('[Slickgrid-Universal] The "iconImage" property of a Cell Menu item is now deprecated and will be removed in future version, consider using "iconCssClass" instead.');
          iconElm.style.backgroundImage = `url(${item.iconImage})`;
        }

        const textElm = document.createElement('span');
        textElm.className = 'slick-cell-menu-content';
        textElm.textContent = typeof item === 'object' && item.title || '';
        divOptionElm.appendChild(textElm);

        if (item.textCssClass) {
          textElm.classList.add(...item.textCssClass.split(' '));
        }
        // execute command on menu item clicked
        this._bindEventService.bind(divOptionElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleMenuItemCommandOrOptionClick(e, type, item, this._currentRow, this._currentCell)) as EventListener);
      }
    }
  }

  protected repositionMenu(event: DOMMouseEvent<HTMLDivElement>) {
    if (this._menuElm && event.target) {
      const parentElm = event.target.closest('.slick-cell') as HTMLDivElement;
      let menuOffsetLeft = parentElm ? getHtmlElementOffset(parentElm)?.left ?? 0 : event.pageX;
      let menuOffsetTop = parentElm ? getHtmlElementOffset(parentElm)?.top ?? 0 : event.pageY;
      const parentCellWidth = parentElm.offsetWidth ?? 0;
      const menuHeight = this._menuElm?.offsetHeight ?? 0;
      const menuWidth = this._menuElm?.offsetWidth || this._addonOptions.width || 0;
      const rowHeight = this.gridOptions.rowHeight || 0;
      const dropOffset = +(this._addonOptions.autoAdjustDropOffset || 0);
      const sideOffset = +(this._addonOptions.autoAlignSideOffset || 0);

      // if autoAdjustDrop is enable, we first need to see what position the drop will be located (defaults to bottom)
      // without necessary toggling it's position just yet, we just want to know the future position for calculation
      if (this._addonOptions.autoAdjustDrop || this._addonOptions.alignDropDirection) {
        // since we reposition menu below slick cell, we need to take it in consideration and do our calculation from that element
        const spaceBottom = this.calculateAvailableSpaceBottom(parentElm);
        const spaceTop = this.calculateAvailableSpaceTop(parentElm);
        const spaceBottomRemaining = spaceBottom + dropOffset - rowHeight;
        const spaceTopRemaining = spaceTop - dropOffset + rowHeight;
        const dropPosition = ((spaceBottomRemaining < menuHeight) && (spaceTopRemaining > spaceBottomRemaining)) ? 'top' : 'bottom';
        if (dropPosition === 'top' || this._addonOptions.alignDropDirection === 'top') {
          this._menuElm.classList.remove('dropdown');
          this._menuElm.classList.add('dropup');
          menuOffsetTop = menuOffsetTop - menuHeight - dropOffset;
        } else {
          this._menuElm.classList.remove('dropup');
          this._menuElm.classList.add('dropdown');
          menuOffsetTop = menuOffsetTop + rowHeight + dropOffset;
        }
      }

      // when auto-align is set, it will calculate whether it has enough space in the viewport to show the drop menu on the right (default)
      // if there isn't enough space on the right, it will automatically align the drop menu to the left (defaults to the right)
      // to simulate an align left, we actually need to know the width of the drop menu
      if (this._addonOptions.autoAlignSide || this._addonOptions.alignDropSide === 'left') {
        const gridPos = this.grid.getGridPosition();
        const dropSide = (((menuOffsetLeft + (+menuWidth)) >= gridPos.width)) ? 'left' : 'right';
        if (dropSide === 'left' || this._addonOptions.alignDropSide === 'left') {
          this._menuElm.classList.remove('dropright');
          this._menuElm.classList.add('dropleft');
          menuOffsetLeft = (menuOffsetLeft - ((+menuWidth) - parentCellWidth) - sideOffset);
        } else {
          this._menuElm.classList.remove('dropleft');
          this._menuElm.classList.add('dropright');
          menuOffsetLeft = menuOffsetLeft + sideOffset;
        }
      }

      // ready to reposition the menu
      this._menuElm.style.top = `${menuOffsetTop}px`;
      this._menuElm.style.left = `${menuOffsetLeft}px`;
    }
  }

  sortMenuItems(columnDefinitions: Column[]) {
    // sort both items list
    columnDefinitions.forEach((columnDef: Column) => {
      if (columnDef?.cellMenu?.commandItems) {
        const columnCellMenuCommandItems: Array<MenuCommandItem | 'divider'> = columnDef.cellMenu.commandItems || [];
        this.extensionUtility.sortItems(columnCellMenuCommandItems, 'positionOrder');
      }
      if (columnDef?.cellMenu?.optionItems) {
        const columnCellMenuOptionItems: Array<MenuOptionItem | 'divider'> = columnDef.cellMenu.optionItems || [];
        this.extensionUtility.sortItems(columnCellMenuOptionItems, 'positionOrder');
      }
    });
  }
}