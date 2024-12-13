<script setup lang="ts">
import {
  type AutocompleterOption,
  type Column,
  type EditCommand,
  Editors,
  type EditorValidator,
  FieldType,
  Filters,
  Formatters,
  type GridOption,
  type OnEventArgs,
  OperatorType,
  SlickGlobalEditorLock,
  SlickgridVue,
  type SlickgridVueInstance,
  SortComparers,
  type VanillaCalendarOption,
} from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

import { CustomInputEditor } from './custom-inputEditor';
import { CustomInputFilter } from './custom-inputFilter';
import SAMPLE_COLLECTION_DATA from './data/collection_100_numbers.json';
import SAMPLE_COLLECTION_DATA_URL from './data/collection_100_numbers.json?url';
import COUNTRIES_COLLECTION from './data/countries.json';
import COUNTRY_NAMES from './data/country_names.json';
import fetchJsonp from './jsonp.js';

const NB_ITEMS = 100;

let _commandQueue: EditCommand[] = [];
let duplicateTitleHeaderCount = 1;
let isAutoEdit = true;
const alertWarning = ref();
const updatedObject = ref();
const showSubTitle = ref(true);

const gridOptions = ref<GridOption>({
  autoEdit: isAutoEdit,
  autoCommitEdit: false,
  autoResize: {
    container: '#demo-container',
    rightPadding: 10,
  },
  editable: true,
  enableCellNavigation: true,
  enableExcelCopyBuffer: true,
  enableFiltering: true,
  editCommandHandler: (_item, _column, editCommand) => {
    _commandQueue.push(editCommand);
    editCommand.execute();
  },
  // i18n: i18n,
});
const columnDefinitions = ref<Array<Column>>([]);
const dataset = ref<any[]>([]);
let vueGrid!: SlickgridVueInstance;

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator: EditorValidator = (value: any) => {
  // you can get the Editor Args which can be helpful, e.g. we can get the Translate Service from it
  // const grid = args && args.grid;
  // const gridOptions = grid.getOptions() as GridOption;
  // const i18n = gridOptions.i18n;

  if (value === null || value === undefined || !value.length) {
    return { valid: false, msg: 'This is a required field' };
  } else if (!/^Task\s\d+$/.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number' };
    // OR use the Translate Service with your custom message
    // return { valid: false, msg: i18n.tr('YOUR_ERROR', { x: value }) };
  }
  return { valid: true, msg: '' };
};

