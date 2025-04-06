##### index
- [Grid, DataView objects through AureliaGridCreated](#grid--dataview-objects-through-aureliagridcreated)
- [Grid, DataView objects & Services via `instances` bindable](#grid--dataview-objects--services-through-instances-bindable)

In some cases you might want a feature that is not yet available in `Aurelia-Slickgrid` but exists in the original `SlickGrid`, what should you do? Fear not, we got you covered. `Aurelia-Slickgrid` exposes the SlickGrid `Grid` and `DataView` objects through Event Aggregators, these objects are created when Aurelia-Slickgrid initialize the grid (with `attached()`). So if you subscribe to the Event Aggregator, you will get the SlickGrid and DataView objects and from there you can call any of the SlickGrid features.

**The preferred way is now to use the `AureliaGridInstance` via the `instances` bindable as shown [here](#grid--dataview-objects--services-through-instances-bindable)**

### Grid & DataView objects through `AureliaGridCreated`
Since version `2.x`, we can now access the Slick `Grid` & `DataView` objects directly from the `AureliaGridInstance` through the `on-aurelia-grid-created` Event Dispatch, for example:

##### View
```html
<span id="radioAutoEdit">
   <label class="radio-inline control-label" for="radioTrue">
       <input type="radio" name="inlineRadioOptions" id="radioTrue" checked value.bind="isAutoEdit" click.trigger="setAutoEdit(true)"> ON (single-click)
    </label>
    <label class="radio-inline control-label" for="radioFalse">
       <input type="radio" name="inlineRadioOptions" id="radioFalse" value.bind="isAutoEdit" click.trigger="setAutoEdit(false)"> OFF (double-click)
    </label>
</span>

<aurelia-slickgrid
      grid-id="grid1"
      column-definitions.bind="columnDefinitions"
      grid-options.bind="gridOptions"
      dataset.bind="dataset"
      on-aurelia-grid-created.trigger="aureliaGridReady($event.detail)">
</aurelia-slickgrid>
```

##### Component
```ts
import { AureliaGridInstance, Column, GridOption } from 'aurelia-slickgrid';

export class MyApp {
  aureliaGrid: AureliaGridInstance;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  isAutoEdit = true;
  gridObj: SlickGrid;
  dataViewObj: SlickDataView;


  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;

    // the Aurelia Grid Instance exposes both Slick Grid & DataView objects
    this.gridObj = aureliaGrid.slickGrid;
    this.dataViewObj = aureliaGrid.dataView;
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

### Grid & DataView objects & Services through `instances` bindable
You could also get all the Service instances via the new `instances` bindable property
```html
<aurelia-slickgrid grid-id="grid19"
    column-definitions.bind="columnDefinitions"
    grid-options.bind="gridOptions"
    dataset.bind="dataset"
    extensions.bind="extensions"
    instances.bind="aureliaGrid">
</aurelia-slickgrid>
```

##### Component
```ts
import { AureliaGridInstance, Column, GridOption } from 'aurelia-slickgrid';

export class MyApp {
  aureliaGrid: AureliaGridInstance;

  /** Change dynamically `autoEdit` grid options */
  setAutoEdit(isAutoEdit) {
    this.isAutoEdit = isAutoEdit;
    this.aureliaGrid.slickGrid.setOptions({ autoEdit: isAutoEdit }); // change the grid option dynamically
    return true;
  }
}
```

### SlickGrid Events (original SlickGrid)
You have access to all original SlickGrid events which you can subscribe, for more info refer to the [Wiki - Grid & DataView Events](../events/grid-dataview-events.md)

### Usage
There's already all the necessary information on how to use this on the [Wiki - Grid & DataView Events](../events/grid-dataview-events.md) page, so I suggest you to head over to that Wiki page on how to use the `SlickGrid` and `DataView` objects
