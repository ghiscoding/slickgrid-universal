import { Filters, Formatters, type AureliaGridInstance, type Column, type GridOption, type OnEventArgs } from 'aurelia-slickgrid';

export class Example16 {
  aureliaGrid!: AureliaGridInstance;
  columns: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];
  hideSubTitle = false;

  constructor() {
    this.defineGrid();
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  get rowMoveInstance() {
    return this.aureliaGrid?.extensionService.getExtensionInstanceByName('rowMoveManager');
  }

  attached() {
    // populate the dataset once the grid is ready
    this.getData();
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columns = [
      { id: 'title', name: 'Title', field: 'title', filterable: true },
      { id: 'duration', name: 'Duration', field: 'duration', filterable: true, sortable: true },
      { id: '%', name: '% Complete', field: 'percentComplete', filterable: true, sortable: true },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'effort-driven',
        name: 'Completed',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
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
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false, // hide the "Select All" from title bar
        columnIndexPosition: 1,
        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      enableSelection: true,
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
      },
      dataView: {
        syncGridSelection: true, // enable this flag so that the row selection follows the row even if we move it to another position
      },
      enableRowMoveManager: true,
      rowMoveManager: {
        columnIndexPosition: 0,
        // when using Row Move + Row Selection, you want to move only a single row and we will enable the following flags so it doesn't cancel row selection
        singleRowMove: true,
        disableRowSelection: true,
        cancelEditOnDrag: true,
        hideRowMoveShadow: false,
        width: 30,
        // you can provide your own `onBeforeMoveRows` and/or `onMoveRows` implementation
        // or use the default implementation, however the default won't work with Tree Data
        // onBeforeMoveRows: () => {},
        // onMoveRows: () => {},
        // you can provide your own `onBeforeMoveRows` and/or `onMoveRows` implementation
        // or use the default implementation, however the default won't work with Tree Data
        // onBeforeMoveRows: () => {},
        // onMoveRows: () => {},
        onAfterMoveRows: (_e, args) => {
          // update dataset for the ms-select list to be updated
          this.dataset = args.updatedItems;
        },

        // you can change the move icon position of any extension (RowMove, RowDetail or RowSelector icon)
        // note that you might have to play with the position when using multiple extension
        // since it really depends on which extension get created first to know what their real position are
        // columnIndexPosition: 1,

        // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
        // usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
      },
      showCustomFooter: true,
      presets: {
        // you can presets row selection here as well, you can choose 1 of the following 2 ways of setting the selection
        // by their index position in the grid (UI) or by the object IDs, the default is "dataContextIds" and if provided it will use it and disregard "gridRowIndexes"
        // the RECOMMENDED is to use "dataContextIds" since that will always work even with Pagination, while "gridRowIndexes" is only good for 1 page
        rowSelection: {
          // gridRowIndexes: [2],       // the row position of what you see on the screen (UI)
          dataContextIds: [1, 2, 6, 7], // (recommended) select by your data object IDs
        },
      },
    };
  }

  getData() {
    // Set up some test columns.
    const mockDataset: any[] = [];
    for (let i = 0; i < 500; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 25) + ' days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        effortDriven: i % 5 === 0,
      };
    }
    this.dataset = mockDataset;
  }

  hideDurationColumnDynamically() {
    // -- you can hide by one Id or multiple Ids:
    // hideColumnById(id, options), hideColumnByIds([ids], options)
    // you can also provide options, defaults are: { autoResizeColumns: true, triggerEvent: true, hideFromColumnPicker: false, hideFromGridMenu: false }

    this.aureliaGrid.gridService.hideColumnById('duration');

    // or with multiple Ids and extra options
    // this.aureliaGrid.gridService.hideColumnByIds(['duration', 'finish'], { hideFromColumnPicker: true, hideFromGridMenu: false });
  }

  // Disable/Enable Filtering/Sorting functionalities
  // --------------------------------------------------

  disableFilters() {
    this.aureliaGrid.filterService.disableFilterFunctionality(true);
  }

  disableSorting() {
    this.aureliaGrid.sortService.disableSortFunctionality(true);
  }

  addEditDeleteColumns() {
    if (this.columns[0].id !== 'change-symbol') {
      const newCols = [
        {
          id: 'change-symbol',
          field: 'id',
          excludeFromColumnPicker: true,
          excludeFromGridMenu: true,
          excludeFromHeaderMenu: true,
          formatter: Formatters.icon,
          params: { iconCssClass: 'mdi mdi-pencil pointer' },
          minWidth: 30,
          maxWidth: 30,
          onCellClick: (_clickEvent: Event, args: OnEventArgs) => {
            alert(`Technically we should Edit "Task ${args.dataContext.id}"`);
          },
        },
        {
          id: 'delete-symbol',
          field: 'id',
          excludeFromColumnPicker: true,
          excludeFromGridMenu: true,
          excludeFromHeaderMenu: true,
          formatter: Formatters.icon,
          params: { iconCssClass: 'mdi mdi-trash-can pointer' },
          minWidth: 30,
          maxWidth: 30,
          onCellClick: (_e: Event, args: OnEventArgs) => {
            if (confirm('Are you sure?')) {
              this.aureliaGrid.gridService.deleteItemById(args.dataContext.id);
            }
          },
        },
      ];

      // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
      // you MUST use "getAllColumnDefinitions()" from the GridService, using this will be ALL columns including the 1st column that is created internally
      // for example if you use the Checkbox Selector (row selection), you MUST use the code below
      const allColumns = this.aureliaGrid.gridService.getAllColumnDefinitions();
      allColumns.unshift(newCols[0], newCols[1]);
      this.columns = [...allColumns]; // (or use slice) reassign to column definitions for Aurelia to do dirty checking
    }
  }

  // or Toggle Filtering/Sorting functionalities
  // ---------------------------------------------

  toggleFilter() {
    this.aureliaGrid.filterService.toggleFilterFunctionality();
  }

  toggleSorting() {
    this.aureliaGrid.sortService.toggleSortFunctionality();
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
