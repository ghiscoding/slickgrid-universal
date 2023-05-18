import type { Column } from './column.interface';
import type { ExcelCellFormat } from './excelCellFormat.interface';
import type { GridOption } from './gridOption.interface';

/** Excel custom export options (formatting & width) that can be applied to a column */
export interface ColumnExcelExportOption {
  /**
   * Option to provide custom Excel styling
   * NOTE: this option will completely override any detected column formatting
   */
  style?: ExcelCustomStyling;

  /** Excel column width */
  width?: number;

  /** Cell data value parser callback function */
  valueParserCallback?: GetDataValueCallback;
}

export interface GroupTotalExportOption {
  /**
   * Option to provide custom Excel styling
   * NOTE: this option will completely override any detected column formatting
   */
  style?: ExcelCustomStyling;

  /** Cell data value parser callback function */
  valueParserCallback?: GetGroupTotalValueCallback;
}

export type GetDataValueCallback = (data: Date | string | number, columnDef: Column, excelFormatterId: number | undefined, excelStylesheet: unknown, gridOptions: GridOption) => Date | string | number | ExcelCellFormat;
export type GetGroupTotalValueCallback = (totals: any, columnDef: Column, groupType: string, excelStylesheet: unknown) => Date | string | number;

/**
 * Excel Color in ARGB format, for color aren't transparent just use "FF" as prefix.
 * For example if the color you want to add is a blue with HTML color "#0000FF", then the excel color we need to add is "FF0000FF"
 * Online tool: https://www.myfixguide.com/color-converter/
 */
export type ExcelColorStyle = string | { theme: number; };
export interface ExcelAlignmentStyle {
  horizontal?: 'center' | 'fill' | 'general' | 'justify' | 'left' | 'right';
  justifyLastLine?: boolean;
  readingOrder?: string;
  relativeIndent?: boolean;
  shrinkToFit?: boolean;
  textRotation?: string | number;
  vertical?: 'bottom' | 'distributed' | 'center' | 'justify' | 'top';
  wrapText?: boolean;
}
export type ExcelBorderLine = 'continuous' | 'dash' | 'dashDot' | 'dashDotDot' | 'dotted' | 'double' | 'lineStyleNone' | 'medium' | 'slantDashDot' | 'thin' | 'thick';
export interface ExcelBorderStyle {
  bottom?: { color?: ExcelColorStyle; style?: ExcelBorderLine; };
  top?: { color?: ExcelColorStyle; style?: ExcelBorderLine; };
  left?: { color?: ExcelColorStyle; style?: ExcelBorderLine; };
  right?: { color?: ExcelColorStyle; style?: ExcelBorderLine; };
  diagonal?: any;
  outline?: boolean;
  diagonalUp?: boolean;
  diagonalDown?: boolean;
}
export interface ExcelFillStyle {
  type?: 'gradient' | 'pattern';
  patternType?: string;
  degree?: number;
  fgColor?: ExcelColorStyle;
  start?: ExcelColorStyle;
  end?: { pureAt?: number; color?: ExcelColorStyle; };
}
export interface ExcelFontStyle {
  bold?: boolean;
  color?: ExcelColorStyle;
  fontName?: string;
  italic?: boolean;
  outline?: boolean;
  size?: number;
  strike?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  underline?: 'single' | 'double' | 'singleAccounting' | 'doubleAccounting';
}

/** Excel custom formatting that will be applied to a column */
export interface ExcelCustomStyling {
  alignment?: ExcelAlignmentStyle;
  border?: ExcelBorderStyle;
  fill?: ExcelFillStyle;
  font?: ExcelFontStyle;
  format?: string;
  protection?: {
    locked?: boolean;
    hidden?: boolean;
  };
  /** style id */
  style?: number;
}