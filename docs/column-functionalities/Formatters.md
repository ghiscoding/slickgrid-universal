### Index
- [Built-in Formatter](#list-of-provided-formatters)
- [Extra Params/Arguments](#extra-argumentsparams)
- [Using Multiple Formatters](#using-multiple-formatters)
- [Custom Formatter](#custom-formatter)
- [Common Formatter Options](#common-formatter-options)
- [PostRenderer Formatter](#postrender-formatter)
- [UI Sample](#ui-sample)

### Definition
`Formatters` are functions that can be used to change and format certain column(s) in the grid. Please note that it does not alter the input data, it simply changes the styling by formatting the data differently to the screen (what the user visually see).

A good example of a `Formatter` could be a column name `isActive` which is a `boolean` field with input data as `True` or `False`. User would prefer to simply see a checkbox as a visual indication representing the `True` flag, for this behavior you can use `Formatters.checkmark` which will use [Font-Awesome](http://fontawesome.io/icons/) icon of `fa-check` when `True` or an empty string when `False`.

For a [UI sample](#ui-sample), scroll down below.

### Provided Formatters
`Slickgrid-Universal` ships with a few `Formatters` by default which helps with common fields, you can see the [entire list here](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/formatters/index.ts#L37).

#### List of provided `Formatters`
- `arrayObjectToCsv`: Takes an array of complex objects converts it to a comma delimited string.
- `arrayToCsv` : takes an array of text and returns it as CSV string
- `checkmark` : uses Font-Awesome [(fa-check)](http://fontawesome.io/icon/check/)
- `checkmarkMaterial` use Material Design to display a checkmark icon
- `collection`: Looks up values from the columnDefinition.params.collection property and displays the label in CSV or string format
- `complexObject`: takes a complex object (with a `field` that has a `.` notation) and pull correct value, there are multiple ways to use it
  1. `{ id: 'firstName', field: 'user.firstName', formatter: Formatters.complexObject}`, will display the user's first name
  2. `{ id: 'firstName', field: 'user', labelKey: 'firstName', params: { complexField: 'user' }, ... }`
  3. `{ id: 'firstName', field: 'user', params: { complexField: 'user.firstName' }, ... }`
- `currency`: will help with currency other than dollar (ie `€`), there are multiple `params` available for this formatter
   - `currencyPrefix`, `currencySuffix`, `minDecimal`, `maxDecimal`, `numberPrefix`, `numberSuffix`, `decimalSeparator`, `thousandSeparator` and `displayNegativeNumberWithParentheses`
   - the distinction between `numberPrefix` and `currencyPrefix` can be seen when using `displayNegativeNumberWithParentheses`, for example if we have a value of `-12.432` with the `Formatters.currency` and `params: { currencyPrefix: '€', numberPrefix: 'Price ', numberSuffix: 'EUR' }` the output will be `"Price (€12.432) EUR"`
- `dateEuro`: Takes a Date object and displays it as an Euro Date format (DD/MM/YYYY)
- `dateTimeEuro`: Takes a Date object and displays it as an Euro Date+Time format (DD/MM/YYYY HH:mm:ss)
- `dateTimeShortEuro`: Takes a Date object and displays it as an Euro Date+Time (without seconds) format (DD/MM/YYYY HH:mm)
- `dateTimeEuroAmPm`: Takes a Date object and displays it as an Euro Date+Time+(am/pm) format (DD/MM/YYYY hh:mm:ss a)
- `dateIso` : Takes a Date object and displays it as an ISO Date format (YYYY-MM-DD)
- `dateTimeIso` : Takes a Date object and displays it as an ISO Date+Time format (YYYY-MM-DD HH:mm:ss)
- `dateTimeIsoAmPm` : Takes a Date object and displays it as an ISO Date+Time+(am/pm) format (YYYY-MM-DD h:mm:ss a)
- `dateTimeShortIso`: Takes a Date object and displays it as an ISO Date+Time (without seconds) format (YYYY-MM-DD HH:mm)
- `dateUs` : Takes a Date object and displays it as an US Date format (MM/DD/YYYY)
- `dateTimeUs` : Takes a Date object and displays it as an US Date+Time format (MM/DD/YYYY HH:mm:ss)
- `dateTimeShortUs`: Takes a Date object and displays it as an US Date+Time (without seconds) format (MM/DD/YYYY HH:mm:ss)
- `dateTimeUsAmPm` : Takes a Date object and displays it as an US Date+Time+(am/pm) format (MM/DD/YYYY hh:mm:ss a)
- `decimal`: Display the value as x decimals formatted, defaults to 2 decimals. You can pass "minDecimal" and/or "maxDecimal" to the "params" property.
- `dollar`: Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value.
- `dollarColored`: Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value
- `dollarColoredBoldFormatter`: Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value, show it in bold font weight as well
- `hyperlink`: takes a URL cell value and wraps it into a clickable hyperlink `<a href="value">value</a>`
   - the cell value **must contain** (`ftp://abc`, `http://abc` or `https://abc`), if it doesn't then use `fakeHyperlink`
- `hyperlinkUriPrefix`: format a URI prefix into an hyperlink
- `icon`: to display an icon with defined CSS class name, use `params` to pass a `cssClass` property
- `iconBoolean`: similar to `icon` but will only be displayed on a Boolean truthy value, use `params` to pass a `cssClass` property
- `mask`: to change the string output using a mask, use `params` to pass a `mask` property
   - example: `{ field: 'phone', formatter: Formatters.mask, params: { mask: '(000) 000-0000' }}`
- `multiple`: pipe multiple formatters (executed in sequence), use `params` to pass the list of formatters.
   - example: `{ field: 'title', formatter: Formatters.multiple, params: { formatters: [ Formatters.lowercase, Formatters.uppercase ] }`
- `percent`: Takes a cell value number (between 0.0-1.0) and displays a red (<50) or green (>=50) bar
- `percentComplete` : takes a percentage value (0-100%), displays a bar following this logic:
   - `red`: < 30%, `grey`: < 70%, `green`: >= 70%
- `percentCompleteBar` : same as `percentComplete` but uses [Bootstrap - Progress Bar with label](https://getbootstrap.com/docs/3.3/components/#progress-label).
- `percentCompleteBarWithText`: Takes a cell value number (between 0-100) and displays SlickGrid custom "percent-complete-bar" with Text a red (<30), silver (>30 & <70) or green (>=70) bar
- `percentSymbol`: Takes a cell value number (between 0-100) and add the "%" after the number
- `progressBar`: Takes a cell value number (between 0-100) and displays Bootstrap "progress-bar" a red (<30), silver (>30 & <70) or green (>=70) bar
- `translate`: Takes a cell value and translates it (i18n). Requires an instance of the Translate Service:: `i18n: this.translate
- `translateBoolean`: Takes a boolean value, cast it to upperCase string and finally translates it (i18n).
- `tree`: Formatter that must be used when the column is a Tree Data column

**Note:** The list might not always be up to date, you can refer to the [Formatters export](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/formatters/index.ts#L37) to know exactly which ones are available.

### Usage
To use any of them, you need to import `Formatters` from `Slickgrid-Universal` and add a `formatter: ...` in your column definitions as shown below:

#### TypeSript
```ts
import { Formatters } from 'slickgrid-universal';

export class Example {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  defineGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title' },
      { id: 'duration', name: 'Duration (days)', field: 'duration' },
      { id: '%', name: '% Complete', field: 'percentComplete', formatter: Formatters.percentComplete },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', formatter: Formatters.checkmark }
    ];
  }
}
```

#### SalesForce (ES6)
For SalesForce the code is nearly the same, the only difference is to add the `Slicker` prefix, so instead of `Formatters.abc` we need to use `Slicker.Formatters.abc`

```ts
// ... SF_Slickgrid import


export class Example {
  const Slicker = window.Slicker;

  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];

  constructor() {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  defineGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title' },
      { id: 'duration', name: 'Duration (days)', field: 'duration' },
      { id: '%', name: '% Complete', field: 'percentComplete', formatter: Slicker.Formatters.percentComplete },
      { id: 'start', name: 'Start', field: 'start', formatter: Slicker.Formatters.dateIso },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Slicker.Formatters.dateIso },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', formatter: Slicker.Formatters.checkmark }
    ];
  }
}
```

### Extra Arguments/Params
What if you want to pass extra arguments that you want to use within the Formatter? You should use `params` for that. For example, let say you have a custom formatter to build a select list (dropdown), you could do it this way:
```ts
let optionList = ['True', 'False'];

this.columnDefinitions = [
      { id: 'title', field: 'title',
        headerTranslate: 'TITLE',
        formatter: myCustomSelectFormatter,
        params: { options: optionList }
      },
```

## Using Multiple Formatters
SlickGrid only has 1 `formatter` property but if you want to use more than 1 Formatter then you'll want to use the `Formatters.multiple` and pass every Formatters inside your column definition `params: { formatters: [] }` as shown below.

**Note:** please note that combining multiple Formatters has the side effect of cascading the formatted `value` output to the next Formatter. So for example if you use the `complexObject` and `dollar` Formatters, you want to make sure to define them in the correct order in your `formatters: []` array as shown below.
- what if you want to avoid overwriting the `value` with a Custom Formatter?
   - in that case you can have your Formatter return a [FormatterResultObject](#formatterresultobject), see below.

```ts
// Data Example::
// data = [{ shipping: { cost: 123.22, address: { zip: 123456 } } }];

this.columnDefinitions = [
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

## Custom Formatter
You could also create your own custom `Formatter` by simply following the structure shown below.

### TypeScript function signature
```ts
export type Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid?: any) => string | FormatterResultObject;
```

### FormatterResultObject
The most common return result of a Formatter is a `string` but you could also use the `FormatterResultObject` which is an object with the interface signature shown below. The main difference is that it will allow to add CSS classes directly to the cell container instead of having to create an extra `<div>` container and since that is the main cell container, you can add multiple Formatters to add/remove multiple CSS classes on that same container.
```ts
export interface FormatterResultObject {
  addClasses?: string;
  removeClasses?: string;
  text: string;
  toolTip?: string;
}
```

### Example of a Custom Formatter with string output
For example, we will use `Font-Awesome` with a `boolean` as input data, and display a (fire) icon when `True` or a (snowflake) when `False`. This custom formatter is actually display in the [UI sample](#ui-sample) shown below.
```ts
// create a custom Formatter with the Formatter type
const myCustomCheckboxFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) =>
  value ? `<i class="fa fa-fire" aria-hidden="true"></i>` : '<i class="fa fa-snowflake-o" aria-hidden="true"></i>';
```

#### or with `FormatterResultObject` instead of a string
Using this object return type will provide the user the same look and feel, it will actually be quite different. The major difference is that all of the options (`addClasses`, `tooltip`, ...) will be added the CSS container of the cell instead of the content of that container. For example a typically cell looks like the following `<div class="slick-cell l4 r4">Task 4</div>` and if use `addClasses: 'red'`, it will end up being `<div class="slick-cell l4 r4 red">Task 4</div>` while if we use a string output of let say `<span class="red">${value></span>`, then our final result of the cell will be `<div class="slick-cell l4 r4"><span class="red">Task 4</span></div>`. This can be useful if you plan to use multiple Formatters and don't want to lose or overwrite the previous Formatter result (we do that in our project).
```ts
// create a custom Formatter and returning a string and/or an object of type FormatterResultObject
const myCustomCheckboxFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid?: any) =>
  value ? { addClasses: 'fa fa-fire', text: '', tooltip: 'burning fire' } : '<i class="fa fa-snowflake-o" aria-hidden="true"></i>';
```

### More Complex Example
If you need to add more complex logic to a `Formatter`, you can take a look at the [percentCompleteBar](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/formatters/percentCompleteBarFormatter.ts) `Formatter` for more inspiration.

## Common Formatter Options
You can set some defined common Formatter Options in your Grid Options through the `formatterOptions` in the Grid Options (locally or globally) as seen below, and/or independently through the column definition `params` (the option names are the same in both locations)

```ts
loadGrid() {
  this.columnDefinitions = [
    // through the column definition "params"
    { id: 'price', field: 'price', params: { thousandSeparator: ',' } },
  ];

  // or through grid options to make it global
  this.gridOptions = {
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

### PostRender Formatter
SlickGrid also support Post Render Formatter (asynchronously) via the Column property `asyncPostRender` (you will also need to enable in the grid options via `enableAsyncPostRender`). When would you want to use this? It's useful if your formatter is expected to take a while to render, like showing a graph with Sparklines, and you don't want to delay rendering your grid, the Post Render will happen after all the grid is loaded.

To see it in action, from the 6pac samples, click [here](http://6pac.github.io/SlickGrid/examples/example10-async-post-render.html)
Code example:
```ts
const renderSparklineFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
    var vals = [
      dataContext['n1'],
      dataContext['n2'],
      dataContext['n3'],
      dataContext['n4'],
      dataContext['n5']
    ];
    $(cellNode).empty().sparkline(vals, { width: '100%' });
  }

 defineGrid() {
   this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title' },
      { id: 'chart', name: 'Chart', sortable: false, width: 60,
         formatter: waitingFormatter,
         rerenderOnResize: true,
         asyncPostRender: renderSparklineFormatter
      }
    ];
 }
```
