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
  type EditCommand,
  type Formatter,
  type GridOption,
  type LongTextEditorOption,
  type SearchTerm,
  type SlickgridReactInstance,
  type VanillaCalendarOption,
} from 'slickgrid-react';
import './example32.scss'; // provide custom CSS/SASS styling
import COUNTRIES_COLLECTION_URL from './data/countries.json?url';

const NB_ITEMS = 400;

const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const gridOptions = grid.getOptions() as GridOption;
  const isEditableLine = gridOptions.editable && columnDef.editor;
  value = value === null || value === undefined ? '' : value;
  return isEditableLine ? { text: value, addClasses: 'editable-field', toolTip: 'Click to Edit' } : value;
};

// you can create custom validator to pass to an inline editor
const myCustomTitleValidator = (value: any) => {
  if (value === null || value === undefined || !value.length) {
    // we will only check if the field is supplied when it's an inline editing
    return { valid: false, msg: 'This is a required field.' };
  } else if (!/^(task\s\d+)*$/i.test(value)) {
    return { valid: false, msg: 'Your title is invalid, it must start with "Task" followed by a number.' };
  }
  return { valid: true, msg: '' };
};

const Example32: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(loadData(NB_ITEMS));
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [editQueue, setEditQueue] = useState<any[]>([]);
  const [editedItems, setEditedItems] = useState<any>({});
  const [isUsingDefaultResize, setIsUsingDefaultResize] = useState(false);
  const [isGridEditable, setIsGridEditable] = useState(false);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  const complexityLevelList = [
    { value: 0, label: 'Very Simple' },
    { value: 1, label: 'Simple' },
    { value: 2, label: 'Straightforward' },
    { value: 3, label: 'Complex' },
    { value: 4, label: 'Very Complex' },
  ];

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
        minWidth: 65,
        // you can adjust the resize calculation via multiple options
        resizeExtraWidthPadding: 4,
        resizeCharWidthInPx: 7.6,
        resizeCalcWidthRatio: 1, // default ratio is ~0.9 for string but since our text is all uppercase then a higher ratio is needed
        resizeMaxWidthThreshold: 200,
        cssClass: 'text-uppercase fw-bold',
        columnGroup: 'Common Factor',
        filterable: true,
        filter: {
          model: Filters.inputText,
          // you can use your own custom filter predicate when built-in filters aren't working for you
          // for example the example below will function similarly to an SQL LIKE to answer this SO: https://stackoverflow.com/questions/78471412/angular-slickgrid-filter
          filterPredicate: (dataContext, searchFilterArgs) => {
            const searchVals = (searchFilterArgs.parsedSearchTerms || []) as SearchTerm[];
            if (searchVals?.length) {
              const columnId = searchFilterArgs.columnId;
              const searchVal = searchVals[0] as string;
              const cellValue = dataContext[columnId].toLowerCase();
              const results = searchVal.matchAll(/^%([^%\r\n]+)[^%\r\n]*$|(.*)%(.+)%(.*)|(.+)%(.+)|([^%\r\n]+)%$/gi);
              const arrayOfMatches = Array.from(results);
              const matches = arrayOfMatches.length ? arrayOfMatches[0] : [];
              const [_, endW, containSW, contain, containEndW, comboSW, comboEW, startW] = matches;

              if (endW) {
                // example: "%001" ends with A
                return cellValue.endsWith(endW.toLowerCase());
              } else if (containSW && contain) {
                // example: "%Ti%001", contains A + ends with B
                return cellValue.startsWith(containSW.toLowerCase()) && cellValue.includes(contain.toLowerCase());
              } else if (contain && containEndW) {
                // example: "%Ti%001", contains A + ends with B
                return cellValue.includes(contain) && cellValue.endsWith(containEndW.toLowerCase());
              } else if (contain && !containEndW) {
                // example: "%Ti%", contains A anywhere
                return cellValue.includes(contain.toLowerCase());
              } else if (comboSW && comboEW) {
                // example: "Ti%001", combo starts with A + ends with B
                return cellValue.startsWith(comboSW.toLowerCase()) && cellValue.endsWith(comboEW.toLowerCase());
              } else if (startW) {
                // example: "Ti%", starts with A
                return cellValue.startsWith(startW.toLowerCase());
              }
              // anything else
              return cellValue.includes(searchVal.toLowerCase());
            }

            // if we fall here then the value is not filtered out
            return true;
          },
        },
        editor: {
          model: Editors.longText,
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
        minWidth: 65,
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
        minWidth: 65,
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
          minValue: 0,
          maxValue: 100,
        },
      },
      {
        id: 'complexity',
        name: 'Complexity',
        field: 'complexity',
        resizeCalcWidthRatio: 0.9, // default calc ratio is 1 or ~0.9 for field type of string
        sortable: true,
        filterable: true,
        columnGroup: 'Analysis',
        formatter: (_row, _cell, value) => complexityLevelList[value]?.label,
        exportCustomFormatter: (_row, _cell, value) => complexityLevelList[value]?.label,
        filter: {
          model: Filters.multipleSelect,
          collection: complexityLevelList,
        },
        editor: {
          model: Editors.singleSelect,
          collection: complexityLevelList,
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        sortable: true,
        formatter: Formatters.dateUs,
        columnGroup: 'Period',
        exportCustomFormatter: Formatters.dateUs,
        type: 'date',
        outputType: 'dateUs',
        saveOutputType: 'dateUtc',
        filterable: true,
        filter: { model: Filters.compoundDate },
        editor: { model: Editors.date, params: { hideClearButton: false } },
      },
      {
        id: 'completed',
        name: 'Completed',
        field: 'completed',
        width: 80,
        minWidth: 75,
        maxWidth: 100,
        cssClass: 'text-center',
        columnGroup: 'Period',
        sortable: true,
        filterable: true,
        formatter: Formatters.checkmarkMaterial,
        exportWithFormatter: false,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,
        },
        editor: { model: Editors.checkbox },
        // editor: { model: Editors.singleSelect, collection: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }], },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        sortable: true,
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
          options: { displayDateMin: 'today' } as VanillaCalendarOption,
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
        resizeCharWidthInPx: 8,
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
          // placeholder: '🔎︎ search city',
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
          collectionAsync: fetch(COUNTRIES_COLLECTION_URL),
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
              command: 'help',
              title: 'Help!',
              iconCssClass: 'mdi mdi-help-circle',
              positionOrder: 66,
              action: () => alert('Please Help!'),
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

    // add custom Header Menu to all columns except "Action"
    columnDefinitions.forEach((col) => {
      col.header = {
        menu: {
          commandItems: [
            { command: '', divider: true, positionOrder: 98 },
            {
              // we can also have multiple nested sub-menus
              command: 'custom-actions',
              title: 'Hello',
              positionOrder: 99,
              commandItems: [
                { command: 'hello-world', title: 'Hello World' },
                { command: 'hello-slickgrid', title: 'Hello SlickGrid' },
                {
                  command: 'sub-menu',
                  title: `Let's play`,
                  cssClass: 'green',
                  subMenuTitle: 'choose your game',
                  subMenuTitleCssClass: 'text-italic salmon',
                  commandItems: [
                    { command: 'sport-badminton', title: 'Badminton' },
                    { command: 'sport-tennis', title: 'Tennis' },
                    { command: 'sport-racquetball', title: 'Racquetball' },
                    { command: 'sport-squash', title: 'Squash' },
                  ],
                },
              ],
            },
            {
              command: 'feedback',
              title: 'Feedback',
              positionOrder: 100,
              commandItems: [
                {
                  command: 'request-update',
                  title: 'Request update from supplier',
                  iconCssClass: 'mdi mdi-star',
                  tooltip: 'this will automatically send an alert to the shipping team to contact the user for an update',
                },
                'divider',
                {
                  command: 'sub-menu',
                  title: 'Contact Us',
                  iconCssClass: 'mdi mdi-account',
                  subMenuTitle: 'contact us...',
                  subMenuTitleCssClass: 'italic',
                  commandItems: [
                    { command: 'contact-email', title: 'Email us', iconCssClass: 'mdi mdi-pencil-outline' },
                    { command: 'contact-chat', title: 'Chat with us', iconCssClass: 'mdi mdi-message-text-outline' },
                    { command: 'contact-meeting', title: 'Book an appointment', iconCssClass: 'mdi mdi-coffee' },
                  ],
                },
              ],
            },
          ],
        },
      };
    });

    const gridOptions: GridOption = {
      editable: true,
      autoAddCustomEditorFormatter: customEditableInputFormatter,
      enableCellNavigation: true,
      autoEdit: true,
      autoCommitEdit: true,
      autoResize: {
        container: '#smaller-container',
        rightPadding: 10,
      },
      gridWidth: '100%',
      enableAutoResize: true,
      enablePagination: true,
      pagination: {
        pageSize: 10,
        pageSizes: [10, 200, 500, 5000],
      },

      // resizing by cell content is opt-in
      // we first need to disable the 2 default flags to autoFit/autosize
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      // then enable resize by content with these 2 flags
      autosizeColumnsByCellContentOnFirstLoad: true,
      enableAutoResizeColumnsByCellContent: true,

      // optional resize calculation options
      resizeByContentOptions: {
        defaultRatioForStringType: 0.92,
        formatterPaddingWidthInPx: 8, // optional editor formatter padding for resize calculation
      },

      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: false,
      },
      externalResources: [new ExcelExportService()],
      enableFiltering: true,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
      },
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      rowHeight: 33,
      headerRowHeight: 35,
      editCommandHandler: (item, column, editCommand) => {
        const prevSerializedValues = Array.isArray(editCommand.prevSerializedValue)
          ? editCommand.prevSerializedValue
          : [editCommand.prevSerializedValue];
        const serializedValues = Array.isArray(editCommand.serializedValue) ? editCommand.serializedValue : [editCommand.serializedValue];
        const editorColumns = columnDefinitions.filter((col) => col.editor !== undefined);

        const modifiedColumns: Column[] = [];
        prevSerializedValues.forEach((_val, index) => {
          const prevSerializedValue = prevSerializedValues[index];
          const serializedValue = serializedValues[index];

          if (prevSerializedValue !== serializedValue) {
            const finalColumn = Array.isArray(editCommand.prevSerializedValue) ? editorColumns[index] : column;
            editedItems[gridOptions?.datasetIdPropertyName ?? 'id'] = item; // keep items by their row indexes, if the row got edited twice then we'll keep only the last change
            reactGridRef.current?.slickGrid.invalidate();
            editCommand.execute();

            renderUnsavedCellStyling(item, finalColumn, editCommand);
            modifiedColumns.push(finalColumn);
          }
        });

        // queued editor, so we'll push only 1 change at the end but with all columns modified
        // this way we can undo the entire row change (for example if user changes 3 field in the editor modal, then doing a undo last change will undo all 3 in 1 shot)
        editQueue.push({ item, columns: modifiedColumns, editCommand });
      },
      // when using the cellMenu, you can change some of the default options and all use some of the callback methods
      enableCellMenu: true,
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function loadData(count: number) {
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
        completed: isCompleted || (i % 3 === 0 && randomFinish > new Date() && i > 3),
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

  function handleDefaultResizeColumns() {
    // just for demo purposes, set it back to its original width
    const columns = reactGridRef.current?.slickGrid.getColumns() as Column[];
    columns.forEach((col) => (col.width = col.originalWidth));
    reactGridRef.current?.slickGrid.updateColumns();
    reactGridRef.current?.slickGrid.autosizeColumns();
    setIsUsingDefaultResize(true);
  }

  function handleNewResizeColumns() {
    reactGridRef.current?.resizerService.resizeColumnsByCellContent(true);
    setIsUsingDefaultResize(false);
  }

  function handleOnSelectedRowIdsChanged(args: any) {
    console.log('Selected Ids:', args.selectedRowIds);
  }

  function toggleGridEditReadonly() {
    // first need undo all edits
    undoAllEdits();

    // then change a single grid options to make the grid non-editable (readonly)
    const newIsGridEditable = !isGridEditable;
    setIsGridEditable(newIsGridEditable);

    // dynamically change SlickGrid editable grid option
    reactGridRef.current?.slickGrid.setOptions({ editable: isGridEditable });
  }

  function removeUnsavedStylingFromCell(_item: any, column: Column, row: number) {
    // remove unsaved css class from that cell
    reactGridRef.current?.slickGrid.removeCellCssStyles(`unsaved_highlight_${[column.id]}${row}`);
  }

  function removeAllUnsavedStylingFromCell() {
    for (const lastEdit of editQueue) {
      const lastEditCommand = lastEdit?.editCommand;
      if (lastEditCommand) {
        // remove unsaved css class from that cell
        for (const lastEditColumn of lastEdit.columns) {
          removeUnsavedStylingFromCell(lastEdit.item, lastEditColumn, lastEditCommand.row);
        }
      }
    }
  }

  function renderUnsavedCellStyling(item: any, column: Column, editCommand: EditCommand) {
    if (editCommand && item && column) {
      const row = reactGridRef.current?.dataView.getRowByItem(item) as number;
      if (row >= 0) {
        const hash = { [row]: { [column.id]: 'unsaved-editable-field' } };
        reactGridRef.current?.slickGrid.setCellCssStyles(`unsaved_highlight_${[column.id]}${row}`, hash);
      }
    }
  }

  // change row selection dynamically and apply it to the DataView and the Grid UI
  function setSelectedRowIds() {
    // change row selection even across multiple pages via DataView
    reactGridRef.current?.dataView?.setSelectedIds([3, 4, 11]);

    // you can also provide optional options (all defaults to true)
    // sgb.dataView?.setSelectedIds([4, 5, 8, 10], {
    //   isRowBeingAdded: true,
    //   shouldTriggerEvent: true,
    //   applyGridRowSelection: true
    // });
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

  function toggleAutoEdit(state: boolean) {
    reactGridRef.current?.slickGrid?.setOptions({ autoEdit: state });
  }

  function toggleAutoEditByKeypress(state: boolean) {
    reactGridRef.current?.slickGrid?.setOptions({ autoEditByKeypress: state });
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
        icon: `mdi ${getRandomIcon(0)}`,
      },
      {
        id: 1,
        itemName: 'Tasty Granite Table',
        itemNameTranslated: 'an extremely huge and heavy table',
        listPrice: 3200.12,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/Fnm7j6h.jpg',
        icon: `mdi ${getRandomIcon(1)}`,
      },
      {
        id: 2,
        itemName: 'Awesome Wooden Mouse',
        itemNameTranslated: 'super old mouse',
        listPrice: 15.0,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/RaVJuLr.jpg',
        icon: `mdi ${getRandomIcon(2)}`,
      },
      {
        id: 3,
        itemName: 'Gorgeous Fresh Shirt',
        itemNameTranslated: 'what a gorgeous shirt seriously',
        listPrice: 25.76,
        itemTypeName: 'I',
        image: 'http://i.stack.imgur.com/pC1Tv.jpg',
        icon: `mdi ${getRandomIcon(3)}`,
      },
      {
        id: 4,
        itemName: 'Refined Cotton Table',
        itemNameTranslated: 'super light table that will fall apart amazingly fast',
        listPrice: 13.35,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/Fnm7j6h.jpg',
        icon: `mdi ${getRandomIcon(4)}`,
      },
      {
        id: 5,
        itemName: 'Intelligent Wooden Pizza',
        itemNameTranslated: 'wood not included',
        listPrice: 23.33,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/RaVJuLr.jpg',
        icon: `mdi ${getRandomIcon(5)}`,
      },
      {
        id: 6,
        itemName: 'Licensed Cotton Chips',
        itemNameTranslated: 'not sure what that is',
        listPrice: 71.21,
        itemTypeName: 'I',
        image: 'http://i.stack.imgur.com/pC1Tv.jpg',
        icon: `mdi ${getRandomIcon(6)}`,
      },
      {
        id: 7,
        itemName: 'Ergonomic Rubber Soap',
        itemNameTranslated: `so good you'll want to use it every night`,
        listPrice: 2.43,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/Fnm7j6h.jpg',
        icon: `mdi ${getRandomIcon(7)}`,
      },
      {
        id: 8,
        itemName: 'Handcrafted Steel Car',
        itemNameTranslated: `aka tesla truck`,
        listPrice: 31288.39,
        itemTypeName: 'I',
        image: 'https://i.imgur.com/RaVJuLr.jpg',
        icon: `mdi ${getRandomIcon(8)}`,
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
        Example 32: Columns Resize by Content
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example32.tsx"
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
        The grid below uses the optional resize by cell content (with a fixed 950px for demo purposes), you can click on the 2 buttons to
        see the difference. The "autosizeColumns" is really the default option used by SlickGrid-Universal, the resize by cell content is
        optional because it requires to read the first thousand rows and do extra width calculation.
      </div>

      <h4 className="ml-3">Container Width (950px)</h4>

      <div className="row">
        <div className="ml-2 mb-2 mr-2">
          <div className="btn-group btn-group-toggle" data-bs-toggle="buttons">
            <label
              className={'btn btn-sm btn-outline-secondary btn-icon ' + (isUsingDefaultResize ? 'active' : '')}
              data-test="autosize-columns-btn"
            >
              <input
                type="radio"
                className="btn-check"
                name="options"
                defaultChecked={isUsingDefaultResize}
                onClick={() => handleDefaultResizeColumns()}
              />
              <i className="mdi mdi-arrow-expand"></i> (default resize) by "autosizeColumns"
            </label>
            <label
              className={'btn btn-sm btn-outline-secondary btn-icon ' + (isUsingDefaultResize ? '' : 'active')}
              data-test="resize-by-content-btn"
            >
              <input
                type="radio"
                className="btn-check"
                name="options"
                defaultChecked={!isUsingDefaultResize}
                onClick={() => handleNewResizeColumns()}
              />
              <i className="mdi mdi-arrow-expand"></i> Resize by Cell Content
            </label>
          </div>
          <span className="ms-3 h5">Container Width (950px)</span>
        </div>

        <div className="mb-2">
          <div className="btn-group btn-group-sm" role="group" aria-label="Basic Editing Commands">
            <button
              type="button"
              className="btn btn-outline-secondary btn-icon"
              onClick={() => setSelectedRowIds()}
              data-test="set-dynamic-rows-btn"
              title="Change Row Selection across multiple pages"
            >
              <span>Change Row Selection</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-icon"
              data-test="toggle-readonly-btn"
              onClick={() => toggleGridEditReadonly()}
            >
              <i className="mdi mdi-table-edit"></i> Toggle Readonly
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-icon"
              data-test="undo-last-edit-btn"
              onClick={() => undoLastEdit()}
            >
              <i className="mdi mdi-undo"></i> Undo Last Edit
            </button>
            <button type="button" className="btn btn-outline-secondary btn-icon" data-test="save-all-btn" onClick={() => saveAll()}>
              Save All
            </button>
          </div>
          <span className="ms-2">
            <code>autoEdit</code>
          </span>
          <div className="btn-group" role="group" aria-label="autoEdit">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              data-test="auto-edit-on-btn"
              onClick={() => toggleAutoEdit(true)}
            >
              ON
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              data-test="auto-edit-off-btn"
              onClick={() => toggleAutoEdit(false)}
            >
              OFF
            </button>
          </div>
          <span className="ms-2">
            <code>autoEditByKeypress</code>
          </span>
          <div className="btn-group" role="group" aria-label="autoEditByKeypress">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              data-test="auto-edit-key-on-btn"
              onClick={() => toggleAutoEditByKeypress(true)}
            >
              ON
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              data-test="auto-edit-key-off-btn"
              onClick={() => toggleAutoEditByKeypress(false)}
            >
              OFF
            </button>
          </div>
        </div>
      </div>

      <div id="smaller-container" style={{ width: '950px' }}>
        <SlickgridReact
          gridId="grid32"
          columns={columnDefinitions}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
          onSelectedRowIdsChanged={($event) => handleOnSelectedRowIdsChanged($event.detail.args)}
        />
      </div>
    </div>
  );
};

export default Example32;
