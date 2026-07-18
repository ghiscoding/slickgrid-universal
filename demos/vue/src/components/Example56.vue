<script setup lang="ts">
import { SlickgridVue, type Column, type GridOption, type SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const NB_ITEMS = 150;

interface TaskItem {
  id: number;
  title: string;
  status: 'Todo' | 'In Progress' | 'Done';
  notes: string;
}

const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]);
const dataset = ref<TaskItem[]>([]);
const isCompact = ref(false);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  dataset.value = getData(NB_ITEMS);
});

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}

function toggleDensity() {
  isCompact.value = !isCompact.value;
  vueGrid?.slickGrid?.invalidateRowHeights?.();
}

function scrollToRow90() {
  vueGrid?.slickGrid?.scrollRowToTop(90);
}

function defineGrid() {
  columns.value = [
    { id: 'id', name: '#', field: 'id', minWidth: 60, maxWidth: 70 },
    { id: 'title', name: 'Task', field: 'title', minWidth: 180, width: 220 },
    { id: 'status', name: 'Status', field: 'status', minWidth: 120, width: 140 },
    { id: 'notes', name: 'Notes', field: 'notes', cssClass: 'cell-wrap', width: 420, maxWidth: 520 },
  ];

  gridOptions.value = {
    enableCellNavigation: true,
    enableTextSelectionOnCells: true,
    rowHeight: 40,
    frozenRow: 2,
    gridHeight: 560,
    gridWidth: 1080,
    dataView: {
      globalItemMetadataProvider: {
        getRowMetadata: (item: TaskItem) => {
          if (item.notes === 'Short note.') {
            return { height: isCompact.value ? 40 : 33 };
          }

          const lineCount = getEstimatedLineCount(item.notes);
          const verticalPadding = 8;
          const lineHeight = isCompact.value ? 21 : 18;
          const minRowHeight = isCompact.value ? 46 : 40;
          const baseHeight = Math.max(minRowHeight, verticalPadding + lineCount * lineHeight);

          return { height: baseHeight };
        },
      },
    },
  };
}

function getEstimatedLineCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / 55));
}

function getData(itemCount: number): TaskItem[] {
  const statuses: Array<TaskItem['status']> = ['Todo', 'In Progress', 'Done'];
  const notesPool = [
    'Short note.',
    'Need to validate keyboard navigation and ensure screen reader output remains stable across frozen panes.',
    'Review row height invalidation path when data changes quickly due to live updates from backend polling.',
    'Longer QA note: validate scrolling behavior at top and bottom boundaries, compare rendered range against expected rows, and confirm no visual clipping for wrapped cells.',
  ];

  const data: TaskItem[] = [];
  for (let i = 0; i < itemCount; i++) {
    data.push({
      id: i,
      title: `Task ${i}`,
      status: statuses[i % statuses.length],
      notes: notesPool[i % notesPool.length],
    });
  }
  return data;
}
</script>

<template>
  <h2>
    Example 56: Variable Row Height (Dynamic)
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example56.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
  </h2>

  <div class="subtitle">
    Variable row heights via <code>ItemMetadata.height</code> fallback, with compact mode rebuilding heights through
    <code>invalidateRowHeights()</code>.
  </div>

  <div class="row" style="margin-bottom: 6px">
    <div class="col-md-12">
      <button class="btn btn-outline-secondary btn-sm btn-icon" @click="toggleDensity()" data-test="toggle-density">
        <span class="mdi mdi-flip-vertical"></span>
        <span> Toggle Compact Density</span>
      </button>
      <button class="btn btn-outline-secondary btn-sm ms-2 btn-icon" @click="scrollToRow90()" data-test="scroll-row-90-example56">
        <span class="mdi mdi-arrow-down"></span>
        <span> Scroll To row 90</span>
      </button>
    </div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columns"
    v-model:dataset="dataset"
    grid-id="grid56"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss">
#slickGridContainer-grid56 {
  --slick-cell-border-left: 1px solid #dedede;
}

#slickGridContainer-grid56 .slickgrid-container .slick-cell.cell-wrap {
  white-space: normal;
  text-overflow: clip;
  overflow: hidden;
  overflow-wrap: anywhere;
}
</style>
