import {
  Column,
  Editors,
  FieldType,
  Filters,
  Formatters,
  GridOption,
  SlickDataView,
  SlickGrid,
  SlickNamespace,
  Formatter,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, SlickerGridInstance, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import '../salesforce-styles.scss';
import './example03.scss';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator = (value, args) => {
  if (value === null || value === undefined || !value.length) {
    return { valid: false, msg: 'This is a required field' };
  } else if (!/^Task\s\d+$/.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number' };
  }
  return { valid: true, msg: '' };
};

const customEditableInputFormatter = (row, cell, value, columnDef, dataContext, grid) => {
  const gridOptions = grid && grid.getOptions && grid.getOptions();
  const isEditableLine = gridOptions.editable && columnDef.editor;
  value = (value === null || value === undefined) ? '' : value;
  // const isUnsavedField = dataContext.__unsaved && dataContext.__unsaved[columnDef.field] || false;
  const isUnsavedField = false;
  const cssClass = isUnsavedField ? 'unsaved-editable-field' : 'editable-field';
  return isEditableLine ? { text: value, addClasses: cssClass, toolTip: 'Click to Edit' } : value;
};

interface ReportItem {
  title: string;
  duration: number;
  cost: number;
  percentComplete: number;
  start: Date;
  finish: Date;
  effortDriven: boolean;
}

export class Example3 {
  columnDefinitions: Column<ReportItem>[];
  gridOptions: GridOption;
  dataset: any[];
  dataViewObj: SlickDataView;
  gridObj: SlickGrid;
  isGridEditable = true;
  editQueue = [];
  editedItems = {};
  sgb: SlickVanillaGridBundle;
  slickerGridInstance: SlickerGridInstance;
  durationOrderByCount = false;

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid3`);

    gridContainerElm.addEventListener('ongridafterresize', (e) => console.log(e));
    gridContainerElm.addEventListener('onvalidationerror', this.handleValidationError.bind(this));
    gridContainerElm.addEventListener('onitemdeleted', this.handleItemDeleted.bind(this));
    gridContainerElm.addEventListener('onslickergridcreated', this.handleOnSlickerGridCreated.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  dispose() {
    this.sgb?.dispose();
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string,
        editor: { model: Editors.text, required: true, alwaysSaveOnEnterKey: true, validator: myCustomTitleValidator, },
        filterable: true,
        formatter: Formatters.multiple, params: { formatters: [Formatters.uppercase, Formatters.bold] },
      },
      {
        id: 'duration', name: 'Duration', field: 'duration', sortable: true, filterable: true,
        editor: { model: Editors.float, decimal: 2, valueStep: 1, maxValue: 10000, alwaysSaveOnEnterKey: true, },
        params: { unsaved: false },
        type: FieldType.number,
      },
      {
        id: 'cost', name: 'Cost', field: 'cost',
        width: 90,
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
        formatter: Formatters.dollar,
        type: FieldType.number,
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete', type: FieldType.number,
        editor: { model: Editors.slider, minValue: 0, maxValue: 100, },
        sortable: true, filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
      },
      {
        id: 'start', name: 'Start', field: 'start', sortable: true,
        formatter: Formatters.dateIso,
        type: FieldType.date, outputType: FieldType.dateIso,
        filterable: true, filter: { model: Filters.compoundDate },
        editor: { model: Editors.date },
      },
      {
        id: 'finish', name: 'Finish', field: 'finish', sortable: true,
        editor: { model: Editors.date, editorOptions: { minDate: 'today' }, },
        formatter: Formatters.dateIso,
        type: FieldType.date, outputType: FieldType.dateIso,
        filterable: true, filter: { model: Filters.compoundDate },
      },
      {
        id: 'effortDriven', name: 'Effort Driven', field: 'effortDriven', width: 80, minWidth: 20, maxWidth: 100,
        sortable: true, filterable: true,
        editor: { model: Editors.checkbox },
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect
        },
        exportWithFormatter: false,
        formatter: Formatters.checkmarkMaterial,
      },
      {
        id: 'action', name: 'Action', field: 'action', width: 100, maxWidth: 100,
        excludeFromExport: true,
        formatter: () => {
          return `<div class="fake-hyperlink">Action <span class="font-12px">&#9660;</span></div>`;
        },
        cellMenu: {
          hideCloseButton: false,
          width: 200,
          commandTitle: 'Commands',
          commandItems: [
            {
              command: 'delete-row', title: 'Delete Row', positionOrder: 64,
              iconCssClass: 'mdi mdi-close', cssClass: 'red', textCssClass: 'bold',
              // only show command to 'Delete Row' when the task is not completed
              itemVisibilityOverride: (args) => {
                return !args.dataContext.completed;
              }
            },
            {
              command: 'help',
              title: 'Help',
              iconCssClass: 'mdi mdi-help-circle-outline',
              positionOrder: 66,
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
      autoEdit: true, // true single click (false for double-click)
      autoCommitEdit: true,
      editable: true,
      autoResize: {
        container: '.demo-container',
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableCellNavigation: true,
      showCustomFooter: true,
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
      rowHeight: 33,
      headerRowHeight: 35,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      editCommandHandler: (item, column, editCommand) => {
        // keep in an array only the ones that changed, also add an extra "__unsaved" property that we can use for styling these cells
        if (editCommand.prevSerializedValue !== editCommand.serializedValue) {
          this.editQueue.push({ item, column, editCommand });
          this.editedItems[editCommand.row] = item; // keep items by their row indexes, if the row got edited twice then we'll keep only the last change
          // item.__unsaved = { ...item.__unsaved, [column.field]: true };
          this.sgb.slickGrid.invalidate();
          editCommand.execute();

          const hash = { [editCommand.row]: { [column.field]: 'unsaved-editable-field' } };
          this.sgb.slickGrid.setCellCssStyles(`unsaved_highlight_${[column.field]}${editCommand.row}`, hash);
        }
      },
      // when using the cellMenu, you can change some of the default options and all use some of the callback methods
      enableCellMenu: true,
      cellMenu: {
        // all the Cell Menu callback methods (except the action callback)
        // are available under the grid options as shown below
        onCommand: (e, args) => this.executeCellMenuCommand(e, args),
        onOptionSelected: (e, args) => {
          // change "Completed" property with new option selected from the Cell Menu
          const dataContext = args && args.dataContext;
          if (dataContext && dataContext.hasOwnProperty('completed')) {
            dataContext.completed = args.item.option;
            this.sgb.gridService.updateItem(dataContext);
          }
        },
      },
    };
  }

  toggleGridEditReadonly() {
    // change a single grid options to make the grid non-editable (readonly)
    this.isGridEditable = !this.isGridEditable;
    this.sgb.gridOptions = { editable: this.isGridEditable };
    this.gridOptions = this.sgb.gridOptions;
    this.removeAllUnsavedStylingFromCell();
  }

  loadData(count: number) {
    // mock data
    const tmpArray = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomFinishYear = (new Date().getFullYear() - 3) + Math.floor(Math.random() * 10); // use only years not lower than 3 years ago
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomFinish = new Date(randomFinishYear, (randomMonth + 1), randomDay);

      tmpArray[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(randomYear, randomMonth, randomDay),
        finish: randomFinish < new Date() ? '' : randomFinish, // make sure the random date is earlier than today
        cost: (i % 33 === 0) ? null : Math.round(Math.random() * 10000) / 100,
        effortDriven: (i % 5 === 0)
      };

      if (i % 8) {
        delete tmpArray[i].finish; // test with undefined properties
      }
    }
    if (this.sgb) {
      this.sgb.dataset = tmpArray;
    }
    return tmpArray;
  }

  handleValidationError(event) {
    console.log('handleValidationError', event.detail);
    const args = event.detail && event.detail.args;
    if (args.validationResults) {
      alert(args.validationResults.msg);
    }
  }

  handleItemDeleted(event) {
    const itemId = event && event.detail;
    console.log('item deleted with id:', itemId);
  }

  handleOnSlickerGridCreated(event) {
    this.slickerGridInstance = event && event.detail;
    this.gridObj = this.slickerGridInstance && this.slickerGridInstance.slickGrid;
    this.dataViewObj = this.slickerGridInstance && this.slickerGridInstance.dataView;
    console.log('handleOnSlickerGridCreated', this.slickerGridInstance);
  }

  executeCellMenuCommand(e, args) {
    const command = args.command;
    const dataContext = args.dataContext;

    switch (command) {
      case 'help':
        alert('Please help!');
        break;
      case 'delete-row':
        if (confirm(`Do you really want to delete row (${args.row + 1}) with "${dataContext.title}"`)) {
          this.slickerGridInstance.gridService.deleteItemById(dataContext.id);
        }
        break;
    }
  }

  /**
   * Instead of manually adding a Custom Formatter on every column definition that is editable, let's do it in an automated way
   * We'll loop through all column definitions and add a Formatter (blue background) when necessary
   * However note that if there's already a Formatter on that column definition, we need to turn it into a Formatters.multiple
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

  saveAll() {
    console.log(this.editQueue);
    console.log(this.editedItems);
    this.removeAllUnsavedStylingFromCell();
    this.editQueue = [];
    this.editedItems = {};
  }

  removeUnsavedStylingFromCell(item: any, column: Column, row: number) {
    // remove unsaved css class from that cell
    const fieldId = column.field;
    if (item.__unsaved) {
      delete item.__unsaved[fieldId];
    }

    this.sgb.slickGrid.removeCellCssStyles(`unsaved_highlight_${[column.field]}${row}`);
  }

  removeAllUnsavedStylingFromCell() {
    for (const lastEdit of this.editQueue) {
      const lastEditCommand = lastEdit?.editCommand;
      if (lastEditCommand) {
        // remove unsaved css class from that cell
        this.removeUnsavedStylingFromCell(lastEdit.item, lastEdit.column, lastEditCommand.row);
      }
    }
  }

  undoLastEdit(showLastEditor = false) {
    const lastEdit = this.editQueue.pop();
    const lastEditCommand = lastEdit?.editCommand;
    if (lastEdit && lastEditCommand && Slick.GlobalEditorLock.cancelCurrentEdit()) {
      lastEditCommand.undo();

      // remove unsaved css class from that cell
      this.removeUnsavedStylingFromCell(lastEdit.item, lastEdit.column, lastEditCommand.row);
      this.sgb.slickGrid.invalidate();


      // optionally open the last cell editor associated
      if (showLastEditor) {
        this.gridObj.gotoCell(lastEditCommand.row, lastEditCommand.cell, false);
      }
    }
  }

  undoAllEdits() {
    for (const lastEdit of this.editQueue) {
      const lastEditCommand = lastEdit?.editCommand;
      if (lastEditCommand && Slick.GlobalEditorLock.cancelCurrentEdit()) {
        lastEditCommand.undo();

        // remove unsaved css class from that cell
        this.removeUnsavedStylingFromCell(lastEdit.item, lastEdit.column, lastEditCommand.row);
      }
    }
    this.sgb.slickGrid.invalidate(); // re-render the grid only after every cells got rolled back
    this.editQueue = [];
  }
}
