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

  const excelExportService = new ExcelExportService();
  const pdfExportService = new PdfExportService();
  const textExportService = new TextExportService();
  let grid: SlickgridSvelteInstance;
  let dataset: any[] = [];
  let processing = false;
  let showSubTitle = true;

  const headerName = document.createElement('div');
  const headerButton = document.createElement('button');
  const headerIcon = document.createElement('span');
  headerName.append(document.createTextNode('Id '));
  headerIcon.className = 'mdi mdi-help-circle no-padding';
  headerButton.dataset.test = 'col1-hello-btn';
  headerButton.className = 'btn btn-outline-secondary btn-xs btn-icon ms-1';
  headerButton.title = 'simple column header test with a button click listener';
  headerButton.append('Click me', headerIcon);
  headerButton.addEventListener('click', () => alert('Hello World'));
  headerName.append(headerButton);

  const columns: Column[] = [
    {
      id: 'num',
      name: headerName,
      field: 'num',
      type: 'number',
      columnPickerLabel: 'Custom Label',
      width: 140,
      maxWidth: 150,
      excludeFromExport: true,
      resizable: true,
      filterable: true,
      selectable: false,
    },
    { id: 'title', name: 'Title', field: 'title', width: 50, minWidth: 50, cssClass: 'cell-title', filterable: true, sortable: true },
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
      id: '%',
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
      excelExportOptions: { style: { font: { outline: false, italic: true }, format: '€0.00##;[Red](€0.00##)' }, width: 18 },
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
      id: 'effort-driven',
      name: 'Effort Driven',
      minWidth: 20,
      width: 80,
      maxWidth: 80,
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

  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableExcelExport: true,
    enableFiltering: true,
    enableGrouping: true,
    groupItemMetadataOption: { toggleOnNodeTitle: true },
    enableTextExport: true,
    gridMenu: { hideCommands: ['toggle-dark-mode'] },
    excelExportOptions: { sanitizeDataExport: true },
    textExportOptions: { sanitizeDataExport: true },
    externalResources: [excelExportService, pdfExportService, textExportService],
    showCustomFooter: true,
    customFooterOptions: { hideMetrics: false, hideTotalItemCount: false, hideLastUpdateTimestamp: false },
    enablePdfExport: true,
    pdfExportOptions: { repeatHeadersOnEachPage: false, sanitizeDataExport: true, documentTitle: 'Grouping Grid' },
  };

  const eventHandlers = {
    onBeforeExportToExcel: () => (processing = true),
    onAfterExportToExcel: () => (processing = false),
    onBeforeExportToPdf: () => (processing = true),
    onAfterExportToPdf: () => (processing = false),
    onBeforeExportToTextFile: () => (processing = true),
    onAfterExportToTextFile: () => (processing = false),
  };

  function loadData(rowCount: number) {
    dataset = Array.from({ length: rowCount }, (_value, i) => {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = i % 33 === 0 ? null : Math.round(Math.random() * 10000) / 100;
      return {
        id: `id_${i}`,
        num: i,
        title: `Task ${i}`,
        duration: `${Math.round(Math.random() * 100)}`,
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        cost: i % 3 ? randomCost : randomCost !== null ? -randomCost : null,
        effortDriven: i % 5 === 0,
      };
    });
  }

  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
    groupByDuration();
  }

  function groupByDuration() {
    grid.filterService.setSortColumnIcons([{ columnId: 'duration', sortAsc: true }]);
    grid.dataView.setGrouping({
      getter: 'duration',
      formatter: (group) => `Duration: ${group.value} <span style="color:green">(${group.count} items)</span>`,
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);
    grid.slickGrid.invalidate();
  }

  function groupByDurationOrderByCount(aggregateCollapsed: boolean) {
    grid.filterService.setSortColumnIcons([]);
    grid.dataView.setGrouping({
      getter: 'duration',
      formatter: (group) => `Duration: ${group.value} <span style="color:green">(${group.count} items)</span>`,
      comparer: (a, b) => a.count - b.count,
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed,
      lazyTotalsCalculation: true,
    } as Grouping);
    grid.slickGrid.invalidate();
  }

  function groupByDurationEffortDriven() {
    grid.filterService.setSortColumnIcons([
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
    ]);
    grid.dataView.setGrouping([
      {
        getter: 'duration',
        formatter: (group) => `Duration: ${group.value} <span style="color:green">(${group.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true,
      },
      {
        getter: 'effortDriven',
        formatter: (group) => `Effort-Driven: ${group.value ? 'True' : 'False'} <span style="color:green">(${group.count} items)</span>`,
        aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
        collapsed: true,
        lazyTotalsCalculation: true,
      },
    ] as Grouping[]);
    grid.slickGrid.invalidate();
  }

  function groupByDurationEffortDrivenPercent() {
    grid.filterService.setSortColumnIcons([
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
      { columnId: 'percentComplete', sortAsc: true },
    ]);
    grid.dataView.setGrouping([
      {
        getter: 'duration',
        formatter: (group) => `Duration: ${group.value} <span style="color:green">(${group.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true,
      },
      {
        getter: 'effortDriven',
        formatter: (group) => `Effort-Driven: ${group.value ? 'True' : 'False'} <span style="color:green">(${group.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        lazyTotalsCalculation: true,
      },
      {
        getter: 'percentComplete',
        formatter: (group) => `% Complete: ${group.value} <span style="color:green">(${group.count} items)</span>`,
        aggregators: [new Aggregators.Avg('percentComplete')],
        aggregateCollapsed: true,
        collapsed: true,
        lazyTotalsCalculation: true,
      },
    ] as Grouping[]);
    grid.slickGrid.invalidate();
  }

  function clearGrouping() {
    grid.dataView.setGrouping([]);
  }
  function clearFilters() {
    grid.filterService.clearFilters();
  }
  function exportToExcel() {
    excelExportService.exportToExcel({ filename: 'Export', format: 'xlsx' });
  }
  function exportToPdf() {
    pdfExportService.exportToPdf({ filename: 'Export' });
  }
  function exportToFile(type: 'csv' | 'txt' = 'csv') {
    textExportService.exportToFile({ delimiter: type === 'csv' ? ',' : '\t', filename: 'myExport', format: type });
  }
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    grid?.resizerService.resizeGrid(0);
  }

  loadData(5000);
</script>

<h2>
  Example 13: Grouping &amp; Aggregators
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/demos/examples/example13.component.ts"
      ><span class="mdi mdi-link-variant"></span> code</a
    >
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
</h2>

{#if showSubTitle}
  <div class="subtitle">
    (<a
      href="https://ghiscoding.gitbook.io/angular-slickgrid/grid-functionalities/grouping-and-aggregators"
      target="_blank"
      rel="noreferrer">Wiki docs</a
    >)
    <ul>
      <li>Fully dynamic and interactive multi-level grouping with filtering and aggregates over 50'000 items</li>
      <li>Each grouping level can have its own aggregates (over child rows, child groups, or all descendant rows).</li>
    </ul>
  </div>
{/if}

<div class="row">
  <div class="col-sm-12">
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="add-5k-rows-btn" onclick={() => loadData(5000)}>5K rows</button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="add-50k-rows-btn" onclick={() => loadData(50000)}>50K rows</button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="clear-grouping-btn" onclick={clearGrouping}
      ><i class="mdi mdi-close"></i> Clear Grouping</button
    >
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="clear-filter-btn" onclick={clearFilters}
      ><i class="mdi mdi-close"></i> Clear Filters</button
    >
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="collapse-all-btn" onclick={() => grid.dataView.collapseAllGroups()}
      ><i class="mdi mdi-arrow-collapse"></i> Collapse all groups</button
    >
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="expand-all-btn" onclick={() => grid.dataView.expandAllGroups()}
      ><i class="mdi mdi-arrow-expand"></i> Expand all groups</button
    >
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="export-excel-btn" onclick={exportToExcel}
      ><i class="mdi mdi-file-excel-outline text-success"></i> Export to Excel</button
    >
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="export-pdf-btn" onclick={exportToPdf}
      ><i class="mdi mdi-file-pdf-outline text-danger"></i> Export to PDF</button
    >
  </div>
</div>
<hr />
<div class="row">
  <div class="col-sm-12">
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="group-duration-sort-value-btn" onclick={groupByDuration}
      >Group by duration &amp; sort groups by value</button
    >
    <button
      class="btn btn-outline-secondary btn-xs btn-icon"
      data-test="group-duration-sort-count-btn"
      onclick={() => groupByDurationOrderByCount(false)}>Group by duration &amp; sort groups by count</button
    >
  </div>
</div>
<div class="row">
  <div class="col-sm-12">
    <button
      class="btn btn-outline-secondary btn-xs btn-icon"
      data-test="group-duration-sort-count-collapse-btn"
      onclick={() => groupByDurationOrderByCount(true)}>Group by duration &amp; sort groups by count, aggregate collapsed</button
    >
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="group-duration-effort-btn" onclick={groupByDurationEffortDriven}
      >Group by duration then effort-driven</button
    >
    <button
      class="btn btn-outline-secondary btn-xs btn-icon"
      data-test="group-duration-effort-percent-btn"
      onclick={groupByDurationEffortDrivenPercent}>Group by duration then effort-driven then percent.</button
    >
    {#if processing}<span><i class="mdi mdi-sync mdi-spin-1s"></i></span>{/if}
  </div>
</div>

<SlickgridSvelte gridId="grid13" {dataset} {columns} {options} events={eventHandlers} onSvelteGridCreated={gridReady} />
