<script lang="ts">
  import {
    Formatters,
    SlickgridSvelte,
    type Column,
    type Formatter,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  const NB_ITEMS = 500;

  interface DataItem {
    id: number;
    title: string;
    duration: string;
    percentComplete: number;
    percentComplete2: number;
    start: Date;
    finish: Date;
    effortDriven: boolean;
    phone: string;
    completed: number;
  }

  let svelteGrid: SlickgridSvelteInstance;
  let resizerPaused = $state(false);
  let showSubTitle = $state(true);

  // create my custom Formatter with the Formatter type
  const myCustomCheckmarkFormatter: Formatter<DataItem> = (_row, _cell, value) => {
    // you can return a string of a object (of type FormatterResultObject), the 2 types are shown below
    return value
      ? `<i class="mdi mdi-fire red" aria-hidden="true"></i>`
      : { text: '<i class="mdi mdi-snowflake" aria-hidden="true"></i>', addClasses: 'lightblue', toolTip: 'Freezing' };
  };

  const customEnableButtonFormatter: Formatter<DataItem> = (_row: number, _cell: number, value: any) => {
    return `<span style="margin-left: 5px">
      <button class="btn btn-xs btn-default btn-icon">
        <i class="mdi ${value ? 'mdi-check-circle' : 'mdi-circle'}" style="color: ${value ? 'black' : 'lavender'}"></i>
      </button>
    </span>`;
  };

  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, width: 70 },
    {
      id: 'phone',
      name: 'Phone Number using mask',
      field: 'phone',
      sortable: true,
      type: 'number',
      minWidth: 100,
      formatter: Formatters.mask,
      params: { mask: '(000) 000-0000' },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      formatter: Formatters.decimal,
      params: { minDecimal: 1, maxDecimal: 2 },
      sortable: true,
      type: 'number',
      minWidth: 90,
      exportWithFormatter: true,
    },
    {
      id: 'complete',
      name: '% Complete',
      field: 'percentComplete',
      formatter: Formatters.percentCompleteBar,
      type: 'number',
      sortable: true,
      minWidth: 100,
    },
    {
      id: 'percent2',
      name: '% Complete',
      field: 'percentComplete2',
      formatter: Formatters.progressBar,
      type: 'number',
      sortable: true,
      minWidth: 100,
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
    },
    {
      id: 'effort-driven',
      name: 'Effort Driven',
      field: 'effortDriven',
      formatter: myCustomCheckmarkFormatter,
      type: 'number',
      sortable: true,
      minWidth: 100,
    },
    {
      id: 'completed',
      name: 'Completed',
      field: 'completed',
      type: 'number',
      sortable: true,
      minWidth: 100,
      formatter: customEnableButtonFormatter,
      onCellClick: (_e, args) => {
        toggleCompletedProperty(args?.dataContext);
      },
    },
  ];

  const options: GridOption = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableCellNavigation: true,
    showCustomFooter: true, // display some metrics in the bottom custom footer
    customFooterOptions: {
      // optionally display some text on the left footer container
      leftFooterText: 'custom footer text',
      hideTotalItemCount: true,
      hideLastUpdateTimestamp: true,
    },

    // you customize all formatter at once certain options through "formatterOptions" in the Grid Options
    // or independently through the column definition "params", the option names are the same
    /*
    formatterOptions: {
      dateSeparator: '.',
      decimalSeparator: ',',
      displayNegativeNumberWithParentheses: true,
      minDecimal: 0,
      maxDecimal: 2,
      thousandSeparator: '_'
    },
    */

    // when using the ExcelCopyBuffer, you can see what the selection range is
    enableExcelCopyBuffer: true,
  };

  const dataset = mockData(NB_ITEMS);

  function disposeGrid() {
    svelteGrid.dispose();
  }

  function generatePhoneNumber() {
    let phone = '';
    for (let i = 0; i < 10; i++) {
      phone += Math.round(Math.random() * 9) + '';
    }
    return phone;
  }

  function mockData(count: number) {
    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        phone: generatePhoneNumber(),
        duration: i % 33 === 0 ? null : Math.random() * 100 + '',
        percentComplete: randomPercent,
        percentComplete2: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }

    return mockDataset;
  }

  function togglePauseResizer() {
    resizerPaused = !resizerPaused;
    svelteGrid.resizerService.pauseResizer(resizerPaused);
  }

  // toggle property
  function toggleCompletedProperty(item: any) {
    if (typeof item === 'object') {
      item.completed = !item.completed;

      // simulate a backend http call and refresh the grid row after delay
      setTimeout(() => {
        svelteGrid.gridService.updateItemById(item.id, item, { highlightRow: false });
      }, 250);
    }
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => svelteGrid.resizerService.resizeGrid());
  }
</script>

<h2>
  Example 2: Grid with Formatters
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example02.svelte"
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

<div class="subtitle" class:hidden={!showSubTitle}>
  Grid with Custom and/or included Slickgrid Formatters (<a
    href="https://ghiscoding.gitbook.io/svelte-slickgrid/column-functionalities/formatters"
    target="_blank"
  >
    Wiki docs
  </a>).
  <ul>
    <li>The 2 last columns are using Custom Formatters</li>
    <ul>
      <li>The "Completed" column uses a the "onCellClick" event and a formatter to simulate a toggle action</li>
    </ul>
    <li>
      Support Excel Copy Buffer (SlickGrid Copy Manager Plugin), you can use it by simply enabling "enableExcelCopyBuffer" flag. Note that
      it will only evaluate Formatter when the "exportWithFormatter" flag is enabled (through "ExcelExportOptions" or "TextExportOptions" or
      the column definition)
    </li>
    <li>This example also has auto-resize enabled, and we also demo how you can pause the resizer if you wish to</li>
  </ul>
</div>

<button class="btn btn-outline-secondary btn-sm btn-icon mx-2" onclick={togglePauseResizer}>
  Pause auto-resize: <b>{resizerPaused}</b>
</button>
<button class="btn btn-outline-secondary btn-sm btn-icon" onclick={disposeGrid}>Dispose Grid</button>

<SlickgridSvelte gridId="grid2" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (svelteGrid = instance)} />
