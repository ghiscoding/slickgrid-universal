import { createDomElement, emptyElement, type Column, type GridOption, type GridState } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import './example21-detail.scss';

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

export class InnerGridExample {
  innerColDefs: Column[] = [];
  innerData: any[] = [];
  innerGridOptions: GridOption;
  innerGridClass = '';
  innerSgb: SlickVanillaGridBundle;

  /** Row Detail View, can be an HTML string or an HTML Element (we'll use HTML string for simplicity of the demo) */
  constructor(
    public container: HTMLElement,
    public itemDetail: Distributor
  ) {
    this.innerGridClass = `row-detail-${this.itemDetail.id}`;
    this.defineGrid();
  }

  dispose() {
    if (this.itemDetail.isUsingInnerGridStatePresets) {
      const gridState = this.innerSgb.gridStateService.getCurrentGridState();
      sessionStorage.setItem(`gridstate_${this.innerGridClass}`, JSON.stringify(gridState));
    } else {
      sessionStorage.removeItem(`gridstate_${this.innerGridClass}`);
    }
    this.innerSgb.dispose(true);
    emptyElement(this.container);
    this.container.textContent = '';
  }

  defineGrid() {
    // when found, reapply inner Grid State if it was previously saved in Session Storage
    let gridState: GridState | undefined;
    if (this.itemDetail.isUsingInnerGridStatePresets) {
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
        container: `.row-detail-${this.itemDetail.id} .container`,
        rightPadding: 30,
        minHeight: 200,
      },
      enableFiltering: true,
      enableSorting: true,
      rowHeight: 33,
      enableCellNavigation: true,
      datasetIdPropertyName: 'orderId',
      presets: gridState,
      rowTopOffsetRenderType: 'top', // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
    };
  }

  mount(containerElm: HTMLElement) {
    const { fragment, innerGrid } = this.render();
    containerElm.textContent = '';
    containerElm.appendChild(fragment);
    this.innerSgb = new Slicker.GridBundle(innerGrid, this.innerColDefs, this.innerGridOptions, [...this.itemDetail.orderData]);
  }

  render() {
    // return `
    //     <div class="row-detail-${this.itemDetail.id}">
    //       <h4 class="title is-4">${this.itemDetail.title} - Order Details</h4>
    //       <div class="container">
    //         <div class="innergrid innergrid-${this.itemDetail.id}"></div>
    //       </div>
    //     </div>
    //   `;
    const fragment = new DocumentFragment();
    const rowDetailContainer = createDomElement('div', { className: this.innerGridClass });
    const innerGrid = createDomElement('div', { className: `innergrid innergrid-${this.itemDetail.id}` });
    const gridContainer = createDomElement('div', { className: 'container' });
    gridContainer.appendChild(
      createDomElement('h4', {
        className: 'title is-4',
        textContent: `${this.itemDetail.companyName} - Order Details (id: ${this.itemDetail.id})`,
      })
    );
    gridContainer.appendChild(innerGrid);
    rowDetailContainer.appendChild(gridContainer);
    fragment.appendChild(rowDetailContainer);

    return { fragment, innerGrid };
  }
}
