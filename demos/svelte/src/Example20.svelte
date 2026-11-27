<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    Editors,
    Filters,
    formatNumber,
    Formatters,
    SlickgridSvelte,
    type Column,
    type ColumnEditorDualInput,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { showToast } from './utilities.js';

  const NB_ITEMS = 500;
  let showSubTitle = $state(true);
  let pinnedColumnCount = $state(2);
  let pinnedRightColumnCount = $state(1);
  let pinnedTopRowCount = $state(3);
  let pinnedBottomRowCount = $state(2);
  let isSelectAllShownAsColumnTitle = false;
  let svelteGrid: SlickgridSvelteInstance;
  let checkboxSelectorInstance: any;

  const dataset = mockData(NB_ITEMS);
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
      filterable: true,
      formatter: Formatters.dateIso,
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
      formatter: costDurationFormatter,
      sortable: true,
      filter: { model: Filters.compoundSlider },
      editor: {
        model: Editors.dualInput,
        params: {
          leftInput: { field: 'cost', type: 'float', decimal: 2, minValue: 0, maxValue: 50000 },
          rightInput: { field: 'duration', type: 'float', minValue: 0, maxValue: 100 },
        } as ColumnEditorDualInput,
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
  const gridOptions = defineGridOptions();

  function defineGridOptions(): GridOption {
    return {
      autoResize: { container: '#demo-container', rightPadding: 10 },
      // Keep the left-pinned columns compact so two right-pinned columns fit
      // beside the framework demo's route sidebar.
      autoFitColumnsOnFirstLoad: false,
      enableAutoResize: true,
      enableAutoSizeColumns: true,
      enableCellNavigation: true,
      enableFiltering: true,
      editable: true,
      autoEdit: true,
      enableExcelCopyBuffer: true,
      enableExcelExport: true,
      externalResources: [new ExcelExportService()],
      enableSelection: true,
      enableCheckboxSelector: true,
      selectionOptions: { selectActiveRow: false },
      checkboxSelector: {
        hideInColumnTitleRow: !isSelectAllShownAsColumnTitle,
        hideInFilterHeaderRow: isSelectAllShownAsColumnTitle,
        name: 'Sel',
        onExtensionRegistered: (instance: any) => (checkboxSelectorInstance = instance),
      },
      pinning: {
        columns: { left: ['_checkbox_selector', 'title', 'percentComplete'], right: ['action'] },
        rows: { top: getPinnedRowIndexes(pinnedTopRowCount), bottom: getPinnedRowIndexes(pinnedBottomRowCount, true) },
      },
      enableCellMenu: true,
      cellMenu: {
        onCommand: (_e: unknown, args: any) => executeCommand(args),
      },
      enableContextMenu: true,
      contextMenu: getContextMenuOptions(),
    };
  }

  function mockData(count: number) {
    return Array.from({ length: count }, (_v, i) => ({
      id: i,
      title: `Task ${i}`,
      duration: i % 8 ? `${Math.round(Math.random() * 100)}` : null,
      percentComplete: Math.round(Math.random() * 100),
      start: new Date(2009, 0, 1),
      finish: new Date(2009, 4, 5),
      cost: i % 33 === 0 ? null : Math.random() * 10000,
      completed: i % 5 === 0,
      cityOfOrigin: i % 2 ? 'Vancouver, BC, Canada' : 'Boston, MA, United States',
    }));
  }

  function getPinnedRowIndexes(rowCount: number, isBottom = false) {
    const count = Math.max(0, Number(rowCount) || 0);
    const dataLength = svelteGrid?.slickGrid?.getDataLength?.() ?? dataset.length;
    const first = isBottom ? Math.max(0, dataLength - count) : 0;
    return Array.from({ length: count }, (_v, i) => first + i);
  }

  function costDurationFormatter(_row: number, _cell: number, _value: any, _columnDef: Column, dataContext: any) {
    const costText = isNullUndefinedOrEmpty(dataContext.cost) ? 'n/a' : formatNumber(dataContext.cost, 0, 2, false, '$', '', '.', ',');
    const durationText =
      !isNullUndefinedOrEmpty(dataContext.duration) && dataContext.duration >= 0
        ? `${dataContext.duration} ${dataContext.duration > 1 ? 'days' : 'day'}`
        : 'n/a';
    return `<b>${costText}</b> | ${durationText}`;
  }
  function isNullUndefinedOrEmpty(data: any) {
    return data === '' || data === null || data === undefined;
  }

  function getContextMenuOptions(): any {
    return {
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
      onCommand: (_e: unknown, args: any) => executeCommand(args),
    };
  }

  function executeCommand(args: any) {
    switch (args.command) {
      case 'delete-row':
        if (confirm(`Do you really want to delete row (${args.row + 1}) with "${args.dataContext.title}"?`)) {
          svelteGrid?.gridService?.deleteItemById(args.dataContext.id);
        }
        break;
      case 'command1':
      case 'command2':
      case 'help':
        alert(args.item.title);
        break;
      case 'exports-csv':
      case 'exports-txt':
      case 'exports-xlsx':
        alert(`Exporting as ${args.item.title}`);
        break;
      default:
        alert(`Command: ${args.command}`);
    }
  }

  function setPinnedColumns(left: number, right = pinnedRightColumnCount) {
    const nextRight = Math.max(0, Number(right) || 0);
    // Keep both edges stable by column ID. Numeric edge shorthands are resolved
    // against visible indexes, which can shift when columns are hidden/shown.
    const leftIds = left >= 0 ? ['_checkbox_selector', 'title', 'percentComplete'].slice(0, left + 1) : [];
    const rightIds = ['cityOfOrigin', 'action'].slice(Math.max(0, 2 - nextRight));
    svelteGrid?.slickGrid?.setOptions({ pinning: { columns: { left: leftIds, right: rightIds } } });
    pinnedColumnCount = left;
    pinnedRightColumnCount = nextRight;
  }
  function changePinnedColumnCount(event: Event, side: 'left' | 'right') {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    setPinnedColumns(side === 'left' ? value : pinnedColumnCount, side === 'right' ? value : pinnedRightColumnCount);
  }
  function toggleRightPinning() {
    setPinnedColumns(pinnedColumnCount, pinnedRightColumnCount > 0 ? 0 : 1);
  }
  function changePinnedRowCount(event: Event, side: 'top' | 'bottom') {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    if (side === 'top') {
      pinnedTopRowCount = value;
    } else {
      pinnedBottomRowCount = value;
    }
    svelteGrid?.slickGrid?.setOptions({
      pinning: {
        rows: {
          top: getPinnedRowIndexes(pinnedTopRowCount),
          bottom: getPinnedRowIndexes(pinnedBottomRowCount, true),
        },
      },
    });
  }
  function removePinnedColumns() {
    setPinnedColumns(-1, 0);
  }
  function toggleWhichRowToShowSelectAll() {
    isSelectAllShownAsColumnTitle = !isSelectAllShownAsColumnTitle;
    checkboxSelectorInstance?.setOptions({
      hideInColumnTitleRow: !isSelectAllShownAsColumnTitle,
      hideInFilterHeaderRow: isSelectAllShownAsColumnTitle,
    });
  }
  function setLargePinnedColumns() {
    svelteGrid?.gridStateService?.applyColumnLayout?.(
      [
        { columnId: '_checkbox_selector', cssClass: 'slick-cell-checkboxsel', headerCssClass: '', width: 40 },
        { columnId: 'title', cssClass: '', headerCssClass: '', width: 220 },
        { columnId: 'percentComplete', cssClass: '', headerCssClass: '', width: 280 },
        { columnId: 'start', cssClass: '', headerCssClass: '', width: 150 },
        { columnId: 'finish', cssClass: '', headerCssClass: '', width: 280 },
        { columnId: 'completed', cssClass: '', headerCssClass: '', width: 180 },
        { columnId: 'cost', cssClass: '', headerCssClass: '', width: 220 },
        { columnId: 'cityOfOrigin', cssClass: '', headerCssClass: '', width: 180 },
        { columnId: 'action', cssClass: '', headerCssClass: '', width: 110 },
      ],
      false,
      false
    );
    setPinnedColumns(2, pinnedRightColumnCount);
  }
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => svelteGrid?.resizerService?.resizeGrid());
  }
  function onCellValidationError(event: CustomEvent<{ args: any }>) {
    showToast(event.detail.args.validationResults.msg, 'danger');
  }
  function svelteGridReady(grid: SlickgridSvelteInstance) {
    svelteGrid = grid;
  }
