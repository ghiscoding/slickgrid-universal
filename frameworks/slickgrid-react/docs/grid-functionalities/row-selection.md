#### index
- [Single Row Selection](#single-row-selection)
- [Multiple Row Selections](#multiple-row-selections)
- [Change Dynamically Single/Multiple Selections](#changing-dynamically-from-single-to-multiple-selections-and-vice-versa)
- [Mixing Single & Multiple Row Selections](#mixing-single--multiple-row-selections)
- [Disable Custom Rows Selections via `selectableOverride`](#disable-custom-rows-selections-via-selectableoverride)
- [Disable External Button when having Empty Selection](#disable-external-button-when-having-empty-selection)
- [Change Row Selections](#change-row-selections)
- Troubleshooting
  - [Adding a Column dynamically is removing the Row Selection column, why is that?](#adding-a-column-dynamically-is-removing-the-row-selection-column-why-is-that)
- [Hybrid Selection Model (cell+row selection)](#hybrid-selection-model-and-drag-fill)

### Description
For row selection, you can simply play with couple of grid options (see below) and subscribe to `onSelectedRowsChanged` (a SlickGrid Event that is, it's not an Observable). However please note that `onSelectedRowsChanged` is a function available on the `Grid` object and you will need bind to `(gridChanged)` to get the object when grid is ready. There are 2 types of row selection(s) which you can do.

**Note:** `enableCheckboxSelector` and `enableExcelCopyBuffer` do not work well together, this is because they both share the same `Row.SelectionModel` and one cancels the other. It is recommended to not use `enableExcelCopyBuffer` in that case.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react-demos/#/Example10) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example10.ts)

## Single Row Selection
For a single row selection, you need to have `enableCellNavigation: true`, `enableRowSelection: true` and `multiSelect: false` and as described earlier, subscribe to `onSelectedRowsChanged` (for that you need to bind to `(gridChanged)`). There are 2 ways to choose for the implementation of a row selection, option **1.** is the most common option and is the recommend way of doing it.

### 1. with Delegate (preferred way)
You can also do it through a `delegate` since all SlickGrid events are exposed as `delegate`. For more info see [Docs - OnEvents - `3. delegate`](../events/grid-dataview-events.md)

#### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption>();

  function defineGrid() {
    // define columns
    ...

    // grid options
    setOptions({
      enableAutoResize: true,
      enableCellNavigation: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      multiSelect: false,
    });
  }

  function handleRowSelection(event, args) {
    console.log(event, args);
  }

  return !options ? '' : (
    <SlickgridReact gridId="grid1"
      columns={columnDefinitions1}
      options={gridOptions1!}
      dataset={dataset1}
      onReactGridCreated={$event => reactGrid1Ready($event.detail)}
      onSelectedRowsChanged={$event => onGrid1SelectedRowsChanged($event.detail.eventData, $event.detail.args)}
    />
  );
};

export default Example;
```

### 2. with SlickGrid object & onEvent
It's preferable to use the `with delegate`, but if you really wish, you can also use directly the SlickGrid event that you can subscribe to. However, don't forget to unsubscribe to a SlickGrid event.
#### Component
```tsx
const options = {
  enableAutoResize: true,
  enableCellNavigation: true,
  enableRowSelection: true
}

gridObjChanged(grid) {
  grid.onSelectedRowsChanged.subscribe((e, args) => {
    if (Array.isArray(args.rows)) {
      selectedObjects = args.rows.map(idx => {
        const item = grid.getDataItem(idx);
        return item.title || '';
      });
    }
  });
}
```

## Multiple Row Selections
As for multiple row selections, you need to disable `enableCellNavigation` and enable `enableCheckboxSelector` and `enableRowSelection`. Then as describe earlier, you will subscribe to `onSelectedRowsChanged` (for that you need to bind to `(gridChanged)`). There are 2 ways to choose for the implementation of a row selection, option **1.** is the most common option and is the recommend way of doing it.

### 1. with event (preferred way)
You can also do it through an event since all SlickGrid events are exposed. For more info see [Docs - OnEvents - `3. event`](../events/grid-dataview-events.md)

#### Component
```tsx
const Example: React.FC = () => {
  function defineGrid() {
    // define columns
    ...

    // grid options
    const gridOptions = {
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

  function handleRowSelection(event, args) {
    console.log(event, args);
  }

  return !options ? '' : (
    <SlickgridReact gridId="grid1"
      columns={columnDefinitions1}
      options={gridOptions1!}
      dataset={dataset1}
      onReactGridCreated={$event => reactGrid1Ready($event.detail)}
      onSelectedRowsChanged={$event => onGrid1SelectedRowsChanged($event.detail.eventData, $event.detail.args)}
    />
  );
}
```

### 2. with SlickGrid object & onEvent
It's preferable to use the `with delegate`, but if you really wish, you can also use directly the SlickGrid event that you can subscribe to. However, don't forget to unsubscribe to a SlickGrid event.
#### Component
```tsx
const Example: React.FC = () => {
  function defineGrid() {
    setOptions({
      enableAutoResize: true,
      enableCellNavigation: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
    });
  }

  function gridObjChanged(grid: SlickGrid) {
    grid.onSelectedRowsChanged.subscribe((e, args) => {
      if (Array.isArray(args.rows)) {
        selectedObjects = args.rows.map(idx => {
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
SlickGrid is so powerful and customizable, you could if you wish mix the multiple row selections (cell column 1) and single row selection (any other cell click). For that though, you will need to use 2 SlickGrid Events (`onClick` and `onSelectedRowsChanged`). For example with a `delegate` we can do it this way:

#### Component
```tsx
const Example: React.FC = () => {
  function handleMultipleRowSelections(event, args) {
    console.log('multiple row checkbox selected', event, args);
  }

  function handleSingleRowClick(event, args) {
    console.log('multiple row checkbox selected', event, args);

    // when clicking on any cell, we will make it the new selected row
    // however, we don't want to interfere with multiple row selection checkbox which is on 1st column cell
    if (args.cell !== 0) {
      grid.setSelectedRows([args.row]);
    }
  }

  return !options ? '' : (
    <SlickgridReact gridId="grid1"
      columns={columnDefinitions1}
      options={gridOptions1!}
      dataset={dataset1}
      onReactGridCreated={$event => reactGrid1Ready($event.detail)}
      onClick={$event => { onCellClicked($event.detail.eventData, $event.detail.args); }}
      onSelectedRowsChanged={$event => onGrid1SelectedRowsChanged($event.detail.eventData, $event.detail.args)}
    />
  );
}

export default Example;
```

## Disable Custom Rows Selections via `selectableOverride`
You can use `selectableOverride` to provide custom logic to disable certain rows selections, for example the code below will remove the row selection on every second row.

#### Component
```tsx
const Example: React.FC = () => {
  function defineGrid() {
    setOptions({
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        // you can override the logic for showing (or not) the expand icon
        // for example, display the expand icon only on every 2nd row
        // selectableOverride: (row: number, dataContext: any, grid: any) => (dataContext.id % 2 === 1)
      },
      multiSelect: false,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: true,
      },
    });
  }
}
```

### Disable External Button when having Empty Selection
When having an external button that you want to work only when there's row selection, there are 2 ways of doing
1. use the `onSelectedRowsChanged` event (via your View in HTML or via ViewModel)
```tsx
const [isMyButtonDisabled, setIsMyButtonDisabled] = useState(false);

function handleOnSelectedRowsChanged(args) {
  isMyButtonDisabled = args?.rows?.length === 0;
}

return !options ? '' : (
  <SlickgridReact gridId="grid1"
    columns={columnDefinitions1}
    options={gridOptions1!}
    dataset={dataset1}
    onReactGridCreated={$event => reactGrid1Ready($event.detail)}
    onClick={$event => { onCellClicked($event.detail.eventData, $event.detail.args); }}
    onSelectedRowsChanged={$event => handleOnSelectedRowsChanged($event.detail.eventData, $event.detail.args)}
  />
);
```

2. use the `onGridStateChanged` event (see [Grid State & Presets](../grid-functionalities/grid-state-preset.md) Docs)

```tsx
const [isMyButtonDisabled, setIsMyButtonDisabled] = useState(false);

function handleOngridStateChanged(gridState) {
  if (Array.isArray(gridState?.rowSelection.dataContextIds)) {
    isMassSelectionDisabled = gridState.rowSelection.dataContextIds.length === 0;
  }
}

return !options ? '' : (
  <SlickgridReact gridId="grid1"
    columns={columnDefinitions1}
    options={gridOptions1!}
    dataset={dataset1}
    onReactGridCreated={$event => reactGrid1Ready($event.detail)}
    onClick={$event => { onCellClicked($event.detail.eventData, $event.detail.args); }}
    onGridStateChanged={$event => gridStateChanged($event.detail)}
    onSelectedRowsChanged={$event => handleOngridStateChanged($event.detail.eventData, $event.detail.args)}
  />
);
```

### Change Row Selections
You can change which row(s) are selected by using the built-in SlickGrid method `setSelectedRows(rowIndexes)` (passing an empty array will clear all selection), however please note that it requires an array of row indexes as you see them in the UI and it won't work that great with Pagination (if that is what you are looking for then take a look at this Stack Overflow [Q&A](https://stackoverflow.com/questions/59629565/want-to-change-gridoption-preselectedrows-row-in-angular-slickgrid-dynamically-o))

```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function changeRowSelections() {
    reactGridRef.current?.slickGrid.setSelectedRows(rowIndexes);

    // OR providing an empty array will clear the row selection
    // reactGridRef.current?.slickGrid.setSelectedRows([]);
  }

  return !options ? null : (
    <SlickgridReact gridId="grid1"
      columns={columnDefinitions1}
      options={gridOptions1!}
      dataset={dataset1}
      onReactGridCreated={$event => reactGrid1Ready($event.detail)}
      onClick={$event => { onCellClicked($event.detail.eventData, $event.detail.args); }}
      onSelectedRowsChanged={$event => changeRowSelections()}
    />
  );
}

export default Example;
```

### Hybrid Selection Model

Starting with v9.10.0, you can now use the new Hybrid Selection Model, this new model will allow you to do Cell Selection & Row Selection in the same grid. This wasn't previously doable before that version because SlickGrid only ever allows 1 selection model to be loaded at once and so we had to load either `SlickCellSelectionModel` or `SlickRowSelectionModel` but never both of them at the same time. The new Hybrid Selection Model is merging both of these plugins in a single plugin allowing us to do both type of selections.

> [!NOTE]
> You can use `enableHybridSelection: true` grid option to enable the new Hybrid Model, this new model will eventually replace both cell/row selection model in the future since there's no need to keep all these models when only 1 is more than enough

For example, we could use the Excel Copy Buffer (Cell Selection) and use `rowSelectColumnIds` (Row Selection)

```tsx
setGridOptions({
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
});
```

#### Hybrid Selection Model and Drag-Fill

You can also `onDragReplaceCells` event to drag and fill cell values to the extended cell selection.

#### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption>();

  function defineGrid() {
    // define columns
    ...

    // grid options
    setOptions({
      // enable new hybrid selection model (rows & cells)
      enableHybridSelection: true,
      // ...
    });

  /** Copy the dragged cell values to other cells that are part of the extended drag-fill selection */
  function copyDraggedCellRange(args: OnDragReplaceCellsEventArgs) {
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

  return !options ? '' : (
      <SlickgridReact gridId="grid1"
        columns={columnDefinitions1}
        options={gridOptions1!}
        dataset={dataset1}
        onReactGridCreated={$event => reactGridReady($event.detail)}
        onDragReplaceCells={$event => copyDraggedCellRange($event.detail.args)}
      />
    );
};

export default Example;
```

## Troubleshooting
### Adding a Column dynamically is removing the Row Selection column, why is that?
The reason is because the Row Selection (checkbox) plugin is a special column and slickgrid-react is adding an extra column dynamically for the Row Selection checkbox and that is **not** reflected in your local copy of `columnDefinitions`. To address this issue, you need to get the slickgrid-react internal copy of all columns (including the extra columns), you can get it via `getAllColumnDefinitions()` from the Grid Service and then you can use to that array and that will work.

```tsx
function reactGridReady(reactGrid: SlickgridReactInstance) {
  reactGridRef.current = reactGrid;
}

addNewColumn() {
  const newColumn = { /*...*/ };

  const allColumns = reactGridRef.current?.gridService.getAllColumnDefinitions();
  allColumns.push(newColumn);
  setColumns(allColumns.slice()); // or use spread operator [...cols]

  // you could also use SlickGrid setColumns() method
  // reactGridRef.current?.slickGrid.setColumns(cols);
}
```
