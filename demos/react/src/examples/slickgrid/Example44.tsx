import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  type Column,
  type Formatter,
  type GridOption,
  type ItemMetadata,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import { useEffect, useState } from 'react';

import './example44.scss';

export default function Example44() {
  const [reactGrid, setReactGrid] = useState<SlickgridReactInstance>();
  const [scrollToRow, setScrollToRow] = useState(100);
  const [dataLn, setDataLn] = useState<number | string>('loading...');
  const [hideSubTitle, setHideSubTitle] = useState(false);
  const [dataset, setDataset] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<Record<number, ItemMetadata>>({
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
  });

  useEffect(() => {
    loadData(500);
  }, []);

  const rowCellValueFormatter: Formatter = (row, cell, value) =>
    `<div class="cellValue">${value.toFixed(2)}</div><div class="valueComment">${row}.${cell}</div>`;
  const rowCellValueExportFormatter: Formatter = (_row, _cell, value) => value.toFixed(2);

  // the columns field property is type-safe, try to add a different string not representing one of DataItems properties
  const columnDefinitions: Column[] = [
    { id: 'title', name: 'Title', field: 'title', minWidth: 80 },
    {
      id: 'revenueGrowth',
      name: 'Revenue Growth',
      field: 'revenueGrowth',
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
      minWidth: 120,
    },
    {
      id: 'pricingPolicy',
      name: 'Pricing Policy',
      field: 'pricingPolicy',
      minWidth: 110,
      sortable: true,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'policyIndex',
      name: 'Policy Index',
      field: 'policyIndex',
      minWidth: 100,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'expenseControl',
      name: 'Expense Control',
      field: 'expenseControl',
      minWidth: 110,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'excessCash',
      name: 'Excess Cash',
      field: 'excessCash',
      minWidth: 100,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'netTradeCycle',
      name: 'Net Trade Cycle',
      field: 'netTradeCycle',
      minWidth: 110,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'costCapital',
      name: 'Cost of Capital',
      field: 'costCapital',
      minWidth: 100,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'revenueGrowth2',
      name: 'Revenue Growth',
      field: 'revenueGrowth2',
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
      minWidth: 120,
    },
    {
      id: 'pricingPolicy2',
      name: 'Pricing Policy',
      field: 'pricingPolicy2',
      minWidth: 110,
      sortable: true,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'policyIndex2',
      name: 'Policy Index',
      field: 'policyIndex2',
      minWidth: 100,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'expenseControl2',
      name: 'Expense Control',
      field: 'expenseControl2',
      minWidth: 110,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'excessCash2',
      name: 'Excess Cash',
      field: 'excessCash2',
      minWidth: 100,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'netTradeCycle2',
      name: 'Net Trade Cycle',
      field: 'netTradeCycle2',
      minWidth: 110,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'costCapital2',
      name: 'Cost of Capital',
      field: 'costCapital2',
      minWidth: 100,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'revenueGrowth3',
      name: 'Revenue Growth',
      field: 'revenueGrowth3',
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
      minWidth: 120,
    },
    {
      id: 'pricingPolicy3',
      name: 'Pricing Policy',
      field: 'pricingPolicy3',
      minWidth: 110,
      sortable: true,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'policyIndex3',
      name: 'Policy Index',
      field: 'policyIndex3',
      minWidth: 100,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'expenseControl3',
      name: 'Expense Control',
      field: 'expenseControl3',
      minWidth: 110,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'excessCash3',
      name: 'Excess Cash',
      field: 'excessCash3',
      minWidth: 100,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'netTradeCycle3',
      name: 'Net Trade Cycle',
      field: 'netTradeCycle3',
      minWidth: 110,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
    {
      id: 'costCapital3',
      name: 'Cost of Capital',
      field: 'costCapital3',
      minWidth: 100,
      exportCustomFormatter: rowCellValueExportFormatter,
      formatter: rowCellValueFormatter,
      type: 'number',
    },
  ];

  const gridOptions: GridOption = {
    enableCellNavigation: true,
    enableColumnReorder: true,
    enableHeaderMenu: false,
    enableCellRowSpan: true,
    gridHeight: 600,
    gridWidth: 900,
    rowHeight: 30,
    dataView: {
      globalItemMetadataProvider: {
        getRowMetadata: (item: any, row: any) => renderDifferentColspan(item, row),
      },
    },
    enableExcelExport: true,
    externalResources: [new ExcelExportService()],
    rowTopOffsetRenderType: 'top', // rowspan doesn't render well with 'transform', default is 'top'
  };

  function clearScrollTo() {
    setScrollToRow(0);
    document.querySelector<HTMLInputElement>('#nRow')?.focus();
  }

  function onScrollToRow(val: string) {
    setScrollToRow(+val);
  }

  function loadData(count: number) {
    setDataLn('loading...');

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

      setDataLn(count);
      setDataset(tmpArray);
    }, 20);
  }

  /**
   * A callback to render different row column span
   * Your callback will always have the "item" argument which you can use to decide on the colspan
   * Your return object must always be in the form of:: { columns: { [columnName]: { colspan: number|'*' } }}
   */
  function renderDifferentColspan(_item: any, row: number): any {
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

    // override metadata
    setMetadata(metadata);

    // row index 3 can have a rowspan of up to 5 rows, so we need to invalidate from row 3 + 5 (-1 because of zero index)
    // so: 3 + 5 - 1 => row indexes 3 to 7
    reactGrid?.slickGrid?.invalidateRows([3, 4, 5, 6, 7]);
    reactGrid?.slickGrid?.render();
  }

  function handleScrollTo() {
    // const args = event.detail && event.detail.args;
    reactGrid?.slickGrid?.scrollRowToTop(scrollToRow);
    return false;
  }

  function reactGridReady(instance: SlickgridReactInstance) {
    setReactGrid(instance);
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGrid?.resizerService.resizeGrid(0);
  }

  return (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 44: colspan/rowspan with large dataset
        <span className="float-end">
          <a
            style={{ fontSize: '18px' }}
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/Example44.tsx"
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
      </h2>

      <div className="subtitle">
        <p className="italic example-details">
          This page demonstrates <code>colspan</code> & <code>rowspan</code> using DataView with item metadata. <b>Note</b>:
          <code>colspan</code> & <code>rowspan</code> are rendered via row/cell indexes, any operations that could change these indexes
          (i.e. Filtering/Sorting/Paging/Column Reorder) will require you to implement proper logic to recalculate these indexes (it becomes
          your responsability). This demo does not show this because it is up to you to decide what to do when the span changes shape (i.e.
          you default to 3 rowspan but you filter a row in the middle, how do you want to proceed?).
        </p>
      </div>

      <section className="row mb-2">
        <div className="d-flex">
          <button className="ms-1 btn btn-outline-secondary btn-sm" data-test="add-500-rows-btn" onClick={() => loadData(500)}>
            500 rows
          </button>
          <button className="ms-1 btn btn-outline-secondary btn-sm" data-test="add-5k-rows-btn" onClick={() => loadData(5000)}>
            5k rows
          </button>
          <button className="ms-1 btn btn-outline-secondary btn-sm" data-test="add-50k-rows-btn" onClick={() => loadData(50000)}>
            50k rows
          </button>
          <button className="mx-1 btn btn-outline-secondary btn-sm" data-test="add-50k-rows-btn" onClick={() => loadData(500000)}>
            500k rows
          </button>
          <div className="mx-2">
            <label>data length: </label>
            <span id="dataLn">{dataLn}</span>
          </div>
          <button
            id="toggleSpans"
            className="ms-1 btn btn-outline-secondary btn-sm btn-icon mx-1"
            onClick={() => handleToggleSpans()}
            data-test="toggleSpans"
          >
            <span className="mdi mdi-flip-vertical"></span>
            <span>Toggle blue cell colspan &amp; rowspan</span>
          </button>
          <button
            id="scrollTo"
            className="ms-1 btn btn-outline-secondary btn-sm btn-icon"
            onClick={() => handleScrollTo()}
            data-test="scrollToBtn"
          >
            <span className="mdi mdi-arrow-down"></span>
            <span>Scroll To Row</span>
          </button>
          <div className="input-group input-group-sm ms-1" style={{ width: '100px' }}>
            <input
              value={scrollToRow}
              id="nRow"
              type="text"
              data-test="nbrows"
              className="form-control search-string"
              placeholder="search value"
              onInput={($event) => onScrollToRow(($event.target as HTMLInputElement).value)}
            />
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center"
              data-test="clearScrollTo"
              onClick={() => clearScrollTo()}
            >
              <span className="icon mdi mdi-close-thick"></span>
            </button>
          </div>
        </div>
      </section>

      <SlickgridReact
        gridId="grid44"
        columnDefinitions={columnDefinitions}
        gridOptions={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
}
