<script setup lang="ts">
import {
  type GridOption,
  type GridStateChange,
  type SlickgridVueInstance,
  type Column,
  FieldType,
  Filters,
  Formatters,
  SlickgridVue,
} from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

const isGrid2WithPagination = ref(true);
const gridOptions1 = ref<GridOption>();
const gridOptions2 = ref<GridOption>();
const columnDefinitions1 = ref<Column[]>([]);
const columnDefinitions2 = ref<Column[]>([]);
const dataset1 = ref<any[]>([]);
const dataset2 = ref<any[]>([]);
const showSubTitle = ref(true);
const selectedTitles = ref('');
const selectedTitle = ref('');
let selectedGrid2IDs: number[] = [];
let vueGrid1!: SlickgridVueInstance;
let vueGrid2!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrids();
  // mock some data (different in each dataset)
  dataset1.value = loadData(495);
  dataset2.value = loadData(525);
});

/* Define grid Options and Columns */
function defineGrids() {
  columnDefinitions1.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string, filterable: true },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, type: FieldType.number, filterable: true },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      type: FieldType.number,
      filterable: true,
      sortable: true,
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
      type: FieldType.date,
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
      type: FieldType.date,
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      formatter: Formatters.checkmarkMaterial,
      type: FieldType.boolean,
      sortable: true,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, label: 'true' },
          { value: false, label: 'false' },
        ],
        model: Filters.singleSelect,
      },
    },
  ];

  columnDefinitions2.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string, filterable: true },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, type: FieldType.number, filterable: true },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      type: FieldType.number,
      filterable: true,
      sortable: true,
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
      type: FieldType.date,
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
      type: FieldType.date,
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      formatter: Formatters.checkmarkMaterial,
      type: FieldType.boolean,
      sortable: true,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, label: 'true' },
          { value: false, label: 'false' },
        ],
        model: Filters.singleSelect,
      },
    },
  ];

  gridOptions1.value = {
    enableAutoResize: false,
    enableCellNavigation: true,
    enableRowSelection: true,
    enableCheckboxSelector: true,
    enableFiltering: true,
    checkboxSelector: {
      // remove the unnecessary "Select All" checkbox in header when in single selection mode
      hideSelectAllCheckbox: true,

      // you can override the logic for showing (or not) the expand icon
      // for example, display the expand icon only on every 2nd row
      // selectableOverride: (row: number, dataContext: any, grid: SlickGrid) => (dataContext.id % 2 === 1)
    },
    multiSelect: false,
    rowSelectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: true,
    },
    columnPicker: {
      hideForceFitButton: true,
    },
    gridMenu: {
      hideForceFitButton: true,
    },
    gridHeight: 225,
    gridWidth: 800,
    enablePagination: true,
    pagination: {
      pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
      pageSize: 5,
    },
    // we can use some Presets, for the example Pagination
    presets: {
      pagination: { pageNumber: 2, pageSize: 5 },
    },
  };

  gridOptions2.value = {
    enableAutoResize: false,
    enableCellNavigation: true,
    enableFiltering: true,
    checkboxSelector: {
      // optionally change the column index position of the icon (defaults to 0)
      // columnIndexPosition: 1,

      // you can toggle these 2 properties to show the "select all" checkbox in different location
      hideInFilterHeaderRow: false,
      hideInColumnTitleRow: true,
      applySelectOnAllPages: true, // when clicking "Select All", should we apply it to all pages (defaults to true)
    },
    rowSelectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: false,
    },
    enableCheckboxSelector: true,
    enableRowSelection: true,
    gridHeight: 255,
    gridWidth: 800,
    enablePagination: true,
    pagination: {
      pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
      pageSize: 5,
    },
    // 1. pre-select some grid row indexes (less recommended, better use the Presets, see below)
    // preselectedRows: [0, 2],

    // 2. or use the Presets to pre-select some rows
    presets: {
      // you can presets row selection here as well, you can choose 1 of the following 2 ways of setting the selection
      // by their index position in the grid (UI) or by the object IDs, the default is "dataContextIds" and if provided it will use it and disregard "gridRowIndexes"
      // the RECOMMENDED is to use "dataContextIds" since that will always work even with Pagination, while "gridRowIndexes" is only good for 1 page
      rowSelection: {
        // gridRowIndexes: [2],           // the row position of what you see on the screen (UI)
        dataContextIds: [3, 12, 13, 522], // (recommended) select by your data object IDs
      },
    },
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
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 1, randomDay),
      effortDriven: i % 5 === 0,
    };
  }
  return mockDataset;
}

function goToGrid1FirstPage() {
  vueGrid1.paginationService!.goToFirstPage();
}

function goToGrid1LastPage() {
  vueGrid1.paginationService!.goToLastPage();
}

function goToGrid2FirstPage() {
  vueGrid2.paginationService!.goToFirstPage();
}

function goToGrid2LastPage() {
  vueGrid2.paginationService!.goToLastPage();
}

