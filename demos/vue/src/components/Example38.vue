<script setup lang="ts">
import { format as dateFormatter } from '@formkit/tempo';
import { GridOdataService, type OdataServiceApi } from '@slickgrid-universal/odata';
import {
  Aggregators,
  Filters,
  SlickgridVue,
  SortComparers,
  type Column,
  type GridOption,
  type Grouping,
  type Metrics,
  type OnRowCountChangedEventArgs,
  type SlickgridVueInstance,
} from 'slickgrid-vue';
import { computed, onBeforeMount, ref, type Ref } from 'vue';
import Data from './data/customers_100.json';

const CARET_HTML_ESCAPED = '%5E';
const PERCENT_HTML_ESCAPED = '%25';
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const isPageErrorTest = ref(false);
const metrics = ref<Partial<Metrics>>({});
const tagDataClass = ref('');
const odataQuery = ref('');
const processing = ref(false);
const errorStatus = ref('');
const errorStatusClass = ref('hidden');
const status = ref({ text: 'processing...', class: 'alert alert-danger' });
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;
const backendService = new GridOdataService();

const getMetricsEndTime = computed(() => (metrics.value?.endTime ? dateFormatter(metrics.value.endTime, 'DD MMM, h:mm:ss a') : ''));

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
      filterable: true,
      filter: { model: Filters.compoundInput },
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
    {
      id: 'category_name',
      name: 'Category',
      field: 'category/name',
      filterable: true,
      sortable: true,
      formatter: (_row, _cell, _val, _colDef, dataContext) => dataContext['category']?.['name'] || '',
    },
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
    enableCellNavigation: true,
    enableFiltering: true,
    enableCheckboxSelector: true,
    enableRowSelection: true,
    enableGrouping: true,
    headerMenu: {
      hideFreezeColumnsCommand: false,
    },
    presets: {
      // NOTE: pagination preset is NOT supported with infinite scroll
      // filters: [{ columnId: 'gender', searchTerms: ['female'] }]
    },
    backendServiceApi: {
      service: backendService,
      options: {
        // enable infinite via Boolean OR via { fetchSize: number }
        infiniteScroll: { fetchSize: 30 }, // or use true, in that case it would use default size of 25
        enableCount: true,
        version: 4,
      },
      onError: (error: Error) => {
        errorStatus.value = error.message;
        errorStatusClass.value = 'visible notification is-light is-danger is-small is-narrow';
        displaySpinner(false, true);
      },
      preProcess: () => {
        errorStatus.value = '';
        errorStatusClass.value = 'hidden';
        displaySpinner(true);
      },
      process: (query) => getCustomerApiCall(query),
      postProcess: (response) => {
        metrics.value = response.metrics;
        displaySpinner(false);
        getCustomerCallback(response);
      },
      // we could use local in-memory Filtering (please note that it only filters against what is currently loaded)
      // that is when we want to avoid reloading the entire dataset every time
      // useLocalFiltering: true,
    } as OdataServiceApi,
  };
}

function displaySpinner(isProcessing: boolean, isError?: boolean) {
  processing.value = isProcessing;
  if (isError) {
    status.value = { text: 'ERROR!!!', class: 'alert alert-danger' };
  } else {
    status.value = isProcessing ? { text: 'loading', class: 'alert alert-warning' } : { text: 'finished', class: 'alert alert-success' };
  }
}

function getCustomerCallback(data: {
  '@odata.count': number;
  infiniteScrollBottomHit: boolean;
  metrics: Metrics;
  query: string;
  value: any[];
}) {
  // totalItems property needs to be filled for pagination to work correctly
  // however we need to force a dirty check, doing a clone object will do just that
  const totalItemCount: number = data['@odata.count'];
  metrics.value.totalItemCount = totalItemCount;

  // even if we're not showing pagination, it is still used behind the scene to fetch next set of data (next page basically)
  // once pagination totalItems is filled, we can update the dataset

  // infinite scroll has an extra data property to determine if we hit an infinite scroll and there's still more data (in that case we need append data)
  // or if we're on first data fetching (no scroll bottom ever occured yet)
  if (!data.infiniteScrollBottomHit) {
    // initial load not scroll hit yet, full dataset assignment
    vueGrid.slickGrid?.scrollTo(0); // scroll back to top to avoid unwanted onScroll end triggered
    dataset.value = data.value;
    metrics.value.itemCount = data.value.length;
  } else {
    // scroll hit, for better perf we can simply use the DataView directly for better perf (which is better compare to replacing the entire dataset)
    vueGrid.dataView?.addItems(data.value);
  }

  odataQuery.value = data['query'];

  // NOTE: you can get currently loaded item count via the `onRowCountChanged`slick event, see `refreshMetrics()` below
  // OR you could also calculate it yourself or get it via: `this.sgb.dataView.getItemCount() === totalItemCount`
  // console.log('is data fully loaded: ', this.sgb.dataView?.getItemCount() === totalItemCount);
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

    if (isPageErrorTest.value) {
      isPageErrorTest.value = false;
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

    /// read the JSON and create a fresh copy of the data that we are free to modify
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

    setTimeout(() => {
      const backendResult: any = { query };
      backendResult['value'] = updatedData;
      backendResult['@odata.count'] = countTotalItems;

      resolve(backendResult);
    }, 150);
  });
}
function groupByGender() {
  vueGrid?.dataView?.setGrouping({
    getter: 'gender',
    formatter: (g) => `Gender: ${g.value} <span class="text-green">(${g.count} items)</span>`,
    comparer: (a, b) => SortComparers.string(a.value, b.value),
    aggregators: [new Aggregators.Sum('gemder')],
    aggregateCollapsed: false,
    lazyTotalsCalculation: true,
  } as Grouping);

  // you need to manually add the sort icon(s) in UI
  vueGrid?.slickGrid.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
  vueGrid?.slickGrid.invalidate(); // invalidate all rows and re-render
}

