<script setup lang="ts">
import { faker } from '@faker-js/faker';
import sparkline from '@fnando/sparkline';
import {
  Aggregators,
  createDomElement,
  deepCopy,
  Filters,
  Formatters,
  GroupTotalFormatters,
  SlickgridVue,
  type Column,
  type Formatter,
  type GridOption,
  type SlickgridVueInstance,
} from 'slickgrid-vue';
import { onBeforeMount, onMounted, onUnmounted, ref, type Ref } from 'vue';

const NB_ITEMS = 200;
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const isDarkMode = ref(false);
const isFullScreen = ref(false);
const highlightDuration = ref(150);
const minChangePerCycle = ref(0);
const maxChangePerCycle = ref(10);
const refreshRate = ref(75);
let timer: any = 0;
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

const currencyFormatter: Formatter = (_cell, _row, value: string) =>
  `<img src="https://flags.fmcdn.net/data/flags/mini/${value.substring(0, 2).toLowerCase()}.png" width="20"/> ${value}`;

const priceFormatter: Formatter = (_cell, _row, value, _col, dataContext) => {
  const direction = dataContext.priceChange >= 0 ? 'up' : 'down';
  const fragment = new DocumentFragment();
  const divElm = document.createElement('div');
  divElm.className = `d-inline-flex align-items-center text-${direction === 'up' ? 'success' : 'danger'}`;
  const spanElm = document.createElement('span');
  spanElm.className = `mdi mdi-arrow-${direction}`;
  divElm.appendChild(spanElm);
  fragment.appendChild(divElm);
  if (value instanceof HTMLElement) {
    divElm.appendChild(value);
  } else {
    divElm.appendChild(document.createTextNode(value));
  }
  return fragment;
};

const transactionTypeFormatter: Formatter = (_row, _cell, value: string) =>
  `<div class="d-inline-flex align-items-center"><span class="me-1 mdi font-16px mdi-${value === 'Buy' ? 'plus' : 'minus'}-circle ${value === 'Buy' ? 'text-info' : 'text-warning'}"></span> ${value}</div>`;

const historicSparklineFormatter: Formatter = (_row, _cell, _value: string, _col, dataContext) => {
  if (dataContext.historic.length < 2) {
    return '';
  }
  const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgElem.setAttributeNS(null, 'width', '135');
  svgElem.setAttributeNS(null, 'height', '30');
  svgElem.setAttributeNS(null, 'stroke-width', '2');
  svgElem.classList.add('sparkline');
  sparkline(svgElem, dataContext.historic, {
    cursorwidth: 2,
    onmousemove: (event, datapoint) => {
      const svg = (event.target as HTMLElement).closest('svg');
      const tooltip = svg?.nextElementSibling as HTMLElement;
      if (tooltip) {
        tooltip.hidden = false;
        tooltip.textContent = `$${((datapoint.value * 100) / 100).toFixed(2)}`;
        tooltip.style.top = `${event.offsetY}px`;
        tooltip.style.left = `${event.offsetX + 20}px`;
      }
    },
    onmouseout: (event) => {
      const svg = (event.target as HTMLElement).closest('svg');
      const tooltip = svg?.nextElementSibling as HTMLElement;
      if (tooltip) {
        tooltip.hidden = true;
      }
    },
  });
  const div = document.createElement('div');
  div.appendChild(svgElem);
  div.appendChild(createDomElement('div', { className: 'trading-tooltip', hidden: true }));
  return div;
};

onBeforeMount(() => {
  defineGrid();
});

onMounted(() => {
  // populate the dataset once the grid is ready
  getData();
  setTimeout(() => {
    startSimulation();
  }, refreshRate.value);
});

