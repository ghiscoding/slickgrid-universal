import { Component, type OnDestroy, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Aggregators,
  type AngularGridInstance,
  AngularSlickgridModule,
  type Column,
  Editors,
  Filters,
  Formatters,
  type GridOption,
  Grouping,
  GroupTotalFormatters,
  type SlickRowDetailView,
  SortComparers,
  SortDirectionNumber,
} from '../../library';

import { Example47RowDetailComponent } from './example47-rowdetail.component';
import { RowDetailPreloadComponent } from './rowdetail-preload.component';

const FAKE_SERVER_DELAY = 250;
const NB_ITEMS = 1000;

export interface Item {
  id: number;
  title: string;
  duration: number;
  cost: number;
  percentComplete: number;
  start: Date;
  finish: Date;
  effortDriven: boolean;
}

@Component({
  templateUrl: './example47.component.html',
  imports: [FormsModule, AngularSlickgridModule],
})
export class Example47Component implements OnDestroy, OnInit {
  private _darkMode = false;
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column<Item>[] = [];
  gridOptions!: GridOption;
  dataset: Item[] = [];
  gridObj: any;
  dataviewObj: any;
  detailViewRowCount = 9;
  hideSubTitle = false;
  flashAlertType = 'info';
  message = '';
  serverWaitDelay = FAKE_SERVER_DELAY;

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridObj = angularGrid.slickGrid;
    this.dataviewObj = angularGrid.dataView;
    this.groupByDuration(); // group by duration on page load
  }

  get rowDetailInstance(): SlickRowDetailView {
    // you can get the SlickGrid RowDetail plugin (addon) instance via 2 ways

    // option 1
    return this.angularGrid.extensions.rowDetailView?.instance || {};

    // OR option 2
    // return this.angularGrid?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView) || {};
  }

  ngOnInit(): void {
    this.defineGrid();
  }

  ngOnDestroy(): void {
    document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
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
      rowDetailView: {
        process: (item) => this.simulateServerAsyncCall(item),
        loadOnce: true,
        singleRowExpand: false,
        useRowClick: false,
        panelRows: this.detailViewRowCount,

        // Preload View Component
        preloadComponent: RowDetailPreloadComponent,

        // View Component to load when row detail data is ready
        viewComponent: Example47RowDetailComponent,
      },
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: true,
      },
    };

    this.getData();
  }

  getData() {
    // mock a dataset
    const tmpData: Item[] = [];
    for (let i = 0; i < NB_ITEMS; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = Math.round(Math.random() * 10000) / 100;

      tmpData[i] = {
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
    this.dataset = tmpData;
  }

  changeDetailViewRowCount() {
    if (this.angularGrid?.extensionService) {
      const options = this.rowDetailInstance.getOptions();
      if (options?.panelRows) {
        options.panelRows = this.detailViewRowCount; // change number of rows dynamically
        this.rowDetailInstance.setOptions(options);
      }
    }
  }

  closeAllRowDetail() {
    if (this.angularGrid?.extensionService) {
      this.rowDetailInstance.collapseAll();
    }
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
    this.angularGrid.filterService.setSortColumnIcons([{ columnId: 'duration', sortAsc: true }]);
    this.dataviewObj.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
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
    this.angularGrid.filterService.setSortColumnIcons(sortColumns);
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
  simulateServerAsyncCall(item: Item) {
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
        const itemDetail = item as Item & { assignee: string; reporter: string };

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
    this.angularGrid.slickGrid?.setOptions({ darkMode: this._darkMode });
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
    this.angularGrid.resizerService.resizeGrid(2);
  }

  private randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
