import type {
  ExcelExportService as BaseExcelExportService,
  Column,
  ContainerService,
  ExcelExportOption,
  ExcelGroupValueParserArgs,
  ExportCellReader,
  ExportTranslateFn,
  ExternalResource,
  FileType,
  FormulaProvider,
  GetDataValueCallback,
  GetGroupTotalValueCallback,
  GridOption,
  KeyTitlePair,
  Locale,
  PubSubService,
  SharedService,
  SlickDataView,
  SlickGrid,
  TranslaterService,
} from '@slickgrid-universal/common';
import {
  Constants,
  createExportCellReader,
  getColumnFieldType,
  getExportColumnGroupedHeaderTitles,
  getExportColumnHeaders,
  getExportGroupByTitle,
  getExportTranslateFn,
  getGroupTotalsOutput,
  hasExportPreHeader,
  isColumnDateType,
  isColumnExported,
} from '@slickgrid-universal/common';
import { addWhiteSpaces, createDomElement, extend, htmlDecode, isEmptyObject, stripTags } from '@slickgrid-universal/utils';
import {
  createExcelFileStream,
  createWorkbook,
  downloadExcelFile,
  Workbook,
  type ExcelColumnMetadata,
  type ExcelMetadata,
  type StyleSheet,
  type Worksheet,
} from 'excel-builder-vanilla';
import { getExcelFormatFromGridFormatter, getGroupTotalValue, useCellFormatByFieldType, type ExcelFormatter } from './excelUtils.js';

interface WorkbookWithFormulas {
  addCustomFunction?: (name: string, args: string[], body: string, options?: any) => void;
  addDefinedName?: (name: string, refersTo: string, scope?: number | string) => void;
}

interface RegularCellExcelFormat {
  excelFormatId?: number;
  getDataValueParser: GetDataValueCallback;
}

interface ExcelColumnExportCache {
  cellStyleFormat?: RegularCellExcelFormat;
  exportOptions: ExcelExportOption;
  /** formatted cell reader (formatter output or raw value) */
  readCell: ExportCellReader;
  sanitizeDataExport: boolean;
}

const DEFAULT_EXPORT_OPTIONS: ExcelExportOption = {
  filename: 'export',
  format: 'xlsx',
  htmlDecode: true,
  useStreamingExport: true,
};

export class ExcelExportService implements ExternalResource, BaseExcelExportService {
  protected _fileFormat: Extract<FileType, 'xls' | 'xlsx'> = 'xlsx';
  protected _grid!: SlickGrid;
  protected _dataView!: SlickDataView;
  protected _locales!: Locale;
  protected _groupedColumnHeaders?: Array<KeyTitlePair>;
  protected _columnHeaders: Array<KeyTitlePair> = [];
  protected _hasColumnTitlePreHeader = false;
  protected _hasGroupedItems = false;
  protected _excelExportOptions!: ExcelExportOption;
  protected _sheet!: Worksheet;
  protected _stylesheet!: StyleSheet;
  protected _stylesheetFormats: any;
  protected _pubSubService: PubSubService | null = null;
  protected _sharedService: SharedService | null = null;
  protected _translaterService: TranslaterService | undefined;
  protected _workbook!: Workbook;
  protected _timer1?: any;
  protected _timer2?: any;
  protected _formulaProvider?: FormulaProvider;
  protected _formulaColumnIds: Array<number | string> = [];
  protected _formulaRowIds: Array<number | string> = [];

  // references of each detected cell and/or group total formats
  protected _regularCellExcelFormats: { [fieldId: string]: RegularCellExcelFormat } = Object.create(null);
  protected _groupTotalExcelFormats: {
    [fieldId: string]: { groupType: string; excelFormat?: ExcelFormatter; getGroupTotalParser?: GetGroupTotalValueCallback };
  } = Object.create(null);

  /** ExcelExportService class name which is use to find service instance in the external registered services */
  readonly pluginName = 'ExcelExportService';

  protected get _datasetIdPropName(): string {
    return this._gridOptions?.datasetIdPropertyName ?? 'id';
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return this._grid?.getOptions() || ({} as GridOption);
  }

  protected get _shouldExportVariableRowHeights(): boolean {
    return !!(this._gridOptions.enableVariableRowHeight && this._excelExportOptions.includeVariableRowHeight !== false);
  }

  /** translate function, only defined when translation is enabled */
  protected get _translate(): ExportTranslateFn {
    return getExportTranslateFn(this._gridOptions, this._translaterService);
  }

  get stylesheet(): StyleSheet {
    return this._stylesheet;
  }

  get stylesheetFormats(): any {
    return this._stylesheetFormats;
  }

  get groupTotalExcelFormats(): any {
    return this._groupTotalExcelFormats;
  }

  get regularCellExcelFormats(): any {
    return this._regularCellExcelFormats;
  }

  dispose(): void {
    clearTimeout(this._timer1);
    clearTimeout(this._timer2);
    this._pubSubService?.unsubscribeAll();

    // Clear critical memory leak references
    this._grid = null as any;
    this._dataView = null as any;
    this._pubSubService = null;
    this._sharedService = null;
    this._translaterService = undefined;
    this._formulaProvider = undefined;
    this._formulaColumnIds = [];
    this._formulaRowIds = [];
    this._regularCellExcelFormats = Object.create(null);
    this._groupTotalExcelFormats = Object.create(null);
  }

