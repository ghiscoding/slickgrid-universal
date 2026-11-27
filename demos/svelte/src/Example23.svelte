<script lang="ts">
  import { addDay, format } from '@formkit/tempo';
  import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type CurrentFilter,
    type Formatter,
    type GridOption,
    type GridStateChange,
    type Metrics,
    type MultipleSelectOption,
    type SlickGrid,
    type SlickgridSvelteInstance,
    type SliderRangeOption,
  } from 'slickgrid-svelte';
  import { tick } from 'svelte';
  import { CustomInputFilter } from './data/custom-inputFilter.js';
  import { i18n } from './data/i18n.js';

  const NB_ITEMS = 1500;
  const filterList = [
    { value: '', label: '' },
    { value: 'currentYearTasks', label: 'Current Year Completed Tasks' },
    { value: 'nextYearTasks', label: 'Next Year Active Tasks' },
  ];
  let selectedLanguage = $state('en');
  let selectedPredefinedFilter = $state('');
  let showSubTitle = $state(true);
  let metrics = $state<Metrics>();
  let grid: SlickgridSvelteInstance;

  // always start with English for Cypress E2E tests to be consistent
  void i18n.changeLanguage('en');

  // create a custom translate Formatter (typically you would move that a separate file, for separation of concerns)
  const taskTranslateFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, slickGrid: SlickGrid) => {
    const gridOptions = slickGrid.getOptions() as GridOption;

    return gridOptions.i18n?.t('TASK_X', { x: value }) ?? '';
  };
  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'id',
      nameKey: 'TITLE',
      minWidth: 100,
      formatter: taskTranslateFormatter,
      sortable: true,
      filterable: true,
      params: { useFormatterOuputToFilter: true },
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
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      nameKey: 'PERCENT_COMPLETE',
      minWidth: 120,
      sortable: true,
      customTooltip: { position: 'center' },
      formatter: Formatters.progressBar,
      type: 'number',
      filterable: true,
      filter: {
        model: Filters.sliderRange,
        maxValue: 100, // or you can use the options as well
        operator: 'RangeInclusive', // defaults to inclusive
        options: {
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
      nameKey: 'START',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 75,
      width: 100,
      exportWithFormatter: true,
      type: 'date',
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      nameKey: 'FINISH',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 75,
      width: 120,
      exportWithFormatter: true,
      type: 'date',
      filterable: true,
      filter: { model: Filters.dateRange },
    },
    {
      id: 'duration',
      nameKey: 'DURATION',
      field: 'duration',
      maxWidth: 90,
      type: 'number',
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.input,
        operator: 'RangeExclusive', // defaults to exclusive
      },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      nameKey: 'COMPLETED',
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
        options: { autoAdjustDropHeight: true } as MultipleSelectOption,
      },
    },
  ];

  const dataset = getData(NB_ITEMS);
  const options = defineGridOptions();

  function defineGridOptions(): GridOption {
    const presetLowestDay = format(addDay(new Date(), -2), 'YYYY-MM-DD');
    const presetHighestDay = format(addDay(new Date(), 25), 'YYYY-MM-DD');

    return {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      // enableFilterTrimWhiteSpace: true,
      enableTranslate: true,
      i18n,

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

  function getData(itemCount: number, startingIndex = 0): any[] {
    // mock a dataset
    const tempDataset: any[] = [];
    for (let i = startingIndex; i < startingIndex + itemCount; i++) {
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

  function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /** Dispatched event of a Grid State Changed event */
  function gridStateChanged(gridState: GridStateChange) {
    console.log('Client sample, Grid State changed:: ', gridState);
  }

  /** Save current Filters, Sorters in LocaleStorage or DB */
  function saveCurrentGridState() {
    console.log('Client sample, current Grid State:: ', grid?.gridStateService.getCurrentGridState());
  }

  function refreshMetrics(_e: Event, args: any) {
    if (args?.current >= 0) {
      setTimeout(() => {
        metrics = {
          startTime: new Date(),
          itemCount: args?.current ?? 0,
          totalItemCount: dataset.length || 0,
        };
      });
    }
  }

  function setFiltersDynamically() {
    const presetLowestDay = format(addDay(new Date(), -5), 'YYYY-MM-DD');
    const presetHighestDay = format(addDay(new Date(), 25), 'YYYY-MM-DD');

    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    grid.filterService.updateFilters([
      { columnId: 'duration', searchTerms: ['14..78'], operator: 'RangeInclusive' },
      { columnId: 'percentComplete', operator: 'RangeExclusive', searchTerms: [15, 85] },
      { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [presetLowestDay, presetHighestDay] },
    ]);
  }

  function setSortingDynamically() {
    grid.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'finish', direction: 'DESC' },
      { columnId: 'percentComplete', direction: 'ASC' },
    ]);
  }

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(nextLanguage);
    selectedLanguage = nextLanguage;
  }

  function predefinedFilterChanged(newPredefinedFilter: string) {
    selectedPredefinedFilter = newPredefinedFilter;
    let filters: CurrentFilter[] = [];
    const currentYear = new Date().getFullYear();

    switch (newPredefinedFilter) {
      case 'currentYearTasks':
        filters = [
          { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [`${currentYear}-01-01`, `${currentYear}-12-31`] },
          { columnId: 'completed', operator: '=', searchTerms: [true] },
        ];
        break;
      case 'nextYearTasks':
        filters = [{ columnId: 'start', operator: '>=', searchTerms: [`${currentYear + 1}-01-01`] }];
        break;
    }
    grid.filterService.updateFilters(filters);
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    grid?.resizerService.resizeGrid();
  }
