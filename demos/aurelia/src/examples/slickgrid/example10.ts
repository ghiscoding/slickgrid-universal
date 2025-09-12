import { bindable } from 'aurelia';
import { type AureliaGridInstance, type Column, Filters, Formatters, type GridOption, type GridStateChange } from 'aurelia-slickgrid';

import './example10.scss'; // provide custom CSS/SASS styling

export class Example10 {
  @bindable() isGrid2WithPagination = true;

  aureliaGrid1!: AureliaGridInstance;
  aureliaGrid2!: AureliaGridInstance;
  columnDefinitions1: Column[] = [];
  columnDefinitions2: Column[] = [];
  gridOptions1!: GridOption;
  gridOptions2!: GridOption;
  dataset1: any[] = [];
  dataset2: any[] = [];
  hideSubTitle = false;
  selectedTitles = '';
  selectedTitle = '';
  selectedGrid2IDs: number[] = [];

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrids();
  }

  attached() {
    // populate the dataset once the grid is ready
    this.dataset1 = this.prepareData(495);
    this.dataset2 = this.prepareData(525);
  }

  aureliaGrid1Ready(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid1 = aureliaGrid;
  }

  aureliaGrid2Ready(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid2 = aureliaGrid;
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, filterable: true },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, type: 'number', filterable: true },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        formatter: Formatters.percentCompleteBar,
        type: 'number',
        filterable: true,
        sortable: true,
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        type: 'date',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        type: 'date',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'true' },
            { value: false, label: 'false' },
          ],
          model: Filters.singleSelect,
        },
      },
    ];

    this.columnDefinitions2 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, filterable: true },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, type: 'number', filterable: true },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        formatter: Formatters.percentCompleteBar,
        type: 'number',
        filterable: true,
        sortable: true,
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        type: 'date',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        type: 'date',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'true' },
            { value: false, label: 'false' },
          ],
          model: Filters.singleSelect,
        },
      },
    ];

    this.gridOptions1 = {
      enableAutoResize: false,
      enableCellNavigation: true,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      enableFiltering: true,
      checkboxSelector: {
        // remove the unnecessary "Select All" checkbox in header when in single selection mode
        hideSelectAllCheckbox: true,

        // you can override the logic for showing (or not) the expand icon
        // for example, display the expand icon only on every 2nd row
        // selectableOverride: (row: number, dataContext: any, grid: SlickGrid) => (dataContext.id % 2 === 1)
      },
      multiSelect: false,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: true,
      },
      columnPicker: {
        hideForceFitButton: true,
      },
      gridMenu: {
        hideForceFitButton: true,
      },
      gridHeight: 225,
      gridWidth: 800,
      enablePagination: true,
      pagination: {
        pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
        pageSize: 5,
      },
      // we can use some Presets, for the example Pagination
      presets: {
        pagination: { pageNumber: 2, pageSize: 5 },
      },
    };

    this.gridOptions2 = {
      enableAutoResize: false,
      enableCellNavigation: true,
      enableFiltering: true,
      checkboxSelector: {
        // optionally change the column index position of the icon (defaults to 0)
        // columnIndexPosition: 1,

        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true, // when clicking "Select All", should we apply it to all pages (defaults to true)
      },
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
      },
      enableCheckboxSelector: true,
      enableRowSelection: true,
      gridHeight: 255,
      gridWidth: 800,
      enablePagination: true,
      pagination: {
        pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
        pageSize: 5,
      },
      // 1. pre-select some grid row indexes (less recommended, better use the Presets, see below)
      // preselectedRows: [0, 2],

      // 2. or use the Presets to pre-select some rows
      presets: {
        // you can presets row selection here as well, you can choose 1 of the following 2 ways of setting the selection
        // by their index position in the grid (UI) or by the object IDs, the default is "dataContextIds" and if provided it will use it and disregard "gridRowIndexes"
        // the RECOMMENDED is to use "dataContextIds" since that will always work even with Pagination, while "gridRowIndexes" is only good for 1 page
        rowSelection: {
          // gridRowIndexes: [2],           // the row position of what you see on the screen (UI)
          dataContextIds: [3, 12, 13, 522], // (recommended) select by your data object IDs
        },
      },
    };
  }

  prepareData(count: number) {
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
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }
    return mockDataset;
  }

  goToGrid1FirstPage() {
    this.aureliaGrid1.paginationService!.goToFirstPage();
  }

  goToGrid1LastPage() {
    this.aureliaGrid1.paginationService!.goToLastPage();
  }

  goToGrid2FirstPage() {
    this.aureliaGrid2.paginationService!.goToFirstPage();
  }

  goToGrid2LastPage() {
    this.aureliaGrid2.paginationService!.goToLastPage();
  }

  /** Dispatched event of a Grid State Changed event */
  grid1StateChanged(gridStateChanges: GridStateChange) {
    console.log('Grid State changed:: ', gridStateChanges);
    console.log('Grid State changed:: ', gridStateChanges.change);
  }

  /** Dispatched event of a Grid State Changed event */
  grid2StateChanged(gridStateChanges: GridStateChange) {
    console.log('Grid State changed:: ', gridStateChanges);
    console.log('Grid State changed:: ', gridStateChanges.change);

    if (gridStateChanges.gridState!.rowSelection) {
      this.selectedGrid2IDs = (gridStateChanges.gridState!.rowSelection.filteredDataContextIds || []) as number[];
      this.selectedGrid2IDs = this.selectedGrid2IDs.sort((a, b) => a - b); // sort by ID
      this.selectedTitles = this.selectedGrid2IDs.map((dataContextId) => `Task ${dataContextId}`).join(',');
      if (this.selectedTitles.length > 293) {
        this.selectedTitles = this.selectedTitles.substring(0, 293) + '...';
      }
    }
  }

  // Toggle the Pagination of Grid2
  // IMPORTANT, the Pagination MUST BE CREATED on initial page load before you can start toggling it
  // Basically you cannot toggle a Pagination that doesn't exist (must created at the time as the grid)
  isGrid2WithPaginationChanged() {
    this.aureliaGrid2.paginationService!.togglePaginationVisibility(this.isGrid2WithPagination);
  }

  onGrid1SelectedRowsChanged(_e: Event, args: any) {
    const grid = args && args.grid;
    if (Array.isArray(args.rows)) {
      this.selectedTitle = args.rows.map((idx: number) => {
        const item = grid.getDataItem(idx);
        return (item && item.title) || '';
      });
    }
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid2.resizerService.resizeGrid(0);
  }
}
