#### Index
- [Update Filters Dynamically](input-filter.md#update-filters-dynamically)
- [Custom Filter Predicate](input-filter.md#custom-filter-predicate)

### Description
Some users might want to have 1 main single search for filtering the grid data instead of using multiple column filters. You can see a demo of that below.

> **Note** the code below came from a different SlickGrid framework, just change the `.bind` to whatever framework you use with the appropriate code change. It's only meant to show roughly how to do it.

### Code Sample
#### View
```html
  <form class="form-inline">
    <div class="form-group">
      <label>
        Single Search:<br>
      </label>
      <select value.bind="selectedColumn"
              class="form-control">
        <option repeat.for="column of columnDefinitions"
                model.bind="column">
          ${column.name}
        </option>
      </select>
    </div>
    <select value.bind="selectedOperator"
            class="form-control">
      <option repeat.for="operator of operatorList"
              model.bind="operator">
        ${operator}
      </option>
    </select>
    <input type="text"
           class="form-control"
           placeholder="search value"
           value.bind="searchValue">
  </form>

<div grid-id="grid21"
    column-definitions.bind="columnDefinitions"
    grid-options.bind="gridOptions"
    dataset.bind="dataset">
</div>
```

##### ViewModel
```ts
export class MyExample {
  selectedColumn: Column;
  selectedOperator: string;
  searchValue: string;

  grid: SlickGrid;
  dataView: SlickDataView;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  operatorList: OperatorString[] = ['=', '<', '<=', '>', '>=', '<>'];

  //
  // -- if any of the Search form input changes, we'll call the updateFilter() method
  //

  selectedOperatorChanged() {
    this.updateFilter();
  }

  selectedColumnChanged() {
    this.updateFilter();
  }

  searchValueChanged() {
    this.updateFilter();
  }

  updateFilter() {
    const fieldName = this.selectedColumn.field;
    const filter = {};
    const filterArg: FilterCallbackArg = {
      columnDef: this.selectedColumn,
      operator: this.selectedOperator as OperatorString, // or fix one yourself like '='
      searchTerms: [this.searchValue || '']
    };

    if (this.searchValue) {
      // pass a columnFilter object as an object which it's property name must be a column field name (e.g.: 'duration': {...} )
      filter[fieldName] = filterArg;
    }

    this.sgb.dataView.setFilterArgs({
      columnFilters: filter,
      grid: this.aureliaGrid.slickGrid
    });
    this.aureliaGrid.dataView.refresh();
  }
```

## Sample
![2019-04-16_15-42-05](https://user-images.githubusercontent.com/643976/56239148-3b530680-605e-11e9-99a2-e9a163abdd0c.gif)