import { bindable } from 'aurelia';
import { type AureliaGridInstance, type Column, type GridOption, type GridState } from 'aurelia-slickgrid';

import './example45-detail-view.scss';

export interface Distributor {
  id: number;
  companyId: number;
  companyName: string;
  city: string;
  streetAddress: string;
  zipCode: string;
  country: string;
  orderData: OrderData[];
  isUsingInnerGridStatePresets: boolean;
}

export interface OrderData {
  orderId: string;
  shipCity: string;
  freight: number;
  shipName: string;
}

export class Example45DetailView {
  @bindable() model!: Distributor;
  innerColDefs: Column[] = [];
  innerGridOptions!: GridOption;
  aureliaGrid!: AureliaGridInstance;
  innerDataset: any[] = [];
  showGrid = false;
  gridId = '';
  innerGridClass = '';

  attached() {
    this.gridId = `innergrid-${this.model.id}`;
    this.innerGridClass = `row-detail-${this.model.id}`;
    this.defineGrid();

    this.innerDataset = [...this.model.orderData];
    this.showGrid = true;
  }

  // detaching() {
  //   console.log('row detail detaching');
  // }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  defineGrid() {
    // when Grid State found in Session Storage, reapply inner Grid State then reapply it as preset
    let gridState: GridState | undefined;
    if (this.model.isUsingInnerGridStatePresets) {
      const gridStateStr = sessionStorage.getItem(`gridstate_${this.innerGridClass}`);
      if (gridStateStr) {
        gridState = JSON.parse(gridStateStr);
      }
    }

    this.innerColDefs = [
      { id: 'orderId', field: 'orderId', name: 'Order ID', filterable: true, sortable: true },
      { id: 'shipCity', field: 'shipCity', name: 'Ship City', filterable: true, sortable: true },
      { id: 'freight', field: 'freight', name: 'Freight', filterable: true, sortable: true, type: 'number' },
      { id: 'shipName', field: 'shipName', name: 'Ship Name', filterable: true, sortable: true },
    ];

    this.innerGridOptions = {
      autoResize: {
        container: `.${this.innerGridClass}`,
        rightPadding: 30,
        minHeight: 200,
      },
      enableFiltering: true,
      enableSorting: true,
      rowHeight: 33,
      enableCellNavigation: true,
      datasetIdPropertyName: 'orderId',
      presets: gridState,
    };
  }

  handleBeforeGridDestroy() {
    console.log('handleBeforeGridDestroy', this.model);
    if (this.model.isUsingInnerGridStatePresets) {
      const gridState = this.aureliaGrid.gridStateService.getCurrentGridState();
      sessionStorage.setItem(`gridstate_${this.innerGridClass}`, JSON.stringify(gridState));
    }
  }
}
