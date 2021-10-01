import { CellRange, Column, ExcelCopyBufferOption, SlickGrid, SlickNamespace } from '../interfaces/index';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

/*
  This manager enables users to copy/paste data from/to an external Spreadsheet application
  such as MS-Excel® or OpenOffice-Spreadsheet.

  Since it is not possible to access directly the clipboard in javascript, the plugin uses
  a trick to do it's job. After detecting the keystroke, we dynamically create a textarea
  where the browser copies/pastes the serialized data.
*/
export class CellExternalCopyManager {
  protected _clipCommand: any;
  protected _grid!: SlickGrid;
  protected _copiedRanges!: CellRange[] | null;
  protected _addonOptions!: ExcelCopyBufferOption;
  protected _copiedCellStyleLayerKey = 'copy-manager';
  protected _copiedCellStyle = 'copied';
  protected _clearCopyTI: any = 0;
  protected _bodyElement = document.body;
  protected _onCopyInit?: () => void;
  protected _onCopySuccess?: (rowCount: number) => void;
  pluginName = 'CellExternalCopyManager';
  onCopyCells = new Slick.Event();
  onCopyCancelled = new Slick.Event();
  onPasteCells = new Slick.Event();

  keyCodes = {
    'C': 67,
    'V': 86,
    'ESC': 27,
    'INSERT': 45
  };

  init(grid: SlickGrid, options: ExcelCopyBufferOption) {
    this._grid = grid;
    this._addonOptions = { ...this._addonOptions, ...options };
    this._copiedCellStyleLayerKey = this._addonOptions.copiedCellStyleLayerKey || 'copy-manager';
    this._copiedCellStyle = this._addonOptions.copiedCellStyle || 'copied';
    this._clearCopyTI = 0;
    this._bodyElement = this._addonOptions.bodyElement || document.body;
    this._onCopyInit = this._addonOptions.onCopyInit || undefined;
    this._onCopySuccess = this._addonOptions.onCopySuccess || undefined;
    this._grid.onKeyDown.subscribe(this.handleKeyDown.bind(this));

    // we need a cell selection model
    const cellSelectionModel = grid.getSelectionModel();
    if (!cellSelectionModel) {
      throw new Error(`Selection model is mandatory for this plugin. Please set a selection model on the grid before adding this plugin: grid.setSelectionModel(new Slick.CellSelectionModel())`);
    }
    // we give focus on the grid when a selection is done on it.
    // without this, if the user selects a range of cell without giving focus on a particular cell, the grid doesn't get the focus and key stroke handles (ctrl+c) don't work
    cellSelectionModel.onSelectedRangesChanged.subscribe(() => {
      this._grid.focus();
    });
  }

  /** @deprecated @use `dispose` Destroy plugin. */
  destroy() {
    this.dispose();
  }

  dispose() {
    this._grid.onKeyDown.unsubscribe(this.handleKeyDown.bind(this));
  }

  getHeaderValueForColumn(columnDef: Column) {
    if (this._addonOptions.headerColumnValueExtractor) {
      const val = this._addonOptions.headerColumnValueExtractor(columnDef);
      if (val) {
        return val;
      }
    }

    return columnDef.name;
  }

  getDataItemValueForColumn(item: any, columnDef: Column, event: Event) {
    if (this._addonOptions.dataItemColumnValueExtractor) {
      const val = this._addonOptions.dataItemColumnValueExtractor(item, columnDef);
      if (val) {
        return val;
      }
    }

    let retVal = '';

    // if a custom getter is not defined, we call serializeValue of the editor to serialize
    if (columnDef.editor) {
      const editorArgs = {
        container: document.createElement('p'),  // a dummy container
        column: columnDef,
        position: { top: 0, left: 0 },  // a dummy position required by some editors
        grid: this._grid,
        event,
      };
      const editor = new (columnDef as any).editor(editorArgs);
      editor.loadValue(item);
      retVal = editor.serializeValue();
      editor.destroy();
    } else {
      retVal = item[columnDef.field];
    }

    return retVal;
  }

  setDataItemValueForColumn(item: any, columnDef: Column, value: any): any | void {
    if (!columnDef.denyPaste) {
      if (this._addonOptions.dataItemColumnValueSetter) {
        return this._addonOptions.dataItemColumnValueSetter(item, columnDef, value);
      }

      // if a custom setter is not defined, we call applyValue of the editor to unserialize
      if (columnDef.editor) {
        const editorArgs = {
          container: document.body,  // a dummy container
          column: columnDef,
          position: { 'top': 0, 'left': 0 },  // a dummy position required by some editors
          grid: this._grid
        };
        const editor = new (columnDef as any).editor(editorArgs);
        editor.loadValue(item);
        editor.applyValue(item, value);
        editor.destroy();
      } else {
        item[columnDef.field] = value;
      }
    }
  }

