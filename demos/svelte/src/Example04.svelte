<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { Filters, Formatters, SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import durationCollection from './data/collection_500_numbers.json';
  import { CustomInputFilter } from './data/custom-inputFilter.js';
  import { createTasks } from './data/tasks.js';

  let grid: SlickgridSvelteInstance;
  let showSubTitle = true;
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => {
      grid?.resizerService?.resizeGrid();
    });
  }
  const dataset = createTasks(10500).map((item) => ({
    ...item,
    duration: item.id === 100 ? 100 : item.duration,
    usDateShort: `01/15/${String(10 + (item.id % 20)).padStart(2, '0')}`,
    utcDate: `${item.start}T12:30:30.000Z`,
    effortDriven: { isEffort: item.effortDriven, label: item.effortDriven ? 'Effort' : 'NoEffort' },
  }));
  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', filterable: true, sortable: true, filter: { model: Filters.compoundInputText } },
    {
      id: 'description',
      name: 'Description',
      field: 'description',
      filterable: true,
      sortable: true,
      filter: { model: CustomInputFilter, enableTrimWhiteSpace: true },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      type: 'number',
      filterable: true,
      sortable: true,
      filter: {
        model: Filters.multipleSelect,
        collectionAsync: Promise.resolve(durationCollection),
        collectionFilterBy: [
          { property: 'value', operator: '!=', value: 360 },
          { property: 'value', operator: '!=', value: 365 },
        ],
        collectionSortBy: { property: 'value', sortDesc: true, fieldType: 'number' },
        customStructure: { value: 'value', label: 'label', optionLabel: 'value', labelSuffix: 'text' },
        collectionOptions: { separatorBetweenTextLabels: ' ', filterResultAfterEachPass: 'chain' },
        options: { maxHeight: 250, width: 175, useSelectOptionLabelToHtml: true },
      },
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      type: 'number',
      formatter: Formatters.percentCompleteBar,
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundInputNumber },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      type: 'dateIso',
      formatter: Formatters.dateIso,
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'usDateShort',
      name: 'US Date Short',
      field: 'usDateShort',
      type: 'dateUsShort',
      filterable: true,
      sortable: true,
      width: 70,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'utcDate',
      name: 'UTC Date',
      field: 'utcDate',
      type: 'dateUtc',
      outputType: 'dateTimeIsoAmPm',
      formatter: Formatters.dateTimeIsoAmPm,
      filterable: true,
      sortable: true,
      minWidth: 115,
      filter: { model: Filters.compoundDate, options: { displayDateMin: 'today' } },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven.isEffort',
      formatter: Formatters.multiple,
      params: { formatters: [Formatters.complexObject, Formatters.checkmarkMaterial] },
      type: 'boolean',
      filterable: true,
      sortable: true,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
      },
    },
  ];
  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableExcelExport: true,
    enableExcelCopyBuffer: true,
    enableFiltering: true,
    enableSorting: true,
    enableCellNavigation: true,
    showCustomFooter: true,
    presets: {
      filters: [
        { columnId: 'duration', searchTerms: [10, 98] },
        { columnId: 'usDateShort', operator: '<', searchTerms: ['4/20/25'] },
      ],
      sorters: [
        { columnId: 'duration', direction: 'DESC' },
        { columnId: 'complete', direction: 'ASC' },
      ],
    },
    externalResources: [new ExcelExportService()],
  };
  function setFilters() {
    void grid.filterService.updateFilters([
      { columnId: 'duration', searchTerms: [2, 25, 48, 50] },
      { columnId: 'complete', searchTerms: [95], operator: '<' },
      { columnId: 'effort-driven', searchTerms: [true] },
      { columnId: 'start', searchTerms: ['2001-02-28'], operator: '>=' },
    ]);
  }
  function setSorting() {
    grid.sortService.updateSorting([
      { columnId: 'duration', direction: 'ASC' },
      { columnId: 'start', direction: 'DESC' },
    ]);
  }
</script>

<h2>
  Example 4: Client Side Sort/Filter
  <span class="float-end"
    ><a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example04.svelte"
      ><span class="mdi mdi-link-variant"></span> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
</h2>
<div class="subtitle" class:hidden={!showSubTitle}>
  Sort/Filter on client side only using SlickGrid DataView (<a
    href="https://ghiscoding.gitbook.io/svelte-slickgrid/column-functionalities/sorting"
    target="_blank"
    rel="noreferrer">Wiki docs</a
  >)
  <br />
  <ul class="small">
    <li>Support multi-sort (by default), hold "Shift" key and click on the next column to sort.</li>
    <li>All column types support the following operators: (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *)</li>
    <ul>
      <li>Example: &gt;100 ... &gt;=2001-01-01 ... &gt;02/28/17</li>
      <li>
        <b>Note:</b> For filters to work properly (default is string), make sure to provide a FieldType that matches the dataset, not the Formatter.
      </li>
    </ul>
    <li>Date Filters</li>
    <ul>
      <li>
        FieldType of dateUtc/date can use an extra "filterSearchType" option. In the "UTC Date" field below, type &gt;02/28/2017; when
        dealing with UTC, account for the time difference.
      </li>
    </ul>
    <li>
      On String filters, (*) can be used as startsWith (Hello* =&gt; matches "Hello Word") or endsWith (*Doe =&gt; matches "John Doe")
    </li>
    <li>
      Custom Filter are now possible. The "Description" column below uses a customized InputFilter with a different placeholder. See <a
        href="https://ghiscoding.gitbook.io/svelte-slickgrid/column-functionalities/custom-filter"
        target="_blank"
        rel="noreferrer">Wiki - Custom Filter</a
      >
    </li>
    <li>MultipleSelect &amp; SingleSelect Filters can use a regular "collection" or "collectionAsync" to load it asynchronously</li>
  </ul>
</div>
<br />
<div class="btn-group" role="group">
  <button
    class="btn btn-sm btn-outline-secondary btn-icon"
    data-test="scroll-top-btn"
    aria-label="Scroll to top"
    onclick={() => grid.slickGrid.scrollRowIntoView(0)}><i class="mdi mdi-arrow-down mdi-rotate-180"></i></button
  >
  <button
    class="btn btn-sm btn-outline-secondary btn-icon"
    data-test="scroll-bottom-btn"
    aria-label="Scroll to bottom"
    onclick={() => grid.slickGrid.scrollRowIntoView(grid.dataView.getLength() - 1)}><i class="mdi mdi-arrow-down"></i></button
  >
</div>
<button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-filters" onclick={() => grid.filterService.clearFilters()}
  >Clear Filters</button
>
<button class="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-sorting" onclick={() => grid.sortService.clearSorting()}
  >Clear Sorting</button
>
<button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-filter" onclick={setFilters}
  >Set Filters Dynamically</button
>
<button class="btn btn-outline-secondary btn-sm btn-icon" data-test="set-dynamic-sorting" onclick={setSorting}
  >Set Sorting Dynamically</button
>
<SlickgridSvelte
  gridId="grid4"
  {columns}
  {options}
  {dataset}
  onGridStateChanged={(event) => console.log('Client sample, Grid State changed:: ', event.detail.change)}
  onSvelteGridCreated={(instance) => (grid = instance)}
/>
