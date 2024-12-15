<script setup lang="ts">
import { format as tempoFormat } from '@formkit/tempo';
import type { OdataOption, OdataServiceApi } from '@slickgrid-universal/odata';
import { GridOdataService } from '@slickgrid-universal/odata';
import {
  type Column,
  FieldType,
  Filters,
  type GridOption,
  type GridStateChange,
  type Metrics,
  OperatorType,
  type Pagination,
  SlickgridVue,
  type SlickgridVueInstance,
} from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

import Data from './data/customers_100.json';

const defaultPageSize = 20;
const CARET_HTML_ESCAPED = '%5E';
const PERCENT_HTML_ESCAPED = '%25';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
const metrics = ref<Metrics>({} as Metrics);
const showSubTitle = ref(true);
const paginationOptions = ref<Pagination>();
const isCountEnabled = ref(true);
const isSelectEnabled = ref(false);
const isExpandEnabled = ref(false);
const odataVersion = ref(2);
const odataQuery = ref('');
const processing = ref(false);
const errorStatus = ref('');
let isPageErrorTest = false;
const status = ref({ text: '', class: '' });
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
        compoundOperatorList: [
          { operator: '', desc: 'Contains' },
          { operator: '<>', desc: 'Not Contains' },
          { operator: '=', desc: 'Equals' },
          { operator: '!=', desc: 'Not equal to' },
          { operator: 'a*', desc: 'Starts With' },
          { operator: 'Custom', desc: 'SQL Like' },
        ],
      },
    },
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
    compoundOperatorAltTexts: {
      // where '=' is any of the `OperatorString` type shown above
      text: { Custom: { operatorAlt: '%%', descAlt: 'SQL Like' } },
    },
    enableCellNavigation: true,
    enableFiltering: true,
    enableCheckboxSelector: true,
    enableRowSelection: true,
    enablePagination: true, // you could optionally disable the Pagination
    pagination: {
      pageSizes: [10, 20, 50, 100, 500, 50000],
      pageSize: defaultPageSize,
      totalItems: 0,
    },
    presets: {
      // you can also type operator as string, e.g.: operator: 'EQ'
      filters: [{ columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal }],
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
        filterQueryOverride: ({ fieldName, columnDef, columnFilterOperator, searchValues }) => {
          if (columnFilterOperator === OperatorType.custom && columnDef?.id === 'name') {
            let matchesSearch = searchValues[0].replace(/\*/g, '.*');
            matchesSearch = matchesSearch.slice(0, 1) + CARET_HTML_ESCAPED + matchesSearch.slice(1);
            matchesSearch = matchesSearch.slice(0, -1) + "$'";

            return `matchesPattern(${fieldName}, ${matchesSearch})`;
          }
          return;
        },
        version: odataVersion.value, // defaults to 2, the query string is slightly different between OData 2 and 4
      },
      onError: (error: Error) => {
        console.log('ERROR', error);
        errorStatus.value = error.message;
        displaySpinner(false, true);
      },
      preProcess: () => {
        errorStatus.value = '';
        displaySpinner(true);
      },
      process: (query) => getCustomerApiCall(query),
      postProcess: (response) => {
        metrics.value = response.metrics;
        displaySpinner(false);
        getCustomerCallback(response);
      },
    } as OdataServiceApi,
  } as GridOption;
}

