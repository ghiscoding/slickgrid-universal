import type {
  TextExportService as BaseTextExportService,
  Column,
  ContainerService,
  ExportCellReader,
  ExportTextDownloadOption,
  ExportTranslateFn,
  ExternalResource,
  FileType,
  GridOption,
  KeyTitlePair,
  Locale,
  PubSubService,
  SlickDataView,
  SlickGrid,
  TextExportOption,
  TranslaterService,
} from '@slickgrid-universal/common';
import {
  Constants,
  createColspanHiddenCellChecker,
  createExportCellReader,
  getExportColumnGroupedHeaderTitles,
  getExportColumnHeaders,
  getExportGroupByTitle,
  getExportTranslateFn,
  getGroupTotalsOutput,
  hasExportPreHeader,
  isColumnExported,
} from '@slickgrid-universal/common';
import { addWhiteSpaces, extend, htmlDecode, stripTags } from '@slickgrid-universal/utils';

const DEFAULT_EXPORT_OPTIONS: TextExportOption = {
  delimiter: ',',
  filename: 'export',
  format: 'csv',
  useUtf8WithBom: true,
};

export class TextExportService implements ExternalResource, BaseTextExportService {
  protected _delimiter = ',';
  protected _exportQuoteWrapper = '';
  protected _exportOptions!: TextExportOption;
  protected _fileFormat: FileType | 'csv' | 'txt' = 'csv';
  protected _lineCarriageReturn = '\n';
  protected _grid!: SlickGrid;
  protected _dataView!: SlickDataView;
  protected _groupedColumnHeaders?: Array<KeyTitlePair>;
  protected _columnHeaders: Array<KeyTitlePair> = [];
  protected _hasGroupedItems = false;
  protected _locales!: Locale;
  protected _pubSubService!: PubSubService | null;
  protected _translaterService: TranslaterService | undefined;
  protected _timer?: any;

  /** ExcelExportService class name which is use to find service instance in the external registered services */
  readonly pluginName = 'TextExportService';

  protected get _datasetIdPropName(): string {
    return (this._gridOptions && this._gridOptions.datasetIdPropertyName) || 'id';
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return this._grid?.getOptions() ?? ({} as GridOption);
  }

  /** translate function, only defined when translation is enabled with a current language */
  protected get _translate(): ExportTranslateFn {
    return getExportTranslateFn(this._gridOptions, this._translaterService, true);
  }

  dispose(): void {
    clearTimeout(this._timer);
    this._pubSubService?.unsubscribeAll();

    // Clear critical memory leak references
    this._grid = null as any;
    this._dataView = null as any;
    this._pubSubService = null;
    this._translaterService = undefined;
  }

