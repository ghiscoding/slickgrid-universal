<script setup lang="ts">
import { SlickgridVue, type Column, type GridOption, type SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const NB_ITEMS = 200;

interface StoryItem {
  id: number;
  title: string;
  owner: string;
  summary: string;
  rowHeight: number;
}

const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]);
const dataset = ref<StoryItem[]>([]);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  dataset.value = getData(NB_ITEMS);
});

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}

function scrollToRow90() {
  vueGrid?.slickGrid?.scrollRowToTop(90);
}

function defineGrid() {
  columns.value = [
    { id: 'id', name: '#', field: 'id', minWidth: 60, maxWidth: 70 },
    { id: 'title', name: 'Story', field: 'title', minWidth: 180, width: 220 },
    { id: 'owner', name: 'Owner', field: 'owner', minWidth: 110, width: 130 },
    { id: 'rowHeight', name: 'Height', field: 'rowHeight', formatter: (_row, _cell, value) => `${value}px`, minWidth: 90, width: 90 },
    { id: 'summary', name: 'Summary', field: 'summary', cssClass: 'cell-wrap', minWidth: 360, width: 500, maxWidth: 620 },
  ];

  gridOptions.value = {
    enableCellNavigation: true,
    enableTextSelectionOnCells: true,
    rowHeight: 40,
    gridHeight: 560,
    gridWidth: 1080,
    rowHeightProvider: (_grid, _row, item: StoryItem) => item.rowHeight,
  };
}

function getData(itemCount: number): StoryItem[] {
  const owners = ['Alex', 'Priya', 'Mia', 'Sam', 'Chris'];
  const fragments = [
    'Refactor keyboard shortcut handling for better readability.',
    'Adjust frozen rows when view-model updates after grouping.',
    'Improve screen-reader labels on grid menu actions.',
    'Align batch editor validation with backend constraints.',
    'Capture edge-case around hidden columns and row-span.',
  ];

  const data: StoryItem[] = [];
  for (let i = 0; i < itemCount; i++) {
    const lineCount = (i % 4) + 1;
    const summary = Array.from({ length: lineCount }, (_, idx) => `${fragments[(i + idx) % fragments.length]}`).join(' ');
    const wordCount = summary.trim().split(/\s+/).length;
    const computedRowHeight = Math.max(40, 8 + lineCount * 16);
    data.push({
      id: i,
      title: `Story ${i}`,
      owner: owners[i % owners.length],
      summary,
      rowHeight: wordCount < 10 ? 33 : computedRowHeight,
    });
  }
  return data;
}
</script>

<template>
  <h2>
    Example 55: Variable Row Height (Provider)
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example55.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
  </h2>

  <div class="subtitle">Variable row heights driven by <code>rowHeightProvider</code>.</div>

  <div class="row" style="margin-bottom: 6px">
    <div class="col-md-12">
      <button class="btn btn-outline-secondary btn-sm btn-icon" @click="scrollToRow90()" data-test="scroll-row-90-example55">
        <span class="mdi mdi-arrow-down"></span>
        <span> Scroll To row 90</span>
      </button>
    </div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columns"
    v-model:dataset="dataset"
    grid-id="grid55"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss">
#slickGridContainer-grid55 {
  --slick-cell-border-left: 1px solid #dedede;
}

#slickGridContainer-grid55 .slickgrid-container .slick-cell.cell-wrap {
  white-space: normal;
  text-overflow: clip;
  overflow: hidden;
  overflow-wrap: anywhere;
}
</style>
