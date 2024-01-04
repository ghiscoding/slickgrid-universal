import type {
  Column,
  GridOption,
  OnBeforeEditCellEventArgs,
  OnSetOptionsEventArgs,
  RowBasedEditOptions,
} from '../interfaces/index';
import { SlickEventHandler, type SlickGrid } from '../core/index';
import { GridService } from '../services';
import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

export const ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS = 'slick-rbe-editmode';

/**
 * Row based edit plugin to add edit/delete buttons to each row and only allow editing rows currently in editmode
 */
export class SlickRowBasedEdit {
  pluginName = 'RowBasedEdit' as const;

  protected _addonOptions?: RowBasedEditOptions;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _gridService?: GridService;
  protected _defaults = {
    actionsColumnLabel: 'Actions',
    allowMultipleRows: false,
    columnId: '_slick_rowbasededit_action',
    columnIndexPosition: -1,
  } as RowBasedEditOptions;

  protected _editedRows: Map<string, any> = new Map();

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(protected readonly pubSubService: BasePubSubService, options?: RowBasedEditOptions) {
    this._eventHandler = new SlickEventHandler();
    this._addonOptions = options;
  }

  get addonOptions(): RowBasedEditOptions {
    return this._addonOptions as RowBasedEditOptions;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Initialize plugin. */
  init(grid: SlickGrid, gridService: GridService) {
    this._grid = grid;
    this._gridService = gridService;
    this._addonOptions = { ...this._defaults, ...this.addonOptions };
    this._eventHandler.subscribe(
      this._grid.onBeforeEditCell,
      this.onBeforeEditCellHandler
    );

    this._eventHandler.subscribe(this._grid.onSetOptions, this.optionsUpdatedHandler.bind(this));
  }

  destroy() {
    this.dispose();
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose() {
    this._eventHandler?.unsubscribeAll();
    this.pubSubService?.unsubscribeAll();
  }

  create(columnDefinitions: Column[], gridOptions: GridOption): SlickRowBasedEdit | null {
    this._addonOptions = { ...this._defaults, ...gridOptions.rowBasedEditOptions } as RowBasedEditOptions;
    if (Array.isArray(columnDefinitions) && gridOptions) {
      const selectionColumn: Column = this.getColumnDefinition();

      // add new action column unless it was already added
      if (!columnDefinitions.some(col => col.id === selectionColumn.id)) {
        // column index position in the grid
        const columnPosition = gridOptions?.rowBasedEditOptions?.columnIndexPosition ?? -1;
        if (columnPosition === -1) {
          columnDefinitions.push(selectionColumn);
        }
        else if (columnPosition > 0) {
          columnDefinitions.splice(columnPosition, 0, selectionColumn);
        } else {
          columnDefinitions.unshift(selectionColumn);
        }
        this.pubSubService.publish(`onPluginColumnsChanged`, {
          columns: columnDefinitions,
          pluginName: this.pluginName
        });
      }
    }
    return this;
  }

  getColumnDefinition(): Column {
    const columnId = String(this._addonOptions?.columnId ?? this._defaults.columnId);

    return {
      id: columnId,
      name: this._addonOptions?.actionsColumnLabel,
      field: 'action',
      minWidth: 70,
      width: 75,
      maxWidth: 75,
      excludeFromExport: true,
      formatter: this.actionColumnFormatter.bind(this),
      onCellClick: this.onCellClickHandler.bind(this),
    } as Column;
  }

  protected optionsUpdatedHandler(e: Event, args: OnSetOptionsEventArgs) {
    this._addonOptions = { ...this._defaults, ...args.optionsAfter.rowBasedEditOptions } as RowBasedEditOptions;
  }

  protected onCellClickHandler (event: Event, args: any) {
    const dataContext = args.dataContext;
    const target = event.target as HTMLElement;

    if (target.classList.contains('mdi-close') && this._gridService) {
      this.toggleEditmode(target, dataContext, false);
      this._gridService.deleteItem(dataContext);
    } else if (target.classList.contains('mdi-table-edit')) {
      if (
        !this._addonOptions?.allowMultipleRows &&
        this._editedRows.size > 0
      ) {
        return;
      }

      this.toggleEditmode(target, dataContext, true);
    } else if (target.classList.contains('mdi-check-bold')) {
      this.toggleEditmode(target, dataContext, false);

      if (this._addonOptions?.onAfterRowUpdated) {
        this._addonOptions.onAfterRowUpdated(args);
      }
    } else if (target.classList.contains('mdi-cancel')) {
      this.toggleEditmode(target, dataContext, false);
    }
  }

  protected actionColumnFormatter(
    row: number,
    cell: number,
    value: any,
    columnDef: Column,
    dataContext: any
  ) {
    const isInEditMode = this._editedRows.has(
      dataContext?.[this._grid.getOptions().datasetIdPropertyName ?? 'id']
    );

    return `
    <span ${
      isInEditMode ? 'style="display: none"' : ''
    } class="button-style padding-1px action-btns action-btns--edit" title="Edit the Row"><span class="mdi mdi-table-edit color-primary" title="Edit Current Row"></span></span>
    <span ${
      isInEditMode ? 'style="display: none"' : ''
    } class="button-style padding-1px action-btns action-btns--delete" title="Delete the Row"><span class="mdi mdi-close color-danger" title="Delete Current Row"></span></span>
    <span ${
      !isInEditMode ? 'style="display: none"' : ''
    } class="button-style padding-1px action-btns action-btns--update" title="Update row"><span class="mdi mdi-check-bold color-success" title="Update Current Row"></span></span>
    <span ${
      !isInEditMode ? 'style="display: none"' : ''
    } class="button-style padding-1px action-btns action-btns--cancel" title="Cancel changes"><span class="mdi mdi-cancel color-danger" title="Cancel Current Row's changes"></span></span>
  `;
  }

  protected onBeforeEditCellHandler = (
    e: Event,
    args: OnBeforeEditCellEventArgs
  ) => {
    return this._editedRows.has(
      args.item?.[this._grid.getOptions().datasetIdPropertyName ?? 'id']
    );
  };

  private toggleEditmode(
    target: HTMLElement,
    dataContext: any,
    editMode: boolean
  ) {
    const slickCell = target.closest('.slick-cell');
    const slickRow = target.closest('.slick-row');
    const btnEdit = slickCell?.querySelector(
      '.action-btns--edit'
    ) as HTMLElement;
    const btnDelete = slickCell?.querySelector(
      '.action-btns--delete'
    ) as HTMLElement;
    const btnUpdate = slickCell?.querySelector(
      '.action-btns--update'
    ) as HTMLElement;
    const btnCancel = slickCell?.querySelector(
      '.action-btns--cancel'
    ) as HTMLElement;

    const idProperty = this._grid.getOptions().datasetIdPropertyName ?? 'id';
    if (editMode) {
      btnEdit.style.display = 'none';
      btnDelete.style.display = 'none';
      btnUpdate.style.display = 'inline-block';
      btnCancel.style.display = 'inline-block';
      this._editedRows.set(dataContext[idProperty], []);
    } else {
      btnEdit.style.display = 'inline-block';
      btnDelete.style.display = 'inline-block';
      btnUpdate.style.display = 'none';
      btnCancel.style.display = 'none';
      this._editedRows.delete(dataContext[idProperty]);
    }

    slickRow?.classList.toggle(ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS, editMode);
  }
}
