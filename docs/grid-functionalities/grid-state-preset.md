#### index
- [Description](#descriptions)
- [Grid State](#grid-state-1)
- [Grid Presets](#grid-presets)
- [Grid State Events](#grid-state-events)
- [How to Load Grid with Certain Columns Hidden](#how-to-load-grid-with-certain-columns-preset-example-hide-certain-columns-on-load)

### Demo
Look at your developer console before leaving the page
#### Regular grid
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example04) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/tree/master/src/examples/slickgrid/example4.ts)

#### with Backend Service
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example06) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/tree/master/src/examples/slickgrid/example6.ts)

### Descriptions
#### Grid State
The `Grid State` are what we defined as the currently used `Columns` / `Filters` / `Sorters` / `Pagination` of the actual grid (pagination is only returned when used in combo with the Backend Service API).
#### Presets
Presets can be used to preset a grid with certain `Columns` / `Filters` / `Sorters` / `Pagination`. When we say `Columns`, we actually mean their size, order position and visibility (shown/hidden) in the grid.
#### Combining the two together
So basically, the idea is to save the `Grid State` in Local Storage (or DB) before the grid gets destroyed and once we come back to that same page we can preset the grid with the exact same state as it was before leaving the page (just like if we were doing a forward/back button with browser history).

## Grid State
You can get the `Grid State` at any point in time. However if you wish to save the grid state before leaving the page and store that in Local Storage, then the best way is to use the `detached()` of your ViewModel.

##### View

```html
<div class="grid1"></div>
```

##### ViewModel

```ts
export class GridExample {
  sgb;

  attached() {
    const dataset = this.initializeGrid();
    const gridContainerElm = document.querySelector<HTMLDivElement>('.grid1');
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions, dataset);
  }

  detached() {
    this.saveCurrentGridState()
  }

  // you can save it to Local Storage of DB in this call
  saveCurrentGridState() {
    const gridState: GridState = this.sgb.gridStateService.getCurrentGridState();
    console.log('Leaving page with current grid state', gridState);
  }
}
```

> **Note** since v10 you can now pass `true` as the argument to `gridStateService.getCurrentGridState(true)` which will return all columns, not just the visible columns but also include the hidden columns and their "hidden" properties.

### Using Grid Presets & Filter SearchTerm(s)
What happens when we use the grid `presets` and a [Filter Default SearchTerms](../column-functionalities/filters/Select-Filter.md#default-search-terms)? In this case, the `presets` will win over filter `searchTerms`. The cascading order of priorities is the following
1. Do we have any `presets`? Yes use them, else go to step 2
2. Do we have any Filter `searchTerms`? Yes use them, else go to step 3
3. No `presets` and no `searchTerms`, load grid with default grid & column definitions

## Grid Presets
### Structure
The current structure of a Grid Presets is the following
```typescript
export interface CurrentColumn {
  columnId: string;
  cssClass?: string;
  headerCssClass?: string;
  width?: number;
}
export interface CurrentFilter {
  columnId: string;
  operator?: OperatorType;
  searchTerms?: SearchTerm[];
}
export interface CurrentSorter {
  columnId: string;
  direction: SortDirection;
}
export interface GridState {
  columns?: CurrentColumn[] | null;
  filters?: CurrentFilter[] | null;
  grouping?: string[] | null;
  sorters?: CurrentSorter[] | null;
  pagination?: {
    pageNumber: number;
    pageSize: number;
  };
  pinning?: CurrentPinning;
  rowSelection?: CurrentRowSelection | null;
  treeData?: Partial<TreeToggleStateChange> | null;
}
```

> [!NOTE]
> You can get Grouping column Ids as Grid State but it is limited to Draggable Grouping **only** via Grid Presets and it will not work with regular Grouping.

#### Example
For example, we can set `presets` on a grid like so:

##### View

```html
<div class="grid1"></div>
```

##### ViewModel

```ts
export class GridExample {
  sgb;

  attached() {
    const dataset = this.initializeGrid();
    const gridContainerElm = document.querySelector<HTMLDivElement>('.grid1');
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions, dataset);
  }

  attached() {
    this.columnDefinitions = [
      { id: 'name', name: 'Name', field: 'name', filterable: true, sortable: true, sortable: true },
      { id: 'duration', name: 'Duration', field: 'duration', filterable: true, sortable: true },
      { id: 'complete', name: '% Complete', field: 'percentComplete', filterable: true, sortable: true },
    ];

    this.gridOptions = {
      enableFiltering: true,

      // use columnDef searchTerms OR use presets as shown below
      presets: {
        // the column position in the array is very important and represent
        // the position that will show in the grid
        columns: [
          { columnId: 'duration', width: 88, headerCssClass: 'customHeaderClass' },
          { columnId: 'complete', width: 57 }
        ],
        filters: [
          { columnId: 'duration', searchTerms: [2, 22, 44] },
          { columnId: 'complete', searchTerm: '>5' }
        ],
        sorters: [
          { columnId: 'duration', direction: 'DESC' },
          { columnId: 'complete', direction: 'ASC' }
        ],

        // with Backend Service ONLY, you can also add Pagination info
        pagination: { pageNumber: 2, pageSize: 20 }
      }
    };
  }
}
```

### Grid State Events
You can subscribe to GridState Service dispatched event

Examples
#### `onGridStateServiceChanged` dispatched event
##### View
```html
<div class="grid1"></div>
```

##### ViewModel
```ts
export class GridExample {
  sgb;

  attached() {
    const dataset = this.initializeGrid();
    const gridContainerElm = document.querySelector<HTMLDivElement>('.grid1');
    gridContainerElm.addEventListener('ongridstatechanged', this.handleOnGridStateChanged.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions, dataset);
  }

  handleOnGridStateChanged(gridState) {
    console.log(gridState);
  }
}
```

##### View - SalesForce (ES6)
```html
<div class="grid-container">
    <div class="grid1"
            ongridstatechanged={handleOnGridStateChanged}>
    </div>
</div>
```
## How to Load Grid with certain Columns Preset (example hide certain Column(s) on load)
You can show/hide or even change a column position via the `presets`, yes `presets` is that powerful. All you need to do is to pass all Columns that you want to show as part of the `columns` property of `presets`. Typically you already have the entire columns definition since you just defined it, so you can loop through it and just use `map` to list the `columns` according to the structure needed (see [preset structure](grid-state-preset#structure.md)). What you have to know is that whatever array you provide to `presets`, that will equal to what the user will see and also in which order the columns will show (the array order does matter in this case). If a Columns is omitted from that array, then it will be considered to be a hidden column (you can still show it through Grid Menu and/or Column Picker).

So let say that we want to hide the last Column on page load, we can just find the column by it's `id` that you want to hide and pass the new column definition to the `presets` (again make sure to follow the correct preset structure).

#### Option 1

Pass the Grid Presets with an array that has less `presets.columns`, whichever column(s) are missing will be considered hidden columns

```ts
this.columnDefinitions = [
  // initial column definitions
];

// for example, let's hide last column, we can just use `pop()` to ommit last column
// and use `map()` to pull only the required field for presets to work
const mappedColumnDefinitions = this.columnDefinitions.map(col => ({ columnId: col.id, width: col.width }));
mappedColumnDefinitions.pop();

// then pass it to the grid presets (an array of columns minus the last column)
this.gridOptions = {
  presets: {
    columns: mappedColumnDefinitions
  }
};
```
This would be the easiest way to do it.

#### Option 2

Since v10, the second alternative is to pass all the columns to `presets.columns` with some of them having the `hidden` properties. Both approaches are valid in v10, just choose whichever option you prefer.

###### Summary
As pointed out earlier, the `presets` requires a specific structure where the `columns` is the list of columns to show/hide with their possible widths. Also worth mentioning again that the position in the array is very important as it defines the position shown in the UI.

##### ViewModel
```ts
this.gridOptions = {
      enableFiltering: true,

      // use columnDef searchTerms OR use presets as shown below
      presets: {
        // the column position in the array is very important and represent
        // the position that will show in the grid
        columns: [
          { columnId: 'duration', width: 88, headerCssClass: 'customHeaderClass' },
          { columnId: 'complete', width: 57 }
        ],
   }
};
```
You could technically redefine by hand the complete list of `columns` that the `presets` requires. I would personally do it via the Column Definitions looping with `map()`, but loading them manually is also perfectly fine. You would just re-declare the `columns` again with the `id` and `width` (maybe include the `hidden` prop as well) and that would work as well.