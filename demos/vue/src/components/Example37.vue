<script setup lang="ts">
import {
  type GridOption,
  type OnCellChangeEventArgs,
  type SlickgridVueInstance,
  type Column,
  Editors,
  FieldType,
  SlickgridVue,
} from 'slickgrid-vue';
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue';

const NB_ITEMS = 100;
const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
const isDarkMode = ref(false);
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

onMounted(() => {
  // populate the dataset once the grid is ready
  dataset.value = loadData(NB_ITEMS);
  updateAllTotals();
});

onUnmounted(() => {
  document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
  document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
});

/* Define grid Options and Columns */
function defineGrid() {
  const columnDefs: Column[] = [];
  for (let i = 0; i < 10; i++) {
    columnDefs.push({
      id: i,
      name: String.fromCharCode('A'.charCodeAt(0) + i),
      field: String(i),
      type: FieldType.number,
      width: 58,
      editor: { model: Editors.integer },
    });
  }
  columnDefinitions.value = columnDefs;

  gridOptions.value = {
    autoEdit: true,
    autoCommitEdit: true,
    editable: true,
    darkMode: isDarkMode.value,
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
    for (let j = 0; j < columnDefinitions.value.length; j++) {
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
  let columnIdx = vueGrid.slickGrid?.getColumns().length || 0;
  while (columnIdx--) {
    updateTotal(columnIdx);
  }
}

function updateTotal(cell: number) {
  const columnId = vueGrid.slickGrid?.getColumns()[cell].id as number;

  let total = 0;
  let i = dataset.value.length;
  while (i--) {
    total += parseInt(dataset.value[i][columnId], 10) || 0;
  }
  const columnElement = vueGrid.slickGrid?.getFooterRowColumn(columnId);
  if (columnElement) {
    columnElement.textContent = `Sum: ${total}`;
  }
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  toggleBodyBackground();
  vueGrid.slickGrid?.setOptions({ darkMode: isDarkMode.value });
  updateAllTotals();
}

function toggleBodyBackground() {
  if (isDarkMode.value) {
    document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
  } else {
    document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
  }
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
    Example 37: Footer Totals Row
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example37.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="toggle-dark-mode" @click="toggleDarkMode()">
      <span class="mdi mdi-theme-light-dark"></span>
      <span>Toggle Dark Mode</span>
    </button>
  </h2>

  <div class="subtitle">Display a totals row at the end of the grid.</div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions as Column[]"
    v-model:data="dataset"
    grid-id="grid37"
    @onCellChange="handleOnCellChange($event.detail.eventData, $event.detail.args)"
    @onColumnsReordered="handleOnColumnsReordered()"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
