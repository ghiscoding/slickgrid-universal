import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import {
  type Column,
  FieldType,
  Filters,
  Formatters,
  type GridOption,
  type MultipleSelectOption,
  OperatorType,
  type SliderRangeOption,
} from '@slickgrid-universal/common';

import { ExampleGridOptions } from './example-grid-options.js';
import { CustomPager } from './example30-pager.js';

const NB_ITEMS = 5000;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default class Example30 {
  pageSize = 50;
  columnDefinitions: Column[] = [];
  gridContainerElm: HTMLDivElement;
  gridOptions!: GridOption;
  dataset: any[] = [];
  paginationPosition: 'bottom' | 'top' = 'top';
  sgb: SlickVanillaGridBundle;

  attached() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.loadData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>('.grid30') as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(
      this.gridContainerElm,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );
    document.body.classList.add('material-theme');
  }

  dispose() {
    document.body.classList.remove('material-theme');
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'id',
        minWidth: 100,
        sortable: true,
        filterable: true,
        formatter: (_row, _cell, val) => `Task ${val}`,
        params: { useFormatterOuputToFilter: true },
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        filterable: true,
        sortable: true,
        minWidth: 80,
        type: FieldType.string,
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 120,
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
            min: 0,
            step: 5,
          } as SliderRangeOption,
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 75,
        width: 100,
        exportWithFormatter: true,
        type: FieldType.date,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 75,
        width: 120,
        exportWithFormatter: true,
        type: FieldType.date,
        filterable: true,
        filter: {
          model: Filters.dateRange,
        },
      },
      {
        id: 'duration',
        field: 'duration',
        name: 'Duration',
        maxWidth: 90,
        type: FieldType.number,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.input,
          operator: OperatorType.rangeExclusive, // defaults to exclusive
        },
      },
      {
        id: 'completed',
        name: 'Completed',
        field: 'completed',
        minWidth: 85,
        maxWidth: 90,
        formatter: Formatters.checkmarkMaterial,
        exportWithFormatter: true, // you can set this property in the column definition OR in the grid options, column def has priority over grid options
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
        bottomPadding: this.paginationPosition === 'top' ? -10 : 20, // use a negative bottom padding since we've prepended custom pagination
      },
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      customPaginationComponent: CustomPager, // load our Custom Pagination Component
      enablePagination: true,
      pagination: {
        pageSize: this.pageSize,
      },
      rowHeight: 40,
    };
  }

  setPaginationSize(pageSize: number) {
    this.sgb.paginationService.changeItemPerPage(pageSize);
  }

  loadData(itemCount: number): any[] {
    // mock a dataset
    const tempDataset: any[] = [];
    for (let i = 0, ln = itemCount; i < ln; i++) {
      const randomDuration = randomBetween(0, 365);
      const randomYear = randomBetween(new Date().getFullYear(), new Date().getFullYear() + 1);
      const randomMonth = randomBetween(0, 12);
      const randomDay = randomBetween(10, 28);
      const randomPercent = randomBetween(0, 100);

      tempDataset.push({
        id: i,
        title: 'Task ' + i,
        description: i % 5 ? 'desc ' + i : null, // also add some random to test NULL field
        duration: randomDuration,
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: i % 4 ? null : new Date(randomYear, randomMonth, randomDay), // provide a Date format
        finish: new Date(randomYear, randomMonth, randomDay),
        completed: randomPercent === 100 ? true : false,
      });
    }

    return tempDataset;
  }

  togglePaginationPosition() {
    this.paginationPosition = this.paginationPosition === 'top' ? 'bottom' : 'top';
    (this.sgb.paginationComponent as CustomPager)?.disposeElement();
    (this.sgb.paginationComponent as CustomPager)?.renderPagination(this.gridContainerElm, this.paginationPosition);
  }
}
