<script setup lang="ts">
import { type GridOption, type SlickgridVueInstance, type Column, Editors, FieldType, Formatters, SlickgridVue } from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

const NB_ITEMS = 1000;
const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  dataset.value = mockData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'delete',
      field: 'id',
      excludeFromHeaderMenu: true,
      formatter: Formatters.icon,
      params: { iconCssClass: 'mdi mdi-trash-can pointer' },
      minWidth: 30,
      maxWidth: 30,
      // use onCellClick OR grid.onClick.subscribe which you can see down below
      onCellClick: (_e, args) => {
        console.log(args);
        if (confirm('Are you sure?')) {
          vueGrid.gridService.deleteItemById(args.dataContext.id);
        }
      },
    },
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      sortable: true,
      type: FieldType.string,
      editor: {
        model: Editors.longText,
      },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      sortable: true,
      type: FieldType.number,
      editor: {
        model: Editors.text,
      },
      onCellChange: (_e, args) => {
        alert('onCellChange directly attached to the column definition');
        console.log(args);
      },
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      type: FieldType.number,
      editor: {
        model: Editors.integer,
      },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      sortable: true,
      type: FieldType.date,
      /*
        editor: {
          model: Editors.date
        }
        */
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      sortable: true,
      type: FieldType.date,
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      formatter: Formatters.checkmarkMaterial,
      type: FieldType.number,
      editor: {
        model: Editors.checkbox,
      },
    },
  ];

  gridOptions.value = {
    asyncEditorLoading: false,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    editable: true,
    enableColumnPicker: true,
    enableCellNavigation: true,
    enableRowSelection: true,
  };
}

function mockData(itemCount: number) {
  // mock a dataset
  const mockedDataset: any[] = [];
  for (let i = 0; i < itemCount; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);

    mockedDataset[i] = {
      id: i,
      title: 'Task ' + i,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 1, randomDay),
      effortDriven: i % 5 === 0,
    };
  }
  return mockedDataset;
}

function addNewItem(insertPosition?: 'top' | 'bottom') {
  const newItem1 = createNewItem(1);
  // const newItem2 = createNewItem(2);

  // single insert
  vueGrid.gridService.addItem(newItem1, { position: insertPosition });

  // OR multiple inserts
  // vueGrid.gridService.addItems([newItem1, newItem2], { position: insertPosition });
}

function createNewItem(incrementIdByHowMany = 1) {
  const dataset = vueGrid.dataView.getItems();
  let highestId = 0;
  dataset.forEach((item) => {
    if (item.id > highestId) {
      highestId = item.id;
    }
  });
  const newId = highestId + incrementIdByHowMany;
  const randomYear = 2000 + Math.floor(Math.random() * 10);
  const randomMonth = Math.floor(Math.random() * 11);
  const randomDay = Math.floor(Math.random() * 29);
  const randomPercent = Math.round(Math.random() * 100);

  return {
    id: newId,
    title: 'Task ' + newId,
    duration: Math.round(Math.random() * 100) + '',
    percentComplete: randomPercent,
    percentCompleteNumber: randomPercent,
    start: new Date(randomYear, randomMonth, randomDay),
    finish: new Date(randomYear, randomMonth + 2, randomDay),
    effortDriven: true,
  };
}

/** Change the Duration Rows Background Color */
function changeDurationBackgroundColor() {
  vueGrid.dataView.getItemMetadata = updateItemMetadataForDurationOver40(vueGrid.dataView.getItemMetadata);
  // also re-render the grid for the styling to be applied right away
  vueGrid.slickGrid.invalidate();
  vueGrid.slickGrid.render();
  // or use the SlickGrid-Vue GridService
  // gridService.renderGrid();
}

/** Highlight the 5th row using the Slickgrid-Vue GridService */
function highlighFifthRow() {
  scrollGridTop();
  vueGrid.gridService.highlightRow(4, 1500);
}

/**
 * Change the SlickGrid Item Metadata, we will add a CSS class on all rows with a Duration over 40
 * For more info, you can see this SO https://stackoverflow.com/a/19985148/1212166
 */
