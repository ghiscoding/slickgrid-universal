import { Formatters, type AureliaGridInstance, type Column, type GridOption, type OnClickEventArgs } from 'aurelia-slickgrid';

export interface Customer {
  id: number;
  name: string;
  company: string;
  address: string;
  country: string;
}

export interface OrderData {
  orderId: number;
  freight: number;
  name: string;
  city: string;
  country: string;
  address: string;
}

export class Example50 {
  aureliaGrid1!: AureliaGridInstance;
  gridOptions1!: GridOption;
  gridOptions2!: GridOption;
  columnDefinitions1: Column[] = [];
  columnDefinitions2: Column[] = [];
  dataset1: Customer[] = [];
  dataset2: OrderData[] = [];
  hideSubTitle = false;
  selectedName = '';

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrids();
  }

  attached() {
    this.dataset1 = this.mockMasterData();
    this.aureliaGrid1.slickGrid?.setSelectedRows([0]);
    this.selectedName = `${this.dataset1[0].name} - ${this.dataset1[0].company}`;
    this.dataset2 = this.mockDetailData(this.dataset1[0]);
  }

  aureliaGridReady1(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid1 = aureliaGrid;
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columnDefinitions1 = [
      { id: 'name', name: 'Customer Name', field: 'name', sortable: true, minWidth: 100, filterable: true },
      { id: 'company', name: 'Company Name', field: 'company', minWidth: 100, sortable: true },
      { id: 'address', name: 'Address', field: 'address', sortable: true, minWidth: 100 },
      { id: 'country', name: 'Country', field: 'country', sortable: true },
    ];

    this.gridOptions1 = {
      enableAutoResize: false,
      gridHeight: 225,
      gridWidth: 800,
      rowHeight: 33,
      enableHybridSelection: true,
      rowSelectionOptions: {
        selectionType: 'row-click',
      },
    };

    this.columnDefinitions2 = [
      { id: 'orderId', field: 'orderId', name: 'Order ID', sortable: true, width: 50 },
      { id: 'freight', field: 'freight', name: 'Freight', sortable: true, width: 50, type: 'number', formatter: Formatters.dollar },
      { id: 'name', field: 'name', name: 'Ship Company', sortable: true },
      { id: 'city', field: 'city', name: 'Ship City', sortable: true, width: 60 },
      { id: 'country', field: 'country', name: 'Ship Country', sortable: true, width: 60 },
      { id: 'address', field: 'address', name: 'Ship Address', sortable: true },
    ];

    this.gridOptions2 = {
      gridWidth: 950,
      autoResize: {
        container: '.demo-container',
        autoHeight: true,
        minHeight: 150,
      },
      enableSorting: true,
      rowHeight: 38,
      enableCellNavigation: true,
      datasetIdPropertyName: 'orderId',
    };
  }

  handleOnCellClicked(args: OnClickEventArgs) {
    const item = this.aureliaGrid1?.slickGrid?.getDataItem(args.row) as Customer;
    if (item) {
      this.aureliaGrid1?.slickGrid?.setSelectedRows([args.row]);
      this.dataset2 = this.mockDetailData(item);
      this.selectedName = `${item.name} - ${item.company}`;
    }
  }

  mockMasterData() {
    // mock a dataset
    const masterData: Customer[] = [
      {
        id: 0,
        name: 'Jerome Aufderhar',
        company: 'Morissette Inc',
        address: '1808 Koss Road',
        country: 'Switzerland',
      },
      {
        id: 1,
        name: 'Angeline Gislason',
        company: 'Moen, Dooley and Champlin',
        address: '6093 Mante Shoals',
        country: 'Denmark',
      },
      {
        id: 2,
        name: 'Dean Gibson',
        company: 'Champlin - Schoen & Co',
        address: '601 Beach Road',
        country: 'United Kingdom',
      },
      {
        id: 3,
        name: 'Sherwood Collins',
        company: 'Watsica, Smitham and Willms',
        address: '213 Whitney Land',
        country: 'Australia',
      },
      {
        id: 4,
        name: 'Colleen Gutmann',
        company: 'Ledner, Schiller and Leuschke',
        address: '19263 Church Close',
        country: 'Germany',
      },
    ];

    return masterData;
  }

  mockDetailData(c: Customer) {
    // mock order data
    let orderData: OrderData[] = [];
    if (c.id === 0) {
      orderData = [
        { orderId: 10355, freight: 41.95, name: c.company, city: 'Zurich', country: c.country, address: '31152 Elfrieda Rapid' },
        { orderId: 10383, freight: 32.39, name: c.company, city: 'Winterthur', country: c.country, address: '3436 Durgan Spur' },
        { orderId: 10452, freight: 28.98, name: c.company, city: 'Zurich', country: c.country, address: '655 Joseph Cape' },
        { orderId: 10662, freight: 21.35, name: c.company, city: 'Genève', country: c.country, address: '51019 Airport Road' },
      ];
    } else if (c.id === 1) {
      orderData = [
        { orderId: 10278, freight: 37.62, name: c.company, city: 'Copenhagen', country: c.country, address: '436 Hills Spring' },
        {
          orderId: 10280,
          freight: 50.95,
          name: c.company,
          city: 'Copenhagen',
          country: c.country,
          address: '8730 Nikki Highway',
        },
        { orderId: 10384, freight: 13.39, name: c.company, city: 'Aalborg', country: c.country, address: '5277 Kings Highway' },
        { orderId: 10444, freight: 58.8, name: c.company, city: 'Odense', country: c.country, address: '413 Hilpert Union' },
        {
          orderId: 10445,
          freight: 23.33,
          name: c.company,
          city: 'Aarhus',
          country: c.country,
          address: '85836 Osinski Mountains',
        },
      ];
    } else if (c.id === 2) {
      orderData = [
        { orderId: 10265, freight: 55.75, name: c.company, city: 'London', country: c.country, address: '28077 Paolo Shoal' },
        { orderId: 10297, freight: 88.92, name: c.company, city: 'Cambridge', country: c.country, address: '309 Nolan Islands' },
        { orderId: 10449, freight: 79.1, name: c.company, city: 'Manchester', country: c.country, address: '992 Jeromy Inlet' },
      ];
    } else if (c.id === 3) {
      orderData = [
        { orderId: 10254, freight: 94.22, name: c.company, city: 'Perth', country: c.country, address: '261 Kaia Parks' },
        { orderId: 10370, freight: 90.52, name: c.company, city: 'Sydney', country: c.country, address: '62373 Mina Bridge' },
        { orderId: 10519, freight: 77.95, name: c.company, city: 'Gold Coast', country: c.country, address: '863 Alysson Rest' },
        { orderId: 10731, freight: 94.89, name: c.company, city: 'Brisbane', country: c.country, address: '2322 Pines Drive' },
        { orderId: 10746, freight: 51.44, name: c.company, city: 'Melbourne', country: c.country, address: '9764 Oak Street' },
      ];
    } else if (c.id === 4) {
      orderData = [
        { orderId: 10258, freight: 47.04, name: c.company, city: 'Hamburg', country: c.country, address: '4600 Kirlin Oval' },
        { orderId: 10263, freight: 62.95, name: c.company, city: 'Berlin', country: c.country, address: '592 Parkway Drive' },
        { orderId: 10368, freight: 59.47, name: c.company, city: 'Munich', country: c.country, address: '785 Memorial Blvd.' },
        { orderId: 10382, freight: 65.19, name: c.company, city: 'Frankfurt', country: c.country, address: '9839 Warren' },
      ];
    }

    return orderData;
  }
}
