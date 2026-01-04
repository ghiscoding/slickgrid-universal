<script setup lang="ts">
import { addDay, format } from '@formkit/tempo';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { useTranslation } from 'i18next-vue';
import {
  Filters,
  Formatters,
  OperatorType,
  SlickgridVue,
  type Column,
  type CurrentFilter,
  type Formatter,
  type GridOption,
  type Metrics,
  type MultipleSelectOption,
  type SlickGrid,
  type SlickgridVueInstance,
  type SliderRangeOption,
} from 'slickgrid-vue';
import { onBeforeMount, onBeforeUnmount, ref, type Ref } from 'vue';
import { CustomInputFilter } from './custom-inputFilter';

const { i18next } = useTranslation();

const NB_ITEMS = 1500;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const selectedLanguage = ref('en');
const metrics = ref<Metrics>();
const filterList = ref([
  { value: '', label: '' },
  { value: 'currentYearTasks', label: 'Current Year Completed Tasks' },
  { value: 'nextYearTasks', label: 'Next Year Active Tasks' },
]);
const selectedPredefinedFilter = ref('');
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

// create a custom translate Formatter (typically you would move that a separate file, for separation of concerns)
const taskTranslateFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, grid: SlickGrid) => {
  const gridOptions = grid.getOptions() as GridOption;

  return gridOptions.i18n?.t('TASK_X', { x: value }) ?? '';
};

onBeforeMount(() => {
  defineGrid();

  // mock some data (different in each dataset)
  dataset.value = loadData(NB_ITEMS);

  // always start with English for Cypress E2E tests to be consistent
  const defaultLang = 'en';
  i18next.changeLanguage(defaultLang);
  selectedLanguage.value = defaultLang;
});

onBeforeUnmount(() => {
  saveCurrentGridState();
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'title',
      name: 'Title',
      field: 'id',
      nameKey: 'TITLE',
      minWidth: 100,
      formatter: taskTranslateFormatter,
      sortable: true,
      filterable: true,
      params: { useFormatterOuputToFilter: true },
    },
    {
      id: 'description',
      name: 'Description',
      field: 'description',
      filterable: true,
      sortable: true,
      minWidth: 80,
      filter: {
        model: CustomInputFilter, // create a new instance to make each Filter independent from each other
        enableTrimWhiteSpace: true, // or use global "enableFilterTrimWhiteSpace" to trim on all Filters
      },
    },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      nameKey: 'PERCENT_COMPLETE',
      minWidth: 120,
      sortable: true,
      customTooltip: { position: 'center' },
      formatter: Formatters.progressBar,
      type: 'number',
      filterable: true,
      filter: {
        model: Filters.sliderRange,
        maxValue: 100, // or you can use the options as well
        operator: OperatorType.rangeInclusive, // defaults to inclusive
        options: {
          hideSliderNumbers: false, // you can hide/show the slider numbers on both side
          min: 0,
          step: 5,
        } as SliderRangeOption,
      },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      nameKey: 'START',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 75,
      width: 100,
      exportWithFormatter: true,
      type: 'date',
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      nameKey: 'FINISH',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 75,
      width: 120,
      exportWithFormatter: true,
      type: 'date',
      filterable: true,
      filter: {
        model: Filters.dateRange,
      },
    },
    {
      id: 'duration',
      field: 'duration',
      nameKey: 'DURATION',
      maxWidth: 90,
      type: 'number',
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.input,
        operator: OperatorType.rangeExclusive, // defaults to exclusive
      },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      nameKey: 'COMPLETED',
      minWidth: 85,
      maxWidth: 90,
      formatter: Formatters.checkmarkMaterial,
      exportWithFormatter: true, // you can set this property in the column definition OR in the grid options, column def has priority over grid options
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
        model: Filters.singleSelect,
        options: { autoAdjustDropHeight: true } as MultipleSelectOption,
      },
    },
  ];

  const presetLowestDay = format(addDay(new Date(), -2), 'YYYY-MM-DD');
  const presetHighestDay = format(addDay(new Date(), 25), 'YYYY-MM-DD');

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    // enableFilterTrimWhiteSpace: true,
    enableTranslate: true,
    i18n: i18next,

    // use columnDef searchTerms OR use presets as shown below
    presets: {
      filters: [
        //  you can use the 2 dots separator on all Filters which support ranges
        { columnId: 'duration', searchTerms: ['4..88'] },
        // { columnId: 'percentComplete', searchTerms: ['5..80'] }, // without operator will default to 'RangeExclusive'
        // { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [`${presetLowestDay}..${presetHighestDay}`] },

        // or you could also use 2 searchTerms values, instead of using the 2 dots (only works with SliderRange & DateRange Filters)
        // BUT make sure to provide the operator, else the filter service won't know that this is really a range
        { columnId: 'percentComplete', operator: 'RangeInclusive', searchTerms: [5, 80] }, // same result with searchTerms: ['5..80']
        { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [presetLowestDay, presetHighestDay] },
      ],
      sorters: [
        { columnId: 'percentComplete', direction: 'DESC' },
        { columnId: 'duration', direction: 'ASC' },
      ],
    },
    externalResources: [new SlickCustomTooltip(), new ExcelExportService()],
  };
}

