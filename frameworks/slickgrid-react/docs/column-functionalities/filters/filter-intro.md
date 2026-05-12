#### Index
- [How to use Filter?](#how-to-use-filter)
- [Filtering with Localization](input-filter.md#filtering-with-localization-i18n)
- [Filter Complex Object](input-filter.md#how-to-filter-complex-objects)
- [Update Filters Dynamically](input-filter.md#update-filters-dynamically)
- [Query Different Field (Filter/Sort)](input-filter.md#query-different-field)
- [Dynamic Query Field](input-filter.md#dynamic-query-field)
- [Debounce/Throttle Text Search (wait for user to stop typing before filtering)](input-filter.md#debouncethrottle-text-search-wait-for-user-to-stop-typing-before-filtering)
- [Ignore Locale Accent in Text Filter/Sorting](input-filter.md#ignore-locale-accent-in-text-filtersorting)
- [Custom Filter Predicate](input-filter.md#custom-filter-predicate)
- [Filter Shortcuts](input-filter.md#filter-shortcuts)

### Description

Filtering is a big part of a data grid, Slickgrid-Universal provides a few built-in Filters that you can use in your grids. You need to tell the grid that you want to use Filtering (via Grid Options) and you also need to enable the filter for every column that you need filtering (via Column Definitions).

### How to use Filter?
You simply need to set the flag `filterable` for each column that you want filtering and then also enable the filters in the Grid Options. Here is an example with a full column definitions:
```ts
// define you columns, in this demo Effort Driven will use a Select Filter
const columns = [
  { id: 'title', name: 'Title', field: 'title' }, // without filter
  { id: 'description', name: 'Description', field: 'description', filterable: true } // with filter
];

// you also need to enable the filters in the Grid Options
const gridOptions = {
  enableFiltering: true
};
```

### How to hide Filter Header Row?
There are 2 ways to hide Filters from the user, you could disable it completely OR you could hide the Filter Header Row.

##### You could disable the Filters completely, 
```ts
function reactGridReady(reactGrid: SlickgridReactInstance) {
  reactGridRef.current = reactGrid;
}

function disableFilters() {
  const gridOptions = {
     enableFiltering: false
  };
  
  // you could re-enable it later
  reactGridRef.current?.setOptions({ enableFiltering: true });
}
```

##### You could also enable Filters but Hide them from the user in the UI
This can be useful for features that require Filtering but you wish to hide the filters for example Tree Data.

```ts
const gridOptions = {
  enableFiltering: true,
  showHeaderRow: false,
};
```

Also, if you don't want to see the Grid Menu toggle filter row command, you should also hide it from the menu via 

```ts
function reactGridReady(reactGrid: SlickgridReactInstance) {
  reactGridRef.current = reactGrid;
}

showFilterRow() {
  const gridOptions = {
    enableFiltering: true,
    showHeaderRow: false,
    gridMenu: { 
      hideToggleFilterCommand: true 
    },
  };
  
  // you can show toggle the filter header row dynamically
  reactGridRef.current?.setHeaderRowVisibility(true);
}
```

### Default Filter Functionality

The default filter is by default the `Filters.input` (when none is provided), is supporting the following operators: (`>`, `>=`, `<`, `<=`, `<>`, `!=`, `=`, `==`, `*`) that can be typed directly into the text filter, range filters can also have 1 of these options (`rangeInclusive` (default) or `rangeExclusive`). Also note that `<>` and `!=` are not aliased and have subtle differences. However the `=` and `==` are indeed aliases and equivalents.

Examples:
- Number type
  - `>100` => bigger than 100
  - `<>100` => anything with the exception of 100
  - `15..44` => range between 15 and 44 (you can also provide option `rangeInclusive` (default) or `rangeExclusive`)
- Date types
  - `>=2001-01-01` => greater or equal than date `2001-01-01`
  - `<02/28/17` => lower than date `02/28/17`
  - `2001-01-01..2002-02-22` => range between `2001-01-01` and `2002-02-22`
- String type
  - `<>John` => not containing the sub-string `John`
  - `!=John` => not equal to the text `John` (note that this is **not** equivalent to `<>`)
  - `John*` => starts with the sub-string `John`
  - `*Doe` => ends with the sub-string `Doe`
  - `ab..ef` => anything included between `af` and `ef`
    - refer to the ASCII table for each character assigned index
  - `!= ` => get defined only data and exclude any `undefined`, `null` or empty string `' '`
     - notice the empty string in the search value `' '`

Note that you could also do the same kind of functionality by using the Compound Filter.