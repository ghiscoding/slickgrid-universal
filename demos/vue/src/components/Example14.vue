<script setup lang="ts">
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { SlickgridVue, type Column, type GridOption, type ItemMetadata, type SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const NB_ITEMS = 500;
const gridOptions1 = ref<GridOption>();
const gridOptions2 = ref<GridOption>();
const columnDefinitions1: Ref<Column[]> = ref([]);
const columnDefinitions2: Ref<Column[]> = ref([]);
const dataset1 = ref<any[]>([]);
const dataset2 = ref<any[]>([]);
const showSubTitle = ref(true);
let vueGrid1!: SlickgridVueInstance;
let vueGrid2!: SlickgridVueInstance;

onBeforeMount(() => {
  definedGrid1();
  definedGrid2();

  // populate the dataset once the grid is ready
  dataset1.value = getData(NB_ITEMS);
  dataset2.value = getData(NB_ITEMS);
});

function definedGrid1() {
  columnDefinitions1.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
    { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
    { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
    { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
    { id: '%', name: '% Complete', field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: 'boolean', columnGroup: 'Analysis' },
  ];

  gridOptions1.value = {
    enableAutoResize: false,
    enableCellNavigation: true,
    enableColumnReorder: false,
    enableSorting: true,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 28,
    gridHeight: 275,
    gridWidth: 800,
    enableExcelExport: true,
    excelExportOptions: {
      exportWithFormatter: false,
    },
    externalResources: [new ExcelExportService()],
    explicitInitialization: true,
    dataView: {
      globalItemMetadataProvider: {
        getRowMetadata: (item: any, row: number) => renderDifferentColspan(item, row),
      },
    },
    gridMenu: {
      iconButtonContainer: 'preheader', // we can display the grid menu icon in either the preheader or in the column header (default)
    },
  };
}

function definedGrid2() {
  columnDefinitions2.value = [
    {
      id: 'sel',
      name: '#',
      field: 'num',
      behavior: 'select',
      cssClass: 'cell-selection',
      width: 40,
      resizable: false,
      selectable: false,
    },
    { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
    { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
    { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
    { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
    { id: '%', name: '% Complete', field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: 'boolean', columnGroup: 'Analysis' },
  ];

  gridOptions2.value = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 25,
    explicitInitialization: true,
    gridHeight: 275,
    gridWidth: 800,
    frozenColumn: 2,
    enableExcelExport: true,
    excelExportOptions: {
      exportWithFormatter: false,
    },
    externalResources: [new ExcelExportService()],
    gridMenu: { hideClearFrozenColumnsCommand: false },
    headerMenu: { hideFreezeColumnsCommand: false },
  };
}

function getData(count: number) {
  // Set up some test columns.
  const mockDataset: any[] = [];
  for (let i = 0; i < count; i++) {
    mockDataset[i] = {
      id: i,
      num: i,
      title: 'Task ' + i,
      duration: '5 days',
      percentComplete: Math.round(Math.random() * 100),
      start: '01/01/2009',
      finish: '01/05/2009',
      effortDriven: i % 5 === 0,
    };
  }
  return mockDataset;
}

function setFrozenColumns2(frozenCols: number) {
  vueGrid2.slickGrid.setOptions({ frozenColumn: frozenCols });
  gridOptions2.value = vueGrid2.slickGrid.getOptions();
}

/**
 * A callback to render different row column span
 * Your callback will always have the "item" argument which you can use to decide on the colspan
 * Your return must always be in the form of:: return { columns: {}}
 */
function renderDifferentColspan(item: any, row: number): ItemMetadata {
  if (item.id % 2 === 1 || row % 2 === 1) {
    return {
      columns: {
        duration: {
          colspan: 3, // "duration" will span over 3 columns
        },
      },
    };
  }
  return {
    columns: {
      0: {
        colspan: '*', // starting at column index 0, we will span accross all column (*)
      },
    },
  };
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => {
    vueGrid1.resizerService.resizeGrid();
    vueGrid2.resizerService.resizeGrid();
  });
}

function vueGrid1Ready(grid: SlickgridVueInstance) {
  vueGrid1 = grid;
}
function vueGrid2Ready(grid: SlickgridVueInstance) {
  vueGrid2 = grid;
}
</script>

<template>
  <h2>
    Example 14: Column Span & Header Grouping
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example14.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    This example demonstrates how to easily span a row over multiple columns & how to group header titles.
    <ul>
      <li>
        Note that you can add Sort but remember that it will sort by the data which the row contains, even if the data is visually hidden by
        colspan it will still sort it
      </li>
    </ul>
  </div>

  <h3>Grid 1 <small>(with Header Grouping &amp; Colspan)</small></h3>

  <slickgrid-vue
    v-model:options="gridOptions1!"
    v-model:columns="columnDefinitions1"
    v-model:data="dataset1"
    grid-id="grid1"
    @onVueGridCreated="vueGrid1Ready($event.detail)"
  >
  </slickgrid-vue>

  <hr />

  <h3>Grid 2 <small>(with Header Grouping &amp; Frozen/Pinned Columns)</small></h3>

  <div class="col-sm 12">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="remove-frozen-column-button" @click="setFrozenColumns2(-1)">
      <i class="mdi mdi-close"></i> Remove Frozen Columns
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="set-3frozen-columns" @click="setFrozenColumns2(2)">
      <i class="mdi mdi-pin-outline"></i> Set 3 Frozen Columns
    </button>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions2!"
    v-model:columns="columnDefinitions2"
    v-model:data="dataset2"
    grid-id="grid2"
    @onVueGridCreated="vueGrid2Ready($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss" scoped>
/** You can change the pinned/frozen border styling through this css override */

.slick-row .slick-cell.frozen:last-child,
.slick-headerrow-column.frozen:last-child,
.slick-footerrow-column.frozen:last-child {
  border-right: 1px solid #969696 !important;
}

.slick-pane-bottom {
  border-top: 1px solid #969696 !important;
}
</style>
