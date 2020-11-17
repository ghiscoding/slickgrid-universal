import {
  Aggregators,
  Column,
  FieldType,
  Filters,
  FileType,
  Formatters,
  GridOption,
  Grouping,
  GroupTotalFormatters,
  SlickDataView,
  SlickGrid,
  SortComparers,
  SortDirectionNumber
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { FileExportService } from '@slickgrid-universal/file-export';
import { Slicker, SlickerGridInstance, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import '../material-styles.scss';
import './example02.scss';
import { EventService } from './event.service';

const NB_ITEMS = 500;

export class Example2 {
  private eventService: EventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  commandQueue = [];
  sgb: SlickVanillaGridBundle;
  excelExportService = new ExcelExportService();

  get dataViewObj(): SlickDataView {
    return this.sgb?.dataView;
  }
  get gridObj(): SlickGrid {
    return this.sgb?.slickGrid;
  }
  get slickerGridInstance(): SlickerGridInstance {
    return this.sgb?.instances;
  }

  constructor() {
    this.eventService = new EventService();
  }

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(NB_ITEMS);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid2`);

    this.eventService.addElementEventListener(gridContainerElm, 'onbeforeexporttoexcel', () => console.log('onBeforeExportToExcel'));
    this.eventService.addElementEventListener(gridContainerElm, 'onafterexporttoexcel', () => console.log('onAfterExportToExcel'));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);

    // you could group by duration on page load (must be AFTER the DataView is created, so after GridBundle)
    // this.groupByDuration();
  }

  dispose() {
    this.sgb?.dispose();
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'sel', name: '#', field: 'num', width: 40,
        excludeFromExport: true,
        maxWidth: 70,
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
        filter: { model: Filters.slider, operator: '>=' },
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
        type: FieldType.dateIso,
        formatter: Formatters.dateIso,
        exportWithFormatter: true
      },
      {
        id: 'finish', name: 'Finish', field: 'finish',
        minWidth: 60,
        maxWidth: 130,
        filterable: true,
        filter: { model: Filters.compoundDate },
        sortable: true,
        type: FieldType.dateIso,
        formatter: Formatters.dateIso,
        exportWithFormatter: true
      },
      {
        id: 'cost', name: 'Cost', field: 'cost',
        minWidth: 70,
        width: 80,
        maxWidth: 120,
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
        type: FieldType.number,
        sortable: true,
        exportWithFormatter: true,
        formatter: Formatters.dollar,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
        params: { groupFormatterPrefix: '<b>Total</b>: ' /* , groupFormatterSuffix: ' USD' */ }
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
          // collectionAsync: new Promise<any>(resolve => setTimeout(() => {
          //   resolve([{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }]);
          // }, 250)),
        }
      }
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
        bottomPadding: 30,
        rightPadding: 10
      },
      enableExport: true,
      enableFiltering: true,
      enableGrouping: true,
      exportOptions: {
        sanitizeDataExport: true
      },
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true
      },
      registerExternalServices: [this.excelExportService, new FileExportService()],
      showCustomFooter: true, // display some metrics in the bottom custom footer
      customFooterOptions: {
        // optionally display some text on the left footer container
        leftFooterText: 'Grid created with <a href="https://github.com/ghiscoding/slickgrid-universal" target="_blank">Slickgrid-Universal</a>',
        hideMetrics: false,
        hideTotalItemCount: false,
        hideLastUpdateTimestamp: false
      },
    };
  }

  loadData(rowCount: number) {
    // mock a dataset
    const tmpArray = [];
    for (let i = 0; i < rowCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      tmpArray[i] = {
        id: 'id_' + i,
        num: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, (randomMonth + 1), randomDay),
        cost: (i % 33 === 0) ? null : Math.round(Math.random() * 10000) / 100,
        effortDriven: (i % 5 === 0)
      };
    }
    if (this.sgb) {
      this.sgb.dataset = tmpArray;
    }
    return tmpArray;
  }

  clearGrouping() {
    this.dataViewObj.setGrouping([]);
  }

  collapseAllGroups() {
    this.dataViewObj.collapseAllGroups();
  }

  expandAllGroups() {
    this.dataViewObj.expandAllGroups();
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({ filename: 'export', format: FileType.xlsx, });
  }

  groupByDuration() {
    this.dataViewObj.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
      aggregators: [
        new Aggregators.Avg('percentComplete'),
        new Aggregators.Sum('cost')
      ],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true
    } as Grouping);

    // you need to manually add the sort icon(s) in UI
    this.sgb.instances.slickGrid.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
    this.gridObj.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationOrderByCount(aggregateCollapsed) {
    this.gridObj.setSortColumns([]);
    this.dataViewObj.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      comparer: (a, b) => a.count - b.count,
      aggregators: [
        new Aggregators.Avg('percentComplete'),
        new Aggregators.Sum('cost')
      ],
      aggregateCollapsed,
      lazyTotalsCalculation: true
    } as Grouping);
    this.gridObj.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationEffortDriven() {
    this.gridObj.setSortColumns([]);
    this.dataViewObj.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Sum('duration'),
          new Aggregators.Sum('cost')
        ],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${(g.value ? 'True' : 'False')} <span style="color:green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Avg('percentComplete'),
          new Aggregators.Sum('cost')
        ],
        collapsed: true,
        lazyTotalsCalculation: true
      }
    ] as Grouping[]);

    // you need to manually add the sort icon(s) in UI
    const sortColumns = [{ columnId: 'duration', sortAsc: true }, { columnId: 'effortDriven', sortAsc: true }];
    this.gridObj.setSortColumns(sortColumns);
    this.gridObj.invalidate(); // invalidate all rows and re-render
  }

  groupByDurationEffortDrivenPercent() {
    this.gridObj.setSortColumns([]);
    this.dataViewObj.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Sum('duration'),
          new Aggregators.Sum('cost')
        ],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${(g.value ? 'True' : 'False')}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Sum('duration'),
          new Aggregators.Sum('cost')
        ],
        lazyTotalsCalculation: true
      },
      {
        getter: 'percentComplete',
        formatter: (g) => `% Complete: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [
          new Aggregators.Avg('percentComplete')
        ],
        aggregateCollapsed: true,
        collapsed: true,
        lazyTotalsCalculation: true
      }
    ] as Grouping[]);

    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
      { columnId: 'percentComplete', sortAsc: true }
    ];
    this.gridObj.setSortColumns(sortColumns);
    this.gridObj.invalidate(); // invalidate all rows and re-render
  }
}
