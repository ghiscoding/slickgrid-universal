<script setup lang="ts">
import { format as tempoFormat } from '@formkit/tempo';
import { useTranslation } from 'i18next-vue';
import {
  Filters,
  Formatters,
  SlickgridVue,
  type Column,
  type GridOption,
  type GridState,
  type GridStateChange,
  type MultipleSelectOption,
  type SlickgridVueInstance,
} from 'slickgrid-vue';
import { onBeforeMount, onMounted, onUnmounted, ref, type Ref } from 'vue';

const { i18next } = useTranslation();

const DEFAULT_PAGE_SIZE = 25;
const LOCAL_STORAGE_KEY = 'gridState';
const NB_ITEMS = 500;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
const selectedLanguage = ref('en');
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  const presets = JSON.parse(localStorage[LOCAL_STORAGE_KEY] || null);

  // use some Grid State preset defaults if you wish or just restore from Locale Storage
  // presets = presets || this.useDefaultPresets();
  defineGrid(presets);

  // mock some data (different in each dataset)
  dataset.value = getData(NB_ITEMS);
});

onMounted(() => {
  const defaultLang = 'en';
  i18next.changeLanguage(defaultLang);
});

onUnmounted(() => {
  saveCurrentGridState();
});

/* Define grid Options and Columns */
function defineGrid(gridStatePresets?: GridState) {
  // prepare a multiple-select array to filter with
  const multiSelectFilterArray: Array<{ value: number; label: number }> = [];
  for (let i = 0; i < NB_ITEMS; i++) {
    multiSelectFilterArray.push({ value: i, label: i });
  }

  columnDefinitions.value = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      nameKey: 'TITLE',
      filterable: true,
      sortable: true,
      minWidth: 45,
      width: 100,
      filter: {
        model: Filters.compoundInput,
      },
    },
    {
      id: 'description',
      name: 'Description',
      field: 'description',
      filterable: true,
      sortable: true,
      minWidth: 80,
      width: 100,
      filter: {
        model: Filters.input,
        filterShortcuts: [
          { titleKey: 'BLANK_VALUES', searchTerms: ['< A'], iconCssClass: 'mdi mdi-filter-minus-outline' },
          { titleKey: 'NON_BLANK_VALUES', searchTerms: ['> A'], iconCssClass: 'mdi mdi-filter-plus-outline' },
        ],
      },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      sortable: true,
      type: 'number',
      exportCsvForceToKeepAsString: true,
      minWidth: 55,
      width: 100,
      nameKey: 'DURATION',
      filterable: true,
      filter: {
        collection: multiSelectFilterArray,
        model: Filters.multipleSelect,
        // we could add certain option(s) to the "multiple-select" plugin
        options: {
          maxHeight: 250,
          width: 175,
        } as MultipleSelectOption,
      },
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      nameKey: 'PERCENT_COMPLETE',
      minWidth: 70,
      type: 'number',
      sortable: true,
      width: 100,
      formatter: Formatters.percentCompleteBar,
      filterable: true,
      filter: { model: Filters.slider, operator: '>' },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      nameKey: 'START',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 75,
      exportWithFormatter: true,
      width: 100,
      type: 'date',
      filterable: true,
      filter: {
        model: Filters.compoundDate,
        filterShortcuts: [
          {
            titleKey: 'PAST',
            searchTerms: [tempoFormat(new Date(), 'YYYY-MM-DD')],
            operator: '<',
            iconCssClass: 'mdi mdi-calendar',
          },
          {
            titleKey: 'FUTURE',
            searchTerms: [tempoFormat(new Date(), 'YYYY-MM-DD')],
            operator: '>',
            iconCssClass: 'mdi mdi-calendar-clock',
          },
        ],
      },
    },
    {
      id: 'completed',
      field: 'completed',
      nameKey: 'COMPLETED',
      minWidth: 85,
      maxWidth: 85,
      formatter: Formatters.checkmarkMaterial,
      width: 100,
      type: 'boolean',
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
    },
  ];

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableCheckboxSelector: true,
    enableFiltering: true,
    enableTranslate: true,
    i18n: i18next,
    columnPicker: {
      hideForceFitButton: true,
    },
    gridMenu: {
      hideForceFitButton: true,
      hideClearFrozenColumnsCommand: false,
    },
    headerMenu: {
      hideFreezeColumnsCommand: false,
    },
    enablePagination: true,
    pagination: {
      pageSizes: [5, 10, 15, 20, 25, 30, 40, 50, 75, 100],
      pageSize: DEFAULT_PAGE_SIZE,
    },
  };

  // reload the Grid State with the grid options presets
  // but make sure the colums array is part of the Grid State before using them as presets
  if (gridStatePresets) {
    gridOptions.value!.presets = gridStatePresets;
  }
}

