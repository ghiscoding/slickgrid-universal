import { SlickCompositeEditor, SlickCompositeEditorComponent } from '@slickgrid-universal/composite-editor-component';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import React, { useEffect, useRef, useState } from 'react';
import {
  Editors,
  Filters,
  formatNumber,
  Formatters,
  SlickGlobalEditorLock,
  SlickgridReact,
  SortComparers,
  type AutocompleterOption,
  type Column,
  type CompositeEditorModalType,
  type EditCommand,
  type Formatter,
  type GridOption,
  type GridStateChange,
  type LongTextEditorOption,
  type MultipleSelectOption,
  type OnCompositeEditorChangeEventArgs,
  type SlickGrid,
  type SlickgridReactInstance,
  type SliderOption,
  type VanillaCalendarOption,
} from 'slickgrid-react';
import COUNTRIES_COLLECTION from './data/countries.json';
import './example30.scss'; // provide custom CSS/SASS styling

const NB_ITEMS = 500;

/**
 * Check if the current item (cell) is editable or not
 * @param {*} dataContext - item data context object
 * @param {*} columnDef - column definition
 * @param {*} grid - slickgrid grid object
 * @returns {boolean} isEditable
 */
function checkItemIsEditable(dataContext: any, columnDef: Column, grid: SlickGrid) {
  const gridOptions = grid.getOptions() as GridOption;
  const hasEditor = columnDef.editor;
  const isGridEditable = gridOptions.editable;
  let isEditable = Boolean(isGridEditable && hasEditor);

  if (dataContext && columnDef && gridOptions?.editable) {
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

const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const gridOptions = grid.getOptions() as GridOption;
  const isEditableLine = gridOptions.editable && columnDef.editor;
  value = value === null || value === undefined ? '' : value;
  return isEditableLine ? { text: value, addClasses: 'editable-field', toolTip: 'Click to Edit' } : value;
};

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator = (value: any, args: any) => {
  if (
    (value === null || value === undefined || !value.length) &&
    ((args.compositeEditorOptions && args.compositeEditorOptions.modalType === 'create') ||
      args.compositeEditorOptions.modalType === 'edit')
  ) {
    // we will only check if the field is supplied when it's an inline editing OR a composite editor of type create/edit
    return { valid: false, msg: 'This is a required field.' };
  } else if (!/^(task\s\d+)*$/i.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number.' };
  }
  return { valid: true, msg: '' };
};

const Example30: React.FC = () => {
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(getData(NB_ITEMS));
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isCompositeDisabled, setIsCompositeDisabled] = useState(false);
  const [isMassSelectionDisabled, setIsMassSelectionDisabled] = useState(true);
  const [isGridEditable, setIsGridEditable] = useState(true);
  const [editedItems, setEditedItems] = useState<any>({});
  const [editQueue, setEditQueue] = useState<{ item: any; columns: Column[]; editCommand: EditCommand }[]>([]);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const compositeEditorInstanceRef = useRef<SlickCompositeEditorComponent>(new SlickCompositeEditorComponent());
  const cellCssStyleQueueRef = useRef<string[]>([]);

  const complexityLevelList = [
    { value: 0, label: 'Very Simple' },
    { value: 1, label: 'Simple' },
    { value: 2, label: 'Straightforward' },
    { value: 3, label: 'Complex' },
    { value: 4, label: 'Very Complex' },
  ];

  useEffect(() => {
    defineGrid();

    // make sure it's back to light mode before unmounting
    return () => {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'title',
        name: '<span title="Task must always be followed by a number" class="text-warning mdi mdi-alert-outline"></span> Title <span title="Title is always rendered as UPPERCASE" class="mdi mdi-information-outline"></span>',
        field: 'title',
        sortable: true,
        minWidth: 75,
        cssClass: 'text-uppercase fw-bold',
        columnGroup: 'Common Factor',
        filterable: true,
        filter: { model: Filters.compoundInputText },
        editor: {
          model: Editors.longText,
          massUpdate: false,
          compositeEditorFormOrder: 0, // you can use this option to always keep same order and make this the 1st input
          required: true,
          alwaysSaveOnEnterKey: true,
          maxLength: 12,
          options: {
            cols: 45,
            rows: 6,
            buttonTexts: {
              cancel: 'Close',
              save: 'Done',
            },
          } as LongTextEditorOption,
          validator: myCustomTitleValidator,
        },
      },
      {
        id: 'duration',
        name: 'Duration',
        field: 'duration',
        sortable: true,
        filterable: true,
        minWidth: 75,
        type: 'number',
        columnGroup: 'Common Factor',
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined || value === '') {
            return '';
          }
          return value > 1 ? `${value} days` : `${value} day`;
        },
        editor: {
          model: Editors.float,
          compositeEditorFormOrder: 2, // inverse order of Duration & Percent Complete in the form
          massUpdate: true,
          decimal: 2,
          valueStep: 1,
          minValue: 0,
          maxValue: 10000,
          alwaysSaveOnEnterKey: true,
          required: true,
        },
      },
      {
        id: 'cost',
        name: 'Cost',
        field: 'cost',
        width: 90,
        minWidth: 70,
        sortable: true,
        filterable: true,
        type: 'number',
        columnGroup: 'Analysis',
        filter: { model: Filters.compoundInputNumber },
        formatter: Formatters.dollar,
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 100,
        type: 'number',
        sortable: true,
        filterable: true,
        columnGroup: 'Analysis',
        filter: { model: Filters.compoundSlider, operator: '>=' },
        editor: {
          model: Editors.slider,
          massUpdate: true,
          compositeEditorFormOrder: 1, // inverse order of Duration & Percent Complete in the form
          minValue: 0,
          maxValue: 100,
        },
        customTooltip: { position: 'center' },
      },
      // {
      //   id: 'percentComplete2', name: '% Complete', field: 'analysis.percentComplete', minWidth: 100,
      //   type: 'number',
      //   sortable: true, filterable: true, columnGroup: 'Analysis',
      //   // filter: { model: Filters.compoundSlider, operator: '>=' },
      //   formatter: Formatters.complex,
      //   exportCustomFormatter: Formatters.complex, // without the Editing cell Formatter
      //   editor: {
      //     model: Editors.singleSelect,
      //     serializeComplexValueFormat: 'flat', // if we keep "object" as the default it will apply { value: 2, label: 2 } which is not what we want in this case
      //     collection: Array.from(Array(101).keys()).map(k => ({ value: k, label: k })),
      //     collectionOptions: {
      //       addCustomFirstEntry: { value: '', label: '--none--' }
      //     },
      //     collectionOverride: (_collectionInput, args) => {
      //       const originalCollection = args.originalCollections || [];
      //       const duration = args?.dataContext?.duration ?? args?.compositeEditorOptions?.formValues?.duration;
      //       if (duration === 10) {
      //         return originalCollection.filter(itemCollection => +itemCollection.value !== 1);
      //       }
      //       return originalCollection;
      //     },
      //     massUpdate: true, minValue: 0, maxValue: 100,
      //   },
      // },
      {
        id: 'complexity',
        name: 'Complexity',
        field: 'complexity',
        minWidth: 100,
        type: 'number',
        sortable: true,
        filterable: true,
        columnGroup: 'Analysis',
        formatter: (_row, _cell, value) => complexityLevelList[value]?.label,
        exportCustomFormatter: (_row, _cell, value) => complexityLevelList[value]?.label,
        filter: {
          model: Filters.multipleSelect,
          collection: complexityLevelList,
          options: { showClear: true } as MultipleSelectOption,
        },
        editor: {
          model: Editors.singleSelect,
          collection: complexityLevelList,
          massUpdate: true,
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        sortable: true,
        minWidth: 100,
        formatter: Formatters.dateUs,
        columnGroup: 'Period',
        exportCustomFormatter: Formatters.dateUs,
        type: 'date',
        outputType: 'dateUs',
        saveOutputType: 'dateUtc',
        filterable: true,
        filter: { model: Filters.compoundDate },
        editor: { model: Editors.date, massUpdate: true, options: { hideClearButton: false } as SliderOption },
      },
      {
        id: 'completed',
        name: 'Completed',
        field: 'completed',
        width: 80,
        minWidth: 75,
        maxWidth: 100,
        sortable: true,
        filterable: true,
        columnGroup: 'Period',
        cssClass: 'text-center',
        formatter: Formatters.checkmarkMaterial,
        exportWithFormatter: false,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,
          options: { showClear: true } as MultipleSelectOption,
        },
        editor: { model: Editors.checkbox, massUpdate: true },
        // editor: { model: Editors.singleSelect, collection: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }], },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        sortable: true,
        minWidth: 100,
        formatter: Formatters.dateUs,
        columnGroup: 'Period',
        type: 'date',
        outputType: 'dateUs',
        saveOutputType: 'dateUtc',
        filterable: true,
        filter: { model: Filters.compoundDate },
        exportCustomFormatter: Formatters.dateUs,
        editor: {
          model: Editors.date,
          options: {
            displayDateMin: 'today', // set minimum date as today

            // if we want to preload the date picker with a different date,
            // we could do it by assigning `selectedDates: []`
            // NOTE: vanilla-calendar doesn't automatically focus the picker to the year/month and you need to do it yourself
            //  selectedDates: ['2021-06-04'],
            //  selectedMonth: 6 - 1, // Note: JS Date month (only) is zero index based, so June is 6-1 => 5
            //  selectedYear: 2021
          } as VanillaCalendarOption,
          massUpdate: true,
          validator: (value, args) => {
            const dataContext = args?.item;
            if (dataContext && dataContext.completed && !value) {
              return { valid: false, msg: 'You must provide a "Finish" date when "Completed" is checked.' };
            }
            return { valid: true, msg: '' };
          },
        },
      },
      {
        id: 'product',
        name: 'Product',
        field: 'product',
        filterable: true,
        columnGroup: 'Item',
        minWidth: 100,
        exportWithFormatter: true,
        dataKey: 'id',
        labelKey: 'itemName',
        formatter: Formatters.complexObject,
        exportCustomFormatter: Formatters.complex, // without the Editing cell Formatter
        type: 'object',
        sortComparer: SortComparers.objectString,
        editor: {
          model: Editors.autocompleter,
          alwaysSaveOnEnterKey: true,
          massUpdate: true,

          // example with a Remote API call
          options: {
            minLength: 1,
            fetch: (searchTerm: string, callback: (items: false | any[]) => void) => {
              const products = mockProducts();
              callback(products.filter((product) => product.itemName.toLowerCase().includes(searchTerm.toLowerCase())));
            },
            renderItem: {
              // layout: 'twoRows',
              // templateCallback: (item: any) => renderItemCallbackWith2Rows(item),

              layout: 'fourCorners',
              templateCallback: (item: any) => renderItemCallbackWith4Corners(item),
            },
          } as AutocompleterOption,
        },
        filter: {
          model: Filters.inputText,
          // placeholder: '🔎︎ search product',
          type: 'string',
          queryField: 'product.itemName',
        },
      },
      {
        id: 'origin',
        name: 'Country of Origin',
        field: 'origin',
        formatter: Formatters.complexObject,
        columnGroup: 'Item',
        exportCustomFormatter: Formatters.complex, // without the Editing cell Formatter
        dataKey: 'code',
        labelKey: 'name',
        type: 'object',
        sortComparer: SortComparers.objectString,
        filterable: true,
        sortable: true,
        minWidth: 100,
        editor: {
          model: Editors.autocompleter,
          massUpdate: true,
          customStructure: { label: 'name', value: 'code' },
          collectionAsync: Promise.resolve(COUNTRIES_COLLECTION),
          options: { minLength: 0 } as AutocompleterOption,
        },
        filter: {
          model: Filters.inputText,
          queryField: 'origin.name',
        },
      },
      {
        id: 'action',
        name: 'Action',
        field: 'action',
        width: 70,
        minWidth: 70,
        maxWidth: 70,
        excludeFromExport: true,
        formatter: () =>
          `<div class="button-style margin-auto" style="width: 35px;"><span class="mdi mdi-chevron-down text-primary"></span></div>`,
        cellMenu: {
          hideCloseButton: false,
          width: 175,
          commandTitle: 'Commands',
          commandItems: [
            {
              command: 'edit',
              title: 'Edit Row',
              iconCssClass: 'mdi mdi-pencil',
              positionOrder: 66,
              action: () => openCompositeModal('edit'),
            },
            {
              command: 'clone',
              title: 'Clone Row',
              iconCssClass: 'mdi mdi-content-copy',
              positionOrder: 66,
              action: () => openCompositeModal('clone'),
            },
            'divider',
            {
              command: 'delete-row',
              title: 'Delete Row',
              positionOrder: 64,
              iconCssClass: 'mdi mdi-close color-danger',
              cssClass: 'red',
              textCssClass: 'text-italic color-danger-light',
              // only show command to 'Delete Row' when the task is not completed
              itemVisibilityOverride: (args) => {
                return !args.dataContext?.completed;
              },
              action: (_event, args) => {
                const dataContext = args.dataContext;
                const row = args?.row ?? 0;
                if (confirm(`Do you really want to delete row (${row + 1}) with "${dataContext.title}"`)) {
                  reactGridRef.current?.gridService.deleteItemById(dataContext.id);
                }
              },
            },
          ],
        },
      },
    ];

    const gridOptions: GridOption = {
      enableAddRow: true, // <-- this flag is required to work with the (create & clone) modal types
      enableCellNavigation: true,
      asyncEditorLoading: false,
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      autoAddCustomEditorFormatter: customEditableInputFormatter,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      showCustomFooter: true,
      enablePagination: true,
      pagination: {
        pageSize: 10,
        pageSizes: [10, 200, 250, 500, 5000],
      },
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: false,
      },
      externalResources: [new ExcelExportService(), new SlickCustomTooltip(), compositeEditorInstanceRef.current!],
      enableFiltering: true,
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
      },
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
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
        const prevSerializedValues = Array.isArray(editCommand.prevSerializedValue)
          ? editCommand.prevSerializedValue
          : [editCommand.prevSerializedValue];
        const serializedValues = Array.isArray(editCommand.serializedValue) ? editCommand.serializedValue : [editCommand.serializedValue];
        const editorColumns = columnDefinitions?.filter((col) => col.editor !== undefined);

        const modifiedColumns: Column[] = [];
        prevSerializedValues.forEach((_val, index) => {
          const prevSerializedValue = prevSerializedValues[index];
          const serializedValue = serializedValues[index];

          if (prevSerializedValue !== serializedValue || serializedValue === '') {
            const finalColumn = Array.isArray(editCommand.prevSerializedValue) ? editorColumns[index] : column;
            editedItems[gridOptions?.datasetIdPropertyName || 'id'] = item; // keep items by their row indexes, if the row got edited twice then we'll keep only the last change
            reactGridRef.current?.slickGrid.invalidate();
            editCommand.execute();

            renderUnsavedCellStyling(item, finalColumn, editCommand);
            modifiedColumns.push(finalColumn);
          }
        });

        // queued editor only keeps 1 item object even when it's a composite editor,
        // so we'll push only 1 change at the end but with all columns modified
        // this way we can undo the entire row change (for example if user changes 3 field in the editor modal, then doing a undo last change will undo all 3 in 1 shot)
        editQueue.push({ item, columns: modifiedColumns, editCommand });
      },
      // when using the cellMenu, you can change some of the default options and all use some of the callback methods
      enableCellMenu: true,
      cellMenu: {
        activateCellOnMenuClick: true, // this is important to know which row index to use for Composite Editor
      },
      gridMenu: {
        hideToggleDarkModeCommand: false, // hidden by default
        onCommand: (_, args) => {
          if (args.command === 'toggle-dark-mode') {
            const newDarkMode = !darkMode;
            setDarkMode(newDarkMode); // keep local toggle var in sync
            toggleBodyBackground(newDarkMode);
          }
        },
      },
    };
    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getData(count: number) {
    // mock data
    const tmpArray: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomItemId = Math.floor(Math.random() * mockProducts().length);
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomFinishYear = new Date().getFullYear() + Math.floor(Math.random() * 10); // use only years not lower than 3 years ago
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomTime = Math.floor(Math.random() * 59);
      const randomFinish = new Date(randomFinishYear, randomMonth + 1, randomDay, randomTime, randomTime, randomTime);
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
        finish: isCompleted || (i % 3 === 0 && randomFinish > new Date() && i > 3) ? (isCompleted ? new Date() : randomFinish) : '', // make sure the random date is earlier than today and it's index is bigger than 3
        cost: i % 33 === 0 ? null : Math.round(Math.random() * 10000) / 100,
        completed: (isCompleted && i > 5) || (i % 3 === 0 && randomFinish > new Date() && i > 3),
        product: { id: mockProducts()[randomItemId]?.id, itemName: mockProducts()[randomItemId]?.itemName },
        origin: i % 2 ? { code: 'CA', name: 'Canada' } : { code: 'US', name: 'United States' },
      };

      if (!(i % 8)) {
        delete tmpArray[i].finish; // also test with undefined properties
        delete tmpArray[i].percentComplete; // also test with undefined properties
      }
    }
    return tmpArray;
  }

  // --
  // event handlers
  // ---------------

  function handleValidationError(_e: Event, args: any) {
    if (args.validationResults) {
      let errorMsg = args.validationResults.msg || '';
      if (args?.editor instanceof SlickCompositeEditor) {
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

  function handleItemsDeleted(itemIds: string[]) {
    console.log('item deleted with ids:', itemIds);
  }

  function handleOnBeforeEditCell(e: Event, args: any) {
    const { column, item, grid } = args;

    if (column && item && !checkItemIsEditable(item, column, grid)) {
      e.preventDefault(); // OR eventData.preventDefault();
      return false;
    }
    return true;
  }

  function handleOnCellChange(_e: Event, args: any) {
    const dataContext = args?.item;

    // when the field "completed" changes to false, we also need to blank out the "finish" date
    if (dataContext && !dataContext.completed) {
      dataContext.finish = null;
      reactGridRef.current?.gridService.updateItem(dataContext);
    }
  }

  function handleOnCellClicked(e: Event, args: any) {
    console.log(e, args);
    // if (eventData.target.classList.contains('mdi-help-circle-o')) {
    //   alert('please HELP!!!');
    // } else if (eventData.target.classList.contains('mdi-chevron-down')) {
    //   alert('do something else...');
    // }
  }

  function handleOnCompositeEditorChange(args: OnCompositeEditorChangeEventArgs) {
    const columnDef = args.column;
    const formValues = args.formValues;

    // you can dynamically change a select dropdown collection,
    // if you need to re-render the editor for the list to be reflected
    // if (columnDef.id === 'duration') {
    //   const editor = compositeEditorInstanceRef.current!.editors['percentComplete2'] as SelectEditor;
    //   const newCollection = editor.finalCollection;
    //   editor.renderDomElement(newCollection);
    // }

    // you can change any other form input values when certain conditions are met
    if (columnDef.id === 'percentComplete' && formValues.percentComplete === 100) {
      compositeEditorInstanceRef.current!.changeFormInputValue('completed', true);
      compositeEditorInstanceRef.current!.changeFormInputValue('finish', new Date());
      // compositeEditorInstanceRef.current!.changeFormInputValue('product', { id: 0, itemName: 'Sleek Metal Computer' });

      // you can even change a value that is not part of the form (but is part of the grid)
      // but you will have to bypass the error thrown by providing `true` as the 3rd argument
      // compositeEditorInstanceRef.current!.changeFormInputValue('cost', 9999.99, true);
    }

    // you can also change some editor options
    // not all Editors supports this functionality, so far only these Editors are supported are: Date, Single/Multiple Select, Slider
    /*
    if (columnDef.id === 'completed') {
      compositeEditorInstanceRef.current!.changeFormEditorOption('complexity', 'filter', true); // multiple-select dropdown editor
      compositeEditorInstanceRef.current!.changeFormEditorOption('percentComplete', 'hideSliderNumber', formValues['completed']); // slider editor
      compositeEditorInstanceRef.current!.changeFormEditorOption('finish', 'displayDateMin', 'today'); // calendar picker, change minDate to today
    }
    */
  }

  function handleReRenderUnsavedStyling() {
    removeAllUnsavedStylingFromCell();
    renderUnsavedStylingOnAllVisibleCells();
  }

  function handleOnGridStateChanged(gridStateChanges: GridStateChange) {
    if (Array.isArray(gridStateChanges.gridState?.rowSelection?.dataContextIds)) {
      setIsMassSelectionDisabled(gridStateChanges.gridState?.rowSelection?.dataContextIds?.length === 0);
    }
  }

  function openCompositeModal(modalType: CompositeEditorModalType) {
    // open the editor modal and we can also provide a header title with optional parsing pulled from the dataContext, via template {{ }}
    // for example {{title}} => display the item title, or even complex object works {{product.itemName}} => display item product name

    let modalTitle = '';
    switch (modalType) {
      case 'create':
        modalTitle = 'Inserting New Task';
        break;
      case 'clone':
        modalTitle = 'Clone - {{title}}';
        break;
      case 'edit':
        modalTitle = 'Editing - {{title}} (<span class="text-muted">id:</span> <span class="text-primary">{{id}}</span>)'; // 'Editing - {{title}} ({{product.itemName}})'
        break;
      case 'mass-update':
        modalTitle = 'Mass Update All Records';
        break;
      case 'mass-selection':
        modalTitle = 'Update Selected Records';
        break;
    }

    compositeEditorInstanceRef.current?.openDetails({
      headerTitle: modalTitle,
      modalType,
      insertOptions: { highlightRow: false }, // disable highlight to avoid flaky tests in Cypress
      // showCloseButtonOutside: true,
      // backdrop: null,
      // viewColumnLayout: 2, // responsive layout, choose from 'auto', 1, 2, or 3 (defaults to 'auto')
      showFormResetButton: true,
      // showResetButtonOnEachEditor: true,
      resetFormButtonIconCssClass: 'mdi mdi-undo',
      onClose: () => Promise.resolve(confirm('You have unsaved changes, are you sure you want to close this window?')),
      onError: (error) => alert(error.message),
      onRendered: (modalElm) => {
        // Bootstrap requires extra attribute when toggling Dark Mode (data-bs-theme="dark")
        // we need to manually add this attribute  ourselve before opening the Composite Editor Modal
        modalElm.dataset.bsTheme = darkMode ? 'dark' : 'light';
      },
      onSave: (formValues, _selection, dataContext) => {
        const serverResponseDelay = 50;

        // simulate a backend server call which will reject if the "% Complete" is below 50%
        // when processing a mass update or mass selection
        if (modalType === 'mass-update' || modalType === 'mass-selection') {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if (formValues.percentComplete >= 50) {
                resolve(true);
              } else {
                reject('Unfortunately we only accept a minimum of 50% Completion...');
              }
            }, serverResponseDelay);
          });
        } else {
          // also simulate a server cal for any other modal type (create/clone/edit)
          // we'll just apply the change without any rejection from the server and
          // note that we also have access to the "dataContext" which is only available for these modal
          console.log(`${modalType} item data context`, dataContext);
          return new Promise((resolve) => setTimeout(() => resolve(true), serverResponseDelay));
        }
      },
    });
  }

  function toggleGridEditReadonly() {
    // first need undo all edits
    undoAllEdits();

    // then change a single grid options to make the grid non-editable (readonly)
    const newIsGridEditable = !isGridEditable;
    setIsGridEditable(newIsGridEditable);
    setIsCompositeDisabled(!newIsGridEditable);
    setIsMassSelectionDisabled(!newIsGridEditable);

    // dynamically change SlickGrid editable grid option
    reactGridRef.current?.slickGrid.setOptions({ editable: newIsGridEditable });
  }

  function toggleDarkMode() {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    toggleBodyBackground(newDarkMode);
    reactGridRef.current?.slickGrid.setOptions({ darkMode: newDarkMode });
  }

  function toggleBodyBackground(darkMode: boolean) {
    if (darkMode) {
      document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
    } else {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    }
  }

  function removeUnsavedStylingFromCell(_item: any, column: Column, row: number) {
    // remove unsaved css class from that cell
    const cssStyleKey = `unsaved_highlight_${[column.id]}${row}`;
    reactGridRef.current?.slickGrid.removeCellCssStyles(cssStyleKey);
    const foundIdx = cellCssStyleQueueRef.current.findIndex((styleKey) => styleKey === cssStyleKey);
    if (foundIdx >= 0) {
      cellCssStyleQueueRef.current.splice(foundIdx, 1);
    }
  }

  function removeAllUnsavedStylingFromCell() {
    for (const cssStyleKey of cellCssStyleQueueRef.current) {
      reactGridRef.current?.slickGrid.removeCellCssStyles(cssStyleKey);
    }
    cellCssStyleQueueRef.current = [];
  }

  function renderUnsavedStylingOnAllVisibleCells() {
    for (const lastEdit of editQueue) {
      if (lastEdit) {
        const { item, columns, editCommand } = lastEdit;
        if (Array.isArray(columns)) {
          columns.forEach((col) => {
            renderUnsavedCellStyling(item, col, editCommand);
          });
        }
      }
    }
  }

  function renderUnsavedCellStyling(item: any, column: Column, editCommand: EditCommand) {
    if (editCommand && item && column) {
      const row = reactGridRef.current?.dataView.getRowByItem(item) as number;
      if (row >= 0) {
        const hash = { [row]: { [column.id]: 'unsaved-editable-field' } };
        const cssStyleKey = `unsaved_highlight_${[column.id]}${row}`;
        reactGridRef.current?.slickGrid.setCellCssStyles(`unsaved_highlight_${[column.id]}${row}`, hash);
        cellCssStyleQueueRef.current.push(cssStyleKey);
      }
    }
  }

  function saveAll() {
    // Edit Queue (array increases every time a cell is changed, regardless of item object)
    console.log(editQueue);

    // Edit Items only keeps the merged data (an object with row index as the row properties)
    // if you change 2 different cells on 2 different cells then this editedItems will only contain 1 property
    // example: editedItems = { 0: { title: task 0, duration: 50, ... }}
    // ...means that row index 0 got changed and the final merged object is { title: task 0, duration: 50, ... }
    console.log(editedItems);
    // console.log(`We changed ${Object.keys(editedItems).length} rows`);

    // since we saved, we can now remove all the unsaved color styling and reset our array/object
    removeAllUnsavedStylingFromCell();
    setEditQueue([]);
    setEditedItems({});
  }

  function undoLastEdit(showLastEditor = false) {
    const lastEdit = editQueue.pop();
    const lastEditCommand = lastEdit?.editCommand;
    if (lastEdit && lastEditCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
      lastEditCommand.undo();

      // remove unsaved css class from that cell
      for (const lastEditColumn of lastEdit.columns) {
        removeUnsavedStylingFromCell(lastEdit.item, lastEditColumn, lastEditCommand.row);
      }
      reactGridRef.current?.slickGrid.invalidate();

      // optionally open the last cell editor associated
      if (showLastEditor) {
        reactGridRef.current?.slickGrid.gotoCell(lastEditCommand.row, lastEditCommand.cell, false);
      }
    }
  }

  function undoAllEdits() {
    for (const lastEdit of editQueue) {
      const lastEditCommand = lastEdit?.editCommand;
      if (lastEditCommand && SlickGlobalEditorLock.cancelCurrentEdit()) {
        lastEditCommand.undo();

        // remove unsaved css class from that cell
        for (const lastEditColumn of lastEdit.columns) {
          removeUnsavedStylingFromCell(lastEdit.item, lastEditColumn, lastEditCommand.row);
        }
      }
    }
    reactGridRef.current?.slickGrid.invalidate(); // re-render the grid only after every cells got rolled back
    setEditQueue([]);
  }

  function mockProducts() {
    return [
      {
        id: 0,
        itemName: 'Sleek Metal Computer',
        itemNameTranslated: 'some fantastic sleek metal computer description',
        listPrice: 2100.23,
        itemTypeName: 'I',
        image: 'http://i.stack.imgur.com/pC1Tv.jpg',
        icon: getRandomIcon(0),
      },
      {
        id: 1,
        itemName: 'Tasty Granite Table',
        itemNameTranslated: 'an extremely huge and heavy table',
        listPrice: 3200.12,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/Fnm7j6h.jpg',
        icon: getRandomIcon(1),
      },
      {
        id: 2,
        itemName: 'Awesome Wooden Mouse',
        itemNameTranslated: 'super old mouse',
        listPrice: 15.0,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/RaVJuLr.jpg',
        icon: getRandomIcon(2),
      },
      {
        id: 3,
        itemName: 'Gorgeous Fresh Shirt',
        itemNameTranslated: 'what a gorgeous shirt seriously',
        listPrice: 25.76,
        itemTypeName: 'I',
        image: 'http://i.stack.imgur.com/pC1Tv.jpg',
        icon: getRandomIcon(3),
      },
      {
        id: 4,
        itemName: 'Refined Cotton Table',
        itemNameTranslated: 'super light table that will fall apart amazingly fast',
        listPrice: 13.35,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/Fnm7j6h.jpg',
        icon: getRandomIcon(4),
      },
      {
        id: 5,
        itemName: 'Intelligent Wooden Pizza',
        itemNameTranslated: 'wood not included',
        listPrice: 23.33,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/RaVJuLr.jpg',
        icon: getRandomIcon(5),
      },
      {
        id: 6,
        itemName: 'Licensed Cotton Chips',
        itemNameTranslated: 'not sure what that is',
        listPrice: 71.21,
        itemTypeName: 'I',
        image: 'http://i.stack.imgur.com/pC1Tv.jpg',
        icon: getRandomIcon(6),
      },
      {
        id: 7,
        itemName: 'Ergonomic Rubber Soap',
        itemNameTranslated: `so good you'll want to use it every night`,
        listPrice: 2.43,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/Fnm7j6h.jpg',
        icon: getRandomIcon(7),
      },
      {
        id: 8,
        itemName: 'Handcrafted Steel Car',
        itemNameTranslated: `aka tesla truck`,
        listPrice: 31288.39,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/RaVJuLr.jpg',
        icon: getRandomIcon(8),
      },
    ];
  }

  /** List of icons that are supported in this lib Material Design Icons */
  function getRandomIcon(iconIndex?: number) {
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
    const randomNumber = Math.floor(Math.random() * icons.length - 1);
    return icons[iconIndex ?? randomNumber];
  }

  /*
  function renderItemCallbackWith2Rows(item: any): string {
    return `<div class="autocomplete-container-list">
      <div class="autocomplete-left">
        <!--<img src="http://i.stack.imgur.com/pC1Tv.jpg" width="50" />-->
        <span class="mdi ${item.icon}"></span>
      </div>
      <div>
        <span class="autocomplete-top-left">
          <span class="mdi ${item.itemTypeName === 'I' ? 'mdi-information-outline' : 'mdi-content-copy'}"></span>
          ${item.itemName}
        </span>
      <div>
    </div>
    <div>
      <div class="autocomplete-bottom-left">${item.itemNameTranslated}</div>
    </div>`;
  }
    */

  function renderItemCallbackWith4Corners(item: any): string {
    return `<div class="autocomplete-container-list">
          <div class="autocomplete-left">
            <!--<img src="http://i.stack.imgur.com/pC1Tv.jpg" width="50" />-->
            <span class="mdi ${item.icon}"></span>
          </div>
          <div>
            <span class="autocomplete-top-left">
              <span class="mdi ${item.itemTypeName === 'I' ? 'mdi-information-outline' : 'mdi-content-copy'}"></span>
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

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 30: Composite Editor Modal
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example30.tsx"
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
        <button className="btn btn-outline-secondary btn-sm btn-icon ms-2" onClick={() => toggleDarkMode()} data-test="toggle-dark-mode">
          <i className="mdi mdi-theme-light-dark"></i>
          <span>Toggle Dark Mode</span>
        </button>
      </h2>

      <div className="subtitle">
        Composite Editor allows you to Create, Clone, Edit, Mass Update & Mass Selection Changes inside a nice Modal Window.
        <br />
        The modal is simply populated by looping through your column definition list and also uses a lot of the same logic as inline editing
        (see{' '}
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/composite-editor-modal" target="_blank">
          Composite Editor - Wiki
        </a>
        .)
      </div>

      <div className="mb-2">
        <div className="btn-group btn-group-sm" role="group" aria-label="Basic Editing Commands">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            data-test="toggle-readonly-btn"
            onClick={() => toggleGridEditReadonly()}
          >
            <i className="mdi mdi-table-edit"></i> Toggle Edit/Readonly Grid
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            data-test="undo-last-edit-btn"
            onClick={() => undoLastEdit()}
          >
            <i className="mdi mdi-undo"></i> Undo Last Edit
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            data-test="undo-open-editor-btn"
            onClick={() => undoLastEdit(true)}
          >
            <i className="mdi mdi-undo"></i> Undo Last Edit &amp; Open Editor
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            data-test="undo-all-edits-btn"
            onClick={() => undoAllEdits()}
          >
            <i className="mdi mdi-history"></i> Undo All Edits
          </button>
          <button type="button" className="btn btn-outline-secondary btn-icon" data-test="save-all-btn" onClick={() => saveAll()}>
            Save All
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="btn-group btn-group-sm" role="group" aria-label="Basic example">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            data-test="open-modal-create-btn"
            onClick={() => openCompositeModal('create')}
            disabled={isCompositeDisabled}
          >
            <i className="mdi mdi-shape-square-plus"></i> Item Create
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            data-test="open-modal-clone-btn"
            onClick={() => openCompositeModal('clone')}
            disabled={isCompositeDisabled}
          >
            <i className="mdi mdi-content-copy"></i> Item Clone
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            data-test="open-modal-edit-btn"
            onClick={() => openCompositeModal('edit')}
            disabled={isCompositeDisabled}
          >
            <i className="mdi mdi-pencil"></i> Item Edit
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            data-test="open-modal-mass-update-btn"
            onClick={() => openCompositeModal('mass-update')}
            disabled={isCompositeDisabled}
          >
            <i className="mdi mdi-pencil-box-multiple-outline"></i> Mass Update
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            data-test="open-modal-mass-selection-btn"
            onClick={() => openCompositeModal('mass-selection')}
            disabled={isMassSelectionDisabled}
          >
            <i className="mdi mdi-check-box-outline"></i> Update Selected
          </button>
        </div>
      </div>

      <SlickgridReact
        gridId="grid30"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
        onBeforeEditCell={($event) => handleOnBeforeEditCell($event.detail.eventData, $event.detail.args)}
        onCellChange={($event) => handleOnCellChange($event.detail.eventData, $event.detail.args)}
        onClick={($event) => handleOnCellClicked($event.detail.eventData, $event.detail.args)}
        onCompositeEditorChange={($event) => handleOnCompositeEditorChange($event.detail.args)}
        onItemsDeleted={($event) => handleItemsDeleted($event.detail)}
        onGridStateChanged={($event) => handleOnGridStateChanged($event.detail)}
        onRowsOrCountChanged={() => handleReRenderUnsavedStyling()}
        onValidationError={($event) => handleValidationError($event.detail.eventData, $event.detail.args)}
      />
    </div>
  );
};

export default Example30;
