import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import {
  Aggregators,
  type AureliaGridInstance,
  type Column,
  FileType,
  Filters,
  Formatters,
  type GridOption,
  type GroupingGetterFunction,
  type Grouping,
  GroupTotalFormatters,
  SortComparers,
  SortDirectionNumber,
  type SlickDataView,
  type SlickGrid,
} from 'aurelia-slickgrid';

export class Example18 {
  private _darkMode = false;
  title = 'Example 18: Draggable Grouping & Aggregators';
  subTitle = `
  <ul>
  <li><a href="https://ghiscoding.gitbook.io/aurelia-slickgrid/grid-functionalities/grouping-aggregators" target="_blank">Wiki docs</a></li>
  <li>This example shows 3 ways of grouping</li>
  <ol>
  <li>Drag any Column Header on the top placeholder to group by that column (support moti-columns grouping by adding more columns to the drop area).</li>
  <li>Use buttons and defined functions to group by whichever field you want</li>
  <li>Use the Select dropdown to group, the position of the Selects represent the grouping level</li>
  </ol>
  <li>Fully dynamic and interactive multi-level grouping with filtering and aggregates ovor 50'000 items</li>
  <li>Each grouping level can have its own aggregates (over child rows, child groups, or all descendant rows)..</li>
  <li>Use "Aggregators" and "GroupTotalFormatters" directly from Aurelia-Slickgrid</li>
  </ul>
  `;

  aureliaGrid!: AureliaGridInstance;
  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  dataviewObj!: SlickDataView;
  draggableGroupingPlugin: any;
  durationOrderByCount = false;
  gridObj!: SlickGrid;
  gridOptions!: GridOption;
  hideSubTitle = false;
  processing = false;
  selectedGroupingFields: Array<string | GroupingGetterFunction> = ['', '', ''];
  excelExportService = new ExcelExportService();
  textExportService = new TextExportService();

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.loadData(500);
    this.defineGrid();
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
    this.gridObj = aureliaGrid.slickGrid; // grid object
    this.dataviewObj = aureliaGrid.dataView;
  }

  detaching() {
    document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
    document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
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
            return this.durationOrderByCount ? a.count - b.count : SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc);
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

    this.gridOptions = {
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
            this.clearGrouping();
          }
        },
      },
      draggableGrouping: {
        dropPlaceHolderText: 'Drop a column header here to group by the column',
        // groupIconCssClass: 'mdi mdi-drag-vertical',
        deleteIconCssClass: 'mdi mdi-close text-color-danger',
        sortAscIconCssClass: 'mdi mdi-arrow-up',
        sortDescIconCssClass: 'mdi mdi-arrow-down',
        onGroupChanged: (_e, args) => this.onGroupChanged(args),
        onExtensionRegistered: (extension) => (this.draggableGroupingPlugin = extension),
      },
      darkMode: this._darkMode,
      enableTextExport: true,
      enableExcelExport: true,
      excelExportOptions: { sanitizeDataExport: true },
      textExportOptions: { sanitizeDataExport: true },
      externalResources: [this.excelExportService, this.textExportService],
    };
  }

  loadData(rowCount: number) {
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
    this.dataset = tmpData;
  }

  clearGroupsAndSelects() {
    this.clearGroupingSelects();
    this.clearGrouping();
  }

  clearGroupingSelects() {
    this.selectedGroupingFields.forEach((_g, i) => (this.selectedGroupingFields[i] = ''));
    this.selectedGroupingFields = [...this.selectedGroupingFields]; // force dirty checking
  }

  clearGrouping(invalidateRows = true) {
    this.draggableGroupingPlugin?.clearDroppedGroups();
    if (invalidateRows) {
      this.gridObj?.invalidate(); // invalidate all rows and re-render
    }
  }

  collapseAllGroups() {
    this.dataviewObj.collapseAllGroups();
  }

  expandAllGroups() {
    this.dataviewObj.expandAllGroups();
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({
      filename: 'Export',
      format: FileType.xlsx,
    });
  }

  groupByDurationOrderByCount(sortedByCount = false) {
    this.durationOrderByCount = sortedByCount;
    this.clearGrouping(false);

    if (this.draggableGroupingPlugin?.setDroppedGroups) {
      this.showPreHeader();
      this.draggableGroupingPlugin.setDroppedGroups('duration');

      // you need to manually add the sort icon(s) in UI
      const sortColumns = sortedByCount ? [] : [{ columnId: 'duration', sortAsc: true }];
      this.gridObj?.setSortColumns(sortColumns);
      this.gridObj?.invalidate(); // invalidate all rows and re-render
    }
  }

  groupByDurationEffortDriven() {
    this.clearGrouping(false);
    if (this.draggableGroupingPlugin?.setDroppedGroups) {
      this.showPreHeader();
      this.draggableGroupingPlugin.setDroppedGroups(['duration', 'effortDriven']);
      this.gridObj?.invalidate(); // invalidate all rows and re-render
    }
  }

  groupByFieldName() {
    this.clearGrouping();
    if (this.draggableGroupingPlugin && this.draggableGroupingPlugin.setDroppedGroups) {
      this.showPreHeader();

      // get the field names from Group By select(s) dropdown, but filter out any empty fields
      const groupedFields = this.selectedGroupingFields.filter((g) => g !== '');
      if (groupedFields.length === 0) {
        this.clearGrouping();
      } else {
        this.draggableGroupingPlugin.setDroppedGroups(groupedFields);
      }
      this.gridObj.invalidate(); // invalidate all rows and re-render
    }
  }

  onGroupChanged(change: { caller?: string; groupColumns: Grouping[] }) {
    const caller = change?.caller ?? [];
    const groups = change?.groupColumns ?? [];

    if (Array.isArray(this.selectedGroupingFields) && Array.isArray(groups) && groups.length > 0) {
      // update all Group By select dropdown
      this.selectedGroupingFields.forEach((_g, i) => (this.selectedGroupingFields[i] = groups[i]?.getter ?? ''));
      this.selectedGroupingFields = [...this.selectedGroupingFields]; // force dirty checking
    } else if (groups.length === 0 && caller === 'remove-group') {
      this.clearGroupingSelects();
    }
  }

  showPreHeader() {
    this.gridObj.setPreHeaderPanelVisibility(true);
  }

  setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    this.aureliaGrid.filterService.updateFilters([
      { columnId: 'percentComplete', operator: '>=', searchTerms: ['55'] },
      { columnId: 'cost', operator: '<', searchTerms: ['80'] },
    ]);
  }

  setSortingDynamically() {
    this.aureliaGrid.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'percentComplete', direction: 'ASC' },
    ]);
  }

  toggleDraggableGroupingRow() {
    this.clearGroupsAndSelects();
    this.gridObj.setTopHeaderPanelVisibility(!this.gridObj.getOptions().showTopHeaderPanel);
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
    this.toggleBodyBackground();
    this.aureliaGrid.slickGrid?.setOptions({ darkMode: this._darkMode });
  }

  toggleBodyBackground() {
    if (this._darkMode) {
      document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
    } else {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    }
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
