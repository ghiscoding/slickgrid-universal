<script lang="ts">
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type MultipleSelectOption,
    type SlickgridSvelteInstance,
    type SliderRangeOption,
  } from 'slickgrid-svelte';
  import CustomPagerComponent from './CustomPagerComponent.svelte';

  const NB_ITEMS = 5000;
  const DEFAULT_PAGE_SIZE = 50;
  let showSubTitle = $state(true);
  let pageSize = $state(DEFAULT_PAGE_SIZE);
  let grid: SlickgridSvelteInstance;
  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'id',
      minWidth: 100,
      sortable: true,
      filterable: true,
      formatter: (_row, _cell, value) => `Task ${value}`,
      params: { useFormatterOuputToFilter: true },
    },
    { id: 'description', name: 'Description', field: 'description', filterable: true, sortable: true, minWidth: 80 },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      minWidth: 120,
      sortable: true,
      customTooltip: { position: 'center' },
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
      field: 'duration',
      name: 'Duration',
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
      minWidth: 85,
      maxWidth: 90,
      formatter: Formatters.checkmarkMaterial,
      exportWithFormatter: true,
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

  const options: GridOption = {
    autoResize: { container: '#demo-container', bottomPadding: 20 },
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    customPaginationComponent: CustomPagerComponent,
    enablePagination: true,
    pagination: { pageSize: DEFAULT_PAGE_SIZE },
    rowHeight: 40,
  };

  function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  const dataset = Array.from({ length: NB_ITEMS }, (_item, id) => {
    const year = randomBetween(new Date().getFullYear(), new Date().getFullYear() + 1);
    const month = randomBetween(0, 12);
    const day = randomBetween(10, 28);
    const percentComplete = randomBetween(0, 100);
    return {
      id,
      title: `Task ${id}`,
      description: id % 5 ? `desc ${id}` : null,
      duration: randomBetween(0, 365),
      percentComplete,
      percentCompleteNumber: percentComplete,
      start: id % 4 ? null : new Date(year, month, day),
      finish: new Date(year, month, day),
      completed: percentComplete === 100,
    };
  });

  function pageSizeChanged(event: Event) {
    pageSize = Number((event.currentTarget as HTMLInputElement).value);
    grid.paginationService?.changeItemPerPage(pageSize);
  }
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid?.resizerService.resizeGrid());
  }
</script>

<svelte:head><title>Example 42 - Custom Pagination</title></svelte:head>

<h2>
  Example 42: Custom Pagination
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example42.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>
{#if showSubTitle}<div class="subtitle">
    You can create a Custom Pagination by passing a Svelte Custom Component and it must expose the <code>init</code>,
    <code>renderPagination</code> and <code>dispose</code> functions. Any of the pagination controls could be moved anywhere on the page (for
    example we purposely moved the page size away from the rest of the pagination elements).
  </div>{/if}
<div>
  <span class="margin-15px">
    Page Size <input
      value={pageSize}
      class="input is-small is-narrow"
      type="text"
      data-test="page-size-input"
      style="width: 55px"
      oninput={pageSizeChanged}
    />
  </span>
</div>
<SlickgridSvelte gridId="grid42" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />
