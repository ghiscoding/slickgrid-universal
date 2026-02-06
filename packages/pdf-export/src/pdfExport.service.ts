import type {
  PdfExportService as BasePdfExportService,
  Column,
  ContainerService,
  ExternalResource,
  GridOption,
  KeyTitlePair,
  Locale,
  PdfExportOption,
  PubSubService,
  SlickDataView,
  SlickGrid,
  TranslaterService,
} from '@slickgrid-universal/common';
import { Constants, exportWithFormatterWhenDefined, getTranslationPrefix, htmlDecode } from '@slickgrid-universal/common';
import { addWhiteSpaces, extend, getHtmlStringOutput, stripTags, titleCase } from '@slickgrid-universal/utils';
import jsPDF from 'jspdf';

const DEFAULT_EXPORT_OPTIONS: PdfExportOption = {
  filename: 'export',
  pageOrientation: 'portrait',
  pageSize: 'a4',
  fontSize: 10,
  headerFontSize: 11,
  includeColumnHeaders: true,
  htmlDecode: true,
  sanitizeDataExport: false,
  exportWithFormatter: false,
  addGroupIndentation: true,
  repeatHeadersOnEachPage: true,
  // Updated offsets for correct visual alignment
  dataRowTextOffset: -4,
  dataRowBackgroundOffset: -1,
  headerTextOffset: -10,
  headerBackgroundOffset: -5,
};

export interface GroupedHeaderSpan {
  title: string;
  span: number;
}

// Utility to resolve and merge column/grid export options

function resolveColumnExportOptions(columnDef: Column, globalOptions: PdfExportOption): PdfExportOption {
  const config = { ...globalOptions, ...(columnDef.pdfExportOptions || {}) };

  // Add root-level properties that should be included
  if (columnDef.exportWithFormatter !== undefined) {
    config.exportWithFormatter = columnDef.exportWithFormatter;
  }

  return config;
}

export class PdfExportService implements ExternalResource, BasePdfExportService {
  protected _exportOptions!: PdfExportOption;
  protected _grid!: SlickGrid;
  protected _groupedColumnHeaders?: Array<GroupedHeaderSpan>;
  protected _columnHeaders: Array<KeyTitlePair> = [];
  protected _hasGroupedItems = false;
  protected _locales!: Locale;
  protected _pubSubService!: PubSubService | null;
  protected _translaterService: TranslaterService | undefined;

  /** PdfExportService class name which is use to find service instance in the external registered services */
  readonly pluginName = 'PdfExportService';

  constructor() {}

  protected get _datasetIdPropName(): string {
    return (this._gridOptions && this._gridOptions.datasetIdPropertyName) || 'id';
  }