// create a custom Formatter to show the Task + value
const taskFormatter = (_row: number, _cell: number, value: any) => {
  if (value && Array.isArray(value)) {
    const taskValues = value.map((val) => `Task ${val}`);
    const values = taskValues.join(', ');
    return `<span title="${values}">${values}</span>`;
  }
  return '';
};

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  dataset.value = mockData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'edit',
      field: 'id',
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      formatter: Formatters.icon,
      params: { iconCssClass: 'mdi mdi-pencil pointer' },
      minWidth: 30,
      maxWidth: 30,
      // use onCellClick OR grid.onClick.subscribe which you can see down below
      // onCellClick: (_e: Event, args: OnEventArgs) => {
      //   console.log(args);
      //   alertWarning.value = `Editing: ${args.dataContext.title}`;
      //   vueGrid.gridService.highlightRow(args.row, 1500);
      //   vueGrid.gridService.setSelectedRow(args.row);
      // },
    },
    {
      id: 'delete',
      field: 'id',
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromHeaderMenu: true,
      formatter: Formatters.icon,
      params: { iconCssClass: 'mdi mdi-trash-can pointer' },
      minWidth: 30,
      maxWidth: 30,
      // use onCellClick OR grid.onClick.subscribe which you can see down below
      /*
        onCellClick: (e: Event, args: OnEventArgs) => {
          console.log(args);
          alertWarning.value = `Deleting: ${args.dataContext.title}`;
        }
        */
    },
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      filterable: true,
      sortable: true,
      type: FieldType.string,
      editor: {
        model: Editors.longText,
        placeholder: 'something',
        title: 'some title',
        validator: myCustomTitleValidator, // use a custom validator
      },
      minWidth: 100,
      onCellChange: (_e: Event, args: OnEventArgs) => {
        console.log(args);
        alertWarning.value = `Updated Title: ${args.dataContext.title}`;
      },
    },
    {
      id: 'title2',
      name: 'Title, Custom Editor',
      field: 'title',
      filterable: true,
      sortable: true,
      type: FieldType.string,
      editor: {
        model: CustomInputEditor,
        placeholder: 'custom',
        validator: myCustomTitleValidator, // use a custom validator
      },
      filter: {
        model: CustomInputFilter,
        placeholder: '🔎︎ custom',
      },
      minWidth: 70,
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      filterable: true,
      minWidth: 100,
      sortable: true,
      type: FieldType.number,
      filter: {
        model: Filters.slider,
        filterOptions: { hideSliderNumber: false },
      },
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
        // validator: (value, args) => {
        //   if (value < 50) {
        //     return { valid: false, msg: 'Please use at least 50%' };
        //   }
        //   return { valid: true, msg: '' };
        // }
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
      // filter: { model: Filters.compoundDate },
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
      // filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 100,
      type: FieldType.date, // dataset cell input format
      // outputType: FieldType.dateUs,   // date picker format
      saveOutputType: FieldType.dateUtc, // save output date format
      editor: {
        model: Editors.date,
        // override any of the calendar options through "filterOptions"
        editorOptions: { range: { min: 'today' } } as VanillaCalendarOption,
      },
    },
    {
      id: 'cityOfOrigin',
      name: 'City of Origin',
      field: 'cityOfOrigin',
      filterable: true,
      sortable: true,
      minWidth: 100,
      editor: {
        model: Editors.autocompleter,
        placeholder: '🔎︎ search city',

        // We can use the autocomplete through 3 ways 'collection', 'collectionAsync' or with your own autocomplete options
        // use your own autocomplete options, instead of fetch-jsonp, use Fetch
        // here we use fetch-jsonp just because I'm not sure how to configure fetch with JSONP and CORS
        editorOptions: {
          minLength: 3,
          forceUserInput: true,
          fetch: (searchText: string, updateCallback: (items: false | any[]) => void) => {
            /** with JSONP it will work locally but not on the GitHub demo because of CORS */
            fetchJsonp<string[]>(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`, { crossorigin: true })
              .then((response) => response.json())
              .then((json) => updateCallback(json))
              .catch((ex) => console.log('invalid JSONP response', ex));
          },
        } as AutocompleterOption,
      },
      filter: {
        model: Filters.autocompleter,
        // placeholder: '🔎︎ search city',

        // We can use the autocomplete through 3 ways 'collection', 'collectionAsync' or with your own autocomplete options
        // collectionAsync: this.httpFetch.fetch(URL_COUNTRIES_COLLECTION),

        // OR use your own autocomplete options, instead of fetch-jsonp, use Fetch
        // here we use fetch-jsonp just because I'm not sure how to configure fetch with JSONP and CORS
        filterOptions: {
          minLength: 3,
          fetch: (searchText: string, updateCallback: (items: false | any[]) => void) => {
            /** with JSONP will work locally but not on the GitHub demo because of CORS */
            fetchJsonp(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`)
              .then((response) => response.json())
              .then((json) => updateCallback(json))
              .catch((ex) => console.log('invalid JSONP response', ex));
          },
        } as AutocompleterOption,
      },
    },
    {
      id: 'countryOfOrigin',
      name: 'Country of Origin',
      field: 'countryOfOrigin',
      formatter: Formatters.complexObject,
      dataKey: 'code',
      labelKey: 'name',
      type: FieldType.object,
      sortComparer: SortComparers.objectString,
      filterable: true,
      sortable: true,
      minWidth: 100,
      editor: {
        model: Editors.autocompleter,
        customStructure: { label: 'name', value: 'code' },
        collectionAsync: Promise.resolve(COUNTRIES_COLLECTION),
      },
      filter: {
        model: Filters.autocompleter,
        customStructure: { label: 'name', value: 'code' },
        collectionAsync: Promise.resolve(COUNTRIES_COLLECTION),
      },
    },
    {
      id: 'countryOfOriginName',
      name: 'Country of Origin Name',
      field: 'countryOfOriginName',
      filterable: true,
      sortable: true,
      minWidth: 100,
      editor: {
        model: Editors.autocompleter,
        collectionAsync: Promise.resolve(COUNTRY_NAMES),
      },
      filter: {
        model: Filters.autocompleter,
        collectionAsync: Promise.resolve(COUNTRY_NAMES),
      },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      filterable: true,
      type: FieldType.boolean,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
      },
      formatter: Formatters.checkmarkMaterial,
      editor: {
        model: Editors.checkbox,
      },
      minWidth: 70,
    },
    {
      id: 'prerequisites',
      name: 'Prerequisites',
      field: 'prerequisites',
      filterable: true,
      formatter: taskFormatter,
      exportWithFormatter: true,
      sanitizeDataExport: true,
      minWidth: 100,
      sortable: true,
      type: FieldType.string,
      editor: {
        // We can load the 'collection' asynchronously (on first load only, after that we will simply use 'collection')
        // 3 ways are supported (fetch, Promise or RxJS when available)

        // 1- use `fetch`
        // collectionAsync: fetch(URL_SAMPLE_COLLECTION_DATA),

        // OR 2- use a Promise
        collectionAsync: Promise.resolve(SAMPLE_COLLECTION_DATA),

        // OR a regular 'collection' load
        // collection: Array.from(Array(NB_ITEMS).keys()).map(k => ({ value: k, label: k, prefix: 'Task', suffix: 'days' })),
        collectionSortBy: {
          property: 'value',
          sortDesc: true,
          fieldType: FieldType.number,
        },
        customStructure: {
          label: 'label',
          value: 'value',
          labelPrefix: 'prefix',
        },
        collectionOptions: {
          separatorBetweenTextLabels: ' ',
        },
        model: Editors.multipleSelect,
      },
      filter: {
        collectionAsync: fetch(SAMPLE_COLLECTION_DATA_URL),
        // collectionAsync: Promise.resolve(SAMPLE_COLLECTION_DATA),
        // collectionAsync: new Promise((resolve) => {
        //   window.setTimeout(() => {
        //     resolve(Array.from(Array(this.dataset.length).keys()).map(k => ({ value: k, label: `Task ${k}` })));
        //   });
        // }),

        // OR a regular collection load
        // collection: Array.from(Array(NB_ITEMS).keys()).map(k => ({ value: k, label: k, prefix: 'Task', suffix: 'days' })),
        collectionSortBy: {
          property: 'value',
          sortDesc: true,
          fieldType: FieldType.number,
        },
        customStructure: {
          label: 'label',
          value: 'value',
          labelPrefix: 'prefix',
        },
        collectionOptions: {
          separatorBetweenTextLabels: ' ',
        },
        model: Filters.multipleSelect,
        operator: OperatorType.inContains,
      },
    },
  ];
}

