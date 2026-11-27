<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type ContextMenu,
    type Formatter,
    type GridOption,
    type SlickGrid,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { onDestroy } from 'svelte';
  import { i18n } from './data/i18n.js';

  const NB_ITEMS = 1000;
  let grid!: SlickgridSvelteInstance;
  let darkMode = $state(false);
  let selectedLanguage = $state('en');
  let showSubtitle = $state(true);
  void i18n.changeLanguage('en');

  const actionFormatter: Formatter = (_row, _cell, _value, _column, dataContext) =>
    dataContext.priority === 3
      ? '<div class="cell-menu-dropdown-outline">Action<i class="mdi mdi-chevron-down"></i></div>'
      : '<div class="cell-menu-dropdown-outline disabled">Action <i class="mdi mdi-chevron-down"></i></div>';

  const priorityFormatter: Formatter = (_row, _cell, value) => {
    if (!value) {
      return '';
    }
    const count = +(value >= 3 ? 3 : value);
    const color = count === 3 ? 'red' : count === 2 ? 'orange' : 'yellow';
    return Array.from({ length: count }, () => `<i class="mdi mdi-star ${color}" aria-hidden="true"></i>`).join('');
  };

  const priorityExportFormatter: Formatter = (_row, _cell, value, _column, _item, slickGrid) => {
    if (!value) {
      return '';
    }
    const language = (slickGrid.getOptions() as GridOption).i18n;
    const count = +(value >= 3 ? 3 : value);
    const key = count === 3 ? 'HIGH' : count === 2 ? 'MEDIUM' : 'LOW';
    return language?.t(key) ?? '';
  };

  // custom translate Formatter (typically you would move that to a separate file, for separation of concerns)
  const taskTranslateFormatter: Formatter = (_row, _cell, value, _column, _item, slickGrid: SlickGrid) => {
    const language = (slickGrid.getOptions() as GridOption).i18n;
    return language?.t('TASK_X', { x: value }) ?? '';
  };

  const columns: Column[] = [
    { id: 'id', name: '#', field: 'id', maxWidth: 45, sortable: true, filterable: true },
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
      id: 'percentComplete',
      nameKey: 'PERCENT_COMPLETE',
      field: 'percentComplete',
      minWidth: 100,
      exportWithFormatter: false,
      sortable: true,
      filterable: true,
      filter: { model: Filters.slider, operator: '>=' },
      formatter: Formatters.percentCompleteBar,
      type: 'number',
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      nameKey: 'START',
      minWidth: 100,
      formatter: Formatters.dateIso,
      outputType: 'dateIso',
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
      outputType: 'dateIso',
      type: 'date',
      minWidth: 100,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'priority',
      nameKey: 'PRIORITY',
      field: 'priority',
      exportCustomFormatter: priorityExportFormatter,
      formatter: priorityFormatter,
      sortable: true,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: 1, labelKey: 'LOW' },
          { value: 2, labelKey: 'MEDIUM' },
          { value: 3, labelKey: 'HIGH' },
        ],
        model: Filters.singleSelect,
        enableTranslateLabel: true,
      },
    },
    {
      id: 'completed',
      nameKey: 'COMPLETED',
      field: 'completed',
      exportCustomFormatter: Formatters.translateBoolean,
      formatter: Formatters.checkmarkMaterial,
      sortable: true,
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
      id: 'action',
      name: 'Action',
      field: 'action',
      width: 100,
      maxWidth: 110,
      excludeFromExport: true,
      formatter: actionFormatter,
      cellMenu: {
        hideCloseButton: false,
        menuUsabilityOverride: (args: any) => args.dataContext.priority === 3,
        commandTitleKey: 'COMMANDS',
        commandItems: [
          { command: 'command1', title: 'Command 1', cssClass: 'orange' },
          {
            command: 'command2',
            title: 'Command 2',
            action: (_e: any, args: any) => console.log(args.dataContext, args.column),
            itemUsabilityOverride: (args: any) => !args.dataContext.completed,
          },
          { divider: true, command: '' },
          {
            command: 'delete-row',
            titleKey: 'DELETE_ROW',
            iconCssClass: 'mdi mdi-close',
            cssClass: 'red',
            textCssClass: 'bold',
            itemVisibilityOverride: (args: any) => !args.dataContext.completed,
          },
          { command: 'help', titleKey: 'HELP', iconCssClass: 'mdi mdi-help-circle' },
          { command: 'something', titleKey: 'DISABLED_COMMAND', disabled: true },
          { divider: true, command: '' },
          {
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
      },
    },
  ];

  const dataset = Array.from({ length: NB_ITEMS }, (_value, id) => {
    const year = 2000 + Math.floor(Math.random() * 30);
    const month = Math.floor(Math.random() * 11);
    const day = Math.floor(Math.random() * 29);
    return {
      id,
      duration: `${Math.floor(Math.random() * 25)} days`,
      percentComplete: Math.floor(Math.random() * 100),
      start: new Date(year, month, day),
      finish: new Date(year, month + 1, day),
      priority: id % 3 ? 2 : id % 5 ? 3 : 1,
      completed: id % 4 === 0,
    };
  });

  function executeCommand(_event: any, args: any) {
    const { command, dataContext } = args;
    if (['contact-email', 'contact-chat', 'contact-meeting'].includes(command)) {
      alert(`Command: ${command}`);
    } else if (['exports-csv', 'exports-txt', 'exports-xlsx'].includes(command)) {
      alert(`Exporting as ${args.item.title}`);
    } else if (command === 'command1') {
      alert('Command 1');
    } else if (command === 'command2') {
      alert('Command 2');
    } else if (command === 'help') {
      alert('Please help!');
    } else if (
      command === 'delete-row' &&
      confirm(`Do you really want to delete row ${args.row + 1} with ${i18n.t('TASK_X', { x: dataContext.id })}`)
    ) {
      grid.dataView.deleteItem(dataContext.id);
    }
  }

  function getContextMenuOptions(): ContextMenu {
    return {
      hideCloseButton: false,
      menuUsabilityOverride: (args: any) => args.dataContext.id < 21,
      commandShownOverColumnIds: ['id', 'title', 'percentComplete', 'start', 'finish', 'completed'],
      commandTitleKey: 'COMMANDS',
      commandItems: [
        { divider: true, command: '' },
        { command: 'delete-row', titleKey: 'DELETE_ROW', iconCssClass: 'mdi mdi-close', cssClass: 'red', textCssClass: 'bold' },
        { divider: true, command: '' },
        {
          command: 'help',
          titleKey: 'HELP',
          iconCssClass: 'mdi mdi-help-circle',
          action: () => undefined,
          itemVisibilityOverride: (args: any) => !args.dataContext.completed,
        },
        { command: 'something', titleKey: 'DISABLED_COMMAND', disabled: true },
        { divider: true, command: '' },
        {
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
      onBeforeMenuShow: (_event: any, args: any) => {
        grid.slickGrid.setActiveCell(args.row, args.cell, false);
        console.log('Before the global Context Menu is shown', args);
      },
      onBeforeMenuClose: (_event: any, args: any) => console.log('Global Context Menu is closing', args),
      onCommand: executeCommand,
    };
  }

  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    darkMode: false,
    enableCellNavigation: true,
    enableFiltering: true,
    enableSorting: true,
    enableTranslate: true,
    enableExcelExport: true,
    excelExportOptions: { exportWithFormatter: true, customColumnWidth: 15, columnHeaderStyle: { font: { bold: true, italic: true } } },
    externalResources: [new ExcelExportService()],
    i18n,
    enableContextMenu: true,
    enableCellMenu: true,
    cellMenu: {
      onCommand: executeCommand,
      onBeforeMenuShow: (_event: any, args: any) => console.log('Before the Cell Menu is shown', args),
      onBeforeMenuClose: (_event: any, args: any) => console.log('Cell Menu is closing', args),
    },
    contextMenu: getContextMenuOptions(),
  };

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(nextLanguage);
    selectedLanguage = nextLanguage;
  }

  function toggleDarkMode() {
    darkMode = !darkMode;
    document.querySelector('.panel-wm-content')?.classList.toggle('dark-mode', darkMode);
    document.querySelector<HTMLElement>('#demo-container')?.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
    grid.slickGrid.setOptions({ darkMode });
  }

  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }

  function ready(instance: SlickgridSvelteInstance) {
    grid = instance;
  }

  onDestroy(() => {
    document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
    document.querySelector<HTMLElement>('#demo-container')?.setAttribute('data-bs-theme', 'light');
  });
</script>

<h2>
  Example 24: Cell Menu &amp; Context Menu Plugins
  <span class="float-end">
    <a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example24.svelte"
    >
      <i class="mdi mdi-link-variant"></i> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubtitle}
  >
    <i class="mdi mdi-information-outline"></i>
  </button>
  <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" type="button" data-test="toggle-dark-mode" onclick={toggleDarkMode}>
    <i class="mdi mdi-theme-light-dark"></i> <span>Toggle Dark Mode</span>
  </button>
</h2>
{#if showSubtitle}
  <div class="subtitle">
    Add Cell Menu and Context Menu
    <ul>
      <li>This example demonstrates 2 SlickGrid plugins</li>
      <ol>
        <li>
          Using the <b>SlickCellMenu</b> plugin, often used for an Action Menu(s), 1 or more per grid (<a
            href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/cell-menu"
            target="_blank"
            rel="noreferrer"
          >
            Wiki docs
          </a>).
        </li>
        <li>
          Using the <b>SlickContextMenu</b> plugin, shown after a mouse right+click, only 1 per grid. (<a
            href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/context-menu"
            target="_blank"
            rel="noreferrer"
          >
            Wiki docs
          </a>).
        </li>
      </ol>
      <li>It will also "autoAdjustDrop" (bottom/top) and "autoAlignSide" (left/right) by default but could be turned off</li>
      <li>Both plugins display an array of commands, with support for nested sub-menus.</li>
      <li>There are 2 ways to execute a Command</li>
      <ol>
        <li>via onCommand (use a switch/case to parse command and do something with it)</li>
        <li>via action callback (that can be defined on each command)</li>
      </ol>
      <li>
        Use override callback functions to change the properties of show/hide, enable/disable the menu or certain item(s) from the list
      </li>
      <ol>
        <li>These callbacks are: "menuUsabilityOverride", "itemVisibilityOverride", "itemUsabilityOverride"</li>
        <li>... e.g. in the demo, the "Action" Cell Menu is only available when Priority is set to "High" via "menuUsabilityOverride"</li>
        <li>... e.g. in the demo, the Context Menu is only available on the first 20 Tasks via "menuUsabilityOverride"</li>
      </ol>
    </ul>
  </div>
{/if}
<div class="grid24">
  <div class="row locale">
    <div class="col-12">
      <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="language-button" onclick={switchLanguage}>
        <i class="mdi mdi-translate"></i> Switch Language
      </button>
      <b>Locale:</b>
      <span style="font-style:italic" data-test="selected-locale">{selectedLanguage}.json</span>
    </div>
  </div>

  <SlickgridSvelte gridId="grid24" {columns} {options} {dataset} onSvelteGridCreated={ready} />
</div>

<style>
  :global(.grid24 .bold) {
    font-weight: bold;
  }
  :global(.grid24 .grey) {
    color: grey;
  }
  :global(.grid24 .orange) {
    color: orange;
  }
  :global(.grid24 .red) {
    color: red;
  }
  :global(.grid24 .yellow) {
    color: rgb(255, 235, 52);
  }
  :global(.grid24 .pointer) {
    cursor: pointer;
  }
  :global(.grid24 .cell-menu-dropdown-outline) {
    border: 1px solid #a0a0a0;
    border-radius: 4px;
    width: max-content;
    padding: 2px 14px;
    cursor: pointer;
  }
  :global(.grid24 .cell-menu-dropdown-outline:hover:not(.disabled)) {
    background-color: #a3a3a3;
    color: #ffffff;
  }
  :global(.grid24 .cell-menu-dropdown-outline.disabled) {
    color: #d4d4d4;
    border: 1px solid #d8d8d8;
  }
  :global(.grid24 .slick-dark-mode .disabled) {
    border: 1px solid #616161;
    color: #686868;
  }
  :global(.grid24 .fake-hyperlink) {
    cursor: pointer;
    color: #08c;
  }
  :global(.grid24 .row.locale) {
    margin-top: 5px;
  }
</style>
