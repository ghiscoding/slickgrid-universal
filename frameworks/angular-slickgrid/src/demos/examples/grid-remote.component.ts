import { Component, type OnDestroy, type OnInit } from '@angular/core';
import { SlickEventHandler, type AngularGridInstance, type Column, type Formatter, type GridOption } from '../../library';

const brandFormatter: Formatter = (_row, _cell, _value, _columnDef, dataContext) => {
  return (dataContext && dataContext.brand && dataContext.brand.name) || '';
};

const mpnFormatter: Formatter = (_row, _cell, _value, _columnDef, dataContext) => {
  let link = '';
  if (dataContext && dataContext.octopart_url && dataContext.mpn) {
    link = `<a href="${dataContext.octopart_url}" target="_blank">${dataContext.mpn}</a>`;
  }
  return link;
};

@Component({
  templateUrl: './grid-remote.component.html',
  standalone: false,
})
export class GridRemoteComponent implements OnDestroy, OnInit {
  private _eventHandler: any = new SlickEventHandler();
  angularGrid!: AngularGridInstance;
  columnDefinitions!: Column[];
  customDataView: any;
  gridObj: any;
  gridOptions!: GridOption;
  dataset = [];
  loaderDataView: any;
  loading = false; // spinner when loading data
  search = '';

  constructor() {
    // this.loaderDataView = new Slick.Data.RemoteModel();
    // this.customDataView = this.loaderDataView && this.loaderDataView.data;
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridObj = angularGrid.slickGrid; // grid object
    this.loaderDataView?.setSort('score', -1);
    this.gridObj?.setSortColumn('score', false);

    // notify of a change to preload the first page
    this.gridObj.onViewportChanged.notify();
  }

  ngOnDestroy() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
  }

  ngOnInit(): void {
    this.defineGrid();
    this.hookAllLoaderEvents();

    // set default search
    // this.search = 'switch';
    // this.loaderDataView.setSearch(this.search);
  }

  defineGrid() {
    this.columnDefinitions = [
      { id: 'mpn', name: 'MPN', field: 'mpn', formatter: mpnFormatter, width: 100, sortable: true },
      { id: 'brand', name: 'Brand', field: 'brand.name', formatter: brandFormatter, width: 100, sortable: true },
      { id: 'short_description', name: 'Description', field: 'short_description', width: 520 },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableCellNavigation: true,
      enableColumnReorder: false,
      enableGridMenu: false,
      multiColumnSort: false,
    };
  }

  hookAllLoaderEvents() {
    if (
      this._eventHandler &&
      this._eventHandler.subscribe &&
      this.loaderDataView &&
      this.loaderDataView.onDataLoading &&
      this.loaderDataView.onDataLoaded
    ) {
      this._eventHandler.subscribe(this.loaderDataView.onDataLoading, (_e: Event, _args: any) => {
        this.loading = true;
      });

      this._eventHandler.subscribe(this.loaderDataView.onDataLoaded, (_e: Event, args: any) => {
        if (args && this.gridObj && this.gridObj.invalidateRow && this.gridObj.updateRowCount && this.gridObj.render) {
          for (let i = args.from; i <= args.to; i++) {
            this.gridObj.invalidateRow(i);
          }
          this.gridObj.updateRowCount();
          this.gridObj.render();
          this.loading = false;
        }
      });
    }
  }

  onSort(_e: Event, args: any) {
    if (this.gridObj && this.gridObj.getViewport && this.loaderDataView && this.loaderDataView.ensureData && this.loaderDataView.setSort) {
      const vp = this.gridObj.getViewport();
      if (args && args.sortCol && args.sortCol.field) {
        this.loaderDataView.setSort(args.sortCol.field, args.sortAsc ? 1 : -1);
      }
      this.loaderDataView.ensureData(vp.top, vp.bottom);
    }
  }

  onViewportChanged() {
    if (this.gridObj && this.gridObj.getViewport && this.loaderDataView && this.loaderDataView.ensureData) {
      const vp = this.gridObj.getViewport();
      this.loaderDataView.ensureData(vp.top, vp.bottom);
    }
  }

  searchChanged(newValue: string) {
    if (
      newValue &&
      this.gridObj &&
      this.gridObj.getViewport &&
      this.loaderDataView &&
      this.loaderDataView.ensureData &&
      this.loaderDataView.setSearch
    ) {
      const vp = this.gridObj.getViewport();
      this.loaderDataView.setSearch(newValue);
      this.loaderDataView.ensureData(vp.top, vp.bottom);
    }
  }
}
