import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';
import {
  ExtensionName,
  Filters,
  Formatters,
  SlickgridReact,
  type Column,
  type GridOption,
  type SlickgridReactInstance,
  type SliderOption,
} from 'slickgrid-react';
import './example9.scss'; // provide custom CSS/SASS styling

const Example9: React.FC = () => {
  const defaultLang = 'en';
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLang);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    i18next.changeLanguage(defaultLang);
    defineGrid();
    getData();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function getColumnDefinitions(): Column[] {
    return [
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
          options: { hideSliderNumber: false } as SliderOption,
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
  }

  function getGridOptions(): GridOption {
    return {
      columnPicker: {
        hideForceFitButton: true,
        hideSyncResizeButton: true,
        onColumnsChanged: (_e: Event, args: any) => {
          console.log('Column selection changed from Column Picker, visible columns: ', args.columns);
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
            action: (_e: Event, args: any) => alert(args.command),
            itemUsabilityOverride: (args: any) => {
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
            action: (_e: Event, args: any) => alert(args.command),
            itemVisibilityOverride: () => {
              // for example hide this command from the menu if there's any filter entered
              if (reactGridRef.current) {
                return isObjectEmpty(reactGridRef.current.filterService.getColumnFilters());
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
        onColumnsChanged: (_e: Event, args: any) => {
          console.log('Column selection changed from Grid Menu, visible columns: ', args.visibleColumns);
        },
      },
      enableTranslate: true,
      i18n: i18next,
    };
  }

  function defineGrid() {
    const columnDefinitions = getColumnDefinitions();
    const gridOptions = getGridOptions();
    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getData() {
    // Set up some test columns.
    const mockDataset: any[] = [];
    for (let i = 0; i < 500; i++) {
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

    setDataset(mockDataset);
  }

  function generatePhoneNumber() {
    let phone = '';
    for (let i = 0; i < 10; i++) {
      phone += Math.round(Math.random() * 9) + '';
    }
    return phone;
  }

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18next.changeLanguage(nextLanguage);
    setSelectedLanguage(nextLanguage);
  }

  function toggleGridMenu(e: MouseEvent) {
    if (reactGridRef.current?.extensionService) {
      const gridMenuInstance = reactGridRef.current.extensionService.getExtensionInstanceByName(ExtensionName.gridMenu);
      gridMenuInstance.showGridMenu(e, { dropSide: 'right' });
    }
  }

  function isObjectEmpty(obj: any) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] !== '') {
        return false;
      }
    }
    return true;
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? null : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 9: Grid Menu Control
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example9.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => toggleSubTitle()}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>
      <div className="subtitle">
        This example demonstrates using the <b>Slick.Controls.GridMenu</b> plugin to easily add a Grid Menu (aka hamburger menu) on the top
        right corner of the grid.
        <br />(
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/grid-menu" target="_blank">
          Docs
        </a>
        )
        <ul>
          <li>
            You can change the Grid Menu icon, for example "mdi-dots-vertical"&nbsp;&nbsp;<span className="mdi mdi-dots-vertical"></span>
            &nbsp;&nbsp;(which is shown in this example)
          </li>
          <li>By default the Grid Menu shows all columns which you can show/hide them</li>
          <li>You can configure multiple custom "commands" to show up in the Grid Menu and use the "onGridMenuCommand()" callback</li>
          <li>
            Doing a "right + click" over any column header will also provide a way to show/hide a column (via the Column Picker Plugin)
          </li>
          <li>You can change the icons of both picker via SASS variables as shown in this demo (check all SASS variables)</li>
          <li>
            <i className="mdi mdi-arrow-down icon"></i> You can also show the Grid Menu anywhere on your page
          </li>
        </ul>
      </div>
      <button
        className="btn btn-outline-secondary btn-sm btn-icon"
        data-test="external-gridmenu"
        onClick={($event) => toggleGridMenu($event.nativeEvent)}
      >
        <i className="mdi mdi-menu me-1"></i>
        Grid Menu
      </button>
      <button className="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="language" onClick={() => switchLanguage()}>
        <i className="mdi mdi-translate me-1"></i>
        Switch Language
      </button>
      <b>Locale:</b>{' '}
      <span style={{ fontStyle: 'italic' }} data-test="selected-locale">
        {selectedLanguage + '.json'}
      </span>
      <SlickgridReact
        gridId="grid9"
        columns={columnDefinitions}
        dataset={dataset}
        options={gridOptions}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default withTranslation()(Example9);
