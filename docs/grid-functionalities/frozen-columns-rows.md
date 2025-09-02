#### Index
- [Columns/Rows Pinning Basic](#columnsrows-pinning-basic)
- [Rows Pinning starting from Bottom](#rows-pinning-starting-from-bottom)
- [Change Pinning Dynamically](#change-pinning-dynamically)
- [Animated Gif Demo](#animated-gif-demo)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example04) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example04.ts)

### Introduction
One of the requested features, columns or rows pinning (aka frozen). You can pin 1 or more Columns and/or 1 or more Rows. Columns can only be pinned starting from the left side, while Rows can be pinned starting from the Top (default) or Bottom. You can also change the pinning dynamically with `setOptions()`.

## Columns/Rows Pinning basic
To set a pinning for the entire duration of the grid, simply use the Grid Options `frozenColumn` (starting from top) and `frozenRow` (starting from left), which are both `number` types.

##### Component
```ts
export class GridBasicComponent {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];

  attached(): void {
      // your columns definition
    this.columnDefinitions = [];

    this.gridOptions = {
      alwaysShowVerticalScroll: false, // disable scroll since we don't want it to show on the left pinned columns
      frozenColumn: 2, // number of pinned columns starting from the left
      frozenRow: 3,    // number of pinned columns starting from the top
    }
  }
}
```

## Rows Pinning starting from bottom
This is basically the same thing as previous code sample, except that you will set the Grid Option property `frozenBottom` to true and that it's.
##### Component
```ts
export class GridBasicComponent {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];

  attached(): void {
      // your columns definition
    this.columnDefinitions = [];

    this.gridOptions = {
      alwaysShowVerticalScroll: false, // disable scroll since we don't want it to show on the left pinned columns
      frozenColumn: 2,    // number of pinned columns starting from the left
      frozenRow: 3,       // number of pinned columns (starting from bottom with next property)
      frozenBottom: true, // this will make rows to be pinned starting from the bottom and the number of rows will be 3
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
             value.bind="frozenRowCount">
      <button class="btn btn-default btn-xs"
              click.trigger="changeFrozenRowCount()">
        Set
      </button>
    </span>
    <span style="margin-left: 10px">
      <label for="">Pinned Columns: </label>
      <input type="number"
             value.bind="frozenColumnCount">
      <button class="btn btn-default btn-xs"
              click.trigger="changeFrozenColumnCount()">
        Set
      </button>
    </span>
    <span style="margin-left: 15px">
      <button class="btn btn-default btn-sm" click.trigger="toggleFrozenBottomRows()">
         <i class="mdi-flip-vertical"></i> Toggle Pinned Rows
      </button>
      <span style="font-weight: bold;">: ${ isFrozenBottom ? 'Bottom' : 'Top' }</span>
    </span>
</div>

<div class="gridId">
</div>
```

##### Component
```ts
export class GridBasicComponent {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  isFrozenBottom = false;

  attached(): void {
    // your columns definition
    this.columnDefinitions = [];

    this.gridOptions = {
      alwaysShowVerticalScroll: false, // disable scroll since we don't want it to show on the left pinned columns
      frozenColumn: 2, // number of pinned columns starting from the left
      frozenRow: 3,    // number of pinned columns starting from the top
    }
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
  changeFrozenColumnCount() {
    if (this.sgb.slickGrid.setOptions) {
      this.sgb.slickGrid.setOptions({
        frozenColumn: this.frozenColumnCount
      });
    }
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
  changeFrozenRowCount() {
    if (this.sgb.slickGrid.setOptions) {
      this.sgb.slickGrid.setOptions({
        frozenRow: this.frozenRowCount
      });
    }
  }

  /** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
  toggleFrozenBottomRows() {
    if (this.sgb.slickGrid.setOptions) {
      this.sgb.slickGrid.setOptions({
        frozenBottom: !this.isFrozenBottom
      });
      this.isFrozenBottom = !this.isFrozenBottom; // toggle the variable
    }
  }
}
```

## Animated Gif Demo
![](https://user-images.githubusercontent.com/643976/50852303-28d57c80-134d-11e9-859c-aeb55af24c24.gif)