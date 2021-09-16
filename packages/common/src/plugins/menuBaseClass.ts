import {
  CellMenu,
  Column,
  ContextMenu,
  DOMMouseEvent,
  GridMenu,
  GridOption,
  HeaderButton,
  HeaderButtonItem,
  HeaderMenu,
  MenuCommandItem,
  MenuOptionItem,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import { BindingEventService } from '../services/bindingEvent.service';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { getHtmlElementOffset, windowScrollPosition } from '../services/domUtilities';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';
import { hasData, toSentenceCase } from '../services/utilities';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export type MenuType = 'command' | 'option';
export type ExtendableItemTypes = HeaderButtonItem | MenuCommandItem | MenuOptionItem | 'divider';

/* eslint-disable @typescript-eslint/indent */
export type ExtractMenuType<A, T> =
  T extends 'command' ? A :
  T extends 'option' ? A :
  A extends 'divider' ? A : never;
/* eslint-enable @typescript-eslint/indent */

export class MenuBaseClass<M extends CellMenu | ContextMenu | GridMenu | HeaderMenu | HeaderButton> {
  protected _addonOptions: M = {} as unknown as M;
  protected _bindEventService: BindingEventService;
  protected _camelPluginName = '';
  protected _commandTitleElm?: HTMLDivElement;
  protected _eventHandler!: SlickEventHandler;
  protected _gridUid = '';
  protected _menuElm?: HTMLDivElement | null;
  protected _menuCssPrefix = '';
  protected _optionTitleElm?: HTMLDivElement;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: PubSubService,
    protected readonly sharedService: SharedService,
  ) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
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

  get menuElement(): HTMLDivElement | null {
    return this._menuElm || document.querySelector(`.${this._menuCssPrefix}${this.gridUidSelector}`);
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

  setOptions(newOptions: M) {
    this._addonOptions = { ...this._addonOptions, ...newOptions };
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
  protected populateCommandOrOptionItems(
    itemType: MenuType,
    menuOptions: M,
    commandOrOptionMenuElm: HTMLElement,
    commandOrOptionItems: Array<ExtractMenuType<ExtendableItemTypes, MenuType>>,
    args: any,
    itemClickCallback: (event: DOMMouseEvent<HTMLDivElement>, type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>, columnDef?: Column) => void
  ) {
    if (args && commandOrOptionItems && menuOptions) {
      // user could pass a title on top of the Commands/Options section
      const titleProp = itemType === 'command' ? 'commandTitle' : 'optionTitle';
      if ((menuOptions as CellMenu | ContextMenu)?.[titleProp]) {
        this[`_${itemType}TitleElm`] = document.createElement('div');
        this[`_${itemType}TitleElm`]!.className = 'title';
        this[`_${itemType}TitleElm`]!.textContent = (menuOptions as never)[titleProp];
        commandOrOptionMenuElm.appendChild(this[`_${itemType}TitleElm`]!);
      }
      for (const item of commandOrOptionItems) {
        this.populateSingleCommandOrOptionItem(itemType, menuOptions, commandOrOptionMenuElm, item, args, itemClickCallback);
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
    itemClickCallback: (event: DOMMouseEvent<HTMLDivElement>, type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>, columnDef?: Column) => void
  ): HTMLLIElement | null {
    let commandLiElm: HTMLLIElement | null = null;

    if (args && item && menuOptions) {
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
      // so that "handleMenuItemCommandClick" has the correct flag and won't trigger a command clicked event
      if (typeof item === 'object' && item.itemUsabilityOverride) {
        item.disabled = isItemUsable ? false : true;
      }

      commandLiElm = document.createElement('li');
      commandLiElm.className = menuCssPrefix;
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
        commandLiElm.classList.add(...item.cssClass.split(' '));
      }

      if (item.tooltip) {
        commandLiElm.title = item.tooltip;
      }

      if (this._camelPluginName === 'headerButtons') {
        if ((item as HeaderButtonItem).image) {
          console.warn('[Slickgrid-Universal] The "image" property of a Header Button is now deprecated and will be removed in future version, consider using "cssClass" instead.');
          commandLiElm.style.backgroundImage = `url(${(item as HeaderButtonItem).image})`;
        }
      } else {
        // any other Menu plugin will have icon & content elements
        const iconElm = document.createElement('div');
        iconElm.className = `${this._menuCssPrefix}-icon`;
        commandLiElm.appendChild(iconElm);

        if ((item as MenuCommandItem | MenuOptionItem).iconCssClass) {
          iconElm.classList.add(...(item as MenuCommandItem | MenuOptionItem).iconCssClass!.split(' '));
        }

        if ((item as MenuCommandItem | MenuOptionItem).iconImage) {
          console.warn(`[Slickgrid-Universal] The "iconImage" property of a ${toSentenceCase(this._camelPluginName)} item is now deprecated and will be removed in future version, consider using "iconCssClass" instead.`);
          iconElm.style.backgroundImage = `url(${(item as MenuCommandItem | MenuOptionItem).iconImage})`;
        }

        const textElm = document.createElement('span');
        textElm.className = `${this._menuCssPrefix}-content`;
        textElm.textContent = typeof item === 'object' && (item as MenuCommandItem | MenuOptionItem).title || '';
        commandLiElm.appendChild(textElm);

        if ((item as MenuCommandItem | MenuOptionItem).textCssClass) {
          textElm.classList.add(...(item as MenuCommandItem | MenuOptionItem).textCssClass!.split(' '));
        }
      }

      // execute command on menu item clicked
      this._bindEventService.bind(commandLiElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) =>
        itemClickCallback.call(this, e, itemType, item, args?.column)) as EventListener);

      // Header Button can have an optional handler
      if ((item as HeaderButtonItem).handler && !(item as HeaderButtonItem).disabled) {
        this._bindEventService.bind(commandLiElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) =>
          (item as HeaderButtonItem).handler!.call(this, e)) as EventListener);
      }
    }
    return commandLiElm;
  }
}