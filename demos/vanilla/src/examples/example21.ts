import { faker } from '@faker-js/faker';
import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, ExtensionName, SlickEventHandler, type Column, type GridOption } from '@slickgrid-universal/common';
import { SlickRowDetailView } from '@slickgrid-universal/row-detail-view-plugin';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import { InnerGridExample, type Distributor, type OrderData } from './example21-detail.js';

const NB_ITEMS = 995;

export interface CreatedView {
  id: number;
  dataContext: Distributor;
  instance: InnerGridExample | null;
  rendered: boolean;
}

export default class Example21 {
  private _bindingEventService: BindingEventService;
  private _darkMode = false;
  private _eventHandler: SlickEventHandler;
  private _views: CreatedView[] = [];
  detailViewRowCount = 9;
  gridOptions!: GridOption;
  columnDefinitions!: Column<Distributor>[];
  dataset!: Distributor[];
  isUsingInnerGridStatePresets = false;
  isUsingAutoHeight = false;
  sgb!: SlickVanillaGridBundle;
  selectedRowString = '';
  serverApiDelay = 400;
  status = '';
  statusClass = '';
  gridContainerElm: HTMLDivElement;
  rowDetail!: SlickRowDetailView;

  constructor() {
    this._bindingEventService = new BindingEventService();
    this._eventHandler = new SlickEventHandler();
  }

