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
```ts
import type { GridOption } from 'slickgrid-vue';

const gridOptions: GridOption = {
  enableVariableRowHeight: true,
  rowHeight: 40,
  rowHeightProvider: (_grid, _row, item: { summary: string }) => {
    const lineCount = Math.max(1, Math.ceil(item.summary.length / 55));
    return Math.max(33, 8 + lineCount * 16);
  },
};
```

### Using Item Metadata Height Fallback
Set `enableVariableRowHeight: true` and rely on the default `rowHeightProvider`.

```ts
const gridOptions: GridOption = {
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
vueGrid.slickGrid?.invalidateRowHeights?.();
```
