import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement } from '@slickgrid-universal/utils';
import { SlickEventHandler, SlickGlobalEditorLock, type SlickEventData, type SlickGrid } from '../core/index.js';
import type {
  Column,
  EditCommand,
  GridOption,
  OnBeforeEditCellEventArgs,
  OnEventArgs,
  OnRowsOrCountChangedEventArgs,
  OnSetOptionsEventArgs,
  RowBasedEditOptions,
} from '../interfaces/index.js';
import type { GridService } from '../services/grid.service.js';
import type { ExtensionUtility } from './extensionUtility.js';

export const ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS = 'slick-rbe-editmode';
export const ROW_BASED_EDIT_UNSAVED_CELL = 'slick-rbe-unsaved-cell';
export const ROW_BASED_EDIT_UNSAVED_HIGHLIGHT_PREFIX = 'slick-rbe-unsaved-highlight';
export const BTN_ACTION_DELETE = 'action-btns--delete';
export const BTN_ACTION_EDIT = 'action-btns--edit';
export const BTN_ACTION_UPDATE = 'action-btns--update';
export const BTN_ACTION_CANCEL = 'action-btns--cancel';

export interface EditedRowDetails {
  // the affected columns by the edits of the row
  columns: Column[];
  // the edit commands of the row. This is used to undo the edits
  editCommands: EditCommand[];
  // stores style keys for unsaved cells
  cssStyleKeys: string[];
}

interface ButtonTranslation {
  btnUpdateTitle: string;
  btnEditTitle: string;
  btnDeleteTitle: string;
  btnCancelTitle: string;
}

/**
 * Row based edit plugin to add edit/delete buttons to each row and only allow editing rows currently in editmode
 */
export class SlickRowBasedEdit {
  readonly pluginName = 'RowBasedEdit';

  protected _addonOptions?: RowBasedEditOptions;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _gridService?: GridService;
  protected _defaults = {
    actionsColumnLabel: 'Actions',
    allowMultipleRows: false,
    columnId: '_slick_rowbasededit_action',
    columnIndexPosition: -1,
    reorderable: false,
  } as RowBasedEditOptions;
  protected _editedRows: Map<string, EditedRowDetails> = new Map();

  private _existingEditCommandHandler: ((item: any, column: Column<any>, command: EditCommand) => void) | undefined;
  protected _currentLang = 'en';
  private _translations: { [locale: string]: ButtonTranslation } = {};

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(
    protected readonly extensionUtility: ExtensionUtility,
    protected readonly pubSubService: BasePubSubService,
    options?: RowBasedEditOptions
  ) {
    this._eventHandler = new SlickEventHandler();
    this._addonOptions = options;
  }

  get addonOptions(): RowBasedEditOptions {
    return this._addonOptions as RowBasedEditOptions;
  }