  attached() {
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.mockData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>('.grid21') as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(
      this.gridContainerElm,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );

    // add all row detail event listeners
    this.addRowDetailEventHandlers();
    this._bindingEventService.bind(
      this.gridContainerElm,
      [
        'onfilterchanged',
        'ongridmenucolumnschanged',
        'oncolumnpickercolumnschanged',
        'ongridmenuclearallfilters',
        'ongridmenuclearallsorting',
      ],
      () => this.redrawAllViewComponents()
    );
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
    this._bindingEventService.unbindAll();
    this.disposeAllViewComponents();
    this.sgb?.dispose();
    document.querySelector('.demo-container')?.classList.remove('dark-mode');
    document.body.setAttribute('data-theme', 'light');
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'companyId',
        name: 'ID',
        field: 'companyId',
        cssClass: 'text-right',
        minWidth: 50,
        maxWidth: 50,
        filterable: true,
        sortable: true,
        type: 'number',
      },
      {
        id: 'companyName',
        name: 'Company Name',
        field: 'companyName',
        width: 90,
        filterable: true,
        sortable: true,
      },
      {
        id: 'streetAddress',
        name: 'Street Address',
        field: 'streetAddress',
        minWidth: 120,
        filterable: true,
      },
      {
        id: 'city',
        name: 'City',
        field: 'city',
        minWidth: 120,
        filterable: true,
      },
      {
        id: 'zipCode',
        name: 'Zip Code',
        field: 'zipCode',
        minWidth: 120,
        filterable: true,
      },
      {
        id: 'country',
        name: 'Country',
        field: 'country',
        minWidth: 120,
        filterable: true,
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
        autoHeight: this.isUsingAutoHeight, // works with/without autoHeight
      },
      enableFiltering: true,
      enableRowDetailView: true,
      preRegisterExternalExtensions: (pubSubService) => {
        // Row Detail View is a special case because of its requirement to create extra column definition dynamically
        // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
        this.rowDetail = new SlickRowDetailView(pubSubService);
        return [{ name: ExtensionName.rowDetailView, instance: this.rowDetail }];
      },
      rowTopOffsetRenderType: 'top', // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
      rowHeight: 33,
      rowDetailView: {
        loadOnce: false, // you can't use loadOnce with inner grid because only HTML template are re-rendered, not JS events
        preTemplate: () => this.loadingTemplate(),
        postTemplate: (itemDetail) => createDomElement('div', { className: `container_${itemDetail.id}` }),
        process: (item) => this.simulateServerAsyncCall(item),
        useRowClick: false,
        // how many grid rows do we want to use for the detail panel
        panelRows: this.detailViewRowCount,
      },
    };
  }

  addRowDetailEventHandlers() {
    this.rowDetail.onBeforeRowDetailToggle.subscribe((_e, args) => {
      // expanding
      if (args?.item?.__collapsed) {
        // probably need to render preload if exists?
      } else {
        // collapsing, so we need to dispose of the View
        this.disposeView(args.item.id);
      }
    });

    this._eventHandler.subscribe(this.rowDetail.onAsyncEndUpdate, (_e, args) => {
      this.renderView(args.item);
    });

    this._eventHandler.subscribe(this.rowDetail.onBeforeRowOutOfViewportRange, (_e, args) => {
      this.disposeView(args.item.id);
    });

    this._eventHandler.subscribe(this.rowDetail.onRowBackToViewportRange, (_e, args) => {
      this.renderView(args.item);
    });
  }

  redrawAllViewComponents() {
    this.rowDetail.resetRenderedRows();
    setTimeout(() => {
      const itemIds = this.rowDetail.getExpandedRowIds();
      itemIds.forEach((id) => {
        const item = this.sgb.dataView?.getItemById(id);
        if (item) {
          this.renderView(item);
        }
      });
    }, 10);
  }

  /** Dispose of all the opened Row Detail Panels Components */
  disposeAllViewComponents() {
    if (Array.isArray(this._views)) {
      do {
        const view = this._views.pop();
        if (view) {
          view.rendered = false;
          this.disposeView(view.id);
        }
      } while (this._views.length > 0);
    }
  }

  disposeView(itemId: number) {
    const viewIdx = this._views.findIndex((obj) => obj.id === itemId);
    const viewObj = this._views[viewIdx];
    if (viewObj?.instance) {
      viewObj.instance.dispose();
      viewObj.instance = null;
      viewObj.dataContext = null as any;
      viewObj.id = undefined as any;
      viewObj.rendered = false;
      this._views.splice(viewIdx, 1);
    }
  }

  renderView(item: Distributor) {
    if (this._views.some((obj) => obj.id === item.id)) {
      this.disposeView(item.id);
    }
    const gridContainerElm = this.sgb.slickGrid?.getContainerNode();
    const containerElm = gridContainerElm?.querySelector<HTMLDivElement>(`.container_${item.id}`);
    if (containerElm) {
      containerElm.textContent = '';
      const instance = new InnerGridExample(containerElm, item);
      const view: CreatedView = {
        id: item.id,
        dataContext: item,
        instance,
        rendered: true,
      };
      instance.mount(containerElm);
      this._views.push(view);
    }
  }

  closeAllRowDetail() {
    this.rowDetail.collapseAll();
  }

  redrawAllRowDetails() {
    // you can call do it via these 2 approaches
    this.rowDetail.recalculateOutOfRangeViews();

    // 2. or your own redraw
    // this.redrawAllRowDetails();
  }

  changeDetailViewRowCount() {
    const options = this.rowDetail.getOptions();
    if (options?.panelRows) {
      options.panelRows = this.detailViewRowCount; // change number of rows dynamically
      this.rowDetail.setOptions(options);
    }
  }

  changeUsingResizerAutoHeight(checked: boolean) {
    this.isUsingAutoHeight = checked;
    this.sgb.slickGrid?.setOptions({ autoResize: { ...this.gridOptions.autoResize, autoHeight: checked } });
    this.sgb.resizerService.resizeGrid();
    return true;
  }

  changeUsingInnerGridStatePresets(checked: boolean) {
    this.isUsingInnerGridStatePresets = checked;
    this.closeAllRowDetail();
    return true;
  }

  /** Loading template, can be an HTML string or an HTML Element */
  loadingTemplate() {
    const headerElm = createDomElement('h5', { className: 'title is-5' });
    headerElm.appendChild(createDomElement('i', { className: 'mdi mdi-load mdi-spin-1s font-40px' }));
    headerElm.appendChild(document.createTextNode('Loading...'));

    return headerElm;
  }

  /** Just for demo purposes, we will simulate an async server call and return more details on the selected row item */
  simulateServerAsyncCall(item: Distributor) {
    let orderData: OrderData[] = [];
    // let's mock some data but make it predictable for easier Cypress E2E testing
    if (item.id % 3) {
      orderData = [
        { orderId: '10261', shipCity: 'Rio de Janeiro', freight: 3.05, shipName: 'Que Delícia' },
        { orderId: '10267', shipCity: 'München', freight: 208.58, shipName: 'Frankenversand' },
        { orderId: '10281', shipCity: 'Madrid', freight: 2.94, shipName: 'Romero y tomillo' },
      ];
    } else if (item.id % 4) {
      orderData = [
        { orderId: '10251', shipCity: 'Lyon', freight: 41.34, shipName: 'Victuailles en stock' },
        { orderId: '10253', shipCity: 'Rio de Janeiro', freight: 58.17, shipName: 'Hanari Carnes' },
        { orderId: '10256', shipCity: 'Resende', freight: 13.97, shipName: 'Wellington Importadora' },
      ];
    } else if (item.id % 5) {
      orderData = [
        { orderId: '10265', shipCity: 'Strasbourg', freight: 55.28, shipName: 'Blondel père et fils' },
        { orderId: '10277', shipCity: 'Leipzig', freight: 125.77, shipName: 'Morgenstern Gesundkost' },
        { orderId: '10280', shipCity: 'Luleå', freight: 8.98, shipName: 'Berglunds snabbköp' },
        { orderId: '10295', shipCity: 'Reims', freight: 1.15, shipName: 'Vins et alcools Chevalier' },
      ];
    } else if (item.id % 2) {
      orderData = [
        { orderId: '10258', shipCity: 'Graz', freight: 140.51, shipName: 'Ernst Handel' },
        { orderId: '10270', shipCity: 'Oulu', freight: 136.54, shipName: 'Wartian Herkku' },
      ];
    } else {
      orderData = [{ orderId: '10255', shipCity: 'Genève', freight: 148.33, shipName: 'Richter Supermarkt' }];
    }

    // fill the template on async delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const itemDetail = item;
        itemDetail.orderData = orderData;
        itemDetail.isUsingInnerGridStatePresets = this.isUsingInnerGridStatePresets;

        this.notifyTemplate(itemDetail);

        // resolve the data after delay specified
        resolve(itemDetail);
      }, this.serverApiDelay);
    });
  }

  // notify the onAsyncResponse with the "args.item" (required property)
  // the plugin will then use itemDetail to populate the detail panel with "postTemplate"
  notifyTemplate(itemDetail: Distributor) {
    this.rowDetail.onAsyncResponse.notify(
      {
        item: itemDetail,
        params: { isUsingInnerGridStatePresets: this.isUsingInnerGridStatePresets },
      },
      undefined,
      this
    );
  }

  mockData(count: number) {
    // mock a dataset
    const mockDataset: Distributor[] = [];
    for (let i = 0; i < count; i++) {
      mockDataset[i] = {
        id: i,
        companyId: i,
        companyName: faker.company.name(),
        city: faker.location.city(),
        streetAddress: faker.location.streetAddress(),
        zipCode: faker.location.zipCode('######'),
        country: faker.location.country(),
        orderData: [],
        isUsingInnerGridStatePresets: false,
      };
    }

    return mockDataset;
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
    if (this._darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      document.querySelector('.demo-container')?.classList.add('dark-mode');
    } else {
      document.body.setAttribute('data-theme', 'light');
      document.querySelector('.demo-container')?.classList.remove('dark-mode');
    }
    // we must close all row details because the grid is invalidated and the events listeners will stop working because they are detached after re-rendering
    this.closeAllRowDetail();
    this.sgb.slickGrid?.setOptions({ darkMode: this._darkMode });
  }
}
