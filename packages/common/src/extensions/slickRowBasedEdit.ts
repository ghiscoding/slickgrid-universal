import type {
  OnBeforeEditCellEventArgs,
  RowBasedEditOptions,
} from "../interfaces/index";
import { SlickEventHandler, type SlickGrid } from "../core/index";
import { GridService } from "../services";

/**
 * Row based edit plugin to add edit/delete buttons to each row and only allow editing rows currently in editmode
 */
export class SlickRowBasedEdit {
  pluginName = "RowBasedEdit" as const;

  protected _addonOptions?: RowBasedEditOptions;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _defaults = {
    actionsColumnLabel: "Actions",
    allowMultipleRows: false,
  } as RowBasedEditOptions;

  protected _editedRows: any[] = [];

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(options?: RowBasedEditOptions) {
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
    this._addonOptions = { ...this._defaults, ...this.addonOptions };
    this.addActionsColumn(gridService);
    this._eventHandler.subscribe(
      this._grid.onBeforeEditCell,
      this.onBeforeEditCellHandler
    );
  }

  destroy() {
    this.dispose();
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose() {
    this._eventHandler?.unsubscribeAll();
  }

  protected onBeforeEditCellHandler = (
    e: Event,
    args: OnBeforeEditCellEventArgs
  ) => {
    return this._editedRows.includes(args.row);
  };

  protected addActionsColumn(gridService: GridService) {
    this._grid.setColumns([
      ...this._grid.getColumns(),
      {
        id: "slick_rowbasededit_action",
        name: this._addonOptions?.actionsColumnLabel,
        field: "action",
        minWidth: 70,
        width: 75,
        maxWidth: 75,
        excludeFromExport: true,
        formatter: () => `
          <span class="button-style padding-1px action-btns action-btns--edit" title="Edit the Row"><span class="mdi mdi-table-edit color-primary" title="Edit Current Row"></span></span>
          <span class="button-style padding-1px action-btns action-btns--delete" title="Delete the Row"><span class="mdi mdi-close color-danger" title="Delete Current Row"></span></span>
          <span style="display: none" class="button-style padding-1px action-btns action-btns--update" title="Update row"><span class="mdi mdi-check-bold color-success" title="Update Current Row"></span></span>
          <span style="display: none" class="button-style padding-1px action-btns action-btns--cancel" title="Cancel changes"><span class="mdi mdi-cancel color-danger" title="Cancel Current Row's changes"></span></span>
      `,
        onCellClick: (event: Event, args) => {
          const dataContext = args.dataContext;
          const target = event.target as HTMLElement;
          if (target.classList.contains("mdi-close")) {
            gridService.deleteItem(dataContext);
          } else if (target.classList.contains("mdi-table-edit")) {
            if (!this._addonOptions?.allowMultipleRows && this._editedRows.length > 0) {
              return;
            }

            this.toggleActionButtons(target, true);
            this._editedRows = [...this._editedRows, args.row];
          } else if (target.classList.contains("mdi-check-bold")) {
            this.toggleActionButtons(target, false);
            this._editedRows = this._editedRows.filter(
              (row) => row !== args.row
            );
            if (this._addonOptions?.onAfterRowUpdated) {
              this._addonOptions.onAfterRowUpdated(args);
            }
          } else if (target.classList.contains("mdi-cancel")) {
            this.toggleActionButtons(target, false);
            this._editedRows = this._editedRows.filter(
              (row) => row !== args.row
            );
          }
        },
      },
    ]);
  }

  private toggleActionButtons(target: HTMLElement, editMode: boolean) {
    const slickCell = target.closest(".slick-cell");
    const btnEdit = slickCell?.querySelector(
      ".action-btns--edit"
    ) as HTMLElement;
    const btnDelete = slickCell?.querySelector(
      ".action-btns--delete"
    ) as HTMLElement;
    const btnUpdate = slickCell?.querySelector(
      ".action-btns--update"
    ) as HTMLElement;
    const btnCancel = slickCell?.querySelector(
      ".action-btns--cancel"
    ) as HTMLElement;

    if (editMode) {
      btnEdit.style.display = "none";
      btnDelete.style.display = "none";
      btnUpdate.style.display = "inline-block";
      btnCancel.style.display = "inline-block";
    } else {
      btnEdit.style.display = "inline-block";
      btnDelete.style.display = "inline-block";
      btnUpdate.style.display = "none";
      btnCancel.style.display = "none";
    }
  }
}
