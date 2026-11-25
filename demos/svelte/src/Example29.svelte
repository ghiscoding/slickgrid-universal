<script lang="ts">
  import { Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import CustomFooter from './CustomFooter.svelte';

  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];
  const options: GridOption = { enableAutoResize: false, enableSorting: true, gridHeight: 225, gridWidth: 800 };
  const dataset = Array.from({ length: 995 }, (_value, id) => {
    const year = 2000 + Math.floor(Math.random() * 10);
    const month = Math.floor(Math.random() * 11);
    const day = Math.floor(Math.random() * 29);
    return {
      id,
      title: `Task ${id}`,
      duration: `${Math.round(Math.random() * 100)}`,
      percentComplete: Math.round(Math.random() * 100),
      start: new Date(year, month + 1, day),
      finish: new Date(year + 1, month + 1, day),
      effortDriven: id % 5 === 0,
    };
  });
  let grid: SlickgridSvelteInstance;
  let showSubtitle = true;
  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }
</script>

<h2>
  Example 29: Grid with Header and Footer slot
  <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example29.svelte"
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
{#if showSubtitle}<div class="subtitle">Simple Grids with a custom header and footer via named slots</div>{/if}
<hr />
<SlickgridSvelte gridId="grid29" {options} {columns} {dataset} onSvelteGridCreated={(instance) => (grid = instance)}>
  <div slot="header" class="custom-header-slot"><h3>Grid with header and footer slot</h3></div>
  <div slot="footer" class="custom-footer-slot"><div class="footer-inner"><CustomFooter /></div></div>
</SlickgridSvelte>
