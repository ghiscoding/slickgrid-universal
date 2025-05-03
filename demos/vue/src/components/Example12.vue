<script setup lang="ts">
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { useTranslation } from 'i18next-vue';
import {
  type Column,
  DelimiterType,
  Filters,
  type Formatter,
  Formatters,
  GridOption,
  GridStateChange,
  SlickgridVue,
  SlickgridVueInstance,
} from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const { i18next } = useTranslation();

const NB_ITEMS = 1500;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
const selectedLanguage = ref('en');
let duplicateTitleHeaderCount = 1;
const excelExportService = new ExcelExportService();
const textExportService = new TextExportService();
let vueGrid!: SlickgridVueInstance;

// create a custom translate Formatter (typically you would move that a separate file, for separation of concerns)
const taskTranslateFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, grid) => {
  const gridOptions = grid.getOptions() as GridOption;

  return gridOptions.i18n?.t('TASK_X', { x: value }) ?? '';
};

onBeforeMount(() => {
  defineGrid();

  const defaultLang = 'en';
  i18next.changeLanguage(defaultLang);

  // mock some data (different in each dataset)
  dataset.value = getData(NB_ITEMS);
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
    { id: 'description', name: 'Description', field: 'description', filterable: true, sortable: true, minWidth: 80 },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      nameKey: 'DURATION',
      sortable: true,
      formatter: Formatters.percentCompleteBar,
      minWidth: 100,
      exportWithFormatter: false,
      filterable: true,
      type: 'number',
      filter: { model: Filters.slider, /* operator: '>=',*/ filterOptions: { hideSliderNumber: true } },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      nameKey: 'START',
      formatter: Formatters.dateIso,
      outputType: 'dateIso',
      type: 'date',
      minWidth: 100,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      nameKey: 'FINISH',
      formatter: Formatters.dateIso,
      outputType: 'dateIso',
      type: 'date',
      minWidth: 100,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'completedBool',
      name: 'Completed',
      field: 'completedBool',
      nameKey: 'COMPLETED',
      minWidth: 100,
      sortable: true,
      formatter: Formatters.checkmarkMaterial,
      exportCustomFormatter: Formatters.translateBoolean,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, labelKey: 'TRUE' },
          { value: false, labelKey: 'FALSE' },
        ],
        model: Filters.singleSelect,
        enableTranslateLabel: true,
      },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      nameKey: 'COMPLETED',
      formatter: Formatters.translate,
      sortable: true,
      minWidth: 100,
      exportWithFormatter: true, // you can set this property in the column definition OR in the grid options, column def has priority over grid options
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: 'TRUE', labelKey: 'TRUE' },
          { value: 'FALSE', labelKey: 'FALSE' },
        ],
        collectionSortBy: {
          property: 'labelKey', // will sort by translated value since "enableTranslateLabel" is true
          sortDesc: true,
        },
        model: Filters.singleSelect,
        enableTranslateLabel: true,
      },
    },
    // OR via your own custom translate formatter
    // { id: 'completed', name: 'Completed', field: 'completed', nameKey: 'COMPLETED', formatter: translateFormatter, sortable: true, minWidth: 100 }
  ];

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableAutoResize: true,
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    enableTranslate: true,
    i18n: i18next,
    checkboxSelector: {
      // you can toggle these 2 properties to show the "select all" checkbox in different location
      hideInFilterHeaderRow: false,
      hideInColumnTitleRow: true,
    },
    enableCheckboxSelector: true,
    enableRowSelection: true,
    showCustomFooter: true, // display some metrics in the bottom custom footer
    customFooterOptions: {
      metricTexts: {
        // default text displayed in the metrics section on the right
        // all texts optionally support translation keys,
        // if you wish to use that feature then use the text properties with the 'Key' suffix (e.g: itemsKey, ofKey, lastUpdateKey)
        // example "items" for a plain string OR "itemsKey" to use a translation key
        itemsKey: 'ITEMS',
        ofKey: 'OF',
        lastUpdateKey: 'LAST_UPDATE',
      },
      dateFormat: 'YYYY-MM-DD hh:mm a',
      hideTotalItemCount: false,
      hideLastUpdateTimestamp: false,
    },
    gridMenu: {
      hideExportCsvCommand: false, // false by default, so it's optional
      hideExportTextDelimitedCommand: false, // true by default, so if you want it, you will need to disable the flag
    },
    enableExcelExport: true,
    enableTextExport: true,
    textExportOptions: {
      // set at the grid option level, meaning all column will evaluate the Formatter (when it has a Formatter defined)
      exportWithFormatter: true,
      sanitizeDataExport: true,
    },
    excelExportOptions: {
      // optionally pass a custom header to the Excel Sheet
      // a lot of the info can be found on Excel-Builder-Vanilla
      // https://ghiscoding.gitbook.io/excel-builder-vanilla/cookbook/fonts-and-colors
      customExcelHeader: (workbook, sheet) => {
        const customTitle =
          i18next.language === 'fr' ? 'Titre qui est suffisament long pour être coupé' : 'My header that is long enough to wrap';
        const stylesheet = workbook.getStyleSheet();
        const aFormatDefn = {
          font: { size: 12, fontName: 'Calibri', bold: true, color: 'FF0000FF' }, // every color starts with FF, then regular HTML color
          alignment: { wrapText: true },
        };
        const formatterId = stylesheet.createFormat(aFormatDefn);
        sheet.setRowInstructions(0, { height: 30 }); // change height of row 0

        // excel cells start with A1 which is upper left corner
        sheet.mergeCells('B1', 'D1');
        const cols: any[] = [];
        // push empty data on A1
        cols.push({ value: '' });
        // push data in B1 cell with metadata formatter
        cols.push({ value: customTitle, metadata: { style: formatterId.id } });
        sheet.data.push(cols);
      },
      exportWithFormatter: true,
      sanitizeDataExport: true,
    },
    externalResources: [excelExportService, textExportService],
  };
}

