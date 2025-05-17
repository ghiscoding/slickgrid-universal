import { I18N } from '@aurelia/i18n';
import { type AureliaGridInstance, type Column, Formatters, type GridOption } from 'aurelia-slickgrid';
import './example8.scss'; // provide custom CSS/SASS styling
import { resolve } from 'aurelia';

export class Example8 {
  aureliaGrid!: AureliaGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];
  hideSubTitle = false;
  selectedLanguage: string;
  visibleColumns: Column[] = [];

  constructor(private readonly i18n: I18N = resolve(I18N)) {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // always start with English for Cypress E2E tests to be consistent
    const defaultLang = 'en';
    this.i18n.setLocale(defaultLang);
    this.selectedLanguage = defaultLang;
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  attached() {
    // populate the dataset once the grid is ready
    this.getData();
  }

  defineGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', nameKey: 'TITLE' },
      { id: 'duration', name: 'Duration', field: 'duration', nameKey: 'DURATION', sortable: true },
      { id: 'percentComplete', name: '% Complete', field: 'percentComplete', nameKey: 'PERCENT_COMPLETE', sortable: true },
      { id: 'start', name: 'Start', field: 'start', nameKey: 'START' },
      { id: 'finish', name: 'Finish', field: 'finish', nameKey: 'FINISH' },
      { id: 'completed', name: 'Completed', field: 'completed', nameKey: 'COMPLETED', formatter: Formatters.checkmarkMaterial },
    ];

    this.columnDefinitions.forEach((columnDef) => {
      columnDef.header = {
        menu: {
          commandItems: [
            // add Custom Header Menu Item Commands which will be appended to the existing internal custom items
            // you cannot override an internal command but you can hide them and create your own
            // also note that the internal custom commands are in the positionOrder range of 50-60,
            // if you want yours at the bottom then start with 61, below 50 will make your command(s) show on top
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
              positionOrder: 99,
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
            // you can also add divider between commands (command is a required property but you can set it to empty string)
            { divider: true, command: '', positionOrder: 98 },

            // you can use "divider" as a string too, but if you do then make sure it's the correct position in the list
            // (since there's no positionOrder when using 'divider')
            // 'divider',
            {
              // we can also have multiple nested sub-menus
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

    this.gridOptions = {
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
      i18n: this.i18n,
    };
  }

  getData() {
    // Set up some test columns.
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
    this.dataset = mockDataset;
  }

  async switchLanguage() {
    const nextLanguage = this.selectedLanguage === 'en' ? 'fr' : 'en';
    await this.i18n.setLocale(nextLanguage);
    this.selectedLanguage = nextLanguage;
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
