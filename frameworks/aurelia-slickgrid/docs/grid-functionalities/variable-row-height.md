#### Index
- [Introduction](#introduction)
- [Height Resolution Order](#height-resolution-order)
- [Using rowHeightProvider](#using-rowheightprovider)
- [Using Item Metadata Height Fallback](#using-item-metadata-height-fallback)
- [Runtime Updates](#runtime-updates)
- [Export Integration](#export-integration)

### Introduction
By default, SlickGrid uses the grid option `rowHeight` for every row. Variable row height is opt-in and only active when `enableVariableRowHeight` grid option is set to `true`.

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
import type { GridOption } from 'aurelia-slickgrid';

gridOptions: GridOption = {
  enableVariableRowHeight: true,
  rowHeight: 40,
  // small demo to adjust row height by using summary length
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
      // quick demo to change row height by calculating notes length
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
this.aureliaGrid?.slickGrid?.invalidateRowHeights?.();
```

> Use `on-aurelia-grid-created.trigger` event in your view template to get a reference to `this.aureliaGrid?.slickGrid` (see [Grid and DataView events](../events/grid-dataview-events.md) for more info)

### Export Integration
When `enableVariableRowHeight: true`, both Excel and PDF exports automatically reflect the per-row heights.

- **Excel**: row heights are written via `setRowInstructions`, converting pixels to points (px × 0.75).
- **PDF**: when using `jspdf-autotable`, `minCellHeight` is set per cell; the manual fallback uses the per-row height directly.

Set `includeVariableRowHeight: false` in `excelExportOptions` or `pdfExportOptions` to skip row height export and use uniform row heights instead:

```ts
gridOptions: GridOption = {
  enableVariableRowHeight: true,
  excelExportOptions: {
    includeVariableRowHeight: false, // skip variable heights in Excel export
  },
  pdfExportOptions: {
    includeVariableRowHeight: false, // skip variable heights in PDF export
  },
};
```