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
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example07) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example07.ts)

## Single Row Selection
For a single row selection, you need to have `enableCellNavigation: true`, `enableRowSelection: true` and `multiSelect: false` and as described earlier, subscribe to `onSelectedRowsChanged` (for that you need to bind to `(gridChanged)`). There are 2 ways to choose for the implementation of a row selection, option **1.** is the most common option and is the recommend way of doing it.

### 1. with Event Listener (preferred way)
You can also do it through a Custom Event listener since all SlickGrid events are exposed as Custom Event. For more info see [Wiki - OnEvents](Grid-&-DataView-Events.md)

#### ViewModel
```ts
export class Example1 {
  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid3`);

    gridContainerElm.addEventListener('onselectedrows', this.handleOnClick.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  initializeGrid() {
    // define columns
    ...

    // grid options
    this.gridOptions = {
      enableAutoResize: true,
      enableCellNavigation: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      multiSelect: false,
    }
  }

  handleRowSelection(event) {
    const args = event?.detail?.args;
    console.log(event, args);
  }
}
```

### 2. with SlickGrid object & onEvent
It's preferable to use the Custom Events, but if you really wish, you can also use directly the SlickGrid event that you can subscribe to. However, don't forget to unsubscribe to a SlickGrid event.
#### ViewModel
```ts
this.gridOptions = {
  enableAutoResize: true,
  enableCellNavigation: true,
  enableRowSelection: true
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
```

## Multiple Row Selections
As for multiple row selections, you need to disable `enableCellNavigation` and enable `enableCheckboxSelector` and `enableRowSelection`. Then as describe earlier, you will subscribe to `onSelectedRowsChanged` (for that you need to bind to `(gridChanged)`). There are 2 ways to choose for the implementation of a row selection, option **1.** is the most common option and is the recommend way of doing it.

### 1. with Custom Events (preferred way)
You can also do it through a Custom Event listener since all SlickGrid events are exposed as Custom Events. For more info see [Wiki - OnEvents](Grid-&-DataView-Events.md)

#### ViewModel
```ts
export class Example1 {
  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid3`);

    gridContainerElm.addEventListener('onselectedrows', this.handleOnClick.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  initializeGrid() {
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

  handleRowSelection(event) {
    const args = event?.detail?.args;
    console.log(event, args);
  }
}
```

### 2. with SlickGrid object & onEvent
It's preferable to use the Custom Event listeners, but if you really wish, you can also use directly the SlickGrid event that you can subscribe to. However, don't forget to unsubscribe to a SlickGrid event.
#### ViewModel
```ts
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

## Changing Dynamically from Single to Multiple Selections (and vice-versa)
If you want to change from Multiple Selections to Single Selection (and vice-versa), you could toggle the grid options `enableCellNavigation` flag (`False` when you want Single Selection), however this is not possible when using Inline Editors since this flag is required. Note that there is currently no other ways of toggling dynamically without re-creating the grid.

## Mixing Single & Multiple Row Selections
SlickGrid is so powerful and customizable, you could if you wish mix the multiple row selections (cell column 1) and single row selection (any other cell click). For that though, you will need to use 2 SlickGrid Events (`onClick` and `onSelectedRowsChanged`). For example with a Custom Event listener we can do it this way:

#### ViewModel
```ts
export class Example1 {
  handleMultipleRowSelections(event) {
    const args = event?.detail?.args;
    console.log('multiple row checkbox selected', event, args);
  }

  handleSingleRowClick(event) {
    const args = event?.detail?.args;
    console.log('multiple row checkbox selected', event, args);

    // when clicking on any cell, we will make it the new selected row
    // however, we don't want to interfere with multiple row selection checkbox which is on 1st column cell
    if (args.cell !== 0) {
      grid.setSelectedRows([args.row]);
    }
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
<div class="myGrid"
    onselectedrowschanged.trigger="handleOnSelectedRowsChanged">
</div>
```
```ts
isMyButtonDisabled = false;

handleOnSelectedRowsChanged(event) {
  const args = event?.detail?.args;
  this.isMyButtonDisabled = args.rows?.length === 0;
}
```
2. use the `onGridStateChanged` event (see [Grid State & Presets](grid-state-preset.md) Wiki)
```html
<button disabled.bind="isMyButtonDisabled">My Button</button>
<div class="myGrid"
    ongridstatechanged.trigger="handleOngridStateChanged">
</div>
```
```ts
isMyButtonDisabled = false;

handleOngridStateChanged(event) {
  const gridState = event && event.detail && event.detail.gridState;
  if (Array.isArray(gridState?.rowSelection.dataContextIds)) {
    this.isMassSelectionDisabled = gridState.rowSelection.dataContextIds.length === 0;
  }
}
```

### Change Row Selections
You can change which row(s) are selected by using the built-in SlickGrid method `setSelectedRows(rowIndexes)` (passing an empty array will clear all selection), however please note that it requires an array of row indexes as you see them in the UI and it won't work that great with Pagination (if that is what you are looking for then take a look at this Stack Overflow [Q&A](https://stackoverflow.com/questions/59629565/want-to-change-gridoption-preselectedrows-row-in-angular-slickgrid-dynamically-o))

```ts
export class Example1 {
  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid3`);
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  clearRowSelection() {
    this.sgb.slickGrid.setSelectedRows([]); // empty array will clear the row selection
  }
  changeRowSelections() {
    this.sgb.slickGrid.setSelectedRows(rowIndexes);

    // OR providing an empty array will clear the row selection
    // this.sgb.slickGrid.setSelectedRows([]);
  }
}
```

### Hybrid Selection Model

Starting with v9.10.0, you can now use the new Hybrid Selection Model, this new model will allow you to do Cell Selection & Row Selection in the same grid. This wasn't previously doable before that version because SlickGrid only ever allows 1 selection model to be loaded at once and so we had to load either `SlickCellSelectionModel` or `SlickRowSelectionModel` but never both of them at the same time. The new Hybrid Selection Model is merging both of these plugins in a single plugin allowing us to do both type of selections.

> [!NOTE]
> You can use `enableHybridSelection: true` grid option to enable the new Hybrid Model, this new model will eventually replace both cell/row selection model in the future since there's no need to keep all these models when only 1 is more than enough

For example, we could use the Excel Copy Buffer (Cell Selection) and use `rowSelectColumnIds` (Row Selection)

```ts
this.gridOptions = {
  // enable new hybrid selection model (rows & cells)
  enableHybridSelection: true,
  rowSelectionOptions: {
    selectActiveRow: true,
    rowSelectColumnIds: ['selector'],
  },

  // when using the ExcelCopyBuffer, you can see what the selection range is
  enableExcelCopyBuffer: true,
  excelCopyBufferOptions: {
    copyActiveEditorCell: true,
    removeDoubleQuotesOnPaste: true,
    replaceNewlinesWith: ' ',
  },
};
```

#### Hybrid Selection Model and Drag-Fill

You can also `onDragReplaceCells` event to drag and fill cell values to the extended cell selection.

#### ViewModel

```ts
export class Example1 {
  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid3`);

    gridContainerElm.addEventListener('ondragreplacecells', this.handleOnClick.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  initializeGrid() {
    this.gridOptions = {
      // enable new hybrid selection model (rows & cells)
      enableHybridSelection: true,
      // ...
    };
  }

  /** Copy the dragged cell values to other cells that are part of the extended drag-fill selection */
  copyDraggedCellRange(args: OnDragReplaceCellsEventArgs) {
    const verticalTargetRange = SlickSelectionUtils.verticalTargetRange(args.prevSelectedRange, args.selectedRange);
    const horizontalTargetRange = SlickSelectionUtils.horizontalTargetRange(args.prevSelectedRange, args.selectedRange);
    const cornerTargetRange = SlickSelectionUtils.cornerTargetRange(args.prevSelectedRange, args.selectedRange);

    if (verticalTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, verticalTargetRange, args.grid);
    }
    if (horizontalTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, horizontalTargetRange, args.grid);
    }
    if (cornerTargetRange) {
      SlickSelectionUtils.copyCellsToTargetRange(args.prevSelectedRange, cornerTargetRange, args.grid);
    }
  }
}
```

## Troubleshooting
### Adding a Column dynamically is removing the Row Selection, why is that?
The reason is because the Row Selection (checkbox) plugin is a special column and Slickgrid-Universal is adding an extra column dynamically for the Row Selection checkbox and that is **not** reflected in your local copy of `columnDefinitions`. To address this issue, you need to get the Slickgrid-Universal internal copy of all columns (including the extra columns), you can get it via `getAllColumnDefinitions()` from the Grid Service and then you can use to that array and that will work.

```ts
const newColumn = { /*...*/ };

const allColumns = this.sgb.gridService.getAllColumnDefinitions();
allColumns.push(newColumn);
this.columnDefinitions = allColumns.slice(); // or use spread operator [...cols]

// you could also use SlickGrid setColumns() method
// this.sgb.slickGrid.setColumns(cols);
```