function getData(count: number) {
  // mock a dataset
  const tmpData: any[] = [];
  for (let i = 0; i < count; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);

    tmpData[i] = {
      id: i,
      description: i % 5 ? 'desc ' + i : '🚀🦄 español', // also add some random to test NULL field
      duration: Math.round(Math.random() * 100) + '',
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 1, randomDay),
      completedBool: i % 5 === 0 ? true : false,
      completed: i % 5 === 0 ? 'TRUE' : 'FALSE',
    };
  }
  return tmpData;
}

function dynamicallyAddTitleHeader() {
  // you can dynamically add your column to your column definitions
  // and then use the spread operator [...cols] OR slice to force Vue to review the changes
  const newCol = {
    id: `title${duplicateTitleHeaderCount++}`,
    field: 'id',
    nameKey: 'TITLE',
    formatter: taskTranslateFormatter,
    sortable: true,
    minWidth: 100,
    filterable: true,
    params: { useFormatterOuputToFilter: true },
  };
  columnDefinitions.value.push(newCol);
  columnDefinitions.value = columnDefinitions.value.slice(); // or use spread operator [...cols]

  // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
  // you MUST use "getAllColumnDefinitions()" from the GridService, using this will be ALL columns including the 1st column that is created internally
  // for example if you use the Checkbox Selector (row selection), you MUST use the code below
  /*
    const allColumns = vueGrid.gridService.getAllColumnDefinitions();
    allColumns.push(newCol);
    columnDefinitions.value = [...allColumns]; // (or use slice) reassign to column definitions for Vue to do dirty checking
    */
}

function exportToExcel() {
  excelExportService.exportToExcel({
    filename: 'Export',
    format: 'xlsx',
  });
}

function exportToFile(type = 'csv') {
  textExportService.exportToFile({
    delimiter: type === 'csv' ? DelimiterType.comma : DelimiterType.tab,
    filename: 'myExport',
    format: type === 'csv' ? 'csv' : 'txt',
  });
}

/** Dispatched event of a Grid State Changed event */
function gridStateChanged(gridStateChanges: GridStateChange) {
  console.log('Grid State changed:: ', gridStateChanges);
  console.log('Grid State changed:: ', gridStateChanges.change);
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
    Example 12: Localization (i18n)
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example12.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    Support multiple locales with the i18next plugin, following these steps. Take a look at the (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/localization/localization"
      target="_blank"
      >Wiki documentation</a
    >)
    <ol class="small">
      <li>You first need to "enableTranslate" in the Grid Options</li>
      <li>In the Column Definitions, you have following options</li>
      <ul>
        <li>To translate a header title, use "nameKey" with a translate key (nameKey: 'TITLE')</li>
        <li>For the cell values, you need to use a Formatter, there's 2 ways of doing it</li>
        <ul>
          <li>formatter: myCustomTranslateFormatter <b>&lt;= "Title" column uses it</b></li>
          <li>formatter: Formatters.translate <b>&lt;= "Completed" column uses it</b></li>
        </ul>
      </ul>
      <li>For date localization, you need to create your own custom formatter.</li>
      <ul>
        <li>You can easily implement logic to switch between Formatters "dateIso" or "dateUs", depending on current locale.</li>
      </ul>
      <li>For the Select (dropdown) filter, you can fill in the "labelKey" property, if found it will use it, else it will use "label"</li>
      <ul>
        <li>
          What if your select options have totally different value/label pair? In this case, you can use the
          <b>customStructure: { label: 'customLabel', value: 'customValue'}</b> to change the property name(s) to use.'
        </li>
        <li>What if you want to use "customStructure" and translation? Simply pass this flag <b>enableTranslateLabel: true</b></li>
        <li>
          More info on the Select Filter
          <a href="https://ghiscoding.gitbook.io/slickgrid-vue/column-functionalities/filters/select-filter" target="_blank">Wiki page</a>
        </li>
      </ul>
      <li>
        For more info about "Download to File", read the
        <a href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/export-to-excel" target="_blank">Wiki page</a>
      </li>
    </ol>
  </div>

  <hr />

  <div class="row">
    <div class="col-sm-12">
      <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="language-button" @click="switchLanguage()">
        <i class="mdi mdi-translate me-1"></i>
        Switch Language
      </button>
      <label class="mx-2">Locale:</label>
      <span class="ms-1" style="font-style: italic; width: 70px" data-test="selected-locale">
        {{ selectedLanguage + '.json' }}
      </span>

      <span style="margin-left: 20px">
        <button class="btn btn-outline-secondary btn-sm btn-icon" @click="exportToFile('csv')">
          <i class="mdi mdi-download"></i>
          Download to CSV
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" @click="exportToFile('txt')">
          <i class="mdi mdi-download"></i>
          Download to Text
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon" @click="exportToExcel()">
          <i class="mdi mdi-file-excel-outline text-success"></i>
          Download to Excel
        </button>
      </span>
      <span style="margin-left: 10px">
        <button class="btn btn-outline-secondary btn-sm btn-icon" @click="dynamicallyAddTitleHeader()">
          <i class="mdi mdi-shape-square-plus"></i>
          Dynamically Duplicate Title Column
        </button>
      </span>
    </div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    grid-id="grid12"
    @onGridStateChanged="gridStateChanged($event.detail)"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
