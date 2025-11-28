#### Index
- [Overview](#overview)
- [Filter Types](#filter-types)
- [Basic Usage](#basic-usage)
- [Single Slider Filter](#single-slider-filter)
- [Slider Range Filter](#slider-range-filter)
- [Compound Slider Filter](#compound-slider-filter)
- [Slider Options](#slider-options)
- [Operators](#operators)
- [Filter While Sliding](#filter-while-sliding)
- [Styling the Slider](#styling-the-slider)

### Overview
The Slider Filter is an interactive numeric filter that allows users to select values or ranges within a defined minimum and maximum by dragging one or more slider handles. It's ideal for filtering numeric data such as prices, ratings, percentages, or any continuous numeric values.

SlickGrid Universal provides three slider filter variants via the Filters enum:
- `Filters.slider` - Single value slider filter
- `Filters.sliderRange` - Range slider filter with two handles
- `Filters.compoundSlider` - Single value slider with operator selection dropdown

### Demo
##### Single Slider
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/example13)

##### Slider Range (double handles)
[Demo Component](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/example23)

### Filter Types

#### Single Slider Filter (`Filters.slider`)
A single-value slider that filters data based on a single numeric threshold. Useful when you want to filter "greater than", "less than", or "equal to" a specific value.

**Operators**: `>`, `>=`, `<`, `<=`, `=`, `<>`, `!=`

#### Slider Range Filter (`Filters.sliderRange`)
A dual-handle slider that filters data within a numeric range. Useful for filtering data between two values (e.g., price range from $100 to $500).

**Operators**: `rangeInclusive` (default) or `rangeExclusive`

#### Compound Slider Filter (`Filters.compoundSlider`)
A single-value slider combined with an operator dropdown menu. This allows users to select both the operator and the numeric value without typing, providing a better UX.

**Operators**: `>`, `>=`, `<`, `<=`, `=`, `<>`, `!=`

### Basic Usage

To use any slider filter, set `filterable: true` on your column and define the `filter` object with the desired model:

```ts
this.columnDefinitions = [
  {
    id: 'duration',
    name: 'Duration',
    field: 'duration',
    type: 'number',
    filterable: true,
    filter: {
      model: Filters.slider,
      operator: '>=',
    }
  }
];

// Enable filtering in Grid Options
this.gridOptions = {
  enableFiltering: true
};
```

### Single Slider Filter

Example with custom options:

```ts
{
  id: 'duration',
  name: 'Duration (hours)',
  field: 'duration',
  type: 'number',
  filterable: true,
  filter: {
    model: Filters.slider,
    operator: '>=',
    minValue: 0,      // minimum value on the slider
    maxValue: 500,    // maximum value on the slider
    step: 5,          // step increment when moving the slider
    options: {
      hideSliderNumber: true,                   // hide the numeric value display
      enableSliderTrackColoring: true,          // color the slider track
      sliderTrackFilledColor: '#9ac49c',        // custom track color
      sliderStartValue: 100,                    // starting slider position
      filterWhileSliding: true,                 // filter in real-time as user slides
      useArrowToSlide: true,                    // use arrow keys to adjust slider
    } as SliderOption,
  }
}
```

### Slider Range Filter

Example with range slider:

```ts
{
  id: 'percentComplete',
  name: '% Complete',
  field: 'percentComplete',
  type: 'number',
  formatter: Formatters.progressBar,
  filterable: true,
  filter: {
    model: Filters.sliderRange,
    minValue: 0,        // minimum value on the slider
    maxValue: 100,      // maximum value on the slider
    operator: OperatorType.rangeInclusive,  // defaults to inclusive
    options: {
      hideSliderNumbers: false,              // show/hide the numbers on both sides
      sliderStartValue: 0,                   // left handle starting position
      sliderEndValue: 100,                   // right handle starting position
      step: 5,                               // step increment when moving the slider
      stopGapBetweenSliderHandles: 0,        // minimum gap between the two handles
      filterWhileSliding: false,             // filter after user finishes sliding
      useArrowToSlide: true,                 // use arrow keys to adjust handles
    } as SliderRangeOption,
  }
}
```

### Compound Slider Filter

Example with operator dropdown:

```ts
{
  id: 'percentComplete',
  name: '% Complete',
  field: 'percentComplete',
  type: 'number',
  filterable: true,
  filter: {
    model: Filters.compoundSlider,
    minValue: 0,
    maxValue: 100,
    operator: '>=',  // default operator shown in dropdown
    options: {
      hideSliderNumber: false,
      enableSliderTrackColoring: true,
      sliderTrackFilledColor: '#3C97DD',
      filterWhileSliding: false,
      useArrowToSlide: true,
    } as SliderOption,
  }
}
```

### Slider Options

The following options can be configured via the `options` object in your filter definition:

#### Common Options (SliderOption)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableSliderTrackColoring` | boolean | `false` | Show color on the slider track to visually represent the selected range |
| `hideSliderNumber` | boolean | `true` | Hide the numeric value display to the right of the slider |
| `sliderStartValue` | number | - | Initial position of the slider handle |
| `sliderTrackFilledColor` | string | `#3C97DD` | Color of the filled slider track (can also use CSS variable `--slick-slider-filter-filled-track-color`) |
| `useArrowToSlide` | boolean | `true` | Allow arrow keys to adjust the slider value instead of grid navigation |
| `filterWhileSliding` | boolean | `false` | Trigger filter in real-time as the user slides, instead of waiting for completion |

#### Range-Specific Options (SliderRangeOption)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hideSliderNumbers` | boolean | `false` | Hide numeric values displayed on both sides of the range slider |
| `sliderEndValue` | number | - | Initial position of the right handle in range slider |
| `stopGapBetweenSliderHandles` | number | `0` | Minimum gap (in units) between the two slider handles |

### Operators

#### Single & Compound Slider Operators
- `>` - Greater than
- `>=` - Greater than or equal to
- `<` - Less than
- `<=` - Less than or equal to
- `=` or `==` - Equal to
- `<>` or `!=` - Not equal to

#### Range Slider Operators
- `rangeInclusive` - Include the boundary values (default)
- `rangeExclusive` - Exclude the boundary values

### Filter While Sliding

By default, the slider filter only applies when the user finishes dragging the slider handle. To apply the filter in real-time as the user slides, set the `filterWhileSliding` option to `true`:

```ts
filter: {
  model: Filters.slider,
  operator: '>=',
  options: {
    filterWhileSliding: true,  // Apply filter while dragging
  } as SliderOption,
}
```

This is useful for providing immediate visual feedback but can impact performance with very large datasets.

### Styling the Slider

You can customize the slider appearance using the available options:

```ts
options: {
  enableSliderTrackColoring: true,           // Show filled track
  sliderTrackFilledColor: '#9ac49c',         // Custom color for filled portion
  hideSliderNumber: false,                   // Show the numeric value
  sliderStartValue: 50,                      // Initial position
} as SliderOption
```

Alternatively, you can override the CSS variable to change the default track color globally:

```css
:root {
  --slick-slider-filter-filled-track-color: #9ac49c;
}
```

### Grid Options

To apply default slider options to all slider filters in your grid, use the `defaultFilterOptions` in Grid Options:

```ts
this.gridOptions = {
  enableFiltering: true,
  defaultFilterOptions: {
    slider: {
      hideSliderNumber: false,
      enableSliderTrackColoring: true,
      sliderTrackFilledColor: '#3C97DD',
    } as SliderOption,
  },
};
```
