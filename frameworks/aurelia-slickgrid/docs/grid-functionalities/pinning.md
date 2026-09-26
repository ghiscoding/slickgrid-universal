#### Index
- [Columns/Rows Pinning Basic](#columnsrows-pinning-basic)
- [Rows Pinning starting from Bottom](#rows-pinning-starting-from-bottom)
- [Change Pinning Dynamically](#change-pinning-dynamically)
- [Animated Gif Demo](#animated-gif-demo)
- [Sticky Columns and Rows](sticky.md)

### Demo
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/example20) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/aurelia/src/examples/slickgrid/example20.ts)

### Introduction
Pinning keeps selected columns or rows attached to a grid edge while the remaining content scrolls. Columns can be pinned on the left or right, and rows can be pinned at the top or bottom. You can also change pinning dynamically with `setOptions()`.

Set `Column.pinnable` to `false` when a column must not be pinned or unpinned from the Header Menu. It defaults to `true` and only controls the built-in UI; `Column.pinned` and the programmatic pinning APIs remain available for application-controlled state.

For scroll-activated docking, see [Sticky Columns and Rows](sticky.md). Sticky columns have no built-in Header Menu commands, so a separate `Column.stickable` flag is not needed.

The built-in Column Pinning Header Menu is enabled automatically when `pinning` is defined. Set `headerMenu.showPinningCommands: true` when the menu should be available before any pin state is configured. Set `headerMenu.showPinningCommands: false` for programmatic-only pinning, and use `headerMenu.hideCommands` for individual command visibility.

## Columns/Rows Pinning basic
To configure pinning for the entire lifetime of the grid, use the nested `pinning` Grid Option.

Explicit column and row references do not need to be contiguous. For example, `columns.left: ['account', 'status']` pins only those columns, while `rows.top: [0, 2, 4]` pins only those rows. A row reference is an index (`5`), a string dataset ID (`'order-5'`), or `{ id: 5 }` for a numeric dataset ID; a bare number always means an index. ID references follow their row through sorting and filtering, while index references remain positional. `setOptions({ pinning: null })` and `setOptions({ pinning: undefined })` both clear pinning.

```html
<aurelia-slickgrid
    grid-id="gridId"
    columns.bind="columns"
    options.bind="gridOptions"
    dataset.bind="dataset">
</aurelia-slickgrid>
```

##### Component
```typescript
export class GridBasicComponent {
  columns: Column[];
  gridOptions: GridOption;
  dataset: any[];

  attached(): void {
      // your columns definition
    this.columns = [];

    this.gridOptions = {
      alwaysShowVerticalScroll: false,
      pinning: {
        columns: { left: 2 },
        rows: { top: [0, 1, 2] },
      },
      // v11 and lower: frozenColumn: 2, frozenRow: 3
    }
  }
}
```

> **Caution**
> Please be aware that pinned columns cannot consume the entire grid viewport. You can customize the validation with `invalidColumnPinningWidthCallback` or disable it with `skipPinningValidation`.

> **Caution**
> The Column Picker and Grid Menu also validate that at least one center column remains available. You can customize this with `invalidColumnPinningPickerCallback` or disable pinning validation with `skipPinningValidation`.

> When a rendered row contains a colspan crossing docking bands, columns must be pinned sequentially from the left or right edge. A non-sequential change is rejected through `invalidColumnPinningPickerCallback` and can be customized with `invalidColumnPinningSequenceMessage`.

## Rows Pinning starting from bottom
To pin rows at the bottom, provide the row indexes in `pinning.rows.bottom` and leave the top list empty.
##### Component
```typescript
export class GridBasicComponent {
  columns: Column[];
  gridOptions: GridOption;
  dataset: any[];

  attached(): void {
      // your columns definition
    this.columns = [];

    this.gridOptions = {
      alwaysShowVerticalScroll: false,
      pinning: {
        columns: { left: 2 },
        rows: { bottom: [97, 98, 99] },
      },
      // v11 and lower: frozenColumn: 2, frozenRow: 3, frozenBottom: true
    }
  }
}
```

## Change Pinning Dynamically
You can change the number of pinned columns/rows and even the pinning of columns from top to bottom. For a demo of what that could look like, take a look at the [Animated Gif Demo](#animated-gif-demo) below.

```html
<div class="row col-sm-12">
    <span>
        <label for="">Pinned Rows: </label>
        <input type="number" min="-1" value.bind="pinnedRowCount">
        <button class="btn btn-default btn-xs" click.trigger="changePinnedRowCount()">
            Set
        </button>
    </span>
    <span style="margin-left: 10px">
        <label for="">Pinned Columns: </label>
        <input type="number" min="-1" value.bind="pinnedColumnCount">
        <button class="btn btn-default btn-xs" click.trigger="changePinnedColumnCount()">
            Set
        </button>
    </span>
    <span style="margin-left: 15px">
        <button class="btn btn-default btn-sm" click.trigger="togglePinnedBottomRows()">
            <i class="mdi mdi-flip-vertical"></i> Toggle Pinned Rows
        </button>
        <span style="font-weight: bold;">: {{ isPinnedBottom ? 'Bottom' : 'Top' }}</span>
    </span>
</div>

<aurelia-slickgrid
    grid-id="gridId"
    columns.bind="columns"
    options.bind="gridOptions"
    dataset.bind="dataset"
    on-aurelia-grid-created.trigger="aureliaGridReady($event.detail)">
</aurelia-slickgrid>
```

##### Component
```ts
import { AureliaGridInstance } from 'aurelia-slickgrid';

export class GridBasicComponent {
  columns: Column[];
  gridOptions: GridOption;
  dataset: any[];
  gridObj: any;
  isPinnedBottom = false;

  attached(): void {
    // your columns definition
    this.columns = [];

    this.gridOptions = {
      alwaysShowVerticalScroll: false,
      pinning: {
        columns: { left: 2 },
        rows: { top: [0, 1, 2] },
      },
    }
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.gridObj = aureliaGrid.slickGrid;
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
  changePinnedColumnCount() {
    if (this.gridObj && this.gridObj.setOptions) {
      this.gridObj.setOptions({
        pinning: { columns: { left: this.pinnedColumnCount } }
      });
    }
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
  changePinnedRowCount() {
    if (this.gridObj && this.gridObj.setOptions) {
      this.gridObj.setOptions({
        pinning: { rows: { top: [0, 1, 2] } }
      });
    }
  }

  /** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
  togglePinnedBottomRows() {
    if (this.gridObj && this.gridObj.setOptions) {
      this.gridObj.setOptions({
        pinning: {
          rows: this.isPinnedBottom ? { top: [0, 1, 2], bottom: [] } : { top: [], bottom: [0, 1, 2] },
        }
      });
      this.isPinnedBottom = !this.isPinnedBottom; // toggle the variable
    }
  }
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
## Animated Gif Demo
![](https://user-images.githubusercontent.com/643976/50852303-28d57c80-134d-11e9-859c-aeb55af24c24.gif)
