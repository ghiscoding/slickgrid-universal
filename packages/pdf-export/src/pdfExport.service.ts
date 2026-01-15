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
import {
  Constants,
  // utility functions
  exportWithFormatterWhenDefined,
  getTranslationPrefix,
  htmlDecode,
} from '@slickgrid-universal/common';
import { addWhiteSpaces, extend, getHtmlStringOutput, stripTags, titleCase } from '@slickgrid-universal/utils';
import { pdf } from 'tinypdf';

const DEFAULT_EXPORT_OPTIONS: PdfExportOption = {
  filename: 'export',
  pageOrientation: 'portrait',
  pageSize: 'a4',
  fontSize: 10,
  headerFontSize: 12,
  includeColumnHeaders: true,
  htmlDecode: true,
  sanitizeDataExport: false,
  exportWithFormatter: false,
  addGroupIndentation: true,
  repeatHeadersOnEachPage: true,
  dataRowTextOffset: -9,
  dataRowBackgroundOffset: 4,
  headerTextOffset: -16,
  headerBackgroundOffset: 0,
};

export interface GroupedHeaderSpan {
  title: string;
  span: number;
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
  readonly className = 'PdfExportService';

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
          if (
            !groupByColumnHeader &&
            this._gridOptions.enableTranslate &&
            this._translaterService?.translate &&
            this._translaterService?.getCurrentLanguage?.()
          ) {
            groupByColumnHeader = this._translaterService.translate(`${getTranslationPrefix(this._gridOptions)}GROUP_BY`);
          } else if (!groupByColumnHeader) {
            groupByColumnHeader = this._locales && this._locales.TEXT_GROUP_BY;
          }

          // check if we have grouping
          const grouping = this._dataView.getGrouping();
          if (Array.isArray(grouping) && grouping.length > 0) {
            this._hasGroupedItems = true;
          } else {
            this._hasGroupedItems = false;
          }

          // get all Grouped Column Header Titles when defined (from pre-header row)
          let hasColumnTitlePreHeader = false;
          if (
            this._gridOptions.createPreHeaderPanel &&
            this._gridOptions.showPreHeaderPanel &&
            (!this._gridOptions.enableDraggableGrouping ||
              (this._gridOptions.enableDraggableGrouping && this._gridOptions.createTopHeaderPanel))
          ) {
            this._groupedColumnHeaders = this.getColumnGroupedHeaderTitles(columns) || [];
            hasColumnTitlePreHeader = Array.isArray(this._groupedColumnHeaders) && this._groupedColumnHeaders.length > 0;
          }

          // get all Column Header Titles
          this._columnHeaders = this.getColumnHeaders(columns) || [];

          // prepare the data
          const tableData = this.getAllGridRowData(columns);

          // create PDF document
          const doc = pdf();

          // determine page dimensions based on orientation and size
          const pageSizes: Record<string, { width: number; height: number }> = {
            a4: { width: 595, height: 842 },
            letter: { width: 612, height: 792 },
            legal: { width: 612, height: 1008 },
          };
          const pageSize = pageSizes[this._exportOptions.pageSize || 'a4'];
          const isLandscape = this._exportOptions.pageOrientation === 'landscape';
          const pageWidth = isLandscape ? pageSize.height : pageSize.width;
          const pageHeight = isLandscape ? pageSize.width : pageSize.height;

          const margin = 40;
          const contentWidth = pageWidth - margin * 2;
          const fontSize = this._exportOptions.fontSize || 10;
          const headerFontSize = this._exportOptions.headerFontSize || 12;
          const rowHeight = 20;
          const headerHeight = 25;
          const numColumns = this._columnHeaders.length + (this._hasGroupedItems ? 1 : 0);
          const colWidth = contentWidth / numColumns;

          // Helper function to draw headers, including pre-header if enabled
          const drawHeaders = (ctx: any, startY: number): number => {
            let currentY = startY;

            // Use header offsets from options or fallback to defaults
            const headerTextOffset =
              typeof this._exportOptions.headerTextOffset === 'number'
                ? this._exportOptions.headerTextOffset
                : (DEFAULT_EXPORT_OPTIONS.headerTextOffset as number);
            const headerBackgroundOffset =
              typeof this._exportOptions.headerBackgroundOffset === 'number'
                ? this._exportOptions.headerBackgroundOffset
                : (DEFAULT_EXPORT_OPTIONS.headerBackgroundOffset as number);

            // Draw pre-header row if enabled
            if (hasColumnTitlePreHeader && this._groupedColumnHeaders && this._groupedColumnHeaders.length > 0) {
              ctx.rect(margin, currentY - headerHeight + headerBackgroundOffset, contentWidth, headerHeight, '#6c757d');
              let headerX = margin + 5;
              // Offset by one cell if grouped items and groupByColumnHeader are present
              if (this._hasGroupedItems && groupByColumnHeader) {
                headerX += colWidth;
              }
              this._groupedColumnHeaders.forEach((group) => {
                if (group.title) {
                  // Center the group title over its span
                  ctx.text(
                    group.title.length > 20 ? group.title.substring(0, 20) + '...' : group.title,
                    headerX + (colWidth * group.span) / 2 - colWidth / 2,
                    currentY + headerTextOffset,
                    headerFontSize,
                    { color: '#ffffff' }
                  );
                }
                headerX += colWidth * group.span;
              });
              currentY -= headerHeight;
            }

            if (this._exportOptions.includeColumnHeaders !== false) {
              ctx.rect(margin, currentY - headerHeight + headerBackgroundOffset, contentWidth, headerHeight, '#428bca');

              let headerX = margin + 5;
              if (this._hasGroupedItems && groupByColumnHeader) {
                ctx.text(groupByColumnHeader, headerX, currentY + headerTextOffset, headerFontSize, { color: '#ffffff' });
                headerX += colWidth;
              }

              this._columnHeaders.forEach((header) => {
                const headerText = header.title.length > 20 ? header.title.substring(0, 20) + '...' : header.title;
                ctx.text(headerText, headerX, currentY + headerTextOffset, headerFontSize, { color: '#ffffff' });
                headerX += colWidth;
              });

              currentY -= headerHeight;
              currentY -= 12; // increase bottom margin after header titles, before data rows
            }
            return currentY;
          };

