<script lang="ts">
  import { faker } from '@faker-js/faker';
  import { SvelteRowDetailView } from '@slickgrid-universal/svelte-row-detail-plugin';
  import { SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { onDestroy } from 'svelte';
  import type { Distributor, OrderData } from './data/example45.model.js';
  import Example45Detail from './Example45Detail.svelte';
  import Example45Preload from './Example45Preload.svelte';

  const FAKE_SERVER_DELAY = 250;
  const NB_ITEMS = 995;
  let detailViewRowCount = $state(9);
  let isDarkMode = false;
  let isUsingAutoHeight = $state(false);
  let isUsingInnerGridStatePresets = $state(false);
  let isKeepingComponentAlive = $state(false);
  let showSubTitle = $state(true);
  let serverWaitDelay = $state(FAKE_SERVER_DELAY); // server simulation with default of 250ms but 50ms for Cypress tests
  let grid: SlickgridSvelteInstance;
  let rowDetailInstance: SvelteRowDetailView;

  const columns = defineColumns();
  let gridOptions = $state.raw<GridOption>(defineGridOptions());
  let dataset = $state.raw<Distributor[]>(getData(NB_ITEMS));

  onDestroy(() => {
    document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
    document.querySelector<HTMLElement>('#demo-container')?.setAttribute('data-bs-theme', 'light');
  });

  function defineColumns(): Column[] {
    return [
      {
        id: 'companyId',
        name: 'ID',
        field: 'companyId',
        cssClass: 'text-end',
        minWidth: 50,
        maxWidth: 50,
        filterable: true,
        sortable: true,
        type: 'number',
      },
      {
        id: 'companyName',
        name: 'Company Name',
        field: 'companyName',
        width: 90,
        filterable: true,
        sortable: true,
      },
      {
        id: 'streetAddress',
        name: 'Street Address',
        field: 'streetAddress',
        minWidth: 120,
        filterable: true,
      },
      {
        id: 'city',
        name: 'City',
        field: 'city',
        minWidth: 120,
        filterable: true,
      },
      {
        id: 'zipCode',
        name: 'Zip Code',
        field: 'zipCode',
        minWidth: 120,
        filterable: true,
      },
      {
        id: 'country',
        name: 'Country',
        field: 'country',
        minWidth: 120,
        filterable: true,
      },
    ];
  }

  function defineGridOptions(): GridOption {
    return {
      autoResize: {
        container: '#demo-container',
        autoHeight: isUsingAutoHeight, // works with/without autoHeight
        bottomPadding: 20,
      },
      autoHeight: false,
      enableFiltering: true,
      enableRowDetailView: true,
      darkMode: isDarkMode,
      rowHeight: 33,
      externalResources: [SvelteRowDetailView],
      rowDetailView: {
        process: (item: any) => simulateServerAsyncCall(item),
        loadOnce: false, // you can't use loadOnce with inner grid because only HTML template are re-rendered, not JS events
        useRowClick: false,
        // how many grid rows do we want to use for the row detail panel
        panelRows: detailViewRowCount,
        // optionally expose the functions that you want to use from within the row detail Child Component
        parentRef: {},
        // Preload View Template
        preloadComponent: Example45Preload,
        // ViewModel Template to load when row detail data is ready
        viewComponent: Example45Detail as any,
      },
    };
  }

  function getData(count: number) {
    // mock a dataset
    const mockDataset: Distributor[] = [];
    for (let i = 0; i < count; i++) {
      mockDataset[i] = {
        id: i,
        companyId: i,
        companyName: faker.company.name(),
        city: faker.location.city(),
        streetAddress: faker.location.streetAddress(),
        zipCode: faker.location.zipCode('######'),
        country: faker.location.country(),
        orderData: [],
        isUsingInnerGridStatePresets: false,
      };
    }

    return mockDataset;
  }

  function changeDetailViewRowCount() {
    const options = rowDetailInstance.getOptions();
    if (options?.panelRows) {
      options.panelRows = detailViewRowCount; // change number of rows dynamically
      rowDetailInstance.setOptions(options);
    }
  }

  function changeUsingResizerAutoHeight() {
    isUsingAutoHeight = !isUsingAutoHeight;
    grid.slickGrid?.setOptions({ autoResize: { ...gridOptions!.autoResize, autoHeight: isUsingAutoHeight } });
    grid.resizerService.resizeGrid();
    return true;
  }

  function changeUsingInnerGridStatePresets() {
    isUsingInnerGridStatePresets = !isUsingInnerGridStatePresets;
    closeAllRowDetail();
    return true;
  }

  function changeKeepingComponentAlive() {
    isKeepingComponentAlive = !isKeepingComponentAlive;
    closeAllRowDetail();
    if (gridOptions?.rowDetailView) {
      gridOptions.rowDetailView.keepComponentAlive = isKeepingComponentAlive;
    }
    const options = rowDetailInstance.getOptions();
    rowDetailInstance.setOptions({ ...options, keepComponentAlive: isKeepingComponentAlive });
    return true;
  }

  function closeAllRowDetail() {
    rowDetailInstance?.collapseAll();
  }

  function redrawAllRowDetail() {
    rowDetailInstance?.redrawAllViewComponents(true);
  }

  /** Just for demo purposes, we will simulate an async server call and return more details on the selected row item */
  function simulateServerAsyncCall(item: Distributor) {
    let orderData: OrderData[] = [];
    // let's mock some data but make it predictable for easier Cypress E2E testing
    if (item.id % 3) {
      orderData = [
        { orderId: '10261', shipCity: 'Rio de Janeiro', freight: 3.05, shipName: 'Que Delícia' },
        { orderId: '10267', shipCity: 'München', freight: 208.58, shipName: 'Frankenversand' },
        { orderId: '10281', shipCity: 'Madrid', freight: 2.94, shipName: 'Romero y tomillo' },
      ];
    } else if (item.id % 4) {
      orderData = [
        { orderId: '10251', shipCity: 'Lyon', freight: 41.34, shipName: 'Victuailles en stock' },
        { orderId: '10253', shipCity: 'Rio de Janeiro', freight: 58.17, shipName: 'Hanari Carnes' },
        { orderId: '10256', shipCity: 'Resende', freight: 13.97, shipName: 'Wellington Importadora' },
      ];
    } else if (item.id % 5) {
      orderData = [
        { orderId: '10265', shipCity: 'Strasbourg', freight: 55.28, shipName: 'Blondel père et fils' },
        { orderId: '10277', shipCity: 'Leipzig', freight: 125.77, shipName: 'Morgenstern Gesundkost' },
        { orderId: '10280', shipCity: 'Luleå', freight: 8.98, shipName: 'Berglunds snabbköp' },
        { orderId: '10295', shipCity: 'Reims', freight: 1.15, shipName: 'Vins et alcools Chevalier' },
      ];
    } else if (item.id % 2) {
      orderData = [
        { orderId: '10258', shipCity: 'Graz', freight: 140.51, shipName: 'Ernst Handel' },
        { orderId: '10270', shipCity: 'Oulu', freight: 136.54, shipName: 'Wartian Herkku' },
      ];
    } else {
      orderData = [{ orderId: '10255', shipCity: 'Genève', freight: 148.33, shipName: 'Richter Supermarkt' }];
    }

    // fill the template on async delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const itemDetail = item;
        itemDetail.orderData = orderData;
        itemDetail.isUsingInnerGridStatePresets = isUsingInnerGridStatePresets;

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
    if (isDarkMode) {
      document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
    } else {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    }
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid.resizerService.resizeGrid(0));
  }

  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
    rowDetailInstance = instance.extensionService.getExtensionInstanceByName('rowDetailView') as SvelteRowDetailView;
  }
