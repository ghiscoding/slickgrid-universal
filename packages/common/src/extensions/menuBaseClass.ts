import { BindingEventService } from '@slickgrid-universal/binding';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import {
  calculateAvailableSpace,
  classNameToList,
  createDomElement,
  emptyElement,
  getOffset,
  getOffsetRelativeToParent,
  isDefined,
} from '@slickgrid-universal/utils';
import { SlickEventHandler, type SlickEventData, type SlickGrid } from '../core/index.js';
import type { ExtensionUtility } from '../extensions/extensionUtility.js';
import type {
  CellMenu,
  Column,
  ContextMenu,
  DOMMouseOrTouchEvent,
  GridMenu,
  GridMenuItem,
  GridMenuOption,
  GridOption,
  HeaderButton,
  HeaderButtonItem,
  HeaderMenu,
  HeaderMenuOption,
  MenuCommandItem,
  MenuOptionItem,
} from '../interfaces/index.js';
import type { SharedService } from '../services/shared.service.js';

export type ExtractMenuType<A, T> = T extends 'command' ? A : T extends 'option' ? A : A extends 'divider' ? A : never;
export type MenuType = 'command' | 'option';
export type MenuCommandOptionItem = MenuCommandItem | MenuOptionItem;
export type ExtendableItemTypes = HeaderButtonItem | MenuCommandItem | MenuOptionItem | 'divider';
export type MenuPlugin = CellMenu | ContextMenu | GridMenu | HeaderMenu;
export type itemEventCallback = (
  e: DOMMouseOrTouchEvent<HTMLDivElement>,
  type: MenuType,
  item: ExtractMenuType<ExtendableItemTypes, MenuType>,
  level: number,
  columnDef?: Column
) => void;