/** Add a new row to the grid and refresh the Filter collection */
function addItem() {
  const lastRowIndex = dataset.value.length;
  const newRows = mockData(1, lastRowIndex);

  // wrap into a timer to simulate a backend async call
  window.setTimeout(() => {
    // at any time, we can poke the "collection" property and modify it
    const requisiteColumnDef = columnDefinitions.value.find((column) => column.id === 'prerequisites');
    console.log('requisiteColumnDef', requisiteColumnDef);
    if (requisiteColumnDef) {
      const collectionEditor = requisiteColumnDef.editor!.collection;
      const collectionFilter = requisiteColumnDef.filter!.collection;

      if (Array.isArray(collectionEditor) && Array.isArray(collectionFilter)) {
        // add the new row to the grid
        vueGrid.gridService.addItem(newRows[0], { highlightRow: false });

        // then refresh the Editor/Filter "collection", we have 2 ways of doing it

        // 1- push to the "collection"
        collectionEditor.push({ value: lastRowIndex, label: lastRowIndex, prefix: 'Task', suffix: 'days' });
        collectionFilter.push({ value: lastRowIndex, label: lastRowIndex, prefix: 'Task', suffix: 'days' });

        // OR 2- replace the entire "collection" is also supported
        // requisiteColumnDef.filter.collection = [...collection, ...[{ value: lastRowIndex, label: lastRowIndex }]];
        // requisiteColumnDef.editor.collection = [...collection, ...[{ value: lastRowIndex, label: lastRowIndex }]];
      }
    }
  }, 250);
}