function displaySpinner(isProcessing: boolean, isError?: boolean) {
  processing.value = isProcessing;
  if (isError) {
    status.value = { text: 'ERROR!!!', class: 'alert alert-danger' };
  } else {
    status.value = isProcessing
      ? { text: 'loading', class: 'alert alert-warning' }
      : { text: 'finished', class: 'alert alert-success' };
  }
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
  paginationOptions.value = { ...gridOptions.value?.pagination, totalItems: totalItemCount } as Pagination;
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
function getCustomerDataApiMock(query: string): Promise<any> {
  // the mock is returning a Promise, just like a WebAPI typically does
  return new Promise((resolve) => {
    const queryParams = query.toLowerCase().split('&');
    let top: number;
    let skip = 0;
    let orderBy = '';
    let countTotalItems = 100;
    const columnFilters = {};

    if (isPageErrorTest) {
      isPageErrorTest = false;
      throw new Error('Server timed out trying to retrieve data for the last page');
    }

    for (const param of queryParams) {
      if (param.includes('$top=')) {
        top = +param.substring('$top='.length);
        if (top === 50000) {
          throw new Error('Server timed out retrieving 50,000 rows');
        }
      }
      if (param.includes('$skip=')) {
        skip = +param.substring('$skip='.length);
      }
      if (param.includes('$orderby=')) {
        orderBy = param.substring('$orderby='.length);
      }
      if (param.includes('$filter=')) {
        const filterBy = param.substring('$filter='.length).replace('%20', ' ');
        if (filterBy.includes('matchespattern')) {
          const regex = new RegExp(`matchespattern\\(([a-zA-Z]+),\\s'${CARET_HTML_ESCAPED}(.*?)'\\)`, 'i');
          const filterMatch = filterBy.match(regex) || [];
          const fieldName = filterMatch[1].trim();
          (columnFilters as any)[fieldName] = { type: 'matchespattern', term: '^' + filterMatch[2].trim() };
        }
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
        for (const operator of ['eq', 'ne', 'le', 'lt', 'gt', 'ge']) {
          if (filterBy.includes(operator)) {
            const re = new RegExp(`([a-zA-Z ]*) ${operator} '(.*?)'`);
            const filterMatch = re.exec(filterBy);
            if (Array.isArray(filterMatch)) {
              const fieldName = filterMatch[1].trim();
              (columnFilters as any)[fieldName] = { type: operator, term: filterMatch[2].trim() };
            }
          }
        }
        if (filterBy.includes('startswith') && filterBy.includes('endswith')) {
          const filterStartMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/) || [];
          const filterEndMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/) || [];
          const fieldName = filterStartMatch[1].trim();
          (columnFilters as any)[fieldName] = {
            type: 'starts+ends',
            term: [filterStartMatch[2].trim(), filterEndMatch[2].trim()],
          };
        } else if (filterBy.includes('startswith')) {
          const filterMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/);
          const fieldName = filterMatch![1].trim();
          (columnFilters as any)[fieldName] = { type: 'starts', term: filterMatch![2].trim() };
        } else if (filterBy.includes('endswith')) {
          const filterMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/);
          const fieldName = filterMatch![1].trim();
          (columnFilters as any)[fieldName] = { type: 'ends', term: filterMatch![2].trim() };
        }

        // simulate a backend error when trying to sort on the "Company" field
        if (filterBy.includes('company')) {
          throw new Error('Server could not filter using the field "Company"');
        }
      }
    }

    // simulate a backend error when trying to sort on the "Company" field
    if (orderBy.includes('company')) {
      throw new Error('Server could not sort using the field "Company"');
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
            if (columnId?.indexOf(' ') !== -1) {
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
              const [term1, term2] = Array.isArray(searchTerm) ? searchTerm : [searchTerm];

              switch (filterType) {
                case 'eq':
                  return filterTerm.toLowerCase() === term1;
                case 'ne':
                  return filterTerm.toLowerCase() !== term1;
                case 'le':
                  return filterTerm.toLowerCase() <= term1;
                case 'lt':
                  return filterTerm.toLowerCase() < term1;
                case 'gt':
                  return filterTerm.toLowerCase() > term1;
                case 'ge':
                  return filterTerm.toLowerCase() >= term1;
                case 'ends':
                  return filterTerm.toLowerCase().endsWith(term1);
                case 'starts':
                  return filterTerm.toLowerCase().startsWith(term1);
                case 'starts+ends':
                  return filterTerm.toLowerCase().startsWith(term1) && filterTerm.toLowerCase().endsWith(term2);
                case 'substring':
                  return filterTerm.toLowerCase().includes(term1);
                case 'matchespattern':
                  return new RegExp((term1 as string).replace(new RegExp(PERCENT_HTML_ESCAPED, 'g'), '.*'), 'i').test(filterTerm);
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

      // console.log('Backend Result', backendResult);
      resolve(backendResult);
    }, 150);
  });
}

