<script lang="ts">
  import { GridOdataService, type OdataOption, type OdataServiceApi } from '@slickgrid-universal/odata';
  import { Filters, SlickgridSvelte, type Column, type GridOption, type Pagination, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { getCustomerDataApiMock } from './data/odataMock.js';

  let grid: SlickgridSvelteInstance;
  let showSubTitle = true;
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => {
      grid?.resizerService?.resizeGrid();
    });
  }
  let dataset: any[] = [];
  let paginationOptions: Pagination | undefined;
  let query = '';
  let status = '';
  let processing = false;
  let errorStatus = '';
  let metrics: { executionTime: number; totalItemCount: number } | undefined;
  let requestStarted = 0;
  let countEnabled = true;
  let selectEnabled = false;
  let expandEnabled = false;
  let version = 2;
  const mockConfig = { countEnabled, version, pageError: false };
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
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: 'male', label: 'male' },
          { value: 'female', label: 'female' },
        ],
      },
    },
    { id: 'company', name: 'Company', field: 'company', sortable: true, filterable: true },
    { id: 'category_name', name: 'Category', field: 'category/name', sortable: true, filterable: true },
  ];
  const backend: OdataServiceApi = {
    service: new GridOdataService(),
    options: {
      enableCount: true,
      enableSelect: false,
      enableExpand: false,
      version: 2,
      filterQueryOverride: ({ fieldName, columnDef, columnFilterOperator, operator, searchValues }) => {
        const searchValue = String(searchValues[0]);
        if (
          columnDef?.id === 'name' &&
          searchValues.length === 1 &&
          !searchValue.includes('..') &&
          (columnFilterOperator === 'Custom' || String(operator) === '%%' || searchValue.includes('%'))
        ) {
          const search = searchValue.replace(/^'|'$/g, '').replace(/\*/g, '.*');
          return `matchesPattern(${fieldName}, '%5E${search}$')`;
        }
      },
    },
    preProcess: () => {
      processing = true;
      requestStarted = Date.now();
      errorStatus = '';
      status = 'loading';
    },
    process: (request) => getCustomerDataApiMock(request, mockConfig),
    postProcess: (response: any) => {
      const totalItems = mockConfig.countEnabled
        ? mockConfig.version === 4
          ? response['@odata.count']
          : response.d.__count
        : response.totalRecordCount;
      metrics = { executionTime: Date.now() - requestStarted, totalItemCount: totalItems };
      paginationOptions = { pageSize: grid?.paginationService?.itemsPerPage || 20, totalItems };
      dataset = mockConfig.version === 4 ? response.value : response.d.results;
      query = response.query;
      status = 'finished';
      processing = false;
    },
    onError: (error: Error) => {
      errorStatus = error.message;
      status = 'ERROR!!!';
      processing = false;
    },
  };
  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    gridHeight: 350,
    enableCellNavigation: true,
    compoundOperatorAltTexts: { text: { Custom: { operatorAlt: '%%', descAlt: 'SQL Like' } } },
    enableFiltering: true,
    enableCheckboxSelector: true,
    enableSelection: true,
    enablePagination: true,
    pagination: { pageSizes: [10, 20, 50, 100, 500, 50000], pageSize: 20, totalItems: 0 },
    presets: {
      filters: [{ columnId: 'gender', searchTerms: ['male'], operator: '=' }],
      sorters: [{ columnId: 'name', direction: 'asc' }],
      pagination: { pageNumber: 2, pageSize: 20 },
    },
    backendServiceApi: backend,
  };
  function updateOptions() {
    Object.assign(mockConfig, { countEnabled, version });
    grid.backendService?.updateOptions({
      enableCount: countEnabled,
      enableSelect: selectEnabled,
      enableExpand: expandEnabled,
      version,
    } as Partial<OdataOption>);
    grid.backendService?.clearFilters?.();
    grid.filterService.clearFilters();
    grid.paginationService.goToFirstPage();
  }
  function setFilters() {
    void grid.filterService.updateFilters([{ columnId: 'name', searchTerms: ['A'], operator: 'a*' }]);
  }
  function setSorting() {
    grid.sortService.updateSorting([{ columnId: 'name', direction: 'DESC' }]);
  }
  let paginationLogTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingPaginationChange: any;
  function logGridStateChanged(event: CustomEvent<any>) {
    const change = event.detail.change;
    if (change.type === 'pagination') {
      pendingPaginationChange = change;
      clearTimeout(paginationLogTimer);
      paginationLogTimer = setTimeout(() => console.log('Client sample, Grid State changed:: ', pendingPaginationChange), 50);
    } else {
      console.log('Client sample, Grid State changed:: ', change);
    }
  }
</script>

<h2>
  Example 5: Grid with Backend OData Service
  <span class="float-end"
    ><a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example05.svelte"
      ><span class="mdi mdi-link-variant"></span> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
