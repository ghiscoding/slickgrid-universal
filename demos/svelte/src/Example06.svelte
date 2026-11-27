<script lang="ts">
  import { addDay, format as tempoFormat } from '@formkit/tempo';
  import {
    GraphqlService,
    type GraphqlPaginatedResult,
    type GraphqlServiceApi,
    type GraphqlServiceOption,
  } from '@slickgrid-universal/graphql';
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type CursorPageInfo,
    type GridOption,
    type GridStateChange,
    type Metrics,
    type MultipleSelectOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { onDestroy, tick } from 'svelte';
  import { i18n } from './data/i18n.js';

  const defaultPageSize = 20;
  const GRAPHQL_QUERY_DATASET_NAME = 'users';
  const LOCAL_STORAGE_KEY = 'gridStateGraphql';
  const FAKE_SERVER_DELAY = 250;

  let svelteGrid!: SlickgridSvelteInstance;
  let dataset = $state.raw<any[]>([]);
  let metrics = $state.raw<Metrics>();
  let showSubTitle = $state(true);
  let isWithCursor = $state(false);
  let graphqlQuery = $state('');
  let processing = $state(false);
  let selectedLanguage = $state('en');
  let status = $state({ text: 'processing...', class: 'alert alert-danger' });
  let serverWaitDelay = $state(FAKE_SERVER_DELAY); // server simulation with default of 250ms but 50ms for Cypress tests
  const graphqlService = new GraphqlService();

  // always start with English for Cypress E2E tests to be consistent
  void i18n.changeLanguage('en');

  onDestroy(() => {
    saveCurrentGridState();
  });

  const columns: Column[] = [
    {
      id: 'name',
      field: 'name',
      nameKey: 'NAME',
      width: 60,
      columnGroupKey: 'CUSTOMER_INFORMATION',
      sortable: true,
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
      field: 'gender',
      nameKey: 'GENDER',
      filterable: true,
      sortable: true,
      width: 60,
      columnGroupKey: 'CUSTOMER_INFORMATION',
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: 'male', label: 'male', labelKey: 'MALE' },
          { value: 'female', label: 'female', labelKey: 'FEMALE' },
        ],
      },
    },
    {
      id: 'company',
      field: 'company',
      nameKey: 'COMPANY',
      width: 60,
      columnGroupKey: 'CUSTOMER_INFORMATION',
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.multipleSelect,
        collection: [
          { value: 'acme', label: 'Acme' },
          { value: 'abc', label: 'Company ABC' },
          { value: 'xyz', label: 'Company XYZ' },
        ],
        options: {
          filter: true, // adds a filter on top of the multi-select dropdown
        } as MultipleSelectOption,
      },
    },
    {
      id: 'billingAddressStreet',
      field: 'billing.address.street',
      nameKey: 'BILLING.ADDRESS.STREET',
      width: 60,
      filterable: true,
      sortable: true,
      columnGroupKey: 'BILLING.INFORMATION',
    },
    {
      id: 'billingAddressZip',
      field: 'billing.address.zip',
      nameKey: 'BILLING.ADDRESS.ZIP',
      width: 60,
      type: 'number',
      columnGroupKey: 'BILLING.INFORMATION', // or use "columnGroup" without Translate
      filterable: true,
      sortable: true,
      filter: {
        model: Filters.compoundInput,
      },
      formatter: Formatters.multiple,
      params: { formatters: [Formatters.complexObject, Formatters.translate] },
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
      columnGroupKey: 'BILLING.INFORMATION', // or use "columnGroup" without Translate
      filterable: true,
      filter: {
        model: Filters.dateRange,
        filterShortcuts: [
          {
            titleKey: 'NEXT_20_DAYS',
            iconCssClass: 'mdi mdi-calendar',
            searchTerms: [tempoFormat(new Date(), 'YYYY-MM-DD'), tempoFormat(addDay(new Date(), 20), 'YYYY-MM-DD')],
          },
        ],
      },
    },
  ];

  const currentYear = new Date().getFullYear();
  const presetLowestDay = `${currentYear}-01-01`;
  const presetHighestDay = `${currentYear}-02-15`;

  let options = $state.raw<GridOption>({
    gridHeight: 200,
    gridWidth: 900,
    compoundOperatorAltTexts: {
      // where '=' is any of the `OperatorType` type shown above
      text: { Custom: { operatorAlt: '%%', descAlt: 'SQL Like' } },
    },
    enableFiltering: true,
    enableCellNavigation: true,
    enableTranslate: true,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 28,
    i18n,
    gridMenu: {
      resizeOnShowHeaderRow: true,
      commandItems: [
        {
          iconCssClass: 'mdi mdi-close text-danger',
          title: 'Reset Grid',
          disabled: false,
          command: 'reset-grid',
        },
      ],
      onCommand: (_e, args) => {
        if (args.command === 'reset-grid') {
          svelteGrid.gridService.resetGrid(columns);
          localStorage[LOCAL_STORAGE_KEY] = null;
        }
      },
    },
    enablePagination: true, // you could optionally disable the Pagination
    pagination: {
      pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100],
      pageSize: defaultPageSize,
      totalItems: 0,
    },
    presets: {
      columns: [
        { columnId: 'name', width: 100 },
        { columnId: 'gender', width: 55 },
        { columnId: 'company' },
        { columnId: 'billingAddressZip' }, // flip column position of Street/Zip to Zip/Street
        { columnId: 'billingAddressStreet', width: 120 },
        { columnId: 'finish', width: 130 },
      ],
      filters: [
        // you can use OperatorType or type them as string, e.g.: operator: 'EQ'
        { columnId: 'gender', searchTerms: ['male'], operator: '=' },
        // { columnId: 'name', searchTerms: ['John Doe'], operator:  'Contains' },
        { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
        { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },

        // use a date range with 2 searchTerms values
        { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
      ],
      sorters: [
        // direction can written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
        { columnId: 'name', direction: 'asc' },
        { columnId: 'company', direction: 'DESC' },
      ],
      pagination: { pageNumber: 2, pageSize: 20 }, // if cursor based, start at page 1
    },
    backendServiceApi: {
      service: graphqlService,
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
        filterQueryOverride: ({ fieldName, columnDef, columnFilterOperator, searchValues }) => {
          if (columnFilterOperator === 'Custom' && columnDef?.id === 'name') {
            // technically speaking GraphQL isn't a database query language like SQL, it's an application query language.
            // What that means is that GraphQL won't let you write arbitrary queries out of the box.
            // It will only support the types of queries defined in your GraphQL schema.
            // see this SO: https://stackoverflow.com/a/37981802/1212166
            return { field: fieldName, operator: 'Like', value: searchValues[0] };
          }
          return;
        },
        useCursor: false, // sets pagination strategy, if true requires a call to setPageInfo() when graphql call returns
        // when dealing with complex objects, we want to keep our field name with double quotes
        // example with gender: query { users (orderBy:[{field:"gender",direction:ASC}]) {}
        keepArgumentFieldDoubleQuotes: true,
      },
      // you can define the onInit callback OR enable the "executeProcessCommandOnInit" flag in the service init
      // onInit: (query) => getCustomerApiCall(query)
      preProcess: () => displaySpinner(true),
      process: (query) => getCustomerApiCall(query),
      postProcess: (result: GraphqlPaginatedResult) => {
        metrics = result.metrics as Metrics;
        displaySpinner(false);
      },
    } as GraphqlServiceApi,
  });

  function displaySpinner(isProcessing: boolean, isError?: boolean) {
    processing = isProcessing;
    if (isError) {
      status = { text: 'ERROR!!!', class: 'alert alert-danger' };
    } else {
      status = isProcessing ? { text: 'processing...', class: 'alert alert-warning' } : { text: 'finished', class: 'alert alert-success' };
    }
  }

  /**
   * Calling your GraphQL backend server should always return a Promise or Observable of type GraphqlPaginatedResult (or GraphqlResult without Pagination)
   * @param query
   * @return Promise<GraphqlPaginatedResult> | Observable<GraphqlResult>
   */
  function getCustomerApiCall(_query: string): Promise<GraphqlPaginatedResult> {
    let pageInfo: CursorPageInfo;
    if (svelteGrid?.paginationService) {
      const { paginationService } = svelteGrid;
      // there seems to a timing issue where when you click "cursor" it requests the data before the pagination-service is initialized...
      const pageNumber = (paginationService as any)._initialized ? paginationService.getCurrentPageNumber() : 1;
      // In the real world, each node item would be A,B,C...AA,AB,AC, etc and so each page would actually be something like A-T, T-AN
      // but for this mock data it's easier to represent each page as
      // Page1: A-B
      // Page2: B-C
      // Page3: C-D
      // Page4: D-E
      // Page5: E-F
      const startCursor = String.fromCharCode('A'.charCodeAt(0) + pageNumber - 1);
      const endCursor = String.fromCharCode(startCursor.charCodeAt(0) + 1);
      pageInfo = {
        hasPreviousPage: paginationService.dataFrom === 0,
        hasNextPage: paginationService.dataTo === 100,
        startCursor,
        endCursor,
      };
    } else {
      pageInfo = {
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: 'A',
        endCursor: 'B',
      };
    }

    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    const mockedResult = {
      // the dataset name is the only unknown property
      // will be the same defined in your GraphQL Service init, in our case GRAPHQL_QUERY_DATASET_NAME
      data: {
        [GRAPHQL_QUERY_DATASET_NAME]: {
          nodes: [],
          totalCount: 100,
          pageInfo,
        },
      },
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        graphqlQuery = svelteGrid.backendService!.buildQuery();
        if (isWithCursor) {
          // When using cursor pagination, the pagination service needs to be updated with the PageInfo data from the latest request
          // This might be done automatically if using a framework specific slickgrid library
          // Note because of this timeout, this may cause race conditions with rapid clicks!
          svelteGrid?.paginationService?.setCursorPageInfo(mockedResult.data[GRAPHQL_QUERY_DATASET_NAME].pageInfo);
        }
        resolve(mockedResult);
      }, serverWaitDelay);
    });
  }

  function goToFirstPage() {
    svelteGrid.paginationService!.goToFirstPage();
  }

  function goToLastPage() {
    svelteGrid.paginationService!.goToLastPage();
  }

  /** Dispatched event of a Grid State Changed event */
  function gridStateChanged(gridStateChanges: GridStateChange) {
    console.log('GraphQL Example, Grid State changed:: ', gridStateChanges);
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(gridStateChanges.gridState);
  }

  function clearAllFiltersAndSorts() {
    if (svelteGrid?.gridService) {
      svelteGrid.gridService.clearAllFiltersAndSorts();
    }
  }

  /** Save current Filters, Sorters in LocaleStorage or DB */
  function saveCurrentGridState() {
    console.log('GraphQL current grid state', svelteGrid?.gridStateService?.getCurrentGridState());
  }

  function setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    svelteGrid.filterService.updateFilters([
      { columnId: 'gender', searchTerms: ['female'], operator: '=' },
      { columnId: 'name', searchTerms: ['Jane'], operator: 'StartsWith' },
      { columnId: 'company', searchTerms: ['acme'], operator: 'IN' },
      { columnId: 'billingAddressZip', searchTerms: ['11'], operator: '>=' },
      { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
    ]);
  }

  function setSortingDynamically() {
    svelteGrid.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'billingAddressZip', direction: 'DESC' },
      { columnId: 'company', direction: 'ASC' },
    ]);
  }

  function resetToOriginalPresets() {
    svelteGrid.filterService.updateFilters([
      // you can use OperatorType or type them as string, e.g.: operator: 'EQ'
      { columnId: 'gender', searchTerms: ['male'], operator: '=' },
      // { columnId: 'name', searchTerms: ['John Doe'], operator:  'Contains' },
      { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
      { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },

      // use a date range with 2 searchTerms values
      { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
    ]);
    svelteGrid.sortService.updateSorting([
      // direction can written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
      { columnId: 'name', direction: 'asc' },
      { columnId: 'company', direction: 'DESC' },
    ]);
    setTimeout(() => {
      svelteGrid.paginationService?.changeItemPerPage(20);
      svelteGrid.paginationService?.goToPageNumber(2);
    });
  }

  function setIsWithCursor(withCursor: boolean) {
    isWithCursor = withCursor;
    resetOptions({ useCursor: withCursor });
    return true;
  }

  function resetOptions(serviceOptions: Partial<GraphqlServiceOption>) {
    displaySpinner(true);
    svelteGrid.paginationService!.setCursorBased(serviceOptions.useCursor as boolean);
    graphqlService.updateOptions(serviceOptions);
    options = { ...options };
    svelteGrid.paginationService?.goToFirstPage();
  }

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(nextLanguage);
    selectedLanguage = nextLanguage;
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    svelteGrid.resizerService.resizeGrid();
  }
</script>

<h2>
  Example 6: Grid with Backend GraphQL Service
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example06.svelte"
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

<div class="subtitle" class:hidden={!showSubTitle}>
  Use it when you need to support Pagination with a GraphQL endpoint (for simple JSON, use a regular grid).
  <br />Take a look at the (<a href="https://ghiscoding.gitbook.io/svelte-slickgrid/backend-services/graphql" target="_blank">Wiki docs</a>)
  <ul class="small">
    <li><span class="red bold">(*) NO DATA SHOWN</span> - just change filters &amp; page and look at the "GraphQL Query" changing</li>
    <li>Only "Name" field is sortable for the demo (because we use JSON files), however "multiColumnSort: true" is also supported</li>
    <li>String column also support operator (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *)</li>
    <ul>
      <li>The (*) can be used as startsWith (ex.: "abc*" =&gt; startsWith "abc") / endsWith (ex.: "*xyz" =&gt; endsWith "xyz")</li>
      <li>The other operators can be used on column type number for example: "&gt;=100" (greater or equal than 100)</li>
    </ul>
    <li>
      You can also preload a grid with certain "presets" like Filters / Sorters / Pagination
      <a href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/grid-state-and-preset" target="_blank">
        Wiki - Grid Preset
      </a>
    </li>
    <li>
      Also note that the column Name has a filter with a custom %% operator that behaves like an SQL LIKE operator supporting % wildcards.
    </li>
    <li>
      Depending on your configuration, your GraphQL Server might already support regex querying (e.g. Hasura
      <a href="https://hasura.io/docs/latest/queries/postgres/filters/text-search-operators/#_regex" target="_blank">_regex</a>) or you
      could add your own implementation (e.g. see this SO
      <a href="https://stackoverflow.com/a/37981802/1212166" target="_blank">Question</a>).
    </li>
  </ul>
</div>

<div class="row">
  <div class="col-sm-5">
    <div class={status.class} role="alert" data-test="status">
      <strong>Status: </strong>
      {status.text}
      <span hidden={!processing}>
        <i class="mdi mdi-sync mdi-spin"></i>
      </span>
    </div>

    <div class="row">
      <div class="col-md-12">
        <button
          class="btn btn-outline-secondary btn-sm btn-icon"
          data-test="clear-filters-sorting"
          title="Clear all Filters & Sorts"
          onclick={clearAllFiltersAndSorts}
        >
          <i class="mdi mdi-filter-remove-outline"></i>
          Clear all Filter &amp; Sorts
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-dynamic-filter" onclick={setFiltersDynamically}>
          Set Filters Dynamically
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" onclick={setSortingDynamically}>
          Set Sorting Dynamically
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="reset-presets" onclick={resetToOriginalPresets}>
          Reset Original Presets
        </button>
        <label for="serverdelay" class="ml-4">Server Delay: </label>
        <input
          id="serverdelay"
          bind:value={serverWaitDelay}
          type="number"
          data-test="server-delay"
          style="width: 55px"
          title="input a fake timer delay to simulate slow server response"
        />
      </div>
    </div>

    <hr />

    <div class="row">
      <div class="col-md-12">
        <button class="btn btn-outline-secondary btn-sm btn-icon me-1" data-test="language-button" onclick={switchLanguage}>
          <i class="mdi mdi-translate"></i>
          Switch Language
        </button>
        <b>Locale:</b>
        <span style="font-style: italic" data-test="selected-locale"> {selectedLanguage + '.json'} </span>
      </div>

      <span class="d-flex" style="margin-left: 10px">
        <span>Pagination strategy: </span>
        <span data-test="radioStrategy">
          <label class="ms-1 radio-inline control-label" for="radioOffset">
            <input
              id="radioOffset"
              type="radio"
              name="inlineRadioOptions"
              data-test="offset"
              checked={!isWithCursor}
              value="false"
              onclick={() => setIsWithCursor(false)}
            />
            Offset
          </label>
          <label class="ms-1 radio-inline control-label" for="radioCursor">
            <input
              id="radioCursor"
              type="radio"
              name="inlineRadioOptions"
              data-test="cursor"
              checked={isWithCursor}
              value="true"
              onclick={() => setIsWithCursor(true)}
            />
            Cursor
          </label>
        </span>
      </span>
    </div>
    <br />
    {#if metrics}
      <div style="margin: 10px 0px">
        <b>Metrics:</b>
        {metrics.endTime ? tempoFormat(metrics.endTime, 'DD MMM, h:mm:ss a', 'en-US') : ''} | {metrics.executionTime}ms | {metrics.totalItemCount}
        items
      </div>
    {/if}
    <div class="row" style="margin-bottom: 5px">
      <div class="col-md-12">
        <span>Programmatically go to first/last page:</span>
        <div class="btn-group ms-1" role="group">
          <button
            class="btn btn-outline-secondary btn-xs btn-icon px-2"
            aria-label="Go to first page"
            data-test="goto-first-page"
            onclick={goToFirstPage}
          >
            <i class="mdi mdi-page-first"></i>
          </button>
          <button
            class="btn btn-outline-secondary btn-xs btn-icon px-2"
            aria-label="Go to last page"
            data-test="goto-last-page"
            onclick={goToLastPage}
          >
            <i class="mdi mdi-page-last icon"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="col-sm-7">
    <div class="alert alert-info" data-test="alert-graphql-query">
      <strong>GraphQL Query:</strong> <span data-test="graphql-query-result">{graphqlQuery}</span>
    </div>
  </div>
</div>

<SlickgridSvelte
  gridId="grid6"
  {columns}
  {options}
  {dataset}
  onGridStateChanged={(event) => gridStateChanged(event.detail)}
  onSvelteGridCreated={(instance) => (svelteGrid = instance)}
/>
