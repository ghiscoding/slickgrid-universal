<script setup lang="ts">
import {
  BasePaginationModel,
  type Column,
  FieldType,
  Filters,
  Formatters,
  type GridOption,
  type MultipleSelectOption,
  OperatorType,
  SlickgridVue,
  type SlickgridVueInstance,
  type SliderRangeOption,
} from 'slickgrid-vue';
import { DefineComponent, onBeforeMount, ref } from 'vue';

import CustomPagerComponent from './CustomPager.vue';

const NB_ITEMS = 5000;
const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
const pageSize = ref(50);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  dataset.value = loadData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'title',
      name: 'Title',
      field: 'id',
      minWidth: 100,
      sortable: true,
      filterable: true,
      formatter: (_row, _cell, val) => `Task ${val}`,
      params: { useFormatterOuputToFilter: true },
    },
    {
      id: 'description',
      name: 'Description',
      field: 'description',
      filterable: true,
      sortable: true,
      minWidth: 80,
      type: FieldType.string,
    },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      minWidth: 120,
      sortable: true,
      customTooltip: { position: 'center' },
      formatter: Formatters.progressBar,
      type: FieldType.number,
      filterable: true,
      filter: {
        model: Filters.sliderRange,
        maxValue: 100, // or you can use the filterOptions as well
        operator: OperatorType.rangeInclusive, // defaults to inclusive
        filterOptions: {
          hideSliderNumbers: false, // you can hide/show the slider numbers on both side
          min: 0,
          step: 5,
        } as SliderRangeOption,
      },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 75,
      width: 100,
      exportWithFormatter: true,
      type: FieldType.date,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 75,
      width: 120,
      exportWithFormatter: true,
      type: FieldType.date,
      filterable: true,
      filter: {
        model: Filters.dateRange,
      },
    },
    {
      id: 'duration',
      field: 'duration',
      name: 'Duration',
      maxWidth: 90,
      type: FieldType.number,
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.input,
        operator: OperatorType.rangeExclusive, // defaults to exclusive
      },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      minWidth: 85,
      maxWidth: 90,
      formatter: Formatters.checkmarkMaterial,
      exportWithFormatter: true, // you can set this property in the column definition OR in the grid options, column def has priority over grid options
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
        model: Filters.singleSelect,
        filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
      },
    },
  ];

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      bottomPadding: 20,
    },
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    customPaginationComponent: CustomPagerComponent as DefineComponent<any, BasePaginationModel>, // load our Custom Pagination Component
    enablePagination: true,
    pagination: {
      pageSize: pageSize.value,
    },
    rowHeight: 40,
  };
}

function loadData(itemCount: number): any[] {
  // mock a dataset
  const tempDataset: any[] = [];
  for (let i = 0, ln = itemCount; i < ln; i++) {
    const randomDuration = randomBetween(0, 365);
    const randomYear = randomBetween(new Date().getFullYear(), new Date().getFullYear() + 1);
    const randomMonth = randomBetween(0, 12);
    const randomDay = randomBetween(10, 28);
    const randomPercent = randomBetween(0, 100);

    tempDataset.push({
      id: i,
      title: 'Task ' + i,
      description: i % 5 ? 'desc ' + i : null, // also add some random to test NULL field
      duration: randomDuration,
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: i % 4 ? null : new Date(randomYear, randomMonth, randomDay), // provide a Date format
      finish: new Date(randomYear, randomMonth, randomDay),
      completed: randomPercent === 100 ? true : false,
    });
  }

  return tempDataset;
}

function pageSizeChanged(pageSize: number) {
  vueGrid.paginationService?.changeItemPerPage(pageSize);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
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
    Example 42: Custom Pagination
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example42.vue"
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

  <div class="subtitle">
    You can create a Custom Pagination by passing an Vue Custom Component and it must be an instance of type
    <code>DefineComponent&lt;any, BasePaginationModel&gt;</code> which must implements all necessary functions. The pagination can
    be located anywhere on the page (top or bottom). pagination elements).
  </div>

  <div>
    <span class="margin-15px">
      Page Size
      <input
        :value="pageSize"
        class="input is-small is-narrow"
        type="text"
        data-test="page-size-input"
        style="width: 55px"
        @input="pageSizeChanged(($event.target as any).value)"
      />
    </span>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions!"
    v-model:columns="columnDefinitions as Column[]"
    v-model:data="dataset"
    grid-id="grid42"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
