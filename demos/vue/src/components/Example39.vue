<script setup lang="ts">
import { format as dateFormatter } from '@formkit/tempo';
import type { GraphqlPaginatedResult, GraphqlServiceApi } from '@slickgrid-universal/graphql';
import { GraphqlService } from '@slickgrid-universal/graphql';
import { useTranslation } from 'i18next-vue';
import {
  Filters,
  SlickgridVue,
  type Column,
  type GridOption,
  type Metrics,
  type MultipleSelectOption,
  type OnRowCountChangedEventArgs,
  type SlickgridVueInstance,
} from 'slickgrid-vue';
import { computed, onBeforeMount, ref, type Ref } from 'vue';
import SAMPLE_COLLECTION_DATA_URL from './data/customers_100.json?url';

const { i18next } = useTranslation();

const GRAPHQL_QUERY_DATASET_NAME = 'users';
const FAKE_SERVER_DELAY = 250;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const metrics = ref<Partial<Metrics>>({});
const tagDataClass = ref('');
const graphqlQuery = ref('...');
const processing = ref(false);
const selectedLanguage = ref('');
const status = ref({ text: 'processing...', class: 'alert alert-danger' });
const showSubTitle = ref(true);
const serverWaitDelay = ref(FAKE_SERVER_DELAY); // server simulation with default of 250ms but 50ms for Cypress tests
let vueGrid!: SlickgridVueInstance;
const backendService = new GraphqlService();

const getMetricsEndTime = computed(() => (metrics.value?.endTime ? dateFormatter(metrics.value.endTime, 'DD MMM, h:mm:ss a') : ''));

onBeforeMount(() => {
  defineGrid();

  const defaultLang = 'en';
  i18next.changeLanguage(defaultLang);
  selectedLanguage.value = defaultLang;
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'name',
      field: 'name',
      nameKey: 'NAME',
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
      nameKey: 'GENDER',
      filterable: true,
      sortable: true,
      width: 60,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: 'male', labelKey: 'MALE' },
          { value: 'female', labelKey: 'FEMALE' },
        ],
      },
    },
    {
      id: 'company',
      field: 'company',
      nameKey: 'COMPANY',
      width: 60,
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.multipleSelect,
        customStructure: {
          label: 'company',
          value: 'company',
        },
        collectionSortBy: {
          property: 'company',
          sortDesc: false,
        },
        collectionAsync: fetch(SAMPLE_COLLECTION_DATA_URL).then((e) => e.json()),
        options: {
          filter: true, // adds a filter on top of the multi-select dropdown
        } as MultipleSelectOption,
      },
    },
  ];

  gridOptions.value = {
    enableAutoResize: true,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableAutoTooltip: true,
    autoTooltipOptions: {
      enableForHeaderCells: true,
    },
    enableTranslate: true,
    i18n: i18next,
    enableFiltering: true,
    enableCellNavigation: true,
    multiColumnSort: false,
    gridMenu: {
      resizeOnShowHeaderRow: true,
    },
    backendServiceApi: {
      // we need to disable default internalPostProcess so that we deal with either replacing full dataset or appending to it
      disableInternalPostProcess: true,
      service: backendService,
      options: {
        datasetName: GRAPHQL_QUERY_DATASET_NAME, // the only REQUIRED property
        addLocaleIntoQuery: true, // optionally add current locale into the query
        extraQueryArguments: [
          {
            // optionally add some extra query arguments as input query arguments
            field: 'userId',
            value: 123,
          },
        ],
        // enable infinite via Boolean OR via { fetchSize: number }
        infiniteScroll: { fetchSize: 30 }, // or use true, in that case it would use default size of 25
      },
      // you can define the onInit callback OR enable the "executeProcessCommandOnInit" flag in the service init
      // onInit: (query) => getCustomerApiCall(query),
      preProcess: () => displaySpinner(true),
      process: (query) => getCustomerApiCall(query),
      postProcess: (result: GraphqlPaginatedResult) => {
        metrics.value = {
          endTime: new Date(),
          totalItemCount: result.data[GRAPHQL_QUERY_DATASET_NAME].totalCount || 0,
        };
        displaySpinner(false);
        getCustomerCallback(result);
      },
    } as GraphqlServiceApi,
  };
}

function clearAllFiltersAndSorts() {
  vueGrid.gridService?.clearAllFiltersAndSorts();
}

function displaySpinner(isProcessing: boolean, isError?: boolean) {
  processing.value = isProcessing;
  if (isError) {
    status.value = { text: 'ERROR!!!', class: 'alert alert-danger' };
  } else {
    status.value = isProcessing ? { text: 'loading', class: 'alert alert-warning' } : { text: 'finished', class: 'alert alert-success' };
  }
}

