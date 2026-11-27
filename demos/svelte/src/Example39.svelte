<script lang="ts">
  import { format as dateFormatter } from '@formkit/tempo';
  import { GraphqlService, type GraphqlPaginatedResult, type GraphqlServiceApi } from '@slickgrid-universal/graphql';
  import {
    Filters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type Metrics,
    type MultipleSelectOption,
    type OnRowCountChangedEventArgs,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import customerData from './data/customers_100.json';
  import { i18n } from './data/i18n.js';

  const GRAPHQL_QUERY_DATASET_NAME = 'users';
  const backendService = new GraphqlService();
  const columns: Column[] = [
    { id: 'name', field: 'name', nameKey: 'NAME', width: 60, sortable: true, filterable: true, filter: { model: Filters.compoundInput } },
    {
      id: 'gender',
      field: 'gender',
      nameKey: 'GENDER',
      width: 60,
      filterable: true,
      sortable: true,
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
        customStructure: { label: 'company', value: 'company' },
        collectionSortBy: { property: 'company', sortDesc: false },
        collectionAsync: Promise.resolve(customerData),
        options: { filter: true } as MultipleSelectOption,
      },
    },
  ];

  let gridOptions: GridOption = $state.raw({});
  let dataset: any[] = $state.raw([]);
  let metrics: Partial<Metrics> = $state({});
  let tagDataClass = $state('');
  let graphqlQuery = $state('...');
  let processing = $state(false);
  let selectedLanguage = $state('en');
  let status = $state({ text: 'processing...', class: 'alert alert-danger' });
  let showSubTitle = $state(true);
  let serverWaitDelay = $state(250);
  let grid: SlickgridSvelteInstance;
  const metricsEndTime = $derived(metrics.endTime ? dateFormatter(metrics.endTime, 'DD MMM, h:mm:ss a') : '');

  void i18n.changeLanguage('en');

  function displaySpinner(isProcessing: boolean, isError = false) {
    processing = isProcessing;
    status = isError
      ? { text: 'ERROR!!!', class: 'alert alert-danger' }
      : isProcessing
        ? { text: 'loading', class: 'alert alert-warning' }
        : { text: 'finished', class: 'alert alert-success' };
  }

  function defineGrid() {
    gridOptions = {
      enableAutoResize: true,
      autoResize: { container: '#demo-container', rightPadding: 10 },
      enableAutoTooltip: true,
      autoTooltipOptions: { enableForHeaderCells: true },
      enableTranslate: true,
      i18n,
      enableFiltering: true,
      enableCellNavigation: true,
      multiColumnSort: false,
      gridMenu: { resizeOnShowHeaderRow: true },
      backendServiceApi: {
        disableInternalPostProcess: true,
        service: backendService,
        options: {
          datasetName: GRAPHQL_QUERY_DATASET_NAME,
          addLocaleIntoQuery: true,
          extraQueryArguments: [{ field: 'userId', value: 123 }],
          infiniteScroll: { fetchSize: 30 },
        },
        preProcess: () => displaySpinner(true),
        process: (query: string) => getCustomerApiCall(query),
        postProcess: (result: GraphqlPaginatedResult) => {
          metrics = { endTime: new Date(), totalItemCount: result.data[GRAPHQL_QUERY_DATASET_NAME]?.totalCount || 0 };
          displaySpinner(false);
          getCustomerCallback(result);
        },
      } as GraphqlServiceApi,
    };
  }

  function clearAllFiltersAndSorts() {
    grid?.gridService.clearAllFiltersAndSorts();
  }
  function unescapeAndLowerCase(value: string) {
    return value.replace(/^"/, '').replace(/"$/, '').toLowerCase();
  }

  function getCustomerCallback(result: any) {
    const { nodes, totalCount } = result.data[GRAPHQL_QUERY_DATASET_NAME];
    if (!grid) {
      return;
    }
    metrics.totalItemCount = totalCount;
    if (!result.infiniteScrollBottomHit) {
      grid.slickGrid?.scrollTo(0);
      dataset = nodes;
      metrics.itemCount = nodes.length;
    } else {
      grid.dataView?.addItems(nodes);
    }
  }

  function getCustomerApiCall(query: string): Promise<GraphqlPaginatedResult> {
    return getCustomerDataApiMock(query);
  }

  function getCustomerDataApiMock(query: string): Promise<any> {
    return new Promise((resolve) => {
      let firstCount = Number(query.match(/first:([0-9]+),/)?.[1] ?? 30);
      let offset = Number(query.match(/offset:([0-9]+),/)?.[1] ?? 0);
      const orderMatch = query.match(/orderBy:\[{field:([a-zA-Z/]+),direction:(ASC|DESC)}\]/i);
      const orderField = orderMatch?.[1] ?? '';
      const orderDirection = orderMatch?.[2] ?? '';
      let rows = JSON.parse(JSON.stringify(customerData)) as any[];
      const filterRegex = /{field:(\w+),operator:(\w+),value:([0-9a-z',"\s]*)}/gi;
      let match: RegExpExecArray | null;
      while ((match = filterRegex.exec(query)) !== null) {
        const [, field, operator, filterValue] = match;
        const [term1Raw, term2Raw] = filterValue.split(',');
        const term1 = unescapeAndLowerCase(term1Raw);
        const term2 = unescapeAndLowerCase(term2Raw || '');
        rows = rows.filter((row) => {
          const value = String(row[field] ?? '').toLowerCase();
          switch (operator) {
            case 'EQ':
              return value === term1;
            case 'NE':
              return value !== term1;
            case 'LE':
              return value <= term1;
            case 'LT':
              return value < term1;
            case 'GT':
              return value > term1;
            case 'GE':
              return value >= term1;
            case 'EndsWith':
              return value.endsWith(term1);
            case 'StartsWith':
              return value.startsWith(term1);
            case 'Starts+Ends':
              return value.startsWith(term1) && value.endsWith(term2);
            case 'Contains':
              return value.includes(term1);
            case 'Not_Contains':
              return !value.includes(term1);
            case 'IN':
              return filterValue.split(',').some((term) => value === unescapeAndLowerCase(term));
            default:
              return true;
          }
        });
      }

      const totalCount = rows.length;
      if (offset > rows.length) {
        offset = 0;
      }
      if (orderField) {
        const field = orderField.split('/').at(-1) as string;
        const direction = orderDirection === 'DESC' ? -1 : 1;
        rows.sort((a, b) => direction * String(a[field] ?? '').localeCompare(String(b[field] ?? '')));
      }
      const nodes = rows.slice(offset, offset + firstCount);
      const result = { data: { [GRAPHQL_QUERY_DATASET_NAME]: { nodes, totalCount } } };
      setTimeout(
        () => {
          graphqlQuery = backendService.buildQuery();
          resolve(result);
        },
        Number(serverWaitDelay) || 0
      );
    });
  }

  function refreshMetrics(event: CustomEvent<{ args: OnRowCountChangedEventArgs }>) {
    if (event.detail.args?.current >= 0) {
      metrics.itemCount = grid.dataView?.getFilteredItemCount() || 0;
      tagDataClass = metrics.itemCount === metrics.totalItemCount ? 'fully-loaded' : 'partial-load';
    }
  }

  async function switchLanguage() {
    selectedLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(selectedLanguage);
  }
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid?.resizerService.resizeGrid());
  }
  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
  }

  defineGrid();
  const events = { onRowCountChanged: refreshMetrics };