function goToFirstPage() {
  vueGrid.paginationService!.goToFirstPage();
}

function goToLastPage() {
  vueGrid.paginationService!.goToLastPage();
}

/** Dispatched event of a Grid State Changed event */
function gridStateChanged(gridStateChanges: GridStateChange) {
  // console.log('Client sample, Grid State changed:: ', gridStateChanges);
  console.log('Client sample, Grid State changed:: ', gridStateChanges.change);
}

function setFiltersDynamically() {
  // we can Set Filters Dynamically (or different filters) afterward through the FilterService
  vueGrid.filterService.updateFilters([
    // { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
    { columnId: 'name', searchTerms: ['A'], operator: 'a*' },
  ]);
}

function setSortingDynamically() {
  vueGrid.sortService.updateSorting([{ columnId: 'name', direction: 'DESC' }]);
}

function showMetrics() {
  return `${metrics.value.endTime ? tempoFormat(metrics.value.endTime, 'YYYY-MM-DD HH:mm:ss', 'en-US') : ''}
    | ${metrics.value.itemCount} of ${metrics.value.totalItemCount} items`;
}

function throwPageChangeError() {
  isPageErrorTest = true;
  vueGrid?.paginationService?.goToLastPage();
}

// YOU CAN CHOOSE TO PREVENT EVENT FROM BUBBLING IN THE FOLLOWING 3x EVENTS
// note however that internally the cancelling the search is more of a rollback
function handleOnBeforeSort(/* e: Event */) {
  // e.preventDefault();
  // return false;
  return true;
}

function handleOnBeforeSearchChange(/* e: Event */) {
  // e.preventDefault();
  // return false;
  return true;
}

function handleOnBeforePaginationChange(/* e: Event */) {
  // e.preventDefault();
  // return false;
  return true;
}

// THE FOLLOWING METHODS ARE ONLY FOR DEMO PURPOSES DO NOT USE THIS CODE
// ---

function changeCountEnableFlag() {
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
  odataVersion.value = version;
  resetOptions({ version: odataVersion.value });
  return true;
}

