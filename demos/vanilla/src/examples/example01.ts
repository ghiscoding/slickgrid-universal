import { ExtensionName, Formatters, type Column, type GridOption } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import { zeroPadding } from './utilities.js';
// import '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-salesforce.scss?inline';
// import cssCode from '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-salesforce.scss?url';

// use any of the Styling Theme
// import '../material-styles.scss';
import './example01.scss';

const NB_ITEMS = 995;

export default class Example01 {
  private _darkModeGrid1 = false;
  gridOptions1!: GridOption;
  gridOptions2!: GridOption;
  columnDefinitions1!: Column[];
  columnDefinitions2!: Column[];
  dataset1!: any[];
  dataset2!: any[];
  sgb1!: SlickVanillaGridBundle;
  sgb2!: SlickVanillaGridBundle;
  isGrid2WithPagination = true;

  attached() {
    // override CSS template to be Material Design
    // await import('@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-salesforce.scss');

    this.defineGrids();

    // mock some data (different in each dataset)
    this.dataset1 = this.mockData(NB_ITEMS);
    this.dataset2 = this.mockData(NB_ITEMS);

    this.sgb1 = new Slicker.GridBundle(
      document.querySelector(`.grid1`) as HTMLDivElement,
      this.columnDefinitions1,
      { ...ExampleGridOptions, ...this.gridOptions1 },
      this.dataset1
    );
    this.sgb2 = new Slicker.GridBundle(document.querySelector(`.grid2`) as HTMLDivElement, this.columnDefinitions2, {
      ...ExampleGridOptions,
      ...this.gridOptions2,
    });

    // load 2nd dataset in a delay to make sure Pagination work as expected (which was previously a bug)
    setTimeout(() => (this.sgb2.dataset = this.dataset2), 0);
  }

  dispose() {
    this.sgb1?.dispose();
    this.sgb2?.dispose();
  }

  isBrowserDarkModeEnabled() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100, filterable: true },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        minWidth: 100,
        filterable: true,
        type: 'number',
      },
      {
        id: '%',
        name: '% Complete',
        field: 'percentComplete',
        sortable: true,
        minWidth: 100,
        filterable: true,
        type: 'number',
      },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, exportWithFormatter: true, filterable: true },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        filterable: true,
      },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100, filterable: true },
    ];
    this._darkModeGrid1 = this.isBrowserDarkModeEnabled();
    this.gridOptions1 = {
      enableAutoResize: false,
      darkMode: this._darkModeGrid1,
      gridHeight: 225,
      gridWidth: 800,
      rowHeight: 33,
      gridMenu: {
        hideToggleDarkModeCommand: false, // disabled command by default
        onCommand: (_, args) => {
          if (args.command === 'toggle-dark-mode') {
            this._darkModeGrid1 = !this._darkModeGrid1; // keep local toggle var in sync
          }
        },
      },
    };

    // copy the same Grid Options and Column Definitions to 2nd grid
    // but also add Pagination in this grid
    this.columnDefinitions2 = this.columnDefinitions1;
    this.gridOptions2 = {
      ...this.gridOptions1,
      ...{
        darkMode: false,
        gridHeight: 255,
        headerRowHeight: 40,
        columnPicker: {
          onColumnsChanged: (_e, args) => console.log('onColumnPickerColumnsChanged - visible columns count', args.visibleColumns.length),
        },
        gridMenu: {
          subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
          commandItems: [
            { command: '', divider: true, positionOrder: 98 },
            {
              // we can also have multiple nested sub-menus
              command: 'export',
              title: 'Exports',
              iconCssClass: 'mdi mdi-download',
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
              iconCssClass: 'mdi mdi-information-outline',
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
          // menuUsabilityOverride: () => false,
          onBeforeMenuShow: () => {
            console.log('onGridMenuBeforeMenuShow');
            // return false; // returning false would prevent the grid menu from opening
          },
          onAfterMenuShow: () => console.log('onGridMenuAfterMenuShow'),
          onColumnsChanged: (_e, args) => console.log('onGridMenuColumnsChanged', args),
          onCommand: (_e, args) => {
            // e.preventDefault(); // preventing default event would keep the menu open after the execution
            const command = args.item?.command;
            if (command.includes('exports-')) {
              alert('Exporting as ' + args?.item.title);
            } else if (command.includes('contact-')) {
              alert('Command: ' + args?.command);
            } else {
              console.log('onGridMenuCommand', args.command);
            }
          },
          onMenuClose: (_e, args) => console.log('onGridMenuMenuClose - visible columns count', args.visibleColumns.length),
        },
        enableFiltering: true,
        enablePagination: true,
        pagination: {
          pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
          pageSize: 5,
        },
        presets: {
          pagination: {
            pageNumber: 2,
            pageSize: 5,
          },
          sorters: [
            // { columnId: '%', direction: 'DESC' },
            { columnId: 'title', direction: 'ASC' },
          ],
          filters: [{ columnId: 'title', searchTerms: ['2'] }],
        },
      },
    };
  }

  // use new data on 2nd grid
  changeDataset2() {
    document.querySelector('.icon-data2')?.classList.add('mdi-spin', 'mdi-vanish');
    setTimeout(() => {
      this.sgb2.dataset = this.mockData(NB_ITEMS + 55);
      document.querySelector('.icon-data2')?.classList.remove('mdi-spin', 'mdi-vanish');
    }, 750);
  }

  mockData(count: number) {
    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: `${zeroPadding(randomYear)}-${zeroPadding(randomMonth + 1)}-${zeroPadding(randomDay)}`,
        finish: `${zeroPadding(randomYear + 1)}-${zeroPadding(randomMonth + 1)}-${zeroPadding(randomDay)}`,
        effortDriven: i % 5 === 0,
      };
    }

    return mockDataset;
  }

  toggleDarkModeGrid1() {
    this._darkModeGrid1 = !this._darkModeGrid1;
    if (this._darkModeGrid1) {
      document.querySelector('.grid1')?.classList.add('dark-mode');
    } else {
      document.querySelector('.grid1')?.classList.remove('dark-mode');
    }
    this.sgb1.slickGrid?.setOptions({ darkMode: this._darkModeGrid1 });
  }

  // Toggle the Pagination of Grid2
  // IMPORTANT, the Pagination MUST BE CREATED on initial page load before you can start toggling it
  // Basically you cannot toggle a Pagination that doesn't exist (must created at the time as the grid)
  togglePaginationGrid2() {
    this.isGrid2WithPagination = !this.isGrid2WithPagination;
    this.sgb2.paginationService!.togglePaginationVisibility(this.isGrid2WithPagination);
  }

  toggleGridMenu(e: MouseEvent) {
    if (this.sgb2?.extensionService) {
      const gridMenuInstance = this.sgb2.extensionService.getExtensionInstanceByName(ExtensionName.gridMenu);
      // open the external button Grid Menu, you can also optionally pass Grid Menu options as 2nd argument
      // for example we want to align our external button on the right without affecting the menu within the grid which will stay aligned on the left
      gridMenuInstance.showGridMenu(e, { dropSide: 'right' });
    }
  }
}
