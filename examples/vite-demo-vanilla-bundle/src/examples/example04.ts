import {
  type AutocompleterOption,
  type Column,
  type ColumnEditorDualInput,
  type EditCommand,
  Editors,
  FieldType,
  Filters,
  type Formatter,
  Formatters,
  type GridOption,
  OperatorType,
  type SlickDataView,
  type SlickCheckboxSelectColumn,
} from '@slickgrid-universal/common';
import { BindingEventService } from '@slickgrid-universal/binding';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import fetchJsonp from 'fetch-jsonp';
// import { fetch } from 'whatwg-fetch';

import { ExampleGridOptions } from './example-grid-options';
import './example04.scss';

// const URL_COUNTRIES_COLLECTION = 'assets/data/countries.json';
// const URL_COUNTRY_NAMES_COLLECTION = 'assets/data/country_names.json';

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator = (value) => {
  if (value === null || value === undefined || !value.length) {
    return { valid: false, msg: 'This is a required field' };
  } else if (!/^Task\s\d+$/.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number' };
  }
  return { valid: true, msg: '' };
};

interface ReportItem {
  title: string;
  duration: number;
  cost: number;
  percentComplete: number;
  start: Date;
  finish: Date;
  completed: boolean;
  cityOfOrigin: string;
  effortDriven: boolean;
}

const customEditableInputFormatter: Formatter<ReportItem> = (_row, _cell, _value, _columnDef, item) => {
  return item.title;
};

