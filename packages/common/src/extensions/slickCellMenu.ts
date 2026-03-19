import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import type { SlickEventData } from '../core/slickCore.js';
import type {
  CellMenu,
  CellMenuOption,
  Column,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
  MenuOptionItem,
  OnClickEventArgs,
  OnKeyDownEventArgs,
} from '../interfaces/index.js';
import type { SharedService } from '../services/shared.service.js';
import type { ExtensionUtility } from './extensionUtility.js';
import { MenuFromCellBaseClass } from './menuFromCellBaseClass.js';

/**
 * A plugin to add Menu on a Cell click (click on the cell that has the cellMenu object defined)
 * The "cellMenu" is defined in a Column Definition object
 * Similar to the ContextMenu plugin (could be used in combo),
 * except that it subscribes to the cell "onClick" event (regular mouse click or touch).
 *
 * A general use of this plugin is for an Action Dropdown Menu to do certain things on the row that was clicked
 * You can use it to change the cell data property through a list of Options AND/OR through a list of Commands.
 *
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.columns = [{
 *     id: 'myColumn', name: 'My column',
 *     cellMenu: {
 *       // ... cell menu options
 *       commandItems: [{ ...menu item options... }, { ...menu item options... }]
 *     }
 *   }];
 */
export class SlickCellMenu extends MenuFromCellBaseClass<CellMenu> {
  readonly pluginName = 'CellMenu';

