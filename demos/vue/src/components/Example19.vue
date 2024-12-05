<script setup lang="ts">
import type { GridOption, SlickgridVueInstance } from 'slickgrid-vue';
import { type Column, Editors, ExtensionName, FieldType, Filters, Formatters, SlickgridVue } from 'slickgrid-vue';
import { computed, onBeforeMount, onUnmounted, ref } from 'vue';

import Example19Detail from './Example19Detail.vue';
import Example19Preload from './Example19Preload.vue';

const NB_ITEMS = 500;
const gridOptions = ref<GridOption>();
const detailViewRowCount = ref(9);
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
const isDarkMode = ref(false);
const showSubTitle = ref(true);
const flashAlertType = ref('alert-info');
const message = ref('');
let vueGrid!: SlickgridVueInstance;

const rowDetailInstance = computed(() => vueGrid?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView));

onBeforeMount(() => {
  defineGrid();

  // mock some data (different in each dataset)
  dataset.value = getData(NB_ITEMS);
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
      sortable: true,
      type: FieldType.string,
      width: 70,
      filterable: true,
      editor: { model: Editors.text },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      formatter: Formatters.decimal,
      params: { minDecimal: 1, maxDecimal: 2 },
      sortable: true,
      type: FieldType.number,
      minWidth: 90,
      filterable: true,
    },
    {
      id: 'percent2',
      name: '% Complete',
      field: 'percentComplete2',
      editor: { model: Editors.slider },
      formatter: Formatters.progressBar,
      type: FieldType.number,
      sortable: true,
      minWidth: 100,
      filterable: true,
      filter: { model: Filters.slider, operator: '>' },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      sortable: true,
      type: FieldType.date,
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
      type: FieldType.date,
      minWidth: 90,
      exportWithFormatter: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      minWidth: 100,
      formatter: Formatters.checkmarkMaterial,
      type: FieldType.boolean,
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

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableFiltering: true,
    enableRowDetailView: true,
    darkMode: isDarkMode.value,
    datasetIdPropertyName: 'rowId', // optionally use a different "id"
    rowDetailView: {
      // optionally change the column index position of the icon (defaults to 0)
      // columnIndexPosition: 1,

      // We can load the "process" asynchronously in 3 different ways (aurelia-http-client, aurelia-fetch-client OR even Promise)
      process: (item: any) => simulateServerAsyncCall(item),
      // process: (item) => this.http.get(`api/item/${item.id}`),

      // load only once and reuse the same item detail without calling process method
      loadOnce: true,

      // limit expanded row to only 1 at a time
      singleRowExpand: false,

      // false by default, clicking anywhere on the row will open the detail view
      // when set to false, only the "+" icon would open the row detail
      // if you use editor or cell navigation you would want this flag set to false (default)
      useRowClick: true,

      // how many grid rows do we want to use for the row detail panel (this is only set once and will be used for all row detail)
      // also note that the detail view adds an extra 1 row for padding purposes
      // so if you choose 4 panelRows, the display will in fact use 5 rows
      panelRows: detailViewRowCount.value,

      // you can override the logic for showing (or not) the expand icon
      // for example, display the expand icon only on every 2nd row
      // expandableOverride: (row: number, dataContext: any) => (dataContext.rowId % 2 === 1),

      // Preload View Template
      preloadComponent: Example19Preload,

      // ViewModel Template to load when row detail data is ready
      viewComponent: Example19Detail as any,

      // optionally expose the functions that you want to use from within the row detail Child Component
      parent: { showFlashMessage },

      onBeforeRowDetailToggle: (_e, args) => {
        // you coud cancel opening certain rows
        // if (args.item.rowId === 1) {
        //   e.preventDefault();
        //   return false;
        // }
        console.log('before toggling row detail', args.item);
        return true;
      },
    },
    rowSelectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: true,
    },

    // You could also enable Row Selection as well, but just make sure to disable `useRowClick: false`
    // enableCheckboxSelector: true,
    // enableRowSelection: true,
    // checkboxSelector: {
    //   hideInFilterHeaderRow: false,
    //   hideSelectAllCheckbox: true,
    // },
  };
}

