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
Use `rowHeightProvider` when height is derived directly from row/item data.

```ts
import type { Column, GridOption } from '@slickgrid-universal/common';

const gridOptions: GridOption = {
  rowHeight: 40,
  rowHeightProvider: (_grid, _row, item: { summary: string }) => {
    const lineCount = Math.max(1, Math.ceil(item.summary.length / 55));
    return Math.max(33, 8 + lineCount * 16);
  },
};
```

### Using Item Metadata Height Fallback
Use metadata fallback when you already customize row metadata and prefer to keep row height logic there.
Variable height mode is activated automatically as soon as `getRowMetadata` returns an object with a numeric `height` property on any row.

> **Note:** Simply having a `getRowMetadata` function (e.g. for colspan only) does **not** activate variable height mode.
> The grid probes the first available data item and only enables variable height when a numeric `height` is found in the returned metadata.

```ts
import type { GridOption, ItemMetadata } from '@slickgrid-universal/common';

const gridOptions: GridOption = {
  rowHeight: 40,
  dataView: {
    globalItemMetadataProvider: {
      getRowMetadata: (item: { notes: string }): ItemMetadata => {
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
If row height inputs change at runtime (content, mode toggles, metadata rules), call `invalidateRowHeights()` to rebuild row positions and repaint.

```ts
// Vanilla bundle example
this.sgb?.slickGrid?.invalidateRowHeights?.();
```

Use `invalidateRowHeights()` after any change that can alter computed row height.
