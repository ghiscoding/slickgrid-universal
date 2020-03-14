import { Aggregators, FieldType, Sorters, SortDirectionNumber, GroupTotalFormatters, Formatters, OperatorType } from '@slickgrid-universal/common';

const actionFormatter = (row, cell, value, columnDef, dataContext) => {
  if (dataContext.priority === 3) { // option 3 is High
    return `<div class="fake-hyperlink">Action <i class="mdi mdi-24px mdi-menu-down"></i></div>`;
  }
  return `<div class="disabled">Action <i class="mdi mdi-24px mdi-menu-down"></i></div>`;
};

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator = (value, args) => {
  if (value == null || value === undefined || !value.length) {
    return { valid: false, msg: 'This is a required field' };
  } else if (!/^Task\s\d+$/.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number' };
  }
  return { valid: true, msg: '' };
};

// (window as any).Slicker = {};
declare var Slicker: any;

export class Example1 {
  gridClass;
  gridClassName;
  columnDefinitions;
  gridOptions;
  dataset;
  dataviewObj: any;
  gridObj: any;
  commandQueue = [];
  slickgridLwc;
  slickerGridInstance;
  durationOrderByCount = false;

  attached() {
    const dataset = this.initializeGrid();
    const gridContainerElm = document.querySelector(`.myGrid`);
    const gridElm = document.querySelector(`.slickgrid-container`);

    // gridContainerElm.addEventListener('onclick', handleOnClick);
    gridContainerElm.addEventListener('onvalidationerror', this.handleValidationError.bind(this));
    gridContainerElm.addEventListener('onitemdeleted', this.handleItemDeleted.bind(this));
    gridContainerElm.addEventListener('onslickergridcreated', this.handleOnSlickerGridCreated.bind(this));
    this.slickgridLwc = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions, dataset);
  }

  initializeGrid() {
    this.gridClass = 'myGrid';
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string,
        editor: {
          model: Slicker.Editors.longText,
          required: true,
          alwaysSaveOnEnterKey: true,
          validator: myCustomTitleValidator, // use a custom validator
        },
        filterable: true,
      },
      {
        id: 'duration', name: 'Duration', field: 'duration', sortable: true, filterable: true,
        editor: {
          model: Slicker.Editors.slider,
          minValue: 0,
          maxValue: 100,
          // params: { hideSliderNumber: true },
        },
        /*
        editor: {
          // default is 0 decimals, if no decimals is passed it will accept 0 or more decimals
          // however if you pass the "decimalPlaces", it will validate with that maximum
          model: Editors.float,
          minValue: 0,
          maxValue: 365,
          // the default validation error message is in English but you can override it by using "errorMessage"
          // errorMessage: this.i18n.tr('INVALID_FLOAT', { maxDecimal: 2 }),
          params: { decimalPlaces: 2 },
        },
        */
        type: FieldType.number
      },
      {
        id: 'cost', name: 'Cost', field: 'cost',
        width: 90,
        sortable: true,
        filterable: true,
        // filter: { model: Filters.compoundInput },
        formatter: Formatters.dollar,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
        type: FieldType.number
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete', sortable: true,
        filterable: true,
        type: FieldType.number,
        editor: {
          // We can also add HTML text to be rendered (any bad script will be sanitized) but we have to opt-in, else it will be sanitized
          enableRenderHtml: true,
          // collection: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }],
          collection: Array.from(Array(101).keys()).map(k => ({ value: k, label: k, symbol: '<i class="mdi mdi-percent-outline" style="color:cadetblue"></i>' })),
          customStructure: {
            value: 'value',
            label: 'label',
            labelSuffix: 'symbol'
          },
          collectionSortBy: {
            property: 'label',
            sortDesc: true
          },
          collectionFilterBy: {
            property: 'value',
            value: 0,
            operator: OperatorType.notEqual
          },
          editorOptions: {
            filter: true // adds a filter on top of the multi-select dropdown
          },
          model: Slicker.Editors.multipleSelect,
        },
      },
      { id: 'start', name: 'Start', field: 'start', sortable: true },
      { id: 'finish', name: 'Finish', field: 'finish', sortable: true },
      { id: 'completed', name: 'Completed', field: 'completed', sortable: true, filterable: true, formatter: Slicker.Formatters.checkmarkMaterial },
      {
        id: 'action', name: 'Action', field: 'action', width: 110, maxWidth: 200,
        excludeFromExport: true,
        formatter: actionFormatter,
        cellMenu: {
          hideCloseButton: false,
          width: 200,
          // you can override the logic of when the menu is usable
          // for example say that we want to show a menu only when then Priority is set to 'High'.
          // Note that this ONLY overrides the usability itself NOT the text displayed in the cell,
          // if you wish to change the cell text (or hide it)
          // then you SHOULD use it in combination with a custom formatter (actionFormatter) and use the same logic in that formatter
          // menuUsabilityOverride: (args) => {
          //   return (args.dataContext.priority === 3); // option 3 is High
          // },

          commandTitle: 'Commands',
          commandItems: [
            // array of command item objects, you can also use the "positionOrder" that will be used to sort the items in the list
            {
              command: 'command2', title: 'Command 2', positionOrder: 62,
              // you can use the "action" callback and/or use "onCallback" callback from the grid options, they both have the same arguments
              action: (e, args) => {
                console.log(args.dataContext, args.column);
                // action callback.. do something
              },
              // only enable command when the task is not completed
              itemUsabilityOverride: (args) => {
                return !args.dataContext.completed;
              }
            },
            { command: 'command1', title: 'Command 1', cssClass: 'orange', positionOrder: 61 },
            {
              command: 'delete-row', title: 'Delete Row', positionOrder: 64,
              iconCssClass: 'mdi mdi-close', cssClass: 'red', textCssClass: 'bold',
              // only show command to 'Delete Row' when the task is not completed
              itemVisibilityOverride: (args) => {
                return !args.dataContext.completed;
              }
            },
            // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
            // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
            { divider: true, command: '', positionOrder: 63 },
            // 'divider',

            {
              command: 'help',
              title: 'Help',
              iconCssClass: 'mdi mdi-help-circle',
              positionOrder: 66,
            },
            { command: 'something', title: 'Disabled Command', disabled: true, positionOrder: 67, }
          ],
          optionTitle: 'Change Complete Flag',
          optionItems: [
            { option: true, title: 'True', iconCssClass: 'mdi mdi-check-box-outline' },
            { option: false, title: 'False', iconCssClass: 'mdi mdi-checkbox-blank-outline' },
          ]
        }
      },
    ];

    this.gridOptions = {
      autoEdit: true, // true single click (false for double-click)
      autoCommitEdit: true,
      editable: true,
      autoResize: {
        container: '.demo-container',
        rightPadding: 10,
        bottomPadding: 20,
        minHeight: 180,
        minWidth: 300,
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableCellNavigation: true,
      enableFiltering: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
      enableCheckboxSelector: true,
      enableRowSelection: true,
      enableSorting: true,
      alwaysShowVerticalScroll: false, // disable scroll since we don't want it to show on the left pinned columns
      frozenColumn: 2,
      frozenRow: 3,
      headerRowHeight: 50,
      rowHeight: 50,
      editCommandHandler: (item, column, editCommand) => {
        this.commandQueue.push(editCommand);
        editCommand.execute();
      },
      // when using the cellMenu, you can change some of the default options and all use some of the callback methods
      enableCellMenu: true,
      cellMenu: {
        // all the Cell Menu callback methods (except the action callback)
        // are available under the grid options as shown below
        onCommand: (e, args) => this.executeCommand(e, args),
        onOptionSelected: (e, args) => {
          // change "Completed" property with new option selected from the Cell Menu
          const dataContext = args && args.dataContext;
          if (dataContext && dataContext.hasOwnProperty('completed')) {
            dataContext.completed = args.item.option;
            this.slickgridLwc.gridService.updateItem(dataContext);
          }
        },
      },
    };

    // mock data
    this.dataset = [];
    for (let i = 0; i < 500; i++) {
      this.dataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        cost: (i % 33 === 0) ? null : Math.round(Math.random() * 10000) / 100,
        completed: (i % 5 === 0)
      };
    }
    return this.dataset;
  }

  dispose() {
    this.slickgridLwc.dispose();
  }

  handleOnClick(event) {
    console.log('onClick', event.detail);
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
    this.dataviewObj = this.slickerGridInstance && this.slickerGridInstance.dataView;
    console.log('handleOnSlickerGridCreated', this.slickerGridInstance);
  }

  executeCommand(e, args) {
    const columnDef = args.column;
    const command = args.command;
    const dataContext = args.dataContext;

    switch (command) {
      case 'command1':
        alert('Command 1');
        break;
      case 'command2':
        alert('Command 2');
        break;
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
}