  get gridOptions(): GridOption {
    return this._grid.getOptions() || ({} as GridOption);
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Initialize plugin. */
  init(grid: SlickGrid, gridService: GridService): void {
    this._grid = grid;
    this._gridService = gridService;
    this._addonOptions = { ...this._defaults, ...this.addonOptions };
    const dataView = this._grid.getData();
    this._eventHandler.subscribe(this._grid.onBeforeEditCell, this.onBeforeEditCellHandler);
    this.checkOptionsRequirements(this.gridOptions);

    if (!this.gridOptions.autoEdit) {
      this._grid.setOptions({ autoEdit: true });
      console.warn(
        '[Slickgrid-Universal] The Row Based Edit Plugin works best with the gridOption "autoEdit" enabled, the option has now been set automatically for you.'
      );
    }

    this._existingEditCommandHandler = this.gridOptions.editCommandHandler;
    this._grid.setOptions({
      editCommandHandler: this.rowBasedEditCommandHandler.bind(this),
    });

    if (this.gridOptions.enableExcelCopyBuffer === true) {
      const existingBeforePasteCellHandler = this.gridOptions.excelCopyBufferOptions?.onBeforePasteCell;

      this._grid.setOptions({
        excelCopyBufferOptions: {
          ...this.gridOptions.excelCopyBufferOptions,
          onBeforePasteCell: (e: SlickEventData<any>, args: OnEventArgs) => {
            let userResult = true;
            if (existingBeforePasteCellHandler) {
              userResult = existingBeforePasteCellHandler(e, args);

              if (userResult === false) {
                return false;
              }
            }

            const item = dataView.getItem(args.row);
            const idProperty = this.gridOptions.datasetIdPropertyName ?? 'id';

            if (this._editedRows.has(item[idProperty]) && userResult === true) {
              return true;
            }

            return false;
          },
        },
      });
    }

    const originalGetItemMetadata = dataView.getItemMetadata;
    dataView.getItemMetadata = this.updateItemMetadata(originalGetItemMetadata?.bind?.(dataView));
    this._eventHandler.subscribe(this._grid.onSetOptions, this.optionsUpdatedHandler.bind(this));
    this._eventHandler.subscribe(dataView.onRowsOrCountChanged, this.handleAllRowRerender.bind(this));

    this.translate();
  }

  destroy(): void {
    this.dispose();
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose(): void {
    this._eventHandler?.unsubscribeAll();
    this.pubSubService?.unsubscribeAll();
  }

  create(columns: Column[], gridOptions: GridOption): SlickRowBasedEdit | null {
    this._addonOptions = {
      ...this._defaults,
      ...gridOptions.rowBasedEditOptions,
    } as RowBasedEditOptions;
    if (Array.isArray(columns) && gridOptions) {
      const selectionColumn: Column = this.getColumnDefinition();
      // add new action column unless it was already added
      if (!columns.some((col) => col.id === selectionColumn.id)) {
        // column index position in the grid
        const columnPosition = gridOptions?.rowBasedEditOptions?.columnIndexPosition ?? -1;
        if (columnPosition === -1) {
          columns.push(selectionColumn);
        } else if (columnPosition > 0 && columnPosition < columns.length) {
          columns.splice(columnPosition, 0, selectionColumn);
        } else {
          columns.unshift(selectionColumn);
        }
        this.pubSubService.publish(`onPluginColumnsChanged`, {
          columns,
          pluginName: this.pluginName,
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
      reorderable: this._addonOptions?.reorderable,
      formatter: this.actionColumnFormatter.bind(this),
      onCellClick: this.onCellClickHandler.bind(this),
      ...(this._addonOptions?.actionColumnConfig ?? {}),
    } as Column;
  }

  rowBasedEditCommandHandler(item: any, column: Column<any>, editCommand: EditCommand): void {
    if (this._existingEditCommandHandler) {
      this._existingEditCommandHandler(item, column, editCommand);
    }

    const prevSerializedValues = Array.isArray(editCommand.prevSerializedValue)
      ? editCommand.prevSerializedValue
      : [editCommand.prevSerializedValue];
    const serializedValues = Array.isArray(editCommand.serializedValue) ? editCommand.serializedValue : [editCommand.serializedValue];
    const editorColumns = this._gridService?.getAllColumnDefinitions().filter((col) => col.editor !== undefined);

    const modifiedColumns: Column[] = [];
    const idProperty = this.gridOptions.datasetIdPropertyName ?? 'id';
    prevSerializedValues.forEach((_val, index) => {
      const prevSerializedValue = prevSerializedValues[index];
      const serializedValue = serializedValues[index];

      if (prevSerializedValue !== serializedValue || serializedValue === '') {
        /* v8 ignore next */
        const finalColumn = Array.isArray(editCommand.prevSerializedValue) ? editorColumns?.[index] : column;

        if (!finalColumn) {
          return;
        }

        this._grid.invalidate();
        editCommand.execute();

        this.renderUnsavedCellStyling(item[idProperty], finalColumn);
        modifiedColumns.push(finalColumn);
      }
    });

    const editedRow = this._editedRows.get(item[idProperty]);
    const newCommands = [...(editedRow?.editCommands || [])];
    if (modifiedColumns.length > 0) {
      newCommands.push(editCommand);
    }

    this._editedRows.set(item[idProperty], {
      columns: [...(editedRow?.columns || []), ...modifiedColumns],
      editCommands: newCommands,
      cssStyleKeys: editedRow?.cssStyleKeys || [],
    });
  }

  /**
   * Translate with current locale when `enableTranslate` is set or use title texts provided by user.
   * We want to translate only once to avoid having to translate on each dataset item, we'll just reuse the translations if it was already translated earlier.
   * User could optionally force a retranslate even if it was already translated
   * @param {Boolean} [forceRetranslate] - even if it was already translate, force a retranslate
   */
  translate(forceRetranslate = false): ButtonTranslation {
    this._currentLang = this.extensionUtility.translaterService?.getCurrentLanguage() ?? 'en';

    // translate only once or reuse what's in memory if it was translated
    if (!this._translations[this._currentLang] || forceRetranslate) {
      this._translations[this._currentLang] = {
        btnUpdateTitle: this.getTitleOrDefault('updateButtonTitle', 'Update the row'),
        btnEditTitle: this.getTitleOrDefault('editButtonTitle', 'Edit the Row'),
        btnDeleteTitle: this.getTitleOrDefault('deleteButtonTitle', 'Delete the Row'),
        btnCancelTitle: this.getTitleOrDefault('cancelButtonTitle', 'Cancel changes of the Row'),
      } as ButtonTranslation;
    }

    return this._translations[this._currentLang];
  }

  protected checkOptionsRequirements(options: GridOption): void {
    if (!options?.enableCellNavigation) {
      throw new Error(`[Slickgrid-Universal] Row Based Edit Plugin requires the gridOption cell navigation (enableCellNavigation = true)`);
    }

    if (!options?.editable) {
      throw new Error(`[Slickgrid-Universal] Row Based Edit Plugin requires the gridOption editable (editable = true)`);
    }
  }

  protected undoRowEdit(item: any): void {
    const idProperty = this.gridOptions.datasetIdPropertyName ?? 'id';
    const targetRow = this._editedRows.get(item[idProperty]);
    const row = this._grid.getData().getRowByItem(item);
    if ((row !== undefined && targetRow?.editCommands && targetRow.editCommands.length) || SlickGlobalEditorLock.cancelCurrentEdit()) {
      while (targetRow!.editCommands.length > 0) {
        const lastEdit = targetRow!.editCommands.pop();
        if (lastEdit) {
          lastEdit.undo();
        }
      }

      targetRow!.columns.forEach((column) => {
        this.removeUnsavedStylingFromCell(column, row!);
      });
      targetRow!.columns = [];

      this._grid.invalidate();
    }
  }

  protected renderUnsavedCellStyling(id: any, column: Column): void {
    if (column) {
      const row = this._grid.getData()?.getRowById(id);
      if (row !== undefined && row >= 0) {
        const hash = { [row]: { [column.id]: ROW_BASED_EDIT_UNSAVED_CELL } };
        const cssStyleKey = `${ROW_BASED_EDIT_UNSAVED_HIGHLIGHT_PREFIX}_${[column.id]}${row}`;
        this._grid.setCellCssStyles(cssStyleKey, hash);
        this._editedRows.get(id)?.cssStyleKeys.push(cssStyleKey);
      }
    }
  }

  protected handleAllRowRerender(_e: SlickEventData, _args: OnRowsOrCountChangedEventArgs): void {
    this._editedRows.forEach((editedRow, key) => {
      editedRow.cssStyleKeys.forEach((cssStyleKey) => {
        this._grid.removeCellCssStyles(cssStyleKey);
      });
      editedRow.cssStyleKeys = [];
      editedRow.columns.forEach((column) => {
        this.renderUnsavedCellStyling(key, column);
      });
    });
  }

  protected removeUnsavedStylingFromCell(column: Column, row: number): void {
    const cssStyleKey = `${ROW_BASED_EDIT_UNSAVED_HIGHLIGHT_PREFIX}_${[column.id]}${row}`;
    this._grid.removeCellCssStyles(cssStyleKey);
  }

  protected removeUnsavedStylingFromRow(row: number): void {
    this._grid.getColumns().forEach((column) => {
      this.removeUnsavedStylingFromCell(column, row);
    });
  }

  protected optionsUpdatedHandler(_e: SlickEventData, args: OnSetOptionsEventArgs): void {
    this._addonOptions = {
      ...this._defaults,
      ...args.optionsAfter.rowBasedEditOptions,
    } as RowBasedEditOptions;
  }

  protected async onCellClickHandler(event: Event, args: any): Promise<void> {
    const dataContext = args.dataContext;
    const target = event.target as HTMLElement;
    const idProperty = this.gridOptions.datasetIdPropertyName ?? 'id';
    const targetRow = this._editedRows.get(dataContext[idProperty]);
    if (
      (target.classList.contains(BTN_ACTION_DELETE) || target.parentElement?.classList.contains(BTN_ACTION_DELETE)) &&
      this._gridService
    ) {
      if (this._addonOptions?.actionButtons?.deleteButtonPrompt && !window.confirm(this._addonOptions.actionButtons.deleteButtonPrompt)) {
        return;
      }

      this.toggleEditmode(dataContext, false);
      this._gridService.deleteItem(dataContext);
    } else if (target.classList.contains(BTN_ACTION_EDIT) || target.parentElement?.classList.contains(BTN_ACTION_EDIT)) {
      if (!this._addonOptions?.allowMultipleRows && this._editedRows.size > 0) {
        return;
      }

      if (typeof this._addonOptions?.onBeforeEditMode === 'function') {
        this._addonOptions.onBeforeEditMode!(args);
      }

      this.toggleEditmode(dataContext, true);
    } else if (target.classList.contains(BTN_ACTION_UPDATE) || target.parentElement?.classList.contains(BTN_ACTION_UPDATE)) {
      if (
        this._addonOptions?.actionButtons?.updateButtonPrompt &&
        (targetRow?.editCommands.length || 0) > 0 &&
        !window.confirm(this._addonOptions.actionButtons.updateButtonPrompt)
      ) {
        return;
      }

      if (this._grid.getCellEditor() && this._grid.getActiveCell()?.row === args.row) {
        this._grid.getEditController()?.commitCurrentEdit();
      }

      if (this._addonOptions?.onBeforeRowUpdated) {
        const result = await this._addonOptions.onBeforeRowUpdated(args);

        if (result !== true) {
          return;
        }
      }

      this.removeUnsavedStylingFromRow(args.row);
      this.toggleEditmode(dataContext, false);
    } else if (target.classList.contains(BTN_ACTION_CANCEL) || target.parentElement?.classList.contains(BTN_ACTION_CANCEL)) {
      if (
        this._addonOptions?.actionButtons?.cancelButtonPrompt &&
        (targetRow?.editCommands.length || 0) > 0 &&
        !window.confirm(this._addonOptions.actionButtons.cancelButtonPrompt)
      ) {
        return;
      }

      this.undoRowEdit(dataContext);
      this.toggleEditmode(dataContext, false);
    }
  }

  protected actionColumnFormatter(_row: number, _cell: number, _value: any, _columnDef: Column, dataContext: any): DocumentFragment {
    const options = this.gridOptions;
    const isInEditMode = this._editedRows.has(dataContext?.[options.datasetIdPropertyName ?? 'id']);
    const buttonTitles = this._translations[this._currentLang] ?? this.translate();

    const actionFragment = document.createDocumentFragment();
    actionFragment
      .appendChild(
        createDomElement('span', {
          className:
            `${options.rowBasedEditOptions?.actionButtons?.editButtonClassName || 'button-style padding-1px mr-2'} action-btns ` +
            BTN_ACTION_EDIT,
          title: buttonTitles.btnEditTitle,
          style: { display: isInEditMode ? 'none' : '' },
        })
      )
      .appendChild(
        createDomElement('span', {
          className: options.rowBasedEditOptions?.actionButtons?.iconEditButtonClassName || 'mdi mdi-table-edit color-primary',
        })
      );
    actionFragment
      .appendChild(
        createDomElement('span', {
          className:
            `${options.rowBasedEditOptions?.actionButtons?.deleteButtonClassName || 'button-style padding-1px'} action-btns ` +
            BTN_ACTION_DELETE,
          title: buttonTitles.btnDeleteTitle,
          style: { display: isInEditMode ? 'none' : '' },
        })
      )
      .appendChild(
        createDomElement('span', {
          className: options.rowBasedEditOptions?.actionButtons?.iconDeleteButtonClassName || 'mdi mdi-close color-danger',
        })
      );
    actionFragment
      .appendChild(
        createDomElement('span', {
          className:
            `${options.rowBasedEditOptions?.actionButtons?.updateButtonClassName || 'button-style padding-1px mr-2'} action-btns ` +
            BTN_ACTION_UPDATE,
          title: buttonTitles.btnUpdateTitle,
          style: { display: !isInEditMode ? 'none' : '' },
        })
      )
      .appendChild(
        createDomElement('span', {
          className: options.rowBasedEditOptions?.actionButtons?.iconUpdateButtonClassName || 'mdi mdi-check-bold color-success',
        })
      );
    actionFragment
      .appendChild(
        createDomElement('span', {
          className:
            `${options.rowBasedEditOptions?.actionButtons?.cancelButtonClassName || 'button-style padding-1px'} action-btns ` +
            BTN_ACTION_CANCEL,
          title: buttonTitles.btnCancelTitle,
          style: { display: !isInEditMode ? 'none' : '' },
        })
      )
      .appendChild(
        createDomElement('span', {
          className: options.rowBasedEditOptions?.actionButtons?.iconCancelButtonClassName || 'mdi mdi-cancel color-danger',
        })
      );

    return actionFragment;
  }

  protected onBeforeEditCellHandler = (_e: SlickEventData, args: OnBeforeEditCellEventArgs) => {
    return this._editedRows.has(args.item?.[this.gridOptions.datasetIdPropertyName ?? 'id']) as boolean;
  };

  protected toggleEditmode(dataContext: any, editMode: boolean): void {
    const idProperty = this.gridOptions.datasetIdPropertyName ?? 'id';
    if (editMode) {
      this._editedRows.set(dataContext[idProperty], {
        columns: [],
        editCommands: [],
        cssStyleKeys: [],
      });
    } else {
      this._editedRows.delete(dataContext[idProperty]);
    }

    this._grid.invalidate();
  }

  protected updateItemMetadata(previousItemMetadata: any): (rowNumber: number) => { cssClasses: string } {
    return (rowNumber: number) => {
      const item = this._grid.getData().getItem(rowNumber);
      let meta = {
        cssClasses: '',
      };
      if (typeof previousItemMetadata === 'function') {
        const previousMeta = previousItemMetadata(rowNumber);
        if (previousMeta) {
          meta = previousMeta;
        }
      }

      if (meta && item) {
        const idProperty = this.gridOptions.datasetIdPropertyName ?? 'id';
        if (this._editedRows.has(item[idProperty]) && !meta.cssClasses.includes(ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS)) {
          meta.cssClasses = (meta.cssClasses || '') + ' ' + ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS;
        } else if (!this._editedRows.has(item[idProperty]) && meta.cssClasses.includes(ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS)) {
          meta.cssClasses = meta.cssClasses.replace(ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS, '');
        }
      }

      return meta;
    };
  }

  /**
   * Get button tooltip text 1 of these 3 options:
   * 1. from `btnAbcTitleKey` when `enableTranslate` is set
   * 2. from `btnAbcTitle` when no title Key is found and/or `enableTranslate` is disabled
   * 3. or finally use default title fallback provided
   * @param key - button title key
   * @param defaultTitle - fallback title
   * @returns - final tooltip title text
   */
  protected getTitleOrDefault(key: ActionButtonTitles, defaultTitle: string): string {
    const actionBtnOptions = this.gridOptions.rowBasedEditOptions?.actionButtons;
    return (
      (actionBtnOptions?.[(key + 'Key') as ActionButtonTitleKeys] &&
        this.extensionUtility.translaterService?.translate?.(actionBtnOptions?.[(key + 'Key') as ActionButtonTitleKeys] || '')) ||
      actionBtnOptions?.[key] ||
      defaultTitle
    );
  }
}

type IsDefined<T> = T extends undefined ? never : T;
type ActionButtonTitles = keyof {
  [K in keyof IsDefined<RowBasedEditOptions['actionButtons']> as K extends `${string}Title` ? K : never]: IsDefined<
    RowBasedEditOptions['actionButtons']
  >[K];
};
type ActionButtonTitleKeys = `${ActionButtonTitles}Key`;
