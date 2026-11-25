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
    type OperatorType,
    type SlickGrid,
    type SlickgridSvelteInstance,
    type SliderRangeOption,
  } from 'slickgrid-svelte';
  import { CustomInputFilter } from './data/custom-inputFilter.js';
  import { i18n } from './data/i18n.js';

  const NB_ITEMS = 1500;
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const presetLowestDay = format(addDay(today, -2), 'YYYY-MM-DD');
  const presetHighestDay = format(addDay(today, today.getDate() < 14 ? 28 : 25), 'YYYY-MM-DD');
  const excelExportService = new ExcelExportService();
  let selectedLanguage = 'en';
  let selectedPredefinedFilter = '';
  let showSubtitle = true;
  let grid: SlickgridSvelteInstance;

  void i18n.changeLanguage('en');

  const taskTranslateFormatter: Formatter = (_row, _cell, value) => i18n.t('TASK_X', { x: value });
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
      filter: { model: CustomInputFilter, enableTrimWhiteSpace: true },
    },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      nameKey: 'PERCENT_COMPLETE',
      minWidth: 120,
      sortable: true,
      formatter: Formatters.progressBar,
      type: 'number',
      filterable: true,
      filter: {
        model: Filters.sliderRange,
        maxValue: 100,
        operator: 'RangeInclusive',
        options: { hideSliderNumbers: false, min: 0, step: 5 } as SliderRangeOption,
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
      filter: { model: Filters.input, operator: 'RangeExclusive' },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      nameKey: 'COMPLETED',
      minWidth: 85,
      maxWidth: 90,
      formatter: Formatters.checkmarkMaterial,
      exportWithFormatter: true,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, labelKey: 'TRUE' },
          { value: false, labelKey: 'FALSE' },
        ],
        model: Filters.singleSelect,
      },
    },
  ];

  const dataset = Array.from({ length: NB_ITEMS }, (_value, id) => {
    const hasDynamicRangeSample = id % 20 === 0;
    const year = currentYear + (hasDynamicRangeSample ? 0 : id % 2);
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    const randomFinish = new Date(year, month, day);
    const finish = hasDynamicRangeSample ? addDay(today, ((id / 20) % 31) - 5) : randomFinish;
    const percentComplete = hasDynamicRangeSample ? 20 + (id % 60) : Math.floor(Math.random() * 101);
    return {
      id,
      title: `Task ${id}`,
      description: id % 5 ? `desc ${id}` : null,
      duration: hasDynamicRangeSample ? 20 + (id % 50) : Math.floor(Math.random() * 366),
      percentComplete,
      percentCompleteNumber: percentComplete,
      start: id % 4 ? new Date(year, month, day) : null,
      finish,
      completed: percentComplete === 100,
    };
  });

  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    enableTranslate: true,
    i18n,
    presets: {
      filters: [
        { columnId: 'duration', searchTerms: ['4..88'] },
        { columnId: 'percentComplete', operator: 'RangeInclusive', searchTerms: [5, 80] },
        { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [presetLowestDay, presetHighestDay] },
      ],
      sorters: [
        { columnId: 'percentComplete', direction: 'DESC' },
        { columnId: 'duration', direction: 'ASC' },
      ],
    },
    externalResources: [new SlickCustomTooltip(), excelExportService],
  };

  function setFiltersDynamically() {
    const lowest = format(addDay(new Date(), -5), 'YYYY-MM-DD');
    const highest = format(addDay(new Date(), 25), 'YYYY-MM-DD');
    const filters: CurrentFilter[] = [
      { columnId: 'duration', searchTerms: ['14..78'], operator: 'RangeInclusive' },
      { columnId: 'percentComplete', operator: 'RangeExclusive', searchTerms: [15, 85] },
      { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [lowest, highest] },
    ];
    grid.filterService.updateFilters(filters);
  }

  function setSortingDynamically() {
    grid.sortService.updateSorting([
      { columnId: 'finish', direction: 'DESC' },
      { columnId: 'percentComplete', direction: 'ASC' },
    ]);
  }

  function predefinedFilterChanged() {
    let filters: CurrentFilter[] = [];
    if (selectedPredefinedFilter === 'currentYearTasks') {
      filters = [
        { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [`${currentYear}-01-01`, `${currentYear}-12-31`] },
        { columnId: 'completed', operator: '=' as OperatorType, searchTerms: [true] },
      ];
    } else if (selectedPredefinedFilter === 'nextYearTasks') {
      filters = [{ columnId: 'start', operator: '>=', searchTerms: [`${currentYear + 1}-01-01`] }];
    }
    grid.filterService.updateFilters(filters);
  }

  function switchLanguage() {
    selectedLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    void i18n.changeLanguage(selectedLanguage);
  }

  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }

  function saveCurrentGridState() {
    console.log('Client sample, current Grid State:: ', grid?.gridStateService.getCurrentGridState());
  }
</script>

<svelte:window onbeforeunload={saveCurrentGridState} />

<h2>
  Example 23: Filtering from Range of Search Values
  <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example23.svelte"
      ><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubtitle}><i class="mdi mdi-information-outline"></i></button
  >
</h2>
{#if showSubtitle}
  <div class="subtitle">
    This demo shows how to use filters with ranges. Numeric input filters accept values such as <code>10..90</code>, and range-capable
    filters can also be set through presets.
  </div>
{/if}
<div class="row row-cols-lg-auto g-1 align-items-center">
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-filters" onclick={() => grid.filterService.clearFilters()}
      >Clear Filters</button
    >
  </div>
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-sorting" onclick={() => grid.sortService.clearSorting()}
      >Clear Sorting</button
    >
  </div>
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-filter" onclick={setFiltersDynamically}
      >Set Filters Dynamically</button
    >
  </div>
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" onclick={setSortingDynamically}
      >Set Sorting Dynamically</button
    >
  </div>
  <div class="col"><label for="selectedFilter" style="margin-left:10px">Predefined Filters</label></div>
  <div class="col">
    <select
      id="selectedFilter"
      class="form-select"
      data-test="select-dynamic-filter"
      bind:value={selectedPredefinedFilter}
      onchange={predefinedFilterChanged}
    >
      <option value=""></option>
      <option value="currentYearTasks">Current Year Completed Tasks</option>
      <option value="nextYearTasks">Next Year Active Tasks</option>
    </select>
  </div>
</div>
<div class="row mt-2">
  <div class="col">
    <button class="btn btn-outline-secondary btn-sm btn-icon me-1" data-test="language" onclick={switchLanguage}
      ><i class="mdi mdi-translate"></i> Switch Language</button
    ><b>Locale:</b> <span class="ms-1" style="font-style:italic" data-test="selected-locale">{selectedLanguage}.json</span>
  </div>
</div>
<SlickgridSvelte
  gridId="grid23"
  {columns}
  {options}
  {dataset}
  onSvelteGridCreated={(instance: SlickgridSvelteInstance) => (grid = instance)}
/>
