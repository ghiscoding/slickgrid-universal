import type { SlickRange } from '../core/slickCore.js';
import type { SlickCellExternalCopyManager } from '../extensions/slickCellExternalCopyManager.js';
import type { Column, ExcelCopyBufferOption } from './index.js';

export interface ExternalCopyClipCommand {
  activeCell: number;
  activeRow: number;
  cellExternalCopyManager: SlickCellExternalCopyManager;
  clippedRange: SlickRange[];
  destH: number;
  destW: number;
  h: number;
  w: number;
  isClipboardCommand: boolean;
  maxDestX: number;
  maxDestY: number;
  oldValues: any[];
  oneCellToMultiple: boolean;
  _options: ExcelCopyBufferOption;

  execute: () => void;
  markCopySelection: (ranges: SlickRange[]) => void;
  setDataItemValueForColumn: (item: any, columnDef: Column, value: any) => any | void;
  undo: () => void;
}
