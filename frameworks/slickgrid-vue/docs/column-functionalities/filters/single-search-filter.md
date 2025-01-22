#### Index
- [Update Filters Dynamically](input-filter.md#update-filters-dynamically)
- [Custom Filter Predicate](input-filter.md#custom-filter-predicate)

### Description
Some users might want to have 1 main single search for filtering the grid data instead of using multiple column filters. You can see a demo of that below

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example21) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example21.tsx#L162)

### Code Sample
##### Component
```vue
<script setup lang="ts">
import { type Column, FieldType, Filters, Formatters, OperatorType, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions = ref<Column[]>([]);
const dataset = ref<any[]>([]);
const selectedColumn = ref<Column>();
const selectedOperator = ref<string>();
const searchValue = ref<string>();
let vueGrid: SlickgridVueInstance;
let dataView: SlickDataView;
let gridOptions: GridOption;
let operatorList: OperatorString[] = ['=', '<', '<=', '>', '>=', '<>'];

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
}

function vueGridReady(vGrid: SlickgridVueInstance) {
  vueGrid = vGrid;
}

//
// -- if any of the Search form input changes, we'll call the updateFilter() method
//

function selectedOperatorChanged() {
  updateFilter();
}

function selectedColumnChanged() {
  updateFilter();
}

function searchValueChanged() {
  updateFilter();
}

function updateFilter() {
  const fieldName = selectedColumn.field;
  const filter = {};
  const filterArg: FilterCallbackArg = {
    columnDef: selectedColumn,
    operator: selectedOperator as OperatorString, // or fix one yourself like '='
    searchTerms: [searchValue || '']
  };

  if (searchValue) {
    // pass a columnFilter object as an object which it's property name must be a column field name (e.g.: 'duration': {...} )
    filter[fieldName] = filterArg;
  }

  vueGrid.dataView.setFilterArgs({
    columnFilters: filter,
    grid: vueGrid.slickGrid
  });
  vueGrid.dataView.refresh();
}
</script>

<template>
  <div id="demo-container" class="container-fluid">
    <h2>Title</h2>

    <div class="row row-cols-lg-auto g-1 align-items-center">
      <div class="col">
        <label htmlFor="columnSelect">Single Search:</label>
      </div>
      <div class="col">
        <select class="form-select" data-test="search-column-list" name="selectedColumn" @change="selectedColumnChanged($event)">
          <option value="''">...</option>
          <option v-for="column in columnDefinitions" :value="column.id" :key="column.id">{{column.name}}</option>
        </select>
      </div>
      <div class="col">
        <select class="form-select" data-test="search-operator-list" name="selectedOperator" @change="selectedOperatorChanged($event)">
          <option value="''">...</option>
          <option v-for="operator in operatorList" :value="operator" :key="operator">{{operator}}</option>
        </select>
      </div>

      <div class="col">
        <div class="input-group">
          <input type="text"
            class="form-control"
            placeholder="search value"
            data-test="search-value-input"
            value={state.searchValue}
            @input="searchValueChanged($event)" />
          <button class="btn btn-outline-secondary d-flex align-items-center pl-2 pr-2" data-test="clear-search-value"
            @click="clearGridSearchInput()">
            <span class="mdi mdi-close m-1"></span>
          </button>
        </div>
      </div>
    </div >

    <hr />

    <slickgrid-vue
      grid-id="grid21"
      v-model:columns="columnDefinitions"
      v-model:options="gridOptions"
      v-model:data="dataset"
      @onvueGridCreated="vueGridReady($event.detail)"
    ></slickgrid-vue>
  </div>
</template>
```

## Sample
![2019-04-16_15-42-05](https://user-images.githubusercontent.com/643976/56239148-3b530680-605e-11e9-99a2-e9a163abdd0c.gif)
