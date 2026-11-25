<script lang="ts">
  import {
    Formatters,
    SlickgridSvelte,
    type Column,
    type Formatter,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { completedToggleFormatter } from './data/example02Formatter.js';

  let grid: SlickgridSvelteInstance;
  let showSubTitle = true;
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => {
      grid?.resizerService?.resizeGrid();
    });
  }
  let paused = false;
  let visible = true;
  const customFormatter: Formatter = (_row, _cell, value) =>
    value ? '<i class="mdi mdi-fire red" aria-hidden="true"></i>' : '<i class="mdi mdi-snowflake lightblue" aria-hidden="true"></i>';
  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, width: 70 },
    {
      id: 'phone',
      name: 'Phone Number using mask',
      field: 'phone',
      sortable: true,
      type: 'number',
      minWidth: 100,
      formatter: Formatters.mask,
      params: { mask: '(000) 000-0000' },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      formatter: Formatters.decimal,
      params: { minDecimal: 1, maxDecimal: 2 },
      sortable: true,
      type: 'number',
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      sortable: true,
      type: 'number',
    },
    {
      id: 'percent2',
      name: '% Complete',
      field: 'percentComplete2',
      formatter: Formatters.progressBar,
      type: 'number',
      sortable: true,
      minWidth: 100,
    },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, type: 'date' },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, type: 'date' },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', formatter: customFormatter },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      sortable: true,
      type: 'number',
      minWidth: 100,
      formatter: completedToggleFormatter,
      onCellClick: (_e, args) => {
        const item = args?.dataContext;
        if (item) {
          grid.gridService.updateItemById(item.id, { ...item, completed: !item.completed }, { highlightRow: false });
        }
      },
    },
  ];
  const options: GridOption = {
    autoResize: { container: '#formatters-container' },
    gridHeight: 400,
    enableCellNavigation: true,
    showCustomFooter: true,
    customFooterOptions: { leftFooterText: 'custom footer text', hideTotalItemCount: true, hideLastUpdateTimestamp: true },
    enableExcelCopyBuffer: true,
  };
  const dataset = Array.from({ length: 500 }, (_, id) => {
    const year = 2000 + Math.floor(Math.random() * 10);
    const month = Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    const percentComplete = Math.round(Math.random() * 100);
    return {
      id,
      title: `Task ${id}`,
      phone: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      duration: id % 33 === 0 ? null : Math.random() * 100,
      percentComplete,
      percentComplete2: percentComplete,
      start: new Date(year, month, day),
      finish: new Date(year, month + 1, day),
      effortDriven: id % 5 === 0,
      completed: false,
    };
  });
</script>

<h2>
  Example 2: Grid with Formatters <span class="float-end fs-6"
    ><a
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example02.svelte"
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
{#if showSubTitle}<p class="subtitle">Built-in and custom formatters, including a clickable completed column.</p>{/if}
<button
  class="btn btn-outline-secondary btn-sm mb-2"
  onclick={() => {
    paused = !paused;
    grid.resizerService.pauseResizer(paused);
  }}>Pause auto-resize: {paused}</button
>
<button class="btn btn-outline-secondary btn-sm mb-2" onclick={() => (visible = false)}>Dispose grid</button>
<div id="formatters-container">
  {#if visible}<SlickgridSvelte gridId="grid2" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />{/if}
</div>
