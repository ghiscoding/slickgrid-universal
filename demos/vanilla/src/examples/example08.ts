import { type Column, type GridOption, type ItemMetadata, type OperatorType } from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example08.scss';

export default class Example08 {
  columnDefinitions1: Column[];
  columnDefinitions2: Column[];
  gridOptions1: GridOption;
  gridOptions2: GridOption;
  dataset1: any[] = [];
  dataset2: any[] = [];
  sgb1: SlickVanillaGridBundle;
  sgb2: SlickVanillaGridBundle;
  grid2SearchSelectedColumn: Column;
  grid2SelectedOperator: OperatorType;
  grid2SearchValue: any;
  operatorList: OperatorType[] = ['=', '<', '<=', '>', '>=', '<>', 'StartsWith', 'EndsWith'];
  isColspanSpreading = false;

  constructor() {
    this.definedGrid1();
    this.definedGrid2();
  }

  attached() {
    // populate the dataset once the grid is ready
    this.dataset1 = this.loadData(500);
    this.dataset2 = this.loadData(500);
    const gridContainerElm1 = document.querySelector(`.grid1`) as HTMLDivElement;
    const gridContainerElm2 = document.querySelector(`.grid2`) as HTMLDivElement;
    this.sgb1 = new Slicker.GridBundle(
      gridContainerElm1,
      this.columnDefinitions1,
      { ...ExampleGridOptions, ...this.gridOptions1 },
      this.dataset1
    );
    this.sgb2 = new Slicker.GridBundle(
      gridContainerElm2,
      this.columnDefinitions2,
      { ...ExampleGridOptions, ...this.gridOptions2 },
      this.dataset2
    );
    this.populategrid2SearchColumnsDropdown();
    this.populategrid2SearchOperatorDropdown();
  }

  dispose() {
    this.sgb1?.dispose();
    this.sgb2?.dispose();
  }

