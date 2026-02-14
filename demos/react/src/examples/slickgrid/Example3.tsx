import i18next from 'i18next';
import { useState } from 'react';
import {
  Editors,
  Filters,
  Formatters,
  SlickGlobalEditorLock,
  SlickgridReact,
  SortComparers,
  type AutocompleterOption,
  type Column,
  type EditCommand,
  type EditorValidator,
  type GridOption,
  type OnEventArgs,
  type SlickgridReactInstance,
  type SliderOption,
  type VanillaCalendarOption,
} from 'slickgrid-react';
import { CustomInputEditor } from './custom-inputEditor.js';
import { CustomInputFilter } from './custom-inputFilter.js';
import SAMPLE_COLLECTION_DATA from './data/collection_100_numbers.json';
import SAMPLE_COLLECTION_DATA_URL from './data/collection_100_numbers.json?url';
import COUNTRIES_COLLECTION from './data/countries.json';
import COUNTRY_NAMES from './data/country_names.json';
import fetchJsonp from './jsonp.js';

const NB_ITEMS = 100;

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator: EditorValidator = (value: any) => {
  // you can get the Editor Args which can be helpful, e.g. we can get the Translate Service from it
  // const grid = args?.grid;
  // const gridOptions = grid.getOptions() as GridOption;
  // const i18n = gridOptions.i18n;

  if (value === null || value === undefined || !value.length) {
    return { valid: false, msg: 'This is a required field' };
  } else if (!/^Task\s\d+$/.test(value)) {
    return {
      valid: false,
      msg: 'Your title is invalid, it must start with "Task" followed by a number',
    };
    // OR use the Translate Service with your custom message
    // return { valid: false, msg: i18n.t('YOUR_ERROR', { x: value }) };
  }
  return { valid: true, msg: '' };
};

// create a custom Formatter to show the Task + value
const taskFormatter = (_row: number, _cell: number, value: any) => {
  if (value && Array.isArray(value)) {
    const taskValues = value.map((val) => `Task ${val}`);
    const values = taskValues.join(', ');
    return `<span title='${values}'>${values}</span>`;
  }
  return '';
};

