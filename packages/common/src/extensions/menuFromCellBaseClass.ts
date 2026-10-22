import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, findWidthOrDefault, titleCase } from '@slickgrid-universal/utils';
import type { SlickEventData } from '../core/slickCore.js';
import type { SlickGrid } from '../core/slickGrid.js';
import type {
  CellMenu,
  Column,
  ContextMenu,
  DOMMouseOrTouchEvent,
  MenuCallbackArgs,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  MenuFromCellCallbackArgs,
} from '../interfaces/index.js';
import type { SharedService } from '../services/shared.service.js';
import type { ExtensionUtility } from './extensionUtility.js';
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

  createParentMenu(
    event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData,
    cell: { cell: number; row: number }
  ): HTMLDivElement | undefined {
    this.menuElement?.remove();
    this._menuElm = undefined;

    if (cell) {
      this._currentCell = cell.cell;
      this._currentRow = cell.row;
      const commandItems = this._addonOptions?.commandItems || [];

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
      this._menuElm = this.createMenu(triggerElement, commandItems);
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
   * @param level - menu level
   * @param item - command or divider
   * @returns menu DOM element
   */
  createMenu(
    triggeredByElm: HTMLElement,
    commandItems: Array<MenuCommandItem | 'divider'>,
    level = 0,
    item?: ExtractMenuType<ExtendableItemTypes, MenuType>
  ): HTMLDivElement | undefined {
    const columnDef = this.grid.getColumnByIdx(this._currentCell) ?? ({} as Column);
    const dataContext = this.grid.getDataItem(this._currentRow) ?? {};

    // Always use the triggering item's command (whitespace removed) as the sub-menu parent id for every level
    const subMenuCommand = (item as MenuCommandItem)?.command;
    const subMenuId = subMenuCommand ? String(subMenuCommand).replace(/\s/g, '') : '';

    let isColumnCommandAllowed = true;

    // make sure there's at least something to show before creating the Menu
    if (this._camelPluginName === 'contextMenu') {
      isColumnCommandAllowed = this.checkIsColumnAllowed(
        (this._addonOptions as ContextMenu)?.commandShownOverColumnIds ?? [],
        columnDef.id
      );
      if (!isColumnCommandAllowed || !commandItems.length) {
        this.hideMenu();
        return;
      }
    } else {
      if (!columnDef.cellMenu || !commandItems.length) {
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

    // -- Command List section
    if (!(this.addonOptions as CellMenu | ContextMenu).hideCommandSection && isColumnCommandAllowed && commandItems.length > 0) {
      const commandMenuElm = createDomElement('div', { className: `${this._menuCssPrefix}-command-list`, role: 'menu' }, menuElm);
      this.populateCommandTitle('command', this.addonOptions, commandMenuElm, level);
      if (!this.addonOptions.hideCloseButton && level < 1) {
        this.populateCommandCloseBtn('command', closeButtonElm, commandMenuElm);
      }

      // when creating sub-menu also add its sub-menu title when exists
      if (item && level > 0) {
        this.addSubMenuTitleWhenExists(item, commandMenuElm); // add sub-menu title when exists
      }

      this.populateCommandItems(
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
    if ((item as never)?.[type] !== undefined && item !== 'divider' && !item.disabled && !(item as MenuCommandItem).divider) {
      if ((item as MenuCommandItem).commandItems) {
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
      !(item as MenuCommandItem).divider &&
      this._currentCell !== undefined &&
      this._currentRow !== undefined
    ) {
      const cell = this._currentCell;
      const row = this._currentRow;
      const columnDef = this.grid.getColumnByIdx(this._currentCell);
      const dataContext = this.grid.getDataItem(this._currentRow);
      const command = (item as MenuCommandItem).command;

      if (!(item as MenuCommandItem).commandItems) {
        // user could execute a callback through 2 ways
        // via the onCommand event and/or an action callback
        const callbackArgs = {
          cell: this._currentCell,
          row: this._currentRow,
          grid: this.grid,
          command,
          item,
          column: columnDef,
          dataContext,
        } as MenuCommandItemCallbackArgs;

        // execute Menu callback with command,
        // we'll also execute optional user defined onCommand callback when provided
        const eventName = `${this._camelPluginName}:onCommand`;
        this.pubSubService.publish(eventName, callbackArgs);
        this._addonOptions.onCommand?.(event, callbackArgs);

        // execute action callback when defined
        if (typeof item.action === 'function') {
          (item as MenuCommandItem).action!.call(this, event, callbackArgs);
        }

        // does the user want to leave open the Cell Menu after executing a command?
        if (!event.defaultPrevented) {
          this.closeMenu(event, { cell, row, grid: this.grid });
        }
      } else {
        this.repositionSubMenu(item as MenuCommandItem | 'divider', type, level, event);
      }
      this._lastMenuTypeClicked = type;
    }
  }

  protected populateCommandCloseBtn(itemType: MenuType, closeButtonElm: HTMLButtonElement, commandMenuElm: HTMLDivElement): void {
    this._bindEventService.bind(
      closeButtonElm,
      'click',
      ((e: DOMMouseOrTouchEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener,
      undefined,
      'parent-menu'
    );
    // prettier-ignore
    const commandMenuHeaderElm = commandMenuElm.querySelector<HTMLDivElement>(`.slick-${itemType}-header`) ?? createDomElement('div', { className: `slick-${itemType}-header` });
    commandMenuHeaderElm?.appendChild(closeButtonElm);
    commandMenuElm.appendChild(commandMenuHeaderElm);
    commandMenuHeaderElm.classList.add('with-close');
  }

  protected repositionSubMenu(
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    type: MenuType,
    level: number,
    e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData
  ): void {
    // When clicking a grid cell, close any sub-menus that might still be open.
    if (e.target!.classList.contains('slick-cell') || this._lastMenuTypeClicked !== type) {
      this.disposeSubMenus();
    }

    // creating sub-menu, we'll also pass level & the item object since we might have "subMenuTitle" to show
    const subMenuElm = this.createMenu(e.target as HTMLElement, (item as MenuCommandItem)?.commandItems || [], level + 1, item);
    if (subMenuElm) {
      subMenuElm.style.display = 'block';
      document.body.appendChild(subMenuElm);
      this.repositionMenu(e, subMenuElm, undefined, this._addonOptions);
    }
  }
}
