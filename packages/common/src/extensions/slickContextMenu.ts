import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import type {
  ContextMenu,
  ContextMenuOption,
  Column,
  MenuCallbackArgs,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  MenuOptionItem,
} from '../interfaces/index.js';
import type { SlickEventData, SlickGrid } from '../core/index.js';
import { DelimiterType, FileType } from '../enums/index.js';
import { type ExcelExportService, getCellValueFromQueryFieldGetter, getTranslationPrefix, type TextExportService } from '../services/index.js';
import { exportWithFormatterWhenDefined } from '../formatters/formatterUtilities.js';
import type { ExtensionUtility } from '../extensions/extensionUtility.js';
import type { SharedService } from '../services/shared.service.js';
import type { TreeDataService } from '../services/treeData.service.js';
import { MenuFromCellBaseClass } from './menuFromCellBaseClass.js';

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
export class SlickContextMenu extends MenuFromCellBaseClass<ContextMenu> {
  protected _defaults = {
    autoAdjustDrop: true, // dropup/dropdown
    autoAlignSide: true, // left/right
    autoAdjustDropOffset: 0,
    autoAlignSideOffset: 0,
    hideMenuOnScroll: false,
    optionShownOverColumnIds: [],
    commandShownOverColumnIds: [],
    subMenuOpenByEvent: 'mouseover',
  } as unknown as ContextMenuOption;
  pluginName: 'ContextMenu' = 'ContextMenu' as const;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService,
    protected readonly treeDataService: TreeDataService
  ) {
    super(extensionUtility, pubSubService, sharedService);
    this._camelPluginName = 'contextMenu';
    this._menuCssPrefix = 'slick-menu';
    this._menuPluginCssPrefix = 'slick-context-menu';
    this.init(sharedService.gridOptions.contextMenu);
  }

  /** Initialize plugin. */
  init(contextMenuOptions?: ContextMenu): void {
    this._addonOptions = { ...this._defaults, ...contextMenuOptions };

    // merge the original commands with the built-in internal commands
    const originalCommandItems = this._addonOptions && Array.isArray(this._addonOptions.commandItems) ? this._addonOptions.commandItems : [];
    this._addonOptions.commandItems = [...originalCommandItems, ...this.addMenuCustomCommands(originalCommandItems)];
    this._addonOptions = { ...this._addonOptions };
    this.sharedService.gridOptions.contextMenu = this._addonOptions;

    // sort all menu items by their position order when defined
    this.sortMenuItems();

    this._eventHandler.subscribe(this.grid.onContextMenu, this.handleOnContextMenu.bind(this));
    this._eventHandler.subscribe(this.grid.onClick, this.hideMenu.bind(this));

    if (this._addonOptions.hideMenuOnScroll) {
      this._eventHandler.subscribe(this.grid.onScroll, this.closeMenu.bind(this));
    }
  }

  /** Translate the Context Menu titles, we need to loop through all column definition to re-translate all list titles & all commands/options */
  translateContextMenu(): void {
    const gridOptions = this.sharedService?.gridOptions ?? {};
    const contextMenu = this.sharedService.gridOptions.contextMenu;

    if (contextMenu && gridOptions?.enableTranslate) {
      // get both items list
      const columnContextMenuCommandItems: Array<MenuCommandItem | 'divider'> = contextMenu.commandItems || [];
      const columnContextMenuOptionItems: Array<MenuOptionItem | 'divider'> = contextMenu.optionItems || [];

      // translate their titles only if they have a titleKey defined
      if (contextMenu.commandTitleKey) {
        // prettier-ignore
        contextMenu.commandTitle = this.extensionUtility.translateWhenEnabledAndServiceExist(contextMenu.commandTitleKey, 'TEXT_COMMANDS') || contextMenu.commandTitle;
      }
      if (contextMenu.optionTitleKey) {
        // prettier-ignore
        contextMenu.optionTitle = this.extensionUtility.translateWhenEnabledAndServiceExist(contextMenu.optionTitleKey, 'TEXT_COMMANDS') || contextMenu.optionTitle;
      }

      // translate both command/option items (whichever is provided)
      this.extensionUtility.translateMenuItemsFromTitleKey(columnContextMenuCommandItems, 'commandItems');
      this.extensionUtility.translateMenuItemsFromTitleKey(columnContextMenuOptionItems, 'optionItems');
    }
  }

  // --
  // event handlers
  // ------------------

  protected handleOnContextMenu(event: SlickEventData, args: { grid: SlickGrid }): void {
    this.disposeAllMenus(); // make there's only 1 parent menu opened at a time
    const cell = this.grid.getCellFromEvent(event);

    if (cell) {
      const dataContext = this.grid.getDataItem(cell.row);
      const columnDef = this.grid.getColumns()[cell.cell];

      // run the override function (when defined), if the result is false it won't go further
      const menuArgs = (args || {}) as MenuCommandItemCallbackArgs;
      menuArgs.cell = cell.cell;
      menuArgs.row = cell.row;
      menuArgs.column = columnDef;
      menuArgs.dataContext = dataContext;
      menuArgs.grid = this.grid;
      if (!this.extensionUtility.runOverrideFunctionWhenExists(this._addonOptions.menuUsabilityOverride, menuArgs)) {
        return;
      }

      // create the DOM element
      this._menuElm = this.createParentMenu(event);
      if (this._menuElm) {
        event.preventDefault();
      }

      // add dark mode CSS class when enabled
      if (this._menuElm && this.gridOptions.darkMode) {
        this._menuElm.classList.add('slick-dark-mode');
      }

      // reposition the menu to where the user clicked
      if (this._menuElm) {
        this.repositionMenu(event, this._menuElm);
        this._menuElm.ariaExpanded = 'true';
        this._menuElm.style.display = 'block';
      }

      // Hide the menu on outside click.
      this._bindEventService.bind(document.body, 'mousedown', this.handleBodyMouseDown.bind(this) as EventListener);
    }
  }

  // --
  // protected functions
  // ------------------

  /** Create Context Menu with Custom Commands (copy cell value, export) */
  protected addMenuCustomCommands(
    originalCommandItems: Array<MenuCommandItem | 'divider'>
  ): (MenuCommandItem<MenuCommandItemCallbackArgs, MenuCallbackArgs<any>> | 'divider')[] {
    const menuCommandItems: Array<MenuCommandItem | 'divider'> = [];
    const gridOptions = (this.sharedService && this.sharedService.gridOptions) || {};
    const contextMenu = gridOptions?.contextMenu;
    const dataView = this.sharedService?.dataView;
    const translationPrefix = getTranslationPrefix(gridOptions);

    // show context menu: Copy (cell value)
    if (contextMenu && !contextMenu.hideCopyCellValueCommand) {
      const commandName = 'copy';
      if (!originalCommandItems.some((item) => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        menuCommandItems.push({
          iconCssClass: contextMenu.iconCopyCellValueCommand || 'mdi mdi-content-copy',
          titleKey: `${translationPrefix}COPY`,
          disabled: false,
          command: commandName,
          positionOrder: 50,
          action: (_e, args) => {
            this.copyToClipboard(args as MenuCommandItemCallbackArgs);
          },
          itemUsabilityOverride: (args: MenuCallbackArgs) => {
            // make sure there's an item to copy before enabling this command
            const columnDef = args?.column as Column;
            const dataContext = args?.dataContext;
            if (typeof columnDef.queryFieldNameGetterFn === 'function') {
              const cellValue = getCellValueFromQueryFieldGetter(columnDef, dataContext, '');
              if (cellValue !== '' && cellValue !== undefined) {
                return true;
              }
            } else if (columnDef && dataContext.hasOwnProperty(columnDef.field)) {
              return dataContext[columnDef.field] !== '' && dataContext[columnDef.field] !== null && dataContext[columnDef.field] !== undefined;
            }
            return false;
          },
        });
      }
    }

    // show context menu: Export to file
    if (gridOptions?.enableTextExport && contextMenu && !contextMenu.hideExportCsvCommand) {
      const commandName = 'export-csv';
      if (!originalCommandItems.some((item) => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        menuCommandItems.push({
          iconCssClass: contextMenu.iconExportCsvCommand || 'mdi mdi-download',
          titleKey: `${translationPrefix}EXPORT_TO_CSV`,
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
              throw new Error(
                `[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu. Example:: this.gridOptions = { enableTextExport: true, externalResources: [new TextExportService()] };`
              );
            }
          },
        });
      }
    }

    // show context menu: Export to Excel
    if (gridOptions && gridOptions.enableExcelExport && contextMenu && !contextMenu.hideExportExcelCommand) {
      const commandName = 'export-excel';
      if (!originalCommandItems.some((item) => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        menuCommandItems.push({
          iconCssClass: contextMenu.iconExportExcelCommand || 'mdi mdi-file-excel-outline text-success',
          titleKey: `${translationPrefix}EXPORT_TO_EXCEL`,
          disabled: false,
          command: commandName,
          positionOrder: 52,
          action: () => {
            const registedServices = this.sharedService?.externalRegisteredResources || [];
            const excelService: ExcelExportService = registedServices.find((service: any) => service.className === 'ExcelExportService');
            if (excelService?.exportToExcel) {
              excelService.exportToExcel();
            } else {
              throw new Error(
                `[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Context Menu. Example:: this.gridOptions = { enableExcelExport: true, externalResources: [new ExcelExportService()] };`
              );
            }
          },
        });
      }
    }

    // show context menu: export to text file as tab delimited
    if (gridOptions?.enableTextExport && contextMenu && !contextMenu.hideExportTextDelimitedCommand) {
      const commandName = 'export-text-delimited';
      if (!originalCommandItems.some((item) => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
        menuCommandItems.push({
          iconCssClass: contextMenu.iconExportTextDelimitedCommand || 'mdi mdi-download',
          titleKey: `${translationPrefix}EXPORT_TO_TAB_DELIMITED`,
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
              throw new Error(
                `[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu. Example:: this.gridOptions = { enableTextExport: true, externalResources: [new TextExportService()] };`
              );
            }
          },
        });
      }
    }

    // -- Grouping Commands
    if (gridOptions && (gridOptions.enableGrouping || gridOptions.enableDraggableGrouping || gridOptions.enableTreeData)) {
      // add a divider (separator) between the top sort commands and the other clear commands
      if (contextMenu && !contextMenu.hideCopyCellValueCommand) {
        menuCommandItems.push({ divider: true, command: '', positionOrder: 54 });
      }

      // show context menu: Clear Grouping (except for Tree Data which shouldn't have this feature)
      if (gridOptions && !gridOptions.enableTreeData && contextMenu && !contextMenu.hideClearAllGrouping) {
        const commandName = 'clear-grouping';
        if (!originalCommandItems.some((item) => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          menuCommandItems.push({
            iconCssClass: contextMenu.iconClearGroupingCommand || 'mdi mdi-close',
            titleKey: `${translationPrefix}CLEAR_ALL_GROUPING`,
            disabled: false,
            command: commandName,
            positionOrder: 55,
            action: () => {
              dataView.setGrouping([]);
              this.pubSubService.publish('onContextMenuClearGrouping');
            },
            itemUsabilityOverride: () => {
              // only enable the command when there's an actually grouping in play
              const groupingArray = dataView && dataView.getGrouping && dataView.getGrouping();
              return Array.isArray(groupingArray) && groupingArray.length > 0;
            },
          });
        }
      }

      // show context menu: Collapse all Groups
      if (gridOptions && contextMenu && !contextMenu.hideCollapseAllGroups) {
        const commandName = 'collapse-all-groups';
        if (!originalCommandItems.some((item) => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          menuCommandItems.push({
            iconCssClass: contextMenu.iconCollapseAllGroupsCommand || 'mdi mdi-arrow-collapse',
            titleKey: `${translationPrefix}COLLAPSE_ALL_GROUPS`,
            disabled: false,
            command: commandName,
            positionOrder: 56,
            action: () => {
              if (gridOptions.enableTreeData) {
                this.treeDataService.toggleTreeDataCollapse(true);
              } else {
                dataView.collapseAllGroups();
              }
              this.pubSubService.publish('onContextMenuCollapseAllGroups');
            },
            itemUsabilityOverride: () => {
              if (gridOptions.enableTreeData) {
                return true;
              }
              // only enable the command when there's an actually grouping in play
              const groupingArray = dataView && dataView.getGrouping && dataView.getGrouping();
              return Array.isArray(groupingArray) && groupingArray.length > 0;
            },
          });
        }
      }

      // show context menu: Expand all Groups
      if (gridOptions && contextMenu && !contextMenu.hideExpandAllGroups) {
        const commandName = 'expand-all-groups';
        if (!originalCommandItems.some((item) => item !== 'divider' && item.hasOwnProperty('command') && item.command === commandName)) {
          menuCommandItems.push({
            iconCssClass: contextMenu.iconExpandAllGroupsCommand || 'mdi mdi-arrow-expand',
            titleKey: `${translationPrefix}EXPAND_ALL_GROUPS`,
            disabled: false,
            command: commandName,
            positionOrder: 57,
            action: () => {
              if (gridOptions.enableTreeData) {
                this.treeDataService.toggleTreeDataCollapse(false);
              } else {
                dataView.expandAllGroups();
              }
              this.pubSubService.publish('onContextMenuExpandAllGroups');
            },
            itemUsabilityOverride: () => {
              if (gridOptions.enableTreeData) {
                return true;
              }
              // only enable the command when there's an actually grouping in play
              const groupingArray = dataView && dataView.getGrouping && dataView.getGrouping();
              return Array.isArray(groupingArray) && groupingArray.length > 0;
            },
          });
        }
      }
    }

    this.extensionUtility.translateMenuItemsFromTitleKey(menuCommandItems);
    return menuCommandItems;
  }

  /**
   * First get the value, if "exportWithFormatter" is set then we'll use the formatter output
   * Then we create the DOM trick to copy a text value by creating a fake <div> that is not shown to the user
   * and from there we can call the execCommand 'copy' command and expect the value to be in clipboard
   * @param args
   */
  protected copyToClipboard(args: MenuCommandItemCallbackArgs): void {
    try {
      if (args && args.grid && args.command) {
        // get the value, if "exportWithFormatter" is set then we'll use the formatter output
        const gridOptions = this.sharedService?.gridOptions ?? {};
        const cell = args?.cell ?? 0;
        const row = args?.row ?? 0;
        const columnDef = args?.column;
        const dataContext = args?.dataContext;
        const grid = this.sharedService?.slickGrid;
        const exportOptions = gridOptions && (gridOptions.excelExportOptions || gridOptions.textExportOptions);
        let textToCopy = exportWithFormatterWhenDefined(row, cell, columnDef, dataContext, grid, exportOptions);
        if (typeof columnDef.queryFieldNameGetterFn === 'function') {
          textToCopy = getCellValueFromQueryFieldGetter(columnDef, dataContext, '');
        }
        let finalTextToCopy = textToCopy;

        // when it's a string, we'll remove any unwanted Tree Data/Grouping symbols from the beginning (if exist) from the string before copying (e.g.: "⮟  Task 21" or "·   Task 2")
        if (typeof textToCopy === 'string') {
          finalTextToCopy = textToCopy
            .replace(/^([·|⮞|⮟]\s*)|([·|⮞|⮟])\s*/gi, '')
            // eslint-disable-next-line
            .replace(/[\u00b7|\u034f]/gi, '')
            .trim();
        }

        // create fake <textarea> (positioned outside of the screen) to copy into clipboard & delete it from the DOM once we're done
        const tmpElem = document.createElement('textarea');
        if (tmpElem && document.body) {
          tmpElem.style.position = 'absolute';
          tmpElem.style.opacity = '0';
          tmpElem.value = finalTextToCopy;
          document.body.appendChild(tmpElem);
          tmpElem.select();
          if (document.execCommand('copy', false, finalTextToCopy)) {
            tmpElem.remove();
          }
        }
      }
    } catch (e) {
      /* v8 ignore next - do nothing */
    }
  }

  /** sort all menu items by their position order when defined */
  protected sortMenuItems(): void {
    const contextMenu = this.sharedService?.gridOptions?.contextMenu;
    if (contextMenu) {
      this.extensionUtility.sortItems(contextMenu.commandItems || [], 'positionOrder');
      this.extensionUtility.sortItems(contextMenu.optionItems || [], 'positionOrder');
    }
  }
}