/** Delete last inserted row */
function deleteItem() {
  const requisiteColumnDef = columnDefinitions.value.find((column) => column.id === 'prerequisites');
  if (requisiteColumnDef) {
    const collectionEditor = requisiteColumnDef.editor!.collection;
    const collectionFilter = requisiteColumnDef.filter!.collection;

    if (Array.isArray(collectionEditor) && Array.isArray(collectionFilter)) {
      // sort collection in descending order and take out last option from the collection
      const selectCollectionObj = sortCollectionDescending(collectionEditor).pop();
      sortCollectionDescending(collectionFilter).pop();
      vueGrid.gridService.deleteItemById(selectCollectionObj.value);
    }
  }
}

function sortCollectionDescending(collection: any[]) {
  return collection.sort((item1, item2) => item1.value - item2.value);
}

function mockData(itemCount: number, startingIndex = 0) {
  // mock a dataset
  const tempDataset: any[] = [];
  for (let i = startingIndex; i < startingIndex + itemCount; i++) {
    const randomYear = 2000 + randomBetween(4, 15);
    const randomFinishYear = new Date().getFullYear() - 3 + Math.floor(Math.random() * 10); // use only years not lower than 3 years ago
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);
    const randomFinish = new Date(randomFinishYear, randomMonth + 1, randomDay);

    tempDataset.push({
      id: i,
      title: 'Task ' + i,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: randomFinish < new Date() ? '' : randomFinish, // make sure the random date is earlier than today
      effortDriven: i % 5 === 0,
      prerequisites: i % 2 === 0 && i !== 0 && i < 12 ? [i, i - 1] : [],
      countryOfOrigin: i % 2 ? { code: 'CA', name: 'Canada' } : { code: 'US', name: 'United States' },
      countryOfOriginName: i % 2 ? 'Canada' : 'United States',
      cityOfOrigin: i % 2 ? 'Vancouver, BC, Canada' : 'Boston, MA, United States',
    });
  }
  return tempDataset;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function onCellChanged(_e: Event, args: any) {
  console.log('onCellChange', args);
  updatedObject.value = { ...args.item };
}

function onCellClicked(_e: Event, args: any) {
  console.log('onCellClicked', args);
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
  return false;
}

function onValidationError(_e: Event, args: any) {
  if (args.validationResults) {
    alert(args.validationResults.msg);
  }
}
function changeAutoCommit() {
  gridOptions.value.autoCommitEdit = !gridOptions.value.autoCommitEdit;
  vueGrid.slickGrid.setOptions({
    autoCommitEdit: gridOptions.value.autoCommitEdit,
  });
  return true;
}

function dynamicallyAddTitleHeader() {
  const newCol = {
    id: `title${duplicateTitleHeaderCount++}`,
    name: 'Title',
    field: 'title',
    editor: {
      model: Editors.text,
      required: true,
      validator: myCustomTitleValidator, // use a custom validator
    },
    sortable: true,
    minWidth: 100,
    filterable: true,
  };

  // you can dynamically add your column to your column definitions
  columnDefinitions.value.push(newCol);

  // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
  // you MUST use "getAllColumnDefinitions()" from the GridService, using this will be ALL columns including the 1st column that is created internally
  // for example if you use the Checkbox Selector (row selection), you MUST use the code below
  /*
    const allColumns = vueGrid.gridService.getAllColumnDefinitions();
    allColumns.push(newCol);
    */
}

function dynamicallyRemoveLastColumn() {
  columnDefinitions.value.pop();

  /*
    // remove your column the full set of columns
    allOriginalColumns.pop();
  */
}

