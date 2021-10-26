import 'slickgrid/plugins/slick.rowmovemanager';

import {
  Column,
  Extension,
  GetSlickEventType,
  GridOption,
  SlickEventHandler,
  SlickNamespace,
  SlickRowMoveManager,
  SlickRowSelectionModel,
} from '../interfaces/index';
import { SharedService } from '../services/shared.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class RowMoveManagerExtension implements Extension {
  private _addon: SlickRowMoveManager | null = null;
  private _eventHandler: SlickEventHandler;
  private _rowSelectionPlugin!: SlickRowSelectionModel;

  constructor(private readonly sharedService: SharedService) {
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
      this._addon = null;
    }
    if (this._rowSelectionPlugin?.destroy) {
      this._rowSelectionPlugin.destroy();
    }
  }

  /**
   * Create the plugin before the Grid creation to avoid having odd behaviors.
   * Mostly because the column definitions might change after the grid creation, so we want to make sure to add it before then
   */
  create(columnDefinitions: Column[], gridOptions: GridOption): SlickRowMoveManager | null {
    if (Array.isArray(columnDefinitions) && gridOptions) {
      this._addon = this.loadAddonWhenNotExists(columnDefinitions, gridOptions);
      const newRowMoveColumn: Column | undefined = this._addon?.getColumnDefinition();
      const rowMoveColDef = Array.isArray(columnDefinitions) && columnDefinitions.find((col: Column) => col && col.behavior === 'selectAndMove');
      const finalRowMoveColumn = rowMoveColDef ? rowMoveColDef : newRowMoveColumn;

      // set some exclusion properties since we don't want this column to be part of the export neither the list of column in the pickers
      if (typeof finalRowMoveColumn === 'object') {
        finalRowMoveColumn.excludeFromExport = true;
        finalRowMoveColumn.excludeFromColumnPicker = true;
        finalRowMoveColumn.excludeFromGridMenu = true;
        finalRowMoveColumn.excludeFromQuery = true;
        finalRowMoveColumn.excludeFromHeaderMenu = true;
      }

      // only add the new column if it doesn't already exist
      if (!rowMoveColDef && finalRowMoveColumn) {
        // column index position in the grid
        const columnPosition = gridOptions?.rowMoveManager?.columnIndexPosition ?? 0;
        if (columnPosition > 0) {
          columnDefinitions.splice(columnPosition, 0, finalRowMoveColumn);
        } else {
          columnDefinitions.unshift(finalRowMoveColumn);
        }
      }
      return this._addon;
    }
    return null;
  }

  loadAddonWhenNotExists(columnDefinitions: Column[], gridOptions: GridOption): SlickRowMoveManager | null {
    if (Array.isArray(columnDefinitions) && gridOptions) {
      if (!this._addon) {
        this._addon = new Slick.RowMoveManager(gridOptions?.rowMoveManager || { cancelEditOnDrag: true, hideRowMoveShadow: false, });
      }
      return this._addon;
    }
    return null;
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickRowMoveManager | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(rowSelectionPlugin?: SlickRowSelectionModel): SlickRowMoveManager | null {
    if (this._addon && this.sharedService && this.sharedService.slickGrid && this.sharedService.gridOptions) {
      // this also requires the Row Selection Model to be registered as well
      if (!rowSelectionPlugin || !this.sharedService.slickGrid.getSelectionModel()) {
        rowSelectionPlugin = new Slick.RowSelectionModel(this.sharedService.gridOptions.rowSelectionOptions);
        this.sharedService.slickGrid.setSelectionModel(rowSelectionPlugin);
      }
      this._rowSelectionPlugin = rowSelectionPlugin;
      this.sharedService.slickGrid.registerPlugin<SlickRowMoveManager>(this._addon);

      // hook all events
      if (this._addon && this.sharedService.slickGrid && this.sharedService.gridOptions.rowMoveManager) {
        if (this.sharedService.gridOptions.rowMoveManager.onExtensionRegistered) {
          this.sharedService.gridOptions.rowMoveManager.onExtensionRegistered(this._addon);
        }

        const onBeforeMoveRowsHandler = this._addon.onBeforeMoveRows;
        if (onBeforeMoveRowsHandler) {
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onBeforeMoveRowsHandler>>).subscribe(onBeforeMoveRowsHandler, (e, args) => {
            if (this.sharedService.gridOptions.rowMoveManager && typeof this.sharedService.gridOptions.rowMoveManager.onBeforeMoveRows === 'function') {
              return this.sharedService.gridOptions.rowMoveManager.onBeforeMoveRows(e, args);
            }
          });
        }

        const onMoveRowsHandler = this._addon.onMoveRows;
        if (onMoveRowsHandler) {
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onMoveRowsHandler>>).subscribe(onMoveRowsHandler, (e, args) => {
            if (this.sharedService.gridOptions.rowMoveManager && typeof this.sharedService.gridOptions.rowMoveManager.onMoveRows === 'function') {
              this.sharedService.gridOptions.rowMoveManager.onMoveRows(e, args);
            }
          });
        }
      }
      return this._addon;
    }
    return null;
  }
}
