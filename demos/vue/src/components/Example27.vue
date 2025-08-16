<script setup lang="ts">
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  type GridOption,
  type SlickgridVueInstance,
  type TreeToggledItem,
  type TreeToggleStateChange,
  type Column,
  Filters,
  Formatters,
  SlickgridVue,
} from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const NB_ITEMS = 500;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const loadingClass = ref('');
const isLargeDataset = ref(false);
const hasNoExpandCollapseChanged = ref(true);
const treeToggleItems = ref<TreeToggledItem[]>([]);
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  dataset.value = loadData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      width: 220,
      cssClass: 'cell-title',
      filterable: true,
      sortable: true,
      exportWithFormatter: false,
      queryFieldSorter: 'id',
      formatter: Formatters.tree,
      exportCustomFormatter: Formatters.treeExport,
    },
    { id: 'duration', name: 'Duration', field: 'duration', minWidth: 90, filterable: true },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      minWidth: 120,
      maxWidth: 200,
      exportWithFormatter: false,
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundSlider, operator: '>=' },
      formatter: Formatters.percentCompleteBarWithText,
      type: 'number',
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      minWidth: 60,
      type: 'dateIso',
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      minWidth: 60,
      type: 'dateIso',
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
    },
    {
      id: 'effortDriven',
      name: 'Effort Driven',
      width: 80,
      minWidth: 20,
      maxWidth: 80,
      cssClass: 'cell-effort-driven',
      field: 'effortDriven',
      exportWithFormatter: false,
      formatter: Formatters.checkmarkMaterial,
      cannotTriggerInsert: true,
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

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableAutoSizeColumns: true,
    enableAutoResize: true,
    enableFiltering: true,
    enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
    treeDataOptions: {
      columnId: 'title',
      parentPropName: 'parentId',
      // this is optional, you can define the tree level property name that will be used for the sorting/indentation, internally it will use "__treeLevel"
      levelPropName: 'treeLevel',
      indentMarginLeft: 15,
      initiallyCollapsed: true,

      // you can optionally sort by a different column and/or sort direction
      // this is the recommend approach, unless you are 100% that your original array is already sorted (in most cases it's not)
      // initialSort: {
      //   columnId: 'title',
      //   direction: 'ASC'
      // },
      // we can also add a custom Formatter just for the title text portion
      titleFormatter: (_row, _cell, value, _def, dataContext) => {
        let prefix = '';
        if (dataContext.treeLevel > 0) {
          prefix = `<span class="mdi mdi-subdirectory-arrow-right mdi-v-align-sub color-se-secondary"></span>`;
        }
        return `${prefix}<span class="bold">${value}</span> <span style="font-size:11px; margin-left: 15px;">(parentId: ${dataContext.parentId})</span>`;
      },
    },
    multiColumnSort: false, // multi-column sorting is not supported with Tree Data, so you need to disable it
    showCustomFooter: true,
    // change header/cell row height for material design theme
    headerRowHeight: 45,
    rowHeight: 40,
    presets: {
      filters: [{ columnId: 'percentComplete', searchTerms: [25], operator: '>=' }],
      // treeData: { toggledItems: [{ itemId: 1, isCollapsed: false }] },
    },
    enableExcelExport: true,
    excelExportOptions: { exportWithFormatter: true, sanitizeDataExport: true },
    externalResources: [new ExcelExportService()],

    // use Material Design SVG icons
    contextMenu: {
      iconCollapseAllGroupsCommand: 'mdi mdi-arrow-collapse',
      iconExpandAllGroupsCommand: 'mdi mdi-arrow-expand',
      iconClearGroupingCommand: 'mdi mdi-close',
      iconCopyCellValueCommand: 'mdi mdi-content-copy',
      iconExportCsvCommand: 'mdi mdi-download',
      iconExportExcelCommand: 'mdi mdi-file-excel-outline',
      iconExportTextDelimitedCommand: 'mdi mdi-download',
    },
    gridMenu: {
      iconCssClass: 'mdi mdi-menu',
      iconClearAllFiltersCommand: 'mdi mdi-filter-remove-outline',
      iconClearAllSortingCommand: 'mdi mdi-swap-vertical',
      iconExportCsvCommand: 'mdi mdi-download',
      iconExportExcelCommand: 'mdi mdi-file-excel-outline',
      iconExportTextDelimitedCommand: 'mdi mdi-download',
      iconRefreshDatasetCommand: 'mdi mdi-sync',
      iconToggleFilterCommand: 'mdi mdi-flip-vertical',
      iconTogglePreHeaderCommand: 'mdi mdi-flip-vertical',
    },
    headerMenu: {
      iconClearFilterCommand: 'mdi mdi mdi-filter-remove-outline',
      iconClearSortCommand: 'mdi mdi-swap-vertical',
      iconSortAscCommand: 'mdi mdi-sort-ascending',
      iconSortDescCommand: 'mdi mdi-flip-v mdi-sort-descending',
      iconColumnHideCommand: 'mdi mdi-close',
    },
  };
}

