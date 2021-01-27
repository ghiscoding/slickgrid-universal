import 'slickgrid/plugins/slick.cellmenu';

import { Constants } from '../constants';
import {
  CellMenu,
  CellMenuOption,
  Column,
  Extension,
  GetSlickEventType,
  MenuCommandItem,
  MenuOptionItem,
  Locale,
  SlickCellMenu,
  SlickEventHandler,
  SlickNamespace,
} from '../interfaces/index';
import { ExtensionUtility } from './extensionUtility';
import { SharedService } from '../services/shared.service';
import { TranslaterService } from '../services';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class CellMenuExtension implements Extension {
  private _addon: SlickCellMenu | null;
  private _cellMenuOptions: CellMenu | null;
  private _eventHandler: SlickEventHandler;
  private _locales: Locale;

  constructor(
    private readonly extensionUtility: ExtensionUtility,
    private readonly sharedService: SharedService,
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
    this.extensionUtility.nullifyFunctionNameStartingWithOn(this._cellMenuOptions);
    this._addon = null;
    this._cellMenuOptions = null;
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickCellMenu | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): SlickCellMenu | null {
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }

    if (this.sharedService && this.sharedService.slickGrid && this.sharedService.gridOptions) {
      const cellMenu = this.sharedService.gridOptions.cellMenu;
      // get locales provided by user in main file or else use default English locales via the Constants
      this._locales = this.sharedService.gridOptions && this.sharedService.gridOptions.locales || Constants.locales;

      this._cellMenuOptions = { ...this.getDefaultCellMenuOptions(), ...this.sharedService.gridOptions.cellMenu };
      this.sharedService.gridOptions.cellMenu = this._cellMenuOptions;

      // translate the item keys when necessary
      if (this.sharedService.gridOptions.enableTranslate) {
        this.translateCellMenu();
      }

      // sort all menu items by their position order when defined
      this.sortMenuItems(this.sharedService.allColumns);

      this._addon = new Slick.Plugins.CellMenu(this._cellMenuOptions);
      if (this._addon) {
        this.sharedService.slickGrid.registerPlugin<SlickCellMenu>(this._addon);
      }

      // hook all events
      if (this.sharedService.slickGrid && this._cellMenuOptions) {
        if (this._addon && this._cellMenuOptions.onExtensionRegistered) {
          this._cellMenuOptions.onExtensionRegistered(this._addon);
        }
        if (cellMenu && typeof cellMenu.onCommand === 'function') {
          const onCommandHandler = this._addon.onCommand;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onCommandHandler>>).subscribe(onCommandHandler, (event, args) => {
            if (cellMenu.onCommand) {
              cellMenu.onCommand(event, args);
            }
          });
        }
        if (cellMenu && typeof cellMenu.onOptionSelected === 'function') {
          const onOptionSelectedHandler = this._addon.onOptionSelected;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onOptionSelectedHandler>>).subscribe(onOptionSelectedHandler, (event, args) => {
            if (cellMenu.onOptionSelected) {
              cellMenu.onOptionSelected(event, args);
            }
          });
        }
        if (cellMenu && typeof cellMenu.onBeforeMenuShow === 'function') {
          const onBeforeMenuShowHandler = this._addon.onBeforeMenuShow;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeMenuShowHandler>>).subscribe(onBeforeMenuShowHandler, (event, args) => {
            if (cellMenu.onBeforeMenuShow) {
              cellMenu.onBeforeMenuShow(event, args);
            }
          });
        }
        if (cellMenu && typeof cellMenu.onBeforeMenuClose === 'function') {
          const onBeforeMenuCloseHandler = this._addon.onBeforeMenuClose;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeMenuCloseHandler>>).subscribe(onBeforeMenuCloseHandler, (event, args) => {
            if (cellMenu.onBeforeMenuClose) {
              cellMenu.onBeforeMenuClose(event, args);
            }
          });
        }
        if (cellMenu && typeof cellMenu.onAfterMenuShow === 'function') {
          const onAfterMenuShowHandler = this._addon.onAfterMenuShow;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onAfterMenuShowHandler>>).subscribe(onAfterMenuShowHandler, (event, args) => {
            if (cellMenu.onAfterMenuShow) {
              cellMenu.onAfterMenuShow(event, args);
            }
          });
        }
      }
      return this._addon;
    }
    return null;
  }

  /** Translate the Cell Menu titles, we need to loop through all column definition to re-translate them */
  translateCellMenu() {
    if (this.sharedService.gridOptions?.cellMenu) {
      this.resetMenuTranslations(this.sharedService.allColumns);
    }
  }

  /**
   * @return default Action Cell Menu options
   */
  private getDefaultCellMenuOptions(): CellMenuOption {
    return {
      width: 180,
    };
  }

  /**
   * Reset all the internal Menu options which have text to translate
   * @param grid menu object
   */
  private resetMenuTranslations(columnDefinitions: Column[]) {
    const gridOptions = this.sharedService && this.sharedService.gridOptions;

    if (gridOptions && gridOptions.enableTranslate) {
      columnDefinitions.forEach((columnDef: Column) => {
        if (columnDef && columnDef.cellMenu && (Array.isArray(columnDef.cellMenu.commandItems) || Array.isArray(columnDef.cellMenu.optionItems))) {
          // get both items list
          const columnCellMenuCommandItems: Array<MenuCommandItem | 'divider'> = columnDef.cellMenu.commandItems || [];
          const columnCellMenuOptionItems: Array<MenuOptionItem | 'divider'> = columnDef.cellMenu.optionItems || [];

          // translate their titles only if they have a titleKey defined
          if (columnDef.cellMenu.commandTitleKey) {
            columnDef.cellMenu.commandTitle = this.translaterService && this.translaterService.getCurrentLanguage && this.translaterService.translate && this.translaterService.translate(columnDef.cellMenu.commandTitleKey) || this._locales && this._locales.TEXT_COMMANDS || columnDef.cellMenu.commandTitle;
          }
          if (columnDef.cellMenu.optionTitleKey) {
            columnDef.cellMenu.optionTitle = this.translaterService && this.translaterService.getCurrentLanguage && this.translaterService.translate && this.translaterService.translate(columnDef.cellMenu.optionTitleKey) || columnDef.cellMenu.optionTitle;
          }

          // translate both command/option items (whichever is provided)
          this.extensionUtility.translateItems(columnCellMenuCommandItems, 'titleKey', 'title');
          this.extensionUtility.translateItems(columnCellMenuOptionItems, 'titleKey', 'title');
        }
      });
    }
  }

  sortMenuItems(columnDefinitions: Column[]) {
    columnDefinitions.forEach((columnDef: Column) => {
      if (columnDef && columnDef.cellMenu && columnDef.cellMenu.commandItems) {
        // get both items list
        const columnCellMenuCommandItems: Array<MenuCommandItem | 'divider'> = columnDef.cellMenu.commandItems || [];
        const columnCellMenuOptionItems: Array<MenuOptionItem | 'divider'> = columnDef.cellMenu.optionItems || [];

        this.extensionUtility.sortItems(columnCellMenuCommandItems, 'positionOrder');
        this.extensionUtility.sortItems(columnCellMenuOptionItems, 'positionOrder');
      }
    });
  }
}
