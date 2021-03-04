import {
  AutocompleteOption,
  BindingEventService,
  Column,
  Editors,
  EventNamingStyle,
  FieldType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  LongTextEditorOption,
  SlickNamespace,
  SortComparers,

  // utilities
  formatNumber,
  // @ts-ignore
  getVarTypeOfByColumnFieldType,
  exportWithFormatterWhenDefined,
  sanitizeHtmlToText,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, SlickerGridInstance, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import '../salesforce-styles.scss';
import './example14.scss';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator = (value) => {
  if ((value === null || value === undefined || !value.length)) {
    // we will only check if the field is supplied when it's an inline editing
    return { valid: false, msg: 'This is a required field.' };
  } else if (!/^(task\s\d+)*$/i.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number.' };
  }
  return { valid: true, msg: '' };
};

/**
 * Check if the current item (cell) is editable or not
 * @param {*} dataContext - item data context object
 * @param {*} columnDef - column definition
 * @param {*} grid - slickgrid grid object
 * @returns {boolean} isEditable
 */
function checkItemIsEditable(dataContext, columnDef, grid) {
  const gridOptions = grid && grid.getOptions && grid.getOptions();
  const hasEditor = columnDef.editor;
  const isGridEditable = gridOptions.editable;
  let isEditable = (isGridEditable && hasEditor);

  if (dataContext && columnDef && gridOptions && gridOptions.editable) {
    switch (columnDef.id) {
      case 'finish':
        // case 'percentComplete':
        isEditable = !!dataContext?.completed;
        break;
      // case 'completed':
      // case 'duration':
      // case 'title':
      // case 'product':
      // case 'origin':
      // isEditable = dataContext.percentComplete < 50;
      // break;
    }
  }
  return isEditable;
}

const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef, dataContext, grid) => {
  const isEditableLine = checkItemIsEditable(dataContext, columnDef, grid);
  value = (value === null || value === undefined) ? '' : value;
  return isEditableLine ? `<div class="editing-field">${value}</div>` : value;
};