function unescapeAndLowerCase(val: string) {
  return val.replace(/^"/, '').replace(/"$/, '').toLowerCase();
}

function getCustomerCallback(result: any) {
  const { nodes, totalCount } = result.data[GRAPHQL_QUERY_DATASET_NAME];
  if (vueGrid) {
    metrics.value.totalItemCount = totalCount;

    // even if we're not showing pagination, it is still used behind the scene to fetch next set of data (next page basically)
    // once pagination totalItems is filled, we can update the dataset

    // infinite scroll has an extra data property to determine if we hit an infinite scroll and there's still more data (in that case we need append data)
    // or if we're on first data fetching (no scroll bottom ever occured yet)
    if (!result.infiniteScrollBottomHit) {
      // initial load not scroll hit yet, full dataset assignment
      vueGrid.slickGrid?.scrollTo(0); // scroll back to top to avoid unwanted onScroll end triggered
      dataset.value = nodes;
      metrics.value.itemCount = nodes.length;
    } else {
      // scroll hit, for better perf we can simply use the DataView directly for better perf (which is better compare to replacing the entire dataset)
      vueGrid.dataView?.addItems(nodes);
    }

    // NOTE: you can get currently loaded item count via the `onRowCountChanged`slick event, see `refreshMetrics()` below
    // OR you could also calculate it yourself or get it via: `vueGrid?.dataView.getItemCount() === totalItemCount`
    // console.log('is data fully loaded: ', vueGrid?.dataView?.getItemCount() === totalItemCount);
  }
}

/**
 * Calling your GraphQL backend server should always return a Promise of type GraphqlPaginatedResult
 *
 * @param query
 * @return Promise<GraphqlPaginatedResult>
 */
function getCustomerApiCall(query: string): Promise<GraphqlPaginatedResult> {
  // in your case, you will call your WebAPI function (wich needs to return a Promise)
  // for the demo purpose, we will call a mock WebAPI function
  return getCustomerDataApiMock(query);
}

