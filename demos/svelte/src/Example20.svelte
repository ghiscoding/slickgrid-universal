<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    Editors,
    Filters,
    formatNumber,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  let grid: SlickgridSvelteInstance;
  let checkboxSelector: any;
  let leftCount = 2,
    rightCount = 1,
    topCount = 3,
    bottomCount = 2,
    selectAllTitle = false,
    subtitle = true;
  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', width: 120, minWidth: 100, sortable: true, filterable: true },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      width: 140,
      minWidth: 130,
      type: 'number',
      sortable: true,
      filterable: true,
      filter: { model: Filters.slider, operator: '>=' },
      editor: { model: Editors.singleSelect, collection: Array.from({ length: 101 }, (_v, i) => ({ value: i, label: i })) },
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      type: 'dateIso',
      minWidth: 100,
      sortable: true,
      filterable: true,
      formatter: Formatters.dateIso,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      minWidth: 100,
      type: 'dateIso',
      sortable: true,
      formatter: Formatters.dateIso,
      filterable: true,
      filter: { model: Filters.compoundDate },
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      minWidth: 60,
      sortable: true,
      filterable: true,
      formatter: Formatters.checkmarkMaterial,
      editor: { model: Editors.checkbox },
      filter: {
        model: Filters.singleSelect,
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
      },
    },
    {
      id: 'cost',
      name: 'Cost | Duration',
      field: 'cost',
      minWidth: 120,
      formatter: (_r, _c, _v, _d, item) =>
        `<b>${item.cost == null ? 'n/a' : formatNumber(item.cost, 0, 2, false, '$', '', '.', ',')}</b> | ${item.duration != null ? `${item.duration} ${item.duration > 1 ? 'days' : 'day'}` : 'n/a'}`,
      sortable: true,
      filter: { model: Filters.compoundSlider },
      editor: {
        model: Editors.dualInput,
        params: {
          leftInput: { field: 'cost', type: 'float', decimal: 2, minValue: 0, maxValue: 50000 },
          rightInput: { field: 'duration', type: 'float', minValue: 0, maxValue: 100 },
        },
      },
    },
    {
      id: 'cityOfOrigin',
      name: 'City of Origin (not pinnable)',
      field: 'cityOfOrigin',
      cssClass: 'city-of-origin-column',
      minWidth: 100,
      sortable: true,
      filterable: true,
      pinnable: false,
    },
    {
      id: 'action',
      name: 'Action',
      field: 'action',
      width: 100,
      maxWidth: 100,
      excludeFromExport: true,
      formatter: () => '<div class="cell-menu-dropdown">Action<i class="mdi mdi-chevron-down"></i></div>',
      cellMenu: {
        commandTitle: 'Commands',
        commandItems: [
          { command: 'command1', title: 'Command 1' },
          { command: 'command2', title: 'Command 2' },
          { command: 'delete-row', title: 'Delete Row' },
          'divider',
          { command: 'help', title: 'Help' },
        ],
      },
    },
  ];
  const dataset = Array.from({ length: 500 }, (_v, i) => ({
    id: i,
    title: `Task ${i}`,
    duration: `${Math.round(Math.random() * 100)}`,
    percentComplete: Math.round(Math.random() * 100),
    start: new Date(2009, 0, 1),
    finish: new Date(2009, 4, 5),
    completed: i % 5 === 0,
    cost: i % 33 === 0 ? null : Math.random() * 10000,
    cityOfOrigin: i % 2 ? 'Vancouver, BC, Canada' : 'Boston, MA, United States',
  }));
  const options: GridOption = {
    gridWidth: 920,
    autoResize: { container: '#demo-container', rightPadding: 10 },
    autoFitColumnsOnFirstLoad: false,
    enableCellNavigation: true,
    editable: true,
    autoEdit: true,
    enableFiltering: true,
    enableExcelCopyBuffer: true,
    enableExcelExport: true,
    externalResources: [new ExcelExportService()],
    enableSelection: true,
    enableCheckboxSelector: true,
    selectionOptions: { selectActiveRow: false },
    checkboxSelector: {
      hideInColumnTitleRow: true,
      hideInFilterHeaderRow: false,
      name: 'Sel',
      onExtensionRegistered: (instance: any) => (checkboxSelector = instance),
    },
    pinning: {
      columns: { left: ['_checkbox_selector', 'title', 'percentComplete'], right: ['action'] },
      rows: { top: [0, 1, 2], bottom: [498, 499] },
    },
    enableCellMenu: true,
    cellMenu: { onCommand: (_e: any, args: any) => execute(args) },
    enableContextMenu: true,
    contextMenu: {
      hideCloseButton: true,
      dropSide: 'right',
      commandItems: [
        { command: '', divider: true },
        {
          command: 'export',
          title: 'Exports',
          commandItems: [
            { command: 'exports-txt', title: 'Text (tab delimited)' },
            {
              command: 'sub-menu',
              title: 'Excel',
              subMenuTitle: 'available formats',
              commandItems: [
                { command: 'exports-csv', title: 'Excel (csv)' },
                { command: 'exports-xlsx', title: 'Excel (xlsx)' },
              ],
            },
          ],
        },
        {
          command: 'feedback',
          title: 'Feedback',
          commandItems: [
            { command: 'request-update', title: 'Request update from supplier' },
            'divider',
            {
              command: 'sub-menu',
              title: 'Contact Us',
              subMenuTitle: 'contact us...',
              commandItems: [
                { command: 'contact-email', title: 'Email us' },
                { command: 'contact-chat', title: 'Chat with us' },
                { command: 'contact-meeting', title: 'Book an appointment' },
              ],
            },
          ],
        },
      ],
      onCommand: (_e: any, args: any) => execute(args),
    },
  };
  function ready(i: SlickgridSvelteInstance) {
    grid = i;
  }
  function execute(args: any) {
    if (args.command === 'delete-row' && confirm(`Do you really want to delete row (${args.row + 1}) with "${args.dataContext.title}"?`)) {
      grid.gridService.deleteItemById(args.dataContext.id);
    } else if (['exports-csv', 'exports-txt', 'exports-xlsx'].includes(args.command)) {
      alert(`Exporting as ${args.item.title}`);
    } else if (args.command === 'contact-email' || args.command === 'contact-chat' || args.command === 'contact-meeting') {
      alert(`Command: ${args.command}`);
    } else if (args.item) {
      alert(args.item.title);
    } else {
      alert(`Command: ${args.command}`);
    }
  }
  function pinnedColumns(left: number, right = rightCount) {
    grid.slickGrid.setOptions({
      pinning: {
        columns: {
          left: left >= 0 ? ['_checkbox_selector', 'title', 'percentComplete'].slice(0, left + 1) : [],
          right: ['cityOfOrigin', 'action'].slice(Math.max(0, 2 - Math.max(0, Number(right) || 0))),
        },
      },
    });
    leftCount = left;
    rightCount = right;
  }
  function changeCols(event: Event, side: 'left' | 'right') {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    pinnedColumns(side === 'left' ? value : leftCount, side === 'right' ? value : rightCount);
  }
  function changeRows(event: Event, side: 'top' | 'bottom') {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    if (side === 'top') {
      topCount = value;
    } else {
      bottomCount = value;
    }
    const n = grid.slickGrid.getDataLength();
    grid.slickGrid.setOptions({
      pinning: {
        rows: {
          top: Array.from({ length: topCount }, (_v, i) => i),
          bottom: Array.from({ length: bottomCount }, (_v, i) => Math.max(0, n - bottomCount) + i),
        },
      },
    });
  }
  function toggleRight() {
    pinnedColumns(leftCount, rightCount ? 0 : 1);
  }
  function toggleSelectAll() {
    selectAllTitle = !selectAllTitle;
    checkboxSelector?.setOptions({ hideInColumnTitleRow: !selectAllTitle, hideInFilterHeaderRow: selectAllTitle });
  }
  function largeColumns() {
    grid.gridStateService.applyColumnLayout(
      [
        { columnId: '_checkbox_selector', width: 40 },
        { columnId: 'title', width: 220 },
        { columnId: 'percentComplete', width: 280 },
        { columnId: 'start', width: 150 },
        { columnId: 'finish', width: 280 },
        { columnId: 'completed', width: 180 },
        { columnId: 'cost', width: 220 },
        { columnId: 'cityOfOrigin', width: 180 },
        { columnId: 'action', width: 110 },
      ],
      false,
      false
    );
    pinnedColumns(2);
  }
  function toggleSubTitle() {
    subtitle = !subtitle;
    grid?.resizerService.resizeGrid(0);
  }
