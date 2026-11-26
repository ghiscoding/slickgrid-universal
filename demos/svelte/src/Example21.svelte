<script lang="ts">
  import {
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type OperatorType,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { tick } from 'svelte';

  const NB_ITEMS = 100;
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
      type: 'number',
    },
  ];
  const dataset = Array.from({ length: NB_ITEMS }, (_value, id) => {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);
    return {
      id,
      title: `Task ${id}`,
      duration: `${Math.round(Math.random() * 100)}`,
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 1, randomDay),
      effortDriven: id % 5 === 0,
    };
  });
  const options: GridOption = {
    // if you want to disable autoResize and use a fixed width which requires horizontal scrolling
    // it's advised to disable the autoFitColumnsOnFirstLoad as well
    // enableAutoResize: false,
    // autoFitColumnsOnFirstLoad: false,

    autoHeight: { stickyHeader: true }, // or `autoHeight: true` without sticky headers
    autoResize: { container: '#demo-container', rightPadding: 10 },

    // enable the filtering but hide the user filter row since we use our own single filter
    enableFiltering: true,
    showHeaderRow: false, // hide the filter row (header row)

    alwaysShowVerticalScroll: false,
    enableColumnPicker: true,
    enableCellNavigation: true,
    enableSelection: true,
  };

  let grid: SlickgridSvelteInstance;
  let selectedColumn = $state('title');
  let selectedOperator = $state<OperatorType>('=');
  let searchValue = $state('');
  let showSubTitle = $state(true);

  // -- if any of the Search form input changes, we'll call the updateFilter() method
  function updateFilter() {
    grid?.filterService.updateSingleFilter({
      columnId: selectedColumn,
      operator: selectedOperator,
      searchTerms: [searchValue || ''],
    });
  }

  function clearGridSearchInput() {
    searchValue = '';
    updateFilter();
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    grid?.resizerService.resizeGrid();
  }
</script>

<h2>
  Example 21: Grid AutoHeight
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example21.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

<div class="subtitle" class:hidden={!showSubTitle}>
  The SlickGrid option "autoHeight" can be used if you wish to keep the full height of the grid without any scrolling
  <ul>
    <li>You define a fixed grid width via "gridWidth" in the View</li>
    <li>You can still use the "autoResize" for the width to be resized automatically (the height will never change in this case)</li>
    <li>
      This dataset has 100 rows, if you scroll down the page you can see the entire set is shown without any grid scrolling (though you
      might have browser scrolling)
    </li>
    <li>The "autoHeight.stickyHeader" option keeps the column headers visible at the top of the page while scrolling the page.</li>
  </ul>
</div>

<div class="row row-cols-lg-auto g-1 align-items-center">
  <div class="col">
    <label for="columnSelect">Single Search:</label>
  </div>
  <div class="col">
    <select
      id="columnSelect"
      class="form-select"
      data-test="search-column-list"
      name="selectedColumn"
      value={selectedColumn}
      onchange={(e) => {
        selectedColumn = e.currentTarget.value;
        updateFilter();
      }}
    >
      {#each columns as column (column.id)}
        <option value={column.id}>{column.name}</option>
      {/each}
    </select>
  </div>
  <div class="col">
    <select
      class="form-select"
      data-test="search-operator-list"
      aria-label="Search operator"
      value={selectedOperator}
      onchange={(e) => {
        selectedOperator = e.currentTarget.value as OperatorType;
        updateFilter();
      }}
    >
      {#each operators as operator (operator)}
        <option value={operator}>{operator}</option>
      {/each}
    </select>
  </div>

  <div class="col">
    <div class="input-group">
      <input
        type="text"
        class="form-control"
        placeholder="search value"
        data-test="search-value-input"
        value={searchValue}
        oninput={(e) => {
          searchValue = e.currentTarget.value;
          updateFilter();
        }}
      />
      <button
        class="btn btn-outline-secondary d-flex align-items-center pl-2 pr-2"
        type="button"
        aria-label="Clear search value"
        data-test="clear-search-value"
        onclick={clearGridSearchInput}
      >
        <span class="mdi mdi-close"></span>
      </button>
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
