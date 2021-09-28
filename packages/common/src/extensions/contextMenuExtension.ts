import 'slickgrid/plugins/slick.contextmenu';

import {
  Column,
  ContextMenu,
  Extension,
  GetSlickEventType,
  MenuCallbackArgs,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  SlickContextMenu,
  SlickEventHandler,
  SlickNamespace,
} from '../interfaces/index';
import { DelimiterType, FileType, } from '../enums/index';
import { ExtensionUtility } from './extensionUtility';
import { exportWithFormatterWhenDefined } from '../formatters/formatterUtilities';
import { SharedService } from '../services/shared.service';
import { getDescendantProperty, getTranslationPrefix } from '../services/utilities';
import { PubSubService } from '../services/pubSub.service';
import { ExcelExportService, TextExportService, TranslaterService, TreeDataService } from '../services/index';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class ContextMenuExtension implements Extension {
  private _addon: SlickContextMenu | null = null;
  private _contextMenuOptions: ContextMenu | null = null;
  private _eventHandler: SlickEventHandler;
  private _userOriginalContextMenu: ContextMenu | undefined;

  constructor(
    private readonly extensionUtility: ExtensionUtility,
    private readonly pubSubService: PubSubService,
    private readonly sharedService: SharedService,
    private readonly treeDataService: TreeDataService,
    private readonly translaterService?: TranslaterService,
  ) {
    this._eventHandler = new Slick.EventHandler();
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  dispose() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();

    if (this._addon && this._addon.destroy) {
      this._addon.destroy();
    }
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.contextMenu && this.sharedService.gridOptions.contextMenu.commandItems) {
      this.sharedService.gridOptions.contextMenu = this._userOriginalContextMenu;
    }

    this.extensionUtility.nullifyFunctionNameStartingWithOn(this._contextMenuOptions);
    this._addon = null;
    this._contextMenuOptions = null;
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickContextMenu | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): SlickContextMenu | null {
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }

    if (this.sharedService && this.sharedService.slickGrid && this.sharedService.gridOptions && this.sharedService.gridOptions.contextMenu) {
      this._contextMenuOptions = this.sharedService.gridOptions.contextMenu;
      // keep original user context menu, useful when switching locale to translate
      this._userOriginalContextMenu = { ...this._contextMenuOptions };

      // merge the original commands with the built-in internal commands
      const originalCommandItems = this._userOriginalContextMenu && Array.isArray(this._userOriginalContextMenu.commandItems) ? this._userOriginalContextMenu.commandItems : [];
      this._contextMenuOptions.commandItems = [...originalCommandItems, ...this.addMenuCustomCommands(originalCommandItems)];
      this._contextMenuOptions = { ...this._contextMenuOptions };
      this.sharedService.gridOptions.contextMenu = this._contextMenuOptions;

      // sort all menu items by their position order when defined
      this.extensionUtility.sortItems(this._contextMenuOptions.commandItems || [], 'positionOrder');
      this.extensionUtility.sortItems(this._contextMenuOptions.optionItems || [], 'positionOrder');

      this._addon = new Slick.Plugins.ContextMenu(this._contextMenuOptions);
      if (this._addon) {
        this.sharedService.slickGrid.registerPlugin<SlickContextMenu>(this._addon);
      }

      // translate the item keys when necessary
      if (this.sharedService.gridOptions.enableTranslate) {
        this.translateContextMenu();
      }

      // hook all events
      if (this.sharedService.slickGrid && this._contextMenuOptions) {
        if (this._addon && this._contextMenuOptions.onExtensionRegistered) {
          this._contextMenuOptions.onExtensionRegistered(this._addon);
        }
        if (this._contextMenuOptions && typeof this._contextMenuOptions.onCommand === 'function') {
          const onCommandHandler = this._addon.onCommand;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onCommandHandler>>).subscribe(onCommandHandler, (event, args) => {
            if (this._contextMenuOptions?.onCommand) {
              this._contextMenuOptions.onCommand(event, args);
            }
          });
        }
        if (this._contextMenuOptions && typeof this._contextMenuOptions.onOptionSelected === 'function') {
          const onOptionSelectedHandler = this._addon.onOptionSelected;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onOptionSelectedHandler>>).subscribe(onOptionSelectedHandler, (event, args) => {
            if (this._contextMenuOptions?.onOptionSelected) {
              this._contextMenuOptions.onOptionSelected(event, args);
            }
          });
        }
        if (this._contextMenuOptions && typeof this._contextMenuOptions.onBeforeMenuShow === 'function') {
          const onBeforeMenuShowHandler = this._addon.onBeforeMenuShow;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeMenuShowHandler>>).subscribe(onBeforeMenuShowHandler, (event, args) => {
            if (this._contextMenuOptions?.onBeforeMenuShow) {
              this._contextMenuOptions.onBeforeMenuShow(event, args);
            }
          });
        }
        if (this._contextMenuOptions && typeof this._contextMenuOptions.onBeforeMenuClose === 'function') {
          const onBeforeMenuCloseHandler = this._addon.onBeforeMenuClose;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeMenuCloseHandler>>).subscribe(onBeforeMenuCloseHandler, (event, args) => {
            if (this._contextMenuOptions?.onBeforeMenuClose) {
              this._contextMenuOptions.onBeforeMenuClose(event, args);
            }
          });
        }
        if (this._contextMenuOptions && typeof this._contextMenuOptions.onAfterMenuShow === 'function') {
          const onAfterMenuShowHandler = this._addon.onAfterMenuShow;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onAfterMenuShowHandler>>).subscribe(onAfterMenuShowHandler, (event, args) => {
            if (this._contextMenuOptions?.onAfterMenuShow) {
              this._contextMenuOptions.onAfterMenuShow(event, args);
            }
          });
        }
      }
      return this._addon;
    }
    return null;
  }

  /** Translate the Context Menu titles, we need to loop through all column definition to re-translate them */
  translateContextMenu() {
    if (this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.contextMenu) {
      const contextMenu = this.sharedService.gridOptions.contextMenu;
      const menuOptions: Partial<ContextMenu> = {};

      if (contextMenu.commandTitleKey) {
        contextMenu.commandTitle = this.translaterService && this.translaterService.translate && this.translaterService.getCurrentLanguage && this.translaterService.getCurrentLanguage() && this.translaterService.translate(contextMenu.commandTitleKey) || contextMenu.commandTitle;
        menuOptions.commandTitle = contextMenu.commandTitle;
      }
      if (contextMenu.optionTitleKey) {
        contextMenu.optionTitle = this.translaterService && this.translaterService.translate && this.translaterService.getCurrentLanguage && this.translaterService.getCurrentLanguage() && this.translaterService.translate(contextMenu.optionTitleKey) || contextMenu.optionTitle;
        menuOptions.optionTitle = contextMenu.optionTitle;
      }
      const originalCommandItems = this._userOriginalContextMenu && Array.isArray(this._userOriginalContextMenu.commandItems) ? this._userOriginalContextMenu.commandItems : [];
      contextMenu.commandItems = [...originalCommandItems, ...this.addMenuCustomCommands(originalCommandItems)];
      menuOptions.commandItems = contextMenu.commandItems; // copy it also to the menuOptions else they won't be translated when locale changes

      // translate all command/options and resort them afterward
      this.extensionUtility.translateItems(contextMenu.commandItems || [], 'titleKey', 'title');
      this.extensionUtility.translateItems(contextMenu.optionItems || [], 'titleKey', 'title');
      this.extensionUtility.sortItems(contextMenu.commandItems || [], 'positionOrder');
      this.extensionUtility.sortItems(contextMenu.optionItems || [], 'positionOrder');

      // update the title options so that it has latest translated values
      if (this._addon && this._addon.setOptions) {
        this._addon.setOptions(menuOptions);
      }
    }
  }

  // --
  // private functions
  // ------------------

  /** Create Context Menu with Custom Commands (copy cell value, export) */
  private addMenuCustomCommands(originalCustomItems: Array<MenuCommandItem | 'divider'>) {
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
              const columnDef = args && args.column as Column;
              const dataContext = args && args.dataContext;
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
                this.pubSubService.publish('onContextMenuClearGrouping');
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
                this.pubSubService.publish('onContextMenuCollapseAllGroups');
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
                this.pubSubService.publish('onContextMenuExpandAllGroups');
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

  /**
   * First get the value, if "exportWithFormatter" is set then we'll use the formatter output
   * Then we create the DOM trick to copy a text value by creating a fake <div> that is not shown to the user
   * and from there we can call the execCommand 'copy' command and expect the value to be in clipboard
   * @param args
   */
  private copyToClipboard(args: MenuCommandItemCallbackArgs) {
    try {
      if (args && args.grid && args.command) {
        // get the value, if "exportWithFormatter" is set then we'll use the formatter output
        const gridOptions = this.sharedService && this.sharedService.gridOptions || {};
        const cell = args && args.cell || 0;
        const row = args && args.row || 0;
        const columnDef = args && args.column;
        const dataContext = args && args.dataContext;
        const grid = this.sharedService && this.sharedService.slickGrid;
        const exportOptions = gridOptions && (gridOptions.excelExportOptions || { ...gridOptions.exportOptions, ...gridOptions.textExportOptions });
        let textToCopy = exportWithFormatterWhenDefined(row, cell, columnDef, dataContext, grid, exportOptions);

        if (typeof columnDef.queryFieldNameGetterFn === 'function') {
          textToCopy = this.getCellValueFromQueryFieldGetter(columnDef, dataContext);
        }

        // remove any unwanted Tree Data/Grouping symbols from the beginning of the string before copying (e.g.: "⮟  Task 21" or "·   Task 2")
        const finalTextToCopy = textToCopy.replace(/^([·|⮞|⮟]\s*)|([·|⮞|⮟])\s*/g, '');

        // create fake <textarea> (positioned outside of the screen) to copy into clipboard & delete it from the DOM once we're done
        const tmpElem = document.createElement('textarea') as HTMLTextAreaElement;
        if (tmpElem && document.body) {
          tmpElem.style.position = 'absolute';
          tmpElem.style.left = '-1000px';
          tmpElem.style.top = '-1000px';
          tmpElem.value = finalTextToCopy;
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
  private getCellValueFromQueryFieldGetter(columnDef: Column, dataContext: any): string {
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
}
