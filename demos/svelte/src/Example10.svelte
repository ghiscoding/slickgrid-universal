<script lang="ts">
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type GridStateChange,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { tick } from 'svelte';

  let isGrid2WithPagination = $state(true);
  let showSubTitle = $state(true);
  let selectedTitles = $state('');
  let selectedTitle = $state('');
  let selectedGrid2IDs: number[] = [];
  let svelteGrid1!: SlickgridSvelteInstance;
  let svelteGrid2!: SlickgridSvelteInstance;

  const columns1 = defineColumns();
  const columns2 = defineColumns();

  const gridOptions1: GridOption = {
    enableAutoResize: false,
    enableCellNavigation: true,
    enableSelection: true,
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
    selectionOptions: {
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

  const gridOptions2: GridOption = {
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
    selectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: false,
    },
    enableCheckboxSelector: true,
    enableSelection: true,
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

  // mock some data (different in each dataset)
  const dataset1 = loadData(495);
  const dataset2 = loadData(525);

  /* Define grid Columns */
  function defineColumns(): Column[] {
    return [
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
  }

  function loadData(count: number) {
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

  function goToGrid1FirstPage() {
    svelteGrid1.paginationService!.goToFirstPage();
  }

  function goToGrid1LastPage() {
    svelteGrid1.paginationService!.goToLastPage();
  }

  function goToGrid2FirstPage() {
    svelteGrid2.paginationService!.goToFirstPage();
  }

  function goToGrid2LastPage() {
    svelteGrid2.paginationService!.goToLastPage();
  }

  /** Dispatched event of a Grid State Changed event */
  function grid1StateChanged(gridStateChanges: GridStateChange) {
    console.log('Grid State changed:: ', gridStateChanges);
    console.log('Grid State changed:: ', gridStateChanges.change);
  }

  /** Dispatched event of a Grid State Changed event */
  function grid2StateChanged(gridStateChanges: GridStateChange) {
    console.log('Grid State changed:: ', gridStateChanges);
    console.log('Grid State changed:: ', gridStateChanges.change);

    if (gridStateChanges.gridState!.rowSelection) {
      selectedGrid2IDs = (gridStateChanges.gridState!.rowSelection.filteredDataContextIds || []) as number[];
      selectedGrid2IDs = selectedGrid2IDs.sort((a, b) => a - b); // sort by ID
      selectedTitles = selectedGrid2IDs.map((dataContextId) => `Task ${dataContextId}`).join(',');
      if (selectedTitles.length > 293) {
        selectedTitles = selectedTitles.substring(0, 293) + '...';
      }
    }
  }

  function onGrid1SelectedRowsChanged(args: any) {
    const grid = args?.grid;
    if (Array.isArray(args.rows)) {
      selectedTitle = args.rows
        .map((idx: number) => {
          const item = grid.getDataItem(idx);
          return (item && item.title) || '';
        })
        .join(',');
    }
  }

  function onGrid2PaginationCheckChanged(event: Event) {
    isGrid2WithPagination = (event.currentTarget as HTMLInputElement).checked;
    showGrid2Pagination(isGrid2WithPagination);
  }

  // Toggle the Pagination of Grid2
  // IMPORTANT, the Pagination MUST BE CREATED on initial page load before you can start toggling it
  // Basically you cannot toggle a Pagination that doesn't exist (must created at the time as the grid)
  function showGrid2Pagination(showPagination: boolean) {
    svelteGrid2.paginationService!.togglePaginationVisibility(showPagination);
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    svelteGrid1.resizerService.resizeGrid();
    svelteGrid2.resizerService.resizeGrid();
  }
</script>

<h2>
  Example 10: Multiple Grids with Row Selection
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example10.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

{#if showSubTitle}
  <div class="subtitle">
    Row selection, single or multi-select (<a
      href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/row-selection"
      target="_blank"
      rel="noreferrer"
    >
      Wiki docs
    </a>).
    <ul>
      <li>Single Select, you can click on any cell to make the row active</li>
      <li>Multiple Selections, you need to specifically click on the checkbox to make 1 or more selections</li>
      <li>
        NOTE: Any Row Selection(s) will be reset when using Pagination and changing Page (you will need to set it back manually if you want
        it back)
      </li>
    </ul>
  </div>
{/if}

<div class="row">
  <div class="col-sm-4" style="max-width: 205px">
    Pagination
    <div class="btn-group" role="group">
      <button
        class="btn btn-outline-secondary btn-xs btn-icon px-2"
        aria-label="Go to first page"
        data-test="goto-first-page"
        onclick={goToGrid1FirstPage}
      >
        <i class="mdi mdi-page-first"></i>
      </button>
      <button
        class="btn btn-outline-secondary btn-xs btn-icon px-2"
        aria-label="Go to last page"
        data-test="goto-last-page"
        onclick={goToGrid1LastPage}
      >
        <i class="mdi mdi-page-last icon"></i>
      </button>
    </div>
  </div>
  <div class="col-sm-8">
    <div class="alert alert-success">
      <strong>(single select) Selected Row:</strong>
      <span data-test="grid1-selections">{selectedTitle}</span>
    </div>
  </div>
</div>

<div class="overflow-hidden">
  <SlickgridSvelte
    gridId="grid1"
    columns={columns1}
    options={gridOptions1}
    dataset={dataset1}
    onSvelteGridCreated={(instance) => (svelteGrid1 = instance)}
    onGridStateChanged={(event) => grid1StateChanged(event.detail)}
    onSelectedRowsChanged={(event) => onGrid1SelectedRowsChanged(event.detail.args)}
  />
</div>

<hr class="col-md-6 offset-md-1" />

<div class="row">
  <div class="col-sm-4 col-md-3" style="max-width: 215px">
    <label for="enableGrid2Pagination">
      Pagination:
      <input
        id="enableGrid2Pagination"
        type="checkbox"
        checked={isGrid2WithPagination}
        data-test="toggle-pagination-grid2"
        onchange={onGrid2PaginationCheckChanged}
      />
    </label>
    {#if isGrid2WithPagination}
      <span style="margin-left: 5px">
        <div class="btn-group" role="group">
          <button
            class="btn btn-outline-secondary btn-xs btn-icon px-2"
            aria-label="Go to first page"
            data-test="goto-first-page"
            onclick={goToGrid2FirstPage}
          >
            <i class="mdi mdi-page-first"></i>
          </button>
          <button
            class="btn btn-outline-secondary btn-xs btn-icon px-2"
            aria-label="Go to last page"
            data-test="goto-last-page"
            onclick={goToGrid2LastPage}
          >
            <i class="mdi mdi-page-last icon"></i>
          </button>
        </div>
      </span>
    {/if}
  </div>
  <div class="col-sm-8">
    <div class="alert alert-success">
      <strong>(multi-select) Selected Row(s):</strong>
      <span data-test="grid2-selections">{selectedTitles}</span>
    </div>
  </div>
</div>

<div class="overflow-hidden">
  <SlickgridSvelte
    gridId="grid2"
    columns={columns2}
    options={gridOptions2}
    dataset={dataset2}
    onSvelteGridCreated={(instance) => (svelteGrid2 = instance)}
    onGridStateChanged={(event) => grid2StateChanged(event.detail)}
  />
</div>

<style>
  .alert {
    padding: 8px;
    margin-bottom: 10px;
  }
</style>
