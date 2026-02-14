#### Index
- [Using an Inclusive Range](#using-an-inclusive-range-default-is-exclusive)
- [Using 2 dots (..) notation](#using-2-dots--notation)
- [Using a Slider Range](#using-a-slider-range-filter)
  - [Filter Options](#filter-options)
- [Using a Date Range](#using-a-date-range-filter)
- [Update Filters Dynamically](input-filter.md#update-filters-dynamically)
- [Custom Filter Predicate](input-filter.md#custom-filter-predicate)
- [Filter Shortcuts](input-filter.md#filter-shortcuts)

### Introduction
Range filters allows you to search for a value between 2 min/max values, the 2 most common use case would be to filter between 2 numbers or dates, you can do that with the Slider & Date Range Filters. The range can also be defined as inclusive (`>= 0 and <= 10`) or exclusive (`> 0 and < 10`), the default is exclusive but you can change that, see below for more info.

### Using an Inclusive Range (default is Exclusive)
By default all the range filters are with exclusive range, which mean between value `x` and `y` but without including them. If you wish to include the `x` and `y` values, you can change that through the `operator` property.

For example
```ts
// your columns definition
const columnDefinitions = [
  {
    id: 'duration', field: 'duration', name: 'Duration',
    filterable: true,
    filter: {
      model: Filters.input,
      operator: 'RangeInclusive' // defaults to exclusive

      // or use the string (case sensitive)
      operator: 'RangeInclusive', // defaults to exclusive
    }
  },
];
```

## Using 2 dots (..) notation
You can use a regular input filter with the 2 dots (..) notation to represent a range, for example `5..90` would search between the value 5 and 90 (exclusive search unless specified).

##### Component
```ts
import { Filters, Formatters, GridOption } from '@slickgrid-universal/common';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    // your columns definition
    setColumns([
      {
        id: 'duration', field: 'duration', name: 'Duration',
        type: 'number', // you can optionally specify that the data are numbers
        filterable: true,

        // input filter is the default, so you can skip this unless you want to specify the `operator`
        filter: {
          model: 'input',
          operator: 'RangeInclusive' // defaults to exclusive
        }
      },
    ]);

    setOptions({ /*... */ });
  }
}
```

### Using a Slider Range Filter
The slider range filter is very useful if you can just want to use the mouse to drag/slide a cursor, you can also optionally show/hide the slider values on screen (hiding them would giving you more room without but without the precision).

##### Component
```ts
import { Filters, Formatters, GridOption, SliderRangeOption } from '@slickgrid-universal/commomn';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    setColumns([
      {
        id: 'complete', name: '% Complete', field: 'percentComplete', headerKey: 'PERCENT_COMPLETE', minWidth: 120,
        sortable: true,
        formatter: Formatters.progressBar,
        type: 'number',
        filterable: true,
        filter: {
          model: Filters.sliderRange,
          maxValue: 100, // or you can use the options as well
          operator: 'RangeInclusive', // optional, defaults to exclusive
          params: { hideSliderNumbers: false }, // you can hide/show the slider numbers on both side

          // you can also optionally pass any option of the Slider filter
          // previously known as `filterOptions` for < 9.0
          options: { sliderStartValue: 5 } as SliderRangeOption
        }
      },
    ]);

    setOptions({ /* ... */ });
  }
}
```

##### Filter Options
All the available options that can be provided as filter `options` to your column definitions and you should try to cast your filter `options` to the specific interface as much as possible to make sure that you use only valid options of allowed by the targeted filter

```ts
filter: {
  model: Filters.sliderRange,
  // previously known as `filterOptions` for < 9.0
  options: {
    sliderStartValue: 5
  } as SliderOption
}
```

#### Grid Option `defaultFilterOptions
You could also define certain options as a global level (for the entire grid or even all grids) by taking advantage of the `defaultFilterOptions` Grid Option. Note that they are set via the filter type as a key name (`autocompleter`, `date`, ...) and then the content is the same as filter `options` (also note that each key is already typed with the correct filter option interface), for example

```ts
const gridOptions = {
  defaultFilterOptions: {
    // Note: that `date`, `select` and `slider` are combining both compound & range filters together
    date: { displayDateMin: 'today' },
    select: { minHeight: 350 }, // typed as MultipleSelectOption
    slider: { sliderStartValue: 10 }
  }
}
```

### Using a Date Range Filter
The date range filter allows you to search data between 2 dates, it uses the [Vanilla-Calendar Range](https://vanilla-calendar.pro/) feature.

> **Note** we use [Tempo](https://tempo.formkit.com/) to parse and format Dates to the chosen format via the `type` option when provided in your column definition.

##### Component
import { Filters, Formatters, GridOption, VanillaCalendarOption } from '@slickgrid-universal/common';

```typescript
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    setColumns([
      {
        id: 'finish', name: 'Finish', field: 'finish', headerKey: 'FINISH',
        minWidth: 75, width: 120, exportWithFormatter: true,
        formatter: Formatters.dateIso, sortable: true,
        type: 'date',
        filterable: true,
        filter: {
          model: Filters.dateRange,

          // override any of the Vanilla-Calendar options through "options"
          options: { displayDateMin: 'today' } as VanillaCalendarOption
        }
      },
    ]);

    setOptions({ /* ... */ });
  }
}
```

#### Filter Options (`VanillaCalendarOption` interface)
All the available options that can be provided as filter `options` to your column definitions can be found under this [VanillaCalendarOption interface](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/vanillaCalendarOption.interface.ts) and you should cast your filter `options` with the expected interface to make sure that you use only valid settings of the [Vanilla-Calendar](https://vanilla-calendar.pro/docs/reference/additionally/settings) library.

```ts
filter: {
  model: Filters.compoundDate,
  options: {
    displayDateMin: 'today'
  } as VanillaCalendarOption
}
```
