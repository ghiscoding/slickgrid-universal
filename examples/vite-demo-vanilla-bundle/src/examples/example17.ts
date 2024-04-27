import { Aggregators, type Column, Formatters, type GridOption, type Grouping, GroupTotalFormatters, SlickCellRangeSelector, SlickCellSelectionModel, SlickRowSelectionModel } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';

// use any of the Styling Theme
// import '../material-styles.scss';
import './example17.scss';
import '../material-styles.scss';

const NB_ITEMS = 300;

export default class Example17 {
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

    this.sgb1 = new Slicker.GridBundle(document.querySelector(`.grid17-1`) as HTMLDivElement, this.columnDefinitions1, { ...ExampleGridOptions, ...this.gridOptions1 }, this.dataset1);
    this.sgb2 = new Slicker.GridBundle(document.querySelector(`.grid17-2`) as HTMLDivElement, this.columnDefinitions2, { ...ExampleGridOptions, ...this.gridOptions2 }, this.dataset2);

    this.setOptions();
    document.body.classList.add('material-theme');
  }

  dispose() {
    this.sgb1?.dispose();
    this.sgb2?.dispose();
    document.body.classList.remove('material-theme');
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions1 = [
      { id: 'sel', name: '#', field: 'id', cssClass: 'cell-unselectable', resizable: false, selectable: false, focusable: false, width: 40, excludeFromHeaderMenu: true },
      { id: 'title', name: 'Title', field: 'title', cssClass: 'cell-title', sortable: true, width: 90, filterable: true },
      { id: 'duration', name: 'Duration', field: 'duration', width: 90, sortable: true, filterable: true, groupTotalsFormatter: GroupTotalFormatters.sumTotals },
      { id: '%', name: '% Complete', field: 'percentComplete', width: 90, sortable: true, filterable: true, formatter: Formatters.percentCompleteBar },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, width: 90, exportWithFormatter: true, filterable: true },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, width: 90, exportWithFormatter: true, filterable: true },
      { id: 'cost', name: 'Cost', field: 'cost', formatter: Formatters.dollar, width: 90, exportWithFormatter: true, filterable: true },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', cssClass: 'cell-effort-driven', width: 90, formatter: Formatters.checkmarkMaterial, sortable: true, filterable: true }
    ];

    for (let i = 0; i < 30; i++) {
      this.columnDefinitions1.push({ id: `mock${i}`, name: `Mock${i}`, field: `mock${i}`, width: 90 });
    }

    this.gridOptions1 = {
      enableAutoResize: false,
      enableAutoSizeColumns: false,
      autoFitColumnsOnFirstLoad: false,
      autosizeColumnsByCellContentOnFirstLoad: true,
      enableAutoResizeColumnsByCellContent: true,
      enableCellNavigation: true,
      enableColumnReorder: false,
      editable: true,
      asyncEditorLoading: false,
      autoEdit: false,
      enableGrouping: true,
      gridHeight: 350,
      gridWidth: 800,
      rowHeight: 35,
      frozenColumn: -1,
      frozenRow: -1,
      // enableExcelCopyBuffer: true,
    };

    // copy the same Grid Options and Column Definitions to 2nd grid
    this.columnDefinitions2 = this.columnDefinitions1.slice();
    this.gridOptions2 = {
      ...this.gridOptions1,
      ...{
        // enableCheckboxSelector: true,
      }
    };
  }

  mockData(count: number) {
    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: i % 20,
        percentComplete: Math.round(Math.random() * 100),
        start: '2009-01-01',
        finish: '2009-05-05',
        cost: Math.round(Math.random() * 10000) / 100,
        effortDriven: (i % 5 === 0)
      };
      for (let j = 0; j < 30; j++) {
        mockDataset[i]['mock' + j] = j;
      }
    }

    return mockDataset;
  }

  groupByDuration1() {
    this.sgb1.dataView?.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      aggregators: [
        new Aggregators.Avg('percentComplete'),
        new Aggregators.Sum('cost')
      ],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true
    } as Grouping);
  }

  groupByDuration2() {
    this.sgb2.dataView?.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      aggregators: [
        new Aggregators.Avg('percentComplete'),
        new Aggregators.Sum('cost')
      ],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true
    } as Grouping);
  }

  setDefaultOptions() {
    this.isAutoScroll = true;
    this.minInterval = 30;
    this.maxInterval = 600;
    this.delayCursor = 5;
    this.setOptions();
  }

  setOptions() {
    this.sgb1.slickGrid?.setSelectionModel(new SlickCellSelectionModel({
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

    this.sgb2.slickGrid?.setSelectionModel(new SlickRowSelectionModel({
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
    this.sgb1.slickGrid?.invalidate();
    this.sgb2.slickGrid?.invalidate();
  }

  toggleGroup() {
    (this.sgb1.dataView?.getGrouping() && this.sgb1.dataView?.getGrouping().length > 0) ? this.sgb1.dataView?.setGrouping([]) : this.groupByDuration1();
    (this.sgb2.dataView?.getGrouping() && this.sgb2.dataView?.getGrouping().length > 0) ? this.sgb2.dataView?.setGrouping([]) : this.groupByDuration2();
  }

  toggleFrozen() {
    const option = this.sgb1.slickGrid?.getOptions() as GridOption;
    const frozenRow = option.frozenRow;
    const frozenColumn = option.frozenColumn;
    const newOption = {
      frozenColumn: frozenColumn === -1 ? 1 : -1,
      frozenRow: frozenRow === -1 ? 3 : -1
    };
    this.sgb1.slickGrid?.setOptions(newOption);
    this.sgb2.slickGrid?.setOptions(newOption);
  }
}