function clearAllFiltersAndSorts() {
  if (vueGrid?.gridService) {
    vueGrid.gridService.clearAllFiltersAndSorts();
  }
}

function setFiltersDynamically() {
  // we can Set Filters Dynamically (or different filters) afterward through the FilterService
  vueGrid?.filterService.updateFilters([{ columnId: 'gender', searchTerms: ['female'] }]);
}

function refreshMetrics(args: OnRowCountChangedEventArgs) {
  if (args?.current >= 0) {
    metrics.value.itemCount = vueGrid.dataView?.getFilteredItemCount() || 0;
    tagDataClass.value = metrics.value.itemCount === metrics.value.totalItemCount ? 'fully-loaded' : 'partial-load';
  }
}

function setSortingDynamically() {
  vueGrid?.sortService.updateSorting([{ columnId: 'name', direction: 'DESC' }]);
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
  <div class="demo38">
    <h2>
      Example 38: OData (v4) Backend Service with Infinite Scroll
      <span class="float-end">
        <a
          style="font-size: 18px"
          target="_blank"
          href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example38.vue"
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
          Infinite scrolling allows the grid to lazy-load rows from the server when reaching the scroll bottom (end) position. In its
          simplest form, the more the user scrolls down, the more rows get loaded. If we reached the end of the dataset and there is no more
          data to load, then we'll assume to have the entire dataset loaded in memory. This contrast with the regular Pagination approach
          which will only hold a single page data at a time.
        </li>
        <li>NOTES</li>
        <ol>
          <li>
            <code>presets.pagination</code> is not supported with Infinite Scroll and will revert to the first page, simply because since we
            keep appending data, we always have to start from index zero (no offset).
          </li>
          <li>
            Pagination is not shown BUT in fact, that is what is being used behind the scene whenever reaching the scroll end (fetching next
            batch).
          </li>
          <li>
            Also note that whenever the user changes the Sort(s)/Filter(s) it will always reset and go back to zero index (first page).
          </li>
        </ol>
      </ul>
    </div>

    <div class="row">
      <div class="col-sm-3">
        <div v-show="errorStatus" class="alert alert-danger" data-test="error-status">
          <em><strong>Backend Error:</strong> <span :innerhtml="errorStatus"></span></em>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-sm-2">
        <div :class="status.class" role="alert" data-test="status">
          <strong>Status: </strong> {{ status.text }}
          <span :hidden="!processing">
            <i class="mdi mdi-sync mdi-spin"></i>
          </span>
        </div>
      </div>
      <div class="col-sm-10">
        <div class="alert alert-info" data-test="alert-odata-query">
          <strong>OData Query:</strong> <span data-test="odata-query-result">{{ odataQuery }}</span>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-sm-12">
        <button
          class="btn btn-outline-secondary btn-sm btn-icon"
          data-test="clear-filters-sorting"
          title="Clear all Filters & Sorts"
          @click="clearAllFiltersAndSorts()"
        >
          <i class="mdi mdi-filter-remove-outline"></i>
          Clear all Filter & Sorts
        </button>
        <button class="btn btn-outline-secondary btn-sm mx-1" data-test="set-dynamic-filter" @click="setFiltersDynamically()">
          Set Filters Dynamically
        </button>
        <button class="btn btn-outline-secondary btn-sm" data-test="set-dynamic-sorting" @click="setSortingDynamically()">
          Set Sorting Dynamically
        </button>
        <button class="btn btn-outline-secondary btn-sm mx-1" data-test="group-by-gender" @click="groupByGender()">Group by Gender</button>

        <div v-show="metrics" class="mt-2" style="margin: 10px 0px">
          <b>Metrics:</b>
          <span>
            <span>{{ getMetricsEndTime }}</span> —
            <span data-test="itemCount">{{ metrics.itemCount }}</span>
            of
            <span data-test="totalItemCount">{{ metrics.totalItemCount }}</span>
            items
          </span>
          <span class="badge rounded-pill text-bg-primary" :class="tagDataClass" data-test="data-loaded-tag">All Data Loaded!!!</span>
        </div>
      </div>
    </div>

    <slickgrid-vue
      v-model:options="gridOptions"
      v-model:columns="columnDefinitions"
      v-model:data="dataset"
      grid-id="grid38"
      @onRowCountChanged="refreshMetrics($event.detail.args)"
      @onVueGridCreated="vueGridReady($event.detail)"
    >
    </slickgrid-vue>
  </div>
</template>
<style lang="scss">
.demo38 {
  .badge {
    display: none;
    &.fully-loaded {
      display: inline-flex;
    }
  }
}
</style>
