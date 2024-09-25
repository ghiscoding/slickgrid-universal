import {
  Aggregators,
  type Column,
  FieldType,
  Filters,
  FileType,
  Formatters,
  type GridOption,
  type Grouping,
  GroupTotalFormatters,
  type SliderOption,
  SortComparers,
  SortDirectionNumber,
} from '@slickgrid-universal/common';
import { BindingEventService } from '@slickgrid-universal/binding';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import '../material-styles.scss';

const NB_ITEMS = 500;

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default class Example02 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  commandQueue = [];
  sgb: SlickVanillaGridBundle;
  excelExportService: ExcelExportService;
  loadingClass = '';

  constructor() {
    this.excelExportService = new ExcelExportService();
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(NB_ITEMS);
    const gridContainerElm = document.querySelector<HTMLDivElement>('.grid2') as HTMLDivElement;

    this._bindingEventService.bind(gridContainerElm, 'onbeforeexporttoexcel', () => this.loadingClass = 'mdi mdi-load mdi-spin-1s mdi-22px');
    this._bindingEventService.bind(gridContainerElm, 'onafterexporttoexcel', () => this.loadingClass = '');
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);

    // you could group by duration on page load (must be AFTER the DataView is created, so after GridBundle)
    // this.groupByDuration();

    // override CSS template to be Material Design
    // await import('@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-material.scss');
    document.body.classList.add('material-theme');
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
    document.body.classList.remove('material-theme');
  }

  initializeGrid() {
    // add a simple button with event listener on 1st column for testing purposes
    // a simple button with click event
    const nameElementColumn1 = document.createElement('div');
    const btn = document.createElement('button');
    const btnLabel = document.createElement('span');
    btnLabel.className = 'mdi mdi-help-circle no-padding';
    btn.dataset.test = 'col1-hello-btn';
    btn.className = 'button is-small ml-5';
    btn.textContent = 'Click me';
    btn.title = 'simple column header test with a button click listener';
    btn.addEventListener('click', () => alert('Hello World'));
    btn.appendChild(btnLabel);
    nameElementColumn1.appendChild(document.createTextNode('Id '));
    nameElementColumn1.appendChild(btn);

    this.columnDefinitions = [
      {
        id: 'sel', name: nameElementColumn1, field: 'num', type: FieldType.number,
        columnPickerLabel: 'Custom Label', // add a custom label for the ColumnPicker/GridMenu when default header value extractor doesn't work for you ()
        width: 160, maxWidth: 200,
        excludeFromExport: true,
        resizable: true,
        filterable: true,
        selectable: false,
        focusable: false
      },
      {
        id: 'title', name: 'Title', field: 'title',
        width: 50,
        minWidth: 50,
        cssClass: 'cell-title',
        filterable: true,
        sortable: true
      },
      {
        id: 'duration', name: 'Duration', field: 'duration',
        minWidth: 50, width: 60,
        filterable: true,
        filter: {
          model: Filters.slider,
          operator: '>=',
          filterOptions: { hideSliderNumber: true, enableSliderTrackColoring: true, sliderTrackFilledColor: '#9ac49c' } as SliderOption
        },
        sortable: true,
        type: FieldType.number,
        groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        params: { groupFormatterPrefix: 'Total: ' }
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete',
        minWidth: 70, width: 90,
        formatter: Formatters.percentCompleteBar,
        filterable: true,
        filter: { model: Filters.compoundSlider },
        sortable: true,
        type: FieldType.number,
        groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
        params: { groupFormatterPrefix: '<i>Avg</i>: ' }
      },
      {
        id: 'start', name: 'Start', field: 'start',
        minWidth: 60,
        maxWidth: 130,
        filterable: true,
        filter: { model: Filters.compoundDate },
        sortable: true,
        type: FieldType.dateUsShort,
        formatter: Formatters.dateUs,
        exportWithFormatter: true
      },
      {
        id: 'finish', name: 'Finish', field: 'finish',
        minWidth: 60,
        maxWidth: 130,
        filterable: true,
        filter: { model: Filters.compoundDate },
        sortable: true,
        type: FieldType.dateUsShort,
        formatter: Formatters.dateUs,
      },
      {
        id: 'cost', name: 'Cost', field: 'cost',
        minWidth: 70, width: 80,
        sortable: true, filterable: true,
        filter: { model: Filters.compoundInputNumber },
        type: FieldType.number,
        formatter: Formatters.currency,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsCurrency,
        params: { displayNegativeNumberWithParentheses: true, currencyPrefix: '€', groupFormatterCurrencyPrefix: '€', minDecimal: 2, maxDecimal: 4, groupFormatterPrefix: '<b>Total</b>: ' },
        excelExportOptions: {
          style: {
            font: { outline: true, italic: true },
            format: '€0.00##;[Red](€0.00##)',
          },
          width: 18
        },
        groupTotalsExcelExportOptions: {
          style: {
            alignment: { horizontal: 'center' },
            font: { bold: true, color: 'FF005289', underline: 'single', fontName: 'Consolas', size: 10 },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'FFE6F2F6' },
            border: {
              top: { color: 'FFa500ff', style: 'thick', },
              left: { color: 'FFa500ff', style: 'medium', },
              right: { color: 'FFa500ff', style: 'dotted', },
              bottom: { color: 'FFa500ff', style: 'double', },
            },
            format: '"Total: "€0.00##;[Red]"Total: "(€0.00##)'
          },
        },
      },
      {
        id: 'effortDriven', name: 'Effort Driven',
        minWidth: 30, width: 80, maxWidth: 90,
        cssClass: 'cell-effort-driven',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.singleSelect,

          // pass a regular collection array with value/label pairs
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],

          // Select Filters can also support collection that are async, it could be a Promise (shown below) or Fetch result
          // collectionAsync: new Promise<any>(resolve => window.setTimeout(() => {
          //   resolve([{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }]);
          // }, 250)),
        },
        excelExportOptions: { width: 11 }
      }
    ];

    this.gridOptions = {
      autoResize: {
        bottomPadding: 30,
        rightPadding: 50
      },
      enableTextExport: true,
      enableFiltering: true,
      enableGrouping: true,
      columnPicker: {
        onColumnsChanged: (e, args) => console.log(e, args)
      },
      enableExcelExport: true,
      excelExportOptions: {
        filename: 'my-export',
        sanitizeDataExport: true,
        columnHeaderStyle: {
          font: { color: 'FFFFFFFF' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4a6c91' }
        },

        // optionally pass a custom header to the Excel Sheet
        // a lot of the info can be found on Web Archive of Excel-Builder
        // https://ghiscoding.gitbook.io/excel-builder-vanilla/cookbook/fonts-and-colors
        customExcelHeader: (workbook, sheet) => {
          const excelFormat = workbook.getStyleSheet().createFormat({
            // every color is prefixed with FF, then regular HTML color
            font: { size: 18, fontName: 'Calibri', bold: true, color: 'FFFFFFFF' },
            alignment: { wrapText: true, horizontal: 'center' },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF203764' },
          });
          sheet.setRowInstructions(0, { height: 50 }); // change height of row 0

          // excel cells start with A1 which is upper left corner
          const customTitle = 'Grouping and Aggregator - My header is too long enough, so it will wrap';
          sheet.mergeCells('A1', 'H1');
          sheet.data.push([{ value: customTitle, metadata: { style: excelFormat.id } }]);
        },
      },
      textExportOptions: { filename: 'my-export', sanitizeDataExport: true },
      externalResources: [this.excelExportService, new TextExportService()],
      showCustomFooter: true, // display some metrics in the bottom custom footer
      customFooterOptions: {
        // optionally display some text on the left footer container
        leftFooterText: 'Grid created with <a href="https://github.com/ghiscoding/slickgrid-universal" target="_blank">Slickgrid-Universal</a>',
        hideMetrics: false,
        hideTotalItemCount: false,
        hideLastUpdateTimestamp: false
      },
      // forceSyncScrolling: true,
      rowTopOffsetRenderType: 'transform', // defaults: 'top'

      // you can improve Date sorting by pre-parsing date items to `Date` object (this avoid reparsing the same dates multiple times)
      preParseDateColumns: true, // '__',
    };
  }

  loadData(rowCount: number) {
    // mock a dataset
    const tmpArray: any[] = [];
    for (let i = 0; i < rowCount; i++) {
      const randomYearShort = randomBetween(10, 35);
      const randomMonth = randomBetween(1, 12);
      const randomDay = randomBetween(5, 28);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = (i % 33 === 0) ? null : Math.round(Math.random() * 10000) / 100;

      tmpArray[i] = {
        id: 'id_' + i,
        num: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: `${randomMonth}/${randomDay}/${randomYearShort}`,
        finish: `${randomMonth === 12 ? randomMonth : randomMonth + 1}/${randomDay}/${randomYearShort}`,
        cost: i % 3 ? randomCost : randomCost !== null ? -randomCost : null,
        effortDriven: (i % 5 === 0)
      };
    }
    if (this.sgb) {
      this.sgb.dataset = tmpArray;
    }
    return tmpArray;
  }

  clearGrouping() {
    this.sgb?.dataView?.setGrouping([]);
  }

  collapseAllGroups() {
    this.sgb?.dataView?.collapseAllGroups();
  }

  expandAllGroups() {
    this.sgb?.dataView?.expandAllGroups();
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({ filename: 'export', format: FileType.xlsx, });
  }

  groupByDuration() {
    // you need to manually add the sort icon(s) in UI
    this.sgb?.slickGrid?.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
    this.sgb?.dataView?.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
      aggregators: [
        new Aggregators.Avg('percentComplete'),
        new Aggregators.Sum('cost')
      ],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true
    } as Grouping);
    this.sgb?.slickGrid?.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationOrderByCount(aggregateCollapsed) {
    this.sgb?.slickGrid?.setSortColumns([]);
    this.sgb?.dataView?.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      comparer: (a, b) => a.count - b.count,
      aggregators: [
        new Aggregators.Avg('percentComplete'),
        new Aggregators.Sum('cost')
      ],
      aggregateCollapsed,
      lazyTotalsCalculation: true
    } as Grouping);
    this.sgb?.slickGrid?.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationEffortDriven() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [{ columnId: 'duration', sortAsc: true }, { columnId: 'effortDriven', sortAsc: true }];
    this.sgb?.slickGrid?.setSortColumns(sortColumns);
    this.sgb?.dataView?.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value}  <span class="text-green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Sum('duration'),
          new Aggregators.Sum('cost')
        ],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${(g.value ? 'True' : 'False')} <span class="text-green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Avg('percentComplete'),
          new Aggregators.Sum('cost')
        ],
        collapsed: true,
        lazyTotalsCalculation: true
      }
    ] as Grouping[]);
    this.sgb?.slickGrid?.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationEffortDrivenPercent() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
      { columnId: 'percentComplete', sortAsc: true }
    ];
    this.sgb?.slickGrid?.setSortColumns(sortColumns);
    this.sgb?.dataView?.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value}  <span class="text-green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Sum('duration'),
          new Aggregators.Sum('cost')
        ],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${(g.value ? 'True' : 'False')}  <span class="text-green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Sum('duration'),
          new Aggregators.Sum('cost')
        ],
        lazyTotalsCalculation: true
      },
      {
        getter: 'percentComplete',
        formatter: (g) => `% Complete: ${g.value}  <span class="text-green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Avg('percentComplete')
        ],
        aggregateCollapsed: true,
        collapsed: true,
        lazyTotalsCalculation: true
      }
    ] as Grouping[]);
    this.sgb?.slickGrid?.invalidate(); // invalidate all rows and re-render
  }
}