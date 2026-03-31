import { BindingEventService } from '@slickgrid-universal/binding';
import { Filters, Formatters, type Column, type GridOption, type Metrics } from '@slickgrid-universal/common';
import { SqlService, type SqlResult, type SqlServiceApi } from '@slickgrid-universal/sql';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example10.scss';
import '../material-styles.scss';

const defaultPageSize = 20;
const SQL_TABLE_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

export default class Example41 {
  private _bindingEventService: BindingEventService;
  columns: Column[];
  gridOptions: GridOption;
  dataset: any[] = [];
  metrics: Metrics;
  sgb: SlickVanillaGridBundle;
  processing = false;
  status = '';
  statusClass = 'is-success';
  serverWaitDelay = FAKE_SERVER_DELAY;
  sqlQuery = '';
  sqlService = new SqlService();

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  async attached() {
    this.initializeGrid();
    const gridContainerElm = document.querySelector('.grid41') as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    this._bindingEventService.bind(gridContainerElm, 'ongridstatechanged', this.handleOnGridStateChanged.bind(this));
    document.body.classList.add('material-theme');
  }

  clearAllFiltersAndSorts() {
    if (this.sgb?.gridService) {
      this.sgb.gridService.clearAllFiltersAndSorts();
    }
  }

  dispose() {
    if (this.sgb) {
      this.sgb?.dispose();
    }
    this._bindingEventService.unbindAll();
    document.body.classList.remove('material-theme');
    document.body.setAttribute('data-theme', 'light');
    document.querySelector('.demo-container')?.classList.remove('dark-mode');
  }

  initializeGrid() {
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
      enableAutoTooltip: true,
      autoTooltipOptions: {
        enableForHeaderCells: true,
      },
      gridHeight: 275,
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
          if (this.sgb) {
            this.sgb.dataset = this.dataset;
            this.sgb.slickGrid?.invalidate();
          }
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

  displaySpinner(isProcessing) {
    this.processing = isProcessing;
    this.status = isProcessing ? 'loading...' : 'finished!!';
    this.statusClass = isProcessing ? 'notification is-light is-warning' : 'notification is-light is-success';
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

  updateSqlQuery() {
    this.sqlQuery = this.sqlService.buildQuery();
    const pre = document.getElementById('sql-query');
    if (pre) {
      pre.textContent = this.sqlQuery;
    }
  }

  handleOnGridStateChanged(event) {
    if (event?.detail) {
      console.log('Grid State changed:: ', event.detail.change);
    }
  }

  setFiltersDynamically() {
    // Example: set some dynamic filters
    this.sgb?.filterService.updateFilters([
      { columnId: 'gender', searchTerms: ['female'], operator: 'EQ' },
      { columnId: 'name', searchTerms: ['Jane'], operator: 'StartsWith' },
      { columnId: 'company', searchTerms: ['acme'], operator: 'IN' },
      { columnId: 'billingAddressZip', searchTerms: ['11'], operator: '>=' },
      { columnId: 'finish', searchTerms: ['2026-01-01', '2026-02-15'], operator: 'RangeInclusive' },
    ]);
  }

  setSortingDynamically() {
    this.sgb?.sortService.updateSorting([
      { columnId: 'billingAddressZip', direction: 'DESC' },
      { columnId: 'company', direction: 'ASC' },
    ]);
  }

  resetToOriginalPresets() {
    this.sgb?.filterService.updateFilters([
      { columnId: 'gender', searchTerms: ['male'], operator: 'EQ' },
      { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
      { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },
      { columnId: 'finish', searchTerms: ['2026-01-01', '2026-02-15'], operator: 'RangeInclusive' },
    ]);
    this.sgb?.sortService.updateSorting([
      { columnId: 'name', direction: 'asc' },
      { columnId: 'company', direction: 'DESC' },
    ]);
    setTimeout(() => {
      this.sgb?.paginationService?.changeItemPerPage(20);
      this.sgb?.paginationService?.goToPageNumber(2);
    });
  }

  goToFirstPage() {
    this.sgb?.paginationService?.goToFirstPage();
  }

  goToLastPage() {
    this.sgb?.paginationService?.goToLastPage();
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    this.sgb?.gridOptions && (this.sgb.gridOptions.darkMode = !this.sgb.gridOptions.darkMode);
    this.sgb?.slickGrid?.setOptions({ darkMode: this.sgb?.gridOptions.darkMode });
  }
}
