<script lang="ts">
  import {
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type OperatorType,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  const operators: OperatorType[] = ['=', '<', '<=', '>', '>=', '<>', 'StartsWith', 'EndsWith'];
  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', width: 100, sortable: true },
    { id: 'duration', name: 'Duration (days)', field: 'duration', width: 100, sortable: true, type: 'number' },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      width: 100,
      sortable: true,
      formatter: Formatters.percentCompleteBar,
      type: 'number',
    },
    { id: 'start', name: 'Start', field: 'start', width: 100, sortable: true, formatter: Formatters.dateIso, type: 'date' },
    { id: 'finish', name: 'Finish', field: 'finish', width: 100, sortable: true, formatter: Formatters.dateIso, type: 'date' },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      width: 100,
      sortable: true,
      formatter: Formatters.checkmarkMaterial,
      type: 'boolean',
    },
  ];
  const dataset = Array.from({ length: 100 }, (_value, id) => {
    const year = 2000 + (id % 10);
    const month = (id * 7) % 11;
    const day = (id * 13) % 29;
    const percentComplete = Math.round(Math.random() * 100);
    return {
      id,
      title: `Task ${id}`,
      duration: Math.round(Math.random() * 100),
      percentComplete,
      percentCompleteNumber: percentComplete,
      start: new Date(year, month, day),
      finish: new Date(year, month + 1, day),
      effortDriven: id % 5 === 0,
    };
  });
  const options: GridOption = {
    autoHeight: { stickyHeader: true },
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableFiltering: true,
    showHeaderRow: false,
    enableColumnPicker: true,
    enableCellNavigation: true,
    enableSelection: true,
  };

  let grid: SlickgridSvelteInstance;
  let selectedColumn = 'title';
  let selectedOperator: OperatorType = '=';
  let searchValue = '';
  let showSubtitle = true;

  function updateFilter() {
    grid?.filterService.updateSingleFilter({ columnId: selectedColumn, operator: selectedOperator, searchTerms: [searchValue] });
  }

  function clearSearch() {
    searchValue = '';
    updateFilter();
  }

  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }
</script>

<h2>
  Example 21: Grid AutoHeight
  <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example21.svelte"
      ><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubtitle}><i class="mdi mdi-information-outline"></i></button
  >
</h2>
{#if showSubtitle}
  <div class="subtitle">
    The SlickGrid option <code>autoHeight</code> keeps the entire dataset visible without grid scrolling.
    <ul>
      <li>This example has 100 rows, so the page itself scrolls while the grid remains full height.</li>
      <li><code>autoHeight.stickyHeader</code> keeps column headers visible below the fixed navbar.</li>
    </ul>
  </div>
{/if}
<div class="row row-cols-lg-auto g-1 align-items-center">
  <div class="col"><label for="columnSelect">Single Search:</label></div>
  <div class="col">
    <select id="columnSelect" class="form-select" data-test="search-column-list" bind:value={selectedColumn} onchange={updateFilter}>
      {#each columns as column}<option value={column.id}>{column.name}</option>{/each}
    </select>
  </div>
  <div class="col">
    <select class="form-select" data-test="search-operator-list" bind:value={selectedOperator} onchange={updateFilter}>
      {#each operators as operator}<option value={operator}>{operator}</option>{/each}
    </select>
  </div>
  <div class="col">
    <div class="input-group">
      <input
        class="form-control"
        type="text"
        placeholder="search value"
        data-test="search-value-input"
        bind:value={searchValue}
        oninput={updateFilter}
      />
      <button
        class="btn btn-outline-secondary"
        type="button"
        aria-label="Clear search value"
        data-test="clear-search-value"
        onclick={clearSearch}><i class="mdi mdi-close"></i></button
      >
    </div>
  </div>
</div>
<hr />
<SlickgridSvelte gridId="grid21" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />

<style>
  :global(#grid21 .slick-header-column:last-child .slick-header-menu-button),
  :global(#grid21 .slick-header-column:last-child .slick-resizable-handle),
  :global(#grid21 .slick-header-column:last-child .slick-sort-indicator),
  :global(#grid21 .slick-header-column:last-child .slick-sort-indicator-numbered) {
    margin-right: 18px;
  }
</style>
