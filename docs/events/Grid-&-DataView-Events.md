See the full list of [Available Events](Available-Events.md) which you can use by simply hook a `subscribe` to them (the `subscribe` are a custom `SlickGrid Event` and are **NOT** an `RxJS Observable` type but they very similar). You can access them in Slickgrid-Universal by following the documentation below

##### View
```html
<div class="grid1">
</div>
```

##### ViewModel
Hook yourself to the Changed event of the bindable grid object.

```typescript
export class GridExample {
  sgb;

  attached() {
    const dataset = this.initializeGrid();
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid1`);

    gridContainerElm.addEventListener('oncellclicked', this.handleOnCellClicked.bind(this));
    gridContainerElm.addEventListener('oncellchanged', this.handleOnCellChanged.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions, dataset);
  }

  handleOnCellClicked(event) {
    const args = event?.detail?.args;
    const eventData = event?.detail?.eventData;

    // cellClick event only returns row/cell, use DataView to get its context
    const dataContext = this.sgb.dataView.getItem(args.row);
  }

  handleOnCellChanged(event) {
    const args = event?.detail?.args;
    const eventData = event?.detail?.eventData;
    this.updatedObject = args.item;
    this.sgb.resizerService.resizeGrid(10);
  }
}
```

##### View - SalesForce (ES6)
For SalesForce it's nearly the same, the only difference is that we add our events in the View instead of in the ViewModel

```html
<div class="grid-container">
    <div class="grid1"
            onvalidationerror={handleOnValidationError}
            oncellchange={handleOnCellChange}
            onclick={handleOnCellClick}
            onbeforeeditcell={handleOnBeforeEditVerifyCellIsEditable}
            onslickergridcreated={handleOnSlickerGridCreated}>
    </div>
</div>
```