<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import {
  type GridOption,
  type SlickgridVueInstance,
  type Column,
  ExtensionName,
  Filters,
  Formatters,
  SlickgridVue,
  type SliderRangeOption,
} from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const { i18next } = useTranslation();

const NB_ITEMS = 500;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const selectedLanguage = ref('en');
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
  // always start with English for Cypress E2E tests to be consistent
  const defaultLang = 'en';
  i18next.changeLanguage(defaultLang);
  selectedLanguage.value = defaultLang;

  // mock some data (different in each dataset)
  dataset.value = getData(NB_ITEMS);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    { id: 'title', name: 'Title', field: 'title', nameKey: 'TITLE', filterable: true },
    {
      id: 'duration',
      name: 'Duration',
      field: 'duration',
      nameKey: 'DURATION',
      sortable: true,
      filterable: true,
    },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      nameKey: 'PERCENT_COMPLETE',
      sortable: true,
      filterable: true,
      type: 'number',
      formatter: Formatters.percentCompleteBar,
      filter: {
        model: Filters.compoundSlider,
        options: { hideSliderNumber: false } as SliderRangeOption,
      },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      nameKey: 'START',
      filterable: true,
      type: 'dateUs',
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      nameKey: 'FINISH',
      filterable: true,
      type: 'dateUs',
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      nameKey: 'COMPLETED',
      maxWidth: 80,
      formatter: Formatters.checkmarkMaterial,
      type: 'boolean',
      minWidth: 100,
      sortable: true,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, label: 'true' },
          { value: false, label: 'false' },
        ],
        model: Filters.singleSelect,
      },
    },
  ];

  gridOptions.value = {
    columnPicker: {
      hideForceFitButton: true,
      hideSyncResizeButton: true,
      onColumnsChanged: (_e, args) => {
        console.log('Column selection changed from Column Picker, visible columns: ', args.visibleColumns);
      },
    },
    enableAutoResize: true,
    enableGridMenu: true,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableFiltering: true,
    enableCellNavigation: true,
    gridMenu: {
      // we could disable the menu entirely by returning false depending on some code logic
      menuUsabilityOverride: () => true,

      // all titles optionally support translation keys, if you wish to use that feature then use the title properties with the 'Key' suffix (e.g: titleKey)
      // example "commandTitle" for a plain string OR "commandTitleKey" to use a translation key
      commandTitleKey: 'CUSTOM_COMMANDS',
      iconCssClass: 'mdi mdi-dots-vertical', // defaults to "mdi-menu"
      hideForceFitButton: true,
      hideSyncResizeButton: true,
      hideToggleFilterCommand: false, // show/hide internal custom commands
      menuWidth: 17,
      resizeOnShowHeaderRow: true,
      subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
      commandItems: [
        // add Custom Items Commands which will be appended to the existing internal custom items
        // you cannot override an internal items but you can hide them and create your own
        // also note that the internal custom commands are in the positionOrder range of 50-60,
        // if you want yours at the bottom then start with 61, below 50 will make your command(s) show on top
        {
          iconCssClass: 'mdi mdi-help-circle',
          titleKey: 'HELP',
          disabled: false,
          command: 'help',
          positionOrder: 90,
          cssClass: 'bold', // container css class
          textCssClass: 'blue', // just the text css class
        },
        // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
        // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
        { divider: true, command: '', positionOrder: 89 },
        // 'divider',
        {
          title: 'Command 1',
          command: 'command1',
          positionOrder: 91,
          cssClass: 'orange',
          iconCssClass: 'mdi mdi-alert',
          // you can use the "action" callback and/or use "onCallback" callback from the grid options, they both have the same arguments
          action: (_e, args) => alert(args.command),
          itemUsabilityOverride: (args) => {
            // for example disable the command if there's any hidden column(s)
            if (args && Array.isArray(args.columns)) {
              return args.columns.length === args.visibleColumns.length;
            }
            return true;
          },
        },
        {
          title: 'Command 2',
          command: 'command2',
          positionOrder: 92,
          cssClass: 'red', // container css class
          textCssClass: 'italic', // just the text css class
          action: (_e, args) => alert(args.command),
          itemVisibilityOverride: () => {
            // for example hide this command from the menu if there's any filter entered
            if (vueGrid) {
              return isObjectEmpty(vueGrid.filterService.getColumnFilters());
            }
            return true;
          },
        },
        {
          title: 'Disabled command',
          disabled: true,
          command: 'disabled-command',
          positionOrder: 98,
        },
        { command: '', divider: true, positionOrder: 98 },
        {
          // we can also have multiple nested sub-menus
          command: 'export',
          title: 'Exports',
          positionOrder: 99,
          commandItems: [
            { command: 'exports-txt', title: 'Text (tab delimited)' },
            {
              command: 'sub-menu',
              title: 'Excel',
              cssClass: 'green',
              subMenuTitle: 'available formats',
              subMenuTitleCssClass: 'text-italic orange',
              commandItems: [
                { command: 'exports-csv', title: 'Excel (csv)' },
                { command: 'exports-xlsx', title: 'Excel (xlsx)' },
              ],
            },
          ],
        },
        {
          command: 'feedback',
          title: 'Feedback',
          positionOrder: 100,
          commandItems: [
            {
              command: 'request-update',
              title: 'Request update from supplier',
              iconCssClass: 'mdi mdi-star',
              tooltip: 'this will automatically send an alert to the shipping team to contact the user for an update',
            },
            'divider',
            {
              command: 'sub-menu',
              title: 'Contact Us',
              iconCssClass: 'mdi mdi-account',
              subMenuTitle: 'contact us...',
              subMenuTitleCssClass: 'italic',
              commandItems: [
                { command: 'contact-email', title: 'Email us', iconCssClass: 'mdi mdi-pencil-outline' },
                { command: 'contact-chat', title: 'Chat with us', iconCssClass: 'mdi mdi-message-text-outline' },
                { command: 'contact-meeting', title: 'Book an appointment', iconCssClass: 'mdi mdi-coffee' },
              ],
            },
          ],
        },
      ],
      // you can use the "action" callback and/or use "onCallback" callback from the grid options, they both have the same arguments
      onCommand: (_e: Event, args: any) => {
        // e.preventDefault(); // preventing default event would keep the menu open after the execution
        const command = args.item?.command;
        if (command.includes('exports-')) {
          alert('Exporting as ' + args?.item.title);
        } else if (command.includes('contact-') || command === 'help') {
          alert('Command: ' + args.command);
        } else {
          console.log('onGridMenuCommand', args.command);
        }
      },
      onColumnsChanged: (_e, args) => {
        console.log('Column selection changed from Grid Menu, visible columns: ', args.visibleColumns);
      },
    },
    enableTranslate: true,
    i18n: i18next,
  };
}

