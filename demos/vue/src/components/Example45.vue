<script setup lang="ts">
import { faker } from '@faker-js/faker';
import { VueSlickRowDetailView } from '@slickgrid-universal/vue-row-detail-plugin';
import { ExtensionName, SlickgridVue, type Column, type GridOption, type SlickgridVueInstance } from 'slickgrid-vue';
import { computed, onBeforeMount, onUnmounted, ref, type Ref } from 'vue';
import Example45Detail, { type Distributor, type OrderData } from './Example45Detail.vue';
import Example45Preload from './Example45Preload.vue';

const FAKE_SERVER_DELAY = 250;
const NB_ITEMS = 995;
const gridOptions = ref<GridOption>();
const detailViewRowCount = ref(9);
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<Distributor[]>([]);
const isDarkMode = ref(false);
const isUsingAutoHeight = ref(false);
const isUsingInnerGridStatePresets = ref(false);
const showSubTitle = ref(true);
const serverWaitDelay = ref(FAKE_SERVER_DELAY); // server simulation with default of 250ms but 50ms for Cypress tests
let vueGrid!: SlickgridVueInstance;

const rowDetailInstance = computed(
  () => vueGrid?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView) as VueSlickRowDetailView
);

onBeforeMount(() => {
  defineGrid();

  // mock some data (different in each dataset)
  dataset.value = getData(NB_ITEMS);
});

onUnmounted(() => {
  document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
  document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
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

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      autoHeight: isUsingAutoHeight.value, // works with/without autoHeight
      bottomPadding: 20,
    },
    enableFiltering: true,
    enableRowDetailView: true,
    rowTopOffsetRenderType: 'top', // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
    rowHeight: 33,
    externalResources: [VueSlickRowDetailView],
    rowDetailView: {
      process: (item: any) => simulateServerAsyncCall(item),
      loadOnce: false, // you can't use loadOnce with inner grid because only HTML template are re-rendered, not JS events
      useRowClick: false,
      // how many grid rows do we want to use for the row detail panel
      panelRows: detailViewRowCount.value,
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
  const options = rowDetailInstance.value.getOptions();
  if (options?.panelRows) {
    options.panelRows = detailViewRowCount.value; // change number of rows dynamically
    rowDetailInstance.value.setOptions(options);
  }
}

function changeUsingResizerAutoHeight() {
  isUsingAutoHeight.value = !isUsingAutoHeight.value;
  vueGrid.slickGrid?.setOptions({ autoResize: { ...gridOptions.value!.autoResize, autoHeight: isUsingAutoHeight.value } });
  vueGrid.resizerService.resizeGrid();
  return true;
}

function changeUsingInnerGridStatePresets() {
  isUsingInnerGridStatePresets.value = !isUsingInnerGridStatePresets.value;
  closeAllRowDetail();
  return true;
}

function closeAllRowDetail() {
  rowDetailInstance.value.collapseAll();
}

function redrawAllRowDetail() {
  rowDetailInstance.value.redrawAllViewComponents();
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
      itemDetail.isUsingInnerGridStatePresets = isUsingInnerGridStatePresets.value;

      // resolve the data after delay specified
      resolve(itemDetail);
    }, serverWaitDelay.value);
  });
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  toggleBodyBackground();
  vueGrid.slickGrid?.setOptions({ darkMode: isDarkMode.value });
  closeAllRowDetail();
}

function toggleBodyBackground() {
  if (isDarkMode.value) {
    document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
  } else {
    document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
  }
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  queueMicrotask(() => vueGrid.resizerService.resizeGrid());
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>

<template>
  <div ref="compRef">
    <h2>
      Example 45: Row Detail with inner Grid
      <span class="float-end">
        <a
          style="font-size: 18px"
          target="_blank"
          href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example45.vue"
        >
          <span class="mdi mdi-link-variant"></span> code
        </a>
      </span>
      <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
        <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
      </button>
      <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" @click="toggleDarkMode()" data-test="toggle-dark-mode">
        <span class="mdi mdi-theme-light-dark"></span>
        <span>Toggle Dark Mode</span>
      </button>
    </h2>

    <div class="subtitle" v-show="showSubTitle">
      Add functionality to show extra information with a Row Detail View, (<a
        href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/row-detail"
        target="_blank"
        >Wiki docs</a
      >), we'll use an inner grid inside our Row Detail Component. Note that because SlickGrid uses Virtual Scroll, the rows and row details
      are often be re-rendered (when row is out of viewport range) and this means unmounting Row Detail Component which indirectly mean that
      all component states (dynamic elements, forms, ...) will be disposed as well, however you can use Grid State/Presets to reapply
      previous state whenever the row detail gets re-rendered when back to viewport.
    </div>

    <div class="row">
      <div class="col-sm-10">
        <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="collapse-all-btn" @click="closeAllRowDetail()">
          Close all Row Details
        </button>

        <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="redraw-all-btn" @click="redrawAllRowDetail()">
          Force redraw all Row Details
        </button>

        <span class="d-inline-flex gap-4px">
          <label for="detailViewRowCount">Detail View Rows Shown: </label>
          <input
            id="detailViewRowCount"
            data-test="detail-view-row-count"
            v-model="detailViewRowCount"
            type="number"
            style="height: 26px; width: 40px"
          />
          <button
            class="btn btn-outline-secondary btn-xs btn-icon"
            style="height: 26px"
            data-test="set-count-btn"
            @click="changeDetailViewRowCount()"
          >
            Set
          </button>
          <label for="serverdelay" class="ms-2">Server Delay: </label>
          <input
            id="serverdelay"
            v-model="serverWaitDelay"
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
              :checked="isUsingInnerGridStatePresets"
              @click="changeUsingInnerGridStatePresets()"
            />
            <span
              title="should we use Grid State/Presets to keep the inner grid state whenever Row Details are out and back to viewport and re-rendered"
            >
              Use Inner Grid State/Presets
            </span>
          </label>

          <label class="checkbox-inline control-label ms-2" for="useResizeAutoHeight">
            <input
              type="checkbox"
              id="useResizeAutoHeight"
              data-test="use-auto-height"
              :checked="isUsingAutoHeight"
              @click="changeUsingResizerAutoHeight()"
            />
            Use <code>autoResize.autoHeight</code>
          </label>
        </span>
      </div>
    </div>

    <hr />

    <slickgrid-vue
      v-model:options="gridOptions"
      v-model:columns="columnDefinitions"
      v-model:data="dataset"
      grid-id="grid45"
      @onVueGridCreated="vueGridReady($event.detail)"
    >
    </slickgrid-vue>
  </div>
</template>
