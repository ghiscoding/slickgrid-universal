import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import {
  arrayRemoveItemByIndex,
  calculateAvailableSpace,
  classNameToList,
  createDomElement,
  getOffsetRelativeToParent,
  getOffset,
  toKebabCase,
} from '@slickgrid-universal/utils';

import type { EmitterType } from '../enums/index.js';
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
} from '../interfaces/index.js';
import type { SlickEventData } from '../core/slickCore.js';
import { getTranslationPrefix } from '../services/index.js';
import type { ExtensionUtility } from '../extensions/extensionUtility.js';
import type { FilterService } from '../services/filter.service.js';
import type { SharedService } from '../services/shared.service.js';
import type { SortService } from '../services/sort.service.js';
import { type ExtendableItemTypes, type ExtractMenuType, MenuBaseClass, type MenuType } from './menuBaseClass.js';

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
    protected readonly sortService: SortService
  ) {
    super(extensionUtility, pubSubService, sharedService);
    this._menuCssPrefix = 'slick-menu';
    this._menuPluginCssPrefix = 'slick-header-menu';
    this._camelPluginName = 'headerMenu';
    this.init(sharedService.gridOptions.headerMenu);
  }

  /** Initialize plugin. */
  init(headerMenuOptions?: HeaderMenu): void {
    this._addonOptions = { ...this._defaults, ...headerMenuOptions };

    // when setColumns is called (could be via toggle filtering/sorting or anything else),
    // we need to recreate header menu items custom commands array before the `onHeaderCellRendered` gets called
    this._eventHandler.subscribe(this.grid.onBeforeSetColumns, (e, args) => {
      this.sharedService.gridOptions.headerMenu = this.addHeaderMenuCustomCommands(args.newColumns);
    });
    this._eventHandler.subscribe(this.grid.onHeaderCellRendered, this.handleHeaderCellRendered.bind(this));
    this._eventHandler.subscribe(this.grid.onBeforeHeaderCellDestroy, this.handleBeforeHeaderCellDestroy.bind(this));
    this._eventHandler.subscribe(this.grid.onClick, this.hideMenu.bind(this));

    // force the grid to re-render the header after the events are hooked up.
    this.grid.setColumns(this.grid.getColumns());

    // hide the menu when clicking outside the grid
    this._bindEventService.bind(document.body, 'mousedown', this.handleBodyMouseDown.bind(this) as EventListener);
  }

  /** Dispose (destroy) of the plugin */
  dispose(): void {
    super.dispose();
    this._menuElm = this._menuElm || document.body.querySelector(`.slick-header-menu${this.gridUidSelector}`);
    this._menuElm?.remove();
    this._activeHeaderColumnElm = undefined;
  }

  /** Hide a column from the grid */
  hideColumn(column: Column): void {
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
      this.pubSubService.publish('onHideColumns', { columns: visibleColumns, hiddenColumn: column });
    }
  }

  /** Hide the Header Menu */
  hideMenu(): void {
    this.disposeSubMenus();
    this._menuElm?.remove();
    this._menuElm = undefined;
  }

  repositionSubMenu(e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData, item: MenuCommandItem, level: number, columnDef: Column): void {
    // creating sub-menu, we'll also pass level & the item object since we might have "subMenuTitle" to show
    const subMenuElm = this.createCommandMenu(item.commandItems || [], columnDef, level + 1, item);
    document.body.appendChild(subMenuElm);
    this.repositionMenu(e, subMenuElm);
  }

  repositionMenu(e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData, menuElm: HTMLDivElement): void {
    const buttonElm = e.target as HTMLDivElement; // get header button createElement
    const isSubMenu = menuElm.classList.contains('slick-submenu');
    const parentElm = isSubMenu ? ((e.target as HTMLElement).closest('.slick-menu-item') as HTMLDivElement) : (buttonElm as HTMLElement);

    const containerElm: HTMLElement = this.sharedService.gridContainerElement.classList.contains('slickgrid-container')
      ? this.sharedService.gridContainerElement
      : (this.sharedService.gridContainerElement.querySelector('.slickgrid-container') ?? this.sharedService.gridContainerElement);
    const relativePos = getOffsetRelativeToParent(containerElm, buttonElm);
    const gridPos = this.grid.getGridPosition();
    const menuWidth = menuElm.offsetWidth;
    const parentOffset = getOffset(parentElm);
    let menuOffsetLeft = isSubMenu ? parentOffset.left : (relativePos?.left ?? 0);
    let menuOffsetTop = isSubMenu
      ? parentOffset.top
      : (relativePos?.top ?? 0) + (this.addonOptions?.menuOffsetTop ?? 0) + buttonElm.clientHeight;

    // for sub-menus only, auto-adjust drop position (up/down)
    //  we first need to see what position the drop will be located (defaults to bottom)
    if (isSubMenu) {
      // since we reposition menu below slick cell, we need to take it in consideration and do our calculation from that element
      const menuHeight = menuElm?.clientHeight || 0;
      const { bottom: availableSpaceBottom, top: availableSpaceTop } = calculateAvailableSpace(parentElm);
      const dropPosition = availableSpaceBottom < menuHeight && availableSpaceTop > availableSpaceBottom ? 'top' : 'bottom';
      if (dropPosition === 'top') {
        menuElm.classList.remove('dropdown');
        menuElm.classList.add('dropup');
        menuOffsetTop -= menuHeight - parentElm.clientHeight;
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
      const dropSide = subMenuPosCalc >= gridPos.width || subMenuPosCalc >= browserWidth ? 'left' : 'right';
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
      if (this.addonOptions.autoAlign && gridPos?.width && menuOffsetLeft + (menuElm.clientWidth ?? 0) >= gridPos.width) {
        menuOffsetLeft = menuOffsetLeft + buttonElm.clientWidth - menuElm.clientWidth + (this.addonOptions?.autoAlignOffset || 0);
      }
    }

    // ready to reposition the menu
    menuElm.style.top = `${menuOffsetTop}px`;
    menuElm.style.left = `${menuOffsetLeft}px`;
  }

  /** Translate the Header Menu titles, we need to loop through all column definition to re-translate them */
  translateHeaderMenu(): void {
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
  protected handleHeaderCellRendered(_e: SlickEventData, args: OnHeaderCellRenderedEventArgs): void {
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
  protected handleBeforeHeaderCellDestroy(_e: SlickEventData, args: { column: Column; node: HTMLElement }): void {
    const column = args.column;

    if (column.header?.menu) {
      // Removing buttons will also clean up any event handlers and data.
      // NOTE: If you attach event handlers directly or using a different framework,
      //       you must also clean them up here to avoid events leaking.
      args.node.querySelectorAll('.slick-header-menu-button').forEach((elm) => elm.remove());
    }
  }

  /** Mouse down handler when clicking anywhere in the DOM body */
  protected handleBodyMouseDown(e: DOMEvent<HTMLElement>): void {
    if (this.menuElement) {
      let isMenuClicked = false;
      const parentMenuElm = e.target.closest(`.${this.menuCssClass}`);

      // did we click inside the menu or any of its sub-menu(s)
      if (this.menuElement.contains(e.target) || parentMenuElm) {
        isMenuClicked = true;
      }

      if ((this._menuElm !== e.target && !isMenuClicked && !e.defaultPrevented) || (e.target.className === 'close' && parentMenuElm)) {
        this.hideMenu();
      }
    }
  }

  protected handleMenuItemCommandClick(
    event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData,
    _type: MenuType,
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    level = 0,
    columnDef?: Column
  ): boolean | void {
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

  protected handleMenuItemMouseOver(
    e: DOMMouseOrTouchEvent<HTMLElement> | SlickEventData,
    _type: MenuType,
    item: ExtractMenuType<ExtendableItemTypes, MenuType>,
    level = 0,
    columnDef?: Column
  ): void {
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
   * @param columns
   * @return header menu
   */
  protected addHeaderMenuCustomCommands(columns: Column[]): HeaderMenu {
    const gridOptions = this.sharedService.gridOptions;
    const headerMenuOptions = gridOptions.headerMenu || {};
    const translationPrefix = getTranslationPrefix(gridOptions);
    const commandLabels = this._addonOptions?.commandLabels;

    if (Array.isArray(columns) && gridOptions.enableHeaderMenu) {
      columns.forEach((columnDef: Column) => {
        if (columnDef && !columnDef.excludeFromHeaderMenu) {
          if (!columnDef.header) {
            columnDef.header = {
              menu: {
                commandItems: [],
              },
            };
          } else if (!columnDef.header.menu) {
            // we might have header buttons without header menu,
            // so only initialize the header menu without overwrite header buttons
            columnDef.header.menu = { commandItems: [] };
          }
          const columnHeaderMenuItems: Array<MenuCommandItem | 'divider'> = columnDef?.header?.menu?.commandItems ?? [];
          const cmdExists = (commandName: string) =>
            columnHeaderMenuItems.some((item) => item !== 'divider' && 'command' in item && item.command === commandName);

          // Freeze Column (pinning)
          let hasFrozenOrResizeCommand = false;
          if (headerMenuOptions && !headerMenuOptions.hideFreezeColumnsCommand) {
            hasFrozenOrResizeCommand = true;
            if (gridOptions.frozenColumn === columns.findIndex((col) => col.id === columnDef.id)) {
              // make sure the "freeze-columns" doesn't exist before adding the "unfreeze-columns"
              this.removeCommandWhenFound(columnHeaderMenuItems, 'freeze-columns');

              // add unfreeze command
              const cmdUnfreeze = 'unfreeze-columns';
              if (!cmdExists(cmdUnfreeze)) {
                columnHeaderMenuItems.push({
                  _orgTitle: commandLabels?.unfreezeColumnsCommand || '',
                  iconCssClass: headerMenuOptions.iconUnfreezeColumns || 'mdi mdi-pin-off-outline',
                  titleKey: `${translationPrefix}UNFREEZE_COLUMNS`,
                  command: cmdUnfreeze,
                  positionOrder: 45,
                });
              }
            } else {
              // make sure the "unfreeze-columns" doesn't exist before adding the "freeze-columns"
              this.removeCommandWhenFound(columnHeaderMenuItems, 'unfreeze-columns');

              // add freeze command
              const cmdFreeze = 'freeze-columns';
              if (!cmdExists(cmdFreeze)) {
                columnHeaderMenuItems.push({
                  _orgTitle: commandLabels?.freezeColumnsCommand || '',
                  iconCssClass: headerMenuOptions.iconFreezeColumns || 'mdi mdi-pin-outline',
                  titleKey: `${translationPrefix}FREEZE_COLUMNS`,
                  command: cmdFreeze,
                  positionOrder: 45,
                });
              }
            }
          }

          // Column Resize by Content (column autofit)
          if (
            headerMenuOptions &&
            !headerMenuOptions.hideColumnResizeByContentCommand &&
            this.sharedService.gridOptions.enableColumnResizeOnDoubleClick
          ) {
            hasFrozenOrResizeCommand = true;
            const cmdResize = 'column-resize-by-content';
            if (!cmdExists(cmdResize)) {
              columnHeaderMenuItems.push({
                _orgTitle: commandLabels?.columnResizeByContentCommand || '',
                iconCssClass: headerMenuOptions.iconColumnResizeByContentCommand || 'mdi mdi-arrow-expand-horizontal',
                titleKey: `${translationPrefix}COLUMN_RESIZE_BY_CONTENT`,
                command: cmdResize,
                positionOrder: 47,
              });
            }
          }

          // add a divider (separator) between the top freeze columns commands and the rest of the commands
          if (hasFrozenOrResizeCommand && !columnHeaderMenuItems.some((item) => item !== 'divider' && item.positionOrder === 48)) {
            columnHeaderMenuItems.push({ divider: true, command: '', positionOrder: 48 });
          }

          // Sorting Commands
          if (gridOptions.enableSorting && columnDef.sortable && headerMenuOptions && !headerMenuOptions.hideSortCommands) {
            const cmdAscName = 'sort-asc';
            const cmdDescName = 'sort-desc';
            if (!cmdExists(cmdAscName)) {
              columnHeaderMenuItems.push({
                _orgTitle: commandLabels?.sortAscCommand || '',
                iconCssClass: headerMenuOptions.iconSortAscCommand || 'mdi mdi-sort-ascending',
                titleKey: `${translationPrefix}SORT_ASCENDING`,
                command: cmdAscName,
                positionOrder: 50,
              });
            }
            if (!cmdExists(cmdDescName)) {
              columnHeaderMenuItems.push({
                _orgTitle: commandLabels?.sortDescCommand || '',
                iconCssClass: headerMenuOptions.iconSortDescCommand || 'mdi mdi-sort-descending',
                titleKey: `${translationPrefix}SORT_DESCENDING`,
                command: cmdDescName,
                positionOrder: 51,
              });
            }

            // add a divider (separator) between the top sort commands and the other clear commands
            if (!columnHeaderMenuItems.some((item) => item !== 'divider' && item.positionOrder === 52)) {
              columnHeaderMenuItems.push({ divider: true, command: '', positionOrder: 52 });
            }

            const cmdClearSort = 'clear-sort';
            if (!headerMenuOptions.hideClearSortCommand && !cmdExists(cmdClearSort)) {
              columnHeaderMenuItems.push({
                _orgTitle: commandLabels?.clearSortCommand || '',
                iconCssClass: headerMenuOptions.iconClearSortCommand || 'mdi mdi-sort-variant-off',
                titleKey: `${translationPrefix}REMOVE_SORT`,
                command: cmdClearSort,
                positionOrder: 58,
              });
            }
          }

          // Filter Shortcuts via sub-menus
          const cmdShortcutName = 'filter-shortcuts-root-menu';
          if (columnDef.filter?.filterShortcuts && !cmdExists(cmdShortcutName)) {
            const shortcutSubItems: MenuCommandItem[] = [];
            columnDef.filter.filterShortcuts.forEach((fs) => {
              // use the Title name as the command key in kebab cas
              const command = fs.title ? toKebabCase(fs.title) : (fs.titleKey || '').toLowerCase().replaceAll('_', '-');

              shortcutSubItems.push({
                ...fs,
                command,
                action: (_e, args) => {
                  // get associated Column Filter instance and use its `setValues()` method to update the filter with provided `searchTerms`
                  const filterRef = this.filterService.getFiltersMetadata().find((f) => f.columnDef.id === args.column.id);
                  filterRef?.setValues(fs.searchTerms, fs.operator, true);
                },
              });
            });

            const filterShortcutsPositionOrder = headerMenuOptions.filterShortcutsPositionOrder ?? 55;
            columnHeaderMenuItems.push({
              _orgTitle: commandLabels?.filterShortcutsCommand || '',
              iconCssClass: headerMenuOptions.iconFilterShortcutSubMenu || 'mdi mdi-filter-outline',
              titleKey: `${translationPrefix}FILTER_SHORTCUTS`,
              command: cmdShortcutName,
              positionOrder: filterShortcutsPositionOrder,
              commandItems: shortcutSubItems,
            });

            // add a divider (separator) between the top freeze columns commands and the rest of the commands
            if (
              hasFrozenOrResizeCommand &&
              !columnHeaderMenuItems.some((item) => item !== 'divider' && item.positionOrder === filterShortcutsPositionOrder + 1)
            ) {
              columnHeaderMenuItems.push({ divider: true, command: '', positionOrder: filterShortcutsPositionOrder + 1 });
            }
          }

          // Filtering Commands
          const cmdRemoveFilter = 'clear-filter';
          if (gridOptions.enableFiltering && columnDef.filterable && headerMenuOptions && !headerMenuOptions.hideFilterCommand) {
            if (!headerMenuOptions.hideClearFilterCommand && !cmdExists(cmdRemoveFilter)) {
              columnHeaderMenuItems.push({
                _orgTitle: commandLabels?.clearFilterCommand || '',
                iconCssClass: headerMenuOptions.iconClearFilterCommand || 'mdi mdi-filter-remove-outline',
                titleKey: `${translationPrefix}REMOVE_FILTER`,
                command: cmdRemoveFilter,
                positionOrder: 57,
              });
            }
          }

          // Hide Column Command
          const cmdHideColumn = 'hide-column';
          if (headerMenuOptions && !headerMenuOptions.hideColumnHideCommand && !cmdExists(cmdHideColumn)) {
            columnHeaderMenuItems.push({
              _orgTitle: commandLabels?.hideColumnCommand || '',
              iconCssClass: headerMenuOptions.iconColumnHideCommand || 'mdi mdi-close',
              titleKey: `${translationPrefix}HIDE_COLUMN`,
              command: cmdHideColumn,
              positionOrder: 59,
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
  protected clearColumnFilter(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, args: MenuCommandItemCallbackArgs): void {
    if (args?.column) {
      this.filterService.clearFilterByColumnId(event, args.column.id);
    }
  }

  /** Clear the Sort on the current column (if it's actually sorted) */
  protected clearColumnSort(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData, args: MenuCommandItemCallbackArgs): void {
    if (args?.column && this.sharedService) {
      this.sortService.clearSortByColumnId(event, args.column.id);
    }
  }

  protected removeCommandWhenFound(columnHeaderMenuItems: Array<MenuCommandItem | 'divider'>, command: string): void {
    const commandIdx = columnHeaderMenuItems.findIndex((item) => item !== 'divider' && item?.command === command);
    if (commandIdx >= 0) {
      columnHeaderMenuItems.splice(commandIdx, 1);
    }
  }

  /** freeze or unfreeze columns command */
  protected freezeOrUnfreezeColumns(column: Column, command: 'freeze-columns' | 'unfreeze-columns'): void {
    const visibleColumns = [...this.sharedService.visibleColumns];
    const columnPosition = visibleColumns.findIndex((col) => col.id === column.id);
    const newGridOptions = {
      frozenColumn: command === 'unfreeze-columns' ? -1 : columnPosition,
      enableMouseWheelScrollHandler: true,
    };

    // remove the last freeze/unfreeze command called from Header Menu since it will be replaced by the other one when reopening the menu
    const columnHeaderMenuItems: Array<MenuCommandItem | 'divider'> = column?.header?.menu?.commandItems ?? [];
    this.removeCommandWhenFound(columnHeaderMenuItems, command);

    // to circumvent a bug in SlickGrid core lib, let's keep the columns positions ref and re-apply them after calling setOptions
    // the bug is highlighted in this issue comment:: https://github.com/6pac/SlickGrid/issues/592#issuecomment-822885069
    const previousColumnDefinitions = this.sharedService.slickGrid.getColumns();

    this.sharedService.slickGrid.setOptions(newGridOptions, false, true); // suppress the setColumns (3rd argument) since we'll do that ourselves
    this.sharedService.gridOptions.frozenColumn = newGridOptions.frozenColumn;
    this.sharedService.gridOptions.enableMouseWheelScrollHandler = newGridOptions.enableMouseWheelScrollHandler;
    this.sharedService.frozenVisibleColumnId = column.id;

    let finalVisibleColumns = [];
    if (command === 'freeze-columns') {
      // to freeze columns, we need to take only the visible columns and we also need to use setColumns() when some of them are hidden
      // to make sure that we only use the visible columns, not doing this will have the undesired effect of showing back some of the hidden columns
      // prettier-ignore
      if (this.sharedService.hasColumnsReordered || (Array.isArray(visibleColumns) && Array.isArray(this.sharedService.allColumns) && visibleColumns.length !== this.sharedService.allColumns.length)) {
        finalVisibleColumns = visibleColumns;
      } else {
        // to circumvent a bug in SlickGrid core lib re-apply same column definitions that were backed up before calling setOptions()
        finalVisibleColumns = previousColumnDefinitions;
      }
    } else {
      finalVisibleColumns = visibleColumns;
    }
    this.sharedService.slickGrid.setColumns(finalVisibleColumns);

    // we also need to autosize columns if the option is enabled
    const gridOptions = this.sharedService.slickGrid.getOptions();
    if (gridOptions.enableAutoSizeColumns) {
      this.sharedService.slickGrid.autosizeColumns();
    }
  }

  /** Execute the Header Menu Commands that was triggered by the onCommand subscribe */
  protected executeHeaderMenuInternalCommands(
    event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData,
    args: MenuCommandItemCallbackArgs
  ): void {
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
          this.freezeOrUnfreezeColumns(args.column, args.command);
          break;
        case 'unfreeze-columns':
          this.freezeOrUnfreezeColumns(args.column, args.command);
          break;
        case 'sort-asc':
        case 'sort-desc':
          const isSortingAsc = args.command === 'sort-asc';
          this.sortColumn(event, args, isSortingAsc);
          break;
        default:
          break;
      }
    }
  }

  protected createParentMenu(e: DOMMouseOrTouchEvent<HTMLDivElement>, columnDef: Column, menu: HeaderMenuItems): void {
    // let the user modify the menu or cancel altogether,
    // or provide alternative menu implementation.
    const callbackArgs = {
      grid: this.grid,
      column: columnDef,
      menu,
    } as HeaderMenuCommandItemCallbackArgs;

    // execute optional callback method defined by the user, if it returns false then we won't go further and not open the grid menu
    if (typeof e.stopPropagation === 'function') {
      this.pubSubService.publish('onHeaderMenuBeforeMenuShow', callbackArgs);
      if (typeof this.addonOptions?.onBeforeMenuShow === 'function' && this.addonOptions?.onBeforeMenuShow(e, callbackArgs) === false) {
        return;
      }
    }

    // create 1st parent menu container & reposition it
    this._menuElm = this.createCommandMenu(menu.commandItems as Array<MenuCommandItem | 'divider'>, columnDef);
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
  protected createCommandMenu(
    commandItems: Array<MenuCommandItem | 'divider'>,
    columnDef: Column,
    level = 0,
    item?: MenuCommandItem | 'divider'
  ): HTMLDivElement {
    // to avoid having multiple sub-menu trees opened
    // we need to somehow keep trace of which parent menu the tree belongs to
    // and we should keep ref of only the first sub-menu parent, we can use the command name (remove any whitespaces though)
    const subMenuCommand = (item as MenuCommandItem)?.command;
    let subMenuId = level === 1 && subMenuCommand ? subMenuCommand.replace(/\s/g, '') : '';
    if (subMenuId) {
      this._subMenuParentId = subMenuId;
    }
    if (level > 1) {
      subMenuId = this._subMenuParentId;
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
      // add dark mode CSS class when enabled
      if (this.gridOptions?.darkMode) {
        menuElm.classList.add('slick-dark-mode');
      }
    }

    const commandMenuElm = createDomElement('div', { className: `${this._menuCssPrefix}-command-list`, role: 'menu' }, menuElm);

    const callbackArgs = {
      grid: this.grid,
      column: columnDef,
      level,
      menu: { commandItems },
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
  protected resetHeaderMenuTranslations(columns: Column[]): void {
    columns.forEach((columnDef: Column) => {
      if (columnDef?.header?.menu?.commandItems && !columnDef.excludeFromHeaderMenu) {
        const columnHeaderMenuItems: Array<MenuCommandItem | 'divider'> = columnDef.header.menu.commandItems || [];
        this.extensionUtility.translateMenuItemsFromTitleKey(columnHeaderMenuItems);
      }
    });
  }

  /** Sort the current column */
  protected sortColumn(
    event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData,
    args: MenuCommandItemCallbackArgs,
    isSortingAsc = true
  ): void {
    if (args?.column) {
      // get previously sorted columns
      const columnDef = args.column;

      // 1- get the sort columns without the current column, in the case of a single sort that would equal to an empty array
      // prettier-ignore
      const tmpSortedColumns = !this.sharedService.gridOptions.multiColumnSort ? [] : this.sortService.getCurrentColumnSorts(columnDef.id + '');

      let emitterType: EmitterType = 'local';

      // 2- add to the column array, the new sorted column by the header menu
      tmpSortedColumns.push({ columnId: columnDef.id, sortCol: columnDef, sortAsc: isSortingAsc });

      if (this.sharedService.gridOptions.backendServiceApi) {
        this.sortService.onBackendSortChanged(event, {
          multiColumnSort: true,
          sortCols: tmpSortedColumns,
          grid: this.sharedService.slickGrid,
        });
        emitterType = 'remote';
      } else if (this.sharedService.dataView) {
        this.sortService.onLocalSortChanged(this.sharedService.slickGrid, tmpSortedColumns);
        emitterType = 'local';
      } else {
        // when using customDataView, we will simply send it as a onSort event with notify
        args.grid.onSort.notify(tmpSortedColumns as unknown as MultiColumnSort);
      }

      // update the sharedService.slickGrid sortColumns array which will at the same add the visual sort icon(s) on the UI
      const newSortColumns = tmpSortedColumns.map((col) => {
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
            direction: sortCol.sortAsc ? 'ASC' : 'DESC',
          });
        });
        this.sortService.emitSortChanged(emitterType, currentLocalSorters);
      }
    }
  }
}
