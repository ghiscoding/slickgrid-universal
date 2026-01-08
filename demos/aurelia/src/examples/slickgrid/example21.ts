import { bindable } from 'aurelia';
import { Formatters, type AureliaGridInstance, type Column, type GridOption, type OperatorType } from 'aurelia-slickgrid';
import './example21.scss';

export class Example21 {
  @bindable() selectedColumn!: Column;
  @bindable() selectedOperator!: string;
  @bindable() searchValue = '';
  aureliaGrid!: AureliaGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];
  hideSubTitle = false;
  operatorList: OperatorType[] = ['=', '<', '<=', '>', '>=', '<>', 'StartsWith', 'EndsWith'];

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  attached() {
    // populate the dataset once the grid is ready
    this.getData();
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        width: 100,
        sortable: true,
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        width: 100,
        sortable: true,
        type: 'number',
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        width: 100,
        sortable: true,
        formatter: Formatters.percentCompleteBar,
        type: 'number',
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        width: 100,
        sortable: true,
        formatter: Formatters.dateIso,

        type: 'date',
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        width: 100,
        sortable: true,
        formatter: Formatters.dateIso,
        type: 'date',
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        width: 100,
        sortable: true,
        formatter: Formatters.checkmarkMaterial,
        type: 'number',
      },
    ];

    this.gridOptions = {
      // if you want to disable autoResize and use a fixed width which requires horizontal scrolling
      // it's advised to disable the autoFitColumnsOnFirstLoad as well
      // enableAutoResize: false,
      // autoFitColumnsOnFirstLoad: false,

      autoHeight: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },

      // enable the filtering but hide the user filter row since we use our own single filter
      enableFiltering: true,
      showHeaderRow: false, // hide the filter row (header row)

      alwaysShowVerticalScroll: false,
      enableColumnPicker: true,
      enableCellNavigation: true,
      enableRowSelection: true,
    };
  }

  getData() {
    // mock a dataset
    const mockedDataset: any[] = [];
    for (let i = 0; i < 25; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockedDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }
    this.dataset = mockedDataset;
  }

  //
  // -- if any of the Search form input changes, we'll call the updateFilter() method
  //

  clearGridSearchInput() {
    this.searchValue = '';
    this.updateFilter();
  }

  selectedOperatorChanged() {
    this.updateFilter();
  }

  selectedColumnChanged() {
    this.updateFilter();
  }

  searchValueChanged() {
    this.updateFilter();
  }

  updateFilter() {
    this.aureliaGrid?.filterService.updateSingleFilter({
      columnId: `${this.selectedColumn.id || ''}`,
      operator: this.selectedOperator as OperatorType,
      searchTerms: [this.searchValue || ''],
    });
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
