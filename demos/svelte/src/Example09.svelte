<script lang="ts">
  import { Filters, Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
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
    { id: 'title', name: 'Title', nameKey: 'TITLE', field: 'title', filterable: true },
    { id: 'duration', name: 'Duration', nameKey: 'DURATION', field: 'duration', sortable: true, filterable: true },
    {
      id: 'percentComplete',
      name: '% Complete',
      nameKey: 'PERCENT_COMPLETE',
      field: 'percentComplete',
      sortable: true,
      filterable: true,
      type: 'number',
      formatter: Formatters.percentCompleteBar,
      filter: { model: Filters.compoundSlider },
    },
    { id: 'start', name: 'Start', nameKey: 'START', field: 'start', filterable: true },
    { id: 'finish', name: 'Finish', nameKey: 'FINISH', field: 'finish', filterable: true },
    {
      id: 'effort-driven',
      name: 'Completed',
      nameKey: 'COMPLETED',
      field: 'effortDriven',
      maxWidth: 80,
      minWidth: 100,
      sortable: true,
      filterable: true,
      type: 'boolean',
      formatter: Formatters.checkmarkMaterial,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: true, label: 'true' },
          { value: false, label: 'false' },
        ],
      },
    },
  ];
  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    gridHeight: 400,
    enableGridMenu: true,
    enableFiltering: true,
    enableCellNavigation: true,
    enableTranslate: true,
    i18n,
    columnPicker: {
      hideForceFitButton: true,
      hideSyncResizeButton: true,
      onColumnsChanged: (_event, args) =>
        console.log('Column selection changed from Column Picker, visible columns: ', args.visibleColumns),
    },
    gridMenu: {
      commandTitleKey: 'CUSTOM_COMMANDS',
      iconCssClass: 'mdi mdi-dots-vertical',
      hideForceFitButton: true,
      hideSyncResizeButton: true,
      menuUsabilityOverride: () => true,
      menuWidth: 17,
      resizeOnShowHeaderRow: true,
      subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
      commandItems: [
        { divider: true, command: '' },
        { command: 'help', titleKey: 'HELP', iconCssClass: 'mdi mdi-help-circle', cssClass: 'bold', textCssClass: 'blue' },
        {
          command: 'command1',
          title: 'Command 1',
          cssClass: 'orange',
          iconCssClass: 'mdi mdi-alert',
          action: (_event, args) => window.alert(args.command),
          itemUsabilityOverride: (args) => args.columns.length === args.visibleColumns.length,
        },
        {
          command: 'command2',
          title: 'Command 2',
          cssClass: 'red',
          textCssClass: 'italic',
          action: (_event, args) => window.alert(args.command),
          itemVisibilityOverride: () => !grid || Object.keys(grid.filterService.getColumnFilters()).length === 0,
        },
        { command: 'disabled-command', title: 'Disabled command', disabled: true },
        { command: '', divider: true },
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
      onCommand: (_event, args) => {
        const command = args.item?.command ?? args.command;
        if (command.includes('exports-')) {
          window.alert('Exporting as ' + args.item?.title);
        } else if (command.includes('contact-') || command === 'help') {
          window.alert('Command: ' + args.command);
        } else {
          console.log('onGridMenuCommand', args.command);
        }
      },
      onColumnsChanged: (_event, args) => console.log('Column selection changed from Grid Menu, visible columns: ', args.visibleColumns),
    },
  };
  const dataset = createTasks(500).map((item) => ({
    ...item,
    duration: `${item.duration % 26} days`,
    start: '01/01/2009',
    finish: '01/05/2009',
  }));
  function openMenu(event: MouseEvent) {
    grid.extensionService.getExtensionInstanceByName('gridMenu').showGridMenu(event, { dropSide: 'right' });
  }
  async function switchLanguage() {
    language = language === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(language);
  }
</script>

<h2>
  Example 9: Grid Menu Control <span class="float-end fs-6"
    ><a
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example09.svelte"
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
    This example demonstrates using the <b>Slick.Controls.GridMenu</b> plugin to add a Grid Menu on the top right corner of the grid. (<a
      href="https://ghiscoding.gitbook.io/angular-slickgrid/grid-functionalities/grid-menu"
      target="_blank"
      rel="noreferrer">Docs</a
    >)<br />
    <ul>
      <li>You can change the Grid Menu icon; this example uses mdi-dots-vertical</li>
      <li>The Grid Menu shows all columns so you can show or hide them</li>
      <li>You can configure custom commands and handle them with callbacks</li>
      <li>Right-clicking any column header opens the Column Picker</li>
      <li>You can show the Grid Menu anywhere on your page</li>
    </ul>
  </div>{/if}
<button class="btn btn-outline-secondary btn-sm btn-icon" data-test="external-gridmenu" onclick={openMenu}
  ><i class="mdi mdi-menu"></i> Grid Menu</button
>
<button class="btn btn-outline-secondary btn-sm mb-2" data-test="language" onclick={switchLanguage}
  ><i class="mdi mdi-translate"></i> Switch Language ({language})</button
>
<strong>Locale:</strong> <span style="font-style: italic" data-test="selected-locale">{language}.json</span>
<SlickgridSvelte gridId="grid9" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />
