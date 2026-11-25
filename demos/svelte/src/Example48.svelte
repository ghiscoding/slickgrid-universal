<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    Formatters,
    SlickEventHandler,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { onDestroy } from 'svelte';

  const NB_ITEMS = 995;

  const _eventHandler = new SlickEventHandler();
  let hideSubTitle = $state(false);
  let enableMultiSelection = $state(false);
  let svelteGrid1: SlickgridSvelteInstance | undefined;
  let svelteGrid2: SlickgridSvelteInstance | undefined;

  const colDefs1: Column[] = [
    { id: 'id', name: '#', field: 'id', width: 32, maxWidth: 40, excludeFromHeaderMenu: true },
    { id: 'title', name: 'Title', field: 'title', width: 90, cssClass: 'cell-title' },
    { id: 'complete', name: '% Complete', field: 'percentComplete', sortable: true, width: 90 },
    { id: 'start', name: 'Start', field: 'start', type: 'date', sortable: true, formatter: Formatters.dateUs },
    { id: 'finish', name: 'Finish', field: 'finish', type: 'date', sortable: true, formatter: Formatters.dateUs },
    {
      id: 'priority',
      name: 'Priority',
      field: 'priority',
      width: 80,
      resizable: false,
      sortable: true,
      type: 'number',
      sortComparer: (x, y, direction) => {
        return (direction ?? 0) * (x === y ? 0 : x > y ? 1 : -1);
      },
      formatter: (_row, _cell, value) => {
        if (!value) {
          return '';
        }
        const count = +(value >= 3 ? 3 : value);
        return count === 3 ? 'High' : count === 2 ? 'Medium' : 'Low';
      },
    },
    {
      id: 'effortDriven',
      name: 'Effort Driven',
      field: 'effortDriven',
      cssClass: 'text-center',
      width: 95,
      maxWidth: 120,
      type: 'boolean',
      sortable: true,
      exportCustomFormatter: (_row, _cell, value) => (value ? 'Yes' : 'No'),
      formatter: Formatters.checkmarkMaterial,
    },
  ];

  // assign both column definitions
  const columns1: Column[] = colDefs1;
  const columns2: Column[] = [...colDefs1];

  const baseGridOptions: GridOption = {
    autoResize: {
      container: '#demo-container',
    },
    gridHeight: 250,
    gridWidth: 800,
    enableCellNavigation: true,
    preventDragFromKeys: [],
    autoEdit: true,
    editable: true,
    headerRowHeight: 35,
    rowHeight: 35,
    enableExcelExport: true,
    excelExportOptions: {
      exportWithFormatter: true,
    },
    externalResources: [new ExcelExportService()],

    // enable new hybrid selection model (rows & cells)
    enableSelection: true,
    selectionOptions: {
      rowSelectColumnIds: ['id'],
      selectionType: 'mixed',
      enableMultiSelection: false,
      // showDragHandle: 'hover', // can also be true (default) or false
    },

    // when using the ExcelCopyBuffer, you can see what the selection range is
    enableExcelCopyBuffer: true,
    excelCopyBufferOptions: {
      copyActiveEditorCell: true,
      removeDoubleQuotesOnPaste: true,
      replaceNewlinesWith: ' ',
    },
  };

  let gridOptions1 = $state.raw<GridOption>(baseGridOptions);

  // copy the same Grid Options and Column Definitions to 2nd grid
  let gridOptions2 = $state.raw<GridOption>({
    ...baseGridOptions,
    // you can also enable checkbox selection & row selection, make sure to use `rowSelectColumnIds: ['id', '_checkbox_selector']`
    enableCheckboxSelector: true,
    enableSelection: true,
    selectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: false,

      // you could use "row" selection to override the hybrid mode
      selectionType: 'row',

      // allow using the mouse drag selection to select multiple rows
      dragToSelect: true,
      enableMultiSelection: false,
    },
  });

  // mock some data (different in each dataset)
  const dataset1 = mockData(NB_ITEMS);
  const dataset2 = mockData(NB_ITEMS);

  onDestroy(() => _eventHandler.unsubscribeAll());

  function grid1Ready(instance: SlickgridSvelteInstance) {
    svelteGrid1 = instance;
    const cellSelectionModel1 = instance.slickGrid!.getSelectionModel()!;
    _eventHandler.subscribe(cellSelectionModel1.onSelectedRangesChanged, (_e, args) => {
      const targetRange = document.querySelector('#selectionRange1') as HTMLSpanElement;
      if (targetRange) {
        targetRange.textContent = '';
        for (const slickRange of args) {
          targetRange.textContent += JSON.stringify(slickRange);
        }
      }
    });
  }

  function grid2Ready(instance: SlickgridSvelteInstance) {
    svelteGrid2 = instance;
    const cellSelectionModel2 = instance.slickGrid!.getSelectionModel()!;
    _eventHandler.subscribe(cellSelectionModel2.onSelectedRangesChanged, (_e, args) => {
      const targetRange = document.querySelector('#selectionRange2') as HTMLSpanElement;
      if (targetRange) {
        targetRange.textContent = '';
        for (const slickRange of args) {
          targetRange.textContent += JSON.stringify(slickRange);
        }
      }
    });
  }

  function toggleMultiSelection(event: Event) {
    const enabled = (event.target as HTMLInputElement).checked;
    enableMultiSelection = enabled;

    const selectionOptions1 = { ...gridOptions1?.selectionOptions, enableMultiSelection: enabled };
    const selectionOptions2 = { ...gridOptions2?.selectionOptions, enableMultiSelection: enabled };
    gridOptions1 = { ...gridOptions1, selectionOptions: selectionOptions1 } as GridOption;
    gridOptions2 = { ...gridOptions2, selectionOptions: selectionOptions2 } as GridOption;

    svelteGrid1?.slickGrid?.setOptions({ selectionOptions: selectionOptions1 }, true);
    svelteGrid2?.slickGrid?.setOptions({ selectionOptions: selectionOptions2 }, true);
    const selectionModel1 = svelteGrid1?.slickGrid?.getSelectionModel();
    const selectionModel2 = svelteGrid2?.slickGrid?.getSelectionModel();
    if (selectionModel1) {
      selectionModel1.setOptions({ enableMultiSelection: enabled });
    }
    if (selectionModel2) {
      selectionModel2.setOptions({ enableMultiSelection: enabled });
    }
  }

  function mockData(itemCount: number) {
    const data: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomFinishYear = randomYear + Math.floor(Math.random() * 10);
      const randomFinish = new Date(randomFinishYear, randomMonth + 1, randomDay);

      data[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.floor(Math.random() * 25) + ' days',
        percentComplete: Math.floor(Math.random() * 100),
        start: new Date(randomYear, randomMonth, randomDay, randomDay),
        finish: randomFinish,
        priority: i % 3 ? 2 : i % 5 ? 3 : 1,
        effortDriven: i % 4 === 0,
      };
    }
    return data;
  }

  onDestroy(() => _eventHandler.unsubscribeAll());
</script>

<svelte:head><title>Example 48 - Hybrid Selection Model</title></svelte:head>

<h2>
  Example 48: Hybrid Selection Model
  <span class="float-end font18">
    see&nbsp;
    <a target="_blank" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example48.svelte">
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={() => (hideSubTitle = !hideSubTitle)}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

{#if !hideSubTitle}
  <div class="subtitle">
    <code>SlickHybridSelectionModel</code> This Selection Model is an hybrid approach that uses a combination of the row or cell selections
    depending on certain conditions.
    <ul>
      <li>
        1. clicking on the first column (<code>id</code>) will use <code>RowSelectionModel</code> because of our configuration of
        <code>rowSelectColumnIds: ['id']</code> as the columns that will trigger row selection.
      </li>
      <li>2. clicking on the any other columns will use <code>CellSelectionModel</code> by default</li>
    </ul>
  </div>
{/if}

<h3>
  Grid 1
  <small class="subtitle ms-3 text-italic">
    <span>Range Selection</span>
    <span id="selectionRange1"></span>
  </small>
</h3>

<div class="grid-container1">
  <SlickgridSvelte gridId="grid48-1" columns={columns1} options={gridOptions1} dataset={dataset1} onSvelteGridCreated={grid1Ready} />
</div>

<label class="checkbox-inline control-label my-3">
  <input type="checkbox" data-test="enable-multi-selection" checked={enableMultiSelection} onchange={toggleMultiSelection} />
  <b>Enable multi-selection</b> (Ctrl/Cmd-click or drag)
</label>

<h3>
  Grid 2
  <small class="subtitle ms-3 text-italic">
    <span>Range Selection</span>
    <span id="selectionRange2"></span>
  </small>
</h3>

<SlickgridSvelte gridId="grid48-2" columns={columns2} options={gridOptions2} dataset={dataset2} onSvelteGridCreated={grid2Ready} />
