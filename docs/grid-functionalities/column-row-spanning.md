### Description
You can use Colspan and/or Rowspan by using the DataView Item Metadata Provider, however please note that row spanning is under a flag because of its small perf hit (`rowspan` requires an initial loop through of all row item metadata to map all row span).

> [!NOTE]
> Please note that `colspan` and `rowspan` have multiple constraints that you must be aware,
> any side effects will **not** keep anything in sync since metadata are based on grid row index based...
> for example: Filtering/Sorting/Paging/ColumnReorder/ColumnHidding
> These side effect will require user's own logic to deal with such things!

### Demo

#### Colspan / Rowspan
[Employee Timesheets](https://ghiscoding.github.io/slickgrid-universal/#/example32) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/examples/webpack-demo-vanilla-bundle/src/examples/example32.ts)

[Large Dataset](https://ghiscoding.github.io/slickgrid-universal/#/example33) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/examples/webpack-demo-vanilla-bundle/src/examples/example33.ts)

### Basic Usage

##### Component

```ts
import { Column, CompositeEditorModalType } from '@slickgrid-universal/common';
import { SlickCompositeEditorComponent } from '@slickgrid-universal/composite-editor-component';

example class MyExample {
  gridOptions: GridOption;
  columnDefinitions: Column[];
  dataset: any[];

  // metadata can be dynamic too, it doesn't have to be preset
  metadata: ItemMetadata | Record<number, ItemMetadata> = {
    0: {
      columns: {
        1: { rowspan: 2 },
        2: { colspan: 2 },
        10: { colspan: 3, rowspan: 10 },
        13: { colspan: 2 },
        17: { colspan: 2, rowspan: 2 },
      },
    }
  };

  defineGrid() {
    this.columnDefinitions = [ /*...*/ ];

    this.gridOptions.value = {
      enableCellNavigation: true,
      enableCellRowSpan: true, // required for rowspan to work
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (_item, row) => {
            return this.metadata[row];
          },
        },
      },
      rowTopOffsetRenderType: 'top', // rowspan doesn't render well with 'transform', default is 'top'
    };
  }
}
```
