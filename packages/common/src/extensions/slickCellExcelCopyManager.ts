import { BindingEventService } from '@slickgrid-universal/binding';
import { isPrimitiveOrHTML, stripTags } from '@slickgrid-universal/utils';
import { SlickEventHandler, SlickGlobalEditorLock, type SlickDataView, type SlickGrid } from '../core/index.js';
import type {
  Column,
  EditCommand,
  EditUndoRedoBuffer,
  ExcelCopyBufferOption,
  FormatterResultWithHtml,
  FormatterResultWithText,
  GridOption,
} from '../interfaces/index.js';
import { SlickCellExternalCopyManager, SlickHybridSelectionModel } from './index.js';

/*
  This manager enables users to copy/paste data from/to an external Spreadsheet application
  such as MS-Excel® or OpenOffice-Spreadsheet.

  Since it is not possible to access directly the clipboard in JavaScript, the plugin uses
  a trick to do it's job. After detecting the keystroke, we dynamically create a textarea
  where the browser copies/pastes the serialized data.
*/
export class SlickCellExcelCopyManager {
  pluginName: 'CellExcelCopyManager' = 'CellExcelCopyManager' as const;

  protected _addonOptions!: ExcelCopyBufferOption;
  protected _bindingEventService: BindingEventService;
  protected _cellExternalCopyManagerPlugin!: SlickCellExternalCopyManager;
  protected _cellSelectionModel!: SlickHybridSelectionModel;
  protected _commandQueue!: EditCommand[];
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _undoRedoBuffer!: EditUndoRedoBuffer;

  constructor() {
    this._eventHandler = new SlickEventHandler();
    this._bindingEventService = new BindingEventService();
  }

