<script lang="ts">
  import { Filters, Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  let grid: SlickgridSvelteInstance;
  let columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', filterable: true },
    { id: 'duration', name: 'Duration', field: 'duration', filterable: true, sortable: true },
    { id: '%', name: '% Complete', field: 'percentComplete', filterable: true, sortable: true },
    { id: 'start', name: 'Start', field: 'start', filterable: true, sortable: true, filter: { model: Filters.compoundDate } },
    { id: 'finish', name: 'Finish', field: 'finish', filterable: true, sortable: true, filter: { model: Filters.compoundDate } },
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
  let dataset = Array.from({ length: 500 }, (_v, i) => ({
    id: i,
    title: `Task ${i}`,
    duration: `${Math.round(Math.random() * 25)} days`,
    percentComplete: Math.round(Math.random() * 100),
    start: '01/01/2009',
    finish: '01/05/2009',
    effortDriven: i % 5 === 0,
  }));
  let showSubTitle = true;
  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableCellNavigation: true,
    enableSorting: true,
    enableFiltering: true,
    enableCheckboxSelector: true,
    checkboxSelector: { columnIndexPosition: 1, hideInFilterHeaderRow: false, hideInColumnTitleRow: true },
    enableSelection: true,
    selectionOptions: { selectActiveRow: false },
    dataView: { syncGridSelection: true },
    enableRowMoveManager: true,
    rowMoveManager: {
      singleRowMove: true,
      disableRowSelection: true,
      cancelEditOnDrag: true,
      hideRowMoveShadow: false,
      width: 35,
      columnIndexPosition: 0,
      onAfterMoveRows: (_event: Event, args: any) => (dataset = args.updatedItems),
    },
    showCustomFooter: true,
    presets: { rowSelection: { dataContextIds: [1, 2, 6, 7] } },
  };
  function ready(instance: SlickgridSvelteInstance) {
    grid = instance;
  }
  function hideDurationColumnDynamically() {
    grid.gridService.hideColumnById('duration');
  }
  function disableFilters() {
    grid.filterService.disableFilterFunctionality(true);
  }
  function disableSorting() {
    grid.sortService.disableSortFunctionality(true);
  }
  function toggleFilter() {
    grid.filterService.toggleFilterFunctionality();
  }
  function toggleSorting() {
    grid.sortService.toggleSortFunctionality();
  }
  function addEditDeleteColumns() {
    if (columns[0]?.id === 'change-symbol') {
      return;
    }
    const makeAction = (id: string, icon: string, message: (args: any) => void): Column => ({
      id,
      field: 'id',
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      formatter: Formatters.icon,
      params: { iconCssClass: icon },
      minWidth: 30,
      maxWidth: 30,
      onCellClick: (_e, args) => message(args),
    });
    columns = [
      makeAction('change-symbol', 'mdi mdi-pencil pointer', (args) => alert(`Technically we should Edit "Task ${args.dataContext.id}"`)),
      makeAction('delete-symbol', 'mdi mdi-trash-can pointer', (args) => {
        if (confirm('Are you sure?')) {
          grid.gridService.deleteItemById(args.dataContext.id);
        }
      }),
      ...grid.gridService.getAllColumnDefinitions(),
    ];
  }
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    grid?.resizerService.resizeGrid(0);
  }
</script>

<h2>
  Example 16: Row Move &amp; Checkbox Selector
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example16.svelte"
      ><span class="mdi mdi-link-variant"></span> code</a
    >
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}><i class="mdi mdi-information-outline"></i></button
  >
</h2>
{#if showSubTitle}<div class="subtitle">Drag the row handle to reorder rows. Selection stays with rows as they move.</div>{/if}
<div class="row mb-2">
  <div class="col-sm-12">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="hide-duration-btn" onclick={hideDurationColumnDynamically}
      >Dynamically Hide "Duration"</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="disable-filters-btn" onclick={disableFilters}
      >Disable Filters</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="disable-sorting-btn" onclick={disableSorting}
      >Disable Sorting</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="toggle-filtering-btn" onclick={toggleFilter}
      >Toggle Filtering</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="toggle-sorting-btn" onclick={toggleSorting}>Toggle Sorting</button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="add-crud-columns-btn" onclick={addEditDeleteColumns}
      >Add Edit/Delete Columns</button
    >
  </div>
</div>
<SlickgridSvelte gridId="grid16" {columns} {options} {dataset} onSvelteGridCreated={ready} />
