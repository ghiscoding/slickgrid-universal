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
import { TranslateService } from '../translate.service';

import { ExampleGridOptions } from './example-grid-options';

export class Example7 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  sgb: SlickVanillaGridBundle;
  duplicateTitleHeaderCount = 1;
  filteringEnabledClass = '';
  sortingEnabledClass = '';
  selectedLanguage: string;
  selectedLanguageFile: string;
  translateService: TranslateService;

  set isFilteringEnabled(enabled: boolean) {
    this.filteringEnabledClass = enabled ? 'icon mdi mdi-toggle-switch' : 'icon mdi mdi-toggle-switch-off-outline';
  }
  set isSortingEnabled(enabled: boolean) {
    this.sortingEnabledClass = enabled ? 'icon mdi mdi-toggle-switch' : 'icon mdi mdi-toggle-switch-off-outline';
  }

  constructor() {
    this._bindingEventService = new BindingEventService();
    // get the Translate Service from the window object,
    // it might be better with proper Dependency Injection but this project doesn't have any at this point
    this.translateService = (<any>window).TranslateService;
    this.selectedLanguage = this.translateService.getCurrentLanguage();
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
    this.isFilteringEnabled = true;
    this.isSortingEnabled = true;
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
        id: 'title', nameKey: 'TITLE', field: 'title', filterable: true,
        editor: { model: Editors.longText, required: true, alwaysSaveOnEnterKey: true },
        // formatter: this.taskTranslateFormatter.bind(this),
        // params: { useFormatterOuputToFilter: true }
      },
      {
        id: 'action', name: 'Action', field: 'action', minWidth: 60, maxWidth: 60,
        excludeFromExport: true, excludeFromHeaderMenu: true,
        formatter: () => `<div class="button-style margin-auto" style="width: 35px; margin-top: -1px;"><span class="mdi mdi-chevron-down mdi-22px color-primary"></span></div>`,
        cellMenu: {
          width: 185,
          commandTitleKey: 'COMMANDS',
          commandItems: [
            {
              command: 'command1', titleKey: 'DELETE_ROW',
              iconCssClass: 'mdi mdi-close color-danger', cssClass: 'has-text-danger', textCssClass: 'bold',
              action: (_e, args) => {
                if (confirm(`Do you really want to delete row (${args.row + 1}) with "${args.dataContext.title}"?`)) {
                  this.sgb?.gridService.deleteItemById(args.dataContext.id);
                }
              }
            },
            'divider',
            {
              command: 'help', titleKey: 'HELP', iconCssClass: 'mdi mdi-help-circle',
              action: () => alert('Please help!')
            },
          ],
          optionTitleKey: 'CHANGE_COMPLETED_FLAG',
          optionItems: [
            { option: true, titleKey: 'TRUE', iconCssClass: 'mdi mdi-check-box-outline', action: (e, args) => this.changeCompletedOption(args.dataContext, args.item.option) },
            { option: false, titleKey: 'FALSE', iconCssClass: 'mdi mdi-checkbox-blank-outline', action: (e, args) => this.changeCompletedOption(args.dataContext, args.item.option) },
          ]
        }
      },
      {
        id: 'duration', nameKey: 'DURATION', field: 'duration', sortable: true, filterable: true,
        type: 'number', editor: { model: Editors.text, alwaysSaveOnEnterKey: true, },
        formatter: this.dayDurationTranslateFormatter.bind(this)
      },
      {
        id: 'percentComplete', nameKey: 'PERCENT_COMPLETE', field: 'percentComplete', type: 'number',
        filterable: true, sortable: true, editor: { model: Editors.slider, minValue: 0, maxValue: 100, },
      },
      {
        id: 'start', nameKey: 'START', field: 'start', formatter: Formatters.dateIso,
        filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
        editor: { model: Editors.date }, type: FieldType.date,/* outputType: FieldType.dateUs, */ saveOutputType: FieldType.dateUtc,
      },
      {
        id: 'finish', nameKey: 'FINISH', field: 'finish', formatter: Formatters.dateIso,
        filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
        editor: { model: Editors.date }, type: FieldType.dateIso, saveOutputType: FieldType.dateUtc,
      },
      {
        id: 'completed', nameKey: 'COMPLETED', field: 'completed', formatter: Formatters.checkmarkMaterial,
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
          // 2 ways are supported (fetch client OR even Promise)

          // OR 1- use "fetch client", they are both supported
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
      gridMenu: {
        commandTitleKey: 'CUSTOM_COMMANDS',
      },
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      showCustomFooter: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true
      },
      enableCellMenu: true,
      enableFiltering: true,
      enableTranslate: true,
      translater: this.translateService, // pass the TranslateService instance to the grid
      registerExternalResources: [new ExcelExportService()],
      enableCellNavigation: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
      checkboxSelector: {
        hideSelectAllCheckbox: false, // hide the "Select All" from title bar
        columnIndexPosition: 1,
        // row selection should only be usable & displayed on root level 0 (parent item) & grid isn't locked
      },
      dataView: {
        syncGridSelection: true, // enable this flag so that the row selection follows the row even if we move it to another position
      },
      enableRowMoveManager: true,
      rowMoveManager: {
        columnIndexPosition: 0,
        // when using Row Move + Row Selection, you want to move only a single row and we will enable the following flags so it doesn't cancel row selection
        singleRowMove: true,
        disableRowSelection: true,
        cancelEditOnDrag: true,
        hideRowMoveShadow: false,
        onBeforeMoveRows: this.onBeforeMoveRow.bind(this),
        onMoveRows: this.onMoveRows.bind(this),

        // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
        // usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
      },
      presets: {
        filters: [{ columnId: 'prerequisites', searchTerms: [1, 3, 5, 7, 9, 12, 15, 18, 21, 25, 28] }],
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

  clearFilters() {
    this.sgb.filterService.clearFilters();
  }

  changeCompletedOption(dataContext: any, newValue: boolean) {
    console.log('change', dataContext, newValue);
    if (dataContext && dataContext.hasOwnProperty('completed')) {
      dataContext.completed = newValue;
      this.sgb?.gridService.updateItem(dataContext);
    }
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
        duration: i === 4 ? 0 : Math.round(Math.random() * 25),
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(2009, 0, 1),
        finish: new Date(2009, 0, 5),
        completed: (i % 5 === 0),
        prerequisites: (i % 2 === 0) && i !== 0 && i < 50 ? [i, i - 1] : [],
      });
    }
    return tempDataset;
  }

  sortCollectionDescending(collection) {
    return collection.sort((item1, item2) => item1.value - item2.value);
  }

  onBeforeMoveRow(e: Event, data: { rows: number[]; insertBefore: number; }) {
    for (const rowIdx of data.rows) {
      // no point in moving before or after itself
      if (rowIdx === data.insertBefore || (rowIdx === data.insertBefore - 1 && ((data.insertBefore - 1) !== this.sgb.dataView.getItemCount()))) {
        e.stopPropagation();
        return false;
      }
    }
    return true;
  }

  onMoveRows(_e: Event, args: { rows: number[]; insertBefore: number; }) {
    // rows and insertBefore references,
    // note that these references are assuming that the dataset isn't filtered at all
    // which is not always the case so we will recalcualte them and we won't use these reference afterward
    const rows = args.rows as number[];
    const insertBefore = args.insertBefore;
    const extractedRows = [];

    // when moving rows, we need to cancel any sorting that might happen
    // we can do this by providing an undefined sort comparer
    // which basically destroys the current sort comparer without resorting the dataset, it basically keeps the previous sorting
    this.sgb.dataView.sort(undefined, true);

    // the dataset might be filtered/sorted,
    // so we need to get the same dataset as the one that the SlickGrid DataView uses
    const tmpDataset = this.sgb.dataView.getItems();
    const filteredItems = this.sgb.dataView.getFilteredItems();

    const itemOnRight = this.sgb.dataView.getItem(insertBefore);
    const insertBeforeFilteredIdx = itemOnRight ? this.sgb.dataView.getIdxById(itemOnRight.id) : this.sgb.dataView.getItemCount();

    const filteredRowItems = [];
    rows.forEach(row => filteredRowItems.push(filteredItems[row]));
    const filteredRows = filteredRowItems.map(item => this.sgb.dataView.getIdxById(item.id));

    const left = tmpDataset.slice(0, insertBeforeFilteredIdx);
    const right = tmpDataset.slice(insertBeforeFilteredIdx, tmpDataset.length);

    // convert into a final new dataset that has the new order
    // we need to resort with
    rows.sort((a: number, b: number) => a - b);
    for (const filteredRow of filteredRows) {
      extractedRows.push(tmpDataset[filteredRow]);
    }
    filteredRows.reverse();
    for (const row of filteredRows) {
      if (row < insertBeforeFilteredIdx) {
        left.splice(row, 1);
      } else {
        right.splice(row - insertBeforeFilteredIdx, 1);
      }
    }

    // final updated dataset, we need to overwrite the DataView dataset (and our local one) with this new dataset that has a new order
    const finalDataset = left.concat(extractedRows.concat(right));
    this.dataset = finalDataset;
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

  async switchLanguage() {
    const nextLanguage = (this.selectedLanguage === 'en') ? 'fr' : 'en';
    await this.translateService.use(nextLanguage);
    this.selectedLanguage = nextLanguage;
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
  }

  dayDurationTranslateFormatter(_row, _cell, value) {
    return this.translateService.translate('X_DAY_PLURAL', { x: value, plural: value > 1 ? 's' : '' }) ?? '';
  }

  taskTranslateFormatter(_row, _cell, value) {
    return this.translateService.translate('TASK_X', { x: value }) ?? '';
  }

  dynamicallyAddTitleHeader() {
    const newCol = {
      id: `title${this.duplicateTitleHeaderCount++}`,
      nameKey: 'TITLE',
      field: 'title',
      editor: {
        model: Editors.text,
        required: true,
        // validator: myCustomTitleValidator, // use a custom validator
      },
      sortable: true, minWidth: 100, filterable: true,
      // formatter: this.taskTranslateFormatter.bind(this),
      // params: { useFormatterOuputToFilter: true },
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

  hideFinishColumnDynamically() {
    // -- you can hide by one Id or multiple Ids:
    // hideColumnById(id, options), hideColumnByIds([ids], options)
    // you can also provide options, defaults are: { autoResizeColumns: true, triggerEvent: true, hideFromColumnPicker: false, hideFromGridMenu: false }

    this.sgb.gridService.hideColumnById('finish');

    // or with multiple Ids and extra options
    // this.sgb.gridService.hideColumnByIds(['duration', 'finish'], { autoResizeColumns: false, hideFromColumnPicker: true, hideFromGridMenu: false });
  }

  // Disable/Enable Filtering/Sorting functionalities
  // --------------------------------------------------

  disableFilters() {
    this.isFilteringEnabled = false;
    this.sgb.filterService.disableFilterFunctionality(true);
  }

  disableSorting() {
    this.isSortingEnabled = false;
    this.sgb.sortService.disableSortFunctionality(true);
  }

  // or Toggle Filtering/Sorting functionalities
  // ---------------------------------------------

  toggleFilter() {
    this.sgb.filterService.toggleFilterFunctionality();
    this.isFilteringEnabled = this.sgb.slickGrid.getOptions().enableFiltering;
  }

  toggleSorting() {
    this.sgb.sortService.toggleSortFunctionality();
    this.isSortingEnabled = this.sgb.slickGrid.getOptions().enableSorting;
  }
}
