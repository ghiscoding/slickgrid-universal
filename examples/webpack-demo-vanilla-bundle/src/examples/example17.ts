import { Column, Formatters, GridOption, SlickCellRangeSelector, SlickCellSelectionModel, SlickRowSelectionModel } from '@slickgrid-universal/common';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';

// use any of the Styling Theme
import '../material-styles.scss';
// import '../salesforce-styles.scss';
import './example17.scss';

const NB_ITEMS = 995;

export class Example17 {
  gridOptions1: GridOption;
  gridOptions2: GridOption;
  columnDefinitions1: Column[];
  columnDefinitions2: Column[];
  dataset1: any[];
  dataset2: any[];
  sgb1: SlickVanillaGridBundle;
  sgb2: SlickVanillaGridBundle;
  isAutoScroll = true;
  minInterval = 30;
  maxInterval = 600;
  delayCursor = 5;

  attached() {
    this.defineGrids();

    // mock some data (different in each dataset)
    this.dataset1 = this.mockData(NB_ITEMS);
    this.dataset2 = this.mockData(NB_ITEMS);

    this.sgb1 = new Slicker.GridBundle(document.querySelector<HTMLDivElement>(`.grid1`), this.columnDefinitions1, { ...ExampleGridOptions, ...this.gridOptions1 }, this.dataset1);
    this.sgb2 = new Slicker.GridBundle(document.querySelector<HTMLDivElement>(`.grid2`), this.columnDefinitions2, { ...ExampleGridOptions, ...this.gridOptions2 }, this.dataset2);

    this.setOptions();
  }

  dispose() {
    this.sgb1?.dispose();
    this.sgb2?.dispose();
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100, filterable: true },
      { id: 'duration', name: 'Duration', field: 'duration', sortable: true, minWidth: 100, filterable: true },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100, filterable: true, formatter: Formatters.percentCompleteBar },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, minWidth: 120, exportWithFormatter: true, filterable: true },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, minWidth: 120, exportWithFormatter: true, filterable: true },
      { id: 'cost', name: 'Cost', field: 'cost', formatter: Formatters.dollar, minWidth: 75, exportWithFormatter: true, filterable: true },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', formatter: Formatters.checkmarkMaterial, sortable: true, minWidth: 75, filterable: true }
    ];

    for (let i = 0; i < 30; i++) {
      this.columnDefinitions1.push({ id: `mock${i}`, name: `Mock${i}`, field: `mock${i}`, minWidth: 75 });
    }

    this.gridOptions1 = {
      enableAutoResize: false,
      enableCellNavigation: true,
      gridHeight: 225,
      gridWidth: 800,
      rowHeight: 33,
      // enableExcelCopyBuffer: true,
    };

    // copy the same Grid Options and Column Definitions to 2nd grid
    this.columnDefinitions2 = this.columnDefinitions1;
    this.gridOptions2 = {
      ...this.gridOptions1,
      ...{
        enableCheckboxSelector: true,
        // enableExcelCopyBuffer: false,
        gridHeight: 255,
      }
    };
  }

  mockData(count: number) {
    // mock a dataset
    const mockDataset = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        cost: Math.round(Math.random() * 10000) / 100,
        effortDriven: (i % 5 === 0)
      };
      for (let j = 0; j < 30; j++) {
        mockDataset[i]['mock' + j] = j;
      }
    }

    return mockDataset;
  }

  toggleFrozen() {
    const option = this.sgb1.slickGrid.getOptions();
    const frozenRow = option.frozenRow;
    const frozenColumn = option.frozenColumn;
    const newOption = {
      frozenColumn: frozenColumn === -1 ? 1 : -1,
      frozenRow: frozenRow === -1 ? 3 : -1
    };
    this.sgb1.slickGrid.setOptions(newOption);
    this.sgb2.slickGrid.setOptions(newOption);
  }

  setDefaultOptions() {
    this.isAutoScroll = true;
    this.minInterval = 30;
    this.maxInterval = 600;
    this.delayCursor = 5;
    this.setOptions();
  }

  setOptions() {
    this.sgb1.slickGrid.setSelectionModel(new SlickCellSelectionModel({
      selectActiveCell: true,
      cellRangeSelector: new SlickCellRangeSelector({
        selectionCss: {
          border: '2px dashed #01b83b'
        } as CSSStyleDeclaration,
        autoScroll: this.isAutoScroll,
        minIntervalToShowNextCell: +this.minInterval,
        maxIntervalToShowNextCell: +this.maxInterval,
        accelerateInterval: +this.delayCursor
      })
    }));

    this.sgb2.slickGrid.setSelectionModel(new SlickRowSelectionModel({
      cellRangeSelector: new SlickCellRangeSelector({
        selectionCss: {
          border: 'none'
        } as CSSStyleDeclaration,
        autoScroll: this.isAutoScroll,
        minIntervalToShowNextCell: +this.minInterval,
        maxIntervalToShowNextCell: +this.maxInterval,
        accelerateInterval: +this.delayCursor
      })
    }));
    this.sgb1.slickGrid.invalidate();
    this.sgb2.slickGrid.invalidate();
  }
}
