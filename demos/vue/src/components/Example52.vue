<script setup lang="ts">
import { format as tempoFormat } from '@formkit/tempo';
import { SqlService, type SqlResult, type SqlServiceApi } from '@slickgrid-universal/sql';
import { Filters, Formatters, SlickgridVue, type Column, type GridOption } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const defaultPageSize = 20;
const SQL_TABLE_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

const gridOptions = ref<GridOption>();
const columns: Ref<Column<ReportItem>[]> = ref([]);
const dataset = ref<any[]>([]);
const metrics = ref<Metrics>({} as Metrics);
const showSubTitle = ref(true);
const sqlQuery = ref('');
const processing = ref(false);
const status = ref('processing...');
const statusClass = ref('is-warning');
const serverWaitDelay = ref(FAKE_SERVER_DELAY); // server simulation with default of 250ms but 50ms for Cypress tests
let vueGrid!: SlickgridVueInstance;
const sqlService = ref(new SqlService());

onBeforeMount(() => {
  defineGrid();
});

/* Define grid Options and Columns */
function defineGrid() {
  columns.value = [
    {
      id: 'name',
      field: 'name',
      name: 'Name',
      width: 60,
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.compoundInput,
      },
    },
    {
      id: 'gender',
      field: 'gender',
      name: 'Gender',
      filterable: true,
      sortable: true,
      width: 60,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
      },
    },
    {
      id: 'company',
      field: 'company',
      name: 'Company',
      width: 60,
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.multipleSelect,
        collection: [
          { value: 'acme', label: 'Acme' },
          { value: 'abc', label: 'Company ABC' },
          { value: 'xyz', label: 'Company XYZ' },
        ],
      },
    },
    {
      id: 'billingAddressStreet',
      field: 'billingAddressStreet',
      name: 'Billing Street',
      formatter: Formatters.complexObject,
      width: 60,
      filterable: true,
      sortable: true,
    },
    {
      id: 'billingAddressZip',
      field: 'billingAddressZip',
      name: 'Billing Zip',
      width: 60,
      type: 'number',
      filterable: true,
      sortable: true,
      filter: {
        model: Filters.compoundInput,
      },
      formatter: Formatters.multiple,
      params: { formatters: [Formatters.complexObject] },
    },
    {
      id: 'finish',
      field: 'finish',
      name: 'Date',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 90,
      width: 120,
      exportWithFormatter: true,
      type: 'date',
      filterable: true,
      filter: {
        model: Filters.dateRange,
      },
    },
  ];

  gridOptions.value = {
    gridHeight: 200,
    gridWidth: 900,
    enableFiltering: true,
    enableCellNavigation: true,
    gridMenu: {
      resizeOnShowHeaderRow: true,
    },
    enablePagination: true,
    pagination: {
      pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100],
      pageSize: defaultPageSize,
      totalItems: 100, // ensure pagination is enabled initially
    },
    presets: {
      columns: [
        { columnId: 'name', width: 100 },
        { columnId: 'gender', width: 55 },
        { columnId: 'company' },
        { columnId: 'billingAddressZip' },
        { columnId: 'billingAddressStreet', width: 120 },
        { columnId: 'finish', width: 130 },
      ],
      filters: [
        { columnId: 'gender', searchTerms: ['male'], operator: 'EQ' },
        { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
        { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },
        { columnId: 'finish', searchTerms: ['2026-01-01', '2026-02-15'], operator: 'RangeInclusive' },
      ],
      sorters: [
        { columnId: 'name', direction: 'asc' },
        { columnId: 'company', direction: 'DESC' },
      ],
      pagination: { pageNumber: 2, pageSize: 20 },
    },
    backendServiceApi: {
      service: sqlService.value,
      options: {
        tableName: SQL_TABLE_NAME,
      },
      preProcess: () => displaySpinner(true),
      process: (query) => getCustomerApiCall(query),
      postProcess: (result) => {
        metrics.value = result.metrics as Metrics;
        dataset.value = result.data;
        // update pagination totalItems to reflect backend total count
        if (gridOptions.value.pagination) {
          gridOptions.value.pagination.totalItems = result.metrics?.totalItemCount ?? 0;
        }
        if (vueGrid) {
          vueGrid.slickGrid?.invalidate();
        }
        displaySpinner(false);
        updateSqlQuery();
      },
    } satisfies SqlServiceApi<{
      id: number;
      name: string;
      gender: string;
      company: string;
      billingAddressZip: string;
      finish: string;
      totalCount: number;
    }>,
  };
}

function displaySpinner(isProcessing: boolean, isError?: boolean) {
  processing.value = isProcessing;
  if (isError) {
    status.value = { text: 'ERROR!!!', class: 'alert alert-danger' };
  } else {
    status.value = isProcessing
      ? { text: 'processing...', class: 'alert alert-warning' }
      : { text: 'finished', class: 'alert alert-success' };
  }
}

function getCustomerApiCall(
  _query: string
): Promise<
  SqlResult<{ id: number; name: string; gender: string; company: string; billingAddressZip: string; finish: string; totalCount: number }>
> {
  // Simulate a backend call with no matching data, but totalCount for pagination
  const totalCount = 100;
  const now = new Date();
  const mockedResult = {
    data: [],
    metrics: {
      startTime: now,
      endTime: now,
      executionTime: 0,
      itemCount: 0,
      totalItemCount: totalCount,
    },
  };
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockedResult);
    }, serverWaitDelay.value);
  });
}

