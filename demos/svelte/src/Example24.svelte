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
  let grid: SlickgridSvelteInstance;
  let selectedLanguage = 'en';
  let showSubtitle = true;
  let darkMode = false;
  void i18n.changeLanguage('en');

  const actionFormatter: Formatter = (_row, _cell, _value, _column, dataContext) =>
    dataContext.priority === 3
      ? '<div class="cell-menu-dropdown-outline">Action<i class="mdi mdi-chevron-down"></i></div>'
      : '<div class="cell-menu-dropdown-outline disabled">Action <i class="mdi mdi-chevron-down"></i></div>';

  const priorityFormatter: Formatter = (_row, _cell, value) => {
    if (!value) {
      return '';
    }
    const count = Number(value >= 3 ? 3 : value);
    const color = count === 3 ? 'red' : count === 2 ? 'orange' : 'yellow';
    return Array.from({ length: count }, () => `<i class="mdi mdi-star ${color}" aria-hidden="true"></i>`).join('');
  };

  const priorityExportFormatter: Formatter = (_row, _cell, value, _column, _item, slickGrid) => {
    if (!value) {
      return '';
    }
    const language = (slickGrid.getOptions() as GridOption).i18n;
    const key = value >= 3 ? 'HIGH' : value === 2 ? 'MEDIUM' : 'LOW';
    return language?.t(key) ?? '';
  };

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
            action: () => undefined,
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
      grid.gridService.deleteItemById(dataContext.id);
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
              tooltip: 'send an update request',
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
      onBeforeMenuShow: (_event: any, args: any) => grid.slickGrid.setActiveCell(args.row, args.cell, false),
      onCommand: executeCommand,
    };
  }

  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
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
    cellMenu: { onCommand: executeCommand },
    contextMenu: getContextMenuOptions(),
  };

  async function switchLanguage() {
    selectedLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(selectedLanguage);
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
  <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example24.svelte"
      ><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubtitle}><i class="mdi mdi-information-outline"></i></button
  >
  <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" type="button" data-test="toggle-dark-mode" onclick={toggleDarkMode}
    ><i class="mdi mdi-theme-light-dark"></i> Toggle Dark Mode</button
  >
</h2>
{#if showSubtitle}<div class="subtitle">
    This example demonstrates SlickGrid cell menus and context menus, including translated items, conditional commands, and nested submenus.
  </div>{/if}
<div class="row mb-2">
  <div class="col">
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="language-button" onclick={switchLanguage}
      ><i class="mdi mdi-translate"></i> Switch Language</button
    >
    <b>Locale:</b> <span class="ms-1" style="font-style:italic" data-test="selected-locale">{selectedLanguage}.json</span>
  </div>
</div>
<SlickgridSvelte gridId="grid24" {columns} {options} {dataset} onSvelteGridCreated={ready} />
