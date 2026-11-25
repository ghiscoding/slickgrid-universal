<script lang="ts">
  import { Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  let grid1: SlickgridSvelteInstance;
  let darkMode = true;
  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true },
  ];
  const columns2 = columns.map((column) => ({ ...column }));
  const options: GridOption = { darkMode: true, enableAutoResize: false, gridWidth: 800, gridHeight: 225, enableSorting: true };
  const paginationOptions: GridOption = {
    ...options,
    darkMode: false,
    enablePagination: true,
    pagination: { pageSizes: [5, 10, 20, 25, 50], pageSize: 5 },
  };
  function data(count: number) {
    return Array.from({ length: count }, (_, id) => {
      const year = 2000 + Math.floor(Math.random() * 10);
      const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
      const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
      return {
        id,
        title: `Task ${id}`,
        duration: Math.round(Math.random() * 100),
        percentComplete: Math.round(Math.random() * 100),
        start: `${year}-${month}-${day}`,
        finish: `${year + 1}-${month}-${day}`,
        effortDriven: id % 5 === 0,
      };
    });
  }
  let dataset = data(995);
  let dataset2 = data(995);
  function resetGrid() {
    const visibleColumns = columns.map((column) => ({ ...column, hidden: false }));
    grid1.slickGrid.setColumns(visibleColumns);
    grid1.slickGrid.autosizeColumns();
  }
  function toggleDarkMode() {
    darkMode = !darkMode;
    grid1.element.classList.toggle('slick-dark-mode', darkMode);
    grid1.slickGrid.setOptions({ darkMode });
  }
</script>

<h2>
  Example 1: Basic Grids
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example01.svelte"
      ><span class="mdi mdi-link-variant"></span> code</a
    >
  </span>
</h2>
<div class="subtitle">Simple Grids with Fixed Sizes (800 x 225)</div>
<h3>Grid 1</h3>
<button class="btn btn-outline-secondary btn-sm mb-2" data-test="toggle-dark-mode" onclick={toggleDarkMode}
  ><i class="mdi mdi-theme-light-dark" aria-hidden="true"></i> Toggle Dark Mode</button
>
<button class="btn btn-outline-secondary btn-sm mb-2" data-test="reset-grid1" onclick={resetGrid}
  ><i class="mdi mdi-alert-rhombus-outline" aria-hidden="true"></i> Reset Grid (display all columns)</button
>
<button class="btn btn-outline-secondary btn-sm mb-2" onclick={() => (dataset = data(125))}
  ><i class="mdi mdi-refresh" aria-hidden="true"></i> Replace first dataset</button
>
<SlickgridSvelte gridId="grid1-1" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid1 = instance)} />
<hr />
<h3>Grid 2 <small>(with local Pagination)</small></h3>
<button class="btn btn-outline-secondary btn-sm mb-2" onclick={() => (dataset2 = data(125))}
  ><i class="mdi mdi-refresh" aria-hidden="true"></i> Replace second dataset</button
>
<SlickgridSvelte gridId="grid1-2" columns={columns2} options={paginationOptions} dataset={dataset2} />
