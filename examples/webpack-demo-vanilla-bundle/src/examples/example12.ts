import {
  AutocompleteOption,
  Column,
  CompositeEditorModalType,
  Editors,
  EventNamingStyle,
  FieldType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  SlickNamespace,
  SortComparers,

  // utilities
  formatNumber,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, SlickerGridInstance, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import '../salesforce-styles.scss';
import './example12.scss';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator = (value, args) => {
  if ((value === null || value === undefined || !value.length) && (args.compositeEditorOptions && args.compositeEditorOptions.modalType === 'create' || args.compositeEditorOptions.modalType === 'edit')) {
    // we will only check if the field is supplied when it's an inline editing OR a composite editor of type create/edit
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
      // case 'countryOfOrigin':
      // isEditable = dataContext.percentComplete < 50;
      // break;
    }
  }
  return isEditable;
}

const customEditableInputFormatter = (_row, _cell, value, columnDef, dataContext, grid) => {
  const isEditableLine = checkItemIsEditable(dataContext, columnDef, grid);
  value = (value === null || value === undefined) ? '' : value;
  return isEditableLine ? `<div class="editing-field">${value}</div>` : value;
};

export class Example12 {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[] = [];
  isGridEditable = true;
  editQueue = [];
  editedItems = {};
  isCompositeDisabled = false;
  isMassSelectionDisabled = true;
  sgb: SlickVanillaGridBundle;
  gridContainerElm: HTMLDivElement;

