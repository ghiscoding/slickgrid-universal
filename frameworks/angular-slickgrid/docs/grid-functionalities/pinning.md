#### Index
- [Columns/Rows Pinning Basic](#columnsrows-pinning-basic)
- [Rows Pinning starting from Bottom](#rows-pinning-starting-from-bottom)
- [Change Pinning Dynamically](#change-pinning-dynamically)
- [Animated Gif Demo](#animated-gif-demo)
- [Sticky Columns and Rows](sticky.md)

### Demo
[Demo Page](https://ghiscoding.github.io/angular-slickgrid-bs4-demo/#/example20) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/demos/examples/example20.component.ts)

### Introduction
Pinning keeps selected columns or rows attached to a grid edge while the remaining content scrolls. Columns can be pinned on the left or right, and rows can be pinned at the top or bottom. You can also change pinning dynamically with `setOptions()`.

Set `Column.pinnable` to `false` when a column must not be pinned or unpinned from the Header Menu. It defaults to `true` and only controls the built-in UI; `Column.pinned` and the programmatic pinning APIs remain available for application-controlled state.

For scroll-activated docking, see [Sticky Columns and Rows](sticky.md). Sticky columns have no built-in Header Menu commands, so a separate `Column.stickable` flag is not needed.

## Columns/Rows Pinning basic
To configure pinning for the entire lifetime of the grid, use the nested `pinning` Grid Option.

```html
<angular-slickgrid gridId="grid2"
     [columns]="columns"
     [options]="gridOptions"
     [dataset]="dataset">
</angular-slickgrid>
```

##### Component
```typescript
import { Component, OnInit} from '@angular/core';

export class GridBasicComponent implements OnInit {
  columns: Column[];
  gridOptions: GridOption;
  dataset: any[];

  ngOnInit(): void {
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
import { Component, OnInit} from '@angular/core';

export class GridBasicComponent implements OnInit {
  columns: Column[];
  gridOptions: GridOption;
  dataset: any[];

  ngOnInit(): void {
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
        <input type="number" min="-1" [(ngModel)]="pinnedRowCount">
        <button class="btn btn-default btn-xs" (click)="changePinnedRowCount()">
            Set
        </button>
    </span>
    <span style="margin-left: 10px">
        <label for="">Pinned Columns: </label>
        <input type="number" min="-1" [(ngModel)]="pinnedColumnCount">
        <button class="btn btn-default btn-xs" (click)="changePinnedColumnCount()">
            Set
        </button>
    </span>
    <span style="margin-left: 15px">
        <button class="btn btn-default btn-sm" (click)="togglePinnedBottomRows()">
            <i class="mdi mdi-flip-vertical"></i> Toggle Pinned Rows
        </button>
        <span style="font-weight: bold;">: {{ isPinnedBottom ? 'Bottom' : 'Top' }}</span>
    </span>
</div>

<angular-slickgrid gridId="grid2"
     [columns]="columns"
     [options]="gridOptions"
     [dataset]="dataset"
     (onAngularGridCreated)="angularGridReady($event.detail)">
</angular-slickgrid>
```

##### Component
```ts
import { Component, OnInit} from '@angular/core';
import { AngularGridInstance } from 'angular-slickgrid';

export class GridBasicComponent implements OnInit {
  columns: Column[];
  dataset: any[];
  gridOptions: GridOption;
  gridObj: any;
  isPinnedBottom = false;

  ngOnInit(): void {
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

  angularGridReady(angularGrid: AngularGridInstance) {
    this.gridObj = angularGrid.slickGrid;
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

## Animated Gif Demo
![](https://user-images.githubusercontent.com/643976/50852303-28d57c80-134d-11e9-859c-aeb55af24c24.gif)
