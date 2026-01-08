SlickGrid has a nice amount of events, see the full list of [Available Events](Available-Events.md), which you can use by simply hook a `subscribe` to them (the `subscribe` are a custom `SlickGrid Event`). There are 2 options to get access to all these events (For the first 2 you will have to get access to the `Grid` and the `DataView` objects which are exposed in `Slickgrid-Vue`):

**From the list below, the number 1. is by far the easiest and preferred way**

### Example event in the rendered template

##### Component
Hook yourself to the Changed event of the bindable grid object.

```vue
<script setup lang="ts">
import { Column, Filters, Formatters, GridOption, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  columnDefinitions.value = [/* ... */];
  gridOptions.value = {/* ... */};
}

function vueGridReady(vGrid: SlickgridVueInstance) {
  vueGrid = vGrid;

  // the Vue Grid Instance exposes both Slick Grid & DataView objects
  gridObj = vueGrid.slickGrid;
  dataViewObj = vueGrid.dataView;

  // it also exposes all the Services
  // vueGrid.resizerService.resizeGrid(10);
}

function onCellClicked(e, args) {
  // do something
}

function onCellChanged(e, args) {
  updatedObject = args.item;
  vueGrid.resizerService.resizeGrid(10);
}

function onMouseEntered(e, args) {
  // do something
}
</script>

<template>
  <SlickgridVue
      grid-id='grid3'
      v-model:columns="columnDefinitions"
      v-model:options="gridOptions"
      v-model:dataset="dataset"
      @onCellChange="onCellChanged($event.detail.eventData, $event.detail.args)"
      @onClick="onCellClicked($event.detail.eventData, $event.detail.args)"
      @onMouseEnter="MouseEntered($event.detail.eventData, $event.detail.args)"
      @onValidationError="onCellValidationError($event.detail.eventData, $event.detail.args)"
      @onVueGridCreated="vueGridReady($event.detail)"
    />
</template>
```

#### How to use Grid/Dataview Events
Once the `Grid` and `DataView` are ready, see all [Available Events](../events/available-events.md). See below for the `gridChanged(grid)` and `dataviewChanged(dataview)` functions.
- The `GridExtraUtils` is to bring easy access to common functionality like getting a `column` from it's `row` and `cell` index.
- The example shown below is subscribing to `onClick` and ask the user to confirm a delete, then will delete it from the `DataView`.
- Technically, the `Grid` and `DataView` are created at the same time by `slickgrid-vue`, so it's ok to call the `dataViewObj` within some code of the `gridObjChanged()` function since `DataView` object will already be available at that time.

**Note** The example below is demonstrated with `bind` with event `Changed` hook on the `grid` and `dataview` objects. However you can also use the `EventAggregator` as shown earlier. It's really up to you to choose the way you want to call these objects.

##### Component
```vue
<script setup lang="ts">
import { Column, Filters, Formatters, GridOption, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function componentDidUnmount() {
  // don't forget to unsubscribe to the Slick Grid Events
  onCellChangeSubscriber.unsubscribe();
  onCellClickSubscriber.unsubscribe();
}

function defineGrid() {
  columnDefinitions.value = [
    { id: 'delete', field: 'id', formatter: Formatters.deleteIcon, maxWidth: 30 }
    // ...
  ];

  gridOptions.value = {
    editable: true,
    enableCellNavigation: true,
    autoEdit: true
  };
}

function subscribeToSomeGridEvents(grid) {
  onCellChangeSubscriber = grid.onCellChange.subscribe((e, args) => {
    console.log('onCellChange', args);
    // for example, CRUD with WebAPI calls
  });

  onCellClickSubscriber = grid.onClick.subscribe((e, args) => {
    const column = GridExtraUtils.getColumnDefinitionAndData(args);

    if (column.columnDef.id === 'delete') {
      if (confirm('Are you sure?')) {
        dataviewObj.deleteItem(column.dataContext.id);
        dataviewObj.refresh();
      }
    }
  });
}

function vueGridReady(vueGrid: SlickgridVueInstance) {
  vueGrid = vueGrid;
  gridObj = vueGrid.slickGrid;
  dataviewObj = vueGrid.dataView;
}
</script>

<template>
  <SlickgridVue gridId="grid12"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:dataset="dataset"
    @onGridStateChanged="gridStateChanged($event.detail)"
    @onVueGridCreated="vueGridReady($event.detail)"
  />
</template>
```
