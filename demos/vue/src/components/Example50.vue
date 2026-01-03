<script setup lang="ts">
import { Formatters, SlickgridVue, type Column, type GridOption, type OnClickEventArgs, type SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

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

let vueGrid1!: SlickgridVueInstance;
const gridOptions1 = ref<GridOption>();
const gridOptions2 = ref<GridOption>();
const columnDefinitions1: Ref<Column[]> = ref([]);
const columnDefinitions2: Ref<Column[]> = ref([]);
const dataset1 = ref<Customer[]>([]);
const dataset2 = ref<OrderData[]>([]);
const selectedName = ref('');

onBeforeMount(() => {
  defineGrids();
  dataset1.value = mockMasterData();
});

function vueGrid1Ready(vueGrid: SlickgridVueInstance) {
  vueGrid1 = vueGrid;
  vueGrid1.slickGrid?.setSelectedRows([0]);
  selectedName.value = `${dataset1.value[0].name} - ${dataset1.value[0].company}`;
  dataset2.value = mockDetailData(dataset1.value[0]);
}

/* Define grid Options and Columns */
function defineGrids() {
  columnDefinitions1.value = [
    { id: 'name', name: 'Customer Name', field: 'name', sortable: true, minWidth: 100, filterable: true },
    { id: 'company', name: 'Company Name', field: 'company', minWidth: 100, sortable: true },
    { id: 'address', name: 'Address', field: 'address', sortable: true, minWidth: 100 },
    { id: 'country', name: 'Country', field: 'country', sortable: true },
  ];
  gridOptions1.value = {
    gridHeight: 225,
    gridWidth: 800,
    rowHeight: 33,
    enableHybridSelection: true,
    rowSelectionOptions: {
      selectionType: 'row',
      selectActiveRow: true,
    },
  };

  columnDefinitions2.value = [
    { id: 'orderId', field: 'orderId', name: 'Order ID', sortable: true, width: 50 },
    { id: 'freight', field: 'freight', name: 'Freight', sortable: true, width: 50, type: 'number', formatter: Formatters.dollar },
    { id: 'name', field: 'name', name: 'Ship Company', sortable: true },
    { id: 'city', field: 'city', name: 'Ship City', sortable: true, width: 60 },
    { id: 'country', field: 'country', name: 'Ship Country', sortable: true, width: 60 },
    { id: 'address', field: 'address', name: 'Ship Address', sortable: true },
  ];
  gridOptions2.value = {
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
}

function handleOnCellClicked(args: OnClickEventArgs) {
  const item = vueGrid1?.slickGrid?.getDataItem(args.row) as Customer;
  if (item) {
    vueGrid1?.slickGrid?.setSelectedRows([args.row]);
    dataset2.value = mockDetailData(item);
    selectedName.value = `${item.name} - ${item.company}`;
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
</script>

<template>
  <h2>
    Example 50: Master/Detail Grids
    <span class="float-end font18">
      see&nbsp;
      <a target="_blank" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example50.vue">
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
  </h2>

  <h5>Master Grid</h5>
  <div class="grid-container1">
    <SlickgridVue
      v-model:options="gridOptions1!"
      v-model:columns="columnDefinitions1"
      v-model:data="dataset1"
      grid-id="grid50-1"
      @onVueGridCreated="vueGrid1Ready($event.detail)"
      @onClick="handleOnCellClicked($event.detail.args)"
    >
    </SlickgridVue>
  </div>

  <hr />

  <h5>
    <span>Detail Grid - Orders for:</span>
    <span class="fst-italic text-secondary customer-detail">{{ selectedName }}</span>
  </h5>
  <slickgrid-vue v-model:options="gridOptions2!" v-model:columns="columnDefinitions2" v-model:data="dataset2" grid-id="grid50-2">
  </slickgrid-vue>
</template>
