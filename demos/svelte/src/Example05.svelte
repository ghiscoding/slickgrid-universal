<script lang="ts">
  import { format as tempoFormat } from '@formkit/tempo';
  import { GridOdataService, type OdataOption, type OdataServiceApi } from '@slickgrid-universal/odata';
  import {
    Filters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type GridStateChange,
    type Metrics,
    type Pagination,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { tick } from 'svelte';
  import { getCustomerDataApiMock } from './data/odataMock.js';

  const defaultPageSize = 20;
  const CARET_HTML_ESCAPED = '%5E';

  let svelteGrid!: SlickgridSvelteInstance;
  let dataset = $state.raw<any[]>([]);
  let metrics = $state.raw<Metrics>();
  let paginationOptions = $state.raw<Pagination>();
  let showSubTitle = $state(true);
  let isCountEnabled = $state(true);
  let isSelectEnabled = $state(false);
  let isExpandEnabled = $state(false);
  let odataVersion = $state(2);
  let odataQuery = $state('');
  let processing = $state(false);
  let errorStatus = $state('');
  let status = $state({ text: '', class: '' });

  // the mock reads the latest flags when it builds the response
  const mockConfig = {
    get countEnabled() {
      return isCountEnabled;
    },
    get version() {
      return odataVersion;
    },
    pageError: false,
  };
  const odataService = new GridOdataService();

  const columns: Column[] = [
    {
      id: 'name',
      name: 'Name',
      field: 'name',
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

  const options: GridOption = {
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
      // where '=' is any of the `OperatorType` type shown above
      text: { Custom: { operatorAlt: '%%', descAlt: 'SQL Like' } },
    },
    enableCellNavigation: true,
    enableFiltering: true,
    enableCheckboxSelector: true,
    enableSelection: true,
    enablePagination: true, // you could optionally disable the Pagination
    pagination: {
      pageSizes: [10, 20, 50, 100, 500, 50000],
      pageSize: defaultPageSize,
      totalItems: 0,
    },
    presets: {
      // you can also type operator as string, e.g.: operator: 'EQ'
      filters: [{ columnId: 'gender', searchTerms: ['male'], operator: '=' }],
      sorters: [
        // direction can be written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
        { columnId: 'name', direction: 'asc' },
      ],
      pagination: { pageNumber: 2, pageSize: 20 },
    },
    backendServiceApi: {
      service: odataService,
      options: {
        enableCount: true, // add the count in the OData query, which will return a property named "__count" (v2) or "@odata.count" (v4)
        enableSelect: false,
        enableExpand: false,
        filterQueryOverride: ({ fieldName, columnDef, columnFilterOperator, searchValues }) => {
          if (columnFilterOperator === 'Custom' && columnDef?.id === 'name') {
            let matchesSearch = searchValues[0].replace(/\*/g, '.*');
            matchesSearch = matchesSearch.slice(0, 1) + CARET_HTML_ESCAPED + matchesSearch.slice(1);
            matchesSearch = matchesSearch.slice(0, -1) + "$'";

            return `matchesPattern(${fieldName}, ${matchesSearch})`;
          }
          return;
        },
        version: 2, // defaults to 2, the query string is slightly different between OData 2 and 4
      },
      onError: (error: Error) => {
        console.log('ERROR', error);
        errorStatus = error.message;
        displaySpinner(false, true);
      },
      preProcess: () => {
        errorStatus = '';
        displaySpinner(true);
      },
      process: (query) => getCustomerApiCall(query),
      postProcess: (response) => {
        metrics = response.metrics;
        displaySpinner(false);
        getCustomerCallback(response);
      },
    } as OdataServiceApi,
  };

  function displaySpinner(isProcessing: boolean, isError?: boolean) {
    processing = isProcessing;
    if (isError) {
      status = { text: 'ERROR!!!', class: 'alert alert-danger' };
    } else {
      status = isProcessing ? { text: 'loading', class: 'alert alert-warning' } : { text: 'finished', class: 'alert alert-success' };
    }
  }

  function getCustomerCallback(data: any) {
    // totalItems property needs to be filled for pagination to work correctly
    let totalItemCount: number = data['totalRecordCount']; // you can use "totalRecordCount" or any name or "odata.count" when "enableCount" is set
    if (isCountEnabled) {
      totalItemCount = odataVersion === 4 ? data['@odata.count'] : data['d']['__count'];
    }
    if (metrics) {
      metrics = { ...metrics, totalItemCount };
    }

    // once pagination totalItems is filled, we can update the dataset
    paginationOptions = { ...options.pagination, totalItems: totalItemCount } as Pagination;
    dataset = odataVersion === 4 ? data.value : data.d.results;
    odataQuery = data['query'];
  }

  function getCustomerApiCall(query: string) {
    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    return getCustomerDataApiMock(query, mockConfig);
  }

  function goToFirstPage() {
    svelteGrid.paginationService!.goToFirstPage();
  }

  function goToLastPage() {
    svelteGrid.paginationService!.goToLastPage();
  }

  let lastLoggedPagination = '';

  /** Dispatched event of a Grid State Changed event */
  function gridStateChanged(gridStateChanges: GridStateChange) {
    const change = gridStateChanges.change;
    if (!change) {
      return;
    }
    if (change.type === 'pagination') {
      const pagination = change.newValues as Pagination;
      if (pagination.pageNumber === 0) {
        return;
      }
      const paginationKey = `${pagination.pageNumber}:${pagination.pageSize}`;
      if (paginationKey === lastLoggedPagination) {
        return;
      }
      lastLoggedPagination = paginationKey;
      console.log('Client sample, Grid State changed:: ', change);
    } else {
      if (change.type === 'filter') {
        lastLoggedPagination = '';
      }
      console.log('Client sample, Grid State changed:: ', change);
    }
  }

  function setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    svelteGrid.filterService.updateFilters([
      // { columnId: 'gender', searchTerms: ['male'], operator: '=' },
      { columnId: 'name', searchTerms: ['A'], operator: 'a*' },
    ]);
  }

  function setSortingDynamically() {
    svelteGrid.sortService.updateSorting([{ columnId: 'name', direction: 'DESC' }]);
  }

  function throwPageChangeError() {
    mockConfig.pageError = true;
    svelteGrid?.paginationService?.goToLastPage();
  }

  // YOU CAN CHOOSE TO PREVENT EVENT FROM BUBBLING IN THE FOLLOWING 3x EVENTS (by returning false)
  function handleOnBeforeSort() {
    return true;
  }

  // note that internally the cancelling the search is more of a rollback
  function handleOnBeforeSearchChange() {
    return true;
  }

  function handleOnBeforePaginationChange() {
    return true;
  }

  // THE FOLLOWING METHODS ARE ONLY FOR DEMO PURPOSES DO NOT USE THIS CODE
  // ---

  function changeCountEnableFlag() {
    isCountEnabled = !isCountEnabled;
    resetOptions({ enableCount: isCountEnabled });
    return true;
  }

  function changeEnableSelectFlag() {
    isSelectEnabled = !isSelectEnabled;
    resetOptions({ enableSelect: isSelectEnabled });
    return true;
  }

  function changeEnableExpandFlag() {
    isExpandEnabled = !isExpandEnabled;
    resetOptions({ enableExpand: isExpandEnabled });
    return true;
  }

  function setOdataVersion(version: number) {
    odataVersion = version;
    resetOptions({ version });
    return true;
  }

  function resetOptions(odataOptions: Partial<OdataOption>) {
    displaySpinner(true);
    odataService.updateOptions(odataOptions);
    odataService.clearFilters();
    svelteGrid?.filterService.clearFilters();
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    svelteGrid.resizerService.resizeGrid(0);
  }
</script>

<h2>
  Example 5: Grid with Backend OData Service
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example05.svelte"
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

<div class="row">
  <div class="col-sm-9">
    <div class="subtitle" class:hidden={!showSubTitle}>
      Use it when you need to support Pagination with a OData endpoint (for simple JSON, use a regular grid)<br />
      Take a look at the (<a href="https://ghiscoding.gitbook.io/svelte-slickgrid/backend-services/odata" target="_blank">
        Wiki documentation
      </a>)
      <br />
      <ul class="small">
        <li>Only "Name" field is sortable for the demo (because we use JSON files), however "multiColumnSort: true" is also supported</li>
        <li>This example also demos the Grid State feature, open the console log to see the changes</li>
        <li>String column also support operator (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *)</li>
        <ul>
          <li>The (*) can be used as startsWith (ex.: "abc*" =&gt; startsWith "abc") / endsWith (ex.: "*xyz" =&gt; endsWith "xyz")</li>
          <li>The other operators can be used on column type number for example: "&gt;=100" (greater than or equal to 100)</li>
        </ul>
        <li>OData Service could be replaced by other Service type in the future (GraphQL or whichever you provide)</li>
        <li>
          You can also preload a grid with certain "presets" like Filters / Sorters / Pagination
          <a href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/grid-state-and-preset" target="_blank">
            Wiki - Grid Preset
          </a>
        </li>
        <li>
          <span class="text-danger">NOTE:</span> For demo purposes, the last column (filter & sort) will always throw an error and its only purpose
          is to demo what would happen when you encounter a backend server error (the UI should rollback to previous state before you did the
          action). Also changing Page Size to 50,000 will also throw which again is for demo purposes.
        </li>
      </ul>
    </div>
  </div>
  <div class="col-sm-3">
    {#if errorStatus}
      <div class="alert alert-danger" data-test="error-status">
        <em><strong>Backend Error:</strong> <span>{errorStatus}</span></em>
      </div>
    {/if}
  </div>
</div>

<div class="row">
  <div class="col-sm-2">
    <div class={status.class} role="alert" data-test="status">
      <strong>Status: </strong>
      {status.text}
      <span hidden={!processing}>
        <i class="mdi mdi-sync mdi-spin"></i>
      </span>
    </div>
  </div>
  <div class="col-sm-10">
    <div class="alert alert-info" data-test="alert-odata-query">
      <strong>OData Query:</strong> <span data-test="odata-query-result">{odataQuery}</span>
    </div>
  </div>
</div>

<div class="row">
  <div class="col-sm-4">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-filter" onclick={setFiltersDynamically}>
      Set Filters Dynamically
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" onclick={setSortingDynamically}>
      Set Sorting Dynamically
    </button>
    <br />
    {#if metrics}
      <span>
        <b>Metrics:</b>
        {metrics.endTime ? tempoFormat(metrics.endTime, 'DD MMM, h:mm:ss a', 'en-US') : ''} | {metrics.executionTime}ms | {metrics.totalItemCount}
        items
      </span>
    {/if}
  </div>

  <div class="col-sm-8">
    <span>OData Version: </span>
    <span data-test="radioVersion">
      <label class="radio-inline control-label" for="radio2">
        <input
          id="radio2"
          type="radio"
          name="inlineRadioOptions"
          data-test="version2"
          checked={odataVersion === 2}
          value="2"
          onchange={() => setOdataVersion(2)}
        />
        2
      </label>
      <label class="radio-inline control-label" for="radio4">
        <input
          id="radio4"
          type="radio"
          name="inlineRadioOptions"
          data-test="version4"
          checked={odataVersion === 4}
          value="4"
          onchange={() => setOdataVersion(4)}
        />
        4
      </label>
    </span>
    <label class="checkbox-inline control-label" for="enableCount" style="margin-left: 20px">
      <input id="enableCount" type="checkbox" data-test="enable-count" checked={isCountEnabled} onclick={changeCountEnableFlag} />
      <span style="font-weight: bold">Enable Count</span> (add to OData query)
    </label>
    <label class="checkbox-inline control-label" for="enableSelect" style="margin-left: 20px">
      <input id="enableSelect" type="checkbox" data-test="enable-select" checked={isSelectEnabled} onclick={changeEnableSelectFlag} />
      <span style="font-weight: bold">Enable Select</span> (add to OData query)
    </label>
    <label class="checkbox-inline control-label" for="enableExpand" style="margin-left: 20px">
      <input id="enableExpand" type="checkbox" data-test="enable-expand" checked={isExpandEnabled} onclick={changeEnableExpandFlag} />
      <span style="font-weight: bold">Enable Expand</span> (add to OData query)
    </label>
  </div>
</div>
<div class="row mt-2 mb-1">
  <div class="col-md-12">
    <button class="btn btn-outline-danger btn-sm btn-icon" data-test="throw-page-error-btn" onclick={throwPageChangeError}>
      <span>Throw Error Going to Last Page... </span>
      <i class="mdi mdi-page-last"></i>
    </button>

    <span class="ms-2">
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
          <i class="mdi mdi-page-last"></i>
        </button>
      </div>
    </span>
  </div>
</div>

<SlickgridSvelte
  gridId="grid5"
  {columns}
  {options}
  {dataset}
  {paginationOptions}
  onGridStateChanged={(event) => gridStateChanged(event.detail)}
  onBeforeSort={handleOnBeforeSort}
  onBeforeSearchChange={handleOnBeforeSearchChange}
  onBeforePaginationChange={handleOnBeforePaginationChange}
  onSvelteGridCreated={(instance) => (svelteGrid = instance)}
/>