export class Example14 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[] = [];
  isGridEditable = true;
  editQueue = [];
  editedItems = {};
  sgb1: SlickVanillaGridBundle;
  sgb2: SlickVanillaGridBundle;
  gridContainerElm1: HTMLDivElement;
  gridContainerElm2: HTMLDivElement;
  complexityLevelList = [
    { value: 0, label: 'Very Simple' },
    { value: 1, label: 'Simple' },
    { value: 2, label: 'Straightforward' },
    { value: 3, label: 'Complex' },
    { value: 4, label: 'Very Complex' },
  ];

  get slickerGridInstance(): SlickerGridInstance {
    return this.sgb1?.instances;
  }

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(50000);
    this.gridContainerElm1 = document.querySelector<HTMLDivElement>(`.grid1`);
    this.gridContainerElm2 = document.querySelector<HTMLDivElement>(`.grid2`);

    this.sgb1 = new Slicker.GridBundle(this.gridContainerElm1, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    this.sgb2 = new Slicker.GridBundle(this.gridContainerElm2, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    // this.sgb.slickGrid.setActiveCell(0, 0);

    // bind any of the grid events
    // this._bindingEventService.bind(this.gridContainerElm1, 'onvalidationerror', this.handleValidationError.bind(this));
    // this._bindingEventService.bind(this.gridContainerElm1, 'onitemdeleted', this.handleItemDeleted.bind(this));
    // this._bindingEventService.bind(this.gridContainerElm1, 'onbeforeeditcell', this.handleOnBeforeEditCell.bind(this));
    // this._bindingEventService.bind(this.gridContainerElm1, 'oncellchange', this.handleOnCellChange.bind(this));
    // this._bindingEventService.bind(this.gridContainerElm1, 'onclick', this.handleOnCellClicked.bind(this));
    this._bindingEventService.bind(this.gridContainerElm1, 'onpaginationchanged', this.handlePaginationChanged1.bind(this));
    this._bindingEventService.bind(this.gridContainerElm1, 'onpaginationchanged', this.handlePaginationChanged2.bind(this));
  }

  dispose() {
    this.sgb1?.dispose();
    this._bindingEventService.unbindAll();
    this.gridContainerElm1 = null;
    this.gridContainerElm2 = null;
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string, minWidth: 65,
        // @ts-ignore
        // resizeExtraWidthPadding: 1,
        // @ts-ignore
        resizeCharWidth: 9.5,
        filterable: true, columnGroup: 'Common Factor',
        filter: { model: Filters.compoundInputText },
        formatter: Formatters.multiple, params: { formatters: [Formatters.uppercase, Formatters.bold] },
        editor: {
          model: Editors.longText, massUpdate: false, required: true, alwaysSaveOnEnterKey: true,
          maxLength: 12,
          editorOptions: {
            cols: 45,
            rows: 6,
            buttonTexts: {
              cancel: 'Close',
              save: 'Done'
            }
          } as LongTextEditorOption,
          validator: myCustomTitleValidator,
        },
      },
      {
        id: 'duration', name: 'Duration', field: 'duration', sortable: true, filterable: true, minWidth: 65,
        type: FieldType.number, columnGroup: 'Common Factor',
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined || value === '') {
            return '';
          }
          return value > 1 ? `${value} days` : `${value} day`;
        },
        editor: { model: Editors.float, massUpdate: true, decimal: 2, valueStep: 1, minValue: 0, maxValue: 10000, alwaysSaveOnEnterKey: true, required: true },
      },
      {
        id: 'cost', name: 'Cost', field: 'cost', minWidth: 65, width: 75,
        sortable: true, filterable: true, type: FieldType.number, columnGroup: 'Analysis',
        filter: { model: Filters.compoundInputNumber },
        formatter: Formatters.dollar,
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete', minWidth: 100,
        type: FieldType.number,
        sortable: true, filterable: true, columnGroup: 'Analysis',
        filter: { model: Filters.compoundSlider, operator: '>=' },
        editor: {
          model: Editors.slider,
          massUpdate: true, minValue: 0, maxValue: 100,
        },
      },
      {
        id: 'complexity', name: 'Complexity', field: 'complexity', minWidth: 100,
        type: FieldType.number,
        sortable: true, filterable: true, columnGroup: 'Analysis',
        formatter: (_row, _cell, value) => this.complexityLevelList[value].label,
        exportCustomFormatter: (_row, _cell, value) => this.complexityLevelList[value].label,
        filter: {
          model: Filters.multipleSelect,
          collection: this.complexityLevelList
        },
        editor: {
          model: Editors.singleSelect,
          collection: this.complexityLevelList,
          massUpdate: true
        },
      },
      {
        id: 'start', name: 'Start', field: 'start', sortable: true, minWidth: 100,
        formatter: Formatters.dateUs, columnGroup: 'Period',
        exportCustomFormatter: Formatters.dateUs,
        type: FieldType.date, outputType: FieldType.dateUs, saveOutputType: FieldType.dateUtc,
        filterable: true, filter: { model: Filters.compoundDate },
        editor: { model: Editors.date, massUpdate: true, params: { hideClearButton: false } },
      },
      {
        id: 'completed', name: 'Completed', field: 'completed', width: 80, minWidth: 75, maxWidth: 100,
        sortable: true, filterable: true, columnGroup: 'Period',
        formatter: Formatters.multiple,
        params: { formatters: [Formatters.checkmarkMaterial, Formatters.center] },
        exportWithFormatter: false,
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect
        },
        editor: { model: Editors.checkbox, massUpdate: true, },
        // editor: { model: Editors.singleSelect, collection: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }], },
      },
      {
        id: 'finish', name: 'Finish', field: 'finish', sortable: true, minWidth: 100,
        formatter: Formatters.dateUs, columnGroup: 'Period',
        type: FieldType.date, outputType: FieldType.dateUs, saveOutputType: FieldType.dateUtc,
        filterable: true, filter: { model: Filters.compoundDate },
        exportCustomFormatter: Formatters.dateUs,
        editor: {
          model: Editors.date,
          editorOptions: { minDate: 'today' },
          massUpdate: true,
          validator: (value, args) => {
            const dataContext = args && args.item;
            if (dataContext && (dataContext.completed && !value)) {
              return { valid: false, msg: 'You must provide a "Finish" date when "Completed" is checked.' };
            }
            return { valid: true, msg: '' };
          }
        },
      },
      {
        id: 'product', name: 'Product', field: 'product',
        filterable: true, columnGroup: 'Item',
        minWidth: 100,
        // @ts-ignore
        // resizeWidthRatio: 1.01,
        maxWidthThreshold: 170,
        resizeExtraWidthPadding: 1,
        exportWithFormatter: true,
        dataKey: 'id',
        labelKey: 'itemName',
        formatter: Formatters.complexObject,
        exportCustomFormatter: Formatters.complex, // without the Editing cell Formatter
        type: FieldType.object,
        sortComparer: SortComparers.objectString,
        editor: {
          model: Editors.autoComplete,
          alwaysSaveOnEnterKey: true,
          massUpdate: true,

          // example with a Remote API call
          editorOptions: {
            minLength: 1,
            source: (request, response) => {
              // const items = require('c://TEMP/items.json');
              const products = this.mockProducts();
              response(products.filter(product => product.itemName.toLowerCase().includes(request.term.toLowerCase())));
            },
            renderItem: {
              // layout: 'twoRows',
              // templateCallback: (item: any) => this.renderItemCallbackWith2Rows(item),

              layout: 'fourCorners',
              templateCallback: (item: any) => this.renderItemCallbackWith4Corners(item),
            },
          } as AutocompleteOption,
        },
        filter: {
          model: Filters.inputText,
          // placeholder: '&#128269; search city',
          type: FieldType.string,
          queryField: 'product.itemName',
        }
      },
      {
        id: 'origin', name: 'Country of Origin', field: 'origin',
        formatter: Formatters.complexObject, columnGroup: 'Item',
        exportCustomFormatter: Formatters.complex, // without the Editing cell Formatter
        dataKey: 'code',
        labelKey: 'name',
        type: FieldType.object,
        sortComparer: SortComparers.objectString,
        filterable: true,
        sortable: true,
        minWidth: 100,
        editor: {
          model: Editors.autoComplete,
          alwaysSaveOnEnterKey: true,
          massUpdate: true,
          editorOptions: {
            minLength: 0,
            openSearchListOnFocus: false,
            source: (request, response) => {
              const countries: any[] = require('./data/countries.json');
              const foundCountries = countries.filter((country) => country.name.toLowerCase().includes(request.term.toLowerCase()));
              response(foundCountries.map(item => ({ label: item.name, value: item.code, })));
            },
          },
        },
        filter: {
          model: Filters.inputText,
          type: 'string',
          queryField: 'origin.name',
        }
      },
      {
        id: 'action', name: 'Action', field: 'action', width: 70, minWidth: 70, maxWidth: 70,
        excludeFromExport: true,
        formatter: () => `<div class="button-style margin-auto" style="width: 35px; margin-top: -1px;"><span class="mdi mdi-chevron-down mdi-22px color-primary"></span></div>`,
        cellMenu: {
          hideCloseButton: false,
          width: 175,
          commandTitle: 'Commands',
          commandItems: [
            {
              command: 'help',
              title: 'Help!',
              iconCssClass: 'mdi mdi-circle-question',
              positionOrder: 66,
              action: () => alert('Please Help!'),
            },
            'divider',
            {
              command: 'delete-row', title: 'Delete Row', positionOrder: 64,
              iconCssClass: 'mdi mdi-close color-danger', cssClass: 'red', textCssClass: 'text-italic color-danger-light',
              // only show command to 'Delete Row' when the task is not completed
              itemVisibilityOverride: (args) => {
                return !args.dataContext?.completed;
              },
              action: (_event, args) => {
                const dataContext = args.dataContext;
                if (confirm(`Do you really want to delete row (${args.row + 1}) with "${dataContext.title}"`)) {
                  this.slickerGridInstance.gridService.deleteItemById(dataContext.id);
                }
              }
            },
          ],
        }
      },
    ];

    this.gridOptions = {
      useSalesforceDefaultGridOptions: true,
      datasetIdPropertyName: 'id',
      eventNamingStyle: EventNamingStyle.lowerCase,
      editable: true,
      autoAddCustomEditorFormatter: customEditableInputFormatter,
      enableAddRow: true, // <-- this flag is required to work with the (create & clone) modal types
      enableCellNavigation: true,
      asyncEditorLoading: false,
      autoEdit: true,
      autoCommitEdit: true,
      autoResize: {
        container: '.grid-container',
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      showCustomFooter: true,
      enablePagination: true,
      gridHeight: 250,
      pagination: {
        pageSize: 10,
        pageSizes: [10, 200, 500, 5000]
      },
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: false
      },
      registerExternalResources: [new ExcelExportService()],
      enableFiltering: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      rowHeight: 33,
      headerRowHeight: 35,
      frozenColumn: 2,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      multiSelect: false,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      editCommandHandler: (item, column, editCommand) => {
        const prevSerializedValues = Array.isArray(editCommand.prevSerializedValue) ? editCommand.prevSerializedValue : [editCommand.prevSerializedValue];
        const serializedValues = Array.isArray(editCommand.serializedValue) ? editCommand.serializedValue : [editCommand.serializedValue];
        const editorColumns = this.columnDefinitions.filter((col) => col.editor !== undefined);

        const modifiedColumns = [];
        prevSerializedValues.forEach((_val, index) => {
          const prevSerializedValue = prevSerializedValues[index];
          const serializedValue = serializedValues[index];

          if (prevSerializedValue !== serializedValue || serializedValue === '') {
            const finalColumn = Array.isArray(editCommand.prevSerializedValue) ? editorColumns[index] : column;
            this.editedItems[this.gridOptions.datasetIdPropertyName || 'id'] = item; // keep items by their row indexes, if the row got edited twice then we'll keep only the last change
            this.sgb1.slickGrid.invalidate();
            editCommand.execute();

            this.renderUnsavedCellStyling(item, finalColumn, editCommand);
            modifiedColumns.push(finalColumn);
          }
        });

        // queued editor only keeps 1 item object,
        // so we'll push only 1 change at the end but with all columns modified
        // this way we can undo the entire row change (for example if user changes 3 field in the editor modal, then doing a undo last change will undo all 3 in 1 shot)
        this.editQueue.push({ item, columns: modifiedColumns, editCommand });
      },
      // when using the cellMenu, you can change some of the default options and all use some of the callback methods
      enableCellMenu: true,
    };
  }

  loadData(count: number) {
    // mock data
    const tmpArray = [];
    for (let i = 0; i < count; i++) {
      const randomItemId = Math.floor(Math.random() * this.mockProducts().length);
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomFinishYear = (new Date().getFullYear()) + Math.floor(Math.random() * 10); // use only years not lower than 3 years ago
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomTime = Math.floor((Math.random() * 59));
      const randomFinish = new Date(randomFinishYear, (randomMonth + 1), randomDay, randomTime, randomTime, randomTime);
      const randomPercentComplete = Math.floor(Math.random() * 100) + 15; // make it over 15 for E2E testing purposes
      const percentCompletion = randomPercentComplete > 100 ? (i > 5 ? 100 : 88) : randomPercentComplete; // don't use 100 unless it's over index 5, for E2E testing purposes
      const isCompleted = percentCompletion === 100;

      tmpArray[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.floor(Math.random() * 100) + 10,
        percentComplete: percentCompletion,
        analysis: {
          percentComplete: percentCompletion,
        },
        complexity: i % 3 ? 0 : 2,
        start: new Date(randomYear, randomMonth, randomDay, randomDay, randomTime, randomTime, randomTime),
        finish: (isCompleted || (i % 3 === 0 && (randomFinish > new Date() && i > 3)) ? (isCompleted ? new Date() : randomFinish) : ''), // make sure the random date is earlier than today and it's index is bigger than 3
        cost: (i % 33 === 0) ? null : Math.round(Math.random() * 10000) / 100,
        completed: (isCompleted || (i % 3 === 0 && (randomFinish > new Date() && i > 3))),
        product: { id: this.mockProducts()[randomItemId]?.id, itemName: this.mockProducts()[randomItemId]?.itemName, },
        origin: (i % 2) ? { code: 'CA', name: 'Canada' } : { code: 'US', name: 'United States' },
      };

      if (!(i % 8)) {
        delete tmpArray[i].finish; // also test with undefined properties
        delete tmpArray[i].percentComplete; // also test with undefined properties
      }
    }
    return tmpArray;
  }

  handleValidationError(event) {
    console.log('handleValidationError', event.detail);
    const args = event.detail && event.detail.args;
    if (args.validationResults) {
      let errorMsg = args.validationResults.msg || '';
      if (args.editor) {
        if (args.validationResults.errors) {
          errorMsg += '\n';
          for (const error of args.validationResults.errors) {
            const columnName = error.editor.args.column.name;
            errorMsg += `${columnName.toUpperCase()}: ${error.msg}`;
          }
        }
        console.log(errorMsg);
      }
    } else {
      alert(args.validationResults.msg);
    }
    return false;
  }

  handleItemDeleted(event) {
    const itemId = event && event.detail;
    console.log('item deleted with id:', itemId);
  }

  handleOnBeforeEditCell(event) {
    const eventData = event.detail.eventData;
    const args = event && event.detail && event.detail.args;
    const { column, item, grid } = args;

    if (column && item) {
      if (!checkItemIsEditable(item, column, grid)) {
        event.preventDefault();
        eventData.stopImmediatePropagation();
      }
    }
    return false;
  }

  handleOnCellChange(event) {
    const args = event && event.detail && event.detail.args;
    const dataContext = args && args.item;

    // when the field "completed" changes to false, we also need to blank out the "finish" date
    if (dataContext && !dataContext.completed) {
      dataContext.finish = null;
      this.sgb1.gridService.updateItem(dataContext);
    }
  }

  handleOnCellClicked(event) {
    const args = event && event.detail && event.detail.args;
    const eventData = event && event.detail && event.detail.eventData;
    console.log(eventData, args);
    // if (eventData.target.classList.contains('mdi-help-circle-outline')) {
    //   alert('please HELP!!!');
    // } else if (eventData.target.classList.contains('mdi-chevron-down')) {
    //   alert('do something else...');
    // }
  }

  handlePaginationChanged1() {
    this.removeAllUnsavedStylingFromCell();
    this.renderUnsavedStylingOnAllVisibleCells();
  }
  handlePaginationChanged2() {
    this.removeAllUnsavedStylingFromCell();
    this.renderUnsavedStylingOnAllVisibleCells();
  }

  handleBeforeResizeColumns() {
    this.sgb1.slickGrid.autosizeColumns();
  }

  handleNewResizeColumns() {
    // const opts = {
    //   autosizeColsMode: 'FVC',
    //   autosizeColPaddingPx: 4,
    //   viewportSwitchToScrollModeWidthPercent: 120,
    //   viewportMinWidthPx: 600,
    //   viewportMaxWidthPx: 1400,
    //   autosizeTextAvgToMWidthRatio: 0.75
    // };
    // // @ts-ignore
    // this.sgb.slickGrid.setOptions(opts);
    // this.sgb.slickGrid.autosizeColumns();

    /*
     new grid options
       - resizeContextAnalysisMaxLooping (defaults to 1000)
       - maxItemToInspectCellContentWidth (defaults to 1000)
       - resizeCharacterWidth (defaults to 7)
       - resizeCellPaddingWidth (default to 6)
       - resizeFormatterPaddingWidth (defaults to 0 but 6 in SF)
     new column options
       - maxWidthThreshold (no default)
       - resizeExtraWidthPadding (no default)
       - resizeWidthRatio (defaults to 1)
     */
    const defaultCharWidthInPx = 7; // width in pixels of a string character, this can vary depending on which font family/size is used & cell padding
    const cellPaddingWidthInPx = 6;
    const formatterPaddingWidthInPx = 6;
    const maxItemToInspectCellContentWidth = 1000; // how many items do we want to analyze for width content
    const columnWidths = {};
    for (const columnDef of this.sgb1.columnDefinitions) {
      columnWidths[columnDef.id] = columnDef.minWidth || columnDef.width || 0;
    }

    for (const [rowIdx, item] of this.dataset.entries()) {
      if (rowIdx > maxItemToInspectCellContentWidth) {
        break;
      }
      this.sgb1.columnDefinitions.forEach((columnDef, colIdx) => {
        const formattedData = exportWithFormatterWhenDefined(rowIdx, colIdx, item, columnDef, this.sgb1.slickGrid);
        // @ts-ignore
        const formattedStrLn = Math.ceil(sanitizeHtmlToText(formattedData).length * (columnDef?.resizeCharWidth ?? defaultCharWidthInPx));
        // console.log(formattedData, sanitizeHtmlToText(formattedData), formattedStrLn)
        if (columnWidths[columnDef.id] === undefined || formattedStrLn > columnWidths[columnDef.id]) {
          // @ts-ignore
          columnWidths[columnDef.id] = (formattedStrLn < columnDef.maxWidthThreshold)
            // @ts-ignore
            ? columnDef.maxWidthThreshold
            : (formattedStrLn < columnDef.maxWidth) ? columnDef.maxWidth : formattedStrLn;
        }
      });
    }

    console.log(columnWidths);

    let totalColsWidth = 0;
    let reRender = false;
    for (const col of this.sgb1.columnDefinitions) {
      // if (col.id !== '_checkbox_selector' && col.id !== 'action') {
      //   col.width = 150;
      // }
      if (columnWidths[col.id] !== undefined) {
        if (col.rerenderOnResize) {
          reRender = true;
        }
        let newColWidth = columnWidths[col.id] + cellPaddingWidthInPx;
        if (col.editor) {
          newColWidth += formatterPaddingWidthInPx;
        }
        if (col.type === 'date') {
          const varType = getVarTypeOfByColumnFieldType(col.type || col.outputType);
          if ((varType === 'date' || varType === 'number')) {
            // @ts-ignore
            col.resizeWidthRatio = 0.9;
          }
        }
        // @ts-ignore
        if (col.resizeWidthRatio) {
          // @ts-ignore
          newColWidth *= col.resizeWidthRatio;
        }
        // @ts-ignore
        if (col.resizeExtraWidthPadding) {
          // @ts-ignore
          newColWidth += col.resizeExtraWidthPadding;
        }
        // @ts-ignore
        if (newColWidth > col.maxWidthThreshold || newColWidth > col.maxWidth) {
          // @ts-ignore
          newColWidth = col.maxWidthThreshold || col.maxWidth;
        }
        col.width = Math.ceil(newColWidth);
      }
      totalColsWidth += col.width;
    }
    const viewportWidth = this.sgb1.resizerService.getLastResizeDimensions().width;
    const vwidth = document.querySelector<HTMLDivElement>('.grid-pane').offsetWidth;
    console.log('last viewport size', totalColsWidth, viewportWidth, vwidth);
    console.log(this.sgb1.columnDefinitions);

    if (totalColsWidth > viewportWidth) {
      // @ts-ignore
      this.sgb1.slickGrid.reRenderColumns(reRender);
    } else {
      this.sgb1.slickGrid.autosizeColumns();
    }
  }

  toggleGridEditReadonly() {
    // first need undo all edits
    this.undoAllEdits();

    // then change a single grid options to make the grid non-editable (readonly)
    this.isGridEditable = !this.isGridEditable;
    this.sgb1.gridOptions = { editable: this.isGridEditable };
    this.gridOptions = this.sgb1.gridOptions;
  }

  removeUnsavedStylingFromCell(_item: any, column: Column, row: number) {
    // remove unsaved css class from that cell
    this.sgb1.slickGrid.removeCellCssStyles(`unsaved_highlight_${[column.id]}${row}`);
  }

  removeAllUnsavedStylingFromCell() {
    for (const lastEdit of this.editQueue) {
      const lastEditCommand = lastEdit?.editCommand;
      if (lastEditCommand) {
        // remove unsaved css class from that cell
        for (const lastEditColumn of lastEdit.columns) {
          this.removeUnsavedStylingFromCell(lastEdit.item, lastEditColumn, lastEditCommand.row);
        }
      }
    }
  }

  renderUnsavedStylingOnAllVisibleCells() {
    for (const lastEdit of this.editQueue) {
      if (lastEdit) {
        const { item, columns, editCommand } = lastEdit;
        if (Array.isArray(columns)) {
          columns.forEach((col) => {
            this.renderUnsavedCellStyling(item, col, editCommand);
          });
        }
      }
    }
  }

  renderUnsavedCellStyling(item, column, editCommand) {
    if (editCommand && item && column) {
      const row = this.sgb1.dataView.getRowByItem(item);
      if (row >= 0) {
        const hash = { [row]: { [column.id]: 'unsaved-editable-field' } };
        this.sgb1.slickGrid.setCellCssStyles(`unsaved_highlight_${[column.id]}${row}`, hash);
      }
    }
  }

  saveAll() {
    // Edit Queue (array increases every time a cell is changed, regardless of item object)
    console.log(this.editQueue);

    // Edit Items only keeps the merged data (an object with row index as the row properties)
    // if you change 2 different cells on 2 different cells then this editedItems will only contain 1 property
    // example: editedItems = { 0: { title: task 0, duration: 50, ... }}
    // ...means that row index 0 got changed and the final merged object is { title: task 0, duration: 50, ... }
    console.log(this.editedItems);
    // console.log(`We changed ${Object.keys(this.editedItems).length} rows`);

    // since we saved, we can now remove all the unsaved color styling and reset our array/object
    this.removeAllUnsavedStylingFromCell();
    this.editQueue = [];
    this.editedItems = {};
  }

  undoLastEdit(showLastEditor = false) {
    const lastEdit = this.editQueue.pop();
    const lastEditCommand = lastEdit?.editCommand;
    if (lastEdit && lastEditCommand && Slick.GlobalEditorLock.cancelCurrentEdit()) {
      lastEditCommand.undo();

      // remove unsaved css class from that cell
      for (const lastEditColumn of lastEdit.columns) {
        this.removeUnsavedStylingFromCell(lastEdit.item, lastEditColumn, lastEditCommand.row);
      }
      this.sgb1.slickGrid.invalidate();


      // optionally open the last cell editor associated
      if (showLastEditor) {
        this.sgb1?.slickGrid.gotoCell(lastEditCommand.row, lastEditCommand.cell, false);
      }
    }
  }

  undoAllEdits() {
    for (const lastEdit of this.editQueue) {
      const lastEditCommand = lastEdit?.editCommand;
      if (lastEditCommand && Slick.GlobalEditorLock.cancelCurrentEdit()) {
        lastEditCommand.undo();

        // remove unsaved css class from that cell
        for (const lastEditColumn of lastEdit.columns) {
          this.removeUnsavedStylingFromCell(lastEdit.item, lastEditColumn, lastEditCommand.row);
        }
      }
    }
    this.sgb1.slickGrid.invalidate(); // re-render the grid only after every cells got rolled back
    this.editQueue = [];
  }

  mockProducts() {
    return [
      {
        id: 0,
        itemName: 'Sleek Metal Computer',
        itemNameTranslated: 'some fantastic sleek metal computer description',
        listPrice: 2100.23,
        itemTypeName: 'I',
        image: 'http://i.stack.imgur.com/pC1Tv.jpg',
        icon: `mdi ${this.getRandomIcon(0)}`,
      },
      {
        id: 1,
        itemName: 'Tasty Granite Table',
        itemNameTranslated: 'an extremely huge and heavy table',
        listPrice: 3200.12,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/Fnm7j6h.jpg',
        icon: `mdi ${this.getRandomIcon(1)}`,
      },
      {
        id: 2,
        itemName: 'Awesome Wooden Mouse',
        itemNameTranslated: 'super old mouse',
        listPrice: 15.00,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/RaVJuLr.jpg',
        icon: `mdi ${this.getRandomIcon(2)}`,
      },
      {
        id: 3,
        itemName: 'Gorgeous Fresh Shirt',
        itemNameTranslated: 'what a gorgeous shirt seriously',
        listPrice: 25.76,
        itemTypeName: 'I',
        image: 'http://i.stack.imgur.com/pC1Tv.jpg',
        icon: `mdi ${this.getRandomIcon(3)}`,
      },
      {
        id: 4,
        itemName: 'Refined Cotton Table',
        itemNameTranslated: 'super light table that will fall apart amazingly fast',
        listPrice: 13.35,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/Fnm7j6h.jpg',
        icon: `mdi ${this.getRandomIcon(4)}`,
      },
      {
        id: 5,
        itemName: 'Intelligent Wooden Pizza',
        itemNameTranslated: 'wood not included',
        listPrice: 23.33,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/RaVJuLr.jpg',
        icon: `mdi ${this.getRandomIcon(5)}`,
      },
      {
        id: 6,
        itemName: 'Licensed Cotton Chips',
        itemNameTranslated: 'not sure what that is',
        listPrice: 71.21,
        itemTypeName: 'I',
        image: 'http://i.stack.imgur.com/pC1Tv.jpg',
        icon: `mdi ${this.getRandomIcon(6)}`,
      },
      {
        id: 7,
        itemName: 'Ergonomic Rubber Soap',
        itemNameTranslated: `so good you'll want to use it every night`,
        listPrice: 2.43,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/Fnm7j6h.jpg',
        icon: `mdi ${this.getRandomIcon(7)}`,
      },
      {
        id: 8,
        itemName: 'Handcrafted Steel Car',
        itemNameTranslated: `aka tesla truck`,
        listPrice: 31288.39,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/RaVJuLr.jpg',
        icon: `mdi ${this.getRandomIcon(8)}`,
      },
    ];
  }

  /** List of icons that are supported in this lib Material Design Icons */
  getRandomIcon(iconIndex?: number) {
    const icons = [
      'mdi-arrow-collapse',
      'mdi-arrow-expand',
      'mdi-cancel',
      'mdi-check',
      'mdi-checkbox-blank-outline',
      'mdi-check-box-outline',
      'mdi-checkbox-marked',
      'mdi-close',
      'mdi-close-circle',
      'mdi-close-circle-outline',
      'mdi-close-thick',
      'mdi-content-copy',
      'mdi-database-refresh',
      'mdi-download',
      'mdi-file-document-outline',
      'mdi-file-excel-outline',
      'mdi-file-music-outline',
      'mdi-file-pdf-outline',
      'mdi-filter-remove-outline',
      'mdi-flip-vertical',
      'mdi-folder',
      'mdi-folder-open',
      'mdi-help-circle',
      'mdi-help-circle-outline',
      'mdi-history',
      'mdi-information',
      'mdi-information-outline',
      'mdi-link',
      'mdi-link-variant',
      'mdi-menu',
      'mdi-microsoft-excel',
      'mdi-minus',
      'mdi-page-first',
      'mdi-page-last',
      'mdi-paperclip',
      'mdi-pin-off-outline',
      'mdi-pin-outline',
      'mdi-playlist-plus',
      'mdi-playlist-remove',
      'mdi-plus',
      'mdi-redo',
      'mdi-refresh',
      'mdi-shape-square-plus',
      'mdi-sort-ascending',
      'mdi-sort-descending',
      'mdi-swap-horizontal',
      'mdi-swap-vertical',
      'mdi-sync',
      'mdi-table-edit',
      'mdi-table-refresh',
      'mdi-undo',
    ];
    const randomNumber = Math.floor((Math.random() * icons.length - 1));
    return icons[iconIndex ?? randomNumber];
  }

  renderItemCallbackWith2Rows(item: any): string {
    return `<div class="autocomplete-container-list">
      <div class="autocomplete-left">
        <!--<img src="http://i.stack.imgur.com/pC1Tv.jpg" width="50" />-->
        <span class="mdi ${item.icon} mdi-26px"></span>
      </div>
      <div>
        <span class="autocomplete-top-left">
          <span class="mdi ${item.itemTypeName === 'I' ? 'mdi-information-outline' : 'mdi-content-copy'} mdi-14px"></span>
          ${item.itemName}
        </span>
      <div>
    </div>
    <div>
      <div class="autocomplete-bottom-left">${item.itemNameTranslated}</div>
    </div>`;
  }

  renderItemCallbackWith4Corners(item: any): string {
    return `<div class="autocomplete-container-list">
          <div class="autocomplete-left">
            <!--<img src="http://i.stack.imgur.com/pC1Tv.jpg" width="50" />-->
            <span class="mdi ${item.icon} mdi-26px"></span>
          </div>
          <div>
            <span class="autocomplete-top-left">
              <span class="mdi ${item.itemTypeName === 'I' ? 'mdi-information-outline' : 'mdi-content-copy'} mdi-14px"></span>
              ${item.itemName}
            </span>
            <span class="autocomplete-top-right">${formatNumber(item.listPrice, 2, 2, false, '$')}</span>
          <div>
        </div>
        <div>
          <div class="autocomplete-bottom-left">${item.itemNameTranslated}</div>
          <span class="autocomplete-bottom-right">Type: <b>${item.itemTypeName === 'I' ? 'Item' : item.itemTypeName === 'C' ? 'PdCat' : 'Cat'}</b></span>
        </div>`;
  }
}
