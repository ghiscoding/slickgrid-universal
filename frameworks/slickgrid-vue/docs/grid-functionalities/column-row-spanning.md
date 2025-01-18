### Description
You can use Colspan and/or Rowspan by using the DataView Item Metadata Provider, however please note that row spanning is under a flag because of its small perf hit (`rowspan` requires an initial loop through of all row item metadata to map all row span).

> [!NOTE]
> Please note that `colspan` and `rowspan` have multiple constraints that you must be aware,
> any side effects will **not** keep anything in sync since metadata are based on grid row index based...
> for example: Filtering/Sorting/Paging/ColumnReorder/ColumnHidding
> These side effect will require user's own logic to deal with such things!

### Demo

#### Colspan / Rowspan
[Employee Timesheets](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example44) / [Demo Component](https://github.com/ghiscoding/slickgrid-vue/blob/master/src/examples/slickgrid/Example44.tsx)

[Large Dataset](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example45) / [Demo Component](https://github.com/ghiscoding/slickgrid-vue/blob/master/src/examples/slickgrid/Example45.tsx)


### Basic Usage

##### Component

```vue
<script setup lang="ts">
import { Column, GridOption } from 'slickgrid-vue';
import { onBeforeMount } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);

// metadata can be dynamic too, it doesn't have to be preset
const metadata: ItemMetadata | Record<number, ItemMetadata> = {
  0: {
    columns: {
      1: { rowspan: 2 },
      2: { colspan: 2 },
      10: { colspan: 3, rowspan: 10 },
      13: { colspan: 2 },
      17: { colspan: 2, rowspan: 2 },
    },
  }
};

onBeforeMount(() => {
  defineGrid();
});

function initializeGrid() {
  columnDefinitions.value = [ /*...*/ ];

  gridOptions.value = {
    enableCellNavigation: true,
    enableCellRowSpan: true, // required for rowspan to work
    dataView: {
      globalItemMetadataProvider: {
        getRowMetadata: (_item, row) => {
          return this.metadata[row];
        },
      },
    },
    rowTopOffsetRenderType: 'top', // rowspan doesn't render well with 'transform', default is 'top'
  };
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:data="dataset"
  />
</script>
```
