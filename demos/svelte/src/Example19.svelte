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
  import { onDestroy, tick } from 'svelte';
  import Example19Detail from './Example19Detail.svelte';
  import ExampleDetailPreload from './ExampleDetailPreload.svelte';

  const FAKE_SERVER_DELAY = 250;
  const NB_ITEMS = 1000;
  let detailViewRowCount = $state(9);
  let showSubTitle = $state(true);
  let flashAlertType = $state('info');
  let message = $state('');
  let serverWaitDelay = $state(FAKE_SERVER_DELAY); // server simulation with default of 250ms but 50ms for Cypress tests
  let isDarkMode = false;
  let grid: SlickgridSvelteInstance;

  onDestroy(() => {
    // make sure it's back to light mode before unmounting
    document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')?.setAttribute('data-bs-theme', 'light');
  });

  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      sortable: true,
      width: 70,
      filterable: true,
      editor: { model: Editors.text },
    },
    {
      id: 'duration',
      name: 'Duration (days)',
      field: 'duration',
      sortable: true,
      type: 'number',
      minWidth: 90,
      filterable: true,
    },
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

  const dataset = getData(NB_ITEMS);
  const options = defineGridOptions();

  function defineGridOptions(): GridOption {
    return {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableRowDetailView: true,
      darkMode: isDarkMode,
      datasetIdPropertyName: 'rowId', // optionally use a different "id"
      externalResources: [SvelteRowDetailView],
      rowDetailView: {
        // optionally change the column index position of the icon (defaults to 0)
        // columnIndexPosition: 1,

        // We can load the "process" asynchronously in 2 different ways (Fetch OR Promise)
        process: (item: any) => simulateServerAsyncCall(item),
        // process: (item) => this.http.get(`api/item/${item.id}`),

        // load only once and reuse the same item detail without calling process method
        loadOnce: true,

        // limit expanded row to only 1 at a time
        singleRowExpand: false,

        // false by default, clicking anywhere on the row will open the detail view
        // when set to false, only the "+" icon would open the row detail
        // if you use editor or cell navigation you would want this flag set to false (default)
        useRowClick: true,

        // how many grid rows do we want to use for the row detail panel (this is only set once and will be used for all row detail)
        // also note that the detail view adds an extra 1 row for padding purposes
        // so if you choose 4 panelRows, the display will in fact use 5 rows
        panelRows: detailViewRowCount,

        // you can override the logic for showing (or not) the expand icon
        // for example, display the expand icon only on every 2nd row
        // expandableOverride: (row: number, dataContext: any) => (dataContext.rowId % 2 === 1),

        // optionally expose the functions that you want to use from within the row detail Child Component
        parentRef: { showFlashMessage },

        // Preload View Template
        preloadComponent: ExampleDetailPreload,

        // ViewModel Template to load when row detail data is ready
        viewComponent: Example19Detail as any,

        onBeforeRowDetailToggle: (_e, args) => {
          // you coud cancel opening certain rows
          // if (args.item.rowId === 1) {
          //   e.preventDefault();
          //   return false;
          // }
          console.log('before toggling row detail', args.item);
          return true;
        },
      },
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: true,
      },

      // You could also enable Row Selection as well, but just make sure to disable `useRowClick: false`
      // enableCheckboxSelector: true,
      // enableSelection: true,
      // checkboxSelector: {
      //   hideInFilterHeaderRow: false,
      //   hideSelectAllCheckbox: true,
      // },
    };
  }

  function getRowDetailInstance(): any {
    return grid?.extensionService.getExtensionInstanceByName('rowDetailView');
  }

  function getData(count: number) {
    // mock a dataset
    const tmpData: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      tmpData[i] = {
        rowId: i,
        title: 'Task ' + i,
        duration: i % 33 === 0 ? null : Math.floor(Math.random() * 100) + 1,
        percentComplete: randomPercent,
        percentComplete2: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }

    return tmpData;
  }

  function changeDetailViewRowCount() {
    const rowDetailInstance = getRowDetailInstance();
    const rowDetailOptions = rowDetailInstance.getOptions();
    if (rowDetailOptions && rowDetailOptions.panelRows) {
      rowDetailOptions.panelRows = detailViewRowCount; // change number of rows dynamically
      rowDetailInstance.setOptions(rowDetailOptions);
    }
  }

  function changeEditableGrid() {
    const rowDetailInstance = getRowDetailInstance();
    rowDetailInstance.collapseAll();
    rowDetailInstance.addonOptions.useRowClick = false;
    grid.slickGrid.setOptions({
      editable: true,
      autoEdit: true,
      enableCellNavigation: true,
      autoCommitEdit: !grid.slickGrid.getOptions().autoCommitEdit,
    });
  }

  function closeAllRowDetail() {
    getRowDetailInstance().collapseAll();
  }

  function showFlashMessage(msg: string, alertType = 'info') {
    message = msg;
    flashAlertType = alertType;
  }

  /** Just for demo purposes, we will simulate an async server call and return more details on the selected row item */
  function simulateServerAsyncCall(item: any) {
    // random set of names to use for more item detail
    const randomNames = [
      'John Doe',
      'Jane Doe',
      'Chuck Norris',
      'Bumblebee',
      'Jackie Chan',
      'Elvis Presley',
      'Bob Marley',
      'Mohammed Ali',
      'Bruce Lee',
      'Rocky Balboa',
    ];

    // fill the template on async delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const itemDetail = item;

        // let's add some extra properties to our item for a better async simulation
        itemDetail.assignee = randomNames[randomNumber(0, 9)] || '';
        itemDetail.reporter = randomNames[randomNumber(0, 9)] || '';

        // resolve the data after delay specified
        resolve(itemDetail);
      }, serverWaitDelay);
    });
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    toggleBodyBackground();
    grid.slickGrid?.setOptions({ darkMode: isDarkMode });
    closeAllRowDetail();
  }

  function toggleBodyBackground() {
    document.querySelector('.panel-wm-content')?.classList.toggle('dark-mode', isDarkMode);
    document.querySelector<HTMLDivElement>('#demo-container')?.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
  }

  function randomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  async function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    await tick();
    grid?.resizerService.resizeGrid();
  }
