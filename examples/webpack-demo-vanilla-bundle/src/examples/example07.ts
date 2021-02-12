import {
  BindingEventService,
  Column,
  Editors,
  FieldType,
  Filters,
  Formatters,
  GridOption,
  OperatorType,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';

export class Example7 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  sgb: SlickVanillaGridBundle;
  duplicateTitleHeaderCount = 1;

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid7`);
    this._bindingEventService.bind(gridContainerElm, 'oncellchange', this.handleOnCellChange.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onvalidationerror', this.handleValidationError.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', filterable: true, editor: { model: Editors.longText, required: true, alwaysSaveOnEnterKey: true },
      },
      {
        id: 'duration', name: 'Duration', field: 'duration', sortable: true, filterable: true,
        type: 'number', editor: { model: Editors.text, alwaysSaveOnEnterKey: true, },
        formatter: (_row: number, _cell: number, value: any) => value > 1 ? `${value} days` : `${value} day`,
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete', type: 'number',
        filterable: true, sortable: true, editor: { model: Editors.slider, minValue: 0, maxValue: 100, },
      },
      {
        id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso,
        filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
        editor: { model: Editors.date }, type: FieldType.date,/* outputType: FieldType.dateUs, */ saveOutputType: FieldType.dateUtc,
      },
      {
        id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso,
        filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
        editor: { model: Editors.date }, type: FieldType.dateIso, saveOutputType: FieldType.dateUtc,
      },
      {
        id: 'effort-driven', name: 'Completed', field: 'effortDriven', formatter: Formatters.checkmarkMaterial,
        filterable: true, sortable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect
        },
        editor: {
          model: Editors.singleSelect,

          // pass a regular collection array with value/label pairs
          // collection: [{ value: true, label: 'True' }, { value: false, label: 'False' }],

          // Select Editor can also support collection that are async, it could be a Promise (shown below) or Fetch result
          collectionAsync: new Promise<any>(resolve => setTimeout(() => {
            resolve([{ value: true, label: 'True' }, { value: false, label: 'False' }]);
          }, 250)),
        },
      },
      {
        id: 'prerequisites',
        name: 'Prerequisites',
        field: 'prerequisites',
        filterable: true,
        formatter: (_row, _cell, value) => {
          if (value && Array.isArray(value)) {
            const values = value.map((val) => `Task ${val}`).join(', ');
            return `<span title="${values}">${values}</span>`;
          }
          return '';
        },
        exportWithFormatter: true,
        sanitizeDataExport: true,
        minWidth: 100,
        sortable: true,
        type: FieldType.string,
        editor: {
          // We can load the "collection" asynchronously (on first load only, after that we will simply use "collection")
          // 2 ways are supported (aurelia-http-client, aurelia-fetch-client OR even Promise)

          // OR 1- use "aurelia-fetch-client", they are both supported
          // collectionAsync: fetch(URL_SAMPLE_COLLECTION_DATA),

          // OR 2- use a Promise
          collectionAsync: new Promise<any>((resolve) => {
            setTimeout(() => {
              resolve(Array.from(Array(this.dataset.length).keys()).map(k => ({ value: k, label: k, prefix: 'Task', suffix: 'days' })));
            }, 500);
          }),

          // OR a regular "collection" load
          // collection: Array.from(Array(NB_ITEMS).keys()).map(k => ({ value: k, label: k, prefix: 'Task', suffix: 'days' })),
          collectionSortBy: {
            property: 'value',
            sortDesc: true,
            fieldType: FieldType.number
          },
          customStructure: {
            label: 'label',
            value: 'value',
            labelPrefix: 'prefix',
          },
          collectionOptions: {
            separatorBetweenTextLabels: ' '
          },
          model: Editors.multipleSelect,
        },
        filter: {
          // collectionAsync: fetch(URL_SAMPLE_COLLECTION_DATA),
          collectionAsync: new Promise((resolve) => {
            setTimeout(() => {
              resolve(Array.from(Array(this.dataset.length).keys()).map(k => ({ value: k, label: `Task ${k}` })));
            });
          }),

          // OR a regular collection load
          // collection: Array.from(Array(NB_ITEMS).keys()).map(k => ({ value: k, label: k, prefix: 'Task', suffix: 'days' })),
          collectionSortBy: {
            property: 'value',
            sortDesc: true,
            fieldType: FieldType.number
          },
          customStructure: {
            label: 'label',
            value: 'value',
            labelPrefix: 'prefix',
          },
          collectionOptions: {
            separatorBetweenTextLabels: ' '
          },
          model: Filters.multipleSelect,
          operator: OperatorType.inContains,
        },
      }
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.demo-container',
        rightPadding: 10
      },
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true
      },
      enableFiltering: true,
      registerExternalResources: [new ExcelExportService()],
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
        onBeforeMoveRows: this.onBeforeMoveRow,
        onMoveRows: this.onMoveRows.bind(this),

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

  /** Add a new row to the grid and refresh the Filter collection */
  addItem() {
    const lastRowIndex = this.dataset.length;
    const newRows = this.loadData(1, lastRowIndex);

    // wrap into a timer to simulate a backend async call
    setTimeout(() => {
      // at any time, we can poke the "collection" property and modify it
      const requisiteColumnDef = this.columnDefinitions.find((column: Column) => column.id === 'prerequisites');
      if (requisiteColumnDef) {
        const collectionEditor = requisiteColumnDef.editor.collection;
        const collectionFilter = requisiteColumnDef.filter.collection;

        if (Array.isArray(collectionEditor) && Array.isArray(collectionFilter)) {
          // add the new row to the grid
          this.sgb.gridService.addItem(newRows[0], { highlightRow: false });

          // then refresh the Editor/Filter "collection", we have 2 ways of doing it

          // 1- push to the "collection"
          collectionEditor.push({ value: lastRowIndex, label: lastRowIndex, prefix: 'Task', suffix: 'days' });
          collectionFilter.push({ value: lastRowIndex, label: lastRowIndex, prefix: 'Task', suffix: 'days' });

          // OR 2- replace the entire "collection" is also supported
          // requisiteColumnDef.filter.collection = [...requisiteColumnDef.filter.collection, ...[{ value: lastRowIndex, label: lastRowIndex, prefix: 'Task' }]];
          // requisiteColumnDef.editor.collection = [...requisiteColumnDef.editor.collection, ...[{ value: lastRowIndex, label: lastRowIndex, prefix: 'Task' }]];
        }
      }
    }, 50);
  }

  /** Delete last inserted row */
  deleteItem() {
    const requisiteColumnDef = this.columnDefinitions.find((column: Column) => column.id === 'prerequisites');
    if (requisiteColumnDef) {
      const collectionEditor = requisiteColumnDef.editor.collection;
      const collectionFilter = requisiteColumnDef.filter.collection;

      if (Array.isArray(collectionEditor) && Array.isArray(collectionFilter)) {
        // sort collection in descending order and take out last option from the collection
        const selectCollectionObj = this.sortCollectionDescending(collectionEditor).pop();
        this.sortCollectionDescending(collectionFilter).pop();
        this.sgb.gridService.deleteItemById(selectCollectionObj.value);
      }
    }
  }

  loadData(itemCount: number, startingIndex = 0) {
    // Set up some test columns.
    const tempDataset = [];
    for (let i = startingIndex; i < (startingIndex + itemCount); i++) {
      tempDataset.push({
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 25),
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(2009, 0, 1),
        finish: new Date(2009, 0, 5),
        effortDriven: (i % 5 === 0),
        prerequisites: (i % 2 === 0) && i !== 0 && i < 12 ? [i, i - 1] : [],
      });
    }
    return tempDataset;
  }

  sortCollectionDescending(collection) {
    return collection.sort((item1, item2) => item1.value - item2.value);
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

  onMoveRows(_e, args) {
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

    args.grid.resetActiveCell();
    this.sgb.dataset = this.dataset; // update dataset and re-render the grid
  }

  handleOnCellChange(event) {
    console.log('onCellChanged', event.detail, event.detail.args.item.start);
  }

  handleValidationError(event) {
    console.log('handleValidationError', event.detail);
    const args = event.detail && event.detail.args;
    if (args.validationResults) {
      alert(args.validationResults.msg);
    }
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
      sortable: true, minWidth: 100, filterable: true,
    };

    // you can dynamically add your column to your column definitions
    // and then use the spread operator [...cols] OR slice to force the framework to review the changes
    this.sgb.columnDefinitions.push(newCol);
    this.sgb.columnDefinitions = this.sgb.columnDefinitions.slice(); // or use spread operator [...cols]

    // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
    // you MUST use "getAllColumnDefinitions()" from the GridService, using this will be ALL columns including the 1st column that is created internally
    // for example if you use the Checkbox Selector (row selection), you MUST use the code below
    /*
      const allColumns = this.sgb.gridService.getAllColumnDefinitions();
      allColumns.push(newCol);
      this.sgb.columnDefinitions = [...allColumns]; // (or use slice) reassign to column definitions for framework to do dirty checking
    */
  }

  dynamicallyRemoveLastColumn() {
    this.sgb.columnDefinitions.pop();
    this.sgb.columnDefinitions = this.sgb.columnDefinitions.slice();

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
    this.sgb.columnDefinitions = allOriginalColumns.slice();
    */
  }

  hideDurationColumnDynamically() {
    // -- you can hide by one Id or multiple Ids:
    // hideColumnById(id, options), hideColumnByIds([ids], options)
    // you can also provide options, defaults are: { autoResizeColumns: true, triggerEvent: true, hideFromColumnPicker: false, hideFromGridMenu: false }

    this.sgb.gridService.hideColumnById('duration');

    // or with multiple Ids and extra options
    // this.sgb.gridService.hideColumnByIds(['duration', 'finish'], { autoResizeColumns: false, hideFromColumnPicker: true, hideFromGridMenu: false });
  }

  // Disable/Enable Filtering/Sorting functionalities
  // --------------------------------------------------

  disableFilters() {
    this.sgb.filterService.disableFilterFunctionality(true);
  }

  disableSorting() {
    this.sgb.sortService.disableSortFunctionality(true);
  }

  // or Toggle Filtering/Sorting functionalities
  // ---------------------------------------------

  toggleFilter() {
    this.sgb.filterService.toggleFilterFunctionality();
  }

  toggleSorting() {
    this.sgb.sortService.toggleSortFunctionality();
  }
}
