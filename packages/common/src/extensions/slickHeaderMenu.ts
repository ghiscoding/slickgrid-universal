import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { arrayRemoveItemByIndex, calculateAvailableSpace, createDomElement, getOffsetRelativeToParent, getOffset, classNameToList } from '@slickgrid-universal/utils';

import { EmitterType } from '../enums/index';
import type {
  Column,
  CurrentSorter,
  DOMEvent,
  DOMMouseOrTouchEvent,
  HeaderMenu,
  HeaderMenuCommandItemCallbackArgs,
  HeaderMenuItems,
  HeaderMenuOption,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  MultiColumnSort,
  OnHeaderCellRenderedEventArgs,
} from '../interfaces/index';
import type { SlickEventData } from '../core';
import { getTranslationPrefix } from '../services/index';
import type { ExtensionUtility } from '../extensions/extensionUtility';
import type { FilterService } from '../services/filter.service';
import type { SharedService } from '../services/shared.service';
import type { SortService } from '../services/sort.service';
import { type ExtendableItemTypes, type ExtractMenuType, MenuBaseClass, type MenuType } from './menuBaseClass';

/**
 * A plugin to add drop-down menus to column headers.
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.columnDefinitions = [{
 *     id: 'myColumn', name: 'My column',
 *     header: {
 *       menu: {
 *         commandItems: [{ ...menu item options... }, { ...menu item options... }]
 *       }
 *     }
 *   }];
 */