function getData(count: number) {
  // Set up some test columns.
  const mockDataset: any[] = [];
  for (let i = 0; i < count; i++) {
    mockDataset[i] = {
      id: i,
      title: 'Task ' + i,
      phone: generatePhoneNumber(),
      duration: Math.round(Math.random() * 25) + ' days',
      percentComplete: Math.round(Math.random() * 100),
      start: '01/01/2009',
      finish: '01/05/2009',
      completed: i % 5 === 0,
    };
  }
  return mockDataset;
}

function generatePhoneNumber() {
  let phone = '';
  for (let i = 0; i < 10; i++) {
    phone += Math.round(Math.random() * 9) + '';
  }
  return phone;
}

function toggleGridMenu(e: MouseEvent) {
  if (vueGrid?.extensionService) {
    const gridMenuInstance = vueGrid.extensionService.getExtensionInstanceByName(ExtensionName.gridMenu);
    // open the external button Grid Menu, you can also optionally pass Grid Menu options as 2nd argument
    // for example we want to align our external button on the right without affecting the menu within the grid which will stay aligned on the left
    gridMenuInstance.showGridMenu(e, { dropSide: 'right' });
  }
}

function isObjectEmpty(obj: any) {
  for (const key in obj) {
    if (key in obj && obj[key] !== '') {
      return false;
    }
  }
  return true;
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
    Example 9: Grid Menu Control
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example09.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    This example demonstrates using the <b>Slick.Controls.GridMenu</b> plugin to easily add a Grid Menu (aka hamburger menu) on the top
    right corner of the grid.<br />
    (<a href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/grid-menu" target="_blank">Wiki docs</a>)
    <ul>
      <li>
        You can change the Grid Menu icon, for example "mdi-dots-vertical"&nbsp;&nbsp;<span class="mdi mdi-dots-vertical"></span
        >&nbsp;&nbsp;(which is shown in this example)
      </li>
      <li>By default the Grid Menu shows all columns which you can show/hide them</li>
      <li>You can configure multiple custom "commands" to show up in the Grid Menu and use the "onGridMenuCommand()" callback</li>
      <li>Doing a "right + click" over any column header will also provide a way to show/hide a column (via the Column Picker Plugin)</li>
      <li>You can change the icons of both picker via SASS variables as shown in this demo (check all SASS variables)</li>
      <li><i class="mdi mdi-arrow-down icon"></i> You can also show the Grid Menu anywhere on your page</li>
    </ul>
  </div>

  <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="external-gridmenu" @click="toggleGridMenu($event)">
    <i class="mdi mdi-menu"></i>
    Grid Menu
  </button>
  <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="language" @click="switchLanguage()">
    <i class="mdi mdi-translate"></i>
    Switch Language
  </button>
  <b>Locale:</b> <span style="font-style: italic" data-test="selected-locale">{{ selectedLanguage + '.json' }}</span>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    grid-id="grid9"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss" scoped>
$slickcolumn-picker-checkbox-opacity: 0.2;
$slickcolumn-picker-checkbox-opacity-hover: 0.35;

@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss' with (
  $slick-column-picker-icon-checked-svg-path:
    'M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,5V19H5V5H19M10,17L6,13L7.41,11.58L10,14.17L16.59,7.58L18,9',
  $slick-column-picker-icon-unchecked-svg-path:
    'M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z',
  $slick-column-picker-icon-font-size: 16px
);

.blue {
  color: rgb(73, 73, 255);
}
.orange {
  color: orange;
}
.red {
  color: red;
}
.bold {
  font-weight: bold;
}
.italic {
  font-style: italic;
}
</style>
