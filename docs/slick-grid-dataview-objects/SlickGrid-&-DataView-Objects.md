In some cases you might want a feature that is not yet available in `Slickgrid-Universal` but exists in the original `SlickGrid`, what should you do? Fear not, we got you covered. `Slickgrid-Universal` exposes the SlickGrid `Grid` and `DataView` objects through Event Aggregators, these objects are created when Slickgrid-Universal initialize the grid (with `attached()`). So if you subscribe to the Event Aggregator, you will get the SlickGrid and DataView objects and from there you can call any of the SlickGrid features.

##### Component
```ts
export class MyApp {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  isAutoEdit = true;
  gridObj: SlickGrid;
  dataViewObj: SlickDataView;

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid3`);
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  /** Change dynamically `autoEdit` grid options */
  setAutoEdit(isAutoEdit) {
    this.isAutoEdit = isAutoEdit;
    this.sgb.slickGrid.setOptions({ autoEdit: isAutoEdit }); // change the grid option dynamically
    return true;
  }

  collapseAllGroups() {
    this.sgb.dataView.collapseAllGroups();
  }

  expandAllGroups() {
    this.sgb.dataView.expandAllGroups();
  }
}
```