</script>

<h2>
  Example 19: Row Detail View
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example19.svelte"
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
  <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="toggle-dark-mode" onclick={toggleDarkMode}>
    <span class="mdi mdi-theme-light-dark"></span>
    <span>Toggle Dark Mode</span>
  </button>
</h2>

<div class="subtitle" class:hidden={!showSubTitle}>
  Add functionality to show extra information with a Row Detail View, (<a
    href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/row-detail"
    target="_blank"
  >
    Wiki docs
  </a>)
  <ul>
    <li>Click on the row "+" icon or anywhere on the row to open it (the latter can be changed via property "useRowClick: false")</li>
    <li>Pass a View/Model as a Template to the Row Detail</li>
    <li>
      You can use "expandableOverride()" callback to override logic to display expand icon on every row (for example only show it every 2nd
      row)
    </li>
  </ul>
</div>

<div class="row">
  <div class="col-sm-6">
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="editable-grid-btn" onclick={changeEditableGrid}>
      Make Grid Editable
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="collapse-all-btn" onclick={closeAllRowDetail}>
      Close all Row Details
    </button>
    &nbsp;&nbsp;

    <span class="d-inline-flex gap-4px">
      <label for="detailViewRowCount">Detail View Rows Shown: </label>
      <input id="detailViewRowCount" type="number" style="height: 26px; width: 40px" bind:value={detailViewRowCount} />
      <button
        class="btn btn-outline-secondary btn-xs btn-icon"
        style="height: 26px"
        data-test="set-count-btn"
        onclick={changeDetailViewRowCount}
      >
        Set
      </button>
      <label for="serverdelay" class="ms-2">Server Delay: </label>
      <input
        id="serverdelay"
        type="number"
        data-test="server-delay"
        style="height: 26px; width: 55px"
        title="input a fake timer delay to simulate slow server response"
        bind:value={serverWaitDelay}
      />
    </span>
  </div>
  {#if message}
    <div class="alert alert-{flashAlertType} col-sm-6" data-test="flash-msg">{message}</div>
  {/if}
</div>

<hr />

<SlickgridSvelte gridId="grid19" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />
