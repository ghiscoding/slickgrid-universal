<script setup lang="ts">
import {
  type Column,
  type GridOption,
  type GridState,
  type RowDetailViewProps,
  SlickgridVue,
  type SlickgridVueInstance,
} from 'slickgrid-vue';
import { onBeforeMount, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

import type Example45 from './Example45.vue';

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

const props = defineProps<RowDetailViewProps<Distributor, typeof Example45>>();

const showGrid = ref(false);
const innerGridOptions = ref<GridOption>();
const innerColDefs: Ref<Column[]> = ref([]);
const innerDataset = ref<any[]>([]);
const innerGridClass = ref(`row-detail-${props.model.id}`);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

onBeforeUnmount(() => {
  // console.log('unmounting row detail', props.model.id);
});

onMounted(() => {
  innerDataset.value = [...props.model.orderData];
  showGrid.value = true;
});

function handleBeforeGridDestroy() {
  if (props.model.isUsingInnerGridStatePresets) {
    const gridState = vueGrid.gridStateService.getCurrentGridState();
    sessionStorage.setItem(`gridstate_${innerGridClass.value}`, JSON.stringify(gridState));
  }
}

function defineGrid() {
  // when Grid State found in Session Storage, reapply inner Grid State then reapply it as preset
  let gridState: GridState | undefined;
  if (props.model.isUsingInnerGridStatePresets) {
    const gridStateStr = sessionStorage.getItem(`gridstate_${innerGridClass.value}`);
    if (gridStateStr) {
      gridState = JSON.parse(gridStateStr);
    }
  }

  innerColDefs.value = [
    { id: 'orderId', field: 'orderId', name: 'Order ID', filterable: true, sortable: true },
    { id: 'shipCity', field: 'shipCity', name: 'Ship City', filterable: true, sortable: true },
    { id: 'freight', field: 'freight', name: 'Freight', filterable: true, sortable: true, type: 'number' },
    { id: 'shipName', field: 'shipName', name: 'Ship Name', filterable: true, sortable: true },
  ];

  innerGridOptions.value = {
    autoResize: {
      container: `.${innerGridClass.value}`,
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

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>
<template>
  <div :class="innerGridClass">
    <h4>{{ model.companyName }} - Order Details (id: {{ model.id }})</h4>
    <div class="container-fluid">
      <slickgrid-vue
        v-if="showGrid"
        v-model:options="innerGridOptions"
        v-model:columns="innerColDefs"
        v-model:data="innerDataset"
        :grid-id="`innergrid-${model.id}`"
        class="innergrid"
        @onBeforeGridDestroy="handleBeforeGridDestroy"
        @onVueGridCreated="vueGridReady($event.detail)"
      >
      </slickgrid-vue>
    </div>
  </div>
</template>
<style lang="scss">
.detail-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
}

label {
  font-weight: 600;
}
.innergrid {
  --slick-header-menu-display: inline-block;
}
</style>
