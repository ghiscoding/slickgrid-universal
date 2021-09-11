import {
  CellMenu,
  ContextMenu,
  DOMMouseEvent,
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
import { BindingEventService } from '../services/bindingEvent.service';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { findWidthOrDefault, getHtmlElementOffset, windowScrollPosition } from '../services/domUtilities';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';
import { hasData, toSentenceCase } from '../services/utilities';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class MenuBaseClass<T extends CellMenu | ContextMenu> {
  protected _bindEventService: BindingEventService;
  protected _addonOptions: T = {} as unknown as T;
  protected _currentCell = -1;
  protected _currentRow = -1;
  protected _commandTitleElm?: HTMLDivElement;
  protected _optionTitleElm?: HTMLDivElement;
  protected _eventHandler!: SlickEventHandler;
  protected _menuElm?: HTMLDivElement | null;
  protected _camelPluginName = '';
  protected _menuCssPrefix = '';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: PubSubService,
    protected readonly sharedService: SharedService,
  ) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
  }

  get addonOptions(): T {
    return this._addonOptions as T;
  }
  set addonOptions(newOptions: T) {
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

      // make sure there's at least something to show before creating the Menu
      if (this._camelPluginName === 'contextMenu') {
        const isColumnOptionAllowed = this.checkIsColumnAllowed((this._addonOptions as ContextMenu)?.optionShownOverColumnIds ?? [], columnDef.id);
        const isColumnCommandAllowed = this.checkIsColumnAllowed((this._addonOptions as ContextMenu)?.commandShownOverColumnIds ?? [], columnDef.id);
        if (!columnDef || ((!isColumnCommandAllowed || !commandItems.length) && (!isColumnOptionAllowed || !optionItems.length))) {
          this.hideMenu();
          return;
        }
      } else {
        if (!columnDef || !columnDef.cellMenu || (!commandItems.length && !optionItems.length)) {
          return;
        }
      }

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
        this.pubSubService.publish(`${this._camelPluginName}:onBeforeMenuShow`, callbackArgs);
        if (typeof this.addonOptions?.onBeforeMenuShow === 'function' && this.addonOptions?.onBeforeMenuShow(event, callbackArgs) === false) {
          return;
        }
      }

      const maxHeight = isNaN(this.addonOptions.maxHeight as any) ? this.addonOptions.maxHeight : `${this.addonOptions.maxHeight ?? 0}px`;

      // create a new Menu
      this._menuElm = document.createElement('div');
      this._menuElm.classList.add(this._menuCssPrefix);
      this._menuElm.classList.add(this.gridUid);
      this._menuElm.style.maxHeight = maxHeight as string;
      this._menuElm.style.width = findWidthOrDefault(this.addonOptions?.width);
      this._menuElm.style.top = `${event.pageY + 5}px`;
      this._menuElm.style.left = `${event.pageX}px`;
      this._menuElm.style.display = 'none';

      const closeButtonElm = document.createElement('button');
      closeButtonElm.className = 'close';
      closeButtonElm.type = 'button';
      closeButtonElm.dataset.dismiss = this._menuCssPrefix;
      closeButtonElm.setAttribute('aria-label', 'Close');

      const closeSpanElm = document.createElement('span');
      closeSpanElm.className = 'close';
      closeSpanElm.innerHTML = '&times;';
      closeSpanElm.setAttribute('aria-hidden', 'true');
      closeButtonElm.appendChild(closeSpanElm);

      // -- Option List section
      if (!this.addonOptions.hideOptionSection && optionItems.length > 0) {
        const optionMenuElm = document.createElement('div');
        optionMenuElm.className = `${this._menuCssPrefix}-option-list`;
        if (!this.addonOptions.hideCloseButton) {
          this._bindEventService.bind(closeButtonElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener);
          this._menuElm.appendChild(closeButtonElm);
        }
        this._menuElm.appendChild(optionMenuElm);
        this.populateCommandOrOptionItems(
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
        commandMenuElm.className = `${this._menuCssPrefix}-command-list`;
        if (!this.addonOptions.hideCloseButton && (optionItems.length === 0 || this.addonOptions.hideOptionSection)) {
          this._bindEventService.bind(closeButtonElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener);
          this._menuElm.appendChild(closeButtonElm);
        }
        this._menuElm.appendChild(commandMenuElm);
        this.populateCommandOrOptionItems(
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
      this.pubSubService.publish(`${this._camelPluginName}:onAfterMenuShow`, callbackArgs);
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

  /** Hide the Menu */
  hideMenu() {
    this.menuElement?.remove();
    this._menuElm = null;
  }

  setOptions(newOptions: T) {
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

  protected checkIsColumnAllowed(columnIds: Array<number | string>, columnId: number | string): boolean {
    if (columnIds?.length > 0) {
      return columnIds.findIndex(colId => colId === columnId) >= 0;
    }
    return true;
  }

  /** Mouse down handler when clicking anywhere in the DOM body */
  protected handleBodyMouseDown(e: DOMMouseEvent<HTMLDivElement>) {
    if ((this.menuElement !== e.target && !this.menuElement?.contains(e.target)) || e.target.className === 'close') {
      this.closeMenu(e, { cell: this._currentCell, row: this._currentRow, grid: this.grid });
    }
  }

  protected handleCloseButtonClicked(e: DOMMouseEvent<HTMLDivElement>) {
    if (!e.defaultPrevented) {
      this.closeMenu(e, { cell: 0, row: 0, grid: this.grid, });
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
    }
  }

  /** Construct the Command/Options Items section. */
  protected populateCommandOrOptionItems<M extends MenuCommandItem | MenuOptionItem | 'divider', R extends MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs>(itemType: 'command' | 'option', menu: T, commandOrOptionMenuElm: HTMLElement, commandOrOptionItems: Array<M>, args: Partial<R>) {
    if (args && commandOrOptionItems && menu) {
      // user could pass a title on top of the Commands/Options section
      const titleProp = itemType === 'command' ? 'commandTitle' : 'optionTitle';
      if (menu?.[titleProp]) {
        this[`_${itemType}TitleElm`] = document.createElement('div');
        this[`_${itemType}TitleElm`]!.className = 'title';
        this[`_${itemType}TitleElm`]!.textContent = (menu as never)[titleProp];
        commandOrOptionMenuElm.appendChild(this[`_${itemType}TitleElm`]!);
      }

      for (const item of commandOrOptionItems) {
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
        divOptionElm.className = `${this._menuCssPrefix}-item`;
        if (typeof item === 'object' && hasData((item as never)[itemType])) {
          divOptionElm.dataset[itemType] = (item as never)?.[itemType];
        }
        commandOrOptionMenuElm.appendChild(divOptionElm);

        if ((typeof item === 'object' && item.divider) || item === 'divider') {
          divOptionElm.classList.add(`${this._menuCssPrefix}-item-divider`);
          continue;
        }

        if (item.disabled) {
          divOptionElm.classList.add(`${this._menuCssPrefix}-item-disabled`);
        }

        if (item.hidden) {
          divOptionElm.classList.add(`${this._menuCssPrefix}-item-hidden`);
        }

        if (item.cssClass) {
          divOptionElm.classList.add(...item.cssClass.split(' '));
        }

        if (item.tooltip) {
          divOptionElm.title = item.tooltip;
        }

        const iconElm = document.createElement('div');
        iconElm.className = `${this._menuCssPrefix}-icon`;
        divOptionElm.appendChild(iconElm);

        if (item.iconCssClass) {
          iconElm.classList.add(...item.iconCssClass.split(' '));
        }

        if (item.iconImage) {
          console.warn(`[Slickgrid-Universal] The "iconImage" property of a ${toSentenceCase(this._camelPluginName)} item is now deprecated and will be removed in future version, consider using "iconCssClass" instead.`);
          iconElm.style.backgroundImage = `url(${item.iconImage})`;
        }

        const textElm = document.createElement('span');
        textElm.className = `${this._menuCssPrefix}-content`;
        textElm.textContent = typeof item === 'object' && item.title || '';
        divOptionElm.appendChild(textElm);

        if (item.textCssClass) {
          textElm.classList.add(...item.textCssClass.split(' '));
        }
        // execute command on menu item clicked
        this._bindEventService.bind(divOptionElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleMenuItemCommandOrOptionClick(e, itemType, item, this._currentRow, this._currentCell)) as EventListener);
      }
    }
  }

  protected repositionMenu(event: DOMMouseEvent<HTMLDivElement>) {
    if (this._menuElm && event.target) {
      // move to 0,0 before calulating height/width since it could be cropped values
      // when element is outside browser viewport
      this._menuElm.style.top = `0px`;
      this._menuElm.style.left = `0px`;

      const parentElm = event.target.closest('.slick-cell') as HTMLDivElement;
      let menuOffsetLeft = (parentElm && this._camelPluginName === 'cellMenu') ? getHtmlElementOffset(parentElm)?.left ?? 0 : event.pageX;
      let menuOffsetTop = (parentElm && this._camelPluginName === 'cellMenu') ? getHtmlElementOffset(parentElm)?.top ?? 0 : event.pageY;
      const parentCellWidth = parentElm.offsetWidth || 0;
      const menuHeight = this._menuElm?.offsetHeight || 0;
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
          menuOffsetTop = menuOffsetTop + dropOffset;
          if (this._camelPluginName === 'cellMenu') {
            menuOffsetTop += rowHeight;
          }
        }
      }

      // when auto-align is set, it will calculate whether it has enough space in the viewport to show the drop menu on the right (default)
      // if there isn't enough space on the right, it will automatically align the drop menu to the left (defaults to the right)
      // to simulate an align left, we actually need to know the width of the drop menu
      if (this._addonOptions.autoAlignSide || this._addonOptions.alignDropSide === 'left') {
        const gridPos = this.grid.getGridPosition();
        const dropSide = ((menuOffsetLeft + (+menuWidth)) >= gridPos.width) ? 'left' : 'right';
        if (dropSide === 'left' || this._addonOptions.alignDropSide === 'left') {
          this._menuElm.classList.remove('dropright');
          this._menuElm.classList.add('dropleft');
          if (this._camelPluginName === 'cellMenu') {
            menuOffsetLeft = (menuOffsetLeft - ((+menuWidth) - parentCellWidth) - sideOffset);
          } else {
            menuOffsetLeft = menuOffsetLeft - (+menuWidth) - sideOffset;
          }
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
}