/**
 * A simple method to add a new item inside the first group that has children which is "Task 1"
 * After adding the item, it will resort by parent/child recursively but keep current sort column
 */
function addNewRow() {
  const newId = vueGrid.dataView.getItemCount();
  // find "Task 1" which has `id = 1`
  const parentItemFound = vueGrid.dataView?.getItemById(1);

  if (parentItemFound?.__hasChildren) {
    const newItem = {
      id: newId,
      parentId: parentItemFound.id,
      title: `Task ${newId}`,
      duration: '1 day',
      percentComplete: 99,
      start: new Date(),
      finish: new Date(),
      effortDriven: false,
    };

    // use the Grid Service to insert the item,
    // it will also internally take care of updating & resorting the hierarchical dataset
    vueGrid.gridService.addItem(newItem);
  }
}

function updateFirstRow() {
  // to update any of the grid rows, we CANNOT simply pass a new updated object
  // we MUST read it from the DataView first (that will include all mutated Tree Data props, like `__treeLevel`, `__parentId`, ...) and then update it
  const item = vueGrid.dataView.getItemById<any>(0);

  // option 1
  /*
    // now that we have the extra Tree Data props, we can update any of the object properties (while keeping the Tree Data props)
    item.duration = `11 days`;
    item.percentComplete = 77;
    item.start = new Date();
    item.finish = new Date();
    item.effortDriven = false;
    // finally we can now update the item which includes our updated props + the Tree Data props (`__treeLevel`, ...)
    vueGrid.gridService.updateItem(item);
    */

  // optiona 2 - alternative
  // we could also simply use the spread operator directly
  vueGrid.gridService.updateItem({
    ...item,
    duration: `11 days`,
    percentComplete: 77,
    start: new Date(),
    finish: new Date(),
    effortDriven: false,
  });
}

function collapseAll() {
  vueGrid.treeDataService.toggleTreeDataCollapse(true);
}

function collapseAllWithoutEvent() {
  vueGrid.treeDataService.toggleTreeDataCollapse(true, false);
}

function expandAll() {
  vueGrid.treeDataService.toggleTreeDataCollapse(false);
}

function dynamicallyChangeFilter() {
  vueGrid.filterService.updateFilters([{ columnId: 'percentComplete', operator: '<', searchTerms: [40] }]);
}

function logHierarchicalStructure() {
  console.log('exploded array', vueGrid.treeDataService.datasetHierarchical /* , JSON.stringify(explodedArray, null, 2) */);
}

function logFlatStructure() {
  console.log('flat array', vueGrid.treeDataService.dataset /* , JSON.stringify(outputFlatArray, null, 2) */);
}

function hideSpinner() {
  setTimeout(() => (loadingClass.value = ''), 200); // delay the hide spinner a bit to avoid show/hide too quickly
}

function showSpinner() {
  if (isLargeDataset.value) {
    loadingClass.value = 'mdi mdi-load mdi-spin-1s font-24px color-alt-success';
  }
}

