import { createDomElement, getHtmlStringOutput, stripTags } from '@slickgrid-universal/utils';

import { DataWrapperService } from '../services/dataWrapperService';
import type { Column, CssStyleHash, Editor, EditorConstructor, ElementPosition, ExcelCopyBufferOption, ExternalCopyClipCommand, OnEventArgs } from '../interfaces/index';
import { type SlickDataView, SlickEvent, SlickEventData, SlickEventHandler, type SlickGrid, SlickRange, Utils as SlickUtils } from '../core/index';

// using external SlickGrid JS libraries
const CLEAR_COPY_SELECTION_DELAY = 2000;
const CLIPBOARD_PASTE_DELAY = 100;

/* v8 ignore next */
const noop = () => { };

/*
  This manager enables users to copy/paste data from/to an external Spreadsheet application
  such as MS-Excel® or OpenOffice-Spreadsheet.

  Since it is not possible to access directly the clipboard in javascript, the plugin uses
  a trick to do it's job. After detecting the keystroke, we dynamically create a textarea
  where the browser copies/pastes the serialized data.
*/
export class SlickCellExternalCopyManager {
  pluginName: 'CellExternalCopyManager' = 'CellExternalCopyManager' as const;
  onCopyCells: SlickEvent<{ ranges: SlickRange[]; }>;
  onCopyCancelled: SlickEvent<{ ranges: SlickRange[]; }>;
  onPasteCells: SlickEvent<{ ranges: SlickRange[]; }>;
  onBeforePasteCell: SlickEvent<{ cell: number; row: number; item: any; columnDef: Column; value: any; }>;

  protected _addonOptions!: ExcelCopyBufferOption;
  protected _bodyElement: HTMLElement = document.body;
  protected _clearCopyTI?: number;
  protected _copiedCellStyle = 'copied';
  protected _copiedCellStyleLayerKey = 'copy-manager';
  protected _copiedRanges: SlickRange[] | null = null;
  protected _dataWrapper: DataWrapperService;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _onCopyInit?: () => void;
  protected _onCopySuccess?: (rowCount: number) => void;

  constructor() {
    this._dataWrapper = new DataWrapperService();
    this.onCopyCells = new SlickEvent<{ ranges: SlickRange[]; }>('onCopyCells');
    this.onCopyCancelled = new SlickEvent<{ ranges: SlickRange[]; }>('onCopyCancelled');
    this.onPasteCells = new SlickEvent<{ ranges: SlickRange[]; }>('onPasteCells');
    this.onBeforePasteCell = new SlickEvent<{ cell: number; row: number; item: any; columnDef: Column; value: any; }>('onBeforePasteCell');
    this._eventHandler = new SlickEventHandler();
  }

