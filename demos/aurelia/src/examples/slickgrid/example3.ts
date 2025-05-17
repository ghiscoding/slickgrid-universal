import { IHttpClient } from '@aurelia/fetch-client';
import { newInstanceOf, resolve } from '@aurelia/kernel';
import { I18N } from '@aurelia/i18n';
import {
  type AureliaGridInstance,
  type AutocompleterOption,
  type Column,
  type EditCommand,
  Editors,
  type EditorValidator,
  Filters,
  Formatters,
  type GridOption,
  type OnEventArgs,
  OperatorType,
  SlickGlobalEditorLock,
  SortComparers,
  type VanillaCalendarOption,
} from 'aurelia-slickgrid';

import { CustomInputEditor } from './custom-inputEditor.js';
import { CustomInputFilter } from './custom-inputFilter.js';
import SAMPLE_COLLECTION_DATA_URL from './data/collection_100_numbers.json?url';
import COUNTRIES_COLLECTION_URL from './data/countries.json?url';
import COUNTRY_NAMES_URL from './data/country_names.json?url';
import fetchJsonp from './jsonp.js';

const NB_ITEMS = 100;

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator: EditorValidator = (value: any) => {
  // you can get the Editor Args which can be helpful, e.g. we can get the Translate Service from it
  // const grid = args && args.grid;
  // const gridOptions = grid.getOptions() as GridOption;
  // const i18n = gridOptions.i18n;

  if (value === null || value === undefined || !value.length) {
    return { valid: false, msg: 'This is a required field' };
  } else if (!/^Task\s\d+$/.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number' };
    // OR use the Translate Service with your custom message
    // return { valid: false, msg: i18n.tr('YOUR_ERROR', { x: value }) };
  }
  return { valid: true, msg: '' };
};

// create a custom Formatter to show the Task + value
const taskFormatter = (_row: number, _cell: number, value: any) => {
  if (value && Array.isArray(value)) {
    const taskValues = value.map((val) => `Task ${val}`);
    const values = taskValues.join(', ');
    return `<span title="${values}">${values}</span>`;
  }
  return '';
};

export class Example3 {
  private _commandQueue: EditCommand[] = [];
  aureliaGrid!: AureliaGridInstance;
  gridOptions!: GridOption;
  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  updatedObject: any;
  hideSubTitle = false;
  isAutoEdit = true;
  alertWarning: any;
  duplicateTitleHeaderCount = 1;

