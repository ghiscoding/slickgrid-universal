SlickGrid has a nice amount of events, see the full list of [Available Events](Available-Events.md), which you can use by simply hook a `subscribe` to them (the `subscribe` are a custom `SlickGrid Event`). There are 2 options to get access to all these events (For the first 2 you will have to get access to the `Grid` and the `DataView` objects which are exposed in `Aurelia-Slickgrid`):

**From the list below, the number 1. is by far the easiest and preferred way**

1. with `delegate` Event Dispatch binding so you can add event handlers in your view. This library bubbles all events for the Grid and DataView by converting the camelcase methods to kebab case (ie. onMouseEnter will be on-mouse-enter. Slickgrid's EventData and Args parameters will be passed via $event.detail.eventData and $event.detail.args
2. with `bindable` values, so you can just call `gridChanged` and/or `dataviewChanged`

### 1. Example with `delegate` Event Dispatch `(asgOnX)`
#### Event Dispatch is the preferred way to access any of the [Available Events](Available-Events.md)
All the Slick Grid events (and DataView) are exposed through Event Dispatch and are available as `(sgOnX)`and that's it.

##### View
```html
<aurelia-slickgrid
    grid-id="gridId"
    columns.bind="columnDefs"
    options.bind="gridOptions"
    dataset.bind="myDataset"
    on-aurelia-grid-created.trigger="aureliaGridReady($event.detail)"
    on-click.trigger="onCellClicked($event.detail.eventData, $event.detail.args)"
    on-cell-change.trigger="onCellChanged($event.detail.eventData, $event.detail.args)"
    on-mouse-enter.trigger="onMouseEntered($event.detail.eventData, $event.detail.args)">
</aurelia-slickgrid>
```

##### Component
Hook yourself to the Changed event of the bindable grid object.

```typescript
export class GridExample {
  aureliaGrid: AureliaGridInstance;
  gridObj: any;
  dataViewObj: any;

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;

    // the Aurelia Grid Instance exposes both Slick Grid & DataView objects
    this.gridObj = aureliaGrid.slickGrid;
    this.dataViewObj = aureliaGrid.dataView;

    // it also exposes all the Services
    // this.aureliaGrid.resizerService.resizeGrid(10);
  }

  attached() {
    // populate the grid
  }

  onCellClicked(e, args) {
    // do something
  }

  onCellChanged(e, args) {
    this.updatedObject = args.item;
    this.aureliaGrid.resizerService.resizeGrid(10);
  }

  onMouseEntered(e, args) {
    // do something
  }
}
```

#### Available Dispatched Events

| Dispatched Events             |
|-------------------------------|
| on-before-export-to-excel |
| on-after-export-to-excel |
| on-before-export-to-text-file |
| on-after-export-to-text-file |
| on-grid-state-changed |
| on-items-added |
| on-items-deleted |
| on-items-updated |
| on-items-upserted |
| on-grid-before-resize |
| on-grid-after-resize |

### 2. Example with Bindable Grid/Dataview
##### View
Bind `dataview.bind` and `grid.bind`
```html
<aurelia-slickgrid
  gridId="grid2"
  dataview.bind="dataviewObj"
  grid.bind="gridObj"
  columns.bind="columnDefinitions"
  options.bind="gridOptions"
  dataset.bind="dataset">
</aurelia-slickgrid>
```

##### ViewModel
Hook yourself to the `Changed` event of the bindable `grid` object.
```ts
export class GridEditorComponent {
  gridObjChanged(grid) {
    this.gridObj = grid;
  }
}
```

#### How to use Grid/Dataview Events
Once the `Grid` and `DataView` are ready, see all [Available Events](../events/available-events.md). See below for the `gridChanged(grid)` and `dataviewChanged(dataview)` functions.
- The `GridExtraUtils` is to bring easy access to common functionality like getting a `column` from it's `row` and `cell` index.
- The example shown below is subscribing to `onClick` and ask the user to confirm a delete, then will delete it from the `DataView`.
- Technically, the `Grid` and `DataView` are created at the same time by `Aurelia-Slickgrid`, so it's ok to call the `dataViewObj` within some code of the `gridObjChanged()` function since `DataView` object will already be available at that time.

**Note** The example below is demonstrated with `bind` with event `Changed` hook on the `grid` and `dataview` objects. However you can also use the `EventAggregator` as shown earlier. It's really up to you to choose the way you want to call these objects.

##### ViewModel
```ts
import { inject, bindable } from 'aurelia-framework';
import { Editors, Formatters, GridExtraUtils } from 'aurelia-slickgrid';

export class GridEditorComponent {
  @bindable() gridObj: any;
  @bindable() dataviewObj: any;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  dataviewObj: any;
  onCellChangeSubscriber: any;
  onCellClickSubscriber: any;

  constructor(private controlService: ControlAndPluginService) {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  detached() {
    // don't forget to unsubscribe to the Slick Grid Events
    this.onCellChangeSubscriber.unsubscribe();
    this.onCellClickSubscriber.unsubscribe();
  }

  defineGrid() {
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

  // with bindable Dataview and Changed event
  dataviewObjChanged(dataview) {
    this.dataviewObj = dataview;
  }

  // with bindable Grid and Changed event
  gridObjChanged(grid) {
    this.gridObj = grid;
    this.subscribeToSomeGridEvents(grid);
  }

  subscribeToSomeGridEvents(grid) {
    this.onCellChangeSubscriber = grid.onCellChange.subscribe((e, args) => {
      console.log('onCellChange', args);
      // for example, CRUD with WebAPI calls
    });

    this.onCellClickSubscriber = grid.onClick.subscribe((e, args) => {
      const column = GridExtraUtils.getColumnDefinitionAndData(args);

      if (column.columnDef.id === 'delete') {
        if (confirm('Are you sure?')) {
          this.dataviewObj.deleteItem(column.dataContext.id);
          this.dataviewObj.refresh();
        }
      }
    });
  }
}
```
