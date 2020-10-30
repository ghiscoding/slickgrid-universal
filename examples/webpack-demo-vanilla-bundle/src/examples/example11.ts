import {
  AutocompleteOption,
  Column,
  CurrentFilter,
  Editors,
  FieldType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  OperatorType,
  SlickNamespace,
  SortComparers,

  // utilities
  deepCopy,
  formatNumber,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, SlickerGridInstance, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import * as moment from 'moment-mini';

import { ExampleGridOptions } from './example-grid-options';
import { loadComponent } from 'examples/utilities';
import '../salesforce-styles.scss';
import './example11.scss';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;
const LOCAL_STORAGE_KEY = 'gridFilterPreset';

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator = (value) => {
  if (value === null || value === undefined || !value.length) {
    return { valid: false, msg: 'This is a required field' };
  } else if (!/^task\s\d+$/i.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number' };
  }
  return { valid: true, msg: '' };
};

const customEditableInputFormatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const gridOptions = grid && grid.getOptions && grid.getOptions();
  const isEditableLine = gridOptions.editable && columnDef.editor;
  value = (value === null || value === undefined) ? '' : value;
  return isEditableLine ? { text: value, addClasses: 'editable-field', toolTip: 'Click to Edit' } : value;
};

export interface FilterPreset {
  label: string;
  value: string;
  isSelected?: boolean;
  isUserDefined?: boolean;
  filters: CurrentFilter[];
}

export class Example11 {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[] = [];
  currentSelectedFilterPreset: FilterPreset;
  isGridEditable = true;
  isSaveFilterDisabled = false;
  isDeleteFilterDisabled = true;
  editQueue = [];
  editedItems = {};
  sgb: SlickVanillaGridBundle;
  gridContainerElm: HTMLDivElement;
  currentYear = moment().year();
  predefinedPresets = [
    {
      label: 'Tasks Finished in Previous Years',
      value: 'previousYears',
      isSelected: false,
      isUserDefined: false,
      filters: [
        { columnId: 'finish', operator: OperatorType.lessThanOrEqual, searchTerms: [`${this.currentYear}-01-01`] },
        { columnId: 'completed', operator: OperatorType.equal, searchTerms: [true], },
        { columnId: 'percentComplete', operator: OperatorType.greaterThan, searchTerms: [50] },
      ] as CurrentFilter[]
    },
    {
      label: 'Tasks Finishing greater or equal than this Year',
      value: 'greaterYears',
      isSelected: false,
      isUserDefined: false,
      filters: [{ columnId: 'finish', operator: '>=', searchTerms: [`${this.currentYear + 1}-01-01`] }]
    }
  ] as FilterPreset[];

