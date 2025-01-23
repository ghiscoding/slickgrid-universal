<script setup lang="ts">
import { type GridOption, type SlickgridVueInstance, type Column, Filters, SlickgridVue } from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

import URL_CUSTOMERS_URL from './data/customers_100.json?url';

const NB_ITEMS = 500;
const gridOptions1 = ref<GridOption>();
const gridOptions2 = ref<GridOption>();
const columnDefinitions1 = ref<Column[]>([]);
const columnDefinitions2 = ref<Column[]>([]);
const dataset1 = ref<any[]>([]);
const dataset2 = ref<any[]>([]);
const showSubTitle = ref(true);
let vueGrid1!: SlickgridVueInstance;
let vueGrid2!: SlickgridVueInstance;

onBeforeMount(async () => {
  // define the grid options & columns and then create the grid itself
  defineGrid1();
  defineGrid2();

  // mock some data (different in each dataset)
  dataset1.value = loadData(NB_ITEMS);

  // load data with Fetch-Client
  const response2 = await fetch(URL_CUSTOMERS_URL);
  dataset2.value = await response2['json']();
});

// Grid2 definition
function defineGrid1() {
  columnDefinitions1.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', minWidth: 100 },
    { id: 'finish', name: 'Finish', field: 'finish', minWidth: 100 },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];
  gridOptions1.value = {
    enableAutoResize: true,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableSorting: true,
  };
}

// Grid2 definition
function defineGrid2() {
  columnDefinitions2.value = [
    { id: 'name', name: 'Name', field: 'name', filterable: true, sortable: true },
    {
      id: 'gender',
      name: 'Gender',
      field: 'gender',
      filterable: true,
      sortable: true,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: 'male', label: 'male' },
          { value: 'female', label: 'female' },
        ],
      },
    },
    { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true },
  ];

  gridOptions2.value = {
    enableAutoResize: true,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableFiltering: true,
    enableSorting: true,
  };
}

function loadData(count: number) {
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
      start: `${randomMonth}/${randomDay}/${randomYear}`,
      finish: `${randomMonth}/${randomDay}/${randomYear}`,
      effortDriven: i % 5 === 0,
    };
  }

  return mockDataset;
}

/**
 * When changing Tab, we need to resize the grid in the new Tab that becomes in focus.
 * We need to do this (only once) because SlickGrid relies on the grid being visible in the DOM for it to be sized properly
 * and if it's not (like our use case) we need to resize the grid ourselve and we just need to do that once.
 */
function resizeGrid2() {
  vueGrid2.resizerService.resizeGrid(10);
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => {
    vueGrid1.resizerService.resizeGrid();
    vueGrid2.resizerService.resizeGrid();
  });
}

function vueGrid1Ready(grid: SlickgridVueInstance) {
  vueGrid1 = grid;
}

function vueGrid2Ready(grid: SlickgridVueInstance) {
  vueGrid2 = grid;
}
</script>

<template>
  <h2>
    Example 22: Grids in Bootstrap Tabs
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example22.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    This example demonstrate the creation of multiple grids in Bootstrap Tabs
    <ol>
      <li>Regular mocked data with javascript</li>
      <li>Load dataset through Fetch-Client. Also note we need to call a "resizeGrid()" after focusing on this tab</li>
    </ol>
  </div>

  <div>
    <nav>
      <div id="nav-tab" class="nav nav-tabs" role="tablist">
        <button
          id="javascript-tab"
          class="nav-link active"
          data-bs-toggle="tab"
          data-bs-target="#javascript"
          type="button"
          role="tab"
          aria-controls="javascript"
          aria-selected="true"
        >
          JavaScript
        </button>
        <button
          id="fetch-tab"
          class="nav-link"
          data-bs-toggle="tab"
          data-bs-target="#fetch"
          type="button"
          role="tab"
          aria-controls="fetch"
          aria-selected="false"
          @click="resizeGrid2()"
        >
          Fetch-Client
        </button>
      </div>
    </nav>
    <div id="nav-tabContent" class="tab-content">
      <div id="javascript" class="tab-pane fade show active" role="tabpanel" aria-labelledby="javascript-tab" tabindex="0">
        <h4>Grid 1 - Load Local Data</h4>

        <slickgrid-vue
          v-model:options="gridOptions1!"
          v-model:columns="columnDefinitions1"
          v-model:data="dataset1"
          grid-id="grid1"
          @onVueGridCreated="vueGrid1Ready($event.detail)"
        >
        </slickgrid-vue>
      </div>
      <div id="fetch" class="tab-pane fade" role="tabpanel" aria-labelledby="fetch-tab" tabindex="0">
        <h4>Grid 2 - Load a JSON dataset through Fetch-Client</h4>
        <slickgrid-vue
          v-model:options="gridOptions2!"
          v-model:columns="columnDefinitions2"
          v-model:data="dataset2"
          grid-id="grid2"
          @onVueGridCreated="vueGrid2Ready($event.detail)"
        >
        </slickgrid-vue>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.tab-content {
  padding: 10px;
}
</style>
