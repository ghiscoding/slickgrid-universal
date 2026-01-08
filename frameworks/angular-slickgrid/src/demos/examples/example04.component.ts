import { DatePipe, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, type OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  AngularSlickgridModule,
  Filters,
  Formatters,
  type AngularGridInstance,
  type Column,
  type GridOption,
  type GridStateChange,
  type Metrics,
  type MultipleSelectOption,
  type VanillaCalendarOption,
} from '../../library';
import { CustomInputFilter } from './custom-inputFilter';

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
const NB_ITEMS = 10500;
const URL_SAMPLE_COLLECTION_DATA = 'assets/data/collection_500_numbers.json';

@Component({
  templateUrl: './example04.component.html',
  imports: [AngularSlickgridModule, DatePipe, NgIf],
})
export class Example4Component implements OnInit {
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset!: any[];
  hideSubTitle = false;
  metrics!: Metrics;

  constructor(
    private http: HttpClient,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
        minWidth: 55,
        filterable: true,
        filter: { model: Filters.compoundInputText },
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        filterable: true,
        sortable: true,
        minWidth: 80,
        filter: {
          model: CustomInputFilter, // create a new instance to make each Filter independent from each other
          enableTrimWhiteSpace: true, // or use global "enableFilterTrimWhiteSpace" to trim on all Filters
        },
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        type: 'number',
        exportCsvForceToKeepAsString: true,
        minWidth: 55,
        filterable: true,
        filter: {
          collectionAsync: this.http.get<{ option: string; value: string }[]>(URL_SAMPLE_COLLECTION_DATA),
          // collectionFilterBy & collectionSortBy accept a single or multiple options
          // we can exclude certains values 365 & 360 from the dropdown filter
          collectionFilterBy: [
            {
              property: 'value',
              operator: '!=',
              value: 360,
            },
            {
              property: 'value',
              operator: '!=',
              value: 365,
            },
          ],
          collectionSortBy: {
            property: 'value',
            sortDesc: true,
            fieldType: 'number',
          },
          customStructure: {
            value: 'value',
            label: 'label',
            optionLabel: 'value', // if selected text is too long, we can use option labels instead
            labelSuffix: 'text',
          },
          collectionOptions: {
            separatorBetweenTextLabels: ' ',
            filterResultAfterEachPass: 'chain', // options are "merge" or "chain" (defaults to "chain")
          },
          model: Filters.multipleSelect,

          // we could add certain option(s) to the "multiple-select" plugin
          options: {
            maxHeight: 250,
            width: 175,

            // if we want to display shorter text as the selected text (on the select filter itself, parent element)
            // we can use "useSelectOptionLabel" or "useSelectOptionLabelToHtml" the latter will parse html
            useSelectOptionLabelToHtml: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        formatter: Formatters.percentCompleteBar,
        minWidth: 70,
        type: 'number',
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 75,
        type: 'date',
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'usDateShort',
        name: 'US Date Short',
        field: 'usDateShort',
        sortable: true,
        minWidth: 70,
        width: 70,
        type: 'dateUsShort',
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'utcDate',
        name: 'UTC Date',
        field: 'utcDate',
        formatter: Formatters.dateTimeIsoAmPm,
        sortable: true,
        minWidth: 115,
        type: 'dateUtc',
        exportWithFormatter: true,
        outputType: 'dateTimeIsoAmPm',
        filterable: true,
        filter: {
          model: Filters.compoundDate,
          // override any of the date picker options through "options"
          options: { displayDateMin: 'today' } as VanillaCalendarOption,
        },
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven.isEffort',
        minWidth: 85,
        maxWidth: 85,
        type: 'boolean',
        sortable: true,
        exportCustomFormatter: Formatters.complexObject,

        // to pass multiple formatters, use the params property
        // also these formatters are executed in sequence, so if you want the checkmark to work correctly, it has to be the last formatter defined
        formatter: Formatters.multiple,
        params: { formatters: [Formatters.complexObject, Formatters.checkmarkMaterial] },

        // when the "field" string includes the dot "." notation, the library will consider this to be a complex object and Filter accordingly
        filterable: true,
        filter: {
          // We can also add HTML text to be rendered (any bad script will be sanitized) but we have to opt-in, else it will be sanitized
          // enableRenderHtml: true,
          // collection: [{ value: '', label: '' }, { value: true, label: 'True', labelPrefix: `<i class="mdi mdi-check"></i> ` }, { value: false, label: 'False' }],

          collection: [
            { isEffort: '', label: '' },
            { isEffort: true, label: 'True' },
            { isEffort: false, label: 'False' },
          ],
          customStructure: {
            value: 'isEffort',
            label: 'label',
          },
          model: Filters.singleSelect,

          // we could add certain option(s) to the "multiple-select" plugin
          options: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableExcelExport: true,
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      // enableFilterTrimWhiteSpace: true,
      i18n: this.translate,
      showCustomFooter: true, // display some metrics in the bottom custom footer

      // use columnDef searchTerms OR use presets as shown below
      presets: {
        filters: [
          { columnId: 'duration', searchTerms: [10, 98] },
          // { columnId: 'complete', searchTerms: ['5'], operator: '>' },
          { columnId: 'usDateShort', operator: '<', searchTerms: ['4/20/25'] },
          // { columnId: 'effort-driven', searchTerms: [true] },
        ],
        sorters: [
          { columnId: 'duration', direction: 'DESC' },
          { columnId: 'complete', direction: 'ASC' },
        ],
      },
      externalResources: [new ExcelExportService()],
    };

    // mock a dataset
    this.dataset = this.mockData(NB_ITEMS);
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
  }

  mockData(itemCount: number, startingIndex = 0): any[] {
    // mock a dataset
    const tempDataset = [];
    for (let i = startingIndex; i < startingIndex + itemCount; i++) {
      const randomDuration = Math.round(Math.random() * 100);
      const randomYear = randomBetween(2000, 2035);
      const randomYearShort = randomBetween(10, 35);
      const randomMonth = randomBetween(1, 12);
      const randomMonthStr = randomMonth < 10 ? `0${randomMonth}` : randomMonth;
      const randomDay = randomBetween(10, 28);
      const randomPercent = randomBetween(0, 100);
      const randomHour = randomBetween(10, 23);
      const randomTime = randomBetween(10, 59);
      const randomMilliseconds = `${randomBetween(1, 9)}${randomBetween(10, 99)}`;
      const randomIsEffort = i % 3 === 0;

      tempDataset.push({
        id: i,
        title: 'Task ' + i,
        description: i % 5 ? 'desc ' + i : null, // also add some random to test NULL field
        duration: randomDuration,
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: i % 4 ? null : new Date(randomYear, randomMonth, randomDay), // provide a Date format
        usDateShort: `${randomMonth}/${randomDay}/${randomYearShort}`, // provide a date US Short in the dataset
        utcDate: `${randomYear}-${randomMonthStr}-${randomDay}T${randomHour}:${randomTime}:${randomTime}.${randomMilliseconds}Z`,
        effortDriven: {
          isEffort: randomIsEffort,
          label: randomIsEffort ? 'Effort' : 'NoEffort',
        },
      });
    }
    return tempDataset;
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(gridState: GridStateChange) {
    console.log('Client sample, Grid State changed:: ', gridState.change);
  }

  /** Save current Filters, Sorters in LocaleStorage or DB */
  saveCurrentGridState() {
    console.log('Client sample, last Grid State:: ', this.angularGrid.gridStateService.getCurrentGridState());
  }

  setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    this.angularGrid.filterService.updateFilters([
      { columnId: 'duration', searchTerms: [2, 25, 48, 50] },
      { columnId: 'complete', searchTerms: [95], operator: '<' },
      { columnId: 'effort-driven', searchTerms: [true] },
      { columnId: 'start', operator: '>=', searchTerms: ['2001-02-28'] },
    ]);
  }

  setSortingDynamically() {
    this.angularGrid.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'duration', direction: 'ASC' },
      { columnId: 'start', direction: 'DESC' },
    ]);
  }

  refreshMetrics(e: Event, args: any) {
    if (args && args.current >= 0) {
      setTimeout(() => {
        this.metrics = {
          startTime: new Date(),
          endTime: new Date(),
          itemCount: (args && args.current) || 0,
          totalItemCount: this.dataset.length || 0,
        };
      });
    }
  }

  scrollGridBottom() {
    this.angularGrid.slickGrid.navigateBottom();
  }

  scrollGridTop() {
    this.angularGrid.slickGrid.navigateTop();
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.angularGrid.resizerService.resizeGrid(0);
  }
}
