#### index
- [Single Row Selection](#single-row-selection)
- [Multiple Row Selections](#multiple-row-selections)
- [Change Dynamically Single/Multiple Selections](#changing-dynamically-from-single-to-multiple-selections-and-vice-versa)
- [Mixing Single & Multiple Row Selections](#mixing-single--multiple-row-selections)
- [Disable Custom Rows Selections via `selectableOverride`](#disable-custom-rows-selections-via-selectableoverride)
- [Disable External Button when having Empty Selection](#disable-external-button-when-having-empty-selection)
- [Change Row Selections](#change-row-selections)
- Troubleshooting
  - [Adding a Column dynamically is removing the Row Selection, why is that?](#adding-a-column-dynamically-is-removing-the-row-selection-why-is-that)

### Description
For row selection, you can simply play with couple of grid options (see below) and subscribe to `onSelectedRowsChanged` (a SlickGrid Event that is, it's not an Observable). However please note that `onSelectedRowsChanged` is a function available on the `Grid` object and you will need bind to `(gridChanged)` to get the object when grid is ready. There are 2 types of row selection(s) which you can do.

**Note:** `enableCheckboxSelector` and `enableExcelCopyBuffer` do not work well together, this is because they both share the same `Row.SelectionModel` and one cancels the other. It is recommended to not use `enableExcelCopyBuffer` in that case.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example10) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example10.ts)

## Single Row Selection
For a single row selection, you need to have `enableCellNavigation: true`, `enableRowSelection: true` and `multiSelect: false` and as described earlier, subscribe to `onSelectedRowsChanged` (for that you need to bind to `(gridChanged)`). There are 2 ways to choose for the implementation of a row selection, option **1.** is the most common option and is the recommend way of doing it.

### 1. with Custom Event (preferred way)
You can also do it through a Custom Event listener since all SlickGrid events are exposed as Custom Events. For more info see [Docs - OnEvents](../events/grid-dataview-events.md)

#### Component
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
  // define columns
  ...

  // grid options
  gridOptions.value = {
    enableAutoResize: true,
    enableCellNavigation: true,
    enableCheckboxSelector: true,
    enableRowSelection: true,
    multiSelect: false,
  }
}

function handleRowSelection(event, args) {
  console.log(event, args);
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    columnDefinitions="columnDefinitions1"
    gridOptions="gridOptions1"}
    dataset="dataset1"
    onvueGridCreated="vueGrid1Ready($event.detail)"
    onSelectedRowsChanged="onGrid1SelectedRowsChanged($event.detail.eventData, $event.detail.args)"
  />
</template>
```

### 2. with SlickGrid object & onEvent
It's preferable to use the Custom Event listeners, but if you really wish, you can also use directly the SlickGrid event that you can subscribe to. However, don't forget to unsubscribe to a SlickGrid event.
#### Component
```vue
<script setup lang="ts">
function defineGrid() {
  gridOptions.value = {
    enableAutoResize: true,
    enableCellNavigation: true,
    enableRowSelection: true
  }
}

function gridObjChanged(grid) {
  grid.onSelectedRowsChanged.subscribe((e, args) => {
    if (Array.isArray(args.rows)) {
      selectedObjects = args.rows.map(idx => {
        const item = grid.getDataItem(idx);
        return item.title || '';
      });
    }
  });
}
```

## Multiple Row Selections
As for multiple row selections, you need to disable `enableCellNavigation` and enable `enableCheckboxSelector` and `enableRowSelection`. Then as describe earlier, you will subscribe to `onSelectedRowsChanged` (for that you need to bind to `(gridChanged)`). There are 2 ways to choose for the implementation of a row selection, option **1.** is the most common option and is the recommend way of doing it.

### 1. with event (preferred way)
You can also do it through an event since all SlickGrid events are exposed. For more info see [Docs - OnEvents - `3. event`](../events/grid-dataview-events.md)

#### Component
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
  // define columns
  ...

  // grid options
  gridOptions.value = {
    enableAutoResize: true,
    enableCellNavigation: true,
    enableCheckboxSelector: true,
    enableRowSelection: true,
    rowSelectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: false
    },
  }
}

function handleRowSelection(event, args) {
  console.log(event, args);
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columnDefinitions1"
    v-model:options="gridOptions1"
    v-model:data="dataset1"
    @onVueGridCreated="vueGrid1Ready($event.detail)"
    @onSelectedRowsChanged="onGrid1SelectedRowsChanged($event.detail.eventData, $event.detail.args)"
  />
</template>
```

### 2. with SlickGrid object & onEvent
It's preferable to use the Custom Event listeners, but if you really wish, you can also use directly the SlickGrid event that you can subscribe to. However, don't forget to unsubscribe to a SlickGrid event.
#### Component
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
  gridOptions.value = {
    enableAutoResize: true,
    enableCellNavigation: true,
    enableCheckboxSelector: true,
    enableRowSelection: true,
    rowSelectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: false
    },
  }
}

function gridObjChanged(grid) {
  grid.onSelectedRowsChanged.subscribe((e, args) => {
    if (Array.isArray(args.rows)) {
      selectedObjects = args.rows.map(idx => {
        const item = grid.getDataItem(idx);
        return item.title || '';
      });
    }
  });
}
</script>
```

## Changing Dynamically from Single to Multiple Selections (and vice-versa)
If you want to change from Multiple Selections to Single Selection (and vice-versa), you could toggle the grid options `enableCellNavigation` flag (`False` when you want Single Selection), however this is not possible when using Inline Editors since this flag is required. Note that there is currently no other ways of toggling dynamically without re-creating the grid.

## Mixing Single & Multiple Row Selections
SlickGrid is so powerful and customizable, you could if you wish mix the multiple row selections (cell column 1) and single row selection (any other cell click). For that though, you will need to use 2 SlickGrid Events (`onClick` and `onSelectedRowsChanged`). For example with a Custom Event listener we can do it this way:

#### Component
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

function defineGrid() {}

function handleMultipleRowSelections(event, args) {
  console.log('multiple row checkbox selected', event, args);
}

function handleSingleRowClick(event, args) {
  console.log('multiple row checkbox selected', event, args);

  // when clicking on any cell, we will make it the new selected row
  // however, we don't want to interfere with multiple row selection checkbox which is on 1st column cell
  if (args.cell !== 0) {
    grid.setSelectedRows([args.row]);
  }
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columnDefinitions1"
    v-model:options="gridOptions1"
    v-model:data="dataset1"
    @onVueGridCreated="vueGrid1Ready($event.detail)"
    @onClick="onCellClicked($event.detail.eventData, $event.detail.args)"
    @onSelectedRowsChanged="onGrid1SelectedRowsChanged($event.detail.eventData, $event.detail.args)"
  />
</template>
```

## Disable Custom Rows Selections via `selectableOverride`
You can use `selectableOverride` to provide custom logic to disable certain rows selections, for example the code below will remove the row selection on every second row.

#### Component
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
  gridOptions.value = {
    enableRowSelection: true,
    enableCheckboxSelector: true,
    checkboxSelector: {
      // you can override the logic for showing (or not) the expand icon
      // for example, display the expand icon only on every 2nd row
      // selectableOverride: (row: number, dataContext: any, grid: any) => (dataContext.id % 2 === 1)
    },
    multiSelect: false,
    rowSelectionOptions: {
      // True (Single Selection), False (Multiple Selections)
      selectActiveRow: true,
    },
  };
}
</script>
```

### Disable External Button when having Empty Selection
When having an external button that you want to work only when there's row selection, there are 2 ways of doing
1. use the `onSelectedRowsChanged` event (via your View in HTML or via ViewModel)
```vue
<script setup lang="ts">
const isMyButtonDisabled = ref(false);

function handleOnSelectedRowsChanged(args) {
  isMyButtonDisabled.value = args?.rows?.length === 0;
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columnDefinitions1"
    v-model:options="gridOptions1"
    v-model:data="dataset1"
    @onVueGridCreated="vueGrid1Ready($event.detail)"
    @onClick="onCellClicked($event.detail.eventData, $event.detail.args)"
    @onSelectedRowsChanged="handleOnSelectedRowsChanged($event.detail.eventData, $event.detail.args)"
  />
</template>
```

2. use the `onGridStateChanged` event (see [Grid State & Presets](../grid-functionalities/grid-state-preset.md) Docs)

```vue
<script setup lang="ts">
const isMyButtonDisabled = ref(false);

function handleOngridStateChanged(gridState) {
  if (Array.isArray(gridState?.rowSelection.dataContextIds)) {
    isMassSelectionDisabled = gridState.rowSelection.dataContextIds.length === 0;
  }
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columnDefinitions1"
    v-model:options="gridOptions1"
    v-model:data="dataset1"
    @onVueGridCreated="vueGrid1Ready($event.detail)"
    @onClick="onCellClicked($event.detail.eventData, $event.detail.args)"
    @onGridStateChanged="gridStateChanged($event.detail)"
    @onSelectedRowsChanged="handleOngridStateChanged($event.detail.eventData, $event.detail.args)"
  />
</template>
```

### Change Row Selections
You can change which row(s) are selected by using the built-in SlickGrid method `setSelectedRows(rowIndexes)` (passing an empty array will clear all selection), however please note that it requires an array of row indexes as you see them in the UI and it won't work that great with Pagination (if that is what you are looking for then take a look at this Stack Overflow [Q&A](https://stackoverflow.com/questions/59629565/want-to-change-gridoption-preselectedrows-row-in-angular-slickgrid-dynamically-o))

```vue
<script setup lang="ts">
import { type Column, FieldType, Filters, Formatters, OperatorType, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
let vueGrid: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {}

function vueGridReady(vueGrid: SlickgridVueInstance) {
  vueGrid = vueGrid;
}

function changeRowSelections() {
  vueGrid.slickGrid.setSelectedRows(rowIndexes);

  // OR providing an empty array will clear the row selection
  // vueGrid.slickGrid.setSelectedRows([]);
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columnDefinitions1"
    v-model:options="gridOptions1"
    v-model:data="dataset1"
    @onvueGridCreated="vueGrid1Ready($event.detail)"
    @onClick="onCellClicked($event.detail.eventData, $event.detail.args)"
    @onSelectedRowsChanged="changeRowSelections()"
  />
</template>
```

## Troubleshooting
### Adding a Column dynamically is removing the Row Selection, why is that?
The reason is because the Row Selection (checkbox) plugin is a special column and slickgrid-vue is adding an extra column dynamically for the Row Selection checkbox and that is **not** reflected in your local copy of `columnDefinitions`. To address this issue, you need to get the slickgrid-vue internal copy of all columns (including the extra columns), you can get it via `getAllColumnDefinitions()` from the Grid Service and then you can use to that array and that will work.

```vue
<script setup lang="ts">
function vueGridReady(vGrid: SlickgridVueInstance) {
  vueGrid = vGrid;
}

function addNewColumn() {
  const newColumn = { /*...*/ };

  const allColumns = vueGrid.gridService.getAllColumnDefinitions();
  allColumns.push(newColumn);
  columnDefinitions.value = allColumns.slice(); // or use spread operator [...cols]

  // you could also use SlickGrid setColumns() method
  // vueGrid.slickGrid.setColumns(cols);
}
</script>
```
