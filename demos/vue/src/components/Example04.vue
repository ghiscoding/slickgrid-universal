<script setup lang="ts">
import { format as tempoFormat } from '@formkit/tempo';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  type Column,
  FieldType,
  Filters,
  Formatters,
  type GridOption,
  type GridStateChange,
  type Metrics,
  type MultipleSelectOption,
  OperatorType,
  SlickgridVue,
  type SlickgridVueInstance,
  type VanillaCalendarOption,
} from 'slickgrid-vue';
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';

import { CustomInputFilter } from './custom-inputFilter';
import URL_SAMPLE_COLLECTION_DATA from './data/collection_500_numbers.json';

const NB_ITEMS = 10500;

const metrics = ref<Metrics>({} as Metrics);
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

onBeforeUnmount(() => {
  saveCurrentGridState();
});

onMounted(() => {});

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
      minWidth: 45,
      filter: {
        model: Filters.compoundInputText,
      },
    },
    {
      id: 'description',
      name: 'Description',
      field: 'description',
      filterable: true,
      sortable: true,
      minWidth: 80,
      type: FieldType.string,
      filter: {
        model: CustomInputFilter, // create a new instance to make each Filter independent from each other customFilter
        enableTrimWhiteSpace: true,
      },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      sortable: true,
      type: FieldType.number,
      exportCsvForceToKeepAsString: true,
      minWidth: 55,
      filterable: true,
      filter: {
        model: Filters.multipleSelect,
        // We can load the "collection" asynchronously (on first load only, after that we will simply use "collection")
        // 3 ways are supported (fetch, Promise or RxJS when available)

        // 1- use `fetch`
        // collectionAsync: fetch(URL_SAMPLE_COLLECTION_DATA),

        // OR 2- use a Promise
        collectionAsync: Promise.resolve(URL_SAMPLE_COLLECTION_DATA),

        // collectionFilterBy & collectionSortBy accept a single or multiple options
        // we can exclude certains values 365 & 360 from the dropdown filter
        collectionFilterBy: [
          {
            property: 'value',
            operator: OperatorType.notEqual,
            value: 360,
          },
          {
            property: 'value',
            operator: OperatorType.notEqual,
            value: 365,
          },
        ],

        // sort the select dropdown in a descending order
        collectionSortBy: {
          property: 'value',
          sortDesc: true,
          fieldType: FieldType.number,
        },
        customStructure: {
          value: 'value',
          label: 'label',
          optionLabel: 'value', // if selected text is too long, we can use option labels instead
          labelSuffix: 'text',
        },
        collectionOptions: {
          separatorBetweenTextLabels: ' ',
          filterResultAfterEachPass: 'chain', // options are "merge" or "chain" (defaults to "chain")
        },
        // we could add certain option(s) to the "multiple-select" plugin
        filterOptions: {
          maxHeight: 250,
          width: 175,

          // if we want to display shorter text as the selected text (on the select filter itself, parent element)
          // we can use "useSelectOptionLabel" or "useSelectOptionLabelToHtml" the latter will parse html
          useSelectOptionLabelToHtml: true,
        } as MultipleSelectOption,
      },
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      minWidth: 70,
      type: FieldType.number,
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundInputNumber },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 75,
      type: FieldType.date,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'usDateShort',
      name: 'US Date Short',
      field: 'usDateShort',
      sortable: true,
      minWidth: 70,
      width: 70,
      type: FieldType.dateUsShort,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'utcDate',
      name: 'UTC Date',
      field: 'utcDate',
      formatter: Formatters.dateTimeIsoAmPm,
      sortable: true,
      minWidth: 115,
      type: FieldType.dateUtc,
      outputType: FieldType.dateTimeIsoAmPm,
      filterable: true,
      filter: {
        model: Filters.compoundDate,
        // override any of the calendar options through "filterOptions"
        filterOptions: { range: { min: 'today' } } as VanillaCalendarOption,
      },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven.isEffort',
      minWidth: 85,
      maxWidth: 95,
      type: FieldType.boolean,
      sortable: true,

      // to pass multiple formatters, use the params property
      // also these formatters are executed in sequence, so if you want the checkmark to work correctly, it has to be the last formatter defined
      formatter: Formatters.multiple,
      params: { formatters: [Formatters.complexObject, Formatters.checkmarkMaterial] },

      // when the "field" string includes the dot "." notation, the library will consider this to be a complex object and Filter accordingly
      filterable: true,
      filter: {
        // We can also add HTML text to be rendered (any bad script will be sanitized) but we have to opt-in, else it will be sanitized
        // enableRenderHtml: true,
        // collection: [{ value: '', label: '' }, { value: true, label: 'True', labelPrefix: `<i class="mdi mdi-check"></i> ` }, { value: false, label: 'False' }],

        collection: ['', 'True', 'False'],
        model: Filters.singleSelect,

        // we could add certain option(s) to the "multiple-select" plugin
        filterOptions: {
          maxHeight: 250,
        } as MultipleSelectOption,
      },
    },
  ];

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableExcelExport: true,
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    // enableFilterTrimWhiteSpace: true,
    showCustomFooter: true, // display some metrics in the bottom custom footer

    // use columnDef searchTerms OR use presets as shown below
    presets: {
      filters: [
        { columnId: 'duration', searchTerms: [10, 98] },
        // { columnId: 'complete', searchTerms: ['5'], operator: '>' },
        { columnId: 'usDateShort', operator: '<', searchTerms: ['4/20/25'] },
        // { columnId: 'effort-driven', searchTerms: [true] }
      ],
      sorters: [
        { columnId: 'duration', direction: 'DESC' },
        { columnId: 'complete', direction: 'ASC' },
      ],
    },
    externalResources: [new ExcelExportService()],
    preParseDateColumns: '__', // or true
  };
}

