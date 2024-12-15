<script setup lang="ts">
import type { OdataOption, OdataServiceApi } from '@slickgrid-universal/odata';
import { GridOdataService } from '@slickgrid-universal/odata';
import { RxJsResource } from '@slickgrid-universal/rxjs-observable';
import { Observable, of, type Subject } from 'rxjs';
import {
  type GridOption,
  type GridStateChange,
  type Metrics,
  type Pagination,
  type SlickgridVueInstance,
  type Column,
  Editors,
  FieldType,
  Filters,
  OperatorType,
  SlickgridVue,
} from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

import Data from './data/customers_100.json';

const defaultPageSize = 20;
const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
const metrics = ref<Metrics>({} as Metrics);
const paginationOptions = ref<Pagination>();
const isCountEnabled = ref(true);
const isSelectEnabled = ref(false);
const isExpandEnabled = ref(false);
const odataVersion = ref(2);
const odataQuery = ref('');
const processing = ref(false);
const status = ref({ text: '', class: '' });
const isOtherGenderAdded = ref(false);
const genderCollection = ref([
  { value: 'male', label: 'male' },
  { value: 'female', label: 'female' },
]);
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'name',
      name: 'Name',
      field: 'name',
      sortable: true,
      type: FieldType.string,
      filterable: true,
      filter: {
        model: Filters.compoundInput,
      },
    },
    {
      id: 'gender',
      name: 'Gender',
      field: 'gender',
      filterable: true,
      editor: {
        model: Editors.singleSelect,
        // collection: genderCollection.value,
        collectionAsync: of(genderCollection.value),
      },
      filter: {
        model: Filters.singleSelect,
        collectionAsync: of(genderCollection.value),
        collectionOptions: {
          addBlankEntry: true,
        },
      },
    },
    { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true },
    { id: 'category_name', name: 'Category', field: 'category/name', filterable: true, sortable: true },
  ];

  gridOptions.value = {
    enableAutoResize: true,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    checkboxSelector: {
      // you can toggle these 2 properties to show the "select all" checkbox in different location
      hideInFilterHeaderRow: false,
      hideInColumnTitleRow: true,
    },
    editable: true,
    autoEdit: true,
    autoCommitEdit: true,
    rowHeight: 33,
    headerRowHeight: 35,
    enableCellNavigation: true,
    enableFiltering: true,
    enableCheckboxSelector: true,
    enableRowSelection: true,
    enablePagination: true, // you could optionally disable the Pagination
    pagination: {
      pageSizes: [10, 20, 50, 100, 500],
      pageSize: defaultPageSize,
    },
    presets: {
      // you can also type operator as string, e.g.: operator: 'EQ'
      filters: [
        // { columnId: 'name', searchTerms: ['w'], operator: OperatorType.startsWith },
        { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
      ],
      sorters: [
        // direction can be written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
        { columnId: 'name', direction: 'asc' },
      ],
      pagination: { pageNumber: 2, pageSize: 20 },
    },
    backendServiceApi: {
      service: new GridOdataService(),
      options: {
        enableCount: isCountEnabled.value, // add the count in the OData query, which will return a property named "__count" (v2) or "@odata.count" (v4)
        enableSelect: isSelectEnabled.value,
        enableExpand: isExpandEnabled.value,
        version: odataVersion.value, // defaults to 2, the query string is slightly different between OData 2 and 4
      },
      preProcess: () => displaySpinner(true),
      process: (query) => getCustomerApiCall(query),
      postProcess: (response) => {
        metrics.value = response.metrics;
        displaySpinner(false);
        getCustomerCallback(response);
      },
    } as OdataServiceApi,
    externalResources: [new RxJsResource()],
  };
}

function addOtherGender() {
  const newGender = { value: 'other', label: 'other' };
  const genderColumn = columnDefinitions.value.find((column) => column.id === 'gender');

  if (genderColumn) {
    let editorCollection = genderColumn.editor!.collection;
    const filterCollectionAsync = genderColumn.filter!.collectionAsync as Subject<any>;

    if (Array.isArray(editorCollection)) {
      // refresh the Editor "collection", we have 2 ways of doing it

      // 1. simply Push to the Editor "collection"
      // editorCollection.push(newGender);

      // 2. or replace the entire "collection"
      genderColumn.editor!.collection = [...genderCollection.value, newGender];
      editorCollection = genderColumn.editor!.collection;

      // However, for the Filter only, we have to trigger an RxJS/Subject change with the new collection
      // we do this because Filter(s) are shown at all time, while on Editor it's unnecessary since they are only shown when opening them
      if (filterCollectionAsync?.next) {
        filterCollectionAsync.next(editorCollection);
        filterCollectionAsync.complete();
      }
    }
  }

  // don't add it more than once
  isOtherGenderAdded.value = true;
}