  get addonOptions(): ExcelCopyBufferOption {
    return this._addonOptions;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  init(grid: SlickGrid, options?: ExcelCopyBufferOption): void {
    this._grid = grid;
    this._dataWrapper.init(grid);
    this._addonOptions = { ...this._addonOptions, ...options };
    this._copiedCellStyleLayerKey = this._addonOptions.copiedCellStyleLayerKey || 'copy-manager';
    this._copiedCellStyle = this._addonOptions.copiedCellStyle || 'copied';
    this._bodyElement = this._addonOptions.bodyElement || document.body;
    this._onCopyInit = this._addonOptions.onCopyInit || undefined;
    this._onCopySuccess = this._addonOptions.onCopySuccess || undefined;

    // add PubSub instance to all SlickEvent
    const pubSub = grid.getPubSubService();
    if (pubSub) {
      SlickUtils.addSlickEventPubSubWhenDefined(pubSub, this);
    }

    this._eventHandler.subscribe(this._grid.onKeyDown, this.handleKeyDown.bind(this));

    // we need a cell selection model
    const cellSelectionModel = grid.getSelectionModel();
    if (!cellSelectionModel) {
      throw new Error(`Selection model is mandatory for this plugin. Please set a selection model on the grid before adding this plugin: grid.setSelectionModel(new SlickCellSelectionModel())`);
    }

    // we give focus on the grid when a selection is done on it (unless it's an editor, if so the editor should have already set focus to the grid prior to editing a cell).
    // without this, if the user selects a range of cell without giving focus on a particular cell, the grid doesn't get the focus and key stroke handles (ctrl+c) don't work
    this._eventHandler.subscribe(cellSelectionModel.onSelectedRangesChanged, () => {
      if (!this._grid.getEditorLock().isActive()) {
        this._grid.focus();
      }
    });

    if (grid && typeof this._addonOptions?.onBeforePasteCell === 'function') {
      // subscribe to this Slickgrid event of onBeforeEditCell
      this._eventHandler.subscribe(this.onBeforePasteCell, (e, args) => {
        const column: Column = grid.getColumns()[args.cell];
        const returnedArgs: OnEventArgs = {
          row: args.row!,
          cell: args.cell,
          dataView: grid.getData<SlickDataView>(),
          grid,
          columnDef: column,
          dataContext: grid.getDataItem(args.row!)
        };

        // finally call up the Slick column.onBeforeEditCells.... function
        return this._addonOptions.onBeforePasteCell?.(e, returnedArgs);
      });
    }
  }

  dispose(): void {
    this._eventHandler.unsubscribeAll();
  }

  clearCopySelection(): void {
    this._grid.removeCellCssStyles(this._copiedCellStyleLayerKey);
  }

  getHeaderValueForColumn(columnDef: Column): string {
    if (typeof this._addonOptions.headerColumnValueExtractor === 'function') {
      const val = getHtmlStringOutput(this._addonOptions.headerColumnValueExtractor(columnDef), 'innerHTML');
      if (val) {
        return stripTags(val);
      }
    }
    return getHtmlStringOutput(columnDef.name || '', 'innerHTML');
  }

  getDataItemValueForColumn(item: any, columnDef: Column, row: number, cell: number, event: SlickEventData): string {
    if (typeof this._addonOptions.dataItemColumnValueExtractor === 'function') {
      const val = this._addonOptions.dataItemColumnValueExtractor(item, columnDef, row, cell) as string | HTMLElement;
      if (val) {
        return (val instanceof HTMLElement) ? stripTags(val.innerHTML) : val;
      }
    }

    let retVal = '';

    // if a custom getter is not defined, we call serializeValue of the editor to serialize
    if (columnDef) {
      if (columnDef.editorClass) {
        const tmpP = document.createElement('p');
        const editor = new (columnDef.editorClass as EditorConstructor)({
          container: tmpP,  // a dummy container
          column: columnDef,
          event,
          position: { top: 0, left: 0 } as unknown as ElementPosition,  // a dummy position required by some editors
          gridPosition: { top: 0, left: 0 } as unknown as ElementPosition,  // a dummy position required by some editors
          grid: this._grid,
          cancelChanges: noop,
          commitChanges: noop,
        });
        editor.loadValue(item);
        retVal = editor.serializeValue();
        editor.destroy();
        tmpP.remove();
      } else {
        retVal = item[columnDef.field || ''];
      }
    }

    return retVal;
  }

  setDataItemValueForColumn(item: any, columnDef: Column, value: any): any | void {
    if (!columnDef?.denyPaste) {
      if (this._addonOptions.dataItemColumnValueSetter) {
        const setterResult = this._addonOptions.dataItemColumnValueSetter(item, columnDef, value);
        if (setterResult !== true) {
          return setterResult;
        }
      }

      // if a custom setter is not defined, we call applyValue of the editor to unserialize
      if (columnDef.editorClass) {
        const tmpDiv = document.createElement('div');
        const editor = new (columnDef.editorClass as EditorConstructor)({
          container: tmpDiv, // a dummy container
          column: columnDef,
          event: null as any,
          position: { top: 0, left: 0 } as unknown as ElementPosition,  // a dummy position required by some editors
          gridPosition: { top: 0, left: 0 } as unknown as ElementPosition,  // a dummy position required by some editors
          grid: this._grid,
          cancelChanges: noop,
          commitChanges: noop,
        }) as Editor;
        editor.loadValue(item);
        const validationResults = editor.validate(undefined, value);
        if (!validationResults.valid) {
          const activeCell = this._grid.getActiveCell()!;
          this._grid.onValidationError.notify({
            editor,
            cellNode: this._grid.getActiveCellNode()!,
            validationResults,
            row: activeCell?.row,
            cell: activeCell?.cell,
            column: columnDef,
            grid: this._grid,
          });
        }

        editor.applyValue(item, value);
        editor.destroy();
        tmpDiv.remove();
      } else {
        item[columnDef.field] = value;
      }
    }
  }

  setIncludeHeaderWhenCopying(includeHeaderWhenCopying: boolean): void {
    this._addonOptions.includeHeaderWhenCopying = includeHeaderWhenCopying;
  }

  //
  // protected functions
  // ---------------------

  protected createTextBox(innerText: string): HTMLTextAreaElement {
    const textAreaElm = createDomElement(
      'textarea',
      {
        value: innerText,
        style: { position: 'absolute', left: '-1000px', top: `${document.body.scrollTop}px`, }
      },
      this._bodyElement);
    textAreaElm.select();

    return textAreaElm;
  }

  protected decodeTabularData(grid: SlickGrid, textAreaElement: HTMLTextAreaElement): void {
    const columns = grid.getColumns();
    const clipText = textAreaElement.value;
    const clipRows = clipText.split(/[\n\f\r](?=(?:[^"]*"[^"]*")*[^"]*$)/);

    // trim trailing CR if present
    if (clipRows[clipRows.length - 1] === '') {
      clipRows.pop();
    }

    let j = 0;
    const clippedRange: any[] = [];
    this._bodyElement.removeChild(textAreaElement);

    for (const clipRow of clipRows) {
      if (clipRow.startsWith('"') && clipRow.endsWith('"')) {
        clippedRange[j++] = [clipRow
          .replaceAll('\n', this._addonOptions.replaceNewlinesWith || '\n')
          .replaceAll('\r', '')
          .replaceAll('"', this._addonOptions.removeDoubleQuotesOnPaste ? '' : '"')];
      } else {
        clippedRange[j++] = clipRow.split('\t');
      }
    }
    const selectedCell = this._grid.getActiveCell();
    const ranges = this._grid.getSelectionModel()?.getSelectedRanges();
    const selectedRange = ranges?.length ? ranges[0] : null;   // pick only one selection
    let activeRow: number;
    let activeCell: number;

    if (selectedRange) {
      activeRow = selectedRange.fromRow;
      activeCell = selectedRange.fromCell;
    } else if (selectedCell) {
      activeRow = selectedCell.row;
      activeCell = selectedCell.cell;
    } else {
      return; // we don't know where to paste
    }

    let oneCellToMultiple = false;
    let destH = clippedRange.length;
    let destW = clippedRange.length ? clippedRange[0].length : 0;
    if (clippedRange.length === 1 && clippedRange[0].length === 1 && selectedRange) {
      oneCellToMultiple = true;
      destH = selectedRange.toRow - selectedRange.fromRow + 1;
      destW = selectedRange.toCell - selectedRange.fromCell + 1;
    }
    const availableRows = this._dataWrapper.getDataLength() - activeRow;
    let addRows = 0;

    // ignore new rows if we don't have a "newRowCreator"
    if ((availableRows < destH) && typeof this._addonOptions.newRowCreator === 'function') {
      const rowsToAdd = destH - availableRows;
      const rowsBeforePaste = this._dataWrapper.getDataLength();
      this._addonOptions.newRowCreator(rowsToAdd);
      const rowsAfterPaste = this._dataWrapper.getDataLength();

      if (rowsAfterPaste !== rowsBeforePaste + rowsToAdd) {
        console.warn(`[Slickgrid-Universal] The "newRowCreator" did not add the correct amount of rows, it should add "${rowsToAdd}" rows but it added "${rowsAfterPaste - rowsBeforePaste}" rows`);
      }

      this._grid.render();
    }

    const overflowsBottomOfGrid = (activeRow + destH) > this._dataWrapper.getDataLength();
    if (overflowsBottomOfGrid && typeof this._addonOptions.newRowCreator === 'function') {
      const newRowsNeeded = activeRow + destH - this._dataWrapper.getDataLength();
      this._addonOptions.newRowCreator(newRowsNeeded);
    }

    const clipCommand: ExternalCopyClipCommand = {
      isClipboardCommand: true,
      clippedRange,
      oldValues: [],
      cellExternalCopyManager: this,
      _options: this._addonOptions,
      setDataItemValueForColumn: this.setDataItemValueForColumn,
      markCopySelection: this.markCopySelection,
      oneCellToMultiple,
      activeRow,
      activeCell,
      destH,
      destW,
      maxDestY: this._dataWrapper.getDataLength(),
      maxDestX: this._grid.getColumns().length,
      h: 0,
      w: 0,
      execute: () => {
        clipCommand.h = 0;
        for (let y = 0; y < clipCommand.destH; y++) {
          clipCommand.oldValues[y] = [];
          clipCommand.w = 0;
          clipCommand.h++;
          let xOffset = 0; // the x offset for hidden col

          for (let x = 0; x < clipCommand.destW; x++) {
            const desty = activeRow + y;
            const destx = activeCell + x;
            const column = columns[destx];

            // paste on hidden column will be skipped, but we need to paste 1 cell further on X axis
            // we'll increase our X and increase the offset`
            if (column.hidden) {
              clipCommand.destW++;
              xOffset++;
              continue;
            }
            clipCommand.w++;

            if (desty < clipCommand.maxDestY && destx < clipCommand.maxDestX) {
              const dt = this._dataWrapper.getDataItem(desty);

              if (this._grid.triggerEvent(this.onBeforePasteCell, { row: desty, cell: destx, dt, column, target: 'grid' }).getReturnValue() === false) {
                continue;
              }

              clipCommand.oldValues[y][x - xOffset] = dt[column['field']];
              if (oneCellToMultiple) {
                this.setDataItemValueForColumn(dt, column, clippedRange[0][0]);
              } else {
                this.setDataItemValueForColumn(dt, column, clippedRange[y] ? clippedRange[y][x - xOffset] : '');
              }
              this._grid.updateCell(desty, destx);
              this._grid.onCellChange.notify({
                row: desty,
                cell: destx,
                item: dt,
                grid: this._grid,
                column: {} as unknown as Column,
              });
            }
          }
        }

        const bRange = new SlickRange(
          activeRow,
          activeCell,
          activeRow + clipCommand.h - 1,
          activeCell + clipCommand.w - 1
        );
        this.markCopySelection([bRange]);
        this._grid.getSelectionModel()?.setSelectedRanges([bRange]);
        this.onPasteCells.notify({ ranges: [bRange] });
      },
      undo: () => {
        for (let y = 0; y < clipCommand.destH; y++) {
          for (let x = 0; x < clipCommand.destW; x++) {
            const desty = activeRow + y;
            const destx = activeCell + x;

            if (desty < clipCommand.maxDestY && destx < clipCommand.maxDestX) {
              // const nd = this._grid.getCellNode(desty, destx);
              const dt = this._dataWrapper.getDataItem(desty);
              if (oneCellToMultiple) {
                this.setDataItemValueForColumn(dt, columns[destx], clipCommand.oldValues[0][0]);
              } else {
                this.setDataItemValueForColumn(dt, columns[destx], clipCommand.oldValues[y][x]);
              }
              this._grid.updateCell(desty, destx);
              this._grid.onCellChange.notify({
                row: desty,
                cell: destx,
                item: dt,
                grid: this._grid,
                column: {} as unknown as Column,
              });
            }
          }
        }

        const bRange = new SlickRange(
          activeRow,
          activeCell,
          activeRow + clipCommand.h - 1,
          activeCell + clipCommand.w - 1
        );

        this.markCopySelection([bRange]);
        this._grid.getSelectionModel()?.setSelectedRanges([bRange]);
        this.onPasteCells.notify({ ranges: [bRange] });
        if (typeof this._addonOptions.onPasteCells === 'function') {
          this._addonOptions.onPasteCells(new SlickEventData(), { ranges: [bRange] });
        }

        if (addRows > 1) {
          const data = this._dataWrapper.getDataItems();
          for (; addRows > 1; addRows--) {
            data.splice(data.length - 1, 1);
          }
          this._dataWrapper.setDataItems(data);
          this._grid.render();
        }
      }
    };

    if (this._addonOptions.clipboardCommandHandler) {
      this._addonOptions.clipboardCommandHandler(clipCommand);
    } else {
      clipCommand.execute();
    }
  }

  protected handleKeyDown(e: SlickEventData): boolean | void {
    let ranges: SlickRange[];
    if (!this._grid.getEditorLock().isActive() || this._grid.getOptions().autoEdit) {
      if (e.key === 'Escape') {
        if (this._copiedRanges) {
          e.preventDefault();
          this.clearCopySelection();
          this.onCopyCancelled.notify({ ranges: this._copiedRanges });
          if (typeof this._addonOptions.onCopyCancelled === 'function') {
            this._addonOptions.onCopyCancelled(e, { ranges: this._copiedRanges });
          }
          this._copiedRanges = null;
        }
      }

      if ((e.key === 'c' || e.key === 'Insert') && (e.ctrlKey || e.metaKey) && !e.shiftKey) {    // CTRL+C or CTRL+INS
        if (typeof this._onCopyInit === 'function') {
          this._onCopyInit.call(this);
        }
        ranges = this._grid.getSelectionModel()?.getSelectedRanges() ?? [];
        if (ranges.length !== 0) {
          this._copiedRanges = ranges;
          this.markCopySelection(ranges);
          this.onCopyCells.notify({ ranges });
          if (typeof this._addonOptions.onCopyCells === 'function') {
            this._addonOptions.onCopyCells(e, { ranges });
          }

          const columns = this._grid.getColumns();
          let clipText = '';

          for (let rg = 0; rg < ranges.length; rg++) {
            const range = ranges[rg];
            const clipTextRows: string[] = [];
            for (let i = range.fromRow; i < range.toRow + 1; i++) {
              const clipTextCells: string[] = [];
              const dt = this._dataWrapper.getDataItem(i);

              if (clipTextRows.length === 0 && this._addonOptions.includeHeaderWhenCopying) {
                const clipTextHeaders: string[] = [];
                for (let j = range.fromCell; j < range.toCell + 1; j++) {
                  if (columns[j]) {
                    const colName: string = columns[j].name instanceof HTMLElement
                      ? stripTags((columns[j].name as HTMLElement).innerHTML)
                      : columns[j].name as string;
                    if (colName.length > 0 && !columns[j].hidden) {
                      clipTextHeaders.push(this.getHeaderValueForColumn(columns[j]));
                    }
                  }
                }
                clipTextRows.push(clipTextHeaders.join('\t'));
              }

              for (let j = range.fromCell; j < range.toCell + 1; j++) {
                if (columns[j]) {
                  const colName: string = columns[j].name instanceof HTMLElement
                    ? stripTags((columns[j].name as HTMLElement).innerHTML)
                    : columns[j].name as string;
                  if (colName.length > 0 && !columns[j].hidden) {
                    clipTextCells.push(this.getDataItemValueForColumn(dt, columns[j], i, j, e));
                  }
                }
              }
              clipTextRows.push(clipTextCells.join('\t'));
            }
            clipText += clipTextRows.join('\r\n') + '\r\n';
          }

          if ((window as any).clipboardData) {
            (window as any).clipboardData.setData('Text', clipText);
            return true;
          } else {
            const focusElm = document.activeElement as HTMLElement;
            const textAreaElm = this.createTextBox(clipText);
            textAreaElm.focus();

            window.setTimeout(() => {
              this._bodyElement.removeChild(textAreaElm);
              // restore focus when possible
              focusElm ? focusElm.focus() : console.log('No element to restore focus to after copy?');
            }, this.addonOptions?.clipboardPasteDelay ?? CLIPBOARD_PASTE_DELAY);

            if (typeof this._onCopySuccess === 'function') {
              // If it's cell selection, use the toRow/fromRow fields
              const rowCount = (ranges.length === 1) ? ((ranges[0].toRow + 1) - ranges[0].fromRow) : ranges.length;
              this._onCopySuccess(rowCount);
            }

            return false;
          }
        }
      }

      if (!this._addonOptions.readOnlyMode && (
        (e.key === 'v' && (e.ctrlKey || e.metaKey) && !e.shiftKey)
        || e.key === 'Insert' && e.shiftKey && !e.ctrlKey
      )) {    // CTRL+V or Shift+INS
        const textBoxElm = this.createTextBox('');
        window.setTimeout(() => this.decodeTabularData(this._grid, textBoxElm), this.addonOptions?.clipboardPasteDelay ?? CLIPBOARD_PASTE_DELAY);
        return false;
      }
    }
  }

  protected markCopySelection(ranges: SlickRange[]): void {
    this.clearCopySelection();

    const columns = this._grid.getColumns();
    const hash: CssStyleHash = {};
    for (const range of ranges) {
      for (let j = range.fromRow; j <= range.toRow; j++) {
        hash[j] = {};
        for (let k = range.fromCell; k <= range.toCell && k < columns.length; k++) {
          hash[j][columns[k].id] = this._copiedCellStyle;
        }
      }
    }
    this._grid.setCellCssStyles(this._copiedCellStyleLayerKey, hash);
    window.clearTimeout(this._clearCopyTI as number);
    this._clearCopyTI = window.setTimeout(() => this.clearCopySelection(), this.addonOptions?.clearCopySelectionDelay || CLEAR_COPY_SELECTION_DELAY);
  }
}