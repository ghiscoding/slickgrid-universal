import { I18N } from '@aurelia/i18n';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { resolve } from 'aurelia';
// import { TOptions as I18NOptions } from 'i18next';
import {
  Filters,
  Formatters,
  type AureliaGridInstance,
  type Column,
  type Formatter,
  type GridOption,
  type GridStateChange,
  type SlickGrid,
  type SliderOption,
} from 'aurelia-slickgrid';

const NB_ITEMS = 1500;

// create a custom translate Formatter (typically you would move that a separate file, for separation of concerns)
const taskTranslateFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, grid) => {
  const gridOptions = grid.getOptions() as GridOption;
  const i18n = gridOptions.i18n;

  return i18n?.tr('TASK_X', { x: value } as any) ?? '';
};

export class Example12 {
  aureliaGrid!: AureliaGridInstance;
  gridOptions!: GridOption;
  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  selectedLanguage: string;
  duplicateTitleHeaderCount = 1;
  gridObj!: SlickGrid;
  hideSubTitle = false;
  excelExportService = new ExcelExportService();
  textExportService = new TextExportService();

  constructor(private readonly i18n: I18N = resolve(I18N)) {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // always start with English for Cypress E2E tests to be consistent
    const defaultLang = 'en';
    this.i18n.setLocale(defaultLang);
    this.selectedLanguage = defaultLang;
  }

