### Demo
[Demo](https://ghiscoding.github.io/slickgrid-universal/#/example03) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example03.ts)

### Description

For column visibility, you can define the `hidden` property in your column definitions to initially hide some columns. You could also toggle the `hidden` property at any point in time (see below for more code usage).

### initially hidden columns

Let's start by demoing how to initially hide some column(s) by using the `hidden` property.

##### define columns

```ts
this.columns = [
  { id: 'firstName', field: 'firstName', name: 'First Name' },
  { id: 'lastName', field: 'lastName', name: 'Last Name' },
  { id: 'age', field: 'age', name: 'Age', hidden: true }, // column initially hidden
];
```

### change visibility afterward

At any point in time, you could toggle the `hidden` property by using `grid.updateColumnById()` and make sure to also call `grid.updateColumns()` so that the UI is also updated.

##### define columns

```vue
<script setup lang="ts">
import { type Column, Filters, Formatters, SlickgridVue, SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
let vueGrid: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  columns.value = [
    { id: 'firstName', field: 'firstName', name: 'First Name' },
    { id: 'lastName', field: 'lastName', name: 'Last Name' },
    { id: 'age', field: 'age', name: 'Age' },
  ];
}

// toggle column visibility & then update columns to show changes in the grid
function toggleColumnVisibility(columnName: string) {
  vueGrid.slickGrid.updateColumnById(columnName, { hidden: true });
  vueGrid.slickGrid.updateColumns();
}

// get all columns (including `hidden` columns)
function getAllColumns() {
  vueGrid.slickGrid.getColumns();
}

// get only the visible columns
function getOnlyVisibleColumns() {
  vueGrid.slickGrid.getVisibleColumns();
}

function vueGridReady(vGrid: SlickgridVueInstance) {
  vueGrid = vGrid;
}
</script>

<template>
  <div id="demo-container" class="container-fluid">
    <SlickgridVue
      grid-id="grid3"
      v-model:columns="columns"
      v-model:options="gridOptions"
      v-model:dataset="dataset"
      @onVueGridCreated="vueGridReady($event.detail)"
    />
  </div>
</template>
```
