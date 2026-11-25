<script lang="ts">
  import { GraphqlService, type GraphqlServiceApi, type GraphqlServiceOption } from '@slickgrid-universal/graphql';
  import { Filters, Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { i18n } from './data/i18n.js';

  let grid: SlickgridSvelteInstance;
  let showSubTitle = true;
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => {
      grid?.resizerService?.resizeGrid();
    });
  }
  let query = '';
  let status = '';
  let processing = false;
  let serverDelay = 250;
  let state = '';
  let useCursor = false;
  let language = 'en';
  void i18n.changeLanguage('en');
  const currentYear = new Date().getFullYear();
  const presetLowestDay = `${currentYear}-01-01`;
  const presetHighestDay = `${currentYear}-02-15`;
  function formatLocalDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  const columns: Column[] = [
    {
      id: 'name',
      name: 'Name',
      nameKey: 'NAME',
      field: 'name',
      width: 60,
      sortable: true,
      filterable: true,
      columnGroupKey: 'CUSTOMER_INFORMATION',
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
      nameKey: 'GENDER',
      field: 'gender',
      width: 60,
      sortable: true,
      filterable: true,
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
      name: 'Company',
      nameKey: 'COMPANY',
      field: 'company',
      width: 60,
      sortable: true,
      filterable: true,
      columnGroupKey: 'CUSTOMER_INFORMATION',
      filter: {
        model: Filters.multipleSelect,
        collection: [
          { value: 'acme', label: 'Acme' },
          { value: 'abc', label: 'Company ABC' },
          { value: 'xyz', label: 'Company XYZ', labelKey: 'COMPANY_XYZ' },
        ],
        options: { filter: true },
      },
    },
    {
      id: 'billingAddressStreet',
      name: 'Billing Street',
      nameKey: 'BILLING.ADDRESS.STREET',
      field: 'billing.address.street',
      width: 60,
      sortable: true,
      filterable: true,
      columnGroupKey: 'BILLING.INFORMATION',
    },
    {
      id: 'billingAddressZip',
      name: 'Billing Zip',
      nameKey: 'BILLING.ADDRESS.ZIP',
      field: 'billing.address.zip',
      width: 60,
      type: 'number',
      sortable: true,
      filterable: true,
      columnGroupKey: 'BILLING.INFORMATION',
      filter: { model: Filters.compoundInput },
      formatter: Formatters.multiple,
      params: { formatters: [Formatters.complexObject, Formatters.translate] },
    },
    {
      id: 'finish',
      name: 'Date',
      field: 'finish',
      sortable: true,
      filterable: true,
      formatter: Formatters.dateIso,
      type: 'date',
      columnGroupKey: 'BILLING.INFORMATION',
      filter: {
        model: Filters.dateRange,
        filterShortcuts: [
          {
            titleKey: 'NEXT_20_DAYS',
            iconCssClass: 'mdi mdi-calendar',
            searchTerms: [formatLocalDate(new Date()), formatLocalDate(addDays(new Date(), 20))],
          },
        ],
      },
    },
  ];
  const backend: GraphqlServiceApi = {
    service: new GraphqlService(),
    options: {
      datasetName: 'users',
      useCursor: false,
      addLocaleIntoQuery: true,
      extraQueryArguments: [{ field: 'userId', value: 123 }],
      keepArgumentFieldDoubleQuotes: true,
      filterQueryOverride: ({ fieldName, columnDef, columnFilterOperator, searchValues }) =>
        columnFilterOperator === 'Custom' && columnDef?.id === 'name'
          ? { field: fieldName, operator: 'Like', value: searchValues[0] }
          : undefined,
    },
    preProcess: () => {
      processing = true;
      status = 'processing...';
    },
    process: async (request: string) => {
      query = request;
      const pageNumber = grid?.paginationService ? grid.paginationService.getCurrentPageNumber() : 1;
      const startCursor = String.fromCharCode('A'.charCodeAt(0) + pageNumber - 1);
      const pageInfo = {
        hasPreviousPage: grid?.paginationService?.dataFrom === 0,
        hasNextPage: grid?.paginationService?.dataTo === 100,
        startCursor,
        endCursor: String.fromCharCode(startCursor.charCodeAt(0) + 1),
      };
      await new Promise((resolve) => setTimeout(resolve, serverDelay));
      if (useCursor && grid?.paginationService) {
        grid.paginationService.setCursorPageInfo(pageInfo);
      }
      return { data: { users: { nodes: [], totalCount: 100, pageInfo } } };
    },
    postProcess: () => {
      status = 'finished';
      processing = false;
    },
    onError: (error: Error) => {
      status = error.message;
      processing = false;
    },
  };
  const options: GridOption = {
    enableAutoResize: false,
    gridHeight: 200,
    gridWidth: 900,
    compoundOperatorAltTexts: { text: { Custom: { operatorAlt: '%%', descAlt: 'SQL Like' } } },
    enableFiltering: true,
    enableSorting: true,
    enableCellNavigation: true,
    enableTranslate: true,
    i18n,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    enablePagination: true,
    pagination: { pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100], pageSize: 20, totalItems: 0 },
    gridMenu: {
      resizeOnShowHeaderRow: true,
      commandItems: [{ iconCssClass: 'mdi mdi-close text-danger', title: 'Reset Grid', command: 'reset-grid' }],
      onCommand: (_event, args) => {
        if (args.command === 'reset-grid') {
          grid.gridService.resetGrid(columns);
        }
      },
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
        { columnId: 'gender', searchTerms: ['male'], operator: '=' },
        { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
        { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },
        { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
      ],
      sorters: [
        { columnId: 'name', direction: 'asc' },
        { columnId: 'company', direction: 'DESC' },
      ],
      pagination: { pageNumber: 2, pageSize: 20 },
    },
    backendServiceApi: backend,
  };
  function changePagination() {
    grid.backendService?.updateOptions({ useCursor } as Partial<GraphqlServiceOption>);
    grid.paginationService.setCursorBased(useCursor);
    grid.paginationService.goToFirstPage();
  }
  async function switchLanguage() {
    language = language === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(language);
  }
  function setFilters() {
    void grid.filterService.updateFilters([
      { columnId: 'gender', searchTerms: ['female'], operator: '=' },
      { columnId: 'name', searchTerms: ['Jane'], operator: 'StartsWith' },
      { columnId: 'company', searchTerms: ['acme'], operator: 'IN' },
      { columnId: 'billingAddressZip', searchTerms: ['11'], operator: '>=' },
      { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
    ]);
  }
  function setSorting() {
    grid.sortService.updateSorting([
      { columnId: 'billingAddressZip', direction: 'DESC' },
      { columnId: 'company', direction: 'ASC' },
    ]);
  }
  function resetPresets() {
    void grid.filterService.updateFilters(options.presets!.filters!);
    grid.sortService.updateSorting(options.presets!.sorters!);
    setTimeout(() => {
      grid.paginationService.changeItemPerPage(20);
      grid.paginationService.goToPageNumber(2);
    });
  }
</script>

<h2>
  Example 6: Grid with Backend GraphQL Service<span class="float-end fs-6"
    ><a
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example06.svelte"
      target="_blank"
      rel="noreferrer"><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
</h2>
{#if showSubTitle}<p class="subtitle">Sorting/Paging connected to a Backend GraphQL Service.</p>{/if}
<div class="row">
  <div class="col-sm-5">
    <div class:alert-warning={processing} class:alert-success={!processing} class="alert" role="alert" data-test="status">
      <strong>Status:</strong>
      {status}
      {#if processing}<i class="mdi mdi-sync mdi-spin"></i>{/if}
    </div>
    <div class="d-flex flex-wrap gap-1">
      <button
        class="btn btn-outline-secondary btn-sm btn-icon"
        data-test="clear-filters-sorting"
        onclick={() => grid.gridService.clearAllFiltersAndSorts()}
        ><i class="mdi mdi-filter-remove-outline"></i> Clear all Filter &amp; Sorts</button
      >
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-filter" onclick={setFilters}
        >Set Filters Dynamically</button
      >
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" onclick={setSorting}
        >Set Sorting Dynamically</button
      >
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="reset-presets" onclick={resetPresets}
        >Reset Original Presets</button
      >
      <label>Server Delay: <input type="number" min="0" style="width: 65px" data-test="server-delay" bind:value={serverDelay} /></label>
    </div>
    <hr />
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="language-button" onclick={switchLanguage}
      ><i class="mdi mdi-translate"></i> Switch Language</button
    >
    <span class="ms-2"><b>Locale:</b> <span data-test="selected-locale">{language}.json</span></span>
    <div>
      Pagination strategy:
      <label class="ms-1"
        ><input
          type="radio"
          name="graphql-pagination"
          value={false}
          bind:group={useCursor}
          onchange={changePagination}
          data-test="offset"
        /> Offset</label
      >
      <label class="ms-1"
        ><input type="radio" name="graphql-pagination" value={true} bind:group={useCursor} onchange={changePagination} data-test="cursor" /> Cursor</label
      >
    </div>
    <div class="mb-1">
      Programmatically go to first/last page:
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
    </div>
  </div>
  <div class="col-sm-7">
    <div class="alert alert-info" data-test="alert-graphql-query">
      <strong>GraphQL Query:</strong> <span data-test="graphql-query-result">{query}</span>
    </div>
  </div>
</div>
{#if state}<pre class="border p-2">{state}</pre>{/if}
<SlickgridSvelte
  gridId="grid6"
  {columns}
  {options}
  onGridStateChanged={(event) => console.log('GraphQL Example, Grid State changed:: ', event.detail)}
  onSvelteGridCreated={(instance) => (grid = instance)}
/>
