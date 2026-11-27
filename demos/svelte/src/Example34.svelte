<script lang="ts">
  import { faker } from '@faker-js/faker';
  import { sparkline } from '@fnando/sparkline';
  import {
    Aggregators,
    createDomElement,
    Filters,
    Formatters,
    GroupTotalFormatters,
    SlickgridSvelte,
    type Column,
    type Formatter,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { onMount } from 'svelte';

  const NB_ITEMS = 200;
  let isDarkMode = $state(false);
  let isFullScreen = $state(false);
  let highlightDuration = $state(150);
  let minChangePerCycle = $state(0);
  let maxChangePerCycle = $state(10);
  let refreshRate = $state(75);
  let showSubTitle = $state(true);
  let grid: SlickgridSvelteInstance;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const currencyFormatter: Formatter = (_row, _cell, value: string) =>
    `<img src="https://flags.fmcdn.net/data/flags/mini/${value.substring(0, 2).toLowerCase()}.png" width="20"/> ${value}`;

  const priceFormatter: Formatter = (_row, _cell, value, _column, dataContext) => {
    const direction = dataContext.priceChange >= 0 ? 'up' : 'down';
    const container = document.createElement('div');
    container.className = `d-inline-flex align-items-center text-${direction === 'up' ? 'success' : 'danger'}`;
    const icon = document.createElement('span');
    icon.className = `mdi mdi-arrow-${direction}`;
    container.appendChild(icon);
    container.appendChild(value instanceof HTMLElement ? value : document.createTextNode(value ?? ''));
    return container;
  };

  const transactionTypeFormatter: Formatter = (_row, _cell, value: string) =>
    `<div class="d-inline-flex align-items-center"><span class="me-1 mdi font-16px mdi-${value === 'Buy' ? 'plus' : 'minus'}-circle ${value === 'Buy' ? 'text-info' : 'text-warning'}"></span> ${value}</div>`;

  const historicSparklineFormatter: Formatter = (_row, _cell, _value, _column, dataContext) => {
    if (dataContext.historic.length < 2) {
      return '';
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '135');
    svg.setAttribute('height', '30');
    svg.setAttribute('stroke-width', '2');
    svg.classList.add('sparkline');
    sparkline(svg, dataContext.historic, {
      cursorwidth: 2,
      onmousemove: (event, datapoint) => {
        const tooltip = (event.target as HTMLElement).closest('svg')?.nextElementSibling as HTMLElement | null;
        if (tooltip) {
          tooltip.hidden = false;
          tooltip.textContent = `$${datapoint.value.toFixed(2)}`;
          tooltip.style.top = `${event.offsetY}px`;
          tooltip.style.left = `${event.offsetX + 20}px`;
        }
      },
      onmouseout: (event) => {
        const tooltip = (event.target as HTMLElement).closest('svg')?.nextElementSibling as HTMLElement | null;
        if (tooltip) {
          tooltip.hidden = true;
        }
      },
    });

    const wrapper = document.createElement('div');
    wrapper.append(svg, createDomElement('div', { className: 'trading-tooltip', hidden: true }));
    return wrapper;
  };

  const columns: Column[] = [
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
        formatter: (group) =>
          `Currency: <span style="color: var(--slick-primary-color); font-weight: bold;">${group.value}</span>  <span style="color: #659bff;">(${group.count} items)</span>`,
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
        formatter: (group) =>
          `Market: <span style="color: var(--slick-primary-color); font-weight: bold;">${group.value}</span>  <span style="color: #659bff;">(${group.count} items)</span>`,
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
        formatter: (group) =>
          `Type: <span style="color: var(--slick-primary-color); font-weight: bold;">${group.value}</span>  <span style="color: #659bff;">(${group.count} items)</span>`,
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
      params: { formatters: [Formatters.dollar, priceFormatter], maxDecimal: 2 },
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

  const gridOptions: GridOption = {
    autoResize: { container: '.trading-platform', autoHeight: false, rightPadding: 0, bottomPadding: 10 },
    formatterOptions: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',' },
    draggableGrouping: {
      dropPlaceHolderText: 'Drop a column header here to group by any of these available columns: Currency, Market or Type',
      deleteIconCssClass: 'mdi mdi-close color-danger',
      sortAscIconCssClass: 'mdi mdi-arrow-up',
      sortDescIconCssClass: 'mdi mdi-arrow-down',
    },
    enableDraggableGrouping: true,
    createPreHeaderPanel: true,
    darkMode: false,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 40,
    enableCellNavigation: true,
    enableFiltering: true,
    cellHighlightCssClass: 'changed',
  };

  // the dataset is mutated in place by the simulation (via `dataView.updateItem`), it is never replaced
  const dataset = getData();

  function getData() {
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
        symbol: currency === 'CAD' ? company.substring(0, 3).toUpperCase() + '.TO' : company.substring(0, 4).toUpperCase(),
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
    return tmpData;
  }

  function startSimulation() {
    const numberOfUpdates = randomNumber(minChangePerCycle, maxChangePerCycle);
    for (let i = 0; i < numberOfUpdates; i++) {
      const randomLowQty = randomNumber(1, 50);
      const randomHighQty = randomNumber(125, 255);
      const rowNumber = Math.round(Math.random() * (dataset.length - 1));
      const priceChange = randomNumber(-25, 25, false);
      const prevItem = dataset[rowNumber];
      const itemTmp = { ...prevItem, historic: [...prevItem.historic] };
      itemTmp.priceChange = priceChange;
      itemTmp.price = itemTmp.price + priceChange < 0 ? 0 : itemTmp.price + priceChange;
      itemTmp.quantity = itemTmp.price < 5 ? randomHighQty : randomLowQty;
      itemTmp.amount = itemTmp.price * itemTmp.quantity;
      itemTmp.trsnType = Math.round(Math.random() * 100) % 2 ? 'Buy' : 'Sell';
      itemTmp.execution = new Date();
      itemTmp.historic.push(itemTmp.price);
      itemTmp.historic = itemTmp.historic.slice(-20); // keep a max of X historic values
      dataset[rowNumber] = itemTmp;

      // highlight whichever cell is being changed
      renderCellHighlighting(itemTmp, findColumnById('priceChange'), priceChange);
      if ((prevItem.priceChange < 0 && itemTmp.priceChange > 0) || (prevItem.priceChange > 0 && itemTmp.priceChange < 0)) {
        renderCellHighlighting(itemTmp, findColumnById('price'), priceChange);
      }

      // update the data, the cell highlight above will also render the row so there's no need to invalidate it
      grid.dataView.updateItem(itemTmp.id, itemTmp);
    }
    timer = setTimeout(startSimulation, refreshRate || 0);
  }

  function stopSimulation() {
    clearTimeout(timer);
    timer = undefined;
  }

  function findColumnById(field: string) {
    return columns.find((column) => column.field === field) as Column;
  }

  function renderCellHighlighting(item: any, column: Column, priceChange: number) {
    if (item && column) {
      const row = grid.dataView.getRowByItem(item) as number;
      if (row >= 0) {
        const hash = { [row]: { [column.id]: priceChange >= 0 ? 'changed-gain' : 'changed-loss' } };
        grid.slickGrid.setCellCssStyles(`highlight_${column.id}${row}`, hash);

        // remove highlight after x amount of time
        setTimeout(() => grid.slickGrid.removeCellCssStyles(`highlight_${column.id}${row}`), highlightDuration || 0);
      }
    }
  }

  function toggleFullScreen() {
    const container = document.querySelector('.trading-platform');
    isFullScreen = !isFullScreen;
    container?.classList.toggle('full-screen', isFullScreen);
    grid.resizerService.resizeGrid();
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.querySelector('.panel-wm-content')?.classList.toggle('dark-mode', isDarkMode);
    const demoContainer = document.querySelector<HTMLDivElement>('#demo-container');
    if (demoContainer) {
      demoContainer.dataset.bsTheme = isDarkMode ? 'dark' : 'light';
    }
    grid.slickGrid?.setOptions({ darkMode: isDarkMode });
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }

  function randomNumber(min: number, max: number, floor = true) {
    const number = Math.random() * (max - min + 1) + min;
    return floor ? Math.floor(number) : number;
  }

  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
  }

  onMount(() => {
    // the simulation starts once the grid is ready
    timer = setTimeout(startSimulation, refreshRate || 0);
    return () => {
      stopSimulation();
      document.querySelector('.panel-wm-content')?.classList.remove('dark-mode');
      const demoContainer = document.querySelector<HTMLDivElement>('#demo-container');
      if (demoContainer) {
        demoContainer.dataset.bsTheme = 'light';
      }
    };
  });
