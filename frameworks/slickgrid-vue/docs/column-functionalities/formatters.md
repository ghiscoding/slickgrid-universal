# Formatters

#### Index

* [Built-in Formatter](#list-of-provided-formatters)
* [Extra Params/Arguments](#extra-argumentsparams)
* [Using Multiple Formatters](#using-multiple-formatters)
* [Custom Formatter](#custom-formatter)
  - [Example of a Custom Formatter with HTML string](#example-of-a-custom-formatter-with-html-string)
  - [Example with `FormatterResultObject` instead of a string](#example-with-formatterresultobject-instead-of-a-string)
  - [Example of Custom Formatter with Native DOM Element](#example-of-custom-formatter-with-native-dom-element)
* [Common Formatter Options](#common-formatter-options)
* [PostRenderer Formatter (async)](#postrender-formatter-async)
* [Vue Component Formatter](#vue-component-formatter)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue/#/slickgrid/Example2) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example2.vue)

#### Definition

`Formatters` are functions that can be used to change and format the output of certain column(s) in the grid. Please note that using a Formatter does not alter in any ways the input data, it simply changes (format) data in a more readable way for the end user in the UI.

A good example of a `Formatter` could be a timestamp or a `Date` object that we could format differently in the grid, for example using `Formatters.dateIso` or `Formatters.dateUs` which is more human readable.

#### Provided Formatters

`Slickgrid-Universal` ships with a few `Formatters` by default which helps with common fields, you can see the [entire list here](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/formatters/index.ts#L37).

> **Note** you might not need a Formatter when simple CSS styling and class might be enough, think about using `cssClass` column property as much as possible since it has much better perf.
> For example: `{ cssClass: 'text-right' }` on your column definition (or any other class) to align on the right.

**List of provided `Formatters`**

* `Formatters.arrayObjectToCsv`: Takes an array of complex objects and converts it to a comma delimited string.
  * you also need to pass the property name(s) for the complex object, i.e.: `formatter: Formatters.arrayObjectToCsv, params: { propertyNames: ['name'], useFormatterOuputToFilter: true }`
* `Formatters.arrayToCsv` : takes an array of text and returns it as CSV string
* `Formatters.checkmarkMaterial` will display a checkmark icon when value is truthy using Material Design icons
* `Formatters.collection`: Looks up values from the columnDefinition.params.collection property and displays the label in CSV or string format
* `Formatters.complexObject`: takes a complex object (with a `field` that has a `.` notation) and pull correct value, there are multiple ways to use it
  1. `{ id: 'firstName', field: 'user.firstName', formatter: Formatters.complexObject}`, will display the user's first name
  2. `{ id: 'firstName', field: 'user', labelKey: 'firstName', params: { complexField: 'user' }, ... }`
  3. `{ id: 'firstName', field: 'user', params: { complexField: 'user.firstName' }, ... }`
* `Formatters.currency`: will help with currency other than dollar (ie `€`), there are multiple `params` available for this formatter
  * `currencyPrefix`, `currencySuffix`, `minDecimal`, `maxDecimal`, `numberPrefix`, `numberSuffix`, `decimalSeparator`, `thousandSeparator` and `displayNegativeNumberWithParentheses`
  * the distinction between `numberPrefix` and `currencyPrefix` can be seen when using `displayNegativeNumberWithParentheses`, for example if we have a value of `-12.432` with the `Formatters.currency` and `params: { currencyPrefix: '€', numberPrefix: 'Price ', numberSuffix: 'EUR' }` the output will be `"Price (€12.432) EUR"`
* `Formatters.dateEuro`: Takes a Date object and displays it as an Euro Date format (DD/MM/YYYY)
* `Formatters.dateTimeEuro`: Takes a Date object and displays it as an Euro Date+Time format (DD/MM/YYYY HH:mm:ss)
* `Formatters.dateTimeShortEuro`: Takes a Date object and displays it as an Euro Date+Time (without seconds) format (DD/MM/YYYY HH:mm)
* `Formatters.dateTimeEuroAmPm`: Takes a Date object and displays it as an Euro Date+Time+(am/pm) format (DD/MM/YYYY hh:mm:ss a)
* `Formatters.dateIso` : Takes a Date object and displays it as an ISO Date format (YYYY-MM-DD)
* `Formatters.dateTimeIso` : Takes a Date object and displays it as an ISO Date+Time format (YYYY-MM-DD HH:mm:ss)
* `Formatters.dateTimeIsoAmPm` : Takes a Date object and displays it as an ISO Date+Time+(am/pm) format (YYYY-MM-DD h:mm:ss a)
* `Formatters.dateTimeShortIso`: Takes a Date object and displays it as an ISO Date+Time (without seconds) format (YYYY-MM-DD HH:mm)
* `Formatters.dateUs` : Takes a Date object and displays it as an US Date format (MM/DD/YYYY)
* `Formatters.dateTimeUs` : Takes a Date object and displays it as an US Date+Time format (MM/DD/YYYY HH:mm:ss)
* `Formatters.dateTimeShortUs`: Takes a Date object and displays it as an US Date+Time (without seconds) format (MM/DD/YYYY HH:mm:ss)
* `Formatters.dateTimeUsAmPm` : Takes a Date object and displays it as an US Date+Time+(am/pm) format (MM/DD/YYYY hh:mm:ss a)
* `Formatters.dateUtc` : Takes a Date object and displays it as a TZ format (YYYY-MM-DDThh:mm:ssZ)
* `Formatters.decimal`: Display the value as x decimals formatted, defaults to 2 decimals. You can pass "minDecimal" and/or "maxDecimal" to the "params" property.
* `Formatters.dollar`: Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value.
* `Formatters.dollarColored`: Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value
* `Formatters.dollarColoredBoldFormatter`: Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value, show it in bold font weight as well
* `Formatters.hyperlink`: takes a URL cell value and wraps it into a clickable hyperlink `<a href="value">value</a>`
  * the cell value **must contain** (`ftp://abc`, `http://abc` or `https://abc`), if it doesn't then use `fakeHyperlink`
* `Formatters.hyperlinkUriPrefix`: format a URI prefix into an hyperlink
* `Formatters.icon`: to display an icon with defined CSS class name, use `params` to pass a `cssClass` property
* `Formatters.iconBoolean`: similar to `icon` but will only be displayed on a Boolean truthy value, use `params` to pass a `cssClass` property
* `Formatters.mask`: to change the string output using a mask, use `params` to pass a `mask` property
  * example: `{ field: 'phone', formatter: Formatters.mask, params: { mask: '(000) 000-0000' }}`
* `Formatters.multiple`: pipe multiple formatters (executed in sequence), use `params` to pass the list of formatters.
  * example: `{ field: 'title', formatter: Formatters.multiple, params: { formatters: [ Formatters.lowercase, Formatters.uppercase ] }`
* `Formatters.percent`: Takes a cell value number (between 0.0-1.0) and displays a red (<50) or green (>=50) bar
* `Formatters.percentComplete` : takes a percentage value (0-100%), displays a bar following this logic:
  * `red`: < 30%, `grey`: < 70%, `green`: >= 70%
* `Formatters.percentCompleteBar` : same as `percentComplete` but uses [Bootstrap - Progress Bar with label](https://getbootstrap.com/docs/3.3/components/#progress-label).
* `Formatters.percentCompleteBarWithText`: Takes a cell value number (between 0-100) and displays SlickGrid custom "percent-complete-bar" with Text a red (<30), silver (>30 & <70) or green (>=70) bar
* `Formatters.percentSymbol`: Takes a cell value number (between 0-100) and add the "%" after the number
* `Formatters.progressBar`: Takes a cell value number (between 0-100) and displays Bootstrap "progress-bar" a red (<30), silver (>30 & <70) or green (>=70) bar
* `Formatters.translate`: Takes a cell value and translates it (i18n). Requires an instance of the Translate Service:: \`i18n: translate
* `Formatters.translateBoolean`: Takes a boolean value, cast it to upperCase string and finally translates it (i18n).
* `Formatters.tree`: Formatter that must be used when the column is a Tree Data column

> **Note:** The list might not be up to date (especially for Dates), please refer to the [Formatters export](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/formatters/index.ts#L37) to know exactly which formatters are available.

> **Note** all Date formatters are formatted using [Tempo](https://tempo.formkit.com/#format-tokens). There are also many more Date formats not shown above, simply visit the [formatters.index](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/formatters/formatters.index.ts#L101) to see all available Date/Time formats.

### Usage
To use any of them, you simply need to import `Formatters` from `Slickgrid-Universal` and add a `formatter: Formatters.xyz` (where `xyx` is the name of the built-in formatter) in your column definitions as shown below:

```vue
<script setup lang="ts">
import { Column, FieldType, Filters, Formatters, OperatorType, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  const columnDefinitions = [
    { id: 'title', name: 'Title', field: 'title' },
    { id: 'duration', name: 'Duration (days)', field: 'duration' },
    { id: '%', name: '% Complete', field: 'percentComplete', formatter: Formatters.percentComplete },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', formatter: Formatters.checkmark }
  ];
}
</script>
```

#### Extra Arguments/Params

What if you want to pass extra arguments that you want to use within the Formatter? You can use `params` for that. For example, let say you have a custom formatter to build a select list (dropdown), you could do it this way:

```ts
let optionList = ['True', 'False'];

columnDefinitions.value = [
  { id: 'title', field: 'title',
    headerTranslate: 'TITLE',
    formatter: myCustomSelectFormatter,
    params: { options: optionList }
  },
];
```

### Using Multiple Formatters

SlickGrid only has 1 `formatter` property but if you want to use more than 1 Formatter then you'll want to use the `Formatters.multiple` and pass every Formatters inside your column definition `params: { formatters: [] }` as shown below.

**Note:** please note that combining multiple Formatters has the side effect of cascading the formatted `value` output to the next Formatter. So for example if you use the `complexObject` and `dollar` Formatters, you want to make sure to define them in the correct order in your `formatters: []` array as shown below.

* what if you want to avoid overwriting the `value` with a Custom Formatter?
  * in that case you can have your Formatter return a [FormatterResultObject](#formatterresultobject), see below.

```ts
// Data Example::
// data = [{ shipping: { cost: 123.22, address: { zip: 123456 } } }];

columnDefinitions.value = [
  {
    id: 'shippingCost', field: 'shipping.cost', name: 'Shipping Cost',
    formatter: Formatters.multiple,
    params: {
      // list of Formatters (the order is very important)
      formatters: [Formatters.complexObject, Formatters.dollar],
    }
  },
];
```

### Custom Formatter

You could also create your own custom `Formatter` by simply following the structure shown below.

#### TypeScript function signature

```ts
export type Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid?: any) => string | FormatterResultObject;
```

#### FormatterResultObject

The most common return result of a Formatter is a `string` but you could also use the `FormatterResultObject` which is an object with the interface signature shown below. The main difference is that it will allow to add CSS classes directly to the cell container instead of having to create an extra `<div>` container and since that is the main cell container, you can add multiple Formatters to add/remove multiple CSS classes on that same container.

```ts
export interface FormatterResultObject {
  addClasses?: string;
  removeClasses?: string;
  text: string;
  toolTip?: string;
}
```

#### Example of a Custom Formatter with HTML string

For example, we will use our optional SVG icons `.mdi` with a `boolean` as input data, and display a (fire) icon when `True` or a (snowflake) when `False`. This custom formatter is actually display in the [UI sample](#ui-sample) shown below.

```ts
// create a custom Formatter with the Formatter type
const myCustomCheckboxFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid?: any) =>
  value ? { addClasses: 'mdi mdi-fire', text: '', tooltip: 'burning fire' } : '<i class="mdi mdi-snowflake" aria-hidden="true"></i>';
```

#### Example with `FormatterResultObject` instead of a string

Using this object return type will provide the user the same look and feel, it will actually be quite different. The major difference is that all of the options (`addClasses`, `tooltip`, ...) will be added the CSS container of the cell instead of the content of that container. For example a typically cell looks like the following `<div class="slick-cell l4 r4">Task 4</div>` and if use `addClasses: 'red'`, it will end up being `<div class="slick-cell l4 r4 red">Task 4</div>` while if we use a string output of let say `<span class="red">${value></span>`, then our final result of the cell will be `<div class="slick-cell l4 r4"><span class="red">Task 4</span></div>`. This can be useful if you plan to use multiple Formatters and don't want to lose or overwrite the previous Formatter result (we do that in our project).

```ts
// create a custom Formatter and returning a string and/or an object of type FormatterResultObject
const myCustomCheckboxFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid?: any) =>
  value ? { addClasses: 'mdi mdi-fire', text: '', tooltip: 'burning fire' } : '<i class="mdi mdi-snowflake" aria-hidden="true"></i>';
```

### Example of Custom Formatter with Native DOM Element
Since version 4.x, you can now also return native DOM element instead of an HTML string. There are 2 main reasons for going with this approach:
1. CSP Safe by default, since it's native it is 100% CSP Safe (CSP: Content Security Policy)
2. Performance (the reasons are similar to point 1.)
   - since it's native it can be appended directly to the grid cell
   - when it's an HTML string, it has to do 2 extra steps (which is an overhead process)
      i. sanitize the string (when a sanitizer, for example [DOMPurify](https://github.com/cure53/DOMPurify))
      ii. SlickGrid then has to convert it to native element by using `innerHTML` on the grid cell

Demo
```ts
export const iconFormatter: Formatter = (_row, _cell, _value, columnDef) => {
  const iconElm = document.createElement('span');
  iconElm.className = 'mdi mdi-check';

  return iconElm;
};
```

> **Note** you could also use our helper `createDomElement` which allows to create a DOM element and pass properties like `className` in 1 liner (and it also works with intellisense). For example `createDomElement('span', { className: 'bold title', textContent: 'Hello World', title: 'some tooltip description' })` would equal to 4 lines of code.

### More Complex Example
If you need to add more complex logic to a `Formatter`, you can take a look at the [percentCompleteBar](https://github.com/ghiscoding/slickgrid-vue/blob/master/slickgrid-vue/src/slickgrid-vue/formatters/percentCompleteBarFormatter.ts) `Formatter` for more inspiration.

### Common Formatter Options
You can set some defined common Formatter Options in your Grid Options through the `formatterOptions` in the Grid Options (locally or globally) as seen below, and/or independently through the column definition `params` (the option names are the same in both locations)

```ts
function loadGrid() {
  columnDefinitions.value = [
    // through the column definition "params"
    { id: 'price', field: 'price', params: { thousandSeparator: ',' } },
  ];

  // or through grid options to make it global
  gridOptions.value = {
    autoResize: {
      containerId: 'demo-container',
      sidePadding: 15
    },
    enableAutoResize: true,

    // you customize the date separator through "formatterOptions"
    formatterOptions: {
      // What separator to use to display a Date, for example using "." it could be "2002.01.01"
      dateSeparator: '/', // can be any of '/' | '-' | '.' | ' ' | ''

      // Defaults to dot ".", separator to use as the decimal separator, example $123.55 or $123,55
      decimalSeparator: ',', // can be any of '.' | ','

      // Defaults to false, option to display negative numbers wrapped in parentheses, example: -$12.50 becomes ($12.50)
      displayNegativeNumberWithParentheses: true,

      // Defaults to undefined, minimum number of decimals
      minDecimal: 2,

      // Defaults to undefined, maximum number of decimals
      maxDecimal: 4,

      // Defaults to undefined, add a prefix when using `Formatters.decimal` (only) which can be used for example to display a currency.
      // output: € 123.45'
      numberPrefix: '€ ',

      // Defaults to undefined, add a suffix when using `Formatters.decimal` (only) which can be used for example to display a currency.
      // output: '123.45 €'
      numberSuffix: ' €',

      // Defaults to empty string, thousand separator on a number. Example: 12345678 becomes 12,345,678
      thousandSeparator: '_', // can be any of ',' | '_' | ' ' | ''
    },
  }
}
```

### PostRender Formatter (async)
SlickGrid also support Post Render Formatter (asynchronously) via the Column property `asyncPostRender` (you will also need to enable in the grid options via `enableAsyncPostRender`). When would you want to use this? It's useful if your formatter is expected to take a while to render, like showing a graph with Sparklines, and you don't want to delay rendering your grid, the Post Render will happen after all the grid is loaded.

To see it in action, from the 6pac samples, click [here](http://6pac.github.io/SlickGrid/examples/example10-async-post-render.html)
Code example:
```ts
const renderSparklineFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
  var vals = [
    dataContext["n1"],
    dataContext["n2"],
    dataContext["n3"],
    dataContext["n4"],
    dataContext["n5"]
  ];
  $(cellNode).empty().sparkline(vals, {width: "100%"});
}

function defineGrid() {
   columnDefinitions.value = [
      { id: 'title', name: 'Title', field: 'title' },
      { id: "chart", name: "Chart", sortable: false, width: 60,
         formatter: waitingFormatter,
         rerenderOnResize: true,
         asyncPostRender: renderSparklineFormatter
      }
    ];
 }
```

A **Better Solution** is to use Custom Formatters **as much as possible** because using an Vue Components with `asyncPostRender` are **SLOW** (you are warned). They are slow because they require a full cycle, cannot be cached and are rendered **after** each rows are rendered (because of their asynchronous nature), while Custom Formatters are rendered at the same time as the row itself since they are synchronous in nature.

### Vue Component Formatter
Can we show a Vue Component in a SlickGrid Formatter? Typically you wouldn't do this because a Formatter requires synchronous output so that it can render the grid right away... luckily Vue can do that by using its `createApp()` which helps create and mount a Vue Component like it was native.

> Side note, Vue is the exception here to mount a Component synchronously, because most frameworks require at least 1 cycle (async) to render a Component (i.e. Angular) which wouldn't work with a Formatter (for that use case we must use `asyncPostRender`).

> **Note** if your Vue Component is async in nature (if it takes time to load) then you might need to use `asyncPostRender` as documented above.

##### Basic Usage
Alright so the first step would be to create a Custom Formatter because the library does not provide a built-in Formatter for this but don't worry it's quite simple. For the code shown below, you can see our live [Example](https://ghiscoding.github.io/slickgrid-vue-demos/#/example26) demoing this code.

First let's create a simple Vue Component
```vue
<script setup lang="ts">
defineProps<{ model: any }>();
</script>

<template>
  <span style="font-weight: bold" v-html="model.assignee"></span>
</template>
```

Second use it in our column definitions

```vue
<script setup lang="ts">
import { ComponentPublicInstance, createApp, onBeforeMount, ref, type Ref } from 'vue';

// create a Custom Formatter which will use `createApp().mount()`
const vueComponentFormatter: Formatter = (_row: number, _cell: number, _val: any, colDef: Column, dataContext: any) => {
  const component = colDef.params?.component; // our Vue Component
  if (component) {
    const tmpDiv = document.createElement('div');
    const componentProps = { model: dataContext };
    const app = createApp(component, componentProps); // add any necessary use() when needed, i.e. `use(router).use(pinia)`
    app.mount(tmpDiv) as ComponentPublicInstance;
    return tmpDiv;
  }
  return '';
};

const columnDefinitions: Ref<Column[]> = ([
  {
      id: 'assignee',
      name: 'Assignee with Vue Component',
      field: 'assignee',
      formatter: vueComponentFormatter,
      // use `params` since it's generic and you can use it to pass `any`thing
      params: {
        component: CustomTitleFormatter,
      },
      exportCustomFormatter: Formatters.complexObject,
    },
])
</script>
```

> **NOTE** even if it is possible to use Vue Component within a Formatter, we strongly suggest to use native HTML elements (or string) as much as possible for better performance and less problems.