function loadData(itemCount: number, startingIndex = 0): any[] {
  // mock a dataset
  const tempDataset: any[] = [];
  for (let i = startingIndex; i < startingIndex + itemCount; i++) {
    const randomDuration = randomBetween(0, 365);
    const randomYear = randomBetween(new Date().getFullYear(), new Date().getFullYear() + 1);
    const randomMonth = randomBetween(0, 12);
    const randomDay = randomBetween(10, 28);
    const randomPercent = randomBetween(0, 100);

    tempDataset.push({
      id: i,
      title: 'Task ' + i,
      description: i % 5 ? 'desc ' + i : null, // also add some random to test NULL field
      duration: randomDuration,
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: i % 4 ? null : new Date(randomYear, randomMonth, randomDay), // provide a Date format
      finish: new Date(randomYear, randomMonth, randomDay),
      completed: randomPercent === 100 ? true : false,
    });
  }

  return tempDataset;
}

/** Save current Filters, Sorters in LocaleStorage or DB */
function saveCurrentGridState() {
  console.log('Client sample, current Grid State:: ', vueGrid.gridStateService.getCurrentGridState());
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function setFiltersDynamically() {
  const presetLowestDay = format(addDay(new Date(), -5), 'YYYY-MM-DD');
  const presetHighestDay = format(addDay(new Date(), 25), 'YYYY-MM-DD');

  // we can Set Filters Dynamically (or different filters) afterward through the FilterService
  vueGrid.filterService.updateFilters([
    { columnId: 'duration', searchTerms: ['14..78'], operator: 'RangeInclusive' },
    { columnId: 'percentComplete', operator: 'RangeExclusive', searchTerms: [15, 85] },
    { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [presetLowestDay, presetHighestDay] },
  ]);
}

function setSortingDynamically() {
  vueGrid.sortService.updateSorting([
    // orders matter, whichever is first in array will be the first sorted column
    { columnId: 'finish', direction: 'DESC' },
    { columnId: 'percentComplete', direction: 'ASC' },
  ]);
}

async function switchLanguage() {
  const nextLanguage = selectedLanguage.value === 'en' ? 'fr' : 'en';
  await i18next.changeLanguage(nextLanguage);
  selectedLanguage.value = nextLanguage;
}

function predefinedFilterChanged(newPredefinedFilter: string) {
  let filters: CurrentFilter[] = [];
  const currentYear = new Date().getFullYear();

  switch (newPredefinedFilter) {
    case 'currentYearTasks':
      filters = [
        {
          columnId: 'finish',
          operator: OperatorType.rangeInclusive,
          searchTerms: [`${currentYear}-01-01`, `${currentYear}-12-31`],
        },
        { columnId: 'completed', operator: OperatorType.equal, searchTerms: [true] },
      ];
      break;
    case 'nextYearTasks':
      filters = [{ columnId: 'start', operator: '>=', searchTerms: [`${currentYear + 1}-01-01`] }];
      break;
  }
  vueGrid.filterService.updateFilters(filters);
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
    Example 23: Filtering from Range of Search Values
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example23.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    This demo shows how to use Filters with Range of Search Values (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/column-functionalities/filters/range-filters"
      target="_blank"
      >Wiki docs</a
    >)
    <br />
    <ul class="small">
      <li>
        All input filters support the following operators: (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *) and now also the (..) for an
        input range
      </li>
      <li>
        All filters (which support ranges) can be defined via the 2 dots (..) which represents a range, this also works for dates and slider
        in the "presets"
      </li>
      <ul>
        <li>For a numeric range defined in an input filter (must be of type text), you can use 2 dots (..) to represent a range</li>
        <li>example: typing "10..90" will filter values between 10 and 90 (but excluding the number 10 and 90)</li>
      </ul>
    </ul>
  </div>

  <br />

  <span v-if="metrics">
    <b>Metrics:</b>
    ${metrics.endTime | dateFormat: 'DD MMM, h:mm:ss a'} | ${metrics.itemCount} of ${metrics.totalItemCount} items
  </span>

  <div class="row row-cols-lg-auto g-1 align-items-center">
    <div class="col">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-filters" @click="vueGrid.filterService.clearFilters()">
        Clear Filters
      </button>
    </div>
    <div class="col">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-sorting" @click="vueGrid.sortService.clearSorting()">
        Clear Sorting
      </button>
    </div>
    <div class="col">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-filter" @click="setFiltersDynamically()">
        Set Filters Dynamically
      </button>
    </div>
    <div class="col">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" @click="setSortingDynamically()">
        Set Sorting Dynamically
      </button>
    </div>
    <div class="col">
      <label for="selectedFilter" style="margin-left: 10px">Predefined Filters</label>
    </div>
    <div class="col">
      <select
        v-model="selectedPredefinedFilter"
        name="selectedFilter"
        class="form-select"
        data-test="select-dynamic-filter"
        @change="predefinedFilterChanged(selectedPredefinedFilter)"
      >
        <option v-for="(filter, index) of filterList" :key="index" :value="filter.value">{{ filter.label }}</option>
      </select>
    </div>
  </div>

  <div class="row mt-2">
    <div class="col">
      <button class="btn btn-outline-secondary btn-sm btn-icon me-1" data-test="language" @click="switchLanguage()">
        <i class="mdi mdi-translate"></i>
        Switch Language
      </button>
      <b>Locale:</b>
      <span class="ms-1" style="font-style: italic" data-test="selected-locale">{{ selectedLanguage + '.json' }}</span>
    </div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:dataset="dataset"
    grid-id="grid23"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
