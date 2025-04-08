SlickGrid is very flexible and it allows you to change or add CSS Class(es) dynamically (or on page load) by changing it's `Item Metadata` (see [SlickGrid Wiki - Item Metadata](providing-grid-data.md)). There is also a Stack Overflow [answer](https://stackoverflow.com/a/19985148/1212166), which this code below is based from.

### Demo
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid/#/slickgrid/example11) / [Demo Component](https://github.com/ghiscoding/aurelia-slickgrid/blob/master/packages/demo/src/examples/slickgrid/example11.ts)

### Dynamically Change CSS Classes
##### View
```html
<button class="btn btn-sm btn-default" click.trigger="changeDurationBackgroundColor()">Highlight Rows with Duration over 50</button>

<aurelia-slickgrid
    grid-id="gridId"
    columns.bind="columnDefs"
    options.bind="gridOptions"
    dataset.bind="myDataset"
    on-aurelia-grid-created.trigger="aureliaGridReady($event.detail)">
</aurelia-slickgrid>
```

##### Component
```typescript
export class Example {
  // get the SlickGrid Grid & DataView object references
  aureliaGridReady(aureliaGrid : AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
    this.dataView = aureliaGrid.dataView;
    this.grid = aureliaGrid.slickGrid;
  }

  /**
   * Change the Duration Rows Background Color
   * You need to get previous SlickGrid DataView Item Metadata and override it
   */
  changeDurationBackgroundColor() {
    this.dataView.getItemMetadata = this.updateItemMetadataForDurationOver50(this.dataView.getItemMetadata);

    // also re-render the grid for the styling to be applied right away
    this.grid.invalidate();
    this.grid.render();
  }

  /**
   * Override the SlickGrid Item Metadata, we will add a CSS class on all rows with a Duration over 50
   * For more info, you can see this SO https://stackoverflow.com/a/19985148/1212166
   */
  updateItemMetadataForDurationOver50(previousItemMetadata: any) {
    const newCssClass = 'duration-bg';

    return (rowNumber: number) => {
      const item = this.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      // our condition to check Duration over 50
      if (meta && item && item.duration) {
        const duration = +item.duration; // convert to number
        if (duration > 50) {
          meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
        }
      }

      return meta;
    };
  }
}
```

### On Page Load
Or if you want to apply the styling right after the page load

##### Component
```typescript
export class Example {
  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
    this.dataView = aureliaGrid.dataView;
    this.grid = aureliaGrid.slickGrid;

    // if you want to change background color of Duration over 50 right after page load,
    // you would put the code here, also make sure to re-render the grid for the styling to be applied right away
    this.dataView.getItemMetadata = this.updateItemMetadataForDurationOver50(this.dataView.getItemMetadata);
    this.grid.invalidate();
    this.grid.render();
  }

  /**
   * Change the SlickGrid Item Metadata, we will add a CSS class on all rows with a Duration over 50
   * For more info, you can see this SO https://stackoverflow.com/a/19985148/1212166
   */
  updateItemMetadataForDurationOver50(previousItemMetadata: any) {
    const newCssClass = 'duration-bg';

    return (rowNumber: number) => {
      const item = this.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (meta && item && item.duration) {
        const duration = +item.duration; // convert to number
        if (duration > 50) {
          meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
        }
      }

      return meta;
    };
  }
}
```
