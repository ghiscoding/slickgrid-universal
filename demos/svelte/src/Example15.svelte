<script lang="ts">
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type GridState,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { i18n } from './data/i18n.js';

  const KEY = 'gridState';
  const DEFAULT_PAGE_SIZE = 25;
  const today = new Date();
  const todayLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let language = 'en';
  let grid: SlickgridSvelteInstance;
  let subtitle = true;
  const savedState = JSON.parse(localStorage.getItem(KEY) || 'null') as GridState | null;
  const durations = Array.from({ length: 500 }, (_v, i) => ({ value: i, label: i }));
  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      nameKey: 'TITLE',
      filterable: true,
      sortable: true,
      minWidth: 45,
      width: 100,
      filter: { model: Filters.compoundInput },
    },
    {
      id: 'description',
      name: 'Description',
      field: 'description',
      filterable: true,
      sortable: true,
      minWidth: 80,
      width: 100,
      filter: {
        model: Filters.input,
        filterShortcuts: [
          { titleKey: 'BLANK_VALUES', searchTerms: ['< A'], iconCssClass: 'mdi mdi-filter-minus-outline' },
          { titleKey: 'NON_BLANK_VALUES', searchTerms: ['> A'], iconCssClass: 'mdi mdi-filter-plus-outline' },
        ],
      },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      sortable: true,
      type: 'number',
      minWidth: 55,
      width: 100,
      nameKey: 'DURATION',
      filterable: true,
      filter: { collection: durations, model: Filters.multipleSelect, options: { maxHeight: 250, width: 175 } },
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      nameKey: 'PERCENT_COMPLETE',
      minWidth: 70,
      type: 'number',
      sortable: true,
      width: 100,
      formatter: Formatters.percentCompleteBar,
      filterable: true,
      filter: { model: Filters.slider, operator: '>' },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      nameKey: 'START',
      formatter: Formatters.dateIso,
      sortable: true,
      minWidth: 75,
      exportWithFormatter: true,
      width: 100,
      type: 'date',
      filterable: true,
      filter: {
        model: Filters.compoundDate,
        filterShortcuts: [
          { titleKey: 'PAST', searchTerms: [todayLocal], operator: '<', iconCssClass: 'mdi mdi-calendar' },
          { titleKey: 'FUTURE', searchTerms: [todayLocal], operator: '>', iconCssClass: 'mdi mdi-calendar-clock' },
        ],
      },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      nameKey: 'COMPLETED',
      minWidth: 85,
      maxWidth: 85,
      formatter: Formatters.checkmarkMaterial,
      width: 100,
      type: 'boolean',
      sortable: true,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
        model: Filters.singleSelect,
      },
    },
  ];
  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableCheckboxSelector: true,
    enableFiltering: true,
    enableTranslate: true,
    i18n,
    columnPicker: { hideForceFitButton: true },
    gridMenu: { hideForceFitButton: true },
    enablePagination: true,
    pagination: { pageSizes: [5, 10, 15, 20, 25, 30, 40, 50, 75, 100], pageSize: DEFAULT_PAGE_SIZE },
    autoFitColumnsOnFirstLoad: false,
    enableAutoSizeColumns: false,
    autosizeColumnsByCellContentOnFirstLoad: true,
    enableAutoResizeColumnsByCellContent: true,
    ...(savedState ? { presets: savedState } : {}),
  };
  let dataset = makeData();
  const events = {
    onGridStateChanged: (event: CustomEvent<any>) => {
      const state = event.detail?.gridState;
      if (state) {
        localStorage.setItem(KEY, JSON.stringify(state));
      }
    },
    onBeforeGridDestroy: () => {
      if (grid) {
        localStorage.setItem(KEY, JSON.stringify(grid.gridStateService.getCurrentGridState()));
      }
    },
  };
  function makeData() {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 500 }, (_v, i) => {
      const month = 1 + Math.floor(Math.random() * 12),
        day = 10 + Math.floor(Math.random() * 19),
        year = currentYear - 15 + Math.floor(Math.random() * 24);
      return {
        id: i,
        title: `Task ${i}`,
        description: i % 5 ? `desc ${i}` : null,
        duration: Math.round(Math.random() * 100),
        percentComplete: Math.floor(Math.random() * 101),
        start: new Date(year, month, day),
        usDateShort: `${month}/${day}/25`,
        utcDate: `${year}-01-01T10:10:10Z`,
        completed: i % 3 === 0,
      };
    });
  }
  function ready(instance: SlickgridSvelteInstance) {
    grid = instance;
  }
  function reset() {
    grid.gridService.resetGrid(columns);
    grid.paginationService?.changeItemPerPage(DEFAULT_PAGE_SIZE);
    localStorage.removeItem(KEY);
  }
  async function switchLanguage() {
    language = language === 'en' ? 'fr' : 'en';
    await i18n.changeLanguage(language);
  }
  function toggleSubTitle() {
    subtitle = !subtitle;
    grid?.resizerService.resizeGrid(0);
  }
</script>

<h2>
  Example 15: Grid State &amp; Presets using Local Storage
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example15.svelte"
      ><span class="mdi mdi-link-variant"></span> code</a
    >
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}><i class="mdi mdi-information-outline"></i></button
  >
</h2>
{#if subtitle}<div class="subtitle">
    Grid State and Presets use Local Storage to persist column order, visibility, size, filters, sorting, pagination and selection.
  </div>{/if}
<button class="btn btn-outline-secondary btn-sm btn-icon" data-test="reset-button" onclick={reset}
  ><i class="mdi mdi-close"></i> Clear Grid State from Local Storage &amp; Reset Grid</button
>
<button class="btn btn-outline-secondary btn-sm btn-icon" data-test="language-button" onclick={switchLanguage}
  ><i class="mdi mdi-translate"></i> Switch Language</button
>
<b>Locale:</b> <span style="font-style:italic" data-test="selected-locale">{language}.json</span>
<SlickgridSvelte gridId="grid15" {columns} {options} {dataset} {events} onSvelteGridCreated={ready} />
