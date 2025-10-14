<script setup lang="ts">
import { type GridOption, type SlickgridVueInstance, type Column, Formatters, SlickgridVue } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

import CustomFooter from './CustomFooterComponent.vue';

const NB_ITEMS = 995;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  dataset.value = mockData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];
  gridOptions.value = {
    enableAutoResize: false,
    enableSorting: true,
    gridHeight: 225,
    gridWidth: 800,
  };
}

function mockData(count: number) {
  // mock a dataset
  const mockDataset: any[] = [];
  for (let i = 0; i < count; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);

    mockDataset[i] = {
      id: i,
      title: 'Task ' + i,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      start: new Date(randomYear, randomMonth + 1, randomDay),
      finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
      effortDriven: i % 5 === 0,
    };
  }

  return mockDataset;
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
    Example 29: Grid with Header and Footer slot
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example29.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">Simple Grids with a custom header and footer via named slots</div>

  <hr />

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    grid-id="grid2"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
    <template #header>
      <div class="custom-header-slot">
        <h3>Grid with header and footer slot</h3>
      </div>
    </template>
    <template #footer>
      <div class="custom-footer-slot">
        <CustomFooter />
      </div>
    </template>
  </slickgrid-vue>
</template>
