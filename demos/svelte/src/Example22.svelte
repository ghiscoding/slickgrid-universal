<script lang="ts">
  import { Filters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { onMount, tick } from 'svelte';
  import CUSTOMERS_URL from './data/customers_100.json?url';

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
  const NB_ITEMS = 500;
  const dataset1 = Array.from({ length: NB_ITEMS }, (_value, id) => {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    return {
      id,
      title: `Task ${id}`,
      duration: `${Math.round(Math.random() * 100)}`,
      percentComplete: Math.round(Math.random() * 100),
      start: `${randomMonth}/${randomDay}/${randomYear}`,
      finish: `${randomMonth}/${randomDay}/${randomYear}`,
      effortDriven: id % 5 === 0,
    };
  });
  let dataset2 = $state.raw<any[]>([]);
  const options1: GridOption = {
    enableAutoResize: true,
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableSorting: true,
  };
  const options2: GridOption = {
    enableAutoResize: true,
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableFiltering: true,
    enableSorting: true,
  };

  let grid1: SlickgridSvelteInstance;
  let grid2: SlickgridSvelteInstance;
  let activeTab = $state<'javascript' | 'fetch'>('javascript');
  let showSubTitle = $state(true);

  onMount(async () => {
    // load data with Fetch-Client
    const response2 = await fetch(CUSTOMERS_URL);
    dataset2 = await response2.json();
  });

  /**
   * When changing Tab, we need to resize the grid in the new Tab that becomes in focus.
   * We need to do this (only once) because SlickGrid relies on the grid being visible in the DOM for it to be sized properly
   * and if it's not (like our use case) we need to resize the grid ourselve and we just need to do that once.
   */
  async function resizeGrid2() {
    activeTab = 'fetch';
    await tick();
    grid2?.resizerService.resizeGrid(10);
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    grid1?.resizerService.resizeGrid();
    grid2?.resizerService.resizeGrid();
  }
</script>

<h2>
  Example 22: Grids in Bootstrap Tabs
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example22.svelte"
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
  This example demonstrate the creation of multiple grids in Bootstrap Tabs
  <ol>
    <li>Regular mocked data with javascript</li>
    <li>Load dataset through Fetch-Client. Also note we need to call a "resizeGrid()" after focusing on this tab</li>
  </ol>
</div>

<div>
  <nav>
    <div id="nav-tab" class="nav nav-tabs" role="tablist">
      <button
        id="javascript-tab"
        class="nav-link"
        class:active={activeTab === 'javascript'}
        type="button"
        role="tab"
        aria-controls="javascript"
        aria-selected={activeTab === 'javascript'}
        onclick={() => (activeTab = 'javascript')}
      >
        JavaScript
      </button>
      <button
        id="fetch-tab"
        class="nav-link"
        class:active={activeTab === 'fetch'}
        type="button"
        role="tab"
        aria-controls="fetch"
        aria-selected={activeTab === 'fetch'}
        onclick={resizeGrid2}
      >
        Fetch-Client
      </button>
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
</div>

<style>
  :global(.tab-content) {
    padding: 10px;
  }
</style>
