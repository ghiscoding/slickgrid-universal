import type { Column, FormatterResultWithHtml, FormatterResultWithText, OnEventArgs, } from './index.js';
import type { SlickCellExcelCopyManager, } from '../extensions/slickCellExcelCopyManager.js';
import type { SlickEventData, SlickRange } from '../core/index.js';

export interface ExcelCopyBufferOption<T = any> {
  /** defaults to 2000(ms), delay in ms to wait before clearing the selection after a paste action */
  clearCopySelectionDelay?: number;

  /** defaults to 100(ms), delay in ms to wait before executing focus/paste */
  clipboardPasteDelay?: number;

  /** defaults to "copied", sets the css className used for copied cells. */
  copiedCellStyle?: string;

  /** defaults to "copy-manager", sets the layer key for setting css values of copied cells. */
  copiedCellStyleLayerKey?: string;

  /**
    * should copy the cells value on copy shortcut even when the editor is opened
    *
    * **NOTE**: affects only the default {@link ExcelCopyBufferOption#dataItemColumnValueExtractor}
    * */
  copyActiveEditorCell?: boolean;

  /** option to specify a custom column value extractor function */
  dataItemColumnValueExtractor?: (item: any, columnDef: Column<T>, row?: number, cell?: number) => string | HTMLElement | DocumentFragment | FormatterResultWithHtml | FormatterResultWithText | null;

  /** option to specify a custom column value setter function. Return true if default logic should continue to evaluate */
  dataItemColumnValueSetter?: (item: any, columnDef: Column<T>, value: any) => string | FormatterResultWithHtml | FormatterResultWithText | null | true;

  /** option to specify a custom handler for paste actions */
  clipboardCommandHandler?: (editCommand: any) => void;

  /** set to true and the plugin will take the name property from each column (which is usually what appears in your header) and put that as the first row of the text that's copied to the clipboard */
  includeHeaderWhenCopying?: boolean;

  /** option to specify a custom DOM element which to will be added the hidden textbox. It's useful if the grid is inside a modal dialog. */
  bodyElement?: HTMLElement;

  /** optional handler to run when copy action initializes */
  onCopyInit?: () => void;

  /** optional handler to run when copy action is complete */
  onCopySuccess?: (rowCount: number) => void;

  /** function to add rows to table if paste overflows bottom of table, if this function is not provided new rows will be ignored. */
  newRowCreator?: (rows: number) => void;

  /** suppresses paste */
  readOnlyMode?: boolean;

  /** option to specify a custom column header value extractor function */
  headerColumnValueExtractor?: (columnDef: Column<T>) => string | HTMLElement | DocumentFragment;

  /** if the copied text starts and ends with a double-quote (Excel multiline string) replace newlines with the defined character. (default: false) */
  replaceNewlinesWith?: string | false;

  /** multiline strings copied from Excel are pasted with double quotes. Should those be removed? (default: false) */
  removeDoubleQuotesOnPaste?: boolean;
  // --
  // Events
  // ------------

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickCellExcelCopyManager) => void;

  /** Fired when a copy cell is triggered */
  onCopyCells?: (e: SlickEventData, args: { ranges: SlickRange[]; }) => void;

  /** Fired when the command to copy the cells is cancelled */
  onCopyCancelled?: (e: SlickEventData, args: { ranges: SlickRange[]; }) => void;

  /** Fired when the user paste cells to the grid */
  onPasteCells?: (e: SlickEventData, args: { ranges: SlickRange[]; }) => void;

  /** Fired for each cell before pasting. Return false if you want to deny pasting for the specific cell */
  onBeforePasteCell?: (e: SlickEventData, args: OnEventArgs) => boolean;
}
