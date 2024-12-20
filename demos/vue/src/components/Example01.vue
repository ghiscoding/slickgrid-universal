<script setup lang="ts">
import { type Column, Formatters, type GridOption, type PaginationChangedArgs, SlickgridVue, type SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, onUnmounted, ref } from 'vue';

import { zeroPadding } from './utilities';

const NB_ITEMS = 995;

let _darkModeGrid1 = false;

let vueGrid1!: SlickgridVueInstance;
const gridOptions1 = ref<GridOption>();
const gridOptions2 = ref<GridOption>();
const columnDefinitions1 = ref<Column[]>();
const columnDefinitions2 = ref<Column[]>();
const dataset1 = ref<any[]>([]);
const dataset2 = ref<any[]>([]);

onBeforeMount(() => {
  defineGrids();
  // mock some data (different in each dataset)
  dataset1.value = mockData(NB_ITEMS);
  dataset1.value = mockData(NB_ITEMS);
  dataset2.value = mockData(NB_ITEMS);
});

function vueGrid1Ready(vueGrid: SlickgridVueInstance) {
  vueGrid1 = vueGrid;
}

function updateDataset1() {
  dataset1.value = mockData(125);
  dataset1.value = mockData(125);
}

function isBrowserDarkModeEnabled() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

onUnmounted(() => {
  // also unsubscribe all Vue Subscriptions
  // document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
  // document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
});

/* Define grid Options and Columns */
function defineGrids() {
  columnDefinitions1.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];
  _darkModeGrid1 = isBrowserDarkModeEnabled();
  gridOptions1.value = {
    darkMode: _darkModeGrid1,
    gridHeight: 225,
    gridWidth: 800,
    enableAutoResize: false,
    enableSorting: true,
  };

  // copy the same Grid Options and Column Definitions to 2nd grid
  // but also add Pagination in this grid
  columnDefinitions2.value = columnDefinitions1.value;
  gridOptions2.value = {
    ...gridOptions1.value,
    ...{
      darkMode: false,
      enablePagination: true,
      pagination: {
        pageSizes: [5, 10, 20, 25, 50],
        pageSize: 5,
      },
    },
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
      start: `${zeroPadding(randomYear)}-${zeroPadding(randomMonth + 1)}-${zeroPadding(randomDay)}`,
      finish: `${zeroPadding(randomYear + 1)}-${zeroPadding(randomMonth + 1)}-${zeroPadding(randomDay)}`,
      effortDriven: i % 5 === 0,
    };
  }

  return mockDataset;
}

function paginationChanged(changes: PaginationChangedArgs) {
  console.log('Pagination changed', changes);
}

function toggleDarkModeGrid1() {
  _darkModeGrid1 = !_darkModeGrid1;
  if (_darkModeGrid1) {
    document.querySelector('.grid-container1')?.classList.add('dark-mode');
  } else {
    document.querySelector('.grid-container1')?.classList.remove('dark-mode');
  }
  vueGrid1.slickGrid?.setOptions({ darkMode: _darkModeGrid1 });
}
</script>

<template>
  <h2>
    Example 1: Basic Grids
    <span class="float-end font18">
      see&nbsp;
      <a target="_blank" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example01.vue">
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
  </h2>
  <div class="subtitle">Simple Grids with Fixed Sizes (800 x 225)</div>

  <h3>
    <div class="column">
      <span class="mr-3">Grid 1</span>
      <button class="btn btn-outline-secondary btn-sm btn-icon ms-2" data-test="toggle-dark-mode" @click="toggleDarkModeGrid1()">
        <i class="mdi mdi-theme-light-dark"></i>
        <span>Toggle Dark Mode</span>
      </button>
      <button class="btn btn-outline-secondary btn-sm btn-icon ms-2" @click="updateDataset1()">Randomize Dataset</button>
    </div>
  </h3>

  <div class="grid-container1">
    <SlickgridVue
      v-model:options="gridOptions1!"
      v-model:columns="columnDefinitions1 as Column[]"
      v-model:data="dataset1"
      grid-id="grid1-1"
      @onVueGridCreated="vueGrid1Ready($event.detail)"
    >
    </SlickgridVue>
  </div>

  <hr />

  <h3>Grid 2 <small>(with local Pagination)</small></h3>

  <slickgrid-vue
    v-model:options="gridOptions2!"
    v-model:columns="columnDefinitions2 as Column[]"
    v-model:data="dataset2"
    grid-id="grid1-2"
    @on-pagination-changed="paginationChanged($event.detail)"
  >
  </slickgrid-vue>
</template>
