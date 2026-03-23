import { Button, Dropdown, Option, type OptionOnSelectData } from '@fluentui/react-components';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { PdfExportService } from '@slickgrid-universal/pdf-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import React, { useEffect, useRef, useState } from 'react';
import {
  Aggregators,
  Filters,
  Formatters,
  GroupTotalFormatters,
  SlickgridReact,
  SortComparers,
  SortDirectionNumber,
  type Column,
  type GridOption,
  type Grouping,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import { baseFluentGridOption } from './base-fluent-grid-options.js';

const Example03: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [durationOrderByCount, setDurationOrderByCount] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const [draggableGroupingPlugin, setDraggableGroupingPlugin] = useState<any>(null);
  const [selectedGroupingFields, setSelectedGroupingFields] = useState(['', '', '']);
  const [excelExportService] = useState(new ExcelExportService());
  const [pdfExportService] = useState(new PdfExportService());
  const [textExportService] = useState(new TextExportService());

  useEffect(() => {
    defineGrid();
    setDataset(loadData(10_000));

    // reset to light mode before unmounting
    return () => {
      // document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columns: Column[] = [
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
          formatter: (g) => `Duration: ${g.value} <span class="text-primary">(${g.count} items)</span>`,
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
        deleteIconCssClass: 'fic fic-dismiss color-danger',
        sortAscIconCssClass: 'fic fic-arrow-up',
        sortDescIconCssClass: 'fic fic-arrow-down',
        onGroupChanged: (_e, args) => onGroupChanged(args),
        onExtensionRegistered: (extension) => setDraggableGroupingPlugin(extension),
        initialGroupBy: ['duration'],
      },
      darkMode,
      excelExportOptions: { sanitizeDataExport: true },
      textExportOptions: { sanitizeDataExport: true },
      pdfExportOptions: {
        repeatHeadersOnEachPage: true, // defaults to true
        documentTitle: 'Grouping Grid',
      },
      externalResources: [excelExportService, pdfExportService, textExportService],
      // -- NOTE: registered resources are auto-enabled
      // enableTextExport: true,
      // enablePdfExport: true,
      // enableExcelExport: true,
      ...baseFluentGridOption,
    };

    setColumns(columns);
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

  function changeSelectedGroupByField(data: OptionOnSelectData, index: number) {
    clearGrouping();
    dynamicallyChangeSelectGroupByValue(index, data.optionValue);
    updateSelectGroupFieldsArray(index, `${data.optionValue}`, () => groupByFieldName());
    draggableGroupingPlugin.setDroppedGroups(selectedGroupingFields.filter((c) => c));
  }

  /** Change the select dropdown group using pure JS */
  function dynamicallyChangeSelectGroupByValue(selectGroupIndex = 0, val = '') {
    // Update the selectedGroupingFields state directly
    const updatedFields = [...selectedGroupingFields];
    updatedFields[selectGroupIndex] = val;
    setSelectedGroupingFields(updatedFields);

    // Call your update function
    updateSelectGroupFieldsArray(selectGroupIndex, val);
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
      format: 'xlsx',
    });
  }

  function exportToPdf() {
    pdfExportService.exportToPdf({
      filename: 'Export',
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
      // document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
    } else {
      // document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    }
  }

  return !gridOptions ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 3: Draggable Grouping & Aggregators
        <Button size="small" className="ms-1" onClick={() => toggleDarkMode()} data-test="toggle-dark-mode">
          <i className="fic fic-dark-theme me-1"></i>
          <span>Toggle Dark Mode</span>
        </Button>
      </h2>

      <form className="form-inline" onSubmit={(e) => e.preventDefault()}>
        <Button size="small" className="btn-icon mx-1" data-test="add-5k-rows-btn" onClick={() => setData(5000)}>
          5K rows
        </Button>
        <Button size="small" className="btn-icon mx-1" data-test="add-50k-rows-btn" onClick={() => setData(50000)}>
          50K rows
        </Button>
        <Button size="small" className="btn-icon mx-1" data-test="clear-grouping-btn" onClick={() => clearGroupsAndSelects()}>
          <i className="fic fic-dismiss"></i> Clear grouping
        </Button>
        <Button size="small" className="btn-icon mx-1" data-test="collapse-all-btn" onClick={() => collapseAllGroups()}>
          <i className="fic fic-arrow-minimize"></i> Collapse all groups
        </Button>
        <Button size="small" className="btn-icon mx-1" data-test="expand-all-btn" onClick={() => expandAllGroups()}>
          <i className="fic fic-arrow-maximize"></i> Expand all groups
        </Button>
        <Button
          size="small"
          className="btn-icon mx-1"
          data-test="toggle-draggable-grouping-row"
          onClick={() => toggleDraggableGroupingRow()}
        >
          Toggle Draggable Grouping Row
        </Button>
        <Button size="small" className="btn-icon mx-1" onClick={() => exportToExcel()}>
          <i className="fic fic-arrow-download"></i> Export to Excel
        </Button>
        <Button size="small" className="btn-icon mx-1" onClick={() => exportToPdf()}>
          <i className="fic fic-arrow-download"></i> Export to PDF
        </Button>
        <Button
          size="small"
          className="btn-icon mx-1"
          data-test="group-duration-sort-value-btn"
          onClick={() => groupByDurationOrderByCount(false)}
        >
          Group by duration &amp; sort groups by value
        </Button>
        <Button
          size="small"
          className="btn-icon mx-1"
          data-test="group-duration-sort-count-btn"
          onClick={() => groupByDurationOrderByCount(true)}
        >
          Group by duration &amp; sort groups by count
        </Button>
        <Button size="small" className="btn-icon mx-1" data-test="group-duration-effort-btn" onClick={() => groupByDurationEffortDriven()}>
          Group by Duration then Effort-Driven
        </Button>
        <Button size="small" className="btn-icon mx-1" data-test="set-dynamic-filter" onClick={() => setFiltersDynamically()}>
          <span className="fic fic-filter"></span>
          <span>Set Filters Dynamically</span>
        </Button>
        <Button size="small" className="btn-icon mx-1" data-test="set-dynamic-sorting" onClick={() => setSortingDynamically()}>
          <span className="fic fic-sort-arrow-up"></span>
          <span>Set Sorting Dynamically</span>
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, minWidth: '150px' }}>Group by field(s)</label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {selectedGroupingFields.map((groupField, index) => (
              <Dropdown
                key={index}
                className={`select-group-${index}`}
                data-test="search-column-list"
                value={groupField}
                onOptionSelect={(event, data: OptionOnSelectData) => changeSelectedGroupByField(data, index)}
                style={{ minWidth: '200px' }}
              >
                {columns.map((column) => (
                  <Option value={column.id + ''} key={column.id}>
                    {column.name as string}
                  </Option>
                ))}
              </Dropdown>
            ))}
          </div>
        </div>
      </form>

      <div className="row mt-1 mb-1">
        <hr />
      </div>

      <SlickgridReact
        gridId="grid18"
        columns={columns}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default Example03;