  get slickerGridInstance(): SlickerGridInstance {
    return this.sgb?.instances;
  }

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`.grid12`);

    this.sgb = new Slicker.GridBundle(this.gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    // this.sgb.slickGrid.setActiveCell(0, 0);

    // bind any of the grid events
    this.gridContainerElm.addEventListener('onvalidationerror', this.handleValidationError.bind(this));
    this.gridContainerElm.addEventListener('onitemdeleted', this.handleItemDeleted.bind(this));
    this.gridContainerElm.addEventListener('onbeforeeditcell', this.handleOnBeforeEditCell.bind(this));
    this.gridContainerElm.addEventListener('oncellchange', this.handleOnCellChange.bind(this));
    this.gridContainerElm.addEventListener('onclick', this.handleOnCellClicked.bind(this));
    this.gridContainerElm.addEventListener('ongridstatechanged', this.handleOnSelectedRowsChanged.bind(this));
    this.gridContainerElm.addEventListener('ondblclick', () => this.openCompositeModal('edit', 50));
  }

  dispose() {
    this.sgb?.dispose();
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string,
        filterable: true, columnGroup: 'Common Factor',
        formatter: Formatters.multiple, params: { formatters: [Formatters.uppercase, Formatters.bold] },
        editor: { model: Editors.longText, massUpdate: false, required: true, alwaysSaveOnEnterKey: true, validator: myCustomTitleValidator, },
      },
      {
        id: 'duration', name: 'Duration', field: 'duration', sortable: true, filterable: true,
        type: FieldType.number, columnGroup: 'Common Factor',
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) {
            return '';
          }
          return value > 1 ? `${value} days` : `${value} day`;
        },
        editor: { model: Editors.float, massUpdate: true, decimal: 2, valueStep: 1, minValue: 0, maxValue: 10000, alwaysSaveOnEnterKey: true, required: true },
      },
      {
        id: 'cost', name: 'Cost', field: 'cost', width: 90,
        sortable: true, filterable: true, type: FieldType.number, columnGroup: 'Analysis',
        filter: { model: Filters.compoundInputNumber },
        formatter: Formatters.dollar,
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete', type: FieldType.number,
        sortable: true, filterable: true, columnGroup: 'Analysis',
        filter: { model: Filters.slider, operator: '>=' },
        editor: { model: Editors.slider, massUpdate: true, minValue: 0, maxValue: 100, },
      },
      {
        id: 'start', name: 'Start', field: 'start', sortable: true,
        formatter: Formatters.dateIso, columnGroup: 'Period',
        type: FieldType.date, outputType: FieldType.dateIso,
        filterable: true, filter: { model: Filters.compoundDate },
        editor: { model: Editors.date, massUpdate: true, params: { hideClearButton: false } },
      },
      {
        id: 'completed', name: 'Completed', field: 'completed', width: 80, minWidth: 20, maxWidth: 100,
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
        id: 'finish', name: 'Finish', field: 'finish', sortable: true,
        formatter: Formatters.dateIso, columnGroup: 'Period',
        type: FieldType.date, outputType: FieldType.dateIso,
        filterable: true, filter: { model: Filters.compoundDate },
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
        exportWithFormatter: true,
        dataKey: 'id',
        labelKey: 'itemName',
        formatter: Formatters.complexObject,
        type: FieldType.object,
        sortComparer: SortComparers.objectString,
        editor: {
          model: Editors.autoComplete,
          alwaysSaveOnEnterKey: true,
          massUpdate: true,

          // example with a Remote API call
          editorOptions: {
            openSearchListOnFocus: true,
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
        id: 'countryOfOrigin', name: 'Country of Origin', field: 'countryOfOrigin',
        formatter: Formatters.complexObject, columnGroup: 'Item',
        exportWithFormatter: true,
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
            minLength: 1,
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
          queryField: 'countryOfOrigin.name',
        }
      },
      {
        id: 'action', name: 'Action', field: 'action', width: 70, maxWidth: 70,
        excludeFromExport: true,
        formatter: () => `<div class="button-style margin-auto" style="width: 35px; margin-top: -1px;"><span class="mdi mdi-chevron-down mdi-22px color-primary"></span></div>`,
        cellMenu: {
          hideCloseButton: false,
          width: 200,
          commandTitle: 'Commands',
          commandItems: [
            {
              command: 'delete-row', title: 'Delete Row', positionOrder: 64,
              iconCssClass: 'mdi mdi-close color-danger', cssClass: 'red', textCssClass: 'bold',
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
            {
              command: 'help',
              title: 'Help',
              iconCssClass: 'mdi mdi-help-circle-outline color-info',
              textCssClass: 'color-info-dark',
              positionOrder: 66,
              action: () => alert('Please Help!'),
            },
            'divider',
            { command: 'something', title: 'Disabled Command', disabled: true, positionOrder: 67, }
          ],
        }
      },
    ];

    // automatically add a Custom Formatter with blue background for any Editable Fields
    this.autoAddCustomEditorFormatter(this.columnDefinitions, customEditableInputFormatter);

    this.gridOptions = {
      useSalesforceDefaultGridOptions: true,
      datasetIdPropertyName: 'id',
      eventNamingStyle: EventNamingStyle.lowerCase,
      editable: true,
      enableAddRow: true, // <-- this flag is required to work with these modal types (create/mass-update/mass-selection)
      enableCellNavigation: true,
      asyncEditorLoading: false,
      autoEdit: true,
      autoCommitEdit: true,
      autoResize: {
        container: '.demo-container',
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      showCustomFooter: true,
      enablePagination: true,
      pagination: {
        pageSize: 10,
        pageSizes: [10, 200, 500, 5000]
      },
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true
      },
      registerExternalServices: [new ExcelExportService()],
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
      enableCheckboxSelector: true,
      enableRowSelection: true,
      multiSelect: false,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      enableCompositeEditor: true,
      editCommandHandler: (item, column, editCommand) => {
        // composite editors values are saved as array, so let's convert to array in any case and we'll loop through these values
        const prevSerializedValues = Array.isArray(editCommand.prevSerializedValue) ? editCommand.prevSerializedValue : [editCommand.prevSerializedValue];
        const serializedValues = Array.isArray(editCommand.serializedValue) ? editCommand.serializedValue : [editCommand.serializedValue];
        const editorColumns = this.columnDefinitions.filter((col) => col.editor !== undefined);

        const modifiedColumns = [];
        prevSerializedValues.forEach((_val, index) => {
          const prevSerializedValue = prevSerializedValues[index];
          const serializedValue = serializedValues[index];

          if (prevSerializedValue !== serializedValue) {
            const finalColumn = Array.isArray(editCommand.prevSerializedValue) ? editorColumns[index] : column;
            this.editedItems[editCommand.row] = item; // keep items by their row indexes, if the row got edited twice then we'll keep only the last change
            this.sgb.slickGrid.invalidate();
            editCommand.execute();

            const hash = { [editCommand.row]: { [finalColumn.field]: 'unsaved-editable-field' } };
            this.sgb.slickGrid.setCellCssStyles(`unsaved_highlight_${[finalColumn.field]}${editCommand.row}`, hash);
            modifiedColumns.push(finalColumn);
          }
        });

        // queued editor only keeps 1 item object even when it's a composite editor,
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
      const randomFinish = new Date(randomFinishYear, (randomMonth + 1), randomDay);
      const randomPercentComplete = Math.floor(Math.random() * 100) + 15; // make it over 15 for E2E testing purposes

      tmpArray[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.floor(Math.random() * 100) + 10,
        percentComplete: randomPercentComplete > 100 ? 100 : randomPercentComplete,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: (i % 3 === 0 && (randomFinish > new Date() && i > 3)) ? randomFinish : '', // make sure the random date is earlier than today and it's index is bigger than 3
        cost: (i % 33 === 0) ? null : Math.round(Math.random() * 10000) / 100,
        completed: (i % 3 === 0 && (randomFinish > new Date() && i > 3)),
        product: { id: this.mockProducts()[randomItemId]?.id, itemName: this.mockProducts()[randomItemId]?.itemName, },
        countryOfOrigin: (i % 2) ? { code: 'CA', name: 'Canada' } : { code: 'US', name: 'United States' },
      };

      if (!(i % 8)) {
        delete tmpArray[i].finish; // also test with undefined properties
      }
    }
    return tmpArray;
  }

  handleValidationError(event) {
    console.log('handleValidationError', event.detail);
    const args = event.detail && event.detail.args;
    if (args.validationResults) {
      let errorMsg = args.validationResults.msg || '';
      if (args.editor && (args.editor instanceof Slick.CompositeEditor)) {
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
      this.sgb.gridService.updateItem(dataContext);
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

  handleOnSelectedRowsChanged(event) {
    const gridState = event && event.detail && event.detail.gridState;
    if (Array.isArray(gridState?.rowSelection.dataContextIds)) {
      this.isMassSelectionDisabled = gridState.rowSelection.dataContextIds.length === 0;
    }
  }

  /**
   * Instead of manually adding a Custom Formatter on every column definition that is editable, let's do it in an automated way
   * We'll loop through all column definitions and add a Formatter (blue background) when necessary
   * Note however that if there's already a Formatter on that column definition, we need to turn it into a Formatters.multiple
   */
  autoAddCustomEditorFormatter(columnDefinitions: Column[], customFormatter: Formatter) {
    if (Array.isArray(columnDefinitions)) {
      for (const columnDef of columnDefinitions) {
        if (columnDef.editor) {
          if (columnDef.formatter && columnDef.formatter !== Formatters.multiple) {
            const prevFormatter = columnDef.formatter;
            columnDef.formatter = Formatters.multiple;
            columnDef.params = { ...columnDef.params, formatters: [prevFormatter, customFormatter] };
          } else if (columnDef.formatter && columnDef.formatter === Formatters.multiple) {
            if (!columnDef.params) {
              columnDef.params = {};
            }
            columnDef.params.formatters = [...columnDef.params.formatters, customFormatter];
          } else {
            columnDef.formatter = customFormatter;
          }
        }
      }
    }
  }

  toggleGridEditReadonly() {
    // first need undo all edits
    this.undoAllEdits();

    // then change a single grid options to make the grid non-editable (readonly)
    this.isGridEditable = !this.isGridEditable;
    this.sgb.gridOptions = { editable: this.isGridEditable };
    this.gridOptions = this.sgb.gridOptions;
    this.isCompositeDisabled = !this.isGridEditable;
    if (!this.isGridEditable) {
      this.isMassSelectionDisabled = true;
    }
  }

  removeUnsavedStylingFromCell(_item: any, column: Column, row: number) {
    // remove unsaved css class from that cell
    this.sgb.slickGrid.removeCellCssStyles(`unsaved_highlight_${[column.field]}${row}`);
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
      this.sgb.slickGrid.invalidate();


      // optionally open the last cell editor associated
      if (showLastEditor) {
        this.sgb?.slickGrid.gotoCell(lastEditCommand.row, lastEditCommand.cell, false);
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
    this.sgb.slickGrid.invalidate(); // re-render the grid only after every cells got rolled back
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

  openCompositeModal(modalType: CompositeEditorModalType, openDelay = 0) {
    // open the editor modal and we can also provide a header title with optional parsing pulled from the dataContext, via template {{ }}
    // for example {{title}} => display the item title, or even complex object works {{product.itemName}} => display item product name

    let modalTitle = '';
    switch (modalType) {
      case 'create':
        modalTitle = 'Inserting New Task';
        break;
      case 'edit':
        modalTitle = 'Editing - {{title}} (<span class="color-muted">id:</span> <span class="color-primary">{{id}}</span>)'; // 'Editing - {{title}} ({{product.itemName}})'
        break;
      case 'mass-update':
        modalTitle = 'Mass Update All Records';
        // modalTitle = 'Mise à jour en masse';
        break;
      case 'mass-selection':
        modalTitle = 'Update Selected Records';
        // modalTitle = 'Mise à jour de la sélection';
        break;
    }

    setTimeout(() => this.sgb.slickCompositeEditor?.openDetails({
      headerTitle: modalTitle,
      modalType,
      // showCloseButtonOutside: true,
      // backdrop: null,
      // viewColumnLayout: 2, // choose from 'auto', 1, 2, or 3 (defaults to 'auto')
      // labels: {
      //   cancelButton: 'Cancel',
      //   massSelectionButton: 'Update Selection',
      //   massSelectionStatus: '{{x}} of {{y}} selected',
      //   massUpdateButton: 'Apply Mass Update',
      //   massUpdateStatus: 'All {{x}} records selected',
      //   saveButton: 'Save',
      // },
      // labels: {
      //   cancelButton: 'Annuler',
      //   massSelectionButton: 'Mettre à jour la sélection',
      //   massSelectionStatus: '{{x}} de {{y}} sélectionnés',
      //   massUpdateButton: 'Mettre à jour en masse',
      //   massUpdateStatus: 'Sur tous les {{x}} éléments',
      //   saveButton: 'Sauvegarder',
      // },
      onClose: () => Promise.resolve(confirm('You have unsaved changes, are you sure you want to close this window?')),
      onError: (error) => alert(error.message),
      onSave: (formValues, selection, applyChangesCallback) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (formValues.percentComplete > 50) {
              applyChangesCallback(formValues, selection);
              resolve(true);
            } else {
              reject('Unfortunately we only accept a minimum of 50% Completion...');
            }
          }, 250);
        });
      }
    }), openDelay);
    // this.sgb.slickCompositeEditor.applyChanges(formValues, modalType);
    // this.sgb.slickCompositeEditor.undoLastMassChange();
  }
}
