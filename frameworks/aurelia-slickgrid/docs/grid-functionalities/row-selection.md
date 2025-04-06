#### index
- [Single Row Selection](#single-row-selection)
- [Multiple Row Selections](#multiple-row-selections)
- [Change Dynamically Single/Multiple Selections](#changing-dynamically-from-single-to-multiple-selections-and-vice-versa)
- [Mixing Single & Multiple Row Selections](#mixing-single--multiple-row-selections)
- [Disable Custom Rows Selections via `selectableOverride`](#disable-custom-rows-selections-via-selectableoverride)
- [Disable External Button when having Empty Selection](#disable-external-button-when-having-empty-selection)
- [Change Row Selections](#change-row-selections)
- Troubleshooting
  - [Adding a Column dynamically is removing the Row Selection, why is that?](#adding-a-column-dynamically-is-removing-the-row-selection-why-is-that)

### Description
For row selection, you can simply play with couple of grid options (see below) and subscribe to `onSelectedRowsChanged` (a SlickGrid Event that is, it's not an Observable). However please note that `onSelectedRowsChanged` is a function available on the `Grid` object and you will need bind to `(gridChanged)` to get the object when grid is ready. There are 2 types of row selection(s) which you can do.

**Note:** `enableCheckboxSelector` and `enableExcelCopyBuffer` do not work well together, this is because they both share the same `Row.SelectionModel` and one cancels the other. It is recommended to not use `enableExcelCopyBuffer` in that case.

### Demo
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid/#/slickgrid/example10) / [Demo ViewModel](https://github.com/ghiscoding/aurelia-slickgrid/blob/master/packages/demo/src/examples/slickgrid/example10.ts)

## Single Row Selection
For a single row selection, you need to have `enableCellNavigation: true`, `enableRowSelection: true` and `multiSelect: false` and as described earlier, subscribe to `onSelectedRowsChanged` (for that you need to bind to `gridChanged`).

**Note:** if you want to change from Multiple Selections to Single Selection (and vice-versa), you could use the grid options `enableCellNavigation` flag, however this is not possible when using Inline Editors since this flag is required. However, there is no other known ways of toggling dynamically.

#### View
```html
<aurelia-slickgrid gridId="grid4"
    grid.bind="gridObj"
    columnDefinitions.bind="columnDefinitions"
    gridOptions.bind="gridOptions"
    dataset.bind="dataset"
    on-selected-rows-changed.trigger="handleRowSelection($event.detail.eventData, $event.detail.args)">
</aurelia-slickgrid>
```

#### Component
```ts
this.gridOptions = {
  enableAutoResize: true,
  enableCellNavigation: true,
  enableCheckboxSelector: true,
  enableRowSelection: true,
  multiSelect: false,
}

onSelectedRowsChanged(e, args) {
  if (Array.isArray(args.rows)) {
    this.selectedObjects = args.rows.map(idx => {
      const item = grid.getDataItem(idx);
      return item.title || '';
    });
  }
}
```

## Multiple Row Selections
As for multiple row selections, you need to provide an extra grid option of `rowSelectionOptions` which is an object and within it, you need to disable the `selectActiveRow` flag. The other configurations are the same as a Single Selection, which is to enable `enableCheckboxSelector` and `enableRowSelection`. Then as describe earlier, you will subscribe to `onSelectedRowsChanged` (for that you need to bind to `gridChanged`).

#### View
```html
<aurelia-slickgrid gridId="grid4"
    grid.bind="gridObj"
    columnDefinitions.bind="columnDefinitions"
    gridOptions.bind="gridOptions"
    dataset.bind="dataset"
    on-selected-rows-changed.trigger="handleRowSelection($event.detail.eventData, $event.detail.args)">
</aurelia-slickgrid>
```

#### Component
```typescript
export class Example1 {
  defineGrid() {
    // define columns
    ...

    // grid options
    this.gridOptions = {
      enableAutoResize: true,
      enableCellNavigation: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
    }
  }

  handleRowSelection(event, args) {
    console.log(event, args);
  }
}
```
## Changing Dynamically from Single to Multiple Selections (and vice-versa)
If you want to change from Multiple Selections to Single Selection (and vice-versa), you could toggle the grid options `enableCellNavigation` flag (`False` when you want Single Selection), however this is not possible when using Inline Editors since this flag is required. Note that there is currently no other ways of toggling dynamically without re-creating the grid.

## Mixing Single & Multiple Row Selections
SlickGrid is so powerful and customizable, you could if you wish mix the multiple row selections (cell column 1) and single row selection (any other cell click). For that though, you will need to use 2 SlickGrid Events (`onClick` and `onSelectedRowsChanged`). For example we can do it this way:

#### Component
```typescript
export class Example1 {
  defineGrid() {
    this.gridOptions = {
      enableAutoResize: true,
      enableCellNavigation: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
    }
  }

  gridObjChanged(grid) {
    grid.onSelectedRowsChanged.subscribe((e, args) => {
      if (Array.isArray(args.rows)) {
        this.selectedObjects = args.rows.map(idx => {
          const item = grid.getDataItem(idx);
          return item.title || '';
        });
      }
    });
  }
}
```

## Disable Custom Rows Selections via `selectableOverride`
You can use `selectableOverride` to provide custom logic to disable certain rows selections, for example the code below will remove the row selection on every second row.

#### Component
```typescript
export class Example1 implements OnInit {
  prepareGrid() {
    this.gridOptions = {
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        // you can override the logic for showing (or not) the expand icon
        // for example, display the expand icon only on every 2nd row
        selectableOverride: (row: number, dataContext: any, grid: any) => (dataContext.id % 2 === 1)
      },
      multiSelect: false,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: true,
      },
    };
  }
}
```

### Disable External Button when having Empty Selection
When having an external button that you want to work only when there's row selection, there are 2 ways of doing this.
1. use the `onSelectedRowsChanged` event (via your View in HTML or via ViewModel)
```html
<button disabled.bind="isMyButtonDisabled">My Button</button>
<aurelia-slickgrid gridId="grid4"
    columnDefinitions.bind="columnDefinitions"
    gridOptions.bind="gridOptions"
    dataset.bind="dataset"
    on-selected-rows-changed.trigger="handleOnSelectedRowsChanged($event.detail.args)">
</aurelia-slickgrid>
```
```ts
isMyButtonDisabled = false;

handleOnSelectedRowsChanged(args) {
  this.isMyButtonDisabled = args?.rows?.length === 0;
}
```
2. use the `onGridStateChanged` event (see [Grid State & Presets](grid-state-preset.md) Wiki)
```html
<button disabled.bind="isMyButtonDisabled">My Button</button>
<aurelia-slickgrid gridId="grid4"
    columnDefinitions.bind="columnDefinitions"
    gridOptions.bind="gridOptions"
    dataset.bind="dataset"
    on-grid-state-service-changed.trigger="handleOngridStateChanged($event.detail.args)">
</aurelia-slickgrid>
```
```ts
isMyButtonDisabled = false;

handleOngridStateChanged(gridState) {
  if (Array.isArray(gridState?.rowSelection.dataContextIds)) {
    this.isMassSelectionDisabled = gridState.rowSelection.dataContextIds.length === 0;
  }
}
```

### Change Row Selections
You can change which row(s) are selected by using the built-in SlickGrid method `setSelectedRows(rowIndexes)` (passing an empty array will clear all selection), however please note that it requires an array of row indexes as you see them in the UI and it won't work that great with Pagination (if that is what you are looking for then take a look at this Stack Overflow [Q&A](https://stackoverflow.com/questions/59629565/want-to-change-gridoption-preselectedrows-row-in-aurelia-slickgrid-dynamically-o))

```html
<aurelia-slickgrid
      grid-id="grid1"
      column-definitions.bind="columnDefinitions"
      grid-options.bind="gridOptions"
      dataset.bind="dataset"
      on-aurelia-grid-created.trigger="aureliaGridReady($event.detail)">
</aurelia-slickgrid>
```

```ts
export class Example1 {
  aureliaGrid: AureliaGridInstance;

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  changeRowSelections() {
    this.aureliaGrid.slickGrid.setSelectedRows(rowIndexes);

    // OR providing an empty array will clear the row selection
    // this.aureliaGrid.slickGrid.setSelectedRows([]);
  }
}
```

## Troubleshooting
### Adding a Column dynamically is removing the Row Selection, why is that?
The reason is because the Row Selection (checkbox) plugin is a special column and Aurelia-Slickgrid is adding an extra column dynamically for the Row Selection checkbox and that is **not** reflected in your local copy of `columnDefinitions`. To address this issue, you need to get the Aurelia-Slickgrid internal copy of all columns (including the extra columns), you can get it via `getAllColumnDefinitions()` from the Grid Service and then you can use to that array and that will work.

```html
<aurelia-slickgrid grid-id="grid16"
    column-definitions.bind="columnDefinitions"
    grid-options.bind="gridOptions"
    dataset.bind="dataset"
    on-aurelia-grid-created.trigger="aureliaGridReady($event.detail)">
</aurelia-slickgrid>
```
```ts
aureliaGridReady(aureliaGrid: AureliaGridInstance) {
  this.aureliaGrid = aureliaGrid;
}

addNewColumn() {
  const newColumn = { /*...*/ };

  const allColumns = this.aureliaGrid.gridService.getAllColumnDefinitions();
  allColumns.push(newColumn);
  this.columnDefinitions = allColumns.slice(); // or use spread operator [...cols]

  // you could also use SlickGrid setColumns() method
  // this.aureliaGrid.slickGrid.setColumns(cols);
}
```
