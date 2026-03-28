import { ChangeDetectorRef, Component, inject, signal, type OnDestroy, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SqlService, type SqlServiceApi, type SqlServiceOption } from '@slickgrid-universal/sql-backend';
import type { Subscription } from 'rxjs';
import {
  AngularSlickgridComponent,
  Filters,
  Formatters,
  unsubscribeAllObservables,
  type AngularGridInstance,
  type Column,
  type GridOption,
  type Metrics,
} from '../../library';

const defaultPageSize = 20;
const SQL_TABLE_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

@Component({
  templateUrl: './example52.component.html',
  imports: [AngularSlickgridComponent, FormsModule],
})
export class Example52Component implements OnInit, OnDestroy {
  private readonly cd = inject(ChangeDetectorRef);
  private subscriptions: Subscription[] = [];
  angularGrid!: AngularGridInstance;
  columns!: Column[];
  gridOptions!: GridOption;
  dataset = [];
  metrics = signal<Metrics | undefined>(undefined);
  hideSubTitle = false;
  sqlQuery = '';
  processing = signal(true);
  status = signal({ text: 'processing...', class: 'alert alert-danger' });
  serverWaitDelay = FAKE_SERVER_DELAY;

  ngOnDestroy() {
    unsubscribeAllObservables(this.subscriptions);
  }

  ngOnInit(): void {
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
        } as SqlServiceOption,
        preProcess: () => {
          this.processing.set(true);
          this.status.set({ text: 'processing...', class: 'alert alert-warning' });
        },
        postProcess: (result) => {
          this.processing.set(false);
          this.status.set({ text: 'finished', class: 'alert alert-success' });
          this.sqlQuery = (this.gridOptions.backendServiceApi?.service satisfies SqlServiceApi)?.buildQuery();
        },
        process: (query) => {
          // Simulate server delay
          return new Promise((resolve) => setTimeout(() => resolve([]), this.serverWaitDelay));
        },
      },
      pagination: {
        pageSizes: [10, 20, 30, 50, 100],
        pageSize: defaultPageSize,
      },
    };
  }

  clearAllFiltersAndSorts() {
    this.angularGrid?.gridService?.clearAllFiltersAndSorts();
  }

  setFiltersDynamically() {
    this.angularGrid?.gridService?.updateFilters([{ columnId: 'name', searchTerms: ['Jane'], operator: 'a*' }]);
    this.angularGrid?.gridService?.updateFilters([{ columnId: 'gender', searchTerms: ['female'] }]);
    this.angularGrid?.gridService?.updateFilters([{ columnId: 'company', searchTerms: ['acme'] }]);
  }

  setSortingDynamically() {
    this.angularGrid?.gridService?.updateSorters([
      { columnId: 'billingAddressZip', direction: 'DESC' },
      { columnId: 'company', direction: 'ASC' },
    ]);
  }

  resetToOriginalPresets() {
    // implement as needed
  }

  goToFirstPage() {
    this.angularGrid?.paginationService?.goToFirstPage();
  }

  goToLastPage() {
    this.angularGrid?.paginationService?.goToLastPage();
  }
}
