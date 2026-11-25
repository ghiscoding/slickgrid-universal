<script lang="ts">
  import { Filters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import customers from './data/customers_100.json';

  const columns1: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', minWidth: 100 },
    { id: 'finish', name: 'Finish', field: 'finish', minWidth: 100 },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];
  const columns2: Column[] = [
    { id: 'name', name: 'Name', field: 'name', filterable: true, sortable: true },
    {
      id: 'gender',
      name: 'Gender',
      field: 'gender',
      filterable: true,
      sortable: true,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: 'male', label: 'male' },
          { value: 'female', label: 'female' },
        ],
      },
    },
    { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true },
  ];
  const dataset1 = Array.from({ length: 500 }, (_value, id) => {
    const year = 2000 + (id % 10);
    const month = (id * 7) % 11;
    const day = (id * 13) % 29;
    return {
      id,
      title: `Task ${id}`,
      duration: Math.round(Math.random() * 100),
      percentComplete: Math.round(Math.random() * 100),
      start: `${month}/${day}/${year}`,
      finish: `${month}/${day}/${year}`,
      effortDriven: id % 5 === 0,
    };
  });
  const dataset2 = customers as any[];
  const options1: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableAutoResize: true,
    enableSorting: true,
  };
  const options2: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableAutoResize: true,
    enableFiltering: true,
    enableSorting: true,
  };

  let grid1: SlickgridSvelteInstance;
  let grid2: SlickgridSvelteInstance;
  let activeTab: 'javascript' | 'fetch' = 'javascript';
  let showSubtitle = true;

  function showFetchTab() {
    activeTab = 'fetch';
    requestAnimationFrame(() => grid2?.resizerService.resizeGrid(10));
  }

  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => {
      grid1?.resizerService.resizeGrid();
      grid2?.resizerService.resizeGrid();
    });
  }
</script>

<h2>
  Example 22: Grids in Bootstrap Tabs
  <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example22.svelte"
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
    This example demonstrates multiple grids in Bootstrap tabs: one with generated JavaScript data and one loaded from the bundled customer
    JSON dataset.
  </div>
{/if}
<nav>
  <div id="nav-tab" class="nav nav-tabs" role="tablist">
    <button
      id="javascript-tab"
      class:active={activeTab === 'javascript'}
      class="nav-link"
      type="button"
      role="tab"
      aria-controls="javascript"
      aria-selected={activeTab === 'javascript'}
      onclick={() => (activeTab = 'javascript')}>JavaScript</button
    >
    <button
      id="fetch-tab"
      class:active={activeTab === 'fetch'}
      class="nav-link"
      type="button"
      role="tab"
      aria-controls="fetch"
      aria-selected={activeTab === 'fetch'}
      onclick={showFetchTab}>Fetch-Client</button
    >
  </div>
</nav>
<div id="nav-tabContent" class="tab-content">
  <div
    id="javascript"
    class="tab-pane fade"
    class:show={activeTab === 'javascript'}
    class:active={activeTab === 'javascript'}
    role="tabpanel"
    aria-labelledby="javascript-tab"
    tabindex="0"
  >
    <h4>Grid 1 - Load Local Data</h4>
    <SlickgridSvelte
      gridId="grid1"
      columns={columns1}
      options={options1}
      dataset={dataset1}
      onSvelteGridCreated={(instance) => (grid1 = instance)}
    />
  </div>
  <div
    id="fetch"
    class="tab-pane fade"
    class:show={activeTab === 'fetch'}
    class:active={activeTab === 'fetch'}
    role="tabpanel"
    aria-labelledby="fetch-tab"
    tabindex="0"
  >
    <h4>Grid 2 - Load a JSON dataset through Fetch-Client</h4>
    <SlickgridSvelte
      gridId="grid2"
      columns={columns2}
      options={options2}
      dataset={dataset2}
      onSvelteGridCreated={(instance) => (grid2 = instance)}
    />
  </div>
</div>

<style>
  :global(.tab-content) {
    padding: 10px;
  }
</style>
