import { ExtensionName } from '../enums/index';
import { CellArgs, Extension, SlickEventHandler, Column, GridOption } from '../interfaces/index';
import { ExtensionUtility } from './extensionUtility';
import { SharedService } from '../services/shared.service';

// using external non-typed js libraries
declare const Slick: any;

export class RowMoveManagerExtension implements Extension {
  private _addon: any;
  private _eventHandler: SlickEventHandler;

  constructor(private extensionUtility: ExtensionUtility, private sharedService: SharedService) {
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

  /**
   * Create the plugin before the Grid creation to avoid having odd behaviors.
   * Mostly because the column definitions might change after the grid creation, so we want to make sure to add it before then
   */
  create(columnDefinitions: Column[], gridOptions: GridOption) {
    if (Array.isArray(columnDefinitions) && gridOptions) {
      // dynamically import the SlickGrid plugin (addon) with RequireJS
      this.extensionUtility.loadExtensionDynamically(ExtensionName.rowMoveManager);
      if (!this._addon) {
        this._addon = new Slick.RowMoveManager(gridOptions?.rowMoveManager || { cancelEditOnDrag: true });
      }
      const selectionColumn: Column = this._addon.getColumnDefinition();
      if (typeof selectionColumn === 'object') {
        selectionColumn.excludeFromExport = true;
        selectionColumn.excludeFromColumnPicker = true;
        selectionColumn.excludeFromGridMenu = true;
        selectionColumn.excludeFromQuery = true;
        selectionColumn.excludeFromHeaderMenu = true;

        // column index position in the grid
        const columnPosition = gridOptions?.rowMoveManager?.columnIndexPosition || 0;
        if (columnPosition > 0) {
          columnDefinitions.splice(columnPosition, 0, selectionColumn);
        } else {
          columnDefinitions.unshift(selectionColumn);
        }
      }
      return this._addon;
    }
    return null;
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance() {
    return this._addon;
  }

  register(rowSelectionPlugin?: any): any {
    if (this.sharedService && this.sharedService.grid && this.sharedService.gridOptions) {
      // dynamically import the SlickGrid plugin (addon) with RequireJS
      this.extensionUtility.loadExtensionDynamically(ExtensionName.rowMoveManager);

      // this also requires the Row Selection Model to be registered as well
      if (!rowSelectionPlugin || !this.sharedService.grid.getSelectionModel()) {
        this.extensionUtility.loadExtensionDynamically(ExtensionName.rowSelection);
        rowSelectionPlugin = new Slick.RowSelectionModel(this.sharedService.gridOptions.rowSelectionOptions || {});
        this.sharedService.grid.setSelectionModel(rowSelectionPlugin);
      }

      this.sharedService.grid.registerPlugin(this._addon);

      // hook all events
      if (this.sharedService.grid && this.sharedService.gridOptions.rowMoveManager) {
        if (this.sharedService.gridOptions.rowMoveManager.onExtensionRegistered) {
          this.sharedService.gridOptions.rowMoveManager.onExtensionRegistered(this._addon);
        }
        this._eventHandler.subscribe(this._addon.onBeforeMoveRows, (e: any, args: CellArgs) => {
          if (this.sharedService.gridOptions.rowMoveManager && typeof this.sharedService.gridOptions.rowMoveManager.onBeforeMoveRows === 'function') {
            this.sharedService.gridOptions.rowMoveManager.onBeforeMoveRows(e, args);
          }
        });
        this._eventHandler.subscribe(this._addon.onMoveRows, (e: any, args: CellArgs) => {
          if (this.sharedService.gridOptions.rowMoveManager && typeof this.sharedService.gridOptions.rowMoveManager.onMoveRows === 'function') {
            this.sharedService.gridOptions.rowMoveManager.onMoveRows(e, args);
          }
        });
      }
      return this._addon;
    }
    return null;
  }
}
