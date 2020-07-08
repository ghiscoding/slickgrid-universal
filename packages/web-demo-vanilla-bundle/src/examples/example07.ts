import {
  Column,
  GridOption,
  Formatters,
  SlickDataView,
  SlickGrid,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';

export class Example7 {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset;
  dataViewObj: SlickDataView;
  gridObj: SlickGrid;
  slickgridLwc;
  slickerGridInstance;

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid7`);
    gridContainerElm.addEventListener('onslickergridcreated', this.handleOnSlickerGridCreated.bind(this));
    this.slickgridLwc = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  dispose() {
    this.slickgridLwc?.dispose();
  }

  initializeGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title' },
      { id: 'duration', name: 'Duration', field: 'duration', sortable: true },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true },
      { id: 'start', name: 'Start', field: 'start' },
      { id: 'finish', name: 'Finish', field: 'finish' },
      { id: 'effort-driven', name: 'Completed', field: 'effortDriven', formatter: Formatters.checkmarkMaterial }
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.demo-container',
        rightPadding: 10
      },
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true
      },
      registerExternalServices: [new ExcelExportService()],
      enableCellNavigation: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
      dataView: {
        syncGridSelection: true, // enable this flag so that the row selection follows the row even if we move it to another position
      },
      enableRowMoveManager: true,
      rowMoveManager: {
        // when using Row Move + Row Selection, you want to enable the following 2 flags so it doesn't cancel row selection
        singleRowMove: true,
        disableRowSelection: true,
        cancelEditOnDrag: true,
        onBeforeMoveRows: (e, args) => this.onBeforeMoveRow(e, args),
        onMoveRows: (e, args) => this.onMoveRows(e, args),

        // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
        // usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
      },
    };
  }

  loadData(rowCount: number) {
    // Set up some test columns.
    const mockDataset = [];
    for (let i = 0; i < rowCount; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 25) + ' days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        effortDriven: (i % 5 === 0)
      };
    }
    return mockDataset;
  }

  onBeforeMoveRow(e, data) {
    for (let i = 0; i < data.rows.length; i++) {
      // no point in moving before or after itself
      if (data.rows[i] === data.insertBefore || data.rows[i] === data.insertBefore - 1) {
        e.stopPropagation();
        return false;
      }
    }
    return true;
  }

  onMoveRows(e, args) {
    const extractedRows = [];
    const rows = args.rows;
    const insertBefore = args.insertBefore;
    const left = this.dataset.slice(0, insertBefore);
    const right = this.dataset.slice(insertBefore, this.dataset.length);
    rows.sort((a, b) => a - b);
    for (let i = 0; i < rows.length; i++) {
      extractedRows.push(this.dataset[rows[i]]);
    }
    rows.reverse();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row < insertBefore) {
        left.splice(row, 1);
      } else {
        right.splice(row - insertBefore, 1);
      }
    }
    this.dataset = left.concat(extractedRows.concat(right));
    const selectedRows = [];
    for (let i = 0; i < rows.length; i++) {
      selectedRows.push(left.length + i);
    }

    this.gridObj.resetActiveCell();
    this.slickgridLwc.dataset = this.dataset; // update dataset and re-render the grid
  }


  handleOnSlickerGridCreated(event) {
    this.slickerGridInstance = event && event.detail;
    this.gridObj = this.slickerGridInstance && this.slickerGridInstance.slickGrid;
    this.dataViewObj = this.slickerGridInstance && this.slickerGridInstance.dataView;
    console.log('handleOnSlickerGridCreated', this.slickerGridInstance);
  }

}
