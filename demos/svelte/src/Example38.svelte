<script lang="ts">
  import { format as dateFormatter } from '@formkit/tempo';
  import { GridOdataService, type OdataServiceApi } from '@slickgrid-universal/odata';
  import {
    Aggregators,
    Filters,
    SlickgridSvelte,
    SortComparers,
    type Column,
    type GridOption,
    type Grouping,
    type Metrics,
    type OnRowCountChangedEventArgs,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import customerData from './data/customers_100.json';

  const backendService = new GridOdataService();
  const columns: Column[] = [
    { id: 'name', name: 'Name', field: 'name', sortable: true, filterable: true, filter: { model: Filters.compoundInput } },
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
      formatter: (_row, _cell, _value, _column, item) => item.category?.name || '',
    },
  ];

  let gridOptions: GridOption;
  let dataset: any[] = [];
  let metrics: Partial<Metrics> = {};
  let tagDataClass = '';
  let odataQuery = '';
  let processing = false;
  let errorStatus = '';
  let status = { text: 'processing...', class: 'alert alert-danger' };
  let showSubTitle = true;
  let grid: SlickgridSvelteInstance;
  $: metricsEndTime = metrics.endTime ? dateFormatter(metrics.endTime, 'DD MMM, h:mm:ss a') : '';

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
      checkboxSelector: { hideInFilterHeaderRow: false, hideInColumnTitleRow: true },
      enableCellNavigation: true,
      enableFiltering: true,
      enableCheckboxSelector: true,
      enableSelection: true,
      enableGrouping: true,
      backendServiceApi: {
        service: backendService,
        options: { infiniteScroll: { fetchSize: 30 }, enableCount: true, version: 4 },
        onError: (error: Error) => {
          errorStatus = error.message;
          displaySpinner(false, true);
        },
        preProcess: () => {
          errorStatus = '';
          displaySpinner(true);
        },
        process: (query: string) => getCustomerApiCall(query),
        postProcess: (response: any) => {
          metrics = response.metrics;
          displaySpinner(false);
          getCustomerCallback(response);
        },
      } as OdataServiceApi,
    };
  }

  function getCustomerCallback(data: {
    '@odata.count': number;
    infiniteScrollBottomHit: boolean;
    metrics: Metrics;
    query: string;
    value: any[];
  }) {
    metrics.totalItemCount = data['@odata.count'];
    if (!data.infiniteScrollBottomHit) {
      grid?.slickGrid?.scrollTo(0);
      dataset = data.value;
      metrics.itemCount = data.value.length;
    } else {
      grid?.dataView?.addItems(data.value);
    }
    odataQuery = data.query;
  }

  function getCustomerApiCall(query: string) {
    return getCustomerDataApiMock(query);
  }

  function getCustomerDataApiMock(query: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const queryParts = query.split('&');
      const top = Number(query.match(/\$top=(\d+)/)?.[1] ?? 30);
      let skip = Number(query.match(/\$skip=(\d+)/)?.[1] ?? 0);
      const orderBy = query.match(/\$orderby=([^&]+)/)?.[1] ?? '';
      const filter = query.match(/\$filter=(.+)$/)?.[1] ?? '';
      let rows = JSON.parse(JSON.stringify(customerData)) as any[];
      if (orderBy.toLowerCase().includes('company')) {
        reject(new Error('Server could not sort using the field "Company"'));
        return;
      }
      if (filter.toLowerCase().includes('company')) {
        reject(new Error('Server could not filter using the field "Company"'));
        return;
      }

      const genderMatch = filter.match(/Gender\s+eq\s+'([^']+)'/i);
      if (genderMatch) {
        rows = rows.filter((row) => row.gender.toLowerCase() === genderMatch[1].toLowerCase());
      }
      if (orderBy) {
        const [fieldRaw, directionRaw] = orderBy.split(' ');
        const field = fieldRaw.split('/').at(-1)?.toLowerCase() ?? '';
        const direction = directionRaw?.toLowerCase() === 'desc' ? -1 : 1;
        rows.sort((a, b) => direction * String(a[field] ?? a[fieldRaw] ?? '').localeCompare(String(b[field] ?? b[fieldRaw] ?? '')));
      }
      const totalCount = rows.length;
      if (skip > rows.length) {
        query = query.replace(`$skip=${skip}`, '');
        skip = 0;
      }
      const results = rows.slice(skip, skip + top);
      const simulatedError = queryParts.some((part) => part.includes('$top=50000'));
      if (simulatedError) {
        reject(new Error('Server timed out retrieving 50,000 rows'));
        return;
      }
      setTimeout(() => resolve({ query, value: results, '@odata.count': totalCount }), 150);
    });
  }

  function groupByGender() {
    grid?.dataView?.setGrouping({
      getter: 'gender',
      formatter: (group) => `Gender: ${group.value} <span class="text-green">(${group.count} items)</span>`,
      comparer: (a, b) => SortComparers.string(a.value, b.value),
      aggregators: [new Aggregators.Sum('gender')],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);
    grid?.slickGrid?.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
    grid?.slickGrid?.invalidate();
  }

  function clearAllFiltersAndSorts() {
    grid?.gridService.clearAllFiltersAndSorts();
  }
  function setFiltersDynamically() {
    grid?.filterService.updateFilters([{ columnId: 'gender', searchTerms: ['female'] }]);
  }
  function setSortingDynamically() {
    grid?.sortService.updateSorting([{ columnId: 'name', direction: 'DESC' }]);
  }

  function refreshMetrics(event: CustomEvent<{ args: OnRowCountChangedEventArgs }>) {
    if (event.detail.args?.current >= 0) {
      metrics.itemCount = grid.dataView?.getFilteredItemCount() || 0;
      tagDataClass = metrics.itemCount === metrics.totalItemCount ? 'fully-loaded' : 'partial-load';
    }
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

<svelte:head><title>Example 38 - Infinite Scroll with OData</title></svelte:head>

<div class="demo38">
  <h2>
    Example 38: OData (v4) Backend Service with Infinite Scroll
    <span class="float-end"
      ><a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example38.vue"
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
  {#if showSubTitle}<div class="subtitle">
      <ul>
        <li>
          Infinite scrolling lazy-loads server rows as the user reaches the bottom. Rows remain in memory as additional batches are
          appended.
        </li>
        <li>Notes</li>
        <ol>
          <li>
            <code>presets.pagination</code> is not supported with infinite scroll because the grid keeps the loaded rows from index zero.
          </li>
          <li>Pagination works behind the scenes to fetch each next batch.</li>
          <li>Changing sorting or filtering resets the loaded rows to the first batch.</li>
        </ol>
      </ul>
    </div>{/if}

  <div class="row">
    <div class="col-sm-3">
      <div class="alert alert-danger" data-test="error-status" class:hidden={!errorStatus}>
        <em><strong>Backend Error:</strong> <span>{errorStatus}</span></em>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-sm-2">
      <div class={status.class} role="alert" data-test="status">
        <strong>Status: </strong>
        {status.text}<span hidden={!processing}><i class="mdi mdi-sync mdi-spin"></i></span>
      </div>
    </div>
    <div class="col-sm-10">
      <div class="alert alert-info" data-test="alert-odata-query">
        <strong>OData Query:</strong> <span data-test="odata-query-result">{odataQuery}</span>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-sm-12">
      <button
        class="btn btn-outline-secondary btn-sm btn-icon"
        data-test="clear-filters-sorting"
        title="Clear all Filters & Sorts"
        onclick={clearAllFiltersAndSorts}><i class="mdi mdi-filter-remove-outline"></i> Clear all Filter & Sorts</button
      >
      <button class="btn btn-outline-secondary btn-sm mx-1" data-test="set-dynamic-filter" onclick={setFiltersDynamically}
        >Set Filters Dynamically</button
      >
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" onclick={setSortingDynamically}
        >Set Sorting Dynamically</button
      >
      <button class="btn btn-outline-secondary btn-sm mx-1" data-test="group-by-gender" onclick={groupByGender}>Group by Gender</button>
      <div class="mt-2" style="margin: 10px 0px">
        <b>Metrics:</b><span
          ><span>{metricsEndTime}</span> — <span data-test="itemCount">{metrics.itemCount ?? 0}</span> of
          <span data-test="totalItemCount">{metrics.totalItemCount ?? 0}</span> items</span
        ><span class={'badge rounded-pill text-bg-primary ' + tagDataClass} data-test="data-loaded-tag">All Data Loaded!!!</span>
      </div>
    </div>
  </div>
  <SlickgridSvelte gridId="grid38" {columns} options={gridOptions} {dataset} {events} onSvelteGridCreated={gridReady} />
</div>

<style>
  :global(.demo38 .badge) {
    display: none;
  }
  :global(.demo38 .badge.fully-loaded) {
    display: inline-flex;
  }
</style>