</script>

<svelte:head><title>Example 45 - Row Detail with inner Grid</title></svelte:head>

<h2>
  Example 45: Row Detail with inner Grid
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example45.svelte"
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
  <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" onclick={toggleDarkMode} data-test="toggle-dark-mode">
    <span class="mdi mdi-theme-light-dark"></span><span>Toggle Dark Mode</span>
  </button>
</h2>

{#if showSubTitle}
  <div class="subtitle">
    Add functionality to show extra information with a Row Detail View, (<a
      href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/row-detail"
      target="_blank"
    >
      Wiki docs
    </a>), we'll use an inner grid inside our Row Detail Component. Note that because SlickGrid uses Virtual Scroll, the rows and row
    details are often be re-rendered (when row is out of viewport range) and this means unmounting Row Detail Component which indirectly
    mean that all component states (dynamic elements, forms, ...) will be disposed as well, however you can use Grid State/Presets to
    reapply previous state whenever the row detail gets re-rendered when back to viewport.
  </div>
{/if}

<div class="row">
  <div class="col-sm-10">
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="collapse-all-btn" onclick={closeAllRowDetail}>
      Close all Row Details
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="redraw-all-btn" onclick={redrawAllRowDetail}>
      Force redraw all Row Details
    </button>
    <span class="d-inline-flex gap-1 align-items-center">
      <label for="detailViewRowCount">Detail View Rows Shown: </label><input
        id="detailViewRowCount"
        data-test="detail-view-row-count"
        bind:value={detailViewRowCount}
        type="number"
        style="height: 26px; width: 40px"
      />
      <button
        class="btn btn-outline-secondary btn-xs btn-icon"
        style="height: 26px"
        data-test="set-count-btn"
        onclick={changeDetailViewRowCount}
      >
        Set
      </button>
      <label for="serverdelay" class="ms-2">Server Delay: </label><input
        id="serverdelay"
        bind:value={serverWaitDelay}
        type="number"
        data-test="server-delay"
        style="height: 26px; width: 55px"
        title="input a fake timer delay to simulate slow server response"
      />
      <label class="checkbox-inline control-label ms-2" for="useInnerGridStatePresets">
        <input
          type="checkbox"
          id="useInnerGridStatePresets"
          data-test="use-inner-grid-state-presets"
          checked={isUsingInnerGridStatePresets}
          onclick={changeUsingInnerGridStatePresets}
        />
        <span
          title="should we use Grid State/Presets to keep the inner grid state whenever Row Details are out and back to viewport and re-rendered"
        >
          Use Inner Grid State/Presets
        </span>
      </label>
      <label class="checkbox-inline control-label ms-2" for="keepComponentAlive">
        <input
          type="checkbox"
          id="keepComponentAlive"
          data-test="keep-component-alive"
          checked={isKeepingComponentAlive}
          onclick={changeKeepingComponentAlive}
        />
        <span title="preserve component state (incl. nested grid sort/filters) when row scrolls out of viewport instead of destroying it">
          Keep Component Alive on Scroll
        </span>
      </label>
      <label class="checkbox-inline control-label ms-2" for="useResizeAutoHeight">
        <input
          type="checkbox"
          id="useResizeAutoHeight"
          data-test="use-auto-height"
          checked={isUsingAutoHeight}
          onclick={changeUsingResizerAutoHeight}
        />
        Use <code>autoResize.autoHeight</code>
      </label>
    </span>
  </div>
</div>
<hr />
<SlickgridSvelte gridId="grid45" options={gridOptions} {columns} {dataset} onSvelteGridCreated={gridReady} />
