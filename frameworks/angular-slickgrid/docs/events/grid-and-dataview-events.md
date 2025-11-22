See the full list of [Available Events](Available-Events.md) which you can use by simply hook a `subscribe` to them (the `subscribe` are a custom `SlickGrid Event` and are **NOT** an `RxJS Observable` type but they very similar). You can access them in Slickgrid-Universal by following the documentation below

##### View
```html
<angular-slickgrid
     gridId="grid2"
     [columns]="columnDefinitions"
     [options]="gridOptions"
     [dataset]="dataset"
     (onAngularGridCreated)="angularGridReady($event.detail)"
     (onCellChange)="onCellChanged($event.detail.eventData, $event.detail.args)"
     (onClick)="onCellClicked($event.detail.eventData, $event.detail.args)">
</angular-slickgrid>
```

##### Component
Hook yourself to the Changed event of the bindable grid object.

```typescript
export class GridEditorComponent {
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    // the Angular Grid Instance exposes both Slick Grid & DataView objects
    this.gridObj = angularGrid.slickGrid;
    this.dataViewObj = angularGrid.dataView;

    // it also exposes all the Services
    // this.angularGrid.resizerService.resizeGrid(10);
  }

  onCellChanged(e, args) {
    this.updatedObject = args.item;
    this.angularGrid.resizerService.resizeGrid(10);
  }

  onCellClicked(e, args) {
    // do something
  }
}
```

### Example with Custom Event
Angular-Slickgrid can trigger the following custom events that you can hook to. However please note that `onDataviewCreated`
and `onGridCreated` are a lot less used now since `onAngularGridCreated` now exposes both the Slick Grid & DataView objects.
- `onAngularGridCreated`
- `onDataviewCreated`
- `onGridCreated`
- `onBeforeGridCreate`
- `onBeforeGridDestroy`
- `onAfterGridDestroyed`


##### View
Bind `(onDataviewCreated)` and `(onGridCreated)` if you want to call any `SlickGrid` legacy functions.
```html
<angular-slickgrid
  gridId="grid2"
  (onDataviewCreated)="dataviewReady($event)"
  (onGridCreated)="gridReady($event)"
  [columns]="columnDefinitions"
  [options]="gridOptions"
  [dataset]="dataset">
</angular-slickgrid>
```

##### Component
Once the `Grid` and `DataView` are ready, you can subscribe to any [Available Events](../events/Available-Events.md) and don't forget to **unsubscribe** to avoid unwanted behaviors and memory leak when your component is destroyed. See below for the `gridReady(grid)` and `dataviewReady(dataview)` functions.
- The example shown below is subscribing to `onClick` and ask the user to confirm a delete, then will delete it from the `DataView`.
- Technically, the `Grid` and `DataView` are created at the same time by `Angular-Slickgrid`, so it's ok to call the `dataViewObj` within some code of the `gridReady()` function since `DataView` object will already be available at that time.

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { Editors, Formatters, GridExtraUtils } from 'angular-slickgrid';

@Component({
  templateUrl: './grid-editor.component.html'
})
export class GridEditorComponent implements OnInit {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  dataviewObj: any;

  constructor() {}

  ngOnInit(): void {
    this.columnDefinitions = [
      { id: 'delete', field: 'id', formatter: Formatters.deleteIcon, maxWidth: 30 }
      // ...
    ];

    this.gridOptions = {
      editable: true,
      enableCellNavigation: true,
      autoEdit: true
    };
  }

  gridReady(grid) {
    grid.onCellChange.subscribe((e, args) => {
      console.log('onCellChange', args);
      // for example, CRUD with WebAPI calls
    });
    grid.onClick.subscribe((e, args) => {
      const column = GridExtraUtils.getColumnDefinitionAndData(args);

      if (column.columnDef.id === 'delete') {
        if (confirm('Are you sure?')) {
          this.dataviewObj.deleteItem(column.dataContext.id);
          this.dataviewObj.refresh();
        }
      }
    });

  }
  dataviewReady(dataview) {
    this.dataviewObj = dataview;
  }
}
```

### Example with `(onAngularGridCreated)`
Angular-Slickgrid now also expose the Slick Grid and DataView objects through the `(onAngularGridCreated)` event, for example:

##### View
```html
<span id="radioAutoEdit">
    <label class="radio-inline control-label" for="radioTrue">
        <input type="radio" name="inlineRadioOptions" id="radioTrue" checked [value]="isAutoEdit" (change)="setAutoEdit(true)"> ON (single-click)
    </label>
    <label class="radio-inline control-label" for="radioFalse">
        <input type="radio" name="inlineRadioOptions" id="radioFalse" [value]="isAutoEdit" (change)="setAutoEdit(false)"> OFF (double-click)
    </label>
</span>

<angular-slickgrid gridId="grid2"
          [columns]="columnDefinitions"
          [options]="gridOptions"
          [dataset]="dataset"
          (onAngularGridCreated)="angularGridReady($event.detail)">
</angular-slickgrid>
```

##### Component

```typescript
import { AngularGridInstance, Column, GridOption } from 'angular-slickgrid';

export class MyApp {
  angularGrid: AngularGridInstance;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  isAutoEdit = true;
  gridObj: any;
  dataViewObj: any;


  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridObj = angularGrid.slickGrid;
    this.dataViewObj = angularGrid.dataView;
  }

  /** Change dynamically `autoEdit` grid options */
  setAutoEdit(isAutoEdit) {
    this.isAutoEdit = isAutoEdit;
    this.gridObj.setOptions({ autoEdit: isAutoEdit }); // change the grid option dynamically
    return true;
  }

  collapseAllGroups() {
    this.dataviewObj.collapseAllGroups();
  }

  expandAllGroups() {
    this.dataviewObj.expandAllGroups();
  }
}
```
