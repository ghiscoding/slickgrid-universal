import { BindingEventService } from '@slickgrid-universal/binding';
import { Aggregators, type Column, FieldType, Filters, Formatters, type GridOption, type Grouping, type OnRowCountChangedEventArgs, SortComparers, SortDirectionNumber, } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options.js';

const FETCH_SIZE = 50;

export default class Example28 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  shouldResetOnSort = false;
  metricsEndTime = '';
  metricsItemCount = 0;
  metricsTotalItemCount = 0;
  sgb: SlickVanillaGridBundle;

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.defineGrid();
    const gridContainerElm = document.querySelector(`.grid28`) as HTMLDivElement;
    const dataset = this.loadData(0, FETCH_SIZE);

    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, dataset);
    this.metricsItemCount = FETCH_SIZE;
    this.metricsTotalItemCount = FETCH_SIZE;


    // bind any of the grid events
    this._bindingEventService.bind(gridContainerElm, 'onrowcountchanged', this.refreshMetrics.bind(this) as EventListener);
    this._bindingEventService.bind(gridContainerElm, 'onsort', this.handleOnSort.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onscroll', this.handleOnScroll.bind(this));
  }

  dispose() {
    if (this.sgb) {
      this.sgb?.dispose();
    }
    this._bindingEventService.unbindAll();
  }

  defineGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100, filterable: true },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100, filterable: true, type: FieldType.number },
      { id: 'percentComplete', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100, filterable: true, type: FieldType.number },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso, exportWithFormatter: true, filterable: true, filter: { model: Filters.compoundDate } },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso, exportWithFormatter: true, filterable: true, filter: { model: Filters.compoundDate } },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100, filterable: true, formatter: Formatters.checkmarkMaterial }
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
    };
  }

  // add onScroll listener which will detect when we reach the scroll end
  // if so, then append items to the dataset
  handleOnScroll(event) {
    const args = event.detail?.args;
    const viewportElm = args.grid.getViewportNode();
    if (
      ['mousewheel', 'scroll'].includes(args.triggeredBy || '')
      && viewportElm.scrollTop > 0
      && Math.ceil(viewportElm.offsetHeight + args.scrollTop) >= args.scrollHeight
    ) {
      console.log('onScroll end reached, add more items');
      const startIdx = this.sgb.dataView?.getItemCount() || 0;
      const newItems = this.loadData(startIdx, FETCH_SIZE);
      this.sgb.dataView?.addItems(newItems);
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
      aggregators: [
        new Aggregators.Avg('percentComplete'),
        new Aggregators.Sum('cost')
      ],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true
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
    const randomYear = 2000 + Math.floor(Math.random() * 10);
    const randomMonth = Math.floor(Math.random() * 11);
    const randomDay = Math.floor((Math.random() * 29));
    const randomPercent = Math.round(Math.random() * 100);

    return {
      id: idx,
      title: 'Task ' + idx,
      duration: Math.round(Math.random() * 100) + '',
      percentComplete: randomPercent,
      start: new Date(randomYear, randomMonth + 1, randomDay),
      finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
      effortDriven: (idx % 5 === 0)
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
    this.sgb?.filterService.updateFilters([
      { columnId: 'percentComplete', searchTerms: ['50'], operator: '>=' },
    ]);
  }

  refreshMetrics(event: CustomEvent<{ args: OnRowCountChangedEventArgs; }>) {
    const args = event?.detail?.args;
    if (args?.current >= 0) {
      this.metricsItemCount = this.sgb.dataView?.getFilteredItemCount() || 0;
      this.metricsTotalItemCount = args.itemCount || 0;
    }
  }

  setSortingDynamically() {
    this.sgb?.sortService.updateSorting([
      { columnId: 'title', direction: 'DESC' },
    ]);
  }
}
