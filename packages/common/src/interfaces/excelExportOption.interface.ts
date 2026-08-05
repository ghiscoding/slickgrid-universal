import type { ExcelStyleInstruction, Workbook, Worksheet } from '@excel-builder-vanilla/types';
import type { FileType } from '../enums/file.type.js';

export interface ExcelExportOption {
  /** Defaults to true, when grid is using Grouping, it will show indentation of the text with collapsed/expanded symbol as well */
  addGroupIndentation?: boolean;

  /** Defaults to true, when enabled the system will try to find the best possible format to use when exporting */
  autoDetectCellFormat?: boolean;

  /** When defined, this will override header titles styling, when undefined the default will be a bold style */
  columnHeaderStyle?: ExcelStyleInstruction;

  /** If set then this will be used as Excel column width for all columns (Excel width units, not pixels). */
  customColumnWidth?: number;

  /** Defaults to false, which leads to all Formatters of the grid being evaluated on export. You can also override a column by changing the propery on the column itself */
  exportWithFormatter?: boolean;

  /** filename (without extension) */
  filename?: string;

  /** file type format, .xls/.xlsx (this will provide the extension) */
  format?: Extract<FileType, 'xls' | 'xlsx'>;

  /** Defaults to false, should we also include hidden properties in the export? */
  includeHidden?: boolean;

  /**
   * When true, include each grid column width in the Excel export when no `excelExportOptions.width` is provided on the column.
   * This is disabled by default to preserve backward compatibility with `customColumnWidth` exports.
   */
  includeColumnWidth?: boolean;

  /**
   * When true (default), export row heights to Excel when enableVariableRowHeight is active.
   * Set to false to ignore variable row heights and export all rows at default height.
   * Heights are converted from pixels to Excel points (72 DPI) for proper rendering.
   */
  includeVariableRowHeight?: boolean;

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

  /** Defaults to true, when enabled it will decode any HTML entities (e.g. "&lt;div&gt;John &amp; Jane &lt;/div&gt;" => "<div>John &amp; Jane</div>") */
  htmlDecode?: boolean;

  /** Defaults to false, which leads to Sanitizing all data (striping out any HTML tags) when being evaluated on export. */
  sanitizeDataExport?: boolean;

  /** Defaults to "Sheet1", Excel Sheet Name */
  sheetName?: string;

  /**
   * If true (default), use the Streaming export API for large .xlsx files.
   * If false, always use the legacy export method (non-streaming).
   * Useful for debugging, compatibility, or environments where streaming is not desired or supported.
   */
  useStreamingExport?: boolean;

  /** Add a Custom Excel Header on first row of the Excel Sheet */
  customExcelHeader?: (workbook: Workbook, sheet: Worksheet) => void;
}
