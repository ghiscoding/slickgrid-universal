import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { type AureliaGridInstance, type Column, type GridOption, type ItemMetadata } from 'aurelia-slickgrid';
import './example14.scss'; // provide custom CSS/SASS styling

export class Example14 {
  aureliaGrid1!: AureliaGridInstance;
  aureliaGrid2!: AureliaGridInstance;
  gridObj2: any;
  columnDefinitions1: Column[] = [];
  columnDefinitions2: Column[] = [];
  gridOptions1!: GridOption;
  gridOptions2!: GridOption;
  dataset1: any[] = [];
  dataset2: any[] = [];
  hideSubTitle = false;
  isColspanSpreading = false;

  constructor() {
    this.definedGrid1();
    this.definedGrid2();
  }

  attached() {
    // populate the dataset once the grid is ready
    this.dataset1 = this.getData(500);
    this.dataset2 = this.getData(500);
  }

  aureliaGridReady1(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid1 = aureliaGrid;
  }

  aureliaGridReady2(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid2 = aureliaGrid;
    this.gridObj2 = aureliaGrid.slickGrid;
  }

  definedGrid1() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
      { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
      { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
      { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
      { id: '%', name: '% Complete', field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: 'boolean', columnGroup: 'Analysis' },
    ];

    this.gridOptions1 = {
      enableAutoResize: false,
      enableCellNavigation: true,
      enableColumnReorder: false,
      enableSorting: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      gridHeight: 275,
      gridWidth: 800,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: false,
      },
      externalResources: [new ExcelExportService()],
      explicitInitialization: true,
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (item: any, row: number) => this.renderDifferentColspan(item, row),
        },
      },
      gridMenu: {
        iconButtonContainer: 'preheader', // we can display the grid menu icon in either the preheader or in the column header (default)
      },
      spreadHiddenColspan: this.isColspanSpreading,
    };
  }

  definedGrid2() {
    this.columnDefinitions2 = [
      {
        id: 'sel',
        name: '#',
        field: 'num',
        behavior: 'select',
        cssClass: 'cell-selection',
        width: 40,
        resizable: false,
        selectable: false,
      },
      { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
      { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
      { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
      { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
      { id: '%', name: '% Complete', field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: 'boolean', columnGroup: 'Analysis' },
    ];

    this.gridOptions2 = {
      enableCellNavigation: true,
      enableColumnReorder: false,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 25,
      explicitInitialization: true,
      gridHeight: 275,
      gridWidth: 800,
      frozenColumn: 2,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: false,
      },
      externalResources: [new ExcelExportService()],
      gridMenu: { hideClearFrozenColumnsCommand: false },
      headerMenu: { hideFreezeColumnsCommand: false },
    };
  }

  getData(count: number) {
    // Set up some test columns.
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      mockDataset[i] = {
        id: i,
        num: i,
        title: 'Task ' + i,
        duration: '5 days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        effortDriven: i % 5 === 0,
      };
    }
    return mockDataset;
  }

  setFrozenColumns2(frozenCols: number) {
    this.gridObj2.setOptions({ frozenColumn: frozenCols });
    this.gridOptions2 = this.gridObj2.getOptions();
  }

  /**
   * A callback to render different row column span
   * Your callback will always have the "item" argument which you can use to decide on the colspan
   * Your return must always be in the form of:: return { columns: {}}
   */
  renderDifferentColspan(item: any, row: number): ItemMetadata {
    if (item.id % 2 === 1 || row % 2 === 1) {
      return {
        columns: {
          duration: {
            colspan: 3, // "duration" will span over 3 columns
          },
        },
      };
    }
    return {
      columns: {
        0: {
          colspan: '*', // starting at column index 0, we will span accross all column (*)
        },
      },
    };
  }

  spreadColspan() {
    this.isColspanSpreading = !this.isColspanSpreading;
    this.aureliaGrid1.slickGrid?.setOptions({ spreadHiddenColspan: this.isColspanSpreading });
    this.aureliaGrid1.slickGrid?.resetActiveCell();
    this.aureliaGrid1.slickGrid?.invalidate();
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid2.resizerService.resizeGrid(0);
  }
}