</script>

<h2>
  Example 20: Pinned Columns/Rows
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example20.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span><button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>
{#if showSubTitle}
  <div class="subtitle">
    This example demonstrates the use of Pinned (aka pinned) Columns and/or Rows (<a
      href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/pinning"
      target="_blank"
    >
      Wiki docs
    </a>) City of Origin is intentionally non-pinnable and is highlighted with a subtle gray background. Columns and rows can also be pinned
    selectively, without requiring them to be sequential (for example, rows 0, 2, and 4). You can pin any number of columns or rows, place
    rows at the bottom, change these options through SlickGrid setOptions(), and customize the border styling between pinned columns and
    rows.
  </div>
{/if}
<br />
<div class="row gx-2 mb-2 align-items-end">
  <div class="col-auto">
    <label for="pinned-top-row-count">Pinned Rows (top/bottom): </label>
    <select
      id="pinned-top-row-count"
      class="form-select form-select-sm d-inline-block w-auto pinned-top-row-count"
      value={pinnedTopRowCount}
      onchange={(e) => changePinnedRowCount(e, 'top')}
    >
      {#each [0, 1, 2, 3, 4, 5] as count}
        <option value={count}>{count}</option>
      {/each}
    </select>
    <select
      aria-label="Pinned bottom row count"
      class="form-select form-select-sm d-inline-block w-auto pinned-bottom-row-count"
      value={pinnedBottomRowCount}
      onchange={(e) => changePinnedRowCount(e, 'bottom')}
    >
      {#each [0, 1, 2, 3, 4, 5] as count}
        <option value={count}>{count}</option>
      {/each}
    </select>
  </div>
  <div class="col-auto">
    <label for="pinned-left-column-count">Pinned Columns (left/right): </label>
    <select
      id="pinned-left-column-count"
      class="form-select form-select-sm d-inline-block w-auto pinned-left-column-count"
      value={pinnedColumnCount}
      onchange={(e) => changePinnedColumnCount(e, 'left')}
    >
      <option value="-1">None</option>
      {#each [0, 1, 2, 3, 4, 5] as count}
        <option value={count}>{count}</option>
      {/each}
    </select>
    <select
      aria-label="Pinned right column count"
      class="form-select form-select-sm d-inline-block w-auto pinned-right-column-count"
      value={pinnedRightColumnCount}
      onchange={(e) => changePinnedColumnCount(e, 'right')}
    >
      {#each [0, 1, 2] as count}
        <option value={count}>{count}</option>
      {/each}
    </select>
  </div>
</div>
<div class="row mt-2">
  <div class="col-sm-12">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="remove-pinned-column-button" onclick={removePinnedColumns}>
      <i class="mdi mdi-close"></i> Remove Pinned Columns
    </button>
    <button
      class="btn btn-outline-secondary btn-sm btn-icon mx-1"
      data-test="set-3pinned-columns"
      onclick={() => setPinnedColumns(2, pinnedRightColumnCount)}
    >
      <i class="mdi mdi-pin-outline"></i> Pin 3 Columns
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="toggle-pinned-right" onclick={toggleRightPinning}>
      <i class="mdi mdi-pin-outline"></i> Toggle Pinned Right
    </button>
    <button
      class="btn btn-outline-secondary btn-sm btn-icon mx-1"
      data-test="toggle-select-all-row"
      onclick={toggleWhichRowToShowSelectAll}
    >
      <i class="mdi mdi-checkbox-marked-circle-outline"></i> Toggle Select All
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-large-pinned-columns" onclick={setLargePinnedColumns}>
      <i class="mdi mdi-arrow-expand-horizontal"></i> Set Large Columns
    </button>
  </div>
</div>
<div class="col-sm-12"><hr /></div>
<SlickgridSvelte
  gridId="grid20"
  {columns}
  options={gridOptions}
  {dataset}
  onValidationError={onCellValidationError}
  onSvelteGridCreated={svelteGridReady}
/>