  protected _defaults = {
    autoAdjustDrop: true, // dropup/dropdown
    autoAlignSide: true, // left/right
    autoAdjustDropOffset: 0,
    autoAlignSideOffset: 0,
    hideMenuOnScroll: true,
    subMenuOpenByEvent: 'mouseover',
  } as unknown as CellMenuOption;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: BasePubSubService,
    protected readonly sharedService: SharedService
  ) {
    super(extensionUtility, pubSubService, sharedService);
    this._camelPluginName = 'cellMenu';
    this._menuCssPrefix = 'slick-menu';
    this._menuPluginCssPrefix = 'slick-cell-menu';
    this.init(sharedService.gridOptions.cellMenu);
  }

  /** Initialize plugin. */
  init(cellMenuOptions?: CellMenu): void {
    this._addonOptions = { ...this._defaults, ...cellMenuOptions };

    // sort all menu items by their position order when defined
    this.sortMenuItems(this.grid.getColumns());

    this._eventHandler.subscribe(this.grid.onClick, this.handleCellClick.bind(this));
    this._eventHandler.subscribe(this.grid.onKeyDown, this.handleCellKeyDown.bind(this));

    if (this._addonOptions.hideMenuOnScroll) {
      this._eventHandler.subscribe(this.grid.onScroll, this.closeMenu.bind(this));
    }
  }

  /** Translate the Cell Menu titles, we need to loop through all column definition to re-translate all list titles & all commands/options */
  translateCellMenu(): void {
    const gridOptions = this.sharedService?.gridOptions;
    const columns = this.grid.getColumns();

    if (gridOptions?.enableTranslate && Array.isArray(columns)) {
      columns.forEach((columnDef: Column) => {
        if (columnDef?.cellMenu && (Array.isArray(columnDef.cellMenu.commandItems) || Array.isArray(columnDef.cellMenu.optionItems))) {
          // get both items list
          const columnCellMenuCommandItems: Array<MenuCommandItem | 'divider'> = columnDef.cellMenu.commandItems || [];
          const columnCellMenuOptionItems: Array<MenuOptionItem | 'divider'> = columnDef.cellMenu.optionItems || [];

          // translate their titles only if they have a titleKey defined
          if (columnDef.cellMenu.commandTitleKey) {
            // prettier-ignore
            columnDef.cellMenu.commandTitle = this.extensionUtility.translateWhenEnabledAndServiceExist(columnDef.cellMenu.commandTitleKey, 'TEXT_COMMANDS') || columnDef.cellMenu.commandTitle;
          }
          if (columnDef.cellMenu.optionTitleKey) {
            // prettier-ignore
            columnDef.cellMenu.optionTitle = this.extensionUtility.translateWhenEnabledAndServiceExist(columnDef.cellMenu.optionTitleKey, 'TEXT_OPTIONS') || columnDef.cellMenu.optionTitle;
          }

          // translate both command/option items (whichever is provided)
          this.extensionUtility.translateMenuItemsFromTitleKey(columnCellMenuCommandItems, 'commandItems');
          this.extensionUtility.translateMenuItemsFromTitleKey(columnCellMenuOptionItems, 'optionItems');
        }
      });
    }
  }

  // --
  // event handlers
  // ------------------

  protected handleCellClick(event: SlickEventData, args: OnClickEventArgs): void {
    this.disposeAllMenus(); // make there's only 1 parent menu opened at a time
    const dataContext = this.grid.getDataItem(args.row) ?? {};
    const columnDef = this.grid.getColumnByIdx(args.cell) ?? ({} as Column);

    if (columnDef && dataContext) {
      // prevent event from bubbling but only on column that has a cell menu defined
      if (columnDef.cellMenu && !this.gridOptions.cellMenu?.activateCellOnMenuClick) {
        event.preventDefault();
      }

      // merge the cellMenu of the column definition with the default properties
      this._addonOptions = { ...this._addonOptions, ...columnDef.cellMenu };

      // run the override function (when defined), if the result is false it won't go further
      const menuArgs = (args || {}) as MenuCommandItemCallbackArgs;
      menuArgs.column = columnDef;
      menuArgs.dataContext = dataContext;
      menuArgs.grid = this.grid;
      if (!this.extensionUtility.runOverrideFunctionWhenExists(this._addonOptions.menuUsabilityOverride, menuArgs)) {
        return;
      }

      // create the DOM element
      this._menuElm = this.createParentMenu(event, args);

      // reposition the menu to where the user clicked
      if (this._menuElm) {
        this.repositionMenu(event, this._menuElm, undefined, this._addonOptions);
        this._menuElm.style.display = 'block';
        if (this.gridOptions.darkMode) {
          this._menuElm.classList.add('slick-dark-mode');
        }

        // Hide the menu on outside click.
        this._bindEventService.bind(document.body, 'mousedown', this.handleBodyMouseDown.bind(this) as EventListener);
      }
    }
  }

  /** Open the Cell Menu from root grid cell context on Enter key, sub-menu Enter key presses are handled separately and ignored here. */
  protected handleCellKeyDown(event: SlickEventData, args: OnKeyDownEventArgs): void {
    const keyboardEvent = event.getNativeEvent<KeyboardEvent>();
    const columnDef = this.grid.getColumns()[args.cell];

    // Open Cell Menu on Enter only when this column defines cellMenu and no editor is currently active.
    if (keyboardEvent?.key === 'Enter' && columnDef?.cellMenu && !this.grid.getEditorLock()?.isActive?.()) {
      const parentCell = this.grid.getCellNode(args.row, args.cell)?.closest<HTMLDivElement>('.slick-cell');
      if (parentCell) {
        this.handleCellClick(
          {
            ...keyboardEvent,
            preventDefault: keyboardEvent.preventDefault.bind(keyboardEvent),
            stopPropagation: keyboardEvent.stopPropagation.bind(keyboardEvent),
            defaultPrevented: keyboardEvent.defaultPrevented,
            target: parentCell,
          } as unknown as SlickEventData,
          args
        );
      }
    }
  }

  // --
  // protected functions
  // ------------------

  /** @deprecated Sort items (by pointers) in an array by a property name */
  protected sortMenuItems(columns: Column[]): void {
    // sort both items list
    columns.forEach((columnDef: Column) => {
      if (columnDef?.cellMenu?.commandItems) {
        this.extensionUtility.sortItems(columnDef.cellMenu.commandItems || [], 'positionOrder');
      }
      if (columnDef?.cellMenu?.optionItems) {
        this.extensionUtility.sortItems(columnDef.cellMenu.optionItems || [], 'positionOrder');
      }
    });
  }
}
