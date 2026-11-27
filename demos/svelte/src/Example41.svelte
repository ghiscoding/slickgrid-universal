<script lang="ts">
  import {
    Formatters,
    SlickGlobalEditorLock,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  let dragHelper: HTMLElement | null = null;
  let dragRows: number[] = [];
  let dragMode = '';
  let showSubTitle = $state(true);
  let grid: SlickgridSvelteInstance;
  let dataset: any[] = $state.raw(mockData());

  const columns: Column[] = [
    { id: 'name', name: 'Name', field: 'name', width: 300, cssClass: 'cell-title' },
    {
      id: 'complete',
      name: 'Complete',
      field: 'complete',
      width: 60,
      cssClass: 'cell-effort-driven',
      cannotTriggerInsert: true,
      formatter: Formatters.checkmarkMaterial,
    },
  ];

  const gridOptions: GridOption = {
    enableAutoResize: false,
    gridHeight: 225,
    gridWidth: 800,
    rowHeight: 33,
    enableCellNavigation: true,
    enableSelection: true,
    enableRowMoveManager: true,
    selectionOptions: { selectActiveRow: false, selectionType: 'row' },
    rowMoveManager: {
      columnIndexPosition: 0,
      cancelEditOnDrag: true,
      disableRowSelection: true,
      hideRowMoveShadow: false,
      onAfterMoveRows: (_event, args) => {
        dataset = args.updatedItems;
      },
    },
  };

  function mockData() {
    return [
      { id: 0, name: 'Make a list', complete: true },
      { id: 1, name: 'Check it twice', complete: false },
      { id: 2, name: "Find out who's naughty", complete: false },
      { id: 3, name: "Find out who's nice", complete: false },
    ];
  }

  function handleOnDragInit(event: CustomEvent) {
    event.detail.eventData.stopImmediatePropagation();
  }

  function handleOnDragStart(event: CustomEvent) {
    const nativeEvent = event.detail.eventData as Event;
    const cell = grid.slickGrid?.getCellFromEvent(nativeEvent);
    if (!cell || cell.cell === 0 || !dataset[cell.row] || SlickGlobalEditorLock.isActive()) {
      dragMode = '';
      return;
    }
    nativeEvent.stopImmediatePropagation();
    dragMode = 'recycle';

    let selectedRows = grid.slickGrid?.getSelectedRows() || [];
    if (!selectedRows.length || !selectedRows.includes(cell.row)) {
      selectedRows = [cell.row];
      grid.slickGrid?.setSelectedRows(selectedRows);
    }
    dragRows = selectedRows;
    const helper = document.createElement('span');
    helper.className = 'drag-message';
    helper.textContent = `Drag to Recycle Bin to delete ${selectedRows.length} selected row(s)`;
    dragHelper = helper;
    document.body.appendChild(helper);
    document.querySelector('#dropzone')?.classList.add('drag-dropzone');
    return helper;
  }

  function handleOnDrag(event: CustomEvent) {
    if (dragMode !== 'recycle') {
      return;
    }
    const nativeEvent = event.detail.eventData as MouseEvent;
    const args = event.detail.args as any;
    if (dragHelper) {
      dragHelper.style.top = `${nativeEvent.pageY + 5}px`;
      dragHelper.style.left = `${nativeEvent.pageX + 5}px`;
    }
    const dropzone = document.querySelector<HTMLDivElement>('#dropzone');
    if (!dropzone) {
      return;
    }
    if (args.target instanceof HTMLElement && (args.target.id === 'dropzone' || args.target === dropzone)) {
      dropzone.classList.add('drag-hover');
    } else {
      dropzone.classList.remove('drag-hover');
    }
  }

  function handleOnDragEnd(event: CustomEvent) {
    if (dragMode !== 'recycle') {
      return;
    }
    dragHelper?.remove();
    dragHelper = null;
    const dropzone = document.querySelector<HTMLDivElement>('#dropzone');
    dropzone?.classList.remove('drag-dropzone', 'drag-hover');
    const args = event.detail.args as any;
    if (args.target?.id !== 'dropzone') {
      return;
    }

    for (const row of [...dragRows].sort((a, b) => b - a)) {
      dataset.splice(row, 1);
    }
    grid.slickGrid?.invalidate();
    grid.slickGrid?.setSelectedRows([]);
    dataset = [...dataset];
    dragRows = [];
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid?.resizerService.resizeGrid());
  }
  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
  }

  const events = { onDragInit: handleOnDragInit, onDragStart: handleOnDragStart, onDrag: handleOnDrag, onDragEnd: handleOnDragEnd };
</script>

<svelte:head><title>Example 41 - Drag & Drop</title></svelte:head>

<h2>
  Example 41: Drag &amp; Drop
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example41.svelte"
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
{#if showSubTitle}<h6 class="subtitle italic">
    <ul>
      <li>Click to select, Ctrl-click to toggle selection(s).</li>
      <li>Drag one or more rows by the handle icon (1st column) to reorder.</li>
      <li>Drag one or more rows by selection (2nd or 3rd column) and drag to the recycle bin to delete.</li>
    </ul>
  </h6>{/if}
<div class="row">
  <div class="col">
    <SlickgridSvelte gridId="grid41" {columns} options={gridOptions} {dataset} {events} onSvelteGridCreated={gridReady}>
      {#snippet header()}<div class="grid-header"><span>Santa's TODO list:</span></div>{/snippet}
    </SlickgridSvelte>
    <div class="col"><div id="dropzone" class="recycle-bin mt-4">Recycle Bin</div></div>
  </div>
</div>

<style>
  :global(.drag-message) {
    position: absolute;
    display: inline-block;
    padding: 4px 10px;
    background: #e0e0e0;
    border: 1px solid gray;
    z-index: 99999;
    border-radius: 8px;
    box-shadow: 2px 2px 6px silver;
  }
  .grid-header {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    font-weight: bold;
    height: 35px;
    padding-left: 8px;
    width: 100%;
  }
  .recycle-bin {
    background: beige;
    cursor: default;
    width: 120px;
    border: 2px solid #e4e4e4;
    padding: 4px;
    font-size: 12pt;
    font-weight: bold;
    color: black;
    text-align: center;
    border-radius: 10px;
  }
  :global(#dropzone.drag-dropzone) {
    border: 2px dashed pink;
  }
  :global(#dropzone.drag-hover) {
    background: pink;
    cursor: crosshair;
  }
</style>
