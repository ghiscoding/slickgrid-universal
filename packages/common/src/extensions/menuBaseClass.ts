import { BindingEventService } from '@slickgrid-universal/binding';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, emptyElement, hasData, classNameToList } from '@slickgrid-universal/utils';

import type {
  CellMenu,
  Column,
  ContextMenu,
  DOMMouseOrTouchEvent,
  GridMenu,
  GridMenuItem,
  GridOption,
  HeaderButton,
  HeaderButtonItem,
  HeaderMenu,
  MenuCommandItem,
  MenuOptionItem,
} from '../interfaces/index';
import type { ExtensionUtility } from '../extensions/extensionUtility';
import type { SharedService } from '../services/shared.service';
import { SlickEventHandler, type SlickGrid } from '../core/index';

export type MenuType = 'command' | 'option';
export type ExtendableItemTypes = HeaderButtonItem | MenuCommandItem | MenuOptionItem | 'divider';

export type ExtractMenuType<A, T> =
  T extends 'command' ? A :
  T extends 'option' ? A :
  A extends 'divider' ? A : never;

export class MenuBaseClass<M extends CellMenu | ContextMenu | GridMenu | HeaderMenu | HeaderButton> {
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

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService,
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

  get menuCssClass() {
    return this._menuPluginCssPrefix || this._menuCssPrefix;
  }

  get menuElement(): HTMLDivElement | null {
    return this._menuElm || document.querySelector(`.${this.menuCssClass}${this.gridUidSelector}`);
  }

