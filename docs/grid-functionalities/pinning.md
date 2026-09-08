#### Index
- [Columns/Rows Pinning Basic](#columnsrows-pinning-basic)
- [Rows Pinning starting from Bottom](#rows-pinning-starting-from-bottom)
- [Change Pinning Dynamically](#change-pinning-dynamically)
- [Animated Gif Demo](#animated-gif-demo)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example04) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example04.ts)

### Introduction
Pinning keeps selected columns or rows attached to a grid edge while the remaining content scrolls. Columns can be pinned on the left or right, and rows can be pinned at the top or bottom. You can also change pinning dynamically with `setOptions()`.

## Columns/Rows Pinning basic
To configure pinning for the entire lifetime of the grid, use the nested `pinning` Grid Option. The left and right column values accept an inclusive column boundary or explicit column IDs, while row pinning uses row indexes or IDs.

##### Component
```ts
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

## Rows Pinning starting from bottom
To pin rows at the bottom, provide the row indexes in `pinning.rows.bottom` and leave the top list empty.
##### Component
```ts
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
      <input type="number"
             value.bind="pinnedRowCount">
      <button class="btn btn-default btn-xs"
              click.trigger="changePinnedRowCount()">
        Set
      </button>
    </span>
    <span style="margin-left: 10px">
      <label for="">Pinned Columns: </label>
      <input type="number"
             value.bind="pinnedColumnCount">
      <button class="btn btn-default btn-xs"
              click.trigger="changePinnedColumnCount()">
        Set
      </button>
    </span>
    <span style="margin-left: 15px">
      <button class="btn btn-default btn-sm" click.trigger="togglePinnedBottomRows()">
         <i class="mdi-flip-vertical"></i> Toggle Pinned Rows
      </button>
      <span style="font-weight: bold;">: ${ isPinnedBottom ? 'Bottom' : 'Top' }</span>
    </span>
</div>

<div class="gridId">
</div>
```

##### Component
```ts
export class GridBasicComponent {
  columns: Column[];
  gridOptions: GridOption;
  dataset: any[];
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

  /** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
  changePinnedColumnCount() {
    if (this.sgb.slickGrid.setOptions) {
      this.sgb.slickGrid.setOptions({
        pinning: { columns: { left: this.pinnedColumnCount } }
      });
    }
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
  changePinnedRowCount() {
    if (this.sgb.slickGrid.setOptions) {
      this.sgb.slickGrid.setOptions({
        pinning: { rows: { top: [0, 1, 2] } }
      });
    }
  }

  /** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
  togglePinnedBottomRows() {
    if (this.sgb.slickGrid.setOptions) {
      this.sgb.slickGrid.setOptions({
        pinning: {
          rows: this.isPinnedBottom ? { top: [0, 1, 2], bottom: [] } : { top: [], bottom: [0, 1, 2] },
        }
      });
      this.isPinnedBottom = !this.isPinnedBottom; // toggle the variable
    }
  }
}
```

## Animated Gif Demo
![](https://user-images.githubusercontent.com/643976/50852303-28d57c80-134d-11e9-859c-aeb55af24c24.gif)