  /**
   * Initialize the Export Service
   * @param grid
   * @param containerService
   */
  init(grid: SlickGrid, containerService: ContainerService): void {
    this._grid = grid;
    this._dataView = grid?.getData<SlickDataView>() || {};
    this._pubSubService = containerService.get<PubSubService>('PubSubService');
    this._sharedService = containerService.get<SharedService>('SharedService');

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
   * Export the current grid data to Excel (WYSIWYG).
   *
   * Notes:
   * - Column order must match the grid.
   * - For large datasets, processing yields periodically to keep the UI responsive.
   *
   * Events:
   * - 'onBeforeExportToExcel' before export starts
   * - 'onAfterExportToExcel' after export completes or fails
   */
  async exportToExcel(options?: ExcelExportOption): Promise<boolean> {
    if (!this._grid || !this._dataView || !this._pubSubService) {
      throw new Error(
        '[Slickgrid-Universal] it seems that the SlickGrid & DataView objects and/or PubSubService are not initialized did you forget to enable the grid option flag "enableExcelExport"?'
      );
    }

    this._pubSubService?.publish('onBeforeExportToExcel', true);
    const exportStartTime = Date.now();
    this._excelExportOptions = extend(true, {}, { ...DEFAULT_EXPORT_OPTIONS, ...this._gridOptions.excelExportOptions, ...options });
    this._fileFormat = this._excelExportOptions.format || 'xlsx';
    const useStreamingExport = !!this._excelExportOptions.useStreamingExport;

    // reset references of detected Excel formats
    this._regularCellExcelFormats = Object.create(null);
    this._groupTotalExcelFormats = Object.create(null);

    // prepare the Excel Workbook & Sheet
    const worksheetOptions = { name: this._excelExportOptions.sheetName || 'Sheet1' };
    this._workbook = this.createWorkbookInstance();
    this._sheet = this._workbook.createWorksheet(worksheetOptions);

    // add any Excel Format/Stylesheet to current Workbook
    this._stylesheet = this._workbook.getStyleSheet();

    // create some common default Excel formatters that will be used
    const boldFormat = this._stylesheet.createFormat({ font: { bold: true } });
    const stringFormat = this._stylesheet.createFormat({ format: '@' });
    const numberFormat = this._stylesheet.createFormat({ format: '0' });
    this._stylesheetFormats = Object.assign(Object.create(null), { boldFormat, numberFormat, stringFormat });
    this._sheet.setColumnFormats([boldFormat]);

    try {
      if (this._gridOptions?.excelExportOptions?.customExcelHeader) {
        this._gridOptions.excelExportOptions.customExcelHeader(this._workbook, this._sheet);
      }

      // get all data by reading all DataView rows with yielding for responsiveness
      const dataOutput = await this.getDataOutputAsync();

      const columns = this.getColumns();
      this._sheet.setColumns(this.getColumnStyles(columns));

      const currentSheetData = this._sheet.data;
      let finalOutput = currentSheetData;
      if (Array.isArray(currentSheetData) && Array.isArray(dataOutput)) {
        finalOutput = this._sheet.data.concat(dataOutput);
      }

      this._sheet.setData(finalOutput);

      this._workbook.addWorksheet(this._sheet);

      // MIME type could be undefined, if that's the case we'll detect the type by its file extension
      // user could also provide its own mime type, if however an empty string is provided we will consider to be without any MIME type)
      let mimeType = this._excelExportOptions?.mimeType;
      if (mimeType === undefined) {
        mimeType =
          this._fileFormat === 'xls' ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      const filename = `${this._excelExportOptions.filename}.${this._fileFormat}`;

      if (this._fileFormat === 'xlsx' && useStreamingExport) {
        try {
          const stream = createExcelFileStream(this._workbook);
          const chunks: Uint8Array[] = [];
          for await (const chunk of stream as AsyncIterable<Uint8Array>) {
            chunks.push(chunk);
          }

          const blob = new Blob(chunks as BlobPart[], { type: mimeType });
          const url = URL.createObjectURL(blob);

          // download with anchor tag
          const a = createDomElement('a', { href: url, download: filename }, document.body);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this._pubSubService?.publish('onAfterExportToExcel', { filename, mimeType, durationMs: Date.now() - exportStartTime });
          return true;
        } catch {
          // fallback to legacy export if streaming is not supported
          return await this.legacyExcelExportAsync(filename, mimeType, exportStartTime);
        }
      } else {
        // fallback to legacy export for non-xlsx or if useStreamingExport is false
        return await this.legacyExcelExportAsync(filename, mimeType, exportStartTime);
      }
    } /** v8 ignore next */ catch (error) {
      console.error('Excel export failed:', error);
      this._pubSubService?.publish('onAfterExportToExcel', { error, durationMs: Date.now() - exportStartTime });
      return false;
    }
  }

  /**
   * Takes a positive integer and returns the corresponding column name.
   * dealing with the Excel column position is a bit tricky since the first 26 columns are single char (A,B,...) but after that it becomes double char (AA,AB,...)
   * so we must first see if we are in the first section of 26 chars, if that is the case we just concatenate 1 (1st row) so it becomes (A1, B1, ...)
   * and again if we go 26, we need to add yet again an extra prefix (AA1, AB1, ...) and so goes the cycle
   * @param {number} colIndex - The positive integer to convert to a column name.
   * @return {string}  The column name.
   */
  getExcelColumnNameByIndex(colIndex: number): string {
    const letters = 'ZABCDEFGHIJKLMNOPQRSTUVWXY';

    let nextPos = Math.floor(colIndex / 26);
    const lastPos = Math.floor(colIndex % 26);
    if (lastPos === 0) {
      nextPos--;
    }

    if (colIndex > 26) {
      return this.getExcelColumnNameByIndex(nextPos) + letters[lastPos];
    }

    return letters[lastPos] + '';
  }

  // -----------------------
  // protected functions
  // -----------------------

  /** get columns might include hidden columns when `includeHidden` is enabled */
  protected getColumns(): Column[] {
    const includeHidden = !!this._excelExportOptions?.includeHidden;
    return this._grid?.getColumnsInRenderedOrder(includeHidden) ?? [];
  }

  /**
   * Async version of getDataOutput with yielding for UI responsiveness during large dataset processing
   */
  protected async getDataOutputAsync(): Promise<Array<string[] | ExcelColumnMetadata[]>> {
    const columns = this.getColumns();
    this._formulaProvider = this.findFormulaProvider();
    this.registerFormulaProviderWorkbookArtifacts();
    this._formulaColumnIds = columns.filter((col) => !col.excludeFromExport).map((col) => col.id);
    this._formulaRowIds = this._formulaProvider ? this.getAllDataRowIds() : [];
    const columnMetadataCache = this.preCalculateColumnMetadata(columns);

    // pre-cache detected cell format/parser once per column to avoid repeated checks in row loop
    this.cacheRegularCellExcelFormats(columns, columnMetadataCache);

    // data variable which will hold all the fields data of a row
    const outputData: Array<string[] | ExcelColumnMetadata[]> = [];
    const gridExportOptions = this._gridOptions?.excelExportOptions;
    const columnHeaderStyle = gridExportOptions?.columnHeaderStyle;
    let columnHeaderStyleId = this._stylesheetFormats.boldFormat.id;
    if (columnHeaderStyle) {
      columnHeaderStyleId = this._stylesheet.createFormat(columnHeaderStyle).id;
    }

    // get all Grouped Column Header Titles when defined (from pre-header row)
    if (hasExportPreHeader(this._gridOptions)) {
      // when having Grouped Header Titles (in the pre-header), then make the cell Bold & Aligned Center
      const boldCenterAlign = this._stylesheet.createFormat({ alignment: { horizontal: 'center' }, font: { bold: true } });
      outputData.push(this.getColumnGroupedHeaderTitlesData(columns, { style: boldCenterAlign?.id }));
      this._hasColumnTitlePreHeader = true;
    }

    // get all Column Header Titles (it might include a "Group by" title at A1 cell)
    // also style the headers, defaults to Bold but user could pass his own style
    outputData.push(this.getColumnHeaderData(columns, { style: columnHeaderStyleId }));

    // Populate the rest of the Grid Data by reading directly from DataView with yielding for responsiveness
    await this.pushAllGridRowDataToArrayAsync(outputData, columns, columnMetadataCache);

    return outputData;
  }

  /** Get each column style including a style for the width of each column */
  protected getColumnStyles(columns: Column[]): any[] {
    const defaultColumnWidth = this._excelExportOptions.customColumnWidth ?? 10;
    const includeColumnWidth = this._excelExportOptions.includeColumnWidth === true;
    const grouping = this._dataView.getGrouping();
    const columnStyles = [];
    if (Array.isArray(grouping) && grouping.length > 0) {
      columnStyles.push({
        bestFit: true,
        columnStyles: defaultColumnWidth,
      });
    }

    columns.filter(isColumnExported).forEach((columnDef: Column) => {
      const width =
        columnDef.excelExportOptions?.width ??
        (includeColumnWidth && typeof columnDef.width === 'number' ? this.convertPixelToExcelWidth(columnDef.width) : undefined);

      columnStyles.push({
        bestFit: true,
        width: width ?? defaultColumnWidth,
      });
    });
    return columnStyles;
  }

  /** Convert grid column width in pixels to Excel column width units. */
  protected convertPixelToExcelWidth(pixelWidth: number): number {
    if (!Number.isFinite(pixelWidth) || pixelWidth <= 0) {
      return 0;
    }

    // Excel width is not pixel-based. This approximation mirrors common Calibri 11 behavior.
    const excelWidth = pixelWidth <= 12 ? pixelWidth / 12 : (pixelWidth - 5) / 7;
    return this.roundTo2Decimals(excelWidth);
  }

  /** Convert pixels to Excel points (72 DPI / 96 DPI = 0.75). */
  protected convertPixelToExcelPoint(pixelValue: number): number {
    return this.roundTo2Decimals(pixelValue * 0.75);
  }

  /** Round numeric values to 2 decimal places for stable export output. */
  protected roundTo2Decimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Get all Grouped Header Titles and their keys, translate the title when required, and format them in Bold
   * @param {Array<Object>} columns - grid column definitions
   * @param {Object} metadata - Excel metadata
   * @returns {Object} array of Excel cell format
   */
  protected getColumnGroupedHeaderTitlesData(columns: Column[], metadata: ExcelMetadata): Array<ExcelColumnMetadata> {
    let colspanStartIndex = 0;
    let headerOffset = 0; // increases when "Group by" is provided in the next header row
    let outputGroupedHeaderTitles: Array<ExcelColumnMetadata> = [];
    const groupedHeaderRowNumber = this.getWorksheetReservedRowCount() + 1;

    if (this.getGroupColumnTitle()) {
      outputGroupedHeaderTitles.push({ value: '' });
      headerOffset = 1;
    }

    // get all Column Header Titles
    this._groupedColumnHeaders = this.getColumnGroupedHeaderTitles(columns) || [];
    if (Array.isArray(this._groupedColumnHeaders) && this._groupedColumnHeaders.length > 0) {
      // add the header row + add a new line at the end of the row
      outputGroupedHeaderTitles.push(...this._groupedColumnHeaders.map((header) => ({ value: header.title, metadata })));
    }

    // merge necessary cells (any grouped header titles)
    const headersLn = this._groupedColumnHeaders.length;
    for (let cellIndex = 0; cellIndex < headersLn; cellIndex++) {
      if (
        cellIndex + 1 === headersLn ||
        (cellIndex + 1 < headersLn && this._groupedColumnHeaders[cellIndex].title !== this._groupedColumnHeaders[cellIndex + 1].title)
      ) {
        const leftExcelColumnChar = this.getExcelColumnNameByIndex(colspanStartIndex + 1 + headerOffset);
        const rightExcelColumnChar = this.getExcelColumnNameByIndex(cellIndex + 1 + headerOffset);
        this._sheet.mergeCells(`${leftExcelColumnChar}${groupedHeaderRowNumber}`, `${rightExcelColumnChar}${groupedHeaderRowNumber}`);

        // next group starts 1 column index away
        colspanStartIndex = cellIndex + 1;
      }
    }

    return outputGroupedHeaderTitles;
  }

  /** Get all column headers and format them in Bold */
  protected getColumnHeaderData(columns: Column[], metadata: ExcelMetadata): Array<ExcelColumnMetadata> {
    let outputHeaderTitles: Array<ExcelColumnMetadata> = [];

    // get all Column Header Titles
    this._columnHeaders = this.getColumnHeaders(columns) || [];
    if (this._columnHeaders && Array.isArray(this._columnHeaders) && this._columnHeaders.length > 0) {
      // add the header row + add a new line at the end of the row
      outputHeaderTitles = this._columnHeaders.map((header) => ({ value: htmlDecode(stripTags(header.title)), metadata }));
    }

    // do we have a Group by title?
    const groupTitle = this.getGroupColumnTitle();
    if (groupTitle) {
      outputHeaderTitles.unshift({ value: groupTitle, metadata });
    }

    return outputHeaderTitles;
  }

  protected getGroupColumnTitle(): string | null {
    // get grouped column titles and if found, we will add a "Group by" column at the first column index
    const grouping = this._dataView.getGrouping();
    this._hasGroupedItems = Array.isArray(grouping) && grouping.length > 0;
    return this._hasGroupedItems
      ? getExportGroupByTitle(this._excelExportOptions?.groupingColumnHeaderTitle, this._gridOptions, this._translate, this._locales)
      : null;
  }

  /**
   * Get all Grouped Header Titles and their keys, translate the title when required.
   * @param {Array<object>} columns of the grid
   */
  protected getColumnGroupedHeaderTitles(columns: Column[]): Array<KeyTitlePair> {
    return getExportColumnGroupedHeaderTitles(columns, this._translate);
  }

  /**
   * Get all header titles and their keys, translate the title when required.
   * @param {Array<object>} columns of the grid
   */
  protected getColumnHeaders(columns: Column[]): Array<KeyTitlePair> | null {
    return getExportColumnHeaders(columns, this._translate);
  }

  /**
   * Get all the grid row data and return that as an output string
   * Async version of pushAllGridRowDataToArray with yielding for UI responsiveness during large dataset processing.
   * Processes rows directly from DataView with periodic yielding for responsiveness.
   */
  protected async pushAllGridRowDataToArrayAsync(
    originalDaraArray: Array<Array<string | ExcelColumnMetadata | number>>,
    columns: Column[],
    columnMetadataCache?: Map<string, ExcelColumnExportCache>
  ): Promise<Array<Array<string | ExcelColumnMetadata | number>>> {
    const dataView = this._dataView;
    const lineCount = dataView.getLength();
    const cachedColumnMetadata = columnMetadataCache ?? this.preCalculateColumnMetadata(columns);
    const datasetIdPropName = this._datasetIdPropName;

    // Yield periodically based on dataset size
    const YIELD_FREQUENCY = lineCount < 1000 ? 0 : lineCount < 10000 ? 1000 : 500;

    // Update the hasGroupedItems flag from current grouping
    const grouping = dataView.getGrouping();
    this._hasGroupedItems = Array.isArray(grouping) && grouping.length > 0;

    // Read rows directly from DataView
    for (let rowNumber = 0; rowNumber < lineCount; rowNumber++) {
      const itemObj = dataView.getItem(rowNumber);
      let rowWasExported = false;

      // make sure we have a filled object AND that the item doesn't include the "getItem" method
      // this happen could happen with an opened Row Detail as it seems to include an empty Slick DataView (we'll just skip those lines)
      if (itemObj && !itemObj.hasOwnProperty('getItem')) {
        // Normal row (not grouped by anything) would have an ID which was predefined in the Grid Columns definition
        if (itemObj[datasetIdPropName] !== null && itemObj[datasetIdPropName] !== undefined) {
          // Read a regular row, its Excel row number comes after all the rows already exported (including header rows)
          originalDaraArray.push(
            this.readRegularRowData(columns, rowNumber, itemObj, rowNumber, cachedColumnMetadata, originalDaraArray.length + 1)
          );
          rowWasExported = true;
        } else if (this._hasGroupedItems && itemObj.__groupTotals === undefined) {
          // get the group row
          originalDaraArray.push([this.readGroupedRowTitle(itemObj)]);
          rowWasExported = true;
        } else if (itemObj.__groupTotals) {
          // else if the row is a Group By and we have aggregators, then a property of '__groupTotals' would exist under that object
          originalDaraArray.push(this.readGroupedTotalRows(columns, itemObj, rowNumber));
          rowWasExported = true;
        }

        if (rowWasExported && this._shouldExportVariableRowHeights) {
          this.applyVariableRowHeight(rowNumber, originalDaraArray.length);
        }
      }

      // Yield to event loop
      if (YIELD_FREQUENCY > 0 && rowNumber > 0 && rowNumber % YIELD_FREQUENCY === 0) {
        await this.efficientYield();
      }
    }

    return originalDaraArray;
  }

  /** OPTIMIZATION: Pre-calculate column metadata to avoid repeated calculations */
  protected preCalculateColumnMetadata(columns: Column[]): Map<string, ExcelColumnExportCache> {
    const cache = new Map<string, ExcelColumnExportCache>();

    for (const columnDef of columns) {
      if (!columnDef.excludeFromExport) {
        // date columns are exported with their formatter unless it's explicitly disabled on the column,
        // sanitization is skipped by the cell reader since it's done later in the excel export flow
        const exportOptions = { ...this._excelExportOptions, sanitizeDataExport: false };
        if (columnDef.exportWithFormatter !== false && isColumnDateType(getColumnFieldType(columnDef))) {
          exportOptions.exportWithFormatter = true;
        }

        cache.set(String(columnDef.id), {
          exportOptions,
          readCell: createExportCellReader(columnDef, this._grid, exportOptions, true),
          sanitizeDataExport: !!(columnDef.sanitizeDataExport || this._excelExportOptions.sanitizeDataExport),
        });
      }
    }

    return cache;
  }

  /** OPTIMIZATION: Cache regular cell formatters once per column before processing all rows */
  protected cacheRegularCellExcelFormats(columns: Column[], columnMetadataCache: Map<string, ExcelColumnExportCache>): void {
    for (const columnDef of columns) {
      if (columnDef.excludeFromExport || columnDef.id == null) {
        continue;
      }

      const columnId = String(columnDef.id);
      if (!this._regularCellExcelFormats[columnId]) {
        const cellStyleFormat = this.getRegularCellExcelFormat(columnDef);
        const columnMetadata = columnMetadataCache.get(columnId);
        if (columnMetadata) {
          columnMetadata.cellStyleFormat = cellStyleFormat;
        }
      }
    }
  }

  /**
   * Get the Excel format & value parser of a regular cell, auto-detected from the column (unless the user provides his own)
   * and cached by column id, so the detection is only done once per column
   */
  protected getRegularCellExcelFormat(columnDef: Column): RegularCellExcelFormat {
    const columnId = String(columnDef.id);
    let cellStyleFormat = this._regularCellExcelFormats[columnId];
    if (!cellStyleFormat) {
      const autoDetectCellFormat = columnDef.excelExportOptions?.autoDetectCellFormat ?? this._excelExportOptions?.autoDetectCellFormat;
      cellStyleFormat = useCellFormatByFieldType(this._stylesheet, this._stylesheetFormats, columnDef, this._grid, autoDetectCellFormat);

      // user could also override style and/or valueParserCallback
      if (columnDef.excelExportOptions?.style) {
        cellStyleFormat.excelFormatId = this._stylesheet.createFormat(columnDef.excelExportOptions.style).id;
      }
      if (columnDef.excelExportOptions?.valueParserCallback) {
        cellStyleFormat.getDataValueParser = columnDef.excelExportOptions.valueParserCallback;
      }
      this._regularCellExcelFormats[columnId] = cellStyleFormat;
    }
    return cellStyleFormat;
  }

  /** Fast path for non-formatter columns, mirrors raw-value behavior from formatter utilities. */
  protected getRawCellValue(itemObj: any, fieldProperty: string): string | number | Date {
    let output = itemObj?.hasOwnProperty(fieldProperty) ? itemObj[fieldProperty] : '';

    if (output == null || (typeof output === 'object' && !(output instanceof Date) && isEmptyObject(output))) {
      output = '';
    }

    return output;
  }

  /** OPTIMIZATION: Efficient yielding - use the fastest available method */
  protected async efficientYield(): Promise<void> {
    // Use scheduler.postTask if available (Chrome 94+) - fastest
    if (typeof (globalThis as any).scheduler?.postTask === 'function') {
      return new Promise((resolve) => {
        (globalThis as any).scheduler.postTask(resolve, { priority: 'user-blocking' });
      });
    }

    // Use setTimeout(0) - most reliable and often fastest
    return new Promise((resolve) => {
      clearTimeout(this._timer2);
      this._timer2 = setTimeout(resolve, 0);
    });
  }

  /** Apply one variable row height only when it differs from the grid default row height. */
  protected applyVariableRowHeight(row: number, excelRowNumber: number): void {
    const pixelHeight = this._grid.getRowHeight(row);
    const defaultRowHeight = this._gridOptions.rowHeight;

    if (pixelHeight == null || pixelHeight <= 0 || pixelHeight === defaultRowHeight) {
      return;
    }

    const excelHeight = this.convertPixelToExcelPoint(pixelHeight);
    this._sheet.setRowInstructions(excelRowNumber, { height: excelHeight });
  }

  /**
   * Get the data of a regular row (a row without grouping)
   * @param {Array<Object>} columns - column definitions
   * @param {Number} row - row index
   * @param {Object} itemObj - item datacontext object
   * @param {Number} dataRowIdx - data row index
   * @param {Map} [columnMetadataCache] - pre-calculated metadata of every column
   * @param {Number} [excelRowNumber] - Excel row number of this row (used by cell merges), defaults to the grid row + header row(s)
   */
  protected readRegularRowData(
    columns: Column[],
    row: number,
    itemObj: any,
    dataRowIdx: number,
    columnMetadataCache?: Map<string, ExcelColumnExportCache>,
    excelRowNumber?: number
  ): string[] {
    const cachedColumnMetadata = columnMetadataCache ?? this.preCalculateColumnMetadata(columns);
    const gridOptions = this._gridOptions;
    const rowOutputStrings = [];
    const columnsLn = columns.length;
    let prevColspan: number | string = 1;
    let colspanStartExcelCol = 1;
    // cell merges use the Excel row & column positions, Excel rows start at 2 (or at 3 when there's a pre-header row)
    // and the 1st Excel column is used by the grouping text when grouping:: Group by [columnX]
    const excelRow = excelRowNumber ?? row + (this._hasColumnTitlePreHeader ? 3 : 2);
    let excelCol = this._hasGroupedItems ? 1 : 0;
    const itemMetadata = this._dataView.getItemMetadata(row);

    if (this._hasGroupedItems) {
      rowOutputStrings.push('');
    }

    for (let col = 0; col < columnsLn; col++) {
      const columnDef = columns[col];

      // skip excluded column, a column with a width of 0 is also considered hidden and isn't exported (same as its header)
      if (!isColumnExported(columnDef)) {
        continue;
      }
      excelCol++;

      // when using rowspan
      let rowspan = 1;
      if (gridOptions.enableCellRowSpan) {
        const prs = this._grid.getParentRowSpanByCell(row, col, false);
        if (prs) {
          if (prs.start === row) {
            rowspan = prs.end - prs.start + 1;
          } else {
            // skip any rowspan child cell since it was already merged
            rowOutputStrings.push('');
            continue;
          }
        }
      }

      // when using colspan (it could be a number or a "*" when spreading the entire row)
      let colspan = 1;
      let colspanColumnId;
      if (itemMetadata?.columns) {
        const metadata = itemMetadata.columns;
        const columnData = metadata[columnDef.id] || metadata[col];
        if (!((!isNaN(prevColspan as number) && +prevColspan > 1) || prevColspan === '*')) {
          prevColspan = columnData?.colspan ?? 1;
          colspanStartExcelCol = excelCol;
        }
        if (prevColspan === '*') {
          // number of exported columns left to span, including the current one
          colspan = columns.slice(col).filter(isColumnExported).length;
        } else {
          colspan = prevColspan as number;
          if (columnDef.id in metadata || col in metadata) {
            colspanColumnId = columnDef.id;
            colspanStartExcelCol = excelCol;
          }
        }
      }

      // when using grid with rowspan without any colspan, we will merge some cells on single column
      if (rowspan > 1 && !isNaN(prevColspan as number) && +prevColspan === 1 && columnDef.id === colspanColumnId) {
        // -- Merge Data RowSpan only
        const excelColumnChar = this.getExcelColumnNameByIndex(excelCol);
        this._sheet.mergeCells(`${excelColumnChar}${excelRow}`, `${excelColumnChar}${excelRow + rowspan - 1}`);
      }

      // when using grid with colspan, we will merge some cells together
      if (
        (prevColspan === '*' && excelCol > colspanStartExcelCol) ||
        (!isNaN(prevColspan as number) && +prevColspan > 1 && columnDef.id !== colspanColumnId)
      ) {
        // -- Merge Data, ColSpan and maybe RowSpan
        if (colspan === 1 || (typeof prevColspan === 'number' && colspan - 1 === 1)) {
          // merge the cells from the colspan start until the current (last spanned) column, partial span or full span (*)
          const leftExcelColumnChar = this.getExcelColumnNameByIndex(colspanStartExcelCol);
          const rightExcelColumnChar = this.getExcelColumnNameByIndex(excelCol);
          this._sheet.mergeCells(`${leftExcelColumnChar}${excelRow}`, `${rightExcelColumnChar}${excelRow + rowspan - 1}`);
        }
        if (prevColspan !== '*' || colspan > 1) {
          rowOutputStrings.push(''); // clear cell that won't be shown by a cell merge
        }

        // decrement colspan until we reach colspan of 1 then proceed with cell merge OR full row merge when colspan is (*)
        if (typeof prevColspan === 'number' && !isNaN(prevColspan as number) && +prevColspan > 1) {
          colspan = prevColspan--;
        }
      } else {
        let itemData: Date | number | string | undefined;
        const columnId = String(columnDef.id);
        const columnCachedData = cachedColumnMetadata.get(columnId);

        // -- Read Data & Push to Data Array
        // user might want to export with Formatter, and/or auto-detect Excel format, and/or export as regular cell data

        // Try cache first if enabled; on miss (or when cache is disabled), use the existing formatter/raw path.
        if (gridOptions.enableFormattedDataCache) {
          itemData = this._dataView.getFormattedCellValue(dataRowIdx, columnId, undefined, itemObj);
        }

        if (itemData === undefined) {
          itemData = columnCachedData
            ? columnCachedData.readCell(row, col, itemObj)
            : this.getRawCellValue(itemObj, String(columnDef.field || columnDef.id));
        }

        // auto-detect best possible Excel format, unless the user provide his own formatting,
        // we only do this check once per column (everything after that will be pull from temp ref)
        const cellStyleFormat = columnCachedData?.cellStyleFormat ?? this.getRegularCellExcelFormat(columnDef);

        // sanitize early, when enabled, any HTML tags (remove HTML tags)
        if (typeof itemData === 'string') {
          if (columnCachedData?.sanitizeDataExport) {
            itemData = stripTags(itemData as string);
          }
          if (this._excelExportOptions.htmlDecode) {
            itemData = htmlDecode(itemData);
          }
        }

        const { excelFormatId, getDataValueParser } = cellStyleFormat;
        const formulaValue = this.getCellFormulaForExcel(itemObj, columnDef, dataRowIdx);
        if (formulaValue !== undefined) {
          rowOutputStrings.push({ value: formulaValue, metadata: { type: 'formula', style: excelFormatId } });
        } else {
          const parsedItemData = getDataValueParser(itemData, {
            columnDef,
            excelFormatId,
            stylesheet: this._stylesheet,
            gridOptions,
            dataRowIdx,
            dataContext: itemObj,
          }) as Date | number | string | ExcelColumnMetadata;

          rowOutputStrings.push(parsedItemData);
        }
      }
    }

    return rowOutputStrings as string[];
  }

  /** Return a normalized Excel formula when a formula provider is available and the current row has an id. */
  protected getCellFormulaForExcel(itemObj: any, columnDef: Column, dataRowIdx: number): string | undefined {
    // grouped exports currently rely on row-level parser callbacks for deterministic row offsets.
    if (!this._formulaProvider || this._hasGroupedItems) {
      return undefined;
    }

    const rowId = itemObj?.[this._datasetIdPropName] as number | string | undefined;
    if (rowId === undefined || rowId === null) {
      return undefined;
    }

    let formula = this._formulaProvider.getExcelFormula?.({
      columnId: columnDef.id,
      columnIds: this._formulaColumnIds,
      dataRowIdx,
      datasetIdPropertyName: this._datasetIdPropName,
      excelRowOffset: this.getExcelDataStartRowOffset(),
      gridOptions: this._gridOptions,
      rowId,
      rowIds: this._formulaRowIds,
    });

    if (!formula && this._formulaProvider.hasFormula?.(rowId, columnDef.id)) {
      formula = this._formulaProvider.getFormula?.(rowId, columnDef.id);
    }

    if (typeof formula !== 'string') {
      return undefined;
    }

    return formula.startsWith('=') ? formula.slice(1) : formula;
  }

  /** Find first registered external resource that exposes formula provider methods. */
  protected findFormulaProvider(): FormulaProvider | undefined {
    if (this._gridOptions?.enableFormulas === false) {
      return undefined;
    }

    const registeredResources = this._sharedService?.externalRegisteredResources;
    if (!Array.isArray(registeredResources)) {
      return undefined;
    }

    return registeredResources.find((resource) => {
      const ref = resource as FormulaProvider;
      return (
        typeof ref?.getExcelFormula === 'function' ||
        typeof ref?.getFormula === 'function' ||
        typeof ref?.getExcelCustomFunctions === 'function' ||
        typeof ref?.getExcelDefinedNames === 'function'
      );
    }) as FormulaProvider | undefined;
  }

  /** Register workbook-level defined names and custom functions exposed by FormulaProvider. */
  protected registerFormulaProviderWorkbookArtifacts(): void {
    if (!this._formulaProvider || !this._workbook) {
      return;
    }

    const workbook = this._workbook as WorkbookWithFormulas;
    const definedNames = this._formulaProvider.getExcelDefinedNames?.() ?? [];
    const customFunctions = this._formulaProvider.getExcelCustomFunctions?.() ?? [];

    if (typeof workbook.addDefinedName === 'function') {
      for (const definedName of definedNames) {
        if (!definedName?.name || !definedName?.refersTo) {
          continue;
        }
        workbook.addDefinedName(definedName.name, definedName.refersTo, definedName.scope);
      }
    }

    if (typeof workbook.addCustomFunction === 'function') {
      for (const customFunction of customFunctions) {
        if (!customFunction?.name || !Array.isArray(customFunction.args) || !customFunction?.body) {
          continue;
        }
        workbook.addCustomFunction(customFunction.name, customFunction.args, customFunction.body, customFunction.options);
      }
    }
  }

  /** Return all row ids from DataView for formula reference translation (flat dataset use case). */
  protected getAllDataRowIds(): Array<number | string> {
    const rowIds: Array<number | string> = [];
    const datasetIdPropertyName = this._datasetIdPropName;
    const itemCount = this._dataView.getLength?.() ?? 0;

    for (let rowIdx = 0; rowIdx < itemCount; rowIdx++) {
      const item = this._dataView.getItem(rowIdx);
      const rowId = item?.[datasetIdPropertyName] as number | string | undefined;
      if (rowId !== undefined && rowId !== null) {
        rowIds.push(rowId);
      }
    }

    return rowIds;
  }

  /** Return number of worksheet rows already reserved before grid headers/data (includes merged-cell vertical spans). */
  protected getWorksheetReservedRowCount(): number {
    return Array.isArray(this._sheet?.data) ? this._sheet.data.length : 0;
  }

  /** Return default header row count generated by this service before first data row. */
  protected getDefaultExcelHeaderRowCount(): number {
    return this._hasColumnTitlePreHeader ? 2 : 1;
  }

  /** Return absolute Excel row offset for first exported dataset row. */
  protected getExcelDataStartRowOffset(): number {
    return this.getWorksheetReservedRowCount() + this.getDefaultExcelHeaderRowCount() + 1;
  }

  /** Create workbook using the factory API when available, fallback to class constructor for backward compatibility. */
  protected createWorkbookInstance(): Workbook {
    return typeof createWorkbook === 'function' ? (createWorkbook() as Workbook) : new Workbook();
  }

  /**
   * Get the grouped title(s) and its group title formatter, for example if we grouped by salesRep, the returned result would be:: 'Sales Rep: John Dow (2 items)'
   * @param itemObj
   */
  protected readGroupedRowTitle(itemObj: any): string {
    const groupName = htmlDecode(stripTags(itemObj.title));

    if (this._excelExportOptions?.addGroupIndentation) {
      const collapsedSymbol = this._excelExportOptions?.groupCollapsedSymbol || '⮞';
      const expandedSymbol = this._excelExportOptions?.groupExpandedSymbol || '⮟';
      const chevron = itemObj.collapsed ? collapsedSymbol : expandedSymbol;
      return chevron + ' ' + addWhiteSpaces(5 * itemObj.level) + groupName;
    }
    return groupName;
  }

  /**
   * Get the grouped totals (below the regular rows), these are set by Slick Aggregators.
   * For example if we grouped by "salesRep" and we have a Sum Aggregator on "sales", then the returned output would be:: ["Sum 123$"]
   * @param itemObj
   */
  protected readGroupedTotalRows(columns: Column[], itemObj: any, dataRowIdx: number): Array<ExcelColumnMetadata | string | number> {
    const groupingAggregatorRowText = this._excelExportOptions.groupingAggregatorRowText || '';
    const outputStrings: Array<ExcelColumnMetadata | string | number> = [groupingAggregatorRowText];

    // add every exported column (unless user wants to skip it)
    columns.filter(isColumnExported).forEach((columnDef) => {
      // if there's a exportCustomGroupTotalsFormatter or groupTotalsFormatter, we will re-run it to get the exact same output as what is shown in UI
      let itemData: number | string | ExcelColumnMetadata = columnDef.exportCustomGroupTotalsFormatter
        ? getGroupTotalsOutput(columnDef.exportCustomGroupTotalsFormatter(itemObj, columnDef, this._grid))
        : '';

      // auto-detect best possible Excel format for Group Totals, unless the user provide his own formatting,
      // we only do this check once per column (everything after that will be pull from temp ref)
      const autoDetectCellFormat = columnDef.excelExportOptions?.autoDetectCellFormat ?? this._excelExportOptions?.autoDetectCellFormat;
      if (getColumnFieldType(columnDef) === 'number' && autoDetectCellFormat !== false) {
        let groupCellFormat = this._groupTotalExcelFormats[columnDef.id];
        if (!groupCellFormat?.groupType) {
          groupCellFormat = getExcelFormatFromGridFormatter(this._stylesheet, this._stylesheetFormats, columnDef, this._grid, 'group');
          if (columnDef.groupTotalsExcelExportOptions?.style) {
            groupCellFormat.excelFormat = this._stylesheet.createFormat(columnDef.groupTotalsExcelExportOptions.style);
          }
          this._groupTotalExcelFormats[columnDef.id] = groupCellFormat;
        }

        const groupTotalParser = columnDef.groupTotalsExcelExportOptions?.valueParserCallback ?? getGroupTotalValue;
        if (itemObj[groupCellFormat.groupType]?.[columnDef.field] !== undefined) {
          const groupData = groupTotalParser(itemObj, {
            columnDef,
            groupType: groupCellFormat.groupType,
            excelFormatId: groupCellFormat.excelFormat?.id,
            stylesheet: this._stylesheet,
            dataRowIdx,
          } as ExcelGroupValueParserArgs);
          itemData =
            typeof groupData === 'object' && groupData.hasOwnProperty('metadata')
              ? groupData
              : { value: groupData, metadata: { style: groupCellFormat.excelFormat?.id } };
        }
      } else if (columnDef.groupTotalsFormatter) {
        itemData = getGroupTotalsOutput(columnDef.groupTotalsFormatter(itemObj, columnDef, this._grid));
      }

      // does the user want to sanitize the output data (remove HTML tags)?
      if (typeof itemData === 'string') {
        if (columnDef.sanitizeDataExport || this._excelExportOptions.sanitizeDataExport) {
          itemData = stripTags(itemData);
        }
        if (this._excelExportOptions.htmlDecode) {
          itemData = htmlDecode(itemData);
        }
      }
      outputStrings.push(itemData);
    });

    return outputStrings;
  }

  /** Async version of legacy Excel export fallback method */
  protected async legacyExcelExportAsync(filename: string, mimeType: string, exportStartTime?: number): Promise<boolean> {
    const startTime = exportStartTime ?? Date.now();
    try {
      await downloadExcelFile(this._workbook, filename, { mimeType });
      this._pubSubService?.publish(`onAfterExportToExcel`, { filename, mimeType, durationMs: Date.now() - startTime });
      return true;
    } catch (error) {
      console.error('Legacy Excel export failed:', error);
      this._pubSubService?.publish('onAfterExportToExcel', { error, durationMs: Date.now() - startTime });
      return false;
    }
  }
}
