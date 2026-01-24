import { AureliaSlickRowDetailView } from '@slickgrid-universal/aurelia-row-detail-plugin';
import { bindable } from 'aurelia';
import {
  Aggregators,
  Editors,
  ExtensionName,
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
import { ExampleDetailPreload } from './example-detail-preload.js';
import { Example47DetailView } from './example47-detail-view.js';

const FAKE_SERVER_DELAY = 250;
const NB_ITEMS = 1200;

interface Item {
  id: number;
  title: string;
  duration: number;
  cost: number;
  percentComplete: number;
  start: Date;
  finish: Date;
  effortDriven: boolean;
}

export class Example47 {
  private _darkMode = false;
  @bindable detailViewRowCount = 9;
  @bindable serverWaitDelay = FAKE_SERVER_DELAY;

  aureliaGrid!: AureliaGridInstance;
  dataviewObj!: SlickDataView;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  columnDefinitions: Column<Item>[] = [];
  dataset: Item[] = [];
  // extensions!: ExtensionList<any>;
  hideSubTitle = false;
  message = '';

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  get rowDetailInstance() {
    // you can get the SlickGrid RowDetail plugin (addon) instance via 2 ways

    // option 1
    // return this.extensions.rowDetailView.instance || {};
    // return this.aureliaGrid?.extensions.rowDetailView.instance || {};

    // OR option 2
    return this.aureliaGrid?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView);
  }

  attached() {
    // populate the dataset once the grid is ready
    this.getData();
  }

  detaching() {
    document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
    this.dataviewObj = aureliaGrid.dataView;
    this.gridObj = aureliaGrid.slickGrid;
    this.groupByDuration(); // group by duration on page load
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
        width: 70,
        filterable: true,
        editor: { model: Editors.text },
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        type: 'number',
        minWidth: 90,
        filterable: true,
      },
      {
        id: '%',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 200,
        width: 250,
        resizable: false,
        filterable: true,
        sortable: true,
        type: 'number',
        formatter: Formatters.percentCompleteBar,
        groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
        params: { groupFormatterPrefix: '<i>Avg</i>: ' },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
        minWidth: 90,
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
        minWidth: 90,
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
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
        formatter: Formatters.dollar,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        minWidth: 100,
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
        filterable: true,
        sortable: true,
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
      enableGrouping: true,
      enableRowDetailView: true,
      rowTopOffsetRenderType: 'top', // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
      darkMode: this._darkMode,
      externalResources: [AureliaSlickRowDetailView],
      rowDetailView: {
        // optionally change the column index position of the icon (defaults to 0)
        // columnIndexPosition: 1,

        // We can load the "process" asynchronously in 3 different ways (aurelia-http-client, aurelia-fetch-client OR even Promise)
        process: (item) => this.simulateServerAsyncCall(item),
        // process: (item) => this.http.get(`api/item/${item.id}`),

        // load only once and reuse the same item detail without calling process method
        loadOnce: true,

        // limit expanded row to only 1 at a time
        singleRowExpand: false,

        // how many grid rows do we want to use for the row detail panel (this is only set once and will be used for all row detail)
        // also note that the detail view adds an extra 1 row for padding purposes
        // so if you choose 4 panelRows, the display will in fact use 5 rows
        panelRows: this.detailViewRowCount,

        // Preload View Template
        preloadViewModel: ExampleDetailPreload,

        // ViewModel Template to load when row detail data is ready
        viewModel: Example47DetailView,

        // Optionally pass your Parent Component reference to your Child Component (row detail component)
        parentRef: this,
      },
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: true,
      },
    };
  }

  getData() {
    // mock a dataset
    const dataset: Item[] = [];
    for (let i = 0; i < NB_ITEMS; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = Math.round(Math.random() * 10000) / 100;

      dataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.floor(Math.random() * 100),
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        cost: i % 3 ? randomCost : -randomCost,
        effortDriven: i % 5 === 0,
      };
    }

    this.dataset = dataset;
  }

  changeDetailViewRowCount() {
    const options = this.rowDetailInstance.getOptions();
    if (options && options.panelRows) {
      options.panelRows = this.detailViewRowCount; // change number of rows dynamically
      this.rowDetailInstance.setOptions(options);
    }
  }

  closeAllRowDetail() {
    this.rowDetailInstance.collapseAll();
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

  /** Just for demo purposes, we will simulate an async server call and return more details on the selected row item */
  simulateServerAsyncCall(item: any) {
    // random set of names to use for more item detail
    const randomNames = [
      'John Doe',
      'Jane Doe',
      'Chuck Norris',
      'Bumblebee',
      'Jackie Chan',
      'Elvis Presley',
      'Bob Marley',
      'Mohammed Ali',
      'Bruce Lee',
      'Rocky Balboa',
    ];

    // fill the template on async delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const itemDetail = item;

        // let's add some extra properties to our item for a better async simulation
        itemDetail.assignee = randomNames[this.randomNumber(0, 9)] || '';
        itemDetail.reporter = randomNames[this.randomNumber(0, 9)] || '';

        // resolve the data after delay specified
        resolve(itemDetail);
      }, this.serverWaitDelay);
    });
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
    this.toggleBodyBackground();
    this.aureliaGrid.slickGrid?.setOptions({ darkMode: this._darkMode });
    this.closeAllRowDetail();
  }

  toggleBodyBackground() {
    if (this._darkMode) {
      document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
    } else {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    }
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }

  private randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