</script>

<svelte:head><title>Example 34 - Real-Time Trading Platform</title></svelte:head>

<h2>
  Example 34: Real-Time Trading Platform
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example34.svelte"
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
  <button class="btn btn-outline-secondary btn-sm btn-icon ms-1" data-test="toggle-dark-mode" onclick={toggleDarkMode}>
    <span class="mdi mdi-theme-light-dark"></span><span>Toggle Dark Mode</span>
  </button>
</h2>

{#if showSubTitle}
  <div class="subtitle">
    Simulate a stock trading platform with lot of price changes, it is strongly suggested to disable the <code>autoResize.autoHeight</code>
    grid option for this type of grid.
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
{/if}

<div class="trading-platform">
  <div class="row mb-4 simulation-form">
    <div class="col-sm-12 d-flex align-items-center">
      <div class="range">
        <label for="refreshRateRange" class="form-label me-1">Changes Rate(ms)</label>
        <input id="refreshRateRange" type="range" class="form-range" min="0" max="250" bind:value={refreshRate} />
        <span class="refresh-rate"><input type="number" bind:value={refreshRate} /></span>
      </div>
      <span class="ms-3 me-1">
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="start-btn" onclick={startSimulation}>
          <i class="mdi mdi-play-circle-outline"></i> Start Simulation
        </button>
      </span>
      <span class="me-3">
        <button class="btn btn-outline-secondary btn-sm btn-icon" data-test="stop-btn" onclick={stopSimulation}>
          <i class="mdi mdi-stop-circle-outline"></i> Stop Simulation
        </button>
      </span>
      <span class="mx-1">
        <label for="change-per-cycle-input">Changes p/Cycle</label><input
          id="change-per-cycle-input"
          class="ms-1"
          type="number"
          bind:value={minChangePerCycle}
          max={maxChangePerCycle}
        />
        to <input type="number" bind:value={maxChangePerCycle} min={minChangePerCycle} />
      </span>
      <span class="ms-2">
        <label for="highlight-input">Highlight Duration(ms)</label><input
          id="highlight-input"
          class="ms-1"
          type="number"
          data-test="highlight-input"
          bind:value={highlightDuration}
        />
      </span>
      <div class="ms-auto">
        <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={toggleFullScreen}>
          <i class={isFullScreen ? 'mdi mdi-arrow-collapse' : 'mdi mdi-arrow-expand'}></i> Toggle Full-Screen
        </button>
      </div>
    </div>
  </div>
  <SlickgridSvelte gridId="grid34" {columns} options={gridOptions} {dataset} onSvelteGridCreated={gridReady} />
</div>

<style>
  :global(.trading-platform.full-screen) {
    position: fixed;
    inset: 0;
    padding: 10px 12px 0 10px;
    background-color: white;
    z-index: 1040;
  }
  :global(.changed-gain) {
    background-color: #eafae8 !important;
  }
  :global(.changed-loss) {
    background-color: #ffeae8 !important;
  }
  .simulation-form input[type='number'] {
    height: 32px;
    width: 50px;
    border: 1px solid #c0c0c0;
    border-radius: 3px;
  }
  .simulation-form .range {
    display: contents;
    width: 200px;
  }
  .simulation-form .range label.form-label {
    margin: 0;
  }
  .simulation-form .range input.form-range {
    width: 120px;
  }
  .simulation-form .refresh-rate input {
    height: 30px;
    width: 46px;
  }
  :global(.sparkline) {
    stroke: #00b78d;
    fill: rgba(0, 183, 141, 0.05);
  }
  :global(*[hidden]) {
    display: none;
  }
  :global(.trading-tooltip) {
    position: absolute;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 2px 5px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 9999;
  }
  :global(.slick-dark-mode .text-success),
  :global(.dark-mode .text-success) {
    color: #42b47f !important;
  }
  :global(.slick-dark-mode .changed-gain),
  :global(.dark-mode .changed-gain) {
    background-color: #00ff001d !important;
  }
  :global(.slick-dark-mode .changed-loss),
  :global(.dark-mode .changed-loss) {
    background-color: #ff00001b !important;
  }
  :global(.dark-mode .trading-platform.full-screen) {
    background-color: #33393e;
  }
</style>