</script>

<svelte:head><title>Example 39 - Infinite Scroll with GraphQL</title></svelte:head>

<div class="demo39">
  <h2>
    Example 39: GraphQL Backend Service with Infinite Scroll
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example39.svelte"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button
      class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
      type="button"
      aria-label="Toggle example sub-title details"
      data-test="toggle-subtitle"
      onclick={toggleSubTitle}
    >
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>
  {#if showSubTitle}<div class="subtitle">
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
            <code>presets.pagination</code> is not supported with Infinite Scroll and will revert to the first page, simply because since we keep
            appending data, we always have to start from index zero (no offset).
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
    </div>{/if}
  <div class="row">
    <div class="col-sm-5">
      <div class={status.class} role="alert" data-test="status">
        <strong>Status: </strong>
        {status.text}<span hidden={!processing}><i class="mdi mdi-sync mdi-spin"></i></span>
      </div>
      <div class="row">
        <div class="col-md-12">
          <button
            class="btn btn-outline-secondary btn-sm btn-icon"
            data-test="clear-filters-sorting"
            title="Clear all Filters & Sorts"
            onclick={clearAllFiltersAndSorts}
          >
            <i class="mdi mdi-filter-remove-outline"></i> Clear all Filter & Sorts
          </button>
          <label for="serverdelay" class="mx-1">Server Delay: </label><input
            id="serverdelay"
            bind:value={serverWaitDelay}
            type="number"
            data-test="server-delay"
            style="width: 55px"
            title="input a fake timer delay to simulate slow server response"
          />
        </div>
      </div>
      <div class="row mt-1">
        <div class="col-md-12">
          <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="language-button" onclick={switchLanguage}>
            <i class="mdi mdi-translate"></i> Switch Language
          </button>
          <strong class="mx-1">Locale:</strong><span style="font-style: italic" data-test="selected-locale">{selectedLanguage}.json</span>
        </div>
      </div>
      <br />
      <div style="margin: 10px 0px">
        <b>Metrics:</b><span>
          <span>{metricsEndTime}</span> — <span data-test="itemCount">{metrics.itemCount ?? 0}</span> of
          <span data-test="totalItemCount">{metrics.totalItemCount ?? 0}</span> items
        </span><span class={'badge rounded-pill text-bg-primary ' + tagDataClass} data-test="data-loaded-tag">All Data Loaded!!!</span>
      </div>
    </div>
    <div class="col-sm-7">
      <div class="alert alert-info" data-test="alert-graphql-query">
        <strong>GraphQL Query:</strong>
        <div data-test="graphql-query-result">{graphqlQuery}</div>
      </div>
    </div>
  </div>
  <SlickgridSvelte gridId="grid39" {columns} options={gridOptions} {dataset} {events} onSvelteGridCreated={gridReady} />
</div>

<style>
  :global(.demo39 .badge) {
    display: none;
  }
  :global(.demo39 .badge.fully-loaded) {
    display: inline-flex;
  }
</style>
