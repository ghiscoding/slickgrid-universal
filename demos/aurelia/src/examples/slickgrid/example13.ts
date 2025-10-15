import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import {
  Aggregators,
  Filters,
  Formatters,
  GroupTotalFormatters,
  SortComparers,
  SortDirectionNumber,
  type AureliaGridInstance,
  type Column,
  type GridOption,
  type Grouping,
  type SlickDataView,
  type SlickGrid,
} from 'aurelia-slickgrid';

const NB_ITEMS = 1000;

export class Example13 {
  aureliaGrid!: AureliaGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];
  dataviewObj!: SlickDataView;
  gridObj!: SlickGrid;
  hideSubTitle = false;
  processing = false;
  excelExportService = new ExcelExportService();
  textExportService = new TextExportService();

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  attached() {
    // populate the dataset once the grid is ready
    this.loadData(NB_ITEMS);
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
    this.dataviewObj = aureliaGrid.dataView;
    this.gridObj = aureliaGrid.slickGrid;
    this.groupByDuration(); // group by duration on page load
  }

  /* Define grid Options and Columns */
  defineGrid() {
    // add a simple button with event listener on 1st column for testing purposes
    // a simple button with click event
    const nameElementColumn1 = document.createElement('div');
    const btn = document.createElement('button');
    const btnLabel = document.createElement('span');
    btnLabel.className = 'mdi mdi-help-circle no-padding';
    btn.dataset.test = 'col1-hello-btn';
    btn.className = 'btn btn-outline-secondary btn-xs btn-icon ms-1';
    btn.textContent = 'Click me';
    btn.title = 'simple column header test with a button click listener';
    btn.addEventListener('click', () => alert('Hello World'));
    btn.appendChild(btnLabel);
    nameElementColumn1.appendChild(document.createTextNode('Id '));
    nameElementColumn1.appendChild(btn);

    this.columnDefinitions = [
      {
        id: 'sel',
        name: nameElementColumn1,
        field: 'num',
        type: 'number',
        columnPickerLabel: 'Custom Label', // add a custom label for the ColumnPicker/GridMenu when default header value extractor doesn't work for you ()
        width: 140,
        maxWidth: 150,
        excludeFromExport: true,
        resizable: true,
        filterable: true,
        selectable: false,
        focusable: false,
      },
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        width: 50,
        minWidth: 50,
        cssClass: 'cell-title',
        filterable: true,
        sortable: true,
      },
      {
        id: 'duration',
        name: 'Duration',
        field: 'duration',
        minWidth: 50,
        width: 60,
        filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
        sortable: true,
        type: 'number',
        groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        params: { groupFormatterPrefix: 'Total: ' },
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 70,
        width: 90,
        formatter: Formatters.percentCompleteBar,
        filterable: true,
        filter: { model: Filters.compoundSlider },
        sortable: true,
        type: 'number',
        groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
        params: { groupFormatterPrefix: '<i>Avg</i>: ' },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        minWidth: 60,
        maxWidth: 130,
        filterable: true,
        filter: { model: Filters.compoundDate },
        sortable: true,
        type: 'dateIso',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        minWidth: 60,
        maxWidth: 130,
        filterable: true,
        filter: { model: Filters.compoundDate },
        sortable: true,
        type: 'dateIso',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
      },
      {
        id: 'cost',
        name: 'Cost',
        field: 'cost',
        minWidth: 70,
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
        type: 'number',
        formatter: Formatters.currency,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsCurrency,
        params: {
          displayNegativeNumberWithParentheses: true,
          currencyPrefix: '€',
          groupFormatterCurrencyPrefix: '€',
          minDecimal: 2,
          maxDecimal: 4,
          groupFormatterPrefix: '<b>Total</b>: ',
        },
        excelExportOptions: {
          style: {
            font: { outline: true, italic: true },
            format: '€0.00##;[Red](€0.00##)',
          },
          width: 18,
        },
        groupTotalsExcelExportOptions: {
          style: {
            alignment: { horizontal: 'center' },
            font: { bold: true, color: 'FF005289', underline: 'single', fontName: 'Consolas', size: 10 },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'FFE6F2F6' },
            border: {
              top: { color: 'FFa500ff', style: 'thick' },
              left: { color: 'FFa500ff', style: 'medium' },
              right: { color: 'FFa500ff', style: 'dotted' },
              bottom: { color: 'FFa500ff', style: 'double' },
            },
            format: '"Total: "€0.00##;[Red]"Total: "(€0.00##)',
          },
        },
      },
      {
        id: 'effortDriven',
        name: 'Effort Driven',
        minWidth: 30,
        width: 80,
        maxWidth: 90,
        cssClass: 'cell-effort-driven',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      // you could debounce/throttle the input text filter if you have lots of data
      // filterTypingDebounce: 250,
      enableGrouping: true,
      enableExcelExport: true,
      enableTextExport: true,
      excelExportOptions: { sanitizeDataExport: true },
      textExportOptions: { sanitizeDataExport: true },
      externalResources: [this.excelExportService, this.textExportService],
      showCustomFooter: true,
      customFooterOptions: {
        // optionally display some text on the left footer container
        hideMetrics: false,
        hideTotalItemCount: false,
        hideLastUpdateTimestamp: false,
      },
    };
  }

  loadData(rowCount: number) {
    // mock a dataset
    const tmpData: any[] = [];
    for (let i = 0; i < rowCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = i % 33 === 0 ? null : Math.round(Math.random() * 10000) / 100;

      tmpData[i] = {
        id: 'id_' + i,
        num: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        cost: i % 3 ? randomCost : randomCost !== null ? -randomCost : null,
        effortDriven: i % 5 === 0,
      };
    }
    this.dataset = tmpData;
  }

  clearGrouping() {
    this.dataviewObj.setGrouping([]);
  }

  collapseAllGroups() {
    this.dataviewObj.collapseAllGroups();
  }

  expandAllGroups() {
    this.dataviewObj.expandAllGroups();
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({
      filename: 'Export',
      format: 'xlsx',
    });
  }

  groupByDuration() {
    // you need to manually add the sort icon(s) in UI
    this.aureliaGrid.filterService.setSortColumnIcons([{ columnId: 'duration', sortAsc: true }]);
    this.dataviewObj.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      comparer: (a, b) => {
        return SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc);
      },
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);
    this.gridObj.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationOrderByCount(aggregateCollapsed: boolean) {
    this.aureliaGrid.filterService.setSortColumnIcons([]);
    this.dataviewObj.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      comparer: (a, b) => {
        return a.count - b.count;
      },
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed,
      lazyTotalsCalculation: true,
    } as Grouping);
    this.gridObj.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationEffortDriven() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
    ];
    this.aureliaGrid.filterService.setSortColumnIcons(sortColumns);
    this.dataviewObj.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true,
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${g.value ? 'True' : 'False'} <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
        collapsed: true,
        lazyTotalsCalculation: true,
      },
    ] as Grouping[]);
    this.gridObj.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationEffortDrivenPercent() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
      { columnId: 'percentComplete', sortAsc: true },
    ];
    this.aureliaGrid.filterService.setSortColumnIcons(sortColumns);
    this.dataviewObj.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true,
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${g.value ? 'True' : 'False'}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        lazyTotalsCalculation: true,
      },
      {
        getter: 'percentComplete',
        formatter: (g) => `% Complete: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Avg('percentComplete')],
        aggregateCollapsed: true,
        collapsed: true,
        lazyTotalsCalculation: true,
      },
    ] as Grouping[]);
    this.gridObj.invalidate(); // invalidate all rows and re-render
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