function goToFirstPage() {
  vueGrid.paginationService!.goToFirstPage();
}

function goToLastPage() {
  vueGrid.paginationService!.goToLastPage();
}

function clearAllFiltersAndSorts() {
  if (vueGrid?.gridService) {
    vueGrid.gridService.clearAllFiltersAndSorts();
  }
}

function setFiltersDynamically() {
  const currentYear = new Date().getFullYear();
  const presetLowestDay = `${currentYear}-01-01`;
  const presetHighestDay = `${currentYear}-02-15`;

  // we can Set Filters Dynamically (or different filters) afterward through the FilterService
  vueGrid.filterService.updateFilters([
    { columnId: 'gender', searchTerms: ['female'], operator: '=' },
    { columnId: 'name', searchTerms: ['Jane'], operator: 'StartsWith' },
    { columnId: 'company', searchTerms: ['acme'], operator: 'IN' },
    { columnId: 'billingAddressZip', searchTerms: ['11'], operator: '>=' },
    { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
  ]);
}

function setSortingDynamically() {
  vueGrid.sortService.updateSorting([
    // orders matter, whichever is first in array will be the first sorted column
    { columnId: 'billingAddressZip', direction: 'DESC' },
    { columnId: 'company', direction: 'ASC' },
  ]);
}

function resetToOriginalPresets() {
  const currentYear = new Date().getFullYear();
  const presetLowestDay = `${currentYear}-01-01`;
  const presetHighestDay = `${currentYear}-02-15`;

  vueGrid.filterService.updateFilters([
    // you can use OperatorType or type them as string, e.g.: operator: 'EQ'
    { columnId: 'gender', searchTerms: ['male'], operator: '=' },
    // { columnId: 'name', searchTerms: ['John Doe'], operator:  'Contains' },
    { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
    { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },

    // use a date range with 2 searchTerms values
    { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
  ]);
  vueGrid.sortService.updateSorting([
    // direction can written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
    { columnId: 'name', direction: 'asc' },
    { columnId: 'company', direction: 'DESC' },
  ]);
  setTimeout(() => {
    vueGrid.paginationService?.changeItemPerPage(20);
    vueGrid.paginationService?.goToPageNumber(2);
  });
}

function updateSqlQuery() {
  if (sqlService.value) {
    sqlQuery.value = sqlService.value.buildQuery();
  }
}

function showMetrics() {
  return `${metrics.value.endTime ? tempoFormat(metrics.value.endTime, 'YYYY-MM-DD HH:mm:ss', 'en-US') : ''}
    | ${metrics.value.itemCount} of ${metrics.value.totalItemCount} items`;
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
  <div class="container-fluid">
    <h2>
      Example 52: Grid with SQL Backend Service
      <span class="float-end">
        <a
          style="font-size: 18px"
          target="_blank"
          href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example52.vue"
        >
          <span class="mdi mdi-link-variant"></span> code
        </a>
      </span>
      <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
        <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
      </button>
    </h2>

    <div class="subtitle">
      <ul class="small">
        <li><span class="red">(*) NO DATA SHOWN</span> - just change Filters/Sorting/Pages and look at the "SQL Query" changing.</li>
        <li>This example uses the SQL Backend Service.</li>
        <li>You can also preload a grid with certain "presets" like Filters / Sorters / Pagination.</li>
      </ul>
    </div>

    <div class="row">
      <div class="col-sm-2">
        <div :class="status.class" role="alert" data-test="status">
          <strong>Status: </strong> {{ status.text }} <span v-if="processing"> <i class="mdi mdi-sync mdi-spin"></i> </span>
        </div>
      </div>
      <div class="col-sm-10">
        <div class="alert alert-info" data-test="alert-sql-query">
          <strong>SQL Query:</strong> <span data-test="sql-query-result">{{ sqlQuery }}</span>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <button
          class="btn btn-outline-secondary btn-sm btn-icon"
          data-test="clear-filters-sorting"
          title="Clear all Filters & Sorts"
          @click="clearAllFiltersAndSorts()"
        >
          <i class="mdi mdi-filter-remove-outline"></i>
          Clear all Filter & Sorts
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-dynamic-filter" @click="setFiltersDynamically()">
          Set Filters Dynamically
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" @click="setSortingDynamically()">
          Set Sorting Dynamically
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="reset-presets" @click="resetToOriginalPresets()">
          Reset Original Presets
        </button>
        <label for="serverdelay" class="ml-4">Server Delay: </label>
        <input
          id="serverdelay"
          v-model="serverWaitDelay"
          type="number"
          data-test="server-delay"
          style="width: 55px"
          title="input a fake timer delay to simulate slow server response"
        />
      </div>
    </div>

    <div class="row my-2">
      <div class="col-12">
        <span v-if="metrics">
          <b>Metrics:</b>
          {{ showMetrics() }}
        </span>
        <span class="mx-1"> — </span>
        <label>Programmatically go to first/last page:</label>
        <div class="btn-group ms-1" role="group">
          <button class="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-first-page" @click="goToFirstPage()">
            <i class="mdi mdi-page-first"></i>
          </button>
          <button class="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-last-page" @click="goToLastPage()">
            <i class="mdi mdi-page-last icon"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="col mt-4">
      <slickgrid-vue
        gridId="grid52"
        :columns="columns"
        :options="gridOptions"
        :dataset="dataset"
        @onGridStateChanged="updateSqlQuery"
        @onVueGridCreated="vueGridReady($event.detail)"
      ></slickgrid-vue>
    </div>
  </div>
</template>
