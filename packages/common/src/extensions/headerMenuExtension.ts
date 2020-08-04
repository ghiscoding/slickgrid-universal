import { Constants } from '../constants';
import {
  Column,
  CurrentSorter,
  Extension,
  GetSlickEventType,
  GridOption,
  HeaderMenu,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  Locale,
  SlickEventHandler,
  SlickHeaderMenu,
  SlickNamespace,
} from '../interfaces/index';
import {
  EmitterType,
  ExtensionName,
} from '../enums/index';
import { getTranslationPrefix } from '../services/utilities';
import { FilterService } from '../services/filter.service';
import { SortService } from '../services/sort.service';
import { SharedService } from '../services/shared.service';
import { ExtensionUtility } from './extensionUtility';
import { TranslaterService } from '../services/translater.service';
import { PubSubService } from '../services/pubSub.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class HeaderMenuExtension implements Extension {
  private _addon: SlickHeaderMenu | null;
  private _eventHandler: SlickEventHandler;

  constructor(
    private extensionUtility: ExtensionUtility,
    private filterService: FilterService,
    private pubSubService: PubSubService,
    private sharedService: SharedService,
    private sortService: SortService,
    private translaterService?: TranslaterService,
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
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickHeaderMenu | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): SlickHeaderMenu | null {
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }

    if (this.sharedService && this.sharedService.slickGrid && this.sharedService.gridOptions) {
      // dynamically import the SlickGrid plugin (addon) with RequireJS
      this.extensionUtility.loadExtensionDynamically(ExtensionName.headerMenu);

      this.sharedService.gridOptions.headerMenu = { ...this.getDefaultHeaderMenuOptions(), ...this.sharedService.gridOptions.headerMenu };
      if (this.sharedService.gridOptions.enableHeaderMenu) {
        this.sharedService.gridOptions.headerMenu = this.addHeaderMenuCustomCommands(this.sharedService.gridOptions, this.sharedService.columnDefinitions);
      }
      this._addon = new Slick.Plugins.HeaderMenu(this.sharedService.gridOptions.headerMenu);
      if (this._addon) {
        this.sharedService.slickGrid.registerPlugin<SlickHeaderMenu>(this._addon);
      }

      // hook all events
      if (this._addon && this.sharedService.slickGrid && this.sharedService.gridOptions.headerMenu) {
        if (this.sharedService.gridOptions.headerMenu.onExtensionRegistered) {
          this.sharedService.gridOptions.headerMenu.onExtensionRegistered(this._addon);
        }

        const onCommandHandler = this._addon.onCommand;
        if (onCommandHandler) {
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onCommandHandler>>).subscribe(onCommandHandler, (event, args) => {
            this.executeHeaderMenuInternalCommands(event, args);
            if (this.sharedService.gridOptions.headerMenu && typeof this.sharedService.gridOptions.headerMenu.onCommand === 'function') {
              this.sharedService.gridOptions.headerMenu.onCommand(event, args);
            }
          });
        }

        if (this.sharedService.gridOptions.headerMenu && typeof this.sharedService.gridOptions.headerMenu.onBeforeMenuShow === 'function') {
          const onBeforeMenuShowHandler = this._addon.onBeforeMenuShow;
          if (onBeforeMenuShowHandler) {
            (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeMenuShowHandler>>).subscribe(onBeforeMenuShowHandler, (event, args) => {
              if (this.sharedService.gridOptions.headerMenu && this.sharedService.gridOptions.headerMenu.onBeforeMenuShow) {
                this.sharedService.gridOptions.headerMenu.onBeforeMenuShow(event, args);
              }
            });
          }
        }

        if (this.sharedService.gridOptions.headerMenu && typeof this.sharedService.gridOptions.headerMenu.onAfterMenuShow === 'function') {
          const onAfterMenuShowHandler = this._addon.onAfterMenuShow;
          if (onAfterMenuShowHandler) {
            (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onAfterMenuShowHandler>>).subscribe(onAfterMenuShowHandler, (event, args) => {
              if (this.sharedService.gridOptions.headerMenu && this.sharedService.gridOptions.headerMenu.onAfterMenuShow) {
                this.sharedService.gridOptions.headerMenu.onAfterMenuShow(event, args);
              }
            });
          }
        }
      }
      return this._addon;
    }
    return null;
  }

  /**
   * Create Header Menu with Custom Commands if user has enabled Header Menu
   * @param options
   * @param columnDefinitions
   * @return header menu
   */
  private addHeaderMenuCustomCommands(options: GridOption, columnDefinitions: Column[]): HeaderMenu {
    const headerMenuOptions = options.headerMenu || {};
    const gridOptions = this.sharedService.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);

    if (columnDefinitions && Array.isArray(columnDefinitions) && options.enableHeaderMenu) {
      columnDefinitions.forEach((columnDef: Column) => {
        if (columnDef && !columnDef.excludeFromHeaderMenu) {
          if (!columnDef.header || !columnDef.header.menu) {
            columnDef.header = {
              menu: {
                items: []
              }
            };
          }
          const columnHeaderMenuItems: Array<MenuCommandItem | 'divider'> = columnDef && columnDef.header && columnDef.header.menu && columnDef.header.menu.items || [];

          // Freeze Column (pinning)
          if (headerMenuOptions && !headerMenuOptions.hideFreezeColumnsCommand) {
            if (columnHeaderMenuItems.filter((item: MenuCommandItem) => item.hasOwnProperty('command') && item.command === 'freeze-columns').length === 0) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconFreezeColumns || 'fa fa-thumb-tack',
                title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}FREEZE_COLUMNS`, 'TEXT_FREEZE_COLUMNS'),
                command: 'freeze-columns',
                positionOrder: 48
              });
            }

            // add a divider (separator) between the top freeze columns commands and the rest of the commands
            if (columnHeaderMenuItems.filter((item: MenuCommandItem) => item.positionOrder === 49).length === 0) {
              columnHeaderMenuItems.push({ divider: true, command: '', positionOrder: 49 });
            }
          }

          // Sorting Commands
          if (options.enableSorting && columnDef.sortable && headerMenuOptions && !headerMenuOptions.hideSortCommands) {
            if (columnHeaderMenuItems.filter((item: MenuCommandItem) => item.hasOwnProperty('command') && item.command === 'sort-asc').length === 0) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconSortAscCommand || 'fa fa-sort-asc',
                title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}SORT_ASCENDING`, 'TEXT_SORT_ASCENDING'),
                command: 'sort-asc',
                positionOrder: 50
              });
            }
            if (columnHeaderMenuItems.filter((item: MenuCommandItem) => item.hasOwnProperty('command') && item.command === 'sort-desc').length === 0) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconSortDescCommand || 'fa fa-sort-desc',
                title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}SORT_DESCENDING`, 'TEXT_SORT_DESCENDING'),
                command: 'sort-desc',
                positionOrder: 51
              });
            }

            // add a divider (separator) between the top sort commands and the other clear commands
            if (columnHeaderMenuItems.filter((item: MenuCommandItem) => item.positionOrder === 52).length === 0) {
              columnHeaderMenuItems.push({ divider: true, command: '', positionOrder: 52 });
            }

            if (!headerMenuOptions.hideClearSortCommand && columnHeaderMenuItems.filter((item: MenuCommandItem) => item.hasOwnProperty('command') && item.command === 'clear-sort').length === 0) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconClearSortCommand || 'fa fa-unsorted',
                title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}REMOVE_SORT`, 'TEXT_REMOVE_SORT'),
                command: 'clear-sort',
                positionOrder: 54
              });
            }
          }

          // Filtering Commands
          if (options.enableFiltering && columnDef.filterable && headerMenuOptions && !headerMenuOptions.hideFilterCommand) {
            if (!headerMenuOptions.hideClearFilterCommand && columnHeaderMenuItems.filter((item: MenuCommandItem) => item.hasOwnProperty('command') && item.command === 'clear-filter').length === 0) {
              columnHeaderMenuItems.push({
                iconCssClass: headerMenuOptions.iconClearFilterCommand || 'fa fa-filter',
                title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}REMOVE_FILTER`, 'TEXT_REMOVE_FILTER'),
                command: 'clear-filter',
                positionOrder: 53
              });
            }
          }

          // Hide Column Command
          if (headerMenuOptions && !headerMenuOptions.hideColumnHideCommand && columnHeaderMenuItems.filter((item: MenuCommandItem) => item.hasOwnProperty('command') && item.command === 'hide').length === 0) {
            columnHeaderMenuItems.push({
              iconCssClass: headerMenuOptions.iconColumnHideCommand || 'fa fa-times',
              title: this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}HIDE_COLUMN`, 'TEXT_HIDE_COLUMN'),
              command: 'hide',
              positionOrder: 55
            });
          }

          this.extensionUtility.translateItems(columnHeaderMenuItems, 'titleKey', 'title');
          this.extensionUtility.sortItems(columnHeaderMenuItems, 'positionOrder');
        }
      });

    }

    return headerMenuOptions;
  }

  /** Hide a column from the grid */
  hideColumn(column: Column) {
    if (this.sharedService.slickGrid && this.sharedService.slickGrid.getColumns && this.sharedService.slickGrid.setColumns && this.sharedService.slickGrid.getColumnIndex) {
      const columnIndex = this.sharedService.slickGrid.getColumnIndex(column.id);
      const currentColumns = this.sharedService.slickGrid.getColumns();
      const visibleColumns = this.extensionUtility.arrayRemoveItemByIndex<Column>(currentColumns, columnIndex);
      this.sharedService.visibleColumns = visibleColumns;
      this.sharedService.slickGrid.setColumns(visibleColumns);
      this.pubSubService.publish('onHeaderMenuColumnsChanged', { columns: visibleColumns });
    }
  }

  /** Translate the Header Menu titles, we need to loop through all column definition to re-translate them */
  translateHeaderMenu() {
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.headerMenu) {
      this.resetHeaderMenuTranslations(this.sharedService.visibleColumns);
    }
  }

  /**
   * @return default Header Menu options
   */
  private getDefaultHeaderMenuOptions(): HeaderMenu {
    return {
      autoAlignOffset: 12,
      minWidth: 140,
      hideColumnHideCommand: false,
      hideSortCommands: false,
      title: ''
    };
  }

  /**
   * Reset all the internal Menu options which have text to translate
   * @param header menu object
   */
  private resetHeaderMenuTranslations(columnDefinitions: Column[]) {
    const gridOptions = this.sharedService.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);

    columnDefinitions.forEach((columnDef: Column) => {
      if (columnDef && columnDef.header && columnDef.header.menu && columnDef.header.menu.items) {
        if (!columnDef.excludeFromHeaderMenu) {
          const columnHeaderMenuItems: Array<MenuCommandItem | 'divider'> = columnDef.header.menu.items || [];
          columnHeaderMenuItems.forEach((item: MenuCommandItem) => {
            if (item.hasOwnProperty('command')) {
              switch (item.command) {
                case 'clear-filter':
                  item.title = this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}REMOVE_FILTER`, 'TEXT_REMOVE_FILTER');
                  break;
                case 'clear-sort':
                  item.title = this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}REMOVE_SORT`, 'TEXT_REMOVE_SORT');
                  break;
                case 'freeze-columns':
                  item.title = this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}FREEZE_COLUMNS`, 'TEXT_FREEZE_COLUMNS');
                  break;
                case 'sort-asc':
                  item.title = this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}SORT_ASCENDING`, 'TEXT_SORT_ASCENDING');
                  break;
                case 'sort-desc':
                  item.title = this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}SORT_DESCENDING`, 'TEXT_SORT_DESCENDING');
                  break;
                case 'hide':
                  item.title = this.extensionUtility.translateWhenEnabledAndServiceExist(`${translationPrefix}HIDE_COLUMN`, 'TEXT_HIDE_COLUMN');
                  break;
              }
            }

            // re-translate if there's a "titleKey"
            if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableTranslate) {
              this.extensionUtility.translateItems(columnHeaderMenuItems, 'titleKey', 'title');
            }
          });
        }
      }
    });
  }

  // --
  // private functions
  // ------------------

  /** Clear the Filter on the current column (if it's actually filtered) */
  private clearColumnFilter(event: Event, args: MenuCommandItemCallbackArgs) {
    if (args && args.column) {
      this.filterService.clearFilterByColumnId(event, args.column.id);
    }
  }

  /** Clear the Sort on the current column (if it's actually sorted) */
  private clearColumnSort(event: Event, args: MenuCommandItemCallbackArgs) {
    if (args && args.column && this.sharedService) {
      this.sortService.clearSortByColumnId(event, args.column.id);
    }
  }

  /** Execute the Header Menu Commands that was triggered by the onCommand subscribe */
  private executeHeaderMenuInternalCommands(event: Event, args: MenuCommandItemCallbackArgs) {
    if (args && args.command) {
      switch (args.command) {
        case 'hide':
          this.hideColumn(args.column);
          if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableAutoSizeColumns) {
            this.sharedService.slickGrid.autosizeColumns();
          }
          break;
        case 'clear-filter':
          this.clearColumnFilter(event, args);
          break;
        case 'clear-sort':
          this.clearColumnSort(event, args);
          break;
        case 'freeze-columns':
          const visibleColumns = [...this.sharedService.visibleColumns];
          const columnPosition = visibleColumns.findIndex((col) => col.id === args.column.id);
          this.sharedService.slickGrid.setOptions({ frozenColumn: columnPosition, alwaysShowVerticalScroll: false });

          // to freeze columns, we need to take only the visible columns and we also need to use setColumns() when some of them are hidden
          // to make sure that we only use the visible columns, not doing this would show back some of the hidden columns
          if (Array.isArray(visibleColumns) && Array.isArray(this.sharedService.allColumns) && visibleColumns.length !== this.sharedService.allColumns.length) {
            this.sharedService.slickGrid.setColumns(visibleColumns);
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

  /** Sort the current column */
  private sortColumn(event: Event, args: MenuCommandItemCallbackArgs, isSortingAsc = true) {
    if (args && args.column) {
      // get previously sorted columns
      const columnDef = args.column;
      const sortedColsWithoutCurrent = this.sortService.getCurrentColumnSorts(columnDef.id + '');

      let emitterType: EmitterType = EmitterType.local;

      // add to the column array, the column sorted by the header menu
      sortedColsWithoutCurrent.push({ columnId: columnDef.id, sortCol: columnDef, sortAsc: isSortingAsc });
      if (this.sharedService.gridOptions.backendServiceApi) {
        this.sortService.onBackendSortChanged(event, { multiColumnSort: true, sortCols: sortedColsWithoutCurrent, grid: this.sharedService.slickGrid });
        emitterType = EmitterType.remote;
      } else if (this.sharedService.dataView) {
        this.sortService.onLocalSortChanged(this.sharedService.slickGrid, sortedColsWithoutCurrent);
        emitterType = EmitterType.local;
      } else {
        // when using customDataView, we will simply send it as a onSort event with notify
        const isMultiSort = this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.multiColumnSort || false;
        const sortOutput = isMultiSort ? sortedColsWithoutCurrent : sortedColsWithoutCurrent[0];
        args.grid.onSort.notify(sortOutput);
      }

      // update the this.sharedService.gridObj sortColumns array which will at the same add the visual sort icon(s) on the UI
      const newSortColumns = sortedColsWithoutCurrent.map((col) => {
        return {
          columnId: col && col.sortCol && col.sortCol.id,
          sortAsc: col && col.sortAsc,
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
            columnId: sortCol.columnId + '',
            direction: sortCol.sortAsc ? 'ASC' : 'DESC'
          });
        });
        this.sortService.emitSortChanged(emitterType, currentLocalSorters);
      }
    }
  }
}
