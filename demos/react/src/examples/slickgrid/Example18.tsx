import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import {
  Aggregators,
  type Column,
  FileType,
  Filters,
  Formatters,
  type GridOption,
  GroupTotalFormatters,
  SortComparers,
  SortDirectionNumber,
  type Grouping,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import React, { useEffect, useRef, useState } from 'react';

const Example18: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [durationOrderByCount, setDurationOrderByCount] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const [draggableGroupingPlugin, setDraggableGroupingPlugin] = useState<any>(null);
  const [selectedGroupingFields, setSelectedGroupingFields] = useState(['', '', '']);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const excelExportService = new ExcelExportService();
  const textExportService = new TextExportService();

  useEffect(() => {
    defineGrid();
    setDataset(loadData(500));

    // reset to light mode before unmounting
    return () => {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        columnGroup: 'Common Factor',
        width: 70,
        minWidth: 50,
        cssClass: 'cell-title',
        filterable: true,
        sortable: true,
        grouping: {
          getter: 'title',
          formatter: (g) => `Title: ${g.value}  <span class="text-primary">(${g.count} items)</span>`,
          aggregators: [new Aggregators.Sum('cost')],
          aggregateCollapsed: false,
          collapsed: false,
        },
      },
      {
        id: 'duration',
        name: 'Duration',
        field: 'duration',
        columnGroup: 'Common Factor',
        width: 70,
        sortable: true,
        filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
        type: 'number',
        groupTotalsFormatter: GroupTotalFormatters.sumTotals,
        grouping: {
          getter: 'duration',
          formatter: (g) => `Duration: ${g.value}  <span class="text-primary">(${g.count} items)</span>`,
          comparer: (a, b) => {
            return durationOrderByCount ? a.count - b.count : SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc);
          },
          aggregators: [new Aggregators.Sum('cost')],
          aggregateCollapsed: false,
          collapsed: false,
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        columnGroup: 'Period',
        minWidth: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
        type: 'dateUtc',
        outputType: 'dateIso',
        exportWithFormatter: true,
        grouping: {
          getter: 'start',
          formatter: (g) => `Start: ${g.value}  <span class="text-primary">(${g.count} items)</span>`,
          aggregators: [new Aggregators.Sum('cost')],
          aggregateCollapsed: false,
          collapsed: false,
        },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        columnGroup: 'Period',
        minWidth: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
        type: 'dateUtc',
        outputType: 'dateIso',
        exportWithFormatter: true,
        grouping: {
          getter: 'finish',
          formatter: (g) => `Finish: ${g.value} <span class="text-primary">(${g.count} items)</span>`,
          aggregators: [new Aggregators.Sum('cost')],
          aggregateCollapsed: false,
          collapsed: false,
        },
      },
      {
        id: 'cost',
        name: 'Cost',
        field: 'cost',
        columnGroup: 'Analysis',
        width: 90,
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundInput },
        formatter: Formatters.dollar,
        exportWithFormatter: true,
        groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
        type: 'number',
        grouping: {
          getter: 'cost',
          formatter: (g) => `Cost: ${g.value} <span class="text-primary">(${g.count} items)</span>`,
          aggregators: [new Aggregators.Sum('cost')],
          aggregateCollapsed: true,
          collapsed: true,
        },
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        columnGroup: 'Analysis',
        minWidth: 70,
        width: 90,
        formatter: Formatters.percentCompleteBar,
        type: 'number',
        filterable: true,
        filter: { model: Filters.compoundSlider },
        sortable: true,
        groupTotalsFormatter: GroupTotalFormatters.avgTotalsPercentage,
        grouping: {
          getter: 'percentComplete',
          formatter: (g) => `% Complete: ${g.value}  <span class="text-primary">(${g.count} items)</span>`,
          aggregators: [new Aggregators.Sum('cost')],
          aggregateCollapsed: false,
          collapsed: false,
        },
        params: { groupFormatterPrefix: '<i>Avg</i>: ' },
      },
      {
        id: 'effortDriven',
        name: 'Effort-Driven',
        field: 'effortDriven',
        columnGroup: 'Analysis',
        width: 80,
        minWidth: 20,
        maxWidth: 100,
        cssClass: 'cell-effort-driven',
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
        formatter: Formatters.checkmarkMaterial,
        grouping: {
          getter: 'effortDriven',
          formatter: (g) => `Effort-Driven: ${g.value ? 'True' : 'False'} <span class="text-primary">(${g.count} items)</span>`,
          aggregators: [new Aggregators.Sum('cost')],
          collapsed: false,
        },
      },
    ];

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableDraggableGrouping: true,

      // pre-header will include our Header Grouping (i.e. "Common Factor")
      // Draggable Grouping could be located in either the Pre-Header OR the new Top-Header
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 30,

      // when Top-Header is created, it will be used by the Draggable Grouping (otherwise the Pre-Header will be used)
      createTopHeaderPanel: true,
      showTopHeaderPanel: true,
      topHeaderPanelHeight: 35,

      showCustomFooter: true,
      enableFiltering: true,
      // you could debounce/throttle the input text filter if you have lots of data
      // filterTypingDebounce: 250,
      enableSorting: true,
      enableColumnReorder: true,
      gridMenu: {
        onCommand: (_e, args) => {
          if (args.command === 'toggle-preheader') {
            // in addition to the grid menu pre-header toggling (internally), we will also clear grouping
            clearGrouping();
          }
        },
      },
      draggableGrouping: {
        dropPlaceHolderText: 'Drop a column header here to group by the column',
        // groupIconCssClass: 'mdi mdi-drag-vertical',
        deleteIconCssClass: 'mdi mdi-close text-color-danger',
        sortAscIconCssClass: 'mdi mdi-arrow-up',
        sortDescIconCssClass: 'mdi mdi-arrow-down',
        onGroupChanged: (_e, args) => onGroupChanged(args),
        onExtensionRegistered: (extension) => {
          setDraggableGroupingPlugin(extension);
        },
      },
      darkMode,
      enableTextExport: true,
      enableExcelExport: true,
      excelExportOptions: { sanitizeDataExport: true },
      textExportOptions: { sanitizeDataExport: true },
      externalResources: [excelExportService, textExportService],
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function loadData(rowCount: number) {
    // mock a dataset
    const tmpData: any[] = [];
    for (let i = 0; i < rowCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomCost = Math.round(Math.random() * 10000) / 100;

      tmpData[i] = {
        id: 'id_' + i,
        num: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        cost: i % 33 === 0 ? -randomCost : randomCost,
        effortDriven: i % 5 === 0,
      };
    }
    return tmpData;
  }

  function setData(rowCount: number) {
    setDataset(loadData(rowCount));
  }

  function clearGroupsAndSelects() {
    clearGroupingSelects();
    clearGrouping();
  }

  function clearGroupingSelects() {
    selectedGroupingFields.forEach((_g, i) => (selectedGroupingFields[i] = ''));
    setSelectedGroupingFields(['', '', '']); // force dirty checking

    // reset all select dropdown using JS
    selectedGroupingFields.forEach((_val, index) => dynamicallyChangeSelectGroupByValue(index, ''));
  }

  function changeSelectedGroupByField(e: React.ChangeEvent<HTMLSelectElement>, index: number) {
    const val = (e.target as HTMLSelectElement).value;
    updateSelectGroupFieldsArray(index, val, () => groupByFieldName());
  }

  /** Change the select dropdown group using pure JS */
  function dynamicallyChangeSelectGroupByValue(selectGroupIndex = 0, val = '') {
    const selectElm = document.querySelector<HTMLSelectElement>(`.select-group-${selectGroupIndex}`);
    if (selectElm) {
      selectElm.selectedIndex = Array.from(selectElm.options).findIndex((o) => o.value === val);
      updateSelectGroupFieldsArray(selectGroupIndex, val);
    }
  }

  /** update grouping field array React state */
  function updateSelectGroupFieldsArray(index: number, val: string, _setStateCallback?: () => void) {
    const tmpSelectedGroupingFields = selectedGroupingFields;
    tmpSelectedGroupingFields[index] = val;
    setSelectedGroupingFields([...tmpSelectedGroupingFields]); // force dirty checking
  }

  function clearGrouping(invalidateRows = true) {
    draggableGroupingPlugin?.clearDroppedGroups();
    if (invalidateRows) {
      reactGridRef.current?.slickGrid.invalidate(); // invalidate all rows and re-render
    }
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

  function groupByDurationOrderByCount(sortedByCount = false) {
    setDurationOrderByCount(sortedByCount);
    clearGrouping(false);

    if (draggableGroupingPlugin?.setDroppedGroups) {
      showPreHeader();
      draggableGroupingPlugin.setDroppedGroups('duration');

      // you need to manually add the sort icon(s) in UI
      const sortColumns = sortedByCount ? [] : [{ columnId: 'duration', sortAsc: true }];
      reactGridRef.current?.slickGrid.setSortColumns(sortColumns);
      reactGridRef.current?.slickGrid.invalidate(); // invalidate all rows and re-render
    }
  }

  function groupByDurationEffortDriven() {
    clearGrouping(false);
    if (draggableGroupingPlugin?.setDroppedGroups) {
      showPreHeader();
      draggableGroupingPlugin.setDroppedGroups(['duration', 'effortDriven']);
      reactGridRef.current?.slickGrid.invalidate(); // invalidate all rows and re-render
    }
  }

  function groupByFieldName() {
    clearGrouping();
    if (draggableGroupingPlugin?.setDroppedGroups) {
      showPreHeader();

      // get the field names from Group By select(s) dropdown, but filter out any empty fields
      const groupedFields = selectedGroupingFields.filter((g) => g !== '');
      if (groupedFields.length === 0) {
        clearGrouping();
      } else {
        draggableGroupingPlugin.setDroppedGroups(groupedFields);
      }
      reactGridRef.current?.slickGrid.invalidate(); // invalidate all rows and re-render
    }
  }

  function onGroupChanged(change: { caller?: string; groupColumns: Grouping[] }) {
    const caller = change?.caller ?? [];
    const groups = change?.groupColumns ?? [];
    const tmpSelectedGroupingFields = selectedGroupingFields;

    if (Array.isArray(tmpSelectedGroupingFields) && Array.isArray(groups) && groups.length > 0) {
      // update all Group By select dropdown
      tmpSelectedGroupingFields.forEach((_g, i) => (tmpSelectedGroupingFields[i] = (groups[i]?.getter ?? '') as string));
      setSelectedGroupingFields([...tmpSelectedGroupingFields]);

      // use JS to change select dropdown value
      // TODO: this should be removed in the future and only use setState
      tmpSelectedGroupingFields.forEach((val, index) => dynamicallyChangeSelectGroupByValue(index, val as string));
    } else if (groups.length === 0 && caller === 'remove-group') {
      clearGroupingSelects();
    }
  }

  function showPreHeader() {
    reactGridRef.current?.slickGrid.setPreHeaderPanelVisibility(true);
  }

  function setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    reactGridRef.current?.filterService.updateFilters([
      { columnId: 'percentComplete', operator: '>=', searchTerms: ['55'] },
      { columnId: 'cost', operator: '<', searchTerms: ['80'] },
    ]);
  }

  function setSortingDynamically() {
    reactGridRef.current?.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'percentComplete', direction: 'ASC' },
    ]);
  }

  function toggleDraggableGroupingRow() {
    clearGroupsAndSelects();
    reactGridRef.current?.slickGrid.setTopHeaderPanelVisibility(!reactGridRef.current?.slickGrid.getOptions().showTopHeaderPanel);
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
        Example 18: Draggable Grouping & Aggregators
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example18.tsx"
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
        <ul>
          <li>
            This example shows 3 ways of grouping{' '}
            <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/grouping-aggregators" target="_blank">
              Docs
            </a>
          </li>
          <ol>
            <li>
              Drag any Column Header on the top placeholder to group by that column (support moti-columns grouping by adding more columns to
              the drop area).
            </li>
            <li>Use buttons and defined functions to group by whichever field you want</li>
            <li>Use the Select dropdown to group, the position of the Selects represent the grouping level</li>
          </ol>
          <li>Fully dynamic and interactive multi-level grouping with filtering and aggregates ovor 50'000 items</li>
          <li>Each grouping level can have its own aggregates (over child rows, child groups, or all descendant rows)..</li>
          <li>Use "Aggregators" and "GroupTotalFormatters" directly from Slickgrid-React</li>
        </ul>
      </div>

      <form className="form-inline" onSubmit={(e) => e.preventDefault()}>
        <div className="row">
          <div className="col-sm-12">
            <button className="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="add-500-rows-btn" onClick={() => setData(500)}>
              500 rows
            </button>
            <button className="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="add-50k-rows-btn" onClick={() => setData(50000)}>
              50k rows
            </button>
            <button
              className="btn btn-outline-secondary btn-xs btn-icon mx-1"
              data-test="clear-grouping-btn"
              onClick={() => clearGroupsAndSelects()}
            >
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
            <button
              className="btn btn-outline-secondary btn-xs btn-icon mx-1"
              data-test="toggle-draggable-grouping-row"
              onClick={() => toggleDraggableGroupingRow()}
            >
              Toggle Draggable Grouping Row
            </button>
            <button className="btn btn-outline-secondary btn-xs btn-icon mx-1" onClick={() => exportToExcel()}>
              <i className="mdi mdi-file-excel-outline text-success"></i> Export to Excel
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12">
            <button
              className="btn btn-outline-secondary btn-xs btn-icon mx-1"
              data-test="group-duration-sort-value-btn"
              onClick={() => groupByDurationOrderByCount(false)}
            >
              Group by duration &amp; sort groups by value
            </button>
            <button
              className="btn btn-outline-secondary btn-xs btn-icon mx-1"
              data-test="group-duration-sort-count-btn"
              onClick={() => groupByDurationOrderByCount(true)}
            >
              Group by duration &amp; sort groups by count
            </button>
            <button
              className="btn btn-outline-secondary btn-xs btn-icon mx-1"
              data-test="group-duration-effort-btn"
              onClick={() => groupByDurationEffortDriven()}
            >
              Group by Duration then Effort-Driven
            </button>
            <button
              className="btn btn-outline-secondary btn-xs btn-icon mx-1"
              data-test="set-dynamic-filter"
              onClick={() => setFiltersDynamically()}
            >
              <span className="mdi mdi-filter-outline"></span>
              <span>Set Filters Dynamically</span>
            </button>
            <button
              className="btn btn-outline-secondary btn-xs btn-icon mx-1"
              data-test="set-dynamic-sorting"
              onClick={() => setSortingDynamically()}
            >
              <span className="mdi mdi-sort-ascending"></span>
              <span>Set Sorting Dynamically</span>
            </button>
          </div>
        </div>

        <div className="row mt-2">
          <div className="col-sm-12">
            <div className="form-row">
              <div className="row form-group">
                <label htmlFor="field1" className="col-sm-3 mb-2">
                  Group by field(s)
                </label>
                {selectedGroupingFields.map((groupField, index) => (
                  <div className="form-group col-md-3 grouping-selects" key={index}>
                    <select
                      className={`form-select select-group-${index}`}
                      data-test="search-column-list"
                      onChange={($event) => changeSelectedGroupByField($event, index)}
                    >
                      <option value="''">...</option>
                      {columnDefinitions.map((column) => (
                        <option value={column.id} key={column.id}>
                          {column.name as string}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="row mt-1 mb-1">
        <hr />
      </div>

      <SlickgridReact
        gridId="grid18"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default Example18;
