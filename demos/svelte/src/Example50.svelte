<script lang="ts">
  import {
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type OnClickEventArgs,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  interface Customer {
    id: number;
    name: string;
    company: string;
    address: string;
    country: string;
  }
  interface OrderData {
    orderId: number;
    freight: number;
    name: string;
    city: string;
    country: string;
    address: string;
  }

  let selectedName = $state('');
  let svelteGrid1: SlickgridSvelteInstance | undefined;

  const columns1: Column[] = [
    { id: 'name', name: 'Customer Name', field: 'name', sortable: true, minWidth: 100, filterable: true },
    { id: 'company', name: 'Company Name', field: 'company', minWidth: 100, sortable: true },
    { id: 'address', name: 'Address', field: 'address', sortable: true, minWidth: 100 },
    { id: 'country', name: 'Country', field: 'country', sortable: true },
  ];
  const columns2: Column[] = [
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
    enableSelection: true,
    selectionOptions: { selectionType: 'row' },
  };
  const gridOptions2: GridOption = {
    gridWidth: 950,
    autoResize: { autoHeight: true, minHeight: 150 },
    enableSorting: true,
    rowHeight: 38,
    enableCellNavigation: true,
    datasetIdPropertyName: 'orderId',
  };

  const dataset1 = mockMasterData();
  let dataset2 = $state.raw<OrderData[]>([]);

  function gridReady(instance: SlickgridSvelteInstance) {
    svelteGrid1 = instance;
    svelteGrid1.slickGrid?.setSelectedRows([0]);
    selectedName = `${dataset1[0].name} - ${dataset1[0].company}`;
    dataset2 = mockDetailData(dataset1[0]);
  }

  function handleOnCellClicked(args: OnClickEventArgs) {
    const item = svelteGrid1?.slickGrid?.getDataItem(args.row) as Customer | undefined;
    if (item) {
      svelteGrid1?.slickGrid?.setSelectedRows([args.row]);
      dataset2 = mockDetailData(item);
      selectedName = `${item.name} - ${item.company}`;
    }
  }

  function mockMasterData(): Customer[] {
    return [
      { id: 0, name: 'Jerome Aufderhar', company: 'Morissette Inc', address: '1808 Koss Road', country: 'Switzerland' },
      { id: 1, name: 'Angeline Gislason', company: 'Moen, Dooley and Champlin', address: '6093 Mante Shoals', country: 'Denmark' },
      { id: 2, name: 'Dean Gibson', company: 'Champlin - Schoen & Co', address: '601 Beach Road', country: 'United Kingdom' },
      { id: 3, name: 'Sherwood Collins', company: 'Watsica, Smitham and Willms', address: '213 Whitney Land', country: 'Australia' },
      { id: 4, name: 'Colleen Gutmann', company: 'Ledner, Schiller and Leuschke', address: '19263 Church Close', country: 'Germany' },
    ];
  }

  function mockDetailData(customer: Customer): OrderData[] {
    const order = (orderId: number, freight: number, city: string, address: string): OrderData => ({
      orderId,
      freight,
      name: customer.company,
      city,
      country: customer.country,
      address,
    });
    const orders: Record<number, OrderData[]> = {
      0: [
        order(10355, 41.95, 'Zurich', '31152 Elfrieda Rapid'),
        order(10383, 32.39, 'Winterthur', '3436 Durgan Spur'),
        order(10452, 28.98, 'Zurich', '655 Joseph Cape'),
        order(10662, 21.35, 'Genève', '51019 Airport Road'),
      ],
      1: [
        order(10278, 37.62, 'Copenhagen', '436 Hills Spring'),
        order(10280, 50.95, 'Copenhagen', '8730 Nikki Highway'),
        order(10384, 13.39, 'Aalborg', '5277 Kings Highway'),
        order(10444, 58.8, 'Odense', '413 Hilpert Union'),
        order(10445, 23.33, 'Aarhus', '85836 Osinski Mountains'),
      ],
      2: [
        order(10265, 55.75, 'London', '28077 Paolo Shoal'),
        order(10297, 88.92, 'Cambridge', '309 Nolan Islands'),
        order(10449, 79.1, 'Manchester', '992 Jeromy Inlet'),
      ],
      3: [
        order(10254, 94.22, 'Perth', '261 Kaia Parks'),
        order(10370, 90.52, 'Sydney', '62373 Mina Bridge'),
        order(10519, 77.95, 'Gold Coast', '863 Alysson Rest'),
        order(10731, 94.89, 'Brisbane', '2322 Pines Drive'),
        order(10746, 51.44, 'Melbourne', '9764 Oak Street'),
      ],
      4: [
        order(10258, 47.04, 'Hamburg', '4600 Kirlin Oval'),
        order(10263, 62.95, 'Berlin', '592 Parkway Drive'),
        order(10368, 59.47, 'Munich', '785 Memorial Blvd.'),
        order(10382, 65.19, 'Frankfurt', '9839 Warren'),
      ],
    };
    return orders[customer.id] ?? [];
  }
</script>

<svelte:head><title>Example 50 - Master/Detail Grids</title></svelte:head>

<h2>
  Example 50: Master/Detail Grids
  <span class="float-end font18">
    see&nbsp;
    <a target="_blank" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example50.svelte">
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
</h2>

<h5>Master Grid</h5>
<div class="grid-container1">
  <SlickgridSvelte
    gridId="grid50-1"
    columns={columns1}
    options={gridOptions1}
    dataset={dataset1}
    onSvelteGridCreated={gridReady}
    onClick={(event) => handleOnCellClicked(event.detail.args)}
  />
</div>

<hr />

<h5>
  <span>Detail Grid - Orders for:</span>
  <span class="fst-italic text-secondary customer-detail">{selectedName}</span>
</h5>
<SlickgridSvelte gridId="grid50-2" columns={columns2} options={gridOptions2} dataset={dataset2} />
