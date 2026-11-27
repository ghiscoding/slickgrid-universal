<script lang="ts">
  import { SvelteRowDetailView } from '@slickgrid-universal/svelte-row-detail-plugin';
  import {
    Aggregators,
    Editors,
    Filters,
    Formatters,
    GroupTotalFormatters,
    SlickgridSvelte,
    SortComparers,
    SortDirectionNumber,
    type Column,
    type GridOption,
    type Grouping,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { onDestroy } from 'svelte';
  import Example47Detail from './Example47Detail.svelte';
  import ExampleDetailPreload from './ExampleDetailPreload.svelte';

  interface Item {
    id: number;
    title: string;
    duration: number;
    cost: number;
    percentComplete: number;
    start: Date;
    finish: Date;
    effortDriven: boolean;
  }

  const FAKE_SERVER_DELAY = 250;
  const NB_ITEMS = 1200;
  let detailViewRowCount = $state(9);
  let isDarkMode = false;
  let showSubTitle = $state(true);
  let serverWaitDelay = $state(FAKE_SERVER_DELAY); // server simulation with default of 250ms but 50ms for Cypress tests
  let grid: SlickgridSvelteInstance;
  let rowDetailInstance: any;

  const columns = defineColumns();
  let gridOptions = $state.raw<GridOption>(defineGridOptions());
  let dataset = $state.raw<Item[]>(getData(NB_ITEMS));

  onDestroy(() => {
    document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
    document.querySelector<HTMLElement>('#demo-container')?.setAttribute('data-bs-theme', 'light');
  });

  function defineColumns(): Column<Item>[] {
    return [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
        width: 70,
        filterable: true,
        editor: { model: Editors.text },
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        type: 'number',
        minWidth: 90,
        filterable: true,
      },
      {
        id: '%',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 200,
        width: 250,
        resizable: false,
        filterable: true,
        sortable: true,
        type: 'number',
        formatter: Formatters.percentCompleteBar,
        groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
        params: { groupFormatterPrefix: '<i>Avg</i>: ' },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
        minWidth: 90,
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
        minWidth: 90,
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'cost',
        name: 'Cost',
        field: 'cost',
        minWidth: 70,
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
        type: 'number',
        formatter: Formatters.dollar,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        minWidth: 100,
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
        filterable: true,
        sortable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,
        },
      },
    ];
  }

  function defineGridOptions(): GridOption {
    return {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableGrouping: true,
      enableRowDetailView: true,
      darkMode: isDarkMode,
      externalResources: [SvelteRowDetailView],
      rowDetailView: {
        // We can load the "process" asynchronously in 2 different ways (Fetch OR Promise)
        process: (item: any) => simulateServerAsyncCall(item),
        // process: (item) => this.http.get(`api/item/${item.id}`),

        // load only once and reuse the same item detail without calling process method
        loadOnce: true,

        // limit expanded row to only 1 at a time
        singleRowExpand: false,

        // how many grid rows do we want to use for the row detail panel (this is only set once and will be used for all row detail)
        // also note that the detail view adds an extra 1 row for padding purposes
        // so if you choose 4 panelRows, the display will in fact use 5 rows
        panelRows: detailViewRowCount,

        // Preload View Template
        preloadComponent: ExampleDetailPreload,

        // ViewModel Template to load when row detail data is ready
        viewComponent: Example47Detail as any,
      },
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: true,
      },
    };
  }

  function getData(count: number) {
    // mock a dataset
    const tmpData: Item[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = Math.round(Math.random() * 10000) / 100;

      tmpData[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.floor(Math.random() * 100),
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        cost: i % 3 ? randomCost : -randomCost,
        effortDriven: i % 5 === 0,
      };
    }

    return tmpData;
  }

  function changeDetailViewRowCount() {
    const options = rowDetailInstance.getOptions();
    if (options && options.panelRows) {
      options.panelRows = detailViewRowCount; // change number of rows dynamically
      rowDetailInstance.setOptions(options);
    }
  }

  function closeAllRowDetail() {
    rowDetailInstance.collapseAll();
  }

  function clearGrouping() {
    grid.dataView.setGrouping([]);
  }

  function collapseAllGroups() {
    grid.dataView.collapseAllGroups();
  }

  function expandAllGroups() {
    grid.dataView.expandAllGroups();
  }

  function groupByDuration() {
    // you need to manually add the sort icon(s) in UI
    grid.filterService.setSortColumnIcons([{ columnId: 'duration', sortAsc: true }]);
    grid.dataView.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      comparer: (a, b) => {
        return SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc);
      },
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);
    grid.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  function groupByDurationEffortDriven() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
    ];
    grid.filterService.setSortColumnIcons(sortColumns);
    grid.dataView.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true,
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${g.value ? 'True' : 'False'} <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
        collapsed: true,
        lazyTotalsCalculation: true,
      },
    ] as Grouping[]);
    grid.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  /** Just for demo purposes, we will simulate an async server call and return more details on the selected row item */
  function simulateServerAsyncCall(item: any) {
    // random set of names to use for more item detail
    const randomNames = [
      'John Doe',
      'Jane Doe',
      'Chuck Norris',
      'Bumblebee',
      'Jackie Chan',
      'Elvis Presley',
      'Bob Marley',
      'Mohammed Ali',
      'Bruce Lee',
      'Rocky Balboa',
    ];

    // fill the template on async delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const itemDetail = item;

        // let's add some extra properties to our item for a better async simulation
        itemDetail.assignee = randomNames[randomNumber(0, 9)] || '';
        itemDetail.reporter = randomNames[randomNumber(0, 9)] || '';

        // resolve the data after delay specified
        resolve(itemDetail);
      }, serverWaitDelay);
    });
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    toggleBodyBackground();
    grid.slickGrid?.setOptions({ darkMode: isDarkMode });
    closeAllRowDetail();
  }

  function toggleBodyBackground() {
    if (isDarkMode) {
      document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
    } else {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    }
  }

  function randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid.resizerService.resizeGrid(0));
  }

  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
    rowDetailInstance = instance.extensionService.getExtensionInstanceByName('rowDetailView');
    groupByDuration(); // group by duration on page load
  }
