#### Index
- [Introduction](#introduction)
- [Height Resolution Order](#height-resolution-order)
- [Using rowHeightProvider](#using-rowheightprovider)
- [Using Item Metadata Height Fallback](#using-item-metadata-height-fallback)
- [Runtime Updates](#runtime-updates)

### Introduction
By default, SlickGrid uses the grid option `rowHeight` for every row. When variable row height is in play (via `rowHeightProvider` or `ItemMetadata.height` detection), each row can resolve to a different height while preserving virtual scrolling and frozen panes.

### Height Resolution Order
For each row, height resolution follows this order:

1. `rowHeightProvider(grid, row, item)` return value (when defined and when it returns a number)
2. `ItemMetadata.height` from `dataView.globalItemMetadataProvider.getRowMetadata(item, row)`
3. Grid option `rowHeight` (default fallback)

### Using rowHeightProvider
```ts
import type { GridOption } from 'slickgrid-vue';

const gridOptions: GridOption = {
  rowHeight: 40,
  rowHeightProvider: (_grid, _row, item: { summary: string }) => {
    const lineCount = Math.max(1, Math.ceil(item.summary.length / 55));
    return Math.max(33, 8 + lineCount * 16);
  },
};
```

### Using Item Metadata Height Fallback
Set `variableRowHeight: true` to activate variable height mode via metadata.

> **Note:** Only needed when using `ItemMetadata.height` without a `rowHeightProvider`.
> `rowHeightProvider` activates variable mode automatically.

```ts
const gridOptions: GridOption = {
  rowHeight: 40,
  variableRowHeight: true, // required when using metadata height without a rowHeightProvider
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

If `rowHeightProvider` is omitted (or returns `undefined` for a row), `ItemMetadata.height` is used as fallback.

### Runtime Updates
After any change that impacts row height, call:

```ts
vueGrid.slickGrid?.invalidateRowHeights?.();
```