function displaySpinner(isProcessing: boolean) {
  processing.value = isProcessing;
  status.value = isProcessing
    ? { text: 'loading...', class: 'col-md-2 alert alert-warning' }
    : { text: 'finished!!', class: 'col-md-2 alert alert-success' };
}

function getCustomerCallback(data: any) {
  // totalItems property needs to be filled for pagination to work correctly
  // however we need to force Vue to do a dirty check, doing a clone object will do just that
  let totalItemCount: number = data['totalRecordCount']; // you can use "totalRecordCount" or any name or "odata.count" when "enableCount" is set
  if (isCountEnabled.value) {
    totalItemCount = odataVersion.value === 4 ? data['@odata.count'] : data['d']['__count'];
  }
  if (metrics.value) {
    metrics.value.totalItemCount = totalItemCount;
  }

  // once pagination totalItems is filled, we can update the dataset
  paginationOptions.value = { ...gridOptions.value!.pagination, totalItems: totalItemCount } as Pagination;
  dataset.value = odataVersion.value === 4 ? data.value : data.d.results;
  odataQuery.value = data['query'];
}

function getCustomerApiCall(query: string) {
  // in your case, you will call your WebAPI function (wich needs to return a Promise)
  // for the demo purpose, we will call a mock WebAPI function
  return getCustomerDataApiMock(query);
}

/**
 * This function is only here to mock a WebAPI call (since we are using a JSON file for the demo)
 *  in your case the getCustomer() should be a WebAPI function returning a Promise
 */
