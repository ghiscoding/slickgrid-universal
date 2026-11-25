<script lang="ts">
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type SlickgridSvelteInstance,
    type SliderRangeOption,
  } from 'slickgrid-svelte';
  import { tick } from 'svelte';
  import { i18n } from './data/i18n.js';
  import './example09.scss';

  const NB_ITEMS = 500;

  let selectedLanguage = $state('en');
  let showSubTitle = $state(true);
  let svelteGrid!: SlickgridSvelteInstance;

  // always start with English for Cypress E2E tests to be consistent
  void i18n.changeLanguage('en');

  const columns: Column[] = [
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

  const options: GridOption = {
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
      menuWidth: 17,
      resizeOnShowHeaderRow: true,
      subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
      commandItems: [
        { divider: true, command: '' },
        // add Custom Items Commands which will be appended to the existing internal custom items
        // you cannot override an internal items but you can hide them and create your own
        {
          iconCssClass: 'mdi mdi-help-circle',
          titleKey: 'HELP',
          disabled: false,
          command: 'help',
          cssClass: 'bold', // container css class
          textCssClass: 'blue', // just the text css class
        },
        // 'divider',
        {
          title: 'Command 1',
          command: 'command1',
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
          cssClass: 'red', // container css class
          textCssClass: 'italic', // just the text css class
          action: (_e, args) => alert(args.command),
          itemVisibilityOverride: () => {
            // for example hide this command from the menu if there's any filter entered
            if (svelteGrid) {
              return isObjectEmpty(svelteGrid.filterService.getColumnFilters());
            }
            return true;
          },
        },
        {
          title: 'Disabled command',
          disabled: true,
          command: 'disabled-command',
        },
        { command: '', divider: true },
        {
          // we can also have multiple nested sub-menus
          command: 'export',
          title: 'Exports',
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
    i18n,
  };

  const dataset = getData(NB_ITEMS);

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
    if (svelteGrid?.extensionService) {
      const gridMenuInstance = svelteGrid.extensionService.getExtensionInstanceByName('gridMenu');
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
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(nextLanguage);
    selectedLanguage = nextLanguage;
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    svelteGrid.resizerService.resizeGrid();
  }
</script>

<h2>
  Example 9: Grid Menu Control
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example09.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

<div class="subtitle" class:hidden={!showSubTitle}>
  This example demonstrates using the <b>Slick.Controls.GridMenu</b> plugin to easily add a Grid Menu (aka hamburger menu) on the top right
  corner of the grid.<br />
  (<a href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/grid-menu" target="_blank">Wiki docs</a>)
  <ul>
    <li>
      You can change the Grid Menu icon, for example "mdi-dots-vertical"&nbsp;&nbsp;<span class="mdi mdi-dots-vertical"
      ></span>&nbsp;&nbsp;(which is shown in this example)
    </li>
    <li>By default the Grid Menu shows all columns which you can show/hide them</li>
    <li>You can configure multiple custom "commands" to show up in the Grid Menu and use the "onGridMenuCommand()" callback</li>
    <li>Doing a "right + click" over any column header will also provide a way to show/hide a column (via the Column Picker Plugin)</li>
    <li>You can change the icons of both picker via SASS variables as shown in this demo (check all SASS variables)</li>
    <li><i class="mdi mdi-arrow-down icon"></i> You can also show the Grid Menu anywhere on your page</li>
  </ul>
</div>

<button class="btn btn-outline-secondary btn-sm btn-icon" data-test="external-gridmenu" onclick={toggleGridMenu}>
  <i class="mdi mdi-menu"></i>
  Grid Menu
</button>
<button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="language" onclick={switchLanguage}>
  <i class="mdi mdi-translate"></i>
  Switch Language
</button>
<b>Locale:</b> <span style="font-style: italic" data-test="selected-locale">{selectedLanguage + '.json'}</span>

<SlickgridSvelte gridId="grid9" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (svelteGrid = instance)} />
