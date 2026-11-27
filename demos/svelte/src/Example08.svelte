<script lang="ts">
  import { Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { tick } from 'svelte';
  import { i18n } from './data/i18n.js';
  import './example08.scss';

  const NB_ITEMS = 1000;

  let showSubTitle = $state(true);
  let selectedLanguage = $state('en');
  let svelteGrid!: SlickgridSvelteInstance;

  // always start with English for Cypress E2E tests to be consistent
  void i18n.changeLanguage('en');

  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', nameKey: 'TITLE' },
    { id: 'duration', name: 'Duration', field: 'duration', nameKey: 'DURATION', sortable: true },
    { id: 'percentComplete', name: '% Complete', field: 'percentComplete', nameKey: 'PERCENT_COMPLETE', sortable: true },
    { id: 'start', name: 'Start', field: 'start', nameKey: 'START' },
    { id: 'finish', name: 'Finish', field: 'finish', nameKey: 'FINISH' },
    { id: 'completed', name: 'Completed', field: 'completed', nameKey: 'COMPLETED', formatter: Formatters.checkmarkMaterial },
  ];

  columns.forEach((columnDef) => {
    columnDef.header = {
      menu: {
        commandItems: [
          // you can also add divider between commands (command is a required property but you can set it to empty string)
          { divider: true, command: '' },
          // add Custom Header Menu Item Commands which will be appended to the existing internal custom items
          // you cannot override an internal command but you can hide them and create your own
          {
            iconCssClass: 'mdi mdi-help-circle',

            // you can disable a command with certain logic
            // HOWEVER note that if you use "itemUsabilityOverride" has precedence when it is defined
            // disabled: (columnDef.id === 'completed'),

            titleKey: 'HELP', // use "title" as plain string OR "titleKey" when using a translation key
            command: 'help',
            tooltip: 'Need assistance?',
            cssClass: 'bold', // container css class
            textCssClass: columnDef.id === 'title' || columnDef.id === 'completed' ? '' : 'blue', // just the text css class
            itemUsabilityOverride: (args) => {
              // for example if we want to disable the "Help" command over the "Title" and "Completed" column
              return !(args.column.id === 'title' || args.column.id === 'completed');
            },
            itemVisibilityOverride: (args) => {
              // for example don't show Help on column "% Complete"
              return args.column.id !== 'percentComplete';
            },
            action: (_e, args) => {
              // you can use the "action" callback and/or subscribe to the "onCallback" event, they both have the same arguments
              console.log('execute an action on Help', args);
            },
          },
          // you can use "divider" as a string too, but if you do then make sure it's the correct position in the list
          // 'divider',
          {
            // we can also have multiple nested sub-menus
            command: 'custom-actions',
            title: 'Hello',
            commandItems: [
              { command: 'hello-world', title: 'Hello World' },
              { command: 'hello-slickgrid', title: 'Hello SlickGrid' },
              {
                command: 'sub-menu',
                title: `Let's play`,
                cssClass: 'green',
                subMenuTitle: 'choose your game',
                subMenuTitleCssClass: 'text-italic salmon',
                commandItems: [
                  { command: 'sport-badminton', title: 'Badminton' },
                  { command: 'sport-tennis', title: 'Tennis' },
                  { command: 'sport-racquetball', title: 'Racquetball' },
                  { command: 'sport-squash', title: 'Squash' },
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
      },
    };
  });

  const options: GridOption = {
    enableAutoResize: true,
    enableHeaderMenu: true,
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableFiltering: false,
    enableCellNavigation: true,
    headerMenu: {
      subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
      // you can use the "onCommand" (in Grid Options) and/or the "action" callback (in Column Definition)
      onCommand: (_e, args) => {
        // e.preventDefault(); // preventing default event would keep the menu open after the execution
        const command = args.item?.command;
        if (command.includes('hello-')) {
          alert(args?.item.title);
        } else if (command.includes('sport-')) {
          alert('Just do it, play ' + args?.item?.title);
        } else if (command.includes('contact-')) {
          alert('Command: ' + args?.item?.command);
        } else if (args.command === 'help') {
          alert('Please help!!!');
        }
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
        duration: Math.round(Math.random() * 25) + ' days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        completed: i % 5 === 0,
      };
    }
    return mockDataset;
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

<div class="grid8">
  <h2>
    Example 8: Header Menu Plugin
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example08.svelte"
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
    This example demonstrates using the <b>SlickHeaderMenu</b> plugin to easily add menus to colum headers.<br />
    These menus can be specified directly in the column definition, and are very easy to configure and use. (<a
      href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/header-menu-header-buttons"
      target="_blank"
    >
      Wiki docs
    </a>)
    <ul>
      <li>Now enabled by default in the Global Grid Options, it will add the default commands of (hide column, sort asc/desc)</li>
      <li>Hover over any column header to see an arrow showing up on the right</li>
      <li>Try Sorting (multi-sort) the 2 columns "Duration" and "% Complete" (the other ones are disabled)</li>
      <li>Try hiding any columns (you use the "Column Picker" plugin by doing a right+click on the header to show the column back)</li>
      <li>Note: The "Header Button" & "Header Menu" Plugins cannot be used at the same time</li>
      <li>You can change the menu icon via SASS variables as shown in this demo (check all SASS variables)</li>
      <li>
        Use override callback functions to change the properties of show/hide, enable/disable the menu or certain item(s) from the list
      </li>
      <ol>
        <li>These callbacks are: "itemVisibilityOverride", "itemUsabilityOverride"</li>
        <li>for example if we want to disable the "Help" command over the "Title" and "Completed" column</li>
        <li>for example don't show Help on column "% Complete"</li>
      </ol>
    </ul>
  </div>

  <button class="btn btn-outline-secondary btn-sm btn-icon me-1" data-test="language-button" onclick={switchLanguage}>
    <i class="mdi mdi-translate"></i>
    Switch Language
  </button>
  <b>Locale:</b>
  <span class="ms-1 fst-italic" data-test="selected-locale"> {selectedLanguage + '.json'} </span>

  <SlickgridSvelte gridId="grid8" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (svelteGrid = instance)} />
</div>
