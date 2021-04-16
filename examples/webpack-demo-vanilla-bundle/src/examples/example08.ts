import {
  Column,
  GridOption,
  FieldType,
  ItemMetadata,
  OperatorString,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import '../salesforce-styles.scss';
import './example08.scss';

export class Example08 {
  columnDefinitions1: Column[];
  columnDefinitions2: Column[];
  gridOptions1: GridOption;
  gridOptions2: GridOption;
  dataset1 = [];
  dataset2 = [];
  sgb1: SlickVanillaGridBundle;
  sgb2: SlickVanillaGridBundle;
  grid2SearchSelectedColumn: Column;
  grid2SelectedOperator: OperatorString;
  grid2SearchValue: any;
  operatorList: OperatorString[] = ['=', '<', '<=', '>', '>=', '<>', 'StartsWith', 'EndsWith'];

  constructor() {
    this.definedGrid1();
    this.definedGrid2();
  }

  attached() {
    // populate the dataset once the grid is ready
    this.dataset1 = this.loadData(500);
    this.dataset2 = this.loadData(500);
    const gridContainerElm1 = document.querySelector<HTMLDivElement>(`.grid1`);
    const gridContainerElm2 = document.querySelector<HTMLDivElement>(`.grid2`);
    this.sgb1 = new Slicker.GridBundle(gridContainerElm1, this.columnDefinitions1, { ...ExampleGridOptions, ...this.gridOptions1 }, this.dataset1);
    this.sgb2 = new Slicker.GridBundle(gridContainerElm2, this.columnDefinitions2, { ...ExampleGridOptions, ...this.gridOptions2 }, this.dataset2);
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
      { id: '%', name: '% Complete', type: FieldType.number, field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: FieldType.boolean, columnGroup: 'Analysis' }
    ];

    this.gridOptions1 = {
      enableAutoResize: false,
      gridHeight: 275,
      gridWidth: 800,
      enableTextExport: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true
      },
      registerExternalResources: [new TextExportService(), new ExcelExportService()],
      enableCellNavigation: true,
      enableColumnReorder: false,
      enableSorting: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 26,
      rowHeight: 33,
      explicitInitialization: true,
      colspanCallback: this.renderDifferentColspan,
    };
  }

  definedGrid2() {
    this.columnDefinitions2 = [
      { id: 'sel', name: '#', field: 'num', behavior: 'select', cssClass: 'cell-selection', width: 40, resizable: false, selectable: false },
      { id: 'title', name: 'Title', field: 'title', minWidth: 120, sortable: true, columnGroup: 'Common Factor' },
      { id: 'duration', name: 'Duration', field: 'duration', type: FieldType.number, minWidth: 120, columnGroup: 'Common Factor' },
      { id: 'start', name: 'Start', field: 'start', minWidth: 145, columnGroup: 'Period' },
      { id: 'finish', name: 'Finish', field: 'finish', minWidth: 145, columnGroup: 'Period' },
      { id: 'percentComplete', name: '% Complete', field: 'percentComplete', type: FieldType.number, minWidth: 145, selectable: false, columnGroup: 'Analysis' },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', minWidth: 145, type: FieldType.boolean, columnGroup: 'Analysis' }
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
    const mockDataset = [];
    for (let i = 0; i < count; i++) {
      mockDataset[i] = {
        id: i,
        num: i,
        title: 'Task ' + i,
        duration: '5 days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        effortDriven: (i % 5 === 0)
      };
    }
    return mockDataset;
  }

  setFrozenColumns2(frozenCols: number) {
    this.sgb2.slickGrid.setOptions({ frozenColumn: frozenCols, alwaysShowVerticalScroll: false });
    this.gridOptions2 = this.sgb2.slickGrid.getOptions();
  }

  /**
   * A callback to render different row column span
   * Your callback will always have the "item" argument which you can use to decide on the colspan
   * Your return object must always be in the form of:: { columns: { [columnName]: { colspan: number|'*' } }}
   */
  renderDifferentColspan(item: any): ItemMetadata {
    if (item.id % 2 === 1) {
      return {
        columns: {
          duration: {
            colspan: 3 // "duration" will span over 3 columns
          }
        }
      };
    }
    return {
      columns: {
        0: {
          colspan: '*' // starting at column index 0, we will span accross all column (*)
        }
      }
    };
  }

  //
  // -- if any of the Search form input changes, we'll call the updateFilter() method
  //

  cleargrid2SearchInput() {
    const searchInput = document.querySelector<HTMLInputElement>('input.search');
    searchInput.value = '';
    this.grid2SearchValue = '';
    searchInput.focus();
    this.updateFilter();
  }

  populategrid2SearchColumnsDropdown() {
    const columnSelect = document.querySelector('.selected-column');

    for (const columnDef of this.columnDefinitions2) {
      if (columnDef.id === 'sel') {
        continue;
      }
      const selectOption = document.createElement('option');
      selectOption.value = `${columnDef.id}`;
      selectOption.label = columnDef.name;
      columnSelect.appendChild(selectOption);
    }
    this.grid2SearchSelectedColumn = this.columnDefinitions2.find(col => col.id === 'title');
  }

  populategrid2SearchOperatorDropdown() {
    const operatorSelect = document.querySelector('.selected-operator');

    for (const operator of this.operatorList) {
      const selectOption = document.createElement('option');
      selectOption.value = operator;
      selectOption.label = operator;
      operatorSelect.appendChild(selectOption);
    }
    this.grid2SelectedOperator = this.operatorList[0];
  }

  selectedOperatorChanged(newOperator: string) {
    this.grid2SelectedOperator = newOperator as OperatorString;
    this.updateFilter();
  }

  selectedColumnChanged(selectedColumnId: string) {
    this.grid2SearchSelectedColumn = this.columnDefinitions2.find(col => col.id === selectedColumnId);
    this.updateFilter();
  }

  searchValueChanged(newValue: string) {
    this.grid2SearchValue = newValue;
    this.updateFilter();
  }

  updateFilter() {
    this.sgb2.filterService.updateSingleFilter({
      columnId: `${this.grid2SearchSelectedColumn?.id ?? ''}`,
      operator: this.grid2SelectedOperator as OperatorString,
      searchTerms: [this.grid2SearchValue || '']
    });
  }
}
