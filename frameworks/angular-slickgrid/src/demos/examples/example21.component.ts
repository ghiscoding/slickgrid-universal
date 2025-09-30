import { NgFor } from '@angular/common';
import { Component, type OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  type AngularGridInstance,
  AngularSlickgridModule,
  type Column,
  Formatters,
  type GridOption,
  type OperatorString,
  type SlickDataView,
  type SlickGrid,
} from '../../library';

@Component({
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./example21.component.scss'],
  templateUrl: './example21.component.html',
  imports: [FormsModule, NgFor, AngularSlickgridModule],
})
export class Example21Component implements OnInit {
  angularGrid!: AngularGridInstance;
  grid!: SlickGrid;
  dataView!: SlickDataView;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset!: any[];
  hideSubTitle = false;
  operatorList: OperatorString[] = ['=', '<', '<=', '>', '>=', '<>', 'StartsWith', 'EndsWith'];
  selectedOperator = '=';
  searchValue = '';
  selectedColumn?: Column;

  ngOnInit() {
    this.prepareGrid();
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
  }

  prepareGrid() {
    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        type: 'number',
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        formatter: Formatters.percentCompleteBar,
        sortable: true,
        type: 'number',
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
        sortable: true,
        type: 'number',
      },
    ];
    this.selectedColumn = this.columnDefinitions[0];

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

    // mock a dataset
    const mockedDataset = [];
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

  updateFilter() {
    this.angularGrid.filterService.updateSingleFilter({
      columnId: `${this.selectedColumn!.id || ''}`,
      operator: this.selectedOperator as OperatorString,
      searchTerms: [this.searchValue || ''],
    });
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.angularGrid.resizerService.resizeGrid(0);
  }
}
