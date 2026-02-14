import {
  Editors,
  Formatters,
  type AureliaGridInstance,
  type Column,
  type GridOption,
  type GridService,
  type OnEventArgs,
  type SlickDataView,
  type SlickGrid,
} from 'aurelia-slickgrid';
import './example11.scss';

export class Example11 {
  aureliaGrid!: AureliaGridInstance;
  dataView!: SlickDataView;
  grid!: SlickGrid;
  gridService!: GridService;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];
  hideSubTitle = false;

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
    this.mockData(1000);
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
    this.dataView = aureliaGrid.dataView;
    this.grid = aureliaGrid.slickGrid;
    this.gridService = aureliaGrid.gridService;
    // if you want to change background color of Duration over 50 right after page load,
    // you would put the code here, also make sure to re-render the grid for the styling to be applied right away
    /*
    this.dataView.getItemMetadata = this.updateItemMetadataForDurationOver50(this.dataView.getItemMetadata);
    this.grid.invalidate();
    */
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'delete',
        field: 'id',
        excludeFromHeaderMenu: true,
        formatter: Formatters.icon,
        params: { iconCssClass: 'mdi mdi-trash-can pointer' },
        minWidth: 30,
        maxWidth: 30,
        // use onCellClick OR grid.onClick.subscribe which you can see down below
        onCellClick: (_e: Event, args: OnEventArgs) => {
          console.log(args);
          if (confirm('Are you sure?')) {
            this.aureliaGrid.gridService.deleteItemById(args.dataContext.id);
          }
        },
      },
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
        editor: {
          model: Editors.longText,
        },
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        type: 'number',
        editor: {
          model: Editors.text,
        },
        onCellChange: (_e: Event, args: OnEventArgs) => {
          alert('onCellChange directly attached to the column definition');
          console.log(args);
        },
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        formatter: Formatters.percentCompleteBar,
        type: 'number',
        editor: {
          model: Editors.integer,
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
        /*
        editor: {
          model: Editors.date
        }
        */
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        sortable: true,
        type: 'date',
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
        type: 'number',
        editor: {
          model: Editors.checkbox,
        },
      },
    ];

    this.gridOptions = {
      asyncEditorLoading: false,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      editable: true,
      enableColumnPicker: true,
      enableCellNavigation: true,
      enableSelection: true,
    };
  }

  mockData(itemCount: number) {
    // mock a dataset
    const mockedDataset: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockedDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }
    this.dataset = mockedDataset;
  }

  addNewItem(insertPosition?: 'top' | 'bottom') {
    const newItem1 = this.createNewItem(1);
    // const newItem2 = this.createNewItem(2);

    // single insert
    this.aureliaGrid.gridService.addItem(newItem1, { position: insertPosition });

    // OR multiple inserts
    // this.aureliaGrid.gridService.addItems([newItem1, newItem2], { position: insertPosition });
  }

  createNewItem(incrementIdByHowMany = 1) {
    const dataset = this.aureliaGrid.dataView.getItems();
    let highestId = 0;
    dataset.forEach((item) => {
      if (item.id > highestId) {
        highestId = item.id;
      }
    });
    const newId = highestId + incrementIdByHowMany;
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor(Math.random() * 29);
    const randomPercent = Math.round(Math.random() * 100);

    return {
      id: newId,
      title: 'Task ' + newId,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      percentCompleteNumber: randomPercent,
      start: new Date(randomYear, randomMonth, randomDay),
      finish: new Date(randomYear, randomMonth + 2, randomDay),
      effortDriven: true,
    };
  }

  /** Change the Duration Rows Background Color */
  changeDurationBackgroundColor() {
    this.dataView.getItemMetadata = this.updateItemMetadataForDurationOver40(this.dataView.getItemMetadata);
    // also re-render the grid for the styling to be applied right away
    this.grid.invalidate();
    // or use the Aurelia-SlickGrid GridService
    // this.gridService.renderGrid();
  }

  /** Highlight the 5th row using the Aurelia-Slickgrid GridService */
  highlighFifthRow() {
    this.scrollGridTop();
    this.aureliaGrid.gridService.highlightRow(4, 1500);
  }

  /**
   * Change the SlickGrid Item Metadata, we will add a CSS class on all rows with a Duration over 40
   * For more info, you can see this SO https://stackoverflow.com/a/19985148/1212166
   */
  updateItemMetadataForDurationOver40(previousItemMetadata: any) {
    const newCssClass = 'duration-bg';
    return (rowNumber: number) => {
      const item = this.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: '',
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }
      if (meta && item && item.duration) {
        const duration = +item.duration; // convert to number
        if (duration > 40) {
          meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
        }
      }
      return meta;
    };
  }

  updateSecondItem() {
    this.scrollGridTop();
    const updatedItem = this.aureliaGrid.gridService.getDataItemByRowNumber(1);
    updatedItem.duration = Math.round(Math.random() * 100);
    this.aureliaGrid.gridService.updateItem(updatedItem);

    // OR by id
    // this.aureliaGrid.gridService.updateItemById(updatedItem.id, updatedItem);

    // OR multiple changes
    /*
    const updatedItem1 = this.aureliaGrid.gridService.getDataItemByRowNumber(1);
    const updatedItem2 = this.aureliaGrid.gridService.getDataItemByRowNumber(2);
    updatedItem1.duration = Math.round(Math.random() * 100);
    updatedItem2.duration = Math.round(Math.random() * 100);
    this.aureliaGrid.gridService.updateItems([updatedItem1, updatedItem2], { highlightRow: true });
    */
  }

  scrollGridBottom() {
    this.aureliaGrid.slickGrid.navigateBottom();
  }

  scrollGridTop() {
    this.aureliaGrid.slickGrid.navigateTop();
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