  /** Getter of SlickGrid DataView object */
  get _dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>();
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return this._grid?.getOptions() ?? ({} as GridOption);
  }

  dispose(): void {
    this._pubSubService?.unsubscribeAll();
  }

  /**
   * Initialize the Service
   * @param grid
   * @param containerService
   */
  init(grid: SlickGrid, containerService: ContainerService): void {
    this._grid = grid;
    this._pubSubService = containerService.get<PubSubService>('PubSubService');

    // get locales provided by user in main file or else use default English locales via the Constants
    this._locales = this._gridOptions?.locales ?? Constants.locales;
    this._translaterService = this._gridOptions?.translater;

    if (this._gridOptions.enableTranslate && (!this._translaterService || !this._translaterService.translate)) {
      throw new Error(
        '[Slickgrid-Universal] requires a Translate Service to be passed in the "translater" Grid Options when "enableTranslate" is enabled. (example: this.gridOptions = { enableTranslate: true, translater: this.translaterService })'
      );
    }
  }

  /**
   * Export the Grid result to PDF format using jsPDF & jsPDF-AutoTable
   * This is a WYSIWYG export to file output (What You See is What You Get)
   *
   * Example: exportToPdf({ filename: 'my-export', pageOrientation: 'landscape' })
   */
  exportToPdf(options?: PdfExportOption): Promise<boolean> {
    if (!this._grid || !this._dataView || !this._pubSubService) {
      throw new Error(
        '[Slickgrid-Universal] it seems that the SlickGrid & DataView objects and/or PubSubService are not initialized did you forget to enable the grid option flag "enablePdfExport"?'
      );
    }

    return new Promise((resolve) => {
      this._pubSubService?.publish(`onBeforeExportToPdf`, true);
      this._exportOptions = extend(true, {}, { ...DEFAULT_EXPORT_OPTIONS, ...this._gridOptions.pdfExportOptions, ...options });

      // wrap it into a setTimeout so that the EventAggregator has enough time to start a pre-process like showing a spinner
      setTimeout(() => {
        try {
          const columns = this._grid.getColumns() || [];

          // Group By text, it could be set in the export options or from translation or if nothing is found then use the English constant text
          let groupByColumnHeader = this._exportOptions.groupingColumnHeaderTitle;
          if (!groupByColumnHeader && this._gridOptions.enableTranslate && this._translaterService?.translate) {
            groupByColumnHeader = this._translaterService.translate(`${getTranslationPrefix(this._gridOptions)}GROUP_BY`);
          } else if (!groupByColumnHeader) {
            groupByColumnHeader = this._locales?.TEXT_GROUP_BY;
          }

          // check if we have grouping
          const grouping = this._dataView.getGrouping();
          this._hasGroupedItems = Array.isArray(grouping) && grouping.length > 0;

          // get all Grouped Column Header Titles when defined (from pre-header row)
          let hasColumnTitlePreHeader = false;
          // prettier-ignore
          if (
            this._gridOptions.createPreHeaderPanel &&
            this._gridOptions.showPreHeaderPanel &&
            (!this._gridOptions.enableDraggableGrouping || (this._gridOptions.enableDraggableGrouping && this._gridOptions.createTopHeaderPanel))
          ) {
            this._groupedColumnHeaders = this.getColumnGroupedHeaderTitles(columns) || [];
            hasColumnTitlePreHeader = Array.isArray(this._groupedColumnHeaders) && this._groupedColumnHeaders.length > 0;
          }

          // get all Column Header Titles
          this._columnHeaders = this.getColumnHeaders(columns) || [];

          // cache resolved export options for each column as a Record by column.id
          const columnExportOptionsCache: Record<string, PdfExportOption> = {};
          columns.forEach((col) => {
            if (col.id) {
              columnExportOptionsCache[col.id] = resolveColumnExportOptions(col, this._exportOptions);
            }
          });
          // prepare the data
          const tableData = this.getAllGridRowData(columns, columnExportOptionsCache);

          // create PDF document with jsPDF
          const isLandscape = this._exportOptions.pageOrientation === 'landscape';
          const doc = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'pt',
            format: this._exportOptions.pageSize || 'a4',
          });

          let startY = 40;
          if (this._exportOptions.documentTitle) {
            doc.setFontSize(16);
            doc.text(this._exportOptions.documentTitle, 40, startY);
            startY += 30;
          }

          // Prepare headers
          let headers = [] as string[];
          if (this._hasGroupedItems && groupByColumnHeader) {
            headers.push(groupByColumnHeader);
          }
          headers = headers.concat(this._columnHeaders.map((h) => h.title));

          // Prepare data
          const data = tableData;

          // Add table (using jsPDF-AutoTable if available, else fallback to manual)
          if ((doc as any).autoTable) {
            // For jsPDF-AutoTable, only global options are supported (no per-column)
            (doc as any).autoTable({
              head: [headers],
              body: data,
              startY,
              styles: {
                fontSize: this._exportOptions.fontSize || 10,
                cellPadding: 4,
                overflow: 'linebreak',
                halign: this._exportOptions.textAlign || 'left',
              },
              headStyles: {
                fontSize: this._exportOptions.headerFontSize || 11,
                fillColor: [66, 139, 202], // blue header
                textColor: 255,
                halign: this._exportOptions.textAlign || 'left',
                valign: 'middle',
              },
              alternateRowStyles: {
                fillColor: [245, 245, 245], // light gray for odd rows
              },
              margin: { left: 40, right: 40 },
              theme: 'grid',
            });
          } else {
            // Fallback: manual table rendering (no cell borders)
            // Use cached columnExportOptionsCache for per-column options
            const headerTextOffset = typeof this._exportOptions.headerTextOffset === 'number' ? this._exportOptions.headerTextOffset : -16;
            const headerBackgroundOffset =
              typeof this._exportOptions.headerBackgroundOffset === 'number' ? this._exportOptions.headerBackgroundOffset : 0;
            doc.setFontSize(this._exportOptions.headerFontSize || 11);
            let y = startY;
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const bottomMargin = 40;
            const rowHeight = 18;
            const margin = 40;
            // Dynamically calculate table width based on page width and margins
            const tableWidth = pageWidth - margin * 2;
            const colCount = headers.length;

            // Try to fit all header titles by reducing font size if needed
            let headerFontSize = this._exportOptions.headerFontSize || 11;
            let minFontSize = 7;
            doc.setFontSize(headerFontSize);
            let fits = false;
            let headerTextWidths = headers.map((h) => doc.getTextWidth(h));
            while (!fits && headerFontSize >= minFontSize) {
              fits = true;
              headerTextWidths = headers.map((h) => doc.getTextWidth(h));
              const totalTextWidth = headerTextWidths.reduce((a, b) => a + b, 0);
              // Add padding for each column
              const totalWidthWithPadding = totalTextWidth + colCount * 8; // 8pt padding per column
              if (totalWidthWithPadding > tableWidth) {
                fits = false;
                headerFontSize--;
                doc.setFontSize(headerFontSize);
              }
            }
            // Use the final font size for header
            this._exportOptions.headerFontSize = headerFontSize;

            // Calculate proportional column widths
            // Use custom width if provided, else equal width
            let colWidths = Array(colCount).fill(tableWidth / colCount);
            for (let i = 0; i < colCount; i++) {
              const colId = columns[i]?.id;
              const colOpt = colId ? columnExportOptionsCache[colId] : undefined;
              if (colOpt && colOpt.width && typeof colOpt.width === 'number') {
                colWidths[i] = colOpt.width;
              }
            }
            // If any custom widths, adjust last column to fill remaining space so sum matches tableWidth
            const sumWidths = colWidths.reduce((a, b) => a + b, 0);
            if (Math.abs(sumWidths - tableWidth) > 0.1) {
              // Adjust last column width to fill gap
              colWidths[colCount - 1] += tableWidth - sumWidths;
            }

            // Draw pre-header row (grouped column headers) if enabled
            if (hasColumnTitlePreHeader && this._groupedColumnHeaders && this._groupedColumnHeaders.length > 0) {
              y = this._drawPreHeaderRow(doc, y, colWidths, margin, headerTextOffset, headerBackgroundOffset, groupByColumnHeader);
            }

            // Draw header row
            y = this._drawHeaderRow(doc, y, headers, colWidths, margin, headerTextOffset, headerBackgroundOffset);
            doc.setFontSize(this._exportOptions.fontSize || 10);
            data.forEach((row, rowIdx) => {
              // Check for page break before drawing row
              if (y + rowHeight + bottomMargin > pageHeight) {
                doc.addPage();
                y = margin;
                // Redraw pre-header and header on new page only if repeatHeadersOnEachPage is true
                if (this._exportOptions.repeatHeadersOnEachPage !== false) {
                  // Pre-header row
                  if (hasColumnTitlePreHeader && this._groupedColumnHeaders && this._groupedColumnHeaders.length > 0) {
                    y = this._drawPreHeaderRow(doc, y, colWidths, margin, headerTextOffset, headerBackgroundOffset, groupByColumnHeader);
                  }
                  // Header row
                  y = this._drawHeaderRow(doc, y, headers, colWidths, margin, headerTextOffset, headerBackgroundOffset);
                  doc.setFontSize(this._exportOptions.fontSize || 10);
                }
              }
              // Alternate row background
              if (rowIdx % 2 === 1) {
                doc.setFillColor(245, 245, 245);
                // Use first column's dataRowBackgroundOffset for the row
                // Always use the correct column for background offset (first visible data column)
                let firstDataColIdx = 0;
                if (this._hasGroupedItems) firstDataColIdx = 1;
                const firstColId = columns.filter((col) => !col.excludeFromExport)[firstDataColIdx]?.id;
                const colOpt = firstColId ? columnExportOptionsCache[firstColId] : this._exportOptions;
                doc.rect(
                  margin,
                  y - 12 + (typeof colOpt.dataRowBackgroundOffset === 'number' ? colOpt.dataRowBackgroundOffset : 0),
                  tableWidth,
                  rowHeight,
                  'F'
                );
              }
              // Detect group title row: only first cell has value, rest are empty
              const isGroupTitleRow = row.length > 1 && row[0] && row.slice(1).every((cell) => cell === '');
              if (isGroupTitleRow) {
                // Draw a single cell spanning all columns (no border)
                const textY = y + (typeof this._exportOptions.dataRowTextOffset === 'number' ? this._exportOptions.dataRowTextOffset : 0);
                doc.setTextColor(0, 0, 0);
                doc.text(String(row[0]), margin, textY, {
                  align: 'left',
                  baseline: 'middle',
                });
              } else {
                // Render regular row by iterating header columns and row cells in parallel
                let cellX = margin;
                for (let colIdx = 0; colIdx < headers.length; colIdx++) {
                  let colDef: Column | undefined;
                  let colOpt: PdfExportOption = this._exportOptions;
                  let colWidth = colWidths[colIdx];
                  if (this._hasGroupedItems && colIdx === 0) {
                    // Group column: no colDef, use default options
                  } else {
                    const dataColIdx = this._hasGroupedItems ? colIdx - 1 : colIdx;
                    colDef = columns.filter((col) => !col.excludeFromExport)[dataColIdx];
                    if (colDef && colDef.id) {
                      colOpt = columnExportOptionsCache[colDef.id] || this._exportOptions;
                    }
                  }
                  const cell = row[colIdx];
                  doc.setTextColor(0, 0, 0);
                  let textX = cellX;
                  const textY = y + (typeof colOpt.dataRowTextOffset === 'number' ? colOpt.dataRowTextOffset : 0);
                  if (colIdx === 0 && this._hasGroupedItems) {
                    // Group column (blank for data rows)
                    doc.text(String(cell ?? ''), textX, textY, {
                      align: 'left',
                      baseline: 'middle',
                    });
                  } else {
                    if (colOpt.textAlign === 'center') {
                      textX = cellX + colWidth / 2;
                    } else if (colOpt.textAlign === 'right') {
                      textX = cellX + colWidth;
                    }
                    doc.text(String(cell ?? ''), textX, textY, {
                      align: colOpt.textAlign || 'left',
                      baseline: 'middle',
                    });
                  }
                  cellX += colWidth;
                }
              }
              y += rowHeight;
            });
          }

          // Save the PDF
          doc.save(`${this._exportOptions.filename}.pdf`);

          this._pubSubService?.publish(`onAfterExportToPdf`, { filename: `${this._exportOptions.filename}.pdf` });
          resolve(true);
        } catch (error) {
          console.error('Error exporting to PDF:', error);
          this._pubSubService?.publish(`onAfterExportToPdf`, { filename: `${this._exportOptions.filename}.pdf`, error });
          resolve(false);
        }
      }, 0);
    });
  }

  // -----------------------
  // protected functions
  // -----------------------

  /**
   * Get all the grid row data and return that as a 2D array
   */
  protected getAllGridRowData(columns: Column[], columnExportOptionsCache?: Record<string, PdfExportOption>): any[][] {
    const outputData: any[][] = [];
    const lineCount = this._dataView.getLength();

    // loop through all the grid rows of data
    for (let rowNumber = 0; rowNumber < lineCount; rowNumber++) {
      const itemObj = this._dataView.getItem(rowNumber);

      // make sure we have a filled object AND that the item doesn't include the "getItem" method
      // this could happen with an opened Row Detail as it seems to include an empty Slick DataView (we'll just skip those lines)
      if (itemObj && !itemObj.hasOwnProperty('getItem')) {
        // Normal row (not grouped by anything) would have an ID which was predefined in the Grid Columns definition
        if (itemObj[this._datasetIdPropName] !== null && itemObj[this._datasetIdPropName] !== undefined) {
          // get regular row item data
          outputData.push(this.readRegularRowData(columns, rowNumber, itemObj, columnExportOptionsCache));
        } else if (this._hasGroupedItems && itemObj.__groupTotals === undefined) {
          // get the group row
          outputData.push(this.readGroupedTitleRow(itemObj));
        } else if (itemObj.__groupTotals) {
          // else if the row is a Group By and we have aggregators, then a property of '__groupTotals' would exist under that object
          outputData.push(this.readGroupedTotalRow(columns, itemObj));
        }
      }
    }

    return outputData;
  }

  /**
   * Download the PDF file to the user's computer
   */
  protected downloadPdf(pdfBytes: Uint8Array, filename: string): void {
    // create a Blob from the PDF bytes
    const blob = new Blob([pdfBytes] as BlobPart[], { type: 'application/pdf' });

    // when using IE/Edge, then use different download call
    if (typeof (navigator as any).msSaveOrOpenBlob === 'function') {
      (navigator as any).msSaveOrOpenBlob(blob, filename);
    } else {
      // create a temporary <a> tag to trigger download
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';

      // append, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // cleanup the URL object
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Get all header titles and their keys, translate the title when required.
   * @param {Array<object>} columns of the grid
   */
  protected getColumnHeaders(columns: Column[]): Array<KeyTitlePair> {
    const columnHeaders: Array<KeyTitlePair> = [];

    if (columns && Array.isArray(columns)) {
      // Populate the Column Header, pull the name defined
      columns.forEach((columnDef) => {
        let headerTitle = '';
        if (
          columnDef.nameKey &&
          this._gridOptions.enableTranslate &&
          this._translaterService?.translate &&
          this._translaterService?.getCurrentLanguage?.()
        ) {
          headerTitle = this._translaterService.translate(columnDef.nameKey);
        } else {
          headerTitle = getHtmlStringOutput(columnDef.name || '', 'innerHTML') || titleCase(columnDef.field);
        }
        const skippedField = columnDef.excludeFromExport || false;

        // if column width is 0px, then we consider that field as a hidden field and should not be part of the export
        if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
          columnHeaders.push({
            key: (columnDef.field || columnDef.id) as string,
            title: headerTitle || '',
          });
        }
      });
    }
    return columnHeaders;
  }

  /**
   * Get the data of a regular row (a row without grouping)
   * @param {Array<Object>} columns - column definitions
   * @param {Number} row - row index
   * @param {Object} itemObj - item datacontext object
   */
  protected readRegularRowData(
    columns: Column[],
    row: number,
    itemObj: any,
    columnExportOptionsCache?: Record<string, PdfExportOption>
  ): any[] {
    const rowData: any[] = [];
    const itemMetadata = this._dataView.getItemMetadata(row);
    let prevColspan: number | string = 1;

    // if we are grouping and are on 1st column index, we need to skip this column since it will be used later by the grouping text
    if (this._hasGroupedItems) {
      rowData.push('');
    }

    for (let col = 0, ln = columns.length; col < ln; col++) {
      const columnDef = columns[col];
      const colOpt = columnExportOptionsCache && columnDef.id ? columnExportOptionsCache[columnDef.id] : this._exportOptions;

      // skip excluded column
      if (columnDef.excludeFromExport) {
        continue;
      }

      // when using rowspan
      if (this._gridOptions.enableCellRowSpan) {
        const prs = this._grid.getParentRowSpanByCell(row, col, false);
        if (prs && prs.start !== row) {
          // skip any rowspan child cell since it was already merged
          rowData.push('');
          continue;
        }
      }

      // when using colspan (it could be a number or a "*" when spreading the entire row)
      let colspanColumnId;
      if (itemMetadata?.columns) {
        const metadata = itemMetadata?.columns;
        const columnData = metadata[columnDef.id] || metadata[col];
        if (!((!isNaN(prevColspan as number) && +prevColspan > 1) || (prevColspan === '*' && col > 0))) {
          prevColspan = columnData?.colspan ?? 1;
        }
        if (prevColspan !== '*') {
          if (columnDef.id in metadata || col in metadata) {
            colspanColumnId = columnDef.id;
          }
        }
      }

      if ((prevColspan === '*' && col > 0) || (!isNaN(prevColspan as number) && +prevColspan > 1 && columnDef.id !== colspanColumnId)) {
        rowData.push('');
        if (!isNaN(prevColspan as number) && +prevColspan > 1) {
          (prevColspan as number)--;
        }
      } else {
        // get the output by analyzing if we'll pull the value from the cell or from a formatter
        let itemData = exportWithFormatterWhenDefined(row, col, columnDef, itemObj, this._grid, colOpt);

        // does the user want to sanitize the output data (remove HTML tags)?
        if (columnDef.sanitizeDataExport || colOpt.sanitizeDataExport) {
          itemData = stripTags(itemData);
        }

        // decode HTML entities if enabled
        if (colOpt.htmlDecode) {
          itemData = htmlDecode(itemData);
        }

        rowData.push(itemData);
      }
    }

    return rowData;
  }

  /**
   * Get the grouped title(s) and its group title formatter
   * For example if we grouped by salesRep, the returned result would be: 'Sales Rep: John Dow (2 items)'
   * @param itemObj
   */
  protected readGroupedTitleRow(itemObj: any): any[] {
    let groupName = stripTags(itemObj.title);

    // Prepend expand/collapse symbol if configured (default to ASCII for PDF compatibility)
    const collapsedSymbol = this._exportOptions.groupCollapsedSymbol || '+';
    const expandedSymbol = this._exportOptions.groupExpandedSymbol || '-';
    const chevron = itemObj.collapsed ? collapsedSymbol : expandedSymbol;
    groupName = chevron + ' ' + groupName;

    // Indent group title by level (original logic, 0 offset for first group)
    if (this._exportOptions.addGroupIndentation) {
      groupName = addWhiteSpaces(5 * itemObj.level) + groupName;
    }

    // decode HTML entities if enabled
    if (this._exportOptions.htmlDecode) {
      groupName = htmlDecode(groupName);
    }

    // Ensure group title row has the same number of columns as header/data rows
    const colCount = (this._columnHeaders?.length || 0) + (this._hasGroupedItems ? 1 : 0);
    const row: any[] = [groupName];
    while (row.length < colCount) {
      row.push('');
    }
    return row;
  }

  /**
   * Get the grouped totals (below the regular rows), these are set by Slick Aggregators.
   * For example if we grouped by "salesRep" and we have a Sum Aggregator on "sales",
   * then the returned output would be:: ["Sum 123$"]
   * @param itemObj
   */
  protected readGroupedTotalRow(columns: Column[], itemObj: any): any[] {
    const groupingAggregatorRowText = this._exportOptions.groupingAggregatorRowText || '';
    const outputRow: any[] = [groupingAggregatorRowText];

    columns.forEach((columnDef) => {
      let itemData = '';
      const skippedField = columnDef.excludeFromExport || false;

      // if there's a groupTotalsFormatter, we will re-run it to get the exact same output as what is shown in UI
      if (columnDef.groupTotalsFormatter) {
        const totalResult = columnDef.groupTotalsFormatter(itemObj, columnDef, this._grid);
        itemData = totalResult instanceof HTMLElement ? totalResult.textContent || '' : totalResult;
      }

      // does the user want to sanitize the output data (remove HTML tags)?
      if (columnDef.sanitizeDataExport || this._exportOptions.sanitizeDataExport) {
        itemData = stripTags(itemData);
      }

      // decode HTML entities if enabled
      if (this._exportOptions.htmlDecode) {
        itemData = htmlDecode(itemData);
      }

      // add the column (unless user wants to skip it)
      if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
        outputRow.push(itemData);
      }
    });

    return outputRow;
  }

  /**
   * Get all Grouped Header Titles and their keys, translate the title when required.
   * Returns array of { title, span } for each group, in order
   * @param {Array<object>} columns of the grid
   */
  protected getColumnGroupedHeaderTitles(columns: Column[]): Array<{ title: string; span: number }> {
    const groupSpans: { title: string; span: number }[] = [];
    if (Array.isArray(columns)) {
      let lastTitle: null | string = null;
      let span = 0;
      columns.forEach((columnDef, idx) => {
        const skippedField = columnDef.excludeFromExport || false;
        if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
          let groupedHeaderTitle =
            columnDef.columnGroupKey && this._gridOptions.enableTranslate && this._translaterService?.translate
              ? this._translaterService.translate(columnDef.columnGroupKey)
              : columnDef.columnGroup || '';
          if (groupedHeaderTitle !== lastTitle) {
            if (lastTitle !== null) {
              groupSpans[groupSpans.length - 1].span = span;
            }
            groupSpans.push({ title: groupedHeaderTitle || '', span: 1 });
            lastTitle = groupedHeaderTitle;
            span = 1;
          } else {
            span++;
          }
        }
        // If last column, finalize last group span
        if (idx === columns.length - 1 && groupSpans.length > 0) {
          groupSpans[groupSpans.length - 1].span = span;
        }
      });
    }
    return groupSpans;
  }

  /**
   * Draw the pre-header row (grouped column headers) on the PDF document
   */
  private _drawPreHeaderRow(
    doc: jsPDF,
    y: number,
    colWidths: number[],
    margin: number,
    headerTextOffset: number,
    headerBackgroundOffset: number,
    groupByColumnHeader?: string
  ): number {
    doc.setFontSize(this._exportOptions.headerFontSize || 11);
    doc.setFillColor(108, 117, 125); // #6c757d
    doc.setTextColor(255, 255, 255);
    // colCount is not needed
    const preHeaderWidth = colWidths.reduce((a, b) => a + b, 0);
    doc.rect(margin, y - 14 + headerBackgroundOffset, preHeaderWidth, 20, 'F');
    let preHeaderX = margin;
    let colIdx = 0;
    if (this._hasGroupedItems && groupByColumnHeader) {
      preHeaderX += colWidths[0];
      colIdx++;
    }
    this._groupedColumnHeaders?.forEach((group) => {
      if (group.title) {
        // Calculate span width
        const spanWidth = colWidths.slice(colIdx, colIdx + group.span).reduce((a, b) => a + b, 0);
        doc.text(
          group.title.length > 20 ? group.title.substring(0, 20) + '...' : group.title,
          preHeaderX + spanWidth / 2,
          y + headerTextOffset,
          { align: 'center', baseline: 'middle' }
        );
      }
      preHeaderX += colWidths.slice(colIdx, colIdx + group.span).reduce((a, b) => a + b, 0);
      colIdx += group.span;
    });
    return y + 20;
  }

  /**
   * Draw the header row on the PDF document
   */
  private _drawHeaderRow(
    doc: jsPDF,
    y: number,
    headers: string[],
    colWidths: number[],
    margin: number,
    headerTextOffset: number,
    headerBackgroundOffset: number
  ): number {
    doc.setFontSize(this._exportOptions.headerFontSize || 11);
    doc.setFillColor(66, 139, 202);
    doc.setTextColor(255, 255, 255);
    const headerWidth = colWidths.reduce((a, b) => a + b, 0);
    doc.rect(margin, y - 14 + headerBackgroundOffset, headerWidth, 20, 'F');
    let headerX = margin;
    headers.forEach((header, idx) => {
      doc.text(String(header), headerX, y + headerTextOffset, { align: 'left', baseline: 'middle' });
      headerX += colWidths[idx];
    });
    return y + 20;
  }
}
