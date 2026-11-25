<script lang="ts">
  import {
    Editors,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type OnCellChangeEventArgs,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  const NB_ITEMS = 100;
  let gridOptions: GridOption;
  let columns: Column[] = [];
  let dataset: any[] = [];
  let isDarkMode = false;
  let showSubTitle = true;
  let grid: SlickgridSvelteInstance;

  function defineGrid() {
    columns = Array.from({ length: 10 }, (_item, index) => ({
      id: index,
      name: String.fromCharCode('A'.charCodeAt(0) + index),
      field: String(index),
      type: 'number',
      width: 58,
      editor: { model: Editors.integer },
    }));
    gridOptions = {
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      darkMode: isDarkMode,
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
    return Array.from({ length: itemCount }, (_item, id) => {
      const row: Record<string, number> = { id };
      for (let column = 0; column < columns.length; column++) {
        row[column] = Math.round(Math.random() * 10);
      }
      return row;
    });
  }

  function handleOnCellChange(event: CustomEvent<{ args: OnCellChangeEventArgs }>) {
    updateTotal(event.detail.args.cell);
  }

  function handleOnColumnsReordered() {
    updateAllTotals();
  }

  function updateAllTotals() {
    let columnIndex = grid?.slickGrid?.getColumns().length || 0;
    while (columnIndex--) {
      updateTotal(columnIndex);
    }
  }

  function updateTotal(cell: number) {
    const columnId = grid?.slickGrid?.getColumns()[cell]?.id as number | undefined;
    if (columnId === undefined) {
      return;
    }
    let total = 0;
    let rowIndex = dataset.length;
    while (rowIndex--) {
      total += Number.parseInt(dataset[rowIndex][columnId], 10) || 0;
    }
    const footerCell = grid.slickGrid.getFooterRowColumn(columnId);
    if (footerCell) {
      footerCell.textContent = `Sum: ${total}`;
    }
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.querySelector('.panel-wm-content')?.classList.toggle('dark-mode', isDarkMode);
    const demoContainer = document.querySelector<HTMLDivElement>('#demo-container');
    if (demoContainer) {
      demoContainer.dataset.bsTheme = isDarkMode ? 'dark' : 'light';
    }
    grid?.slickGrid?.setOptions({ darkMode: isDarkMode });
    updateAllTotals();
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid?.resizerService.resizeGrid());
  }

  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
    updateAllTotals();
  }

  defineGrid();
  dataset = loadData(NB_ITEMS);
  const events = { onCellChange: handleOnCellChange, onColumnsReordered: handleOnColumnsReordered };
</script>

<svelte:head><title>Example 37 - Footer Totals Row</title></svelte:head>

<h2>
  Example 37: Footer Totals Row
  <span class="float-end"
    ><a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example37.vue"
      ><span class="mdi mdi-link-variant"></span> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
  <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="toggle-dark-mode" onclick={toggleDarkMode}
    ><span class="mdi mdi-theme-light-dark"></span><span>Toggle Dark Mode</span></button
  >
</h2>
{#if showSubTitle}<div class="subtitle">Display a totals row at the end of the grid.</div>{/if}
<SlickgridSvelte gridId="grid37" {columns} options={gridOptions} {dataset} {events} onSvelteGridCreated={gridReady} />
