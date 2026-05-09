import { BindingEventService } from '@slickgrid-universal/binding';
import {
  Aggregators,
  Filters,
  Formatters,
  SortComparers,
  SortDirectionNumber,
  type Column,
  type GridOption,
  type Grouping,
  type OnRowCountChangedEventArgs,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import { randomNumber } from './utilities.js';

const FETCH_SIZE = 50;

export default class Example34 {
  private _bindingEventService: BindingEventService;
  columns: Column[];
  gridOptions: GridOption;
  shouldResetOnSort = false;
  metricsEndTime = '';
  metricsItemCount = 0;
  metricsTotalItemCount = 0;
  sgb: SlickVanillaGridBundle;
  dataset: any[];

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.defineGrid();
    const gridContainerElm = document.querySelector(`.grid34`) as HTMLDivElement;
    this.dataset = this.loadData(0, FETCH_SIZE);

    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    this.metricsItemCount = FETCH_SIZE;
    this.metricsTotalItemCount = FETCH_SIZE;

    // bind any of the grid events
    this._bindingEventService.bind(gridContainerElm, 'onrowcountchanged', this.handleOnRowCountChanged.bind(this) as EventListener);
    this._bindingEventService.bind(gridContainerElm, 'onsort', this.handleOnSort.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onscroll', this.handleOnScroll.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'ondragend', this.handleOnDragEnd.bind(this) as EventListener);
  }

  dispose() {
    if (this.sgb) {
      this.sgb?.dispose();
    }
    this._bindingEventService.unbindAll();
  }

  defineGrid() {
    this.columns = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100, filterable: true },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        minWidth: 100,
        filterable: true,
        type: 'number',
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        sortable: true,
        minWidth: 100,
        filterable: true,
        type: 'number',
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        type: 'date',
        outputType: 'dateIso', // for date picker format
        formatter: Formatters.date,
        exportWithFormatter: true,
        params: { dateFormat: 'MMM DD, YYYY' },
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.compoundDate,
        },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        type: 'date',
        outputType: 'dateIso', // for date picker format
        formatter: Formatters.date,
        exportWithFormatter: true,
        params: { dateFormat: 'MMM DD, YYYY' },
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.compoundDate,
        },
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        sortable: true,
        minWidth: 100,
        filterable: true,
        formatter: Formatters.checkmarkMaterial,
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableAutoResize: true,
      enableFiltering: true,
      enableGrouping: true,
      editable: false,
      rowHeight: 33,
      enableExcelExport: true,
      externalResources: [new ExcelExportService()],
      enableCheckboxSelector: true,
      enableSelection: true,
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideSelectAllCheckbox: false, // hide the "Select All" from title bar
        columnIndexPosition: 1,
        // row selection should only be usable & displayed on root level 0 (parent item) & grid isn't locked
      },
      dataView: {
        syncGridSelection: true, // enable this flag so that the row selection follows the row even if we move it to another position
      },
      enableRowMoveManager: true,
      rowMoveManager: {
        columnIndexPosition: 0,
        // when using Row Move + Row Selection, you want to move only a single row and we will enable the following flags so it doesn't cancel row selection
        singleRowMove: true,
        disableRowSelection: true,
        cancelEditOnDrag: true,
        hideRowMoveShadow: false,

        // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
        // usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
      },
    };
  }

  // add onScroll listener which will detect when we reach the scroll end
  // if so, then append items to the dataset
  handleOnScroll(event) {
    const args = event.detail?.args;
    const viewportElm = args.grid.getViewportNode();
    if (
      ['mousewheel', 'scroll'].includes(args.triggeredBy || '') &&
      viewportElm.scrollTop > 0 &&
      Math.ceil(viewportElm.offsetHeight + args.scrollTop) >= args.scrollHeight
    ) {
      console.log('onScroll end reached, add more items');
      const startIdx = this.sgb.dataView?.getItemCount() || 0;
      const newItems = this.loadData(startIdx, FETCH_SIZE);
      this.sgb.gridService.addItems(newItems, { position: 'bottom', highlightRow: false, scrollRowIntoView: false });
      // this.sgb.dataView?.addItems(newItems);
    }
  }

  // do we want to reset the dataset when Sorting?
  // if answering Yes then use the code below
  handleOnSort() {
    if (this.shouldResetOnSort) {
      const newData = this.loadData(0, FETCH_SIZE);
      this.sgb.slickGrid?.scrollTo(0); // scroll back to top to avoid unwanted onScroll end triggered
      this.sgb.dataView?.setItems(newData);
      this.sgb.dataView?.reSort();
    }
  }

  groupByDuration() {
    this.sgb?.dataView?.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      comparer: (a, b) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);

    // you need to manually add the sort icon(s) in UI
    this.sgb?.slickGrid?.setSortColumns([{ columnId: 'duration', sortAsc: true }]);
    this.sgb?.slickGrid?.invalidate(); // invalidate all rows and re-render
  }

  loadData(startIdx: number, count: number) {
    const tmpData: any[] = [];
    for (let i = startIdx; i < startIdx + count; i++) {
      tmpData.push(this.newItem(i));
    }

    return tmpData;
  }

  newItem(idx: number) {
    return {
      id: idx,
      title: 'Task ' + idx,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomNumber(1, 12),
      start: new Date(2020, randomNumber(1, 11), randomNumber(1, 34)),
      finish: new Date(2022, randomNumber(1, 11), randomNumber(1, 34)),
      effortDriven: idx % 5 === 0,
    };
  }

  onSortReset(shouldReset) {
    this.shouldResetOnSort = shouldReset;
  }

  clearAllFiltersAndSorts() {
    if (this.sgb?.gridService) {
      this.sgb.gridService.clearAllFiltersAndSorts();
    }
  }

  setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    this.sgb?.filterService.updateFilters([{ columnId: 'start', searchTerms: ['2020-08-25'], operator: '<=' }]);
  }

  handleOnRowCountChanged(event: CustomEvent<{ args: OnRowCountChangedEventArgs }>) {
    const args = event?.detail?.args;
    if (args?.current >= 0) {
      // we probably want to re-sort the data when we get new items
      this.sgb.dataView?.reSort();

      // update metrics
      this.metricsItemCount = this.sgb.dataView?.getFilteredItemCount() || 0;
      this.metricsTotalItemCount = args.itemCount || 0;
    }
  }

  handleOnDragEnd(event: CustomEvent<{ args: OnRowCountChangedEventArgs }>) {
    console.log('handleOnDragEnd', event);
    // setTimeout(()=>{
    //   let data = [...args.detail.args.grid.data.items];
    //   data.forEach((res: any,index: number)=>{
    //     res.sequence = index
    //   })
    //   this.cellValueChanged.emit(data);
    // },STATE_CHECK_DELAY)
  }

  setSortingDynamically() {
    this.sgb?.sortService.updateSorting([{ columnId: 'title', direction: 'DESC' }]);
  }
}
