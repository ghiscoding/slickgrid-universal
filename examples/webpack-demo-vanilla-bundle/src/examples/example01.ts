import { Column, Formatters, GridOption } from '@slickgrid-universal/common';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';

// use any of the Styling Theme
// import '../material-styles.scss';
import '../salesforce-styles.scss';

const NB_ITEMS = 995;

export class Example1 {
  gridOptions1: GridOption;
  gridOptions2: GridOption;
  columnDefinitions1: Column[];
  columnDefinitions2: Column[];
  dataset1: any[];
  dataset2: any[];
  sgb1: SlickVanillaGridBundle;
  sgb2: SlickVanillaGridBundle;

  attached() {
    this.defineGrids();

    // mock some data (different in each dataset)
    this.dataset1 = this.mockData(NB_ITEMS);
    this.dataset2 = this.mockData(NB_ITEMS);

    this.sgb1 = new Slicker.GridBundle(document.querySelector<HTMLDivElement>(`.grid1`), this.columnDefinitions1, { ...ExampleGridOptions, ...this.gridOptions1 }, this.dataset1);
    this.sgb2 = new Slicker.GridBundle(document.querySelector<HTMLDivElement>(`.grid2`), this.columnDefinitions2, { ...ExampleGridOptions, ...this.gridOptions2 }, this.dataset2);

    // setTimeout(() => {
    //   this.slickgridLwc2.dataset = this.dataset2;
    // }, 1000);
  }

  dispose() {
    this.sgb1?.dispose();
    this.sgb2?.dispose();
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100, filterable: true },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100, filterable: true },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100, filterable: true },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, exportWithFormatter: true, filterable: true },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, exportWithFormatter: true, filterable: true },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100, filterable: true }
    ];
    this.gridOptions1 = {
      enableAutoResize: false,
      gridHeight: 225,
      gridWidth: 800,
      rowHeight: 33,
    };

    // copy the same Grid Options and Column Definitions to 2nd grid
    // but also add Pagination in this grid
    this.columnDefinitions2 = this.columnDefinitions1;
    this.gridOptions2 = {
      ...this.gridOptions1,
      ...{
        gridHeight: 255,
        enablePagination: true,
        enableFiltering: true,
        pagination: {
          pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
          pageSize: 5
        },
        presets: {
          pagination: {
            pageNumber: 2,
            pageSize: 5
          },
          sorters: [
            // { columnId: '%', direction: 'DESC' },
            { columnId: 'title', direction: 'ASC' }
          ],
          filters: [{ columnId: 'title', searchTerms: ['2'] }]
        }
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