onUnmounted(() => {
  stopSimulation();
  document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
  document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    {
      id: 'currency',
      name: 'Currency',
      field: 'currency',
      filterable: true,
      sortable: true,
      minWidth: 65,
      width: 65,
      formatter: currencyFormatter,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { label: '', value: '' },
          { label: 'CAD', value: 'CAD' },
          { label: 'USD', value: 'USD' },
        ],
      },
      grouping: {
        getter: 'currency',
        formatter: (g) =>
          `Currency: <span style="color: var(--slick-primary-color); font-weight: bold;">${g.value}</span>  <span style="color: #659bff;">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('amount')],
        aggregateCollapsed: true,
        collapsed: false,
      },
    },
    { id: 'symbol', name: 'Symbol', field: 'symbol', filterable: true, sortable: true, minWidth: 65, width: 65 },
    {
      id: 'market',
      name: 'Market',
      field: 'market',
      filterable: true,
      sortable: true,
      minWidth: 75,
      width: 75,
      grouping: {
        getter: 'market',
        formatter: (g) =>
          `Market: <span style="color: var(--slick-primary-color); font-weight: bold;">${g.value}</span>  <span style="color: #659bff;">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('amount')],
        aggregateCollapsed: true,
        collapsed: false,
      },
    },
    { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true, minWidth: 80, width: 130 },
    {
      id: 'trsnType',
      name: 'Type',
      field: 'trsnType',
      filterable: true,
      sortable: true,
      minWidth: 60,
      width: 60,
      formatter: transactionTypeFormatter,
      filter: {
        model: Filters.singleSelect,
        collection: [
          { label: '', value: '' },
          { label: 'Buy', value: 'Buy' },
          { label: 'Sell', value: 'Sell' },
        ],
      },
      grouping: {
        getter: 'trsnType',
        formatter: (g) =>
          `Type: <span style="color: var(--slick-primary-color); font-weight: bold;">${g.value}</span>  <span style="color: #659bff;">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('amount')],
        aggregateCollapsed: true,
        collapsed: false,
      },
    },
    {
      id: 'priceChange',
      name: 'Change',
      field: 'priceChange',
      filterable: true,
      sortable: true,
      minWidth: 80,
      width: 80,
      filter: { model: Filters.compoundInputNumber },
      type: 'number',
      formatter: Formatters.multiple,
      params: {
        formatters: [Formatters.dollar, priceFormatter],
        maxDecimal: 2,
      },
    },
    {
      id: 'price',
      name: 'Price',
      field: 'price',
      filterable: true,
      sortable: true,
      minWidth: 70,
      width: 70,
      filter: { model: Filters.compoundInputNumber },
      type: 'number',
      formatter: Formatters.dollar,
      params: { maxDecimal: 2 },
    },
    {
      id: 'quantity',
      name: 'Quantity',
      field: 'quantity',
      filterable: true,
      sortable: true,
      minWidth: 70,
      width: 70,
      filter: { model: Filters.compoundInputNumber },
      type: 'number',
    },
    {
      id: 'amount',
      name: 'Amount',
      field: 'amount',
      filterable: true,
      sortable: true,
      minWidth: 70,
      width: 60,
      filter: { model: Filters.compoundInputNumber },
      type: 'number',
      formatter: Formatters.dollar,
      params: { maxDecimal: 2 },
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
    },
    {
      id: 'historic',
      name: 'Price History',
      field: 'historic',
      minWidth: 100,
      width: 150,
      maxWidth: 150,
      formatter: historicSparklineFormatter,
    },
    {
      id: 'execution',
      name: 'Execution Timestamp',
      field: 'execution',
      filterable: true,
      sortable: true,
      minWidth: 125,
      formatter: Formatters.dateTimeIsoAmPm,
      exportWithFormatter: true,
      type: 'dateTimeIsoAM_PM',
      filter: { model: Filters.compoundDate },
    },
  ];

  gridOptions.value = {
    autoResize: {
      container: '.trading-platform',
      autoHeight: false,
      rightPadding: 0,
      bottomPadding: 10,
    },
    formatterOptions: {
      displayNegativeNumberWithParentheses: true,
      thousandSeparator: ',',
    },
    draggableGrouping: {
      dropPlaceHolderText: 'Drop a column header here to group by any of these available columns: Currency, Market or Type',
      deleteIconCssClass: 'mdi mdi-close color-danger',
      sortAscIconCssClass: 'mdi mdi-arrow-up',
      sortDescIconCssClass: 'mdi mdi-arrow-down',
    },
    enableDraggableGrouping: true,
    createPreHeaderPanel: true,
    darkMode: isDarkMode.value,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 40,
    enableCellNavigation: true,
    enableFiltering: true,
    cellHighlightCssClass: 'changed',
  };
}

function getData() {
  // mock a dataset
  const tmpData: any[] = [];
  for (let i = 0; i < NB_ITEMS; i++) {
    const randomPercent = Math.round(Math.random() * 100);
    const randomLowQty = randomNumber(1, 50);
    const randomHighQty = randomNumber(125, 255);
    const priceChange = randomNumber(-25, 35, false);
    const price = randomNumber(priceChange, 300);
    const quantity = price < 5 ? randomHighQty : randomLowQty;
    const amount = price * quantity;
    const now = new Date();
    now.setHours(9, 30, 0);
    const currency = Math.floor(Math.random() * 10) % 2 ? 'CAD' : 'USD';
    const company = faker.company.name();

    tmpData[i] = {
      id: i,
      currency,
      trsnType: Math.round(Math.random() * 100) % 2 ? 'Buy' : 'Sell',
      company,
      symbol: currency === 'CAD' ? company.substr(0, 3).toUpperCase() + '.TO' : company.substr(0, 4).toUpperCase(),
      market: currency === 'CAD' ? 'TSX' : price > 200 ? 'Nasdaq' : 'S&P 500',
      duration: i % 33 === 0 ? null : Math.random() * 100 + '',
      percentCompleteNumber: randomPercent,
      priceChange,
      price,
      quantity,
      amount,
      execution: now,
      historic: [price],
    };
  }
  dataset.value = tmpData;
}

function startSimulation() {
  const changes: any = {};
  const numberOfUpdates = randomNumber(minChangePerCycle.value, maxChangePerCycle.value);

  for (let i = 0; i < numberOfUpdates; i++) {
    const randomLowQty = randomNumber(1, 50);
    const randomHighQty = randomNumber(125, 255);
    const rowNumber = Math.round(Math.random() * (dataset.value.length - 1));
    const priceChange = randomNumber(-25, 25, false);
    const prevItem = deepCopy(dataset.value[rowNumber]);
    const itemTmp = { ...dataset.value[rowNumber] };
    itemTmp.priceChange = priceChange;
    itemTmp.price = itemTmp.price + priceChange < 0 ? 0 : itemTmp.price + priceChange;
    itemTmp.quantity = itemTmp.price < 5 ? randomHighQty : randomLowQty;
    itemTmp.amount = itemTmp.price * itemTmp.quantity;
    itemTmp.trsnType = Math.round(Math.random() * 100) % 2 ? 'Buy' : 'Sell';
    itemTmp.execution = new Date();
    itemTmp.historic.push(itemTmp.price);
    itemTmp.historic = itemTmp.historic.slice(-20); // keep a max of X historic values

    if (!changes[rowNumber]) {
      changes[rowNumber] = {};
    }

    // highlight whichever cell is being changed
    changes[rowNumber]['id'] = 'changed';
    renderCellHighlighting(itemTmp, findColumnById('priceChange'), priceChange);
    if ((prevItem.priceChange < 0 && itemTmp.priceChange > 0) || (prevItem.priceChange > 0 && itemTmp.priceChange < 0)) {
      renderCellHighlighting(itemTmp, findColumnById('price'), priceChange);
    }
    // if (prevItem.trsnType !== itemTmp.trsnType) {
    //   renderCellHighlighting(itemTmp, findColumnById('trsnType'), priceChange);
    // }

    // update the data
    vueGrid.dataView.updateItem(itemTmp.id, itemTmp);
    // NOTE: we should also invalidate/render the row after updating cell data to see the new data rendered in the UI
    // but the cell highlight actually does that for us so we can skip it
  }

  timer = setTimeout(startSimulation, refreshRate.value || 0);
}

function stopSimulation() {
  clearTimeout(timer);
}

function findColumnById(columnName: string): Column {
  return columnDefinitions.value.find((col) => col?.field === columnName) as Column;
}

function renderCellHighlighting(item: any, column: Column, priceChange: number) {
  if (item && column) {
    const row = vueGrid.dataView.getRowByItem(item) as number;
    if (row >= 0) {
      const hash = { [row]: { [column.id]: priceChange >= 0 ? 'changed-gain' : 'changed-loss' } };
      vueGrid.slickGrid.setCellCssStyles(`highlight_${[column.id]}${row}`, hash);

      // remove highlight after x amount of time
      setTimeout(() => removeUnsavedStylingFromCell(item, column, row), highlightDuration.value);
    }
  }
}

/** remove change highlight css class from that cell */
function removeUnsavedStylingFromCell(_item: any, column: Column, row: number) {
  vueGrid.slickGrid.removeCellCssStyles(`highlight_${[column.id]}${row}`);
}

function toggleFullScreen() {
  const container = document.querySelector('.trading-platform');
  if (container?.classList.contains('full-screen')) {
    container.classList.remove('full-screen');
    isFullScreen.value = false;
  } else if (container) {
    container.classList.add('full-screen');
    isFullScreen.value = true;
  }
  vueGrid.resizerService.resizeGrid();
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  toggleBodyBackground();
  vueGrid.slickGrid?.setOptions({ darkMode: isDarkMode.value });
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

function randomNumber(min: number, max: number, floor = true) {
  const number = Math.random() * (max - min + 1) + min;
  return floor ? Math.floor(number) : number;
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => vueGrid.resizerService.resizeGrid());
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>

<template>
  <h2>
    Example 34: Real-Time Trading Platform
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example34.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="toggle-dark-mode" @click="toggleDarkMode()">
      <span class="mdi mdi-theme-light-dark"></span>
      <span>Toggle Dark Mode</span>
    </button>
  </h2>

  <div class="subtitle">
    Simulate a stock trading platform with lot of price changes, it is strongly suggested to disable the
    <code>autoResize.autoHeight</code> grid option for this type of grid.
    <ul>
      <li>
        you can start/stop the simulation, you can see SlickGrid huge perf by setting: (1) lower Changes Rate, (2) increase both Changes per
        Cycle, and (3) lower Highlight Duration
      </li>
      <li>optionally change random numbers, between 0 and 10 symbols, per cycle (higher numbers means more changes)</li>
      <li>optionally change the simulation changes refresh rate in ms (lower number means more changes).</li>
      <li>you can Group by 1 of these columns: Currency, Market or Type</li>
    </ul>
  </div>

  <div class="trading-platform">
    <div class="row mb-4 simulation-form">
      <div class="col-sm-12 d-flex align-items-center">
        <div class="range">
          <label for="refreshRateRange" class="form-label me-1">Changes Rate(ms)</label>
          <input id="refreshRateRange" type="range" class="form-range" min="0" max="250" v-model="refreshRate" />
          <span class="refresh-rate">
            <input type="number" v-model="refreshRate" />
          </span>
        </div>
        <span class="ms-3 me-1">
          <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="start-btn" @click="startSimulation()">
            <li class="mdi mdi-play-circle-outline"></li>
            Start Simulation
          </button>
        </span>
        <span class="me-3">
          <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="stop-btn" @click="stopSimulation()">
            <li class="mdi mdi-stop-circle-outline"></li>
            Stop Simulation
          </button>
        </span>
        <span class="mx-1">
          <label for="change-per-cycle-input">Changes p/Cycle</label>
          <input id="change-per-cycle-input" class="ms-1" type="number" v-model="minChangePerCycle" :max="maxChangePerCycle" />
          to
          <input type="number" v-model="maxChangePerCycle" :min="minChangePerCycle" />
        </span>
        <span class="ms-2">
          <label for="highlight-input">Highlight Duration(ms)</label>
          <input id="highlight-input" class="ms-1" type="number" data-test="highlight-input" v-model="highlightDuration" />
        </span>
        <div class="ms-auto">
          <button class="btn btn-outline-secondary btn-sm btn-icon" @click="toggleFullScreen()">
            <li :class="isFullScreen ? 'mdi mdi-arrow-collapse' : 'mdi mdi-arrow-expand'"></li>
            Toggle Full-Screen
          </button>
        </div>
      </div>
    </div>

    <slickgrid-vue
      v-model:options="gridOptions"
      v-model:columns="columnDefinitions"
      v-model:dataset="dataset"
      grid-id="grid34"
      @onVueGridCreated="vueGridReady($event.detail)"
    >
    </slickgrid-vue>
  </div>
</template>
<style lang="scss">
// @use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-material.lite.scss' with (...);

$sparkline-color: #00b78d;
// $sparkline-color: #573585;

.trading-platform.full-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 12px 0 10px;
  background-color: white;
  z-index: 1040;
  position: fixed;
}
.changed-gain {
  background-color: #eafae8 !important;
}
.changed-loss {
  background-color: #ffeae8 !important;
}
.simulation-form {
  input[type='number'] {
    height: 32px;
    width: 50px;
    border: 1px solid #c0c0c0;
    border-radius: 3px;
  }
  div.range {
    display: contents;
    width: 200px;
    label.form-label {
      margin: 0;
    }
    input.form-range {
      width: 120px;
    }
  }
  .refresh-rate input {
    height: 30px;
    width: 46px;
  }
}
.sparkline {
  stroke: $sparkline-color;
  fill: rgba($sparkline-color, 0.05);
}
*[hidden] {
  display: none;
}

.trading-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 5px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 9999;
}

.slick-dark-mode,
.dark-mode {
  .text-success {
    color: #42b47f !important;
  }
  .changed-gain {
    background-color: #00ff001d !important;
  }
  .changed-loss {
    background-color: #ff00001b !important;
  }
  .trading-platform.full-screen {
    background-color: #33393e;
  }
}
</style>
