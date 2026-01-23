import { useRef, useState } from 'react';
import {
  Formatters,
  SlickgridReact,
  type Column,
  type GridOption,
  type OnClickEventArgs,
  type SlickgridReactInstance,
} from 'slickgrid-react';

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

const Example50: React.FC = () => {
  const [selectedName, setSelectedName] = useState('');
  const reactGrid1Ref = useRef<SlickgridReactInstance | null>(null);

  // mock some data (different in each dataset)
  const [dataset1] = useState<Customer[]>(mockMasterData());
  const [dataset2, setDataset2] = useState<OrderData[]>(mockDetailData(dataset1[0]));

  /* Define grid Options and Columns */
  const columnDefinitions1: Column[] = [
    { id: 'name', name: 'Customer Name', field: 'name', sortable: true, minWidth: 100, filterable: true },
    { id: 'company', name: 'Company Name', field: 'company', minWidth: 100, sortable: true },
    { id: 'address', name: 'Address', field: 'address', sortable: true, minWidth: 100 },
    { id: 'country', name: 'Country', field: 'country', sortable: true },
  ];
  const columnDefinitions2: Column[] = [
    { id: 'orderId', field: 'orderId', name: 'Order ID', sortable: true, width: 50 },
    { id: 'freight', field: 'freight', name: 'Freight', sortable: true, width: 50, type: 'number', formatter: Formatters.dollar },
    { id: 'name', field: 'name', name: 'Ship Company', sortable: true },
    { id: 'city', field: 'city', name: 'Ship City', sortable: true, width: 60 },
    { id: 'country', field: 'country', name: 'Ship Country', sortable: true, width: 60 },
    { id: 'address', field: 'address', name: 'Ship Address', sortable: true },
  ];

  const gridOptions1: GridOption = {
    enableAutoResize: false,
    gridHeight: 225,
    gridWidth: 800,
    rowHeight: 33,
    enableHybridSelection: true,
    rowSelectionOptions: {
      selectionType: 'row',
    },
  };

  // copy the same Grid Options and Column Definitions to 2nd grid
  // but also add Pagination in this grid
  const gridOptions2: GridOption = {
    gridWidth: 950,
    autoResize: {
      autoHeight: true,
      minHeight: 150,
    },
    enableSorting: true,
    rowHeight: 38,
    enableCellNavigation: true,
    datasetIdPropertyName: 'orderId',
  };

  function reactGrid1Ready(reactGrid: SlickgridReactInstance) {
    reactGrid1Ref.current = reactGrid;
    reactGrid?.slickGrid?.setSelectedRows([0]);
    setSelectedName(`${dataset1[0].name} - ${dataset1[0].company}`);
    setDataset2(mockDetailData(dataset1[0]));
  }

  function handleOnCellClicked(args: OnClickEventArgs) {
    const item = reactGrid1Ref.current?.slickGrid?.getDataItem(args.row) as Customer;
    if (item) {
      reactGrid1Ref.current?.slickGrid?.setSelectedRows([args.row]);
      setDataset2(mockDetailData(item));
      setSelectedName(`${item.name} - ${item.company}`);
    }
  }

  function mockMasterData() {
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

  function mockDetailData(c: Customer) {
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

  return (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 50: Master/Detail Grids
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example50.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
      </h2>

      <h5>Master Grid</h5>
      <div className="grid-container1">
        <SlickgridReact
          gridId="grid50-1"
          columns={columnDefinitions1}
          options={gridOptions1!}
          dataset={dataset1}
          onReactGridCreated={($event) => reactGrid1Ready($event.detail)}
          onClick={($event) => handleOnCellClicked($event.detail.args)}
        />
      </div>

      <hr />

      <h5>
        <span>Detail Grid - Orders for:</span>
        <span className="fst-italic text-secondary customer-detail ms-2">{selectedName}</span>
      </h5>
      <SlickgridReact gridId="grid50-2" columns={columnDefinitions2} options={gridOptions2!} dataset={dataset2} />
    </div>
  );
};

export default Example50;
