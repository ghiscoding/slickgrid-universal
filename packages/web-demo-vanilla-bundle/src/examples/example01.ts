import { Column, Formatters, GridOption } from '@slickgrid-universal/common';
import { Slicker } from '@slickgrid-universal/vanilla-bundle';

const NB_ITEMS = 995;

export class Example1 {
  gridOptions1: GridOption;
  gridOptions2: GridOption;
  columnDefinitions1: Column[];
  columnDefinitions2: Column[];
  dataset1: any[];
  dataset2: any[];
  slickgridLwc1;
  slickgridLwc2;

  attached() {
    this.defineGrids();
    const gridContainerElm1 = document.querySelector(`.grid1`);
    const gridContainerElm2 = document.querySelector(`.grid2`);

    // mock some data (different in each dataset)
    this.dataset1 = this.mockData(NB_ITEMS);
    this.dataset2 = this.mockData(NB_ITEMS);

    this.slickgridLwc1 = new Slicker.GridBundle(gridContainerElm1, this.columnDefinitions1, this.gridOptions1, this.dataset1);
    this.slickgridLwc2 = new Slicker.GridBundle(gridContainerElm2, this.columnDefinitions2, this.gridOptions2, this.dataset2);
  }

  dispose() {
    this.slickgridLwc1.dispose();
    this.slickgridLwc2.dispose();
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 }
    ];
    this.gridOptions1 = {
      enableAutoResize: false,
      enableSorting: true,
      gridHeight: 225,
      gridWidth: 800,
    };

    // copy the same Grid Options and Column Definitions to 2nd grid
    // but also add Pagination in this grid
    this.columnDefinitions2 = this.columnDefinitions1;
    this.gridOptions2 = {
      ...this.gridOptions1,
      ...{
        enablePagination: true,
        pagination: {
          pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
          pageSize: 5
        },
      }
    };
  }

  mockData(count: number) {
    // mock a dataset
    const mockDataset = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        effortDriven: (i % 5 === 0)
      };
    }

    return mockDataset;
  }
}
