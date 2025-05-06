import { resolve } from 'aurelia';
import {
  type AureliaGridInstance,
  AureliaUtilService,
  type Column,
  type EditCommand,
  Editors,
  Filters,
  Formatters,
  type GridOption,
  type OnEventArgs,
  OperatorType,
  SlickGlobalEditorLock,
  type SliderOption,
  type ViewModelBindableInputData,
} from 'aurelia-slickgrid';
import { CustomAureliaViewModelEditor } from './custom-aureliaViewModelEditor.js';
import { CustomAureliaViewModelFilter } from './custom-aureliaViewModelFilter.js';
import { CustomTitleFormatter } from './custom-title-formatter.js';
import { EditorSelect } from './editor-select.js';
import { FilterSelect } from './filter-select.js';

const NB_ITEMS = 100;

export class Example26 {
  title = 'Example 26: Use of Aurelia Custom Elements';
  subTitle = `
  <h5>Filters, Editors, AsyncPostRender with Aurelia Custom Elements</h5>
  Grid with usage of Aurelia Custom Elements as Editor &amp; AsyncPostRender (similar to Formatter).
  <ul>
    <li>Support of Aurelia Custom Element as Custom Editor (click on any "Assignee" name cell)</li>
    <ul>
      <li>That column uses a simple select drodown wrapped in an Aurelia Custom Element</li>
      <li>Increased Grid Options "rowHeight" &amp; "headerRowHeight" to 45 so that the Custom Element fits in the cell.</li>
    </ul>
    <li>Support of Aurelia Custom Element as Custom Filter ("Assignee" columns), which also uses Custom Element</li>
    <li>The 2nd "Assignee" column (showing in bold text) uses "asyncPostRender" with an Aurelia Custom Element</li>
    <ul>
      <li>Why can't we use Aurelia Custom Element as Customer Formatter and why do I see a slight delay in loading the data?</li>
      <li>It's totally normal since SlickGrid Formatters only accept strings (synchronously),
      so we cannot use that (Aurelia requires at least 1 full cycle to render the element), so we are left with SlickGrid "asyncPostRender" and
      it works but as the name suggest it's async users might see noticeable delay in loading the data
      </li>
    </ul>
  </ul>
  `;
  private _commandQueue: EditCommand[] = [];
  aureliaGrid!: AureliaGridInstance;
  gridOptions!: GridOption;
  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  updatedObject: any;
  hideSubTitle = false;
  isAutoEdit = true;
  alertWarning: any;
  assignees = [
    { id: '', name: '' },
    { id: '1', name: 'John' },
    { id: '2', name: 'Pierre' },
    { id: '3', name: 'Paul' },
  ];

