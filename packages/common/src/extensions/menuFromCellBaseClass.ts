import {
  CellMenu,
  ContextMenu,
  DOMMouseEvent,
  MenuCallbackArgs,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  MenuFromCellCallbackArgs,
  MenuOptionItem,
  MenuOptionItemCallbackArgs,
} from '../interfaces/index';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { calculateAvailableSpace, createDomElement, findWidthOrDefault, getHtmlElementOffset, } from '../services/domUtilities';
import { ExtendableItemTypes, ExtractMenuType, MenuBaseClass, MenuType } from './menuBaseClass';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';
import { titleCase } from '../services/utilities';

export class MenuFromCellBaseClass<M extends CellMenu | ContextMenu> extends MenuBaseClass<M> {
  protected _currentCell = -1;
  protected _currentRow = -1;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: PubSubService,
    protected readonly sharedService: SharedService,
  ) {
    super(extensionUtility, pubSubService, sharedService);
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
      let isColumnOptionAllowed = true;
      let isColumnCommandAllowed = true;

      // make sure there's at least something to show before creating the Menu
      if (this._camelPluginName === 'contextMenu') {
        isColumnOptionAllowed = this.checkIsColumnAllowed((this._addonOptions as ContextMenu)?.optionShownOverColumnIds ?? [], columnDef.id);
        isColumnCommandAllowed = this.checkIsColumnAllowed((this._addonOptions as ContextMenu)?.commandShownOverColumnIds ?? [], columnDef.id);
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
        this.pubSubService.publish(`on${titleCase(this._camelPluginName)}BeforeMenuShow`, callbackArgs);
        if (typeof this.addonOptions?.onBeforeMenuShow === 'function' && (this.addonOptions as CellMenu | ContextMenu).onBeforeMenuShow!(event, callbackArgs) === false) {
          return;
        }
      }

      // create a new Menu
      this._menuElm = createDomElement('div', {
        className: `${this._menuPluginCssPrefix || this._menuCssPrefix} ${this.gridUid}`,
        style: { display: 'none', left: `${event.pageX}px`, top: `${event.pageY + 5}px` }
      });

      const maxHeight = isNaN(this.addonOptions.maxHeight as any) ? this.addonOptions.maxHeight : `${this.addonOptions.maxHeight ?? 0}px`;
      const maxWidth = isNaN(this.addonOptions.maxWidth as any) ? this.addonOptions.maxWidth : `${this.addonOptions.maxWidth ?? 0}px`;

      if (maxHeight) {
        this._menuElm.style.maxHeight = maxHeight as string;
      }
      if (maxWidth) {
        this._menuElm.style.maxWidth = maxWidth as string;
      }
      if (this.addonOptions?.width) {
        this._menuElm.style.width = findWidthOrDefault(this.addonOptions?.width);
      }

      const closeButtonElm = createDomElement('button', { className: 'close', type: 'button', innerHTML: '&times;', dataset: { dismiss: this._menuCssPrefix } });
      closeButtonElm.setAttribute('aria-label', 'Close');

      // -- Option List section
      if (!(this.addonOptions as CellMenu | ContextMenu).hideOptionSection && isColumnOptionAllowed && optionItems.length > 0) {
        const optionMenuElm = createDomElement('div', { className: `${this._menuCssPrefix}-option-list` });
        if (!this.addonOptions.hideCloseButton) {
          this._bindEventService.bind(closeButtonElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener);
          const optionMenuHeaderElm = createDomElement('div', { className: 'slick-option-header' });
          optionMenuHeaderElm?.appendChild(closeButtonElm);
          optionMenuElm.appendChild(optionMenuHeaderElm);
          optionMenuHeaderElm.classList.add('with-close');
        }
        this._menuElm.appendChild(optionMenuElm);
        this.populateCommandOrOptionItems(
          'option',
          this.addonOptions,
          optionMenuElm,
          optionItems,
          { cell: this._currentCell, row: this._currentRow, column: columnDef, dataContext, grid: this.grid } as MenuCallbackArgs,
          this.handleMenuItemCommandClick,
        );
      }

      // -- Command List section
      if (!(this.addonOptions as CellMenu | ContextMenu).hideCommandSection && isColumnCommandAllowed && commandItems.length > 0) {
        const commandMenuElm = createDomElement('div', { className: `${this._menuCssPrefix}-command-list` });
        if (!this.addonOptions.hideCloseButton && (!isColumnOptionAllowed || optionItems.length === 0 || (this.addonOptions as CellMenu | ContextMenu).hideOptionSection)) {
          this._bindEventService.bind(closeButtonElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener);
          const commandMenuHeaderElm = createDomElement('div', { className: 'slick-command-header' });
          commandMenuHeaderElm?.appendChild(closeButtonElm);
          commandMenuElm.appendChild(commandMenuHeaderElm);
          commandMenuHeaderElm.classList.add('with-close');
        }
        this._menuElm.appendChild(commandMenuElm);
        this.populateCommandOrOptionItems(
          'command',
          this.addonOptions,
          commandMenuElm,
          commandItems,
          { cell: this._currentCell, row: this._currentRow, column: columnDef, dataContext, grid: this.grid } as MenuCallbackArgs,
          this.handleMenuItemCommandClick,
        );
      }

      this._menuElm.style.display = 'block';
      document.body.appendChild(this._menuElm);

      // execute optional callback method defined by the user
      this.pubSubService.publish(`on${titleCase(this._camelPluginName)}AfterMenuShow`, callbackArgs);
      if (typeof this.addonOptions?.onAfterMenuShow === 'function' && (this.addonOptions as CellMenu | ContextMenu).onAfterMenuShow!(event, callbackArgs) === false) {
        return;
      }
    }
    return this._menuElm;
  }

  closeMenu(e: DOMMouseEvent<HTMLDivElement>, args: MenuFromCellCallbackArgs) {
    if (this.menuElement) {
      if (typeof this.addonOptions?.onBeforeMenuClose === 'function' && (this.addonOptions as CellMenu | ContextMenu).onBeforeMenuClose!(e, args) === false) {
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

  // --
  // protected functions
  // ------------------

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

  protected handleMenuItemCommandClick(event: DOMMouseEvent<HTMLDivElement>, type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>) {
    if ((item as never)?.[type] !== undefined && item !== 'divider' && !item.disabled && !(item as MenuCommandItem | MenuOptionItem).divider && this._currentCell !== undefined && this._currentRow !== undefined) {
      if (type === 'option' && !this.grid.getEditorLock().commitCurrentEdit()) {
        return;
      }

      const cell = this._currentCell;
      const row = this._currentRow;
      const columnDef = this.grid.getColumns()[this._currentCell];
      const dataContext = this.grid.getDataItem(this._currentRow);

      // user could execute a callback through 2 ways
      // via the onOptionSelected event and/or an action callback
      const callbackArgs = {
        cell: this._currentCell,
        row: this._currentRow,
        grid: this.grid,
        [type]: (item as never)[type],
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
      const dropOffset = +((this._addonOptions as CellMenu | ContextMenu).autoAdjustDropOffset || 0);
      const sideOffset = +((this._addonOptions as CellMenu | ContextMenu).autoAlignSideOffset || 0);

      // if autoAdjustDrop is enable, we first need to see what position the drop will be located (defaults to bottom)
      // without necessary toggling it's position just yet, we just want to know the future position for calculation
      if ((this._addonOptions as CellMenu | ContextMenu).autoAdjustDrop || (this._addonOptions as CellMenu | ContextMenu).dropDirection) {
        // since we reposition menu below slick cell, we need to take it in consideration and do our calculation from that element
        const spaceBottom = calculateAvailableSpace(parentElm).bottom;
        const spaceTop = calculateAvailableSpace(parentElm).top;
        const spaceBottomRemaining = spaceBottom + dropOffset - rowHeight;
        const spaceTopRemaining = spaceTop - dropOffset + rowHeight;
        const dropPosition = ((spaceBottomRemaining < menuHeight) && (spaceTopRemaining > spaceBottomRemaining)) ? 'top' : 'bottom';
        if (dropPosition === 'top' || (this._addonOptions as CellMenu | ContextMenu).dropDirection === 'top') {
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
      if ((this._addonOptions as CellMenu | ContextMenu).autoAlignSide || this._addonOptions.dropSide === 'left') {
        const gridPos = this.grid.getGridPosition();
        const dropSide = ((menuOffsetLeft + (+menuWidth)) >= gridPos.width) ? 'left' : 'right';
        if (dropSide === 'left' || this._addonOptions.dropSide === 'left') {
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