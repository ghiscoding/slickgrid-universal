import { Component, type OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  type AngularGridInstance,
  AngularUtilService,
  type Column,
  Editors,
  Filters,
  Formatters,
  type GridOption,
  type MultipleSelectOption,
  type OnEventArgs,
  SlickGlobalEditorLock,
  type SliderOption,
} from '../../library';
import { EditorNgSelectComponent } from './editor-ng-select.component';
import { CustomAngularComponentEditor } from './custom-angularComponentEditor';
import { CustomAngularComponentFilter } from './custom-angularComponentFilter';
import { CustomTitleFormatterComponent } from './custom-titleFormatter.component';
import { FilterNgSelectComponent } from './filter-ng-select.component';
import { CustomButtonFormatterComponent } from './custom-buttonFormatter.component';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';

const NB_ITEMS = 100;

@Component({
  templateUrl: './example26.component.html',
  styleUrls: ['./example26.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [AngularUtilService],
  standalone: false,
})
export class Example26Component implements OnInit {
  private _commandQueue: any[] = [];
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset!: any[];
  gridObj: any;
  hideSubTitle = false;
  isAutoEdit = true;
  alertWarning: any;
  updatedObject: any;
  selectedLanguage = 'en';
  assignees = [
    { id: '', name: '' },
    { id: '1', name: 'John' },
    { id: '2', name: 'Pierre' },
    { id: '3', name: 'Paul' },
  ];

  constructor(
    private angularUtilService: AngularUtilService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.prepareGrid();
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridObj = angularGrid.slickGrid;
  }

  prepareGrid() {
    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        minWidth: 100,
        filterable: true,
        sortable: true,
        editor: {
          model: Editors.longText,
          minLength: 5,
          maxLength: 255,
        },
        onCellChange: (e: Event, args: OnEventArgs) => {
          console.log(args);
          this.alertWarning = `Updated Title: ${args.dataContext.title}`;
        },
      },
      {
        id: 'title2',
        name: 'Title with Angular Component',
        field: 'title',
        minWidth: 100,
        sortable: true,
        // loading formatter, text to display while Post Render gets processed
        formatter: () => '...',

        // if the component needs to stay and be interactive after rendering
        asyncPostRender: this.renderInteractiveAngularComponent.bind(this),
        params: {
          component: CustomButtonFormatterComponent,
          angularUtilService: this.angularUtilService,
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
          model: CustomAngularComponentFilter, // create a new instance to make each Filter independent from each other
          collection: this.assignees,
          params: {
            component: FilterNgSelectComponent,
          },
        },
        queryFieldFilter: 'assignee.id', // for a complex object it's important to tell the Filter which field to query and our CustomAngularComponentFilter returns the "id" property
        queryFieldSorter: 'assignee.name',
        formatter: Formatters.complexObject,
        params: {
          complexFieldLabel: 'assignee.name',
        },
        exportWithFormatter: true,
        editor: {
          model: CustomAngularComponentEditor,
          collection: this.assignees,
          params: {
            component: EditorNgSelectComponent,
          },
        },
        onCellChange: (e: Event, args: OnEventArgs) => {
          console.log(args);
          this.alertWarning = `Updated Title: ${args.dataContext.title}`;
        },
      },
      {
        id: 'assignee2',
        name: 'Assignee with Angular Component',
        field: 'assignee',
        minWidth: 125,
        filterable: true,
        sortable: true,
        filter: {
          model: CustomAngularComponentFilter, // create a new instance to make each Filter independent from each other
          collection: this.assignees,
          params: {
            component: FilterNgSelectComponent,
          },
        },
        queryFieldFilter: 'assignee.id', // for a complex object it's important to tell the Filter which field to query and our CustomAngularComponentFilter returns the "id" property
        queryFieldSorter: 'assignee.name',

        // loading formatter, text to display while Post Render gets processed
        formatter: () => '...',

        // to load an Angular Component, you cannot use a Formatter since Angular needs at least 1 cycle to render everything
        // you can use a PostRenderer but you will visually see the data appearing,
        // which is why it's still better to use regular Formatter instead of Angular Component
        asyncPostRender: this.renderAngularComponent.bind(this),
        params: {
          component: CustomTitleFormatterComponent,
          angularUtilService: this.angularUtilService,
          complexFieldLabel: 'assignee.name', // for the exportCustomFormatter
        },
        exportCustomFormatter: Formatters.complexObject,
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 100,
        filterable: true,
        formatter: Formatters.multiple,
        type: 'number',
        editor: {
          model: Editors.singleSelect,

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
          options: { maxHeight: 400 } as MultipleSelectOption,
        },
        filter: {
          model: Filters.slider,
          operator: '>=',
          options: { hideSliderNumber: false } as SliderOption,
        },
        params: {
          formatters: [Formatters.collectionEditor, Formatters.percentCompleteBar],
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        minWidth: 100,
        filterable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        sortable: true,
        type: 'date',
        editor: {
          model: Editors.date,
        },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        minWidth: 100,
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        type: 'date',
        editor: {
          model: Editors.date,
        },
      },
      {
        id: 'action',
        name: 'Action',
        field: 'id',
        maxWidth: 100,
        formatter: () => `<div class="cell-menu-dropdown">Action<i class="mdi mdi-chevron-down"></i></div>`,
        cellMenu: {
          commandTitle: 'Commands',
          commandItems: [
            {
              command: 'help',
              title: 'Help',
              iconCssClass: 'mdi mdi-help-circle text-info',
              positionOrder: 66,
              action: () => alert('Please Help!'),
            },
            {
              command: 'delete-row',
              title: 'Delete Row',
              positionOrder: 64,
              iconCssClass: 'mdi mdi-close color-danger',
              cssClass: 'red',
              textCssClass: 'text-italic color-danger-light',
              action: (_event, args) => this.angularGrid.gridService.deleteItemById(args.dataContext.id),
            },
          ],
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
      headerRowHeight: 45,
      rowHeight: 45, // increase row height so that the ng-select fits in the cell
      editable: true,
      enableCellMenu: true,
      enableCellNavigation: true,
      enableColumnPicker: true,
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      enableAsyncPostRender: true, // for the Angular PostRenderer, don't forget to enable it
      asyncPostRenderDelay: 0, // also make sure to remove any delay to render it
      editCommandHandler: (item, column, editCommand) => {
        this._commandQueue.push(editCommand);
        editCommand.execute();
      },
      externalResources: [new SlickCustomTooltip()],
      i18n: this.translate,
      params: {
        angularUtilService: this.angularUtilService, // provide the service to all at once (Editor, Filter, AsyncPostRender)
      },
    };

    this.dataset = this.mockData(NB_ITEMS);
  }

  mockData(itemCount: number, startingIndex = 0) {
    // mock a dataset
    const tempDataset = [];
    for (let i = startingIndex; i < startingIndex + itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      tempDataset.push({
        id: i,
        title: 'Task ' + i,
        assignee: i % 3 ? this.assignees[3] : i % 2 ? this.assignees[2] : this.assignees[1],
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

  onCellChanged(e: Event, args: any) {
    this.updatedObject = args.item;
  }

  onCellClicked(e: Event, args: any) {
    const metadata = this.angularGrid.gridService.getColumnFromEventArguments(args);
    console.log(metadata);

    if (metadata.columnDef.id === 'edit') {
      this.alertWarning = `open a modal window to edit: ${metadata.dataContext.title}`;

      // highlight the row, to customize the color, you can change the SASS variable $row-highlight-background-color
      this.angularGrid.gridService.highlightRow(args.row, 1500);

      // you could also select the row, when using "enableCellNavigation: true", it automatically selects the row
      // this.angularGrid.gridService.setSelectedRow(args.row);
    } else if (metadata.columnDef.id === 'delete') {
      if (confirm('Are you sure?')) {
        this.angularGrid.gridService.deleteItemById(metadata.dataContext.id);
      }
    }
  }

  onCellValidationError(e: Event, args: any) {
    alert(args.validationResults.msg);
  }

  changeAutoCommit() {
    this.gridOptions.autoCommitEdit = !this.gridOptions.autoCommitEdit;
    this.gridObj.setOptions({
      autoCommitEdit: this.gridOptions.autoCommitEdit,
    });
    return true;
  }

  setAutoEdit(isAutoEdit: boolean) {
    this.isAutoEdit = isAutoEdit;
    this.gridObj.setOptions({ autoEdit: isAutoEdit }); // change the grid option dynamically
    return true;
  }

  undo() {
    const command = this._commandQueue.pop();
    if (command && SlickGlobalEditorLock.cancelCurrentEdit()) {
      command.undo();
      this.gridObj.gotoCell(command.row, command.cell, false);
    }
  }

  renderAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component) {
      // the last 2 arguments of createAngularComponent() are optional
      // but when they are provided, that is the DOM target (cellNode) and the dataContext,
      // the util will render everything for you without too much delay
      const componentOutput = this.angularUtilService.createAngularComponent(colDef.params.component, cellNode, { item: dataContext });
      componentOutput.componentRef.destroy(); // cleanup no longer needed temp component
    }
  }

  renderInteractiveAngularComponent(cellNode: HTMLElement, row: number, dataContext: any, colDef: Column) {
    if (colDef.params.component) {
      this.angularUtilService.createInteractiveAngularComponent(colDef.params.component, cellNode, { item: dataContext });
    }
  }

  /* Create an Action Dropdown Menu */
  deleteCell(rowNumber: number) {
    const item = this.angularGrid.dataView.getItem(rowNumber);
    this.angularGrid.gridService.deleteItemById(item.id);
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.angularGrid.resizerService.resizeGrid(0);
  }
}