/** Dispatched event of a Grid State Changed event */
function grid1StateChanged(gridStateChanges: GridStateChange) {
  console.log('Grid State changed:: ', gridStateChanges);
  console.log('Grid State changed:: ', gridStateChanges.change);
}

/** Dispatched event of a Grid State Changed event */
function grid2StateChanged(gridStateChanges: GridStateChange) {
  console.log('Grid State changed:: ', gridStateChanges);
  console.log('Grid State changed:: ', gridStateChanges.change);

  if (gridStateChanges.gridState!.rowSelection) {
    selectedGrid2IDs = (gridStateChanges.gridState!.rowSelection.filteredDataContextIds || []) as number[];
    selectedGrid2IDs = selectedGrid2IDs.sort((a, b) => a - b); // sort by ID
    selectedTitles.value = selectedGrid2IDs.map((dataContextId) => `Task ${dataContextId}`).join(',');
    if (selectedTitles.value.length > 293) {
      selectedTitles.value = selectedTitles.value.substring(0, 293) + '...';
    }
  }
}

function onGrid1SelectedRowsChanged(_e: Event, args: any) {
  const grid = args?.grid;
  if (Array.isArray(args.rows)) {
    selectedTitle.value = args.rows.map((idx: number) => {
      const item = grid.getDataItem(idx);
      return (item && item.title) || '';
    });
  }
}

function onGrid2PaginationCheckChanged() {
  // isGrid2WithPagination.value = !isGrid2WithPagination.value;
  showGrid2Pagination(isGrid2WithPagination.value);
}

// Toggle the Pagination of Grid2
// IMPORTANT, the Pagination MUST BE CREATED on initial page load before you can start toggling it
// Basically you cannot toggle a Pagination that doesn't exist (must created at the time as the grid)
function showGrid2Pagination(showPagination: boolean) {
  vueGrid2.paginationService!.togglePaginationVisibility(showPagination);
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
    Example 10: Multiple Grids with Row Selection
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example10.vue"
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
    Row selection, single or multi-select (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/row-selection"
      target="_blank"
      >Wiki docs</a
    >).
    <ul>
      <li>Single Select, you can click on any cell to make the row active</li>
      <li>Multiple Selections, you need to specifically click on the checkbox to make 1 or more selections</li>
      <li>
        NOTE: Any Row Selection(s) will be reset when using Pagination and changing Page (you will need to set it back manually if
        you want it back)
      </li>
    </ul>
  </div>

  <div class="row">
    <div class="col-sm-4" style="max-width: 205px">
      Pagination
      <div class="btn-group" role="group">
        <button class="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-first-page" @click="goToGrid1FirstPage()">
          <i class="mdi mdi-page-first"></i>
        </button>
        <button class="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-last-page" @click="goToGrid1LastPage()">
          <i class="mdi mdi-page-last icon"></i>
        </button>
      </div>
    </div>
    <div class="col-sm-8">
      <div class="alert alert-success">
        <strong>(single select) Selected Row:</strong>
        <span data-test="grid1-selections" v-html="selectedTitle"></span>
      </div>
    </div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions1!"
    v-model:columns="columnDefinitions1 as Column[]"
    v-model:data="dataset1"
    grid-id="grid1"
    @onGridStateChanged="grid1StateChanged($event.detail)"
    @onSelectedRowsChanged="onGrid1SelectedRowsChanged($event.detail.eventData, $event.detail.args)"
    @onVueGridCreated="vueGrid1Ready($event.detail)"
  >
  </slickgrid-vue>

  <hr class="col-md-6 offset-md-1" />

  <div class="row">
    <div class="col-sm-4 col-md-3" style="max-width: 215px">
      <label for="enableGrid2Pagination">
        Pagination:
        <input
          id="enableGrid2Pagination"
          v-model="isGrid2WithPagination"
          type="checkbox"
          :checked="isGrid2WithPagination"
          data-test="toggle-pagination-grid2"
          @change="onGrid2PaginationCheckChanged()"
        />
      </label>
      <span v-if="isGrid2WithPagination" style="margin-left: 5px">
        <div class="btn-group" role="group">
          <button
            class="btn btn-outline-secondary btn-xs btn-icon px-2"
            data-test="goto-first-page"
            @click="goToGrid2FirstPage()"
          >
            <i class="mdi mdi-page-first"></i>
          </button>
          <button class="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-last-page" @click="goToGrid2LastPage()">
            <i class="mdi mdi-page-last icon"></i>
          </button>
        </div>
      </span>
    </div>
    <div class="col-sm-8">
      <div class="alert alert-success">
        <strong>(multi-select) Selected Row(s):</strong>
        <span data-test="grid2-selections" v-html="selectedTitles"></span>
      </div>
    </div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions2!"
    v-model:columns="columnDefinitions2 as Column[]"
    v-model:data="dataset2"
    grid-id="grid2"
    @onGridStateChanged="grid2StateChanged($event.detail)"
    @onVueGridCreated="vueGrid2Ready($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss" scoped>
.alert {
  padding: 8px;
  margin-bottom: 10px;
}
.col-sm-1 {
  max-width: 70px;
}
</style>
