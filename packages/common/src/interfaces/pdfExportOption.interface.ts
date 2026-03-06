export interface PdfExportOption {
  /** Vertical offset for header text (default: -10) */
  headerTextOffset?: number;
  /** Vertical offset for header background (default: -5) */
  headerBackgroundOffset?: number;
  /** Vertical offset for data row text (default: -4) */
  dataRowTextOffset?: number;
  /** Vertical offset for odd row background (default: -1) */
  dataRowBackgroundOffset?: number;
  /** Defaults to true, when grid is using Grouping, it will show indentation of the text with collapsed/expanded symbol as well */
  addGroupIndentation?: boolean;
  /** Defaults to false, which leads to all Formatters of the grid being evaluated on export. You can also override a column by changing the property on the column itself */
  exportWithFormatter?: boolean;
  /** filename (without extension) */
  filename?: string;
  /** The column header title (at first column) of the Group by. If nothing is provided it will use "Group By" (which is a translated value of GROUP_BY i18n) */
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
  /** PDF page orientation, defaults to 'portrait' */
  pageOrientation?: 'portrait' | 'landscape';
  /** PDF page size, defaults to 'a4' */
  pageSize?: 'a4' | 'letter' | 'legal';
  /** Defaults to true, whether to include column headers in the PDF */
  includeColumnHeaders?: boolean;
  /** Font size for table content, defaults to 10 */
  fontSize?: number;
  /** Font size for table headers, defaults to 12 */
  headerFontSize?: number;
  /** Optional document title that appears at the top of the PDF */
  documentTitle?: string;
  /** If true (default), repeat pre-header/header on every page; if false, only on first page */
  repeatHeadersOnEachPage?: boolean;
  /** Horizontal alignment for all PDF table text ('left', 'center', 'right'). Defaults to 'left'. */
  textAlign?: 'left' | 'center' | 'right';
  /** Header row background color as RGB tuple, defaults to [66, 139, 202] (Bootstrap-blue) */
  headerBackgroundColor?: [number, number, number];
  /** Header row text color as RGB tuple, defaults to [255, 255, 255] (white) */
  headerTextColor?: [number, number, number];
  /** Pre-header (grouped columns) row background color as RGB tuple, defaults to [108, 117, 125] */
  preHeaderBackgroundColor?: [number, number, number];
  /** Pre-header (grouped columns) row text color as RGB tuple, defaults to [255, 255, 255] (white) */
  preHeaderTextColor?: [number, number, number];
  /** Alternate (odd) row background color as RGB tuple, defaults to [245, 245, 245] (light gray) */
  alternateRowColor?: [number, number, number];
  /** Cell padding in pt (used by jsPDF-AutoTable), defaults to 4 */
  cellPadding?: number;
  /**
   * Optional PDF document properties (metadata) set via `doc.setDocumentProperties()`.
   * These appear in the PDF viewer's "Document Properties" dialog.
   */
  documentProperties?: {
    /** PDF document title */
    title?: string;
    /** PDF document author */
    author?: string;
    /** PDF document subject */
    subject?: string;
    /** PDF document keywords (comma-separated string) */
    keywords?: string;
    /** PDF document creator (application name) */
    creator?: string;
  };
  /**
   * Optional column width in points (pt) for PDF export. jsPDF uses `pt` as its default unit.
   * 1 pt ≈ 1.333 px (1 px ≈ 0.75 pt)
   * Example: width: 72 (pt) ≈ 96 px
   */
  width?: number;

  /**
   * Optional callback to customize the jsPDF-AutoTable options before the table is rendered.
   * Receives the fully-built AutoTable options object and must return the (possibly mutated) options.
   * This is only called when jsPDF-AutoTable is available; the manual fallback path does not use it.
   *
   * Use this to add advanced AutoTable features (e.g. `didDrawCell`, `willDrawCell`, custom column widths)
   * without needing to subclass `PdfExportService`.
   *
   * @example
   * ```ts
   * autoTableOptions: (opts) => {
   *   opts.didDrawCell = (data) => { console.log('drew cell', data); };
   *   return opts;
   * }
   * ```
   */
  autoTableOptions?: (options: Record<string, unknown>) => Record<string, unknown>;
}
