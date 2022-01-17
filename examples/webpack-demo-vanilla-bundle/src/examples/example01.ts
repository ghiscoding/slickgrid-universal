import { Column, ExtensionName, FieldType, Formatters, GridOption } from '@slickgrid-universal/common';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';

// use any of the Styling Theme
// import '../material-styles.scss';
import '../salesforce-styles.scss';
import './example01.scss';

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
  isGrid2WithPagination = true;

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
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100, filterable: true, type: FieldType.number },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100, filterable: true, type: FieldType.number },
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
        columnPicker: {
          onColumnsChanged: (e, args) => console.log('onColumnPickerColumnsChanged - visible columns count', args.visibleColumns.length),
        },
        gridMenu: {
          // commandItems: [
          //   { command: 'help', title: 'Help', positionOrder: 70, action: (e, args) => console.log(args) },
          //   { command: '', divider: true, positionOrder: 72 },
          //   { command: 'hello', title: 'Hello', positionOrder: 69, action: (e, args) => alert('Hello World'), cssClass: 'red', tooltip: 'Hello World', iconCssClass: 'mdi mdi-close' },
          // ],
          // menuUsabilityOverride: () => false,
          onBeforeMenuShow: () => {
            console.log('onGridMenuBeforeMenuShow');
            // return false; // returning false would prevent the grid menu from opening
          },
          onAfterMenuShow: () => console.log('onGridMenuAfterMenuShow'),
          onColumnsChanged: (_e, args) => console.log('onGridMenuColumnsChanged', args),
          onCommand: (e, args) => {
            // e.preventDefault(); // preventing default event would keep the menu open after the execution
            console.log('onGridMenuCommand', args.command);
          },
          onMenuClose: (e, args) => console.log('onGridMenuMenuClose - visible columns count', args.visibleColumns.length),
        },
        enableFiltering: true,
        enablePagination: true,
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

  // Toggle the Pagination of Grid2
  // IMPORTANT, the Pagination MUST BE CREATED on initial page load before you can start toggling it
  // Basically you cannot toggle a Pagination that doesn't exist (must created at the time as the grid)
  togglePaginationGrid2() {
    this.isGrid2WithPagination = !this.isGrid2WithPagination;
    this.sgb2.paginationService!.togglePaginationVisibility(this.isGrid2WithPagination);
  }

  toggleGridMenu(e: MouseEvent) {
    if (this.sgb2?.extensionService) {
      const gridMenuInstance = this.sgb2.extensionService.getExtensionInstanceByName(ExtensionName.gridMenu);
      // open the external button Grid Menu, you can also optionally pass Grid Menu options as 2nd argument
      // for example we want to align our external button on the right without affecting the menu within the grid which will stay aligned on the left
      gridMenuInstance.showGridMenu(e, { dropSide: 'right' });
    }
  }
}
