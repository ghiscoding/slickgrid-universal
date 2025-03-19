<script setup lang="ts">
import {
  type GridOption,
  type SlickgridVueInstance,
  type Column,
  type EditCommand,
  Editors,
  FieldType,
  Filters,
  type Formatter,
  Formatters,
  type OnEventArgs,
  OperatorType,
  SlickGlobalEditorLock,
  SlickgridVue,
} from 'slickgrid-vue';
import { ComponentPublicInstance, createApp, onBeforeMount, ref, type Ref } from 'vue';

import { CustomVueComponentEditor } from './custom-viewModelEditor';
import { CustomVueComponentFilter } from './custom-viewModelFilter';
import CustomTitleFormatter from './CustomTitleFormatterComponent.vue';
import EditorSelect from './SelectEditorComponent.vue';
import FilterSelect from './SelectFilterComponent.vue';

const NB_ITEMS = 500;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;
const _commandQueue: EditCommand[] = [];
const updatedObject = ref<any>();
const isAutoEdit = ref(true);
const alertWarning = ref<any>();
const assignees = ref([
  { id: '', name: '' },
  { id: '1', name: 'John' },
  { id: '2', name: 'Pierre' },
  { id: '3', name: 'Paul' },
]);

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  dataset.value = mockData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      filterable: true,
      sortable: true,
      type: FieldType.string,
      editor: {
        model: Editors.longText,
        minLength: 5,
        maxLength: 255,
      },
      minWidth: 100,
      onCellChange: (_e: Event, args: OnEventArgs) => {
        console.log(args);
        alertWarning.value = `Updated Title: ${args.dataContext.title}`;
      },
    },
    {
      id: 'assignee',
      name: 'Assignee',
      field: 'assignee',
      minWidth: 100,
      filterable: true,
      sortable: true,
      filter: {
        model: CustomVueComponentFilter,
        collection: assignees.value,
        params: {
          component: FilterSelect,
        },
      },
      queryFieldFilter: 'assignee.id', // for a complex object it's important to tell the Filter which field to query
      queryFieldSorter: 'assignee.name',
      formatter: Formatters.complexObject,
      params: {
        complexFieldLabel: 'assignee.name',
      },
      exportWithFormatter: true,
      editor: {
        model: CustomVueComponentEditor,
        collection: assignees.value,
        params: {
          component: EditorSelect,
        },
      },
      onCellChange: (_e: Event, args: OnEventArgs) => {
        console.log(args);
        alertWarning.value = `Updated Title: ${args.dataContext.title}`;
      },
    },
    {
      id: 'assignee2',
      name: 'Assignee with Vue Component',
      field: 'assignee',
      minWidth: 125,
      filterable: true,
      sortable: true,
      filter: {
        model: CustomVueComponentFilter,
        collection: assignees.value,
        params: {
          component: FilterSelect,
        },
      },
      queryFieldFilter: 'assignee.id', // for a complex object it's important to tell the Filter which field to query and our CustomVueComponentFilter returns the "id" property
      queryFieldSorter: 'assignee.name',

      formatter: vueComponentFormatter,
      params: {
        component: CustomTitleFormatter,
        complexFieldLabel: 'assignee.name', // for the exportCustomFormatter
      },
      exportCustomFormatter: Formatters.complexObject,
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      filterable: true,
      minWidth: 100,
      sortable: true,
      type: FieldType.number,
      filter: { model: Filters.slider, filterOptions: { hideSliderNumber: false } },
      editor: {
        model: Editors.slider,
        minValue: 0,
        maxValue: 100,
        // editorOptions: { hideSliderNumber: true },
      },
      /*
        editor: {
          // default is 0 decimals, if no decimals is passed it will accept 0 or more decimals
          // however if you pass the "decimalPlaces", it will validate with that maximum
          model: Editors.float,
          minValue: 0,
          maxValue: 365,
          // the default validation error message is in English but you can override it by using "errorMessage"
          // errorMessage: i18n.tr('INVALID_FLOAT', { maxDecimal: 2 }),
          params: { decimalPlaces: 2 },
        },
        */
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      filterable: true,
      formatter: Formatters.multiple,
      type: FieldType.number,
      editor: {
        // We can also add HTML text to be rendered (any bad script will be sanitized) but we have to opt-in, else it will be sanitized
        enableRenderHtml: true,
        collection: Array.from(Array(101).keys()).map((k) => ({
          value: k,
          label: k,
          symbol: '<i class="mdi mdi-percent-outline" style="color:cadetblue"></i>',
        })),
        customStructure: {
          value: 'value',
          label: 'label',
          labelSuffix: 'symbol',
        },
        collectionSortBy: {
          property: 'label',
          sortDesc: true,
        },
        collectionFilterBy: {
          property: 'value',
          value: 0,
          operator: OperatorType.notEqual,
        },
        model: Editors.singleSelect,
      },
      minWidth: 100,
      params: {
        formatters: [Formatters.collectionEditor, Formatters.percentCompleteBar],
      },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      filterable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 100,
      type: FieldType.date,
      editor: {
        model: Editors.date,
      },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      filterable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 100,
      type: FieldType.date,
      editor: {
        model: Editors.date,
      },
    },
  ];

  gridOptions.value = {
    asyncEditorLoading: false,
    autoEdit: isAutoEdit.value,
    autoCommitEdit: false,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    rowHeight: 45, // increase row height so that the custom elements fits in the cell
    editable: true,
    enableCellNavigation: true,
    enableColumnPicker: true,
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    editCommandHandler: (_item, _column, editCommand) => {
      _commandQueue.push(editCommand);
      editCommand.execute();
    },
  };
}

