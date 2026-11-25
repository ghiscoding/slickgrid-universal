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
  import { createTasks } from './data/tasks.js';

  let grid1: SlickgridSvelteInstance;
  let showSubTitle = true;
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => {
      grid1?.resizerService?.resizeGrid();
      grid2?.resizerService?.resizeGrid();
    });
  }
  let grid2: SlickgridSvelteInstance;
  let selectedTitle = '';
  let selectedTitles = '';
  let showPagination = true;
  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, filterable: true },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, filterable: true, type: 'number' },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      sortable: true,
      filterable: true,
      type: 'number',
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      sortable: true,
      filterable: true,
      type: 'dateIso',
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      sortable: true,
      filterable: true,
      type: 'dateIso',
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      formatter: Formatters.checkmarkMaterial,
      sortable: true,
      filterable: true,
      type: 'boolean',
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: true, label: 'true' },
          { value: false, label: 'false' },
        ],
      },
    },
  ];
  const columns2 = columns.map((column) => ({ ...column, ...(column.filter ? { filter: { ...column.filter } } : {}) }));
  const pagination = { pageSizes: [5, 10, 15, 20, 25, 50, 75, 100], pageSize: 5 };
  const options1: GridOption = {
    enableAutoResize: false,
    gridWidth: 800,
    gridHeight: 225,
    enableCellNavigation: true,
    enableSelection: true,
    enableCheckboxSelector: true,
    enableFiltering: true,
    multiSelect: false,
    selectionOptions: { selectActiveRow: true },
    checkboxSelector: { hideSelectAllCheckbox: true },
    enableGridMenu: true,
    gridMenu: { hideForceFitButton: true },
    columnPicker: { hideForceFitButton: true },
    enablePagination: true,
    pagination: { ...pagination },
    presets: { pagination: { pageNumber: 2, pageSize: 5 } },
  };
  const options2: GridOption = {
    enableAutoResize: false,
    gridWidth: 800,
    gridHeight: 255,
    enableCellNavigation: true,
    enableSelection: true,
    enableCheckboxSelector: true,
    enableFiltering: true,
    selectionOptions: { selectActiveRow: false },
    checkboxSelector: { hideInFilterHeaderRow: false, hideInColumnTitleRow: true, applySelectOnAllPages: true },
    enablePagination: true,
    pagination: { ...pagination },
    presets: { rowSelection: { dataContextIds: [3, 12, 13, 522] } },
  };
  const dataset1 = createTasks(495);
  const dataset2 = createTasks(525);
  function onSelected(event: CustomEvent<any>) {
    selectedTitle = (event.detail.args.rows ?? []).map((row: number) => grid1.slickGrid.getDataItem(row)?.title ?? '').join(',');
  }
  function onState(event: CustomEvent<GridStateChange>) {
    console.log('Grid State changed:: ', event.detail);
    console.log('Grid State changed:: ', event.detail.change);
    const ids = [...(event.detail.gridState?.rowSelection?.filteredDataContextIds ?? [])].sort((a, b) => Number(a) - Number(b));
    selectedTitles = ids.map((id) => `Task ${id}`).join(',');
  }
  function onGrid1State(event: CustomEvent<GridStateChange>) {
    console.log('Grid State changed:: ', event.detail);
    console.log('Grid State changed:: ', event.detail.change);
  }
  function togglePaginationGrid2(event: Event) {
    showPagination = (event.currentTarget as HTMLInputElement).checked;
    grid2.paginationService.togglePaginationVisibility(showPagination);
  }
</script>

<h2>
  Example 10: Multiple Grids with Row Selection <span class="float-end fs-6"
    ><a
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example10.svelte"
      target="_blank"
      rel="noreferrer"><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
</h2>
{#if showSubTitle}<p class="subtitle">
    Grid 1 uses single row selection. Grid 2 uses checkbox selection across pages with selected IDs preserved while filtering and paging.
  </p>{/if}
<div class="row">
  <div class="col-sm-4" style="max-width: 205px">
    Pagination <span class="btn-group" role="group"
      ><button
        class="btn btn-outline-secondary btn-xs btn-icon px-2"
        aria-label="Go to first page"
        data-test="goto-first-page"
        onclick={() => grid1.paginationService.goToFirstPage()}><i class="mdi mdi-page-first"></i></button
      ><button
        class="btn btn-outline-secondary btn-xs btn-icon px-2"
        aria-label="Go to last page"
        data-test="goto-last-page"
        onclick={() => grid1.paginationService.goToLastPage()}><i class="mdi mdi-page-last"></i></button
      ></span
    >
  </div>
  <div class="col-sm-8">
    <div class="alert alert-success py-2">
      <strong>(single select) Selected Row:</strong>
      <span data-test="grid1-selections"><span data-test="selected-title">{selectedTitle}</span></span>
    </div>
  </div>
</div>
<SlickgridSvelte
  gridId="grid1"
  {columns}
  options={options1}
  dataset={dataset1}
  onSelectedRowsChanged={onSelected}
  onGridStateChanged={onGrid1State}
  onSvelteGridCreated={(instance) => (grid1 = instance)}
/>
<hr />
<div class="row">
  <div class="col-sm-4 col-md-3" style="max-width: 215px">
    <label
      >Pagination: <input
        type="checkbox"
        data-test="toggle-pagination-grid2"
        checked={showPagination}
        onchange={togglePaginationGrid2}
      /></label
    >
    {#if showPagination}<span class="btn-group ms-1" role="group"
        ><button
          class="btn btn-outline-secondary btn-xs btn-icon px-2"
          aria-label="Go to first page"
          data-test="goto-first-page"
          onclick={() => grid2.paginationService.goToFirstPage()}><i class="mdi mdi-page-first"></i></button
        ><button
          class="btn btn-outline-secondary btn-xs btn-icon px-2"
          aria-label="Go to last page"
          data-test="goto-last-page"
          onclick={() => grid2.paginationService.goToLastPage()}><i class="mdi mdi-page-last"></i></button
        ></span
      >{/if}
  </div>
  <div class="col-sm-8">
    <div class="alert alert-success py-2">
      <strong>(multi-select) Selected Row(s):</strong>
      <span data-test="grid2-selections"><span data-test="selected-titles">{selectedTitles}</span></span>
    </div>
  </div>
</div>
<SlickgridSvelte
  gridId="grid2"
  columns={columns2}
  options={options2}
  dataset={dataset2}
  onGridStateChanged={onState}
  onSvelteGridCreated={(instance) => (grid2 = instance)}
/>
