<script setup lang="ts">
import {
  type GridOption,
  type SlickgridVueInstance,
  type Column,
  Formatters,
  SlickGlobalEditorLock,
  SlickgridVue,
} from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
let dragHelper: HTMLElement | null = null;
const dragRows = ref<number[]>([]);
const dragMode = ref('');
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();

  // mock some data (different in each dataset)
  dataset.value = mockData();
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'name',
      name: 'Name',
      field: 'name',
      width: 300,
      cssClass: 'cell-title',
    },
    {
      id: 'complete',
      name: 'Complete',
      width: 60,
      cssClass: 'cell-effort-driven',
      field: 'complete',
      cannotTriggerInsert: true,
      formatter: Formatters.checkmarkMaterial,
    },
  ];

  gridOptions.value = {
    enableAutoResize: false,
    gridHeight: 225,
    gridWidth: 800,
    rowHeight: 33,
    enableCellNavigation: true,
    enableRowSelection: true,
    enableRowMoveManager: true,
    rowSelectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: false,
    },
    rowMoveManager: {
      columnIndexPosition: 0,
      cancelEditOnDrag: true,
      disableRowSelection: true,
      hideRowMoveShadow: false,
      onBeforeMoveRows: onBeforeMoveRows,
      onMoveRows: onMoveRows,

      // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
      // usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
    },
  };
}

function mockData() {
  return [
    { id: 0, name: 'Make a list', complete: true },
    { id: 1, name: 'Check it twice', complete: false },
    { id: 2, name: `Find out who's naughty`, complete: false },
    { id: 3, name: `Find out who's nice`, complete: false },
  ];
}

function onBeforeMoveRows(e: MouseEvent | TouchEvent, data: { rows: number[]; insertBefore: number }) {
  for (const dataRow of data.rows) {
    // no point in moving before or after itself
    if (dataRow === data.insertBefore || dataRow === data.insertBefore - 1) {
      e.stopPropagation();
      return false;
    }
  }
  return true;
}

function onMoveRows(_e: MouseEvent | TouchEvent, args: { rows: number[]; insertBefore: number }) {
  const extractedRows: any[] = [];
  const rows = args.rows;
  const insertBefore = args.insertBefore;
  const left = dataset.value.slice(0, insertBefore);
  const right = dataset.value.slice(insertBefore, dataset.value.length);

  rows.sort((a, b) => a - b);

  for (const row of rows) {
    extractedRows.push(dataset.value[row]);
  }

  rows.reverse();

  for (const row of rows) {
    if (row < insertBefore) {
      left.splice(row, 1);
    } else {
      right.splice(row - insertBefore, 1);
    }
  }

  dataset.value = left.concat(extractedRows.concat(right));

  const selectedRows: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    selectedRows.push(left.length + i);
  }

  vueGrid.slickGrid?.resetActiveCell();
  vueGrid.slickGrid?.invalidate();
}

function handleOnDragInit(e: CustomEvent) {
  // prevent the grid from cancelling drag'n'drop by default
  e.stopImmediatePropagation();
}

function handleOnDragStart(e: CustomEvent) {
  const cell = vueGrid.slickGrid?.getCellFromEvent(e);

  if (!cell || cell.cell === 0) {
    dragMode.value = '';
    return;
  }

  const row = cell.row;
  if (!dataset.value[row]) {
    return;
  }

  if (SlickGlobalEditorLock.isActive()) {
    return;
  }

  e.stopImmediatePropagation();
  dragMode.value = 'recycle';

  let selectedRows: number[] = vueGrid.slickGrid?.getSelectedRows() || [];

  if (!selectedRows.length || selectedRows.findIndex((row) => row === row) === -1) {
    selectedRows = [row];
    vueGrid.slickGrid?.setSelectedRows(selectedRows);
  }

  dragRows.value = selectedRows;
  const dragCount = selectedRows.length;

  const dragMsgElm = document.createElement('span');
  dragMsgElm.className = 'drag-message';
  dragMsgElm.textContent = `Drag to Recycle Bin to delete ${dragCount} selected row(s)`;
  dragHelper = dragMsgElm;
  document.body.appendChild(dragMsgElm);
  document.querySelector<HTMLDivElement>('#dropzone')?.classList.add('drag-dropzone');

  return dragMsgElm;
}

function handleOnDrag(e: MouseEvent, args: any) {
  if (dragMode.value !== 'recycle') {
    return;
  }
  if (dragHelper instanceof HTMLElement) {
    dragHelper.style.top = `${e.pageY + 5}px`;
    dragHelper.style.left = `${e.pageX + 5}px`;
  }

  // add/remove pink background color when hovering recycle bin
  const dropzoneElm = document.querySelector<HTMLDivElement>('#dropzone')!;
  if (args.target instanceof HTMLElement && (args.target.id === 'dropzone' || args.target === dropzoneElm)) {
    dropzoneElm.classList.add('drag-hover'); // OR: dd.target.style.background = 'pink';
  } else {
    dropzoneElm.classList.remove('drag-hover');
  }
}

function handleOnDragEnd(e: CustomEvent, args: any) {
  if (dragMode.value != 'recycle') {
    return;
  }
  dragHelper?.remove();
  document.querySelector<HTMLDivElement>('#dropzone')?.classList.remove('drag-dropzone', 'drag-hover');

  if (dragMode.value != 'recycle' || args.target.id !== 'dropzone') {
    return;
  }

  // reaching here means that we'll remove the row that we started dragging from the dataset
  const rowsToDelete = dragRows.value.sort().reverse();
  for (const rowToDelete of rowsToDelete) {
    dataset.value.splice(rowToDelete, 1);
  }
  vueGrid.slickGrid?.invalidate();
  vueGrid.slickGrid?.setSelectedRows([]);
  dataset.value = [...dataset.value];
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => vueGrid.resizerService.resizeGrid());
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>

<template>
  <h2>
    Example 41: Drag & Drop
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example41.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button
      class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
      type="button"
      data-test="toggle-subtitle"
      @click="toggleSubTitle()"
    >
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <h6 class="subtitle italic">
    <ul>
      <li>Click to select, Ctrl-click to toggle selection(s).</li>
      <li>Drag one or more rows by the handle icon (1st column) to reorder.</li>
      <li>Drag one or more rows by selection (2nd or 3rd column) and drag to the recycle bin to delete.</li>
    </ul>
  </h6>

  <div class="row">
    <div class="col">
      <slickgrid-vue
        v-model:options="gridOptions!"
        v-model:columns="columnDefinitions as Column[]"
        v-model:data="dataset"
        grid-id="grid2"
        @onDragInit="handleOnDragInit($event.detail.eventData)"
        @onDragStart="handleOnDragStart($event.detail.eventData)"
        @onDrag="handleOnDrag($event.detail.eventData, $event.detail.args)"
        @onDragEnd="handleOnDragEnd($event.detail.eventData, $event.detail.args)"
        @onVueGridCreated="vueGridReady($event.detail)"
      >
        <template #header>
          <div class="grid-header">
            <label>Santa's TODO list:</label>
          </div>
        </template>
      </slickgrid-vue>
      <div class="col">
        <div id="dropzone" class="recycle-bin mt-4">Recycle Bin</div>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
.drag-message {
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
  background: transparent;
  cursor: default;
  width: 120px;
  border: 2px solid #e4e4e4;
  background: beige;
  padding: 4px;
  font-size: 12pt;
  font-weight: bold;
  color: black;
  text-align: center;
  border-radius: 10px;

  &.drag-dropzone {
    border: 2px dashed pink;
  }
  &.drag-hover {
    background: pink;
    cursor: crosshair;
  }
}
</style>