function loadData(rowCount: number) {
  isLargeDataset.value = rowCount > 5000; // we'll show a spinner when it's large, else don't show show since it should be fast enough
  let indent = 0;
  const parents: any[] = [];
  const data: any[] = [];

  // prepare the data
  for (let i = 0; i < rowCount; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const item: any = (data[i] = {});
    let parentId;

    /*
        for demo & E2E testing purposes, let's make "Task 0" empty and then "Task 1" a parent that contains at least "Task 2" and "Task 3" which the latter will also contain "Task 4" (as shown below)
        also for all other rows don't go over indent tree level depth of 2
        Task 0
        Task 1
          Task 2
          Task 3
            Task 4
        ...
       */
    if (i === 1 || i === 0) {
      indent = 0;
      parents.pop();
    }
    if (i === 3) {
      indent = 1;
    } else if (i === 2 || i === 4 || (Math.random() > 0.8 && i > 0 && indent < 3 && i - 1 !== 0 && i - 1 !== 2)) {
      // also make sure Task 0, 2 remains empty
      indent++;
      parents.push(i - 1);
    } else if (Math.random() < 0.3 && indent > 0) {
      indent--;
      parents.pop();
    }

    if (parents.length > 0) {
      parentId = parents[parents.length - 1];
    } else {
      parentId = null;
    }

    item['id'] = i;
    item['parentId'] = parentId;
    item['title'] = `Task ${i}`;
    item['duration'] = '5 days';
    item['percentComplete'] = Math.round(Math.random() * 100);
    item['start'] = new Date(randomYear, randomMonth, randomDay);
    item['finish'] = new Date(randomYear, randomMonth + 1, randomDay);
    item['effortDriven'] = i % 5 === 0;
  }
  dataset.value = data;
  return data;
}

function handleOnTreeFullToggleEnd(treeToggleExecution: TreeToggleStateChange) {
  console.log('Tree Data changes', treeToggleExecution);
  hideSpinner();
}

/** Whenever a parent is being toggled, we'll keep a reference of all of these changes so that we can reapply them whenever we want */
function handleOnTreeItemToggled(treeToggleExecution: TreeToggleStateChange) {
  hasNoExpandCollapseChanged.value = false;
  treeToggleItems.value = treeToggleExecution.toggledItems as TreeToggledItem[];
  console.log('Tree Data changes', treeToggleExecution);
}

// function handleOnGridStateChanged(gridStateChange: GridStateChange) {
//   hasNoExpandCollapseChanged.value = false;

//   if (gridStateChange?.change?.type === 'treeData') {
//     console.log('Tree Data gridStateChange', gridStateChange?.gridState?.treeData);
//     treeToggleItems.value = gridStateChange?.gridState?.treeData?.toggledItems as TreeToggledItem[];
//   }
// }

// function logTreeDataToggledItems() {
//   console.log(vueGrid.treeDataService.getToggledItems());
// }

function dynamicallyToggledFirstParent() {
  const parentPropName = 'parentId';
  const treeLevelPropName = 'treeLevel'; // if undefined in your options, the default prop name is "__treeLevel"
  const newTreeLevel = 1;

  // find first parent object and toggle it
  const childItemFound = dataset.value.find((item) => item[treeLevelPropName] === newTreeLevel);
  const parentItemFound = vueGrid.dataView.getItemByIdx(childItemFound[parentPropName]);

  if (childItemFound && parentItemFound) {
    vueGrid.treeDataService.dynamicallyToggleItemState([{ itemId: parentItemFound.id, isCollapsed: !parentItemFound.__collapsed }]);
  }
}