  protected createTextBox(innerText: string) {
    const ta = document.createElement('textarea');
    ta.style.position = 'absolute';
    ta.style.left = '-1000px';
    ta.style.top = document.body.scrollTop + 'px';
    ta.value = innerText;
    this._bodyElement.appendChild(ta);
    ta.select();

    return ta;
  }

  protected decodeTabularData(grid: SlickGrid, ta: HTMLTextAreaElement) {
    const columns = grid.getColumns();
    const clipText = ta.value;
    const clipRows = clipText.split(/[\n\f\r]/);
    // trim trailing CR if present
    if (clipRows[clipRows.length - 1] === '') { clipRows.pop(); }

    const clippedRange: any[] = [];
    let j = 0;

    this._bodyElement.removeChild(ta);
    for (let i = 0; i < clipRows.length; i++) {
      if (clipRows[i] !== '') {
        clippedRange[j++] = clipRows[i].split('\t');
      } else {
        clippedRange[j++] = [''];
      }
    }
    const selectedCell = this._grid.getActiveCell();
    const ranges = this._grid.getSelectionModel().getSelectedRanges();
    const selectedRange = ranges && ranges.length ? ranges[0] : null;   // pick only one selection
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
    const availableRows = (this._grid.getData() as any[]).length - activeRow;
    let addRows = 0;

    // ignore new rows if we don't have a "newRowCreator"
    if (availableRows < destH && this._addonOptions.newRowCreator) {
      const d: any[] = this._grid.getData();
      for (addRows = 1; addRows <= destH - availableRows; addRows++) {
        d.push({});
      }
      this._grid.setData(d);
      this._grid.render();
    }

    const overflowsBottomOfGrid = activeRow + destH > this._grid.getDataLength();

    if (this._addonOptions.newRowCreator && overflowsBottomOfGrid) {
      const newRowsNeeded = activeRow + destH - this._grid.getDataLength();
      this._addonOptions.newRowCreator(newRowsNeeded);
    }

    this._clipCommand = {
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
      maxDestY: this._grid.getDataLength(),
      maxDestX: this._grid.getColumns().length,
      h: 0,
      w: 0,

      execute: () => {
        this._clipCommand.h = 0;
        for (let y = 0; y < this._clipCommand.destH; y++) {
          this._clipCommand.oldValues[y] = [];
          this._clipCommand.w = 0;
          this._clipCommand.h++;
          for (let x = 0; x < this._clipCommand.destW; x++) {
            this._clipCommand.w++;
            const desty = activeRow + y;
            const destx = activeCell + x;

            if (desty < this._clipCommand.maxDestY && destx < this._clipCommand.maxDestX) {
              // const nd = this._grid.getCellNode(desty, destx);
              const dt = this._grid.getDataItem(desty);
              this._clipCommand.oldValues[y][x] = dt[columns[destx]['field']];
              if (oneCellToMultiple) {
                this.setDataItemValueForColumn(dt, columns[destx], clippedRange[0][0]);
              } else {
                this.setDataItemValueForColumn(dt, columns[destx], clippedRange[y] ? clippedRange[y][x] : '');
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

        const bRange = {
          fromCell: activeCell,
          fromRow: activeRow,
          toCell: activeCell + this._clipCommand.w - 1,
          toRow: activeRow + this._clipCommand.h - 1
        };

        this.markCopySelection([bRange]);
        this._grid.getSelectionModel().setSelectedRanges([bRange]);
        this.onPasteCells.notify({ ranges: [bRange] });
      },

      undo: () => {
        for (let y = 0; y < this._clipCommand.destH; y++) {
          for (let x = 0; x < this._clipCommand.destW; x++) {
            const desty = activeRow + y;
            const destx = activeCell + x;

            if (desty < this._clipCommand.maxDestY && destx < this._clipCommand.maxDestX) {
              // const nd = this._grid.getCellNode(desty, destx);
              const dt = this._grid.getDataItem(desty);
              if (oneCellToMultiple) {
                this.setDataItemValueForColumn(dt, columns[destx], this._clipCommand.oldValues[0][0]);
              } else {
                this.setDataItemValueForColumn(dt, columns[destx], this._clipCommand.oldValues[y][x]);
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

        const bRange = {
          fromCell: activeCell,
          fromRow: activeRow,
          toCell: activeCell + this._clipCommand.w - 1,
          toRow: activeRow + this._clipCommand.h - 1
        };

        this.markCopySelection([bRange]);
        this._grid.getSelectionModel().setSelectedRanges([bRange]);
        this.onPasteCells.notify({ ranges: [bRange] });
        if (this._addonOptions.onPasteCells) {
          this._addonOptions.onPasteCells.call(this, new Slick.EventData(), { ranges: [bRange] });
        }

        if (addRows > 1) {
          const d = this._grid.getData() as any[];
          for (; addRows > 1; addRows--) {
            d.splice(d.length - 1, 1);
          }
          this._grid.setData(d);
          this._grid.render();
        }
      }
    };

    if (this._addonOptions.clipboardCommandHandler) {
      this._addonOptions.clipboardCommandHandler(this._clipCommand);
    }
    else {
      this._clipCommand.execute();
    }
  }


  handleKeyDown(e: any): boolean | void {
    let ranges;
    if (!this._grid.getEditorLock().isActive() || this._grid.getOptions().autoEdit) {
      if (e.which === this.keyCodes.ESC) {
        if (this._copiedRanges) {
          e.preventDefault();
          this.clearCopySelection();
          this.onCopyCancelled.notify({ ranges: this._copiedRanges });
          if (this._addonOptions.onCopyCancelled) {
            this._addonOptions.onCopyCancelled.call(this, e, { ranges: this._copiedRanges });
          }
          this._copiedRanges = null;
        }
      }

      if ((e.which === this.keyCodes.C || e.which === this.keyCodes.INSERT) && (e.ctrlKey || e.metaKey) && !e.shiftKey) {    // CTRL+C or CTRL+INS
        if (this._onCopyInit) {
          // @ts-ignore
          this._onCopyInit.call();
        }
        ranges = this._grid.getSelectionModel().getSelectedRanges();
        if (ranges.length !== 0) {
          this._copiedRanges = ranges;
          this.markCopySelection(ranges);
          this.onCopyCells.notify({ ranges });
          if (this._addonOptions.onCopyCells) {
            this._addonOptions.onCopyCells.call(this, e, { ranges });
          }

          const columns = this._grid.getColumns();
          let clipText = '';

          for (let rg = 0; rg < ranges.length; rg++) {
            const range = ranges[rg];
            const clipTextRows = [];
            for (let i = range.fromRow; i < range.toRow + 1; i++) {
              const clipTextCells = [];
              const dt = this._grid.getDataItem(i);

              if (clipTextRows.length === 0 && this._addonOptions.includeHeaderWhenCopying) {
                const clipTextHeaders = [];
                for (let j = range.fromCell; j < range.toCell + 1; j++) {
                  if (columns[j].name!.length > 0) {
                    clipTextHeaders.push(this.getHeaderValueForColumn(columns[j]));
                  }
                }
                clipTextRows.push(clipTextHeaders.join('\t'));
              }

              for (let j = range.fromCell; j < range.toCell + 1; j++) {
                clipTextCells.push(this.getDataItemValueForColumn(dt, columns[j], e));
              }
              clipTextRows.push(clipTextCells.join('\t'));
            }
            clipText += clipTextRows.join('\r\n') + '\r\n';
          }

          if ((window as any).clipboardData) {
            (window as any).clipboardData.setData('Text', clipText);
            return true;
          }
          else {
            const focusEl = document.activeElement as HTMLElement;

            const ta = this.createTextBox(clipText);

            ta.focus();

            setTimeout(() => {
              this._bodyElement.removeChild(ta);
              // restore focus
              if (focusEl) {
                focusEl.focus();
              } else {
                console.log('Not element to restore focus to after copy?');
              }
            }, 100);

            if (this._onCopySuccess) {
              let rowCount = 0;
              // If it's cell selection, use the toRow/fromRow fields
              if (ranges.length === 1) {
                rowCount = (ranges[0].toRow + 1) - ranges[0].fromRow;
              }
              else {
                rowCount = ranges.length;
              }
              // @ts-ignore
              this._onCopySuccess.call(this, rowCount);
            }

            return false;
          }
        }
      }

      if (!this._addonOptions.readOnlyMode && (
        (e.which === this.keyCodes.V && (e.ctrlKey || e.metaKey) && !e.shiftKey)
        || (e.which === this.keyCodes.INSERT && e.shiftKey && !e.ctrlKey)
      )) {    // CTRL+V or Shift+INS
        const ta = this.createTextBox('');

        setTimeout(() => {
          this.decodeTabularData(this._grid, ta);
        }, 100);

        return false;
      }
    }
  }

  markCopySelection(ranges: CellRange[]) {
    this.clearCopySelection();

    const columns = this._grid.getColumns();
    const hash: any = {};
    for (let i = 0; i < ranges.length; i++) {
      for (let j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
        hash[j] = {};
        for (let k = ranges[i].fromCell; k <= ranges[i].toCell && k < columns.length; k++) {
          hash[j][columns[k].id] = this._copiedCellStyle;
        }
      }
    }
    this._grid.setCellCssStyles(this._copiedCellStyleLayerKey, hash);
    clearTimeout(this._clearCopyTI);
    this._clearCopyTI = setTimeout(() => {
      this.clearCopySelection();
    }, 2000);
  }

  clearCopySelection() {
    this._grid.removeCellCssStyles(this._copiedCellStyleLayerKey);
  }

  setIncludeHeaderWhenCopying(includeHeaderWhenCopying: boolean) {
    this._addonOptions.includeHeaderWhenCopying = includeHeaderWhenCopying;
  }
}