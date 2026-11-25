<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { i18n } from './data/i18n.js';
  import { createTasks } from './data/tasks.js';

  let grid: SlickgridSvelteInstance;
  let showSubTitle = true;
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => {
      grid?.resizerService?.resizeGrid();
    });
  }
  let language = 'en';
  void i18n.changeLanguage('en');
  const columns: Column[] = [
    { id: 'title', name: 'Title', nameKey: 'TITLE', field: 'title' },
    { id: 'duration', name: 'Duration', nameKey: 'DURATION', field: 'duration', sortable: true },
    { id: 'percentComplete', name: '% Complete', nameKey: 'PERCENT_COMPLETE', field: 'percentComplete', sortable: true },
    { id: 'start', name: 'Start', nameKey: 'START', field: 'start' },
    { id: 'finish', name: 'Finish', nameKey: 'FINISH', field: 'finish' },
    { id: 'completed', name: 'Completed', nameKey: 'COMPLETED', field: 'completed' },
  ];
  columns.forEach((column) => {
    column.header = {
      menu: {
        commandItems: [
          { divider: true, command: '' },
          {
            command: 'help',
            titleKey: 'HELP',
            iconCssClass: 'mdi mdi-help-circle',
            tooltip: 'Need assistance?',
            cssClass: 'bold',
            textCssClass: 'blue',
            itemVisibilityOverride: (args) => args.column.id !== 'percentComplete',
            itemUsabilityOverride: (args) => args.column.id !== 'title' && args.column.id !== 'completed',
            action: (_event, args) => console.log('execute an action on Help', args),
          },
          {
            command: 'custom-actions',
            title: 'Hello',
            commandItems: [
              { command: 'hello-world', title: 'Hello World' },
              { command: 'hello-slickgrid', title: 'Hello SlickGrid' },
              {
                command: 'sub-menu',
                title: "Let's play",
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
    autoResize: { container: '#demo-container', rightPadding: 10 },
    gridHeight: 400,
    enableHeaderMenu: true,
    enableCellNavigation: true,
    enableTranslate: true,
    i18n,
    headerMenu: {
      minWidth: 180,
      subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
      onCommand: (_event, args) => {
        const command = args.item?.command ?? args.command;
        if (command.startsWith('hello-')) {
          window.alert(args.item?.title);
        } else if (command.startsWith('sport-')) {
          window.alert('Just do it, play ' + args.item?.title);
        } else if (command.startsWith('contact-')) {
          window.alert('Command: ' + command);
        } else if (command === 'help') {
          window.alert('Please help!!!');
        }
      },
    },
  };
  const dataset = createTasks(1000).map((item) => ({
    ...item,
    duration: `${item.duration % 26} days`,
    start: '01/01/2009',
    finish: '01/05/2009',
    completed: item.id % 5 === 0,
  }));
  async function switchLanguage() {
    language = language === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(language);
  }
</script>

<h2>
  Example 8: Header Menu Plugin <span class="float-end fs-6"
    ><a
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example08.svelte"
      target="_blank"
      rel="noreferrer"><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
</h2>
{#if showSubTitle}<div class="subtitle">
    This example demonstrates using the <b>SlickHeaderMenu</b> plugin to easily add menus to column headers.<br />These menus can be
    specified directly in the column definition and support built-in commands, custom items, and visibility/usability callbacks. (<a
      href="https://ghiscoding.gitbook.io/angular-slickgrid/grid-functionalities/header-menu-and-header-buttons"
      target="_blank"
      rel="noreferrer">Docs</a
    >)
    <ul>
      <li>Default commands include hide column and sort ascending/descending</li>
      <li>Hover over a column header to show its menu</li>
      <li>Try sorting Duration and % Complete together</li>
      <li>Try hiding columns and restoring them with the Column Picker</li>
    </ul>
  </div>{/if}
<button class="btn btn-outline-secondary btn-sm btn-icon" data-test="language-button" onclick={switchLanguage}
  ><i class="mdi mdi-translate"></i> Switch Language</button
>
<strong>Locale:</strong> <span style="font-style: italic" data-test="selected-locale">{language}.json</span>
<SlickgridSvelte gridId="grid8" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />
