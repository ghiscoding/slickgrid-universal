<script lang="ts">
  import {
    Editors,
    Filters,
    Formatters,
    SlickGlobalEditorLock,
    SlickgridSvelte,
    SortComparers,
    type AutocompleterOption,
    type Column,
    type EditorArguments,
    type EditorValidator,
    type Formatter,
    type GridOption,
    type OnEventArgs,
    type SlickgridSvelteInstance,
    type SliderOption,
    type VanillaCalendarOption,
  } from 'slickgrid-svelte';
  import SAMPLE_COLLECTION_DATA from './data/collection_100_numbers.json';
  import prerequisiteCollection from './data/collection_100_numbers.json';
  import COUNTRIES_COLLECTION from './data/countries.json';
  import COUNTRY_NAMES from './data/country_names.json';
  import { CustomInputEditor } from './data/custom-inputEditor.js';
  import { CustomInputFilter } from './data/custom-inputFilter.js';
  import { createTasks } from './data/tasks.js';
  import fetchJsonp from './jsonp.js';

  let grid: SlickgridSvelteInstance;
  let showSubTitle = true;
  let dataset: any[] = createTasks(100).map((item) => {
    const startYear = 2004 + (item.id % 12);
    const finishYear = new Date().getFullYear() - 3 + ((item.id * 7) % 10);
    const finishDate = new Date(finishYear, ((item.id * 5) % 11) + 1, (item.id * 13) % 29);

    return {
      ...item,
      // Use the same Date values as the Angular example so the date editor opens on the row's date.
      start: new Date(startYear, (item.id * 7) % 11, (item.id * 13) % 29),
      finish: finishDate < new Date() ? '' : finishDate,
      countryOfOrigin: item.id % 2 ? { code: 'CA', name: 'Canada' } : { code: 'US', name: 'United States' },
      prerequisites: item.id % 2 === 0 && item.id > 0 && item.id < 12 ? [item.id, item.id - 1] : [],
    };
  });
  let nextId = 100;
  let duplicateTitleHeaderCount = 1;
  let alertWarning: any;
  let autoEdit = true;
  let autoCommit = false;

  // you can create custom validator to pass to an inline editor
  const myCustomTitleValidator: EditorValidator = (value: any, _args?: EditorArguments) => {
    // you can get the Editor Args which can be helpful, e.g. we can get the Translate Service from it
    /*
    const grid = args?.grid;
    const gridOptions = (grid?.getOptions() ?? {}) as GridOption;
    const translate = gridOptions.i18n;
    const columnEditor = args?.column?.editor;
    */
    if (value === null || value === undefined || !value.length) {
      return { valid: false, msg: 'This is a required field' };
    } else if (!/^Task\s\d+$/.test(value)) {
      return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number' };
      // OR use the Translate Service with your custom message
      // return { valid: false, msg: translate.instant('YOUR_ERROR', { x: value }) };
    }
    return { valid: true, msg: '' };
  };

  // create a custom Formatter to show the Task + value
  const taskFormatter: Formatter = (_row, _cell, value) => {
    if (value && Array.isArray(value)) {
      const taskValues = value.map((val) => `Task ${val}`);
      const values = taskValues.join(', ');
      return `<span title="${values}">${values}</span>`;
    }
    return '';
  };

  let columns: Column[] = [
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
      onCellClick: (_e: Event, args: OnEventArgs) => {
        alertWarning = `Editing: ${args.dataContext.title}`;
        grid.gridService.highlightRow(args.row, 1500);
        grid.gridService.setSelectedRow(args.row);
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
      onCellClick: (_e: Event, args: OnEventArgs) => {
        if (confirm('Are you sure?')) {
          grid.gridService.deleteItemById(args.dataContext.id);
        }
      },
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
        console.log(args);
        alertWarning = `Updated Title: ${args.dataContext.title}`;
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
          // however if you pass the "decimalPlaces", it will validate with that maximum
          model: Editors.float,
          minValue: 0,
          maxValue: 365,
          // the default validation error message is in English but you can override it by using "errorMessage"
          // errorMessage: i18n.tr('INVALID_FLOAT', { maxDecimal: 2 }),
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
      // filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 100,
      filter: { model: Filters.compoundDate },
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
      // filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 100,
      filter: { model: Filters.compoundDate },
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

        // We can use the autocomplete through 3 ways 'collection', 'collectionAsync' or with your own autocomplete options
        // use your own autocomplete options, instead of fetch-jsonp, use Fetch
        // here we use fetch-jsonp just because I'm not sure how to configure fetch with JSONP and CORS
        options: {
          minLength: 3,
          forceUserInput: true,
          fetch: (searchText: string, updateCallback: (items: false | any[]) => void) => {
            /** with JSONP it will work locally but not on the GitHub demo because of CORS */
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
        // collectionAsync: this.httpFetch.fetch(COUNTRIES_COLLECTION_URL),

        // OR use your own autocomplete options, instead of fetch-jsonp, use Fetch
        // here we use fetch-jsonp just because I'm not sure how to configure fetch with JSONP and CORS
        options: {
          minLength: 3,
          fetch: (searchText: string, updateCallback: (items: false | any[]) => void) => {
            /** with JSONP will work locally but not on the GitHub demo because of CORS */
            fetchJsonp(`http://gd.geobytes.com/AutoCompleteCity?q=${searchText}`)
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
    // { id: 'prerequisites', name: 'Prerequisites', field: 'prerequisites', sortable: true, filterable: true, minWidth: 100, formatter: (_row, _cell, value) => Array.isArray(value) ? value.map((id) => `Task ${id}`).join(', ') : '', editor: { model: Editors.multipleSelect, collectionAsync: Promise.resolve(prerequisiteCollection), customStructure: { label: 'label', value: 'value', labelPrefix: 'prefix' }, collectionOptions: { separatorBetweenTextLabels: ' ' } }, filter: { model: Filters.multipleSelect,
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
        collectionAsync: Promise.resolve(prerequisiteCollection),
        // collectionAsync: Promise.resolve(SAMPLE_COLLECTION_DATA),
        // collectionAsync: new Promise((resolve) => {
        //   setTimeout(() => {
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
        operator: 'IN_CONTAINS',
      },
    },
  ];
  const commands: Array<{ execute(): void; undo(): void; row: number; cell: number }> = [];
  let options: GridOption = {
    asyncEditorLoading: false,
    autoResize: { container: '#demo-container', rightPadding: 10 },
    gridHeight: 400,
    editable: true,
    autoEdit,
    autoCommitEdit: autoCommit,
    enableCellNavigation: true,
    enableColumnPicker: true,
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    editCommandHandler: (_item, _column, command) => {
      commands.push(command);
      command.execute();
    },
  };
  function addItem() {
    const item = createTasks(1, nextId++)[0];
    const prerequisiteColumn = columns.find((column) => column.id === 'prerequisites');
    const collectionItem = { value: item.id, label: item.id, prefix: 'Task', suffix: 'days' };
    const collections = new Set([prerequisiteColumn?.editor?.collection, prerequisiteColumn?.filter?.collection]);
    for (const collection of collections) {
      if (Array.isArray(collection)) {
        collection.push(collectionItem);
      }
    }
    grid.gridService.addItem({ ...item, countryOfOrigin: { code: 'CA', name: 'Canada' } }, { highlightRow: false });
  }
  function deleteItem() {
    const prerequisiteColumn = columns.find((column) => column.id === 'prerequisites');
    const collection = prerequisiteColumn?.filter?.collection as Array<{ value: number }> | undefined;
    const itemToDelete = collection?.reduce((highest, item) => (item.value > highest.value ? item : highest));
    if (itemToDelete) {
      grid.gridService.deleteItemById(itemToDelete.value);
      const collections = new Set([prerequisiteColumn?.editor?.collection, prerequisiteColumn?.filter?.collection]);
      for (const collection of collections) {
        if (Array.isArray(collection)) {
          const index = collection.findIndex((item: { value: number }) => item.value === itemToDelete.value);
          if (index >= 0) {
            collection.splice(index, 1);
          }
        }
      }
    }
  }
  function undo() {
    const command = commands.pop();
    if (command && SlickGlobalEditorLock.cancelCurrentEdit()) {
      command.undo();
      // Undo is expected to reopen the edited cell even when autoEdit was turned off.
      grid.slickGrid.gotoCell(command.row, command.cell, true);
    }
  }
  function setAutoEdit(enabled: boolean) {
    autoEdit = enabled;
    options = { ...options, autoEdit };
  }
  function toggleAutoCommit() {
    autoCommit = !autoCommit;
    options = { ...options, autoCommitEdit: autoCommit };
  }
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => {
      grid?.resizerService?.resizeGrid();
    });
  }
  function dynamicallyAddTitleHeader() {
    const newCol = {
      id: `title${duplicateTitleHeaderCount++}`,
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
    columns = [...columns, newCol];
  }

  function dynamicallyRemoveLastColumn() {
    columns = columns.slice(0, columns.length - 1);
  }
</script>

<h2>
  Example 3: Editors / Delete
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example03.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>
<div class="subtitle" class:hidden={!showSubTitle}>
  Grid with Inline Editors and onCellClick actions (<a
    href="https://ghiscoding.gitbook.io/svelte-slickgrid/column-functionalities/editors"
    target="_blank"
    rel="noreferrer">Wiki docs</a
  >).
  <ul>
    <li>
      Multiple Editors &amp; Filters are available: AutoComplete, Checkbox, Date, Slider, SingleSelect, MultipleSelect, Float, Text,
      LongText... even Custom Editor
    </li>
    <li>When using "enableCellNavigation: true", clicking on a cell will automatically make it active &amp; selected.</li>
    <ul><li>If you don't want this behavior, then you should disable "enableCellNavigation"</li></ul>
    <li>Inline Editors requires "enableCellNavigation: true" (not sure why though)</li>
    <li>
      Support Excel Copy Buffer (SlickGrid Copy Manager Plugin), enabled with "enableExcelCopyBuffer". It evaluates formatters when
      exportWithFormatter is enabled.
    </li>
    <li>
      MultipleSelect &amp; SingleSelect Editors &amp; Filters can use a regular "collection" or "collectionAsync" to load it asynchronously
    </li>
    <ul>
      <li>Click on "Add Item" and see the Editor/Filter or the "Prerequisites" column change</li>
      <li>Any Editor/Filter with a "collection" can be changed dynamically later</li>
    </ul>
  </ul>
</div>
<div class="row">
  <div class="col-sm-6">
    <label for="radioTrue">autoEdit setting:</label>
    <span id="radioAutoEdit">
      <label class="radio-inline control-label" for="radioTrue">
        <input type="radio" name="inlineRadioOptions" id="radioTrue" checked={autoEdit} onchange={() => setAutoEdit(true)} /> ON (single-click)
      </label>
      <label class="radio-inline control-label" for="radioFalse">
        <input type="radio" name="inlineRadioOptions" id="radioFalse" checked={!autoEdit} onchange={() => setAutoEdit(false)} /> OFF (double-click)
      </label>
    </span>
    <div class="row col-sm-12">
      <span>
        <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={undo} data-test="undo-btn"
          ><i class="mdi mdi-undo"></i> Undo last edit(s)</button
        >
        <label class="checkbox-inline control-label" for="autoCommitEdit">
          <input type="checkbox" id="autoCommitEdit" data-test="auto-commit" checked={autoCommit} onchange={toggleAutoCommit} /> Auto Commit Edit
        </label>
      </span>
    </div>
    <div class="row" style="margin-top: 5px">
      <div class="col-sm-12">
        <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={() => grid.filterService.clearFilters()}>Clear Filters</button>
        <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={() => grid.sortService.clearSorting()}>Clear Sorting</button>
        <button
          class="btn btn-sm btn-outline-primary"
          data-test="add-item-btn"
          onclick={addItem}
          title="Clear Filters &amp; Sorting to see it better">Add item</button
        >
        <button class="btn btn-sm btn-outline-danger" data-test="delete-item-btn" onclick={deleteItem}>Delete item</button>
      </div>
    </div>
    <div class="row" style="margin-top: 5px">
      <div class="col-sm-12">
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="add-title-column" onclick={dynamicallyAddTitleHeader}
          ><i class="mdi mdi-shape-square-plus"></i> Dynamically Duplicate Title Column</button
        >
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="remove-title-column" onclick={dynamicallyRemoveLastColumn}
          ><i class="mdi mdi-minus"></i> Dynamically Remove Last Column</button
        >
      </div>
    </div>
  </div>
  <div class="col-sm-6">
    {#if alertWarning}<div class="alert alert-warning"><strong>Updated Item:</strong> {alertWarning}</div>{/if}
  </div>
</div>
<SlickgridSvelte gridId="grid3" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />
