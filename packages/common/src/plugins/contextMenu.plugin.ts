import {
  ContextMenu,
  ContextMenuOption,
  Column,
  DOMMouseEvent,
  GetSlickEventType,
  GridOption,
  MenuCallbackArgs,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  MenuFromCellCallbackArgs,
  MenuOptionItem,
  MenuOptionItemCallbackArgs,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import { getDescendantProperty, getHtmlElementOffset, getTranslationPrefix, hasData, findWidthOrDefault, windowScrollPosition } from '../services/index';
import { exportWithFormatterWhenDefined } from '../formatters/formatterUtilities';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { BindingEventService } from '../services/bindingEvent.service';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';
import { TreeDataService } from '../services/treeData.service';
import { ExcelExportService, TextExportService } from '../services';
import { DelimiterType, FileType } from '../enums';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

/**
 * A plugin to add Context Menu (mouse right+click), it subscribes to the cell "onContextMenu" event.
 * The "contextMenu" is defined in the Grid Options object
 *
 * You can use it to change a data property (only 1) through a list of Options AND/OR through a list of Commands.
 * A good example of a Command would be an Export to CSV, that can be run from anywhere in the grid by doing a mouse right+click
 *
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.gridOptions = {
 *     enableContextMenu: true,
 *     contextMenu: {
 *       // ... context menu options
 *       commandItems: [{ ...menu item options... }, { ...menu item options... }]
 *     }
 *   };
 */
export class ContextMenuPlugin {
  protected _bindEventService: BindingEventService;
  protected _currentCell = -1;
  protected _currentRow = -1;
  protected _eventHandler!: SlickEventHandler;
  protected _commandTitleElm?: HTMLDivElement;
  protected _optionTitleElm?: HTMLDivElement;
  protected _addonOptions: ContextMenu = {};
  protected _menuElm?: HTMLDivElement | null;
  protected _defaults = {
    autoAdjustDrop: true,     // dropup/dropdown
    autoAlignSide: true,      // left/right
    autoAdjustDropOffset: 0,
    autoAlignSideOffset: 0,
    hideMenuOnScroll: false,
    maxHeight: 'none',
    width: 'auto',
    optionShownOverColumnIds: [],
    commandShownOverColumnIds: [],
  } as unknown as ContextMenuOption;
  pluginName: 'ContextMenu' = 'ContextMenu';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: PubSubService,
    protected readonly sharedService: SharedService,
    protected readonly treeDataService: TreeDataService,
  ) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
    this.init(sharedService.gridOptions.contextMenu);
  }

  get addonOptions(): ContextMenu {
    return this._addonOptions as ContextMenu;
  }
  set addonOptions(newOptions: ContextMenu) {
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
    return this._menuElm || document.querySelector(`.slick-context-menu${this.gridUidSelector}`);
  }

  /** Initialize plugin. */
  init(contextMenuOptions?: ContextMenu) {
    this._addonOptions = { ...this._defaults, ...contextMenuOptions };

    // merge the original commands with the built-in internal commands
    const originalCommandItems = this._addonOptions && Array.isArray(this._addonOptions.commandItems) ? this._addonOptions.commandItems : [];
    this._addonOptions.commandItems = [...originalCommandItems, ...this.addMenuCustomCommands(originalCommandItems)];
    this._addonOptions = { ...this._addonOptions };
    this.sharedService.gridOptions.contextMenu = this._addonOptions;

    // sort all menu items by their position order when defined
    this.sortMenuItems();

    const onContextMenuHandler = this.grid.onContextMenu;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onContextMenuHandler>>).subscribe(onContextMenuHandler, this.handleClick.bind(this) as EventListener);

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

      const isColumnOptionAllowed = this.checkIsColumnAllowed(this._addonOptions?.optionShownOverColumnIds ?? [], columnDef.id);
      const isColumnCommandAllowed = this.checkIsColumnAllowed(this._addonOptions?.commandShownOverColumnIds ?? [], columnDef.id);
      const commandItems = this._addonOptions?.commandItems || [];
      const optionItems = this._addonOptions?.optionItems || [];

      // make sure there's at least something to show before creating the Context Menu
      if (!columnDef || ((!isColumnCommandAllowed || !commandItems.length) && (!isColumnOptionAllowed || !optionItems.length))) {
        this.hideMenu();
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

      // delete any prior Context Menu
      this.closeMenu(event, callbackArgs);

      // execute optional callback method defined by the user, if it returns false then we won't go further and not open the Context Menu
      if (typeof event.stopPropagation === 'function') {
        this.pubSubService.publish('contextMenu:onBeforeMenuShow', callbackArgs);
        if (typeof this.addonOptions?.onBeforeMenuShow === 'function' && this.addonOptions?.onBeforeMenuShow(event, callbackArgs) === false) {
          return;
        }
      }

      const maxHeight = isNaN(this.addonOptions.maxHeight as any) ? this.addonOptions.maxHeight : `${this.addonOptions.maxHeight ?? 0}px`;

      // create a new Context Menu
      this._menuElm = document.createElement('div');
      this._menuElm.className = `slick-context-menu ${this.gridUid}`;
      this._menuElm.style.maxHeight = maxHeight as string;
      this._menuElm.style.width = findWidthOrDefault(this.addonOptions?.width);
      this._menuElm.style.top = `${event.pageY + 5}px`;
      this._menuElm.style.left = `${event.pageX}px`;
      this._menuElm.style.display = 'none';

      const closeButtonElm = document.createElement('button');
      closeButtonElm.className = 'close';
      closeButtonElm.type = 'button';
      closeButtonElm.dataset.dismiss = 'slick-context-menu';
      closeButtonElm.setAttribute('aria-label', 'Close');

      const closeSpanElm = document.createElement('span');
      closeSpanElm.className = 'close';
      closeSpanElm.innerHTML = '&times;';
      closeSpanElm.setAttribute('aria-hidden', 'true');
      closeButtonElm.appendChild(closeSpanElm);

      // -- Option List section
      if (!this.addonOptions.hideOptionSection && optionItems.length > 0) {
        const optionMenuElm = document.createElement('div');
        optionMenuElm.className = 'slick-context-menu-option-list';
        if (!this.addonOptions.hideCloseButton) {
          this._bindEventService.bind(closeButtonElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener);
          this._menuElm.appendChild(closeButtonElm);
        }
        this._menuElm.appendChild(optionMenuElm);
        this.populateOptionItems(
          this.addonOptions,
          optionMenuElm,
          optionItems,
          { cell: this._currentCell, row: this._currentRow, column: columnDef, dataContext, grid: this.grid }
        );
      }

      // -- Command List section
      if (!this.addonOptions.hideCommandSection && commandItems.length > 0) {
        const commandMenuElm = document.createElement('div');
        commandMenuElm.className = 'slick-context-menu-command-list';
        if (!this.addonOptions.hideCloseButton && (optionItems.length === 0 || this.addonOptions.hideOptionSection)) {
          this._bindEventService.bind(closeButtonElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleCloseButtonClicked(e)) as EventListener);
          this._menuElm.appendChild(closeButtonElm);
        }
        this._menuElm.appendChild(commandMenuElm);
        this.populateCommandItems(
          this.addonOptions,
          commandMenuElm,
          commandItems,
          { cell: this._currentCell, row: this._currentRow, column: columnDef, dataContext, grid: this.grid }
        );
      }

      this._menuElm.style.display = 'block';
      document.body.appendChild(this._menuElm);

      // execute optional callback method defined by the user
      this.pubSubService.publish('contextMenu:onAfterMenuShow', callbackArgs);
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

  /** Hide the Context Menu */
  hideMenu() {
    this.menuElement?.remove();
    this._menuElm = null;
  }

  setOptions(newOptions: ContextMenu) {
    this._addonOptions = { ...this._addonOptions, ...newOptions };
  }

  /** Translate the Context Menu titles, we need to loop through all column definition to re-translate all list titles & all commands/options */
  translateContextMenu() {
    const gridOptions = this.sharedService?.gridOptions ?? {};
    const contextMenu = this.sharedService.gridOptions.contextMenu;

    if (contextMenu && gridOptions?.enableTranslate) {
      // get both items list
      const columnContextMenuCommandItems: Array<MenuCommandItem | 'divider'> = contextMenu.commandItems || [];
      const columnContextMenuOptionItems: Array<MenuOptionItem | 'divider'> = contextMenu.optionItems || [];

      // translate their titles only if they have a titleKey defined
      if (contextMenu.commandTitleKey) {
        contextMenu.commandTitle = this.extensionUtility.translateWhenEnabledAndServiceExist(contextMenu.commandTitleKey, 'TEXT_COMMANDS') || contextMenu.commandTitle;
      }
      if (contextMenu.optionTitleKey) {
        contextMenu.optionTitle = this.extensionUtility.translateWhenEnabledAndServiceExist(contextMenu.optionTitleKey, 'TEXT_COMMANDS') || contextMenu.optionTitle;
      }

      // translate both command/option items (whichever is provided)
      this.extensionUtility.translateMenuItemsFromTitleKey(columnContextMenuCommandItems);
      this.extensionUtility.translateMenuItemsFromTitleKey(columnContextMenuOptionItems);
    }
  }

  // --
  // event handlers
  // ------------------

  protected handleClick(event: DOMMouseEvent<HTMLDivElement>, args: MenuCommandItemCallbackArgs) {
    const cell = this.grid.getCellFromEvent(event);
    if (cell) {
      const dataContext = this.grid.getDataItem(cell.row);
      const columnDef = this.grid.getColumns()[cell.cell];

      // merge the contextMenu of the column definition with the default properties
      this._addonOptions = { ...this._addonOptions, ...this.sharedService.gridOptions.contextMenu };

      // run the override function (when defined), if the result is false it won't go further
      if (!args) {
        args = {} as MenuCommandItemCallbackArgs;
      }
      args.cell = cell.cell;
      args.row = cell.row;
      args.column = columnDef;
      args.dataContext = dataContext;
      args.grid = this.grid;
      if (!this.extensionUtility.runOverrideFunctionWhenExists(this._addonOptions.menuUsabilityOverride, args)) {
        return;
      }

      // create the DOM element
      this._menuElm = this.createMenu(event);
      if (this._menuElm) {
        event.preventDefault();
      }

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

  protected handleMenuItemCommandClick(e: DOMMouseEvent<HTMLDivElement>, item: MenuCommandItem, row: number, cell: number) {
    if (item?.command !== undefined && !item.disabled && !item.divider) {
      const columnDef = this.grid.getColumns()[cell];
      const dataContext = this.grid.getDataItem(row);

      // user could execute a callback through 2 ways
      // via the onCommand event and/or an action callback
      const callbackArgs = {
        cell,
        row,
        grid: this.grid,
        command: item.command,
        item,
        column: columnDef,
        dataContext,
      } as MenuCommandItemCallbackArgs;

      // execute Context Menu callback with command,
      // we'll also execute optional user defined onCommand callback when provided
      // this.executeContextMenuInternalCustomCommands(event, callbackArgs);
      this.pubSubService.publish('contextMenu:onCommand', callbackArgs);
      if (typeof this._addonOptions?.onCommand === 'function') {
        this._addonOptions.onCommand(e, callbackArgs);
      }

      // execute action callback when defined
      if (typeof item.action === 'function') {
        item.action.call(this, e, callbackArgs);
      }

      // does the user want to leave open the Context Menu after executing a command?
      if (!e.defaultPrevented) {
        this.closeMenu(e, { cell, row, grid: this.grid });
      }
    }
  }

  protected handleMenuItemOptionClick(event: DOMMouseEvent<HTMLDivElement>, item: MenuOptionItem, row: number, cell: number) {
    if (item?.option !== undefined && !item.disabled && !item.divider) {
      if (!this.grid.getEditorLock().commitCurrentEdit()) {
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
        option: item.option,
        item,
        column: columnDef,
        dataContext,
      } as MenuOptionItemCallbackArgs;

      // execute Context Menu callback with command,
      // we'll also execute optional user defined onOptionSelected callback when provided
      // this.executeContextMenuInternalCustomCommands(event, callbackArgs);
      this.pubSubService.publish('contextMenu:onOptionSelected', callbackArgs);
      if (typeof this._addonOptions?.onOptionSelected === 'function') {
        this._addonOptions.onOptionSelected(event, callbackArgs);
      }

      // execute action callback when defined
      if (typeof item.action === 'function') {
        item.action.call(this, event, callbackArgs);
      }

      // does the user want to leave open the Context Menu after executing a command?
      if (!event.defaultPrevented) {
        this.closeMenu(event, { cell, row, grid: this.grid });
      }
    }
  }

  // --
  // protected functions
  // ------------------

  /** Create Context Menu with Custom Commands (copy cell value, export) */
  protected addMenuCustomCommands(originalCustomItems: Array<MenuCommandItem | 'divider'>) {
    const menuCustomItems: Array<MenuCommandItem | 'divider'> = [];
    const gridOptions = this.sharedService && this.sharedService.gridOptions || {};
    const contextMenu = gridOptions?.contextMenu;
    const dataView = this.sharedService?.dataView;
    const translationPrefix = getTranslationPrefix(gridOptions);

    // show context menu: Copy (cell value)
    if (contextMenu && !contextMenu.hideCopyCellValueCommand) {
      const commandName = 'copy';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        menuCustomItems.push(
          {
            iconCssClass: contextMenu.iconCopyCellValueCommand || 'fa fa-clone',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}COPY`, 'TEXT_COPY'),
            disabled: false,
            command: commandName,
            positionOrder: 50,
            action: (_e: Event, args: MenuCommandItemCallbackArgs) => {
              this.copyToClipboard(args);
            },
            itemUsabilityOverride: (args: MenuCallbackArgs) => {
              // make sure there's an item to copy before enabling this command
              const columnDef = args?.column as Column;
              const dataContext = args?.dataContext;
              if (typeof columnDef.queryFieldNameGetterFn === 'function') {
                const cellValue = this.getCellValueFromQueryFieldGetter(columnDef, dataContext);
                if (cellValue !== '' && cellValue !== undefined) {
                  return true;
                }
              } else if (columnDef && dataContext.hasOwnProperty(columnDef.field)) {
                return dataContext[columnDef.field] !== '' && dataContext[columnDef.field] !== null && dataContext[columnDef.field] !== undefined;
              }
              return false;
            }
          }
        );
      }
    }

    // show context menu: Export to file
    if ((gridOptions?.enableExport || gridOptions?.enableTextExport) && contextMenu && !contextMenu.hideExportCsvCommand) {
      const commandName = 'export-csv';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        menuCustomItems.push(
          {
            iconCssClass: contextMenu.iconExportCsvCommand || 'fa fa-download',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}EXPORT_TO_CSV`, 'TEXT_EXPORT_TO_CSV'),
            disabled: false,
            command: commandName,
            positionOrder: 51,
            action: () => {
              const registedServices = this.sharedService?.externalRegisteredResources || [];
              const excelService: TextExportService = registedServices.find((service: any) => service.className === 'TextExportService');
              if (excelService?.exportToFile) {
                excelService.exportToFile({
                  delimiter: DelimiterType.comma,
                  format: FileType.csv,
                });
              } else {
                throw new Error(`[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu. Example:: this.gridOptions = { enableTextExport: true, registerExternalResources: [new TextExportService()] };`);
              }
            },
          }
        );
      }
    }

    // show context menu: Export to Excel
    if (gridOptions && gridOptions.enableExcelExport && contextMenu && !contextMenu.hideExportExcelCommand) {
      const commandName = 'export-excel';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        menuCustomItems.push(
          {
            iconCssClass: contextMenu.iconExportExcelCommand || 'fa fa-file-excel-o text-success',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}EXPORT_TO_EXCEL`, 'TEXT_EXPORT_TO_EXCEL'),
            disabled: false,
            command: commandName,
            positionOrder: 52,
            action: () => {
              const registedServices = this.sharedService?.externalRegisteredResources || [];
              const excelService: ExcelExportService = registedServices.find((service: any) => service.className === 'ExcelExportService');
              if (excelService?.exportToExcel) {
                excelService.exportToExcel();
              } else {
                throw new Error(`[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Context Menu. Example:: this.gridOptions = { enableExcelExport: true, registerExternalResources: [new ExcelExportService()] };`);
              }
            },
          }
        );
      }
    }

    // show context menu: export to text file as tab delimited
    if ((gridOptions?.enableExport || gridOptions?.enableTextExport) && contextMenu && !contextMenu.hideExportTextDelimitedCommand) {
      const commandName = 'export-text-delimited';
      if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        menuCustomItems.push(
          {
            iconCssClass: contextMenu.iconExportTextDelimitedCommand || 'fa fa-download',
            title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}EXPORT_TO_TAB_DELIMITED`, 'TEXT_EXPORT_TO_TAB_DELIMITED'),
            disabled: false,
            command: commandName,
            positionOrder: 53,
            action: () => {
              const registedServices = this.sharedService?.externalRegisteredResources || [];
              const excelService: TextExportService = registedServices.find((service: any) => service.className === 'TextExportService');
              if (excelService?.exportToFile) {
                excelService.exportToFile({
                  delimiter: DelimiterType.tab,
                  format: FileType.txt,
                });
              } else {
                throw new Error(`[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu. Example:: this.gridOptions = { enableTextExport: true, registerExternalResources: [new TextExportService()] };`);
              }
            },
          }
        );
      }
    }

    // -- Grouping Commands
    if (gridOptions && (gridOptions.enableGrouping || gridOptions.enableDraggableGrouping || gridOptions.enableTreeData)) {
      // add a divider (separator) between the top sort commands and the other clear commands
      if (contextMenu && !contextMenu.hideCopyCellValueCommand) {
        menuCustomItems.push({ divider: true, command: '', positionOrder: 54 });
      }

      // show context menu: Clear Grouping (except for Tree Data which shouldn't have this feature)
      if (gridOptions && !gridOptions.enableTreeData && contextMenu && !contextMenu.hideClearAllGrouping) {
        const commandName = 'clear-grouping';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          menuCustomItems.push(
            {
              iconCssClass: contextMenu.iconClearGroupingCommand || 'fa fa-times',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}CLEAR_ALL_GROUPING`, 'TEXT_CLEAR_ALL_GROUPING'),
              disabled: false,
              command: commandName,
              positionOrder: 55,
              action: () => {
                dataView.setGrouping([]);
                this.pubSubService.publish('contextMenu:clearGrouping', true);
              },
              itemUsabilityOverride: () => {
                // only enable the command when there's an actually grouping in play
                const groupingArray = dataView && dataView.getGrouping && dataView.getGrouping();
                return Array.isArray(groupingArray) && groupingArray.length > 0;
              }
            }
          );
        }
      }

      // show context menu: Collapse all Groups
      if (gridOptions && contextMenu && !contextMenu.hideCollapseAllGroups) {
        const commandName = 'collapse-all-groups';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          menuCustomItems.push(
            {
              iconCssClass: contextMenu.iconCollapseAllGroupsCommand || 'fa fa-compress',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}COLLAPSE_ALL_GROUPS`, 'TEXT_COLLAPSE_ALL_GROUPS'),
              disabled: false,
              command: commandName,
              positionOrder: 56,
              action: () => {
                if (gridOptions.enableTreeData) {
                  this.treeDataService.toggleTreeDataCollapse(true);
                } else {
                  dataView.collapseAllGroups();
                }
              },
              itemUsabilityOverride: () => {
                if (gridOptions.enableTreeData) {
                  return true;
                }
                // only enable the command when there's an actually grouping in play
                const groupingArray = dataView && dataView.getGrouping && dataView.getGrouping();
                return Array.isArray(groupingArray) && groupingArray.length > 0;
              }
            }
          );
        }
      }

      // show context menu: Expand all Groups
      if (gridOptions && contextMenu && !contextMenu.hideExpandAllGroups) {
        const commandName = 'expand-all-groups';
        if (!originalCustomItems.some(item => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          menuCustomItems.push(
            {
              iconCssClass: contextMenu.iconExpandAllGroupsCommand || 'fa fa-expand',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}EXPAND_ALL_GROUPS`, 'TEXT_EXPAND_ALL_GROUPS'),
              disabled: false,
              command: commandName,
              positionOrder: 57,
              action: () => {
                if (gridOptions.enableTreeData) {
                  this.treeDataService.toggleTreeDataCollapse(false);
                } else {
                  dataView.expandAllGroups();
                }
              },
              itemUsabilityOverride: () => {
                if (gridOptions.enableTreeData) {
                  return true;
                }
                // only enable the command when there's an actually grouping in play
                const groupingArray = dataView && dataView.getGrouping && dataView.getGrouping();
                return Array.isArray(groupingArray) && groupingArray.length > 0;
              }
            }
          );
        }
      }
    }

    return menuCustomItems;
  }

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

  /** Construct the Option Items section. */
  protected populateOptionItems(contextMenu: ContextMenu, optionMenuElm: HTMLElement, optionItems: Array<MenuOptionItem | 'divider'>, args: Partial<MenuOptionItemCallbackArgs>) {
    if (args && optionItems && contextMenu) {
      // user could pass a title on top of the Options section
      if (contextMenu?.optionTitle) {
        this._optionTitleElm = document.createElement('div');
        this._optionTitleElm.className = 'title';
        this._optionTitleElm.textContent = contextMenu.optionTitle;
        optionMenuElm.appendChild(this._optionTitleElm);
      }

      for (let i = 0, ln = optionItems.length; i < ln; i++) {
        const item = optionItems[i];

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

        // when the override is defined, we need to use its result to update the disabled property
        // so that "handleMenuItemOptionClick" has the correct flag and won't trigger an option clicked event
        if (typeof item === 'object' && item.itemUsabilityOverride) {
          item.disabled = isItemUsable ? false : true;
        }

        const divOptionElm = document.createElement('div');
        divOptionElm.className = 'slick-context-menu-item';
        if (typeof item === 'object' && hasData(item?.option)) {
          divOptionElm.dataset.option = item.option;
        }
        optionMenuElm.appendChild(divOptionElm);

        if ((typeof item === 'object' && item.divider) || item === 'divider') {
          divOptionElm.classList.add('slick-context-menu-item-divider');
          continue;
        }

        if (item.disabled) {
          divOptionElm.classList.add('slick-context-menu-item-disabled');
        }

        if (item.hidden) {
          divOptionElm.classList.add('slick-context-menu-item-hidden');
        }

        if (item.cssClass) {
          divOptionElm.classList.add(...item.cssClass.split(' '));
        }

        if (item.tooltip) {
          divOptionElm.title = item.tooltip;
        }

        const iconElm = document.createElement('div');
        iconElm.className = 'slick-context-menu-icon';
        divOptionElm.appendChild(iconElm);

        if (item.iconCssClass) {
          iconElm.classList.add(...item.iconCssClass.split(' '));
        }

        if (item.iconImage) {
          console.warn('[Slickgrid-Universal] The "iconImage" property of a Context Menu item is now deprecated and will be removed in future version, consider using "iconCssClass" instead.');
          iconElm.style.backgroundImage = `url(${item.iconImage})`;
        }

        const textElm = document.createElement('span');
        textElm.className = 'slick-context-menu-content';
        textElm.textContent = typeof item === 'object' && item.title || '';
        divOptionElm.appendChild(textElm);

        if (item.textCssClass) {
          textElm.classList.add(...item.textCssClass.split(' '));
        }
        // execute command on menu item clicked
        this._bindEventService.bind(divOptionElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleMenuItemOptionClick(e, item, this._currentRow, this._currentCell)) as EventListener);
      }
    }
  }

  /** Construct the Command Items section. */
  protected populateCommandItems(contextMenu: ContextMenu, commandMenuElm: HTMLElement, commandItems: Array<MenuCommandItem | 'divider'>, args: Partial<MenuCommandItemCallbackArgs>) {
    if (args && commandItems && contextMenu) {
      // user could pass a title on top of the Commands section
      if (contextMenu?.commandTitle) {
        this._commandTitleElm = document.createElement('div');
        this._commandTitleElm.className = 'title';
        this._commandTitleElm.textContent = contextMenu.commandTitle;
        commandMenuElm.appendChild(this._commandTitleElm);
      }

      for (let i = 0, ln = commandItems.length; i < ln; i++) {
        const item = commandItems[i];

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

        const divCommandElm = document.createElement('div');
        divCommandElm.className = 'slick-context-menu-item';
        if (typeof item === 'object' && hasData(item?.command)) {
          divCommandElm.dataset.command = item.command;
        }
        commandMenuElm.appendChild(divCommandElm);

        if ((typeof item === 'object' && item.divider) || item === 'divider') {
          divCommandElm.classList.add('slick-context-menu-item-divider');
          continue;
        }

        if (item.disabled) {
          divCommandElm.classList.add('slick-context-menu-item-disabled');
        }

        if (item.hidden) {
          divCommandElm.classList.add('slick-context-menu-item-hidden');
        }

        if (item.cssClass) {
          divCommandElm.classList.add(...item.cssClass.split(' '));
        }

        if (item.tooltip) {
          divCommandElm.title = item.tooltip;
        }

        const iconElm = document.createElement('div');
        iconElm.className = 'slick-context-menu-icon';
        divCommandElm.appendChild(iconElm);

        if (item.iconCssClass) {
          iconElm.classList.add(...item.iconCssClass.split(' '));
        }

        if (item.iconImage) {
          console.warn('[Slickgrid-Universal] The "iconImage" property of a Context Menu item is now deprecated and will be removed in future version, consider using "iconCssClass" instead.');
          iconElm.style.backgroundImage = `url(${item.iconImage})`;
        }

        const textElm = document.createElement('span');
        textElm.className = 'slick-context-menu-content';
        textElm.textContent = typeof item === 'object' && item.title || '';
        divCommandElm.appendChild(textElm);

        if (item.textCssClass) {
          textElm.classList.add(...item.textCssClass.split(' '));
        }
        // execute command on menu item clicked
        this._bindEventService.bind(divCommandElm, 'click', ((e: DOMMouseEvent<HTMLDivElement>) => this.handleMenuItemCommandClick(e, item, this._currentRow, this._currentCell)) as EventListener);
      }
    }
  }

  protected repositionMenu(event: DOMMouseEvent<HTMLDivElement>) {
    if (this._menuElm && event.target) {
      const parentElm = event.target.closest('.slick-cell') as HTMLDivElement;
      let menuOffsetLeft = event.pageX;
      let menuOffsetTop = event.pageY;
      const menuHeight = this._menuElm?.offsetHeight ?? 0;
      const menuWidth = this._menuElm?.offsetWidth || this._addonOptions.width || 0;
      const rowHeight = +(this.gridOptions.rowHeight ?? 0);
      const dropOffset = +(this._addonOptions.autoAdjustDropOffset ?? 0);
      const sideOffset = +(this._addonOptions.autoAlignSideOffset ?? 0);

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
          menuOffsetLeft = (menuOffsetLeft - ((+menuWidth) /* - parentCellWidth */) - sideOffset);
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

  protected checkIsColumnAllowed(columnIds: Array<number | string>, columnId: number | string): boolean {
    if (columnIds?.length > 0) {
      return columnIds.findIndex(colId => colId === columnId) >= 0;
    }
    return true;
  }

  /**
   * First get the value, if "exportWithFormatter" is set then we'll use the formatter output
   * Then we create the DOM trick to copy a text value by creating a fake <div> that is not shown to the user
   * and from there we can call the execCommand 'copy' command and expect the value to be in clipboard
   * @param args
   */
  protected copyToClipboard(args: MenuCommandItemCallbackArgs) {
    try {
      if (args && args.grid && args.command) {
        // get the value, if "exportWithFormatter" is set then we'll use the formatter output
        const gridOptions = this.sharedService && this.sharedService.gridOptions || {};
        const cell = args && args.cell || 0;
        const row = args && args.row || 0;
        const columnDef = args?.column;
        const dataContext = args?.dataContext;
        const grid = this.sharedService && this.sharedService.slickGrid;
        const exportOptions = gridOptions && (gridOptions.excelExportOptions || { ...gridOptions.exportOptions, ...gridOptions.textExportOptions });
        let textToCopy = exportWithFormatterWhenDefined(row, cell, columnDef, dataContext, grid, exportOptions);

        if (typeof columnDef.queryFieldNameGetterFn === 'function') {
          textToCopy = this.getCellValueFromQueryFieldGetter(columnDef, dataContext);
        }

        // create fake <textarea> (positioned outside of the screen) to copy into clipboard & delete it from the DOM once we're done
        const tmpElem = document.createElement('textarea') as HTMLTextAreaElement;
        if (tmpElem && document.body) {
          tmpElem.style.position = 'absolute';
          tmpElem.style.left = '-1000px';
          tmpElem.style.top = '-1000px';
          tmpElem.value = textToCopy;
          document.body.appendChild(tmpElem);
          tmpElem.select();
          const success = document.execCommand('copy', false, textToCopy);
          if (success) {
            tmpElem.remove();
          }
        }
      }
    } catch (e) {
      /* do nothing */
    }
  }

  /**
   * When a queryFieldNameGetterFn is defined, then get the value from that getter callback function
   * @param columnDef
   * @param dataContext
   * @return cellValue
   */
  protected getCellValueFromQueryFieldGetter(columnDef: Column, dataContext: any): string {
    let cellValue = '';

    if (typeof columnDef.queryFieldNameGetterFn === 'function') {
      const queryFieldName = columnDef.queryFieldNameGetterFn(dataContext);

      // get the cell value from the item or when it's a dot notation then exploded the item and get the final value
      if (queryFieldName?.indexOf('.') >= 0) {
        cellValue = getDescendantProperty(dataContext, queryFieldName);
      } else {
        cellValue = dataContext[queryFieldName];
      }
    }

    return cellValue;
  }

  /** sort all menu items by their position order when defined */
  protected sortMenuItems() {
    const contextMenu = this.sharedService?.gridOptions?.contextMenu;
    if (contextMenu) {
      this.extensionUtility.sortItems(contextMenu.commandItems || [], 'positionOrder');
      this.extensionUtility.sortItems(contextMenu.optionItems || [], 'positionOrder');
    }
  }
}