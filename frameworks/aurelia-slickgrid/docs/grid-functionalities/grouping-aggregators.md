#### index
- [Demo](#demo)
- [Description](#description)
- [Setup](#setup)
- [Draggable Dropzone Location](#draggable-dropzone-location)
- [Aggregators](#aggregators)
- [SortComparers](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/sortComparers/sortComparers.index.ts)
- [GroupTotalsFormatter](#group-totals-formatter)
- [Custom GroupTotalsFormatter](#custom-grouptotalsformatter)
- [Set a Grouping](#set-a-grouping)
- [Clear Grouping / Collapse All / Expand All](#clear-grouping--collapse-all--expand-all)
- [Styling - Change Icons](#styling-change-icons)

## Demo
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/slickgrid/example13) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/aurelia/src/examples/slickgrid/example13.ts)

##### Draggable Grouping
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/slickgrid/example18) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/aurelia/src/examples/slickgrid/example18.ts)

### Description
Fully dynamic and interactive multi-level grouping with filtering and aggregates that is achieved with the help of the `DataView` object in `SlickGrid`. Each grouping level can have its own aggregates (over child rows, child groups, or all descendant rows). An aggregate can be seen as sub-totals, totals, average, ... or any defined group(s).

How does it work in `SlickGrid`?
The important thing to understand while working with `SlickGrid` is that Grouping requires you to provide 2 things, if you omit 1 of them, it will simply not work. These 2 things are
1. You will need to define which type of aggregate (accumulator) you want to use
   - Aurelia-Slickgrid provides the following built-in `Aggregators`: `Avg`, `Min`, `Max`, `Sum`
2. You need to add a `groupTotalsFormatter` on the column definition you want it to be calculated
   - this is very similar to a Formatter, except that they are designed to show aggregate results, e.g:: `Total: 142.50$`

These 2 steps go hands in hands, a `groupTotalsFormatter` would have nothing to show if it does not have an `Aggregator`.

### Setup
One of the very first thing that you need to do is to provide the `SlickGrid DataView` object to your `ViewModel`. The `DataView` is where we will define all of our Grouping. You can get the `dataView` object through an Event Emitter `onDataviewCreated` like so:

##### View
```html
<aurelia-slickgrid
   grid-id="grid1"
   columns.bind="columns"
   options.bind="gridOptions" dataset.bind="dataset"
   on-aurelia-grid-created.trigger="aureliaGridReady($event.detail)">
</aurelia-slickgrid>
```
##### Component

```typescript
export class Example {
  aureliaGrid: AureliaGridInstance;
  gridObj: any;
  dataViewObj: any;

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;

    // the Aurelia Grid Instance exposes both Slick Grid & DataView objects
    this.gridObj = aureliaGrid.slickGrid;
    this.dataViewObj = aureliaGrid.dataView;
  }

  attached() {
    // populate the grid
    this.gridOptions = {
      groupItemMetadataOption: { 
        // enable toggle of group by clicking on the toggle icon or its title (not just the toggle icon), defaults to false
        toggleOnNodeTitle: true, 
      }
    }
  }
}
```

#### Custom chip sorting

`draggableGrouping.groupSortComparer` lets an application decide how groups are ordered after a user clicks a grouping chip's sort icon. It receives two `{ value, count }` groups, the **next** direction and the column, and must return `SortDirectionNumber.asc`, `desc` or `neutral`. The direction represents the chip's two states, so the callback can assign a different meaning to each one. It replaces the column's `grouping.comparer` on a chip click, and the plugin reapplies grouping automatically.

The following example starts with the largest groups first, switches to value ascending on the first click, and switches back to count descending on the second. Empty values remain last in either state, and equal counts are ordered by value. The initial `grouping.comparer` uses the same logic because the chip callback is only installed after a click.

```ts
import { sortByFieldType, SortDirectionNumber } from '@slickgrid-universal/common';
import type { Column, GridOption, GroupingComparerItem } from '@slickgrid-universal/common';

const compareGroups = (
  a: GroupingComparerItem,
  b: GroupingComparerItem,
  direction: SortDirectionNumber,
  column: Column,
  gridOptions: GridOption
): SortDirectionNumber => {
  const isEmpty = (value: unknown) => value == null || (typeof value === 'string' && value.trim() === '');
  const aEmpty = isEmpty(a.value);
  const bEmpty = isEmpty(b.value);
  if (aEmpty !== bEmpty) {
    return aEmpty ? SortDirectionNumber.asc : SortDirectionNumber.desc;
  }
  if (aEmpty) {
    return SortDirectionNumber.neutral;
  }

  const byValue = () => sortByFieldType(column.type || 'text', a.value, b.value, SortDirectionNumber.asc, column, gridOptions);
  const result = direction === SortDirectionNumber.desc ? b.count - a.count || byValue() : byValue();
  return result < 0 ? SortDirectionNumber.desc : result > 0 ? SortDirectionNumber.asc : SortDirectionNumber.neutral;
};

// Use your application's grid options and add these settings before creating the grid.
const gridOptions: GridOption = {
  enableDraggableGrouping: true,
  draggableGrouping: {
    groupSortComparer: (a, b, direction, column) => compareGroups(a, b, direction, column, gridOptions),
    sortAscIconCssClass: 'my-value-sort-icon',
    sortDescIconCssClass: 'my-count-sort-icon',
  },
};

const statusColumn: Column = {
  id: 'status', name: 'Status', field: 'status', type: 'text', sortable: true,
};
statusColumn.grouping = {
  getter: 'status',
  sortAsc: false,
  comparer: (a, b) => compareGroups(a, b, SortDirectionNumber.desc, statusColumn, gridOptions),
};
// Include statusColumn in the grid's column definitions.
```

Supply CSS for `my-value-sort-icon` and `my-count-sort-icon`, or use classes from your icon library. The ascending class represents value order and the descending class represents count order in this example. Both classes are configured globally for the plugin. Each sortable grouped column keeps its own direction and icon, and the callback can inspect `column` to customize comparisons per column. Use a matching initial comparer and `sortAsc` on each grouped column.

By default `sortAsc` is `true`, so the first click selects the descending state. Setting it to `false` as above makes the first click select the ascending state, and the initial comparer and icon both represent count order. `sortByFieldType` uses the column's type and grid options for value comparisons. Define a suitable `type` and customize the comparison for values or date formats specific to your application.

This is a two-state toggle. The callback supplies the sort logic, including empty handling and tie-breaking. It does not provide arbitrary sort cycles, custom chip controls, or a dedicated sort-mode event. `onGroupChanged` also fires for other grouping changes, and its `sort-group` notification occurs before the chip's `sortAsc` is updated.

### Draggable Dropzone Location

Draggable grouping uses built-in drag and drop with RTL, mouse, and touch support. Header
reordering preserves hidden and non-reorderable columns and stays within each pinned or scrolling
header region. Dropping a header into the grouping area changes grouping without firing
`onColumnsReordered`.


The Draggable Grouping can be located in either the Top-Header or the Pre-Header as described below.

#### Pre-Header
Draggable Grouping can be located in either the Pre-Header of the Top-Header, however when it is located in the Pre-Header then the Header Grouping will not be available (because both of them would conflict with each other). Note that prior to the version 8.1 of Aurelia-Slickgrid, the Pre-Header was the default and only available option.

```ts
this.gridOptions = {
  createPreHeaderPanel: true,
  showPreHeaderPanel: true,
  preHeaderPanelHeight: 26,
  draggableGrouping: {
    // ... any draggable plugin option
  },
  groupItemMetadataOption: { 
    // enable toggle of group by clicking on the toggle icon or its title (not just the toggle icon), defaults to false
    toggleOnNodeTitle: true, 
  }
}
```

#### Top-Header
This is the preferred section since the Top-Header is on top of all headers (including pre-header) and it will always be the full grid width. Using the Top-Header also frees up the Pre-Header section for the potential use of Header Grouping.

When using Draggable Grouping and Header Grouping together, you need to enable both top-header and pre-header.
```ts
this.gridOptions = {
    // we'll use top-header for the Draggable Grouping
  createTopHeaderPanel: true,
  showTopHeaderPanel: true,
  topHeaderPanelHeight: 35,

  // pre-header will include our Header Grouping (i.e. "Common Factor")
  createPreHeaderPanel: true,
  showPreHeaderPanel: true,
  preHeaderPanelHeight: 26,
}
```

### Aggregators
The `Aggregators` is basically the accumulator, the logic that will do the sum (or any other aggregate we defined). We simply need to instantiate the `Aggregator` by passing the column definition `field` that will be used to accumulate. For example, if we have a column definition of Cost and we want to calculate it's sum, we can call the `Aggregator` as follow
```ts
new Aggregators.Sum('cost')
```
The available built-in `Aggregators` are
- `Aggregators.Avg` (calculate the Average of a group)
- `Aggregators.Min` (returns the Minimum value of a group)
- `Aggregators.Max` (returns the Maximum value of a group)
- `Aggregators.Sum` (calculate the Sum of a group)
- `Aggregators.Clone` (will clone the same grouped text and display it in as an aggregated value)
- `Aggregators.Distinct` (will show distinct value)

### Group Totals Formatter
When defining your column definitions, you will need to decide which of the column will have an aggregate. Once that decision is made, you will add a `groupTotalsFormatter` to that column definition in question (a Formatter for the group total). For example, let say that we have a cost and we want a total sum grouped by a duration, the code would look like below.

##### Available Group Total Formatters
You can see the full list under [`groupingFormatters.index.ts`](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/grouping-formatters/groupingFormatters.index.ts)
Note: the Group Total Formatters named as currency will have these extra `params` (`groupFormatterPrefix`, `groupFormatterSuffix`, `groupFormatterCurrencyPrefix`, `groupFormatterCurrencySuffix`) and also the other common Formatter `params` (`minDecimal`, `maxDecimal`, `decimalSeparator`, `thousandSeparator`, `displayNegativeNumberWithParentheses`).

- `avgTotalsPercentageFormatter`
- `avgTotalsDollarFormatter`
- `avgTotalsCurrencyFormatter`
- `avgTotalsFormatter`
- `minTotalsFormatter`
- `maxTotalsFormatter`
- `sumTotalsColoredFormatter`
- `sumTotalsCurrencyFormatter`
- `sumTotalsCurrencyColoredFormatter`
- `sumTotalsDollarColoredBoldFormatter`
- `sumTotalsDollarColoredFormatter`
- `sumTotalsDollarBoldFormatter`
- `sumTotalsDollarFormatter`
- `sumTotalsFormatter`
- `sumTotalsBoldFormatter`

##### ViewModel
```typescript
export class Example {
  this.columns = [
    {
      id: 'title', name: 'Title', field: 'title'
    },
    {
      id: 'duration', name: 'Duration', field: 'duration',
      type: 'number',
      groupTotalsFormatter: GroupTotalFormatters.sumTotals,
      params: { groupFormatterPrefix: 'Total: ' }
    },
    {
      id: 'cost', name: 'Cost', field: 'cost',
      exportWithFormatter: true,    // for a Dollar Formatter, we also want it to be displayed in the export to file
      formatter: Formatters.dollar,
      groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
      params: { groupFormatterPrefix: '<b>Total</b>: ' /*, groupFormatterSuffix: ' USD'*/ }
    }
  ];

  this.gridOptions = {
    enableGrouping: true,        // don't forget to enable the grouping
    exportOptions: {
      sanitizeDataExport: true   // you can also sanitize the exported data (it will remove any HTML tags)
    }
  };
}
```

#### Prefix/Suffix to a `groupTotalsFormatter`
We can also pass prefix and/or suffix to each `groupTotalsFormatter` by adding them to the `params` object. Also note that you can also type HTML to be interpreted. For example, let say we would like `Total:` to show as bold and a suffix of 'USD' , you can write it this way:

**Note** prefix/suffix are concatenated without spaces, if you require a space then make sure to add it in accordingly.

##### ViewModel
```ts
{
  id: 'cost', name: 'Cost', field: 'cost',
  groupTotalsFormatter: GroupTotalFormatters.sumTotalsDollar,
  params: { groupFormatterPrefix: '<b>Total</b>: ', groupFormatterSuffix: ' USD' }
}
```

### Custom `groupTotalsFormatter`
You can also create a custom `groupTotalsFormatter` similarly to a Formatter, just a create a function that will return a string, for example:

##### ViewModel
```typescript
defineGrid() {
  this.columns = [
      {
        id: 'cost', name: 'Cost', field: 'cost',
        groupTotalsFormatter: this.sumTotalsFormatter
      }
  ];
}

sumTotalsFormatter(totals, columnDef) {
  const val = totals.sum && totals.sum[columnDef.field];
  if (val != null) {
    return 'total: ' + ((Math.round(parseFloat(val) * 100) / 100));
  }
  return '';
}
```

### Set a Grouping
Once you have added a `groupTotalsFormatter` and defined which aggregate you want to use, you will want to create a grouping function. If we take again our example of a grid with multiple task and we want to group our task by duration and calculate the duration average and the cost total sum, we can write the following function

##### ViewModel
```ts
groupByDuration() {
    this.dataviewObj.setGrouping({
      getter: 'duration',  // the column `field` to group by
      formatter: (g) => {
        // (required) what will be displayed on top of each group
        return `Duration:  ${g.value} <span style="color:green">(${g.count} items)</span>`;
      },
      comparer: (a, b) => {
        // (optional) comparer is helpful to sort the grouped data
        // code below will sort the grouped value in ascending order
        return SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc);
      },
      aggregators: [
        // (optional), what aggregators (accumulator) to use and on which field to do so
        new Aggregators.Avg('percentComplete'),
        new Aggregators.Sum('cost')
      ],
      aggregateCollapsed: false,  // (optional), do we want our aggregator to be collapsed?
      lazyTotalsCalculation: true // (optional), do we want to lazily calculate the totals? True is commonly used
    });
  }
```

### Clear Grouping / Collapse All / Expand All
To "Clear all Grouping", "Collapse all Groups" and "Expand all Groups", we can simply call the associated `DataView` function, like so:

##### ViewModel
```ts
  clearGrouping() {
    this.dataviewObj.setGrouping([]);
  }

  collapseAllGroups() {
    this.dataviewObj.collapseAllGroups();
  }

  expandAllGroups() {
    this.dataviewObj.expandAllGroups();
  }
```

### Styling (change icons)
The current icons are chevron (right/down), however if you wish to use +/- icons. You can simply update the SASS variables to use whichever SVG icon paths. The SASS variables you can change are
```scss
$slick-icon-group-color:                    $primary-color;
$slick-icon-group-expanded-svg-path:        "M19,19V5H5V19H19M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5C3,3.89 3.9,3 5,3H19M11,7H13V11H17V13H13V17H11V13H7V11H11V7Z";
$slick-icon-group-collapsed-svg-path:       "M19,19V5H5V19H19M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5C3,3.89 3.9,3 5,3H19M17,11V13H7V11H17Z";
$slick-icon-group-font-size:                20px;
$slick-icon-group-font-weight:              bold;
$slick-icon-group-margin-right:             2px;

/* Grouping Totals Formatter */
$slick-group-totals-formatter-color:        gray;
$slick-group-totals-formatter-bgcolor:      white;
$slick-group-totals-formatter-font-size:    14px;
$slick-group-totals-formatter-font-weight:  normal;
```

For more info on SASS styling and variables, please read the [Wiki - SASS Styling](../styling/styling.md),
