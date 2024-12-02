<script setup lang="ts">
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { useTranslation } from 'i18next-vue';
import type { GridOption, SlickgridVueInstance } from 'slickgrid-vue';
import { type Column, Editors, FieldType, Formatters, SlickgridVue } from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

const { i18next } = useTranslation();

const NB_ITEMS = 20;
const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
const selectedLanguage = ref('');
const fetchResult = ref('');
const statusClass = ref('alert alert-light');
const statusStyle = ref('display: none');
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();

  const defaultLang = 'en';
  i18next.changeLanguage(defaultLang);
  selectedLanguage.value = defaultLang;

  // mock some data (different in each dataset)
  dataset.value = getData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      sortable: true,
      minWidth: 100,
      filterable: true,
      editor: { model: Editors.text },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      sortable: true,
      minWidth: 100,
      filterable: true,
      type: FieldType.number,
      editor: { model: Editors.text },
    },
    {
      id: '%',
      name: '% Complete',
      field: 'percentComplete',
      sortable: true,
      minWidth: 100,
      filterable: true,
      type: FieldType.number,
      editor: { model: Editors.text },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
      filterable: true,
      editor: { model: Editors.date },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      exportWithFormatter: true,
      filterable: true,
      editor: { model: Editors.date },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      sortable: true,
      minWidth: 100,
      filterable: true,
      type: 'boolean',
      editor: { model: Editors.checkbox },
    },
  ];

  gridOptions.value = {
    enableAutoResize: false,
    gridHeight: 350,
    gridWidth: 800,
    rowHeight: 33,
    enableExcelCopyBuffer: true,
    excelCopyBufferOptions: {
      onBeforePasteCell: (_e, args) => {
        // for the sake of the demo, do not allow to paste into the first column title
        // this will be overriden by the row based edit plugin to additionally only work if the row is in editmode
        return args.cell > 0;
      },
    },
    // NOTE: this will be automatically turned to true by the Row Based Edit Plugin.
    // A console warning will be shown if you omit this flag
    autoEdit: false,
    editable: true,
    enableCellNavigation: true,
    enableRowBasedEdit: true,
    enableTranslate: true,
    i18n: i18next,
    rowBasedEditOptions: {
      allowMultipleRows: false,
      onBeforeEditMode: () => clearStatus(),
      onBeforeRowUpdated: (args) => {
        const { effortDriven, percentComplete, finish, start, duration, title } = args.dataContext;

        if (duration > 40) {
          alert('Sorry, 40 is the maximum allowed duration.');
          return Promise.resolve(false);
        }

        return fakeFetch('your-backend-api/endpoint', {
          method: 'POST',
          body: JSON.stringify({ effortDriven, percentComplete, finish, start, duration, title }),
          headers: {
            'Content-type': 'application/json; charset=UTF-8',
          },
        })
          .catch((err) => {
            console.error(err);
            return false;
          })
          .then((response: any) => {
            if (response === false) {
              statusClass.value = 'alert alert-danger';
              return false;
            }
            if (typeof response === 'object') {
              return response!.json();
            }
          })
          .then((json) => {
            statusStyle.value = 'display: block';
            statusClass.value = 'alert alert-success';
            fetchResult.value = json.message;
            return true;
          });
      },
      actionColumnConfig: {
        // override the defaults of the action column
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      actionButtons: {
        editButtonClassName: 'button-style margin-auto btn-icon px-2 me-1',
        iconEditButtonClassName: 'mdi mdi-pencil',
        // since no title and no titleKey is provided, it will fallback to the default text provided by the plugin
        // if the title is provided but no titleKey, it will override the default text
        // last but not least if a titleKey is provided, it will use the translation key to translate the text
        // editButtonTitle: 'Edit row',

        cancelButtonClassName: 'button-style btn-icon px-2',
        cancelButtonTitle: 'Cancel row',
        cancelButtonTitleKey: 'RBE_BTN_CANCEL',
        iconCancelButtonClassName: 'mdi mdi-undo text-danger',
        cancelButtonPrompt: 'Are you sure you want to cancel your changes?',

        updateButtonClassName: 'button-style btn-icon px-2 me-1',
        updateButtonTitle: 'Update row',
        updateButtonTitleKey: 'RBE_BTN_UPDATE',
        iconUpdateButtonClassName: 'mdi mdi-check text-success',
        updateButtonPrompt: 'Save changes?',

        deleteButtonClassName: 'button-style btn-icon px-2',
        deleteButtonTitle: 'Delete row',
        iconDeleteButtonClassName: 'mdi mdi-trash-can text-danger',
        deleteButtonPrompt: 'Are you sure you want to delete this row?',
      },
    },
    externalResources: [new SlickCustomTooltip()],
  };
}