  get addonOptions(): ExcelCopyBufferOption | null {
    return this._addonOptions;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get commandQueue(): EditCommand[] {
    return this._commandQueue;
  }

  get gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  get undoRedoBuffer(): EditUndoRedoBuffer {
    return this._undoRedoBuffer;
  }

  init(grid: SlickGrid, options?: ExcelCopyBufferOption): void {
    this._grid = grid;
    this.createUndoRedoBuffer();
    const selectionType = this.gridOptions.selectionOptions?.selectionType || 'cell';
    this._cellSelectionModel =
      grid.getSelectionModel<SlickHybridSelectionModel>() ??
      new SlickHybridSelectionModel({ ...this.gridOptions.selectionOptions, selectionType });
    this._cellSelectionModel.setOptions({ ...this.gridOptions.selectionOptions, selectionType });
    this._grid.setSelectionModel(this._cellSelectionModel);
    this._bindingEventService.bind(document.body, 'keydown', this.handleBodyKeyDown.bind(this) as EventListener);
    this._addonOptions = { ...this.getDefaultOptions(), ...options } as ExcelCopyBufferOption;
    this._cellExternalCopyManagerPlugin = new SlickCellExternalCopyManager();
    this._cellExternalCopyManagerPlugin.init(this._grid, this._addonOptions);

    this._eventHandler.subscribe(this._cellExternalCopyManagerPlugin.onCopyCells, (e, args) => {
      if (this._addonOptions && typeof this._addonOptions.onCopyCells === 'function') {
        this._addonOptions.onCopyCells(e, args);
      }
    });

    this._eventHandler.subscribe(this._cellExternalCopyManagerPlugin.onCopyCancelled, (e, args) => {
      if (this._addonOptions && typeof this._addonOptions.onCopyCancelled === 'function') {
        this._addonOptions.onCopyCancelled(e, args);
      }
    });

    this._eventHandler.subscribe(this._cellExternalCopyManagerPlugin.onPasteCells, (e, args) => {
      if (this._addonOptions && typeof this._addonOptions.onPasteCells === 'function') {
        this._addonOptions.onPasteCells(e, args);
      }
    });
  }

  /** Dispose of the 3rd party addon (plugin) */
  dispose(): void {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
    this._bindingEventService.unbindAll();
    this._cellSelectionModel?.dispose();
    this._cellExternalCopyManagerPlugin?.dispose();
  }

  //
  // protected functions
  // ---------------------

  /** Create an undo redo buffer used by the Excel like copy */
  protected createUndoRedoBuffer(): void {
    let commandCtr = 0;
    this._commandQueue = [];

    this._undoRedoBuffer = {
      queueAndExecuteCommand: (editCommand: EditCommand) => {
        this._commandQueue[commandCtr] = editCommand;
        commandCtr++;
        editCommand.execute();
      },
      undo: () => {
        if (commandCtr === 0) {
          return;
        }
        commandCtr--;
        const command = this._commandQueue[commandCtr];
        if (command && SlickGlobalEditorLock.cancelCurrentEdit()) {
          command.undo();
        }
      },
      redo: () => {
        if (commandCtr >= this._commandQueue.length) {
          return;
        }
        const command = this._commandQueue[commandCtr];
        commandCtr++;
        if (command && SlickGlobalEditorLock.cancelCurrentEdit()) {
          command.execute();
        }
      },
    };
  }

  /** @return default plugin (addon) options */
  protected getDefaultOptions(): ExcelCopyBufferOption {
    let newRowIds = 0;

    return {
      clipboardCommandHandler: (editCommand: EditCommand) => {
        this._undoRedoBuffer.queueAndExecuteCommand.call(this._undoRedoBuffer, editCommand);
      },
      dataItemColumnValueExtractor: (item: any, columnDef: Column, row = 0, cell = 0) => {
        // when grid or cell is not editable, we will possibly evaluate the Formatter if it was passed
        // to decide if we evaluate the Formatter, we will use the same flag from Export which is "exportWithFormatter"
        const activeCell = this._grid.getActiveCell();
        const isActiveEditorCurrentCell = this._grid.getCellEditor() && activeCell?.row === row && activeCell?.cell === cell;
        const copyActiveEditorCell = this.addonOptions?.copyActiveEditorCell || false;

        if (!this.gridOptions.editable || !columnDef.editor || !isActiveEditorCurrentCell || copyActiveEditorCell) {
          // prettier-ignore
          const isEvaluatingFormatter = (columnDef.exportWithFormatter !== undefined) ? columnDef.exportWithFormatter : (this.gridOptions.textExportOptions?.exportWithFormatter);
          if (columnDef.formatter && isEvaluatingFormatter) {
            const formattedOutput = columnDef.formatter(row, cell, item[columnDef.field], columnDef, item, this._grid);
            // prettier-ignore
            const cellResult = isPrimitiveOrHTML(formattedOutput) ? formattedOutput : (formattedOutput as FormatterResultWithHtml).html || (formattedOutput as FormatterResultWithText).text;
            if (columnDef.sanitizeDataExport || this.gridOptions.textExportOptions?.sanitizeDataExport) {
              const outputString = cellResult instanceof HTMLElement ? cellResult.innerHTML : (cellResult as string);
              return stripTags(outputString ?? '');
            }
            return formattedOutput;
          }
        }

        // else use the default "dataItemColumnValueExtractor" from the plugin itself
        // we can do that by setting back the getter with null
        return null;
      },
      readOnlyMode: false,
      includeHeaderWhenCopying: false,
      newRowCreator: (count: number) => {
        for (let i = 0; i < count; i++) {
          this._grid.getData<SlickDataView>().addItem({ [this.gridOptions.datasetIdPropertyName || 'id']: `newRow_${newRowIds++}` });
        }
      },
      replaceNewlinesWith: false,
      removeDoubleQuotesOnPaste: false,
    };
  }

  /** Hook an undo shortcut key hook that will redo/undo the copy buffer using Ctrl+(Shift)+Z keyboard events */
  protected handleBodyKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Z' && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        this._undoRedoBuffer.redo(); // Ctrl + Shift + Z
      } else {
        this._undoRedoBuffer.undo(); // Ctrl + Z
      }
    }
  }
}