function getCustomerDataApiMock(query: string): Observable<any> {
  // the mock is returning an Observable
  return new Observable((observer) => {
    const queryParams = query.toLowerCase().split('&');
    let top: number;
    let skip = 0;
    let orderBy = '';
    let countTotalItems = 100;
    const columnFilters = {};

    for (const param of queryParams) {
      if (param.includes('$top=')) {
        top = +param.substring('$top='.length);
      }
      if (param.includes('$skip=')) {
        skip = +param.substring('$skip='.length);
      }
      if (param.includes('$orderby=')) {
        orderBy = param.substring('$orderby='.length);
      }
      if (param.includes('$filter=')) {
        const filterBy = param.substring('$filter='.length).replace('%20', ' ');
        if (filterBy.includes('contains')) {
          const filterMatch = filterBy.match(/contains\(([a-zA-Z/]+),\s?'(.*?)'/);
          const fieldName = filterMatch![1].trim();
          (columnFilters as any)[fieldName] = { type: 'substring', term: filterMatch![2].trim() };
        }
        if (filterBy.includes('substringof')) {
          const filterMatch = filterBy.match(/substringof\('(.*?)',\s([a-zA-Z/]+)/);
          const fieldName = filterMatch![2].trim();
          (columnFilters as any)[fieldName] = { type: 'substring', term: filterMatch![1].trim() };
        }
        if (filterBy.includes('eq')) {
          const filterMatch = filterBy.match(/([a-zA-Z ]*) eq '(.*?)'/);
          if (Array.isArray(filterMatch)) {
            const fieldName = filterMatch![1].trim();
            (columnFilters as any)[fieldName] = { type: 'equal', term: filterMatch![2].trim() };
          }
        }
        if (filterBy.includes('startswith')) {
          const filterMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/);
          const fieldName = filterMatch![1].trim();
          (columnFilters as any)[fieldName] = { type: 'starts', term: filterMatch![2].trim() };
        }
        if (filterBy.includes('endswith')) {
          const filterMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/);
          const fieldName = filterMatch![1].trim();
          (columnFilters as any)[fieldName] = { type: 'ends', term: filterMatch![2].trim() };
        }
      }
    }

    // read the JSON and create a fresh copy of the data that we are free to modify
    let data = Data as unknown as {
      name: string;
      gender: string;
      company: string;
      id: string;
      category: { id: string; name: string };
    }[];
    data = JSON.parse(JSON.stringify(data));

    // Sort the data
    if (orderBy?.length > 0) {
      const orderByClauses = orderBy.split(',');
      for (const orderByClause of orderByClauses) {
        const orderByParts = orderByClause.split(' ');
        const orderByField = orderByParts[0];

        let selector = (obj: any): string => obj;
        for (const orderByFieldPart of orderByField.split('/')) {
          const prevSelector = selector;
          selector = (obj: any) => {
            return prevSelector(obj)[orderByFieldPart as any];
          };
        }

        const sort = orderByParts[1] ?? 'asc';
        switch (sort.toLocaleLowerCase()) {
          case 'asc':
            data = data.sort((a, b) => selector(a).localeCompare(selector(b)));
            break;
          case 'desc':
            data = data.sort((a, b) => selector(b).localeCompare(selector(a)));
            break;
        }
      }
    }

    // Read the result field from the JSON response.
    let firstRow = skip;
    let filteredData = data;
    if (columnFilters) {
      for (const columnId in columnFilters) {
        if (columnId in columnFilters) {
          filteredData = filteredData.filter((column) => {
            const filterType = (columnFilters as any)[columnId].type;
            const searchTerm = (columnFilters as any)[columnId].term;
            let colId = columnId;
            if (columnId && columnId.indexOf(' ') !== -1) {
              const splitIds = columnId.split(' ');
              colId = splitIds[splitIds.length - 1];
            }

            let filterTerm;
            let col = column;
            for (const part of colId.split('/')) {
              filterTerm = (col as any)[part];
              col = filterTerm;
            }

            if (filterTerm) {
              switch (filterType) {
                case 'equal':
                  return filterTerm.toLowerCase() === searchTerm;
                case 'ends':
                  return filterTerm.toLowerCase().endsWith(searchTerm);
                case 'starts':
                  return filterTerm.toLowerCase().startsWith(searchTerm);
                case 'substring':
                  return filterTerm.toLowerCase().includes(searchTerm);
              }
            }
          });
        }
      }
      countTotalItems = filteredData.length;
    }

    // make sure page skip is not out of boundaries, if so reset to first page & remove skip from query
    if (firstRow > filteredData.length) {
      query = query.replace(`$skip=${firstRow}`, '');
      firstRow = 0;
    }
    const updatedData = filteredData.slice(firstRow, firstRow + top!);

    window.setTimeout(() => {
      const backendResult: any = { query };
      if (!isCountEnabled.value) {
        backendResult['totalRecordCount'] = countTotalItems;
      }

      if (odataVersion.value === 4) {
        backendResult['value'] = updatedData;
        if (isCountEnabled.value) {
          backendResult['@odata.count'] = countTotalItems;
        }
      } else {
        backendResult['d'] = { results: updatedData };
        if (isCountEnabled.value) {
          backendResult['d']['__count'] = countTotalItems;
        }
      }

      observer.next(backendResult);
      observer.complete();
    }, 150);
  });
}

function clearAllFiltersAndSorts() {
  vueGrid?.gridService.clearAllFiltersAndSorts();
}

function goToFirstPage() {
  vueGrid?.paginationService?.goToFirstPage();
}

function goToLastPage() {
  vueGrid?.paginationService?.goToLastPage();
}

/** Dispatched event of a Grid State Changed event */
function gridStateChanged(gridStateChanges: GridStateChange) {
  // console.log('Client sample, Grid State changed:: ', gridStateChanges);
  console.log('Client sample, Grid State changed:: ', gridStateChanges.change);
}

function setFiltersDynamically() {
  // we can Set Filters Dynamically (or different filters) afterward through the FilterService
  vueGrid?.filterService.updateFilters([
    // { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
    { columnId: 'name', searchTerms: ['A'], operator: 'a*' },
  ]);
}

function setSortingDynamically() {
  vueGrid?.sortService.updateSorting([{ columnId: 'name', direction: 'DESC' }]);
}

// THE FOLLOWING METHODS ARE ONLY FOR DEMO PURPOSES DO NOT USE THIS CODE
// ---

function changeCountEnableFlag() {
  displaySpinner(true);
  isCountEnabled.value = !isCountEnabled.value;
  resetOptions({ enableCount: isCountEnabled.value });
  return true;
}

function changeEnableSelectFlag() {
  isSelectEnabled.value = !isSelectEnabled.value;
  resetOptions({ enableSelect: isSelectEnabled.value });
  return true;
}

function changeEnableExpandFlag() {
  isExpandEnabled.value = !isExpandEnabled.value;
  resetOptions({ enableExpand: isExpandEnabled.value });
  return true;
}

