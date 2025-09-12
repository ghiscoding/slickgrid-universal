import { IHttpClient } from '@aurelia/fetch-client';
import { newInstanceOf, resolve } from '@aurelia/kernel';
import { type AureliaGridInstance, type Column, Filters, type GridOption } from 'aurelia-slickgrid';

import './example22.scss';
import CUSTOMERS_URL from './data/customers_100.json?url';

export class Example22 {
  aureliaGrid2!: AureliaGridInstance;
  gridOptions1!: GridOption;
  gridOptions2!: GridOption;
  columnDefinitions1: Column[] = [];
  columnDefinitions2: Column[] = [];
  dataset1: any[] = [];
  dataset2: any[] = [];
  hideSubTitle = false;

  constructor(readonly http: IHttpClient = resolve(newInstanceOf(IHttpClient))) {
    // define the grid options & columns and then create the grid itself
    this.defineGrid1();
    this.defineGrid2();
  }

  aureliaGrid2Ready(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid2 = aureliaGrid;
  }

  async attached() {
    // mock some data with JavaScript
    this.dataset1 = this.mockData();

    // load data with Fetch-Client
    const response2 = await fetch(CUSTOMERS_URL);
    this.dataset2 = await response2['json']();
  }

  // Grid2 definition
  defineGrid1() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
      { id: 'start', name: 'Start', field: 'start', minWidth: 100 },
      { id: 'finish', name: 'Finish', field: 'finish', minWidth: 100 },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
    ];
    this.gridOptions1 = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableSorting: true,
    };
  }

  // Grid2 definition
  defineGrid2() {
    this.columnDefinitions2 = [
      { id: 'name', name: 'Name', field: 'name', filterable: true, sortable: true },
      {
        id: 'gender',
        name: 'Gender',
        field: 'gender',
        filterable: true,
        sortable: true,
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: 'male', label: 'male' },
            { value: 'female', label: 'female' },
          ],
        },
      },
      { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true },
    ];

    this.gridOptions2 = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableSorting: true,
    };
  }

  mockData() {
    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < 1000; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: `${randomMonth}/${randomDay}/${randomYear}`,
        finish: `${randomMonth}/${randomDay}/${randomYear}`,
        effortDriven: i % 5 === 0,
      };
    }

    return mockDataset;
  }

  /**
   * When changing Tab, we need to resize the grid in the new Tab that becomes in focus.
   * We need to do this (only once) because SlickGrid relies on the grid being visible in the DOM for it to be sized properly
   * and if it's not (like our use case) we need to resize the grid ourselve and we just need to do that once.
   */
  resizeGrid2() {
    this.aureliaGrid2.resizerService.resizeGrid(10);
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid2.resizerService.resizeGrid(0);
  }
}
