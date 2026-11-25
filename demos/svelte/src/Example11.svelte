<script lang="ts">
  import {
    Editors,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type OnEventArgs,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { createTasks } from './data/tasks.js';

  let grid: SlickgridSvelteInstance;
  let showSubTitle = true;
  let dataset: any[] = createTasks(1000).map((item) => ({
    ...item,
    start: new Date(2000 + (item.id % 10), (item.id * 7) % 11, (item.id * 13) % 29),
    finish: new Date(2000 + (item.id % 10), ((item.id * 7) % 11) + 1, (item.id * 13) % 29),
  }));

  const columns: Column[] = [
    {
      id: 'delete',
      field: 'id',
      excludeFromHeaderMenu: true,
      formatter: Formatters.icon,
      params: { iconCssClass: 'mdi mdi-trash-can pointer' },
      minWidth: 30,
      maxWidth: 30,
      onCellClick: (_event: Event, args: OnEventArgs) => {
        if (confirm('Are you sure?')) {
          grid.gridService.deleteItemById(args.dataContext.id);
        }
      },
    },
    { id: 'title', name: 'Title', field: 'title', sortable: true, editor: { model: Editors.longText } },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      sortable: true,
      type: 'number',
      editor: { model: Editors.text },
      onCellChange: () => alert('onCellChange directly attached to the column definition'),
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      type: 'number',
      editor: { model: Editors.integer },
    },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, sortable: true, type: 'date' },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, sortable: true, type: 'date' },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      formatter: Formatters.checkmarkMaterial,
      type: 'number',
      editor: { model: Editors.checkbox },
    },
  ];

  const options: GridOption = {
    asyncEditorLoading: false,
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableAutoResize: true,
    editable: true,
    enableColumnPicker: true,
    enableCellNavigation: true,
    enableSelection: true,
  };

  function createNewItem(incrementIdBy = 1) {
    const items = grid.dataView.getItems();
    const highestId = items.reduce((highest, item) => Math.max(highest, item.id), 0);
    const id = highestId + incrementIdBy;
    const year = 2000 + (id % 10);
    const month = (id * 7) % 11;
    const day = (id * 13) % 29;
    const percentComplete = Math.round(Math.random() * 100);
    return {
      id,
      title: `Task ${id}`,
      duration: Math.round(Math.random() * 100),
      percentComplete,
      percentCompleteNumber: percentComplete,
      start: new Date(year, month, day),
      finish: new Date(year, month + 2, day),
      effortDriven: true,
    };
  }

  function addNewItem(position?: 'top' | 'bottom') {
    grid.gridService.addItem(createNewItem(), { position });
  }

  function updateSecondItem() {
    scrollGridTop();
    const item = grid.gridService.getDataItemByRowNumber(1);
    if (item) {
      item.duration = Math.round(Math.random() * 100);
      grid.gridService.updateItem(item);
    }
  }

  function highlightFifthRow() {
    scrollGridTop();
    grid.gridService.highlightRow(4, 1500);
  }

  function changeDurationBackgroundColor() {
    const previousMetadata = grid.dataView.getItemMetadata;
    grid.dataView.getItemMetadata = (rowNumber: number) => {
      const previous = typeof previousMetadata === 'function' ? previousMetadata.call(grid.dataView, rowNumber) : undefined;
      const item = grid.dataView.getItem(rowNumber);
      const cssClasses = item && Number(item.duration) > 40 ? `${previous?.cssClasses ?? ''} duration-bg`.trim() : previous?.cssClasses;
      return cssClasses ? { ...previous, cssClasses } : (previous ?? null);
    };
    grid.slickGrid.invalidate();
  }

  function scrollGridBottom() {
    grid.slickGrid.navigateBottom();
  }

  function scrollGridTop() {
    grid.slickGrid.navigateTop();
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid?.resizerService.resizeGrid(0));
  }
</script>

<h2>
  Example 11: Add / Update / Highlight a Datagrid Item
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example11.svelte"
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
  <div class="subtitle">
    Add / Update / Highlight an Item from the Datagrid (<a
      href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/add-update-highlight"
      target="_blank"
      rel="noreferrer">Wiki docs</a
    >).
    <ul>
      <li><b>Note:</b> this demo is <b>only</b> on the datagrid (client) side, you still need to deal with the backend yourself</li>
      <li>Adding an item will show it as the first item in the grid because that is the best visual place to add it</li>
      <li>
        Add/Update an item requires a valid Slickgrid Selection Model. Enable <code>enableCheckboxSelector</code> or
        <code>enableSelection</code>.
      </li>
      <li>Click any of the buttons below to test this out</li>
      <li>You can change the highlighted color and animation through the SlickGrid Sass variables.</li>
      <li>Click “Highlight Rows with Duration over 40” to apply a CSS class to matching rows.</li>
    </ul>
  </div>
{/if}

<div class="col-sm-12">
  <span>
    <span>Scroll: </span>
    <div class="btn-group" role="group">
      <button
        class="btn btn-sm btn-outline-secondary btn-icon"
        aria-label="Scroll to top"
        data-test="scroll-top-btn"
        onclick={scrollGridTop}><i class="mdi mdi-arrow-down mdi-rotate-180"></i></button
      >
      <button
        class="btn btn-sm btn-outline-secondary btn-icon"
        aria-label="Scroll to bottom"
        data-test="scroll-bottom-btn"
        onclick={scrollGridBottom}><i class="mdi mdi-arrow-down"></i></button
      >
    </div>
    <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="add-new-item-top-btn" onclick={() => addNewItem()}
      >Add New Mocked Item</button
    >
    <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="add-new-item-bottom-btn" onclick={() => addNewItem('bottom')}
      >Add New Mocked Item (bottom)</button
    >
    <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="update-second-item-btn" onclick={updateSecondItem}
      >Update 2nd Row Item with Random Duration</button
    >
    <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="highlight-row5-btn" onclick={highlightFifthRow}
      >Highlight 5th Row</button
    >
    <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="highlight-duration40-btn" onclick={changeDurationBackgroundColor}
      >Highlight Rows with Duration over 40</button
    >
  </span>
  <hr />
</div>

<SlickgridSvelte gridId="grid11" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />

<style>
  :global(.duration-bg) {
    background-color: #e9d4f1 !important;
  }
</style>
