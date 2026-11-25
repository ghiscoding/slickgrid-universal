<script lang="ts">
  import { SvelteRowDetailView } from '@slickgrid-universal/svelte-row-detail-plugin';
  import {
    Editors,
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import Example19Detail from './Example19Detail.svelte';
  import ExampleDetailPreload from './ExampleDetailPreload.svelte';

  let grid: SlickgridSvelteInstance;
  let rowDetail: any;
  let detailViewRowCount = 9;
  let serverWaitDelay = 500;
  let subtitle = true;
  let darkMode = false;
  let message = '';
  let alertType = 'info';
  let dataset = Array.from({ length: 500 }, (_v, i) => {
    const year = 2000 + Math.floor(Math.random() * 10),
      month = Math.floor(Math.random() * 11),
      day = Math.floor(Math.random() * 29),
      pct = Math.round(Math.random() * 100);
    return {
      rowId: i,
      title: `Task ${i}`,
      duration: i % 33 ? Math.floor(Math.random() * 100) + 1 : null,
      percentComplete: pct,
      percentComplete2: pct,
      start: new Date(year, month, day),
      finish: new Date(year, month + 1, day),
      effortDriven: i % 5 === 0,
    };
  });
  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, width: 70, filterable: true, editor: { model: Editors.text } },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, type: 'number', minWidth: 90, filterable: true },
    {
      id: 'percent2',
      name: '% Complete',
      field: 'percentComplete2',
      editor: { model: Editors.slider },
      formatter: Formatters.progressBar,
      type: 'number',
      sortable: true,
      minWidth: 100,
      filterable: true,
      filter: { model: Filters.slider, operator: '>' },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      formatter: Formatters.dateIso,
      sortable: true,
      type: 'date',
      minWidth: 90,
      exportWithFormatter: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      formatter: Formatters.dateIso,
      sortable: true,
      type: 'date',
      minWidth: 90,
      exportWithFormatter: true,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      minWidth: 100,
      formatter: Formatters.checkmarkMaterial,
      type: 'boolean',
      filterable: true,
      sortable: true,
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
  const parentRef = {
    showFlashMessage: (text: string, type = 'info') => {
      message = text;
      alertType = type;
    },
  };
  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableFiltering: true,
    enableRowDetailView: true,
    darkMode,
    datasetIdPropertyName: 'rowId',
    externalResources: [SvelteRowDetailView],
    rowDetailView: {
      process: (item: any) =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(Object.assign(item, { assignee: ['John Doe', 'Jane Doe', 'Chuck Norris'][item.rowId % 3], reporter: 'Bruce Lee' })),
            serverWaitDelay
          )
        ),
      loadOnce: true,
      singleRowExpand: false,
      useRowClick: true,
      keepComponentAlive: true,
      panelRows: detailViewRowCount,
      preloadComponent: ExampleDetailPreload,
      viewComponent: Example19Detail,
      parentRef,
      onExtensionRegistered: (extension: any) => (rowDetail = extension),
    },
    selectionOptions: { selectActiveRow: true },
  };
  function ready(instance: SlickgridSvelteInstance) {
    grid = instance;
    rowDetail = instance.extensionService.getExtensionInstanceByName('rowDetailView') ?? rowDetail;
  }
  function changeDetailViewRowCount() {
    const opts = rowDetail?.getOptions?.();
    if (opts) {
      opts.panelRows = Number(detailViewRowCount);
      rowDetail.setOptions(opts);
    }
  }
  function changeEditableGrid() {
    rowDetail?.collapseAll();
    if (rowDetail?.addonOptions) {
      rowDetail.addonOptions.useRowClick = false;
    }
    const current = grid.slickGrid.getOptions();
    grid.slickGrid.setOptions({ editable: true, autoEdit: true, enableCellNavigation: true, autoCommitEdit: !current.autoCommitEdit });
  }
  function closeAllRowDetail() {
    rowDetail?.collapseAll();
  }
  function toggleDarkMode() {
    darkMode = !darkMode;
    document.querySelector('.panel-wm-content')?.classList.toggle('dark-mode', darkMode);
    document.querySelector<HTMLElement>('#demo-container')?.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
    grid.slickGrid.setOptions({ darkMode });
    closeAllRowDetail();
  }
  function toggleSubTitle() {
    subtitle = !subtitle;
    grid?.resizerService.resizeGrid(2);
  }
</script>

<h2>
  Example 19: Row Detail View <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/demos/examples/example19.component.ts"
      ><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}><i class="mdi mdi-information-outline"></i></button
  >
  <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="toggle-dark-mode" onclick={toggleDarkMode}
    ><i class="mdi mdi-theme-light-dark"></i> Toggle Dark Mode</button
  >
</h2>
{#if subtitle}<div class="subtitle">
    Click the row expander or a row to load a detail view asynchronously. Row details close on sorting and can be edited independently.
  </div>{/if}
<div class="row">
  <div class="col-sm-6">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="editable-grid-btn" onclick={changeEditableGrid}
      >Make Grid Editable</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="collapse-all-btn" onclick={closeAllRowDetail}
      >Close All Row Details</button
    >
    <span class="d-inline-flex gap-1"
      ><label for="detailViewRowCount">Detail View Rows Shown: </label><input
        id="detailViewRowCount"
        type="number"
        style="height:22px;width:50px"
        bind:value={detailViewRowCount}
      /><button class="btn btn-outline-secondary btn-xs btn-icon" data-test="set-count-btn" onclick={changeDetailViewRowCount}>Set</button
      ><label for="serverdelay">Server Delay: </label><input
        id="serverdelay"
        type="number"
        data-test="server-delay"
        style="height:26px;width:60px"
        bind:value={serverWaitDelay}
      /></span
    >
  </div>
  {#if message}<div class="alert alert-{alertType} col-sm-6" data-test="flash-msg">{message}</div>{/if}
</div>
<hr />
<SlickgridSvelte gridId="grid19" {columns} {options} {dataset} onSvelteGridCreated={ready} />