export class SlickHeaderMenu extends MenuBaseClass<HeaderMenu> {
  protected _activeHeaderColumnElm?: HTMLDivElement | null;
  protected _subMenuParentId = '';
  protected _defaults = {
    autoAlign: true,
    autoAlignOffset: 0,
    buttonCssClass: null,
    buttonImage: null,
    minWidth: 100,
    hideColumnHideCommand: false,
    hideSortCommands: false,
    title: '',
    subMenuOpenByEvent: 'mouseover',
  } as unknown as HeaderMenuOption;
  pluginName: 'HeaderMenu' = 'HeaderMenu' as const;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly filterService: FilterService,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService,
    protected readonly sortService: SortService,
  ) {
    super(extensionUtility, pubSubService, sharedService);
    this._menuCssPrefix = 'slick-menu';
    this._menuPluginCssPrefix = 'slick-header-menu';
    this._camelPluginName = 'headerMenu';
    this.sharedService.gridOptions.headerMenu = this.addHeaderMenuCustomCommands(this.sharedService.columnDefinitions);
    this.init(sharedService.gridOptions.headerMenu);
  }

  /** Initialize plugin. */
  init(headerMenuOptions?: HeaderMenu) {
    this._addonOptions = { ...this._defaults, ...headerMenuOptions };

    // when setColumns is called (could be via toggle filtering/sorting or anything else),
    // we need to recreate header menu items custom commands array before the `onHeaderCellRendered` gets called
    this._eventHandler.subscribe(this.grid.onBeforeSetColumns, (e, args) => {
      this.sharedService.gridOptions.headerMenu = this.addHeaderMenuCustomCommands(args.newColumns);
    });
    this._eventHandler.subscribe(this.grid.onHeaderCellRendered, this.handleHeaderCellRendered.bind(this));
    this._eventHandler.subscribe(this.grid.onBeforeHeaderCellDestroy, this.handleBeforeHeaderCellDestroy.bind(this));

    // force the grid to re-render the header after the events are hooked up.
    this.grid.setColumns(this.grid.getColumns());

    // hide the menu when clicking outside the grid
    this._bindEventService.bind(document.body, 'mousedown', this.handleBodyMouseDown.bind(this) as EventListener);
  }

  /** Dispose (destroy) of the plugin */
  dispose() {
    super.dispose();
    this._menuElm = this._menuElm || document.body.querySelector(`.slick-header-menu${this.gridUidSelector}`);
    this._menuElm?.remove();
    this._activeHeaderColumnElm = undefined;
  }

  /** Hide a column from the grid */
  hideColumn(column: Column) {
    if (this.sharedService?.slickGrid?.getColumnIndex) {
      const columnIndex = this.sharedService.slickGrid.getColumnIndex(column.id);
      const currentVisibleColumns = this.sharedService.slickGrid.getColumns();

      // if we're using frozen columns, we need to readjust pinning when the new hidden column is on the left pinning container
      // we need to do this because SlickGrid freezes by index and has no knowledge of the columns themselves
      const frozenColumnIndex = this.sharedService.gridOptions.frozenColumn ?? -1;
      if (frozenColumnIndex >= 0 && frozenColumnIndex >= columnIndex) {
        this.sharedService.gridOptions.frozenColumn = frozenColumnIndex - 1;
        this.sharedService.slickGrid.setOptions({ frozenColumn: this.sharedService.gridOptions.frozenColumn });
      }

      // then proceed with hiding the column in SlickGrid & trigger an event when done
      const visibleColumns = arrayRemoveItemByIndex<Column>(currentVisibleColumns, columnIndex);
      this.sharedService.visibleColumns = visibleColumns;
      this.sharedService.slickGrid.setColumns(visibleColumns);
      this.pubSubService.publish('onHeaderMenuHideColumns', { columns: visibleColumns, hiddenColumn: column });
    }
  }

  /** Hide the Header Menu */
  hideMenu() {
    this.disposeSubMenus();
    this._menuElm?.remove();
    this._menuElm = undefined;
  }

  repositionSubMenu(e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData, item: MenuCommandItem, level: number, columnDef: Column) {
    // creating sub-menu, we'll also pass level & the item object since we might have "subMenuTitle" to show
    const subMenuElm = this.createCommandMenu(item.commandItems || [], columnDef, level + 1, item);
    document.body.appendChild(subMenuElm);
    this.repositionMenu(e, subMenuElm);
  }

  repositionMenu(e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData, menuElm: HTMLDivElement) {
    const buttonElm = e.target as HTMLDivElement; // get header button createElement
    const isSubMenu = menuElm.classList.contains('slick-submenu');
    const parentElm = isSubMenu
      ? (e.target as HTMLElement).closest('.slick-menu-item') as HTMLDivElement
      : buttonElm as HTMLElement;

    const relativePos = getOffsetRelativeToParent(this.sharedService.gridContainerElement, buttonElm);
    const gridPos = this.grid.getGridPosition();
    const menuWidth = menuElm.offsetWidth;
    const parentOffset = getOffset(parentElm);
    let menuOffsetLeft = isSubMenu ? parentOffset?.left ?? 0 : relativePos?.left ?? 0;
    let menuOffsetTop = isSubMenu
      ? parentOffset?.top ?? 0
      : (relativePos?.top ?? 0) + (this.addonOptions?.menuOffsetTop ?? 0) + buttonElm.clientHeight;

    // for sub-menus only, auto-adjust drop position (up/down)
    //  we first need to see what position the drop will be located (defaults to bottom)
    if (isSubMenu) {
      // since we reposition menu below slick cell, we need to take it in consideration and do our calculation from that element
      const menuHeight = menuElm?.clientHeight || 0;
      const { bottom: availableSpaceBottom, top: availableSpaceTop } = calculateAvailableSpace(parentElm);
      const dropPosition = ((availableSpaceBottom < menuHeight) && (availableSpaceTop > availableSpaceBottom)) ? 'top' : 'bottom';
      if (dropPosition === 'top') {
        menuElm.classList.remove('dropdown');
        menuElm.classList.add('dropup');
        menuOffsetTop -= (menuHeight - parentElm.clientHeight);
      } else {
        menuElm.classList.remove('dropup');
        menuElm.classList.add('dropdown');
      }
    }

    // when auto-align is set, it will calculate whether it has enough space in the viewport to show the drop menu on the right (default)
    // if there isn't enough space on the right, it will automatically align the drop menu to the left
    // to simulate an align left, we actually need to know the width of the drop menu
    if (isSubMenu && parentElm) {
      // sub-menu
      const subMenuPosCalc = menuOffsetLeft + Number(menuWidth) + parentElm.clientWidth; // calculate coordinate at caller element far right
      const browserWidth = document.documentElement.clientWidth;
      const dropSide = (subMenuPosCalc >= gridPos.width || subMenuPosCalc >= browserWidth) ? 'left' : 'right';
      if (dropSide === 'left') {
        menuElm.classList.remove('dropright');
        menuElm.classList.add('dropleft');
        menuOffsetLeft -= menuWidth;
      } else {
        menuElm.classList.remove('dropleft');
        menuElm.classList.add('dropright');
        menuOffsetLeft += parentElm.offsetWidth;
      }
    } else {
      // parent menu
      menuOffsetLeft = relativePos?.left ?? 0;
      if (this.addonOptions.autoAlign && (gridPos?.width && (menuOffsetLeft + (menuElm.clientWidth ?? 0)) >= gridPos.width)) {
        menuOffsetLeft = menuOffsetLeft + buttonElm.clientWidth - menuElm.clientWidth + (this.addonOptions?.autoAlignOffset || 0);
      }
    }

    // ready to reposition the menu
    menuElm.style.top = `${menuOffsetTop}px`;
    menuElm.style.left = `${menuOffsetLeft}px`;
  }

  /** Translate the Header Menu titles, we need to loop through all column definition to re-translate them */
  translateHeaderMenu() {
    if (this.sharedService.gridOptions?.headerMenu) {
      this.resetHeaderMenuTranslations(this.sharedService.visibleColumns);
    }
  }

  // --
  // event handlers
  // ------------------

  /**
   * Event handler when column title header are being rendered
   * @param {Object} event - The event
   * @param {Object} args - object arguments
   */
  protected handleHeaderCellRendered(_e: SlickEventData, args: OnHeaderCellRenderedEventArgs) {
    const column = args.column;
    const menu = column.header?.menu as HeaderMenuItems;

    if (menu && args.node) {
      // run the override function (when defined), if the result is false we won't go further
      if (!this.extensionUtility.runOverrideFunctionWhenExists(this.addonOptions.menuUsabilityOverride, args)) {
        return;
      }

      const headerButtonDivElm = createDomElement('div', { className: 'slick-header-menu-button', ariaLabel: 'Header Menu' }, args.node);

      if (this.addonOptions.buttonCssClass) {
        headerButtonDivElm.classList.add(...classNameToList(this.addonOptions.buttonCssClass));
      }

      if (this.addonOptions.tooltip) {
        headerButtonDivElm.title = this.addonOptions.tooltip;
      }

      // show the header menu dropdown list of commands
      this._bindEventService.bind(headerButtonDivElm, 'click', ((e: DOMMouseOrTouchEvent<HTMLDivElement>) => {
        this.disposeAllMenus(); // make there's only 1 parent menu opened at a time
        this.createParentMenu(e, args.column, menu);
      }) as EventListener);
    }
  }

  /**
   * Event handler before the header cell is being destroyed
   * @param {Object} event - The event
   * @param {Object} args.column - The column definition
   */
  protected handleBeforeHeaderCellDestroy(_e: SlickEventData, args: { column: Column; node: HTMLElement; }) {
    const column = args.column;

    if (column.header?.menu) {
      // Removing buttons will also clean up any event handlers and data.
      // NOTE: If you attach event handlers directly or using a different framework,
      //       you must also clean them up here to avoid events leaking.
      args.node.querySelectorAll('.slick-header-menu-button').forEach(elm => elm.remove());
    }
  }

  /** Mouse down handler when clicking anywhere in the DOM body */
  protected handleBodyMouseDown(e: DOMEvent<HTMLElement>) {
    if (this.menuElement) {
      let isMenuClicked = false;
      const parentMenuElm = e.target.closest(`.${this.menuCssClass}`);

      // did we click inside the menu or any of its sub-menu(s)
      if (this.menuElement.contains(e.target) || parentMenuElm) {
        isMenuClicked = true;
      }

      if (this._menuElm !== e.target && !isMenuClicked && !e.defaultPrevented || (e.target.className === 'close' && parentMenuElm)) {
        this.hideMenu();
      }
    }
  }

  protected handleMenuItemCommandClick(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, _type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>, level = 0, columnDef?: Column): boolean | void {
    if (item !== 'divider' && !item.disabled && !(item as MenuCommandItem).divider) {
      const command = (item as MenuCommandItem).command || '';

      if (command && !(item as MenuCommandItem).commandItems) {
        const callbackArgs = {
          grid: this.grid,
          command: (item as MenuCommandItem).command,
          column: columnDef,
          item,
        } as MenuCommandItemCallbackArgs;

        // execute Grid Menu callback with command,
        // we'll also execute optional user defined onCommand callback when provided
        this.executeHeaderMenuInternalCommands(event, callbackArgs);
        this.pubSubService.publish('onHeaderMenuCommand', callbackArgs);
        if (typeof this.addonOptions?.onCommand === 'function') {
          this.addonOptions.onCommand(event, callbackArgs);
        }

        // execute action callback when defined
        if (typeof item.action === 'function') {
          (item as MenuCommandItem).action!.call(this, event, callbackArgs);
        }

        // does the user want to leave open the Grid Menu after executing a command?
        if (!event.defaultPrevented) {
          this.hideMenu();
        }

        // Stop propagation so that it doesn't register as a header click event.
        event.preventDefault();
        event.stopPropagation();
      } else if ((item as MenuCommandItem).commandItems) {
        this.repositionSubMenu(event, item as MenuCommandItem, level, columnDef as Column);
      }
    }
  }

  protected handleMenuItemMouseOver(e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData, _type: MenuType, item: ExtractMenuType<ExtendableItemTypes, MenuType>, level = 0, columnDef?: Column) {
    if (item !== 'divider' && !item.disabled && !(item as MenuCommandItem).divider) {
      if ((item as MenuCommandItem).commandItems) {
        this.repositionSubMenu(e, item as MenuCommandItem, level, columnDef as Column);
      } else if (level === 0) {
        this.disposeSubMenus();
      }
    }
  }

  // --
  // protected functions
  // ------------------

  /**
   * Create Header Menu with Custom Commands if user has enabled Header Menu
   * @param gridOptions
   * @param columnDefinitions
   * @return header menu
   */
  protected addHeaderMenuCustomCommands(columnDefinitions: Column[]): HeaderMenu {
    const gridOptions = this.sharedService.gridOptions;
    const headerMenuOptions = gridOptions.headerMenu || {};
    const translationPrefix = getTranslationPrefix(gridOptions);

    if (Array.isArray(columnDefinitions) && gridOptions.enableHeaderMenu) {
      columnDefinitions.forEach((columnDef: Column) => {
        if (columnDef && !columnDef.excludeFromHeaderMenu) {
          if (!columnDef.header) {
            columnDef.header = {
              menu: {
                commandItems: []
              }
            };
          } else if (!columnDef.header.menu) {
            // we might have header buttons without header menu,
            // so only initialize the header menu without overwrite header buttons
            columnDef.header.menu = { commandItems: [] };
          }
          const columnHeaderMenuItems: Array<MenuCommandItem | 'divider'> = columnDef?.header?.menu?.commandItems ?? [];

          // Freeze Column (pinning)
          let hasFrozenOrResizeCommand = false;
          if (headerMenuOptions && !headerMenuOptions.hideFreezeColumnsCommand) {
            hasFrozenOrResizeCommand = true;
            if (!columnHeaderMenuItems.some(item => item !== 'divider' && item?.command === 'freeze-columns')) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconFreezeColumns || 'mdi mdi-pin-outline',
                titleKey: `${translationPrefix}FREEZE_COLUMNS`,
                command: 'freeze-columns',
                positionOrder: 47
              });
            }
          }

          // Column Resize by Content (column autofit)
          if (headerMenuOptions && !headerMenuOptions.hideColumnResizeByContentCommand && this.sharedService.gridOptions.enableColumnResizeOnDoubleClick) {
            hasFrozenOrResizeCommand = true;
            if (!columnHeaderMenuItems.some(item => item !== 'divider' && item?.command === 'column-resize-by-content')) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconColumnResizeByContentCommand || 'mdi mdi-arrow-expand-horizontal',
                titleKey: `${translationPrefix}COLUMN_RESIZE_BY_CONTENT`,
                command: 'column-resize-by-content',
                positionOrder: 48
              });
            }
          }

          // add a divider (separator) between the top freeze columns commands and the rest of the commands
          if (hasFrozenOrResizeCommand && !columnHeaderMenuItems.some(item => item !== 'divider' && item.positionOrder === 49)) {
            columnHeaderMenuItems.push({ divider: true, command: '', positionOrder: 49 });
          }

          // Sorting Commands
          if (gridOptions.enableSorting && columnDef.sortable && headerMenuOptions && !headerMenuOptions.hideSortCommands) {
            if (!columnHeaderMenuItems.some(item => item !== 'divider' && item?.command === 'sort-asc')) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconSortAscCommand || 'mdi mdi-sort-ascending',
                titleKey: `${translationPrefix}SORT_ASCENDING`,
                command: 'sort-asc',
                positionOrder: 50
              });
            }
            if (!columnHeaderMenuItems.some(item => item !== 'divider' && item?.command === 'sort-desc')) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconSortDescCommand || 'mdi mdi-sort-descending',
                titleKey: `${translationPrefix}SORT_DESCENDING`,
                command: 'sort-desc',
                positionOrder: 51
              });
            }

            // add a divider (separator) between the top sort commands and the other clear commands
            if (!columnHeaderMenuItems.some(item => item !== 'divider' && item.positionOrder === 52)) {
              columnHeaderMenuItems.push({ divider: true, command: '', positionOrder: 52 });
            }

            if (!headerMenuOptions.hideClearSortCommand && !columnHeaderMenuItems.some(item => item !== 'divider' && item?.command === 'clear-sort')) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconClearSortCommand || 'mdi mdi-sort-variant-off',
                titleKey: `${translationPrefix}REMOVE_SORT`,
                command: 'clear-sort',
                positionOrder: 54
              });
            }
          }

          // Filtering Commands
          if (gridOptions.enableFiltering && columnDef.filterable && headerMenuOptions && !headerMenuOptions.hideFilterCommand) {
            if (!headerMenuOptions.hideClearFilterCommand && !columnHeaderMenuItems.some(item => item !== 'divider' && item?.command === 'clear-filter')) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconClearFilterCommand || 'mdi mdi-filter-remove-outline',
                titleKey: `${translationPrefix}REMOVE_FILTER`,
                command: 'clear-filter',
                positionOrder: 53
              });
            }
          }

          // Hide Column Command
          if (headerMenuOptions && !headerMenuOptions.hideColumnHideCommand && !columnHeaderMenuItems.some(item => item !== 'divider' && item?.command === 'hide-column')) {
            columnHeaderMenuItems.push({
              iconCssClass: headerMenuOptions.iconColumnHideCommand || 'mdi mdi-close',
              titleKey: `${translationPrefix}HIDE_COLUMN`,
              command: 'hide-column',
              positionOrder: 55
            });
          }

          this.extensionUtility.translateMenuItemsFromTitleKey(columnHeaderMenuItems);
          this.extensionUtility.sortItems(columnHeaderMenuItems, 'positionOrder');
        }
      });
    }

    return headerMenuOptions;
  }

  /** Clear the Filter on the current column (if it's actually filtered) */
  protected clearColumnFilter(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, args: MenuCommandItemCallbackArgs) {
    if (args?.column) {
      this.filterService.clearFilterByColumnId(event, args.column.id);
    }
  }

  /** Clear the Sort on the current column (if it's actually sorted) */
  protected clearColumnSort(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, args: MenuCommandItemCallbackArgs) {
    if (args?.column && this.sharedService) {
      this.sortService.clearSortByColumnId(event, args.column.id);
    }
  }

  /** Execute the Header Menu Commands that was triggered by the onCommand subscribe */
  protected executeHeaderMenuInternalCommands(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, args: MenuCommandItemCallbackArgs) {
    if (args?.command) {
      switch (args.command) {
        case 'hide-column':
          this.hideColumn(args.column);
          if (this.sharedService.gridOptions?.enableAutoSizeColumns) {
            this.sharedService.slickGrid.autosizeColumns();
          }
          break;
        case 'clear-filter':
          this.clearColumnFilter(event, args);
          break;
        case 'clear-sort':
          this.clearColumnSort(event, args);
          break;
        case 'column-resize-by-content':
          this.pubSubService.publish('onHeaderMenuColumnResizeByContent', { columnId: args.column.id });
          break;
        case 'freeze-columns':
          const visibleColumns = [...this.sharedService.visibleColumns];
          const columnPosition = visibleColumns.findIndex(col => col.id === args.column.id);
          const newGridOptions = { frozenColumn: columnPosition, enableMouseWheelScrollHandler: true };

          // to circumvent a bug in SlickGrid core lib, let's keep the columns positions ref and re-apply them after calling setOptions
          // the bug is highlighted in this issue comment:: https://github.com/6pac/SlickGrid/issues/592#issuecomment-822885069
          const previousColumnDefinitions = this.sharedService.slickGrid.getColumns();

          this.sharedService.slickGrid.setOptions(newGridOptions, false, true); // suppress the setColumns (3rd argument) since we'll do that ourselves
          this.sharedService.gridOptions.frozenColumn = newGridOptions.frozenColumn;
          this.sharedService.gridOptions.enableMouseWheelScrollHandler = newGridOptions.enableMouseWheelScrollHandler;
          this.sharedService.frozenVisibleColumnId = args.column.id;

          // to freeze columns, we need to take only the visible columns and we also need to use setColumns() when some of them are hidden
          // to make sure that we only use the visible columns, not doing this will have the undesired effect of showing back some of the hidden columns
          if (this.sharedService.hasColumnsReordered || (Array.isArray(visibleColumns) && Array.isArray(this.sharedService.allColumns) && visibleColumns.length !== this.sharedService.allColumns.length)) {
            this.sharedService.slickGrid.setColumns(visibleColumns);
          } else {
            // to circumvent a bug in SlickGrid core lib re-apply same column definitions that were backend up before calling setOptions()
            this.sharedService.slickGrid.setColumns(previousColumnDefinitions);
          }

          // we also need to autosize columns if the option is enabled
          const gridOptions = this.sharedService.slickGrid.getOptions();
          if (gridOptions.enableAutoSizeColumns) {
            this.sharedService.slickGrid.autosizeColumns();
          }
          break;
        case 'sort-asc':
        case 'sort-desc':
          const isSortingAsc = (args.command === 'sort-asc');
          this.sortColumn(event, args, isSortingAsc);
          break;
        default:
          break;
      }
    }
  }

  protected createParentMenu(e: DOMMouseOrTouchEvent<HTMLDivElement>, columnDef: Column, menu: HeaderMenuItems) {
    // let the user modify the menu or cancel altogether,
    // or provide alternative menu implementation.
    const callbackArgs = {
      grid: this.grid,
      column: columnDef,
      menu
    } as HeaderMenuCommandItemCallbackArgs;

    // execute optional callback method defined by the user, if it returns false then we won't go further and not open the grid menu
    if (typeof e.stopPropagation === 'function') {
      this.pubSubService.publish('onHeaderMenuBeforeMenuShow', callbackArgs);
      if (typeof this.addonOptions?.onBeforeMenuShow === 'function' && this.addonOptions?.onBeforeMenuShow(e, callbackArgs) === false) {
        return;
      }
    }

    // create 1st parent menu container & reposition it
    this._menuElm = this.createCommandMenu((menu.commandItems) as Array<MenuCommandItem | 'divider'>, columnDef);
    this.grid.getContainerNode()?.appendChild(this._menuElm);
    this.repositionMenu(e, this._menuElm);

    // execute optional callback method defined by the user
    this.pubSubService.publish('onHeaderMenuAfterMenuShow', callbackArgs);
    if (typeof this.addonOptions?.onAfterMenuShow === 'function' && this.addonOptions?.onAfterMenuShow(e, callbackArgs) === false) {
      return;
    }

    // Stop propagation so that it doesn't register as a header click event.
    e.preventDefault();
    e.stopPropagation();
  }

  /** Create the menu or sub-menu(s) but without the column picker which is a separate single process */
  protected createCommandMenu(commandItems: Array<MenuCommandItem | 'divider'>, columnDef: Column, level = 0, item?: MenuCommandItem | 'divider') {
    // to avoid having multiple sub-menu trees opened
    // we need to somehow keep trace of which parent menu the tree belongs to
    // and we should keep ref of only the first sub-menu parent, we can use the command name (remove any whitespaces though)
    const subMenuCommand = (item as MenuCommandItem)?.command;
    let subMenuId = (level === 1 && subMenuCommand) ? subMenuCommand.replace(/\s/g, '') : '';
    if (subMenuId) {
      this._subMenuParentId = subMenuId;
    }
    if (level > 1) {
      subMenuId = this._subMenuParentId;
    }

    const menuClasses = `${this.menuCssClass} slick-menu-level-${level} ${this.gridUid}`;
    const bodyMenuElm = document.body.querySelector<HTMLDivElement>(`.${this.menuCssClass}.slick-menu-level-${level}${this.gridUidSelector}`);

    // return menu/sub-menu if it's already opened unless we are on different sub-menu tree if so close them all
    if (bodyMenuElm) {
      if (bodyMenuElm.dataset.subMenuParent === subMenuId) {
        return bodyMenuElm;
      }
      this.disposeSubMenus();
    }

    const menuElm = createDomElement('div', {
      ariaExpanded: 'true',
      ariaLabel: level > 1 ? 'SubMenu' : 'Header Menu',
      role: 'menu',
      className: menuClasses,
      style: { minWidth: `${this.addonOptions.minWidth}px` },
    });
    if (level > 0) {
      menuElm.classList.add('slick-submenu');
      if (subMenuId) {
        menuElm.dataset.subMenuParent = subMenuId;
      }
    }

    const commandMenuElm = createDomElement('div', { className: `${this._menuCssPrefix}-command-list`, role: 'menu' }, menuElm);

    const callbackArgs = {
      grid: this.grid,
      column: columnDef,
      level,
      menu: { commandItems }
    } as unknown as HeaderMenuCommandItemCallbackArgs;

    // when creating sub-menu also add its sub-menu title when exists
    if (item && level > 0) {
      this.addSubMenuTitleWhenExists(item as MenuCommandItem, commandMenuElm); // add sub-menu title when exists
    }

    this.populateCommandOrOptionItems(
      'command',
      this.addonOptions,
      commandMenuElm,
      commandItems,
      callbackArgs,
      this.handleMenuItemCommandClick,
      this.handleMenuItemMouseOver
    );

    // increment level for possible next sub-menus if exists
    level++;

    return menuElm;
  }

  /**
   * Reset all the internal Menu options which have text to translate
   * @param header menu object
   */
  protected resetHeaderMenuTranslations(columnDefinitions: Column[]) {
    columnDefinitions.forEach((columnDef: Column) => {
      if (columnDef?.header?.menu?.commandItems && !columnDef.excludeFromHeaderMenu) {
        const columnHeaderMenuItems: Array<MenuCommandItem | 'divider'> = columnDef.header.menu.commandItems || [];
        this.extensionUtility.translateMenuItemsFromTitleKey(columnHeaderMenuItems);
      }
    });
  }

  /** Sort the current column */
  protected sortColumn(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, args: MenuCommandItemCallbackArgs, isSortingAsc = true) {
    if (args?.column) {
      // get previously sorted columns
      const columnDef = args.column;

      // 1- get the sort columns without the current column, in the case of a single sort that would equal to an empty array
      const tmpSortedColumns = !this.sharedService.gridOptions.multiColumnSort ? [] : this.sortService.getCurrentColumnSorts(columnDef.id + '');

      let emitterType = EmitterType.local;

      // 2- add to the column array, the new sorted column by the header menu
      tmpSortedColumns.push({ columnId: columnDef.id, sortCol: columnDef, sortAsc: isSortingAsc });

      if (this.sharedService.gridOptions.backendServiceApi) {
        this.sortService.onBackendSortChanged(event, { multiColumnSort: true, sortCols: tmpSortedColumns, grid: this.sharedService.slickGrid });
        emitterType = EmitterType.remote;
      } else if (this.sharedService.dataView) {
        this.sortService.onLocalSortChanged(this.sharedService.slickGrid, tmpSortedColumns);
        emitterType = EmitterType.local;
      } else {
        // when using customDataView, we will simply send it as a onSort event with notify
        args.grid.onSort.notify(tmpSortedColumns as unknown as MultiColumnSort);
      }

      // update the sharedService.slickGrid sortColumns array which will at the same add the visual sort icon(s) on the UI
      const newSortColumns = tmpSortedColumns.map(col => {
        return {
          columnId: col?.sortCol?.id ?? '',
          sortAsc: col?.sortAsc ?? true,
        };
      });

      // add sort icon in UI
      this.sharedService.slickGrid.setSortColumns(newSortColumns);

      // if we have an emitter type set, we will emit a sort changed
      // for the Grid State Service to see the change.
      // We also need to pass current sorters changed to the emitSortChanged method
      if (emitterType) {
        const currentLocalSorters: CurrentSorter[] = [];
        newSortColumns.forEach((sortCol) => {
          currentLocalSorters.push({
            columnId: `${sortCol.columnId}`,
            direction: sortCol.sortAsc ? 'ASC' : 'DESC'
          });
        });
        this.sortService.emitSortChanged(emitterType, currentLocalSorters);
      }
    }
  }
}