function getData(count: number) {
  // mock a dataset
  const tmpData: any[] = [];
  for (let i = 0; i < count; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);

    tmpData[i] = {
      rowId: i,
      title: 'Task ' + i,
      duration: i % 33 === 0 ? null : Math.random() * 100 + '',
      percentComplete: randomPercent,
      percentComplete2: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 1, randomDay),
      effortDriven: i % 5 === 0,
    };
  }

  return tmpData;
}

function changeDetailViewRowCount() {
  const options = rowDetailInstance.value.getOptions();
  if (options && options.panelRows) {
    options.panelRows = detailViewRowCount.value; // change number of rows dynamically
    rowDetailInstance.value.setOptions(options);
  }
}

function changeEditableGrid() {
  // rowDetailInstance.value.setOptions({ useRowClick: false });
  rowDetailInstance.value.collapseAll();
  (rowDetailInstance.value as any).addonOptions.useRowClick = false;
  gridOptions.value!.autoCommitEdit = !gridOptions.value!.autoCommitEdit;
  vueGrid?.slickGrid.setOptions({
    editable: true,
    autoEdit: true,
    enableCellNavigation: true,
  });
  return true;
}

function closeAllRowDetail() {
  rowDetailInstance.value.collapseAll();
}

function showFlashMessage(msg: string, alertType = 'info') {
  message.value = msg;
  flashAlertType.value = `alert-${alertType}`;
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
    window.setTimeout(() => {
      const itemDetail = item;

      // let's add some extra properties to our item for a better async simulation
      itemDetail.assignee = randomNames[randomNumber(0, 10)];
      itemDetail.reporter = randomNames[randomNumber(0, 10)];

      // resolve the data after delay specified
      resolve(itemDetail);
    }, 1000);
  });
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  toggleBodyBackground();
  vueGrid.slickGrid?.setOptions({ darkMode: isDarkMode.value });
  closeAllRowDetail();
}

function toggleBodyBackground() {
  if (isDarkMode.value) {
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
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => vueGrid.resizerService.resizeGrid());
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}

defineExpose({
  showFlashMessage,
});
</script>

<template>
  <div ref="compRef">
    <h2>
      Example 19: Row Detail View
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="toggle-dark-mode" @click="toggleDarkMode()">
        <span class="mdi mdi-theme-light-dark"></span>
        <span>Toggle Dark Mode</span>
      </button>
      <span class="float-end">
        <a
          style="font-size: 18px"
          target="_blank"
         href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/example19.vue"
        >
          <span class="mdi mdi-link-variant"></span> code
        </a>
      </span>
      <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
        <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
      </button>
    </h2>

    <div class="subtitle">
      Add functionality to show extra information with a Row Detail View, (<a
        href="https://ghiscoding.gitbook.io/aurelia-slickgrid/grid-functionalities/row-detail"
        target="_blank"
        >Wiki docs</a
      >)
      <ul>
        <li>Click on the row "+" icon or anywhere on the row to open it (the latter can be changed via property "useRowClick: false")</li>
        <li>Pass a View/Model as a Template to the Row Detail</li>
        <li>
          You can use "expandableOverride()" callback to override logic to display expand icon on every row (for example only show it every
          2nd row)
        </li>
      </ul>
    </div>

    <div class="row">
      <div class="col-sm-6">
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="editable-grid-btn" @click="changeEditableGrid()">
          Make Grid Editable
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="collapse-all-btn" @click="closeAllRowDetail()">
          Close all Row Details
        </button>
        &nbsp;&nbsp;

        <span class="d-inline-flex gap-4px">
          <label for="detailViewRowCount">Detail View Rows Shown: </label>
          <input id="detailViewRowCount" v-model="detailViewRowCount" type="number" style="height: 26px; width: 40px" />
          <button
            class="btn btn-outline-secondary btn-xs btn-icon"
            style="height: 26px"
            data-test="set-count-btn"
            @click="changeDetailViewRowCount()"
          >
            Set
          </button>
        </span>
      </div>
      <div v-if="message" class="alert col-sm-6" :class="{ [flashAlertType]: true }" data-test="flash-msg">{{ message }}</div>
    </div>

    <hr />

    <slickgrid-vue
      v-model:options="gridOptions!"
      v-model:columns="columnDefinitions as Column[]"
      v-model:data="dataset"
      grid-id="grid19"
      @onVueGridCreated="vueGridReady($event.detail)"
    >
    </slickgrid-vue>
  </div>
</template>
