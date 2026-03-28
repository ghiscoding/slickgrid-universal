import { SqlService, type SqlResult, type SqlServiceApi } from '@slickgrid-universal/sql-backend';
import { AureliaGridInstance, Filters, Formatters, Metrics, type Column, type GridOption } from 'aurelia-slickgrid';
import './example10.scss';

const defaultPageSize = 20;
const SQL_TABLE_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

export default class Example52 {
  aureliaGrid!: AureliaGridInstance;
  columns: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];
  hideSubTitle = false;
  metrics?: Metrics;
  processing = false;
  status = { text: '', class: '' };
  serverWaitDelay = FAKE_SERVER_DELAY;
  sqlQuery = '';
  sqlService = new SqlService();

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  dispose() {
    if (this.aureliaGrid) {
      this.aureliaGrid?.dispose();
    }
  }

  defineGrid() {
    this.columns = [
      {
        id: 'name',
        field: 'name',
        name: 'Name',
        width: 60,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.compoundInput,
        },
      },
      {
        id: 'gender',
        field: 'gender',
        name: 'Gender',
        filterable: true,
        sortable: true,
        width: 60,
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ],
        },
      },
      {
        id: 'company',
        field: 'company',
        name: 'Company',
        width: 60,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.multipleSelect,
          collection: [
            { value: 'acme', label: 'Acme' },
            { value: 'abc', label: 'Company ABC' },
            { value: 'xyz', label: 'Company XYZ' },
          ],
        },
      },
      {
        id: 'billingAddressStreet',
        field: 'billingAddressStreet',
        name: 'Billing Street',
        formatter: Formatters.complexObject,
        width: 60,
        filterable: true,
        sortable: true,
      },
      {
        id: 'billingAddressZip',
        field: 'billingAddressZip',
        name: 'Billing Zip',
        width: 60,
        type: 'number',
        filterable: true,
        sortable: true,
        filter: {
          model: Filters.compoundInput,
        },
        formatter: Formatters.multiple,
        params: { formatters: [Formatters.complexObject] },
      },
      {
        id: 'finish',
        field: 'finish',
        name: 'Date',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 90,
        width: 120,
        exportWithFormatter: true,
        type: 'date',
        filterable: true,
        filter: {
          model: Filters.dateRange,
        },
      },
    ];

    this.gridOptions = {
      gridHeight: 200,
      gridWidth: 900,
      enableFiltering: true,
      enableCellNavigation: true,
      gridMenu: {
        resizeOnShowHeaderRow: true,
      },
      enablePagination: true,
      pagination: {
        pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100],
        pageSize: defaultPageSize,
        totalItems: 100, // ensure pagination is enabled initially
      },
      presets: {
        columns: [
          { columnId: 'name', width: 100 },
          { columnId: 'gender', width: 55 },
          { columnId: 'company' },
          { columnId: 'billingAddressZip' },
          { columnId: 'billingAddressStreet', width: 120 },
          { columnId: 'finish', width: 130 },
        ],
        filters: [
          { columnId: 'gender', searchTerms: ['male'], operator: 'EQ' },
          { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
          { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },
          { columnId: 'finish', searchTerms: ['2026-01-01', '2026-02-15'], operator: 'RangeInclusive' },
        ],
        sorters: [
          { columnId: 'name', direction: 'asc' },
          { columnId: 'company', direction: 'DESC' },
        ],
        pagination: { pageNumber: 2, pageSize: 20 },
      },
      backendServiceApi: {
        service: this.sqlService,
        options: {
          tableName: SQL_TABLE_NAME,
        },
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (result) => {
          this.metrics = result.metrics as Metrics;
          this.dataset = result.data;
          // update pagination totalItems to reflect backend total count
          if (this.gridOptions.pagination) {
            this.gridOptions.pagination.totalItems = result.metrics?.totalItemCount ?? 0;
          }
          this.aureliaGrid.slickGrid?.invalidate();
          this.displaySpinner(false);
          this.updateSqlQuery();
        },
      } satisfies SqlServiceApi<{
        id: number;
        name: string;
        gender: string;
        company: string;
        billingAddressZip: string;
        finish: string;
        totalCount: number;
      }>,
    };
  }

  displaySpinner(isProcessing: boolean) {
    this.processing = isProcessing;
    this.status = isProcessing
      ? { text: 'processing...', class: 'alert alert-danger' }
      : { text: 'finished', class: 'alert alert-success' };
  }

  getCustomerApiCall(
    _query: string
  ): Promise<
    SqlResult<{ id: number; name: string; gender: string; company: string; billingAddressZip: string; finish: string; totalCount: number }>
  > {
    // Simulate a backend call with no matching data, but totalCount for pagination
    const totalCount = 100;
    const now = new Date();
    const mockedResult = {
      data: [],
      metrics: {
        startTime: now,
        endTime: now,
        executionTime: 0,
        itemCount: 0,
        totalItemCount: totalCount,
      },
    };
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockedResult);
      }, this.serverWaitDelay);
    });
  }

  goToFirstPage() {
    this.aureliaGrid.paginationService!.goToFirstPage();
  }

  goToLastPage() {
    this.aureliaGrid.paginationService!.goToLastPage();
  }

  clearAllFiltersAndSorts() {
    if (this.aureliaGrid?.gridService) {
      this.aureliaGrid.gridService.clearAllFiltersAndSorts();
    }
  }

  /** Save current Filters, Sorters in LocaleStorage or DB */
  saveCurrentGridState() {
    console.log('GraphQL current grid state', this.aureliaGrid.gridStateService.getCurrentGridState());
  }

  setFiltersDynamically() {
    const currentYear = new Date().getFullYear();
    const presetLowestDay = `${currentYear}-01-01`;
    const presetHighestDay = `${currentYear}-02-15`;

    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    this.aureliaGrid.filterService.updateFilters([
      { columnId: 'gender', searchTerms: ['female'], operator: '=' },
      { columnId: 'name', searchTerms: ['Jane'], operator: 'StartsWith' },
      { columnId: 'company', searchTerms: ['acme'], operator: 'IN' },
      { columnId: 'billingAddressZip', searchTerms: ['11'], operator: '>=' },
      { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
    ]);
  }

  setSortingDynamically() {
    this.aureliaGrid.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'billingAddressZip', direction: 'DESC' },
      { columnId: 'company', direction: 'ASC' },
    ]);
  }

  resetToOriginalPresets() {
    const currentYear = new Date().getFullYear();
    const presetLowestDay = `${currentYear}-01-01`;
    const presetHighestDay = `${currentYear}-02-15`;

    this.aureliaGrid.filterService.updateFilters([
      // you can use OperatorType or type them as string, e.g.: operator: 'EQ'
      { columnId: 'gender', searchTerms: ['male'], operator: '=' },
      // { columnId: 'name', searchTerms: ['John Doe'], operator:  'Contains' },
      { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
      { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },

      // use a date range with 2 searchTerms values
      { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
    ]);

    this.aureliaGrid.sortService.updateSorting([
      // direction can written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
      { columnId: 'name', direction: 'asc' },
      { columnId: 'company', direction: 'DESC' },
    ]);

    setTimeout(() => {
      this.aureliaGrid.paginationService?.changeItemPerPage(20);
      this.aureliaGrid.paginationService?.goToPageNumber(2);
    });
  }

  updateSqlQuery() {
    if (this.sqlService) {
      this.sqlQuery = this.sqlService.buildQuery();
    }
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
