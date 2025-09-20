import { type EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import React, { useState, useEffect, useRef } from 'react';
import {
  Aggregators,
  type Column,
  Editors,
  ExtensionName,
  Filters,
  Formatters,
  type GridOption,
  type Grouping,
  GroupTotalFormatters,
  SlickgridReact,
  type SlickgridReactInstance,
  SlickRowDetailView,
  SortComparers,
  SortDirectionNumber,
} from 'slickgrid-react';

import { ExampleDetailPreload } from './Example-detail-preload.js';
import Example47DetailView from './Example47-detail-view.js';

export interface Item {
  id: number;
  title: string;
  duration: number;
  cost: number;
  percentComplete: number;
  start: Date;
  finish: Date;
  effortDriven: boolean;
}

const FAKE_SERVER_DELAY = 250;
const NB_ITEMS = 1200;

const Example47: React.FC = () => {
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [columnDefinitions, setColumnDefinitions] = useState<Column<Item>[]>([]);
  const [dataset] = useState<Item[]>(loadData());
  const [detailViewRowCount, setDetailViewRowCount] = useState<number>(9);
  const [serverWaitDelay, setServerWaitDelay] = useState<number>(FAKE_SERVER_DELAY);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const serverWaitDelayRef = useRef(serverWaitDelay);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
    return () => {
      // make sure it's back to light mode before unmounting
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
    groupByDuration(); // group by duration on page load
  }

  function rowDetailInstance() {
    return reactGridRef.current?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView) as SlickRowDetailView;
  }

  const getColumnsDefinition = (): Column<Item>[] => {
    return [
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
        id: '%',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 200,
        width: 250,
        resizable: false,
        filterable: true,
        sortable: true,
        type: 'number',
        formatter: Formatters.percentCompleteBar,
        groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
        params: { groupFormatterPrefix: '<i>Avg</i>: ' },
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
        id: 'cost',
        name: 'Cost',
        field: 'cost',
        minWidth: 70,
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
        type: 'number',
        formatter: Formatters.dollar,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollarBold,
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
  };

  function defineGrid() {
    const columnDefinitions = getColumnsDefinition();
    const gridOptions = getGridOptions();

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function simulateServerAsyncCall(item: any) {
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

    return new Promise((resolve) => {
      setTimeout(() => {
        const itemDetail = item;
        itemDetail.assignee = randomNames[randomNumber(0, 9)] || '';
        itemDetail.reporter = randomNames[randomNumber(0, 9)] || '';

        resolve(itemDetail);
      }, serverWaitDelayRef.current);
    });
  }

  function getGridOptions(): GridOption {
    return {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableGrouping: true,
      enableRowDetailView: true,
      rowTopOffsetRenderType: 'top', // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
      darkMode,
      preRegisterExternalExtensions: (pubSubService) => {
        const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);
        return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
      },
      rowDetailView: {
        process: (item) => simulateServerAsyncCall(item),
        loadOnce: true,
        singleRowExpand: false,
        panelRows: detailViewRowCount,
        preloadComponent: ExampleDetailPreload,
        viewComponent: Example47DetailView,
      },
      rowSelectionOptions: {
        selectActiveRow: true,
      },
    };
  }

  function loadData() {
    const tmpData: Item[] = [];
    for (let i = 0; i < NB_ITEMS; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = Math.round(Math.random() * 10000) / 100;

      tmpData[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.floor(Math.random() * 100),
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        cost: i % 3 ? randomCost : -randomCost,
        effortDriven: i % 5 === 0,
      };
    }

    return tmpData;
  }

  function changeDetailViewRowCount() {
    const options = rowDetailInstance().getOptions();
    if (options && options.panelRows) {
      options.panelRows = detailViewRowCount;
      rowDetailInstance().setOptions(options);
    }
  }

  function closeAllRowDetail() {
    rowDetailInstance().collapseAll();
  }

  function clearGrouping() {
    reactGridRef.current?.dataView.setGrouping([]);
  }

  function collapseAllGroups() {
    reactGridRef.current?.dataView.collapseAllGroups();
  }

  function expandAllGroups() {
    reactGridRef.current?.dataView.expandAllGroups();
  }

  function groupByDuration() {
    // you need to manually add the sort icon(s) in UI
    reactGridRef.current?.filterService.setSortColumnIcons([{ columnId: 'duration', sortAsc: true }]);
    reactGridRef.current?.dataView.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      comparer: (a, b) => {
        return SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc);
      },
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed: false,
      lazyTotalsCalculation: true,
    } as Grouping);
    reactGridRef.current?.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  function groupByDurationEffortDriven() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
    ];
    reactGridRef.current?.filterService.setSortColumnIcons(sortColumns);
    reactGridRef.current?.dataView.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true,
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${g.value ? 'True' : 'False'} <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
        collapsed: true,
        lazyTotalsCalculation: true,
      },
    ] as Grouping[]);
    reactGridRef.current?.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  const detailViewRowCountChanged = (val: number | string) => {
    setDetailViewRowCount(+val);
  };

  const serverDelayChanged = (e: React.FormEvent<HTMLInputElement>) => {
    const newDelay = +((e.target as HTMLInputElement)?.value ?? '');
    setServerWaitDelay(newDelay);
    serverWaitDelayRef.current = newDelay;
  };

  function toggleDarkMode() {
    closeAllRowDetail();
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

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? null : (
    <div className="demo47">
      <div id="demo-container" className="container-fluid">
        <h2>
          Example 47: Row Detail View + Grouping
          <span className="float-end font18">
            see&nbsp;
            <a
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example47.tsx"
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
          <button className="btn btn-outline-secondary btn-sm btn-icon ms-2" onClick={toggleDarkMode} data-test="toggle-dark-mode">
            <i className="mdi mdi-theme-light-dark"></i>
            <span>Toggle Dark Mode</span>
          </button>
        </h2>

        <div className="subtitle">
          Provide ability for Row Detail to work with Grouping, see (
          <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/row-detail" target="_blank">
            Wiki docs
          </a>
          )
        </div>

        <div className="row">
          <div className="col-sm-12 d-flex gap-4px">
            <button
              className="btn btn-outline-secondary btn-sm btn-icon"
              onClick={closeAllRowDetail}
              data-test="collapse-all-rowdetail-btn"
            >
              Close all Row Details
            </button>
            <button className="btn btn-outline-secondary btn-sm btn-icon" data-test="clear-grouping-btn" onClick={() => clearGrouping()}>
              <i className="mdi mdi-close"></i> Clear grouping
            </button>
            <button
              className="btn btn-outline-secondary btn-sm btn-icon"
              data-test="collapse-all-group-btn"
              onClick={() => collapseAllGroups()}
            >
              <i className="mdi mdi-arrow-collapse"></i> Collapse all groups
            </button>
            <button className="btn btn-outline-secondary btn-sm btn-icon" data-test="expand-all-btn" onClick={() => expandAllGroups()}>
              <i className="mdi mdi-arrow-expand"></i> Expand all groups
            </button>

            <label htmlFor="detailViewRowCount">Detail View Rows Shown: </label>
            <input
              id="detailViewRowCount"
              type="number"
              value={detailViewRowCount}
              style={{ height: '26px', width: '40px' }}
              onInput={($event) => detailViewRowCountChanged(($event.target as HTMLInputElement).value)}
            />
            <button
              className="btn btn-outline-secondary btn-sm btn-icon"
              style={{ height: '26px' }}
              onClick={changeDetailViewRowCount}
              data-test="set-count-btn"
            >
              Set
            </button>
            <label htmlFor="serverdelay" className="ms-2">
              Server Delay:{' '}
            </label>
            <input
              id="serverdelay"
              type="number"
              defaultValue={serverWaitDelay}
              data-test="server-delay"
              style={{ width: '55px' }}
              onInput={serverDelayChanged}
              title="input a fake timer delay to simulate slow server response"
            />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12 d-flex gap-4px">
            <button
              className="btn btn-outline-secondary btn-sm btn-icon"
              data-test="group-duration-sort-value-btn"
              onClick={() => groupByDuration()}
            >
              Group by Duration
            </button>
            <button
              className="btn btn-outline-secondary btn-sm btn-icon"
              data-test="group-duration-effort-btn"
              onClick={() => groupByDurationEffortDriven()}
            >
              Group by Duration then Effort-Driven
            </button>
          </div>
        </div>

        <hr />

        <SlickgridReact
          gridId="grid47"
          columns={columnDefinitions}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />
      </div>
    </div>
  );
};

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default Example47;
