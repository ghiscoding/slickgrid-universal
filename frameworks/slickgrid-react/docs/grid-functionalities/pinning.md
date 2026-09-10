#### Index
- [Columns/Rows Pinning Basic](#columnsrows-pinning-basic)
- [Rows Pinning starting from Bottom](#rows-pinning-starting-from-bottom)
- [Change Pinning Dynamically](#change-pinning-dynamically)
- [Animated Gif Demo](#animated-gif-demo)
- [Sticky Columns and Rows](sticky.md)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react-demos/#/Example20) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example20.tsx)

### Introduction
Pinning keeps selected columns or rows attached to a grid edge while the remaining content scrolls. Columns can be pinned on the left or right, and rows can be pinned at the top or bottom. You can also change pinning dynamically with `setOptions()`.

Set `Column.pinnable` to `false` when a column must not be pinned or unpinned from the Header Menu. It defaults to `true` and only controls the built-in UI; `Column.pinned` and the programmatic pinning APIs remain available for application-controlled state.

For scroll-activated docking, see [Sticky Columns and Rows](sticky.md). Sticky columns have no built-in Header Menu commands, so a separate `Column.stickable` flag is not needed.

## Columns/Rows Pinning basic
To configure pinning for the entire lifetime of the grid, use the nested `pinning` Grid Option.

##### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    setColumns([]);
    setOptions({
      alwaysShowVerticalScroll: false,
      pinning: {
        columns: { left: 2 },
        rows: { top: [0, 1, 2] },
      },
      // v11 and lower: frozenColumn: 2, frozenRow: 3
    });
  }

  return !options ? null : (
    <SlickgridReact gridId="grid1"
      columns={columns}
      options={options}
      dataset={dataset}
      onReactGridCreated={$event => reactGridReady($event.detail)}
      onGridStateChanged={$event => gridStateChanged($event.detail)}
    />
  );
}
```

> **Caution**
> Please be aware that pinned columns cannot consume the entire grid viewport. You can customize the validation with `invalidColumnPinningWidthCallback` or disable it with `skipPinningValidation`.

> **Caution**
> The Column Picker and Grid Menu also validate that at least one center column remains available. You can customize this with `invalidColumnPinningPickerCallback` or disable pinning validation with `skipPinningValidation`.

## Rows Pinning starting from bottom
To pin rows at the bottom, provide the row indexes in `pinning.rows.bottom` and leave the top list empty.
##### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {
      // your columns definition
    setColumns([]);
    setOptions({
      alwaysShowVerticalScroll: false,
      pinning: {
        columns: { left: 2 },
        rows: { bottom: [97, 98, 99] },
      },
      // v11 and lower: frozenColumn: 2, frozenRow: 3, frozenBottom: true
    });
  }
}
```

## Change Pinning Dynamically
You can change the number of pinned columns/rows and even the pinning of columns from top to bottom. For a demo of what that could look like, take a look at the [Animated Gif Demo](../grid-functionalities/pinning.md#animated-gif-demo) below.

##### Component
```tsx
import { SlickgridReactInstance } from 'slickgrid-react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const [isPinnedBottom, setIsPinnedBottom] = useState(false);
  const reactGridRef = useRef<SlickgridReactInstance>();

  useEffect(() => defineGrid(), []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    setColumns([ /*...*/ ]);
    setOptions({
      alwaysShowVerticalScroll: false,
      pinning: {
        columns: { left: 2 },
        rows: { top: [0, 1, 2] },
      },
    });
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
  function changePinnedColumnCount() {
    if (reactGridRef.current?.slickGrid.setOptions) {
      reactGridRef.current?.slickGrid.setOptions({
        pinning: { columns: { left: pinnedColumnCount } }
      });
    }
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
  function changePinnedRowCount() {
    if (reactGridRef.current?.slickGrid.setOptions) {
      reactGridRef.current?.slickGrid.setOptions({
        pinning: { rows: { top: [0, 1, 2] } }
      });
    }
  }

  /** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
  function togglePinnedBottomRows() {
    const newIsPinnedBottom = !isPinnedBottom;
    if (reactGridRef.current?.slickGrid.setOptions) {
      reactGridRef.current?.slickGrid.setOptions({
        pinning: {
          rows: newIsPinnedBottom ? { top: [], bottom: [0, 1, 2] } : { top: [0, 1, 2], bottom: [] },
        }
      });
      setIsPinnedBottom(newIsPinnedBottom); // toggle the variable
    }
  }

  return !optionns ? null : (
    <div className="row">
      <div className="col-sm-12">
        <span>
          <label htmlFor="">Pinned Rows: </label>
          <input type="number" min="-1" defaultValue={pinnedRowCount} onInput={($event) => changePinnedRowCount($event)} />
          <button className="btn btn-outline-secondary btn-xs btn-icon" onClick={() => changePinnedRowCount()}>
            Set
          </button>
        </span>
        <span style={{ marginLeft: '10px' }}>
          <label htmlFor="">Pinned Columns: </label>
          <input type="number" min="-1" defaultValue={pinnedColumnCount} onInput={($event) => changePinnedColumnCount($event)} />
          <button className="btn btn-outline-secondary btn-xs btn-icon" onClick={() => changePinnedColumnCount()}>
            Set
          </button>
        </span>
      </div>
    </div>
  );
}
```

## Animated Gif Demo
![](https://user-images.githubusercontent.com/643976/50852303-28d57c80-134d-11e9-859c-aeb55af24c24.gif)
