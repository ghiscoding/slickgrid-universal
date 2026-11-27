<script lang="ts">
  import {
    Editors,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type OnCellChangeEventArgs,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { onMount } from 'svelte';

  const NB_ITEMS = 100;
  const columns = $state.raw<Column[]>(defineColumns());
  const gridOptions = $state.raw<GridOption>(defineGridOptions());
  const dataset = $state.raw<any[]>(loadData(NB_ITEMS));
  let isDarkMode = false;
  let showSubTitle = $state(true);
  let grid: SlickgridSvelteInstance;

  onMount(() => {
    // make sure it's back to light mode before unmounting
    return () => {
      document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
      const demoContainer = document.querySelector<HTMLDivElement>('#demo-container');
      if (demoContainer) {
        demoContainer.dataset.bsTheme = 'light';
      }
    };
  });

  /* Define Columns */
  function defineColumns(): Column[] {
    const columnDefs: Column[] = [];
    for (let i = 0; i < 10; i++) {
      columnDefs.push({
        id: i,
        name: String.fromCharCode('A'.charCodeAt(0) + i),
        field: String(i),
        type: 'number',
        width: 58,
        editor: { model: Editors.integer },
      });
    }
    return columnDefs;
  }

  /* Define grid Options */
  function defineGridOptions(): GridOption {
    return {
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      darkMode: false,
      gridHeight: 450,
      gridWidth: 800,
      enableCellNavigation: true,
      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
    };
  }

  function loadData(itemCount: number) {
    // mock a dataset
    const datasetTmp: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const d = (datasetTmp[i] = {} as any);
      d.id = i;
      for (let j = 0; j < 10; j++) {
        d[j] = Math.round(Math.random() * 10);
      }
    }
    return datasetTmp;
  }

  function handleOnCellChange(_e: Event, args: OnCellChangeEventArgs) {
    updateTotal(args.cell);
  }

  function handleOnColumnsReordered() {
    updateAllTotals();
  }

  function updateAllTotals() {
    let columnIdx = grid.slickGrid?.getColumns().length || 0;
    while (columnIdx--) {
      updateTotal(columnIdx);
    }
  }

  function updateTotal(cell: number) {
    const columnId = grid.slickGrid?.getColumns()[cell].id as number;

    let total = 0;
    let i = dataset.length;
    while (i--) {
      total += parseInt(dataset[i][columnId], 10) || 0;
    }
    const columnElement = grid.slickGrid?.getFooterRowColumn(columnId);
    if (columnElement) {
      columnElement.textContent = `Sum: ${total}`;
    }
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    toggleBodyBackground();
    grid.slickGrid?.setOptions({ darkMode: isDarkMode });
    updateAllTotals();
  }

  function toggleBodyBackground() {
    document.querySelector('.panel-wm-content')?.classList.toggle('dark-mode', isDarkMode);
    const demoContainer = document.querySelector<HTMLDivElement>('#demo-container');
    if (demoContainer) {
      demoContainer.dataset.bsTheme = isDarkMode ? 'dark' : 'light';
    }
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid.resizerService.resizeGrid());
  }

  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
    updateAllTotals();
  }
</script>

<svelte:head><title>Example 37 - Footer Totals Row</title></svelte:head>

<h2>
  Example 37: Footer Totals Row
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example37.svelte"
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
  <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="toggle-dark-mode" onclick={toggleDarkMode}>
    <span class="mdi mdi-theme-light-dark"></span><span>Toggle Dark Mode</span>
  </button>
</h2>
{#if showSubTitle}<div class="subtitle">Display a totals row at the end of the grid.</div>{/if}
<SlickgridSvelte
  gridId="grid37"
  {columns}
  options={gridOptions}
  {dataset}
  onCellChange={(event: CustomEvent) => handleOnCellChange(event.detail.eventData, event.detail.args)}
  onColumnsReordered={handleOnColumnsReordered}
  onSvelteGridCreated={gridReady}
/>
