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
    </h2>
    <div class="subtitle">
      <ul class="small">
        <li><span class="red">(*) NO DATA SHOWN</span> - just change Filters/Sorting/Pages and look at the "SQL Query" changing.</li>
        <li>This example uses the SQL Backend Service.</li>
        <li>You can also preload a grid with certain "presets" like Filters / Sorters / Pagination.</li>
        <li>String column also supports operators (>, >=, <, <=, <>, !=, =, ==, *).</li>
        <li>The (*) can be used as startsWith (ex.: "abc*" => startsWith "abc") / endsWith (ex.: "*xyz" => endsWith "xyz").</li>
        <li>The other operators can be used on column type number for example: ">=100" (bigger or equal than 100).</li>
      </ul>
    </div>
    <div class="row">
      <div class="col-sm-5">
        <div :class="statusClass" role="alert" data-test="status">
          <strong>Status: </strong> {{ status }}
          <span v-if="processing">
            <i class="mdi mdi-sync mdi-spin-1s"></i>
          </span>
        </div>
        <div class="row">
          <div class="col-md-12">
            <button class="btn btn-outline-secondary btn-sm me-1" data-test="clear-filters-sorting" @click="clearAllFiltersAndSorts">
              Clear all Filter & Sorts
            </button>
          </div>
        </div>
        <div class="row mt-2">
          <div class="col-md-12">
            <label for="serverdelay" class="me-2">Server Delay: </label>
            <input
              id="serverdelay"
              type="number"
              data-test="server-delay"
              class="form-control form-control-sm d-inline-block w-auto"
              v-model="serverWaitDelay"
              title="input a fake timer delay to simulate slow server response"
            />
          </div>
        </div>
        <div class="row mt-2">
          <div class="col-md-12">
            <div class="alert alert-info" data-test="alert-sql-query">
              <strong>SQL Query:</strong>
              <span data-test="sql-query-result">{{ sqlQuery }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col">
        <SlickGrid gridId="grid52" :columns="columns" :options="gridOptions" :dataset="dataset" @onGridStateChanged="updateSqlQuery" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Filters, Formatters, type Column, type GridOption } from '@slickgrid-universal/common';
import { SqlService } from '@slickgrid-universal/sql-backend';
import { ref } from 'vue';
import SlickGrid from './SlickGrid.vue';

const defaultPageSize = 20;
const SQL_TABLE_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

const columns = ref<Column[]>([
  { id: 'name', field: 'name', name: 'Name', width: 60, sortable: true, filterable: true, filter: { model: Filters.compoundInput } },
  {
    id: 'gender',
    field: 'gender',
    name: 'Gender',
    width: 60,
    sortable: true,
    filterable: true,
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
        { value: '', label: '' },
        { value: 'acme', label: 'Acme' },
        { value: 'xyz', label: 'Company XYZ' },
      ],
    },
  },
  {
    id: 'finish',
    field: 'finish',
    name: 'Finish',
    width: 80,
    sortable: true,
    filterable: true,
    filter: { model: Filters.compoundDate },
    formatter: Formatters.dateIso,
  },
  {
    id: 'billingAddressZip',
    field: 'billingAddressZip',
    name: 'Billing Address Zip',
    width: 80,
    sortable: true,
    filterable: true,
    filter: { model: Filters.input },
  },
]);

const gridOptions = ref<GridOption>({
  enableFiltering: true,
  enableSorting: true,
  enablePagination: true,
  backendServiceApi: {
    service: new SqlService(),
    options: { tableName: SQL_TABLE_NAME },
    preProcess: () => {
      processing.value = true;
      status.value = 'processing...';
      statusClass.value = 'is-warning';
    },
    postProcess: () => {
      processing.value = false;
      status.value = 'finished';
      statusClass.value = 'is-success';
      updateSqlQuery();
    },
    process: () => new Promise((resolve) => setTimeout(() => resolve([]), serverWaitDelay.value)),
  },
  pagination: { pageSizes: [10, 20, 30, 50, 100], pageSize: defaultPageSize },
});

const dataset = ref<any[]>([]);
const sqlQuery = ref('');
const processing = ref(true);
const status = ref('processing...');
const statusClass = ref('is-warning');
const serverWaitDelay = ref(FAKE_SERVER_DELAY);

function updateSqlQuery() {
  const service = gridOptions.value.backendServiceApi?.service;
  if (service) sqlQuery.value = service.buildQuery();
}

function clearAllFiltersAndSorts() {
  // implement as needed
}
</script>
