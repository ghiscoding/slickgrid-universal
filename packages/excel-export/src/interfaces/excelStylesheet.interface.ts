import { ExcelAlignmentStyle, ExcelBorderStyle, ExcelColorStyle, ExcelCustomStyling, ExcelFillStyle, ExcelFontStyle } from '@slickgrid-universal/common';

export interface ExcelStylesheet {
  createBorderFormatter: (border: ExcelBorderStyle) => any;
  createDifferentialStyle: (instructions: ExcelCustomStyling) => any;
  createFill: (instructions: ExcelFillStyle) => any;
  createFontStyle: (instructions: ExcelFontStyle) => any;
  createFormat: (instructions: ExcelCustomStyling) => any;
  createNumberFormatter: (format: string) => any;
  createSimpleFormatter: (type: any) => any;
  createTableStyle: (instructions: any) => any;
  exportAlignment: (doc: any, alignmentData: ExcelAlignmentStyle) => any;
  exportBorder: (doc: any, data: any[]) => ExcelBorderStyle;
  exportBorders: (doc: any) => any;
  exportCellFormatElement: (doc: any, instructions: ExcelCustomStyling) => any;
  exportCellStyles: (doc: any) => any;
  exportColor: (doc: any, color: ExcelColorStyle) => any;
  exportDifferentialStyles: (doc: any) => any;
  exportDFX: (doc: any, style: any) => any;
  exportFill: (doc: any, fd: any) => any;
  exportFills: (doc: any) => any;
  exportFont: (doc: any, fd: any) => any;
  exportFonts: (doc: any) => any;
  exportGradientFill: (doc: any, data: any[]) => any;
  exportNumberFormatter: (doc: any, fd: any) => any;
  exportNumberFormatters: (doc: any) => any;
  exportMasterCellFormats: (doc: any) => any;
  exportMasterCellStyles: (doc: any) => any;
  exportPatternFill: (doc: any, data: any[]) => any;
  exportProtection: (doc: any, protectionData: any) => any;
  exportTableStyle: (doc: any, style: any) => any;
  exportTableStyles: (doc: any) => any;
  toXML: () => any;
}
