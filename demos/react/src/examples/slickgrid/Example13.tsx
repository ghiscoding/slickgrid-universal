import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import {
  Aggregators,
  type Column,
  FileType,
  Filters,
  Formatters,
  type GridOption,
  type Grouping,
  GroupTotalFormatters,
  SortDirectionNumber,
  SortComparers,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import React, { useEffect, useRef, useState } from 'react';

const Example13: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>(loadData(500));
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const [processing, setProcessing] = useState(false);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const excelExportService = new ExcelExportService();
  const textExportService = new TextExportService();

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    // add a simple button with event listener on 1st column for testing purposes
    // a simple button with click event
    const nameElementColumn1 = document.createElement('div');
    const btn = document.createElement('button');
    const btnLabel = document.createElement('span');
    btnLabel.className = 'mdi mdi-help-circle no-padding';
    btn.dataset.test = 'col1-hello-btn';
    btn.className = 'btn btn-outline-secondary btn-xs btn-icon ms-1';
    btn.textContent = 'Click me';
    btn.title = 'simple column header test with a button click listener';
    btn.addEventListener('click', () => alert('Hello World'));
    btn.appendChild(btnLabel);
    nameElementColumn1.appendChild(document.createTextNode('Id '));
    nameElementColumn1.appendChild(btn);

    const columnDefinitions: Column[] = [
      {
        id: 'sel',
        name: nameElementColumn1,
        field: 'num',
        type: 'number',
        columnPickerLabel: 'Custom Label', // add a custom label for the ColumnPicker/GridMenu when default header value extractor doesn't work for you ()
        width: 140,
        maxWidth: 150,
        excludeFromExport: true,
        resizable: true,
        filterable: true,
        selectable: false,
        focusable: false,
      },
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        width: 50,
        minWidth: 50,
        cssClass: 'cell-title',
        filterable: true,
        sortable: true,
      },
      {
        id: 'duration',
        name: 'Duration',
        field: 'duration',
        minWidth: 50,
        width: 60,
        filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
        sortable: true,
        type: 'number',
        groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        params: { groupFormatterPrefix: 'Total: ' },
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 70,
        width: 90,
        formatter: Formatters.percentCompleteBar,
        filterable: true,
        filter: { model: Filters.compoundSlider },
        sortable: true,
        type: 'number',
        groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
        params: { groupFormatterPrefix: '<i>Avg</i>: ' },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        minWidth: 60,
        maxWidth: 130,
        filterable: true,
        filter: { model: Filters.compoundDate },
        sortable: true,
        type: 'dateIso',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        minWidth: 60,
        maxWidth: 130,
        filterable: true,
        filter: { model: Filters.compoundDate },
        sortable: true,
        type: 'dateIso',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
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
        formatter: Formatters.currency,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsCurrency,
        params: {
          displayNegativeNumberWithParentheses: true,
          currencyPrefix: '€',
          groupFormatterCurrencyPrefix: '€',
          minDecimal: 2,
          maxDecimal: 4,
          groupFormatterPrefix: '<b>Total</b>: ',
        },
        excelExportOptions: {
          style: {
            font: { outline: true, italic: true },
            format: '€0.00##;[Red](€0.00##)',
          },
          width: 18,
        },
        groupTotalsExcelExportOptions: {
          style: {
            alignment: { horizontal: 'center' },
            font: { bold: true, color: 'FF005289', underline: 'single', fontName: 'Consolas', size: 10 },
            fill: { type: 'pattern', patternType: 'solid', fgColor: 'FFE6F2F6' },
            border: {
              top: { color: 'FFa500ff', style: 'thick' },
              left: { color: 'FFa500ff', style: 'medium' },
              right: { color: 'FFa500ff', style: 'dotted' },
              bottom: { color: 'FFa500ff', style: 'double' },
            },
            format: '"Total: "€0.00##;[Red]"Total: "(€0.00##)',
          },
        },
      },
      {
        id: 'effortDriven',
        name: 'Effort Driven',
        minWidth: 30,
        width: 80,
        maxWidth: 90,
        cssClass: 'cell-effort-driven',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
        sortable: true,
        filterable: true,
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

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      // you could debounce/throttle the input text filter if you have lots of data
      // filterTypingDebounce: 250,
      enableGrouping: true,
      enableExcelExport: true,
      enableTextExport: true,
      excelExportOptions: { sanitizeDataExport: true },
      textExportOptions: { sanitizeDataExport: true },
      externalResources: [excelExportService, textExportService],
      showCustomFooter: true,
      customFooterOptions: {
        // optionally display some text on the left footer container
        hideMetrics: false,
        hideTotalItemCount: false,
        hideLastUpdateTimestamp: false,
      },
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function loadData(rowCount: number) {
    // mock a dataset
    const dataset: any[] = [];
    for (let i = 0; i < rowCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = i % 33 === 0 ? null : Math.round(Math.random() * 10000) / 100;

      dataset[i] = {
        id: 'id_' + i,
        num: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        cost: i % 3 ? randomCost : randomCost !== null ? -randomCost : null,
        effortDriven: i % 5 === 0,
      };
    }

    return dataset;
  }

  function updateData(rowCount: number) {
    setDataset(loadData(rowCount));
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

  function exportToExcel() {
    excelExportService.exportToExcel({
      filename: 'Export',
      format: FileType.xlsx,
    });
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

  function groupByDurationOrderByCount(aggregateCollapsed: boolean) {
    reactGridRef.current?.filterService.setSortColumnIcons([]);
    reactGridRef.current?.dataView.setGrouping({
      getter: 'duration',
      formatter: (g) => `Duration: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      comparer: (a, b) => {
        return a.count - b.count;
      },
      aggregators: [new Aggregators.Avg('percentComplete'), new Aggregators.Sum('cost')],
      aggregateCollapsed,
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
        formatter: (g) => `Duration: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
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

  function groupByDurationEffortDrivenPercent() {
    // you need to manually add the sort icon(s) in UI
    const sortColumns = [
      { columnId: 'duration', sortAsc: true },
      { columnId: 'effortDriven', sortAsc: true },
      { columnId: 'percentComplete', sortAsc: true },
    ];
    reactGridRef.current?.filterService.setSortColumnIcons(sortColumns);
    reactGridRef.current?.dataView.setGrouping([
      {
        getter: 'duration',
        formatter: (g) => `Duration: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        aggregateCollapsed: true,
        lazyTotalsCalculation: true,
      },
      {
        getter: 'effortDriven',
        formatter: (g) => `Effort-Driven: ${g.value ? 'True' : 'False'}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Sum('duration'), new Aggregators.Sum('cost')],
        lazyTotalsCalculation: true,
      },
      {
        getter: 'percentComplete',
        formatter: (g) => `% Complete: ${g.value}  <span style="color:green">(${g.count} items)</span>`,
        aggregators: [new Aggregators.Avg('percentComplete')],
        aggregateCollapsed: true,
        collapsed: true,
        lazyTotalsCalculation: true,
      },
    ] as Grouping[]);
    reactGridRef.current?.slickGrid.invalidate(); // invalidate all rows and re-render
  }

  function changeProcessing(isProcessing: boolean) {
    setProcessing(isProcessing);
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
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 13: Grouping & Aggregators
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example13.tsx"
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
        <ul>
          <li>
            <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/grouping-aggregators" target="_blank">
              Docs
            </a>
          </li>
          <li>Fully dynamic and interactive multi-level grouping with filtering and aggregates over 50'000 items</li>
          <li>Each grouping level can have its own aggregates (over child rows, child groups, or all descendant rows)..</li>
          <li>Use "Aggregators" and "GroupTotalFormatters" directly from Slickgrid-React</li>
        </ul>
      </div>

      <div className="row">
        <div className="col-sm-12">
          <button className="btn btn-outline-secondary btn-xs btn-icon" data-test="add-500-rows-btn" onClick={() => updateData(500)}>
            500 rows
          </button>
          <button className="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="add-50k-rows-btn" onClick={() => updateData(50000)}>
            50k rows
          </button>
          <button className="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="clear-grouping-btn" onClick={() => clearGrouping()}>
            <i className="mdi mdi-close"></i> Clear grouping
          </button>
          <button
            className="btn btn-outline-secondary btn-xs btn-icon mx-1"
            data-test="collapse-all-btn"
            onClick={() => collapseAllGroups()}
          >
            <i className="mdi mdi-arrow-collapse"></i> Collapse all groups
          </button>
          <button className="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="expand-all-btn" onClick={() => expandAllGroups()}>
            <i className="mdi mdi-arrow-expand"></i> Expand all groups
          </button>
          <button className="btn btn-outline-secondary btn-xs btn-icon" data-test="export-excel-btn" onClick={() => exportToExcel()}>
            <i className="mdi mdi-file-excel-outline text-success"></i> Export to Excel
          </button>
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col-sm-12">
          <button
            className="btn btn-outline-secondary btn-xs btn-icon"
            data-test="group-duration-sort-value-btn"
            onClick={() => groupByDuration()}
          >
            Group by Duration &amp; sort groups by value
          </button>
          <button
            className="btn btn-outline-secondary btn-xs btn-icon mx-1"
            data-test="group-duration-sort-count-btn"
            onClick={() => groupByDurationOrderByCount(false)}
          >
            Group by Duration &amp; sort groups by count
          </button>
        </div>
        <div className="row">
          <div className="col-sm-12">
            <button
              className="btn btn-outline-secondary btn-xs btn-icon mx-1"
              data-test="group-duration-sort-count-collapse-btn"
              onClick={() => groupByDurationOrderByCount(true)}
            >
              Group by Duration &amp; sort groups by count, aggregate collapsed
            </button>
            <button
              className="btn btn-outline-secondary btn-xs btn-icon mx-1"
              data-test="group-duration-effort-btn"
              onClick={() => groupByDurationEffortDriven()}
            >
              Group by Duration then Effort-Driven
            </button>
            <button
              className="btn btn-outline-secondary btn-xs btn-icon"
              data-test="group-duration-effort-percent-btn"
              onClick={() => groupByDurationEffortDrivenPercent()}
            >
              Group by Duration then Effort-Driven then Percent.
            </button>
            {processing && (
              <span>
                <i className="mdi mdi-sync mdi-spin"></i>
              </span>
            )}
          </div>
        </div>
      </div>

      <SlickgridReact
        gridId="grid13"
        columns={columnDefinitions}
        options={gridOptions!}
        dataset={dataset}
        onBeforeExportToExcel={() => changeProcessing(true)}
        onAfterExportToExcel={() => changeProcessing(false)}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default Example13;
