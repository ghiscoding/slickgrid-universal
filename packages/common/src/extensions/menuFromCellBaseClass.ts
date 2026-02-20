import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, findWidthOrDefault, titleCase } from '@slickgrid-universal/utils';
import type { SlickEventData, SlickGrid } from '../core/index.js';
import type { ExtensionUtility } from '../extensions/extensionUtility.js';
import type {
  CellMenu,
  ContextMenu,
  DOMMouseOrTouchEvent,
  MenuCallbackArgs,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  MenuFromCellCallbackArgs,
  MenuOptionItem,
  MenuOptionItemCallbackArgs,
} from '../interfaces/index.js';
import type { SharedService } from '../services/shared.service.js';
import { MenuBaseClass, type ExtendableItemTypes, type ExtractMenuType, type MenuType } from './menuBaseClass.js';

export class MenuFromCellBaseClass<M extends CellMenu | ContextMenu> extends MenuBaseClass<M> {
  protected _currentCell = -1;
  protected _currentRow = -1;
  protected _lastMenuTypeClicked = '';
  protected _subMenuParentId = '';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService
  ) {
    super(extensionUtility, pubSubService, sharedService);
  }

  createParentMenu(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData): HTMLDivElement | undefined {
    this.menuElement?.remove();
    this._menuElm = undefined;
    const cell = this.grid.getCellFromEvent(event);

    if (cell) {
      this._currentCell = cell.cell ?? 0;
      this._currentRow = cell.row ?? 0;
      const commandItems = this._addonOptions?.commandItems || [];
      const optionItems = this._addonOptions?.optionItems || [];

      // Let the user modify the menu or cancel altogether,
      // or provide alternative menu implementation.
      const callbackArgs = {
        cell: this._currentCell,
        row: this._currentRow,
        grid: this.grid,
        // menu: this._pluginOptions,
      } as MenuFromCellCallbackArgs;

      // delete any prior Menu
      this.closeMenu(event, callbackArgs);

      // execute optional callback method defined by the user, if it returns false then we won't go further and not open the Menu
      if (typeof event.stopPropagation === 'function') {
        this.pubSubService.publish(`on${titleCase(this._camelPluginName)}BeforeMenuShow`, callbackArgs);
        if (
          typeof this.addonOptions?.onBeforeMenuShow === 'function' &&
          (this.addonOptions as CellMenu | ContextMenu).onBeforeMenuShow!(event, callbackArgs) === false
        ) {
          return;
        }
      }

      // Track the element that triggered the menu (for focus restoration)
      const triggerElement = (event.target as HTMLElement) || this.grid.getActiveCellNode();
      if (triggerElement) {
        this.setMenuTriggerElement(triggerElement);
      }

      // create 1st parent menu container & reposition it
      this._menuElm = this.createMenu(triggerElement, commandItems, optionItems);
      if (this._menuElm) {
        this._menuElm.style.top = `${(event.pageY || 0) + 5}px`;
        this._menuElm.style.left = `${event.pageX}px`;
        this._menuElm.style.display = 'block';
        document.body.appendChild(this._menuElm);

        // Focus the first menu item BEFORE binding keyboard handler
        this.focusFirstMenuItem(this._menuElm);

        // Use base class method to wire up keyboard navigation
        this.wireMenuKeyboardNavigation(this._menuElm);
      }

      // execute optional callback method defined by the user
      this.pubSubService.publish(`on${titleCase(this._camelPluginName)}AfterMenuShow`, callbackArgs);
      if (
        typeof this.addonOptions?.onAfterMenuShow === 'function' &&
        (this.addonOptions as CellMenu | ContextMenu).onAfterMenuShow!(event, callbackArgs) === false
      ) {
        return;
      }
    }
    return this._menuElm;
  }

  /**
   * Create parent menu or sub-menu(s), a parent menu will start at level 0 while sub-menu(s) will be incremented
   * @param commandItems - array of optional commands or dividers
   * @param optionItems - array of optional options or dividers
   * @param level - menu level
   * @param item - command, option or divider
   * @returns menu DOM element
   */
  createMenu(
    triggeredByElm: HTMLElement,
    commandItems: Array<MenuCommandItem | 'divider'>,
    optionItems: Array<MenuOptionItem | 'divider'>,
    level = 0,
    item?: ExtractMenuType<ExtendableItemTypes, MenuType>
  ): HTMLDivElement | undefined {
    const columnDef = this.grid.getColumns()[this._currentCell];
    const dataContext = this.grid.getDataItem(this._currentRow);

    // to avoid having multiple sub-menu trees opened
    // we need to somehow keep trace of which parent menu the tree belongs to
    // and we should keep ref of only the first sub-menu parent, we can use the command name (remove any whitespaces though)
    const subMenuCommandOrOption = (item as MenuCommandItem)?.command || (item as MenuOptionItem)?.option;
    let subMenuId = level === 1 && subMenuCommandOrOption ? String(subMenuCommandOrOption).replace(/\s/g, '') : '';
    if (subMenuId) {
      this._subMenuParentId = subMenuId;
    }
    if (level > 1) {
      subMenuId = this._subMenuParentId;
    }

    let isColumnOptionAllowed = true;
    let isColumnCommandAllowed = true;

    // make sure there's at least something to show before creating the Menu
    if (this._camelPluginName === 'contextMenu') {
      isColumnOptionAllowed = this.checkIsColumnAllowed((this._addonOptions as ContextMenu)?.optionShownOverColumnIds ?? [], columnDef.id);
      isColumnCommandAllowed = this.checkIsColumnAllowed(
        (this._addonOptions as ContextMenu)?.commandShownOverColumnIds ?? [],
        columnDef.id
      );
      if (!columnDef || ((!isColumnCommandAllowed || !commandItems.length) && (!isColumnOptionAllowed || !optionItems.length))) {
        this.hideMenu();
        return;
      }
    } else {
      if (!columnDef || !columnDef.cellMenu || (!commandItems.length && !optionItems.length)) {
        return;
      }
    }

    const menuClasses = `${this.menuCssClass} slick-menu-level-${level} ${this.gridUid}`;
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

    const menuElm = document.createElement('div');
    menuElm.className = menuClasses;
    if (level > 0) {
      menuElm.classList.add('slick-submenu');

      // add dark mode CSS class when enabled
      if (this.gridOptions?.darkMode) {
        menuElm.classList.add('slick-dark-mode');
      }
      if (subMenuId) {
        menuElm.dataset.subMenuParent = subMenuId;
      }
    }

    const maxHeight = isNaN(this.addonOptions.maxHeight as any) ? this.addonOptions.maxHeight : `${this.addonOptions.maxHeight ?? 0}px`;
    const maxWidth = isNaN(this.addonOptions.maxWidth as any) ? this.addonOptions.maxWidth : `${this.addonOptions.maxWidth ?? 0}px`;

    if (maxHeight) {
      menuElm.style.maxHeight = maxHeight as string;
    }
    if (maxWidth) {
      menuElm.style.maxWidth = maxWidth as string;
    }
    if (this.addonOptions?.width) {
      menuElm.style.width = findWidthOrDefault(this.addonOptions?.width);
    }

    const closeButtonElm = createDomElement('button', {
      ariaLabel: 'Close',
      className: 'close',
      type: 'button',
      textContent: '×',
      dataset: { dismiss: this._menuCssPrefix },
    });

    // -- Option List section
    if (!(this.addonOptions as CellMenu | ContextMenu).hideOptionSection && isColumnOptionAllowed && optionItems.length > 0) {
      const optionMenuElm = createDomElement('div', { className: `${this._menuCssPrefix}-option-list`, role: 'menu' }, menuElm);
      this.populateCommandOrOptionTitle('option', this.addonOptions, optionMenuElm, level);
      if (!this.addonOptions.hideCloseButton && level < 1) {
        this.populateCommandOrOptionCloseBtn('option', closeButtonElm, optionMenuElm);
      }

      // when creating sub-menu also add its sub-menu title when exists
      if (item && level > 0) {
        this.addSubMenuTitleWhenExists(item, optionMenuElm); // add sub-menu title when exists
      }

      this.populateCommandOrOptionItems(
        'option',
        this.addonOptions,
        optionMenuElm,
        optionItems,
        {
          cell: this._currentCell,
          row: this._currentRow,
          column: columnDef,
          dataContext,
          grid: this.grid,
          level,
        } as MenuCallbackArgs,
        triggeredByElm,
        this.handleMenuItemCommandClick,
        this.handleMenuItemMouseOver
      );
    }

    // -- Command List section
    if (!(this.addonOptions as CellMenu | ContextMenu).hideCommandSection && isColumnCommandAllowed && commandItems.length > 0) {
      const commandMenuElm = createDomElement('div', { className: `${this._menuCssPrefix}-command-list`, role: 'menu' }, menuElm);
      this.populateCommandOrOptionTitle('command', this.addonOptions, commandMenuElm, level);
      if (
        !this.addonOptions.hideCloseButton &&
        level < 1 &&
        (!isColumnOptionAllowed || optionItems.length === 0 || (this.addonOptions as CellMenu | ContextMenu).hideOptionSection)
      ) {
        this.populateCommandOrOptionCloseBtn('command', closeButtonElm, commandMenuElm);
      }

      // when creating sub-menu also add its sub-menu title when exists
      if (item && level > 0) {
        this.addSubMenuTitleWhenExists(item, commandMenuElm); // add sub-menu title when exists
      }

      this.populateCommandOrOptionItems(
        'command',
        this.addonOptions,
        commandMenuElm,
        commandItems,
        {
          cell: this._currentCell,
          row: this._currentRow,
          column: columnDef,
          dataContext,
          grid: this.grid,
          level,
        } as MenuCallbackArgs,
        triggeredByElm,
        this.handleMenuItemCommandClick,
        this.handleMenuItemMouseOver
      );
    }

    // increment level for possible next sub-menus if exists
    level++;

    return menuElm;
  }

  closeMenu(e: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, args: { grid: SlickGrid } | MenuFromCellCallbackArgs): void {
    if (this.menuElement) {
      if (
        typeof this.addonOptions?.onBeforeMenuClose === 'function' &&
        (this.addonOptions as CellMenu | ContextMenu).onBeforeMenuClose!(e, args as MenuFromCellCallbackArgs) === false
      ) {
        return;
      }
      this.hideMenu();
    }
  }

  /** Hide the Menu */
  hideMenu(): void {
    this.menuElement?.remove();
    this._menuElm = null;
    this.disposeSubMenus();
  }

  // --
  // protected functions
  // ------------------

  protected checkIsColumnAllowed(columnIds: Array<number | string>, columnId: number | string): boolean {
    if (columnIds?.length > 0) {
      return columnIds.findIndex((colId) => colId === columnId) >= 0;
    }
    return true;
  }

  /** Mouse down handler when clicking anywhere in the DOM body */
  protected handleBodyMouseDown(e: DOMMouseOrTouchEvent<HTMLDivElement>): void {
    if (this.menuElement) {
      let isMenuClicked = false;
      const parentMenuElm = e.target.closest(`.${this.menuCssClass}`);

      // did we click inside the menu or any of its sub-menu(s)
      if (this.menuElement.contains(e.target) || parentMenuElm) {
        isMenuClicked = true;
      }

      if ((this.menuElement !== e.target && !isMenuClicked && !e.defaultPrevented) || (e.target.className === 'close' && parentMenuElm)) {
        this.closeMenu(e, { cell: this._currentCell, row: this._currentRow, grid: this.grid });
      }
    }
  }

  protected handleCloseButtonClicked(e: DOMMouseOrTouchEvent<HTMLDivElement>): void {
    if (!e.defaultPrevented) {
      this.closeMenu(e, { cell: 0, row: 0, grid: this.grid });
    }
  }

  protected handleMenuItemMouseOver(
    e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData,
    type: MenuType,
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    level = 0
  ): void {
    if (
      (item as never)?.[type] !== undefined &&
      item !== 'divider' &&
      !item.disabled &&
      !(item as MenuCommandItem | MenuOptionItem).divider
    ) {
      if ((item as MenuCommandItem).commandItems || (item as MenuOptionItem).optionItems) {
        this.repositionSubMenu(item, type, level, e);
        this._lastMenuTypeClicked = type;
      } else if (level === 0) {
        this.disposeSubMenus();
      }
    }
  }

  protected handleMenuItemCommandClick(
    event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData,
    type: MenuType,
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    level = 0
  ): void {
    if (
      (item as never)?.[type] !== undefined &&
      item !== 'divider' &&
      !item.disabled &&
      !(item as MenuCommandItem | MenuOptionItem).divider &&
      this._currentCell !== undefined &&
      this._currentRow !== undefined
    ) {
      if (type === 'option' && !this.grid.getEditorLock().commitCurrentEdit()) {
        return;
      }

      const cell = this._currentCell;
      const row = this._currentRow;
      const columnDef = this.grid.getColumns()[this._currentCell];
      const dataContext = this.grid.getDataItem(this._currentRow);
      const optionOrCommand = (item as any)[type] !== undefined ? (item as any)[type] : '';

      if (optionOrCommand !== undefined && !(item as any)[`${type}Items`]) {
        // user could execute a callback through 2 ways
        // via the onOptionSelected event and/or an action callback
        const callbackArgs = {
          cell: this._currentCell,
          row: this._currentRow,
          grid: this.grid,
          [type]: optionOrCommand,
          item,
          column: columnDef,
          dataContext,
        } as ExtractMenuType<MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs, MenuType>;

        // execute Menu callback with command,
        // we'll also execute optional user defined onOptionSelected callback when provided
        const eventType = type === 'command' ? 'onCommand' : 'onOptionSelected';
        const eventName = `${this._camelPluginName}:${eventType}`;
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
      } else if ((item as MenuCommandItem).commandItems || (item as MenuOptionItem).optionItems) {
        this.repositionSubMenu(item as MenuCommandItem | MenuOptionItem | 'divider', type, level, event);
      }
      this._lastMenuTypeClicked = type;
    }
  }

  protected populateCommandOrOptionCloseBtn(
    itemType: MenuType,
    closeButtonElm: HTMLButtonElement,
    commandOrOptionMenuElm: HTMLDivElement
  ): void {
    this._bindEventService.bind(
      closeButtonElm,
      'click',
      ((e: DOMMouseOrTouchEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener,
      undefined,
      'parent-menu'
    );
    // prettier-ignore
    const commandOrOptionMenuHeaderElm = commandOrOptionMenuElm.querySelector<HTMLDivElement>(`.slick-${itemType}-header`) ?? createDomElement('div', { className: `slick-${itemType}-header` });
    commandOrOptionMenuHeaderElm?.appendChild(closeButtonElm);
    commandOrOptionMenuElm.appendChild(commandOrOptionMenuHeaderElm);
    commandOrOptionMenuHeaderElm.classList.add('with-close');
  }

  protected repositionSubMenu(
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    type: MenuType,
    level: number,
    e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData
  ): void {
    // when we're clicking a grid cell OR our last menu type (command/option) differs then we know that we need to start fresh and close any sub-menus that might still be open
    if (e.target!.classList.contains('slick-cell') || this._lastMenuTypeClicked !== type) {
      this.disposeSubMenus();
    }

    // creating sub-menu, we'll also pass level & the item object since we might have "subMenuTitle" to show
    const subMenuElm = this.createMenu(
      e.target as HTMLElement,
      (item as MenuCommandItem)?.commandItems || [],
      (item as MenuOptionItem)?.optionItems || [],
      level + 1,
      item
    );
    if (subMenuElm) {
      subMenuElm.style.display = 'block';
      document.body.appendChild(subMenuElm);
      this.repositionMenu(e, subMenuElm, undefined, this._addonOptions);
    }
  }
}
