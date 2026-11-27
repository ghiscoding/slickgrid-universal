<script lang="ts">
  import { format as dateFormatter } from '@formkit/tempo';
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    Aggregators,
    Filters,
    Formatters,
    SlickgridSvelte,
    SortComparers,
    SortDirectionNumber,
    type Column,
    type GridOption,
    type Grouping,
    type Metrics,
    type OnRowCountChangedEventArgs,
    type OnScrollEventArgs,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  const FETCH_SIZE = 50;
  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100, filterable: true },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100, filterable: true, type: 'number' },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      sortable: true,
      minWidth: 100,
      filterable: true,
      type: 'number',
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      type: 'date',
      outputType: 'dateIso',
      formatter: Formatters.date,
      exportWithFormatter: true,
      params: { dateFormat: 'MMM DD, YYYY' },
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      type: 'date',
      outputType: 'dateIso',
      formatter: Formatters.date,
      exportWithFormatter: true,
      params: { dateFormat: 'MMM DD, YYYY' },
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      sortable: true,
      minWidth: 100,
      filterable: true,
      formatter: Formatters.checkmarkMaterial,
    },
  ];
  let gridOptions: GridOption = $state.raw({});
  let dataset: any[] = $state.raw([]);
  let metrics: Partial<Metrics> = $state({});
  let shouldResetOnSort = false;
  let showSubTitle = $state(true);
  let grid: SlickgridSvelteInstance;
  const excelExportService = new ExcelExportService();
  const metricsEndTime = $derived(metrics.endTime ? dateFormatter(metrics.endTime, 'DD MMM, h:mm:ss a') : '');

  function randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function newItem(id: number) {
    return {
      id,
      title: `Task ${id}`,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomNumber(1, 12),
      start: new Date(2020, randomNumber(1, 11), randomNumber(1, 28)),
      finish: new Date(2022, randomNumber(1, 11), randomNumber(1, 28)),
      effortDriven: id % 5 === 0,
    };
  }
  function loadData(startIndex: number, count: number) {
    return Array.from({ length: count }, (_item, index) => newItem(startIndex + index));
  }

  function defineGrid() {
    gridOptions = {
      autoResize: { container: '#demo-container', rightPadding: 10 },
      enableAutoResize: true,
      enableFiltering: true,
      enableGrouping: true,
      editable: false,
      rowHeight: 33,
      enableExcelExport: true,
      externalResources: [excelExportService],
    };
  }

  function handleOnScroll(event: CustomEvent<{ args: OnScrollEventArgs }>) {
    const args = event.detail.args;
    const viewport = args.grid.getViewportNode();
    if (!viewport) {
      return;
    }
    if (
      ['mousewheel', 'scroll'].includes(args.triggeredBy || '') &&
      viewport.scrollTop > 0 &&
      Math.ceil(viewport.offsetHeight + args.scrollTop) >= args.scrollHeight
    ) {
      const startIndex = grid.dataView?.getItemCount() || 0;
      grid.dataView?.addItems(loadData(startIndex, FETCH_SIZE));
    }
  }

  function handleOnSort() {
    if (shouldResetOnSort) {
      const newData = loadData(0, FETCH_SIZE);
      grid.slickGrid?.scrollTo(0);
      grid.dataView?.setItems(newData);
      grid.dataView?.reSort();
    }
  }

  function groupByDuration() {
    grid?.dataView?.setGrouping({
      getter: 'duration',
      formatter: (group) => `Duration: ${group.value} <span class="text-green">(${group.count} items)</span>`,
      comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);
    grid?.slickGrid?.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
    grid?.slickGrid?.invalidate();
  }

  function onSortReset(shouldReset: boolean) {
    shouldResetOnSort = shouldReset;
  }
  function clearAllFiltersAndSorts() {
    grid?.gridService.clearAllFiltersAndSorts();
  }
  function setFiltersDynamically() {
    grid?.filterService.updateFilters([{ columnId: 'start', searchTerms: ['2020-08-25'], operator: '<=' }]);
  }
  function setSortingDynamically() {
    grid?.sortService.updateSorting([{ columnId: 'title', direction: 'DESC' }]);
  }

  function handleOnRowCountChanged(event: CustomEvent<{ args: OnRowCountChangedEventArgs }>) {
    const args = event.detail.args;
    if (grid && args?.current >= 0) {
      grid.dataView?.reSort();
      metrics.itemCount = grid.dataView?.getFilteredItemCount() || 0;
      metrics.totalItemCount = args.itemCount || 0;
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
  dataset = loadData(0, FETCH_SIZE);
  metrics = { itemCount: FETCH_SIZE, totalItemCount: FETCH_SIZE };
  const events = { onRowCountChanged: handleOnRowCountChanged, onSort: handleOnSort, onScroll: handleOnScroll };
</script>

<svelte:head><title>Example 40 - Infinite Scroll from JSON data</title></svelte:head>

<h2>
  Example 40: Infinite Scroll from JSON data
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example40.svelte"
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
        Infinite scrolling allows the grid to lazy-load rows from the server when reaching the scroll bottom (end) position. In its simplest
        form, the more the user scrolls down, the more rows get loaded.
      </li>
      <li>
        NOTES: <code>presets.pagination</code> is not supported with Infinite Scroll and will revert to the first page, simply because since we
        keep appending data, we always have to start from index zero (no offset).
      </li>
    </ul>
  </div>{/if}
<div class="row">
  <div class="col-sm-12">
    <button
      class="btn btn-outline-secondary btn-sm btn-icon"
      data-test="clear-filters-sorting"
      title="Clear all Filters & Sorts"
      onclick={clearAllFiltersAndSorts}
    >
      <span class="mdi mdi-close"></span><span>Clear all Filter & Sorts</span>
    </button>
    <button class="btn btn-outline-secondary btn-sm mx-1" data-test="set-dynamic-filter" onclick={setFiltersDynamically}>
      Set Filters Dynamically
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" onclick={setSortingDynamically}>
      Set Sorting Dynamically
    </button>
    <button class="btn btn-outline-secondary btn-sm mx-1" data-test="group-by-duration" onclick={groupByDuration}>Group by Duration</button>
    <span class="ms-4">Reset Dataset <code>onSort</code>:</span>
    <button class="btn btn-outline-secondary btn-sm mx-1" data-test="onsort-on" onclick={() => onSortReset(true)}>ON</button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="onsort-off" onclick={() => onSortReset(false)}>OFF</button>
  </div>
</div>
<div class="mt-2" style="margin: 10px 0px">
  <b>Metrics:</b><span><span>{metricsEndTime}</span> — <span data-test="totalItemCount">{metrics.totalItemCount ?? 0}</span> items</span>
</div>
<SlickgridSvelte gridId="grid40" {columns} options={gridOptions} {dataset} {events} onSvelteGridCreated={gridReady} />