  constructor(private aureliaUtilService: AureliaUtilService = resolve(AureliaUtilService)) {
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
        id: 'title',
        name: 'Title',
        field: 'title',
        filterable: true,
        sortable: true,
        editor: {
          model: Editors.longText,
          minLength: 5,
          maxLength: 255,
        },
        minWidth: 100,
        onCellChange: (_e: Event, args: OnEventArgs) => {
          console.log(args);
          this.alertWarning = `Updated Title: ${args.dataContext.title}`;
        },
      },
      {
        id: 'assignee',
        name: 'Assignee',
        field: 'assignee',
        minWidth: 100,
        filterable: true,
        sortable: true,
        filter: {
          model: CustomAureliaViewModelFilter,
          collection: this.assignees,
          params: {
            viewModel: FilterSelect,
            // aureliaUtilService: this.aureliaUtilService, // pass the aureliaUtilService here OR in the grid option params
            // templateUrl: PLATFORM.moduleName('examples/slickgrid/filter-select') // FilterSelect,
          },
        },
        queryFieldFilter: 'assignee.id', // for a complex object it's important to tell the Filter which field to query and our CustomAureliaComponentFilter returns the "id" property
        queryFieldSorter: 'assignee.name',
        formatter: Formatters.complexObject,
        params: {
          complexFieldLabel: 'assignee.name',
        },
        exportWithFormatter: true,
        editor: {
          model: CustomAureliaViewModelEditor,
          collection: this.assignees,
          params: {
            viewModel: EditorSelect,
            // aureliaUtilService: this.aureliaUtilService, // pass the aureliaUtilService here OR in the grid option params
            // templateUrl: PLATFORM.moduleName('examples/slickgrid/editor-select') // EditorSelect,
          },
        },
        onCellChange: (_e: Event, args: OnEventArgs) => {
          console.log(args);
          this.alertWarning = `Updated Title: ${args.dataContext.title}`;
        },
      },
      {
        id: 'assignee2',
        name: 'Assignee with Aurelia Component',
        field: 'assignee',
        minWidth: 125,
        filterable: true,
        sortable: true,
        filter: {
          model: CustomAureliaViewModelFilter,
          collection: this.assignees,
          params: {
            viewModel: FilterSelect,
            // aureliaUtilService: this.aureliaUtilService, // pass the aureliaUtilService here OR in the grid option params
            // templateUrl: PLATFORM.moduleName('examples/slickgrid/filter-select') // FilterSelect,
          },
        },
        queryFieldFilter: 'assignee.id', // for a complex object it's important to tell the Filter which field to query and our CustomAureliaComponentFilter returns the "id" property
        queryFieldSorter: 'assignee.name',

        // loading formatter, text to display while Post Render gets processed
        formatter: () => '...',

        // to load an Aurelia Custom Element, you cannot use a Formatter since Aurelia needs at least 1 cycle to render everything
        // you can use a PostRenderer but you will visually see the data appearing,
        // which is why it's still better to use regular Formatter instead of Aurelia Custom Element
        asyncPostRender: this.renderAureliaComponent.bind(this),
        params: {
          viewModel: CustomTitleFormatter,
          // templateUrl: PLATFORM.moduleName('examples/slickgrid/custom-title-formatter'), // CustomTitleFormatterCustomElement,
          complexFieldLabel: 'assignee.name', // for the exportCustomFormatter
        },
        exportCustomFormatter: Formatters.complexObject,
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
        type: 'date',
        editor: {
          model: Editors.date,
        },
      },
    ];

    this.gridOptions = {
      asyncEditorLoading: false,
      autoEdit: this.isAutoEdit,
      autoCommitEdit: false,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      rowHeight: 45, // increase row height so that the custom elements fits in the cell
      editable: true,
      enableCellNavigation: true,
      enableColumnPicker: true,
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      enableAsyncPostRender: true, // for the Aurelia PostRenderer, don't forget to enable it
      asyncPostRenderDelay: 0, // also make sure to remove any delay to render it
      editCommandHandler: (_item, _column, editCommand) => {
        this._commandQueue.push(editCommand);
        editCommand.execute();
      },
      params: {
        aureliaUtilService: this.aureliaUtilService, // provide the service to all at once (Editor, Filter, AsyncPostRender)
      },
    };
  }

  mockData(itemCount: number, startingIndex = 0) {
    // mock a dataset
    const tempDataset: any[] = [];
    for (let i = startingIndex; i < startingIndex + itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      tempDataset.push({
        id: i,
        title: 'Task ' + i,
        assignee: i % 3 ? this.assignees[2] : i % 2 ? this.assignees[1] : this.assignees[0],
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      });
    }
    return tempDataset;
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

  onCellValidation(_e: Event, args: any) {
    alert(args.validationResults.msg);
  }

  changeAutoCommit() {
    this.gridOptions.autoCommitEdit = !this.gridOptions.autoCommitEdit;
    this.aureliaGrid.slickGrid.setOptions({
      autoCommitEdit: this.gridOptions.autoCommitEdit,
    });
    return true;
  }

  renderAureliaComponent(cellNode: HTMLElement, _row: number, dataContext: any, colDef: Column) {
    if (colDef.params.viewModel && cellNode) {
      const bindableData = {
        model: dataContext,
        grid: this.aureliaGrid.slickGrid,
      } as ViewModelBindableInputData;
      this.aureliaUtilService.createAureliaViewModelAddToSlot(colDef.params.viewModel, bindableData, cellNode);
    }
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
