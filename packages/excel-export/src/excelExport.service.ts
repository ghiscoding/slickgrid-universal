import type {
  ExcelExportService as BaseExcelExportService,
  Column,
  ContainerService,
  ExcelExportOption,
  ExcelGroupValueParserArgs,
  ExternalResource,
  FileType,
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
  exportWithFormatterWhenDefined,
  getColumnFieldType,
  getTranslationPrefix,
  isColumnDateType,
} from '@slickgrid-universal/common';
import {
  addWhiteSpaces,
  createDomElement,
  extend,
  getHtmlStringOutput,
  htmlDecode,
  stripTags,
  titleCase,
} from '@slickgrid-universal/utils';
import {
  createExcelFileStream,
  downloadExcelFile,
  Workbook,
  type ExcelColumnMetadata,
  type ExcelMetadata,
  type StyleSheet,
  type Worksheet,
} from 'excel-builder-vanilla';
import { getExcelFormatFromGridFormatter, getGroupTotalValue, useCellFormatByFieldType, type ExcelFormatter } from './excelUtils.js';

const DEFAULT_EXPORT_OPTIONS: ExcelExportOption = {
  filename: 'export',
  format: 'xlsx',
  htmlDecode: true,
  useStreamingExport: true,
};

export class ExcelExportService implements ExternalResource, BaseExcelExportService {
  protected _fileFormat: Extract<FileType, 'xls' | 'xlsx'> = 'xlsx';
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
    [fieldId: string]: { excelFormatId?: number; getDataValueParser: GetDataValueCallback };
  } = {};
  protected _groupTotalExcelFormats: {
    [fieldId: string]: { groupType: string; excelFormat?: ExcelFormatter; getGroupTotalParser?: GetGroupTotalValueCallback };
  } = {};

  /** ExcelExportService class name which is use to find service instance in the external registered services */
  readonly pluginName = 'ExcelExportService';

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
    this._excelExportOptions = extend(true, {}, { ...DEFAULT_EXPORT_OPTIONS, ...this._gridOptions.excelExportOptions, ...options });
    this._fileFormat = this._excelExportOptions.format || 'xlsx';
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

    try {
      // get all data by reading all DataView rows with yielding for responsiveness
      const dataOutput = await this.getDataOutputAsync();

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
          this._fileFormat === 'xls' ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      const filename = `${this._excelExportOptions.filename}.${this._fileFormat}`;

      if (this._fileFormat === 'xlsx' && useStreamingExport) {
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
          return true;
        } catch (err) {
          // fallback to legacy export if streaming is not supported
          return await this.legacyExcelExportAsync(filename, mimeType);
        }
      } else {
        // fallback to legacy export for non-xlsx or if useStreamingExport is false
        return await this.legacyExcelExportAsync(filename, mimeType);
      }
    } /** v8 ignore next */ catch (error) {
      console.error('Excel export failed:', error);
      this._pubSubService?.publish('onAfterExportToExcel', { error });
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

  /**
   * Async version of getDataOutput with yielding for UI responsiveness during large dataset processing
   */
  protected async getDataOutputAsync(): Promise<Array<string[] | ExcelColumnMetadata[]>> {
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
    if (
      this._gridOptions.createPreHeaderPanel &&
      this._gridOptions.showPreHeaderPanel &&
      (!this._gridOptions.enableDraggableGrouping || (this._gridOptions.enableDraggableGrouping && this._gridOptions.createTopHeaderPanel))
    ) {
      // when having Grouped Header Titles (in the pre-header), then make the cell Bold & Aligned Center
      const boldCenterAlign = this._stylesheet.createFormat({ alignment: { horizontal: 'center' }, font: { bold: true } });
      outputData.push(this.getColumnGroupedHeaderTitlesData(columns, { style: boldCenterAlign?.id }));
      this._hasColumnTitlePreHeader = true;
    }

    // get all Column Header Titles (it might include a "Group by" title at A1 cell)
    // also style the headers, defaults to Bold but user could pass his own style
    outputData.push(this.getColumnHeaderData(columns, { style: columnHeaderStyleId }));

    // Populate the rest of the Grid Data by reading directly from DataView with yielding for responsiveness
    await this.pushAllGridRowDataToArrayAsync(outputData, columns);

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
    let colspanStartIndex = 0;
    let headerOffset = 0; // increases when "Group by" is provided in the next header row
    let outputGroupedHeaderTitles: Array<ExcelColumnMetadata> = [];

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
    // Group By text, it could be set in the export options or from translation or if nothing is found then use the English constant text
    let groupByColumnHeader = this._excelExportOptions?.groupingColumnHeaderTitle ?? '';
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
    }
    this._hasGroupedItems = false;
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
        const groupedHeaderTitle =
          columnDef.columnGroupKey && this._gridOptions.enableTranslate && this._translaterService?.translate
            ? this._translaterService.translate(columnDef.columnGroupKey)
            : columnDef.columnGroup || '';

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
        if (columnDef.nameKey && this._gridOptions.enableTranslate && this._translaterService?.translate) {
          headerTitle = this._translaterService.translate(columnDef.nameKey);
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
   * Async version of pushAllGridRowDataToArray with yielding for UI responsiveness during large dataset processing.
   * Processes rows directly from DataView with periodic yielding for responsiveness.
   */
  protected async pushAllGridRowDataToArrayAsync(
    originalDaraArray: Array<Array<string | ExcelColumnMetadata | number>>,
    columns: Column[]
  ): Promise<Array<Array<string | ExcelColumnMetadata | number>>> {
    const dataView = this._dataView;
    const lineCount = dataView.getLength();

    // Yield periodically based on dataset size
    const YIELD_FREQUENCY = lineCount < 1000 ? 0 : lineCount < 10000 ? 1000 : 500;

    // Update the hasGroupedItems flag from current grouping
    const grouping = dataView.getGrouping();
    this._hasGroupedItems = Array.isArray(grouping) && grouping.length > 0;

    // Read rows directly from DataView
    for (let rowNumber = 0; rowNumber < lineCount; rowNumber++) {
      const itemObj = dataView.getItem(rowNumber);

      // make sure we have a filled object AND that the item doesn't include the "getItem" method
      // this happen could happen with an opened Row Detail as it seems to include an empty Slick DataView (we'll just skip those lines)
      if (itemObj && !itemObj.hasOwnProperty('getItem')) {
        // Normal row (not grouped by anything) would have an ID which was predefined in the Grid Columns definition
        if (itemObj[this._datasetIdPropName] !== null && itemObj[this._datasetIdPropName] !== undefined) {
          // Read a regular row
          originalDaraArray.push(this.readRegularRowData(columns, rowNumber, itemObj, rowNumber));
        } else if (this._hasGroupedItems && itemObj.__groupTotals === undefined) {
          // get the group row
          originalDaraArray.push([this.readGroupedRowTitle(itemObj)]);
        } else if (itemObj.__groupTotals) {
          // else if the row is a Group By and we have aggregators, then a property of '__groupTotals' would exist under that object
          originalDaraArray.push(this.readGroupedTotalRows(columns, itemObj, rowNumber));
        }
      }

      // Yield to event loop
      if (YIELD_FREQUENCY > 0 && rowNumber > 0 && rowNumber % YIELD_FREQUENCY === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return originalDaraArray;
  }

  /** OPTIMIZATION: Pre-calculate column metadata to avoid repeated calculations */
  protected preCalculateColumnMetadata(columns: Column[]): Map<string, any> {
    const cache = new Map();

    // OPTIMIZATION: Pre-calculate if we have complex spanning to avoid checking on every row
    const hasComplexSpanning = this._gridOptions.enableCellRowSpan || columns.some((col) => col.colspan || col.rowspan);

    for (const columnDef of columns) {
      if (!columnDef.excludeFromExport) {
        const fieldType = getColumnFieldType(columnDef);
        const exportOptions = { ...this._excelExportOptions };

        // Pre-calculate date formatting logic
        if (columnDef.exportWithFormatter !== false && isColumnDateType(fieldType)) {
          exportOptions.exportWithFormatter = true;
        }

        cache.set(String(columnDef.id), {
          fieldType,
          exportOptions,
          hasFormatter: !!columnDef.formatter,
          sanitizeData: columnDef.sanitizeDataExport || this._excelExportOptions.sanitizeDataExport,
          field: columnDef.field,
          hasComplexSpanning, // Cache this to avoid repeated checks
        });
      }
    }

    return cache;
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
    return new Promise((resolve) => setTimeout(resolve, 0));
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
        if (typeof itemData === 'string') {
          if (columnDef.sanitizeDataExport || this._excelExportOptions.sanitizeDataExport) {
            itemData = stripTags(itemData as string);
          }
          if (this._excelExportOptions.htmlDecode) {
            itemData = htmlDecode(itemData);
          }
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

    columns.forEach((columnDef) => {
      let itemData: number | string | ExcelColumnMetadata = '';
      const fieldType = getColumnFieldType(columnDef);
      const skippedField = columnDef.excludeFromExport || false;

      // if there's a exportCustomGroupTotalsFormatter or groupTotalsFormatter, we will re-run it to get the exact same output as what is shown in UI
      if (columnDef.exportCustomGroupTotalsFormatter) {
        const totalResult = columnDef.exportCustomGroupTotalsFormatter(itemObj, columnDef, this._grid);
        itemData = totalResult instanceof HTMLElement ? totalResult.textContent || '' : totalResult;
      }

      // auto-detect best possible Excel format for Group Totals, unless the user provide his own formatting,
      // we only do this check once per column (everything after that will be pull from temp ref)
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
              : (itemData = { value: groupData, metadata: { style: groupCellFormat.excelFormat?.id } });
        }
      } else if (columnDef.groupTotalsFormatter) {
        const totalResult = columnDef.groupTotalsFormatter(itemObj, columnDef, this._grid);
        itemData = totalResult instanceof HTMLElement ? totalResult.textContent || '' : totalResult;
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

      // add the column (unless user wants to skip it)
      if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
        outputStrings.push(itemData);
      }
    });

    return outputStrings;
  }

  /** Async version of legacy Excel export fallback method */
  protected async legacyExcelExportAsync(filename: string, mimeType: string): Promise<boolean> {
    try {
      await downloadExcelFile(this._workbook, filename, { mimeType });
      this._pubSubService?.publish(`onAfterExportToExcel`, { filename, mimeType });
      return true;
    } catch (error) {
      console.error('Legacy Excel export failed:', error);
      this._pubSubService?.publish('onAfterExportToExcel', { error });
      return false;
    }
  }
}
