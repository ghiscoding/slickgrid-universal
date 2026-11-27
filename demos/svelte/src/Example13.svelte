<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { PdfExportService } from '@slickgrid-universal/pdf-export';
  import { TextExportService } from '@slickgrid-universal/text-export';
  import {
    Aggregators,
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
  import { tick } from 'svelte';

  const NB_ITEMS = 5000;
  let dataset = $state.raw<any[]>([]);
  let showSubTitle = $state(true);
  let processing = $state(false);
  const excelExportService = new ExcelExportService();
  const pdfExportService = new PdfExportService();
  const textExportService = new TextExportService();
  let svelteGrid!: SlickgridSvelteInstance;

  /* Define grid Options and Columns */
  // add a simple button with event listener on 1st column for testing purposes
  // a simple button with click event
  const nameElementColumn1 = document.createElement('div');
  const btn = document.createElement('button');
  const btnLabel = document.createElement('span');
  btnLabel.className = 'mdi mdi-help-circle no-padding';
  btn.dataset.test = 'col1-hello-btn';
  btn.className = 'btn btn-outline-secondary btn-xs btn-icon ms-1';
  btn.textContent = 'Click me';
  btn.title = 'simple column header test with a button click listener';
  btn.addEventListener('click', () => alert('Hello World'));
  btn.appendChild(btnLabel);
  nameElementColumn1.appendChild(document.createTextNode('Id '));
  nameElementColumn1.appendChild(btn);

  const columns: Column[] = [
    {
      id: 'num',
      name: nameElementColumn1,
      field: 'num',
      type: 'number',
      columnPickerLabel: 'Custom Label', // add a custom label for the ColumnPicker/GridMenu when default header value extractor doesn't work for you ()
      width: 140,
      maxWidth: 150,
      excludeFromExport: true,
      resizable: true,
      filterable: true,
      selectable: false,
    },
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      width: 50,
      minWidth: 50,
      cssClass: 'cell-title',
      filterable: true,
      sortable: true,
    },
    {
      id: 'duration',
      name: 'Duration',
      field: 'duration',
      minWidth: 50,
      width: 60,
      filterable: true,
      filter: { model: Filters.slider, operator: '>=' },
      sortable: true,
      type: 'number',
      groupTotalsFormatter: GroupTotalFormatters.sumTotals,
      params: { groupFormatterPrefix: 'Total: ' },
    },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      minWidth: 70,
      width: 90,
      formatter: Formatters.percentCompleteBar,
      filterable: true,
      filter: { model: Filters.compoundSlider },
      sortable: true,
      type: 'number',
      groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
      params: { groupFormatterPrefix: '<i>Avg</i>: ' },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      minWidth: 60,
      maxWidth: 130,
      filterable: true,
      filter: { model: Filters.compoundDate },
      sortable: true,
      type: 'dateIso',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      minWidth: 60,
      maxWidth: 130,
      filterable: true,
      filter: { model: Filters.compoundDate },
      sortable: true,
      type: 'dateIso',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
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
      formatter: Formatters.currency,
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsCurrency,
      params: {
        displayNegativeNumberWithParentheses: true,
        currencyPrefix: '€',
        groupFormatterCurrencyPrefix: '€',
        minDecimal: 2,
        maxDecimal: 4,
        groupFormatterPrefix: '<b>Total</b>: ',
      },
      excelExportOptions: {
        style: {
          font: { outline: false, italic: true },
          format: '€0.00##;[Red](€0.00##)',
        },
        width: 18,
      },
      groupTotalsExcelExportOptions: {
        style: {
          alignment: { horizontal: 'center' },
          font: { bold: true, color: 'FF005289', underline: 'single', fontName: 'Consolas', size: 10 },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'FFE6F2F6' },
          border: {
            top: { color: 'FFa500ff', style: 'thick' },
            left: { color: 'FFa500ff', style: 'medium' },
            right: { color: 'FFa500ff', style: 'dotted' },
            bottom: { color: 'FFa500ff', style: 'double' },
          },
          format: '"Total: "€0.00##;[Red]"Total: "(€0.00##)',
        },
      },
    },
    {
      id: 'effortDriven',
      name: 'Effort Driven',
      minWidth: 30,
      width: 80,
      maxWidth: 90,
      cssClass: 'cell-effort-driven',
      field: 'effortDriven',
      formatter: Formatters.checkmarkMaterial,
      sortable: true,
      filterable: true,
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

  const gridOptions: GridOption = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableFiltering: true,
    // you could debounce/throttle the input text filter if you have lots of data
    // filterTypingDebounce: 250,
    enableGrouping: true,
    groupItemMetadataOption: {
      toggleOnNodeTitle: true, // enable toggle of group by clicking on the toggle icon or its title (not just the toggle icon)
    },
    enableExcelExport: true,
    enableTextExport: true,
    excelExportOptions: { sanitizeDataExport: true },
    textExportOptions: { sanitizeDataExport: true },
    externalResources: [excelExportService, pdfExportService, textExportService],
    showCustomFooter: true,
    customFooterOptions: {
      // optionally display some text on the left footer container
      hideMetrics: false,
      hideTotalItemCount: false,
      hideLastUpdateTimestamp: false,
    },
    enablePdfExport: true,
    pdfExportOptions: {
      repeatHeadersOnEachPage: false,
      sanitizeDataExport: true,
      documentTitle: 'Grouping Grid',
    },
  };

  // mock some data
  loadData(NB_ITEMS);

  function loadData(count: number) {
    // mock a dataset
    const tmpData: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = i % 33 === 0 ? null : Math.round(Math.random() * 10000) / 100;

      tmpData[i] = {
        id: 'id_' + i,
        num: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        cost: i % 3 ? randomCost : randomCost !== null ? -randomCost : null,
        effortDriven: i % 5 === 0,
      };
    }
    dataset = tmpData;
  }

  function clearGrouping() {
    svelteGrid.dataView.setGrouping([]);
  }

  function clearFilters() {
    svelteGrid.filterService.clearFilters();
  }

  function collapseAllGroups() {
    svelteGrid.dataView.collapseAllGroups();
  }

  function expandAllGroups() {
    svelteGrid.dataView.expandAllGroups();
  }

  function exportToExcel() {
    excelExportService.exportToExcel({
      filename: 'Export',
      format: 'xlsx',
    });
  }

  function exportToPdf() {
    pdfExportService.exportToPdf({ filename: 'Export' });
  }

  function groupByDuration() {
    // you need to manually add the sort icon(s) in UI
    svelteGrid.filterService.setSortColumnIcons([{ columnId: 'duration', sortAsc: true }]);
    svelteGrid.dataView.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      comparer: (a, b) => {
        return SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc);
      },
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);
    svelteGrid.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  function groupByDurationOrderByCount(aggregateCollapsed: boolean) {
    svelteGrid.filterService.setSortColumnIcons([]);
    svelteGrid.dataView.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      comparer: (a, b) => {
        return a.count - b.count;
      },
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed,
      lazyTotalsCalculation: true,
    } as Grouping);
    svelteGrid.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  function groupByDurationEffortDriven() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
    ];
    svelteGrid.filterService.setSortColumnIcons(sortColumns);
    svelteGrid.dataView.setGrouping([
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
    svelteGrid.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  function groupByDurationEffortDrivenPercent() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
      { columnId: 'percentComplete', sortAsc: true },
    ];
    svelteGrid.filterService.setSortColumnIcons(sortColumns);
    svelteGrid.dataView.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true,
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${g.value ? 'True' : 'False'}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        lazyTotalsCalculation: true,
      },
      {
        getter: 'percentComplete',
        formatter: (g) => `% Complete: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Avg('percentComplete')],
        aggregateCollapsed: true,
        collapsed: true,
        lazyTotalsCalculation: true,
      },
    ] as Grouping[]);
    svelteGrid.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    svelteGrid.resizerService.resizeGrid();
  }

  function svelteGridReady(grid: SlickgridSvelteInstance) {
    svelteGrid = grid;
    groupByDuration(); // group by duration on page load
  }
</script>

<h2>
  Example 13: Grouping &amp; Aggregators
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example13.svelte"
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

{#if showSubTitle}
  <div class="subtitle">
    <ul>
      <li>
        <a href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/grouping-aggregators" target="_blank" rel="noreferrer">
          Wiki docs
        </a>
      </li>
      <li>Fully dynamic and interactive multi-level grouping with filtering and aggregates over 50'000 items</li>
      <li>Each grouping level can have its own aggregates (over child rows, child groups, or all descendant rows)..</li>
      <li>Use "Aggregators" and "GroupTotalFormatters" directly from Slickgrid-Svelte</li>
    </ul>
  </div>
{/if}

<div class="row">
  <div class="col-sm-12">
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="add-5k-rows-btn" onclick={() => loadData(5000)}>5K rows</button>
    <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="add-50k-rows-btn" onclick={() => loadData(50000)}>
      50K rows
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="clear-grouping-btn" onclick={clearGrouping}>
      <i class="mdi mdi-close"></i> Clear Grouping
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="clear-filter-btn" onclick={clearFilters}>
      <i class="mdi mdi-close"></i> Clear Filters
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="collapse-all-btn" onclick={collapseAllGroups}>
      <i class="mdi mdi-arrow-collapse"></i> Collapse all groups
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="expand-all-btn" onclick={expandAllGroups}>
      <i class="mdi mdi-arrow-expand"></i> Expand all groups
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="export-excel-btn" onclick={exportToExcel}>
      <i class="mdi mdi-file-excel-outline text-success"></i> Export to Excel
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="export-pdf-btn" onclick={exportToPdf}>
      <i class="mdi mdi-file-pdf-outline text-danger"></i> Export to PDF
    </button>
  </div>
</div>

<hr />

<div class="row mb-2">
  <div class="col-sm-12">
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="group-duration-sort-value-btn" onclick={groupByDuration}>
      Group by Duration &amp; sort groups by value
    </button>
    <button
      class="btn btn-outline-secondary btn-xs btn-icon mx-1"
      data-test="group-duration-sort-count-btn"
      onclick={() => groupByDurationOrderByCount(false)}
    >
      Group by Duration &amp; sort groups by count
    </button>
  </div>
  <div class="row">
    <div class="col-sm-12">
      <button
        class="btn btn-outline-secondary btn-xs btn-icon"
        data-test="group-duration-sort-count-collapse-btn"
        onclick={() => groupByDurationOrderByCount(true)}
      >
        Group by Duration &amp; sort groups by count, aggregate collapsed
      </button>
      <button
        class="btn btn-outline-secondary btn-xs btn-icon mx-1"
        data-test="group-duration-effort-btn"
        onclick={groupByDurationEffortDriven}
      >
        Group by Duration then Effort-Driven
      </button>
      <button
        class="btn btn-outline-secondary btn-xs btn-icon"
        data-test="group-duration-effort-percent-btn"
        onclick={groupByDurationEffortDrivenPercent}
      >
        Group by Duration then Effort-Driven then Percent.
      </button>
      <span hidden={!processing}>
        <i class="mdi mdi-sync mdi-spin"></i>
      </span>
    </div>
  </div>
</div>

<SlickgridSvelte
  gridId="grid13"
  {columns}
  options={gridOptions}
  {dataset}
  onBeforeExportToExcel={() => (processing = true)}
  onAfterExportToExcel={() => (processing = false)}
  onBeforeExportToPdf={() => (processing = true)}
  onAfterExportToPdf={() => (processing = false)}
  onSvelteGridCreated={(instance) => svelteGridReady(instance)}
/>

<style>
  :global(.slick-column-name .btn:focus) {
    outline: 2px solid rgba(53, 53, 53, 0.5);
  }
</style>
