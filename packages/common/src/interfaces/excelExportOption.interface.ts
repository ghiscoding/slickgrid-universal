import { ExcelWorksheet } from './excelWorksheet.interface';
import { ExcelWorkbook } from './excelWorkbook.interface';
import { FileType } from '../enums/fileType.enum';

export interface ExcelExportOption {
  /** Defaults to true, when grid is using Grouping, it will show indentation of the text with collapsed/expanded symbol as well */
  addGroupIndentation?: boolean;

  /** If defined apply the style to header columns. Else use the bold style */
  columnHeaderStyle?: any;

  /** If set then this will be used as column width for all columns */
  customColumnWidth?: number;

  /** Defaults to false, which leads to all Formatters of the grid being evaluated on export. You can also override a column by changing the propery on the column itself */
  exportWithFormatter?: boolean;

  /**
   * Defaults to true, which leads to ExcelExportService trying to detect the best possible Excel format for each cell.
   * The difference the other flag is that "exportWithFormatter" will always export as a string, while this option here will try to detect the best Excel format.
   * NOTE: Date will still be exported as string, the numbers are the ones taking the best advantage from this option.
   */
  exportWithExcelFormat?: boolean;

  /** filename (without extension) */
  filename?: string;

  /** file type format, .xls/.xlsx (this will provide the extension) */
  format?: FileType.xls | FileType.xlsx;

  /**
   * file MIME type could be provided by the user.
   * - when undefined it will detect the type depending on its extension unless user defines it.
   * - user could also be set to an empty string, which in this case would lead to an empty MIME type:
   *   - ie Salesforce restricts Excel MIME types, however we can go around this issue by not providing any MIME type
   */
  mimeType?: string;

  /** The column header title (at A0 in Excel) of the Group by. If nothing is provided it will use "Group By" (which is a translated value of GROUP_BY i18n) */
  groupingColumnHeaderTitle?: string;

  /** The default text to display in 1st column of the File Export, which will identify that the current row is a Grouping Aggregator */
  groupingAggregatorRowText?: string;

  /** Symbol use to show that the group title is collapsed (you can use unicode like '⮞' or '\u25B7') */
  groupCollapsedSymbol?: string;

  /** Symbol use to show that the group title is expanded (you can use unicode like '⮟' or '\u25BD') */
  groupExpandedSymbol?: string;

  /** Defaults to false, which leads to Sanitizing all data (striping out any HTML tags) when being evaluated on export. */
  sanitizeDataExport?: boolean;

  /** Defaults to "Sheet1", Excel Sheet Name */
  sheetName?: string;

  /** Add a Custom Excel Header on first row of the Excel Sheet */
  customExcelHeader?: (workbook: ExcelWorkbook, sheet: ExcelWorksheet) => void;
}