</script>

<svelte:head><title>Example 47 - Row Detail View + Grouping</title></svelte:head>

<h2>
  Example 47: Row Detail View + Grouping
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example47.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
  <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="toggle-dark-mode" onclick={toggleDarkMode}>
    <span class="mdi mdi-theme-light-dark"></span><span>Toggle Dark Mode</span>
  </button>
</h2>
{#if showSubTitle}<div class="subtitle">
    Provide ability for Row Detail to work with Grouping, see (<a
      href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/row-detail"
      target="_blank"
    >
      Wiki docs
    </a>)
  </div>{/if}
<div class="row">
  <div class="col-sm-12 d-flex gap-1 align-items-center flex-wrap">
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="collapse-all-rowdetail-btn" onclick={closeAllRowDetail}>
      Close all Row Details
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-grouping-btn" onclick={clearGrouping}>
      <i class="mdi mdi-close"></i> Clear grouping
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="collapse-all-groups-btn" onclick={collapseAllGroups}>
      <i class="mdi mdi-arrow-collapse"></i> Collapse all groups
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="expand-all-groups-btn" onclick={expandAllGroups}>
      <i class="mdi mdi-arrow-expand"></i> Expand all groups
    </button>
    <label for="detailViewRowCount">Detail View Rows Shown: </label><input
      id="detailViewRowCount"
      bind:value={detailViewRowCount}
      type="number"
      style="height: 26px; width: 40px"
    />
    <button
      class="btn btn-outline-secondary btn-sm btn-icon"
      style="height: 26px"
      data-test="set-count-btn"
      onclick={changeDetailViewRowCount}
    >
      Set
    </button>
    <label for="serverdelay" class="ms-2">Server Delay: </label><input
      id="serverdelay"
      bind:value={serverWaitDelay}
      type="number"
      data-test="server-delay"
      style="height: 26px; width: 55px"
      title="input a fake timer delay to simulate slow server response"
    />
  </div>
  <div class="col-sm-12 d-flex gap-1">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="group-duration-sort-value-btn" onclick={groupByDuration}>
      Group by Duration
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="group-duration-effort-btn" onclick={groupByDurationEffortDriven}>
      Group by Duration then Effort-Driven
    </button>
  </div>
</div>
<hr />
<SlickgridSvelte gridId="grid47" options={gridOptions} {columns} {dataset} onSvelteGridCreated={gridReady} />