export default class Example04 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column<ReportItem & { action?: string; }>[];
  gridOptions: GridOption;
  dataset: any[];
  dataViewObj: SlickDataView;
  commandQueue: EditCommand[] = [];
  frozenColumnCount = 2;
  frozenRowCount = 3;
  isFrozenBottom = false;
  sgb: SlickVanillaGridBundle;
  checkboxSelectorInstance: SlickCheckboxSelectColumn;
  isSelectAllShownAsColumnTitle = false;

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    const dataset = this.initializeGrid();
    const gridContainerElm = document.querySelector(`.grid4`) as HTMLDivElement;

    // this._bindingEventService.bind(gridContainerElm, 'onclick', handleOnClick);
    this._bindingEventService.bind(gridContainerElm, 'onvalidationerror', this.handleOnValidationError.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onitemdeleted', this.handleOnItemDeleted.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, dataset);
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
  }

  initializeGrid() {
    // the columns field property is type-safe, try to add a different string not representing one of DataItems properties
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string,
        editor: {
          model: Editors.longText,
          required: true,
          alwaysSaveOnEnterKey: true,
          validator: myCustomTitleValidator, // use a custom validator
        },
        formatter: customEditableInputFormatter,
        filterable: true,
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete', sortable: true,
        filterable: true,
        type: FieldType.number,
        editor: {
          // We can also add HTML text to be rendered (any bad script will be sanitized) but we have to opt-in, else it will be sanitized
          enableRenderHtml: true,
          // collection: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }],
          collection: Array.from(Array(101).keys()).map(k => ({ value: k, label: k, symbol: '<i class="mdi mdi-percent-outline text-color-info"></i>' })),
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
          // collectionOverride: (updatedCollection, args) => {
          //   console.log(args);
          //   return updatedCollection.filter((col) => args.dataContext.id % 2 ? col.value < 50 : col.value >= 50);
          // },
          editorOptions: {
            filter: true // adds a filter on top of the multi-select dropdown
          },
          model: Editors.singleSelect,
        },
      },
      {
        id: 'start', name: 'Start', field: 'start', minWidth: 60,
        type: FieldType.dateIso, filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
      },
      {
        id: 'finish', name: 'Finish', field: 'finish', minWidth: 60,
        type: FieldType.dateIso, filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
      },
      {
        id: 'completed', name: 'Completed', field: 'completed', sortable: true, formatter: Slicker.Formatters.checkmarkMaterial,
        exportWithFormatter: false,
        filterable: true,
        editor: {
          model: Editors.checkbox,
        },
        filter: {
          model: Filters.singleSelect,
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
        }
      },
      {
        id: 'cost', name: 'Cost | Duration', field: 'cost',
        formatter: this.costDurationFormatter.bind(this),
        sortable: true,
        // filterable: true,
        filter: {
          model: Filters.compoundSlider,
        },
        editor: {
          model: Editors.dualInput,
          // the DualInputEditor is of Type ColumnEditorDualInput and MUST include (leftInput/rightInput) in its params object
          // in each of these 2 properties, you can pass any regular properties of a column editor
          // and they will be executed following the options defined in each
          params: {
            leftInput: {
              field: 'cost',
              type: 'float',
              decimal: 2,
              minValue: 0,
              maxValue: 50000,
              placeholder: '< 50K',
              errorMessage: 'Cost must be positive and below $50K.',
            },
            rightInput: {
              field: 'duration',
              type: 'float', // you could have 2 different input type as well
              minValue: 0,
              maxValue: 100,
              title: 'make sure Duration is withing its range of 0 to 100',
              errorMessage: 'Duration must be between 0 and 100.',

              // Validator Option #1
              // You could also optionally define a custom validator in 1 or both inputs
              /*
              validator: (value, args) => {
                let isValid = true;
                let errorMsg = '';
                if (value < 0 || value > 120) {
                  isValid = false;
                  errorMsg = 'Duration MUST be between 0 and 120.';
                }
                return { valid: isValid, msg: errorMsg };
              }
              */
            },
          } as ColumnEditorDualInput,

          // Validator Option #2 (shared Validator) - this is the last alternative, option #1 (independent Validators) is still the recommended way
          // You can also optionally use a common Validator (if you do then you cannot use the leftInput/rightInput validators at same time)
          // to compare both values at the same time.
          /*
          validator: (values, args) => {
            let isValid = true;
            let errorMsg = '';
            if (values.cost < 0 || values.cost > 50000) {
              isValid = false;
              errorMsg = 'Cost MUST be between 0 and 50k.';
            }
            if (values.duration < 0 || values.duration > 120) {
              isValid = false;
              errorMsg = 'Duration MUST be between 0 and 120.';
            }
            if (values.cost < values.duration) {
              isValid = false;
              errorMsg = 'Cost can never be lower than its Duration.';
            }
            return { valid: isValid, msg: errorMsg };
          }
          */
        }
      },
      {
        id: 'cityOfOrigin', name: 'City of Origin', field: 'cityOfOrigin',
        filterable: true,
        sortable: true,
        minWidth: 100,
        // formatter: (_, __, val) => typeof val === 'string' ? val : val.name,
        // editor: {
        //   model: Editors.autocompleter,
        //   // collectionAsync: fetch(URL_COUNTRY_NAMES_COLLECTION),
        //   placeholder: '🔎︎ search country',
        //   customStructure: { label: 'name', value: 'code' },
        //   // collectionAsync: fetch(URL_COUNTRIES_COLLECTION),

        //   enableRenderHtml: true,
        //   collection: [{ code: true, name: 'True', labelPrefix: `<i class="mdi mdi-pin-outline"></i> ` }, { code: false, name: 'False', labelSuffix: '<i class="mdi mdi-close"></i>' }],
        //   editorOptions: { minLength: 1 }
        // },
        editor: {
          model: Editors.autocompleter,
          placeholder: '🔎︎ search city',

          // We can use the autocomplete through 3 ways "collection", "collectionAsync" or with your own autocomplete options
          // use your own autocomplete options, instead of fetch-jsonp, use HttpClient or FetchClient
          editorOptions: {
            minLength: 3,
            fetch: (searchText, updateCallback) => {
              fetchJsonp(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`)
                .then((response) => response.json())
                .then((json) => updateCallback(json))
                .catch((ex) => console.log('invalid JSONP response', ex));
            },
          } as AutocompleterOption,
        },
        // filter: {
        //   model: Filters.autocompleter,
        //   // collectionAsync: fetch(URL_COUNTRY_NAMES_COLLECTION),
        //   placeholder: '🔎︎ search country',
        //   customStructure: { label: 'name', value: 'code' },
        //   collectionAsync: fetch(URL_COUNTRIES_COLLECTION),

        //   // enableRenderHtml: true,
        //   // collection: [{ code: true, name: 'True', labelPrefix: `<i class="mdi mdi-pin-outline"></i> ` }, { code: false, name: 'False', labelSuffix: '<i class="mdi mdi-close"></i>' }],
        //   // filterOptions: { minLength: 1 }
        // },
        filter: {
          model: Filters.autocompleter,
          // placeholder: '🔎︎ search city',
          // customStructure: { label: 'name', value: 'code' },

          // We can use the autocomplete through 3 ways "collection", "collectionAsync" or with your own autocomplete options
          // collectionAsync: fetch(URL_COUNTRIES_COLLECTION),

          // OR use your own autocomplete options, instead of fetchJsonp, use HttpClient or FetchClient
          // here we use fetchJsonp just because I'm not sure how to configure HttpClient with JSONP and CORS
          filterOptions: {
            minLength: 3,
            fetch: (searchText, updateCallback) => {
              fetchJsonp(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`)
                .then((response) => response.json())
                .then((json) => updateCallback(json))
                .catch((ex) => console.log('invalid JSONP response', ex));
            },
          } as AutocompleterOption,
        }
      },
      {
        id: 'action', name: 'Action', field: 'action', width: 100, maxWidth: 100,
        excludeFromExport: true,
        formatter: () => {
          return `<div class="fake-hyperlink">Action <span class="font-12px">&#9660;</span></div>`;
        },
        cellMenu: {
          hideCloseButton: false,
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
              action: (_e, args) => {
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

            { command: 'help', title: 'Help', iconCssClass: 'mdi mdi-help-circle', positionOrder: 66, },
            { command: 'something', title: 'Disabled Command', disabled: true, positionOrder: 67, },
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
      },
      enableAutoTooltip: true,
      autoTooltipOptions: {
        enableForHeaderCells: true
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true
      },
      externalResources: [new ExcelExportService()],
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInColumnTitleRow: !this.isSelectAllShownAsColumnTitle,
        hideInFilterHeaderRow: this.isSelectAllShownAsColumnTitle,
        name: 'Sel', // column name will only show when `hideInColumnTitleRow` is true
        onExtensionRegistered: (instance) => this.checkboxSelectorInstance = instance,
      },
      enableRowSelection: true,
      frozenColumn: this.frozenColumnCount,
      frozenRow: this.frozenRowCount,
      // frozenBottom: true, // if you want to freeze the bottom instead of the top, you can enable this property
      editCommandHandler: (_item, _column, editCommand) => {
        this.commandQueue.push(editCommand);
        editCommand.execute();
      },
      // when using the cellMenu, you can change some of the default options and all use some of the callback methods
      enableCellMenu: true,
      cellMenu: {
        subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
        // all the Cell Menu callback methods (except the action callback)
        // are available under the grid options as shown below
        onCommand: (e, args) => this.executeCommand(e, args),
        onOptionSelected: (_e, args) => {
          // change "Completed" property with new option selected from the Cell Menu
          const dataContext = args?.dataContext;
          if (dataContext && dataContext.hasOwnProperty('completed')) {
            dataContext.completed = args.item.option;
            this.sgb?.gridService.updateItem(dataContext);
          }
        },
      },
      gridMenu: { hideClearFrozenColumnsCommand: false },
      headerMenu: { hideFreezeColumnsCommand: false },
      enableContextMenu: true,
      contextMenu: {
        optionShownOverColumnIds: ['percentComplete'],
        subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
        hideCloseButton: true,
        optionTitle: 'Change Percent Complete',
        onOptionSelected: (_e, args) => {
          // e.preventDefault(); // you could do if you wish to keep the menu open
          const dataContext = args?.dataContext;

          // change Priority
          if (dataContext?.hasOwnProperty('percentComplete')) {
            dataContext.percentComplete = args.item.option;
            this.sgb.slickGrid?.updateRow(args.row || 0);
          }
        },
        optionItems: [
          { option: 0, iconCssClass: 'mdi mdi-checkbox-blank-outline text-color-secondary', title: 'Not Started (0%)' },
          { option: 50, iconCssClass: 'mdi mdi-flip-vertical', title: 'Half Completed (50%)' },
          { option: 100, iconCssClass: 'mdi mdi-checkbox-marked text-color-success', title: 'Completed (100%)' },
          'divider',
          {
            // we can also have multiple nested sub-menus
            option: null, title: 'Sub-Options (demo)', subMenuTitle: 'Set Percent Complete', optionItems: [
              { option: 0, iconCssClass: 'mdi mdi-checkbox-blank-outline text-color-secondary', title: 'Not Started (0%)' },
              { option: 50, iconCssClass: 'mdi mdi-flip-vertical', title: 'Half Completed (50%)' },
              { option: 100, iconCssClass: 'mdi mdi-checkbox-marked text-color-success', title: 'Completed (100%)' },
            ]
          }
        ],
        commandItems: [
          { command: '', divider: true, positionOrder: 98 },
          {
            // we can also have multiple nested sub-menus
            command: 'export', title: 'Exports', iconCssClass: 'mdi mdi-download', positionOrder: 99,
            commandItems: [
              { command: 'exports-txt', title: 'Text (tab delimited)' },
              {
                command: 'sub-menu', title: 'Excel', cssClass: 'green', subMenuTitle: 'available formats', subMenuTitleCssClass: 'text-italic orange',
                commandItems: [
                  { command: 'exports-csv', title: 'Excel (csv)' },
                  { command: 'exports-xlsx', title: 'Excel (xlsx)' },
                ]
              }
            ]
          },
          {
            command: 'feedback', title: 'Feedback', iconCssClass: 'mdi mdi-information-outline', positionOrder: 100,
            commandItems: [
              { command: 'request-update', title: 'Request update from supplier', iconCssClass: 'mdi mdi-star', tooltip: 'this will automatically send an alert to the shipping team to contact the user for an update' },
              'divider',
              {
                command: 'sub-menu', title: 'Contact Us', iconCssClass: 'mdi mdi-account', subMenuTitle: 'contact us...', subMenuTitleCssClass: 'italic',
                commandItems: [
                  { command: 'contact-email', title: 'Email us', iconCssClass: 'mdi mdi-pencil-outline' },
                  { command: 'contact-chat', title: 'Chat with us', iconCssClass: 'mdi mdi-message-text-outline' },
                  { command: 'contact-meeting', title: 'Book an appointment', iconCssClass: 'mdi mdi-coffee' },
                ]
              }
            ]
          }
        ],
        onCommand: (e, args) => this.executeCommand(e, args)
      },
    };

    // mock data
    this.dataset = [];
    for (let i = 0; i < 500; i++) {
      this.dataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: i % 8 ? (Math.round(Math.random() * 100) + '') : null,
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(2009, 0, 1),
        finish: new Date(2009, 4, 5),
        cost: (i % 33 === 0) ? null : Math.random() * 10000,
        completed: (i % 5 === 0),
        cityOfOrigin: (i % 2) ? 'Vancouver, BC, Canada' : 'Boston, MA, United States',
      };
    }
    return this.dataset;
  }

  costDurationFormatter(_row, _cell, _value, _columnDef, dataContext) {
    const costText = this.isNullUndefinedOrEmpty(dataContext.cost) ? 'n/a' : Slicker.Utilities.formatNumber(dataContext.cost, 0, 2, false, '$', '', '.', ',');
    let durationText = 'n/a';
    if (!this.isNullUndefinedOrEmpty(dataContext.duration) && dataContext.duration >= 0) {
      durationText = `${dataContext.duration} ${dataContext.duration > 1 ? 'days' : 'day'}`;
    }
    return `<b>${costText}</b> | ${durationText}`;
  }

  isNullUndefinedOrEmpty(data: any) {
    return (data === '' || data === null || data === undefined);
  }

  handleOnClick(event) {
    console.log('onClick', event.detail);
  }

  handleOnValidationError(event) {
    console.log('handleOnValidationError', event.detail);
    const args = event.detail && event.detail.args;
    if (args.validationResults) {
      alert(args.validationResults.msg);
      return false;
    }
  }

  handleOnItemDeleted(event) {
    const itemId = event && event.detail;
    console.log('item deleted with id:', itemId);
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
  changeFrozenColumnCount() {
    if (this.sgb?.slickGrid && this.sgb?.slickGrid.setOptions) {
      this.sgb?.slickGrid.setOptions({
        frozenColumn: +this.frozenColumnCount
      });
    }
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
  changeFrozenRowCount() {
    if (this.sgb?.slickGrid && this.sgb?.slickGrid.setOptions) {
      this.sgb?.slickGrid.setOptions({
        frozenRow: +this.frozenRowCount
      });
    }
  }

  setFrozenColumns(frozenCols: number) {
    this.sgb?.slickGrid?.setOptions({ frozenColumn: frozenCols, alwaysShowVerticalScroll: false });
    this.gridOptions = this.sgb?.slickGrid?.getOptions() ?? {};
  }

  /** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
  toggleFrozenBottomRows() {
    if (this.sgb?.slickGrid && this.sgb?.slickGrid.setOptions) {
      this.sgb?.slickGrid.setOptions({
        frozenBottom: !this.isFrozenBottom
      });
      this.isFrozenBottom = !this.isFrozenBottom; // toggle the variable
    }
  }

  toggleWhichRowToShowSelectAll() {
    this.isSelectAllShownAsColumnTitle = !this.isSelectAllShownAsColumnTitle;
    this.checkboxSelectorInstance.setOptions({
      hideInColumnTitleRow: !this.isSelectAllShownAsColumnTitle,
      hideInFilterHeaderRow: this.isSelectAllShownAsColumnTitle,
    });
  }

  executeCommand(_e, args) {
    // const columnDef = args.column;
    const command = args.command;
    const dataContext = args.dataContext;

    switch (command) {
      case 'command1':
      case 'command2':
        alert(args.item.title);
        break;
      case 'exports-csv':
      case 'exports-txt':
      case 'exports-xlsx':
        alert(`Exporting as ${args.item.title}`);
        break;
      case 'help':
        alert('Please help!');
        break;
      case 'delete-row':
        if (confirm(`Do you really want to delete row (${args.row + 1}) with "${dataContext.title}"?`)) {
          this.sgb?.gridService.deleteItemById(dataContext.id);
        }
        break;
      default:
        alert('Command: ' + args.command);
        break;
    }
  }
}