  constructor(
    readonly http: IHttpClient = resolve(newInstanceOf(IHttpClient)),
    private readonly i18n: I18N = resolve(I18N)
  ) {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  attached() {
    // populate the dataset once the grid is ready
    this.dataset = this.mockData(NB_ITEMS);
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'edit',
        field: 'id',
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromHeaderMenu: true,
        formatter: Formatters.icon,
        params: { iconCssClass: 'mdi mdi-pencil pointer' },
        minWidth: 30,
        maxWidth: 30,
        // use onCellClick OR grid.onClick.subscribe which you can see down below
        onCellClick: (_e: Event, args: OnEventArgs) => {
          console.log(args);
          this.alertWarning = `Editing: ${args.dataContext.title}`;
          this.aureliaGrid.gridService.highlightRow(args.row, 1500);
          this.aureliaGrid.gridService.setSelectedRow(args.row);
        },
      },
      {
        id: 'delete',
        field: 'id',
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromHeaderMenu: true,
        formatter: Formatters.icon,
        params: { iconCssClass: 'mdi mdi-trash-can pointer' },
        minWidth: 30,
        maxWidth: 30,
        // use onCellClick OR grid.onClick.subscribe which you can see down below
        /*
        onCellClick: (e: Event, args: OnEventArgs) => {
          console.log(args);
          this.alertWarning = `Deleting: ${args.dataContext.title}`;
        }
        */
      },
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        filterable: true,
        sortable: true,
        editor: {
          model: Editors.longText,
          placeholder: 'something',
          title: 'some title',
          validator: myCustomTitleValidator, // use a custom validator
        },
        minWidth: 100,
        onCellChange: (_e: Event, args: OnEventArgs) => {
          console.log(args);
          this.alertWarning = `Updated Title: ${args.dataContext.title}`;
        },
      },
      {
        id: 'title2',
        name: 'Title, Custom Editor',
        field: 'title',
        filterable: true,
        sortable: true,
        editor: {
          model: CustomInputEditor,
          placeholder: 'custom',
          validator: myCustomTitleValidator, // use a custom validator
        },
        filter: {
          model: CustomInputFilter,
          placeholder: '🔎︎ custom',
        },
        minWidth: 70,
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        filterable: true,
        minWidth: 100,
        sortable: true,
        type: 'number',
        filter: {
          model: Filters.slider,
          options: { hideSliderNumber: false },
        },
        editor: {
          model: Editors.slider,
          minValue: 0,
          maxValue: 100,
          // options: { hideSliderNumber: true },
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
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        filterable: true,
        formatter: Formatters.multiple,
        type: 'number',
        editor: {
          // We can also add HTML text to be rendered (any bad script will be sanitized) but we have to opt-in, else it will be sanitized
          enableRenderHtml: true,
          collection: Array.from(Array(101).keys()).map((k) => ({
            value: k,
            label: k,
            symbol: '<i class="mdi mdi-percent-outline" style="color:cadetblue"></i>',
          })),
          customStructure: {
            value: 'value',
            label: 'label',
            labelSuffix: 'symbol',
          },
          collectionSortBy: {
            property: 'label',
            sortDesc: true,
          },
          collectionFilterBy: {
            property: 'value',
            value: 0,
            operator: OperatorType.notEqual,
          },
          model: Editors.singleSelect,
          // validator: (value, args) => {
          //   if (value < 50) {
          //     return { valid: false, msg: 'Please use at least 50%' };
          //   }
          //   return { valid: true, msg: '' };
          // }
        },
        minWidth: 100,
        params: {
          formatters: [Formatters.collectionEditor, Formatters.percentCompleteBar],
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        filterable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 100,
        type: 'date',
        editor: {
          model: Editors.date,
        },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        filterable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 100,
        type: 'date', // dataset cell input format
        // outputType: 'dateUs',   // date picker format
        saveOutputType: 'dateUtc', // save output date format
        editor: {
          model: Editors.date,
          // override any of the calendar options through "options"
          options: { displayDateMin: 'today' } as VanillaCalendarOption,
        },
      },
      {
        id: 'cityOfOrigin',
        name: 'City of Origin',
        field: 'cityOfOrigin',
        filterable: true,
        sortable: true,
        minWidth: 100,
        editor: {
          model: Editors.autocompleter,
          placeholder: '🔎︎ search city',

          // We can use the autocomplete through 3 ways "collection", "collectionAsync" or with your own autocomplete options
          // use your own autocomplete options, instead of fetch-jsonp, use Aurelia HttpClient or FetchClient
          // here we use fetch-jsonp just because I'm not sure how to configure Aurelia HttpClient with JSONP and CORS
          options: {
            minLength: 3,
            forceUserInput: true,
            fetch: (searchText: string, updateCallback: (items: false | any[]) => void) => {
              /** with Aurelia Http, note this demo won't work because of CORS */
              // this.http.get(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`).subscribe(data => updateCallback(data));

              /** with JSONP will work locally but not on the GitHub demo because of CORS */
              fetchJsonp<string[]>(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`)
                .then((response: { json: () => Promise<any[]> }) => response.json())
                .then((json: any[]) => updateCallback(json))
                .catch((ex) => console.log('invalid JSONP response', ex));
            },
          } as AutocompleterOption,
        },
        filter: {
          model: Filters.autocompleter,
          // placeholder: '🔎︎ search city',

          // We can use the autocomplete through 3 ways "collection", "collectionAsync" or with your own autocomplete options
          // collectionAsync: this.http.fetch(COUNTRIES_COLLECTION_URL),

          // OR use the autocomplete through 3 ways "collection", "collectionAsync" or with your own autocomplete options
          // use your own autocomplete options, instead of fetch-jsonp, use HttpClient or FetchClient
          options: {
            minLength: 3,
            fetch: (searchText: string, updateCallback: (items: false | any[]) => void) => {
              fetchJsonp<string[]>(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`)
                .then((response: { json: () => Promise<any[]> }) => response.json())
                .then((json: any[]) => updateCallback(json))
                .catch((ex: any) => console.log('invalid JSONP response', ex));
            },
          } as AutocompleterOption,
        },
      },
      {
        id: 'countryOfOrigin',
        name: 'Country of Origin',
        field: 'countryOfOrigin',
        formatter: Formatters.complexObject,
        dataKey: 'code',
        labelKey: 'name',
        type: 'object',
        sortComparer: SortComparers.objectString,
        filterable: true,
        sortable: true,
        minWidth: 100,
        editor: {
          model: Editors.autocompleter,
          customStructure: { label: 'name', value: 'code' },
          collectionAsync: this.http.fetch(COUNTRIES_COLLECTION_URL),
        },
        filter: {
          model: Filters.autocompleter,
          customStructure: { label: 'name', value: 'code' },
          collectionAsync: this.http.fetch(COUNTRIES_COLLECTION_URL),
        },
      },
      {
        id: 'countryOfOriginName',
        name: 'Country of Origin Name',
        field: 'countryOfOriginName',
        filterable: true,
        sortable: true,
        minWidth: 100,
        editor: {
          model: Editors.autocompleter,
          collectionAsync: this.http.fetch(COUNTRY_NAMES_URL),
        },
        filter: {
          model: Filters.autocompleter,
          collectionAsync: this.http.fetch(COUNTRY_NAMES_URL),
        },
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        filterable: true,
        type: 'boolean',
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
        },
        formatter: Formatters.checkmarkMaterial,
        editor: {
          model: Editors.checkbox,
        },
        minWidth: 70,
      },
      {
        id: 'prerequisites',
        name: 'Prerequisites',
        field: 'prerequisites',
        filterable: true,
        formatter: taskFormatter,
        exportWithFormatter: true,
        sanitizeDataExport: true,
        minWidth: 100,
        sortable: true,
        editor: {
          // We can load the "collection" asynchronously (on first load only, after that we will simply use "collection")
          // 3 ways are supported (aurelia-http-client, aurelia-fetch-client OR even Promise)

          // 1- USE HttpClient from "aurelia-http-client" to load collection asynchronously
          // collectionAsync: this.http.createRequest(SAMPLE_COLLECTION_DATA_URL).asGet().send(),

          // OR 2- use "aurelia-fetch-client", they are both supported
          collectionAsync: this.http.fetch(SAMPLE_COLLECTION_DATA_URL),

          // OR 3- use a Promise
          // collectionAsync: new Promise<any>((resolve) => {
          //   window.setTimeout(() => {
          //     resolve(Array.from(Array(NB_ITEMS).keys()).map(k => ({ value: k, label: k, prefix: 'Task', suffix: 'days' })));
          //   }, 500);
          // }),

          // OR a regular "collection" load
          // collection: Array.from(Array(NB_ITEMS).keys()).map(k => ({ value: k, label: k, prefix: 'Task', suffix: 'days' })),
          collectionSortBy: {
            property: 'value',
            sortDesc: true,
            fieldType: 'number',
          },
          customStructure: {
            label: 'label',
            value: 'value',
            labelPrefix: 'prefix',
          },
          collectionOptions: {
            separatorBetweenTextLabels: ' ',
          },
          model: Editors.multipleSelect,
        },
        filter: {
          collectionAsync: this.http.fetch(SAMPLE_COLLECTION_DATA_URL),
          // collectionAsync: new Promise((resolve) => {
          //   window.setTimeout(() => {
          //     resolve(Array.from(Array(this.dataset.length).keys()).map(k => ({ value: k, label: `Task ${k}` })));
          //   });
          // }),

          // OR a regular collection load
          // collection: Array.from(Array(NB_ITEMS).keys()).map(k => ({ value: k, label: k, prefix: 'Task', suffix: 'days' })),
          collectionSortBy: {
            property: 'value',
            sortDesc: true,
            fieldType: 'number',
          },
          customStructure: {
            label: 'label',
            value: 'value',
            labelPrefix: 'prefix',
          },
          collectionOptions: {
            separatorBetweenTextLabels: ' ',
          },
          model: Filters.multipleSelect,
          operator: OperatorType.inContains,
        },
      },
    ];

