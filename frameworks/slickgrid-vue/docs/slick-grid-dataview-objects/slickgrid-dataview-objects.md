##### index
- [Grid, DataView objects through vueGridCreated](#grid--dataview-objects-through-vueGridcreated)
- [Grid, DataView objects & Services via `instances` bindable](#grid--dataview-objects--services-through-instances-bindable)

In some cases you might want a feature that is not yet available in `slickgrid-vue` but exists in the original `SlickGrid`, what should you do? Fear not, we got you covered. `slickgrid-vue` exposes the SlickGrid `Grid` and `DataView` objects through Event Aggregators, these objects are created when slickgrid-vue initialize the grid (with `defineGrid()`). So if you subscribe to the Event Aggregator, you will get the SlickGrid and DataView objects and from there you can call any of the SlickGrid features.

**The preferred way is now to use the `SlickgridVueInstance` via the `instances` bindable as shown [here](#grid--dataview-objects--services-through-instances-bindable)**

### Grid & DataView objects through `vueGridCreated`
Since version `2.x`, we can now access the Slick `Grid` & `DataView` objects directly from the `SlickgridVueInstance` through the `onvueGridCreated` Event Dispatch, for example:

##### Component
```vue
<script setup lang="ts">
import { type Column, Filters, Formatters, SlickgridVue, SlickgridVueInstance } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const isAutoEdit = ref(true);
let vueGrid: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {}

function vueGridReady(vGrid: SlickgridVueInstance) {
  vueGrid = vGrid;
}

/** Change dynamically `autoEdit` grid options */
function setAutoEdit(autoEdit) {
  isAutoEdit.value = autoEdit;
  vueGrid.grid?.setOptions({ autoEdit }); // change the grid option dynamically
  return true;
}

function collapseAllGroups() {
  vueGrid.dataView?.collapseAllGroups();
}

function expandAllGroups() {
  vueGrid.dataView?.expandAllGroups();
}
</script>

<template>
  <div id="demo-container" class="container-fluid">
    <div class="col-sm-6">
      <label class="me-1">autoEdit setting:</label>
      <span id="radioAutoEdit">
        <label class="radio-inline control-label me-1" htmlFor="radioTrue">
          <input
            type="radio"
            name="inlineRadioOptions"
            id="radioTrue"
            defaultChecked={this.state.isAutoEdit}
            @input="setAutoEdit(true)"
          />
          ON (single-click)
        </label>
        <label class="radio-inline control-label" htmlFor="radioFalse">
          <input
            type="radio"
            name="inlineRadioOptions"
            id="radioFalse"
            @input="setAutoEdit(false)"
          />
          OFF (double-click)
        </label>
      </span>
    </div>

    <div class="col-sm-12">
      <SlickgridVue
        grid-id="grid3"
        v-model:columns="columnDefinitions"
        v-model:options="gridOptions"
        v-model:dataset="dataset"
        @onCellChange="onCellChanged($event.detail.eventData, $event.detail.args)"
        @onClick="onCellClicked($event.detail.eventData, $event.detail.args)"
        @onValidationError="onCellValidationError($event.detail.eventData, $event.detail.args)"
        @onVueGridCreated="vueGridReady($event.detail)"
      />
    </div>
  </div>
</template>
```

### Grid & DataView objects & Services through `instances` bindable
You could also get all the Service instances via the new `instances` bindable property

##### Component
```vue
<script setup lang="ts">
import { SlickgridVueInstance, Column, GridOption } from 'slickgrid-vue';

let vueGrid: SlickgridVueInstance;

function vueGridReady(vGrid: SlickgridVueInstance) {
  vueGrid = vGrid;
}

/** Change dynamically `autoEdit` grid options */
function setAutoEdit(isAutoEdit) {
  this.isAutoEdit = isAutoEdit;
  this.vueGrid.slickGrid.setOptions({ autoEdit: isAutoEdit }); // change the grid option dynamically
  return true;
}
</script>

<template>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:dataset="dataset"
    @onVueGridCreated="vueGridReady($event.detail)"
  />
</template>
```

### SlickGrid Events (original SlickGrid)
You have access to all original SlickGrid events which you can subscribe, for more info refer to the [Docs - Grid & DataView Events](../events/grid-dataview-events.md)

### Usage
There's already all the necessary information on how to use this on the [Docs - Grid & DataView Events](../events/grid-dataview-events.md) page, so I suggest you to head over to that Wiki page on how to use the `SlickGrid` and `DataView` objects