</h2>
<div class="row">
  <div class="col-sm-9">
    <div class="subtitle" class:hidden={!showSubTitle}>
      Sorting/Paging connected to a Backend OData Service (<a
        href="https://ghiscoding.gitbook.io/svelte-slickgrid/backend-services/odata"
        target="_blank"
        rel="noreferrer">Docs</a
      >).
      <br />
      <ul class="small">
        <li>Only "Name" field is sortable for the demo (because we use JSON files), however "multiColumnSort: true" is also supported</li>
        <li>This example also demos the Grid State feature, open the console log to see the changes</li>
        <li>String columns support operator (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *)</li>
        <ul>
          <li>The (*) can be used as startsWith (ex.: "abc*" =&gt; startsWith "abc") or endsWith (ex.: "*xyz" =&gt; endsWith "xyz")</li>
          <li>Other operators can be used on number columns, for example: &gt;=100</li>
        </ul>
        <li>OData Service could be replaced by another service type, such as GraphQL</li>
        <li>
          You can preload a grid with presets like Filters / Sorters / Pagination (<a
            href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/grid-state-and-preset"
            target="_blank"
            rel="noreferrer">Docs - Grid Preset</a
          >)
        </li>
        <li>
          <span class="text-danger">NOTE:</span> The last column filter and sort intentionally throw an error to demonstrate how the UI rolls
          back. Changing Page Size to 50,000 also throws an error for demo purposes.
        </li>
      </ul>
    </div>
  </div>
  <div class="col-sm-3">
    {#if errorStatus}<div class="alert alert-danger" data-test="error-status">
        <em><strong>Backend Error:</strong> {errorStatus}</em>
      </div>{/if}
  </div>
</div>
<div class="row">
  <div class="col-sm-2">
    <div
      class="alert"
      class:alert-warning={processing}
      class:alert-success={!processing && !errorStatus}
      class:alert-danger={!!errorStatus}
      role="alert"
      data-test="status"
    >
      <strong>Status: </strong>{status}<span hidden={!processing}><i class="mdi mdi-sync mdi-spin"></i></span>
    </div>
  </div>
  <div class="col-sm-10">
    <div class="alert alert-info" data-test="alert-odata-query">
      <strong>OData Query:</strong> <span data-test="odata-query-result">{query}</span>
    </div>
  </div>
</div>
<div class="row">
  <div class="col-sm-4">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-filter" onclick={setFilters}
      >Set Filters Dynamically</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-dynamic-sorting" onclick={setSorting}
      >Set Sorting Dynamically</button
    >
    <br />
    {#if metrics}<span><b>Metrics:</b> {metrics.executionTime}ms | {metrics.totalItemCount} items</span>{/if}
  </div>
  <div class="col-sm-8 d-flex flex-wrap gap-2">
    <span
      >OData Version: <label
        ><input type="radio" name="odata-version" value={2} bind:group={version} onchange={updateOptions} data-test="version2" /> 2</label
      >
      <label
        ><input type="radio" name="odata-version" value={4} bind:group={version} onchange={updateOptions} data-test="version4" /> 4</label
      ></span
    >
    <label
      ><input type="checkbox" bind:checked={countEnabled} onchange={updateOptions} data-test="enable-count" /> <b>Enable Count</b> (add to OData
      query)</label
    >
    <label
      ><input type="checkbox" bind:checked={selectEnabled} onchange={updateOptions} data-test="enable-select" /> <b>Enable Select</b> (add to
      OData query)</label
    >
    <label
      ><input type="checkbox" bind:checked={expandEnabled} onchange={updateOptions} data-test="enable-expand" /> <b>Enable Expand</b> (add to
      OData query)</label
    >
  </div>
</div>
<div class="row mt-2 mb-1">
  <div class="col-md-12">
    <button
      class="btn btn-outline-danger btn-sm"
      data-test="throw-page-error-btn"
      onclick={() => {
        mockConfig.pageError = true;
        grid.paginationService.goToLastPage();
      }}>Throw Error Going to Last Page... <i class="mdi mdi-page-last"></i></button
    >
    <span class="ms-2"
      >Programmatically go to first/last page:
      <span class="btn-group ms-1" role="group"
        ><button
          class="btn btn-outline-secondary btn-xs btn-icon px-2"
          aria-label="Go to first page"
          data-test="goto-first-page"
          onclick={() => grid.paginationService.goToFirstPage()}><i class="mdi mdi-page-first"></i></button
        ><button
          class="btn btn-outline-secondary btn-xs btn-icon px-2"
          aria-label="Go to last page"
          data-test="goto-last-page"
          onclick={() => grid.paginationService.goToLastPage()}><i class="mdi mdi-page-last"></i></button
        ></span
      >
    </span>
  </div>
</div>
<SlickgridSvelte
  gridId="grid5"
  {columns}
  {options}
  {dataset}
  {paginationOptions}
  onGridStateChanged={logGridStateChanged}
  onSvelteGridCreated={(instance) => (grid = instance)}
/>