function setAutoEdit(autoEdit: boolean) {
  isAutoEdit = autoEdit;
  vueGrid.slickGrid.setOptions({
    autoEdit,
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
    Example 3: Editors / Delete
    <button
      class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
      type="button"
      data-test="toggle-subtitle"
      @click="toggleSubTitle()"
    >
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example03.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
  </h2>
  <div class="subtitle">
    Grid with Inline Editors and onCellClick actions (<a
      href="https://ghiscoding.gitbook.io/Vue-slickgrid/column-functionalities/editors"
      target="_blank"
      >Wiki docs</a
    >).
    <ul>
      <li>When using "enableCellNavigation: true", clicking on a cell will automatically make it active &amp; selected.</li>
      <ul>
        <li>If you don't want this behavior, then you should disable "enableCellNavigation"</li>
      </ul>
      <li>Inline Editors requires "enableCellNavigation: true" (not sure why though)</li>
      <li>
        Support Excel Copy Buffer (SlickGrid Copy Manager Plugin), you can use it by simply enabling "enableExcelCopyBuffer" flag.
        Note that it will only evaluate Formatter when the "exportWithFormatter" flag is enabled (through "ExcelExportOptions" or
        "TextExportOptions" or the column definition)
      </li>
      <li>
        Support of "collectionAsync" is possible, click on "Clear Filters/Sorting" then add/delete item(s) and look at
        "Prerequisites" Select Filter
      </li>
    </ul>
  </div>

  <div class="row">
    <div class="col-sm-6">
      <label class="me-1">autoEdit setting</label>
      <br />
      <span id="radioAutoEdit">
        <div class="row flex">
          <label class="radio-inline control-label me-1" for="radioTrue">
            <input id="radioTrue" type="radio" name="inlineRadioOptions" checked :value="isAutoEdit" @click="setAutoEdit(true)" />
            ON (single-click)
          </label>
          <label class="radio-inline control-label" for="radioFalse">
            <input id="radioFalse" type="radio" name="inlineRadioOptions" :value="isAutoEdit" @click="setAutoEdit(false)" /> OFF
            (double-click)
          </label>
        </div>
        <div class="row col-sm-12">
          <span>
            <button class="btn btn-outline-secondary btn-sm btn-icon me-1" data-test="undo-btn" @click="undo()">
              <i class="mdi mdi-undo me-1"></i>
              Undo last edit(s)
            </button>
            <label class="checkbox-inline control-label" for="autoCommitEdit">
              <input
                id="autoCommitEdit"
                type="checkbox"
                data-test="auto-commit"
                :value="gridOptions.autoCommitEdit"
                @click="changeAutoCommit()"
              />
              Auto Commit Edit
            </label>
          </span>
        </div>
      </span>
      <div class="row" style="margin-top: 5px">
        <div class="col-sm-12">
          <button
            class="btn btn-outline-secondary btn-sm btn-icon"
            data-test="clear-filters"
            @click="vueGrid.filterService.clearFilters()"
          >
            Clear Filters
          </button>
          <button
            class="btn btn-outline-secondary btn-sm btn-icon mx-1"
            data-test="clear-sorting"
            @click="vueGrid.sortService.clearSorting()"
          >
            Clear Sorting
          </button>
          <button
            class="btn btn-outline-primary btn-sm"
            data-test="add-item-btn"
            title="Clear Filters &amp; Sorting to see it better"
            @click="addItem()"
          >
            Add item
          </button>
          <button class="btn btn-outline-danger btn-sm mx-1" data-test="delete-item-btn" @click="deleteItem()">
            Delete item
          </button>
        </div>
      </div>
      <div class="row" style="margin-top: 5px">
        <div class="col-sm-12">
          <button
            class="btn btn-outline-secondary btn-sm btn-icon"
            data-test="add-title-column"
            @click="dynamicallyAddTitleHeader()"
          >
            <i class="mdi mdi-shape-square-plus me-1"></i>
            Dynamically Duplicate Title Column
          </button>
          <button
            class="btn btn-outline-secondary btn-sm btn-icon mx-1"
            data-test="remove-title-column"
            @click="dynamicallyRemoveLastColumn()"
          >
            <i class="mdi mdi-minus"></i>
            Dynamically Remove Last Column
          </button>
        </div>
      </div>
    </div>

    <div class="col-sm-6">
      <div v-show="updatedObject" class="alert alert-info"><strong>Updated Item:</strong> {{ updatedObject }}</div>
      <div v-show="alertWarning" class="alert alert-warning">{{ alertWarning }}</div>
    </div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions as GridOption"
    v-model:columns="columnDefinitions as Column[]"
    v-model:data="dataset"
    grid-id="grid3"
    @on-cell-change="onCellChanged($event.detail.eventData, $event.detail.args)"
    @on-click="onCellClicked($event.detail.eventData, $event.detail.args)"
    @on-validation-error="onValidationError($event.detail.eventData, $event.detail.args)"
    @on-vue-grid-created="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
