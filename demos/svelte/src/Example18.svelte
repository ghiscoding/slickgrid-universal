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
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  let grid: SlickgridSvelteInstance;
  let grouping: any;
  let dataset = makeData(10000);
  let selected = ['', '', ''];
  let subtitle = true,
    darkMode = false,
    processing = false,
    durationOrderByCount = false;
  const excel = new ExcelExportService(),
    pdf = new PdfExportService(),
    text = new TextExportService();
  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      columnGroup: 'Common Factor',
      hidden: true,
      sortable: true,
      width: 70,
      filterable: true,
      editor: { model: Editors.text },
      grouping: {
        getter: 'title',
        formatter: (g: any) => `Title: ${g.value} (${g.count} items)`,
        aggregators: [new Aggregators.Sum('cost')],
      },
    },
    {
      id: 'duration',
      name: 'Duration',
      field: 'duration',
      columnGroup: 'Common Factor',
      sortable: true,
      type: 'number',
      minWidth: 90,
      filterable: true,
      filter: { model: Filters.slider, operator: '>=' },
      editor: { model: Editors.float },
      groupTotalsFormatter: GroupTotalFormatters.sumTotals,
      grouping: {
        getter: 'duration',
        formatter: (g: any) => `Duration: ${g.value} <span class="text-primary">(${g.count} items)</span>`,
        comparer: (a: any, b: any) =>
          durationOrderByCount ? a.count - b.count : SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
      },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      columnGroup: 'Period',
      formatter: Formatters.dateIso,
      sortable: true,
      type: 'dateUtc',
      filterable: true,
      filter: { model: Filters.compoundDate },
      editor: { model: Editors.date },
      grouping: {
        getter: 'start',
        formatter: (g: any) => `Start: ${g.value} (${g.count} items)`,
        aggregators: [new Aggregators.Sum('cost')],
      },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      columnGroup: 'Period',
      formatter: Formatters.dateIso,
      sortable: true,
      type: 'dateUtc',
      filterable: true,
      filter: { model: Filters.compoundDate },
      editor: { model: Editors.date },
      grouping: {
        getter: 'finish',
        formatter: (g: any) => `Finish: ${g.value} (${g.count} items)`,
        aggregators: [new Aggregators.Sum('cost')],
      },
    },
    {
      id: 'cost',
      name: 'Cost',
      field: 'cost',
      columnGroup: 'Analysis',
      formatter: Formatters.dollar,
      sortable: true,
      type: 'number',
      filterable: true,
      filter: { model: Filters.compoundInput },
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
      grouping: {
        getter: 'cost',
        formatter: (g: any) => `Cost: ${g.value} (${g.count} items)`,
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
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundSlider },
      groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
      grouping: {
        getter: 'percentComplete',
        formatter: (g: any) => `% Complete: ${g.value} (${g.count} items)`,
        aggregators: [new Aggregators.Sum('cost')],
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
      formatter: Formatters.checkmarkMaterial,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
        model: Filters.singleSelect,
      },
      grouping: {
        getter: 'effortDriven',
        formatter: (g: any) => `Effort-Driven: ${g.value ? 'True' : 'False'} (${g.count} items)`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
      },
    },
    {
      id: 'action',
      name: 'Action',
      field: 'action',
      width: 90,
      formatter: () => '<div>Action <i class="mdi mdi-chevron-down"></i></div>',
      cellMenu: { commandTitle: 'Commands', commandItems: [{ command: 'help', title: 'Help' }] },
    },
  ];
  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableFiltering: true,
    enableSorting: true,
    enableGrouping: true,
    enableDraggableGrouping: true,
    enableSelection: true,
    enableCheckboxSelector: true,
    checkboxSelector: { hideInColumnTitleRow: true, hideInFilterHeaderRow: false },
    selectionOptions: { selectActiveRow: false },
    editable: true,
    autoEdit: true,
    autoCommitEdit: true,
    enableCellNavigation: true,
    createTopHeaderPanel: true,
    showTopHeaderPanel: true,
    topHeaderPanelHeight: 35,
    showCustomFooter: true,
    draggableGrouping: {
      dropPlaceHolderText: 'Drop a column header here to group by the column',
      deleteIconCssClass: 'mdi mdi-close color-danger',
      sortAscIconCssClass: 'mdi mdi-arrow-up',
      sortDescIconCssClass: 'mdi mdi-arrow-down',
      initialGroupBy: ['duration'],
      onGroupChanged: (_e: any, args: any) => {
        selected = [...(args.groupColumns ?? []).map((g: any) => g.getter), '', ''].slice(0, 3);
      },
      onExtensionRegistered: (extension: any) => (grouping = extension),
    },
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 26,
    enableExcelExport: true,
    enablePdfExport: true,
    enableTextExport: true,
    externalResources: [excel, pdf, text],
    darkMode,
    gridMenu: {
      onCommand: (_e: any, a: any) => {
        if (a.command === 'toggle-preheader') {
          clearGrouping();
        }
      },
    },
  };
  function makeData(count: number) {
    const y = new Date().getFullYear();
    return Array.from({ length: count }, (_v, i) => {
      const m = i === 0 ? 0 : Math.floor(Math.random() * 10),
        d = i === 0 ? 1 : Math.floor(Math.random() * 29),
        finish = new Date(y - 3 + Math.floor(Math.random() * 10), m + 1, d);
      return {
        id: i,
        title: `Task ${i}`,
        duration: `${Math.round(Math.random() * 100)}`,
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(y - 2, m, d),
        finish: i === 0 || finish < new Date() ? '' : finish,
        cost: i % 33 === 0 ? -Math.random() * 10000 : Math.random() * 10000,
        effortDriven: i % 5 === 0,
      };
    });
  }
  function ready(i: SlickgridSvelteInstance) {
    grid = i;
  }
  function setGroups(fields: string[]) {
    clearGrouping();
    grid.slickGrid.setPreHeaderPanelVisibility(true);
    grouping?.setDroppedGroups?.(fields);
    grid.slickGrid.invalidate();
  }
  function clearGrouping() {
    grouping?.clearDroppedGroups?.();
    grid?.slickGrid.invalidate();
    selected = ['', '', ''];
  }
  function byDuration(count = false) {
    durationOrderByCount = count;
    setGroups(['duration']);
    grid.slickGrid.setSortColumns(count ? [] : [{ columnId: 'duration', sortAsc: true }]);
  }
  function byEffort() {
    setGroups(['duration', 'effortDriven']);
  }
  function bySelect(index: number, event: Event) {
    selected[index] = (event.currentTarget as HTMLSelectElement).value;
    setGroups(selected.filter(Boolean));
  }
  function collapse() {
    grid.dataView.collapseAllGroups();
  }
  function expand() {
    grid.dataView.expandAllGroups();
  }
  function load(count: number) {
    dataset = makeData(count);
  }
  function toggleSubTitle() {
    subtitle = !subtitle;
    grid?.resizerService.resizeGrid(0);
  }
  function toggleDark() {
    darkMode = !darkMode;
    document.querySelector('.panel-wm-content')?.classList.toggle('dark-mode', darkMode);
    document.querySelector<HTMLElement>('#demo-container')?.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
    grid.slickGrid.setOptions({ darkMode });
  }
  function dynamicFilters() {
    grid.filterService.updateFilters([
      { columnId: 'percentComplete', operator: '>=', searchTerms: ['55'] },
      { columnId: 'cost', operator: '<', searchTerms: ['80'] },
    ]);
  }
  function dynamicSort() {
    grid.sortService.updateSorting([{ columnId: 'percentComplete', direction: 'ASC' }]);
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
      ><span class="mdi mdi-link-variant"></span> code</a
    >
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    data-test="toggle-subtitle"
    aria-label="Toggle subtitle"
    onclick={toggleSubTitle}><i class="mdi mdi-information-outline"></i></button
  ><button class="btn btn-outline-secondary btn-sm btn-icon" data-test="toggle-dark-mode" onclick={toggleDark}
    ><i class="mdi mdi-theme-light-dark"></i> Toggle Dark Mode</button
  >
</h2>
{#if subtitle}<div class="subtitle">
    Drag column headers into the grouping area, use the buttons, or choose up to three group fields.
  </div>{/if}
<div class="row">
  <div class="col-sm-12">
    <button class="btn btn-outline-secondary btn-xs" data-test="add-5k-rows-btn" onclick={() => load(5000)}>5K rows</button><button
      class="btn btn-outline-secondary btn-xs"
      data-test="add-500k-rows-btn"
      onclick={() => load(500000)}>500K rows</button
    ><button class="btn btn-outline-secondary btn-xs" data-test="clear-grouping-btn" onclick={clearGrouping}>Clear grouping</button><button
      class="btn btn-outline-secondary btn-xs"
      data-test="collapse-all-btn"
      onclick={collapse}>Collapse all</button
    ><button class="btn btn-outline-secondary btn-xs" data-test="expand-all-btn" onclick={expand}>Expand all</button><button
      class="btn btn-outline-secondary btn-xs"
      data-test="toggle-draggable-grouping-row"
      onclick={() => grid.slickGrid.setTopHeaderPanelVisibility(!grid.slickGrid.getOptions().showTopHeaderPanel)}
      >Toggle Draggable Grouping Row</button
    ><button class="btn btn-outline-secondary btn-xs" onclick={() => excel.exportToExcel({ filename: 'Export', format: 'xlsx' })}
      >Export to Excel</button
    ><button class="btn btn-outline-secondary btn-xs" onclick={() => pdf.exportToPdf({ filename: 'Export' })}>Export to PDF</button>
  </div>
</div>
<div class="row">
  <div class="col-sm-12">
    <button class="btn btn-outline-secondary btn-xs" data-test="group-duration-sort-value-btn" onclick={() => byDuration(false)}
      >Group by duration &amp; sort groups by value</button
    ><button class="btn btn-outline-secondary btn-xs" data-test="group-duration-sort-count-btn" onclick={() => byDuration(true)}
      >Group by duration &amp; sort groups by count</button
    ><button class="btn btn-outline-secondary btn-xs" data-test="group-duration-effort-btn" onclick={byEffort}
      >Group by Duration &amp; then Effort-Driven</button
    ><button class="btn btn-outline-secondary btn-xs" data-test="set-dynamic-filter" onclick={dynamicFilters}
      >Set Filters Dynamically</button
    ><button class="btn btn-outline-secondary btn-xs" data-test="set-dynamic-sorting" onclick={dynamicSort}>Set Sorting Dynamically</button>
  </div>
</div>
<div class="row mt-2">
  <label for="group-field-0">Group by field(s)</label>{#each selected as value, i}<div class="form-group col-md-3 grouping-selects">
      <select id="group-field-{i}" class="form-select" {value} onchange={(e) => bySelect(i, e)}
        ><option value=""></option>{#each columns as col}<option value={String(col.id)}>{col.name}</option>{/each}</select
      >
    </div>{/each}
</div>
<hr />
<SlickgridSvelte gridId="grid18" {dataset} {columns} {options} onSvelteGridCreated={ready} />
