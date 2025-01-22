#### Index
- [Columns/Rows Pinning Basic](#columnsrows-pinning-basic)
- [Rows Pinning starting from Bottom](#rows-pinning-starting-from-bottom)
- [Change Pinning Dynamically](#change-pinning-dynamically)
- [Animated Gif Demo](#animated-gif-demo)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example20) / [Demo Component](https://github.com/ghiscoding/slickgrid-vue/blob/master/doc/github-demo/src/examples/slickgrid/example20.vue)

### Introduction
One of the requested features, columns or rows pinning (aka frozen). You can pin 1 or more Columns and/or 1 or more Rows. Columns can only be pinned starting from the left side, while Rows can be pinned starting from the Top (default) or Bottom. You can also change the pinning dynamically with `setOptions()`.

## Columns/Rows Pinning basic
To set a pinning for the entire duration of the grid, simply use the Grid Options `frozenColumn` (starting from top) and `frozenRow` (starting from left), which are both `number` types.

##### Component
```vue
<script setup lang="ts">
import { type Column, FieldType, Filters, Formatters, OperatorType, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  columnDefinitions.value = [];

  gridOptions.value = {
    alwaysShowVerticalScroll: false, // disable scroll since we don't want it to show on the left pinned columns
    frozenColumn: 2, // number of pinned columns starting from the left
    frozenRow: 3,    // number of pinned columns starting from the top
  }
}
</script>

<template>
  <SlickgridVue gridId="grid1"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:data="dataset"
    @onVueGridCreated="vueGridReady($event.detail)"
    @onGridStateChanged="gridStateChanged($event.detail)"
  />
</template>
```

## Rows Pinning starting from bottom
This is basically the same thing as previous code sample, except that you will set the Grid Option property `frozenBottom` to true and that it's.
##### Component

```vue
<script setup lang="ts">
import { type Column, FieldType, Filters, Formatters, OperatorType, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  // your columns definition
  columnDefinitions.value = [];

  gridOptions.value = {
    alwaysShowVerticalScroll: false, // disable scroll since we don't want it to show on the left pinned columns
    frozenColumn: 2,    // number of pinned columns starting from the left
    frozenRow: 3,       // number of pinned columns (starting from bottom with next property)
    frozenBottom: true, // this will make rows to be pinned starting from the bottom and the number of rows will be 3
  }
}
</script>
```

## Change Pinning Dynamically
You can change the number of pinned columns/rows and even the pinning of columns from top to bottom. For a demo of what that could look like, take a look at the [Animated Gif Demo](../grid-functionalities/frozen-columns-rows.md#animated-gif-demo) below.

##### Component
```vue
<script setup lang="ts">
import { SlickgridVueInstance } from 'slickgrid-vue';
import { type Column, FieldType, Filters, Formatters, OperatorType, SlickgridVue, SlickGrid, SortDirection } from 'slickgrid-vue';
import { onBeforeMount } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
let gridObj: SlickGrid;

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  columnDefinitions.value = [];

  gridOptions.value = {
    alwaysShowVerticalScroll: false, // disable scroll since we don't want it to show on the left pinned columns
    frozenColumn: 2, // number of pinned columns starting from the left
    frozenRow: 3,    // number of pinned columns starting from the top
  }
}

function vueGridReady(vGrid: SlickgridVueInstance) {
  gridObj = vGrid.slickGrid;
}

/** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
function changeFrozenColumnCount() {
  if (gridObj?.setOptions) {
    gridObj.setOptions({
      frozenColumn: frozenColumnCount
    });
  }
}

/** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
function changeFrozenRowCount() {
  if (gridObj?.setOptions) {
    gridObj.setOptions({
      frozenRow: frozenRowCount
    });
  }
}

/** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
function toggleFrozenBottomRows() {
  if (gridObj?.setOptions) {
    gridObj.setOptions({
      frozenBottom: !isFrozenBottom
    });
    isFrozenBottom = !isFrozenBottom; // toggle the variable
  }
}
</script>

<template>
  <div class="row">
    <div class="col-sm-12">
      <span>
        <label htmlFor="">Pinned Rows: </label>
        <input type="number" :value="frozenRowCount" @input="changeFrozenRowCount($event)" />
        <button class="btn btn-outline-secondary btn-xs btn-icon" @click="setFrozenRowCount()">
          Set
        </button>
      </span>
      <span style={{ marginLeft: '10px' }}>
        <label htmlFor="">Pinned Columns: </label>
        <input type="number" :value="frozenColumnCount" @input="changeFrozenColumnCount($event)" />
        <button class="btn btn-outline-secondary btn-xs btn-icon" @click="setFrozenColumnCount()">
          Set
        </button>
      </span>
    </div>
  </div>
</template>
```

## Animated Gif Demo
![](https://user-images.githubusercontent.com/643976/50852303-28d57c80-134d-11e9-859c-aeb55af24c24.gif)
