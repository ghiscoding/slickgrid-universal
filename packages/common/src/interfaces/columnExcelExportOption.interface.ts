import type { ExcelColumnMetadata, ExcelStyleInstruction, StyleSheet } from '@excel-builder-vanilla/types';

import type { Column } from './column.interface.js';
import type { GridOption } from './gridOption.interface.js';
import type { SlickGroupTotals } from '../core/index.js';

/** Excel custom export options (formatting & width) that can be applied to a column */
export interface ColumnExcelExportOption {
  /** Defaults to true, when enabled the system will try to find the best possible format to use when exporting. */
  autoDetectCellFormat?: boolean;

  /**
   * Option to provide custom Excel styling
   * NOTE: this option will completely override any detected cell styling
   */
  style?: ExcelStyleInstruction;

  /** Excel column width */
  width?: number;

  /** Cell data value parser callback function */
  valueParserCallback?: GetDataValueCallback;
}

export interface GroupTotalExportOption {
  /**
   * Option to provide custom Excel styling
   * NOTE: this option will completely override any detected cell styling
   */
  style?: ExcelStyleInstruction;

  /** Cell data value parser callback function */
  valueParserCallback?: GetGroupTotalValueCallback;

  /** Allows to define a group type (sum, avg, ...) when auto-detect doesn't work when used with `valueParserCallback` without a `groupTotalsFormatter` to auto-detect. */
  groupType?: string;
}

export interface BaseExcelValueParserArgs {
  columnDef: Column;
  gridOptions: GridOption;
  excelFormatId: number | undefined;
  stylesheet: StyleSheet;
  dataRowIdx: number;
}

export interface ExcelCellValueParserArgs<T = any> extends BaseExcelValueParserArgs {
  dataContext: T;
}

export interface ExcelGroupValueParserArgs extends BaseExcelValueParserArgs {
  groupType: string;
}

export type GetDataValueCallback = (
  data: Date | string | number,
  args: ExcelCellValueParserArgs
) => Date | string | number | ExcelColumnMetadata;
export type GetGroupTotalValueCallback = (
  totals: SlickGroupTotals,
  args: ExcelGroupValueParserArgs
) => Date | string | number | ExcelColumnMetadata;