function resetOptions(options: Partial<OdataOption>) {
  displaySpinner(true);
  const odataService = gridOptions.value?.backendServiceApi!.service as GridOdataService;
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
    Example 5: Grid with Backend OData Service
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example05.vue"
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
    Use it when you need to support Pagination with a OData endpoint (for simple JSON, use a regular grid)<br />
    Take a look at the (<a href="https://ghiscoding.gitbook.io/slickgrid-vue/backend-services/odata" target="_blank"
      >Wiki documentation</a
    >)
    <br />
    <ul class="small">
      <li>
        Only "Name" field is sortable for the demo (because we use JSON files), however "multiColumnSort: true" is also supported
      </li>
      <li>This example also demos the Grid State feature, open the console log to see the changes</li>
      <li>
        String column also support operator (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *)
        <ul>
          <li>The (*) can be used as startsWith (ex.: "abc*" => startsWith "abc") / endsWith (ex.: "*xyz" => endsWith "xyz")</li>
          <li>The other operators can be used on column type number for example: ">=100" (greater than or equal to 100)</li>
        </ul>
      </li>

      <li>OData Service could be replaced by other Service type in the future (GraphQL or whichever you provide)</li>
      <li>
        You can also preload a grid with certain "presets" like Filters / Sorters / Pagination
        <a href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/grid-state-preset" target="_blank"
          >Wiki - Grid Preset</a
        >
      </li>
      <li>
        <span class="text-danger">NOTE:</span> For demo purposes, the last column (filter & sort) will always throw an error and
        its only purpose is to demo what would happen when you encounter a backend server error (the UI should rollback to
        previous state before you did the action). Also changing Page Size to 50,000 will also throw which again is for demo
        purposes.
      </li>
    </ul>
  </div>

  <div class="row">
    <div class="col-sm-9"></div>
    <div v-if="errorStatus" class="col-sm-3">
      <div class="alert alert-danger" data-test="error-status">
        <em
          ><strong>Backend Error:</strong> <span>{{ errorStatus }}</span></em
        >
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-sm-2">
      <div :class="status.class" role="alert" data-test="status">
        <strong>Status: </strong> {{ status.text }} <span v-if="processing"> <i class="mdi mdi-sync mdi-spin"></i> </span>
      </div>
    </div>
    <div class="col-sm-10">
      <div class="alert alert-info" data-test="alert-odata-query">
        <strong>OData Query:</strong> <span data-test="odata-query-result">{{ odataQuery }}</span>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-sm-4">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-filter" @click="setFiltersDynamically()">
        Set Filters Dynamically
      </button>
      <button
        class="btn btn-outline-secondary btn-sm btn-icon mx-1"
        data-test="set-dynamic-sorting"
        @click="setSortingDynamically()"
      >
        Set Sorting Dynamically
      </button>
      <br />
      <span v-if="metrics">
        <b>Metrics:</b>
        {{ showMetrics() }}
      </span>
    </div>
    <div class="col-sm-8">
      <label>OData Version:&nbsp;</label>
      <span data-test="radioVersion">
        <label class="radio-inline control-label" htmlFor="radio2">
          <input
            id="radio2"
            type="radio"
            name="inlineRadioOptions"
            data-test="version2"
            defaultChecked="{true}"
            value="2"
            @change="setOdataVersion(2)"
          />
          2&nbsp;
        </label>
        <label class="radio-inline control-label" htmlFor="radio4">
          <input id="radio4" type="radio" name="inlineRadioOptions" data-test="version4" value="4" @change="setOdataVersion(4)" />
          4
        </label>
      </span>
      <label class="checkbox-inline control-label" htmlFor="enableCount" style="margin-left: 20px">
        <input
          id="enableCount"
          type="checkbox"
          data-test="enable-count"
          :checked="isCountEnabled"
          @click="changeCountEnableFlag()"
        />
        <span style="font-weight: bold"> Enable Count</span> (add to OData query)
      </label>
      <label class="checkbox-inline control-label" htmlFor="enableSelect" style="margin-left: 20px">
        <input
          id="enableSelect"
          type="checkbox"
          data-test="enable-select"
          :checked="isSelectEnabled"
          @click="changeEnableSelectFlag()"
        />
        <span style="font-weight: bold"> Enable Select</span> (add to OData query)
      </label>
      <label class="checkbox-inline control-label" htmlFor="enableExpand" style="margin-left: 20px">
        <input
          id="enableExpand"
          type="checkbox"
          data-test="enable-expand"
          :checked="isExpandEnabled"
          @click="changeEnableExpandFlag()"
        />
        <span style="font-weight: bold"> Enable Expand</span> (add to OData query)
      </label>
    </div>
  </div>
  <div class="row mt-2 mb-1">
    <div class="col-md-12">
      <button class="btn btn-outline-danger btn-sm" data-test="throw-page-error-btn" @click="throwPageChangeError()">
        <span>Throw Error Going to Last Page... </span>
        <i class="mdi mdi-page-last"></i>
      </button>

      <span class="ms-2">
        <label>Programmatically go to first/last page:</label>
        <div class="btn-group ms-1" role="group">
          <button class="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-first-page" @click="goToFirstPage()">
            <i class="mdi mdi-page-first"></i>
          </button>
          <button class="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-last-page" @click="goToLastPage()">
            <i class="mdi mdi-page-last"></i>
          </button>
        </div>
      </span>
    </div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions as Column[]"
    v-model:data="dataset"
    v-model:pagination="paginationOptions"
    grid-id="grid5"
    @onGridStateChanged="gridStateChanged($event.detail)"
    @onBeforeSort="handleOnBeforeSort()"
    @onBeforeSearchChange="handleOnBeforeSearchChange()"
    @onBeforePaginationChange="handleOnBeforePaginationChange()"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
