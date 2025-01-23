<script setup lang="ts">
import { type Column, type Formatter, type GridOption, type ItemMetadata, SlickgridVue, type SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
let vueGrid!: SlickgridVueInstance;
const dataLn = ref<number | string>('loading...');
const scrollToRow = ref(100);
const dataset = ref<any[]>([]);
const showSubTitle = ref(true);
const metadata: Record<number, ItemMetadata> = {
  0: {
    columns: {
      1: { rowspan: 3 },
    },
  },
  2: {
    columns: {
      0: { rowspan: 3 },
      3: { colspan: 3 },
    },
  },
  3: {
    columns: {
      1: { rowspan: 5, colspan: 1, cssClass: 'cell-var-span' },
      // 1: { rowspan: 3, colspan: 2, cssClass: "cell-var-span" },
      3: { rowspan: 3, colspan: 5 },
    },
  },
  8: {
    columns: {
      1: { rowspan: 80 },
      3: { rowspan: 1999, colspan: 2, cssClass: 'cell-very-high' },
    },
  },
  12: {
    columns: {
      11: { rowspan: 3 },
    },
  },
  15: {
    columns: {
      18: { colspan: 4, rowspan: 3 },
    },
  },
  85: {
    columns: {
      5: { rowspan: 20 },
    },
  },
};
const rowCellValueFormatter: Formatter = (row, cell, value) => {
  return `<div class="cellValue">${value.toFixed(2)}</div><div class="valueComment">${row}.${cell}</div>`;
};

onBeforeMount(() => {
  defineGrid();
  // mock some data (different in each dataset)
  loadData(500);
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    { id: 'title', name: 'Title', field: 'title', minWidth: 80 },
    { id: 'revenueGrowth', name: 'Revenue Growth', field: 'revenueGrowth', formatter: rowCellValueFormatter, minWidth: 120 },
    {
      id: 'pricingPolicy',
      name: 'Pricing Policy',
      field: 'pricingPolicy',
      minWidth: 110,
      sortable: true,
      formatter: rowCellValueFormatter,
    },
    { id: 'policyIndex', name: 'Policy Index', field: 'policyIndex', minWidth: 100, formatter: rowCellValueFormatter },
    { id: 'expenseControl', name: 'Expense Control', field: 'expenseControl', minWidth: 110, formatter: rowCellValueFormatter },
    { id: 'excessCash', name: 'Excess Cash', field: 'excessCash', minWidth: 100, formatter: rowCellValueFormatter },
    { id: 'netTradeCycle', name: 'Net Trade Cycle', field: 'netTradeCycle', minWidth: 110, formatter: rowCellValueFormatter },
    { id: 'costCapital', name: 'Cost of Capital', field: 'costCapital', minWidth: 100, formatter: rowCellValueFormatter },
    { id: 'revenueGrowth2', name: 'Revenue Growth', field: 'revenueGrowth2', formatter: rowCellValueFormatter, minWidth: 120 },
    {
      id: 'pricingPolicy2',
      name: 'Pricing Policy',
      field: 'pricingPolicy2',
      minWidth: 110,
      sortable: true,
      formatter: rowCellValueFormatter,
    },
    { id: 'policyIndex2', name: 'Policy Index', field: 'policyIndex2', minWidth: 100, formatter: rowCellValueFormatter },
    { id: 'expenseControl2', name: 'Expense Control', field: 'expenseControl2', minWidth: 110, formatter: rowCellValueFormatter },
    { id: 'excessCash2', name: 'Excess Cash', field: 'excessCash2', minWidth: 100, formatter: rowCellValueFormatter },
    { id: 'netTradeCycle2', name: 'Net Trade Cycle', field: 'netTradeCycle2', minWidth: 110, formatter: rowCellValueFormatter },
    { id: 'costCapital2', name: 'Cost of Capital', field: 'costCapital2', minWidth: 100, formatter: rowCellValueFormatter },
    { id: 'revenueGrowth3', name: 'Revenue Growth', field: 'revenueGrowth3', formatter: rowCellValueFormatter, minWidth: 120 },
    {
      id: 'pricingPolicy3',
      name: 'Pricing Policy',
      field: 'pricingPolicy3',
      minWidth: 110,
      sortable: true,
      formatter: rowCellValueFormatter,
    },
    { id: 'policyIndex3', name: 'Policy Index', field: 'policyIndex3', minWidth: 100, formatter: rowCellValueFormatter },
    { id: 'expenseControl3', name: 'Expense Control', field: 'expenseControl3', minWidth: 110, formatter: rowCellValueFormatter },
    { id: 'excessCash3', name: 'Excess Cash', field: 'excessCash3', minWidth: 100, formatter: rowCellValueFormatter },
    { id: 'netTradeCycle3', name: 'Net Trade Cycle', field: 'netTradeCycle3', minWidth: 110, formatter: rowCellValueFormatter },
    { id: 'costCapital3', name: 'Cost of Capital', field: 'costCapital3', minWidth: 100, formatter: rowCellValueFormatter },
  ];

  gridOptions.value = {
    enableCellNavigation: true,
    enableColumnReorder: true,
    enableCellRowSpan: true,
    gridHeight: 600,
    gridWidth: 900,
    rowHeight: 30,
    dataView: {
      globalItemMetadataProvider: {
        getRowMetadata: (item: any, row: number) => renderDifferentColspan(item, row),
      },
    },
    rowTopOffsetRenderType: 'top', // rowspan doesn't render well with 'transform', default is 'top'
  };
}

function clearScrollTo() {
  scrollToRow.value = 0;
  document.querySelector<HTMLInputElement>('#nRow')?.focus();
}

function loadData(count: number) {
  dataLn.value = 'loading...';

  // add a delay just to show the "loading" text before it loads all data
  setTimeout(() => {
    // mock data
    const tmpArray: any[] = [];
    for (let i = 0; i < count; i++) {
      tmpArray[i] = {
        id: i,
        title: 'Task ' + i,
        revenueGrowth: Math.random() * Math.pow(10, Math.random() * 3),
        pricingPolicy: Math.random() * Math.pow(10, Math.random() * 3),
        policyIndex: Math.random() * Math.pow(10, Math.random() * 3),
        expenseControl: Math.random() * Math.pow(10, Math.random() * 3),
        excessCash: Math.random() * Math.pow(10, Math.random() * 3),
        netTradeCycle: Math.random() * Math.pow(10, Math.random() * 3),
        costCapital: Math.random() * Math.pow(10, Math.random() * 3),
        revenueGrowth2: Math.random() * Math.pow(10, Math.random() * 3),
        pricingPolicy2: Math.random() * Math.pow(10, Math.random() * 3),
        policyIndex2: Math.random() * Math.pow(10, Math.random() * 3),
        expenseControl2: Math.random() * Math.pow(10, Math.random() * 3),
        excessCash2: Math.random() * Math.pow(10, Math.random() * 3),
        netTradeCycle2: Math.random() * Math.pow(10, Math.random() * 3),
        costCapital2: Math.random() * Math.pow(10, Math.random() * 3),
        revenueGrowth3: Math.random() * Math.pow(10, Math.random() * 3),
        pricingPolicy3: Math.random() * Math.pow(10, Math.random() * 3),
        policyIndex3: Math.random() * Math.pow(10, Math.random() * 3),
        expenseControl3: Math.random() * Math.pow(10, Math.random() * 3),
        excessCash3: Math.random() * Math.pow(10, Math.random() * 3),
        netTradeCycle3: Math.random() * Math.pow(10, Math.random() * 3),
        costCapital3: Math.random() * Math.pow(10, Math.random() * 3),
      };
    }

    // let's keep column 3-4 as the row spanning from row 8 until the end of the grid
    metadata[8].columns![3].rowspan = tmpArray.length - 8;

    dataset.value = tmpArray;
    dataLn.value = count;
  }, 20);
}

/**
 * A callback to render different row column span
 * Your callback will always have the "item" argument which you can use to decide on the colspan
 * Your return object must always be in the form of:: { columns: { [columnName]: { colspan: number|'*' } }}
 */
function renderDifferentColspan(_item: any, row: any): any {
  return (metadata[row] as ItemMetadata)?.attributes
    ? metadata[row]
    : (metadata[row] = { attributes: { 'data-row': row }, ...metadata[row] });
}

function handleToggleSpans() {
  const cell = metadata[3].columns![1];
  if (cell.colspan === 1) {
    cell.rowspan = 3;
    cell.colspan = 2;
  } else {
    cell.rowspan = 5;
    cell.colspan = 1;
  }

  // row index 3 can have a rowspan of up to 5 rows, so we need to invalidate from row 3 + 5 (-1 because of zero index)
  // so: 3 + 5 - 1 => row indexes 3 to 7
  vueGrid.slickGrid?.invalidateRows([3, 4, 5, 6, 7]);
  vueGrid.slickGrid?.render();
}

function handleScrollTo() {
  // const args = event.detail && event.detail.args;
  vueGrid.slickGrid?.scrollRowToTop(scrollToRow.value);
  return false;
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>

<template>
  <h2>
    Example 44: colspan/rowspan with large dataset
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example44.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    <p class="italic example-details">
      This page demonstrates <code>colspan</code> & <code>rowspan</code> using DataView with item metadata. <b>Note</b>:
      <code>colspan</code> & <code>rowspan</code> are rendered via row/cell indexes, any operations that could change these indexes (i.e.
      Filtering/Sorting/Paging/Column Reorder) will require you to implement proper logic to recalculate these indexes (it becomes your
      responsability). This demo does not show this because it is up to you to decide what to do when the span changes shape (i.e. you
      default to 3 rowspan but you filter a row in the middle, how do you want to proceed?).
    </p>
  </div>

  <section class="row mb-2">
    <div class="d-flex">
      <button class="ms-1 btn btn-outline-secondary btn-sm" data-test="add-500-rows-btn" @click="loadData(500)">500 rows</button>
      <button class="ms-1 btn btn-outline-secondary btn-sm" data-test="add-5k-rows-btn" @click="loadData(5000)">5k rows</button>
      <button class="ms-1 btn btn-outline-secondary btn-sm" data-test="add-50k-rows-btn" @click="loadData(50000)">50k rows</button>
      <button class="mx-1 btn btn-outline-secondary btn-sm" data-test="add-50k-rows-btn" @click="loadData(500000)">500k rows</button>
      <div class="mx-2">
        <label>data length: </label><span id="dataLn">{{ dataLn }}</span>
      </div>
      <button
        id="toggleSpans"
        class="ms-1 btn btn-outline-secondary btn-sm btn-icon mx-1"
        @click="handleToggleSpans()"
        data-test="toggleSpans"
      >
        <span class="mdi mdi-flip-vertical"></span>
        <span>Toggle blue cell colspan &amp; rowspan</span>
      </button>
      <button id="scrollTo" class="ms-1 btn btn-outline-secondary btn-sm btn-icon" @click="handleScrollTo()" data-test="scrollToBtn">
        <span class="mdi mdi-arrow-down"></span>
        <span>Scroll To Row</span>
      </button>
      <div class="input-group input-group-sm ms-1" style="width: 100px">
        <input
          v-model="scrollToRow"
          id="nRow"
          type="text"
          data-test="nbrows"
          class="form-control search-string"
          placeholder="search value"
          autocomplete="off"
        />
        <button class="btn btn-sm btn-outline-secondary d-flex align-items-center" data-test="clearScrollTo" @click="clearScrollTo()">
          <span class="icon mdi mdi-close-thick"></span>
        </button>
      </div>
    </div>
  </section>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    grid-id="grid44"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>

<style lang="scss">
#grid44 {
  --slick-cell-active-box-shadow: inset 0 0 0 1px #e35ddc;

  .slick-row.even .slick-cell.cell-very-high {
    background-color: #f0ffe0;
  }
  .slick-row.odd .slick-cell.cell-var-span {
    background-color: #87ceeb;
  }
  .slick-row .slick-cell.rowspan {
    background-color: #95b7a2;
    z-index: 10;
  }
  .slick-row[data-row='3'] .slick-cell.l3.rowspan {
    background-color: #95b7a2;
  }
  .slick-row[data-row='2'] .slick-cell.l3.r5 {
    background-color: #ddfffc;
  }
  .slick-row[data-row='0'] .slick-cell.rowspan,
  .slick-row[data-row='8'] .slick-cell.rowspan {
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAQ0lEQVQYV2N8/fr1fwY84M6dOwyM+BSBFKioqOBWBFMAsgSrScgKsCpCV4ChCJsCFEW4FMAV4VMAVnT8+PH/IG/iAwDA1DlezHn8bwAAAABJRU5ErkJggg==);
  }
  .slick-row[data-row='8'] .slick-cell.rowspan:nth-child(4) {
    background: #f0ffe0;
  }
  .slick-row[data-row='12'] .slick-cell.rowspan {
    background: #bd8b8b;
  }
  .slick-row[data-row='15'] .slick-cell.rowspan {
    background: #edc12e;
  }
  .slick-row[data-row='85'] .slick-cell.rowspan {
    background: #8baebd;
  }
  .slick-cell.active {
    /* use a different active cell color to make it a bit more obvious */
    box-shadow: inset 0 0 0 1px #e35ddc;
  }
  .cellValue {
    float: right;
    font-size: 14px;
  }
  .valueComment {
    color: #7c8983;
    font-size: 12px;
    font-style: italic;
    width: fit-content;
  }
}
</style>
