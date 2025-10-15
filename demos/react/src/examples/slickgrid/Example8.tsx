import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { Formatters, SlickgridReact, type Column, type GridOption } from 'slickgrid-react';
import './example8.scss'; // provide custom CSS/SASS styling

const Example8: React.FC = () => {
  const defaultLang = 'en';
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLang);
  // const [visibleColumns, setVisibleColumns] = useState<Column[]>([]);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  useEffect(() => {
    i18next.changeLanguage(defaultLang);
    defineGrid();
    getData();
  }, []);

  function getColumnDefinitions(): Column[] {
    const columnDefinitions: Column[] = [
      { id: 'title', name: 'Title', field: 'title', nameKey: 'TITLE' },
      { id: 'duration', name: 'Duration', field: 'duration', nameKey: 'DURATION', sortable: true },
      { id: 'percentComplete', name: '% Complete', field: 'percentComplete', nameKey: 'PERCENT_COMPLETE', sortable: true },
      { id: 'start', name: 'Start', field: 'start', nameKey: 'START' },
      { id: 'finish', name: 'Finish', field: 'finish', nameKey: 'FINISH' },
      { id: 'completed', name: 'Completed', field: 'completed', nameKey: 'COMPLETED', formatter: Formatters.checkmarkMaterial },
    ];

    columnDefinitions.forEach((columnDef) => {
      columnDef.header = {
        menu: {
          commandItems: [
            {
              iconCssClass: 'mdi mdi-help-circle',
              titleKey: 'HELP',
              command: 'help',
              tooltip: 'Need assistance?',
              cssClass: 'bold',
              textCssClass: columnDef.id === 'title' || columnDef.id === 'completed' ? '' : 'blue',
              positionOrder: 99,
              itemUsabilityOverride: (args) => {
                return !(args.column.id === 'title' || args.column.id === 'completed');
              },
              itemVisibilityOverride: (args) => {
                return args.column.id !== 'percentComplete';
              },
              action: (_e: Event, args: any) => {
                console.log('execute an action on Help', args);
              },
            },
            { divider: true, command: '', positionOrder: 98 },
            {
              command: 'custom-actions',
              title: 'Hello',
              positionOrder: 99,
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
        },
      };
    });
    return columnDefinitions;
  }

  function getGridOptions(): GridOption {
    return {
      enableAutoResize: true,
      enableHeaderMenu: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: false,
      enableCellNavigation: true,
      headerMenu: {
        hideSortCommands: false,
        hideColumnHideCommand: false,
        subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
        onCommand: (_e, args) => {
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
      i18n: i18next,
    };
  }

  function defineGrid() {
    const gridOptions = getGridOptions();
    const columnDefinitions = getColumnDefinitions();

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getData() {
    const mockDataset: any[] = [];
    for (let i = 0; i < 1000; i++) {
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

    setDataset(mockDataset);
  }

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18next.changeLanguage(nextLanguage);
    setSelectedLanguage(nextLanguage);
  }

  return !gridOptions ? null : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 8: Header Menu Plugin
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example8.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => setHideSubTitle(!hideSubTitle)}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>
      {hideSubTitle ? null : (
        <div className="subtitle">
          This example demonstrates using the <b>SlickHeaderMenu</b> plugin to easily add menus to colum headers.
          <br />
          These menus can be specified directly in the column definition, and are very easy to configure and use. (
          <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/header-menu-header-buttons" target="_blank">
            Docs
          </a>
          )
          <ul>
            <li>Now enabled by default in the Global Grid Options, it will add the default commands of (hide column, sort asc/desc)</li>
            <li>Hover over any column header to see an arrow showing up on the right</li>
            <li>Try Sorting (multi-sort) the 2 columns "Duration" and "% Complete" (the other ones are disabled)</li>
            <li>
              Try hiding any columns (you use the "Column Picker" plugin by doing a right+click on the header to show the column back)
            </li>
            <li>Note: The "Header Button" & "Header Menu" Plugins cannot be used at the same time</li>
            <li>You can change the menu icon via SASS variables as shown in this demo (check all SASS variables)</li>
            <li>
              Use override callback functions to change the properties of show/hide, enable/disable the menu or certain item(s) from the
              list
            </li>
            <ol>
              <li>These callbacks are: "itemVisibilityOverride", "itemUsabilityOverride"</li>
              <li>for example if we want to disable the "Help" command over the "Title" and "Completed" column</li>
              <li>for example don't show Help on column "% Complete"</li>
            </ol>
          </ul>
        </div>
      )}
      <button className="btn btn-outline-secondary btn-sm btn-icon me-1" onClick={() => switchLanguage()}>
        <i className="mdi mdi-translate me-1"></i>
        Switch Language
      </button>
      <b>Locale:</b>{' '}
      <span style={{ fontStyle: 'italic' }} data-test="selected-locale">
        {selectedLanguage + '.json'}
      </span>
      <SlickgridReact gridId="grid8" columns={columnDefinitions} options={gridOptions} dataset={dataset} />
    </div>
  );
};

export default withTranslation()(Example8);
