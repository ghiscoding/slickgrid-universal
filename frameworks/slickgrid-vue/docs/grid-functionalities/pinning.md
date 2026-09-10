#### Index
- [Columns/Rows Pinning Basic](#columnsrows-pinning-basic)
- [Rows Pinning starting from Bottom](#rows-pinning-starting-from-bottom)
- [Change Pinning Dynamically](#change-pinning-dynamically)
- [Animated Gif Demo](#animated-gif-demo)
- [Sticky Columns and Rows](sticky.md)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue-demos/#/Example20) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example20.vue)

### Introduction
Pinning keeps selected columns or rows attached to a grid edge while the remaining content scrolls. Columns can be pinned on the left or right, and rows can be pinned at the top or bottom. You can also change pinning dynamically with `setOptions()`.

Set `Column.pinnable` to `false` when a column must not be pinned or unpinned from the Header Menu. It defaults to `true` and only controls the built-in UI; `Column.pinned` and the programmatic pinning APIs remain available for application-controlled state.

For scroll-activated docking, see [Sticky Columns and Rows](sticky.md). Sticky columns have no built-in Header Menu commands, so a separate `Column.stickable` flag is not needed.

## Columns/Rows Pinning basic
To configure pinning for the entire lifetime of the grid, use the nested `pinning` Grid Option.

##### Component
```vue
<script setup lang="ts">
import { type Column, Filters, Formatters, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  columns.value = [];

  gridOptions.value = {
    alwaysShowVerticalScroll: false,
    pinning: {
      columns: { left: 2 },
      rows: { top: [0, 1, 2] },
    },
    // v11 and lower: frozenColumn: 2, frozenRow: 3
  }
}
</script>

<template>
  <SlickgridVue gridId="grid1"
    v-model:columns="columns"
    v-model:options="gridOptions"
    v-model:dataset="dataset"
    @onGridStateChanged="gridStateChanged($event.detail)"
    @onVueGridCreated="vueGridReady($event.detail)"
  />
</template>
```

> **Caution**
> Please be aware that pinned columns cannot consume the entire grid viewport. You can customize the validation with `invalidColumnPinningWidthCallback` or disable it with `skipPinningValidation`.

> **Caution**
> The Column Picker and Grid Menu also validate that at least one center column remains available. You can customize this with `invalidColumnPinningPickerCallback` or disable pinning validation with `skipPinningValidation`.

## Rows Pinning starting from bottom
To pin rows at the bottom, provide the row indexes in `pinning.rows.bottom` and leave the top list empty.
##### Component

```vue
<script setup lang="ts">
import { type Column, Filters, Formatters, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  // your columns definition
  columns.value = [];

  gridOptions.value = {
    alwaysShowVerticalScroll: false,
    pinning: {
      columns: { left: 2 },
      rows: { bottom: [97, 98, 99] },
    },
    // v11 and lower: frozenColumn: 2, frozenRow: 3, frozenBottom: true
  }
}
</script>
```

## Change Pinning Dynamically
You can change the number of pinned columns/rows and even the pinning of columns from top to bottom. For a demo of what that could look like, take a look at the [Animated Gif Demo](../grid-functionalities/pinning.md#animated-gif-demo) below.

##### Component
```vue
<script setup lang="ts">
import { SlickgridVueInstance } from 'slickgrid-vue';
import { type Column, Filters, Formatters, SlickgridVue, SlickGrid, SortDirection } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columns: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
let gridObj: SlickGrid;

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  columns.value = [];

  gridOptions.value = {
    alwaysShowVerticalScroll: false, // disable scroll since we don't want it to show on the left pinned columns
    pinning: {
      columns: { left: 2 },
      rows: { top: [0, 1, 2] },
    },
  }
}

function vueGridReady(vGrid: SlickgridVueInstance) {
  gridObj = vGrid.slickGrid;
}

/** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
function changePinnedColumnCount() {
  if (gridObj?.setOptions) {
    gridObj.setOptions({
      pinning: { columns: { left: pinnedColumnCount } }
    });
  }
}

/** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
function changePinnedRowCount() {
  if (gridObj?.setOptions) {
    gridObj.setOptions({
      pinning: { rows: { top: [0, 1, 2] } }
    });
  }
}

/** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
function togglePinnedBottomRows() {
  if (gridObj?.setOptions) {
    gridObj.setOptions({
      pinning: { rows: { top: [], bottom: [0, 1, 2] } }
    });
    isPinnedBottom = !isPinnedBottom; // toggle the variable
  }
}
</script>

<template>
  <div class="row">
    <div class="col-sm-12">
      <span>
        <label htmlFor="">Pinned Rows: </label>
        <input type="number" min="-1" :value="pinnedRowCount" @input="changePinnedRowCount($event)" />
        <button class="btn btn-outline-secondary btn-xs btn-icon" @click="changePinnedRowCount()">
          Set
        </button>
      </span>
      <span style={{ marginLeft: '10px' }}>
        <label htmlFor="">Pinned Columns: </label>
        <input type="number" min="-1" :value="pinnedColumnCount" @input="changePinnedColumnCount($event)" />
        <button class="btn btn-outline-secondary btn-xs btn-icon" @click="changePinnedColumnCount()">
          Set
        </button>
      </span>
    </div>
  </div>
</template>
```

## Animated Gif Demo
![](https://user-images.githubusercontent.com/643976/50852303-28d57c80-134d-11e9-859c-aeb55af24c24.gif)
