import {
  downloadExcelFile,
  createExcelFileStream,
  type ExcelColumnMetadata,
  type ExcelMetadata,
  type StyleSheet,
  Workbook,
  type Worksheet,
} from 'excel-builder-vanilla';
import type {
  Column,
  ContainerService,
  ExcelExportService as BaseExcelExportService,
  ExcelExportOption,
  ExcelGroupValueParserArgs,
  ExternalResource,
  GetDataValueCallback,
  GetGroupTotalValueCallback,
  GridOption,
  KeyTitlePair,
  Locale,
  PubSubService,
  SlickDataView,
  SlickGrid,
  TranslaterService,
} from '@slickgrid-universal/common';
import {
  Constants,
  // utility functions
  exportWithFormatterWhenDefined,
  FileType,
  getColumnFieldType,
  getTranslationPrefix,
  isColumnDateType,
} from '@slickgrid-universal/common';
import { addWhiteSpaces, createDomElement, extend, getHtmlStringOutput, stripTags, titleCase } from '@slickgrid-universal/utils';

import { type ExcelFormatter, getGroupTotalValue, getExcelFormatFromGridFormatter, useCellFormatByFieldType } from './excelUtils.js';
import { WorkerManager, type WorkerManagerOptions } from './utils/workerManager.js';
import { FormatterSerializer, type WorkerChunk, type WorkerChunkResult, type WorkerProcessedRow, type WorkerRowData } from './utils/formatterSerializer.js';

const DEFAULT_EXPORT_OPTIONS: ExcelExportOption = {
  filename: 'export',
  format: FileType.xlsx,
  useStreamingExport: true, // new option, default true
  useWebWorker: true, // enable web worker by default
  workerChunkSize: 1000, // process 1000 rows per chunk
  maxConcurrentChunks: 4, // max 4 concurrent chunks
  workerFallback: true, // fallback to main thread if worker fails
};

export class ExcelExportService implements ExternalResource, BaseExcelExportService {
  protected _fileFormat: FileType | 'xls' | 'xlsx' = FileType.xlsx;
  protected _grid!: SlickGrid;
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
  protected _translaterService: TranslaterService | undefined;
  protected _workbook!: Workbook;

  // references of each detected cell and/or group total formats
  protected _regularCellExcelFormats: {
    [fieldId: string]: { excelFormatId?: number; getDataValueParser: GetDataValueCallback; };
  } = {};
  protected _groupTotalExcelFormats: {
    [fieldId: string]: { groupType: string; excelFormat?: ExcelFormatter; getGroupTotalParser?: GetGroupTotalValueCallback; };
  } = {};

  // web worker related properties
  protected _workerManager: WorkerManager | null = null;
  protected _isWorkerInitialized = false;

  /** ExcelExportService class name which is use to find service instance in the external registered services */
  readonly className = 'ExcelExportService';

  protected get _datasetIdPropName(): string {
    return this._gridOptions?.datasetIdPropertyName ?? 'id';
  }

