#### index
- [Filter Complex Object](input-filter.md#filter-complex-object)
- [Update Filters Dynamically](input-filter.md#update-filters-dynamically)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example4) / [Demo Client Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example4.vue) / [Custom InputFilter.ts](https://github.com/ghiscoding/slickgrid-vue/blob/master/src/examples/slickgrid/custom-inputFilter.ts)

### Description
You can also create your own Custom Filter with any html/css you want to use. Vue template (View) are not supported at this point, if you wish to contribute on that end then I certainly accept PR (Pull Request).

#### Limitations
- as mentioned in the description, only html/css and/or JS libraries are supported.
  - this mainly mean that Vue templates (Views) are not supported (feel free to contribute).
- SlickGrid uses `table-cell` as CSS for it to display a consistent height for each rows (this keeps the same row height/line-height to always be the same).
  - all this to say that you might be in a situation were your filter shows in the back of the grid. The best approach to overcome this is to use a modal if you can or if the library support `append to body container`. For example, you can see that `multiple-select.js` support a `container` and is needed for the filter to work as can be seen in the [multipleSelectFilter.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/filters/multipleSelectFilter.ts#L26)

### How to use Custom Filter?
1. You first need to create a `class` using the [Filter interface](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/models/filter.interface.ts). Make sure to create all necessary public properties and functions.
 - You can see a demo with a [custom-inputFilter.ts](https://github.com/ghiscoding/slickgrid-vue/blob/master/src/examples/slickgrid/custom-inputFilter.ts) that is used in the [demo - example 4](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example4)
2. There are two methods to use your custom filters on the grid.
   1.  Simply set the `columnDefinition.filter.model` to your new custom Filter class and instantiate it with `new` (you can also use dependency injection in the constructor if you wish). Here is an example with a custom input filter:

```vue
<script setup lang="ts">
function defineGrid() {
  // define you columns, in this demo Effort Driven will use a Select Filter
  columnDefinitions.value = [
    { id: 'title', name: 'Title', field: 'title' },
    { id: 'description', name: 'Description', field: 'description',
      filterable: true,
      filter: {
          model: CustomInputFilter // create a new instance to make each Filter independent from each other
      }
    }
  ];

  // you also need to enable the filters in the Grid Options
  const gridOptions = {
      enableFiltering: true
  };
}
</script>
```

2. Or register your filter with the `registerTransient` method on the Vue container in the startup file (see the demo [index.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/index.ts). It is recommended to use `registerTransient`, though you could use whatever lifetime you want). This registration is usually in `main.ts` or `main.js`. Then in your view model pass your custom filter to `columnDefinition.filter.model` property and we will use Vue's container to instantiate your filter. Here is that example:

**myCustomFilter.ts**

```vue
<script setup lang="ts">
import { type Column, Filters, Formatters, SlickgridVue, type VanillaCalendarOption } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const $filterElm = ref();
const callback: FilterCallback;
const operator: OperatorType | OperatorString = OperatorType.equal;

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() { }

function init(args: FilterArguments) {
  // ...logic
}

function clear(triggerFilterKeyup = true) {
  // ...logic
}

function destroy() {
  // ...logic
}
</script>
```

**my-view-model.ts**

```vue
<script setup lang="ts">
import { type Column, Filters, Formatters, SlickgridVue, type VanillaCalendarOption } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  // define you columns, in this demo Effort Driven will use a Select Filter
  columnDefinitions.value = [
    { id: 'title', name: 'Title', field: 'title' },
    { id: 'description', name: 'Description', field: 'description',
      filterable: true,
      filter: {
        type: 'my-custom-filter'
      }
    }
  ];

  // you also need to enable the filters in the Grid Options
  gridOptions.value = {
    enableFiltering: true
  };
}
</script>
```

### Default Filter Type
By default, the library uses the [inputFilter](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/filters/inputFilter.ts) when none is specified. However, you can override this value with any filter you like during the startup/configuration of your Vue application:

**main.ts**

### Default Search Term(s)
If you want to load the grid with certain default filter(s), you can use the following optional properties:
- `searchTerms` (array of values)

For example, setting a default value into an `input` element, you can simply get the search term with `columnDef.filter.searchTerms` and set the default value with `filterElm.value = searchTerms;`

### Collection
If you want to pass a `collection` to your filter (for example, a multiple-select needs a select list of options), you can then use it in your custom filter through `columnDef.filter.collection`

#### `key/label` pair
By default a `collection` uses the `label/value` pair. You can loop through your `collection` and use the `label/value` properties. For example:

```vue
<script setup lang="ts">
// loop through collection to create select option
columnDef.value.filter.collection.forEach((option: SelectOption) => {
  // use the option value & label
  options += `<option value="${option.value}">${option.label}</option>`;
});
</script>
```

#### Custom Structure (key/label pair)
What if your `collection` have totally different value/label pair? In this case, you can use the `customStructure` to change the property name(s) to use. You can change the label and/or the value, they can be passed independently.
For example:
```vue
<script setup lang="ts">
// use custom structure value/label pair
const labelName = (columnDef.filter.customStructure) ? columnDef.filter.customStructure.label : 'label';
const valueName = (columnDef.filter.customStructure) ? columnDef.filter.customStructure.value : 'value';

columnDef.filter.collection.forEach((option: SelectOption) => {
  // use the option value & translated label
  options += `<option value="${option[valueName]}">${option[labelName]}</option>`;
});
</script>
```

### How to add Translation?

#### LabelKey
By default a `collection` uses the `label/value` pair without translation or `labelKey/value` pair with translation usage. So if you want to use translations, then you can loop through your `collection` and use the `labelKey/value` properties. For example:
```vue
<script setup lang="ts">
columnDef.filter.collection.forEach((option: SelectOption) => {
  // translate label
  const textLabel = (option.labelKey && typeof i18n.tr === 'function') ? i18n.tr(option.labelKey || ' ') : option.labelKey;

  // use the option value & translated label
  options += `<option value="${option.value}">${textLabel}</option>`;
});
</script>
```

### Custom Structure with Translation
What if you want to use `customStructure` and translate the labels? Simply pass the flag `enableTranslateLabel: true`

For example:
```vue
<script setup lang="ts">
// use custom structure value/label pair
const labelName = (columnDef.filter.customStructure) ? columnDef.filter.customStructure.label : 'label';
const valueName = (columnDef.filter.customStructure) ? columnDef.filter.customStructure.value : 'value';

columnDef.filter.collection.forEach((option: SelectOption) => {
  // translate label
  const textLabel = (option.labelKey && typeof i18n.tr === 'function') ? i18n.tr(option[labelName] || ' ') : option[labelName];

  // use the option value & translated label
  options += `<option value="${option[valueName]}">${textLabel}</option>`;
});
</script>
```