          let currentPageRows: any[][] = [];
          let allPages: any[][][] = [];

          // Calculate how many rows fit on first page (with title)
          let firstPageStartY = pageHeight - margin;
          if (this._exportOptions.documentTitle) {
            firstPageStartY -= 50; // space for title
          }
          const firstPageAvailableHeight = firstPageStartY - margin - headerHeight - 5;
          const firstPageMaxRows = Math.floor(firstPageAvailableHeight / rowHeight);

          // Calculate how many rows fit on subsequent pages
          const subsequentPageStartY = pageHeight - margin;
          const subsequentPageAvailableHeight = subsequentPageStartY - margin - headerHeight - 5;
          const subsequentPageMaxRows = Math.floor(subsequentPageAvailableHeight / rowHeight);

          // Split rows into pages
          tableData.forEach((row: any[]) => {
            const maxRows = allPages.length === 0 ? firstPageMaxRows : subsequentPageMaxRows;

            if (currentPageRows.length >= maxRows) {
              allPages.push(currentPageRows);
              currentPageRows = [];
            }
            currentPageRows.push(row);
          });

          // Add last page if it has rows
          if (currentPageRows.length > 0) {
            allPages.push(currentPageRows);
          }

          // Render all pages
          allPages.forEach((pageRows, pageIndex) => {
            doc.page(pageWidth, pageHeight, (ctx: any) => {
              let currentY = pageHeight - margin;

              // add document title only on first page
              if (pageIndex === 0 && this._exportOptions.documentTitle) {
                const titleSize = 16;
                currentY -= 20;
                ctx.text(this._exportOptions.documentTitle, margin, currentY, titleSize, { color: '#000000' });
                currentY -= 30;
              }

              // draw headers only on first page, or on every page if repeatHeadersOnEachPage is true
              if (pageIndex === 0 || this._exportOptions.repeatHeadersOnEachPage) {
                currentY = drawHeaders(ctx, currentY);
              }

              // draw data rows for this page
              pageRows.forEach((row: any[], localRowIndex: number) => {
                const globalRowIndex =
                  pageIndex === 0 ? localRowIndex : allPages[0].length + (pageIndex - 1) * subsequentPageMaxRows + localRowIndex;

                // alternate row background
                const backgroundOffset =
                  typeof this._exportOptions.dataRowBackgroundOffset === 'number'
                    ? this._exportOptions.dataRowBackgroundOffset
                    : (DEFAULT_EXPORT_OPTIONS.dataRowBackgroundOffset as number);
                if (globalRowIndex % 2 === 1) {
                  ctx.rect(margin, currentY - rowHeight + backgroundOffset, contentWidth, rowHeight, '#f5f5f5');
                }

                // draw row data
                let cellX = margin + 5;
                row.forEach((cell) => {
                  const cellText = String(cell || '').length > 25 ? String(cell).substring(0, 25) + '...' : String(cell || '');
                  const textOffset =
                    typeof this._exportOptions.dataRowTextOffset === 'number'
                      ? this._exportOptions.dataRowTextOffset
                      : (DEFAULT_EXPORT_OPTIONS.dataRowTextOffset as number);
                  ctx.text(cellText, cellX, currentY + textOffset, fontSize, { color: '#000000' });
                  cellX += colWidth;
                });

                currentY -= rowHeight;
              });
            });
          });

          // build and save the PDF
          const pdfBytes = doc.build();
          this.downloadPdf(pdfBytes, `${this._exportOptions.filename}.pdf`);

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
  protected getAllGridRowData(columns: Column[]): any[][] {
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
          outputData.push(this.readRegularRowData(columns, rowNumber, itemObj));
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
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

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
  protected readRegularRowData(columns: Column[], row: number, itemObj: any): any[] {
    const rowData: any[] = [];
    const itemMetadata = this._dataView.getItemMetadata(row);
    let prevColspan: number | string = 1;

    // if we are grouping and are on 1st column index, we need to skip this column since it will be used later by the grouping text
    if (this._hasGroupedItems) {
      rowData.push('');
    }

    for (let col = 0, ln = columns.length; col < ln; col++) {
      const columnDef = columns[col];

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
        let itemData = exportWithFormatterWhenDefined(row, col, columnDef, itemObj, this._grid, this._exportOptions);

        // does the user want to sanitize the output data (remove HTML tags)?
        if (columnDef.sanitizeDataExport || this._exportOptions.sanitizeDataExport) {
          itemData = stripTags(itemData);
        }

        // decode HTML entities if enabled
        if (this._exportOptions.htmlDecode) {
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

    if (this._exportOptions.addGroupIndentation) {
      groupName = addWhiteSpaces(5 * itemObj.level) + groupName;
    }

    // decode HTML entities if enabled
    if (this._exportOptions.htmlDecode) {
      groupName = htmlDecode(groupName);
    }

    return [groupName];
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
            columnDef.columnGroupKey &&
            this._gridOptions.enableTranslate &&
            this._translaterService?.translate &&
            this._translaterService?.getCurrentLanguage?.()
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
}
