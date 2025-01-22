SlickGrid is very flexible and it allows you to change or add CSS Class(es) dynamically (or on page load) by changing it's `Item Metadata` (see [SlickGrid Wiki - Item Metadata](providing-grid-data.md)). There is also a Stack Overflow [answer](https://stackoverflow.com/a/19985148/1212166), which this code below is based from.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example11) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example11.vue)

### Dynamically Change CSS Classes
##### Component
```vue
<script setup lang="ts">
import { Column, FieldType, Filters, Formatters, GridOption, OperatorType, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
}

// get the SlickGrid Grid & DataView object references
function vueGridReady(vGrid : SlickgridVueInstance) {
  vueGrid = vGrid;
}

/**
 * Change the Duration Rows Background Color
 * You need to get previous SlickGrid DataView Item Metadata and override it
 */
function changeDurationBackgroundColor() {
  vueGrid.dataView.getItemMetadata = updateItemMetadataForDurationOver50(dataView.getItemMetadata);

  // also re-render the grid for the styling to be applied right away
  vueGrid.grid.invalidate();
  vueGrid.grid.render();
}

/**
 * Override the SlickGrid Item Metadata, we will add a CSS class on all rows with a Duration over 50
 * For more info, you can see this SO https://stackoverflow.com/a/19985148/1212166
 */
function updateItemMetadataForDurationOver50(previousItemMetadata: any) {
  const newCssClass = 'duration-bg';

  return (rowNumber: number) => {
    const item = dataView.getItem(rowNumber);
    let meta = {
      cssClasses: ''
    };
    if (typeof previousItemMetadata === 'object') {
      meta = previousItemMetadata(rowNumber);
    }

    // our condition to check Duration over 50
    if (meta && item && item.duration) {
      const duration = +item.duration; // convert to number
      if (duration > 50) {
        meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
      }
    }

    return meta;
  };
}
</script>

<template>
  <button class="btn btn-default" @click="changeDurationBackgroundColor()">Highlight Rows with Duration over 50</button>
  <SlickgridVue
    grid-id="grid1"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:data="dataset"
    @onVueGridCreated="vueGridReady($event.detail)"
  />
</script>
```

### On Page Load
Or if you want to apply the styling right after the page load

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
}

function vueGridReady(vGrid: SlickgridVueInstance) {
  vueGrid = vGrid;

  // if you want to change background color of Duration over 50 right after page load,
  // you would put the code here, also make sure to re-render the grid for the styling to be applied right away
  vueGrid.dataView.getItemMetadata = updateItemMetadataForDurationOver50(dataView.getItemMetadata);
  vueGrid.grid.invalidate();
  vueGrid.grid.render();
}

/**
 * Change the SlickGrid Item Metadata, we will add a CSS class on all rows with a Duration over 50
 * For more info, you can see this SO https://stackoverflow.com/a/19985148/1212166
 */
function updateItemMetadataForDurationOver50(previousItemMetadata: any) {
  const newCssClass = 'duration-bg';

  return (rowNumber: number) => {
    const item = dataView.getItem(rowNumber);
    let meta = {
      cssClasses: ''
    };
    if (typeof previousItemMetadata === 'object') {
      meta = previousItemMetadata(rowNumber);
    }

    if (meta && item && item.duration) {
      const duration = +item.duration; // convert to number
      if (duration > 50) {
        meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
      }
    }

    return meta;
  };
}
</script>
```
