<script lang="ts">
  import { Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import CustomFooter from './CustomFooter.svelte';

  const NB_ITEMS = 995;
  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];
  const options: GridOption = {
    enableAutoResize: false,
    enableSorting: true,
    gridHeight: 225,
    gridWidth: 800,
  };
  // mock some data (different in each dataset)
  const dataset = mockData(NB_ITEMS);
  let grid: SlickgridSvelteInstance;
  let showSubTitle = $state(true);

  function mockData(count: number) {
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
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }
    return mockDataset;
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }
</script>

<h2>
  Example 29: Grid with Header and Footer slot
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example29.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

{#if showSubTitle}
  <div class="subtitle">Simple Grids with a custom header and footer via named slots</div>
{/if}

<hr />

<SlickgridSvelte gridId="grid29" {options} {columns} {dataset} onSvelteGridCreated={(instance) => (grid = instance)}>
  {#snippet header()}
    <div class="custom-header-slot">
      <h3>Grid with header and footer slot</h3>
    </div>
  {/snippet}
  {#snippet footer()}
    <div class="custom-footer-slot">
      <CustomFooter />
    </div>
  {/snippet}
</SlickgridSvelte>
