import {
  Aggregators,
  type Column,
  createDomElement,
  deepCopy,
  Filters,
  type Formatter,
  Formatters,
  type GridOption,
  GroupTotalFormatters,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import { faker } from '@faker-js/faker';
import sparkline from '@fnando/sparkline';
import React, { useEffect, useRef, useState } from 'react';

import './example34.scss';

const NB_ROWS = 200;

const currencyFormatter: Formatter = (cell: number, row: number, value: string) =>
  `<img src="https://flags.fmcdn.net/data/flags/mini/${value.substr(0, 2).toLowerCase()}.png" width="20"/> ${value}`;

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
  `<div class="d-inline-flex align-items-center"><span class="me-1 mdi mdi-16px mdi-${value === 'Buy' ? 'plus' : 'minus'}-circle ${value === 'Buy' ? 'text-info' : 'text-warning'}"></span> ${value}</div>`;

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

const Example34: React.FC = () => {
  const [dataset] = useState<any[]>(loadData(NB_ROWS));
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [highlightDuration, setHighlightDuration] = useState(150);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [minChangePerCycle, setMinChangePerCycle] = useState(0);
  const [maxChangePerCycle, setMaxChangePerCycle] = useState(10);
  const [refreshRate, setRefreshRate] = useState(75);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const columnDefinitionsRef = useRef<Column[]>([]);
  const minChangePerCycleRef = useRef(minChangePerCycle);
  const maxChangePerCycleRef = useRef(maxChangePerCycle);
  const highlightDurationRef = useRef(highlightDuration);
  const refreshRateRef = useRef(refreshRate);
  const timerRef = useRef<any>(null);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
    window.setTimeout(() => {
      startSimulation();
    }, refreshRateRef.current);

    // make sure it's back to light mode before unmounting
    return () => {
      stopSimulation();
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    const columnDefinitions: Column[] = [
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
            `Currency: <span style="var(--slick-primary-color); font-weight: bold;">${g.value}</span>  <span style="color: #659bff;">(${g.count} items)</span>`,
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
            `Market: <span style="var(--slick-primary-color); font-weight: bold;">${g.value}</span>  <span style="color: #659bff;">(${g.count} items)</span>`,
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
            `Type: <span style="var(--slick-primary-color); font-weight: bold;">${g.value}</span>  <span style="color: #659bff;">(${g.count} items)</span>`,
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

    const gridOptions: GridOption = {
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
        deleteIconCssClass: 'mdi mdi-close text-color-danger',
        sortAscIconCssClass: 'mdi mdi-arrow-up',
        sortDescIconCssClass: 'mdi mdi-arrow-down',
      },
      enableDraggableGrouping: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 40,
      enableCellNavigation: true,
      enableFiltering: true,
      cellHighlightCssClass: 'changed',
    };

    columnDefinitionsRef.current = columnDefinitions;
    setGridOptions(gridOptions);
  }

  function loadData(itemCount: number) {
    // mock a dataset
    const tmpData: any[] = [];
    for (let i = 0; i < itemCount; i++) {
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
    return tmpData;
  }

  function startSimulation() {
    const changes: any = {};
    const numberOfUpdates = randomNumber(minChangePerCycleRef.current, maxChangePerCycleRef.current);

    for (let i = 0; i < numberOfUpdates; i++) {
      const randomLowQty = randomNumber(1, 50);
      const randomHighQty = randomNumber(125, 255);
      const rowNumber = Math.round(Math.random() * (dataset?.length ?? 0 - 1));
      const priceChange = randomNumber(-25, 25, false);
      const prevItem = deepCopy(dataset?.[rowNumber]);
      if (!prevItem) {
        continue;
      }
      const itemTmp = { ...dataset?.[rowNumber] };
      itemTmp.priceChange = priceChange;
      itemTmp.price = itemTmp.price + priceChange < 0 ? 0 : itemTmp.price + priceChange;
      itemTmp.quantity = itemTmp.price < 5 ? randomHighQty : randomLowQty;
      itemTmp.amount = itemTmp.price * itemTmp.quantity;
      itemTmp.trsnType = Math.round(Math.random() * 100) % 2 ? 'Buy' : 'Sell';
      itemTmp.execution = new Date();
      itemTmp.historic?.push(itemTmp.price);
      itemTmp.historic = itemTmp.historic?.slice(-20); // keep a max of X historic values

      if (!changes[rowNumber]) {
        changes[rowNumber] = {};
      }

      // highlight whichever cell is being changed
      changes[rowNumber]['id'] = 'changed';
      renderCellHighlighting(itemTmp, findColumnById('priceChange'), priceChange);
      if ((prevItem.priceChange < 0 && itemTmp.priceChange > 0) || (prevItem.priceChange > 0 && itemTmp.priceChange < 0)) {
        renderCellHighlighting(itemTmp, findColumnById('price'), priceChange);
      }

      // update the data
      reactGridRef.current?.dataView.updateItem(itemTmp.id, itemTmp);
      // NOTE: we should also invalidate/render the row after updating cell data to see the new data rendered in the UI
      // but the cell highlight actually does that for us so we can skip it
    }

    timerRef.current = window.setTimeout(startSimulation, refreshRateRef.current || 0);
  }

  function stopSimulation() {
    window.clearTimeout(timerRef.current);
  }

  function findColumnById(columnName: string): Column {
    return columnDefinitionsRef.current.find((col) => col.field === columnName) as Column;
  }

  function handleRefreshRateChange(elm: HTMLInputElement) {
    const newVal = elm.value;
    setRefreshRate(+newVal);
    refreshRateRef.current = +newVal;

    const inputElmId = elm.type === 'number' ? '#refreshRateSlider' : '#refreshRateInput';
    const otherInputElm = document.querySelector<HTMLInputElement>(inputElmId);
    if (otherInputElm) {
      otherInputElm.value = newVal;
    }
  }

  function handleMinChangePerCycle(val: number) {
    setMinChangePerCycle(val);
    minChangePerCycleRef.current = val;
  }

  function handleMaxChangePerCycle(val: number) {
    setMaxChangePerCycle(val);
    maxChangePerCycleRef.current = val;
  }

  function handleHighlightDuration(val: number) {
    setHighlightDuration(val);
    highlightDurationRef.current = val;
  }

  function renderCellHighlighting(item: any, column: Column, priceChange: number) {
    if (item && column) {
      const row = reactGridRef.current?.dataView.getRowByItem(item) as number;
      if (row >= 0) {
        const hash = { [row]: { [column.id]: priceChange >= 0 ? 'changed-gain' : 'changed-loss' } };
        reactGridRef.current?.slickGrid.setCellCssStyles(`highlight_${[column.id]}${row}`, hash);

        // remove highlight after x amount of time
        window.setTimeout(() => removeUnsavedStylingFromCell(item, column, row), highlightDurationRef.current);
      }
    }
  }

  /** remove change highlight css class from that cell */
  function removeUnsavedStylingFromCell(_item: any, column: Column, row: number) {
    reactGridRef.current?.slickGrid.removeCellCssStyles(`highlight_${[column.id]}${row}`);
  }

  function toggleFullScreen() {
    const container = document.querySelector('.trading-platform');
    let isFullScreen = false;
    if (container?.classList.contains('full-screen')) {
      container.classList.remove('full-screen');
      isFullScreen = false;
    } else if (container) {
      container.classList.add('full-screen');
      isFullScreen = true;
    }
    setIsFullScreen(isFullScreen);
    reactGridRef.current?.resizerService.resizeGrid();
  }

  function toggleDarkMode() {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    toggleBodyBackground(newDarkMode);
    reactGridRef.current?.slickGrid.setOptions({ darkMode: newDarkMode });
  }

  function toggleBodyBackground(darkMode: boolean) {
    if (darkMode) {
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
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div>
      <h2>
        Example 34: Real-Time Trading Platform
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example34.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => toggleSubTitle()}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
        <button className="btn btn-outline-secondary btn-sm btn-icon ms-2" onClick={() => toggleDarkMode()} data-test="toggle-dark-mode">
          <i className="mdi mdi-theme-light-dark"></i>
          <span>Toggle Dark Mode</span>
        </button>
      </h2>

      <div className="subtitle">
        Simulate a stock trading platform with lot of price changes, it is strongly suggested to disable the{' '}
        <code>autoResize.autoHeight</code> grid option for this type of grid.
        <ul>
          <li>
            you can start/stop the simulation, you can see SlickGrid huge perf by setting: (1) lower Changes Rate, (2) increase both Changes
            per Cycle, and (3) lower Highlight Duration
          </li>
          <li>optionally change random numbers, between 0 and 10 symbols, per cycle (higher numbers means more changes)</li>
          <li>optionally change the simulation changes refresh rate in ms (lower number means more changes).</li>
          <li>you can Group by 1 of these columns: Currency, Market or Type</li>
        </ul>
      </div>

      <div className="trading-platform">
        <div className="row mb-4 simulation-form">
          <div className="col-sm-12 d-flex align-items-center">
            <div className="range">
              <label htmlFor="refreshRateRange" className="form-label me-1">
                Changes Rate(ms)
              </label>
              <input
                type="range"
                className="form-range"
                id="refreshRateRange"
                min="0"
                max="250"
                value={refreshRate}
                onInput={($event) => handleRefreshRateChange($event.target as HTMLInputElement)}
              />
              <span className="refresh-rate">
                <input
                  type="number"
                  id="refreshRateInput"
                  value={refreshRate}
                  onInput={($event) => handleRefreshRateChange($event.target as HTMLInputElement)}
                />
              </span>
            </div>
            <span className="ms-3 me-1">
              <button className="btn btn-outline-secondary btn-sm btn-icon" data-test="start-btn" onClick={() => startSimulation()}>
                <li className="mdi mdi-play-circle-outline"></li> Start Simulation
              </button>
            </span>
            <span className="me-3">
              <button className="btn btn-outline-secondary btn-sm btn-icon" data-test="stop-btn" onClick={() => stopSimulation()}>
                <li className="mdi mdi-stop-circle-outline"></li> Stop Simulation
              </button>
            </span>
            <span className="mx-1">
              <label htmlFor="change-per-cycle-input" className="me-1">
                Changes p/Cycle
              </label>
              <input
                type="number"
                id="change-per-cycle-input"
                value={minChangePerCycle}
                max={maxChangePerCycle}
                onInput={($event) => handleMinChangePerCycle(+($event.target as HTMLInputElement).value)}
              />
              &nbsp;to&nbsp;
              <input
                type="number"
                min={minChangePerCycle}
                value={maxChangePerCycle}
                onInput={($event) => handleMaxChangePerCycle(+($event.target as HTMLInputElement).value)}
              />
            </span>
            <span className="ms-2">
              <label htmlFor="highlight-input" className="me-1">
                Highlight Duration(ms)
              </label>
              <input
                type="number"
                id="highlight-input"
                data-test="highlight-input"
                value={highlightDuration}
                onInput={($event) => handleHighlightDuration(+($event.target as HTMLInputElement).value)}
              />
            </span>
            <div className="ms-auto">
              <button className="btn btn-outline-secondary btn-sm btn-icon" onClick={() => toggleFullScreen()}>
                <li className={isFullScreen ? 'mdi mdi-arrow-collapse' : 'mdi mdi-arrow-expand'}></li> Toggle Full-Screen
              </button>
            </div>
          </div>
        </div>

        <SlickgridReact
          gridId="grid34"
          columns={columnDefinitionsRef.current}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />
      </div>
    </div>
  );
};

export default Example34;