  get slickerGridInstance(): SlickerGridInstance {
    return this.sgb?.instances;
  }

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`.grid11`);

    this.sgb = new Slicker.GridBundle(this.gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);

    // bind any of the grid events
    this.gridContainerElm.addEventListener('onvalidationerror', this.handleValidationError.bind(this));
    this.gridContainerElm.addEventListener('onitemdeleted', this.handleItemDeleted.bind(this));
    this.populatePreDefinedFilters();
  }

  dispose() {
    this.sgb?.dispose();
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', sortable: true, type: FieldType.string,
        editor: { model: Editors.text, massUpdate: true, required: true, alwaysSaveOnEnterKey: true, validator: myCustomTitleValidator, },
        filterable: true,
        formatter: Formatters.multiple, params: { formatters: [Formatters.uppercase, Formatters.bold] },
      },
      {
        id: 'duration', name: 'Duration', field: 'duration', sortable: true, filterable: true,
        editor: { model: Editors.float, massUpdate: true, decimal: 2, valueStep: 1, maxValue: 10000, alwaysSaveOnEnterKey: true, },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) {
            return '';
          }
          return value > 1 ? `${value} days` : `${value} day`;
        },
        type: FieldType.number,
      },
      {
        id: 'cost', name: 'Cost', field: 'cost', width: 90,
        sortable: true, filterable: true, type: FieldType.number,
        filter: { model: Filters.compoundInputNumber },
        formatter: Formatters.dollar,
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete', type: FieldType.number,
        editor: { model: Editors.slider, massUpdate: true, minValue: 0, maxValue: 100, },
        sortable: true, filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
      },
      {
        id: 'start', name: 'Start', field: 'start', sortable: true,
        formatter: Formatters.dateIso,
        type: FieldType.date, outputType: FieldType.dateIso,
        filterable: true, filter: { model: Filters.compoundDate },
        editor: { model: Editors.date, massUpdate: true },
      },
      {
        id: 'finish', name: 'Finish', field: 'finish', sortable: true,
        editor: { model: Editors.date, massUpdate: true, editorOptions: { minDate: 'today' }, },
        formatter: Formatters.dateIso,
        type: FieldType.date, outputType: FieldType.dateIso,
        filterable: true, filter: { model: Filters.compoundDate },
      },
      {
        id: 'completed', name: 'Completed', field: 'completed', width: 80, minWidth: 20, maxWidth: 100,
        sortable: true, filterable: true,
        editor: { model: Editors.singleSelect, collection: [{ value: true, label: 'True' }, { value: false, label: 'False' }], massUpdate: true },
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect
        },
        exportWithFormatter: false,
        formatter: Formatters.checkmarkMaterial,
      },
      {
        id: 'product', name: 'Product', field: 'product',
        filterable: true,
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
        formatter: Formatters.complexObject,
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
        id: 'action', name: 'Action', field: 'action', width: 75, maxWidth: 75,
        excludeFromExport: true,
        formatter: () => `<div class="fake-hyperlink">Action <span class="font-12px">&#9660;</span></div>`,
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
                return !args.dataContext.completed;
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
            { command: 'something', title: 'Disabled Command', disabled: true, positionOrder: 67, },
            { command: 'hidden command', title: 'Hidden Command', hidden: true, positionOrder: 68, }
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
        if (editCommand.prevSerializedValue !== editCommand.serializedValue) {
          this.editQueue.push({ item, column, editCommand });
          this.editedItems[editCommand.row] = item; // keep items by their row indexes, if the row got edited twice then we'll keep only the last change
          this.sgb.slickGrid.invalidate();
          editCommand.execute();

          const hash = { [editCommand.row]: { [column.field]: 'unsaved-editable-field' } };
          this.sgb.slickGrid.setCellCssStyles(`unsaved_highlight_${[column.field]}${editCommand.row}`, hash);
        }
      },
      // when using the cellMenu, you can change some of the default options and all use some of the callback methods
      enableCellMenu: true,
      enableContextMenu: true,
      contextMenu: {
        commandItems: [
          {
            command: 'modal',
            title: 'Mass Update',
            iconCssClass: 'mdi mdi-table-edit',
          },
        ],
        onCommand: (e, args) => this.executeCommand(e, args)
      },
      gridMenu: {
        customItems: [
          {
            command: 'modal',
            title: 'Mass Update',
            iconCssClass: 'mdi mdi-table-edit',
            positionOrder: 66,
          },
        ],
        onCommand: (e, args) => this.executeCommand(e, args)
      }
    };

    const filterPresets = JSON.parse(localStorage[LOCAL_STORAGE_KEY] || null);
    if (filterPresets) {
      const presetFilter = filterPresets.find(preFilter => preFilter.isSelected);
      this.predefinedPresets = filterPresets;

      if (presetFilter && presetFilter.filters) {
        this.currentSelectedFilterPreset = presetFilter;
        this.isDeleteFilterDisabled = !presetFilter.isUserDefined;
        this.gridOptions.presets = {
          filters: presetFilter.filters
        };
      }
    }
  }

  loadData(count: number) {
    // mock data
    const tmpArray = [];
    for (let i = 0; i < count; i++) {
      const randomItemId = Math.floor(Math.random() * this.mockProducts().length);
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomFinishYear = (new Date().getFullYear() - 3) + Math.floor(Math.random() * 10); // use only years not lower than 3 years ago
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
        finish: (i < 3) ? '' : randomFinish, // make sure the random date is earlier than today and it's index is bigger than 3
        cost: (i % 33 === 0) ? null : Math.round(Math.random() * 10000) / 100,
        completed: (randomFinish < new Date()),
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
      alert(args.validationResults.msg);
    }
    return false;
  }

  handleItemDeleted(event) {
    const itemId = event && event.detail;
    console.log('item deleted with id:', itemId);
  }

  async executeCommand(_e, args) {
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
      case 'modal':
        this.sgb.slickGrid.getSelectedRows() || [];
        const modalContainerElm = document.querySelector<HTMLDivElement>('.modal-container');
        const columnDefinitionsClone = deepCopy(this.columnDefinitions);
        const massUpdateColumnDefinitions = columnDefinitionsClone?.filter((col: Column) => col.editor?.massUpdate || col.internalColumnEditor?.massUpdate) || [];
        const selectedItems = this.sgb.gridService.getSelectedRowsDataItem();
        const selectedIds = selectedItems.map(selectedItem => selectedItem.id);
        loadComponent(modalContainerElm, './example11-modal', { columnDefinitions: massUpdateColumnDefinitions, selectedIds, remoteCallback: this.remoteCallbackFn.bind(this) });
        break;
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

  remoteCallbackFn(args: { item: any, selectedIds: string[], updateType: 'selection' | 'mass' }) {
    const fields = [];
    for (const key in args.item) {
      if (args.item.hasOwnProperty(key)) {
        fields.push({ fieldName: key, value: args.item[key] });
      }
    }
    console.log('Remote Callback', args, fields);

    if (args.updateType === 'selection' && Array.isArray(args.selectedIds) && args.selectedIds.length > 0) {
      // update only the selected rows
      const updatedItems = [];
      for (const itemId of args.selectedIds) {
        const dataContext = this.sgb.dataView.getItemById(itemId);
        for (const itemProp in args.item) {
          if (args.item.hasOwnProperty(itemProp)) {
            const newValue = args.item[itemProp];
            dataContext[itemProp] = newValue;
          }
        }
        updatedItems.push(dataContext);
      }
      this.sgb.gridService.updateItems(updatedItems);
    } else if (args.updateType === 'mass') {
      // update every rows (full mass update)
      for (const itemProp in args.item) {
        if (args.item.hasOwnProperty(itemProp)) {
          this.dataset.forEach(item => item[itemProp] = args.item[itemProp]);
        }
      }
      this.sgb.dataset = this.dataset;
    } else {
      alert('There was nothing to update, have you selected any rows?');
    }
  }

  toggleGridEditReadonly() {
    // first need undo all edits
    this.undoAllEdits();

    // then change a single grid options to make the grid non-editable (readonly)
    this.isGridEditable = !this.isGridEditable;
    this.sgb.gridOptions = { editable: this.isGridEditable };
    this.gridOptions = this.sgb.gridOptions;
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
        this.removeUnsavedStylingFromCell(lastEdit.item, lastEdit.column, lastEditCommand.row);
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
      this.removeUnsavedStylingFromCell(lastEdit.item, lastEdit.column, lastEditCommand.row);
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
        this.removeUnsavedStylingFromCell(lastEdit.item, lastEdit.column, lastEditCommand.row);
      }
    }
    this.sgb.slickGrid.invalidate(); // re-render the grid only after every cells got rolled back
    this.editQueue = [];
  }

  populatePreDefinedFilters() {
    this.pushNewFilterToSelectPreFilter(this.predefinedPresets);
  }

  pushNewFilterToSelectPreFilter(predefinedFilters: FilterPreset | FilterPreset[], isOptionSelected = false) {
    if (isOptionSelected) {
      this.resetPredefinedFilterSelection(this.predefinedPresets);
    }
    const presetFilters: FilterPreset[] = Array.isArray(predefinedFilters) ? predefinedFilters : [predefinedFilters];
    const filterSelect = document.querySelector('.selected-filter');

    // empty an empty <option> when populating the array on page load
    if (Array.isArray(predefinedFilters)) {
      const emtySelectOption = document.createElement('option');
      filterSelect.appendChild(emtySelectOption);
    }

    for (const preset of presetFilters) {
      const selectOption = document.createElement('option');
      selectOption.value = preset.value;
      selectOption.label = preset.label;
      filterSelect.appendChild(selectOption);
      selectOption.selected = isOptionSelected || preset.isSelected || false;
    }
  }

  async saveFilter() {
    const currentFilters = this.sgb.filterService.getCurrentLocalFilters();

    const filterName = await prompt('Please provide a name for the new Filter');
    if (filterName) {
      const newPresetFilter = {
        label: filterName,
        value: filterName.replace(' ', ''),
        isSelected: true,
        isUserDefined: true,
        filters: deepCopy(currentFilters) // create a copy to avoid changing the original one
      };

      this.isDeleteFilterDisabled = false;
      this.pushNewFilterToSelectPreFilter(newPresetFilter, true);
      this.predefinedPresets.push(newPresetFilter);
    }
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(this.predefinedPresets);
  }

  deleteFilter() {
    if (this.currentSelectedFilterPreset) {
      const selectedFilterIndex = this.predefinedPresets.findIndex(preset => preset.value === this.currentSelectedFilterPreset.value);
      this.predefinedPresets.splice(selectedFilterIndex, 1);
    }

    // empty the Select dropdown element and re-populate it
    const filterSelectElm = document.querySelector('.selected-filter');
    filterSelectElm.innerHTML = '';
    this.populatePreDefinedFilters();

    this.sgb.filterService.updateFilters([]);
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(this.predefinedPresets);
  }

  usePredefinedFilter(filterValue: string) {
    this.resetPredefinedFilterSelection(this.predefinedPresets);
    const selectedFilter = this.predefinedPresets.find(preset => preset.value === filterValue);
    if (selectedFilter) {
      selectedFilter.isSelected = true;
      this.isDeleteFilterDisabled = !selectedFilter.isUserDefined;
      const filters = selectedFilter?.filters ?? [];
      this.sgb.filterService.updateFilters(filters as CurrentFilter[]);
    } else {
      this.sgb.filterService.updateFilters([]);
    }
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(this.predefinedPresets);
    this.currentSelectedFilterPreset = selectedFilter;
  }

  resetPredefinedFilterSelection(predefinedFilters: FilterPreset[]) {
    predefinedFilters.forEach(preFilter => preFilter.isSelected = false);
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