function updateItemMetadataForDurationOver40(previousItemMetadata: any) {
  const newCssClass = 'duration-bg';
  return (rowNumber: number) => {
    const item = vueGrid.dataView.getItem(rowNumber);
    let meta = {
      cssClasses: '',
    };
    if (typeof previousItemMetadata === 'object') {
      meta = previousItemMetadata(rowNumber);
    }
    if (meta && item && item.duration) {
      const duration = +item.duration; // convert to number
      if (duration > 40) {
        meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
      }
    }
    return meta;
  };
}

function updateSecondItem() {
  scrollGridTop();
  const updatedItem = vueGrid.gridService.getDataItemByRowNumber(1);
  updatedItem.duration = Math.round(Math.random() * 100);
  vueGrid.gridService.updateItem(updatedItem);

  // OR by id
  // vueGrid.gridService.updateItemById(updatedItem.id, updatedItem);

  // OR multiple changes
  /*
    const updatedItem1 = vueGrid.gridService.getDataItemByRowNumber(1);
    const updatedItem2 = vueGrid.gridService.getDataItemByRowNumber(2);
    updatedItem1.duration = Math.round(Math.random() * 100);
    updatedItem2.duration = Math.round(Math.random() * 100);
    vueGrid.gridService.updateItems([updatedItem1, updatedItem2], { highlightRow: true });
    */
}

function scrollGridBottom() {
  vueGrid.slickGrid.navigateBottom();
}

function scrollGridTop() {
  vueGrid.slickGrid.navigateTop();
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
    Example 11: Add / Update / Highlight a Datagrid Item
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example11.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    Add / Update / Hightlight an Item from the Datagrid (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/add-update-highlight"
      target="_blank"
      >Wiki docs</a
    >).
    <ul>
      <li><b>Note:</b> this demo is <b>only</b> on the datagrid (client) side, you still need to deal with the backend yourself</li>
      <li>Adding an item, will always be showing as the 1st item in the grid because that is the best visual place to add it</li>
      <li>Add/Update an item requires a valid Slickgrid Selection Model, you have 2 choices to deal with this:</li>
      <ul>
        <li>You can enable "enableCheckboxSelector" or "enableRowSelection" to True</li>
      </ul>
      <li>Click on any of the buttons below to test this out</li>
      <li>
        You can change the highlighted color &amp; animation by changing the
        <a href="https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss" target="_blank"
          >SASS Variables</a
        >
      </li>
      <ul>
        <li>"$row-highlight-background-color" or "$row-highlight-fade-animation"</li>
      </ul>
      <li>You can also add CSS class(es) on the fly (or on page load) on rows with certain criteria, (e.g. click on last button)</li>
      <li>
        <ul>
          <li>
            Example, click on button "Highlight Rows with Duration over 50" to see row styling changing.
            <a href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/dynamic-item-metadata" target="_blank">Wiki doc</a>
          </li>
        </ul>
      </li>
    </ul>
  </div>

  <div class="col-sm-12">
    <span>
      <label>Scroll: </label>
      <div class="btn-group ms-1" role="group" aria-label="...">
        <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="scroll-top-btn" @click="scrollGridTop()">
          <i class="mdi mdi-arrow-down mdi-rotate-180 icon"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="scroll-bottom-btn" @click="scrollGridBottom()">
          <i class="mdi mdi-arrow-down icon"></i>
        </button>
      </div>
      <button class="btn btn-sm btn-outline-secondary btn-icon mx-1" data-test="add-new-item-top-btn" @click="addNewItem()">
        Add New Mocked Item (top)
      </button>
      <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="add-new-item-bottom-btn" @click="addNewItem('bottom')">
        Add New Mocked Item (bottom)
      </button>
      <button class="btn btn-sm btn-outline-secondary btn-icon mx-1" data-test="update-second-item-btn" @click="updateSecondItem()">
        Update 2nd Row Item with Random Duration
      </button>
      <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="highlight-row5-btn" @click="highlighFifthRow()">
        Highlight 5th Row
      </button>
      <button
        class="btn btn-sm btn-outline-secondary btn-icon mx-1"
        data-test="highlight-duration40-btn"
        @click="changeDurationBackgroundColor()"
      >
        Highlight Rows with Duration over 50
      </button>
    </span>
    <hr />
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions as Column[]"
    v-model:data="dataset"
    grid-id="grid11"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss" scoped>
.duration-bg {
  background-color: #e9d4f1 !important;
}
</style>
