import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Formatters, SlickEventHandler, type AureliaGridInstance, type Column, type GridOption } from 'aurelia-slickgrid';

const NB_ITEMS = 995;

export class Example48 {
  protected _eventHandler: SlickEventHandler;
  aureliaGrid1!: AureliaGridInstance;
  aureliaGrid2!: AureliaGridInstance;
  columnDefinitions1: Column[] = [];
  columnDefinitions2: Column[] = [];
  gridOptions1!: GridOption;
  gridOptions2!: GridOption;
  dataset1!: any[];
  dataset2!: any[];
  hideSubTitle = false;

  constructor() {
    this._eventHandler = new SlickEventHandler();
    // define the grid options & columns and then create the grid itself
    this.defineGrids();
  }

  attached() {
    // mock some data (different in each dataset)
    this.dataset1 = this.mockData(NB_ITEMS);
    this.dataset2 = this.mockData(NB_ITEMS);
  }

  aureliaGridReady1(aureliaGrid1: AureliaGridInstance) {
    this.aureliaGrid1 = aureliaGrid1;

    const cellSelectionModel1 = aureliaGrid1.slickGrid!.getSelectionModel()!;
    this._eventHandler.subscribe(cellSelectionModel1.onSelectedRangesChanged, (_e, args) => {
      const targetRange = document.querySelector('#selectionRange1') as HTMLSpanElement;
      targetRange.textContent = '';
      for (const slickRange of args) {
        targetRange.textContent += JSON.stringify(slickRange);
      }
    });
  }

  aureliaGridReady2(aureliaGrid2: AureliaGridInstance) {
    this.aureliaGrid2 = aureliaGrid2;

    const cellSelectionModel2 = aureliaGrid2.slickGrid!.getSelectionModel()!;
    this._eventHandler.subscribe(cellSelectionModel2.onSelectedRangesChanged, (_e, args) => {
      const targetRange = document.querySelector('#selectionRange2') as HTMLSpanElement;
      targetRange.textContent = '';
      for (const slickRange of args) {
        targetRange.textContent += JSON.stringify(slickRange);
      }
    });
  }

  defineGrids() {
    this.columnDefinitions1 = [
      { id: 'id', name: '#', field: 'id', width: 32, maxWidth: 40, excludeFromHeaderMenu: true },
      { id: 'title', name: 'Title', field: 'title', width: 90, cssClass: 'cell-title' },
      { id: 'complete', name: '% Complete', field: 'percentComplete', sortable: true, width: 90 },
      { id: 'start', name: 'Start', field: 'start', type: 'date', sortable: true, formatter: Formatters.dateUs },
      { id: 'finish', name: 'Finish', field: 'finish', type: 'date', sortable: true, formatter: Formatters.dateUs },
      {
        id: 'priority',
        name: 'Priority',
        field: 'priority',
        width: 80,
        resizable: false,
        sortable: true,
        type: 'number',
        sortComparer: (x, y, direction) => {
          return (direction ?? 0) * (x === y ? 0 : x > y ? 1 : -1);
        },
        formatter: (_row, _cell, value) => {
          if (!value) {
            return '';
          }
          const count = +(value >= 3 ? 3 : value);
          return count === 3 ? 'High' : count === 2 ? 'Medium' : 'Low';
        },
      },
      {
        id: 'effortDriven',
        name: 'Effort Driven',
        field: 'effortDriven',
        cssClass: 'text-center',
        width: 95,
        maxWidth: 120,
        type: 'boolean',
        sortable: true,
        exportCustomFormatter: (_row, _cell, value) => (value ? 'Yes' : 'No'),
        formatter: Formatters.checkmarkMaterial,
      },
    ];
    this.columnDefinitions2 = [...this.columnDefinitions1];

    this.gridOptions1 = {
      autoResize: {
        container: '.demo-container',
      },
      gridHeight: 250,
      gridWidth: 800,
      enableCellNavigation: true,
      autoEdit: true,
      editable: true,
      headerRowHeight: 35,
      rowHeight: 35,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
      },
      externalResources: [new ExcelExportService()],

      // enable new hybrid selection model (rows & cells)
      enableHybridSelection: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: true,
        rowSelectColumnIds: ['id'],
      },

      // when using the ExcelCopyBuffer, you can see what the selection range is
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        copyActiveEditorCell: true,
        removeDoubleQuotesOnPaste: true,
        replaceNewlinesWith: ' ',
      },
    };

    this.gridOptions2 = {
      ...this.gridOptions1,
      // you can also enable checkbox selection & row selection, make sure to use `rowSelectColumnIds: ['id', '_checkbox_selector']`
      enableCheckboxSelector: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
        rowSelectColumnIds: ['id', '_checkbox_selector'],
      },
    };
  }

  mockData(itemCount: number) {
    const data: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomFinishYear = randomYear + Math.floor(Math.random() * 10);
      const randomFinish = new Date(randomFinishYear, randomMonth + 1, randomDay);

      data[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.floor(Math.random() * 25) + ' days',
        percentComplete: Math.floor(Math.random() * 100),
        start: new Date(randomYear, randomMonth, randomDay, randomDay),
        finish: randomFinish,
        priority: i % 3 ? 2 : i % 5 ? 3 : 1,
        effortDriven: i % 4 === 0,
      };
    }
    return data;
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
  }
}
