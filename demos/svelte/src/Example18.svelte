<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { PdfExportService } from '@slickgrid-universal/pdf-export';
  import { TextExportService } from '@slickgrid-universal/text-export';
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
    type GroupingGetterFunction,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { onMount, tick } from 'svelte';

  const NB_ITEMS = 10_000;
  const excelExportService = new ExcelExportService();
  const pdfExportService = new PdfExportService();
  const textExportService = new TextExportService();
  let grid: SlickgridSvelteInstance | undefined;
  let darkMode = false;
  let draggableGroupingPlugin: any;
  let durationOrderByCount = false;
  let hideSubTitle = $state(false);
  let selectedGroupingFields = $state.raw<Array<string | GroupingGetterFunction>>(['', '', '']);
  let dataset = $state.raw<any[]>([]);

  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      columnGroup: 'Common Factor',
      hidden: true, // column initially hidden
      filterable: true,
      sortable: true,
      grouping: {
        getter: 'title',
        formatter: (g) => `Title: ${g.value}  <span class="text-primary">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('cost')],
        aggregateCollapsed: false,
        collapsed: false,
      },
    },
    {
      id: 'duration',
      name: 'Duration',
      field: 'duration',
      columnGroup: 'Common Factor',
      sortable: true,
      filterable: true,
      filter: { model: Filters.slider, operator: '>=' },
      editor: { model: Editors.float },
      type: 'number',
      groupTotalsFormatter: GroupTotalFormatters.sumTotals,
      grouping: {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value} <span class="text-primary">(${g.count} items)</span>`,
        comparer: (a, b) => {
          return durationOrderByCount ? a.count - b.count : SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc);
        },
        aggregators: [new Aggregators.Sum('cost')],
        aggregateCollapsed: false,
        collapsed: false,
      },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      columnGroup: 'Period',
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      editor: { model: Editors.date },
      type: 'dateUtc',
      outputType: 'dateIso',
      exportWithFormatter: true,
      grouping: {
        getter: 'start',
        formatter: (g) => `Start: ${g.value}  <span class="text-primary">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('cost')],
        aggregateCollapsed: false,
        collapsed: false,
      },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      columnGroup: 'Period',
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      editor: { model: Editors.date },
      type: 'dateUtc',
      outputType: 'dateIso',
      exportWithFormatter: true,
      grouping: {
        getter: 'finish',
        formatter: (g) => `Finish: ${g.value} <span class="text-primary">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('cost')],
        aggregateCollapsed: false,
        collapsed: false,
      },
    },
    {
      id: 'cost',
      name: 'Cost',
      field: 'cost',
      columnGroup: 'Analysis',
      width: 90,
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundInput },
      formatter: Formatters.dollar,
      exportWithFormatter: true,
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
      type: 'number',
      grouping: {
        getter: 'cost',
        formatter: (g) => `Cost: ${g.value} <span class="text-primary">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        collapsed: true,
      },
    },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      columnGroup: 'Analysis',
      formatter: Formatters.percentCompleteBar,
      type: 'number',
      filterable: true,
      filter: { model: Filters.compoundSlider },
      sortable: true,
      groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
      grouping: {
        getter: 'percentComplete',
        formatter: (g) => `% Complete: ${g.value}  <span class="text-primary">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('cost')],
        aggregateCollapsed: false,
        collapsed: false,
      },
      params: { groupFormatterPrefix: '<i>Avg</i>: ' },
    },
    {
      id: 'effortDriven',
      name: 'Effort-Driven',
      field: 'effortDriven',
      columnGroup: 'Analysis',
      width: 80,
      minWidth: 20,
      maxWidth: 100,
      cssClass: 'cell-effort-driven',
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
      formatter: Formatters.checkmarkMaterial,
      grouping: {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${g.value ? 'True' : 'False'} <span class="text-primary">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('cost')],
        collapsed: false,
      },
    },
    {
      id: 'action',
      name: 'Action',
      field: 'action',
      width: 90,
      maxWidth: 90,
      excludeFromExport: true,
      formatter: () => '<div class="fake-hyperlink color-primary flex justify-center">Action <i class="mdi mdi-chevron-down"></i></div>',
      cellMenu: {
        commandTitle: 'Commands',
        commandItems: [{ command: 'help', title: 'Help' }],
      },
    },
  ];

  const options: GridOption = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableDraggableGrouping: true,
    autoEdit: true,
    autoCommitEdit: true,
    editable: true,
    enableCellNavigation: true,
    enableSelection: true,
    enableCheckboxSelector: true,
    selectionOptions: { selectActiveRow: false },
    checkboxSelector: { hideInColumnTitleRow: true, hideInFilterHeaderRow: false },
    enableCellMenu: true,

    // pre-header will include our Header Grouping (i.e. "Common Factor")
    // Draggable Grouping could be located in either the Pre-Header OR the new Top-Header
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 26,

    // when Top-Header is created, it will be used by the Draggable Grouping (otherwise the Pre-Header will be used)
    createTopHeaderPanel: true,
    showTopHeaderPanel: true,
    topHeaderPanelHeight: 35,

    showCustomFooter: true,
    enableFiltering: true,
    // you could debounce/throttle the input text filter if you have lots of data
    // filterTypingDebounce: 250,
    enableSorting: true,
    enableColumnReorder: true,
    gridMenu: {
      onCommand: (_e, args) => {
        if (args.command === 'toggle-preheader') {
          // in addition to the grid menu pre-header toggling (internally), we will also clear grouping
          clearGrouping();
        }
      },
    },
    draggableGrouping: {
      dropPlaceHolderText: 'Drop a column header here to group by the column',
      // groupIconCssClass: 'mdi mdi-drag-vertical',
      deleteIconCssClass: 'mdi mdi-close color-danger',
      sortAscIconCssClass: 'mdi mdi-arrow-up',
      sortDescIconCssClass: 'mdi mdi-arrow-down',
      onGroupChanged: (_e, args) => onGroupChanged(args),
      onExtensionRegistered: (extension) => (draggableGroupingPlugin = extension),
      initialGroupBy: ['duration'],
    },
    darkMode,
    excelExportOptions: { sanitizeDataExport: true },
    textExportOptions: { sanitizeDataExport: true },
    externalResources: [excelExportService, pdfExportService, textExportService],
    // -- NOTE: registered resources are auto-enabled
    // enableTextExport: true,
    // enableExcelExport: true,
    // enablePdfExport: true,
    pdfExportOptions: {
      repeatHeadersOnEachPage: true, // defaults to true
      documentTitle: 'Grouping Grid',
    },
  };

  // mock some data (different in each dataset)
  loadData(NB_ITEMS);

  onMount(() => () => {
    document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')?.setAttribute('data-bs-theme', 'light');
  });

  function loadData(rowCount: number) {
    // mock data
    const tmpData: any[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < rowCount; i++) {
      const randomFinishYear = currentYear - 3 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 10);
      const randomDay = Math.floor(Math.random() * 29);
      const randomFinish = new Date(randomFinishYear, randomMonth + 1, randomDay);
      const randomCost = Math.round(Math.random() * 10000) / 100;

      tmpData[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(currentYear - 2, randomMonth, randomDay),
        finish: randomFinish < new Date() ? '' : randomFinish,
        cost: i % 33 === 0 ? -randomCost : randomCost,
        effortDriven: i % 5 === 0,
      };
    }
    dataset = tmpData;
  }

  function clearGroupsAndSelects() {
    clearGroupingSelects();
    clearGrouping();
  }

  function clearGroupingSelects() {
    selectedGroupingFields = ['', '', ''];
  }

  function clearGrouping(invalidateRows = true) {
    draggableGroupingPlugin?.clearDroppedGroups();
    if (invalidateRows) {
      grid?.slickGrid?.invalidate(); // invalidate all rows and re-render
    }
  }

  function collapseAllGroups() {
    grid?.dataView.collapseAllGroups();
  }

  function expandAllGroups() {
    grid?.dataView.expandAllGroups();
  }

  function exportToExcel() {
    excelExportService.exportToExcel({
      filename: 'Export',
      format: 'xlsx',
    });
  }

  function exportToPdf() {
    pdfExportService.exportToPdf({
      filename: 'Export',
    });
  }

  function groupByDurationOrderByCount(sortedByCount = false) {
    durationOrderByCount = sortedByCount;
    clearGrouping(false);

    if (draggableGroupingPlugin?.setDroppedGroups) {
      showPreHeader();
      draggableGroupingPlugin.setDroppedGroups('duration');

      // you need to manually add the sort icon(s) in UI
      const sortColumns = sortedByCount ? [] : [{ columnId: 'duration', sortAsc: true }];
      grid?.slickGrid?.setSortColumns(sortColumns);
      grid?.slickGrid?.invalidate(); // invalidate all rows and re-render
    }
  }

  function groupByDurationEffortDriven() {
    clearGrouping(false);
    if (draggableGroupingPlugin?.setDroppedGroups) {
      showPreHeader();
      draggableGroupingPlugin.setDroppedGroups(['duration', 'effortDriven']);
      grid?.slickGrid?.invalidate(); // invalidate all rows and re-render
    }
  }

  function groupByFieldName(event: Event, index: number) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const updatedGroupingFields = selectedGroupingFields.map((field, fieldIndex) => (fieldIndex === index ? selectedValue : field));
    selectedGroupingFields = updatedGroupingFields;
    clearGrouping();
    if (draggableGroupingPlugin?.setDroppedGroups) {
      showPreHeader();

      // get the field names from Group By select(s) dropdown, but filter out any empty fields
      const groupedFields = updatedGroupingFields.filter((g) => g !== '');
      if (groupedFields.length === 0) {
        clearGrouping();
      } else {
        draggableGroupingPlugin.setDroppedGroups(groupedFields);
      }
      grid?.slickGrid?.invalidate(); // invalidate all rows and re-render
    }
  }

  function onGroupChanged(change: { caller?: string; groupColumns: Grouping[] }) {
    const caller = change?.caller ?? [];
    const groups = change?.groupColumns ?? [];

    if (Array.isArray(groups) && groups.length > 0) {
      // update all Group By select dropdown
      selectedGroupingFields = selectedGroupingFields.map((_g, i) => groups[i]?.getter ?? '');
    } else if (groups.length === 0 && caller === 'remove-group') {
      clearGroupingSelects();
    }
  }

  function showPreHeader() {
    grid?.slickGrid?.setPreHeaderPanelVisibility(true);
  }

  function setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    grid?.filterService.updateFilters([
      { columnId: 'percentComplete', operator: '>=', searchTerms: ['55'] },
      { columnId: 'cost', operator: '<', searchTerms: ['80'] },
    ]);
  }

  function setSortingDynamically() {
    grid?.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'percentComplete', direction: 'ASC' },
    ]);
  }

  function toggleDraggableGroupingRow() {
    clearGroupsAndSelects();
    grid?.slickGrid?.setTopHeaderPanelVisibility(!grid.slickGrid.getOptions().showTopHeaderPanel);
  }

  function toggleDarkMode() {
    darkMode = !darkMode;
    toggleBodyBackground();
    grid?.slickGrid?.setOptions({ darkMode });
  }

  function toggleBodyBackground() {
    if (darkMode) {
      document.querySelector('.panel-wm-content')?.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')?.setAttribute('data-bs-theme', 'dark');
    } else {
      document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')?.setAttribute('data-bs-theme', 'light');
    }
  }

  async function toggleSubTitle() {
    hideSubTitle = !hideSubTitle;
    await tick();
    grid?.resizerService.resizeGrid(0);
  }