  /**
   * Initialize the Service
   * @param grid
   * @param containerService
   */
  init(grid: SlickGrid, containerService: ContainerService): void {
    this._grid = grid;
    this._dataView = grid?.getData<SlickDataView>() || {};
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
   * Example: exportToFile({ format: 'csv', delimiter: ',' })
   */
  exportToFile(options?: TextExportOption): Promise<boolean> {
    if (!this._grid || !this._dataView || !this._pubSubService) {
      throw new Error(
        '[Slickgrid-Universal] it seems that the SlickGrid & DataView objects and/or PubSubService are not initialized did you forget to enable the grid option flag "enableTextExport"?'
      );
    }

    return new Promise((resolve) => {
      this._pubSubService?.publish(`onBeforeExportToTextFile`, true);
      this._exportOptions = extend(true, {}, { ...DEFAULT_EXPORT_OPTIONS, ...this._gridOptions.textExportOptions, ...options });
      this._delimiter = this._exportOptions.delimiterOverride || this._exportOptions.delimiter || '';
      this._fileFormat = this._exportOptions.format || 'csv';

      // get the CSV output from the grid data
      const dataOutput = this.getDataOutput();

      // trigger a download file
      // wrap it into a setTimeout so that the EventAggregator has enough time to start a pre-process like showing a spinner
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        const downloadOptions = {
          filename: `${this._exportOptions.filename}.${this._fileFormat}`,
          format: this._fileFormat || 'csv',
          mimeType: this._exportOptions.mimeType || 'text/plain',
          // prettier-ignore
          useUtf8WithBom: this._exportOptions?.hasOwnProperty('useUtf8WithBom') ? this._exportOptions.useUtf8WithBom : true,
        };

        // start downloading but add the content property only on the start download not on the event itself
        this.startDownloadFile({ ...downloadOptions, content: dataOutput } as ExportTextDownloadOption); // add content property
        this._pubSubService?.publish(`onAfterExportToTextFile`, downloadOptions as ExportTextDownloadOption);
        resolve(true);
      }, 0);
    });
  }

  /**
   * Triggers download file with file format.
   * IE(6-10) are not supported
   * All other browsers will use plain JavaScript on client side to produce a file download.
   * @param options
   */
  startDownloadFile(options: ExportTextDownloadOption): void {
    // make sure no html entities exist in the data
    const csvContent = htmlDecode(options.content);

    // dealing with Excel CSV export and UTF-8 is a little tricky.. We will use Option #2 to cover older Excel versions
    // Option #1: we need to make Excel knowing that it's dealing with an UTF-8, A correctly formatted UTF8 file can have a Byte Order Mark as its first three octets
    // reference: http://stackoverflow.com/questions/155097/microsoft-excel-mangles-diacritics-in-csv-files
    // Option#2: use a 3rd party extension to JavaScript encode into UTF-16
    const outputData = options.format === 'csv' ? new TextEncoder().encode(csvContent) : csvContent;

    // create a Blob object for the download
    const blob = new Blob([options.useUtf8WithBom ? '\uFEFF' : '', outputData as BlobPart], {
      type: options.mimeType,
    });

    // when using IE/Edge, then use different download call
    if (typeof (navigator as any).msSaveOrOpenBlob === 'function') {
      (navigator as any).msSaveOrOpenBlob(blob, options.filename);
    } else {
      // this trick will generate a temp <a /> tag
      // the code will then trigger a hidden click for it to start downloading
      const link = document.createElement('a');
      const csvUrl = URL.createObjectURL(blob);

      link.textContent = 'download';
      link.href = csvUrl;
      link.setAttribute('download', options.filename);

      // set the visibility to hidden so there is no effect on your web-layout
      link.style.visibility = 'hidden';

      // this part will append the anchor tag, trigger a click (for download to start) and finally remove the tag once completed
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // -----------------------
  // protected functions
  // -----------------------

  /** get columns might include hidden columns when `includeHidden` is enabled */
  protected getColumns(): Column[] {
    const includeHidden = !!this._exportOptions?.includeHidden;
    return this._grid?.getColumnsInRenderedOrder(includeHidden) ?? [];
  }

  protected getDataOutput(): string {
    const columns = this.getColumns();
    const groupByColumnHeader = getExportGroupByTitle(
      this._exportOptions.groupingColumnHeaderTitle,
      this._gridOptions,
      this._translate,
      this._locales
    );

    // a CSV needs double quotes wrapper, the other types do not need any wrapper
    this._exportQuoteWrapper = this._fileFormat === 'csv' ? '"' : '';

    // data variable which will hold all the fields data of a row
    let outputDataString = '';

    // get grouped column titles and if found, we will add a "Group by" column at the first column index
    // if it's a CSV format, we'll escape the text in double quotes
    const grouping = this._dataView.getGrouping();
    if (Array.isArray(grouping) && grouping.length > 0) {
      this._hasGroupedItems = true;
      outputDataString +=
        this._fileFormat === 'csv' ? `"${groupByColumnHeader}"${this._delimiter}` : `${groupByColumnHeader}${this._delimiter}`;
    } else {
      this._hasGroupedItems = false;
    }

    // get all Grouped Column Header Titles when defined (from pre-header row)
    if (hasExportPreHeader(this._gridOptions)) {
      this._groupedColumnHeaders = this.getColumnGroupedHeaderTitles(columns) || [];
      if (Array.isArray(this._groupedColumnHeaders) && this._groupedColumnHeaders.length > 0) {
        // add the header row + add a new line at the end of the row
        const outputGroupedHeaderTitles = this._groupedColumnHeaders.map(
          (header) => `${this._exportQuoteWrapper}${header.title}${this._exportQuoteWrapper}`
        );
        outputDataString += outputGroupedHeaderTitles.join(this._delimiter) + this._lineCarriageReturn;
      }
    }

    // get all Column Header Titles
    this._columnHeaders = this.getColumnHeaders(columns) || [];
    if (Array.isArray(this._columnHeaders) && this._columnHeaders.length > 0) {
      // add the header row + add a new line at the end of the row
      const outputHeaderTitles = this._columnHeaders.map((header) =>
        stripTags(`${this._exportQuoteWrapper}${header.title}${this._exportQuoteWrapper}`)
      );
      outputDataString += outputHeaderTitles.join(this._delimiter) + this._lineCarriageReturn;
    }

    // Populate the rest of the Grid Data
    outputDataString += this.getAllGridRowData(columns, this._lineCarriageReturn);

    return outputDataString;
  }

  /**
   * Get all the grid row data and return that as an output string
   */
  protected getAllGridRowData(columns: Column[], lineCarriageReturn: string): string {
    const outputDataStrings = [];
    const lineCount = this._dataView.getLength();
    const cellReaders = this.createCellReaders(columns);

    // loop through all the grid rows of data
    for (let rowNumber = 0; rowNumber < lineCount; rowNumber++) {
      const itemObj = this._dataView.getItem(rowNumber);

      // make sure we have a filled object AND that the item doesn't include the "getItem" method
      // this happen could happen with an opened Row Detail as it seems to include an empty Slick DataView (we'll just skip those lines)
      if (itemObj && !itemObj.hasOwnProperty('getItem')) {
        // Normal row (not grouped by anything) would have an ID which was predefined in the Grid Columns definition
        if (itemObj[this._datasetIdPropName] !== null && itemObj[this._datasetIdPropName] !== undefined) {
          // get regular row item data
          outputDataStrings.push(this.readRegularRowData(columns, rowNumber, itemObj, cellReaders));
        } else if (this._hasGroupedItems && itemObj.__groupTotals === undefined) {
          // get the group row
          outputDataStrings.push(this.readGroupedTitleRow(itemObj));
        } else if (itemObj.__groupTotals) {
          // else if the row is a Group By and we have agreggators, then a property of '__groupTotals' would exist under that object
          outputDataStrings.push(this.readGroupedTotalRow(columns, itemObj));
        }
      }
    }

    return outputDataStrings.join(lineCarriageReturn);
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
  protected getColumnHeaders(columns: Column[]): Array<KeyTitlePair> {
    return getExportColumnHeaders(columns, this._translate);
  }

  /**
   * Create the formatted cell reader of every column, the column formatter & field are resolved once instead of for every cell
   * @param {Array<Object>} columns - column definitions
   */
  protected createCellReaders(columns: Column[]): ExportCellReader[] {
    // sanitization is skipped here since it's done later in the export flow
    return columns.map((columnDef) => createExportCellReader(columnDef, this._grid, this._exportOptions, true));
  }

  /**
   * Get the data of a regular row (a row without grouping)
   * @param {Array<Object>} columns - column definitions
   * @param {Number} row - row index
   * @param {Object} itemObj - item datacontext object
   * @param {Array<Function>} [cellReaders] - formatted cell readers of every column, create them once to reuse them for every row
   */
  protected readRegularRowData(
    columns: Column[],
    row: number,
    itemObj: any,
    cellReaders: ExportCellReader[] = this.createCellReaders(columns)
  ): string {
    const rowOutputStrings = [];
    const exportQuoteWrapper = this._exportQuoteWrapper;
    const isColspanHiddenCell = createColspanHiddenCellChecker(this._dataView.getItemMetadata(row));

    // if we are grouping, the 1st column is used by the grouping text:: Group by [columnX]
    if (this._hasGroupedItems) {
      rowOutputStrings.push(this._fileFormat === 'csv' ? `""` : '');
    }

    for (let col = 0, ln = columns.length; col < ln; col++) {
      const columnDef = columns[col];

      // skip excluded column, a column with a width of 0 is also considered hidden and isn't exported (same as its header)
      if (!isColumnExported(columnDef)) {
        continue;
      }

      // when using rowspan
      if (this._gridOptions.enableCellRowSpan) {
        const prs = this._grid.getParentRowSpanByCell(row, col, false);
        if (prs && prs.start !== row) {
          // skip any rowspan child cell since it was already merged
          rowOutputStrings.push('');
          continue;
        }
      }

      // when using colspan (it could be a number or a "*" when spreading the entire row), skip cells hidden by a previous colspan
      if (isColspanHiddenCell(columnDef, col)) {
        rowOutputStrings.push('');
      } else {
        const columnId = String(columnDef.id);

        // Try cache first when enabled, otherwise keep the existing formatter path.
        let itemData =
          this._gridOptions.enableFormattedDataCache && columnDef.id != null
            ? this._dataView.getFormattedCellValue(row, columnId, undefined, itemObj)
            : undefined;

        if (itemData === undefined) {
          itemData = cellReaders[col](row, col, itemObj);
        }

        // does the user want to sanitize the output data (remove HTML tags)?
        if ((columnDef.sanitizeDataExport || this._exportOptions.sanitizeDataExport) && typeof itemData === 'string') {
          itemData = stripTags(itemData);
        }

        // when CSV we also need to escape double quotes twice, so " becomes ""
        if (this._fileFormat === 'csv' && itemData) {
          itemData = itemData.toString().replace(/"/g, `""`);
        }

        // do we have a wrapper to keep as a string? in certain cases like "1E06", we don't want excel to transform it into exponential (1.0E06)
        // to cancel that effect we can had = in front, ex: ="1E06"
        const keepAsStringWrapper = columnDef?.exportCsvForceToKeepAsString ? '=' : '';

        rowOutputStrings.push(keepAsStringWrapper + exportQuoteWrapper + itemData + exportQuoteWrapper);
      }
    }

    return rowOutputStrings.join(this._delimiter);
  }

  /**
   * Get the grouped title(s) and its group title formatter, for example if we grouped by salesRep, the returned result would be:: 'Sales Rep: John Dow (2 items)'
   * @param itemObj
   */
  protected readGroupedTitleRow(itemObj: any): string {
    let groupName = stripTags(itemObj.title);
    const exportQuoteWrapper = this._exportQuoteWrapper;

    groupName = addWhiteSpaces(5 * itemObj.level) + groupName;

    if (this._fileFormat === 'csv') {
      // when CSV we also need to escape double quotes twice, so " becomes ""
      groupName = groupName.toString().replace(/"/g, `""`);
    }

    return exportQuoteWrapper + groupName + exportQuoteWrapper;
  }

  /**
   * Get the grouped totals (below the regular rows), these are set by Slick Aggregators.
   * For example if we grouped by "salesRep" and we have a Sum Aggregator on "sales", then the returned output would be:: ["Sum 123$"]
   * @param itemObj
   */
  protected readGroupedTotalRow(columns: Column[], itemObj: any): string {
    const groupingAggregatorRowText = this._exportOptions.groupingAggregatorRowText || '';
    const exportQuoteWrapper = this._exportQuoteWrapper;
    const outputStrings = [`${exportQuoteWrapper}${groupingAggregatorRowText}${exportQuoteWrapper}`];

    // add every exported column (unless user wants to skip it)
    columns.filter(isColumnExported).forEach((columnDef) => {
      // if there's a groupTotalsFormatter, we will re-run it to get the exact same output as what is shown in UI
      let itemData = columnDef.groupTotalsFormatter
        ? getGroupTotalsOutput(columnDef.groupTotalsFormatter(itemObj, columnDef, this._grid))
        : '';

      // does the user want to sanitize the output data (remove HTML tags)?
      if ((columnDef.sanitizeDataExport || this._exportOptions.sanitizeDataExport) && typeof itemData === 'string') {
        itemData = stripTags(itemData);
      }

      if (this._fileFormat === 'csv') {
        // when CSV we also need to escape double quotes twice, so a double quote " becomes 2x double quotes ""
        itemData = itemData.toString().replace(/"/g, `""`);
      }
      outputStrings.push(exportQuoteWrapper + itemData + exportQuoteWrapper);
    });

    return outputStrings.join(this._delimiter);
  }
}
