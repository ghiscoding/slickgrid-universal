<script setup lang="ts">
import { format as dateFormatter } from '@formkit/tempo';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  type GridOption,
  type Grouping,
  type Metrics,
  type OnRowCountChangedEventArgs,
  type SlickgridVueInstance,
  Aggregators,
  type Column,
  Filters,
  Formatters,
  SlickgridVue,
  SortComparers,
  SortDirectionNumber,
} from 'slickgrid-vue';
import { computed, onBeforeMount, ref, type Ref } from 'vue';

import { randomNumber } from './utilities.js';

const FETCH_SIZE = 50;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const metrics = ref<Partial<Metrics>>({});
const shouldResetOnSort = ref(false);
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

const getMetricsEndTime = computed(() => (metrics.value?.endTime ? dateFormatter(metrics.value.endTime, 'DD MMM, h:mm:ss a') : ''));

onBeforeMount(() => {
  defineGrid();
  dataset.value = loadData(0, FETCH_SIZE);
  metrics.value = {
    itemCount: FETCH_SIZE,
    totalItemCount: FETCH_SIZE,
  };
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100, filterable: true },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      sortable: true,
      minWidth: 100,
      filterable: true,
      type: 'number',
    },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      sortable: true,
      minWidth: 100,
      filterable: true,
      type: 'number',
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      type: 'date',
      outputType: 'dateIso', // for date picker format
      formatter: Formatters.date,
      exportWithFormatter: true,
      params: { dateFormat: 'MMM DD, YYYY' },
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.compoundDate,
      },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      type: 'date',
      outputType: 'dateIso', // for date picker format
      formatter: Formatters.date,
      exportWithFormatter: true,
      params: { dateFormat: 'MMM DD, YYYY' },
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.compoundDate,
      },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      sortable: true,
      minWidth: 100,
      filterable: true,
      formatter: Formatters.checkmarkMaterial,
    },
  ];

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableAutoResize: true,
    enableFiltering: true,
    enableGrouping: true,
    editable: false,
    rowHeight: 33,
    enableExcelExport: true,
    externalResources: [new ExcelExportService()],
  };
}

// add onScroll listener which will detect when we reach the scroll end
// if so, then append items to the dataset
function handleOnScroll(args: any) {
  const viewportElm = args.grid.getViewportNode();
  if (
    ['mousewheel', 'scroll'].includes(args.triggeredBy || '') &&
    viewportElm.scrollTop > 0 &&
    Math.ceil(viewportElm.offsetHeight + args.scrollTop) >= args.scrollHeight
  ) {
    console.log('onScroll end reached, add more items');
    const startIdx = vueGrid.dataView?.getItemCount() || 0;
    const newItems = loadData(startIdx, FETCH_SIZE);
    vueGrid.dataView?.addItems(newItems);
  }
}

// do we want to reset the dataset when Sorting?
// if answering Yes then use the code below
function handleOnSort() {
  if (shouldResetOnSort.value) {
    const newData = loadData(0, FETCH_SIZE);
    vueGrid.slickGrid?.scrollTo(0); // scroll back to top to avoid unwanted onScroll end triggered
    vueGrid.dataView?.setItems(newData);
    vueGrid.dataView?.reSort();
  }
}

function groupByDuration() {
  vueGrid?.dataView?.setGrouping({
    getter: 'duration',
    formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
    comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
    aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
    aggregateCollapsed: false,
    lazyTotalsCalculation: true,
  } as Grouping);

  // you need to manually add the sort icon(s) in UI
  vueGrid?.slickGrid?.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
  vueGrid?.slickGrid?.invalidate(); // invalidate all rows and re-render
}

function loadData(startIdx: number, count: number) {
  const tmpData: any[] = [];
  for (let i = startIdx; i < startIdx + count; i++) {
    tmpData.push(newItem(i));
  }

  return tmpData;
}

function newItem(idx: number) {
  return {
    id: idx,
    title: 'Task ' + idx,
    duration: Math.round(Math.random() * 100) + '',
    percentComplete: randomNumber(1, 12),
    start: new Date(2020, randomNumber(1, 11), randomNumber(1, 28)),
    finish: new Date(2022, randomNumber(1, 11), randomNumber(1, 28)),
    effortDriven: idx % 5 === 0,
  };
}

function onSortReset(shouldReset: boolean) {
  shouldResetOnSort.value = shouldReset;
}

function clearAllFiltersAndSorts() {
  if (vueGrid?.gridService) {
    vueGrid.gridService.clearAllFiltersAndSorts();
  }
}

function setFiltersDynamically() {
  // we can Set Filters Dynamically (or different filters) afterward through the FilterService
  vueGrid?.filterService.updateFilters([{ columnId: 'start', searchTerms: ['2020-08-25'], operator: '<=' }]);
}

function handleOnRowCountChanged(args: OnRowCountChangedEventArgs) {
  if (vueGrid && args?.current >= 0) {
    // we probably want to re-sort the data when we get new items
    vueGrid.dataView?.reSort();

    // update metrics
    metrics.value.itemCount = vueGrid.dataView?.getFilteredItemCount() || 0;
    metrics.value.totalItemCount = args.itemCount || 0;
  }
}

function setSortingDynamically() {
  vueGrid?.sortService.updateSorting([{ columnId: 'title', direction: 'DESC' }]);
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
    Example 40: Infinite Scroll from JSON data
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example40.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    <ul>
      <li>
        Infinite scrolling allows the grid to lazy-load rows from the server when reaching the scroll bottom (end) position. In its simplest
        form, the more the user scrolls down, the more rows get loaded.
      </li>
      <li>
        NOTES: <code>presets.pagination</code> is not supported with Infinite Scroll and will revert to the first page, simply because since
        we keep appending data, we always have to start from index zero (no offset).
      </li>
    </ul>
  </div>

  <div class="row">
    <div class="col-sm-12">
      <button
        class="btn btn-outline-secondary btn-sm btn-icon"
        data-test="clear-filters-sorting"
        title="Clear all Filters & Sorts"
        @click="clearAllFiltersAndSorts()"
      >
        <span class="mdi mdi-close"></span>
        <span>Clear all Filter & Sorts</span>
      </button>
      <button class="btn btn-outline-secondary btn-sm mx-1" data-test="set-dynamic-filter" @click="setFiltersDynamically()">
        Set Filters Dynamically
      </button>
      <button class="btn btn-outline-secondary btn-sm" data-test="set-dynamic-sorting" @click="setSortingDynamically()">
        Set Sorting Dynamically
      </button>
      <button class="btn btn-outline-secondary btn-sm mx-1" data-test="group-by-duration" @click="groupByDuration()">
        Group by Duration
      </button>

      <label class="ml-4">Reset Dataset <code>onSort</code>:</label>
      <button class="btn btn-outline-secondary btn-sm mx-1" data-test="onsort-on" @click="onSortReset(true)">ON</button>
      <button class="btn btn-outline-secondary btn-sm" data-test="onsort-off" @click="onSortReset(false)">OFF</button>
    </div>
  </div>

  <div :show="metrics" class="mt-2" style="margin: 10px 0px">
    <b>Metrics:</b>
    <span>
      <span>{{ getMetricsEndTime }}</span> —
      <span data-test="totalItemCount">{{ metrics.totalItemCount }}</span>
      items
    </span>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    grid-id="grid40"
    @onRowCountChanged="handleOnRowCountChanged($event.detail.args)"
    @onSort="handleOnSort()"
    @onScroll="handleOnScroll($event.detail.args)"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