    this.gridOptions = {
      autoEdit: this.isAutoEdit,
      autoCommitEdit: false,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      editable: true,
      enableCellNavigation: true,
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      editCommandHandler: (_item, _column, editCommand) => {
        this._commandQueue.push(editCommand);
        editCommand.execute();
      },
      i18n: this.i18n,
    };
  }

  /** Add a new row to the grid and refresh the Filter collection */
  addItem() {
    const lastRowIndex = this.dataset.length;
    const newRows = this.mockData(1, lastRowIndex);

    // wrap into a timer to simulate a backend async call
    window.setTimeout(() => {
      // at any time, we can poke the "collection" property and modify it
      const requisiteColumnDef = this.columnDefinitions.find((column: Column) => column.id === 'prerequisites');
      if (requisiteColumnDef) {
        const collectionEditor = requisiteColumnDef.editor!.collection;
        const collectionFilter = requisiteColumnDef.filter!.collection;

        if (Array.isArray(collectionEditor) && Array.isArray(collectionFilter)) {
          // add the new row to the grid
          this.aureliaGrid.gridService.addItem(newRows[0], { highlightRow: false });

          // then refresh the Editor/Filter "collection", we have 2 ways of doing it

          // 1- push to the "collection"
          collectionEditor.push({ value: lastRowIndex, label: lastRowIndex, prefix: 'Task', suffix: 'days' });
          collectionFilter.push({ value: lastRowIndex, label: lastRowIndex, prefix: 'Task', suffix: 'days' });

          // OR 2- replace the entire "collection" is also supported
          // requisiteColumnDef.filter.collection = [...collection, ...[{ value: lastRowIndex, label: lastRowIndex }]];
          // requisiteColumnDef.editor.collection = [...collection, ...[{ value: lastRowIndex, label: lastRowIndex }]];
        }
      }
    }, 250);
  }

  /** Delete last inserted row */
  deleteItem() {
    const requisiteColumnDef = this.columnDefinitions.find((column: Column) => column.id === 'prerequisites');
    if (requisiteColumnDef) {
      const collectionEditor = requisiteColumnDef.editor!.collection;
      const collectionFilter = requisiteColumnDef.filter!.collection;

      if (Array.isArray(collectionEditor) && Array.isArray(collectionFilter)) {
        // sort collection in descending order and take out last option from the collection
        const selectCollectionObj = this.sortCollectionDescending(collectionEditor).pop();
        this.sortCollectionDescending(collectionFilter).pop();
        this.aureliaGrid.gridService.deleteItemById(selectCollectionObj.value);
      }
    }
  }

  sortCollectionDescending(collection: any[]) {
    return collection.sort((item1, item2) => item1.value - item2.value);
  }

  mockData(itemCount: number, startingIndex = 0) {
    // mock a dataset
    const tempDataset: any[] = [];
    for (let i = startingIndex; i < startingIndex + itemCount; i++) {
      const randomYear = 2000 + this.randomBetween(4, 15);
      const randomFinishYear = new Date().getFullYear() - 3 + Math.floor(Math.random() * 10); // use only years not lower than 3 years ago
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomFinish = new Date(randomFinishYear, randomMonth + 1, randomDay);

      tempDataset.push({
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: randomFinish < new Date() ? '' : randomFinish, // make sure the random date is earlier than today
        effortDriven: i % 5 === 0,
        prerequisites: i % 2 === 0 && i !== 0 && i < 12 ? [i, i - 1] : [],
        countryOfOrigin: i % 2 ? { code: 'CA', name: 'Canada' } : { code: 'US', name: 'United States' },
        countryOfOriginName: i % 2 ? 'Canada' : 'United States',
        cityOfOrigin: i % 2 ? 'Vancouver, BC, Canada' : 'Boston, MA, United States',
      });
    }
    return tempDataset;
  }

  randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  onCellChanged(_e: Event, args: any) {
    console.log('onCellChange', args);
    this.updatedObject = { ...args.item };
  }

  onCellClicked(_e: Event, args: any) {
    const metadata = this.aureliaGrid.gridService.getColumnFromEventArguments(args);
    console.log(metadata);

    if (metadata.columnDef.id === 'edit') {
      this.alertWarning = `open a modal window to edit: ${metadata.dataContext.title}`;

      // highlight the row, to customize the color, you can change the SASS variable $row-highlight-background-color
      this.aureliaGrid.gridService.highlightRow(args.row, 1500);

      // you could also select the row, when using "enableCellNavigation: true", it automatically selects the row
      // this.aureliaGrid.gridService.setSelectedRow(args.row);
    } else if (metadata.columnDef.id === 'delete') {
      if (confirm('Are you sure?')) {
        this.aureliaGrid.gridService.deleteItemById(metadata.dataContext.id);
        this.alertWarning = `Deleted: ${metadata.dataContext.title}`;
      }
    }
  }

  onCellValidationError(_e: Event, args: any) {
    if (args.validationResults) {
      alert(args.validationResults.msg);
    }
  }

  changeAutoCommit() {
    this.gridOptions.autoCommitEdit = !this.gridOptions.autoCommitEdit;
    this.aureliaGrid.slickGrid.setOptions({
      autoCommitEdit: this.gridOptions.autoCommitEdit,
    });
    return true;
  }

  dynamicallyAddTitleHeader() {
    const newCol = {
      id: `title${this.duplicateTitleHeaderCount++}`,
      name: 'Title',
      field: 'title',
      editor: {
        model: Editors.text,
        required: true,
        validator: myCustomTitleValidator, // use a custom validator
      },
      sortable: true,
      minWidth: 100,
      filterable: true,
    };

    // you can dynamically add your column to your column definitions
    // and then use the spread operator [...cols] OR slice to force Aurelia to review the changes
    this.columnDefinitions.push(newCol);

    // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
    // you MUST use "getAllColumnDefinitions()" from the GridService, using this will be ALL columns including the 1st column that is created internally
    // for example if you use the Checkbox Selector (row selection), you MUST use the code below
    /*
    const allColumns = this.aureliaGrid.gridService.getAllColumnDefinitions();
    allColumns.push(newCol);
    this.columnDefinitions = [...allColumns]; // (or use slice) reassign to column definitions for Aurelia to do dirty checking
    */
  }

  dynamicallyRemoveLastColumn() {
    this.columnDefinitions.pop();

    /*
    // remove your column the full set of columns
    // and use slice or spread [...] to trigger an Aurelia dirty change
    allOriginalColumns.pop();
    */
  }

  setAutoEdit(isAutoEdit: boolean) {
    this.isAutoEdit = isAutoEdit;
    this.aureliaGrid.slickGrid.setOptions({
      autoEdit: isAutoEdit,
    });
    return true;
  }

  undo() {
    const command = this._commandQueue.pop();
    if (command && SlickGlobalEditorLock.cancelCurrentEdit()) {
      command.undo();
      this.aureliaGrid.slickGrid.gotoCell(command.row, command.cell, false);
    }
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
