<script setup lang="ts">
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import type { GridOption, Grouping, GroupingGetterFunction, SlickgridVueInstance } from 'slickgrid-vue';
import {
  Aggregators,
  type Column,
  FieldType,
  FileType,
  Filters,
  Formatters,
  GroupTotalFormatters,
  SlickgridVue,
  SortComparers,
  SortDirectionNumber,
} from 'slickgrid-vue';
import { onBeforeMount, onUnmounted, ref } from 'vue';

const NB_ITEMS = 500;
const darkMode = ref(false);
const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
let draggableGroupingPlugin: any;
let durationOrderByCount = false;
const selectedGroupingFields = ref<Array<string | GroupingGetterFunction>>(['', '', '']);
const excelExportService = new ExcelExportService();
const textExportService = new TextExportService();
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  loadData(NB_ITEMS);
});

onUnmounted(() => {
  document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
  document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      columnGroup: 'Common Factor',
      width: 70,
      minWidth: 50,
      cssClass: 'cell-title',
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
      width: 70,
      sortable: true,
      filterable: true,
      filter: { model: Filters.slider, operator: '>=' },
      type: FieldType.number,
      groupTotalsFormatter: GroupTotalFormatters.sumTotals,
      grouping: {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value}  <span class="text-primary">(${g.count} items)</span>`,
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
      minWidth: 60,
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      type: FieldType.dateUtc,
      outputType: FieldType.dateIso,
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
      minWidth: 60,
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      type: FieldType.dateUtc,
      outputType: FieldType.dateIso,
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
      type: FieldType.number,
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
      minWidth: 70,
      width: 90,
      formatter: Formatters.percentCompleteBar,
      type: FieldType.number,
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
  ];

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableDraggableGrouping: true,

    // pre-header will include our Header Grouping (i.e. "Common Factor")
    // Draggable Grouping could be located in either the Pre-Header OR the new Top-Header
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 30,

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
      deleteIconCssClass: 'mdi mdi-close text-color-danger',
      sortAscIconCssClass: 'mdi mdi-arrow-up',
      sortDescIconCssClass: 'mdi mdi-arrow-down',
      onGroupChanged: (_e, args) => onGroupChanged(args),
      onExtensionRegistered: (extension) => (draggableGroupingPlugin = extension),
    },
    darkMode: darkMode.value,
    enableTextExport: true,
    enableExcelExport: true,
    excelExportOptions: { sanitizeDataExport: true },
    textExportOptions: { sanitizeDataExport: true },
    externalResources: [excelExportService, textExportService],
  };
}

function loadData(rowCount: number) {
  // mock a dataset
  const tmpData: any[] = [];
  for (let i = 0; i < rowCount; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);
    const randomCost = Math.round(Math.random() * 10000) / 100;

    tmpData[i] = {
      id: 'id_' + i,
      num: i,
      title: 'Task ' + i,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 1, randomDay),
      cost: i % 33 === 0 ? -randomCost : randomCost,
      effortDriven: i % 5 === 0,
    };
  }
  dataset.value = tmpData;
}

function clearGroupsAndSelects() {
  clearGroupingSelects();
  clearGrouping();
}

function clearGroupingSelects() {
  selectedGroupingFields.value.forEach((_g, i) => (selectedGroupingFields.value[i] = ''));
  selectedGroupingFields.value = [...selectedGroupingFields.value]; // force dirty checking
}

function clearGrouping(invalidateRows = true) {
  draggableGroupingPlugin?.clearDroppedGroups();
  if (invalidateRows) {
    vueGrid.slickGrid?.invalidate(); // invalidate all rows and re-render
  }
}

function collapseAllGroups() {
  vueGrid.dataView.collapseAllGroups();
}

function expandAllGroups() {
  vueGrid.dataView.expandAllGroups();
}

function exportToExcel() {
  excelExportService.exportToExcel({
    filename: 'Export',
    format: FileType.xlsx,
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
    vueGrid.slickGrid?.setSortColumns(sortColumns);
    vueGrid.slickGrid?.invalidate(); // invalidate all rows and re-render
  }
}

function groupByDurationEffortDriven() {
  clearGrouping(false);
  if (draggableGroupingPlugin?.setDroppedGroups) {
    showPreHeader();
    draggableGroupingPlugin.setDroppedGroups(['duration', 'effortDriven']);
    vueGrid.slickGrid?.invalidate(); // invalidate all rows and re-render
  }
}

function groupByFieldName() {
  clearGrouping();
  if (draggableGroupingPlugin?.setDroppedGroups) {
    showPreHeader();

    // get the field names from Group By select(s) dropdown, but filter out any empty fields
    const groupedFields = selectedGroupingFields.value.filter((g) => g !== '');
    if (groupedFields.length === 0) {
      clearGrouping();
    } else {
      draggableGroupingPlugin.setDroppedGroups(groupedFields);
    }
    vueGrid.slickGrid.invalidate(); // invalidate all rows and re-render
  }
}

function onGroupChanged(change: { caller?: string; groupColumns: Grouping[] }) {
  const caller = change?.caller ?? [];
  const groups = change?.groupColumns ?? [];

  if (Array.isArray(selectedGroupingFields.value) && Array.isArray(groups) && groups.length > 0) {
    // update all Group By select dropdown
    selectedGroupingFields.value.forEach((_g, i) => (selectedGroupingFields.value[i] = groups[i]?.getter ?? ''));
    selectedGroupingFields.value = [...selectedGroupingFields.value]; // force dirty checking
  } else if (groups.length === 0 && caller === 'remove-group') {
    clearGroupingSelects();
  }
}

function showPreHeader() {
  vueGrid.slickGrid.setPreHeaderPanelVisibility(true);
}

function setFiltersDynamically() {
  // we can Set Filters Dynamically (or different filters) afterward through the FilterService
  vueGrid.filterService.updateFilters([
    { columnId: 'percentComplete', operator: '>=', searchTerms: ['55'] },
    { columnId: 'cost', operator: '<', searchTerms: ['80'] },
  ]);
}

function setSortingDynamically() {
  vueGrid.sortService.updateSorting([
    // orders matter, whichever is first in array will be the first sorted column
    { columnId: 'percentComplete', direction: 'ASC' },
  ]);
}

function toggleDraggableGroupingRow() {
  clearGroupsAndSelects();
  vueGrid.slickGrid.setTopHeaderPanelVisibility(!vueGrid.slickGrid.getOptions().showTopHeaderPanel);
}

function toggleDarkMode() {
  darkMode.value = !darkMode.value;
  toggleBodyBackground();
  vueGrid.slickGrid?.setOptions({ darkMode: darkMode.value });
}

function toggleBodyBackground() {
  if (darkMode.value) {
    document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
  } else {
    document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
  }
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => vueGrid.resizerService.resizeGrid());
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>

<template>
  <h2>
    Example 18: Draggable Grouping & Aggregators
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/example17.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="toggle-dark-mode" @click="toggleDarkMode()">
      <span class="mdi mdi-theme-light-dark"></span>
      <span>Toggle Dark Mode</span>
    </button>
  </h2>

  <div class="subtitle">
    <ul>
      <li>
        <a href="https://ghiscoding.gitbook.io/aurelia-slickgrid/grid-functionalities/grouping-aggregators" target="_blank">Wiki docs</a>
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
      <li>Use "Aggregators" and "GroupTotalFormatters" directly from Aurelia-Slickgrid</li>
    </ul>
  </div>

  <div class="form-inline">
    <div class="row">
      <div class="col-sm-12">
        <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="add-500-rows-btn" @click="loadData(500)">500 rows</button>
        <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="add-50k-rows-btn" @click="loadData(50000)">
          50k rows
        </button>
        <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="clear-grouping-btn" @click="clearGroupsAndSelects()">
          <i class="mdi mdi-close"></i> Clear grouping
        </button>
        <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="collapse-all-btn" @click="collapseAllGroups()">
          <i class="mdi mdi-arrow-collapse"></i> Collapse all groups
        </button>
        <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="expand-all-btn" @click="expandAllGroups()">
          <i class="mdi mdi-arrow-expand"></i> Expand all groups
        </button>
        <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" @click="toggleDraggableGroupingRow()">
          Toggle Draggable Grouping Row
        </button>
        <button class="btn btn-outline-secondary btn-xs btn-icon" @click="exportToExcel()">
          <i class="mdi mdi-file-excel-outline text-success"></i> Export to Excel
        </button>
      </div>
    </div>

    <div class="row">
      <div class="col-sm-12">
        <button
          class="btn btn-outline-secondary btn-xs btn-icon"
          data-test="group-duration-sort-value-btn"
          @click="groupByDurationOrderByCount(false)"
        >
          Group by duration &amp; sort groups by value
        </button>
        <button
          class="btn btn-outline-secondary btn-xs btn-icon mx-1"
          data-test="group-duration-sort-count-btn"
          @click="groupByDurationOrderByCount(true)"
        >
          Group by duration &amp; sort groups by count
        </button>
        <button
          class="btn btn-outline-secondary btn-xs btn-icon"
          data-test="group-duration-effort-btn"
          @click="groupByDurationEffortDriven()"
        >
          Group by Duration then Effort-Driven
        </button>
        <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="set-dynamic-filter" @click="setFiltersDynamically()">
          <span class="mdi mdi-filter-outline"></span>
          <span> Set Filters Dynamically </span>
        </button>
        <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="set-dynamic-sorting" @click="setSortingDynamically()">
          <span class="mdi mdi-sort-ascending"></span>
          <span> Set Sorting Dynamically </span>
        </button>
      </div>
    </div>

    <div class="row mt-2">
      <div class="col-sm-12">
        <div class="form-row">
          <div class="row form-group">
            <label for="field1" class="col-sm-3 mb-2">Group by field(s)</label>
            <div v-for="(groupField, index) in selectedGroupingFields" :key="index" class="form-group col-md-3 grouping-selects">
              <select class="form-select" :value="groupField" @change="groupByFieldName()">
                <option :value="''">...</option>
                <option v-for="(column, colIdx) in columnDefinitions" :key="colIdx" :value="column.id">{{ column.name }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row mt-1 mb-1">
    <hr />
  </div>

  <slickgrid-vue
    v-model:options="gridOptions!"
    v-model:columns="columnDefinitions as Column[]"
    v-model:data="dataset"
    grid-id="grid18"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
