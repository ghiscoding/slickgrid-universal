#### Index
- [Usage](#usage)
- [Sorting Complex Objects](#how-to-sort-complex-objects)
- [Custom Sort Comparer](#custom-sort-comparer)
- [Update Sorting Dynamically](#update-sorting-dynamically)
- [Dynamic Query Field](#dynamic-query-field)
- [Sorting Dates](#sorting-dates)
- [Pre-Parse Date Columns for better perf](#pre-parse-date-columns-for-better-perf)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example4) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example4.vue)

### Description
Sorting on the client side is really easy, you simply need to enable `sortable` (when not provided, it is considered as disabled) on each columns you want to sort and it will sort as a type string. Oh but wait, sorting as string might not always be ideal, what if we want to sort by number or by date? The answer is to simply pass a `type` as shown below.

### Usage
To use any of them, you can use the `FieldType` interface or enter a type via a string as shown below. Also please note that `FieldType.string` is the default and you don't necessarily need to define it, though you could if you wish to see it in your column definition.

```vue
<script setup lang="ts">
import { type Column, FieldType, Filters, Formatters, OperatorType, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  columnDefinitions.value = [
    { id: 'title', name: 'Title', field: 'title', sortable: true },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, type: FieldType.number },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, type: FieldType.float},
    { id: 'start', name: 'Start', field: 'start', sortable: true, type: FieldType.dateIso },
    { id: 'finish', name: 'Finish', field: 'finish', sortable: true, type: FieldType.dateIso },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true }
  ];
}
</script>
```

### How to Sort Complex Objects?
You can sort complex objects using the dot (.) notation inside the `field` property defined in your Columns Definition.

For example, let say that we have this dataset

```ts
dataset.value = [
 { item: 'HP Desktop', buyer: { id: 1234, address: { street: '123 Belleville', zip: 123456 }} },
 { item: 'Lenovo Mouse', buyer: { id: 456, address: { street: '456 Hollywood blvd', zip: 789123 }} }
];
```

We can now filter the zip code from the buyer's address using this filter:
```ts
columnDefinitions.value = [
  {
    // the zip is a property of a complex object which is under the "buyer" property
    // it will use the "field" property to explode (from "." notation) and find the child value
    id: 'zip', name: 'Zip Code', field: 'buyer.address.zip', sortable: true
  }
  // { id: 'street',  ... },
];
```

### Custom Sort Comparer
If the builtin sort comparer methods are not sufficient for your use case, you could add your own custom Sort Comparer in your Column Definitions as shown below. Note that we are only showing a simple numeric sort, just adjust it to your needs.

```ts
columnDefinitions.value = [{
  id: 'myField', name: 'My Field',
  sorter: (a, b) => a > b ? 1 : -1,
}];
```

similarly with a complex object

```ts
// data = { user: { firstName: 'John', lastName: 'Doe', fullName: 'John Doe' }, address: { zip: 123456 } }};

columnDefinitions.value = [{
  id: 'firstName', name: 'First Name', field: 'user.firstName',
  sorter: (a, b) => a.fullName > b.fullName ? 1 : -1,
}];
```

### Update Sorting Dynamically
You can update/change the Sorting dynamically (on the fly) via the `updateSorting` method from the `SortService`. Note that calling this method will override all sorting (sorters) and replace them with the new array of sorters provided. For example, you could update the sorting from a button click or a select dropdown list with predefined filter set.

##### Component
```vue
<script setup lang="ts">
import { type Column, FieldType, Filters, Formatters, OperatorType, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
let vueGrid: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
}

function vueGridReady(vGrid: SlickgridVueInstance) {
  vueGrid = vGrid;
}

function setSortingDynamically() {
  vueGrid.sortService.updateSorting([
    // orders matter, whichever is first in array will be the first sorted column
    { columnId: 'duration', direction: 'ASC' },
    { columnId: 'start', direction: 'DESC' },
  ]);
}
</script>

<template>
  <button className="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="set-dynamic-sorting"
    onClick={() => setSortingDynamically()}>
    Set Sorting Dynamically
  </button>

  <slickgrid-vue
    grid-id="grid4"
    v-model:columns="columnDefinitions"
    v-model:options="gridOptions"
    v-model:data="dataset"
    @onGridStateChanged="gridStateChanged($event.detail)"
    @onvueGridCreated="vueGridReady($event.detail)"
    @onRowCountChanged="refreshMetrics($event.detail.eventData, $event.detail.args)"
  ></slickgrid-vue>
</template>
```

#### Extra Arguments
The `updateSorting` method has 2 extra arguments:
- 2nd argument, defaults to true, is to emit a sort changed event (the GridStateService uses this event)
  - optional and defaults to true `updateSorting([], true)`
- 3rd argument is to trigger a backend query (when using a Backend Service like OData/GraphQL), this could be useful when using updateFilters & updateSorting and you wish to only send the backend query once.
  - optional and defaults to true `updateSorting([], true, true)`

### Dynamic Query Field
What if you a field that you only know which field to query only at run time and depending on the item object (`dataContext`)?
We can defined a `queryFieldNameGetterFn` callback that will be executed on each row when Filtering and/or Sorting.

```ts
queryFieldNameGetterFn: (dataContext) => {
  // do your logic and return the field name will be queried
  // for example let say that we query "profitRatio" when we have a profit else we query "lossRatio"
  return dataContext.profit > 0 ? 'profitRatio' : 'lossRatio';
},
```

### Sorting Dates

Date sorting should work out of the box as long as you provide the correct column field type. Note that there are various field types that can be provided and they all do different things. For the Sorting to work properly, you need to make sure to use the correct type for Date parsing to work accordingly. Below is a list of column definition types that you can provide:

- `type`: input/output of date fields, or in other words, parsing/formatting dates with the field `type` provided
- `outputType`: when a `type` is provided for parsing (i.e. from your dataset), you could use a different `outputType` to format your date differently
- `saveOutputType`: if you already have a `type` and an `outputType` but you wish to save your date (i.e. save to DB) in yet another format

#### Custom Formats

There are multiple field types available with a set of built-in Date formats available (i.e.: `date`, `dateIso`, `dateEuro`, `dateUs`, ...). But, what if you want to use a custom date format that is now available in the list of built-in types? You could provide a custom input and/or output format(s) via the column definition `params` that will work correctly with Sorting, Filtering and even Formatter (for that latter one, you must provide the base formatter `Formatters.date`)

For example, the code below will accept a US date as input (DB) and display the date as more human readable format to the screen and even though both formats are custom, this will work properly while Sorting & Filtering.

```ts
this.columns = [
  {
    id: 'start', name: 'Start', field: 'start',
    type: 'date', // you must still provide any date type, otherwise the custom format won't be read
    formatter: Formatters.date, // base date formatter requires at the minimum "params.outputFormat"
    params: {
      inputFormat: 'M/D/YYYY',     // ie: 12/30/2000
      outputFormat: 'MMM DD, YYYY' // ie: Dec 30, 2000
    },
  }
];
```

> see Tempo lib for available [tokens](https://tempo.formkit.com/#format-tokens)

### Pre-Parse Date Columns for better perf
##### requires v5.8.0 and higher

Sorting very large dataset with dates can be extremely slow when dates formated date strings, the reason is because these strings need to first be parsed and converted to real JS Dates before the Sorting process can actually happen (i.e. US Date Format). However parsing a large dataset can be slow **and** to make it worst, a Sort will revisit the same items over and over which mean that the same date strings will have to be reparsed over and over (for example while trying to Sort a dataset of 100 items, I saw some items being revisit 10 times and I can only imagine that it is exponentially worst with a large dataset).

So what can we do to make this faster with a more reasonable time? Well, we can simply pre-parse all date strings once and only once and convert them to JS Date objects. Then once we get Date objects, we'll simply read the UNIX timestamp which is what we need to Sort. The first pre-parse takes a bit of time and will be executed only on the first date column Sort (any sort afterward will read the pre-parsed Date objects).

What perf do we get with pre-parsing versus regular non-parsing? The benchmark was pulled using 50K items with 2 date columns (with US date format)
- without non-parsing: ~15sec
- with pre-parsing: ~1.4sec (1st pre-parse) and any subsequent Date sort is about ~0.2sec => so about ~1.5sec total

The summary, is that we get a 10x boost **but** not only that, we also get an extremely fast subsequent sort afterward (sorting Date objects is as fast as sorting Numbers).

#### Usage

You can use the `preParseDateColumns` grid option, it can be set as either a `boolean` or a `string` but there's a big distinction between the 2 approaches as shown below (note that both approaches will mutate the dataset).
1. `string` (i.e. set to `"__"`, it will parse a `"start"` date string and assign it as a `Date` object to a new `"__start"` prop)
2. `boolean` (i.e. parse `"start"` date string and reassign it as a `Date` object on the same `"start"` prop)

> **Note** this option **does not work** with the Backend Service API because it simply has no effect.

For example if our dataset has 2 columns named "start" and "finish", then pre-parse the dataset,

with the 1nd approach (`string`), let's use `"__"` (which is in reality a prefix) it will mutate the dataset by adding new props (where `Date` is a `Date` object)

```diff
data = [
-  { id: 0, start: '02/28/24', finish: '03/02/24' },
-  { id: 1, start: '01/14/24', finish: '02/13/24' },
+  { id: 0, start: '02/28/24', finish: '03/02/24', __start: Date, __finish: Date },
+  { id: 1, start: '01/14/24', finish: '02/13/24', __start: Date, __finish: Date },
]
```

with the 2nd approach (`boolean`), it will instead mutate the dataset by overwriting the same properties

```diff
data = [
-  { id: 0, start: '02/28/24', finish: '03/02/24' },
-  { id: 1, start: '01/14/24', finish: '02/13/24' },
+  { id: 0, start: Date, finish: Date },
+  { id: 1, start: Date, finish: Date },
]
```

Which approach to choose? Both have pros and cons, overwriting the same props might cause problems with the column `type` that you use, you will have to give it a try yourself. On the other hand, with the other approach, it will duplicate all date properties and take a bit more memory usage and when changing cells we'll need to make sure to keep these props in sync, however you will likely have less `type` issues.

What happens when we do any cell changes (for our use case, it would be Create/Update), for any Editors we simply subscribe to the `onCellChange` change event and we re-parse the date strings when detected. We also subscribe to certain CRUD functions as long as they come from the `GridService` then all is fine... However, if you use the DataView functions directly then we have no way of knowing when to parse because these functions from the DataView don't have any events. Lastly, if we overwrite the entire dataset, we will also detect this (via an internal flag) and the next time you sort a date then the pre-parse kicks in again.

#### Can I call the pre-parse myself?

Yes, if for example you want to pre-parse right after the grid is loaded, you could call the pre-parse yourself for either all items or a single item
- all item pre-parsing: `sgb.sortService.preParseAllDateItems();`
  - the items will be read directly from the DataView
- a single item parsing: `sgb.sortService.preParseSingleDateItem(item);`
