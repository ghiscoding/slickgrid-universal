<script setup lang="ts">
import { type GridOption, type SlickgridVueInstance, type Column, Formatters, type OperatorString, SlickgridVue } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const NB_ITEMS = 25;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
const operatorList = ref<OperatorString[]>(['=', '<', '<=', '>', '>=', '<>', 'StartsWith', 'EndsWith']);
const searchValue = ref('');
const selectedColumn = ref<Column>();
const selectedOperator = ref('');
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  dataset.value = getData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      width: 100,
      sortable: true,
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      width: 100,
      sortable: true,
      type: 'number',
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      width: 100,
      sortable: true,
      formatter: Formatters.percentCompleteBar,
      type: 'number',
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      width: 100,
      sortable: true,
      formatter: Formatters.dateIso,

      type: 'date',
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      width: 100,
      sortable: true,
      formatter: Formatters.dateIso,
      type: 'date',
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      width: 100,
      sortable: true,
      formatter: Formatters.checkmarkMaterial,
      type: 'number',
    },
  ];

  gridOptions.value = {
    // if you want to disable autoResize and use a fixed width which requires horizontal scrolling
    // it's advised to disable the autoFitColumnsOnFirstLoad as well
    // enableAutoResize: false,
    // autoFitColumnsOnFirstLoad: false,

    autoHeight: true,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },

    // enable the filtering but hide the user filter row since we use our own single filter
    enableFiltering: true,
    showHeaderRow: false, // hide the filter row (header row)

    alwaysShowVerticalScroll: false,
    enableColumnPicker: true,
    enableCellNavigation: true,
    enableRowSelection: true,
  };
}

function getData(count: number) {
  // mock a dataset
  const mockedDataset: any[] = [];
  for (let i = 0; i < count; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);

    mockedDataset[i] = {
      id: i,
      title: 'Task ' + i,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 1, randomDay),
      effortDriven: i % 5 === 0,
    };
  }

  return mockedDataset;
}

//
// -- if any of the Search form input changes, we'll call the updateFilter() method
//

function clearGridSearchInput() {
  searchValue.value = '';
  updateFilter();
}

function updateFilter() {
  vueGrid?.filterService.updateSingleFilter({
    columnId: `${selectedColumn.value?.id || ''}`,
    operator: selectedOperator.value as OperatorString,
    searchTerms: [searchValue.value || ''],
  });
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
    Example 21: Grid AutoHeight
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example21.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    The SlickGrid option "autoHeight" can be used if you wish to keep the full height of the grid without any scrolling
    <ul>
      <li>You define a fixed grid width via "gridWidth" in the View</li>
      <li>You can still use the "autoResize" for the width to be resized automatically (the height will never change in this case)</li>
      <li>
        This dataset has 25 rows, if you scroll down the page you can see the entire set is shown without any grid scrolling (though you
        might have browser scrolling)
      </li>
    </ul>
  </div>

  <div class="row row-cols-lg-auto g-1 align-items-center">
    <div class="col">
      <label for="columnSelect">Single Search:</label>
    </div>
    <div class="col">
      <select
        id="columnSelect"
        v-model="selectedColumn"
        class="form-select"
        data-test="search-column-list"
        name="selectedColumn"
        @change="updateFilter()"
      >
        <option v-for="(column, index) in columnDefinitions" :key="index" :value="column">{{ column.name }}</option>
      </select>
    </div>
    <div class="col">
      <select v-model="selectedOperator" class="form-select" data-test="search-operator-list" @change="updateFilter()">
        <option v-for="(operator, index) in operatorList" :key="index" :value="operator">{{ operator }}</option>
      </select>
    </div>

    <div class="col">
      <div class="input-group">
        <input
          v-model="searchValue"
          type="text"
          class="form-control"
          placeholder="search value"
          data-test="search-value-input"
          @input="updateFilter()"
        />
        <button
          class="btn btn-outline-secondary d-flex align-items-center pl-2 pr-2"
          data-test="clear-search-value"
          @click="clearGridSearchInput()"
        >
          <span class="mdi mdi-close"></span>
        </button>
      </div>
    </div>
  </div>

  <hr />

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    grid-id="grid21"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss" scoped>
// sort indication will show behind Grid Menu since we don't have scroll,
// we can offset these icons to fix that
#grid21 {
  .slick-header-column:last-child {
    .slick-header-menu-button,
    .slick-resizable-handle,
    .slick-sort-indicator,
    .slick-sort-indicator-numbered {
      margin-right: 18px; // grid menu icon width
    }
  }
}
</style>