function logItems() {
  console.log(vueGrid.dataView?.getItems());
}

function mockData(itemCount: number, startingIndex = 0): any[] {
  // mock a dataset
  const tempDataset: any[] = [];

  for (let i = startingIndex; i < startingIndex + itemCount; i++) {
    const randomDuration = Math.round(Math.random() * 100);
    const randomYear = randomBetween(2000, 2035);
    const randomYearShort = randomBetween(10, 35);
    const randomMonth = randomBetween(1, 12);
    const randomMonthStr = randomMonth < 10 ? `0${randomMonth}` : randomMonth;
    const randomDay = randomBetween(10, 28);
    const randomPercent = randomBetween(0, 100);
    const randomHour = randomBetween(10, 23);
    const randomTime = randomBetween(10, 59);
    const randomMilliseconds = `${randomBetween(1, 9)}${randomBetween(10, 99)}`;
    const randomIsEffort = i % 3 === 0;

    tempDataset.push({
      id: i,
      title: 'Task ' + i,
      description: i % 5 ? 'desc ' + i : null, // also add some random to test NULL field
      duration: randomDuration,
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: i % 4 ? null : new Date(randomYear, randomMonth, randomDay), // provide a Date format
      usDateShort: `${randomMonth}/${randomDay}/${randomYearShort}`, // provide a date US Short in the dataset
      utcDate: `${randomYear}-${randomMonthStr}-${randomDay}T${randomHour}:${randomTime}:${randomTime}.${randomMilliseconds}Z`,
      effortDriven: {
        isEffort: randomIsEffort,
        label: randomIsEffort ? 'Effort' : 'NoEffort',
      },
    });
  }

  return tempDataset;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/** Dispatched event of a Grid State Changed event */
function gridStateChanged(gridState: GridStateChange) {
  console.log('Client sample, Grid State changed:: ', gridState.change);
}

/** Save current Filters, Sorters in LocaleStorage or DB */
function saveCurrentGridState() {
  console.log('Client sample, current Grid State:: ', vueGrid.gridStateService.getCurrentGridState());
}

function setFiltersDynamically() {
  // we can Set Filters Dynamically (or different filters) afterward through the FilterService
  vueGrid.filterService.updateFilters([
    { columnId: 'duration', searchTerms: [2, 25, 48, 50] },
    { columnId: 'complete', searchTerms: [95], operator: '<' },
    { columnId: 'effort-driven', searchTerms: [true] },
    { columnId: 'start', operator: '>=', searchTerms: ['2001-02-28'] },
  ]);
}

function setSortingDynamically() {
  vueGrid.sortService.updateSorting([
    // orders matter, whichever is first in array will be the first sorted column
    { columnId: 'duration', direction: 'ASC' },
    { columnId: 'start', direction: 'DESC' },
  ]);
}

function refreshMetrics(_e: Event, args: any) {
  if (args && args.current >= 0) {
    window.setTimeout(() => {
      metrics.value = {
        startTime: new Date(),
        endTime: new Date(),
        itemCount: (args && args.current) || 0,
        totalItemCount: dataset.value.length || 0,
      };
    });
  }
}

function scrollGridBottom() {
  vueGrid.slickGrid.navigateBottom();
}

function scrollGridTop() {
  vueGrid.slickGrid.navigateTop();
}

function showMetrics() {
  return `${metrics.value.endTime ? tempoFormat(metrics.value.endTime, 'YYYY-MM-DD HH:mm:ss', 'en-US') : ''}
    | ${metrics.value.itemCount} of ${metrics.value.totalItemCount} items`;
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
    Example 4: Client Side Sort/Filter
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
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example04.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
  </h2>

  <div class="subtitle">
    Sort/Filter on client side only using SlickGrid DataView (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/column-functionalities/sorting"
      target="_blank"
      >Docs</a
    >)
    <br />
    <ul class="small">
      <li>Support multi-sort (by default), hold "Shift" key and click on the next column to sort.</li>
      <li>All column types support the following operators: (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *)</li>
      <ul>
        <li>Example: >100 ... >=2001-01-01 ... >02/28/17</li>
        <li>
          <b>Note:</b> For filters to work properly (default is string), make sure to provide a FieldType (type is against the
          dataset, not the Formatter)
        </li>
      </ul>
      <li>Date Filters</li>
      <ul>
        <li>
          FieldType of dateUtc/date (from dataset) can use an extra option of "filterSearchType" to let user filter more easily.
          For example, in the "UTC Date" field below, you can type "&gt;02/28/2017", also when dealing with UTC you have to take
          the time difference in consideration.
        </li>
      </ul>
      <li>
        On String filters, (*) can be used as startsWith (Hello* => matches "Hello Word") ... endsWith (*Doe => matches: "John
        Doe")
      </li>
      <li>
        Custom Filter are now possible, "Description" column below, is a customized InputFilter with different placeholder. See
        <a href="https://ghiscoding.gitbook.io/slickgrid-vue/column-functionalities/filters/custom-filter" target="_blank"
          >Wiki - Custom Filter</a
        >
      </li>
    </ul>
  </div>

  <span v-if="metrics">
    <b>Metrics:</b>
    {{ showMetrics() }}
  </span>

  <div class="btn-group mx-1" role="group" aria-label="...">
    <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="scroll-top-btn" @click="scrollGridTop()">
      <i class="mdi mdi-arrow-down mdi-rotate-180 icon"></i>
    </button>
    <button class="btn btn-sm btn-outline-secondary btn-icon" data-test="scroll-bottom-btn" @click="scrollGridBottom()">
      <i class="mdi mdi-arrow-down icon"></i>
    </button>
  </div>

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
  <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-filter" @click="setFiltersDynamically()">
    Set Filters Dynamically
  </button>
  <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-dynamic-sorting" @click="setSortingDynamically()">
    Set Sorting Dynamically
  </button>
  <button class="btn btn-outline-secondary btn-sm btn-icon" @click="logItems()">
    <span title="console.log all dataset items">Log Items</span>
  </button>

  <slickgrid-vue
    v-model:options="gridOptions!"
    v-model:columns="columnDefinitions as Column[]"
    v-model:data="dataset"
    grid-id="grid4"
    @onGridStateChanged="gridStateChanged($event.detail)"
    @onRowCountChanged="refreshMetrics($event.detail.eventData, $event.detail.args)"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