function getCustomerDataApiMock(query: string): Promise<any> {
  return new Promise<GraphqlPaginatedResult>((resolve) => {
    let firstCount = 0;
    let offset = 0;
    let orderByField = '';
    let orderByDir = '';

    fetch(SAMPLE_COLLECTION_DATA_URL)
      .then((e) => e.json())
      .then((data: any) => {
        let filteredData: Array<{
          id: number;
          name: string;
          gender: string;
          company: string;
          category: { id: number; name: string };
        }> = data;
        if (query.includes('first:')) {
          const topMatch = query.match(/first:([0-9]+),/) || [];
          firstCount = +topMatch[1];
        }
        if (query.includes('offset:')) {
          const offsetMatch = query.match(/offset:([0-9]+),/) || [];
          offset = +offsetMatch[1];
        }
        if (query.includes('orderBy:')) {
          const [_, field, dir] = /orderBy:\[{field:([a-zA-Z/]+),direction:(ASC|DESC)}\]/gi.exec(query) || [];
          orderByField = field || '';
          orderByDir = dir || '';
        }
        if (query.includes('orderBy:')) {
          const [_, field, dir] = /orderBy:\[{field:([a-zA-Z/]+),direction:(ASC|DESC)}\]/gi.exec(query) || [];
          orderByField = field || '';
          orderByDir = dir || '';
        }
        if (query.includes('filterBy:')) {
          const regex = /{field:(\w+),operator:(\w+),value:([0-9a-z',"\s]*)}/gi;

          // loop through all filters
          let matches;
          while ((matches = regex.exec(query)) !== null) {
            const field = matches[1] || '';
            const operator = matches[2] || '';
            const value = matches[3] || '';

            let [term1, term2] = value.split(',');

            if (field && operator && value !== '') {
              filteredData = filteredData.filter((dataContext: any) => {
                const dcVal = dataContext[field];
                // remove any double quotes & lowercase the terms
                term1 = unescapeAndLowerCase(term1);
                term2 = unescapeAndLowerCase(term2 || '');

                switch (operator) {
                  case 'EQ':
                    return dcVal.toLowerCase() === term1;
                  case 'NE':
                    return dcVal.toLowerCase() !== term1;
                  case 'LE':
                    return dcVal.toLowerCase() <= term1;
                  case 'LT':
                    return dcVal.toLowerCase() < term1;
                  case 'GT':
                    return dcVal.toLowerCase() > term1;
                  case 'GE':
                    return dcVal.toLowerCase() >= term1;
                  case 'EndsWith':
                    return dcVal.toLowerCase().endsWith(term1);
                  case 'StartsWith':
                    return dcVal.toLowerCase().startsWith(term1);
                  case 'Starts+Ends':
                    return dcVal.toLowerCase().startsWith(term1) && dcVal.toLowerCase().endsWith(term2);
                  case 'Contains':
                    return dcVal.toLowerCase().includes(term1);
                  case 'Not_Contains':
                    return !dcVal.toLowerCase().includes(term1);
                  case 'IN':
                    const terms = value.toLocaleLowerCase().split(',');
                    for (const term of terms) {
                      if (dcVal.toLocaleLowerCase() === unescapeAndLowerCase(term)) {
                        return true;
                      }
                    }
                    break;
                }
              });
            }
          }
        }

        // make sure page skip is not out of boundaries, if so reset to first page & remove skip from query
        let firstRow = offset;
        if (firstRow > filteredData.length) {
          query = query.replace(`offset:${firstRow}`, '');
          firstRow = 0;
        }

        // sorting when defined
        const selector = (obj: any) => (orderByField ? obj[orderByField] : obj);
        switch (orderByDir.toUpperCase()) {
          case 'ASC':
            filteredData = filteredData.sort((a, b) => selector(a).localeCompare(selector(b)));
            break;
          case 'DESC':
            filteredData = filteredData.sort((a, b) => selector(b).localeCompare(selector(a)));
            break;
        }

        // return data subset (page)
        const updatedData = filteredData.slice(firstRow, firstRow + firstCount);

        // in your case, you will call your WebAPI function (wich needs to return a Promise)
        // for the demo purpose, we will call a mock WebAPI function
        const mockedResult = {
          // the dataset name is the only unknown property
          // will be the same defined in your GraphQL Service init, in our case GRAPHQL_QUERY_DATASET_NAME
          data: {
            [GRAPHQL_QUERY_DATASET_NAME]: {
              nodes: updatedData,
              totalCount: filteredData.length,
            },
          },
        };

        setTimeout(() => {
          graphqlQuery.value = gridOptions.value!.backendServiceApi!.service.buildQuery();
          resolve(mockedResult);
        }, serverWaitDelay.value);
      });
  });
}

function refreshMetrics(args: OnRowCountChangedEventArgs) {
  if (args?.current >= 0) {
    metrics.value.itemCount = vueGrid.dataView?.getFilteredItemCount() || 0;
    tagDataClass.value = metrics.value.itemCount === metrics.value.totalItemCount ? 'fully-loaded' : 'partial-load';
  }
}

async function switchLanguage() {
  const nextLanguage = selectedLanguage.value === 'en' ? 'fr' : 'en';
  await i18next.changeLanguage(nextLanguage);
  selectedLanguage.value = nextLanguage;
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
      Example 39: GraphQL Backend Service with Infinite Scroll
      <span class="float-end">
        <a
          style="font-size: 18px"
          target="_blank"
          href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example39.vue"
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
      <div class="col-sm-5">
        <div :class="status.class" role="alert" data-test="status">
          <strong>Status: </strong> {{ status.text }}
          <span :hidden="!processing">
            <i class="mdi mdi-sync mdi-spin-1s"></i>
          </span>
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
            <label for="serverdelay" class="mx-1">Server Delay: </label>
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
        <div class="row mt-1">
          <div class="col-md-12">
            <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="language-button" @click="switchLanguage()">
              <i class="mdi mdi-translate"></i>
              Switch Language
            </button>
            <strong class="mx-1">Locale:</strong>
            <span style="font-style: italic" data-test="selected-locale"> {{ selectedLanguage + '.json' }} </span>
          </div>
        </div>
        <br />
        <div v-show="metrics" style="margin: 10px 0px">
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

      <div class="col-sm-7">
        <div class="alert alert-info" data-test="alert-graphql-query">
          <strong>GraphQL Query:</strong>
          <div data-test="graphql-query-result">{{ graphqlQuery }}</div>
        </div>
      </div>
    </div>

    <slickgrid-vue
      v-model:options="gridOptions"
      v-model:columns="columnDefinitions"
      v-model:dataset="dataset"
      grid-id="grid38"
      @onRowCountChanged="refreshMetrics($event.detail.args)"
      @onVueGridCreated="vueGridReady($event.detail)"
    >
    </slickgrid-vue>
  </div>
</template>
<style lang="scss">
.demo39 {
  .badge {
    display: none;
    &.fully-loaded {
      display: inline-flex;
    }
  }
}
</style>