export class MenuBaseClass<M extends MenuPlugin | HeaderButton> {
  protected _addonOptions: M = {} as unknown as M;
  protected _bindEventService: BindingEventService;
  protected _camelPluginName = '';
  protected _commandTitleElm?: HTMLSpanElement;
  protected _eventHandler: SlickEventHandler;
  protected _gridUid = '';
  protected _menuElm?: HTMLDivElement | null;
  protected _menuCssPrefix = '';
  protected _menuPluginCssPrefix = '';
  protected _optionTitleElm?: HTMLSpanElement;
  pluginName = '';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService
  ) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new SlickEventHandler();
  }

  get addonOptions(): M {
    return this._addonOptions as M;
  }
  set addonOptions(newOptions: M) {
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
    return this._gridUid || (this.grid?.getUID() ?? '');
  }
  get gridUidSelector(): string {
    return this.gridUid ? `.${this.gridUid}` : '';
  }

  get menuCssClass(): string {
    return this._menuPluginCssPrefix || this._menuCssPrefix;
  }

  get menuElement(): HTMLDivElement | null {
    return this._menuElm || document.querySelector(`.${this.menuCssClass}${this.gridUidSelector}`);
  }

  /** Dispose (destroy) of the plugin */
  dispose(): void {
    this._eventHandler?.unsubscribeAll();
    this._bindEventService.unbindAll();
    this.pubSubService.unsubscribeAll();
    this._commandTitleElm?.remove();
    this._optionTitleElm?.remove();
    this.disposeAllMenus();
    emptyElement(this._menuElm);
    this.menuElement?.remove();
    this._menuElm?.remove();
  }

  /** Remove/dispose all parent menus and any sub-menu(s) */
  disposeAllMenus(): void {
    this.disposeSubMenus();

    // remove all parent menu listeners before removing them from the DOM
    this._bindEventService.unbindAll('parent-menu');
    document.querySelectorAll(`.${this.menuCssClass}${this.gridUidSelector}`).forEach((subElm) => subElm.remove());
  }

  /**
   * Remove/dispose all previously opened sub-menu(s),
   * it will first remove all sub-menu listeners then remove sub-menus from the DOM
   */
  disposeSubMenus(): void {
    this._bindEventService.unbindAll('sub-menu');
    document.querySelectorAll(`.${this.menuCssClass}.slick-submenu${this.gridUidSelector}`).forEach((subElm) => subElm.remove());
  }

  setOptions(newOptions: M): void {
    this._addonOptions = { ...this._addonOptions, ...newOptions };
  }

  // --
  // protected functions
  // ------------------

  /**
   * Render slot content using a renderer callback.
   * The renderer receives the menu item and args for full context access.
   * @param parentElm - The parent element (LI) to insert the slot content into
   * @param slotRenderer - A callback function that receives (item, args) and returns string or HTMLElement
   * @param item - The menu item object (passed to callback)
   * @param args - The callback args providing access to grid, column, dataContext, etc.
   */
  protected renderSlotRenderer(
    parentElm: HTMLElement,
    slotRenderer: (item: any, args: any) => string | HTMLElement,
    item: any,
    args: any
  ): void {
    const result = slotRenderer(item, args);
    if (typeof result === 'string') {
      parentElm.innerHTML = this.grid.sanitizeHtmlString(result);
    } else if (result instanceof HTMLElement) {
      parentElm.appendChild(result);
    }
  }

  protected addSubMenuTitleWhenExists(item: ExtractMenuType<ExtendableItemTypes, MenuType>, commandOrOptionMenu: HTMLDivElement): void {
    if (item !== 'divider' && (item as MenuCommandOptionItem | GridMenuItem)?.subMenuTitle) {
      const subMenuTitleElm = document.createElement('div');
      subMenuTitleElm.className = 'slick-menu-title';
      subMenuTitleElm.textContent = (item as MenuCommandOptionItem | GridMenuItem).subMenuTitle as string;
      const subMenuTitleClass = (item as MenuCommandOptionItem | GridMenuItem).subMenuTitleCssClass as string;
      if (subMenuTitleClass) {
        subMenuTitleElm.classList.add(...classNameToList(subMenuTitleClass));
      }
      commandOrOptionMenu.appendChild(subMenuTitleElm);
    }
  }

  /** Construct the Command/Options Items section. */
  protected populateCommandOrOptionItems(
    itemType: MenuType,
    menuOptions: M,
    commandOrOptionMenuElm: HTMLElement,
    commandOrOptionItems: Array<ExtractMenuType<ExtendableItemTypes, MenuType>>,
    args: unknown,
    itemClickCallback: itemEventCallback,
    itemMouseoverCallback?: itemEventCallback
  ): void {
    if (args && commandOrOptionItems && menuOptions) {
      for (const item of commandOrOptionItems) {
        this.populateSingleCommandOrOptionItem(
          itemType,
          menuOptions,
          commandOrOptionMenuElm,
          item,
          args,
          itemClickCallback,
          itemMouseoverCallback
        );
      }
    }
  }

  /** Add the Command/Options Title when necessary. */
  protected populateCommandOrOptionTitle(itemType: MenuType, menuOptions: M, commandOrOptionMenuElm: HTMLElement, level: number): void {
    if (menuOptions) {
      const isSubMenu = level > 0;

      // return or create a title container
      const menuHeaderElm =
        this._menuElm?.querySelector(`.slick-${itemType}-header`) ?? createDomElement('div', { className: `slick-${itemType}-header` });

      // user could pass a title on top of the Commands/Options section
      const titleProp: 'commandTitle' | 'optionTitle' = `${itemType}Title`;

      if (!isSubMenu) {
        if ((menuOptions as CellMenu | ContextMenu)?.[titleProp]) {
          emptyElement(menuHeaderElm); // make sure title container is empty before adding anything inside it
          this[`_${itemType}TitleElm`] = createDomElement('span', {
            className: 'slick-menu-title',
            textContent: (menuOptions as never)[titleProp],
          });
          menuHeaderElm.appendChild(this[`_${itemType}TitleElm`]!);
          menuHeaderElm.classList.add('with-title');
        } else {
          menuHeaderElm.classList.add('no-title');
        }
        commandOrOptionMenuElm.appendChild(menuHeaderElm);
      }
    }
  }

  /** Construct the Command/Options Items section. */
  protected populateSingleCommandOrOptionItem(
    itemType: MenuType,
    menuOptions: M,
    commandOrOptionMenuElm: HTMLElement | null,
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    args: any,
    itemClickCallback: itemEventCallback,
    itemMouseoverCallback?: itemEventCallback
  ): HTMLLIElement | null {
    let commandLiElm: HTMLLIElement | null = null;

    if (args && item && menuOptions) {
      const level = args?.level || 0;
      const pluginMiddleName = this._camelPluginName === 'headerButtons' ? '' : '-item';
      const menuCssPrefix = `${this._menuCssPrefix}${pluginMiddleName}`;

      // run each override functions to know if the item is visible and usable
      let isItemVisible = true;
      let isItemUsable = true;
      if (typeof item === 'object') {
        isItemVisible = this.extensionUtility.runOverrideFunctionWhenExists<typeof args>(item.itemVisibilityOverride, args);
        isItemUsable = this.extensionUtility.runOverrideFunctionWhenExists<typeof args>(item.itemUsabilityOverride, args);
      }

      // if the result is not visible then there's no need to go further
      if (!isItemVisible) {
        return null;
      }

      // when the override is defined (and previously executed), we need to use its result to update the disabled property
      // so that "handleMenuItemCommandClick" has the correct flag and won't trigger a command/option clicked event
      if (typeof item === 'object' && item.itemUsabilityOverride) {
        item.disabled = isItemUsable ? false : true;
      }

      commandLiElm = createDomElement('li', { className: menuCssPrefix, role: 'menuitem' });
      if (typeof item === 'object' && isDefined((item as never)[itemType])) {
        commandLiElm.dataset[itemType] = (item as never)?.[itemType];
      }
      if (commandOrOptionMenuElm) {
        commandOrOptionMenuElm.appendChild(commandLiElm);
      }

      if ((typeof item === 'object' && (item as MenuCommandOptionItem).divider) || item === 'divider') {
        commandLiElm.classList.add(`${menuCssPrefix}-divider`);
        return commandLiElm;
      }

      if (item.disabled) {
        commandLiElm.classList.add(`${menuCssPrefix}-disabled`);
      }

      if ((item as MenuCommandOptionItem).hidden || (item as HeaderButtonItem).showOnHover) {
        commandLiElm.classList.add(`${menuCssPrefix}-hidden`);
      }

      if (item.cssClass) {
        commandLiElm.classList.add(...classNameToList(item.cssClass));
      }

      if (item.tooltip) {
        commandLiElm.title = item.tooltip;
      }

      if (this._camelPluginName !== 'headerButtons') {
        // Check if we have slot renderer on the menu item or a default item renderer
        const slotRenderer = (item as MenuCommandOptionItem).slotRenderer || (this._addonOptions as MenuPlugin).defaultItemRenderer;
        if (slotRenderer) {
          this.renderSlotRenderer(commandLiElm, slotRenderer, item as MenuCommandOptionItem, args);
        }
        // Default rendering: icon + content
        else {
          const iconElm = createDomElement('div', { className: `${this._menuCssPrefix}-icon` });
          commandLiElm.appendChild(iconElm);

          if ((item as MenuCommandOptionItem).iconCssClass) {
            iconElm.classList.add(...classNameToList((item as MenuCommandOptionItem).iconCssClass));
          } else if (!(item as MenuCommandItem).commandItems && !(item as MenuOptionItem).optionItems) {
            iconElm.textContent = '◦';
          }

          const textElm = createDomElement(
            'span',
            {
              className: `${this._menuCssPrefix}-content`,
              textContent: (typeof item === 'object' && (item as MenuCommandOptionItem).title) || '',
            },
            commandLiElm
          );

          if ((item as MenuCommandOptionItem).textCssClass) {
            textElm.classList.add(...classNameToList((item as MenuCommandOptionItem).textCssClass));
          }
        }
      }

      // execute command callback on menu item clicked
      const eventGroupName = level > 0 ? 'sub-menu' : 'parent-menu';
      this._bindEventService.bind(
        commandLiElm,
        'click',
        ((e: DOMMouseOrTouchEvent<HTMLDivElement>) => {
          // if there's a slot renderer, call it with the event
          const slotRenderer = (item as MenuCommandOptionItem).slotRenderer || (this._addonOptions as MenuPlugin).defaultItemRenderer;
          if (slotRenderer) {
            slotRenderer(item as MenuCommandOptionItem, args, e);
          }

          // if the click was stopped by an interactive element handler, don't trigger the menu action
          if (e.defaultPrevented) {
            return;
          }

          itemClickCallback.call(this, e, itemType, item, level, args?.column);
        }) as EventListener,
        undefined,
        eventGroupName
      );

      // optionally open sub-menu(s) by mouseover
      if ((this._addonOptions as MenuPlugin)?.subMenuOpenByEvent === 'mouseover' && typeof itemMouseoverCallback === 'function') {
        this._bindEventService.bind(
          commandLiElm,
          'mouseover',
          ((e: DOMMouseOrTouchEvent<HTMLDivElement>) =>
            itemMouseoverCallback.call(
              this,
              e,
              itemType,
              item as ExtractMenuType<ExtendableItemTypes, MenuType>,
              level,
              args?.column
            )) as EventListener,
          undefined,
          eventGroupName
        );
      }

      // the option/command item could be a sub-menu if it has another list of commands/options
      if ((item as MenuCommandItem).commandItems || (item as MenuOptionItem).optionItems) {
        const chevronElm = document.createElement('span');
        chevronElm.className = 'sub-item-chevron';
        if ((this._addonOptions as any).subItemChevronClass) {
          chevronElm.classList.add(...classNameToList((this._addonOptions as MenuPlugin).subItemChevronClass));
        } else {
          chevronElm.textContent = '⮞'; // ⮞ or ▸
        }

        commandLiElm.classList.add('slick-submenu-item');
        commandLiElm.appendChild(chevronElm);
      }
    }
    return commandLiElm;
  }

  /**
   * Reposition any of the menu plugins (CellMenu, ContextMenu, GridMenu, HeaderMenu) to where the user clicked,
   * it will calculate the best position depending on available space in the viewport and the menu type.
   */
  repositionMenu(
    e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData,
    menuElm: HTMLElement,
    buttonElm?: HTMLButtonElement,
    addonOptions?: GridMenu | CellMenu | ContextMenu | HeaderMenu
  ): void {
    const targetElm = e.target as HTMLDivElement; // get header button createElement
    const targetEvent: MouseEvent | Touch = (e as TouchEvent)?.touches?.[0] ?? e;
    const isSubMenu = menuElm.classList.contains('slick-submenu');
    const rowHeight = this.gridOptions.rowHeight || 0;
    const parentElm = isSubMenu
      ? ((e.target as HTMLElement)!.closest('.slick-menu-item') as HTMLDivElement)
      : this.pluginName === 'CellMenu' || this.pluginName === 'ContextMenu'
        ? (e.target!.closest('.slick-cell') as HTMLDivElement)
        : (targetEvent.target as HTMLElement);

    if (menuElm && parentElm) {
      // for Cell/Context Menus we should move to (0,0) coordinates before calculating height/width
      // since it could end up being cropped width values when element is outside browser viewport.
      if (this.pluginName === 'CellMenu' || this.pluginName === 'ContextMenu') {
        menuElm.style.top = `0px`;
        menuElm.style.left = `0px`;
      }

      const containerElm: HTMLElement = this.sharedService.gridContainerElement.classList.contains('slickgrid-container')
        ? this.sharedService.gridContainerElement
        : (this.sharedService.gridContainerElement.querySelector('.slickgrid-container') ?? this.sharedService.gridContainerElement);
      const relativePos = getOffsetRelativeToParent(containerElm, targetElm);
      const menuWidth = menuElm.offsetWidth;
      const parentOffset = getOffset(parentElm);
      let menuOffsetLeft = 0;
      let menuOffsetTop = 0;
      let dropOffset = 0;
      let sideOffset = 0;
      let availableSpaceBottom = 0;
      let availableSpaceTop = 0;
      const { bottom: parentSpaceBottom, top: parentSpaceTop } = calculateAvailableSpace(parentElm);

      if (this.pluginName === 'GridMenu' && buttonElm) {
        if (!isSubMenu) {
          const buttonComptStyle = getComputedStyle(buttonElm);
          const buttonWidth = parseInt(buttonComptStyle?.width ?? (addonOptions as GridMenuOption)?.menuWidth, 10);
          const contentMinWidth = (addonOptions as GridMenuOption)?.contentMinWidth ?? 0;
          const currentMenuWidth = (contentMinWidth > menuWidth ? contentMinWidth : menuWidth) || 0;
          if (contentMinWidth > 0) {
            menuElm.style.minWidth = `${contentMinWidth}px`;
          }
          const menuIconOffset = getOffset(buttonElm); // get button offset position
          const nextPositionLeft = menuIconOffset.right;
          menuOffsetTop = menuIconOffset.top + buttonElm!.offsetHeight; // top position has to include button height so the menu is placed just below it
          menuOffsetLeft =
            (addonOptions as GridMenuOption)?.dropSide === 'right' ? nextPositionLeft - buttonWidth : nextPositionLeft - currentMenuWidth;
        }
      } else if (this.pluginName === 'CellMenu' || this.pluginName === 'ContextMenu') {
        menuOffsetLeft = parentElm && this.pluginName === 'CellMenu' ? parentOffset.left : targetEvent.pageX;
        menuOffsetTop = parentElm && this.pluginName === 'CellMenu' ? parentOffset.top : targetEvent.pageY;
        dropOffset = Number((addonOptions as CellMenu | ContextMenu)?.autoAdjustDropOffset || 0);
        sideOffset = Number((addonOptions as CellMenu | ContextMenu)?.autoAlignSideOffset || 0);
      } else {
        menuOffsetLeft = isSubMenu ? parentOffset.left : (relativePos?.left ?? 0);
        menuOffsetTop = isSubMenu
          ? parentOffset.top
          : (relativePos?.top ?? 0) + ((addonOptions as HeaderMenuOption)?.menuOffsetTop ?? 0) + targetElm.clientHeight;
      }

      if ((this.pluginName === 'ContextMenu' || this.pluginName === 'GridMenu') && isSubMenu) {
        menuOffsetLeft = parentOffset.left;
        menuOffsetTop = parentOffset.top;
      }

      // for sub-menus only, auto-adjust drop position (up/down)
      // we first need to see what position the drop will be located (defaults to bottom)
      // since we reposition menu below slick cell, we need to take it in consideration and do our calculation from that element
      const menuHeight = menuElm?.offsetHeight || 0;
      if ((this.pluginName === 'GridMenu' || this.pluginName === 'HeaderMenu') && isSubMenu) {
        availableSpaceBottom = parentSpaceBottom;
        availableSpaceTop = parentSpaceTop;
      } else if (
        this.pluginName === 'CellMenu' ||
        this.pluginName === 'ContextMenu' ||
        (addonOptions as CellMenu | ContextMenu)?.autoAdjustDrop ||
        (addonOptions as CellMenu | ContextMenu)?.dropDirection
      ) {
        availableSpaceBottom = parentSpaceBottom + dropOffset - rowHeight;
        availableSpaceTop = parentSpaceTop - dropOffset + rowHeight;
      }
      const dropPosition = availableSpaceBottom < menuHeight && availableSpaceTop > availableSpaceBottom ? 'top' : 'bottom';
      if (dropPosition === 'top' || (addonOptions as CellMenu | ContextMenu)?.dropDirection === 'top') {
        menuElm.classList.remove('dropdown');
        menuElm.classList.add('dropup');
        if (isSubMenu) {
          menuOffsetTop -= menuHeight - dropOffset - parentElm.clientHeight;
        } else {
          menuOffsetTop -= menuHeight - dropOffset;
        }
      } else {
        menuElm.classList.remove('dropup');
        menuElm.classList.add('dropdown');
        if (this.pluginName === 'CellMenu' || this.pluginName === 'ContextMenu') {
          menuOffsetTop = menuOffsetTop + dropOffset;
          if (this.pluginName === 'CellMenu') {
            if (isSubMenu) {
              menuOffsetTop += dropOffset;
            } else {
              menuOffsetTop += rowHeight + dropOffset;
            }
          }
        }
      }

      // when auto-align is set, it will calculate whether it has enough space in the viewport to show the drop menu on the right (default)
      // if there isn't enough space on the right, it will automatically align the drop menu to the left
      // to simulate an align left, we actually need to know the width of the drop menu
      if (
        (addonOptions as HeaderMenu)?.autoAlign ||
        (addonOptions as CellMenu | ContextMenu)?.autoAlignSide ||
        (addonOptions as CellMenu | ContextMenu)?.dropSide === 'left'
      ) {
        let subMenuPosCalc = menuOffsetLeft + Number(menuWidth); // calculate coordinate at caller element far right
        if (isSubMenu) {
          subMenuPosCalc += parentElm.clientWidth;
        }
        const gridPos = this.grid.getGridPosition();
        const browserWidth = document.documentElement.clientWidth;
        const dropSide = subMenuPosCalc >= gridPos.width || subMenuPosCalc >= browserWidth ? 'left' : 'right';

        let needHeaderMenuOffsetLeftRecalc = false;
        if (dropSide === 'left' || (!isSubMenu && (addonOptions as CellMenu | ContextMenu)?.dropSide === 'left')) {
          menuElm.classList.remove('dropright');
          menuElm.classList.add('dropleft');
          if (this.pluginName === 'HeaderMenu') {
            if (isSubMenu) {
              menuOffsetLeft -= menuWidth;
            } else {
              needHeaderMenuOffsetLeftRecalc = true;
            }
          } else if (this.pluginName === 'CellMenu' && !isSubMenu) {
            const parentCellWidth = parentElm.offsetWidth || 0;
            menuOffsetLeft -= Number(menuWidth) - parentCellWidth - sideOffset;
          } else if (this.pluginName !== 'GridMenu' || (this.pluginName === 'GridMenu' && isSubMenu)) {
            menuOffsetLeft -= Number(menuWidth) - sideOffset;
          }
        } else {
          menuElm.classList.remove('dropleft');
          menuElm.classList.add('dropright');
          if (isSubMenu) {
            menuOffsetLeft += sideOffset + parentElm.offsetWidth;
          } else {
            if (this.pluginName === 'HeaderMenu') {
              needHeaderMenuOffsetLeftRecalc = true;
            } else {
              menuOffsetLeft += sideOffset;
            }
          }
        }

        if (needHeaderMenuOffsetLeftRecalc) {
          menuOffsetLeft = relativePos?.left ?? 0;
          if ((addonOptions as HeaderMenu)?.autoAlign && gridPos?.width && menuOffsetLeft + (menuElm.clientWidth ?? 0) >= gridPos.width) {
            menuOffsetLeft =
              menuOffsetLeft + targetElm.clientWidth - menuElm.clientWidth + ((addonOptions as HeaderMenuOption)?.autoAlignOffset || 0);
          }
        }
      }

      // ready to reposition the menu
      menuElm.style.top = `${menuOffsetTop}px`;
      menuElm.style.left = `${menuOffsetLeft}px`;

      if (this.pluginName === 'GridMenu') {
        menuElm.style.opacity = '1';
        menuElm.style.display = 'block';
      }
    }
  }
}
