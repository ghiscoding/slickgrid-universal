<script lang="ts">
  import { Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  const NB_ITEMS = 995;

  let grid1: SlickgridSvelteInstance;
  let darkModeGrid1 = isBrowserDarkModeEnabled();
  let hideSubTitle = $state(false);

  const columns1: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];
  const columns2: Column[] = [...columns1];

  const gridOptions1: GridOption = {
    darkMode: darkModeGrid1,
    gridHeight: 225,
    gridWidth: 800,
    enableAutoResize: false,
    enableSorting: true,
  };

  // copy the same Grid Options and Column Definitions to 2nd grid
  // but also add Pagination in this grid
  const gridOptions2: GridOption = {
    ...gridOptions1,
    darkMode: false,
    enablePagination: true,
    pagination: {
      pageSizes: [5, 10, 20, 25, 50],
      pageSize: 5,
    },
  };

  // mock some data (different in each dataset)
  let dataset1 = $state.raw(mockData(NB_ITEMS));
  let dataset2 = $state.raw(mockData(NB_ITEMS));

  function isBrowserDarkModeEnabled() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  function zeroPadding(input: number) {
    return String(input).padStart(2, '0');
  }

  function mockData(count: number) {
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
        start: `${zeroPadding(randomYear)}-${zeroPadding(randomMonth + 1)}-${zeroPadding(randomDay)}`,
        finish: `${zeroPadding(randomYear + 1)}-${zeroPadding(randomMonth + 1)}-${zeroPadding(randomDay)}`,
        effortDriven: i % 5 === 0,
      };
    }

    return mockDataset;
  }

  function resetGrid1() {
    const cols = columns1.map((col) => ({ ...col, hidden: false }));
    grid1.slickGrid?.setColumns(cols);
    grid1.slickGrid?.autosizeColumns();
  }

  function toggleDarkModeGrid1() {
    darkModeGrid1 = !darkModeGrid1;
    document.querySelector('.grid-container1')?.classList.toggle('dark-mode', darkModeGrid1);
    grid1.slickGrid?.setOptions({ darkMode: darkModeGrid1 });
  }
</script>

<h2>
  Example 1: Basic Grids
  <span class="float-end font18">
    see&nbsp;
    <a target="_blank" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example01.svelte">
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={() => (hideSubTitle = !hideSubTitle)}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

{#if !hideSubTitle}
  <div class="subtitle">Simple Grids with Fixed Sizes (800 x 225)</div>
{/if}

<h3>
  <div class="column">
    <span class="mr-3">Grid 1</span>
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-2" data-test="toggle-dark-mode" onclick={toggleDarkModeGrid1}>
      <i class="mdi mdi-theme-light-dark" aria-hidden="true"></i>
      <span>Toggle Dark Mode</span>
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-2" data-test="reset-grid1" onclick={resetGrid1}>
      <span class="mdi mdi-alert-rhombus-outline" aria-hidden="true"></span>
      <span>Reset Grid (display all columns)</span>
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-2" onclick={() => (dataset1 = mockData(125))}>Randomize Dataset</button>
  </div>
</h3>

<div class="grid-container1">
  <SlickgridSvelte
    gridId="grid1-1"
    columns={columns1}
    options={gridOptions1}
    dataset={dataset1}
    onSvelteGridCreated={(instance) => (grid1 = instance)}
  />
</div>

<hr />

<h3>Grid 2 <small>(with local Pagination)</small></h3>

<SlickgridSvelte gridId="grid1-2" columns={columns2} options={gridOptions2} dataset={dataset2} />
