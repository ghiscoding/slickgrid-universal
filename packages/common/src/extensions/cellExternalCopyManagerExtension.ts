import 'slickgrid/plugins/slick.cellexternalcopymanager';

import {
  Column,
  EditCommand,
  EditUndoRedoBuffer,
  ExcelCopyBufferOption,
  Extension,
  SlickCellExternalCopyManager,
  SlickCellSelectionModel,
  SlickDataView,
  SlickEventHandler,
  SlickNamespace,

  // TypeScript Helper
  GetSlickEventType,
} from '../interfaces/index';
import { ExtensionUtility } from './extensionUtility';
import { BindingEventService } from '../services/bindingEvent.service';
import { SharedService } from '../services/shared.service';
import { sanitizeHtmlToText } from '../services/utilities';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class CellExternalCopyManagerExtension implements Extension {
  private _addon: SlickCellExternalCopyManager | null;
  private _addonOptions: ExcelCopyBufferOption | null;
  private _cellSelectionModel: SlickCellSelectionModel;
  private _eventHandler: SlickEventHandler;
  private _commandQueue: EditCommand[];
  private _undoRedoBuffer: EditUndoRedoBuffer;
  private _bindingEventService: BindingEventService;

  constructor(private readonly extensionUtility: ExtensionUtility, private readonly sharedService: SharedService) {
    this._eventHandler = new Slick.EventHandler() as SlickEventHandler;
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

  get undoRedoBuffer(): EditUndoRedoBuffer {
    return this._undoRedoBuffer;
  }

  /** Dispose of the 3rd party addon (plugin) */
  dispose() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
    if (this._addon && this._addon.destroy) {
      this._addon.destroy();
    }
    if (this._cellSelectionModel?.destroy) {
      this._cellSelectionModel.destroy();
    }
    this.extensionUtility.nullifyFunctionNameStartingWithOn(this._addonOptions);
    this._addonOptions = null;
    this._bindingEventService.unbindAll();
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickCellExternalCopyManager | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): SlickCellExternalCopyManager | null {
    if (this.sharedService && this.sharedService.slickGrid && this.sharedService.gridOptions) {
      this.createUndoRedoBuffer();
      this._bindingEventService.bind(document.body, 'keydown', this.handleKeyDown.bind(this));

      this._addonOptions = { ...this.getDefaultOptions(), ...this.sharedService.gridOptions.excelCopyBufferOptions } as ExcelCopyBufferOption;
      this._cellSelectionModel = new Slick.CellSelectionModel() as SlickCellSelectionModel;
      this.sharedService.slickGrid.setSelectionModel(this._cellSelectionModel);
      this._addon = new Slick.CellExternalCopyManager(this._addonOptions);
      if (this._addon) {
        this.sharedService.slickGrid.registerPlugin<SlickCellExternalCopyManager>(this._addon);
      }

      // hook to all possible events
      if (this.sharedService.slickGrid && this._addonOptions) {
        if (this._addon && this._addonOptions.onExtensionRegistered) {
          this._addonOptions.onExtensionRegistered(this._addon);
        }

        const onCopyCellsHandler = this._addon.onCopyCells;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onCopyCellsHandler>>).subscribe(onCopyCellsHandler, (e, args) => {
          if (this._addonOptions && typeof this._addonOptions.onCopyCells === 'function') {
            this._addonOptions.onCopyCells(e, args);
          }
        });

        const onCopyCancelledHandler = this._addon.onCopyCancelled;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onCopyCancelledHandler>>).subscribe(onCopyCancelledHandler, (e, args) => {
          if (this._addonOptions && typeof this._addonOptions.onCopyCancelled === 'function') {
            this._addonOptions.onCopyCancelled(e, args);
          }
        });

        const onPasteCellsHandler = this._addon.onPasteCells;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onPasteCellsHandler>>).subscribe(onPasteCellsHandler, (e, args) => {
          if (this._addonOptions && typeof this._addonOptions.onPasteCells === 'function') {
            this._addonOptions.onPasteCells(e, args);
          }
        });
      }
      return this._addon;
    }
    return null;
  }

  /** Create an undo redo buffer used by the Excel like copy */
  private createUndoRedoBuffer() {
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
        if (command && Slick.GlobalEditorLock.cancelCurrentEdit()) {
          command.undo();
        }
      },
      redo: () => {
        if (commandCtr >= this._commandQueue.length) {
          return;
        }
        const command = this._commandQueue[commandCtr];
        commandCtr++;
        if (command && Slick.GlobalEditorLock.cancelCurrentEdit()) {
          command.execute();
        }
      }
    };
  }

  /** @return default plugin (addon) options */
  private getDefaultOptions(): ExcelCopyBufferOption {
    let newRowIds = 0;

    return {
      clipboardCommandHandler: (editCommand: any) => {
        this._undoRedoBuffer.queueAndExecuteCommand.call(this._undoRedoBuffer, editCommand);
      },
      dataItemColumnValueExtractor: (item: any, columnDef: Column) => {
        // when grid or cell is not editable, we will possibly evaluate the Formatter if it was passed
        // to decide if we evaluate the Formatter, we will use the same flag from Export which is "exportWithFormatter"
        if (!this.sharedService.gridOptions.editable || !columnDef.editor) {
          const textExportOptions = { ...this.sharedService.gridOptions.exportOptions, ...this.sharedService.gridOptions.textExportOptions };
          const isEvaluatingFormatter = (columnDef.exportWithFormatter !== undefined) ? columnDef.exportWithFormatter : (textExportOptions?.exportWithFormatter);
          if (columnDef.formatter && isEvaluatingFormatter) {
            const formattedOutput = columnDef.formatter(0, 0, item[columnDef.field], columnDef, item, this.sharedService.slickGrid);
            if (columnDef.sanitizeDataExport || (textExportOptions?.sanitizeDataExport)) {
              let outputString = formattedOutput as string;
              if (formattedOutput && typeof formattedOutput === 'object' && formattedOutput.hasOwnProperty('text')) {
                outputString = formattedOutput.text;
              }
              if (outputString === null) {
                outputString = '';
              }
              return sanitizeHtmlToText(outputString);
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
          this.sharedService.slickGrid.getData<SlickDataView>().addItem({ id: `newRow_${newRowIds++}` });
        }
      }
    };
  }

  /** Hook an undo shortcut key hook that will redo/undo the copy buffer using Ctrl+(Shift)+Z keyboard events */
  private handleKeyDown(e: KeyboardEvent) {
    const keyCode = e.keyCode || e.code;
    if (keyCode === 90 && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        this._undoRedoBuffer.redo(); // Ctrl + Shift + Z
      } else {
        this._undoRedoBuffer.undo(); // Ctrl + Z
      }
    }
  }
}