/** Clear the Grid State from Local Storage and reset the grid to it's original state */
function clearGridStateFromLocalStorage() {
  vueGrid.gridService.resetGrid(columnDefinitions.value as Column[]);
  vueGrid.paginationService!.changeItemPerPage(DEFAULT_PAGE_SIZE);
  setTimeout(() => (localStorage[LOCAL_STORAGE_KEY] = null));
}

function getData(count: number) {
  // mock a dataset
  const currentYear = new Date().getFullYear();
  const tmpData: any[] = [];
  for (let i = 0; i < count; i++) {
    const randomDuration = Math.round(Math.random() * 100);
    const randomYear = randomBetween(currentYear - 15, currentYear + 8);
    const randomYearShort = randomBetween(10, 25);
    const randomMonth = randomBetween(1, 12);
    const randomMonthStr = randomMonth < 10 ? `0${randomMonth}` : randomMonth;
    const randomDay = randomBetween(10, 28);
    const randomPercent = randomBetween(0, 100);
    const randomHour = randomBetween(10, 23);
    const randomTime = randomBetween(10, 59);

    tmpData[i] = {
      id: i,
      title: 'Task ' + i,
      description: i % 5 ? 'desc ' + i : null, // also add some random to test NULL field
      duration: randomDuration,
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay), // provide a Date format
      usDateShort: `${randomMonth}/${randomDay}/${randomYearShort}`, // provide a date US Short in the dataset
      utcDate: `${randomYear}-${randomMonthStr}-${randomDay}T${randomHour}:${randomTime}:${randomTime}Z`,
      completed: i % 3 === 0,
    };
  }
  return tmpData;
}

/** Dispatched event of a Grid State Changed event (which contain a "change" and the "gridState") */
function gridStateChanged(gridStateChanges: GridStateChange) {
  console.log('Client sample, Grid State changed:: ', gridStateChanges);
  localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(gridStateChanges.gridState);
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/** Save Grid State in LocaleStorage */
function saveCurrentGridState() {
  const gridState: GridState = vueGrid.gridStateService.getCurrentGridState();
  console.log('Client sample, current Grid State:: ', gridState);
  localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(gridState);
}

async function switchLanguage() {
  const nextLanguage = selectedLanguage.value === 'en' ? 'fr' : 'en';
  await i18next.changeLanguage(nextLanguage);
  selectedLanguage.value = nextLanguage;
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
    Example 15: Grid State & Presets using Local Storage
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example15.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    Grid State & Preset (<a href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/grid-state-preset" target="_blank"
      >Wiki docs</a
    >)
    <br />
    <ul class="small">
      <li>Uses Local Storage to persist the Grid State and uses Grid Options "presets" to put the grid back to it's previous state</li>
      <ul>
        <li>
          to demo this, simply change any columns (position reorder, visibility, size, filter, sort), then refresh your browser with (F5)
        </li>
      </ul>
      <li>Local Storage is just one option, you can use whichever is more convenient for you (Local Storage, Session Storage, DB, ...)</li>
    </ul>
  </div>

  <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="reset-button" @click="clearGridStateFromLocalStorage()">
    <i class="mdi mdi-close"></i>
    Clear Grid State from Local Storage &amp; Reset Grid
  </button>

  <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="language-button" @click="switchLanguage()">
    <i class="mdi mdi-translate"></i>
    Switch Language
  </button>
  <strong>Locale:</strong>
  <span style="font-style: italic" data-test="selected-locale">
    {{ selectedLanguage + '.json' }}
  </span>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:dataset="dataset"
    grid-id="grid15"
    @onGridStateChanged="gridStateChanged($event.detail)"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
