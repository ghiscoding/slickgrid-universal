import { type AureliaGridInstance, type Column, type GridOption, Formatters } from 'aurelia-slickgrid';

import { zeroPadding } from './utilities.js';

const NB_ITEMS = 995;

export class Example1 {
  private _darkModeGrid1 = false;
  title = 'Example 1: Basic Grids';
  subTitle = `Simple Grids with Fixed Sizes (800 x 225)`;

  aureliaGrid1!: AureliaGridInstance;
  gridOptions1!: GridOption;
  gridOptions2!: GridOption;
  columnDefinitions1: Column[] = [];
  columnDefinitions2: Column[] = [];
  dataset1: any[] = [];
  dataset2: any[] = [];
  hideSubTitle = false;

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrids();
  }

  attached() {
    // mock some data (different in each dataset)
    this.dataset1 = this.mockData(NB_ITEMS);
    this.dataset2 = this.mockData(NB_ITEMS);
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid1 = aureliaGrid;
  }

  isBrowserDarkModeEnabled() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  detaching() {
    // also unsubscribe all Angular Subscriptions
    document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
    ];
    this._darkModeGrid1 = this.isBrowserDarkModeEnabled();
    this.gridOptions1 = {
      darkMode: this._darkModeGrid1,
      gridHeight: 225,
      gridWidth: 800,
      enableAutoResize: false,
      enableSorting: true,
    };

    // copy the same Grid Options and Column Definitions to 2nd grid
    // but also add Pagination in this grid
    this.columnDefinitions2 = this.columnDefinitions1;
    this.gridOptions2 = {
      ...this.gridOptions1,
      ...{
        darkMode: false,
        enablePagination: true,
        pagination: {
          pageSizes: [5, 10, 20, 25, 50],
          pageSize: 5,
        },
      },
    };
  }

  mockData(count: number) {
    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: `${zeroPadding(randomYear)}-${zeroPadding(randomMonth + 1)}-${zeroPadding(randomDay)}`,
        finish: `${zeroPadding(randomYear + 1)}-${zeroPadding(randomMonth + 1)}-${zeroPadding(randomDay)}`,
        effortDriven: i % 5 === 0,
      };
    }

    return mockDataset;
  }

  toggleDarkModeGrid1() {
    this._darkModeGrid1 = !this._darkModeGrid1;
    if (this._darkModeGrid1) {
      document.querySelector('.grid-container1')?.classList.add('dark-mode');
    } else {
      document.querySelector('.grid-container1')?.classList.remove('dark-mode');
    }
    this.aureliaGrid1.slickGrid?.setOptions({ darkMode: this._darkModeGrid1 });
  }
}