function getData(count: number) {
  // mock a dataset
  const mockDataset: any[] = [];
  for (let i = 0; i < count; i++) {
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);

    mockDataset[i] = {
      id: i,
      title: 'Task ' + i,
      duration: Math.round(Math.random() * 40) + '',
      percentComplete: randomPercent,
      start: new Date(randomYear, randomMonth + 1, randomDay),
      finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
      effortDriven: i % 5 === 0,
    };
  }

  return mockDataset;
}

function clearStatus() {
  statusClass.value = 'alert alert-light';
  statusStyle.value = 'display: none';
  fetchResult.value = '';
}

function toggleSingleMultiRowEdit() {
  const inputGridOptions = {
    ...gridOptions.value,
    ...{
      rowBasedEditOptions: {
        ...gridOptions.value!.rowBasedEditOptions,
        ...{ allowMultipleRows: !gridOptions.value!.rowBasedEditOptions?.allowMultipleRows },
      },
    },
  };
  vueGrid.slickGrid.setOptions(inputGridOptions);
  gridOptions.value = vueGrid.slickGrid.getOptions();
}

async function switchLanguage() {
  const nextLanguage = selectedLanguage.value === 'en' ? 'fr' : 'en';
  await i18next.changeLanguage(nextLanguage);
  selectedLanguage.value = nextLanguage;
}

function fakeFetch(_input: string | URL | Request, _init?: RequestInit | undefined): Promise<Response> {
  return new Promise((resolve) => {
    window.setTimeout(
      () => {
        resolve(new Response(JSON.stringify({ status: 200, message: 'success' })));
        // reduces the delay for automated Cypress tests
      },
      (window as any).Cypress ? 10 : 500
    );
  });
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
    Example 35: Row Based Editing
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-vue/blob/main/packages/demo/src/examples/slickgrid/example02.ts"
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
      <li>
        The Row Based Edit plugin allows you to edit either a single or multiple specific rows at a time, while disabling the rest of the
        grid rows.
      </li>
      <li>
        Editedable rows, as well as modified cells are highlighted with a different color, which you can customize using css variables (see
        <a
          target="_blank"
          href="https://github.com/ghiscoding/aurelia-slickgrid/blob/master/packages/demo/src/examples/slickgrid/example35.scss"
        >
          example35.scss </a
        >)
      </li>
      <li>Modifications are kept track of and if the cancel button is pressed, all modifications are rolled back.</li>
      <li>
        If the save button is pressed, a custom "onBeforeRowUpdated" callback is called, which you can use to save the data with your
        backend.<br />
        The callback needs to return a Promise&lt;boolean&gt; and if the promise resolves to true, then the row will be updated, otherwise
        it will be cancelled and stays in edit mode. You can try out the later by defining a Duration value <b>larger than 40</b>.
        <br />
        <small
          ><span class="has-text-danger">NOTE:</span> You can also combine this with e.g. Batch Editing like shown
          <a href="#/example30">in Example 30</a></small
        >
      </li>
      <li>
        This example additionally uses the ExcelCopyBuffer Plugin, which you can see also in Slickgrid-Universal
        <a href="https://ghiscoding.github.io/slickgrid-universal/#/example19">example 19</a>. The example defines a rule that pastes in the
        first column are prohibited. In combination with the Row Based Editing Plugin though, this rule gets enhanced with the fact that
        only the edited rows are allowed to be pasted into, while still respecting the original rule.
      </li>
    </ul>
  </div>

  <section>
    <div class="row mb-4">
      <div class="col-sm-8">
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="single-multi-toggle" @click="toggleSingleMultiRowEdit()">
          Toggle Single/Multi Row Edit
        </button>
        <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="toggle-language" @click="switchLanguage()">
          <i class="mdi mdi-translate"></i>
          Switch Language for Action column buttons
        </button>
        <label class="mx-1">Locale:</label>
        <span style="font-style: italic; width: 70px" data-test="selected-locale">
          {{ selectedLanguage + '.json' }}
        </span>
      </div>

      <div class="col-sm-4" :class="statusClass">
        <strong>Status: </strong>
        <span data-test="fetch-result">{{ fetchResult }}</span>
      </div>
    </div>
  </section>

  <slickgrid-vue
    v-model:options="gridOptions!"
    v-model:columns="columnDefinitions as Column[]"
    v-model:data="dataset"
    grid-id="grid35"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
