export interface PdfExportOption {
  /** Vertical offset for header text (default: -16) */
  headerTextOffset?: number;
  /** Vertical offset for header background (default: 0) */
  headerBackgroundOffset?: number;
  /** Vertical offset for data row text (default: -9) */
  dataRowTextOffset?: number;
  /** Vertical offset for odd row background (default: +4) */
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
}