  /** Getter of SlickGrid DataView object */
  get _dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>();
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return this._grid?.getOptions() || ({} as GridOption);
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
    this._pubSubService?.unsubscribeAll();
    this.cleanupWorker();
  }

  /**
   * Initialize the Export Service
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
   * Function to export the Grid result to an Excel CSV format using JavaScript for it to produce the CSV file.
   * This is a WYSIWYG export to file output (What You See is What You Get)
   *
   * NOTES: The column position needs to match perfectly the JSON Object position because of the way we are pulling the data,
   * which means that if any column(s) got moved in the UI, it has to be reflected in the JSON array output as well
   *
   * Example: exportToExcel({ format: FileType.csv, delimiter: DelimiterType.comma })
   */
  exportToExcel(options?: ExcelExportOption): Promise<boolean> {
    if (!this._grid || !this._dataView || !this._pubSubService) {
      throw new Error(
        '[Slickgrid-Universal] it seems that the SlickGrid & DataView objects and/or PubSubService are not initialized did you forget to enable the grid option flag "enableExcelExport"?'
      );
    }
    // wrap in a Promise so that we can add loading spinner
    return new Promise((resolve) => {
      this._pubSubService?.publish('onBeforeExportToExcel', true);
      this._excelExportOptions = extend(true, {}, { ...DEFAULT_EXPORT_OPTIONS, ...this._gridOptions.excelExportOptions, ...options });
      this._fileFormat = this._excelExportOptions.format || FileType.xlsx;
      const useStreamingExport = !!this._excelExportOptions.useStreamingExport;

      // reset references of detected Excel formats
      this._regularCellExcelFormats = {};
      this._groupTotalExcelFormats = {};

      // prepare the Excel Workbook & Sheet
      const worksheetOptions = { name: this._excelExportOptions.sheetName || 'Sheet1' };
      this._workbook = new Workbook();
      this._sheet = this._workbook.createWorksheet(worksheetOptions);

      // add any Excel Format/Stylesheet to current Workbook
      this._stylesheet = this._workbook.getStyleSheet();

      // create some common default Excel formatters that will be used
      const boldFormat = this._stylesheet.createFormat({ font: { bold: true } });
      const stringFormat = this._stylesheet.createFormat({ format: '@' });
      const numberFormat = this._stylesheet.createFormat({ format: '0' });
      this._stylesheetFormats = { boldFormat, numberFormat, stringFormat };
      this._sheet.setColumnFormats([boldFormat]);

      // Add a short delay to ensure spinner/UI updates before heavy export work begins
      setTimeout(async () => {
        // get all data by reading all DataView rows
        const dataOutput = await this.getDataOutput();

        if (this._gridOptions?.excelExportOptions?.customExcelHeader) {
          this._gridOptions.excelExportOptions.customExcelHeader(this._workbook, this._sheet);
        }

        const columns = this._grid?.getColumns() || [];
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
            this._fileFormat === FileType.xls
              ? 'application/vnd.ms-excel'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }

        const filename = `${this._excelExportOptions.filename}.${this._fileFormat}`;

        if (this._fileFormat === FileType.xlsx && useStreamingExport) {
          try {
            const stream = createExcelFileStream(this._workbook, { chunkSize: 1000 });
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
            this._pubSubService?.publish('onAfterExportToExcel', { filename, mimeType });
            resolve(true);
          } catch (err) {
            // fallback to legacy export if streaming is not supported
            this.legacyExcelExport(filename, mimeType, resolve);
          }
        } else {
          // fallback to legacy export for non-xlsx or if useStreamingExport is false
          this.legacyExcelExport(filename, mimeType, resolve);
        }
      }, 50); // delay to allow spinner to show
    });
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

  protected async getDataOutput(): Promise<Array<string[] | ExcelColumnMetadata[]>> {
    const columns = this._grid?.getColumns() || [];

    // data variable which will hold all the fields data of a row
    const outputData: Array<string[] | ExcelColumnMetadata[]> = [];
    const gridExportOptions = this._gridOptions?.excelExportOptions;
    const columnHeaderStyle = gridExportOptions?.columnHeaderStyle;
    let columnHeaderStyleId = this._stylesheetFormats.boldFormat.id;
    if (columnHeaderStyle) {
      columnHeaderStyleId = this._stylesheet.createFormat(columnHeaderStyle).id;
    }

    // get all Grouped Column Header Titles when defined (from pre-header row)
    if (this._gridOptions.createPreHeaderPanel && this._gridOptions.showPreHeaderPanel && !this._gridOptions.enableDraggableGrouping) {
      // when having Grouped Header Titles (in the pre-header), then make the cell Bold & Aligned Center
      const boldCenterAlign = this._stylesheet.createFormat({ alignment: { horizontal: 'center' }, font: { bold: true } });
      outputData.push(this.getColumnGroupedHeaderTitlesData(columns, { style: boldCenterAlign?.id }));
      this._hasColumnTitlePreHeader = true;
    }

    // get all Column Header Titles (it might include a "Group by" title at A1 cell)
    // also style the headers, defaults to Bold but user could pass his own style
    outputData.push(this.getColumnHeaderData(columns, { style: columnHeaderStyleId }));

    // Populate the rest of the Grid Data
    await this.pushAllGridRowDataToArray(outputData, columns);

    return outputData;
  }

  /** Get each column style including a style for the width of each column */
  protected getColumnStyles(columns: Column[]): any[] {
    const grouping = this._dataView.getGrouping();
    const columnStyles = [];
    if (Array.isArray(grouping) && grouping.length > 0) {
      columnStyles.push({
        bestFit: true,
        columnStyles: this._gridOptions?.excelExportOptions?.customColumnWidth ?? 10,
      });
    }

    columns.forEach((columnDef: Column) => {
      const skippedField = columnDef.excludeFromExport ?? false;
      // if column width is 0, then we consider that field as a hidden field and should not be part of the export
      if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
        columnStyles.push({
          bestFit: true,
          width: columnDef.excelExportOptions?.width ?? this._gridOptions?.excelExportOptions?.customColumnWidth ?? 10,
        });
      }
    });
    return columnStyles;
  }

  /**
   * Get all Grouped Header Titles and their keys, translate the title when required, and format them in Bold
   * @param {Array<Object>} columns - grid column definitions
   * @param {Object} metadata - Excel metadata
   * @returns {Object} array of Excel cell format
   */
  protected getColumnGroupedHeaderTitlesData(columns: Column[], metadata: ExcelMetadata): Array<ExcelColumnMetadata> {
    let outputGroupedHeaderTitles: Array<ExcelColumnMetadata> = [];

    // get all Column Header Titles
    this._groupedColumnHeaders = this.getColumnGroupedHeaderTitles(columns) || [];
    if (this._groupedColumnHeaders && Array.isArray(this._groupedColumnHeaders) && this._groupedColumnHeaders.length > 0) {
      // add the header row + add a new line at the end of the row
      outputGroupedHeaderTitles = this._groupedColumnHeaders.map((header) => ({ value: header.title, metadata }));
    }

    // merge necessary cells (any grouped header titles)
    let colspanStartIndex = 0;
    const headersLn = this._groupedColumnHeaders.length;
    for (let cellIndex = 0; cellIndex < headersLn; cellIndex++) {
      if (
        cellIndex + 1 === headersLn ||
        (cellIndex + 1 < headersLn && this._groupedColumnHeaders[cellIndex].title !== this._groupedColumnHeaders[cellIndex + 1].title)
      ) {
        const leftExcelColumnChar = this.getExcelColumnNameByIndex(colspanStartIndex + 1);
        const rightExcelColumnChar = this.getExcelColumnNameByIndex(cellIndex + 1);
        this._sheet.mergeCells(`${leftExcelColumnChar}1`, `${rightExcelColumnChar}1`);

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
      outputHeaderTitles = this._columnHeaders.map((header) => ({ value: stripTags(header.title), metadata }));
    }

    // do we have a Group by title?
    const groupTitle = this.getGroupColumnTitle();
    if (groupTitle) {
      outputHeaderTitles.unshift({ value: groupTitle, metadata });
    }

    return outputHeaderTitles;
  }

  protected getGroupColumnTitle(): string | null {
    // Group By text, it could be set in the export options or from translation or if nothing is found then use the English constant text
    let groupByColumnHeader = this._excelExportOptions.groupingColumnHeaderTitle;
    if (!groupByColumnHeader && this._gridOptions.enableTranslate && this._translaterService?.translate) {
      groupByColumnHeader = this._translaterService.translate(`${getTranslationPrefix(this._gridOptions)}GROUP_BY`);
    } else if (!groupByColumnHeader) {
      groupByColumnHeader = this._locales?.TEXT_GROUP_BY;
    }

    // get grouped column titles and if found, we will add a "Group by" column at the first column index
    // if it's a CSV format, we'll escape the text in double quotes
    const grouping = this._dataView.getGrouping();
    if (Array.isArray(grouping) && grouping.length > 0) {
      this._hasGroupedItems = true;
      return groupByColumnHeader;
    } else {
      this._hasGroupedItems = false;
    }
    return null;
  }

  /**
   * Get all Grouped Header Titles and their keys, translate the title when required.
   * @param {Array<object>} columns of the grid
   */
  protected getColumnGroupedHeaderTitles(columns: Column[]): Array<KeyTitlePair> {
    const groupedColumnHeaders: Array<KeyTitlePair> = [];

    if (Array.isArray(columns)) {
      // Populate the Grouped Column Header, pull the columnGroup(Key) defined
      columns.forEach((columnDef) => {
        let groupedHeaderTitle = '';
        if (columnDef.columnGroupKey && this._gridOptions.enableTranslate && this._translaterService?.translate) {
          groupedHeaderTitle = this._translaterService.translate(columnDef.columnGroupKey);
        } else {
          groupedHeaderTitle = columnDef.columnGroup || '';
        }
        const skippedField = columnDef.excludeFromExport || false;

        // if column width is 0px, then we consider that field as a hidden field and should not be part of the export
        if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
          groupedColumnHeaders.push({
            key: (columnDef.field || columnDef.id) as string,
            title: groupedHeaderTitle || '',
          });
        }
      });
    }
    return groupedColumnHeaders;
  }

  /**
   * Get all header titles and their keys, translate the title when required.
   * @param {Array<object>} columns of the grid
   */
  protected getColumnHeaders(columns: Column[]): Array<KeyTitlePair> | null {
    const columnHeaders: Array<KeyTitlePair> = [];

    if (Array.isArray(columns)) {
      // Populate the Column Header, pull the name defined
      columns.forEach((columnDef) => {
        let headerTitle = '';
        if ((columnDef.nameKey || columnDef.nameKey) && this._gridOptions.enableTranslate && this._translaterService?.translate) {
          headerTitle = this._translaterService.translate(columnDef.nameKey || columnDef.nameKey);
        } else {
          headerTitle = getHtmlStringOutput(columnDef.name || '', 'innerHTML') || titleCase(columnDef.field);
        }
        const skippedField = columnDef.excludeFromExport || false;

        // if column width is 0, then we consider that field as a hidden field and should not be part of the export
        if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
          columnHeaders.push({
            key: (columnDef.field || columnDef.id) + '',
            title: headerTitle,
          });
        }
      });
    }
    return columnHeaders;
  }

  /**
   * Get all the grid row data and return that as an output string
   * Now supports async processing with web workers for better performance
   */
  protected async pushAllGridRowDataToArray(
    originalDaraArray: Array<Array<string | ExcelColumnMetadata | number>>,
    columns: Column[]
  ): Promise<Array<Array<string | ExcelColumnMetadata | number>>> {
    const lineCount = this._dataView.getLength();

    // Check if we should use web worker processing
    if (await this.shouldUseWebWorker(lineCount)) {
      try {
        await this.processDataWithWorker(originalDaraArray, columns);
        return originalDaraArray;
      } catch (error) {
        console.warn('Web worker processing failed, falling back to main thread:', error);
        // Fall back to main thread processing
      }
    }

    // Main thread processing (original implementation)
    for (let rowNumber = 0; rowNumber < lineCount; rowNumber++) {
      const itemObj = this._dataView.getItem(rowNumber);

      // make sure we have a filled object AND that the item doesn't include the "getItem" method
      // this happen could happen with an opened Row Detail as it seems to include an empty Slick DataView (we'll just skip those lines)
      if (itemObj && !itemObj.hasOwnProperty('getItem')) {
        // Normal row (not grouped by anything) would have an ID which was predefined in the Grid Columns definition
        if (itemObj[this._datasetIdPropName] !== null && itemObj[this._datasetIdPropName] !== undefined) {
          // get regular row item data
          originalDaraArray.push(this.readRegularRowData(columns, rowNumber, itemObj, rowNumber));
        } else if (this._hasGroupedItems && itemObj.__groupTotals === undefined) {
          // get the group row
          originalDaraArray.push([this.readGroupedRowTitle(itemObj)]);
        } else if (itemObj.__groupTotals) {
          // else if the row is a Group By and we have agreggators, then a property of '__groupTotals' would exist under that object
          originalDaraArray.push(this.readGroupedTotalRows(columns, itemObj, rowNumber));
        }
      }
    }
    return originalDaraArray;
  }

  /**
   * Get the data of a regular row (a row without grouping)
   * @param {Array<Object>} columns - column definitions
   * @param {Number} row - row index
   * @param {Object} itemObj - item datacontext object
   */
  protected readRegularRowData(columns: Column[], row: number, itemObj: any, dataRowIdx: number): string[] {
    let idx = 0;
    const rowOutputStrings = [];
    const columnsLn = columns.length;
    let prevColspan: number | string = 1;
    let colspanStartIndex = 0;
    const itemMetadata = this._dataView.getItemMetadata(row);

    for (let col = 0; col < columnsLn; col++) {
      const columnDef = columns[col];

      // skip excluded column
      if (columnDef.excludeFromExport) {
        continue;
      }

      // if we are grouping and are on 1st column index, we need to skip this column since it will be used later by the grouping text:: Group by [columnX]
      if (this._hasGroupedItems && idx === 0) {
        rowOutputStrings.push('');
      }

      // when using rowspan
      let rowspan = 1;
      if (this._gridOptions.enableCellRowSpan) {
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
        if (!((!isNaN(prevColspan as number) && +prevColspan > 1) || (prevColspan === '*' && col > 0))) {
          prevColspan = columnData?.colspan ?? 1;
        }
        if (prevColspan === '*') {
          colspan = columns.length - col;
        } else {
          colspan = prevColspan as number;
          if (columnDef.id in metadata || col in metadata) {
            colspanColumnId = columnDef.id;
            colspanStartIndex = col;
          }
        }
      }

      // when using grid with rowspan without any colspan, we will merge some cells on single column
      if (rowspan > 1 && !isNaN(prevColspan as number) && +prevColspan === 1 && columnDef.id === colspanColumnId) {
        // -- Merge Data RowSpan only
        // Excel row starts at 2 or at 3 when dealing with pre-header grouping
        const excelRowNumber = row + (this._hasColumnTitlePreHeader ? 3 : 2);
        const leftExcelColumnChar = this.getExcelColumnNameByIndex(col + 1);
        const rightExcelColumnChar = this.getExcelColumnNameByIndex(col + 1);
        this._sheet.mergeCells(`${leftExcelColumnChar}${excelRowNumber}`, `${rightExcelColumnChar}${excelRowNumber + rowspan - 1}`);
      }

      // when using grid with colspan, we will merge some cells together
      if ((prevColspan === '*' && col > 0) || (!isNaN(prevColspan as number) && +prevColspan > 1 && columnDef.id !== colspanColumnId)) {
        // -- Merge Data, ColSpan and maybe RowSpan
        // Excel row starts at 2 or at 3 when dealing with pre-header grouping
        const excelRowNumber = row + (this._hasColumnTitlePreHeader ? 3 : 2);

        if (typeof prevColspan === 'number' && colspan - 1 === 1) {
          // partial column span
          const leftExcelColumnChar = this.getExcelColumnNameByIndex(colspanStartIndex + 1);
          const rightExcelColumnChar = this.getExcelColumnNameByIndex(col + 1);
          this._sheet.mergeCells(`${leftExcelColumnChar}${excelRowNumber}`, `${rightExcelColumnChar}${excelRowNumber + rowspan - 1}`);
          rowOutputStrings.push(''); // clear cell that won't be shown by a cell merge
        } else if (prevColspan === '*' && colspan === 1) {
          // full column span (from A1 until the last column)
          const rightExcelColumnChar = this.getExcelColumnNameByIndex(col + 1);
          this._sheet.mergeCells(`A${excelRowNumber}`, `${rightExcelColumnChar}${excelRowNumber + rowspan - 1}`);
        } else {
          rowOutputStrings.push(''); // clear cell that won't be shown by a cell merge
        }

        // decrement colspan until we reach colspan of 1 then proceed with cell merge OR full row merge when colspan is (*)
        if (typeof prevColspan === 'number' && !isNaN(prevColspan as number) && +prevColspan > 1) {
          colspan = prevColspan--;
        }
      } else {
        let itemData: Date | number | string | ExcelColumnMetadata = '';
        const fieldType = getColumnFieldType(columnDef);

        // -- Read Data & Push to Data Array
        // user might want to export with Formatter, and/or auto-detect Excel format, and/or export as regular cell data

        // for column that are Date type, we'll always export with their associated Date Formatters unless `exportWithFormatter` is specifically set to false
        const exportOptions = { ...this._excelExportOptions };
        if (columnDef.exportWithFormatter !== false && isColumnDateType(fieldType)) {
          exportOptions.exportWithFormatter = true;
        }
        itemData = exportWithFormatterWhenDefined(row, col, columnDef, itemObj, this._grid, exportOptions);

        // auto-detect best possible Excel format, unless the user provide his own formatting,
        // we only do this check once per column (everything after that will be pull from temp ref)
        if (!this._regularCellExcelFormats.hasOwnProperty(columnDef.id)) {
          const autoDetectCellFormat = columnDef.excelExportOptions?.autoDetectCellFormat ?? this._excelExportOptions?.autoDetectCellFormat;
          const cellStyleFormat = useCellFormatByFieldType(
            this._stylesheet,
            this._stylesheetFormats,
            columnDef,
            this._grid,
            autoDetectCellFormat
          );
          // user could also override style and/or valueParserCallback
          if (columnDef.excelExportOptions?.style) {
            cellStyleFormat.excelFormatId = this._stylesheet.createFormat(columnDef.excelExportOptions.style).id;
          }
          if (columnDef.excelExportOptions?.valueParserCallback) {
            cellStyleFormat.getDataValueParser = columnDef.excelExportOptions.valueParserCallback;
          }
          this._regularCellExcelFormats[columnDef.id] = cellStyleFormat;
        }

        // sanitize early, when enabled, any HTML tags (remove HTML tags)
        if (typeof itemData === 'string' && (columnDef.sanitizeDataExport || this._excelExportOptions.sanitizeDataExport)) {
          itemData = stripTags(itemData as string);
        }

        const { excelFormatId, getDataValueParser } = this._regularCellExcelFormats[columnDef.id];
        itemData = getDataValueParser(itemData, {
          columnDef,
          excelFormatId,
          stylesheet: this._stylesheet,
          gridOptions: this._gridOptions,
          dataRowIdx,
          dataContext: itemObj,
        });

        rowOutputStrings.push(itemData);
        idx++;
      }
    }

    return rowOutputStrings as string[];
  }

  /**
   * Get the grouped title(s) and its group title formatter, for example if we grouped by salesRep, the returned result would be:: 'Sales Rep: John Dow (2 items)'
   * @param itemObj
   */
  protected readGroupedRowTitle(itemObj: any): string {
    const groupName = stripTags(itemObj.title);

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

    columns.forEach((columnDef) => {
      let itemData: number | string | ExcelColumnMetadata = '';
      const skippedField = columnDef.excludeFromExport || false;

      // if there's a exportCustomGroupTotalsFormatter or groupTotalsFormatter, we will re-run it to get the exact same output as what is shown in UI
      if (columnDef.exportCustomGroupTotalsFormatter) {
        const totalResult = columnDef.exportCustomGroupTotalsFormatter(itemObj, columnDef, this._grid);
        itemData = totalResult instanceof HTMLElement ? totalResult.textContent || '' : totalResult;
      }

      // Apply Excel formatting using shared logic
      itemData = this.applyGroupTotalExcelFormatting(columnDef, itemData, itemObj, dataRowIdx);

      // Fallback to basic groupTotalsFormatter if no Excel formatting was applied
      if (!itemData && columnDef.groupTotalsFormatter) {
        const totalResult = columnDef.groupTotalsFormatter(itemObj, columnDef, this._grid);
        itemData = totalResult instanceof HTMLElement ? totalResult.textContent || '' : totalResult;
      }

      // does the user want to sanitize the output data (remove HTML tags)?
      if (typeof itemData === 'string' && (columnDef.sanitizeDataExport || this._excelExportOptions.sanitizeDataExport)) {
        itemData = stripTags(itemData);
      }

      // add the column (unless user wants to skip it)
      if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
        outputStrings.push(itemData);
      }
    });

    return outputStrings;
  }

  /** Legacy (non-streaming) Excel export fallback method */
  protected legacyExcelExport(filename: string, mimeType: string, resolve: (value: boolean) => void): void {
    downloadExcelFile(this._workbook, filename, { mimeType }).then(() => {
      this._pubSubService?.publish(`onAfterExportToExcel`, { filename, mimeType });
      resolve(true);
    });
  }

  // -----------------------
  // Web Worker Methods
  // -----------------------

  /**
   * Initialize the web worker for formatter processing
   */
  protected async initializeWorker(): Promise<boolean> {
    if (this._isWorkerInitialized || !this._excelExportOptions?.useWebWorker) {
      return this._isWorkerInitialized;
    }

    try {
      const workerOptions: WorkerManagerOptions = {
        maxConcurrentChunks: this._excelExportOptions.maxConcurrentChunks || 4,
        workerTimeout: 30000, // 30 seconds
        enableFallback: this._excelExportOptions.workerFallback !== false,
      };

      this._workerManager = new WorkerManager(workerOptions);
      this._isWorkerInitialized = await this._workerManager.initializeWorker();

      return this._isWorkerInitialized;
    } catch (error) {
      console.warn('Failed to initialize web worker:', error);
      this._isWorkerInitialized = false;
      return false;
    }
  }

  /**
   * Clean up web worker resources
   */
  protected cleanupWorker(): void {
    if (this._workerManager) {
      this._workerManager.cleanup();
      this._workerManager = null;
    }
    this._isWorkerInitialized = false;
  }

  /**
   * Determine if web worker should be used for processing
   */
  protected async shouldUseWebWorker(lineCount: number): Promise<boolean> {
    // Don't use worker for small datasets
    const minRowsForWorker = 500;
    if (lineCount < minRowsForWorker) {
      return false;
    }

    // Check if web worker is enabled in options
    if (!this._excelExportOptions?.useWebWorker) {
      return false;
    }

    // Check if we have formatters that would benefit from worker processing
    const columns = this._grid?.getColumns() || [];
    const hasFormatters = columns.some(col =>
      col.formatter || col.exportCustomFormatter ||
      (this._excelExportOptions?.exportWithFormatter && col.exportWithFormatter !== false)
    );

    if (!hasFormatters) {
      return false;
    }

    // Initialize worker if needed
    return await this.initializeWorker();
  }

  /**
   * Process data using web worker
   */
  protected async processDataWithWorker(
    outputData: Array<Array<string | ExcelColumnMetadata | number>>,
    columns: Column[]
  ): Promise<void> {
    if (!this._workerManager) {
      throw new Error('Worker manager not initialized');
    }

    const lineCount = this._dataView.getLength();
    const chunkSize = this._excelExportOptions?.workerChunkSize || 1000;

    // Create chunks of data to process
    const chunks: WorkerChunk[] = [];
    const serializableColumns = columns.map(col => FormatterSerializer.serializeColumn(col));
    const serializableGridOptions = FormatterSerializer.serializeGridOptions(this._gridOptions);
    const serializableExportOptions = FormatterSerializer.sanitizeDataForWorker(this._excelExportOptions);

    for (let startRow = 0; startRow < lineCount; startRow += chunkSize) {
      const endRow = Math.min(startRow + chunkSize, lineCount);
      const chunkRows: any[] = [];

      // Collect rows for this chunk, including grouped data and sanitizing data
      for (let rowNumber = startRow; rowNumber < endRow; rowNumber++) {
        const itemObj = this._dataView.getItem(rowNumber);

        // Skip invalid items (like opened Row Detail)
        if (!itemObj || itemObj.hasOwnProperty('getItem')) {
          continue;
        }

        let rowData: WorkerRowData;

        // Determine row type and create appropriate WorkerRowData
        if (itemObj[this._datasetIdPropName] !== null && itemObj[this._datasetIdPropName] !== undefined) {
          // Regular data row
          rowData = {
            type: 'regular',
            data: FormatterSerializer.sanitizeRowData(itemObj),
            originalRowIndex: rowNumber,
            isGrouped: false
          };
        } else if (this._hasGroupedItems && itemObj.__groupTotals === undefined) {
          // Group header row
          rowData = {
            type: 'group',
            data: FormatterSerializer.sanitizeRowData(itemObj),
            originalRowIndex: rowNumber,
            isGrouped: true,
            groupLevel: itemObj.level || 0,
            groupTitle: itemObj.title || '',
            groupCollapsed: itemObj.collapsed || false
          };
        } else if (itemObj.__groupTotals) {
          // Group totals row
          rowData = {
            type: 'groupTotals',
            data: FormatterSerializer.sanitizeRowData(itemObj),
            originalRowIndex: rowNumber,
            isGrouped: true,
            groupLevel: itemObj.group?.level || 0
          };
        } else {
          // Skip unknown row types
          continue;
        }

        chunkRows.push(rowData);
      }

      if (chunkRows.length > 0) {
        const chunk: WorkerChunk = {
          chunkId: `chunk_${startRow}_${endRow}`,
          startRow,
          endRow,
          rows: chunkRows,
          columns: serializableColumns,
          gridOptions: serializableGridOptions,
          exportOptions: serializableExportOptions,
          hasGroupedItems: this._hasGroupedItems,
          datasetIdPropName: this._datasetIdPropName
        };

        // Validate chunk data before adding to processing queue
        const validation = FormatterSerializer.validateChunkData(chunk);
        if (!validation.isValid) {
          console.warn(`Chunk ${chunk.chunkId} validation failed:`, validation.errors);
          console.warn('Problematic chunk data:', {
            rowsCount: chunk.rows.length,
            columnsCount: chunk.columns.length,
            gridOptions: chunk.gridOptions,
            exportOptions: chunk.exportOptions
          });

          // Try to sanitize the chunk data more aggressively
          console.log('Attempting aggressive sanitization...');
          chunk.rows = chunk.rows.map(row => FormatterSerializer.sanitizeDataForWorker(row));
          chunk.columns = chunk.columns.map(col => FormatterSerializer.sanitizeDataForWorker(col));
          chunk.gridOptions = FormatterSerializer.sanitizeDataForWorker(chunk.gridOptions);
          chunk.exportOptions = FormatterSerializer.sanitizeDataForWorker(chunk.exportOptions);

          // Re-validate after sanitization
          const revalidation = FormatterSerializer.validateChunkData(chunk);
          if (!revalidation.isValid) {
            console.error(`Chunk ${chunk.chunkId} still invalid after sanitization:`, revalidation.errors);
            // Skip this chunk to prevent worker failure
            continue;
          } else {
            console.log(`Chunk ${chunk.chunkId} successfully sanitized`);
          }
        }

        chunks.push(chunk);
      }
    }

    // Process chunks using worker
    const results = await this._workerManager.processChunks(chunks);

    // Merge results back into output data
    this.mergeWorkerResults(outputData, results, columns);
  }

  /**
   * Merge worker results back into the main output data array
   */
  protected mergeWorkerResults(
    outputData: Array<Array<string | ExcelColumnMetadata | number>>,
    results: WorkerChunkResult[],
    columns: Column[]
  ): void {
    // Sort results by chunk ID to maintain order
    results.sort((a, b) => {
      const aStart = parseInt(a.chunkId.split('_')[1]);
      const bStart = parseInt(b.chunkId.split('_')[1]);
      return aStart - bStart;
    });

    // Add processed rows to output data
    for (const result of results) {
      if (result.error) {
        console.error(`Error processing chunk ${result.chunkId}:`, result.error);
        continue;
      }

      for (const processedRow of result.processedRows) {
        // Convert processed row data to the format expected by Excel export
        const formattedRow = this.formatWorkerRowForExcel(processedRow, columns);
        outputData.push(formattedRow);
      }
    }
  }

  /**
   * Format a worker-processed row for Excel export
   */
  protected formatWorkerRowForExcel(
    processedRow: WorkerProcessedRow,
    columns: Column[]
  ): Array<string | ExcelColumnMetadata | number> {
    // Handle different row types
    if (processedRow.type === 'group') {
      // For group rows, return the group title as a single cell spanning all columns
      return [processedRow.data[0] || ''];
    }

    if (processedRow.type === 'groupTotals') {
      // For group totals, apply Excel styling if configured
      return this.formatGroupTotalsRowForExcel(processedRow.data, columns);
    }

    // For regular rows, process each column
    const formattedRow: Array<string | ExcelColumnMetadata | number> = [];
    const rowData = processedRow.data;

    for (let colIndex = 0; colIndex < rowData.length && colIndex < columns.length; colIndex++) {
      const columnDef = columns[colIndex];
      let cellValue: string | number | Date | ExcelColumnMetadata = rowData[colIndex];

      // Apply Excel formatting if needed
      if (!this._regularCellExcelFormats.hasOwnProperty(columnDef.id)) {
        const autoDetectCellFormat = columnDef.excelExportOptions?.autoDetectCellFormat ?? this._excelExportOptions?.autoDetectCellFormat;
        const cellStyleFormat = useCellFormatByFieldType(
          this._stylesheet,
          this._stylesheetFormats,
          columnDef,
          this._grid,
          autoDetectCellFormat
        );

        if (columnDef.excelExportOptions?.style) {
          cellStyleFormat.excelFormatId = this._stylesheet.createFormat(columnDef.excelExportOptions.style).id;
        }
        if (columnDef.excelExportOptions?.valueParserCallback) {
          cellStyleFormat.getDataValueParser = columnDef.excelExportOptions.valueParserCallback;
        }
        this._regularCellExcelFormats[columnDef.id] = cellStyleFormat;
      }

      const { excelFormatId, getDataValueParser } = this._regularCellExcelFormats[columnDef.id];
      cellValue = getDataValueParser(cellValue, {
        columnDef,
        excelFormatId,
        stylesheet: this._stylesheet,
        gridOptions: this._gridOptions,
        dataRowIdx: 0, // Not used in this context
        dataContext: {}, // Not available in worker context
      });

      formattedRow.push(cellValue as string | ExcelColumnMetadata | number);
    }

    return formattedRow;
  }

  /**
   * Format a group totals row with Excel styling support
   * This replicates the logic from readGroupedTotalRows for worker-processed data
   */
  protected formatGroupTotalsRowForExcel(
    groupTotalsData: Array<string | number>,
    columns: Column[]
  ): Array<string | ExcelColumnMetadata | number> {
    const formattedRow: Array<string | ExcelColumnMetadata | number> = [];

    // First element is the group aggregator text (e.g., "Totals")
    const groupingAggregatorRowText = groupTotalsData[0] || '';
    formattedRow.push(groupingAggregatorRowText);

    // Create a map of worker data (excluding the first aggregator text element)
    const workerDataMap = new Map<string, string | number>();
    let workerDataIndex = 1; // Start after the aggregator text

    // Build map of column field to worker data value (only for non-excluded columns)
    columns.forEach((columnDef) => {
      const skippedField = columnDef.excludeFromExport || false;
      if (!skippedField && (columnDef.width === undefined || columnDef.width > 0)) {
        if (workerDataIndex < groupTotalsData.length) {
          const fieldKey = (columnDef.field || columnDef.id) as string;
          workerDataMap.set(fieldKey, groupTotalsData[workerDataIndex]);
          workerDataIndex++;
        }
      }
    });

    console.log('Worker data map:', workerDataMap);

    // Now process each column in order, applying Excel formatting
    columns.forEach((columnDef) => {
      let itemData: ExcelColumnMetadata | string | number = '';
      const skippedField = columnDef.excludeFromExport || false;

      if (!skippedField) {
        // Get the value from worker data map
        const fieldKey = (columnDef.field || columnDef.id) as string;
        const cellValue = workerDataMap.get(fieldKey) || '';
        itemData = cellValue;

        // Apply Excel formatting using shared logic
        itemData = this.applyGroupTotalExcelFormatting(columnDef, cellValue);

        // Log the formatting result
        if (typeof itemData === 'object' && itemData.metadata) {
          console.log(`Applied Excel styling to group total for column ${columnDef.field}:`, {
            value: itemData.value,
            formatId: itemData.metadata.style,
            style: columnDef.groupTotalsExcelExportOptions?.style
          });
        }
      }

      // Add the column data (unless user wants to skip it)
      if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
        formattedRow.push(itemData);
      }
    });

    return formattedRow;
  }

  /**
   * Apply Excel formatting to group total cell data
   * Shared logic used by both main thread and worker processing paths
   */
  protected applyGroupTotalExcelFormatting(
    columnDef: Column,
    cellValue: string | number | ExcelColumnMetadata,
    itemObj?: any,
    dataRowIdx?: number
  ): string | number | ExcelColumnMetadata {
    const fieldType = getColumnFieldType(columnDef);
    let itemData: string | number | ExcelColumnMetadata = cellValue;

    // Auto-detect best possible Excel format for Group Totals, unless the user provides their own formatting
    const autoDetectCellFormat = columnDef.excelExportOptions?.autoDetectCellFormat ?? this._excelExportOptions?.autoDetectCellFormat;
    if (fieldType === 'number' && autoDetectCellFormat !== false) {
      let groupCellFormat = this._groupTotalExcelFormats[columnDef.id];
      if (!groupCellFormat?.groupType) {
        groupCellFormat = getExcelFormatFromGridFormatter(this._stylesheet, this._stylesheetFormats, columnDef, this._grid, 'group');
        if (columnDef.groupTotalsExcelExportOptions?.style) {
          groupCellFormat.excelFormat = this._stylesheet.createFormat(columnDef.groupTotalsExcelExportOptions.style);
        }
        this._groupTotalExcelFormats[columnDef.id] = groupCellFormat;
      }

      // For main thread processing with SlickGrid objects
      if (itemObj && dataRowIdx !== undefined) {
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
      } else {
        // For worker processing with pre-formatted values
        if (groupCellFormat.excelFormat?.id) {
          itemData = { value: cellValue, metadata: { style: groupCellFormat.excelFormat.id } };
        }
      }
    } else if (columnDef.groupTotalsExcelExportOptions?.style) {
      // Handle non-number fields with custom styling
      const excelFormatId = this._stylesheet.createFormat(columnDef.groupTotalsExcelExportOptions.style);
      itemData = { value: cellValue, metadata: { style: excelFormatId } };
    }

    return itemData;
  }
}
