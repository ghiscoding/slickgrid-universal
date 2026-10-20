#### Index
- [Columns/Rows Pinning Basic](#columnsrows-pinning-basic)
- [Rows Pinning starting from Bottom](#rows-pinning-starting-from-bottom)
- [Change Pinning Dynamically](#change-pinning-dynamically)
- [Command labels and translation keys](#command-labels-and-translation-keys)
- [Sticky Columns and Rows](sticky.md)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react-demos/#/Example20) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example20.tsx)

### Introduction
Pinning keeps selected columns or rows attached to a grid edge while the remaining content scrolls. Columns can be pinned on the left or right, and rows can be pinned at the top or bottom. You can also change pinning dynamically with `setOptions()`.

Set `Column.pinnable` to `false` when a column must not be pinned or unpinned from the Header Menu. It defaults to `true` and only controls the built-in UI; `Column.pinned` and the programmatic pinning APIs remain available for application-controlled state.

For scroll-activated docking, see [Sticky Columns and Rows](sticky.md). Sticky columns have no built-in Header Menu commands, so a separate `Column.stickable` flag is not needed.

### Header Menu commands

The Pinning Commands root menu is available by default whenever the Header Menu is enabled, including when the grid has no initial `pinning` state. To hide the entire root menu, add `'pinning-commands'` to `headerMenu.hideCommands`:

```ts
headerMenu: {
  hideCommands: ['pinning-commands'],
}
```

To hide selected actions instead, list their command IDs in `hideCommands` (for example, `'pin-left'` or `'unpin-columns'`). Set `Column.pinnable` to `false` to hide the Pinning Commands root menu for an individual column. These settings control Header Menu visibility; pinning can still be configured through the grid options and APIs.

### Command labels and translation keys

The pinning commands of the Header Menu and Grid Menu use the following translation keys (Translate Service) or `TEXT_` prefixed locale keys (custom `locales` grid option):

| Menu        | Command                       | Translation key                            | Default English text                 |
| ----------- | ----------------------------- | ------------------------------------------ | ------------------------------------ |
| Header Menu | Pinning Commands root menu    | `PIN_COLUMN`                               | Column Pinning                       |
| Header Menu | Pin column left/right         | `PIN_LEFT` and `PIN_RIGHT`                 | Pin Left / Pin Right                 |
| Header Menu | Pin columns left/right (bulk) | `PIN_COLUMNS_LEFT` and `PIN_COLUMNS_RIGHT` | Pin Columns Left / Pin Columns Right |
| Header Menu | Unpin column                  | `UNPIN_COLUMN`                             | Unpin Column                         |
| Header Menu | Unpin all columns             | `UNPIN_COLUMNS`                            | Unpin All Columns                    |
| Grid Menu   | Clear all pinning             | `CLEAR_ALL_PINNING`                        | Clear all Pinning                    |

You can also override these texts directly through the menu `commandLabels` options:

```ts
gridOptions = {
  gridMenu: {
    commandLabels: {
      clearPinningCommand: 'Clear all Pinning',
      clearPinningCommandKey: 'CLEAR_ALL_PINNING', // translation key, when using a Translate Service
    },
  },
  headerMenu: {
    commandLabels: {
      pinColumnCommand: 'Column Pinning',
      pinLeftCommand: 'Pin Left',
      pinRightCommand: 'Pin Right',
      pinningColumnsLeftCommand: 'Pin Columns Left',
      pinningColumnsRightCommand: 'Pin Columns Right',
      unpinColumnCommand: 'Unpin Column',
      unpinningColumnsCommand: 'Unpin All Columns',
    },
  },
};
```
## Columns/Rows Pinning basic
To configure pinning for the entire lifetime of the grid, use the nested `pinning` Grid Option. A numeric left value is an inclusive boundary among visible columns; a numeric right value is a count from the trailing edge of the visible columns. Numeric boundaries are recalculated when columns are hidden. Use explicit arrays to pin specific columns: numeric entries are zero-based indexes, while string entries are column IDs (use a string for a numeric column ID). Explicit IDs keep the same columns pinned when visibility or order changes.

Explicit column and row references do not need to be contiguous. For example, `columns.left: ['account', 'status']` pins only those columns, while `rows.top: [0, 2, 4]` pins only those rows. Pinned rows remain part of the normal dataset height, and the unpinned rows are laid out contiguously so skipped row indexes do not create blank gaps.

ID references follow their row through sorting and filtering. Index references remain positional, so recompute an index used for a changing last row. `setOptions({ pinning: null })` and `setOptions({ pinning: undefined })` both clear pinning.

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

> Pinning validation errors use the shared `errorCallback`, for example `errorCallback: (msg) => alert(msg)`. Each validation message remains independently configurable.

> **Caution**
> Please be aware that pinned columns cannot consume the entire grid viewport. The error is passed to the shared `errorCallback`; customize its text with `invalidColumnPinningWidthMessage` or disable validation with `skipPinningValidation`.

> **Caution**
> The Column Picker and Grid Menu also validate that at least one center column remains available. The error is passed to the shared `errorCallback`; customize its text with `invalidColumnPinningPickerMessage` or disable pinning validation with `skipPinningValidation`.

> When a rendered row contains a colspan crossing docking bands, columns must be pinned sequentially from the left or right edge. A non-sequential change is rejected through the shared `errorCallback` and can be customized with `invalidColumnPinningSequenceMessage`.

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
You can change the number of pinned columns/rows and even the pinning of columns from top to bottom.

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

  return !options ? null : (
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

## Right-to-left grids

Pinning and sticky docking work in `rtl: true` grids. Band names follow reading order rather than screen position, so the same options work in either direction:

| Setting | Left-to-right | Right-to-left |
|---|---|---|
| `columns.left` | left edge | right edge |
| `columns.right` | right edge | left edge |
| `sticky: true` | leading (left) edge | leading (right) edge |
| `sticky: 'left'` / `'right'` | named edge | same logical band, mirrored |

`getCellFromPoint(x, y)` still measures `x` from the grid’s physical left edge. In an RTL grid it counts back from the last column and resolves points over pinned or sticky bands to the column rendered there.
