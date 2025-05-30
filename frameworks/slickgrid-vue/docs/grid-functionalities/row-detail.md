#### index
- [Usage](#usage)
- [Changing Addon Options Dynamically](#changing-addon-options-dynamically)
- [Calling Addon Methods Dynamically](#calling-addon-methods-dynamically)
- [Row Detail - Preload Component - Loading Spinner](#row-detail---preload-component-loading-spinner)
- [Row Detail - View Component](#row-detail---view-component)
- [Access Parent Component (grid) from the Child Component (row detail)](#access-parent-component-grid-from-the-child-component-row-detail)
- Troubleshooting
  - [Adding a Column dynamically is removing the Row Selection, why is that?](#adding-a-column-dynamically-is-removing-the-row-selection-why-is-that)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue-demos/#/Example19) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example19.ts)

### Description
A Row Detail allows you to open a detail panel which can contain extra and/or more detailed information about a row. For example, we have a user list but we want to display detailed information about this user (his full address, account info, last purchasers, ...) but these are extra details that we don't want to display this in the user grid (for performance and real estate reasons)... so a Row Detail is perfect for that use case.

> **NOTE** Please note that because of the complexity behind Row Detail, the following features cannot be mixed with Row Detail because they will cause UI problems
> - Grouping
> - Pagination
> - Tree Data
> - RowSpan

> **NOTE 2** Also please note that because SlickGrid is using its built-in Virtual Scroll feature by default (for perf reasons), this will call render and re-render multiple times and that happens whenever the Row Detail gets out of the grid viewport.
> For this reason, you should avoid using dynamic elements (i.e. form inputs) because whenever a re-render kicks in, it will reset and re-render these elements as if nothing happened.
> So you should consider using Row Detail mainly for showing static data (hence where its name comes from "Row Detail" to show more detailed info) and even though it works with dynamic elements, you have to know its limitation.

## Usage

##### Component
```vue
<script setup lang="ts">
import { type Column, Filters, Formatters, GridState, OperatorType, SlickgridVue, SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
let vueGrid: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  const columnDefinitions = [/*...*/];
  gridOptions.value = {
    enableRowDetailView: true,
    rowSelectionOptions: {
      selectActiveRow: true
    },
    preRegisterExternalExtensions: (pubSubService) => {
      // Row Detail View is a special case because of its requirement to create extra column definition dynamically
      // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
      const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);
      return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
    },
    rowDetailView: {
      // We can load the "process" asynchronously via Fetch, Promise, ...
      process: (item) => http.get(`api/item/${item.id}`),

      // load only once and reuse the same item detail without calling process method
      loadOnce: true,

      // limit expanded row to only 1 at a time
      singleRowExpand: false,

      // false by default, clicking anywhere on the row will open the detail view
      // when set to false, only the "+" icon would open the row detail
      // if you use editor or cell navigation you would want this flag set to false (default)
      useRowClick: true,

      // how many grid rows do we want to use for the row detail panel (this is only set once and will be used for all row detail)
      // also note that the detail view adds an extra 1 row for padding purposes
      // so if you choose 4 panelRows, the display will in fact use 5 rows
      panelRows: detailViewRowCount,

      // you can override the logic for showing (or not) the expand icon
      // for example, display the expand icon only on every 2nd row
      // expandableOverride: (row: number, dataContext: any, grid: any) => (dataContext.id % 2 === 1),

      // Preload View Template
      preloadComponent: Example19Preload,

      // ViewModel Template to load when row detail data is ready
      viewComponent: Example19DetailView,

      // Optionally pass your Parent Component reference to your Child Component (row detail component)
      parentRef: this
    }
  };
}

function vueGridReady(vueGrid: SlickgridVueInstance) {
  vueGrid = vueGrid;
}
</script>

<template>
  <SlickgridVue
    grid-id="grid40"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:data="dataset"
    @onVueGridCreated="vueGridReady($event.detail)" />
</template>
```

### Changing Addon Options Dynamically
Row Detail is an addon (commonly known as a plugin and are opt-in addon), because this is not built-in SlickGrid and instead are opt-in, we need to get the instance of that addon object. Once we have the instance, we can use `getOptions` and `setOptions` to get/set any of the addon options, adding `rowDetail` with intellisense should give you this info.

#### Examples
- Dynamically change the Detail View Row Count (how many grid rows do we want to use for the row detail panel)
```ts
function changeDetailViewRowCount() {
  if (vueGrid?.extensionService) {
    const rowDetailInstance = vueGrid.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView);
    const options = rowDetailInstance.getOptions();
    options.panelRows = detailViewRowCount; // change number of rows dynamically
    rowDetailInstance.setOptions(options);
  }
}
```

### Calling Addon Methods Dynamically
Same as previous paragraph, after we get the SlickGrid addon instance, we can call any of the addon methods, adding `rowDetail` with intellisense should give you this info.

#### Examples
- Dynamically close all Row Detail Panels
```ts
function closeAllRowDetail() {
  if (vueGrid && vueGrid.extensionService) {
    const rowDetailInstance = vueGrid.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView);
    rowDetailInstance.collapseAll();
  }
}
```
- Dynamically close a single Row Detail by it's grid index
This requires a bit more work, you can call the method `collapseDetailView(item)` but it requires to pass the row item object (data context) and it feasible but it's just more work as can be seen below.
```ts
function closeRowDetail(gridRowIndex: number) {
  if (vueGrid && vueGrid.extensionService) {
    const rowDetailInstance = vueGrid.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView);
    const item = vueGrid.gridService.getDataItemByRowIndex(gridRowIndex);
    rowDetailInstance.collapseDetailView(item);
  }
}
```

### Row Detail - Preload Component (loading spinner)
Most of the time we would get data asynchronously, during that time we can show a loading spinner to the user via the `preloadComponent` grid option. We could use this simple Preload Component example as shown below

###### Preload Component
```vue
<template>
  <div class="container-fluid" style="margin-top: 10px">
    <h4>
      <i class="mdi mdi-sync mdi-spin mdi-50px"></i>
      Loading...
    </h4>
  </div>
</template>
```

### Row Detail - ViewModel
Same concept as the preload, we pass a Vue Component to the `viewComponent` that will be used to render our Row Detail.

###### Row Detail Component
```vue
<script setup lang="ts">
import type { RowDetailViewProps } from 'slickgrid-vue';

interface Item {
  assignee: string;
  duration: Date;
  percentComplete: number;
  reporter: string;
  start: Date;
  finish: Date;
  effortDriven: boolean;
  title: string;
  rowId: number;
}

const props = defineProps<RowDetailViewProps<Item>>();

function alertAssignee(name: string) {
  if (typeof name === 'string') {
    alert(`Assignee on this task is: ${name.toUpperCase()}`);
  } else {
    alert('No one is assigned to this task.');
  }
}

function deleteRow(model: Item) {
  if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
    // you first need to collapse all rows (via the 3rd party addon instance)
    props.addon?.collapseAll();

    // then you can delete the item from the dataView
    props.dataView?.deleteItem(model.rowId);

    props.parentRef?.showFlashMessage(`Deleted row with ${model.title}`, 'danger');
  }
}

function callParentMethod(model: Item) {
  props.parentRef?.showFlashMessage(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
}
</script>
<template>
  <div class="container-fluid" style="margin-top: 10px">
    <h3>{{ model.title }}</h3>
    <div class="row">
      <div class="col-3 detail-label"><label>Assignee:</label> <input :value="model.assignee" class="form-control" /></div>
      <div class="col-3 detail-label">
        <label>Reporter:</label> <span>{{ model.reporter }}</span>
      </div>
      <div class="col-3 detail-label">
        <label>Duration:</label> <span>{{ model.duration?.toISOString?.() }}</span>
      </div>
      <div class="col-3 detail-label">
        <label>% Complete:</label> <span>{{ model.percentComplete }}</span>
      </div>
    </div>

    <div class="row">
      <div class="col-3 detail-label">
        <label>Start:</label> <span>{{ model.start?.toISOString() }}</span>
      </div>
      <div class="col-3 detail-label">
        <label>Finish:</label> <span>{{ model.finish?.toISOString() }}</span>
      </div>
      <div class="col-3 detail-label"><label>Effort Driven:</label> <i :class="model.effortDriven ? 'mdi mdi-check' : ''"></i></div>
    </div>

    <hr />

    <div class="col-sm-8">
      <h4>
        Find out who is the Assignee
        <small>
          <button class="btn btn-primary btn-sm" data-test="assignee-btn" @click="alertAssignee(model.assignee || '')">Click Me</button>
        </small>
      </h4>
    </div>

    <div class="col-sm-4">
      <button class="btn btn-primary btn-danger btn-sm" data-test="delete-btn" @click="deleteRow(model)">Delete Row</button>
      <button class="btn btn-outline-secondary btn-sm" data-test="parent-btn" @click="callParentMethod(model)">Call Parent Method</button>
    </div>
  </div>
</template>
```

###### Grid Definition
```vue
<script setup lang="ts">

function defineGrid() {
  gridOptions.value = {
    enableRowDetailView: true,
    preRegisterExternalExtensions: (pubSubService) => {
      // Row Detail View is a special case because of its requirement to create extra column definition dynamically
      // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
      const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);
      return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
    },
    rowDetailView: {
      // We can load the "process" asynchronously via Fetch, Promise, ...
      process: (item) => http.get(`api/item/${item.id}`),

      // ...

      // Preload Component
      preloadComponent: Example19Preload,

      // Row Detail Component to load when row detail data is ready
      viewComponent: Example19DetailView,

      // Optionally pass your Parent Component reference to your Child Component (row detail component)
      parentRef: this
    }
  };
}
</script>

<template>
  <SlickgridVue gridId="grid40"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:data="dataset"
    @onVueGridCreated="vueGridReady($event.detail)" />
</template>
```

### Access Parent Component (grid) from the Child Component (row detail)
The Row Detail provides you access to the following references (SlickGrid, DataView, Parent Component and the Addon (3rd party plugin)), however please note that all of these references are available from the start **except** the Parent Component instance, for that one you need to reference it inside your Row Detail Grid Options like so:

```ts
<script setup lang="ts">

function defineGrid() {
  // Parent Component (grid)
  gridOptions.value = {
    enableRowDetailView: true,
    preRegisterExternalExtensions: (pubSubService) => {
      // Row Detail View is a special case because of its requirement to create extra column definition dynamically
      // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
      const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);
      return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
    },
    rowDetailView: {
      // ...
      // ViewComponent Template to load when row detail data is ready
      viewComponent: CustomDetailView,

      // Optionally pass your Parent Component reference to your Child Component (row detail component)
      parentRef: this  // <-- THIS REFERENCE
    }
  }
}

// a Parent Method that we want to access
function showFlashMessage(message: string, alertType = 'info') {
  setState((props, state) => {
    return { ...state, message, flashAlertType: alertType }
  });
}
</script>
```

Then in our Child Component, we can do some action on the Grid, the DataView or even call a method form the Parent Component (the `showFlashMessage` in our demo), with that in mind, here is the code of the Child Component

##### View
```vue
<template>
  <div class="container-fluid">
    <h3>{props.model.title}</h3>

      <-- delete a row using the DataView & SlickGrid objects -->
      <button class="btn btn-primary btn-danger btn-sm" onClick={deleteRow(props.model)} data-test="delete-btn">
        Delete Row
      </button>

      <!-- calling a Parent Component method -->
      <button class="btn btn-default btn-sm" onClick={callParentMethod(props.model)} data-test="parent-btn">
        Call Parent Method
      </button>
  </div>
</template>
```

##### Component
```vue
<script setup lang="ts">
import type { RowDetailViewProps } from 'slickgrid-vue';

interface Item {
  assignee: string;
  duration: Date;
  percentComplete: number;
  reporter: string;
  start: Date;
  finish: Date;
  effortDriven: boolean;
  title: string;
  rowId: number;
}

const props = defineProps<RowDetailViewProps<Item>>();

function assigneeChanged(newAssignee: string) {
  props.assignee = newAssignee;
}

function alertAssignee(name: string) {
  if (typeof name === 'string') {
    alert(`Assignee on this task is: ${name.toUpperCase()}`);
  } else {
    alert('No one is assigned to this task.');
  }
}

function deleteRow(model: any) {
  if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
    // you first need to collapse all rows (via the 3rd party addon instance)
    props.addon.collapseAll();

    // then you can delete the item from the dataView
    props.dataView.deleteItem(model.rowId);

    props.parentRef!.showFlashMessage(`Deleted row with ${model.title}`, 'danger');
  }
}

function callParentMethod(model: any) {
  props.parentRef!.showFlashMessage(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
}
</script>

<template>
</template>
```

## Troubleshooting
### Adding a Column dynamically is removing the Row Selection, why is that?
The reason is because the Row Selection (checkbox) plugin is a special column and Slickgrid-Vue is adding an extra column dynamically for the Row Selection checkbox and that is **not** reflected in your local copy of `columnDefinitions`. To address this issue, you need to get the Slickgrid-Vue internal copy of all columns (including the extra columns), you can get it via `getAllColumnDefinitions()` from the Grid Service and then you can use to that array and that will work.

```ts
function vueGridReady(vueGrid: SlickgridVueInstance) {
  vueGrid = vueGrid;
}

addNewColumn() {
  const newColumn = { /*...*/ };

  const allColumns = vueGrid.gridService.getAllColumnDefinitions();
  allColumns.push(newColumn);
  setState((props, state) => {
    return {
      ...state,
      columnDefinitions: allColumns.slice(); // or use spread operator [...cols]
    };
  }
}
```

## Row Detail with Inner Grid

You can also add an inner grid inside a Row Detail, however there are a few things to know off and remember. Any time a Row Detail is falling outside the main grid viewport, it will be unmounted and until it comes back into the viewport which is then remounted. The process of unmounting and remounting means that Row Detail previous states aren't preserved, however you could use Grid State & Presets to overcome this problem.

##### Component

Main Grid Component

```vue
<script setup lang="ts">
import { type Column, Filters, Formatters, GridState, OperatorType, SlickgridVue, SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  const columnDefinitions = [/*...*/];
  gridOptions.value = {
    enableRowDetailView: true,
    rowSelectionOptions: {
      selectActiveRow: true
    },
    preRegisterExternalExtensions: (pubSubService) => {
      // Row Detail View is a special case because of its requirement to create extra column definition dynamically
      // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
      const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);
      return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
    },
    rowDetailView: {
      process: (item: any) => simulateServerAsyncCall(item),
      loadOnce: false, // IMPORTANT, you can't use loadOnce with inner grid because only HTML template are re-rendered, not JS events
      panelRows: 10,
      preloadComponent: PreloadComponent,
      viewComponent:  InnerGridComponent,
    },
  };
}
</script>

<template>
  <SlickgridVue
    grid-id="grid40"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:data="dataset" />
</template>
```

Now, let's define our Inner Grid Component

```vue
<script setup lang="ts">
import { type Column, type GridOption, GridState, type RowDetailViewProps, SlickgridVue, SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, onMounted, ref, type Ref } from 'vue';

import MainGrid from './MainGrid.vue';

export interface Distributor { /* ... */ }
export interface OrderData { /* ... */ }

const props = defineProps<RowDetailViewProps<Distributor, typeof MainGrid>>();

const innerGridOptions = ref<GridOption>();
const innerColDefs: Ref<Column[]> = ref([]);
const innerDataset = ref<any[]>([]);
const innerGridClass = ref(`row-detail-${props.model.id}`);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

onMounted(() => {
  innerDataset.value = [...props.model.orderData];
  showGrid.value = true;
});

// OPTIONALLY save Grid State before unmounting the compoment
function handleBeforeGridDestroy() {
  const gridState = vueGrid.gridStateService.getCurrentGridState();
  sessionStorage.setItem(`gridstate_${innerGridClass.value}`, JSON.stringify(gridState));
}

function defineGrid() {
  // OPTIONALLY reapply Grid State as Presets before unmounting the compoment
  const gridStateStr = sessionStorage.getItem(`gridstate_${innerGridClass.value}`);
  let gridState: GridState | undefined;
  if (gridStateStr) {
    gridState = JSON.parse(gridStateStr);
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
    },
    enableFiltering: true,
    enableSorting: true,
    datasetIdPropertyName: 'orderId',
    presets: gridState, // reapply grid state presets
  };
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}
</script>
<template>
  <div :class="innerGridClass">
    <h4>Order Details (id: {{ model.id }})</h4>
    <div class="container-fluid">
      <slickgrid-vue
        v-if="showGrid"
        v-model:options="innerGridOptions"
        v-model:columns="innerColDefs"
        v-model:data="innerDataset"
        :grid-id="`innergrid-${model.id}`"
        @onBeforeGridDestroy="handleBeforeGridDestroy"
        @onVueGridCreated="vueGridReady($event.detail)"
      >
      </slickgrid-vue>
    </div>
  </div>
</template>
```