  attached() {
    // populate the dataset once the grid is ready
    this.getData(NB_ITEMS);
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
    this.gridObj = aureliaGrid.slickGrid;
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'id',
        nameKey: 'TITLE',
        minWidth: 100,
        formatter: taskTranslateFormatter,
        sortable: true,
        filterable: true,
        params: { useFormatterOuputToFilter: true },
      },
      { id: 'description', name: 'Description', field: 'description', filterable: true, sortable: true, minWidth: 80 },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        nameKey: 'DURATION',
        sortable: true,
        formatter: Formatters.percentCompleteBar,
        minWidth: 100,
        exportWithFormatter: false,
        filterable: true,
        type: 'number',
        filter: {
          model: Filters.slider,
          /* operator: '>=',*/
          options: { hideSliderNumber: true } as SliderOption,
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        nameKey: 'START',
        formatter: Formatters.dateIso,
        outputType: 'dateIso',
        type: 'date',
        minWidth: 100,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        nameKey: 'FINISH',
        formatter: Formatters.dateIso,
        outputType: 'dateIso',
        type: 'date',
        minWidth: 100,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'completedBool',
        name: 'Completed',
        field: 'completedBool',
        nameKey: 'COMPLETED',
        minWidth: 100,
        sortable: true,
        formatter: Formatters.checkmarkMaterial,
        exportCustomFormatter: Formatters.translateBoolean,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, labelKey: 'TRUE' },
            { value: false, labelKey: 'FALSE' },
          ],
          model: Filters.singleSelect,
          enableTranslateLabel: true,
        },
      },
      {
        id: 'completed',
        name: 'Completed',
        field: 'completed',
        nameKey: 'COMPLETED',
        formatter: Formatters.translate,
        sortable: true,
        minWidth: 100,
        exportWithFormatter: true, // you can set this property in the column definition OR in the grid options, column def has priority over grid options
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: 'TRUE', labelKey: 'TRUE' },
            { value: 'FALSE', labelKey: 'FALSE' },
          ],
          collectionSortBy: {
            property: 'labelKey', // will sort by translated value since "enableTranslateLabel" is true
            sortDesc: true,
          },
          model: Filters.singleSelect,
          enableTranslateLabel: true,
        },
      },
      // OR via your own custom translate formatter
      // { id: 'completed', name: 'Completed', field: 'completed', nameKey: 'COMPLETED', formatter: translateFormatter, sortable: true, minWidth: 100 }
    ];

    this.gridOptions = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableAutoResize: true,
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      enableTranslate: true,
      i18n: this.i18n,
      checkboxSelector: {
        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      enableCheckboxSelector: true,
      enableSelection: true,
      showCustomFooter: true, // display some metrics in the bottom custom footer
      customFooterOptions: {
        metricTexts: {
          // default text displayed in the metrics section on the right
          // all texts optionally support translation keys,
          // if you wish to use that feature then use the text properties with the 'Key' suffix (e.g: itemsKey, ofKey, lastUpdateKey)
          // example "items" for a plain string OR "itemsKey" to use a translation key
          itemsKey: 'ITEMS',
          ofKey: 'OF',
          lastUpdateKey: 'LAST_UPDATE',
        },
        dateFormat: 'YYYY-MM-DD hh:mm a',
        hideTotalItemCount: false,
        hideLastUpdateTimestamp: false,
      },
      gridMenu: {
        hideExportCsvCommand: false, // false by default, so it's optional
        hideExportTextDelimitedCommand: false, // true by default, so if you want it, you will need to disable the flag
      },
      enableExcelExport: true,
      enableTextExport: true,
      textExportOptions: {
        // set at the grid option level, meaning all column will evaluate the Formatter (when it has a Formatter defined)
        exportWithFormatter: true,
        sanitizeDataExport: true,
      },
      excelExportOptions: {
        // optionally pass a custom header to the Excel Sheet
        // a lot of the info can be found on Excel-Builder-Vanilla
        // https://ghiscoding.gitbook.io/excel-builder-vanilla/cookbook/fonts-and-colors
        customExcelHeader: (workbook, sheet) => {
          const customTitle =
            this.i18n.getLocale() === 'fr' ? 'Titre qui est suffisament long pour être coupé' : 'My header that is long enough to wrap';
          const stylesheet = workbook.getStyleSheet();
          const aFormatDefn = {
            font: { size: 12, fontName: 'Calibri', bold: true, color: 'FF0000FF' }, // every color starts with FF, then regular HTML color
            alignment: { wrapText: true },
          };
          const formatterId = stylesheet.createFormat(aFormatDefn);
          sheet.setRowInstructions(0, { height: 30 }); // change height of row 0

          // excel cells start with A1 which is upper left corner
          sheet.mergeCells('B1', 'D1');
          const cols: any[] = [];
          // push empty data on A1
          cols.push({ value: '' });
          // push data in B1 cell with metadata formatter
          cols.push({ value: customTitle, metadata: { style: formatterId.id } });
          sheet.data.push(cols);
        },
        exportWithFormatter: true,
        sanitizeDataExport: true,
      },
      externalResources: [this.excelExportService, this.textExportService],
    };
  }

  getData(count: number) {
    // mock a dataset
    const tmpData: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);

      tmpData[i] = {
        id: i,
        description: i % 5 ? 'desc ' + i : '🚀🦄 español', // also add some random to test NULL field
        duration: Math.round(Math.random() * 100) + '',
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        completedBool: i % 5 === 0 ? true : false,
        completed: i % 5 === 0 ? 'TRUE' : 'FALSE',
      };
    }
    this.dataset = tmpData;
  }

  dynamicallyAddTitleHeader() {
    // you can dynamically add your column to your column definitions
    // and then use the spread operator [...cols] OR slice to force Aurelia to review the changes
    const newCol = {
      id: `title${this.duplicateTitleHeaderCount++}`,
      field: 'id',
      nameKey: 'TITLE',
      formatter: taskTranslateFormatter,
      sortable: true,
      minWidth: 100,
      filterable: true,
      params: { useFormatterOuputToFilter: true },
    };
    this.columnDefinitions.push(newCol);
    this.columnDefinitions = this.columnDefinitions.slice(); // or use spread operator [...cols]

    // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
    // you MUST use "getAllColumnDefinitions()" from the GridService, using this will be ALL columns including the 1st column that is created internally
    // for example if you use the Checkbox Selector (row selection), you MUST use the code below
    /*
    const allColumns = this.aureliaGrid.gridService.getAllColumnDefinitions();
    allColumns.push(newCol);
    this.columnDefinitions = [...allColumns]; // (or use slice) reassign to column definitions for Aurelia to do dirty checking
    */
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({
      filename: 'Export',
      format: 'xlsx',
    });
  }

  exportToFile(type = 'csv') {
    this.textExportService.exportToFile({
      delimiter: type === 'csv' ? ',' : '\t',
      filename: 'myExport',
      format: type === 'csv' ? 'csv' : 'txt',
    });
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(gridStateChanges: GridStateChange) {
    console.log('Grid State changed:: ', gridStateChanges);
    console.log('Grid State changed:: ', gridStateChanges.change);
  }

  async switchLanguage() {
    const nextLanguage = this.selectedLanguage === 'en' ? 'fr' : 'en';
    await this.i18n.setLocale(nextLanguage);
    this.selectedLanguage = nextLanguage;
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