function setOdataVersion(version: number) {
  displaySpinner(true);
  odataVersion.value = version;
  resetOptions({ version: odataVersion.value });
  return true;
}

function resetOptions(options: Partial<OdataOption>) {
  displaySpinner(true);
  const odataService = gridOptions.value!.backendServiceApi!.service as GridOdataService;
  odataService.updateOptions(options);
  odataService.clearFilters();
  vueGrid?.filterService.clearFilters();
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
    Example 31: Grid with OData Backend Service using RxJS Observables
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example31.vue"
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
    Optionally use RxJS instead of Promises, you would typically use this with a Backend Service API (OData/GraphQL)
  </div>

  <div class="row">
    <div class="col-md-12" aria-label="Basic Editing Commands">
      <button
        class="btn btn-outline-secondary btn-sm btn-icon"
        data-test="clear-filters-sorting"
        title="Clear all Filters & Sorts"
        @click="clearAllFiltersAndSorts()"
      >
        <span class="mdi mdi-close"></span>
        <span>Clear all Filter & Sorts</span>
      </button>
      <button
        class="btn btn-outline-secondary btn-sm btn-icon mx-1"
        data-test="set-dynamic-filter"
        @click="setFiltersDynamically()"
      >
        Set Filters Dynamically
      </button>
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" @click="setSortingDynamically()">
        Set Sorting Dynamically
      </button>
      <button
        class="btn btn-outline-secondary btn-sm btn-icon mx-1"
        style="margin-left: 10px"
        data-test="add-gender-button"
        :disabled="isOtherGenderAdded"
        @click="addOtherGender()"
      >
        Add Other Gender via RxJS
      </button>
    </div>
  </div>

  <br />

  <div>
    <span>
      <label>Programmatically go to first/last page:</label>
      <div class="btn-group ms-1" role="group">
        <button class="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-first-page" @click="goToFirstPage()">
          <i class="mdi mdi-page-first"></i>
        </button>
        <button class="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-last-page" @click="goToLastPage()">
          <i class="mdi mdi-page-last icon"></i>
        </button>
      </div>
    </span>

    <span style="margin-left: 10px">
      <label>OData Version: </label>
      <span data-test="radioVersion">
        <label class="ms-1 radio-inline control-label" for="radio2">
          <input
            id="radio2"
            type="radio"
            name="inlineRadioOptions"
            data-test="version2"
            checked
            :value="2"
            @click="setOdataVersion(2)"
          />
          2
        </label>
        <label class="ms-1 radio-inline control-label" for="radio4">
          <input id="radio4" type="radio" name="inlineRadioOptions" data-test="version4" :value="4" @click="setOdataVersion(4)" />
          4
        </label>
      </span>
      <label class="checkbox-inline control-label" for="enableCount" style="margin-left: 20px">
        <input
          id="enableCount"
          type="checkbox"
          data-test="enable-count"
          :checked="isCountEnabled"
          @click="changeCountEnableFlag()"
        />
        <span class="ms-1 fw-bold">Enable Count</span> (add to OData query)
      </label>
      <label class="checkbox-inline control-label" for="enableSelect" style="margin-left: 20px">
        <input
          id="enableSelect"
          type="checkbox"
          data-test="enable-select"
          :checked="isSelectEnabled"
          @click="changeEnableSelectFlag()"
        />
        <span class="ms-1 fw-bold">Enable Select</span> (add to OData query)
      </label>
      <label class="checkbox-inline control-label" for="enableExpand" style="margin-left: 20px">
        <input
          id="enableExpand"
          type="checkbox"
          data-test="enable-expand"
          :checked="isExpandEnabled"
          @click="changeEnableExpandFlag()"
        />
        <span class="ms-1 fw-bold">Enable Expand</span> (add to OData query)
      </label>
    </span>
  </div>

  <div class="row" style="margin-top: 5px">
    <div class="col-md-10">
      <div class="alert alert-info" data-test="alert-odata-query">
        <strong>OData Query:</strong> <span data-test="odata-query-result">{{ odataQuery }}</span>
      </div>
    </div>
    <div :class="status.class" role="alert" data-test="status"><strong>Status: </strong> {{ status.text }}</div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions as Column[]"
    v-model:pagination="paginationOptions"
    v-model:data="dataset"
    grid-id="grid31"
    @onGridStateChanged="gridStateChanged($event.detail)"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