</script>

<h2>
  Example 20: Pinned Columns/Rows
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example20.svelte"
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
{#if subtitle}<div class="subtitle">This example demonstrates pinned columns and rows. City of Origin cannot be pinned.</div>{/if}
<div class="row gx-2 mb-2 align-items-end">
  <div class="col-auto">
    <span>Pinned Rows (top/bottom): </span>
    <select
      aria-label="Pinned top row count"
      class="form-select form-select-sm d-inline-block w-auto pinned-top-row-count"
      value={topCount}
      onchange={(e) => changeRows(e, 'top')}
      >{#each [0, 1, 2, 3, 4, 5] as n}<option value={n}>{n}</option>{/each}</select
    >
    <select
      aria-label="Pinned bottom row count"
      class="form-select form-select-sm d-inline-block w-auto pinned-bottom-row-count"
      value={bottomCount}
      onchange={(e) => changeRows(e, 'bottom')}
      >{#each [0, 1, 2, 3, 4, 5] as n}<option value={n}>{n}</option>{/each}</select
    >
  </div>
  <div class="col-auto">
    <span>Pinned Columns (left/right): </span><select
      aria-label="Pinned left column count"
      class="form-select form-select-sm d-inline-block w-auto pinned-left-column-count"
      value={leftCount}
      onchange={(e) => changeCols(e, 'left')}
      ><option value="-1">None</option>{#each [0, 1, 2, 3, 4, 5] as n}<option value={n}>{n}</option>{/each}</select
    >
    <select
      aria-label="Pinned right column count"
      class="form-select form-select-sm d-inline-block w-auto pinned-right-column-count"
      value={rightCount}
      onchange={(e) => changeCols(e, 'right')}
      >{#each [0, 1, 2] as n}<option value={n}>{n}</option>{/each}</select
    >
  </div>
</div>
<div class="row mb-2">
  <div class="col-12">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="remove-pinned-column-button" onclick={() => pinnedColumns(-1, 0)}
      >Remove Pinned Columns</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-3pinned-columns" onclick={() => pinnedColumns(2)}
      >Pin 3 Columns</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="toggle-pinned-right" onclick={toggleRight}
      >Toggle Pinned Right</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="toggle-select-all-row" onclick={toggleSelectAll}
      >Toggle Select All</button
    >
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-large-pinned-columns" onclick={largeColumns}
      >Set Large Columns</button
    >
  </div>
</div>
<hr />
<SlickgridSvelte gridId="grid20" {columns} {options} {dataset} onSvelteGridCreated={ready} />