  definedGrid1() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
      { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
      { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
      { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
      {
        id: '%',
        name: '% Complete',
        type: 'number',
        field: 'percentComplete',
        selectable: false,
        columnGroup: 'Analysis',
      },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: 'boolean', columnGroup: 'Analysis' },
    ];

    this.gridOptions1 = {
      enableAutoResize: false,
      gridHeight: 275,
      gridWidth: 800,
      enableTextExport: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true,
      },
      gridMenu: {
        iconButtonContainer: 'preheader', // we can display the grid menu icon in either the preheader or in the column header (default)
      },
      externalResources: [new TextExportService(), new ExcelExportService()],
      enableCellNavigation: true,
      enableColumnReorder: false,
      enableSorting: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 26,
      rowHeight: 33,
      explicitInitialization: true,
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (item: any, row: number) => this.renderDifferentColspan(item, row),
        },
      },
      spreadHiddenColspan: this.isColspanSpreading,
    };
  }

  definedGrid2() {
    this.columnDefinitions2 = [
      {
        id: 'sel',
        name: '#',
        field: 'num',
        behavior: 'select',
        cssClass: 'cell-selection',
        width: 40,
        resizable: false,
        selectable: false,
      },
      { id: 'title', name: 'Title', field: 'title', minWidth: 120, sortable: true, columnGroup: 'Common Factor' },
      {
        id: 'duration',
        name: 'Duration',
        field: 'duration',
        type: 'number',
        minWidth: 120,
        columnGroup: 'Common Factor',
      },
      { id: 'start', name: 'Start', field: 'start', minWidth: 145, columnGroup: 'Period' },
      { id: 'finish', name: 'Finish', field: 'finish', minWidth: 145, columnGroup: 'Period' },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        type: 'number',
        minWidth: 145,
        selectable: false,
        columnGroup: 'Analysis',
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        minWidth: 145,
        type: 'boolean',
        columnGroup: 'Analysis',
      },
    ];

    this.gridOptions2 = {
      gridHeight: 275,
      gridWidth: 800,
      alwaysShowVerticalScroll: false, // disable scroll since we don't want it to show on the left pinned columns
      enableCellNavigation: true,
      enableColumnReorder: false,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 35,
      explicitInitialization: true,
      frozenColumn: 2,
      rowHeight: 33,
      showCustomFooter: true,
      gridMenu: { hideClearFrozenColumnsCommand: false },
      headerMenu: { hideFreezeColumnsCommand: false },

      // enable the filtering but hide the user filter row since we use our own single filter
      enableFiltering: true,
      showHeaderRow: false, // hide the filter row (header row)
    };
  }

  loadData(count: number) {
    // Set up some test columns.
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      mockDataset[i] = {
        id: i,
        num: i,
        title: 'Task ' + i,
        duration: '5 days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        effortDriven: i % 5 === 0,
      };
    }
    return mockDataset;
  }

  setFrozenColumns2(frozenCols: number) {
    this.sgb2.slickGrid?.setOptions({ frozenColumn: frozenCols, alwaysShowVerticalScroll: false });
    this.gridOptions2 = this.sgb2.slickGrid!.getOptions();
  }

  /**
   * A callback to render different row column span
   * Your callback will always have the "item" argument which you can use to decide on the colspan
   * Your return object must always be in the form of:: { columns: { [columnName]: { colspan: number|'*' } }}
   */
  renderDifferentColspan(item: any, row: number): ItemMetadata {
    if (item.id % 2 === 1 || row % 2 === 1) {
      return {
        columns: {
          duration: {
            colspan: 3, // "duration" will span over 3 columns
          },
        },
      };
    }
    return {
      columns: {
        0: {
          colspan: '*', // starting at column index 0, we will span accross all column (*)
        },
      },
    };
  }

  //
  // -- if any of the Search form input changes, we'll call the updateFilter() method
  //

  cleargrid2SearchInput() {
    const searchInput = document.querySelector('input.search') as HTMLInputElement;
    searchInput.value = '';
    this.grid2SearchValue = '';
    searchInput.focus();
    this.updateFilter();
  }

  populategrid2SearchColumnsDropdown() {
    const columnSelect = document.querySelector('.selected-column') as HTMLElement;

    for (const columnDef of this.columnDefinitions2) {
      if (columnDef.id === 'sel') {
        continue;
      }
      const selectOption = document.createElement('option') as HTMLOptionElement;
      selectOption.value = `${columnDef.id}`;
      selectOption.label = columnDef.name as string;
      columnSelect.appendChild(selectOption);
    }
    this.grid2SearchSelectedColumn = this.columnDefinitions2.find((col) => col.id === 'title') as Column;
  }

  populategrid2SearchOperatorDropdown() {
    const operatorSelect = document.querySelector('.selected-operator') as HTMLOptionElement;

    for (const operator of this.operatorList) {
      const selectOption = document.createElement('option') as HTMLOptionElement;
      selectOption.value = operator;
      selectOption.label = operator;
      operatorSelect.appendChild(selectOption);
    }
    this.grid2SelectedOperator = this.operatorList[0];
  }

  selectedOperatorChanged(newOperator: string) {
    this.grid2SelectedOperator = newOperator as OperatorType;
    this.updateFilter();
  }

  selectedColumnChanged(selectedColumnId: string) {
    this.grid2SearchSelectedColumn = this.columnDefinitions2.find((col) => col.id === selectedColumnId) as Column;
    this.updateFilter();
  }

  searchValueChanged(newValue: string) {
    this.grid2SearchValue = newValue;
    this.updateFilter();
  }

  spreadColspan() {
    this.isColspanSpreading = !this.isColspanSpreading;
    this.sgb1.slickGrid?.setOptions({ spreadHiddenColspan: this.isColspanSpreading });
    this.sgb1.slickGrid?.resetActiveCell();
    this.sgb1.slickGrid?.invalidate();
  }

  updateFilter() {
    this.sgb2.filterService.updateSingleFilter({
      columnId: `${this.grid2SearchSelectedColumn?.id ?? ''}`,
      operator: this.grid2SelectedOperator as OperatorType,
      searchTerms: [this.grid2SearchValue || ''],
    });
  }
}