</script>

<h2>
  Example 23: Filtering from Range of Search Values
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example23.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

<div class="subtitle" class:hidden={!showSubTitle}>
  This demo shows how to use Filters with Range of Search Values (<a
    href="https://ghiscoding.gitbook.io/svelte-slickgrid/column-functionalities/filters/range-filters"
    target="_blank"
  >
    Wiki docs
  </a>)
  <br />
  <ul class="small">
    <li>
      All input filters support the following operators: (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *) and now also the (..) for an
      input range
    </li>
    <li>
      All filters (which support ranges) can be defined via the 2 dots (..) which represents a range, this also works for dates and slider
      in the "presets"
    </li>
    <ul>
      <li>For a numeric range defined in an input filter (must be of type text), you can use 2 dots (..) to represent a range</li>
      <li>example: typing "10..90" will filter values between 10 and 90 (but excluding the number 10 and 90)</li>
    </ul>
  </ul>
</div>

<br />

{#if metrics}
  <span style="margin-right: 10px">
    <b>Metrics:</b>
    {metrics.startTime ? format(metrics.startTime, 'YYYY-MM-DD hh:mm a') : ''} | {metrics.itemCount} of {metrics.totalItemCount} items
  </span>
{/if}

<div class="row row-cols-lg-auto g-1 align-items-center">
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-filters" onclick={() => grid.filterService.clearFilters()}>
      Clear Filters
    </button>
  </div>
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-sorting" onclick={() => grid.sortService.clearSorting()}>
      Clear Sorting
    </button>
  </div>
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-filter" onclick={setFiltersDynamically}>
      Set Filters Dynamically
    </button>
  </div>
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" onclick={setSortingDynamically}>
      Set Sorting Dynamically
    </button>
  </div>
  <div class="col">
    <label for="selectedFilter" style="margin-left: 10px">Predefined Filters</label>
  </div>
  <div class="col">
    <select
      id="selectedFilter"
      name="selectedFilter"
      class="form-select"
      data-test="select-dynamic-filter"
      value={selectedPredefinedFilter}
      onchange={(e) => predefinedFilterChanged(e.currentTarget.value)}
    >
      {#each filterList as filter (filter.value)}
        <option value={filter.value}>{filter.label}</option>
      {/each}
    </select>
  </div>
</div>

<div class="row mt-2">
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon me-1" data-test="language" onclick={switchLanguage}>
      <i class="mdi mdi-translate"></i>
      Switch Language
    </button>
    <b>Locale:</b>
    <span class="ms-1" style="font-style: italic" data-test="selected-locale">{selectedLanguage + '.json'}</span>
  </div>
</div>

<SlickgridSvelte
  gridId="grid23"
  {columns}
  {options}
  {dataset}
  onSvelteGridCreated={(instance) => (grid = instance)}
  onGridStateChanged={(event) => gridStateChanged(event.detail)}
  onBeforeGridDestroy={saveCurrentGridState}
  onRowCountChanged={(event) => refreshMetrics(event.detail.eventData, event.detail.args)}
/>
