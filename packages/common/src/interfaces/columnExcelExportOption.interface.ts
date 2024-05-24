import type { ExcelColumnMetadata, ExcelStyleInstruction, StyleSheet } from 'excel-builder-vanilla';

import type { Column } from './column.interface';
import type { GridOption } from './gridOption.interface';

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
}

export type GetDataValueCallback = (data: Date | string | number, columnDef: Column, excelFormatterId: number | undefined, excelStylesheet: StyleSheet, gridOptions: GridOption, item: any) => Date | string | number | ExcelColumnMetadata;
export type GetGroupTotalValueCallback = (totals: any, columnDef: Column, groupType: string, excelStylesheet: StyleSheet) => Date | string | number;
