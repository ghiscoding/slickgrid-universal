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

You can see a basic example below where we set static `metadata`, however you will must often use it with dynamic `metadata`, and it works in both cases. From the example below, the first object key is a number, `0` in our case, which represents the row index (again this can be dynamic). Then if we continue drilling down, we get a `columns` property which holds another object containing all the column indexes that will have a span (which can be individual `colspan`, `rowspan` or both of them at the same time).

What if we have a side effect that kicks in, for example a Sorting, Filtering, ...? 
Well, that is where you the developer will have to add your own logic to update this `metadata` with the expected code logic of what and how it's supposed to behave. Because as mentioned in the note above, the library is pretty dumb and does not know what is the expected behavior for any side effects and it **will not change any** of the `metadata` spans, you have to implement such logic yourself (for example, if we drag a column to another position then the `rowspan` will stay at the same exact column index which is most probably not what you want, you could subscribe to the `onColumnsChanged` to deal with this one). You can see the full list of Events that you can listen for changes and implement necessary callback to update your `metadata` accordingly (see [List of Available Events](https://ghiscoding.gitbook.io/slickgrid-universal/events/available-events) docs).

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
