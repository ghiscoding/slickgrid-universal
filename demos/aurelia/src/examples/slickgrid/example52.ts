import { BindingEventService } from '@slickgrid-universal/binding';
import { Filters, Formatters, type Column, type GridOption, type Metrics } from '@slickgrid-universal/common';
import { SqlService, type SqlServiceApi } from '@slickgrid-universal/sql-backend';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example10.scss';
import '../material-styles.scss';

const defaultPageSize = 20;
const SQL_TABLE_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

export default class Example52 {
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

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  async attached() {
    this.initializeGrid();
    const gridContainerElm = document.querySelector('.grid52') as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    this._bindingEventService.bind(gridContainerElm, 'ongridstatechanged', this.handleOnGridStateChanged.bind(this));
    document.body.classList.add('material-theme');
  }

  updateSqlQuery() {
    if (this.gridOptions?.backendServiceApi?.service) {
      this.sqlQuery = this.gridOptions.backendServiceApi.service.buildQuery();
      const pre = document.getElementById('sql-query');
      if (pre) pre.textContent = this.sqlQuery;
    }
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
            { value: '', label: '' },
            { value: 'acme', label: 'Acme' },
            { value: 'xyz', label: 'Company XYZ' },
          ],
        },
      },
      {
        id: 'finish',
        field: 'finish',
        name: 'Finish',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.compoundDate,
        },
        formatter: Formatters.dateIso,
      },
      {
        id: 'billingAddressZip',
        field: 'billingAddressZip',
        name: 'Billing Address Zip',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.input,
        },
      },
    ];

    this.gridOptions = {
      enableFiltering: true,
      enableSorting: true,
      enablePagination: true,
      backendServiceApi: {
        service: new SqlService(),
        options: {
          tableName: SQL_TABLE_NAME,
        },
        preProcess: () => {
          this.processing = true;
          this.status = 'processing...';
          this.statusClass = 'is-warning';
        },
        postProcess: (result) => {
          this.processing = false;
          this.status = 'finished';
          this.statusClass = 'is-success';
          this.updateSqlQuery();
        },
        process: (query) => {
          // Simulate server delay
          return new Promise((resolve) => setTimeout(() => resolve([]), this.serverWaitDelay));
        },
      } satisfies SqlServiceApi,
      pagination: {
        pageSizes: [10, 20, 30, 50, 100],
        pageSize: defaultPageSize,
      },
    };
  }
}
