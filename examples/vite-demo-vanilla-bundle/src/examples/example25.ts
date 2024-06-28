import { addDay, format } from '@formkit/tempo';

import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import {
  type Column,
  type CurrentFilter,
  FieldType,
  Filters,
  Formatters,
  type GridOption,
  type GridStateChange,
  type MultipleSelectOption,
  OperatorType,
  type SliderRangeOption,
} from '@slickgrid-universal/common';
import { BindingEventService } from '@slickgrid-universal/binding';

import { ExampleGridOptions } from './example-grid-options';
import { type TranslateService } from '../translate.service';

const NB_ITEMS = 5000;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default class Example25 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[] = [];
  gridContainerElm: HTMLDivElement;
  gridOptions!: GridOption;
  dataset: any[] = [];
  metricsEndTime = '';
  metricsStartTime = '';
  metricsItemCount = 0;
  metricsTotalItemCount = 0;
  filterList = [
    { value: '', label: '' },
    { value: 'currentYearTasks', label: 'Current Year Completed Tasks' },
    { value: 'nextYearTasks', label: 'Next Year Active Tasks' }
  ];
  selectedLanguage = 'en';
  selectedLanguageFile = 'en.json';
  sgb: SlickVanillaGridBundle;
  translateService: TranslateService;

  constructor() {
    this._bindingEventService = new BindingEventService();

    // get the Translate Service from the window object,
    // it might be better with proper Dependency Injection but this project doesn't have any at this point
    this.translateService = (<any>window).TranslateService;
  }

  attached() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.mockData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>('.grid25') as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(this.gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);

    // bind any of the grid events
    this._bindingEventService.bind(this.gridContainerElm, 'ongridstatechanged', this.gridStateChanged.bind(this));
    this._bindingEventService.bind(this.gridContainerElm, 'onrowcountchanged', this.refreshMetrics.bind(this));

    this.metricsEndTime = format(new Date(), 'DD MMM, h:mm:ss a');
    this.metricsStartTime = format(new Date(), 'DD MMM, h:mm:ss a');
    this.metricsItemCount = this.sgb.dataView?.getFilteredItemCount() || 0;
    this.metricsTotalItemCount = this.dataset.length || 0;

    document.body.classList.add('material-theme');
  }

  dispose() {
    this.saveCurrentGridState();
    document.body.classList.remove('material-theme');
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'id', nameKey: 'TITLE', minWidth: 100,
        formatter: (_row, _cell, value) => {
          return this.translateService.translate('TASK_X', { x: value }) ?? '';
        },
        sortable: true,
        filterable: true,
        params: { useFormatterOuputToFilter: true }
      },
      {
        id: 'description', name: 'Description', field: 'description', filterable: true, sortable: true, minWidth: 80,
        type: FieldType.string,
      },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete', nameKey: 'PERCENT_COMPLETE', minWidth: 120,
        sortable: true,
        customTooltip: { position: 'center' },
        formatter: Formatters.progressBar,
        type: FieldType.number,
        filterable: true,
        filter: {
          model: Filters.sliderRange,
          maxValue: 100, // or you can use the filterOptions as well
          operator: OperatorType.rangeInclusive, // defaults to inclusive
          filterOptions: {
            hideSliderNumbers: false, // you can hide/show the slider numbers on both side
            min: 0, step: 5
          } as SliderRangeOption
        }
      },
      {
        id: 'start', name: 'Start', field: 'start', nameKey: 'START', formatter: Formatters.dateIso, sortable: true, minWidth: 75, width: 100, exportWithFormatter: true,
        type: FieldType.date, filterable: true, filter: { model: Filters.compoundDate }
      },
      {
        id: 'finish', name: 'Finish', field: 'finish', nameKey: 'FINISH', formatter: Formatters.dateIso, sortable: true, minWidth: 75, width: 120, exportWithFormatter: true,
        type: FieldType.date,
        filterable: true,
        filter: {
          model: Filters.dateRange,
        }
      },
      {
        id: 'duration', field: 'duration', nameKey: 'DURATION', maxWidth: 90,
        type: FieldType.number,
        sortable: true,
        filterable: true, filter: {
          model: Filters.input,
          operator: OperatorType.rangeExclusive // defaults to exclusive
        }
      },
      {
        id: 'completed', name: 'Completed', field: 'completed', nameKey: 'COMPLETED', minWidth: 85, maxWidth: 90,
        formatter: Formatters.checkmarkMaterial,
        exportWithFormatter: true, // you can set this property in the column definition OR in the grid options, column def has priority over grid options
        filterable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect,
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption
        }
      }
    ];

    const today = new Date();
    const presetLowestDay = format(addDay(new Date(), -2), 'YYYY-MM-DD');
    const presetHighestDay = format(addDay(new Date(), today.getDate() < 14 ? 30 : 25), 'YYYY-MM-DD');

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      enableTranslate: true,
      translater: this.translateService, // pass the TranslateService instance to the grid

      // use columnDef searchTerms OR use presets as shown below
      presets: {
        filters: [
          //  you can use the 2 dots separator on all Filters which support ranges
          { columnId: 'duration', searchTerms: ['4..88'] },
          // { columnId: 'percentComplete', searchTerms: ['5..80'] }, // without operator will default to 'RangeExclusive'
          // { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [`${presetLowestDay}..${presetHighestDay}`] },

          // or you could also use 2 searchTerms values, instead of using the 2 dots (only works with SliderRange & DateRange Filters)
          // BUT make sure to provide the operator, else the filter service won't know that this is really a range
          { columnId: 'percentComplete', operator: 'RangeInclusive', searchTerms: [5, 80] }, // same result with searchTerms: ['5..80']
          { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [presetLowestDay, presetHighestDay] },
        ],
        sorters: [
          { columnId: 'percentComplete', direction: 'DESC' },
          { columnId: 'duration', direction: 'ASC' },
        ],
      },
      externalResources: [new SlickCustomTooltip(), new ExcelExportService()],
    };
  }

  mockData(itemCount: number, startingIndex = 0): any[] {
    // mock a dataset
    const tempDataset: any[] = [];
    for (let i = startingIndex; i < (startingIndex + itemCount); i++) {
      const randomDuration = randomBetween(0, 365);
      const randomYear = randomBetween(new Date().getFullYear(), new Date().getFullYear() + 1);
      const randomMonth = randomBetween(0, 12);
      const randomDay = randomBetween(10, 28);
      const randomPercent = randomBetween(0, 100);

      tempDataset.push({
        id: i,
        title: 'Task ' + i,
        description: (i % 5) ? 'desc ' + i : null, // also add some random to test NULL field
        duration: randomDuration,
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: (i % 4) ? null : new Date(randomYear, randomMonth, randomDay),          // provide a Date format
        finish: new Date(randomYear, randomMonth, randomDay),
        completed: (randomPercent === 100) ? true : false,
      });
    }

    return tempDataset;
  }

  clearFilters() {
    this.sgb?.filterService.clearFilters();
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(event) {
    if (event?.detail) {
      console.log('Client sample, Grid State changed:: ', event.detail as GridStateChange);
    }
  }

  /** Save current Filters, Sorters in LocaleStorage or DB */
  saveCurrentGridState() {
    console.log('Client sample, current Grid State:: ', this.sgb?.gridStateService.getCurrentGridState());
  }

  refreshMetrics(event) {
    const args = event?.detail?.args;
    if (args?.current >= 0) {
      this.metricsStartTime = format(new Date(), 'DD MMM, h:mm:ss a');
      this.metricsItemCount = args?.current || 0;
      this.metricsTotalItemCount = this.dataset.length || 0;
    }
  }

  setFiltersDynamically() {
    const presetLowestDay = format(addDay(new Date(), -5), 'YYYY-MM-DD');
    const presetHighestDay = format(addDay(new Date(), 25), 'YYYY-MM-DD');

    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    this.sgb.filterService.updateFilters([
      { columnId: 'duration', searchTerms: ['14..78'], operator: 'RangeInclusive' },
      { columnId: 'percentComplete', operator: 'RangeExclusive', searchTerms: [15, 85] },
      { columnId: 'start', operator: '<=', searchTerms: [presetHighestDay] },
      { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [presetLowestDay, presetHighestDay] },
    ]);
  }

  setSortingDynamically() {
    this.sgb?.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'finish', direction: 'DESC' },
      { columnId: 'percentComplete', direction: 'ASC' },
    ]);
  }

  predefinedFilterChanged(newPredefinedFilter: string) {
    let filters: CurrentFilter[] = [];
    const currentYear = new Date().getFullYear();

    switch (newPredefinedFilter) {
      case 'currentYearTasks':
        filters = [
          { columnId: 'finish', operator: OperatorType.rangeInclusive, searchTerms: [`${currentYear}-01-01`, `${currentYear}-12-31`] },
          { columnId: 'completed', operator: OperatorType.equal, searchTerms: [true] },
        ];
        break;
      case 'nextYearTasks':
        filters = [{ columnId: 'start', operator: '>=', searchTerms: [`${currentYear + 1}-01-01`] }];
        break;
    }
    this.sgb?.filterService.updateFilters(filters);
  }

  async switchLanguage() {
    const nextLanguage = (this.selectedLanguage === 'en') ? 'fr' : 'en';
    await this.translateService.use(nextLanguage);
    this.selectedLanguage = nextLanguage;
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
  }
}