function reapplyToggledItems() {
  vueGrid.treeDataService.applyToggledItemStateChanges(treeToggleItems.value);
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
    Example 27: Tree Data
    <small>
      <span class="mdi mdi-file-tree font-27px"></span> (from a flat dataset with <code>parentId</code> references -
      <a href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/tree-data-grid" target="_blank">Wiki</a>)</small
    >
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example27.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    <ul>
      <li>It is assumed that your dataset will have Parent/Child references AND also Tree Level (indent) property.</li>
      <ul>
        <li>
          If you do not have the Tree Level (indent), you could call "convertParentChildArrayToHierarchicalView()" then call
          "convertHierarchicalViewToParentChildArray()"
        </li>
        <li>
          You could also pass the result of "convertParentChildArrayToHierarchicalView()" to v-model="hierarchical" as defined in the next
          Hierarchical Example
        </li>
      </ul>
    </ul>
  </div>

  <div class="row" style="margin-bottom: 4px">
    <div class="col-md-12">
      <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="add-500-rows-btn" @click="loadData(500)">500 rows</button>
      <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="add-75k-rows-btn" @click="loadData(75000)">75k rows</button>
      <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="change-filter-dynamically" @click="dynamicallyChangeFilter()">
        <span class="mdi mdi-filter-outline"></span>
        <span>Dynamically Change Filter (% complete &lt; 40)</span>
      </button>
      <button
        class="btn btn-outline-secondary btn-xs btn-icon mx-1"
        data-test="collapse-all-noevent-btn"
        @click="collapseAllWithoutEvent()"
      >
        <span class="mdi mdi-arrow-collapse"></span>
        <span>Collapse All (without triggering event)</span>
      </button>
      <button
        class="btn btn-outline-secondary btn-xs btn-icon"
        data-test="dynamically-toggle-first-parent-btn"
        @click="dynamicallyToggledFirstParent()"
      >
        <span>Dynamically Toggle First Parent</span>
      </button>
      <button
        data-test="reapply-toggled-items-btn"
        class="btn btn-outline-secondary btn-xs btn-icon mx-1"
        :disabled="hasNoExpandCollapseChanged"
        @click="reapplyToggledItems()"
      >
        <span class="mdi mdi-history"></span>
        <span>Reapply Previous Toggled Items</span>
      </button>
      <div :class="loadingClass"></div>
    </div>
  </div>

  <div class="row">
    <div class="col-md-12">
      <button data-test="add-item-btn" class="btn btn-primary btn-xs btn-icon" @click="addNewRow()">
        <span class="mdi mdi-plus color-white"></span>
        <span>Add New Item to "Task 1" group</span>
      </button>
      <button data-test="update-item-btn" class="btn btn-outline-secondary btn-xs btn-icon mx-1" @click="updateFirstRow()">
        <span class="icon mdi mdi-pencil"></span>
        <span>Update 1st Row Item</span>
      </button>
      <button data-test="collapse-all-btn" class="btn btn-outline-secondary btn-xs btn-icon" @click="collapseAll()">
        <span class="mdi mdi-arrow-collapse"></span>
        <span>Collapse All</span>
      </button>
      <button data-test="expand-all-btn" class="btn btn-outline-secondary btn-xs btn-icon mx-1" @click="expandAll()">
        <span class="mdi mdi-arrow-expand"></span>
        <span>Expand All</span>
      </button>
      <button class="btn btn-outline-secondary btn-xs btn-icon" title="console.log of the Flat dataset" @click="logFlatStructure()">
        <span>Log Flat Structure</span>
      </button>
      <button
        class="btn btn-outline-secondary btn-xs btn-icon mx-1"
        title="console.log of the Hierarchical Tree dataset"
        @click="logHierarchicalStructure()"
      >
        <span>Log Hierarchical Structure</span>
      </button>
    </div>
  </div>

  <br />

  <div id="grid-container" class="col-sm-12">
    <slickgrid-vue
      v-model:options="gridOptions"
      v-model:columns="columnDefinitions"
      v-model:data="dataset"
      grid-id="grid27"
      @onBeforeFilterChange="showSpinner()"
      @onFilterChanged="hideSpinner()"
      @onBeforeFilterClear="showSpinner()"
      @onFilterCleared="hideSpinner()"
      @onBeforeSortChange="showSpinner()"
      @onSortChanged="hideSpinner()"
      @onBeforeToggleTreeCollapse="showSpinner()"
      @onToggleTreeCollapsed="hideSpinner()"
      @onTreeFullToggleStart="showSpinner()"
      @onTreeFullToggleEnd="handleOnTreeFullToggleEnd($event.detail)"
      @onTreeItemToggled="handleOnTreeItemToggled($event.detail)"
      @onVueGridCreated="vueGridReady($event.detail)"
    >
    </slickgrid-vue>
  </div>
</template>
<style lang="scss">
#grid27 {
  .slick-cell {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
