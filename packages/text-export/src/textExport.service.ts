import { TextEncoder } from 'text-encoding-utf-8';
import type {
  Column,
  ContainerService,
  ExternalResource,
  FileType,
  GridOption,
  KeyTitlePair,
  Locale,
  PubSubService,
  SlickDataView,
  SlickGrid,
  TextExportOption,
  TextExportService as BaseTextExportService,
  TranslaterService,
} from '@slickgrid-universal/common';
import {
  Constants,
  DelimiterType,

  // utility functions
  exportWithFormatterWhenDefined,
  getTranslationPrefix,
  htmlDecode,
} from '@slickgrid-universal/common';
import { addWhiteSpaces, extend, getHtmlStringOutput, stripTags, titleCase } from '@slickgrid-universal/utils';

const DEFAULT_EXPORT_OPTIONS: TextExportOption = {
  delimiter: DelimiterType.comma,
  filename: 'export',
  format: 'csv',
  useUtf8WithBom: true,
};

interface ExportTextDownloadOption {
  filename: string;
  content: string;
  format: FileType | string;
  mimeType: string;
  useUtf8WithBom?: boolean;
}

export class TextExportService implements ExternalResource, BaseTextExportService {
  protected _delimiter = ',';
  protected _exportQuoteWrapper = '';
  protected _exportOptions!: TextExportOption;
  protected _fileFormat: FileType | 'csv' | 'txt' = 'csv';
  protected _lineCarriageReturn = '\n';
  protected _grid!: SlickGrid;
  protected _groupedColumnHeaders?: Array<KeyTitlePair>;
  protected _columnHeaders: Array<KeyTitlePair> = [];
  protected _hasGroupedItems = false;
  protected _locales!: Locale;
  protected _pubSubService!: PubSubService | null;
  protected _translaterService: TranslaterService | undefined;

  /** ExcelExportService class name which is use to find service instance in the external registered services */
  readonly className = 'TextExportService';

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
   * Function to export the Grid result to an Excel CSV format using JavaScript for it to produce the CSV file.
   * This is a WYSIWYG export to file output (What You See is What You Get)
   *
   * NOTES: The column position needs to match perfectly the JSON Object position because of the way we are pulling the data,
   * which means that if any column(s) got moved in the UI, it has to be reflected in the JSON array output as well
   *
   * Example: exportToFile({ format: 'csv', delimiter: DelimiterType.comma })
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
      setTimeout(() => {
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
    const outputData = options.format === 'csv' ? new TextEncoder('utf-8').encode(csvContent) : csvContent;

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

  protected getDataOutput(): string {
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
    if (this._gridOptions.createPreHeaderPanel && this._gridOptions.showPreHeaderPanel && !this._gridOptions.enableDraggableGrouping) {
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

    // loop through all the grid rows of data
    for (let rowNumber = 0; rowNumber < lineCount; rowNumber++) {
      const itemObj = this._dataView.getItem(rowNumber);

      // make sure we have a filled object AND that the item doesn't include the "getItem" method
      // this happen could happen with an opened Row Detail as it seems to include an empty Slick DataView (we'll just skip those lines)
      if (itemObj && !itemObj.hasOwnProperty('getItem')) {
        // Normal row (not grouped by anything) would have an ID which was predefined in the Grid Columns definition
        if (itemObj[this._datasetIdPropName] !== null && itemObj[this._datasetIdPropName] !== undefined) {
          // get regular row item data
          outputDataStrings.push(this.readRegularRowData(columns, rowNumber, itemObj));
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
    const groupedColumnHeaders: KeyTitlePair[] = [];

    if (Array.isArray(columns)) {
      // Populate the Grouped Column Header, pull the columnGroup(Key) defined
      columns.forEach((columnDef) => {
        let groupedHeaderTitle = '';
        if (
          columnDef.columnGroupKey &&
          this._gridOptions.enableTranslate &&
          this._translaterService?.translate &&
          this._translaterService?.getCurrentLanguage?.()
        ) {
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
  protected readRegularRowData(columns: Column[], row: number, itemObj: any): string {
    let idx = 0;
    const rowOutputStrings = [];
    const exportQuoteWrapper = this._exportQuoteWrapper;
    let prevColspan: number | string = 1;
    const itemMetadata = this._dataView.getItemMetadata(row);

    for (let col = 0, ln = columns.length; col < ln; col++) {
      const columnDef = columns[col];

      // skip excluded column
      if (columnDef.excludeFromExport) {
        continue;
      }

      // if we are grouping and are on 1st column index, we need to skip this column since it will be used later by the grouping text:: Group by [columnX]
      if (this._hasGroupedItems && idx === 0) {
        const emptyValue = this._fileFormat === 'csv' ? `""` : '';
        rowOutputStrings.push(emptyValue);
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
        rowOutputStrings.push('');
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

        // when CSV we also need to escape double quotes twice, so " becomes ""
        if (this._fileFormat === 'csv' && itemData) {
          itemData = itemData.toString().replace(/"/gi, `""`);
        }

        // do we have a wrapper to keep as a string? in certain cases like "1E06", we don't want excel to transform it into exponential (1.0E06)
        // to cancel that effect we can had = in front, ex: ="1E06"
        const keepAsStringWrapper = columnDef?.exportCsvForceToKeepAsString ? '=' : '';

        rowOutputStrings.push(keepAsStringWrapper + exportQuoteWrapper + itemData + exportQuoteWrapper);
      }

      idx++;
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
      groupName = groupName.toString().replace(/"/gi, `""`);
    }

    return exportQuoteWrapper + groupName + exportQuoteWrapper;
  }

  /**
   * Get the grouped totals (below the regular rows), these are set by Slick Aggregators.
   * For example if we grouped by "salesRep" and we have a Sum Aggregator on "sales", then the returned output would be:: ["Sum 123$"]
   * @param itemObj
   */
  protected readGroupedTotalRow(columns: Column[], itemObj: any): string {
    const delimiter = this._exportOptions.delimiter;
    const format = this._exportOptions.format;
    const groupingAggregatorRowText = this._exportOptions.groupingAggregatorRowText || '';
    const exportQuoteWrapper = this._exportQuoteWrapper;
    const outputStrings = [`${exportQuoteWrapper}${groupingAggregatorRowText}${exportQuoteWrapper}`];

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

      if (format === 'csv') {
        // when CSV we also need to escape double quotes twice, so a double quote " becomes 2x double quotes ""
        itemData = itemData.toString().replace(/"/gi, `""`);
      }
      // add the column (unless user wants to skip it)
      if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
        outputStrings.push(exportQuoteWrapper + itemData + exportQuoteWrapper);
      }
    });

    return outputStrings.join(delimiter);
  }
}
