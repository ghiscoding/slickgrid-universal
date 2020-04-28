import {
  Column,
  GridOption,
  FieldType,
} from '@slickgrid-universal/common';
import { Slicker } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';

export class Example08 {
  columnDefinitions1: Column[];
  columnDefinitions2: Column[];
  gridOptions1: GridOption;
  gridOptions2: GridOption;
  dataset1 = [];
  dataset2 = [];
  slickgridLwc1;
  slickgridLwc2;

  constructor() {
    this.definedGrid1();
    this.definedGrid2();
  }

  attached() {
    // populate the dataset once the grid is ready
    this.dataset1 = this.loadData(500);
    this.dataset2 = this.loadData(500);
    const gridContainerElm1 = document.querySelector(`.grid1`);
    const gridContainerElm2 = document.querySelector(`.grid2`);
    this.slickgridLwc1 = new Slicker.GridBundle(gridContainerElm1, this.columnDefinitions1, { ...ExampleGridOptions, ...this.gridOptions1 }, this.dataset1);
    this.slickgridLwc2 = new Slicker.GridBundle(gridContainerElm2, this.columnDefinitions2, { ...ExampleGridOptions, ...this.gridOptions2 }, this.dataset2);
  }

  definedGrid1() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
      { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
      { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
      { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
      { id: '%', name: '% Complete', field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: FieldType.boolean, columnGroup: 'Analysis' }
    ];

    this.gridOptions1 = {
      enableAutoResize: false,
      gridHeight: 275,
      gridWidth: 800,
      enableCellNavigation: true,
      enableColumnReorder: false,
      enableSorting: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 35,
      explicitInitialization: true,
      colspanCallback: this.renderDifferentColspan
    };
  }

  definedGrid2() {
    this.columnDefinitions2 = [
      { id: 'title', name: 'Title', field: 'title', minWidth: 120, sortable: true, columnGroup: 'Common Factor' },
      { id: 'duration', name: 'Duration', field: 'duration', minWidth: 120, columnGroup: 'Common Factor' },
      { id: 'start', name: 'Start', field: 'start', minWidth: 145, columnGroup: 'Period' },
      { id: 'finish', name: 'Finish', field: 'finish', minWidth: 145, columnGroup: 'Period' },
      { id: '%', name: '% Complete', field: 'percentComplete', minWidth: 145, selectable: false, columnGroup: 'Analysis' },
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
      frozenColumn: 1,
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

  /**
   * A callback to render different row column span
   * Your callback will always have the "item" argument which you can use to decide on the colspan
   * Your return must always be in the form of:: return { columns: {}}
   */
  renderDifferentColspan(item: any) {
    if (item.id % 2 === 1) {
      return {
        columns: {
          duration: {
            colspan: 3 // "duration" will span over 3 columns
          }
        }
      };
    } else {
      return {
        columns: {
          0: {
            colspan: '*' // starting at column index 0, we will span accross all column (*)
          }
        }
      };
    }
  }
}