  /** Dispose (destroy) of the plugin */
  dispose() {
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
  disposeAllMenus() {
    this.disposeSubMenus();

    // remove all parent menu listeners before removing them from the DOM
    this._bindEventService.unbindAll('parent-menu');
    document.querySelectorAll(`.${this.menuCssClass}${this.gridUidSelector}`)
      .forEach(subElm => subElm.remove());
  }

  /**
   * Remove/dispose all previously opened sub-menu(s),
   * it will first remove all sub-menu listeners then remove sub-menus from the DOM
   */
  disposeSubMenus() {
    this._bindEventService.unbindAll('sub-menu');
    document.querySelectorAll(`.${this.menuCssClass}.slick-submenu${this.gridUidSelector}`)
      .forEach(subElm => subElm.remove());
  }

  setOptions(newOptions: M) {
    this._addonOptions = { ...this._addonOptions, ...newOptions };
  }

  // --
  // protected functions
  // ------------------

  protected addSubMenuTitleWhenExists(item: ExtractMenuType<ExtendableItemTypes, MenuType>, commandOrOptionMenu: HTMLDivElement) {
    if (item !== 'divider' && (item as MenuCommandItem | MenuOptionItem | GridMenuItem)?.subMenuTitle) {
      const subMenuTitleElm = document.createElement('div');
      subMenuTitleElm.className = 'slick-menu-title';
      subMenuTitleElm.textContent = (item as MenuCommandItem | MenuOptionItem | GridMenuItem).subMenuTitle as string;
      const subMenuTitleClass = (item as MenuCommandItem | MenuOptionItem | GridMenuItem).subMenuTitleCssClass as string;
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
    itemClickCallback: (e: DOMMouseOrTouchEvent<HTMLDivElement>, type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>, level: number, columnDef?: Column) => void,
    itemMouseoverCallback?: (e: DOMMouseOrTouchEvent<HTMLElement>, type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>, level: number, columnDef?: Column) => void
  ) {
    if (args && commandOrOptionItems && menuOptions) {
      for (const item of commandOrOptionItems) {
        this.populateSingleCommandOrOptionItem(itemType, menuOptions, commandOrOptionMenuElm, item, args, itemClickCallback, itemMouseoverCallback);
      }
    }
  }

  /** Add the Command/Options Title when necessary. */
  protected populateCommandOrOptionTitle(itemType: MenuType, menuOptions: M, commandOrOptionMenuElm: HTMLElement, level: number) {
    if (menuOptions) {
      const isSubMenu = level > 0;

      // return or create a title container
      const menuHeaderElm = this._menuElm?.querySelector(`.slick-${itemType}-header`) ?? createDomElement('div', { className: `slick-${itemType}-header` });

      // user could pass a title on top of the Commands/Options section
      const titleProp: 'commandTitle' | 'optionTitle' = `${itemType}Title`;

      if (!isSubMenu) {
        if ((menuOptions as CellMenu | ContextMenu)?.[titleProp]) {
          emptyElement(menuHeaderElm); // make sure title container is empty before adding anything inside it
          this[`_${itemType}TitleElm`] = createDomElement('span', { className: 'slick-menu-title', textContent: (menuOptions as never)[titleProp] });
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
    itemClickCallback: (e: DOMMouseOrTouchEvent<HTMLDivElement>, type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>, level: number, columnDef?: Column) => void,
    itemMouseoverCallback?: (e: DOMMouseOrTouchEvent<HTMLElement>, type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>, level: number, columnDef?: Column) => void
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
      if (typeof item === 'object' && hasData((item as never)[itemType])) {
        commandLiElm.dataset[itemType] = (item as never)?.[itemType];
      }
      if (commandOrOptionMenuElm) {
        commandOrOptionMenuElm.appendChild(commandLiElm);
      }

      if ((typeof item === 'object' && (item as MenuCommandItem | MenuOptionItem).divider) || item === 'divider') {
        commandLiElm.classList.add(`${menuCssPrefix}-divider`);
        return commandLiElm;
      }

      if (item.disabled) {
        commandLiElm.classList.add(`${menuCssPrefix}-disabled`);
      }

      if ((item as MenuCommandItem | MenuOptionItem).hidden || (item as HeaderButtonItem).showOnHover) {
        commandLiElm.classList.add(`${menuCssPrefix}-hidden`);
      }

      if (item.cssClass) {
        commandLiElm.classList.add(...classNameToList(item.cssClass));
      }

      if (item.tooltip) {
        commandLiElm.title = item.tooltip;
      }

      if (this._camelPluginName !== 'headerButtons') {
        // Menu plugin can use optional icon & content elements
        const iconElm = createDomElement('div', { className: `${this._menuCssPrefix}-icon` });
        commandLiElm.appendChild(iconElm);

        if ((item as MenuCommandItem | MenuOptionItem).iconCssClass) {
          iconElm.classList.add(...classNameToList((item as MenuCommandItem | MenuOptionItem).iconCssClass));
        } else if (!(item as MenuCommandItem).commandItems && !(item as MenuOptionItem).optionItems) {
          iconElm.textContent = '◦';
        }

        const textElm = createDomElement(
          'span',
          {
            className: `${this._menuCssPrefix}-content`,
            textContent: typeof item === 'object' && (item as MenuCommandItem | MenuOptionItem).title || ''
          },
          commandLiElm
        );

        if ((item as MenuCommandItem | MenuOptionItem).textCssClass) {
          textElm.classList.add(...classNameToList((item as MenuCommandItem | MenuOptionItem).textCssClass));
        }
      }

      // execute command callback on menu item clicked
      const eventGroupName = level > 0 ? 'sub-menu' : 'parent-menu';
      this._bindEventService.bind(
        commandLiElm,
        'click',
        ((e: DOMMouseOrTouchEvent<HTMLDivElement>) => itemClickCallback.call(this, e, itemType, item, level, args?.column)) as EventListener,
        undefined,
        eventGroupName
      );

      // optionally open sub-menu(s) by mouseover
      if ((this._addonOptions as CellMenu | ContextMenu | GridMenu | HeaderMenu)?.subMenuOpenByEvent === 'mouseover' && typeof itemMouseoverCallback === 'function') {
        this._bindEventService.bind(
          commandLiElm,
          'mouseover',
          ((e: DOMMouseOrTouchEvent<HTMLDivElement>) => itemMouseoverCallback.call(this, e, itemType, item as ExtractMenuType<ExtendableItemTypes, MenuType>, level)) as EventListener,
          undefined,
          eventGroupName
        );
      }

      // the option/command item could be a sub-menu if it has another list of commands/options
      if ((item as MenuCommandItem).commandItems || (item as MenuOptionItem).optionItems) {
        const chevronElm = document.createElement('span');
        chevronElm.className = 'sub-item-chevron';
        if ((this._addonOptions as any).subItemChevronClass) {
          chevronElm.classList.add(...classNameToList((this._addonOptions as any).subItemChevronClass));
        } else {
          chevronElm.textContent = '⮞'; // ⮞ or ▸
        }

        commandLiElm.classList.add('slick-submenu-item');
        commandLiElm.appendChild(chevronElm);
      }
    }
    return commandLiElm;
  }
}