</script>

<h2>
  Example 18: Draggable Grouping &amp; Aggregators
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example18.svelte"
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
    <span class="mdi mdi-theme-light-dark"></span>
    <span>Toggle Dark Mode</span>
  </button>
</h2>

{#if !hideSubTitle}
  <div class="subtitle">
    <ul>
      <li>
        <a href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/grouping-aggregators" target="_blank" rel="noreferrer">
          Wiki docs
        </a>
      </li>
      <li>This example shows 3 ways of grouping</li>
      <ol>
        <li>
          Drag any Column Header on the top placeholder to group by that column (support moti-columns grouping by adding more columns to the
          drop area).
        </li>
        <li>Use buttons and defined functions to group by whichever field you want</li>
        <li>Use the Select dropdown to group, the position of the Selects represent the grouping level</li>
      </ol>
      <li>Fully dynamic and interactive multi-level grouping with filtering and aggregates ovor 50'000 items</li>
      <li>Each grouping level can have its own aggregates (over child rows, child groups, or all descendant rows)..</li>
      <li>Use "Aggregators" and "GroupTotalFormatters" directly from Slickgrid-Svelte</li>
    </ul>
  </div>
{/if}

<div class="form-inline">
  <div class="row">
    <div class="col-sm-12">
      <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="add-5k-rows-btn" onclick={() => loadData(5000)}>5K rows</button>
      <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="add-500k-rows-btn" onclick={() => loadData(500000)}>
        500K rows
      </button>
      <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="clear-grouping-btn" onclick={clearGroupsAndSelects}>
        <i class="mdi mdi-close"></i> Clear grouping
      </button>
      <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="collapse-all-btn" onclick={collapseAllGroups}>
        <i class="mdi mdi-arrow-collapse"></i> Collapse all groups
      </button>
      <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="expand-all-btn" onclick={expandAllGroups}>
        <i class="mdi mdi-arrow-expand"></i> Expand all groups
      </button>
      <button
        class="btn btn-outline-secondary btn-xs btn-icon mx-1"
        data-test="toggle-draggable-grouping-row"
        onclick={toggleDraggableGroupingRow}
      >
        Toggle Draggable Grouping Row
      </button>
      <button class="btn btn-outline-secondary btn-xs btn-icon" onclick={exportToExcel}>
        <i class="mdi mdi-file-excel-outline text-success"></i> Export to Excel
      </button>
      <button class="btn btn-outline-secondary btn-xs btn-icon" onclick={exportToPdf}>
        <i class="mdi mdi-file-pdf-outline text-danger"></i> Export to PDF
      </button>
    </div>
  </div>

  <div class="row">
    <div class="col-sm-12">
      <button
        class="btn btn-outline-secondary btn-xs btn-icon"
        data-test="group-duration-sort-value-btn"
        onclick={() => groupByDurationOrderByCount(false)}
      >
        Group by duration &amp; sort groups by value
      </button>
      <button
        class="btn btn-outline-secondary btn-xs btn-icon mx-1"
        data-test="group-duration-sort-count-btn"
        onclick={() => groupByDurationOrderByCount(true)}
      >
        Group by duration &amp; sort groups by count
      </button>
      <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="group-duration-effort-btn" onclick={groupByDurationEffortDriven}>
        Group by Duration then Effort-Driven
      </button>
      <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="set-dynamic-filter" onclick={setFiltersDynamically}>
        <span class="mdi mdi-filter-outline"></span>
        <span> Set Filters Dynamically </span>
      </button>
      <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="set-dynamic-sorting" onclick={setSortingDynamically}>
        <span class="mdi mdi-sort-ascending"></span>
        <span> Set Sorting Dynamically </span>
      </button>
    </div>
  </div>

  <div class="row mt-2">
    <div class="col-sm-12">
      <div class="form-row">
        <div class="row form-group">
          <label for="group-field-0" class="col-sm-3 mb-2">Group by field(s)</label>
          {#each selectedGroupingFields as groupField, index (index)}
            <div class="form-group col-md-3 grouping-selects">
              <select id="group-field-{index}" class="form-select" value={groupField} onchange={(event) => groupByFieldName(event, index)}>
                <option value="">...</option>
                {#each columns as column (column.id)}
                  <option value={column.id}>{column.name}</option>
                {/each}
              </select>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<div class="row mt-1 mb-1">
  <hr />
</div>

<SlickgridSvelte
  gridId="grid18"
  {columns}
  {options}
  {dataset}
  onCellChange={() => grid?.dataView?.refresh()}
  onSvelteGridCreated={(instance) => (grid = instance)}
/>
