#### Index
- [Introduction](#introduction)
- [Height Resolution Order](#height-resolution-order)
- [Using rowHeightProvider](#using-rowheightprovider)
- [Using Item Metadata Height Fallback](#using-item-metadata-height-fallback)
- [Runtime Updates](#runtime-updates)

### Introduction
By default, SlickGrid uses the grid option `rowHeight` for every row. Variable row height is opt-in and only active when `enableVariableRowHeight` is set to `true`.

### Height Resolution Order
When `enableVariableRowHeight: true`, each row height is resolved in this order:

1. `rowHeightProvider(grid, row, item)` return value (when defined and when it returns a number)
2. Grid option `rowHeight` (default fallback)

The default `rowHeightProvider` reads `ItemMetadata.height` from `getRowMetadata`, so metadata-only setups work without defining your own provider.

### Using rowHeightProvider
Use `rowHeightProvider` when height is derived directly from row/item data.

> **Important:** Defining a custom `rowHeightProvider` replaces SlickGrid's default provider.
> The default provider reads `ItemMetadata.height`; once overridden, metadata height is no longer read unless your custom provider reads it explicitly.

```ts
import { Column, GridOption } from 'angular-slickgrid';

gridOptions: GridOption = {
  enableVariableRowHeight: true,
  rowHeight: 40,
  rowHeightProvider: (_grid, _row, item: { summary: string }) => {
    const lineCount = Math.max(1, Math.ceil(item.summary.length / 55));
    return Math.max(33, 8 + lineCount * 16);
  },
};
```

### Using Item Metadata Height Fallback
Use metadata height when you already customize row metadata and prefer to keep row height logic there.
Set `enableVariableRowHeight: true` and rely on the default `rowHeightProvider`.

```ts
gridOptions: GridOption = {
  enableVariableRowHeight: true,
  rowHeight: 40,
  dataView: {
    globalItemMetadataProvider: {
      getRowMetadata: (item: { notes: string }) => {
        if (item.notes === 'Short note.') {
          return { height: 33 };
        }

        const lineCount = Math.max(1, Math.ceil(item.notes.length / 55));
        return { height: Math.max(40, 8 + lineCount * 18) };
      },
    },
  },
};
```

If you supply a custom `rowHeightProvider`, it fully replaces the default provider behavior.
When your custom provider returns `undefined`, the grid uses `rowHeight` for that row.

### Runtime Updates
After any change that impacts row height, call:

```ts
this.angularGrid?.slickGrid?.invalidateRowHeights?.();
```

> Use `(onAngularGridCreated)` event in your view template to get a reference to `this.angularGrid?.slickGrid` (see [Grid and DataView events](../events/grid-dataview-events.md) for more info)
