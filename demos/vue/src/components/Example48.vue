<script setup lang="ts">
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Formatters, SlickEventHandler, SlickgridVue, type Column, type GridOption, type SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const NB_ITEMS = 995;

const _eventHandler = new SlickEventHandler();
const gridOptions1 = ref<GridOption>();
const gridOptions2 = ref<GridOption>();
const columnDefinitions1: Ref<Column[]> = ref([]);
const columnDefinitions2: Ref<Column[]> = ref([]);
const dataset1 = ref<any[]>([]);
const dataset2 = ref<any[]>([]);
const showSubTitle = ref(true);

onBeforeMount(() => {
  defineGrids();
  // mock some data (different in each dataset)
  dataset1.value = mockData(NB_ITEMS);
  dataset2.value = mockData(NB_ITEMS);
});

function vueGrid1Ready(vueGrid: SlickgridVueInstance) {
  const cellSelectionModel1 = vueGrid.slickGrid!.getSelectionModel()!;
  _eventHandler.subscribe(cellSelectionModel1.onSelectedRangesChanged, (_e, args) => {
    const targetRange = document.querySelector('#selectionRange1') as HTMLSpanElement;
    if (targetRange) {
      targetRange.textContent = '';
      for (const slickRange of args) {
        targetRange.textContent += JSON.stringify(slickRange);
      }
    }
  });
}

function vueGrid2Ready(vueGrid: SlickgridVueInstance) {
  const cellSelectionModel2 = vueGrid.slickGrid!.getSelectionModel()!;
  _eventHandler.subscribe(cellSelectionModel2.onSelectedRangesChanged, (_e, args) => {
    const targetRange = document.querySelector('#selectionRange2') as HTMLSpanElement;
    if (targetRange) {
      targetRange.textContent = '';
      for (const slickRange of args) {
        targetRange.textContent += JSON.stringify(slickRange);
      }
    }
  });
}

/* Define grid Options and Columns */
function defineGrids() {
  const colDefs1: Column[] = [
    { id: 'id', name: '#', field: 'id', width: 32, maxWidth: 40, excludeFromHeaderMenu: true },
    { id: 'title', name: 'Title', field: 'title', width: 90, cssClass: 'cell-title' },
    { id: 'complete', name: '% Complete', field: 'percentComplete', sortable: true, width: 90 },
    { id: 'start', name: 'Start', field: 'start', type: 'date', sortable: true, formatter: Formatters.dateUs },
    { id: 'finish', name: 'Finish', field: 'finish', type: 'date', sortable: true, formatter: Formatters.dateUs },
    {
      id: 'priority',
      name: 'Priority',
      field: 'priority',
      width: 80,
      resizable: false,
      sortable: true,
      type: 'number',
      sortComparer: (x, y, direction) => {
        return (direction ?? 0) * (x === y ? 0 : x > y ? 1 : -1);
      },
      formatter: (_row, _cell, value) => {
        if (!value) {
          return '';
        }
        const count = +(value >= 3 ? 3 : value);
        return count === 3 ? 'High' : count === 2 ? 'Medium' : 'Low';
      },
    },
    {
      id: 'effortDriven',
      name: 'Effort Driven',
      field: 'effortDriven',
      cssClass: 'text-center',
      width: 95,
      maxWidth: 120,
      type: 'boolean',
      sortable: true,
      exportCustomFormatter: (_row, _cell, value) => (value ? 'Yes' : 'No'),
      formatter: Formatters.checkmarkMaterial,
    },
  ];

  // assign both column definitions
  columnDefinitions1.value = colDefs1;
  columnDefinitions2.value = [...colDefs1];

  gridOptions1.value = {
    autoResize: {
      container: '.demo-container',
    },
    gridHeight: 250,
    gridWidth: 800,
    enableCellNavigation: true,
    autoEdit: true,
    editable: true,
    headerRowHeight: 35,
    rowHeight: 35,
    enableExcelExport: true,
    excelExportOptions: {
      exportWithFormatter: true,
    },
    externalResources: [new ExcelExportService()],

    // enable new hybrid selection model (rows & cells)
    enableHybridSelection: true,
    rowSelectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: true,
      rowSelectColumnIds: ['id'],
    },

    // when using the ExcelCopyBuffer, you can see what the selection range is
    enableExcelCopyBuffer: true,
    excelCopyBufferOptions: {
      copyActiveEditorCell: true,
      removeDoubleQuotesOnPaste: true,
      replaceNewlinesWith: ' ',
    },
  };

  // copy the same Grid Options and Column Definitions to 2nd grid
  gridOptions2.value = {
    ...gridOptions1.value,
    // you can also enable checkbox selection & row selection, make sure to use `rowSelectColumnIds: ['id', '_checkbox_selector']`
    enableCheckboxSelector: true,
    enableRowSelection: true,
    rowSelectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: false,
      rowSelectColumnIds: ['id', '_checkbox_selector'],
    },
  };
}

function mockData(itemCount: number) {
  const data: any[] = [];
  for (let i = 0; i < itemCount; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomFinishYear = randomYear + Math.floor(Math.random() * 10);
    const randomFinish = new Date(randomFinishYear, randomMonth + 1, randomDay);

    data[i] = {
      id: i,
      title: 'Task ' + i,
      duration: Math.floor(Math.random() * 25) + ' days',
      percentComplete: Math.floor(Math.random() * 100),
      start: new Date(randomYear, randomMonth, randomDay, randomDay),
      finish: randomFinish,
      priority: i % 3 ? 2 : i % 5 ? 3 : 1,
      effortDriven: i % 4 === 0,
    };
  }
  return data;
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
}
</script>

<template>
  <h2>
    Example 48: Hybrid Selection Model
    <span class="float-end font18">
      see&nbsp;
      <a target="_blank" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example01.vue">
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    <code>SlickHybridSelectionModel</code> This Selection Model is an hybrid approach that uses a combination of the row or cell selections
    depending on certain conditions. Use <code>enableHybridSelection</code> grid option to enable the new Hybrid Selection Model.
    <ul>
      <li>
        1. clicking on the first column (<code>id</code>) will use <code>RowSelectionModel</code> because of our configuration of
        <code>rowSelectColumnIds: ['id']</code> as the columns that will trigger row selection.
      </li>
      <li>2. clicking on the any other columns will use <code>CellSelectionModel</code> by default</li>
    </ul>
  </div>

  <h3>
    Grid 1
    <small class="subtitle ms-3 text-italic">
      <label>Range Selection</label>
      <span id="selectionRange1"></span>
    </small>
  </h3>

  <div class="grid-container1">
    <SlickgridVue
      v-model:options="gridOptions1!"
      v-model:columns="columnDefinitions1"
      v-model:data="dataset1"
      grid-id="grid48-1"
      @onVueGridCreated="vueGrid1Ready($event.detail)"
    >
    </SlickgridVue>
  </div>

  <hr />

  <h3>
    Grid 2
    <small class="subtitle ms-3 text-italic">
      <label>Range Selection</label>
      <span id="selectionRange2"></span>
    </small>
  </h3>

  <slickgrid-vue
    v-model:options="gridOptions2!"
    v-model:columns="columnDefinitions2"
    v-model:data="dataset2"
    grid-id="grid48-2"
    @onVueGridCreated="vueGrid2Ready($event.detail)"
  >
  </slickgrid-vue>
</template>