function mockData(count: number) {
  // mock a dataset
  const tempDataset: any[] = [];
  for (let i = 0; i < count; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);

    tempDataset.push({
      id: i,
      title: 'Task ' + i,
      assignee: i % 3 ? assignees.value[2] : i % 2 ? assignees.value[1] : assignees.value[0],
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 1, randomDay),
      effortDriven: i % 5 === 0,
    });
  }
  return tempDataset;
}

function onCellChanged(_e: Event, args: any) {
  console.log('onCellChange', args);
  updatedObject.value = { ...args.item };
}

function onCellClicked(_e: Event, args: any) {
  const metadata = vueGrid.gridService.getColumnFromEventArguments(args);
  console.log(metadata);

  if (metadata.columnDef.id === 'edit') {
    alertWarning.value = `open a modal window to edit: ${metadata.dataContext.title}`;

    // highlight the row, to customize the color, you can change the SASS variable $row-highlight-background-color
    vueGrid.gridService.highlightRow(args.row, 1500);

    // you could also select the row, when using "enableCellNavigation: true", it automatically selects the row
    // vueGrid.gridService.setSelectedRow(args.row);
  } else if (metadata.columnDef.id === 'delete') {
    if (confirm('Are you sure?')) {
      vueGrid.gridService.deleteItemById(metadata.dataContext.id);
      alertWarning.value = `Deleted: ${metadata.dataContext.title}`;
    }
  }
}

function changeAutoCommit() {
  gridOptions.value!.autoCommitEdit = !gridOptions.value!.autoCommitEdit;
  vueGrid.slickGrid.setOptions({
    autoCommitEdit: gridOptions.value!.autoCommitEdit,
  });
  return true;
}

const vueComponentFormatter: Formatter = (_row: number, _cell: number, _val: any, colDef: Column, dataContext: any) => {
  const component = colDef.params?.component;
  if (component) {
    const bindableData = {
      model: dataContext,
      // grid: vueGrid.slickGrid,
    };

    const tmpDiv = document.createElement('div');
    const app = createApp(component, bindableData); // add any necessary use() when needed, i.e. `use(router).use(pinia)`
    app.mount(tmpDiv) as ComponentPublicInstance;
    return tmpDiv;
  }
  return '';
};

function setAutoEdit(isAutoEdit: boolean) {
  isAutoEdit = isAutoEdit;
  vueGrid.slickGrid.setOptions({
    autoEdit: isAutoEdit,
  });
  return true;
}

function undo() {
  const command = _commandQueue.pop();
  if (command && SlickGlobalEditorLock.cancelCurrentEdit()) {
    command.undo();
    vueGrid.slickGrid.gotoCell(command.row, command.cell, false);
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
    Example 26: Use of Vue Components
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example26.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    <h5>Custom Filters, Editors with Vue Components</h5>
    <ul>
      <li>Support of Vue Component as Custom Editor (click on any "Assignee" name cell)</li>
      <ul>
        <li>That column uses a simple select drodown wrapped in an Vue Component</li>
        <li>Increased Grid Options "rowHeight" &amp; "headerRowHeight" to 45 so that the Custom Element fits in the cell.</li>
      </ul>
      <li>Support of Vue Component as Custom Filter ("Assignee" columns), which also uses Custom Element</li>
      <li>The 2nd "Assignee" column (showing in bold text) uses a Vue Component</li>
      <ul>
        <li>Can we use Vue Component as Customer Formatter? Yes but prefer native as much as possible</li>
      </ul>
    </ul>
  </div>

  <div class="row">
    <div class="col-sm-6">
      <label>autoEdit setting</label>
      <br />
      <span id="radioAutoEdit">
        <div class="row">
          <div class="col">
            <label class="radio-inline control-label me-1" for="radioTrue">
              <input type="radio" name="inlineRadioOptions" id="radioTrue" checked v-model="isAutoEdit" @click="setAutoEdit(true)" />
              ON (single-click)
            </label>
            <label class="radio-inline control-label" for="radioFalse">
              <input type="radio" name="inlineRadioOptions" id="radioFalse" v-model="isAutoEdit" @click="setAutoEdit(false)" />
              OFF (double-click)
            </label>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <button class="btn btn-outline-secondary btn-sm btn-icon me-1" @click="undo()">
              <i class="mdi mdi-undo"></i>
              Undo last edit(s)
            </button>
            <label class="checkbox-inline control-label" for="autoCommitEdit">
              <input
                type="checkbox"
                id="autoCommitEdit"
                data-test="auto-edit-checkbox"
                v-model="gridOptions!.autoCommitEdit"
                @click="changeAutoCommit()"
              />
              Auto Commit Edit
            </label>
          </div>
        </div>
      </span>
      <div class="row" style="margin-top: 5px">
        <div class="col">
          <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-filters" @click="vueGrid.filterService.clearFilters()">
            Clear Filters
          </button>
          <button
            class="btn btn-outline-secondary btn-sm btn-icon mx-1"
            data-test="clear-sorting"
            @click="vueGrid.sortService.clearSorting()"
          >
            Clear Sorting
          </button>
        </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div class="alert alert-info" v-show="updatedObject"><strong>Updated Item:</strong> {{ JSON.stringify(updatedObject, null, 2) }}</div>
      <div class="alert alert-warning" v-show="alertWarning">
        {{ alertWarning }}
      </div>
    </div>
  </div>

  <slickgrid-vue
    grid-id="grid26"
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    @onCellChange.trigger="onCellChanged($event.detail.eventData, $event.detail.args)"
    @on@click="onCellClicked($event.detail.eventData, $event.detail.args)"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