const Example3: React.FC = () => {
  const [duplicateTitleHeaderCount, setDuplicateTitleHeaderCount] = useState(1);
  const [commandQueue] = useState<EditCommand[]>([]);
  const [isAutoEdit, setIsAutoEdit] = useState(true);
  const [updatedObject, setUpdatedObject] = useState<any>();
  const [alertWarning, setAlertWarning] = useState('');
  const [dataset] = useState(getData(NB_ITEMS));
  const [reactGrid, setReactGrid] = useState<SlickgridReactInstance>();
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([
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
      onCellClick: (_e: any, args: OnEventArgs) => {
        console.log(args);
        setAlertWarning(`Editing: ${args.dataContext.title}`);
        reactGrid?.gridService.highlightRow(args.row, 1500);
        reactGrid?.gridService.setSelectedRow(args.row);
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
        alertWarning = `Deleting: ${args.dataContext.title}`;
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
        setAlertWarning(`Updated Title: ${args.dataContext.title}`);
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
        options: { hideSliderNumber: false } as SliderOption,
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
        // however if you pass the 'decimalPlaces', it will validate with that maximum
        model: Editors.float,
        minValue: 0,
        maxValue: 365,
        // the default validation error message is in English but you can override it by using 'errorMessage'
        // errorMessage: i18next.t('INVALID_FLOAT', { maxDecimal: 2 }),
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
          symbol: '<i className="mdi mdi-percent-outline" style="color:cadetblue"></i>',
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
          operator: '!=',
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
        // override any of the calendar options through 'options'
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

        // We can use the autocomplete through 3 ways 'collection', 'collectionAsync' or with your own autocomplete options
        // use your own autocomplete options, instead of fetch-jsonp, use React HttpClient or FetchClient
        // here we use fetch-jsonp just because I'm not sure how to configure React HttpClient with JSONP and CORS
        options: {
          minLength: 3,
          forceUserInput: true,
          fetch: (searchText: string, updateCallback: (items: false | any[]) => void) => {
            /** with React Http, note this demo won't work because of CORS */
            // http.get(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`).subscribe(data => updateCallback(data));

            /** with JSONP AJAX will work locally but not on the GitHub demo because of CORS */
            fetchJsonp<string[]>(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`)
              .then((response) => response.json())
              .then((json) => updateCallback(json))
              .catch((ex) => console.log('invalid JSONP response', ex));
          },
        } as AutocompleterOption,
      },
      filter: {
        model: Filters.autocompleter,
        // placeholder: '🔎︎ search city',

        // We can use the autocomplete through 3 ways 'collection', 'collectionAsync' or with your own autocomplete options
        // collectionAsync: httpFetch.fetch(COUNTRIES_COLLECTION_URL),

        // OR use your own autocomplete options, instead of fetch-jsonp, use React HttpClient or FetchClient
        // here we use fetch-jsonp just because I'm not sure how to configure React HttpClient with JSONP and CORS
        options: {
          minLength: 3,
          fetch: (searchText: string, updateCallback: (items: false | any[]) => void) => {
            /** with React Http, note this demo won't work because of CORS */
            // http.get(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`).subscribe(data => updateCallback(data));

            /** with JSONP will work locally but not on the GitHub demo because of CORS */
            fetchJsonp<string[]>(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`)
              .then((response) => response.json())
              .then((json) => updateCallback(json))
              .catch((ex) => console.log('invalid JSONP response', ex));
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
        collectionAsync: Promise.resolve(COUNTRIES_COLLECTION),
      },
      filter: {
        model: Filters.autocompleter,
        customStructure: { label: 'name', value: 'code' },
        collectionAsync: Promise.resolve(COUNTRIES_COLLECTION),
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
        collectionAsync: Promise.resolve(COUNTRY_NAMES),
      },
      filter: {
        model: Filters.autocompleter,
        collectionAsync: Promise.resolve(COUNTRY_NAMES),
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
        // We can load the 'collection' asynchronously (on first load only, after that we will simply use 'collection')
        // 3 ways are supported (fetch, Promise or RxJS when available)

        // 1- use `fetch`
        // collectionAsync: fetch(SAMPLE_COLLECTION_DATA_URL),

        // OR 2- use a Promise
        collectionAsync: Promise.resolve(SAMPLE_COLLECTION_DATA),

        // OR a regular 'collection' load
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
        collectionAsync: fetch(SAMPLE_COLLECTION_DATA_URL),
        // collectionAsync: Promise.resolve(SAMPLE_COLLECTION_DATA),
        // collectionAsync: new Promise((resolve) => {
        //   setTimeout(() => {
        //     resolve(Array.from(Array(dataset.length).keys()).map(k => ({ value: k, label: `Task ${k}` })));
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
        operator: 'IN_CONTAINS',
      },
    },
  ]);

  const gridOptions: GridOption = {
    autoEdit: isAutoEdit,
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
      commandQueue.push(editCommand);
      editCommand.execute();
    },
    i18n: i18next,
  };

  /** Add a new row to the grid and refresh the Filter collection */
  function addItem() {
    const lastRowIndex = dataset?.length;
    const newRows = getData(1, lastRowIndex);

    // wrap into a timer to simulate a backend async call
    setTimeout(() => {
      // at any time, we can poke the 'collection' property and modify it
      const requisiteColumnDef = columnDefinitions?.find((column: Column) => column.id === 'prerequisites');
      if (requisiteColumnDef) {
        const collectionEditor = requisiteColumnDef.editor!.collection;
        const collectionFilter = requisiteColumnDef.filter!.collection;

        if (Array.isArray(collectionEditor) && Array.isArray(collectionFilter)) {
          // add the new row to the grid
          reactGrid?.gridService.addItem(newRows[0], {
            highlightRow: false,
          });

          // then refresh the Editor/Filter 'collection', we have 2 ways of doing it

          // 1- push to the 'collection'
          collectionEditor.push({
            value: lastRowIndex,
            label: lastRowIndex,
            prefix: 'Task',
            suffix: 'days',
          });
          collectionFilter.push({
            value: lastRowIndex,
            label: lastRowIndex,
            prefix: 'Task',
            suffix: 'days',
          });

          // OR 2- replace the entire 'collection' is also supported
          // requisiteColumnDef.filter.collection = [...collection, ...[{ value: lastRowIndex, label: lastRowIndex }]];
          // requisiteColumnDef.editor.collection = [...collection, ...[{ value: lastRowIndex, label: lastRowIndex }]];
        }
      }
    }, 250);
  }

  /** Delete last inserted row */
  function deleteItem() {
    const requisiteColumnDef = columnDefinitions?.find((column: Column) => column.id === 'prerequisites');
    if (requisiteColumnDef) {
      const collectionEditor = requisiteColumnDef.editor!.collection;
      const collectionFilter = requisiteColumnDef.filter!.collection;

      if (Array.isArray(collectionEditor) && Array.isArray(collectionFilter)) {
        // sort collection in descending order and take out last option from the collection
        const selectCollectionObj = sortCollectionDescending(collectionEditor).pop();
        sortCollectionDescending(collectionFilter).pop();
        reactGrid?.gridService.deleteItemById(selectCollectionObj.value);
      }
    }
  }

  function sortCollectionDescending(collection: any[]) {
    return collection.sort((item1, item2) => item1.value - item2.value);
  }

  function getData(itemCount: number, startingIndex = 0) {
    // mock a dataset
    const tempDataset: any[] = [];
    for (let i = startingIndex; i < startingIndex + itemCount; i++) {
      const randomYear = 2000 + randomBetween(4, 15);
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

  function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function onCellChanged(_e: Event, args: any) {
    console.log('onCellChange', args);
    setUpdatedObject({ ...args.item });
  }

  function onCellClicked(_e: Event, args: any) {
    const metadata = reactGrid?.gridService.getColumnFromEventArguments(args);

    if (metadata?.columnDef.id === 'edit') {
      setAlertWarning(`Open a modal window to edit: ${metadata.dataContext.title}`);

      // highlight the row, to customize the color, you can change the SASS variable $row-highlight-background-color
      reactGrid?.gridService.highlightRow(args.row, 1500);

      // you could also select the row, when using 'enableCellNavigation: true', it automatically selects the row
      // reactGrid.gridService.setSelectedRow(args.row);
    } else if (metadata?.columnDef.id === 'delete') {
      if (confirm('Are you sure?')) {
        reactGrid?.gridService.deleteItemById(metadata.dataContext.id);
        setAlertWarning(`Deleted: ${metadata.dataContext.title}`);
      }
    }
  }

  function onCellValidationError(_e: Event, args: any) {
    if (args.validationResults) {
      alert(args.validationResults.msg);
    }
  }

  function changeAutoCommit() {
    gridOptions.autoCommitEdit = !gridOptions.autoCommitEdit;
    reactGrid?.slickGrid.setOptions({
      autoCommitEdit: gridOptions.autoCommitEdit,
    });
    return true;
  }

  function dynamicallyAddTitleHeader() {
    setDuplicateTitleHeaderCount(duplicateTitleHeaderCount + 1);
    const newCol = {
      id: `title${duplicateTitleHeaderCount}`,
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
    // and then use the spread operator [...cols] OR slice to force React to review the changes
    setColumnDefinitions([...columnDefinitions!, newCol]);

    // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
    // you MUST use 'getAllColumnDefinitions()' from the GridService, using this will be ALL columns including the 1st column that is created internally
    // for example if you use the Checkbox Selector (row selection), you MUST use the code below
    /*
    const allColumns = reactGrid.gridService.getAllColumnDefinitions();
    allColumns.push(newCol);
    columnDefinitions = [...allColumns]; // (or use slice) reassign to column definitions for React to do dirty checking
    */
  }

  function dynamicallyRemoveLastColumn() {
    columnDefinitions.pop();
    setColumnDefinitions(columnDefinitions.slice());

    /*
    // remove your column the full set of columns
    allOriginalColumns.pop();
    columnDefinitions = allOriginalColumns.slice();
    */
  }

  function setAutoEdit(isAutoEdit: boolean) {
    setIsAutoEdit(isAutoEdit);
    reactGrid?.slickGrid.setOptions({
      autoEdit: isAutoEdit,
    });
    return true;
  }

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    setReactGrid(reactGrid);
  }

  function undo() {
    const command = commandQueue.pop();
    if (command && SlickGlobalEditorLock.cancelCurrentEdit()) {
      command.undo();
      reactGrid?.slickGrid.gotoCell(command.row, command.cell, false);
    }
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGrid?.resizerService.resizeGrid(0);
  }

  return (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 3: Editors / Delete
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example3.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => toggleSubTitle()}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>

      <div className="subtitle">
        Grid with Inline Editors and onCellClick actions (
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/column-functionalities/editors" target="_blank">
          Docs
        </a>
        ).
        <ul>
          <li>
            Multiple Editors & Filters are available: AutoComplete, Checkbox, Date, Slider, SingleSelect, MultipleSelect, Float, Text,
            LongText... even Custom Editor
          </li>
          <li>When using 'enableCellNavigation: true', clicking on a cell will automatically make it active &amp; selected.</li>
          <ul>
            <li>If you don't want this behavior, then you should disable 'enableCellNavigation'</li>
          </ul>
          <li>Inline Editors requires 'enableCellNavigation: true' (not sure why though)</li>
          <li>
            Support Excel Copy Buffer (SlickGrid Copy Manager Plugin), you can use it by simply enabling 'enableExcelCopyBuffer' flag. Note
            that it will only evaluate Formatter when the 'exportWithFormatter' flag is enabled (through 'ExportOptions' or the column
            definition)
          </li>
          <li>
            MultipleSelect & SingeSelect Editors & Filters can use a regular 'collection' or 'collectionAsync' to load it asynchronously
          </li>
          <ul>
            <li>Click on 'Add Item' and see the Editor/Filter or the 'Prerequesites' column change</li>
            <li>Any Editor/Filter with a 'collection' can be changed dynamically later in the future</li>
          </ul>
        </ul>
      </div>

      <div className="row">
        <div className="col-sm-6">
          <label className="me-1">autoEdit setting:</label>
          <span id="radioAutoEdit">
            <label className="radio-inline control-label me-1" htmlFor="radioTrue">
              <input type="radio" name="inlineRadioOptions" id="radioTrue" defaultChecked={isAutoEdit} onInput={() => setAutoEdit(true)} />{' '}
              ON (single-click)
            </label>
            <label className="radio-inline control-label" htmlFor="radioFalse">
              <input type="radio" name="inlineRadioOptions" id="radioFalse" onInput={() => setAutoEdit(false)} /> OFF (double-click)
            </label>
          </span>
          <div className="row col-sm-12">
            <span>
              <button className="btn btn-outline-secondary btn-sm btn-icon me-1" data-test="undo-btn" onClick={() => undo()}>
                <i className="mdi mdi-undo me-1"></i>
                Undo last edit(s)
              </button>
              <label className="checkbox-inline control-label me-1" htmlFor="autoCommitEdit">
                <input type="checkbox" id="autoCommitEdit" data-test="auto-commit" onChange={() => changeAutoCommit()} />
                &nbsp;Auto Commit Edit
              </label>
            </span>
          </div>
          <div className="row" style={{ marginTop: '5px' }}>
            <div className="col-sm-12">
              <button className="btn btn-outline-secondary btn-sm btn-icon" onClick={() => reactGrid?.filterService.clearFilters()}>
                Clear Filters
              </button>
              <button className="btn btn-outline-secondary btn-sm btn-icon mx-1" onClick={() => reactGrid?.sortService.clearSorting()}>
                Clear Sorting
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                data-test="add-item-btn"
                onClick={() => addItem()}
                title="Clear Filters &amp; Sorting to see it better"
              >
                Add item
              </button>
              <button className="btn btn-sm btn-outline-danger mx-1" data-test="delete-item-btn" onClick={() => deleteItem()}>
                Delete item
              </button>
            </div>
          </div>
          <div className="row" style={{ marginTop: '5px' }}>
            <div className="col-sm-12">
              <button
                className="btn btn-outline-secondary btn-sm btn-icon"
                data-test="add-title-column"
                onClick={() => dynamicallyAddTitleHeader()}
              >
                <i className="mdi mdi-shape-square-plus me-1"></i>
                Dynamically Duplicate Title Column
              </button>
              <button
                className="btn btn-outline-secondary btn-sm btn-icon mx-1"
                data-test="remove-title-column"
                onClick={() => dynamicallyRemoveLastColumn()}
              >
                <i className="mdi mdi-minus me-1"></i>
                Dynamically Remove Last Column
              </button>
            </div>
          </div>
        </div>

        <div className="col-sm-6">
          {alertWarning ? (
            <div className="alert alert-warning">
              <strong>Updated Item:</strong> {alertWarning}
            </div>
          ) : (
            ''
          )}
          {updatedObject ? (
            <div className="alert alert-info">
              <strong>Updated Item: </strong> {JSON.stringify(updatedObject, null, 2)}
            </div>
          ) : (
            ''
          )}
        </div>
      </div>

      <div className="col-sm-12">
        <SlickgridReact
          gridId="grid3"
          columns={columnDefinitions}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={(e) => {
            reactGridReady(e.detail);
          }}
          onCellChange={(e) => {
            onCellChanged(e.detail.eventData, e.detail.args);
          }}
          onClick={(e) => {
            onCellClicked(e.detail.eventData, e.detail.args);
          }}
          onValidationError={(e) => {
            onCellValidationError(e.detail.eventData, e.detail.args);
          }}
        />
      </div>
    </div>
  );
};

export default Example3;
