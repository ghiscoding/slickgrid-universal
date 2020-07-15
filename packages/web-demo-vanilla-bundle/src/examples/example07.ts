import {
  Column,
  Editors,
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
  duplicateTitleHeaderCount = 1;

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
      {
        id: 'title', name: 'Title', field: 'title', editor: { model: Editors.longText, required: true, alwaysSaveOnEnterKey: true, },
      },
      {
        id: 'duration', name: 'Duration', field: 'duration', sortable: true,
        editor: { model: Editors.float, decimal: 2, valueStep: 1, maxValue: 10000, alwaysSaveOnEnterKey: true, },
      },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, editor: { model: Editors.slider, minValue: 0, maxValue: 100, }, },
      { id: 'start', name: 'Start', field: 'start', editor: { model: Editors.date }, },
      { id: 'finish', name: 'Finish', field: 'finish', editor: { model: Editors.date }, },
      { id: 'effort-driven', name: 'Completed', field: 'effortDriven', formatter: Formatters.checkmarkMaterial, editor: { model: Editors.checkbox } }
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.demo-container',
        rightPadding: 10
      },
      autoEdit: true,
      editable: true,
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
      presets: {
        // you can presets row selection here as well, you can choose 1 of the following 2 ways of setting the selection
        // by their index position in the grid (UI) or by the object IDs, the default is "dataContextIds" and if provided it will use it and disregard "gridRowIndexes"
        // the RECOMMENDED is to use "dataContextIds" since that will always work even with Pagination, while "gridRowIndexes" is only good for 1 page
        rowSelection: {
          // gridRowIndexes: [2],       // the row position of what you see on the screen (UI)
          dataContextIds: [2, 3, 6, 7]  // (recommended) select by your data object IDs
        }
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

  dynamicallyAddTitleHeader() {
    const newCol = {
      id: `title${this.duplicateTitleHeaderCount++}`,
      name: 'Title',
      field: 'title',
      editor: {
        model: Editors.text,
        required: true,
        // validator: myCustomTitleValidator, // use a custom validator
      },
      sortable: true, minWidth: 100, filterable: true, params: { useFormatterOuputToFilter: true }
    };

    // you can dynamically add your column to your column definitions
    // and then use the spread operator [...cols] OR slice to force the framework to review the changes
    this.columnDefinitions.push(newCol);
    this.slickgridLwc.columnDefinitions = this.columnDefinitions.slice(); // or use spread operator [...cols]

    // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
    // you MUST use "getAllColumnDefinitions()" from the GridService, using this will be ALL columns including the 1st column that is created internally
    // for example if you use the Checkbox Selector (row selection), you MUST use the code below
    /*
    const allColumns = this.slickerGridInstance.gridService.getAllColumnDefinitions();
    allColumns.push(newCol);
    this.slickgridLwc.columnDefinitions = [...allColumns]; // (or use slice) reassign to column definitions for framework to do dirty checking
    */
  }

  dynamicallyRemoveLastColumn() {
    this.columnDefinitions.pop();
    this.slickgridLwc.columnDefinitions = this.columnDefinitions.slice();

    // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
    // you MUST use the code below, first you must reassign the Editor facade (from the internalColumnEditor back to the editor)
    // in other words, SlickGrid is not using the same as Slickgrid-Universal uses (editor with a "model" and other properties are a facade, SlickGrid only uses what is inside the model)
    /*
    const allColumns = this.slickerGridInstance.gridService.getAllColumnDefinitions();
    const allOriginalColumns = allColumns.map((column) => {
      column.editor = column.internalColumnEditor;
      return column;
    });
    // remove your column the full set of columns
    // and use slice or spread [...] to trigger a dirty change
    allOriginalColumns.pop();
    this.columnDefinitions = allOriginalColumns.slice();
    */
  }
}
